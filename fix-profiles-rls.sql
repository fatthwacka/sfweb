-- SAFE RLS Policy Check and Fix for profiles table
-- This script is NON-DESTRUCTIVE and only adds missing policies

-- STEP 1: Check what RLS policies currently exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  permissive,
  roles,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- STEP 2: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- STEP 3: Enable RLS if not already enabled (SAFE)
-- This will not affect existing data or policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' AND rowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for profiles table';
  ELSE
    RAISE NOTICE 'RLS already enabled for profiles table';
  END IF;
END $$;

-- STEP 4: Only create policies if they don't exist (SAFE)
-- Policy 1: Users can read their own profile
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" 
    ON profiles 
    FOR SELECT 
    USING (auth.uid() = id);
    RAISE NOTICE 'Created policy: Users can read own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can read own profile';
  END IF;
END $$;

-- Policy 2: Users can update their own profile
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);
    RAISE NOTICE 'Created policy: Users can update own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update own profile';
  END IF;
END $$;

-- Policy 3: Users can insert their own profile (during signup)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON profiles  
    FOR INSERT
    WITH CHECK (auth.uid() = id);
    RAISE NOTICE 'Created policy: Users can insert own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can insert own profile';
  END IF;
END $$;

-- Policy 4: Super admins can manage all profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Admins can manage all profiles'
  ) THEN
    CREATE POLICY "Admins can manage all profiles"
    ON profiles
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
      )
    );
    RAISE NOTICE 'Created policy: Admins can manage all profiles';
  ELSE
    RAISE NOTICE 'Policy already exists: Admins can manage all profiles';
  END IF;
END $$;

-- STEP 5: Final verification - show all policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;