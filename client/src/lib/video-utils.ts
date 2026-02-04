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

// Video source types
export type VideoSourceType = 'native' | 'youtube';

export interface VideoRecord {
  id: string;
  filename: string;
  storagePath: string;      // Original full-resolution video (for downloads) - empty for YouTube
  optimizedPath?: string;   // Web-optimized 1080p version (for streaming)
  thumbnailPath: string;    // 1200px JPEG thumbnail (for grids/modal buffers) - or YouTube auto-thumbnail
  fileSize: number;
  sequence: number;
  duration?: number;
  width?: number;
  height?: number;
  // YouTube integration fields
  sourceType?: VideoSourceType;  // 'native' | 'youtube' (defaults to 'native')
  externalId?: string;           // YouTube video ID (e.g., 'dQw4w9WgXcQ')
  externalUrl?: string;          // Full YouTube URL for reference
}

/**
 * YouTube URL parsing utilities
 */

/**
 * Parse YouTube URL to extract video ID
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function parseYouTubeUrl(url: string): string | null {
  if (!url) return null;

  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Old embed URL: youtube.com/v/VIDEO_ID
  const oldEmbedMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (oldEmbedMatch) return oldEmbedMatch[1];

  // Shorts URL: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Raw video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Get YouTube thumbnail URL by video ID
 * Quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'maxresdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Get YouTube embed URL for iframe
 * Includes recommended parameters for minimal branding
 */
export function getYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
}): string {
  const params = new URLSearchParams();

  // Default to minimal branding
  if (options?.autoplay) params.set('autoplay', '1');
  if (options?.mute) params.set('mute', '1');
  if (options?.loop) {
    params.set('loop', '1');
    params.set('playlist', videoId); // Required for loop to work
  }
  params.set('modestbranding', options?.modestbranding !== false ? '1' : '0');
  params.set('rel', options?.rel ? '1' : '0'); // Don't show related videos by default

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? '?' + queryString : ''}`;
}

/**
 * Get direct YouTube watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://youtu.be/${videoId}`;
}

/**
 * Get video URL for different contexts and quality levels
 * Provides intelligent fallbacks when optimized versions aren't available
 * Now supports both native and YouTube videos
 */
export const VideoUrl = {
  /**
   * Check if video is a YouTube video
   */
  isYouTube: (video: VideoRecord): boolean => {
    return video.sourceType === 'youtube' && !!video.externalId;
  },

  /**
   * For thumbnail grids and modal loading states
   * Uses high-quality 1200px JPEG thumbnail for native videos
   * Uses YouTube thumbnail for YouTube videos
   */
  forThumbnail: (video: VideoRecord): string => {
    // For YouTube videos, use stored thumbnail or generate from ID
    if (VideoUrl.isYouTube(video)) {
      // Prefer custom thumbnail if set, otherwise use YouTube auto-thumbnail
      if (video.thumbnailPath && !video.thumbnailPath.includes('youtube.com') && !video.thumbnailPath.includes('img.youtube.com')) {
        return video.thumbnailPath;
      }
      return getYouTubeThumbnailUrl(video.externalId!, 'maxresdefault');
    }

    return video.thumbnailPath;
  },

  /**
   * For video streaming and playback
   * Uses web-optimized 1080p version for native, embed URL for YouTube
   */
  forStreaming: (video: VideoRecord): string => {
    // For YouTube videos, return embed URL
    if (VideoUrl.isYouTube(video)) {
      return getYouTubeEmbedUrl(video.externalId!, { modestbranding: true, rel: false });
    }

    // For native videos, prefer optimized version
    if (video.optimizedPath) {
      return video.optimizedPath;
    }

    // Fallback to original if optimized version not yet generated
    console.warn(`🎬 No optimized version available for ${video.filename}, using original`);
    return video.storagePath;
  },

  /**
   * For modal video display
   * Returns embed URL for YouTube, streaming URL for native
   */
  forModal: (video: VideoRecord): string => {
    return VideoUrl.forStreaming(video);
  },

  /**
   * For downloads and full-resolution access
   * Returns original for native, null/empty for YouTube (no download)
   */
  forDownload: (video: VideoRecord): string | null => {
    if (VideoUrl.isYouTube(video)) {
      return null; // YouTube videos cannot be downloaded
    }
    return video.storagePath;
  },

  /**
   * For full-resolution viewing ("HD" button functionality)
   * Always uses original quality for native, YouTube watch URL for YouTube
   */
  forFullSize: (video: VideoRecord): string => {
    if (VideoUrl.isYouTube(video)) {
      return getYouTubeWatchUrl(video.externalId!);
    }
    return video.storagePath;
  },

  /**
   * Get direct YouTube URL for "Open in YouTube" button
   * Returns null for native videos
   */
  getYouTubeUrl: (video: VideoRecord): string | null => {
    if (!VideoUrl.isYouTube(video)) return null;
    return getYouTubeWatchUrl(video.externalId!);
  },

  /**
   * Get best available quality URL with fallback chain
   * Useful for adaptive quality scenarios
   */
  getBestQuality: (video: VideoRecord, preferOptimized: boolean = true): string => {
    if (VideoUrl.isYouTube(video)) {
      return getYouTubeEmbedUrl(video.externalId!, { modestbranding: true, rel: false });
    }

    if (preferOptimized && video.optimizedPath) {
      return video.optimizedPath;
    }
    return video.storagePath;
  },

  /**
   * Check if web-optimized version is available
   * Always returns true for YouTube (streaming is always available)
   */
  hasOptimizedVersion: (video: VideoRecord): boolean => {
    if (VideoUrl.isYouTube(video)) return true;
    return !!video.optimizedPath;
  },

  /**
   * Check if video supports download
   * YouTube videos do not support download
   */
  supportsDownload: (video: VideoRecord): boolean => {
    return !VideoUrl.isYouTube(video);
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
 * YouTube videos never need transcoding
 */
export function shouldTranscodeVideo(video: VideoRecord): boolean {
  // YouTube videos don't need transcoding
  if (VideoUrl.isYouTube(video)) return false;

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
 * YouTube videos are always considered "completed"
 */
export function getVideoProcessingStatus(video: VideoRecord): VideoProcessingStatus {
  // YouTube videos are always ready (no processing needed)
  if (VideoUrl.isYouTube(video)) {
    return 'completed';
  }

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