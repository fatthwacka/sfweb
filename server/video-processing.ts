/**
 * Server-Side Video Processing with FFmpeg
 * Handles video transcoding for web optimization and thumbnail generation
 */

import { createReadStream, createWriteStream, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

// Lazy-load FFmpeg dependencies (CommonJS modules)
let ffmpegLib: any = null;
let ffmpegStatic: string | null = null;

async function loadFfmpeg() {
  if (!ffmpegLib) {
    // Dynamic import for CommonJS modules
    ffmpegLib = (await import('fluent-ffmpeg')).default;
    ffmpegStatic = (await import('ffmpeg-static')).default;

    // Set FFmpeg binary path
    if (ffmpegStatic && ffmpegLib.setFfmpegPath) {
      ffmpegLib.setFfmpegPath(ffmpegStatic);
    }
  }
  return ffmpegLib;
}

export interface VideoProcessingOptions {
  inputBuffer: Buffer;
  originalFilename: string;
  maxWidth?: number;
  quality?: string;
  videoBitrate?: string;
  audioBitrate?: string;
}

export interface VideoProcessingResult {
  optimizedBuffer: Buffer;
  thumbnailBuffer: Buffer;
  metadata: {
    originalSize: number;
    optimizedSize: number;
    thumbnailSize: number;
    duration: number;
    originalDimensions: { width: number; height: number };
    optimizedDimensions: { width: number; height: number };
    compressionRatio: number;
  };
}

/**
 * Process video: create web-optimized version + high-quality thumbnail
 */
export async function processVideo(
  options: VideoProcessingOptions
): Promise<VideoProcessingResult> {
  // Ensure FFmpeg is loaded
  await loadFfmpeg();

  const {
    inputBuffer,
    originalFilename,
    maxWidth = 1920, // 1080p max width
    quality = 'medium',
    videoBitrate = '6000k',  // Increased from 2000k for much better quality
    audioBitrate = '192k'    // Increased from 128k for better audio
  } = options;

  console.log(`🎬 Starting video processing for ${originalFilename}`);
  console.log(`📊 Original size: ${formatFileSize(inputBuffer.length)}`);

  // Create temporary files
  const tempId = randomBytes(8).toString('hex');
  const tempDir = tmpdir();
  const inputPath = join(tempDir, `input_${tempId}.mp4`);
  const outputPath = join(tempDir, `output_${tempId}.mp4`);
  const thumbnailPath = join(tempDir, `thumb_${tempId}.jpg`);

  try {
    // Write input buffer to temp file
    const inputStream = createWriteStream(inputPath);
    inputStream.write(inputBuffer);
    inputStream.end();
    await new Promise((resolve, reject) => {
      inputStream.on('finish', resolve);
      inputStream.on('error', reject);
    });

    // Get video metadata first
    const metadata = await getVideoMetadata(inputPath);
    console.log(`📹 Original video: ${metadata.width}x${metadata.height}, ${formatDuration(metadata.duration)}`);

    // Calculate optimized dimensions maintaining aspect ratio
    const optimizedDimensions = calculateOptimizedDimensions(
      metadata.width,
      metadata.height,
      maxWidth
    );

    console.log(`⚙️ Optimizing to: ${optimizedDimensions.width}x${optimizedDimensions.height}`);

    // Process video and thumbnail in parallel
    const [optimizedBuffer, thumbnailBuffer] = await Promise.all([
      transcodeVideo(inputPath, outputPath, optimizedDimensions, videoBitrate, audioBitrate, quality),
      generateServerThumbnail(inputPath, thumbnailPath)
    ]);

    console.log(`✅ Video processing complete:`);
    console.log(`   📄 Original: ${formatFileSize(inputBuffer.length)}`);
    console.log(`   🎬 Optimized: ${formatFileSize(optimizedBuffer.length)}`);
    console.log(`   📸 Thumbnail: ${formatFileSize(thumbnailBuffer.length)}`);

    const compressionRatio = ((inputBuffer.length - optimizedBuffer.length) / inputBuffer.length) * 100;
    console.log(`   💾 Compression: ${compressionRatio.toFixed(1)}% reduction`);

    return {
      optimizedBuffer,
      thumbnailBuffer,
      metadata: {
        originalSize: inputBuffer.length,
        optimizedSize: optimizedBuffer.length,
        thumbnailSize: thumbnailBuffer.length,
        duration: metadata.duration,
        originalDimensions: { width: metadata.width, height: metadata.height },
        optimizedDimensions,
        compressionRatio
      }
    };

  } finally {
    // Clean up temporary files
    [inputPath, outputPath, thumbnailPath].forEach(path => {
      if (existsSync(path)) {
        try {
          unlinkSync(path);
        } catch (error) {
          console.warn(`⚠️ Failed to cleanup temp file: ${path}`);
        }
      }
    });
  }
}

/**
 * Get video metadata using FFmpeg probe
 */
async function getVideoMetadata(inputPath: string): Promise<{
  width: number;
  height: number;
  duration: number;
  bitrate: number;
}> {
  const ffmpeg = await loadFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .ffprobe((err, metadata) => {
        if (err) {
          reject(new Error(`Failed to probe video: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          width: videoStream.width || 1920,
          height: videoStream.height || 1080,
          duration: parseFloat(metadata.format.duration?.toString() || '0'),
          bitrate: parseInt(metadata.format.bit_rate?.toString() || '0')
        });
      });
  });
}

/**
 * Transcode video to web-optimized format
 */
async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  dimensions: { width: number; height: number },
  videoBitrate: string,
  audioBitrate: string,
  quality: string
): Promise<Buffer> {
  const ffmpeg = await loadFfmpeg();
  return new Promise((resolve, reject) => {
    let ffmpegCommand = ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',           // H.264 codec for maximum compatibility
        '-preset slow',           // Slower preset = better quality at same bitrate
        `-crf ${getQualityCRF(quality)}`, // Constant Rate Factor for quality
        '-profile:v high',        // High profile for better quality
        '-level 4.1',             // Level 4.1 for 1080p compatibility
        '-c:a aac',               // AAC audio codec
        '-movflags +faststart',   // Web-optimized MP4 structure
        '-pix_fmt yuv420p',       // Ensure compatibility
        `-maxrate ${videoBitrate}`,
        `-bufsize ${parseInt(videoBitrate) * 2}k`,
        `-b:a ${audioBitrate}`
      ])
      .size(`${dimensions.width}x${dimensions.height}`)
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`🔄 FFmpeg command: ${cmd}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`⏳ Transcoding progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', async () => {
        try {
          const buffer = await readFileToBuffer(outputPath);
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(new Error(`FFmpeg transcoding failed: ${error.message}`));
      });

    ffmpegCommand.run();
  });
}

/**
 * Generate high-quality server-side thumbnail
 */
async function generateServerThumbnail(
  inputPath: string,
  thumbnailPath: string
): Promise<Buffer> {
  const ffmpeg = await loadFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        timemarks: ['00:00:01'], // 1 second in for better frame
        filename: 'thumb_%i.jpg',
        folder: join(thumbnailPath, '..'),
        size: '1200x?' // 1200px width, maintain aspect ratio
      })
      .on('end', async () => {
        try {
          const actualThumbPath = join(join(thumbnailPath, '..'), 'thumb_1.jpg');
          const buffer = await readFileToBuffer(actualThumbPath);
          
          // Clean up the generated thumbnail
          if (existsSync(actualThumbPath)) {
            unlinkSync(actualThumbPath);
          }
          
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(new Error(`Thumbnail generation failed: ${error.message}`));
      });
  });
}

/**
 * Calculate optimized dimensions maintaining aspect ratio
 */
function calculateOptimizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 1920
): { width: number; height: number } {
  const aspectRatio = originalHeight / originalWidth;
  
  // Don't upscale videos
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const optimizedWidth = maxWidth;
  const optimizedHeight = Math.round(maxWidth * aspectRatio);
  
  // Ensure dimensions are even (required for some codecs)
  return {
    width: optimizedWidth % 2 === 0 ? optimizedWidth : optimizedWidth - 1,
    height: optimizedHeight % 2 === 0 ? optimizedHeight : optimizedHeight - 1
  };
}

/**
 * Get CRF value based on quality setting
 * Lower CRF = higher quality (scale 0-51)
 * Updated Feb 2026: Improved quality across all tiers
 */
function getQualityCRF(quality: string): string {
  switch (quality) {
    case 'high': return '16';    // Near-lossless quality (was 18)
    case 'medium': return '18';  // High quality, good balance (was 21)
    case 'low': return '22';     // Good quality, smaller file (was 26)
    default: return '18';
  }
}

/**
 * Read file into buffer
 */
async function readFileToBuffer(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(filePath);
    
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Utility functions
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Legacy function for video transcoding decisions
 * Note: Currently processing ALL videos for consistent 3-tier optimization
 */
export function shouldTranscodeVideo(
  fileSize: number,
  width: number = 1920,
  height: number = 1080
): boolean {
  // Always return true for universal 3-tier processing
  return true;
}

/**
 * Validate video processing requirements
 */
export function validateVideoForProcessing(
  buffer: Buffer,
  filename: string
): { valid: boolean; error?: string } {
  // Check file size (max 1.5GB for processing - matches upload limit for large wedding videos)
  const maxSize = 1500 * 1024 * 1024; // 1.5GB
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `Video file too large for processing: ${formatFileSize(buffer.length)}. Maximum: 1.5GB`
    };
  }

  // Check filename extension
  const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const hasValidExtension = validExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Unsupported video format. Supported: ${validExtensions.join(', ')}`
    };
  }

  return { valid: true };
}