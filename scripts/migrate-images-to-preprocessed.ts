/**
 * Migration Script: Convert Existing Images to Pre-Processed Versions
 *
 * This script:
 * 1. Fetches all existing images from the database
 * 2. Downloads each original image from Supabase
 * 3. Processes into 3 versions (original, optimized, thumbnail)
 * 4. Uploads optimized and thumbnail versions to Supabase
 * 5. Original stays unchanged (no renaming)
 *
 * Run with: tsx scripts/migrate-images-to-preprocessed.ts
 */

// IMPORTANT: Load environment variables FIRST before any other imports
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { db } from '../server/db.js';
import { images } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';

// Configuration
const BATCH_SIZE = 10; // Process 10 images at a time
const DRY_RUN = false; // Set to true to test without making changes

interface MigrationStats {
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

async function migrateImages() {
  console.log('🚀 Starting image migration to pre-processed versions...\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all images from database
  console.log('📊 Fetching all images from database...');
  const allImages = await db.select().from(images);
  console.log(`   Found ${allImages.length} images to migrate\n`);

  const stats: MigrationStats = {
    total: allImages.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < allImages.length; i += BATCH_SIZE) {
    const batch = allImages.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allImages.length / BATCH_SIZE)} (${batch.length} images)...`);

    for (const image of batch) {
      try {
        console.log(`\n🔄 Processing: ${image.filename || image.id}`);

        // Check if already migrated (check if _optimized version exists)
        const urlParts = image.storagePath.split('/storage/v1/object/public/gallery-images/');
        if (urlParts.length !== 2) {
          console.log('   ❌ Invalid storage path format - skipping');
          stats.skipped++;
          continue;
        }
        const storagePath = urlParts[1];
        const optimizedPath = storagePath.replace(/\.([^.]+)$/, '_optimized.$1');

        // Check if optimized version already exists
        const { data: existingOptimized } = await supabase.storage
          .from('gallery-images')
          .list(storagePath.split('/').slice(0, -1).join('/'), {
            search: optimizedPath.split('/').pop()
          });

        if (existingOptimized && existingOptimized.length > 0) {
          console.log('   ✅ Already migrated (_optimized exists) - skipping');
          stats.skipped++;
          continue;
        }

        // Step 1: Download original image
        console.log('   📥 Downloading original image...');
        const imageResponse = await fetch(image.storagePath);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log(`   ✅ Downloaded (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

        // Step 2: Process into 3 versions
        console.log('   🖼️  Processing into 3 versions...');
        const sharpImage = sharp(imageBuffer);
        const metadata = await sharpImage.metadata();

        // Create optimized version (2400px max, 85% quality)
        const optimizedBuffer = await createOptimizedVersion(sharpImage, metadata);
        console.log(`      - Optimized: ${(optimizedBuffer.length / 1024).toFixed(0)}KB`);

        // Create thumbnail version (600px max, 80% quality)
        const thumbnailBuffer = await createThumbnailVersion(sharpImage, metadata);
        console.log(`      - Thumbnail: ${(thumbnailBuffer.length / 1024).toFixed(0)}KB`);

        // Step 3: Generate thumbnail path (optimizedPath already declared above for migration check)
        // Original stays unchanged!
        // Only add _optimized and _thumbnail versions
        const thumbnailPath = storagePath.replace(/\.([^.]+)$/, '_thumbnail.$1');

        if (!DRY_RUN) {
          // Step 4: Upload optimized and thumbnail versions
          // IMPORTANT: Original file stays as-is, no renaming!
          console.log('   📤 Uploading optimized and thumbnail versions...');

          // Upload optimized
          const { error: optimizedError } = await supabase.storage
            .from('gallery-images')
            .upload(optimizedPath, optimizedBuffer, {
              contentType: metadata.format === 'jpeg' ? 'image/jpeg' : 'image/png',
              upsert: false,
            });

          if (optimizedError) {
            throw new Error(`Failed to upload optimized: ${optimizedError.message}`);
          }
          console.log('      ✅ Optimized uploaded');

          // Upload thumbnail
          const { error: thumbnailError } = await supabase.storage
            .from('gallery-images')
            .upload(thumbnailPath, thumbnailBuffer, {
              contentType: metadata.format === 'jpeg' ? 'image/jpeg' : 'image/png',
              upsert: false,
            });

          if (thumbnailError) {
            throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`);
          }
          console.log('      ✅ Thumbnail uploaded');

          // Step 5: Database UNCHANGED - original URL stays the same!
          console.log('      ✅ Original file unchanged (no database update needed)');
        } else {
          console.log('   ⚠️  DRY RUN - would create:');
          console.log(`      - ${optimizedPath} (NEW)`);
          console.log(`      - ${thumbnailPath} (NEW)`);
          console.log(`      - Original stays: ${storagePath} (UNCHANGED)`);
        }

        stats.processed++;
        console.log(`   ✅ Migration complete for ${image.filename}`);

      } catch (error) {
        console.error(`   ❌ Failed to migrate ${image.filename}:`, error);
        stats.failed++;
        stats.errors.push(`${image.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Brief pause between batches
    if (i + BATCH_SIZE < allImages.length) {
      console.log('\n⏸️  Pausing 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Print final statistics
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total images:     ${stats.total}`);
  console.log(`✅ Processed:      ${stats.processed}`);
  console.log(`⏭️  Skipped:        ${stats.skipped} (already migrated)`);
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  console.log('\n✅ Migration script completed!\n');
}

// Image processing functions (same as in image-processing-service.ts)
async function createOptimizedVersion(
  image: sharp.Sharp,
  metadata: sharp.Metadata
): Promise<Buffer> {
  const maxDimension = 2400;
  const quality = 85;
  const { width = 0, height = 0 } = metadata;

  let resizeWidth: number | undefined;
  let resizeHeight: number | undefined;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      resizeWidth = maxDimension;
    } else {
      resizeHeight = maxDimension;
    }
  }

  let pipeline = image.clone();

  if (resizeWidth || resizeHeight) {
    pipeline = pipeline.resize(resizeWidth, resizeHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  pipeline = pipeline.jpeg({
    quality,
    progressive: true,
    mozjpeg: true,
  });

  return await pipeline.toBuffer();
}

async function createThumbnailVersion(
  image: sharp.Sharp,
  metadata: sharp.Metadata
): Promise<Buffer> {
  const maxDimension = 600;
  const quality = 80;
  const { width = 0, height = 0 } = metadata;

  let resizeWidth: number | undefined;
  let resizeHeight: number | undefined;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      resizeWidth = maxDimension;
    } else {
      resizeHeight = maxDimension;
    }
  } else {
    resizeWidth = width;
    resizeHeight = height;
  }

  let pipeline = image.clone();

  pipeline = pipeline.resize(resizeWidth, resizeHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  pipeline = pipeline.sharpen();

  pipeline = pipeline.jpeg({
    quality,
    progressive: true,
    mozjpeg: true,
  });

  return await pipeline.toBuffer();
}

// Run migration
migrateImages()
  .then(() => {
    console.log('✅ Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
