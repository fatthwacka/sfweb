#!/usr/bin/env node
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function testSupabaseDetailed() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Detailed Supabase Testing...\n');
  console.log('URL:', supabaseUrl);
  console.log('Publishable Key:', publishableKey?.substring(0, 20) + '...');
  console.log('Secret Key:', secretKey?.substring(0, 20) + '...\n');

  // Test 1: Basic REST API endpoint
  console.log('📡 Test 1: Basic REST API');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': publishableKey,
        'Authorization': `Bearer ${publishableKey}`
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Try with just apikey header
  console.log('\n📡 Test 2: Just apikey header');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': publishableKey
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 200));
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: Test secret key
  console.log('\n📡 Test 3: Secret key');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 200));
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 4: Check if we need to activate the keys
  console.log('\n📡 Test 4: Check key activation status');
  console.log('Keys may need activation in Supabase dashboard...');
}

testSupabaseDetailed();