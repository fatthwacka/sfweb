/**
 * Video URL Utilities - 3-Tier Video System
 * Handles routing to appropriate video versions (thumbnail/optimized/original)
 * Mirrors the ImageUrl utility pattern for consistency
 */

export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface VideoRecord {
  id: string;
  filename: string;
  storagePath: string;      // Original full-resolution video (for downloads)
  optimizedPath?: string;   // Web-optimized 1080p version (for streaming)
  thumbnailPath: string;    // 1200px JPEG thumbnail (for grids/modal buffers)
  fileSize: number;
  sequence: number;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * Get video URL for different contexts and quality levels
 * Provides intelligent fallbacks when optimized versions aren't available
 */
export const VideoUrl = {
  /**
   * For thumbnail grids and modal loading states
   * Uses high-quality 1200px JPEG thumbnail
   */
  forThumbnail: (video: VideoRecord): string => {
    return video.thumbnailPath;
  },

  /**
   * For video streaming and playback
   * Uses web-optimized 1080p version, falls back to original
   */
  forStreaming: (video: VideoRecord): string => {
    // Prefer optimized version for better streaming performance
    if (video.optimizedPath) {
      return video.optimizedPath;
    }
    
    // Fallback to original if optimized version not yet generated
    console.warn(`🎬 No optimized version available for ${video.filename}, using original`);
    return video.storagePath;
  },

  /**
   * For modal video display (same as streaming)
   * Uses optimized version for faster loading
   */
  forModal: (video: VideoRecord): string => {
    return VideoUrl.forStreaming(video);
  },

  /**
   * For downloads and full-resolution access
   * Always uses original uploaded file
   */
  forDownload: (video: VideoRecord): string => {
    return video.storagePath;
  },

  /**
   * For full-resolution viewing ("HD" button functionality)
   * Always uses original quality
   */
  forFullSize: (video: VideoRecord): string => {
    return video.storagePath;
  },

  /**
   * Get best available quality URL with fallback chain
   * Useful for adaptive quality scenarios
   */
  getBestQuality: (video: VideoRecord, preferOptimized: boolean = true): string => {
    if (preferOptimized && video.optimizedPath) {
      return video.optimizedPath;
    }
    return video.storagePath;
  },

  /**
   * Check if web-optimized version is available
   * Useful for UI decisions (show HD toggle, etc.)
   */
  hasOptimizedVersion: (video: VideoRecord): boolean => {
    return !!video.optimizedPath;
  }
} as const;

/**
 * Video quality selection for player controls
 */
export type VideoQuality = 'auto' | 'optimized' | 'original';

/**
 * Get video URL by quality preference
 */
export function getVideoUrlByQuality(
  video: VideoRecord, 
  quality: VideoQuality = 'auto'
): string {
  switch (quality) {
    case 'optimized':
      return video.optimizedPath || video.storagePath;
    case 'original':
      return video.storagePath;
    case 'auto':
    default:
      return VideoUrl.forStreaming(video);
  }
}

/**
 * Estimate video file size based on dimensions and duration
 * Useful for bandwidth considerations and loading indicators
 */
export function estimateVideoSize(video: VideoRecord): {
  original: string;
  optimized: string;
  thumbnail: string;
} {
  const { width = 1920, height = 1080, duration = 60, fileSize = 100 * 1024 * 1024 } = video;
  
  // Rough estimates based on common compression ratios
  const pixelCount = width * height;
  const is4K = pixelCount > 3840 * 2160 * 0.8;
  
  return {
    original: formatVideoFileSize(fileSize),
    optimized: is4K ? formatVideoFileSize(fileSize * 0.1) : formatVideoFileSize(fileSize * 0.3),
    thumbnail: '~200-500KB'
  };
}

/**
 * Format file size for display (mirrors video-thumbnail-utils.ts)
 */
export function formatVideoFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format video duration for display (mirrors video-thumbnail-utils.ts)
 */
export function formatVideoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Determine if video needs transcoding based on file characteristics
 * Helps decide whether to generate optimized version
 */
export function shouldTranscodeVideo(video: VideoRecord): boolean {
  const { width = 1920, height = 1080, fileSize = 0 } = video;
  
  // Transcode if:
  // - Video is 4K+ resolution
  // - File size is very large (suggests high bitrate)
  // - Video is in non-web-friendly format
  
  const pixelCount = width * height;
  const is4KOrHigher = pixelCount > 3840 * 2160 * 0.8;
  const isLargeFile = fileSize > 50 * 1024 * 1024; // > 50MB
  
  return is4KOrHigher || isLargeFile;
}

/**
 * Video processing status for UI feedback
 */
export type VideoProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Determine video processing status based on available URLs
 */
export function getVideoProcessingStatus(video: VideoRecord): VideoProcessingStatus {
  // If we have both original and optimized, processing is complete
  if (video.storagePath && video.optimizedPath && video.thumbnailPath) {
    return 'completed';
  }
  
  // If we have original but no optimized, it might be processing or not needed
  if (video.storagePath && video.thumbnailPath) {
    return shouldTranscodeVideo(video) ? 'processing' : 'completed';
  }
  
  // If we only have partial data, still processing
  if (video.storagePath) {
    return 'processing';
  }
  
  // No URLs yet, still pending
  return 'pending';
}