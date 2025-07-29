import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase client initialization:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client created successfully');

export interface SupabaseUser {
  id: string;
  email: string;
  role: "staff" | "client" | "super_admin";
  fullName?: string;
}
