import { createSupabaseUser } from './supabase-auth.js';

// Initialize the first admin user for the system
export async function initializeAdmin() {
  console.log('🔑 Initializing admin user...');
  
  try {
    const adminData = {
      email: 'admin@slyfox.co.za',
      password: 'SlyfoxAdmin2025!',
      fullName: 'SlyFox Admin',
      role: 'staff' as const,
      themePreference: 'dark' as const
    };

    const result = await createSupabaseUser(adminData);
    console.log('✅ Admin user created successfully:', result.authUser.id);
    console.log('📧 Email:', result.authUser.email);
    console.log('👤 Profile ID:', result.profile.id);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
      console.log('ℹ️ Admin user already exists');
      return null;
    } else {
      console.error('❌ Failed to create admin user:', errorMessage);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeAdmin().catch(console.error);
}