-- RLS Policies for Preview Selection System Tables
-- Generated: 2025-10-15
-- Purpose: Secure preview selection workflow tables with appropriate access controls

-- ============================================================================
-- 1. SHOOT_PREVIEWS TABLE
-- ============================================================================
-- Enable RLS
ALTER TABLE shoot_previews ENABLE ROW LEVEL SECURITY;

-- Super Admin & Staff: Full access
CREATE POLICY "Super admin and staff can manage shoot previews"
  ON shoot_previews
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  );

-- Clients: Can view their own shoot previews
CREATE POLICY "Clients can view their own shoot previews"
  ON shoot_previews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shoots
      WHERE shoots.id = shoot_previews.shoot_id
      AND shoots.client_id = (auth.jwt() ->> 'email')::text
    )
  );

-- ============================================================================
-- 2. CLIENT_SELECTIONS TABLE
-- ============================================================================
-- Enable RLS
ALTER TABLE client_selections ENABLE ROW LEVEL SECURITY;

-- Super Admin & Staff: Full access
CREATE POLICY "Super admin and staff can manage all selections"
  ON client_selections
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  );

-- Clients: Can view and modify their own selections
CREATE POLICY "Clients can manage their own selections"
  ON client_selections
  FOR ALL
  TO authenticated
  USING (
    client_id = (auth.jwt() ->> 'sub')::uuid
  )
  WITH CHECK (
    client_id = (auth.jwt() ->> 'sub')::uuid
  );

-- ============================================================================
-- 3. SELECTION_PACKAGES TABLE
-- ============================================================================
-- Enable RLS
ALTER TABLE selection_packages ENABLE ROW LEVEL SECURITY;

-- Super Admin & Staff: Full access
CREATE POLICY "Super admin and staff can manage all selection packages"
  ON selection_packages
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  );

-- Clients: Can view their own selection packages
CREATE POLICY "Clients can view their own selection packages"
  ON selection_packages
  FOR SELECT
  TO authenticated
  USING (
    client_id = (auth.jwt() ->> 'sub')::uuid
  );

-- ============================================================================
-- 4. PREVIEW_IMAGES TABLE
-- ============================================================================
-- Enable RLS
ALTER TABLE preview_images ENABLE ROW LEVEL SECURITY;

-- Super Admin & Staff: Full access
CREATE POLICY "Super admin and staff can manage all preview images"
  ON preview_images
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  );

-- Clients: Can view preview images for their shoots
CREATE POLICY "Clients can view preview images for their shoots"
  ON preview_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shoots
      WHERE shoots.id = preview_images.shoot_id
      AND shoots.client_id = (auth.jwt() ->> 'email')::text
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify policies are active:

-- Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('shoot_previews', 'client_selections', 'selection_packages', 'preview_images')
ORDER BY tablename;

-- Check policy count
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('shoot_previews', 'client_selections', 'selection_packages', 'preview_images')
ORDER BY tablename, policyname;
