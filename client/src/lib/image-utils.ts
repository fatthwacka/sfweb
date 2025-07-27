/**
 * Supabase Image Transformation Utilities
 * Handles automatic image resizing and optimization using Supabase's built-in transformations
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  resize?: 'contain' | 'cover' | 'fill';
}

/**
 * Transform a Supabase storage URL with optimization parameters
 */
export function getOptimizedImageUrl(
  originalUrl: string, 
  options: ImageTransformOptions = {}
): string {
  if (!originalUrl) return originalUrl;

  // Check if it's a Supabase storage URL
  if (!originalUrl.includes('supabase') || !originalUrl.includes('/storage/v1/object/public/')) {
    return originalUrl;
  }

  // Build transformation parameters
  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);
  if (options.resize) params.append('resize', options.resize);

  // If no transformations specified, return original
  if (params.toString() === '') return originalUrl;

  // Append parameters to URL
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Predefined image size presets for consistent usage across the app
 */
export const IMAGE_PRESETS = {
  // Optimized viewing size for all interfaces (targeting ~600KB)
  optimized: { width: 2400, height: 2400, quality: 75, resize: 'contain' as const },
  
  // Full size for downloads and detailed inspection (no transformation)
  fullSize: {} as ImageTransformOptions,
} as const;

/**
 * Get optimized image URL using preset configurations
 */
export function getImageUrl(originalUrl: string, preset: keyof typeof IMAGE_PRESETS): string {
  return getOptimizedImageUrl(originalUrl, IMAGE_PRESETS[preset]);
}

/**
 * Get image URL for different contexts
 * Simplified to just two use cases: optimized viewing and full resolution
 */
export const ImageUrl = {
  // For all viewing contexts (admin, galleries, client portal) - ~600KB target
  forViewing: (url: string) => getImageUrl(url, 'optimized'),
  
  // For downloads and full resolution inspection (original 5MB)
  forFullSize: (url: string) => url,
  forDownload: (url: string) => url,
} as const;