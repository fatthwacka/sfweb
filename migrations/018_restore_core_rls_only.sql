-- RESTORE CORE RLS POLICIES ONLY - No data destruction, no new tables
-- Only restore RLS policies for the original core tables needed by the live site

-- =====================================================
-- HELPER FUNCTIONS (Create or replace - safe)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('super_admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENSURE RLS IS ENABLED (Safe - no data impact)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_site_assets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE POLICIES (Only if they don't exist - safe)
-- =====================================================

-- PROFILES TABLE POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_read_policy') THEN
        CREATE POLICY "profiles_read_policy" ON profiles
          FOR SELECT USING (
            auth.uid() = id OR is_admin_or_staff()
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy') THEN
        CREATE POLICY "profiles_update_policy" ON profiles
          FOR UPDATE USING (
            auth.uid() = id OR is_admin_or_staff()
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_policy') THEN
        CREATE POLICY "profiles_insert_policy" ON profiles
          FOR INSERT WITH CHECK (is_super_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_delete_policy') THEN
        CREATE POLICY "profiles_delete_policy" ON profiles
          FOR DELETE USING (is_super_admin());
    END IF;
END $$;

-- SHOOTS TABLE POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shoots' AND policyname = 'shoots_read_policy') THEN
        CREATE POLICY "shoots_read_policy" ON shoots
          FOR SELECT USING (
            is_admin_or_staff() OR
            (auth.uid() IN (
              SELECT user_id FROM clients WHERE email = shoots.client_id
            )) OR
            (shoots.is_private = false)
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shoots' AND policyname = 'shoots_write_policy') THEN
        CREATE POLICY "shoots_write_policy" ON shoots
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

-- IMAGES TABLE POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'images' AND policyname = 'images_read_policy') THEN
        CREATE POLICY "images_read_policy" ON images
          FOR SELECT USING (
            is_admin_or_staff() OR
            (auth.uid() IN (
              SELECT c.user_id FROM clients c
              JOIN shoots s ON s.client_id = c.email
              WHERE s.id = images.shoot_id
            )) OR
            (images.is_private = false AND EXISTS (
              SELECT 1 FROM shoots WHERE id = images.shoot_id AND is_private = false
            ))
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'images' AND policyname = 'images_write_policy') THEN
        CREATE POLICY "images_write_policy" ON images
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

-- CLIENTS TABLE POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_read_policy') THEN
        CREATE POLICY "clients_read_policy" ON clients
          FOR SELECT USING (
            is_admin_or_staff() OR 
            (auth.uid() = user_id)
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_write_policy') THEN
        CREATE POLICY "clients_write_policy" ON clients
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

-- PACKAGES TABLE POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'packages_read_policy') THEN
        CREATE POLICY "packages_read_policy" ON packages
          FOR SELECT USING (
            is_active = true OR is_admin_or_staff()
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'packages_write_policy') THEN
        CREATE POLICY "packages_write_policy" ON packages
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

-- BOOKINGS TABLE POLICIES (for contact forms)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_read_policy') THEN
        CREATE POLICY "bookings_read_policy" ON bookings
          FOR SELECT USING (is_admin_or_staff());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_insert_policy') THEN
        CREATE POLICY "bookings_insert_policy" ON bookings
          FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_write_policy') THEN
        CREATE POLICY "bookings_write_policy" ON bookings
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

-- LOCAL SITE ASSETS TABLE POLICIES (for homepage content)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'local_site_assets' AND policyname = 'local_site_assets_read_policy') THEN
        CREATE POLICY "local_site_assets_read_policy" ON local_site_assets
          FOR SELECT USING (
            is_active = true OR is_admin_or_staff()
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'local_site_assets' AND policyname = 'local_site_assets_write_policy') THEN
        CREATE POLICY "local_site_assets_write_policy" ON local_site_assets
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

SELECT 'Core RLS policies restored safely - no data destroyed!' as status;