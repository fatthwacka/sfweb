import { createClient } from '@supabase/supabase-js';

// Test Supabase authentication connection
async function testSupabaseAuth() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service Key present:', !!serviceKey);
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing environment variables');
    return;
  }
  
  // Create admin client
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Test creating a user
    console.log('Testing user creation...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@slyfox.co.za',
      password: 'testpass123',
      email_confirm: true
    });
    
    if (error) {
      console.error('Auth error:', error);
    } else {
      console.log('User created successfully:', data.user?.id);
      
      // Clean up test user
      if (data.user) {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('Test user deleted');
      }
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

// Run test if called directly
if (require.main === module) {
  testSupabaseAuth();
}

export { testSupabaseAuth };