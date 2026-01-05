/**
 * Check for latest files in the Cloud Storage bucket to see if Gemini images are being saved
 */
import { GoogleAuth } from 'google-auth-library';

async function checkLatestBucketFiles() {
  console.log('🔍 Checking for latest files in bucket...');
  
  try {
    // Use the same authentication as our service
    const auth = new GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        client_id: '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`,
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    const bucketName = 'netfox-veo-generations';
    const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=ai-images/&orderBy=timeCreated desc&maxResults=10`;
    
    const response = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list bucket: ${response.status} - ${await response.text()}`);
    }
    
    const data = await response.json();
    
    console.log(`📁 Found ${data.items?.length || 0} recent objects in bucket:`);
    
    if (data.items) {
      console.log('\n🕒 Latest 10 files (newest first):');
      data.items.forEach((item, index) => {
        const createdAt = new Date(item.timeCreated);
        const sizeKB = Math.round(item.size / 1024);
        const timeAgo = Math.round((Date.now() - createdAt.getTime()) / 1000 / 60); // minutes ago
        console.log(`  ${index + 1}. ${item.name}`);
        console.log(`     📏 ${sizeKB}KB | ⏰ ${timeAgo} mins ago | 🕐 ${createdAt.toLocaleString()}`);
        console.log(`     🔗 https://storage.googleapis.com/${bucketName}/${item.name}`);
        console.log('');
      });
      
      // Check if any files were created in the last 10 minutes
      const recent = data.items.filter(item => {
        const ageMinutes = (Date.now() - new Date(item.timeCreated).getTime()) / 1000 / 60;
        return ageMinutes <= 10;
      });
      
      if (recent.length > 0) {
        console.log(`✅ Found ${recent.length} files created in the last 10 minutes - generation might be working!`);
      } else {
        console.log(`❌ No files created in the last 10 minutes - parsing/upload issue confirmed`);
      }
      
    } else {
      console.log('  📭 No objects found in bucket');
    }
    
  } catch (error) {
    console.error('❌ Error checking bucket:', error.message);
  }
}

checkLatestBucketFiles();