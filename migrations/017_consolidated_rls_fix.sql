-- CONSOLIDATED RLS FIX: Restore all working policies + add preview_images table
-- This consolidates all working RLS policies from 001 and 002, plus adds the new preview_images table

-- =====================================================
-- HELPER FUNCTIONS (from 001_enable_rls.sql)
-- =====================================================

-- Helper function to get current user's role
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

-- Helper function to check if user is admin or staff
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('super_admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON ALL TABLES (from 001_enable_rls.sql)
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
-- CREATE NEW PREVIEW_IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS preview_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shoot_id UUID NOT NULL REFERENCES shoots(id),
  filename TEXT NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_storage_path TEXT NOT NULL,
  original_dropbox_path TEXT,
  file_size INTEGER,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  migration_batch_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new table
ALTER TABLE preview_images ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_preview_images_shoot_id ON preview_images(shoot_id);
CREATE INDEX IF NOT EXISTS idx_preview_images_batch_id ON preview_images(migration_batch_id);

-- =====================================================
-- DROP ALL EXISTING POLICIES (clean slate)
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Users policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_write_policy" ON users;

-- Clients policies
DROP POLICY IF EXISTS "clients_read_policy" ON clients;
DROP POLICY IF EXISTS "clients_write_policy" ON clients;

-- Shoots policies
DROP POLICY IF EXISTS "shoots_read_policy" ON shoots;
DROP POLICY IF EXISTS "shoots_write_policy" ON shoots;

-- Images policies
DROP POLICY IF EXISTS "images_read_policy" ON images;
DROP POLICY IF EXISTS "images_write_policy" ON images;

-- Packages policies
DROP POLICY IF EXISTS "packages_read_policy" ON packages;
DROP POLICY IF EXISTS "packages_write_policy" ON packages;

-- Analytics policies
DROP POLICY IF EXISTS "analytics_read_policy" ON analytics;
DROP POLICY IF EXISTS "analytics_insert_policy" ON analytics;
DROP POLICY IF EXISTS "analytics_update_delete_policy" ON analytics;

-- Favorites policies
DROP POLICY IF EXISTS "favorites_user_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_admin_read_policy" ON favorites;

-- Bookings policies
DROP POLICY IF EXISTS "bookings_read_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_update_delete_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings;

-- Local site assets policies
DROP POLICY IF EXISTS "local_site_assets_read_policy" ON local_site_assets;
DROP POLICY IF EXISTS "local_site_assets_write_policy" ON local_site_assets;

-- Preview images policies (in case they exist)
DROP POLICY IF EXISTS "preview_images_read_policy" ON preview_images;
DROP POLICY IF EXISTS "preview_images_write_policy" ON preview_images;

-- =====================================================
-- RECREATE ALL POLICIES (from 002_rls_policies.sql)
-- =====================================================

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can read their own profile, staff/admin can read all
CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin_or_staff()
  );

-- Users can update their own profile, staff/admin can update all
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR is_admin_or_staff()
  );

-- Only super_admin can insert new profiles
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (is_super_admin());

-- Only super_admin can delete profiles
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (is_super_admin());

-- =====================================================
-- USERS TABLE POLICIES (Legacy compatibility)
-- =====================================================

-- Staff and admin can read all users, clients can read their own
CREATE POLICY "users_read_policy" ON users
  FOR SELECT USING (is_admin_or_staff());

-- Only super_admin can manage users table
CREATE POLICY "users_write_policy" ON users
  FOR ALL USING (is_super_admin());

-- =====================================================
-- CLIENTS TABLE POLICIES
-- =====================================================

-- Staff and admin can read all clients, clients can read their own record
CREATE POLICY "clients_read_policy" ON clients
  FOR SELECT USING (
    is_admin_or_staff() OR 
    (auth.uid() = user_id)
  );

-- Staff and admin can create/update clients
CREATE POLICY "clients_write_policy" ON clients
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- SHOOTS TABLE POLICIES
-- =====================================================

-- Staff and admin can read all shoots, clients can read their own shoots
CREATE POLICY "shoots_read_policy" ON shoots
  FOR SELECT USING (
    is_admin_or_staff() OR
    (auth.uid() IN (
      SELECT user_id FROM clients WHERE email = shoots.client_id
    )) OR
    (shoots.is_private = false)
  );

-- Staff and admin can create/update shoots
CREATE POLICY "shoots_write_policy" ON shoots
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- IMAGES TABLE POLICIES
-- =====================================================

-- Staff and admin can read all images, clients can read images from their shoots
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

-- Staff and admin can manage all images
CREATE POLICY "images_write_policy" ON images
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- PACKAGES TABLE POLICIES
-- =====================================================

-- Everyone can read active packages, staff and admin can read all
CREATE POLICY "packages_read_policy" ON packages
  FOR SELECT USING (
    is_active = true OR is_admin_or_staff()
  );

-- Only staff and admin can manage packages
CREATE POLICY "packages_write_policy" ON packages
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- ANALYTICS TABLE POLICIES
-- =====================================================

-- Users can read their own analytics, staff and admin can read all
CREATE POLICY "analytics_read_policy" ON analytics
  FOR SELECT USING (
    auth.uid() = user_id OR is_admin_or_staff()
  );

-- Anyone can insert analytics (for tracking), only admin can update/delete
CREATE POLICY "analytics_insert_policy" ON analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_update_delete_policy" ON analytics
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- FAVORITES TABLE POLICIES
-- =====================================================

-- Users can only see and manage their own favorites
CREATE POLICY "favorites_user_policy" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Staff and admin can read all favorites
CREATE POLICY "favorites_admin_read_policy" ON favorites
  FOR SELECT USING (is_admin_or_staff());

-- =====================================================
-- BOOKINGS TABLE POLICIES
-- =====================================================

-- Staff and admin can read all bookings
CREATE POLICY "bookings_read_policy" ON bookings
  FOR SELECT USING (is_admin_or_staff());

-- Anyone can create bookings (public contact form)
CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT WITH CHECK (true);

-- Only staff and admin can update/delete bookings
CREATE POLICY "bookings_update_delete_policy" ON bookings
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "bookings_delete_policy" ON bookings
  FOR DELETE USING (is_admin_or_staff());

-- =====================================================
-- LOCAL SITE ASSETS TABLE POLICIES
-- =====================================================

-- Everyone can read active assets, staff and admin can read all
CREATE POLICY "local_site_assets_read_policy" ON local_site_assets
  FOR SELECT USING (
    is_active = true OR is_admin_or_staff()
  );

-- Only staff and admin can manage site assets
CREATE POLICY "local_site_assets_write_policy" ON local_site_assets
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- PREVIEW_IMAGES TABLE POLICIES (NEW)
-- =====================================================

-- Staff and admin can read all preview images
CREATE POLICY "preview_images_read_policy" ON preview_images
  FOR SELECT USING (
    is_admin_or_staff() OR
    (auth.uid() IN (
      SELECT c.user_id FROM clients c
      JOIN shoots s ON s.client_id = c.email
      WHERE s.id = preview_images.shoot_id
    ))
  );

-- Only staff and admin can manage preview images
CREATE POLICY "preview_images_write_policy" ON preview_images
  FOR ALL USING (is_admin_or_staff());

-- =====================================================
-- FINAL STATUS
-- =====================================================

SELECT 'Consolidated RLS fix completed successfully! All policies restored + preview_images table added.' as status;