-- Migration: Fix default role for new user signups
-- Issue: New users were being assigned 'client' role instead of 'user'
-- Solution: Update the handle_new_user trigger to read role from user_metadata
--           and default to 'user' instead of 'client'
--
-- NOTE: This migration only modifies the TRIGGER FUNCTION logic.
-- No table data is changed. Existing user profiles are unaffected.
-- The DROP statements just replace the function definition.

-- Drop the existing trigger (required before replacing function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function with corrected logic
-- Using CREATE OR REPLACE so it updates in place if exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    theme_preference,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Read role from metadata, default to 'user' (NOT 'client')
    -- 'user' = generic signups (tools, newsletter, etc.)
    -- 'client' = photography customers (assigned manually when they book)
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'theme_preference', 'dark'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Verify: Show existing users with 'client' role that should be 'user'
-- (These were likely generic signups, not actual photography clients)
-- Run this SELECT manually to check before updating:
-- SELECT id, email, full_name, role, created_at
-- FROM profiles
-- WHERE role = 'client'
-- AND id NOT IN (SELECT user_id FROM clients WHERE user_id IS NOT NULL)
-- ORDER BY created_at DESC;

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates a profile row when a new user signs up via Supabase Auth.
Reads role from user_metadata, defaulting to ''user'' for generic signups.
''client'' role should only be assigned manually when someone books a shoot.';
