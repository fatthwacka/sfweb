-- ============================================================================
-- Fix Supabase Security Warnings
-- 1. Enable RLS on ai_skills with unrestricted policy
-- 2. Convert views to SECURITY INVOKER
-- ============================================================================

-- 1. Fix ai_skills: Enable RLS and add unrestricted policy
ALTER TABLE ai_skills ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "unrestricted_access" ON ai_skills;
DROP POLICY IF EXISTS "unrestricted_select" ON ai_skills;
DROP POLICY IF EXISTS "unrestricted_insert" ON ai_skills;
DROP POLICY IF EXISTS "unrestricted_update" ON ai_skills;
DROP POLICY IF EXISTS "unrestricted_delete" ON ai_skills;

-- Create unrestricted policies (matches existing pattern)
CREATE POLICY "unrestricted_select" ON ai_skills FOR SELECT USING (true);
CREATE POLICY "unrestricted_insert" ON ai_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "unrestricted_update" ON ai_skills FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "unrestricted_delete" ON ai_skills FOR DELETE USING (true);

-- 2. Fix views: Recreate with SECURITY INVOKER (inherits RLS from underlying tables)

-- Drop and recreate pending_feedback_summary
DROP VIEW IF EXISTS pending_feedback_summary;
CREATE VIEW pending_feedback_summary
WITH (security_invoker = true)
AS
SELECT
  client_id,
  platform,
  tone,
  COUNT(*) as feedback_count,
  AVG(quick_rating_score) as avg_score,
  MIN(created_at) as oldest_feedback,
  MAX(created_at) as newest_feedback
FROM social_content_history
WHERE processed_for_evolution = FALSE
  AND quick_rating_score IS NOT NULL
GROUP BY client_id, platform, tone;

-- Drop and recreate content_for_brand_injection
DROP VIEW IF EXISTS content_for_brand_injection;
CREATE VIEW content_for_brand_injection
WITH (security_invoker = true)
AS
SELECT
  id,
  client_id,
  platform,
  tone,
  hook,
  body,
  cta,
  quick_rating_score,
  CASE
    WHEN quick_rating_score >= 8 THEN 'positive'
    WHEN quick_rating_score <= 3 THEN 'negative'
    ELSE NULL
  END as injection_type
FROM social_content_history
WHERE auto_injected_to_brand = FALSE
  AND (quick_rating_score >= 8 OR quick_rating_score <= 3);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON VIEW pending_feedback_summary IS 'Summary of pending feedback for skill evolution review (SECURITY INVOKER)';
COMMENT ON VIEW content_for_brand_injection IS 'Content ready for brand profile auto-injection (SECURITY INVOKER)';
