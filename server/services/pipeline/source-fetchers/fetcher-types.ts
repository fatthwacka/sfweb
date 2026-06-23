/**
 * Shared types for all source fetchers.
 */

export interface FetchedItem {
  externalUrl: string;
  title: string;
  summary?: string;
  rawContent?: string;
  sourcePublishedAt?: string; // ISO timestamp
}

export interface FetcherResult {
  items: FetchedItem[];
  errors: string[];
}
