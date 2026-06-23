/**
 * URL Extractor — Extracts title and content from arbitrary web pages.
 * Uses cheerio for HTML parsing. Falls back gracefully on difficult pages.
 */

import * as cheerio from 'cheerio';
import type { FetchedItem, FetcherResult } from './fetcher-types';

export interface ManualUrlSourceConfig {
  urls: string[];
}

const USER_AGENT = 'Mozilla/5.0 (compatible; SlyFox-ContentStudio/1.0; +https://slyfox.co.za)';

// Elements to strip before extracting body text
const STRIP_SELECTORS = [
  'nav', 'footer', 'aside', 'header',
  'script', 'style', 'noscript', 'iframe',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '.sidebar', '.menu', '.nav', '.footer', '.header', '.cookie-banner',
  '.advertisement', '.ad', '.social-share',
];

/**
 * Extract readable content from a single URL.
 */
export async function extractFromUrl(url: string): Promise<FetchedItem | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[url-extractor] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('meta[property="og:title"]').attr('content')
      || $('meta[name="twitter:title"]').attr('content')
      || $('title').text()
      || '';

    // Extract description/summary
    const summary = $('meta[property="og:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || $('meta[name="twitter:description"]').attr('content')
      || '';

    // Extract published date
    const publishedAt = $('meta[property="article:published_time"]').attr('content')
      || $('time[datetime]').first().attr('datetime')
      || $('meta[name="date"]').attr('content')
      || '';

    // Strip noise elements
    for (const selector of STRIP_SELECTORS) {
      $(selector).remove();
    }

    // Extract body text from the most relevant container
    let bodyText = '';
    const contentSelectors = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', '.article-body'];
    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        bodyText = el.text();
        break;
      }
    }
    if (!bodyText) {
      bodyText = $('body').text();
    }

    // Clean up whitespace
    bodyText = bodyText
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 5000);

    if (!title.trim()) {
      console.warn(`[url-extractor] No title found for ${url}`);
      return null;
    }

    return {
      externalUrl: url,
      title: title.trim(),
      summary: summary.trim().substring(0, 500) || undefined,
      rawContent: bodyText || undefined,
      sourcePublishedAt: publishedAt || undefined,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[url-extractor] Failed to extract from ${url}: ${msg}`);
    return null;
  }
}

/**
 * Extract content from a list of URLs (manual URL source type).
 */
export async function fetchManualUrls(config: ManualUrlSourceConfig): Promise<FetcherResult> {
  const errors: string[] = [];
  const items: FetchedItem[] = [];

  if (!config.urls || config.urls.length === 0) {
    return { items: [], errors: ['No URLs provided'] };
  }

  // Process URLs sequentially to avoid hammering servers
  for (const url of config.urls) {
    if (!url.trim()) continue;
    try {
      const item = await extractFromUrl(url.trim());
      if (item) {
        items.push(item);
      } else {
        errors.push(`Could not extract content from ${url}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Error extracting ${url}: ${msg}`);
    }
  }

  return { items, errors };
}
