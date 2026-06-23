/**
 * Google News Fetcher — Constructs a Google News RSS URL for a query
 * and delegates parsing to the RSS fetcher.
 */

import { fetchRss } from './rss-fetcher';
import type { FetchedItem, FetcherResult } from './fetcher-types';

export interface GoogleNewsSourceConfig {
  query: string;
  language?: string;   // e.g. 'en' (default)
  region?: string;     // e.g. 'ZA' (default)
  maxItems?: number;
  excludeDomains?: string[];
}

/**
 * Build a Google News RSS URL from search parameters.
 * Google News exposes RSS at: https://news.google.com/rss/search?q=...&hl=...&gl=...&ceid=...
 */
function buildGoogleNewsUrl(config: GoogleNewsSourceConfig): string {
  const lang = config.language || 'en';
  const region = config.region || 'ZA';
  const query = encodeURIComponent(config.query);
  return `https://news.google.com/rss/search?q=${query}&hl=${lang}&gl=${region}&ceid=${region}:${lang}`;
}

/**
 * Resolve a Google News redirect URL to the actual article URL.
 * Google News RSS links are redirects (news.google.com/rss/articles/...).
 */
async function resolveGoogleNewsUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.url || url;
  } catch {
    return url;
  }
}

function isDomainExcluded(url: string, excludeDomains: string[]): boolean {
  if (!excludeDomains || excludeDomains.length === 0) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return excludeDomains.some(domain => hostname.includes(domain.toLowerCase()));
  } catch {
    return false;
  }
}

export async function fetchGoogleNews(config: GoogleNewsSourceConfig): Promise<FetcherResult> {
  if (!config.query) {
    return { items: [], errors: ['Search query is required for Google News'] };
  }

  const rssUrl = buildGoogleNewsUrl(config);
  const rssResult = await fetchRss({
    url: rssUrl,
    maxItems: (config.maxItems || 20) + 10, // Fetch extra to account for domain filtering
  });

  const errors = [...rssResult.errors];
  const filteredItems: FetchedItem[] = [];
  const maxItems = config.maxItems || 20;

  for (const item of rssResult.items) {
    if (filteredItems.length >= maxItems) break;

    // Resolve Google News redirect URLs to actual article URLs
    let resolvedUrl = item.externalUrl;
    if (resolvedUrl.includes('news.google.com')) {
      resolvedUrl = await resolveGoogleNewsUrl(resolvedUrl);
    }

    // Filter out excluded domains
    if (isDomainExcluded(resolvedUrl, config.excludeDomains || [])) {
      continue;
    }

    filteredItems.push({
      ...item,
      externalUrl: resolvedUrl,
    });
  }

  return { items: filteredItems, errors };
}
