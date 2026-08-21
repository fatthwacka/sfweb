/**
 * Image URL Utilities - Pre-Processed Versions
 * Handles routing to pre-processed image versions (original/optimized/thumbnail)
 * eliminating reliance on Supabase transformation API
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  resize?: 'contain' | 'cover' | 'fill';
}

/**
 * Convert an original image URL to a specific version (optimized or thumbnail)
 *
 * Path structure:
 * - Original: {timestamp}_{randomId}.{ext}  (unchanged)
 * - Optimized: {timestamp}_{randomId}_optimized.{ext}
 * - Thumbnail: {timestamp}_{randomId}_thumbnail.{ext}
 *
 * Example: 1699564800_abc123.jpg -> 1699564800_abc123_optimized.jpg
 */
/**
 * Media served from the gallery store (Google Cloud Storage bucket, or the legacy Supabase
 * Storage URLs that still appear in un-migrated rows / cached pages). Only these URLs have the
 * pre-processed `_optimized` / `_thumbnail` variants next to the original.
 *
 * The GCS base is baked in at build time from VITE_MEDIA_BASE_URL (default: the sfweb-media bucket).
 */
const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'https://storage.googleapis.com/sfweb-media';
const LEGACY_SUPABASE_PREFIX = '/storage/v1/object/public/';

export function isManagedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(MEDIA_BASE_URL + '/') || (url.includes('supabase.co') && url.includes(LEGACY_SUPABASE_PREFIX));
}

export function getVersionedImageUrl(
  originalUrl: string,
  version: 'original' | 'optimized' | 'thumbnail'
): string {
  if (!originalUrl) return originalUrl;

  // Only managed media (gallery store) has pre-processed variants; return other URLs as-is
  if (!isManagedMediaUrl(originalUrl)) {
    return originalUrl;
  }

  // Original version - return unchanged
  if (version === 'original') {
    return originalUrl;
  }

  // Insert version suffix before file extension
  // Pattern: .{ext} -> _{version}.{ext}
  // Example: "image.jpg" -> "image_optimized.jpg"
  const versionSuffix = version === 'optimized' ? '_optimized' : '_thumbnail';

  // Match the file extension (last dot and everything after)
  return originalUrl.replace(/\.([^.]+)$/, `${versionSuffix}.$1`);
}

/**
 * Legacy function - now redirects to versioned URLs
 * Kept for backward compatibility during migration
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageTransformOptions = {}
): string {
  // If no transformations specified, return original
  if (Object.keys(options).length === 0) return originalUrl;

  // Route to optimized version (pre-processed)
  return getVersionedImageUrl(originalUrl, 'optimized');
}

/**
 * Predefined image size presets - now points to pre-processed versions
 */
export const IMAGE_PRESETS = {
  // Optimized viewing size (~400-600KB, 2400px max dimension, 85% quality)
  optimized: {} as ImageTransformOptions, // No longer used, kept for compatibility

  // Modal viewing - same as optimized
  modal: {} as ImageTransformOptions,

  // Full size for downloads and detailed inspection
  fullSize: {} as ImageTransformOptions,
} as const;

/**
 * Get image URL using preset configurations (legacy)
 * Now routes to pre-processed versions
 */
export function getImageUrl(originalUrl: string, preset: keyof typeof IMAGE_PRESETS): string {
  if (preset === 'optimized' || preset === 'modal') {
    return getVersionedImageUrl(originalUrl, 'optimized');
  }
  return getVersionedImageUrl(originalUrl, 'original');
}

/**
 * Get image URL for different contexts
 * Routes to appropriate pre-processed version
 */
export const ImageUrl = {
  // For all viewing contexts (admin, galleries, client portal) - ~400-600KB optimized
  forViewing: (url: string) => getVersionedImageUrl(url, 'optimized'),

  // For modal viewing - same as viewing (optimized version)
  forModal: (url: string) => getVersionedImageUrl(url, 'optimized'),

  // For thumbnail grids - ~50-100KB thumbnail version
  forThumbnail: (url: string) => getVersionedImageUrl(url, 'thumbnail'),

  // For downloads and full resolution inspection (original file)
  forFullSize: (url: string) => getVersionedImageUrl(url, 'original'),
  forDownload: (url: string) => getVersionedImageUrl(url, 'original'),
} as const;