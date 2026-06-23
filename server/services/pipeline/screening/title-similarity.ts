/**
 * Layer 2: Title Similarity — PostgreSQL pg_trgm similarity check.
 * Catches paraphrased titles that URL dedup would miss.
 * Uses a Supabase RPC function (created in migration 044).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScreeningResult } from './screening-types';

const DEFAULT_THRESHOLD = 0.4;

/**
 * Check if a title is too similar to existing blog posts or ingested articles.
 * Uses the check_title_similarity() RPC function which leverages pg_trgm.
 */
export async function checkTitleSimilarity(
  supabase: SupabaseClient,
  clientId: string,
  title: string,
  threshold?: number,
): Promise<ScreeningResult> {
  const effectiveThreshold = threshold ?? DEFAULT_THRESHOLD;

  try {
    const { data, error } = await supabase.rpc('check_title_similarity', {
      p_title: title,
      p_client_id: clientId,
      p_threshold: effectiveThreshold,
    });

    if (error) {
      console.warn('[title-similarity] RPC error:', error.message);
      // Fail open — if the function doesn't exist yet, let articles through
      return { passed: true, metadata: { error: error.message } };
    }

    if (data && data.length > 0) {
      const topMatch = data[0];
      return {
        passed: false,
        reason: `Title too similar to "${topMatch.title}" (${(topMatch.sim * 100).toFixed(0)}% match)`,
        metadata: {
          similarityScore: topMatch.sim,
          matchedId: topMatch.id,
          matchedTitle: topMatch.title,
        },
      };
    }

    return { passed: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[title-similarity] Error:', msg);
    return { passed: true, metadata: { error: msg } };
  }
}
