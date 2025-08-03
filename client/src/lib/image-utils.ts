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

  // If no transformations specified, return original
  if (Object.keys(options).length === 0) return originalUrl;

  // Extract the path after /storage/v1/object/public/
  const publicPathMatch = originalUrl.match(/\/storage\/v1\/object\/public\/(.+)$/);
  if (!publicPathMatch) return originalUrl;
  
  const imagePath = publicPathMatch[1];
  const baseUrl = originalUrl.replace(/\/storage\/v1\/object\/public\/.+$/, '');
  
  // Build transformation parameters
  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);
  if (options.resize) params.append('resize', options.resize);

  // Use Supabase render API for transformations
  return `${baseUrl}/storage/v1/render/image/public/${imagePath}?${params.toString()}`;
}

/**
 * Predefined image size presets for consistent usage across the app
 */
export const IMAGE_PRESETS = {
  // Optimized viewing size for all interfaces (targeting 500-600KB as requested)
  optimized: { width: 2400, height: 2400, quality: 80, resize: 'contain' as const },
  
  // Modal viewing - maintains aspect ratio, optimized for modal display
  modal: { width: 2400, quality: 80 },
  
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
  // For all viewing contexts (admin, galleries, client portal) - ~364KB optimized
  forViewing: (url: string) => getImageUrl(url, 'optimized'),
  
  // For modal viewing - maintains aspect ratio, optimized size
  forModal: (url: string) => getImageUrl(url, 'modal'),
  
  // For downloads and full resolution inspection (original 4.4MB)
  forFullSize: (url: string) => url,
  forDownload: (url: string) => url,
} as const;