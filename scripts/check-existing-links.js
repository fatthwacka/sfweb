#!/usr/bin/env node

/**
 * Check what shared links are available in the Dropbox account
 */

import 'dotenv/config';

const token = process.env.DROPBOX_ACCESS_TOKEN;

async function checkExistingLinks() {
  console.log('🔍 Checking existing shared links in your Dropbox account...\n');
  
  try {
    // List existing shared links
    const response = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.links.length} existing shared links:`);
      
      data.links.forEach((link, index) => {
        console.log(`\n${index + 1}. ${link.name} (${link['.tag']})`);
        console.log(`   URL: ${link.url}`);
        console.log(`   Path: ${link.path_lower || 'N/A'}`);
        console.log(`   ID: ${link.id}`);
        
        if (link['.tag'] === 'folder') {
          console.log('   🔍 Testing this folder link...');
          
          // Test this folder link
          testFolderLink(link.url);
        }
      });
      
      if (data.links.length === 0) {
        console.log('\n📝 No existing shared links found. You may need to:');
        console.log('   1. Create a new shared link to your images folder');
        console.log('   2. Make sure the link has "Anyone with the link can view" permissions');
        console.log('   3. Copy the link and use it in your migration');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed to list shared links: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  console.log('\n📋 Alternative Approach:');
  console.log('If no working shared links are found, try:');
  console.log('1. Create a NEW shared folder link in Dropbox');
  console.log('2. Set permissions to "Anyone with the link can view"');
  console.log('3. Copy the fresh link and test again');
  console.log('4. Or use a direct folder path instead of a shared link');
}

async function testFolderLink(url) {
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
          url: url,
        },
        recursive: false,
        limit: 5,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ WORKS! Found ${data.entries.length} entries`);
      const images = data.entries.filter(e => /\.(jpg|jpeg|png|gif|webp)$/i.test(e.name));
      console.log(`   📸 Images: ${images.length}`);
    } else {
      console.log(`   ❌ Failed to access`);
    }
  } catch (error) {
    console.log(`   ❌ Error testing link`);
  }
}

checkExistingLinks();