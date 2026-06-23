/**
 * RSS Fetcher — Parses standard RSS/Atom feeds.
 * Supports keyword filtering (include/exclude) on title + description.
 */

import Parser from 'rss-parser';
import type { FetchedItem, FetcherResult } from './fetcher-types';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'SlyFox-ContentStudio/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml',
  },
});

export interface RssSourceConfig {
  url: string;
  maxItems?: number;
  filterKeywords?: string[];
  excludeKeywords?: string[];
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return true;
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function matchesExclude(text: string, excludeKeywords: string[]): boolean {
  if (!excludeKeywords || excludeKeywords.length === 0) return false;
  const lower = text.toLowerCase();
  return excludeKeywords.some(kw => lower.includes(kw.toLowerCase()));
}

export async function fetchRss(config: RssSourceConfig): Promise<FetcherResult> {
  const errors: string[] = [];
  const items: FetchedItem[] = [];

  if (!config.url) {
    return { items: [], errors: ['RSS feed URL is required'] };
  }

  try {
    const feed = await parser.parseURL(config.url);
    const maxItems = config.maxItems || 20;

    for (const entry of feed.items) {
      if (items.length >= maxItems) break;

      const title = entry.title || '';
      const description = entry.contentSnippet || entry.content || '';
      const searchText = `${title} ${description}`;

      // Apply include filter
      if (config.filterKeywords && config.filterKeywords.length > 0) {
        if (!matchesKeywords(searchText, config.filterKeywords)) continue;
      }

      // Apply exclude filter
      if (config.excludeKeywords && config.excludeKeywords.length > 0) {
        if (matchesExclude(searchText, config.excludeKeywords)) continue;
      }

      const link = entry.link || entry.guid || '';
      if (!link || !title) continue;

      items.push({
        externalUrl: link,
        title: title.trim(),
        summary: description.substring(0, 500).trim() || undefined,
        rawContent: (entry.content || '').substring(0, 5000) || undefined,
        sourcePublishedAt: entry.isoDate || entry.pubDate || undefined,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown RSS fetch error';
    errors.push(`Failed to parse RSS feed ${config.url}: ${msg}`);
    console.error(`[rss-fetcher] Error fetching ${config.url}:`, msg);
  }

  return { items, errors };
}
