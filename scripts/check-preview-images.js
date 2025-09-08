#!/usr/bin/env node

/**
 * Diagnostic script to check preview_images table and test URLs
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPreviewImages() {
  console.log('🔍 Checking preview_images table...\n');
  
  try {
    // Get sample preview images
    const { data: images, error } = await supabase
      .from('preview_images')
      .select('*')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    if (!images || images.length === 0) {
      console.log('📭 No preview images found in database');
      return;
    }
    
    console.log(`📸 Found ${images.length} preview images\n`);
    
    for (const img of images) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 Filename: ${img.filename}`);
      console.log(`📁 Storage Path: ${img.supabase_storage_path}`);
      console.log(`🔗 URL: ${img.supabase_url}`);
      console.log(`📏 Size: ${img.file_size} bytes`);
      console.log(`🗓️ Created: ${img.created_at}`);
      
      // Test if URL is accessible
      if (img.supabase_url) {
        try {
          const response = await fetch(img.supabase_url, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ URL is accessible (${response.status})`);
          } else {
            console.log(`❌ URL returned error: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.log(`❌ Failed to fetch URL: ${fetchError.message}`);
        }
      }
      
      // Check if file exists in storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('gallery-images')
        .list(img.supabase_storage_path?.split('/').slice(0, -1).join('/'), {
          search: img.filename
        });
      
      if (storageError) {
        console.log(`⚠️ Storage check error: ${storageError.message}`);
      } else if (storageData && storageData.length > 0) {
        console.log(`✅ File exists in storage`);
      } else {
        console.log(`❌ File NOT found in storage`);
      }
      
      // Generate fresh public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(img.supabase_storage_path);
      
      console.log(`🔄 Fresh URL: ${publicUrl}`);
      
      if (publicUrl !== img.supabase_url) {
        console.log(`⚠️ Stored URL differs from fresh URL!`);
        console.log(`   Stored: ${img.supabase_url}`);
        console.log(`   Fresh:  ${publicUrl}`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`- Total images checked: ${images.length}`);
    console.log(`- Supabase URL: ${supabaseUrl}`);
    console.log(`- Storage bucket: gallery-images`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPreviewImages();