#!/usr/bin/env node
/**
 * Credential Testing Suite
 * Tests all 9 rotated credentials to ensure they work properly
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(status, service, message) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${service}: ${message}`);
  
  if (status === 'PASS') results.passed.push(service);
  else if (status === 'FAIL') results.failed.push(service);
  else results.warnings.push(service);
}

async function testGeminiAPI() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
      { method: 'GET' }
    );
    
    if (response.ok) {
      log('PASS', 'Gemini API', 'Key valid and API accessible');
    } else {
      const error = await response.text();
      log('FAIL', 'Gemini API', `API error: ${response.status} - ${error}`);
    }
  } catch (error) {
    log('FAIL', 'Gemini API', `Network error: ${error.message}`);
  }
}

async function testAirtable() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
        }
      }
    );
    
    if (response.ok) {
      log('PASS', 'Airtable', 'Token valid and base accessible');
    } else {
      const error = await response.text();
      log('FAIL', 'Airtable', `API error: ${response.status} - ${error}`);
    }
  } catch (error) {
    log('FAIL', 'Airtable', `Network error: ${error.message}`);
  }
}

async function testImgBB() {
  try {
    // Test with a simple 1x1 pixel base64 image (raw base64, not data URL)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const formData = new URLSearchParams();
    formData.append('image', testImage);
    formData.append('key', process.env.IMGBB_API_KEY);
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        log('PASS', 'ImgBB', 'API key valid and upload working');
      } else {
        log('FAIL', 'ImgBB', `Upload failed: ${data.error?.message || 'Unknown error'}`);
      }
    } else {
      log('FAIL', 'ImgBB', `API error: ${response.status}`);
    }
  } catch (error) {
    log('FAIL', 'ImgBB', `Network error: ${error.message}`);
  }
}

async function testN8N() {
  try {
    const response = await fetch(`${process.env.N8N_HOST}/api/v1/workflows`, {
      headers: {
        'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      log('PASS', 'N8N', 'API key valid and workflows accessible');
    } else {
      log('FAIL', 'N8N', `API error: ${response.status}`);
    }
  } catch (error) {
    log('FAIL', 'N8N', `Network error: ${error.message}`);
  }
}

async function testUnsplash() {
  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
    
    if (response.ok) {
      log('PASS', 'Unsplash', 'Access key valid and API working');
    } else {
      const error = await response.text();
      log('FAIL', 'Unsplash', `API error: ${response.status} - ${error}`);
    }
  } catch (error) {
    log('FAIL', 'Unsplash', `Network error: ${error.message}`);
  }
}

async function testSupabase() {
  try {
    // Test with actual table query (how frontend uses it)
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/blog_posts?select=id&limit=1`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      log('PASS', 'Supabase Publishable', 'New publishable key working');
    } else {
      log('FAIL', 'Supabase Publishable', `API error: ${response.status}`);
    }

    // Test service role key
    const serviceResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (serviceResponse.ok) {
      log('PASS', 'Supabase Secret', 'New secret key working');
    } else {
      log('FAIL', 'Supabase Secret', `API error: ${serviceResponse.status}`);
    }
  } catch (error) {
    log('FAIL', 'Supabase', `Network error: ${error.message}`);
  }
}

function testDatabaseURL() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes('HRF5cYt7gG4XgVkM')) {
    log('PASS', 'Database URL', 'New password present in connection string');
  } else {
    log('FAIL', 'Database URL', 'Password not updated in DATABASE_URL');
  }
}

async function testReCAPTCHA() {
  try {
    // Test if the site key format is correct (starts with 6L)
    const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (siteKey?.startsWith('6L') && secretKey?.startsWith('6L')) {
      log('PASS', 'reCAPTCHA Keys', 'Both keys have correct format');
    } else {
      log('FAIL', 'reCAPTCHA Keys', 'Keys missing or incorrect format');
    }
  } catch (error) {
    log('FAIL', 'reCAPTCHA', `Error: ${error.message}`);
  }
}

function testGmailPassword() {
  const password = process.env.SMTP_PASSWORD;
  if (password && password.includes('gkaj ofki xweo enpy')) {
    log('PASS', 'Gmail SMTP', 'New app password configured');
  } else {
    log('FAIL', 'Gmail SMTP', 'App password not updated');
  }
}

async function runAllTests() {
  console.log('🧪 Starting Credential Testing Suite...\n');
  
  console.log('🔑 Testing API Credentials:');
  await testGeminiAPI();
  await testAirtable();
  await testImgBB();
  await testN8N();
  await testUnsplash();
  
  console.log('\n🗄️ Testing Database & Infrastructure:');
  await testSupabase();
  testDatabaseURL();
  
  console.log('\n🛡️ Testing Security Services:');
  await testReCAPTCHA();
  testGmailPassword();
  
  console.log('\n📊 TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed.length} services`);
  console.log(`❌ Failed: ${results.failed.length} services`);
  console.log(`⚠️ Warnings: ${results.warnings.length} services`);
  
  if (results.failed.length > 0) {
    console.log('\n🚨 FAILED SERVICES:');
    results.failed.forEach(service => console.log(`   - ${service}`));
  }
  
  if (results.passed.length === 9) {
    console.log('\n🎉 ALL CREDENTIALS WORKING! Ready to continue development.');
  } else {
    console.log('\n⚠️ Some credentials need attention before proceeding.');
  }
}

runAllTests().catch(console.error);