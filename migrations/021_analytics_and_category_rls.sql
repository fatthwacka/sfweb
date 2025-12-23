-- RLS Policies for Analytics and Category Hero Tables
-- Generated: 2025-12-23
-- Purpose: Secure visitor analytics and category hero image tables with appropriate access controls

-- ============================================================================
-- 1. VISITOR_SESSIONS TABLE (Underlying table for active_visitors view)
-- Purpose: Real-time visitor session tracking for analytics
-- Access: Public read for anonymous tracking, backend-only writes
-- ============================================================================

-- Enable RLS on the underlying table
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Public: Can view visitor sessions (needed for analytics widgets and active_visitors view)
CREATE POLICY "Anyone can view visitor sessions"
  ON visitor_sessions
  FOR SELECT
  TO public
  USING (true);

-- Backend Service: Can insert/update/delete visitor records
-- Note: Uses service_role key in backend, bypasses RLS naturally
-- This policy ensures no authenticated users can modify data
CREATE POLICY "Only service role can modify visitor sessions"
  ON visitor_sessions
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Fix active_visitors view: Recreate with SECURITY INVOKER
-- This resolves the "Security Definer View" warning
-- The security_invoker option ensures the view runs with caller's privileges, not owner's
DROP VIEW IF EXISTS active_visitors;

CREATE VIEW active_visitors
  WITH (security_invoker = true)
AS
SELECT
  COUNT(DISTINCT session_id) as active_count,
  COUNT(*) as total_sessions
FROM visitor_sessions
WHERE last_activity_at > NOW() - INTERVAL '5 minutes'
  AND is_bot = false;

-- Grant access to the view
GRANT SELECT ON active_visitors TO anon, authenticated, service_role;

-- ============================================================================
-- 2. VISITOR_DAILY_STATS TABLE
-- Purpose: Aggregated daily visitor statistics for historical analytics
-- Access: Public read for analytics displays, backend-only writes
-- ============================================================================

-- Enable RLS
ALTER TABLE visitor_daily_stats ENABLE ROW LEVEL SECURITY;

-- Public: Can view daily visitor statistics (needed for public analytics)
CREATE POLICY "Anyone can view daily visitor stats"
  ON visitor_daily_stats
  FOR SELECT
  TO public
  USING (true);

-- Backend Service: Can insert/update daily aggregations
-- Note: Uses service_role key in backend, bypasses RLS naturally
-- This policy ensures no authenticated users can modify data
CREATE POLICY "Only service role can modify daily stats"
  ON visitor_daily_stats
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 3. CATEGORY_HEROES TABLE
-- Purpose: Hero images for photography category pages
-- Access: Public read for category pages, admin-only writes
-- ============================================================================

-- Enable RLS
ALTER TABLE category_heroes ENABLE ROW LEVEL SECURITY;

-- Public: Can view category hero images (needed by public photography pages)
CREATE POLICY "Anyone can view category heroes"
  ON category_heroes
  FOR SELECT
  TO public
  USING (true);

-- Super Admin & Staff: Full management access
CREATE POLICY "Super admin and staff can manage category heroes"
  ON category_heroes
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('super_admin', 'staff')
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify policies are active:

-- Check RLS status for all three tables
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('visitor_sessions', 'visitor_daily_stats', 'category_heroes')
ORDER BY tablename;

-- Check policy details
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename IN ('visitor_sessions', 'visitor_daily_stats', 'category_heroes')
ORDER BY tablename, policyname;

-- Test policy count (should have 2 policies each for all tables)
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('visitor_sessions', 'visitor_daily_stats', 'category_heroes')
GROUP BY tablename
ORDER BY tablename;

-- Verify active_visitors view exists and works
SELECT * FROM active_visitors LIMIT 1;
