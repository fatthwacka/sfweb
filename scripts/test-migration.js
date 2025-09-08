#!/usr/bin/env node

/**
 * Test the image migration service with a sample shoot
 */

import { ImageMigrationService } from '../server/services/image-migration-service.js';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dropboxToken = process.env.DROPBOX_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseServiceKey || !dropboxToken) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMigration() {
  console.log('🚀 Testing image migration service...\n');
  
  try {
    // Create a test system user if one doesn't exist
    let { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'system@slyfox.co.za')
      .limit(1);
    
    if (profileError) {
      throw profileError;
    }
    
    let systemUserId;
    if (!profiles || profiles.length === 0) {
      console.log('Creating system user...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          email: 'system@slyfox.co.za',
          full_name: 'System Migration User',
          role: 'super_admin'
        })
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      systemUserId = newProfile.id;
    } else {
      systemUserId = profiles[0].id;
    }
    
    console.log(`System user ID: ${systemUserId}\n`);
    
    // Initialize migration service
    const migrationService = new ImageMigrationService(dropboxToken);
    
    // Test with existing shoot ID from database
    const testShootId = '1daaa38b-35bf-434b-b078-4c8f0ed32847';
    const testSharedLink = 'https://www.dropbox.com/scl/fo/7vn4j6ot4oqxwha0rhfkb/AI8GCMCQa1KDPNK2_bYNPHE?rlkey=w8rwmgfcg74zuz8q2pcjvb4wi&st=c4n9j5j4&dl=0';
    
    console.log(`Testing migration for shoot: ${testShootId}`);
    console.log(`Shared link: ${testSharedLink}\n`);
    
    const result = await migrationService.migrateDropboxToSupabase(
      testShootId,
      testSharedLink,
      systemUserId
    );
    
    console.log('\\n📊 Migration Results:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Migrated count: ${result.migratedCount}`);
    console.log(`- Errors: ${result.errors.length}`);
    console.log(`- Batch ID: ${result.batchId}`);
    
    if (result.errors.length > 0) {
      console.log('\\n❌ Errors:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (result.success) {
      console.log('\\n🎉 Migration completed successfully!');
      
      // Test the preview images API
      console.log('\\n🔍 Testing preview images API...');
      const { data: previewImages } = await supabase
        .from('preview_images')
        .select('*')
        .eq('shoot_id', testShootId)
        .eq('migration_batch_id', result.batchId);
      
      if (previewImages && previewImages.length > 0) {
        console.log(`✅ Found ${previewImages.length} migrated images in database`);
        
        // Test first image URL
        const firstImage = previewImages[0];
        console.log(`\\n🔗 Testing first image URL: ${firstImage.supabase_url}`);
        
        try {
          const response = await fetch(firstImage.supabase_url, { method: 'HEAD' });
          console.log(`Response: ${response.status} ${response.statusText}`);
          console.log(`Content-Type: ${response.headers.get('content-type')}`);
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              console.log('✅ Image URL is working correctly!');
            } else {
              console.log('❌ URL returns non-image content');
            }
          }
        } catch (error) {
          console.log(`❌ Failed to fetch image: ${error.message}`);
        }
      } else {
        console.log('❌ No migrated images found in database');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testMigration();