import sharp from 'sharp';

/**
 * Image Processing Service
 * Handles pre-processing of uploaded images into 3 optimized versions
 * to eliminate reliance on Supabase transformation API
 */

export interface ProcessedImageVersion {
  buffer: Buffer;
  width: number;
  height: number;
  size: number; // File size in bytes
  format: string;
}

export interface ProcessedImage {
  original: ProcessedImageVersion;
  optimized: ProcessedImageVersion;
  thumbnail: ProcessedImageVersion;
  originalFilename: string;
  mimeType: string;
}

export interface ImageProcessingOptions {
  optimizedMaxDimension?: number;  // Default: 2400px
  optimizedQuality?: number;       // Default: 85
  thumbnailMaxDimension?: number;  // Default: 600px
  thumbnailQuality?: number;       // Default: 80
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  optimizedMaxDimension: 2400,
  optimizedQuality: 85,
  thumbnailMaxDimension: 600,
  thumbnailQuality: 80,
};

/**
 * Process an uploaded image file into 3 versions:
 * 1. Original - Stored as-is for full resolution downloads
 * 2. Optimized - 2400px max dimension, 85% quality (~400-600KB) for viewing
 * 3. Thumbnail - 600px max dimension, 80% quality (~50-100KB) for grids
 */
export async function processImage(
  file: Express.Multer.File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Load the image with Sharp
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    console.log(`📸 Processing image: ${file.originalname} (${metadata.width}x${metadata.height}, ${metadata.format})`);

    // 1. ORIGINAL VERSION - Store as-is
    const originalBuffer = file.buffer;
    const original: ProcessedImageVersion = {
      buffer: originalBuffer,
      width: metadata.width,
      height: metadata.height,
      size: originalBuffer.length,
      format: metadata.format || 'jpeg',
    };

    // 2. OPTIMIZED VERSION - For viewing (2400px max, 85% quality)
    const optimizedBuffer = await createOptimizedVersion(
      image,
      metadata,
      opts.optimizedMaxDimension,
      opts.optimizedQuality
    );
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    const optimized: ProcessedImageVersion = {
      buffer: optimizedBuffer,
      width: optimizedMetadata.width || metadata.width,
      height: optimizedMetadata.height || metadata.height,
      size: optimizedBuffer.length,
      format: optimizedMetadata.format || 'jpeg',
    };

    // 3. THUMBNAIL VERSION - For grids (600px max, 80% quality)
    const thumbnailBuffer = await createThumbnailVersion(
      image,
      metadata,
      opts.thumbnailMaxDimension,
      opts.thumbnailQuality
    );
    const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
    const thumbnail: ProcessedImageVersion = {
      buffer: thumbnailBuffer,
      width: thumbnailMetadata.width || metadata.width,
      height: thumbnailMetadata.height || metadata.height,
      size: thumbnailBuffer.length,
      format: thumbnailMetadata.format || 'jpeg',
    };

    console.log(`✅ Processed ${file.originalname}:`);
    console.log(`   Original:  ${formatBytes(original.size)} (${original.width}x${original.height})`);
    console.log(`   Optimized: ${formatBytes(optimized.size)} (${optimized.width}x${optimized.height})`);
    console.log(`   Thumbnail: ${formatBytes(thumbnail.size)} (${thumbnail.width}x${thumbnail.height})`);

    return {
      original,
      optimized,
      thumbnail,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    };
  } catch (error) {
    console.error(`❌ Error processing image ${file.originalname}:`, error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create optimized version (2400px max dimension)
 */
async function createOptimizedVersion(
  image: sharp.Sharp,
  metadata: sharp.Metadata,
  maxDimension: number,
  quality: number
): Promise<Buffer> {
  const { width = 0, height = 0 } = metadata;

  // Calculate resize dimensions (maintain aspect ratio)
  let resizeWidth: number | undefined;
  let resizeHeight: number | undefined;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      resizeWidth = maxDimension;
      resizeHeight = undefined; // Auto-calculate to maintain aspect ratio
    } else {
      resizeWidth = undefined;
      resizeHeight = maxDimension;
    }
  }

  // Process image
  let pipeline = image.clone();

  // Resize if needed
  if (resizeWidth || resizeHeight) {
    pipeline = pipeline.resize(resizeWidth, resizeHeight, {
      fit: 'inside', // Maintain aspect ratio
      withoutEnlargement: true, // Don't upscale small images
    });
  }

  // Apply quality and convert to JPEG (most compatible)
  pipeline = pipeline.jpeg({
    quality,
    progressive: true, // Progressive JPEG for better perceived load time
    mozjpeg: true, // Use MozJPEG for better compression
  });

  return await pipeline.toBuffer();
}

/**
 * Create thumbnail version (600px max dimension)
 */
async function createThumbnailVersion(
  image: sharp.Sharp,
  metadata: sharp.Metadata,
  maxDimension: number,
  quality: number
): Promise<Buffer> {
  const { width = 0, height = 0 } = metadata;

  // Calculate resize dimensions
  let resizeWidth: number | undefined;
  let resizeHeight: number | undefined;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      resizeWidth = maxDimension;
      resizeHeight = undefined;
    } else {
      resizeWidth = undefined;
      resizeHeight = maxDimension;
    }
  } else {
    // Even if smaller than max, create a thumbnail (ensures consistency)
    resizeWidth = width;
    resizeHeight = height;
  }

  // Process thumbnail
  let pipeline = image.clone();

  pipeline = pipeline.resize(resizeWidth, resizeHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Slightly sharpen thumbnails for better appearance at small sizes
  pipeline = pipeline.sharpen();

  // Apply quality and convert to JPEG
  pipeline = pipeline.jpeg({
    quality,
    progressive: true,
    mozjpeg: true,
  });

  return await pipeline.toBuffer();
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate versioned filename for storage
 * Format: {timestamp}_{randomId}_{version}.{ext}
 */
export function generateVersionedFilename(
  originalFilename: string,
  version: 'original' | 'optimized' | 'thumbnail'
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const ext = originalFilename.split('.').pop() || 'jpg';
  const baseName = originalFilename.replace(/\.[^/.]+$/, ''); // Remove extension

  return `${timestamp}_${randomId}_${version}.${ext}`;
}

/**
 * Extract base filename without version suffix
 * Used for conflict detection
 */
export function extractBaseFilename(versionedFilename: string): string {
  // Remove _original, _optimized, _thumbnail suffix
  return versionedFilename.replace(/_(original|optimized|thumbnail)\./, '.');
}

/**
 * Batch process multiple images
 */
export async function processImages(
  files: Express.Multer.File[],
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage[]> {
  console.log(`🔄 Batch processing ${files.length} images...`);

  const results: ProcessedImage[] = [];

  for (const file of files) {
    try {
      const processed = await processImage(file, options);
      results.push(processed);
    } catch (error) {
      console.error(`Failed to process ${file.originalname}:`, error);
      // Continue processing other images even if one fails
    }
  }

  console.log(`✅ Batch processing complete: ${results.length}/${files.length} successful`);

  return results;
}
