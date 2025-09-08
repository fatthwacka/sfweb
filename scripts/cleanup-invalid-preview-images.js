#!/usr/bin/env node

/**
 * Cleanup invalid preview_images records that have broken URLs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupInvalidPreviewImages() {
  console.log('🧹 Cleaning up invalid preview_images records...\n');
  
  try {
    // Get all preview images
    const { data: images, error } = await supabase
      .from('preview_images')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    if (!images || images.length === 0) {
      console.log('📭 No preview images found in database');
      return;
    }
    
    console.log(`🔍 Found ${images.length} preview images to check\n`);
    
    const invalidIds = [];
    let validCount = 0;
    
    for (const img of images) {
      console.log(`Checking: ${img.filename}...`);
      
      // Check if the URL returns actual image data or HTML
      try {
        const response = await fetch(img.supabase_url, { method: 'HEAD' });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('image/')) {
            console.log(`✅ Valid image: ${img.filename}`);
            validCount++;
          } else if (contentType && contentType.includes('html')) {
            console.log(`❌ Invalid (returns HTML): ${img.filename}`);
            invalidIds.push(img.id);
          } else {
            console.log(`⚠️  Unknown content type: ${contentType} for ${img.filename}`);
            invalidIds.push(img.id);
          }
        } else {
          console.log(`❌ Invalid (HTTP ${response.status}): ${img.filename}`);
          invalidIds.push(img.id);
        }
      } catch (fetchError) {
        console.log(`❌ Invalid (fetch failed): ${img.filename}`);
        invalidIds.push(img.id);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Valid images: ${validCount}`);
    console.log(`- Invalid images: ${invalidIds.length}`);
    
    if (invalidIds.length > 0) {
      console.log(`\n🗑️  Deleting ${invalidIds.length} invalid records...`);
      
      // Delete invalid records
      const { error: deleteError } = await supabase
        .from('preview_images')
        .delete()
        .in('id', invalidIds);
      
      if (deleteError) {
        throw deleteError;
      }
      
      console.log(`✅ Successfully deleted ${invalidIds.length} invalid records`);
    } else {
      console.log(`✅ All images are valid - no cleanup needed`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupInvalidPreviewImages();