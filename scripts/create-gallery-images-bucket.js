#!/usr/bin/env node

/**
 * Create gallery-images storage bucket in Supabase
 * This is the bucket used by both regular image uploads and preview image migration
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createGalleryImagesBucket() {
  console.log('🚀 Creating gallery-images storage bucket...');
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', '));
    
    const existingBucket = buckets.find(bucket => bucket.name === 'gallery-images');
    if (existingBucket) {
      console.log('✅ gallery-images bucket already exists!');
      
      // Update bucket to ensure it's public
      const { error: updateError } = await supabase.storage.updateBucket('gallery-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (updateError) {
        console.error('⚠️ Could not update bucket settings:', updateError.message);
      } else {
        console.log('✅ Bucket settings updated to ensure public access');
      }
      
      return;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('gallery-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ gallery-images bucket created successfully!');
    console.log('🔧 Bucket configured for public access with image file types');
    console.log('📍 Bucket will be accessible at:', `${supabaseUrl}/storage/v1/object/public/gallery-images/`);
    
  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    process.exit(1);
  }
}

createGalleryImagesBucket();