import { createClient } from '@supabase/supabase-js';

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase admin client for server-side operations
export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: 'staff' | 'client';
  themePreference?: 'light' | 'dark';
}

export async function createSupabaseUser(userData: CreateUserData) {
  // Create user in auth.users
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: userData.fullName,
      role: userData.role
    }
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  if (!authUser.user) {
    throw new Error('User creation failed - no user returned');
  }

  // Create corresponding profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authUser.user.id,
      email: userData.email,
      full_name: userData.fullName,
      role: userData.role,
      theme_preference: userData.themePreference || 'dark'
    })
    .select()
    .single();

  if (profileError) {
    // Cleanup auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  return {
    authUser: authUser.user,
    profile
  };
}

export async function seedInitialUsers() {
  const usersToCreate: CreateUserData[] = [
    {
      email: 'dax@slyfox.co.za',
      password: 'slyfox2025',
      fullName: 'Dax Tucker',
      role: 'staff',
      themePreference: 'dark'
    },
    {
      email: 'eben@slyfox.co.za',
      password: 'slyfox2025',
      fullName: 'Eben Schoeman',
      role: 'staff',
      themePreference: 'dark'
    },
    {
      email: 'demo@slyfox.co.za',
      password: 'slyfox2025',
      fullName: 'Demo Client',
      role: 'client',
      themePreference: 'light'
    },
    {
      email: 'sarah.johnson@email.com',
      password: 'slyfox2025',
      fullName: 'Sarah Johnson',
      role: 'client',
      themePreference: 'light'
    },
    {
      email: 'mike.wilson@email.com',
      password: 'slyfox2025',
      fullName: 'Mike Wilson',
      role: 'client',
      themePreference: 'dark'
    }
  ];

  const createdUsers = [];

  for (const userData of usersToCreate) {
    try {
      console.log(`Creating user: ${userData.email}`);
      const result = await createSupabaseUser(userData);
      createdUsers.push(result);
      console.log(`✅ Created user: ${userData.email} (${result.authUser.id})`);
    } catch (error) {
      // If user already exists, that's fine for seeding
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already registered')) {
        console.log(`ℹ️ User already exists: ${userData.email}`);
      } else {
        console.error(`❌ Failed to create user ${userData.email}:`, errorMessage);
      }
    }
  }

  return createdUsers;
}