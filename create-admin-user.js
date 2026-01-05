#!/usr/bin/env node

// Script to create admin user in Supabase
// Run with: node create-admin-user.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY; // Secret key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const adminEmail = 'dax.tucker@gmail.com';
  const adminPassword = 'slyfox2025';
  const adminName = 'Dax Tucker';

  try {
    console.log('🔐 Creating admin user with Supabase Auth...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: adminName,
        role: 'super_admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('✅ User already exists in auth.users');
        
        // Get the existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = existingUsers.users.find(u => u.email === adminEmail);
        if (!existingUser) {
          throw new Error('User exists but not found in list');
        }
        
        console.log('📋 Found existing user:', existingUser.id);
        
        // Check/create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', existingUser.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('👤 Creating profile for existing user...');
          const { data: newProfile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: existingUser.id,
              email: adminEmail,
              full_name: adminName,
              role: 'super_admin',
              subscription_tier: 'pro',
              theme_preference: 'dark',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createProfileError) throw createProfileError;
          console.log('✅ Profile created successfully!');
          console.log('📧 Email:', adminEmail);
          console.log('🔑 Password:', adminPassword);
          console.log('👑 Role:', 'super_admin');
        } else if (profileError) {
          throw profileError;
        } else {
          console.log('✅ Profile already exists:', profile.role);
          
          // Update role to super_admin if needed
          if (profile.role !== 'super_admin') {
            console.log('🔄 Updating role to super_admin...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                role: 'super_admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingUser.id);
            
            if (updateError) throw updateError;
            console.log('✅ Role updated to super_admin');
          }
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created:', authData.user.id);
      console.log('👤 Profile should be created by trigger');
      
      // Wait a moment for trigger to run
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if profile was created by trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.log('⚠️ Profile not created by trigger, creating manually...');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: adminEmail,
            full_name: adminName,
            role: 'super_admin',
            subscription_tier: 'pro',
            theme_preference: 'dark',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
        console.log('✅ Profile created manually');
      } else {
        console.log('✅ Profile created by trigger:', profile.role);
        
        // Update role if needed
        if (profile.role !== 'super_admin') {
          console.log('🔄 Updating role to super_admin...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: 'super_admin',
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);
          
          if (updateError) throw updateError;
          console.log('✅ Role updated');
        }
      }
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👑 Role: super_admin');
    console.log('\n🌐 You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Also create other staff users
async function createStaffUsers() {
  const staffEmails = [
    'dax@slyfox.co.za',
    'eben@slyfox.co.za', 
    'kyle@slyfox.co.za'
  ];

  for (const email of staffEmails) {
    try {
      console.log(`\n👥 Creating staff user: ${email}`);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'slyfox2025',
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0].replace('.', ' '),
          role: 'staff'
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`✅ ${email} already exists`);
        } else {
          console.error(`❌ Error creating ${email}:`, authError.message);
        }
      } else {
        console.log(`✅ Created staff user: ${email}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${email}:`, error.message);
    }
  }
}

async function main() {
  await createAdminUser();
  await createStaffUsers();
  console.log('\n✨ All users created successfully!');
}

main().catch(console.error);