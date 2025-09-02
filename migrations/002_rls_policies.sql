-- RLS Policies for SlyFox Studios Database
-- Role hierarchy: client < staff < super_admin

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