/**
 * Competitor Blog Fetcher — Monitors a competitor's blog via RSS or sitemap.
 * Attempts RSS discovery first, falls back to sitemap parsing.
 */

import * as cheerio from 'cheerio';
import { fetchRss } from './rss-fetcher';
import { extractFromUrl } from './url-extractor';
import type { FetchedItem, FetcherResult } from './fetcher-types';

export interface CompetitorBlogSourceConfig {
  url: string;
  maxItems?: number;
}

const USER_AGENT = 'Mozilla/5.0 (compatible; SlyFox-ContentStudio/1.0; +https://slyfox.co.za)';

/**
 * Try to discover the RSS feed URL from a page's HTML.
 */
async function discoverRssFeed(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for RSS/Atom link tags
    const rssLink = $('link[type="application/rss+xml"]').attr('href')
      || $('link[type="application/atom+xml"]').attr('href');

    if (rssLink) {
      // Resolve relative URLs
      return new URL(rssLink, pageUrl).toString();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Try to parse a sitemap and extract recent page URLs.
 */
async function fetchFromSitemap(baseUrl: string, maxItems: number): Promise<string[]> {
  const urls: string[] = [];
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/post-sitemap.xml`,
    `${baseUrl}/blog-sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) continue;

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Check if it's a sitemap index (contains <sitemap> elements)
      const sitemaps = $('sitemap loc');
      if (sitemaps.length > 0) {
        // Take the first sub-sitemap (usually posts)
        const firstSubSitemap = sitemaps.first().text();
        if (firstSubSitemap) {
          const subResult = await fetchSitemapUrls(firstSubSitemap, maxItems);
          urls.push(...subResult);
          break;
        }
      }

      // Regular sitemap with <url> elements
      $('url loc').each((_i, el) => {
        if (urls.length >= maxItems) return false;
        const loc = $(el).text().trim();
        if (loc) urls.push(loc);
      });

      if (urls.length > 0) break;
    } catch {
      continue;
    }
  }

  return urls.slice(0, maxItems);
}

async function fetchSitemapUrls(sitemapUrl: string, maxItems: number): Promise<string[]> {
  const urls: string[] = [];
  try {
    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    $('url loc').each((_i, el) => {
      if (urls.length >= maxItems) return false;
      const loc = $(el).text().trim();
      if (loc) urls.push(loc);
    });
  } catch {
    // Silently fail
  }
  return urls;
}

/**
 * Fetch articles from a competitor blog.
 * Strategy: RSS first → RSS auto-discovery → sitemap fallback → individual page extraction.
 */
export async function fetchCompetitorBlog(config: CompetitorBlogSourceConfig): Promise<FetcherResult> {
  const errors: string[] = [];
  const maxItems = config.maxItems || 10;

  if (!config.url) {
    return { items: [], errors: ['Competitor blog URL is required'] };
  }

  // Normalise URL
  let baseUrl = config.url.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  // Strategy 1: Try the URL directly as an RSS feed
  const directRss = await fetchRss({ url: baseUrl, maxItems });
  if (directRss.items.length > 0) {
    return directRss;
  }

  // Strategy 2: Try common RSS paths
  const commonRssPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/blog/feed', '/blog/rss'];
  for (const path of commonRssPaths) {
    const rssResult = await fetchRss({ url: `${baseUrl}${path}`, maxItems });
    if (rssResult.items.length > 0) {
      return rssResult;
    }
  }

  // Strategy 3: Auto-discover RSS from the page HTML
  const discoveredFeed = await discoverRssFeed(baseUrl);
  if (discoveredFeed) {
    const rssResult = await fetchRss({ url: discoveredFeed, maxItems });
    if (rssResult.items.length > 0) {
      return rssResult;
    }
  }

  // Strategy 4: Sitemap fallback — extract URLs and scrape each page
  const sitemapUrls = await fetchFromSitemap(baseUrl, maxItems);
  if (sitemapUrls.length > 0) {
    const items: FetchedItem[] = [];
    for (const url of sitemapUrls) {
      if (items.length >= maxItems) break;
      const extracted = await extractFromUrl(url);
      if (extracted) {
        items.push(extracted);
      }
    }
    if (items.length > 0) {
      return { items, errors };
    }
  }

  errors.push(`Could not find RSS feed or sitemap for ${baseUrl}`);
  return { items: [], errors };
}
