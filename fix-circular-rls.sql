-- Fix circular dependency in RLS policies
-- Remove our duplicate policies and fix the circular reference

-- Remove the duplicate policies we just created (they conflict with existing ones)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles; 
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- The existing policies should work:
-- "profiles_read_policy" with: ((auth.uid() = id) OR is_admin_or_staff())
-- "profiles_update_policy" with: ((auth.uid() = id) OR is_admin_or_staff()) 
-- "profiles_insert_policy" 
-- "profiles_delete_policy" with: is_super_admin()

-- Let's check what the custom functions are doing
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name IN ('is_admin_or_staff', 'is_super_admin')
AND routine_schema = 'public';

-- Show the current policies after cleanup
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;