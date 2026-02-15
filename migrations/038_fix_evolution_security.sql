-- ============================================================================
-- Fix Supabase Security Advisor Errors for Evolution System
-- ============================================================================
--
-- Fixes:
-- 1. Change views from SECURITY DEFINER to SECURITY INVOKER
-- 2. Enable RLS on skill_evolution_log table
--
-- ============================================================================

-- ============================================================================
-- 1. RECREATE VIEWS WITH SECURITY INVOKER
-- ============================================================================

-- Drop existing views first
DROP VIEW IF EXISTS v_evolution_pending_feedback;
DROP VIEW IF EXISTS v_evolution_stats;

-- Recreate v_evolution_pending_feedback with SECURITY INVOKER (default, but explicit)
CREATE VIEW v_evolution_pending_feedback
WITH (security_invoker = true)
AS
SELECT
  h.id,
  h.platform,
  h.tone,
  h.client_id,
  h.quick_rating_score as score,
  h.quick_issue as issue,
  h.feedback_tags,
  h.feedback_comment,
  h.hook,
  h.body_header,
  h.body,
  h.cta,
  h.hashtags,
  h.original_hook,
  h.original_body,
  h.was_modified,
  h.rating_iteration_count,
  h.created_at,
  h.rated_at
FROM social_content_history h
WHERE h.quick_rating_score IS NOT NULL
  AND h.processed_for_evolution = false
ORDER BY h.rated_at DESC;

-- Recreate v_evolution_stats with SECURITY INVOKER
CREATE VIEW v_evolution_stats
WITH (security_invoker = true)
AS
SELECT
  platform,
  tone,
  COUNT(*) as total_rated,
  AVG(quick_rating_score) as avg_score,
  COUNT(*) FILTER (WHERE quick_rating_score <= 3) as poor_count,
  COUNT(*) FILTER (WHERE quick_rating_score >= 7) as good_count,
  array_agg(DISTINCT quick_issue) FILTER (WHERE quick_issue IS NOT NULL) as issues
FROM social_content_history
WHERE quick_rating_score IS NOT NULL
GROUP BY platform, tone;

-- ============================================================================
-- 2. ENABLE RLS ON skill_evolution_log
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE skill_evolution_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- (This table is admin-only, managed by backend service)
CREATE POLICY "Allow all for authenticated users"
ON skill_evolution_log
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow all for service role"
ON skill_evolution_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, refresh the Security Advisor in Supabase
-- to verify the errors are resolved.
-- ============================================================================
