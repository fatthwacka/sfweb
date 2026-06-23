/**
 * Layer 1: URL Dedup — SHA-256 hash of normalised URL.
 * Cheapest check (zero API calls, single DB index lookup).
 */

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScreeningResult } from './screening-types';

/**
 * Normalise a URL for consistent hashing:
 * - Lowercase hostname
 * - Strip trailing slashes
 * - Remove common tracking parameters (utm_*, fbclid, gclid, etc.)
 * - Remove fragment
 */
export function normaliseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';

    // Remove tracking params
    const trackingPrefixes = ['utm_', 'fbclid', 'gclid', 'mc_', 'ref', 'source'];
    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_value, key) => {
      if (trackingPrefixes.some(prefix => key.toLowerCase().startsWith(prefix))) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach(key => parsed.searchParams.delete(key));

    // Sort remaining params for consistency
    parsed.searchParams.sort();

    // Normalise: lowercase host, strip trailing slash from pathname
    let normalised = parsed.toString().toLowerCase();
    normalised = normalised.replace(/\/+$/, '');

    return normalised;
  } catch {
    // If URL parsing fails, use the raw string
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Generate SHA-256 hash of a normalised URL.
 */
export function hashUrl(url: string): string {
  const normalised = normaliseUrl(url);
  return createHash('sha256').update(normalised).digest('hex');
}

/**
 * Check if a URL has already been ingested for this client.
 * Uses the unique index on (client_id, url_hash).
 */
export async function checkUrlDedup(
  supabase: SupabaseClient,
  clientId: string,
  url: string,
): Promise<ScreeningResult> {
  const urlHash = hashUrl(url);

  const { data, error } = await supabase
    .from('ingested_articles')
    .select('id, status')
    .eq('client_id', clientId)
    .eq('url_hash', urlHash)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[url-dedup] Database query error:', error.message);
    // On error, let the article through (fail open)
    return { passed: true, metadata: { urlHash, error: error.message } };
  }

  if (data) {
    return {
      passed: false,
      reason: `Duplicate URL (previously ${data.status})`,
      metadata: { urlHash, existingId: data.id },
    };
  }

  return { passed: true, metadata: { urlHash } };
}
