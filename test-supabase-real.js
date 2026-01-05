#!/usr/bin/env node
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function testSupabaseReal() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log('🔍 Testing Supabase with real table queries...\n');

  // Test 1: Query a real table (this is how frontend actually uses it)
  console.log('📡 Test 1: Query blog_posts table (what frontend does)');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/blog_posts?select=id,title&limit=1`, {
      headers: {
        'apikey': publishableKey,
        'Authorization': `Bearer ${publishableKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: Can query blog_posts table');
      console.log('Sample data:', data.length > 0 ? 'Has data' : 'Empty table');
    } else {
      const error = await response.text();
      console.log('❌ FAILED:', error);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }

  // Test 2: Query another table that definitely exists
  console.log('\n📡 Test 2: Query site_gradients table');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/site_gradients?select=id&limit=1`, {
      headers: {
        'apikey': publishableKey,
        'Authorization': `Bearer ${publishableKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    if (response.ok) {
      console.log('✅ SUCCESS: Can query site_gradients table');
    } else {
      const error = await response.text();
      console.log('❌ FAILED:', error);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }

  console.log('\n💡 Note: The /rest/v1/ endpoint always requires secret key for schema access.');
  console.log('   But table queries should work with publishable key if RLS allows it.');
}

testSupabaseReal();