#!/usr/bin/env node
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function checkUsers() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('👥 Checking users in profiles table...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,email,role,full_name`, {
      headers: {
        'apikey': publishableKey,
        'Authorization': `Bearer ${publishableKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: Can query profiles table');
      console.log('Total users:', data.length);
      console.log('\nUser details:');
      data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - Role: ${user.role} - Name: ${user.full_name || 'No name'}`);
      });
    } else {
      const error = await response.text();
      console.log('❌ FAILED:', error);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }

  console.log('\n🔐 Checking auth.users table (requires service role key)...');
  // This will likely fail with publishable key, but let's try
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) {
      console.log('⚠️ No SUPABASE_SERVICE_KEY found in .env');
      return;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/auth.users?select=id,email`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Auth users status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: Can query auth.users table');
      console.log('Total auth users:', data.length);
    } else {
      const error = await response.text();
      console.log('❌ Auth query failed (expected with publishable key):', error.substring(0, 100));
    }
  } catch (error) {
    console.log('❌ Auth query error:', error.message);
  }
}

checkUsers();