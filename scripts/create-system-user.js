#!/usr/bin/env node

/**
 * Create system user in the actual Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSystemUser() {
  console.log('🚀 Creating system user in Supabase database...');
  
  try {
    // Create system user
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'system@slyfox.co.za',
        role: 'super_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ System user created successfully in Supabase database!');
    
    // Verify it exists
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log('✅ Verified system user:', user);
    
  } catch (error) {
    console.error('❌ Error creating system user:', error.message);
    process.exit(1);
  }
}

createSystemUser();