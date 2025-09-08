#!/usr/bin/env node

/**
 * Test different shared link formats and approaches
 */

import 'dotenv/config';

const token = process.env.DROPBOX_ACCESS_TOKEN;
const originalLink = 'https://www.dropbox.com/scl/fo/7vn4j6ot4oqxwha0rhfkb/AI8GCMCQa1KDPNK2_bYNPHE?rlkey=w8rwmgfcg74zuz8q2pcjvb4wi&st=c4n9j5j4&dl=0';

async function testLinkFormats() {
  console.log('🔗 Testing different Dropbox shared link formats...\n');
  console.log(`Original link: ${originalLink}\n`);
  
  // Test different variations of the link
  const linkVariations = [
    originalLink,
    originalLink.replace('?dl=0', ''),
    originalLink.replace('&dl=0', ''),
    originalLink.replace(/[?&]dl=0/, ''),
    originalLink.replace(/[?&]st=c4n9j5j4/, ''), // Remove st parameter
    'https://www.dropbox.com/scl/fo/7vn4j6ot4oqxwha0rhfkb/AI8GCMCQa1KDPNK2_bYNPHE?rlkey=w8rwmgfcg74zuz8q2pcjvb4wi', // Clean version
  ];
  
  console.log('🧪 Testing each link variation with files/list_folder...\n');
  
  for (let i = 0; i < linkVariations.length; i++) {
    const link = linkVariations[i];
    console.log(`${i + 1}. Testing: ${link.length > 80 ? link.substring(0, 80) + '...' : link}`);
    
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
            url: link,
          },
          recursive: false,
          include_media_info: true,
          limit: 10,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Found ${data.entries.length} entries`);
        
        const images = data.entries.filter(e => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(e.name));
        console.log(`   📸 Images: ${images.length}`);
        
        if (images.length > 0) {
          console.log(`   First few images: ${images.slice(0, 3).map(e => e.name).join(', ')}`);
          
          // Test downloading one file
          const firstImage = images[0];
          console.log(`   🔍 Testing download of: ${firstImage.name}`);
          
          try {
            const downloadResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Dropbox-API-Arg': JSON.stringify({
                  path: firstImage.path_display,
                }),
              },
            });
            
            if (downloadResponse.ok) {
              const contentLength = downloadResponse.headers.get('content-length');
              console.log(`   ✅ Download test successful! Size: ${contentLength} bytes`);
            } else {
              console.log(`   ❌ Download failed: ${downloadResponse.status}`);
            }
          } catch (downloadError) {
            console.log(`   ❌ Download error: ${downloadError.message}`);
          }
        }
        
        // If this worked, we found our answer!
        if (data.entries.length > 0) {
          console.log(`\n🎉 WORKING LINK FOUND! Use this format in your migration service.`);
          break;
        }
      } else {
        const errorText = await response.text();
        try {
          const errorObj = JSON.parse(errorText);
          console.log(`   ❌ Failed: ${errorObj.error_summary}`);
        } catch {
          console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log(); // Empty line between tests
  }
  
  // Also test if we can access shared link metadata
  console.log('🔍 Testing shared link metadata access...\n');
  
  try {
    const response = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: originalLink,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Shared link metadata accessible:');
      console.log(`   Name: ${data.name}`);
      console.log(`   Type: ${data['.tag']}`);
      console.log(`   Path: ${data.path_lower || 'N/A'}`);
      console.log(`   URL: ${data.url}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ Metadata failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Metadata request failed: ${error.message}`);
  }
}

testLinkFormats();