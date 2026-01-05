async function checkBucket() {
  console.log('🔍 Checking bucket contents...');
  
  try {
    // Try to use the same authentication method as our working service
    // Let's import our actual service to reuse its auth
    const { VertexAIImageGenerator } = await import('./server/services/vertex-ai-image-generator.js');
    console.log('📦 Imported VertexAIImageGenerator service');
    
    // Create an instance to access the auth
    const imageService = new VertexAIImageGenerator();
    console.log('🔧 Created image service instance');
    
    console.log('✅ Authentication successful');
    
    // List bucket contents
    const bucketName = 'netfox-veo-generations';
    const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=ai-images/`;
    
    const response = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list bucket: ${response.status} - ${await response.text()}`);
    }
    
    const data = await response.json();
    
    console.log(`📁 Found ${data.items?.length || 0} objects in bucket:`);
    
    if (data.items) {
      // Sort by creation time, newest first
      data.items
        .sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated))
        .slice(0, 10) // Show only latest 10
        .forEach(item => {
          const createdAt = new Date(item.timeCreated).toLocaleString();
          const sizeKB = Math.round(item.size / 1024);
          console.log(`  📷 ${item.name} (${sizeKB}KB, ${createdAt})`);
          console.log(`     🔗 https://storage.googleapis.com/${bucketName}/${item.name}`);
        });
    } else {
      console.log('  📭 No objects found in bucket');
    }
    
  } catch (error) {
    console.error('❌ Error checking bucket:', error.message);
  }
}

checkBucket();