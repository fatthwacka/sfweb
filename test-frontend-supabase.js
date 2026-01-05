#!/usr/bin/env node
/**
 * Test Frontend Supabase Connection
 * Tests the exact same connection the frontend will use
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Frontend Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey?.substring(0, 20) + '...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create the same client the frontend uses
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

async function testFrontendConnection() {
  try {
    // Test 1: Query featured images (what PortfolioShowcase does)
    console.log('📡 Test 1: Featured images query');
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('*')
      .eq('featured_image', true)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('❌ Images query failed:', imagesError.message);
    } else {
      console.log('✅ Images query succeeded! Found', images?.length || 0, 'featured images');
      if (images && images.length > 0) {
        console.log('Sample image:', {
          id: images[0].id,
          filename: images[0].filename,
          featured: images[0].featured_image
        });
      }
    }

    console.log('');

    // Test 2: Query blog posts (what Stories page does)
    console.log('📡 Test 2: Blog posts query');
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    if (postsError) {
      console.error('❌ Blog posts query failed:', postsError.message);
    } else {
      console.log('✅ Blog posts query succeeded! Found', posts?.length || 0, 'published posts');
      if (posts && posts.length > 0) {
        console.log('Sample post:', {
          id: posts[0].id,
          title: posts[0].title,
          status: posts[0].status
        });
      }
    }

    console.log('');

    // Test 3: Query site gradients
    console.log('📡 Test 3: Site gradients query');
    const { data: gradients, error: gradientsError } = await supabase
      .from('site_gradients')
      .select('*')
      .limit(3);

    if (gradientsError) {
      console.error('❌ Gradients query failed:', gradientsError.message);
    } else {
      console.log('✅ Gradients query succeeded! Found', gradients?.length || 0, 'gradients');
      if (gradients && gradients.length > 0) {
        console.log('Sample gradient:', {
          id: gradients[0].id,
          sectionKey: gradients[0].sectionKey,
          color1: gradients[0].color1
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testFrontendConnection();