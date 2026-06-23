/**
 * Pipeline Executor — Main orchestrator for the content ingestion pipeline.
 *
 * Flow: DISCOVER → SCREEN (4 layers) → STORE → LOG
 *
 * Linear one-pass design: if nothing passes screening, the run exits cleanly.
 * No retry loops. Each run is logged in pipeline_runs for observability.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Source fetchers
import { fetchRss, type RssSourceConfig } from './source-fetchers/rss-fetcher';
import { fetchGoogleNews, type GoogleNewsSourceConfig } from './source-fetchers/google-news-fetcher';
import { fetchManualUrls, type ManualUrlSourceConfig } from './source-fetchers/url-extractor';
import { fetchCompetitorBlog, type CompetitorBlogSourceConfig } from './source-fetchers/competitor-blog-fetcher';
import type { FetchedItem } from './source-fetchers/fetcher-types';

// Screening layers
import { checkUrlDedup, hashUrl } from './screening/url-dedup';
import { checkTitleSimilarity } from './screening/title-similarity';
import { enrichWithTopicFingerprint } from './screening/topic-fingerprinter';
import { checkTopicCooldown } from './screening/cooldown-checker';

// ============================================================================
// TYPES
// ============================================================================

interface PipelineConfig {
  research: {
    frequency: string;
    maxItemsPerRun: number;
    topicCooldownDays: number;
    topicCooldownPosts: number;
  };
  production: {
    mode: string;
    articlesPerRun: number;
    autoPublishStatus: string;
    minSourcesRequired: number;
    skipIfInsufficient: boolean;
  };
  quality: {
    minRelevanceScore: number;
    requireHumanReview: boolean;
    notifyOnDraft: boolean;
  };
}

interface InputSource {
  id: string;
  client_id: string;
  source_type: string;
  display_name: string;
  config: Record<string, any>;
  fetch_interval_minutes: number | null;
  is_active: boolean;
  last_fetched_at: string | null;
  error_count: number;
}

interface EnrichedItem extends FetchedItem {
  sourceId: string;
  urlHash: string;
  topicFingerprint: string | null;
  topicKeywords: string[];
  rejectionReason: string | null;
  similarityScore: number | null;
  matchedPostId: string | null;
}

export interface PipelineRunSummary {
  runId: string;
  clientId: string;
  status: string;
  itemsDiscovered: number;
  itemsScreenedOut: number;
  itemsApproved: number;
  durationMs: number;
  errors: string[];
  sourcesProcessed: string[];
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: PipelineConfig = {
  research: {
    frequency: 'daily',
    maxItemsPerRun: 20,
    topicCooldownDays: 30,
    topicCooldownPosts: 5,
  },
  production: {
    mode: 'manual',
    articlesPerRun: 1,
    autoPublishStatus: 'draft',
    minSourcesRequired: 3,
    skipIfInsufficient: true,
  },
  quality: {
    minRelevanceScore: 0.6,
    requireHumanReview: true,
    notifyOnDraft: true,
  },
};

// ============================================================================
// EXECUTOR
// ============================================================================

export class PipelineExecutor {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    );
  }

  /**
   * Execute a research run for a single client.
   * This is the main entry point called by the cron endpoint.
   */
  async executeResearchRun(clientId: string): Promise<PipelineRunSummary> {
    const startedAt = Date.now();
    const allErrors: string[] = [];
    const sourcesProcessed: string[] = [];
    let runId = '';

    try {
      // 1. Create pipeline_runs record
      const { data: run, error: runError } = await this.supabase
        .from('pipeline_runs')
        .insert({
          client_id: clientId,
          run_type: 'research',
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (runError) throw new Error(`Failed to create pipeline run: ${runError.message}`);
      runId = run.id;

      // 2. Load pipeline config
      const config = await this.loadPipelineConfig(clientId);

      // 3. Load active, due sources
      const sources = await this.loadDueSources(clientId);
      if (sources.length === 0) {
        await this.completeRun(runId, startedAt, 'no_fresh_content', 0, 0, 0, {
          reason: 'No sources due for fetching',
        });
        return this.buildSummary(runId, clientId, 'no_fresh_content', 0, 0, 0, startedAt, allErrors, sourcesProcessed);
      }

      // 4. DISCOVER — Fetch from all due sources
      const allItems: Array<FetchedItem & { sourceId: string }> = [];

      for (const source of sources) {
        try {
          const result = await this.fetchFromSource(source);
          sourcesProcessed.push(source.display_name);

          for (const item of result.items) {
            allItems.push({ ...item, sourceId: source.id });
          }

          if (result.errors.length > 0) {
            allErrors.push(...result.errors);
          }

          // Update source: last_fetched_at, reset error_count
          await this.supabase
            .from('client_input_sources')
            .update({
              last_fetched_at: new Date().toISOString(),
              error_count: 0,
              last_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', source.id);

        } catch (sourceError) {
          const msg = sourceError instanceof Error ? sourceError.message : 'Unknown error';
          allErrors.push(`Source "${source.display_name}": ${msg}`);
          console.error(`[pipeline] Source ${source.display_name} failed:`, msg);

          // Increment error count on the source
          await this.supabase
            .from('client_input_sources')
            .update({
              error_count: (source.error_count || 0) + 1,
              last_error: msg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', source.id);
        }
      }

      // Cap total items
      const cappedItems = allItems.slice(0, config.research.maxItemsPerRun);
      const itemsDiscovered = cappedItems.length;

      if (itemsDiscovered === 0) {
        await this.completeRun(runId, startedAt, 'no_fresh_content', 0, 0, 0, {
          sourcesProcessed,
          reason: 'Sources fetched but returned no items',
        });
        return this.buildSummary(runId, clientId, 'no_fresh_content', 0, 0, 0, startedAt, allErrors, sourcesProcessed);
      }

      // 5. SCREEN — 4-layer screening
      let itemsScreenedOut = 0;
      let itemsApproved = 0;

      for (const item of cappedItems) {
        const enriched = await this.screenItem(clientId, item, config);

        if (enriched.rejectionReason) {
          // Store rejected article for audit trail
          await this.storeIngestedArticle(clientId, enriched, 'rejected');
          itemsScreenedOut++;
        } else {
          // Store approved article
          await this.storeIngestedArticle(clientId, enriched, 'screened');
          itemsApproved++;
        }
      }

      // 6. Complete the run
      const status = itemsApproved > 0 ? 'completed' : 'no_fresh_content';
      await this.completeRun(runId, startedAt, status, itemsDiscovered, itemsScreenedOut, itemsApproved, {
        sourcesProcessed,
        errors: allErrors.length > 0 ? allErrors : undefined,
      });

      return this.buildSummary(runId, clientId, status, itemsDiscovered, itemsScreenedOut, itemsApproved, startedAt, allErrors, sourcesProcessed);

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown pipeline error';
      console.error(`[pipeline] Fatal error for client ${clientId}:`, msg);

      if (runId) {
        await this.completeRun(runId, startedAt, 'error', 0, 0, 0, { error: msg });
      }

      return {
        runId,
        clientId,
        status: 'error',
        itemsDiscovered: 0,
        itemsScreenedOut: 0,
        itemsApproved: 0,
        durationMs: Date.now() - startedAt,
        errors: [msg, ...allErrors],
        sourcesProcessed,
      };
    }
  }

  // ============================================================================
  // PRIVATE — CONFIG & SOURCE LOADING
  // ============================================================================

  private async loadPipelineConfig(clientId: string): Promise<PipelineConfig> {
    const { data, error } = await this.supabase
      .from('content_clients')
      .select('pipeline_config')
      .eq('id', clientId)
      .single();

    if (error || !data?.pipeline_config) {
      console.warn(`[pipeline] No pipeline config for client ${clientId}, using defaults`);
      return DEFAULT_CONFIG;
    }

    return { ...DEFAULT_CONFIG, ...data.pipeline_config };
  }

  private async loadDueSources(clientId: string): Promise<InputSource[]> {
    const { data: sources, error } = await this.supabase
      .from('client_input_sources')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error || !sources) {
      console.warn(`[pipeline] Failed to load sources for ${clientId}:`, error?.message);
      return [];
    }

    // Filter to only sources that are due for fetching
    const now = Date.now();
    return sources.filter(source => {
      if (!source.last_fetched_at) return true; // Never fetched
      const lastFetched = new Date(source.last_fetched_at).getTime();
      const intervalMs = (source.fetch_interval_minutes || 1440) * 60 * 1000;
      return (now - lastFetched) >= intervalMs;
    });
  }

  // ============================================================================
  // PRIVATE — FETCHING
  // ============================================================================

  private async fetchFromSource(source: InputSource) {
    const config = source.config || {};

    switch (source.source_type) {
      case 'rss':
        return fetchRss(config as RssSourceConfig);

      case 'google_news':
        return fetchGoogleNews(config as GoogleNewsSourceConfig);

      case 'manual_url':
        return fetchManualUrls(config as ManualUrlSourceConfig);

      case 'competitor_blog':
        return fetchCompetitorBlog(config as CompetitorBlogSourceConfig);

      default:
        return { items: [], errors: [`Unknown source type: ${source.source_type}`] };
    }
  }

  // ============================================================================
  // PRIVATE — SCREENING (4 layers, sequential)
  // ============================================================================

  private async screenItem(
    clientId: string,
    item: FetchedItem & { sourceId: string },
    config: PipelineConfig,
  ): Promise<EnrichedItem> {
    const enriched: EnrichedItem = {
      ...item,
      urlHash: hashUrl(item.externalUrl),
      topicFingerprint: null,
      topicKeywords: [],
      rejectionReason: null,
      similarityScore: null,
      matchedPostId: null,
    };

    // Layer 1: URL Dedup (cheapest — DB index lookup only)
    const urlResult = await checkUrlDedup(this.supabase, clientId, item.externalUrl);
    enriched.urlHash = urlResult.metadata?.urlHash || enriched.urlHash;
    if (!urlResult.passed) {
      enriched.rejectionReason = urlResult.reason || 'Duplicate URL';
      return enriched;
    }

    // Layer 2: Title Similarity (DB query via pg_trgm)
    const titleResult = await checkTitleSimilarity(this.supabase, clientId, item.title);
    if (!titleResult.passed) {
      enriched.rejectionReason = titleResult.reason || 'Title too similar';
      enriched.similarityScore = titleResult.metadata?.similarityScore || null;
      enriched.matchedPostId = titleResult.metadata?.matchedId || null;
      return enriched;
    }

    // Layer 3: Topic Fingerprinting (Gemini API call — only for items passing layers 1-2)
    const fingerResult = await enrichWithTopicFingerprint(item.title, item.summary, item.rawContent);
    enriched.topicFingerprint = fingerResult.metadata?.topicFingerprint || null;
    enriched.topicKeywords = fingerResult.metadata?.topicKeywords || [];

    // Layer 4: Cooldown Check (DB query using fingerprint from layer 3)
    const cooldownResult = await checkTopicCooldown(
      this.supabase,
      clientId,
      enriched.topicFingerprint,
      {
        topicCooldownDays: config.research.topicCooldownDays,
        topicCooldownPosts: config.research.topicCooldownPosts,
      },
    );
    if (!cooldownResult.passed) {
      enriched.rejectionReason = cooldownResult.reason || 'Topic on cooldown';
      return enriched;
    }

    return enriched;
  }

  // ============================================================================
  // PRIVATE — STORAGE
  // ============================================================================

  private async storeIngestedArticle(
    clientId: string,
    item: EnrichedItem,
    status: 'screened' | 'rejected',
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ingested_articles')
        .upsert(
          {
            client_id: clientId,
            source_id: item.sourceId,
            external_url: item.externalUrl,
            url_hash: item.urlHash,
            title: item.title,
            summary: item.summary || null,
            topic_fingerprint: item.topicFingerprint,
            topic_keywords: item.topicKeywords,
            raw_content: item.rawContent || null,
            source_published_at: item.sourcePublishedAt || null,
            status,
            rejection_reason: item.rejectionReason,
            similarity_score: item.similarityScore,
            matched_post_id: item.matchedPostId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          },
          { onConflict: 'client_id,url_hash' },
        );

      if (error) {
        console.warn(`[pipeline] Failed to store ingested article "${item.title}":`, error.message);
      }
    } catch (error) {
      console.warn('[pipeline] Storage error:', error);
    }
  }

  // ============================================================================
  // PRIVATE — RUN LIFECYCLE
  // ============================================================================

  private async completeRun(
    runId: string,
    startedAt: number,
    status: string,
    discovered: number,
    screenedOut: number,
    approved: number,
    metadata: Record<string, any>,
  ): Promise<void> {
    const durationMs = Date.now() - startedAt;
    await this.supabase
      .from('pipeline_runs')
      .update({
        completed_at: new Date().toISOString(),
        status,
        items_discovered: discovered,
        items_screened_out: screenedOut,
        items_approved: approved,
        duration_ms: durationMs,
        metadata,
      })
      .eq('id', runId);
  }

  private buildSummary(
    runId: string,
    clientId: string,
    status: string,
    discovered: number,
    screenedOut: number,
    approved: number,
    startedAt: number,
    errors: string[],
    sourcesProcessed: string[],
  ): PipelineRunSummary {
    return {
      runId,
      clientId,
      status,
      itemsDiscovered: discovered,
      itemsScreenedOut: screenedOut,
      itemsApproved: approved,
      durationMs: Date.now() - startedAt,
      errors,
      sourcesProcessed,
    };
  }
}

// Singleton instance
export const pipelineExecutor = new PipelineExecutor();
