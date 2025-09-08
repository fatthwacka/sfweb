#!/usr/bin/env node

/**
 * Test Dropbox shared link access
 */

import 'dotenv/config';

const token = process.env.DROPBOX_ACCESS_TOKEN;
const sharedLink = 'https://www.dropbox.com/scl/fo/7vn4j6ot4oqxwha0rhfkb/AI8GCMCQa1KDPNK2_bYNPHE?rlkey=w8rwmgfcg74zuz8q2pcjvb4wi&st=c4n9j5j4&dl=0';

async function testDropboxAccess() {
  console.log('🔑 Testing Dropbox access with shared link...');
  console.log(`Token: ${token ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`Link: ${sharedLink}\n`);
  
  try {
    console.log('📋 Testing files/list_folder with shared_link parameter...');
    
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: "", // Start at root of shared folder
        recursive: false,
        include_media_info: true,
        include_deleted: false,
        shared_link: {
          url: sharedLink,
        },
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error response:', error);
      
      // Let's try the sharing/get_shared_link_metadata endpoint
      console.log('\n📋 Trying sharing/get_shared_link_metadata...');
      const sharingResponse = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: sharedLink,
          path: "",
        }),
      });
      
      console.log(`Sharing response status: ${sharingResponse.status} ${sharingResponse.statusText}`);
      
      if (!sharingResponse.ok) {
        const sharingError = await sharingResponse.text();
        console.log('❌ Sharing error response:', sharingError);
      } else {
        const sharingData = await sharingResponse.json();
        console.log('✅ Sharing metadata API works!');
        console.log('Metadata:', JSON.stringify(sharingData, null, 2));
      }
    } else {
      const data = await response.json();
      console.log('✅ Success! Found entries:', data.entries?.length || 0);
      if (data.entries && data.entries.length > 0) {
        console.log('First few entries:', data.entries.slice(0, 3).map(e => ({ name: e.name, type: e['.tag'] })));
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testDropboxAccess();