#!/usr/bin/env node

/**
 * Test the image migration via API endpoint
 */

// Using native fetch (Node.js 18+)

async function testMigrationAPI() {
  console.log('🚀 Testing image migration via API...\n');
  
  try {
    const testShootId = '1daaa38b-35bf-434b-b078-4c8f0ed32847';
    const testSharedLink = 'https://www.dropbox.com/scl/fo/7vn4j6ot4oqxwha0rhfkb/AI8GCMCQa1KDPNK2_bYNPHE?rlkey=w8rwmgfcg74zuz8q2pcjvb4wi&st=c4n9j5j4&dl=0';
    
    console.log(`Testing migration for shoot: ${testShootId}`);
    console.log(`Shared link: ${testSharedLink}\n`);
    
    const response = await fetch('http://localhost:3000/api/migrate-dropbox-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shootId: testShootId,
        sharedLink: testSharedLink,
        userId: 'test-user-id'
      }),
    });
    
    const result = await response.json();
    
    console.log('📊 API Response:');
    console.log(`- Status: ${response.status} ${response.statusText}`);
    console.log(`- Body:`, result);
    
    if (response.ok && result.success) {
      console.log('\n🎉 Migration API test successful!');
      
      // Now test the preview images API
      console.log('\n🔍 Testing preview images API...');
      const previewResponse = await fetch(`http://localhost:3000/api/preview-images/${testShootId}`);
      const previewData = await previewResponse.json();
      
      console.log(`Preview API Status: ${previewResponse.status}`);
      console.log(`Preview Images Found: ${previewData.images ? previewData.images.length : 0}`);
      
      if (previewData.images && previewData.images.length > 0) {
        const firstImage = previewData.images[0];
        console.log(`\nFirst image details:`);
        console.log(`- Filename: ${firstImage.filename}`);
        console.log(`- Thumbnail URL: ${firstImage.thumbnailUrl}`);
        console.log(`- Full URL: ${firstImage.fullImageUrl}`);
        
        // Test the image URL
        console.log(`\n🔗 Testing image URL...`);
        try {
          const imgResponse = await fetch(firstImage.thumbnailUrl, { method: 'HEAD' });
          console.log(`Image URL Status: ${imgResponse.status} ${imgResponse.statusText}`);
          console.log(`Content-Type: ${imgResponse.headers.get('content-type')}`);
          
          if (imgResponse.ok && imgResponse.headers.get('content-type')?.startsWith('image/')) {
            console.log('✅ Image URL is working correctly!');
          } else {
            console.log('❌ Image URL has issues');
          }
        } catch (error) {
          console.log(`❌ Failed to test image URL: ${error.message}`);
        }
      }
    } else {
      console.log('\n❌ Migration API test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMigrationAPI();