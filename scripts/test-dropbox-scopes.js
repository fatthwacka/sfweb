#!/usr/bin/env node

/**
 * Test Dropbox token permissions and scopes
 */

import 'dotenv/config';

const token = process.env.DROPBOX_ACCESS_TOKEN;
const sharedLink = 'https://www.dropbox.com/scl/fo/7vn4j6ot4oqxwha0rhfkb/AI8GCMCQa1KDPNK2_bYNPHE?rlkey=w8rwmgfcg74zuz8q2pcjvb4wi&st=c4n9j5j4&dl=0';

async function testDropboxScopes() {
  console.log('🔍 Testing Dropbox API token scopes and permissions...\n');
  
  // Test 1: Basic account info (should always work)
  console.log('1️⃣ Testing users/get_current_account (basic scope)...');
  try {
    const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Account: ${data.name.display_name} (${data.email})`);
      console.log(`   Account type: ${data.account_type['.tag']}`);
    } else {
      const error = await response.text();
      console.log(`❌ Account info failed: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Account request failed: ${error.message}`);
  }
  
  // Test 2: List user's own files (files.content.read scope)
  console.log('\n2️⃣ Testing files/list_folder on user root (files.content.read scope)...');
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: "",
        recursive: false,
        include_media_info: false,
        limit: 5,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ User files accessible, found ${data.entries.length} entries`);
      if (data.entries.length > 0) {
        console.log('   First few:', data.entries.slice(0, 3).map(e => e.name).join(', '));
      }
    } else {
      const error = await response.text();
      console.log(`❌ User files failed: ${error}`);
    }
  } catch (error) {
    console.log(`❌ User files request failed: ${error.message}`);
  }
  
  // Test 3: Sharing operations (sharing.read scope)
  console.log('\n3️⃣ Testing sharing/get_shared_link_metadata (sharing.read scope)...');
  try {
    const response = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: sharedLink,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Shared link metadata accessible`);
      console.log(`   Type: ${data['.tag']}, Name: ${data.name}`);
      console.log(`   Path: ${data.path_lower || 'N/A'}`);
      console.log(`   ID: ${data.id || 'N/A'}`);
    } else {
      const error = await response.text();
      console.log(`❌ Shared link metadata failed: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Shared link request failed: ${error.message}`);
  }
  
  // Test 4: Try files/list_folder with corrected path for shared links
  console.log('\n4️⃣ Testing files/list_folder with shared_link (corrected approach)...');
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: "",
        shared_link: {
          url: sharedLink,
        },
        recursive: false,
        include_media_info: true,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Shared folder contents accessible, found ${data.entries.length} entries`);
      if (data.entries.length > 0) {
        const images = data.entries.filter(e => /\.(jpg|jpeg|png|gif|webp)$/i.test(e.name));
        console.log(`   Images found: ${images.length}/${data.entries.length}`);
        if (images.length > 0) {
          console.log(`   First few images: ${images.slice(0, 3).map(e => e.name).join(', ')}`);
        }
      }
    } else {
      const error = await response.text();
      console.log(`❌ Shared folder contents failed: ${error}`);
      
      // Parse the error to see if it's a scope issue
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.error_summary.includes('insufficient_permissions')) {
          console.log('🔐 SCOPE ISSUE: Your Dropbox app needs additional permissions!');
          console.log('   Required scopes: files.content.read, sharing.read');
        } else if (errorObj.error_summary.includes('path/not_found')) {
          console.log('🔗 LINK ISSUE: The shared link format or path may be incorrect');
        }
      } catch (parseError) {
        // Error text isn't JSON, continue
      }
    }
  } catch (error) {
    console.log(`❌ Shared folder request failed: ${error.message}`);
  }
  
  console.log('\n📋 Summary and Recommendations:');
  console.log('If tests 1-2 pass but 3-4 fail, you need these scopes in your Dropbox app:');
  console.log('   • files.content.read (to read file contents)');
  console.log('   • sharing.read (to access shared links)');
  console.log('   • files.metadata.read (to get file metadata)');
  console.log('\nTo add scopes:');
  console.log('   1. Go to https://www.dropbox.com/developers/apps');
  console.log('   2. Select your app');
  console.log('   3. Go to "Permissions" tab');
  console.log('   4. Enable the required scopes');
  console.log('   5. Generate a new access token');
}

testDropboxScopes();