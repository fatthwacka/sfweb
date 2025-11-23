/**
 * Video Thumbnail Generation Utility
 *
 * Client-side video thumbnail generation using HTML5 Canvas API.
 * Generates thumbnails from the first frame of the video.
 * Maintains aspect ratio and scales to max 640px width.
 */

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export interface VideoThumbnailResult {
  thumbnailDataUrl: string;
  metadata: VideoMetadata;
}

/**
 * Generate thumbnails for multiple video files in parallel
 * @param videoFiles Array of video File objects
 * @returns Promise resolving to array of thumbnail results
 */
export async function generateVideoThumbnails(
  videoFiles: File[]
): Promise<VideoThumbnailResult[]> {
  console.log(`🎬 Generating thumbnails for ${videoFiles.length} videos`);

  const results = await Promise.all(
    videoFiles.map(file => generateSingleThumbnail(file))
  );

  console.log(`✅ Generated ${results.length} video thumbnails`);
  return results;
}

/**
 * Generate a thumbnail for a single video file
 * @param videoFile Video File object
 * @returns Promise resolving to thumbnail data URL and metadata
 */
export async function generateSingleThumbnail(
  videoFile: File
): Promise<VideoThumbnailResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');

    // Create object URL for video
    const videoUrl = URL.createObjectURL(videoFile);
    let urlRevoked = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;
    
    // Centralized cleanup function
    const cleanup = () => {
      if (!urlRevoked) {
        try {
          URL.revokeObjectURL(videoUrl);
          urlRevoked = true;
          console.log(`🧹 Cleaned up blob URL for ${videoFile.name}`);
        } catch (error) {
          console.warn(`⚠️ Error cleaning up blob URL for ${videoFile.name}:`, error);
        }
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Remove event listeners to prevent memory leaks
      try {
        video.removeAttribute('src');
        video.load(); // Reset video element
      } catch (error) {
        console.warn(`⚠️ Error resetting video element:`, error);
      }
    };

    // Wrapper functions to ensure cleanup and prevent double-calling
    const safeResolve = (result: VideoThumbnailResult) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    const safeReject = (error: any) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(error);
    };

    video.src = videoUrl;
    video.preload = 'metadata';
    video.muted = true; // Required for autoplay in some browsers

    // Store metadata
    let metadata: VideoMetadata;

    video.addEventListener('loadedmetadata', () => {
      try {
        // Capture metadata
        metadata = {
          duration: Math.floor(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        };

        console.log(`📹 Video metadata: ${metadata.width}x${metadata.height}, ${metadata.duration}s`);

        // Use the first frame (time 0)
        video.currentTime = 0;
      } catch (error) {
        safeReject(new Error(`Failed to read video metadata: ${error}`));
      }
    });

    video.addEventListener('seeked', () => {
      try {
        // Calculate thumbnail dimensions maintaining aspect ratio
        // Use 1200px max dimension (width or height) for better modal quality
        const maxDimension = 1200;
        let thumbnailWidth = video.videoWidth;
        let thumbnailHeight = video.videoHeight;

        // Scale based on the larger dimension to maintain aspect ratio
        if (thumbnailWidth > thumbnailHeight) {
          // Landscape or square - limit by width
          if (thumbnailWidth > maxDimension) {
            const aspectRatio = video.videoHeight / video.videoWidth;
            thumbnailWidth = maxDimension;
            thumbnailHeight = maxDimension * aspectRatio;
          }
        } else {
          // Portrait - limit by height
          if (thumbnailHeight > maxDimension) {
            const aspectRatio = video.videoWidth / video.videoHeight;
            thumbnailHeight = maxDimension;
            thumbnailWidth = maxDimension * aspectRatio;
          }
        }

        // Set canvas size
        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          safeReject(new Error('Could not get canvas 2d context'));
          return;
        }

        ctx.drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);

        // Convert to data URL (JPEG with 85% quality)
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        console.log(`✅ Generated thumbnail: ${thumbnailWidth}x${thumbnailHeight} for ${videoFile.name}`);

        safeResolve({
          thumbnailDataUrl,
          metadata
        });
      } catch (error) {
        safeReject(new Error(`Failed to generate thumbnail: ${error}`));
      }
    });

    video.addEventListener('error', (error) => {
      safeReject(new Error(`Failed to load video ${videoFile.name}: ${error}`));
    });

    video.addEventListener('abort', () => {
      safeReject(new Error(`Video loading aborted for ${videoFile.name}`));
    });

    video.addEventListener('stalled', () => {
      console.warn(`⚠️ Video loading stalled for ${videoFile.name}`);
    });

    // Set timeout to prevent indefinite hanging
    timeoutId = setTimeout(() => {
      safeReject(new Error(`Video thumbnail generation timed out after 30 seconds for ${videoFile.name}`));
    }, 30000);
  });
}

/**
 * Get a placeholder thumbnail for when generation fails
 * @returns Base64 encoded placeholder image
 */
export function getPlaceholderThumbnail(): string {
  // Simple 1x1 gray pixel as placeholder
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

/**
 * Validate video file before processing
 * @param file File to validate
 * @param maxSizeMB Maximum file size in MB (default 500)
 * @returns Validation result
 */
export function validateVideoFile(
  file: File,
  maxSizeMB: number = 500
): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return {
      valid: false,
      error: 'File must be a video'
    };
  }

  // Check file size (convert MB to bytes)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Video must be smaller than ${maxSizeMB}MB`
    };
  }

  // Check supported formats
  const supportedFormats = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  if (!supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported video format: ${file.type}. Supported: MP4, MOV, WebM, AVI`
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "24.5 MB")
 */
export function formatVideoFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format video duration for display
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "1:23" or "12:34:56")
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
