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
  // Admin interface thumbnails
  adminThumbnail: { width: 150, height: 150, quality: 80, resize: 'cover' as const },
  
  // Gallery grid thumbnails  
  galleryThumbnail: { width: 400, height: 300, quality: 85, resize: 'cover' as const },
  
  // Main gallery viewing
  galleryView: { width: 1200, height: 800, quality: 90, resize: 'contain' as const },
  
  // Client portal previews
  clientPreview: { width: 600, height: 400, quality: 85, resize: 'cover' as const },
  
  // Banner/hero images
  banner: { width: 1600, height: 600, quality: 90, resize: 'cover' as const },
  
  // Full size for downloads (no transformation)
  download: {} as ImageTransformOptions,
} as const;

/**
 * Get optimized image URL using preset configurations
 */
export function getImageUrl(originalUrl: string, preset: keyof typeof IMAGE_PRESETS): string {
  return getOptimizedImageUrl(originalUrl, IMAGE_PRESETS[preset]);
}

/**
 * Get image URL for different contexts
 */
export const ImageUrl = {
  // For admin interface image management
  forAdmin: (url: string) => getImageUrl(url, 'adminThumbnail'),
  
  // For gallery grid displays
  forGallery: (url: string) => getImageUrl(url, 'galleryThumbnail'),
  
  // For main image viewing
  forViewing: (url: string) => getImageUrl(url, 'galleryView'),
  
  // For client portal
  forClient: (url: string) => getImageUrl(url, 'clientPreview'),
  
  // For banner images
  forBanner: (url: string) => getImageUrl(url, 'banner'),
  
  // For downloads (original size)
  forDownload: (url: string) => url,
} as const;