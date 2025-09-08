#!/usr/bin/env node

/**
 * Create preview-images storage bucket in Supabase
 * This is separate from the main 'images' storage and database tables
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

async function createPreviewImagesBucket() {
  console.log('🚀 Creating preview-images storage bucket...');
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === 'preview-images');
    if (existingBucket) {
      console.log('✅ preview-images bucket already exists!');
      return;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('preview-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ preview-images bucket created successfully!');
    console.log('🔧 Bucket configured for public access with image file types');
    
  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    process.exit(1);
  }
}

createPreviewImagesBucket();