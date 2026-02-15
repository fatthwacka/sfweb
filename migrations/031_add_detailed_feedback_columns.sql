-- ============================================================================
-- Add detailed per-section feedback columns
-- Extends social_content_history for comprehensive feedback collection
-- ============================================================================

-- Add per-section issues (quick feedback chips for each section)
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS section_issues JSONB;
-- Structure: { "hook": ["Too long", "Cliche"], "body": ["Wrong tone"], "cta": [], "hashtags": [] }

-- Add per-section custom comments
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS section_comments JSONB;
-- Structure: { "hook": "The opening was too salesy", "body": "", "cta": "Needs clearer action", "hashtags": "" }

-- Update the quick_rating_score constraint to allow 1-9 scale (not just 9,7,5,2)
-- Drop existing constraint and recreate with full range
ALTER TABLE social_content_history
DROP CONSTRAINT IF EXISTS social_content_history_quick_rating_score_check;

ALTER TABLE social_content_history
ADD CONSTRAINT social_content_history_quick_rating_score_check
CHECK (quick_rating_score >= 1 AND quick_rating_score <= 9);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON COLUMN social_content_history.section_issues IS 'Per-section quick feedback issues (JSONB): { hook: [...], body: [...], cta: [...], hashtags: [...] }';
COMMENT ON COLUMN social_content_history.section_comments IS 'Per-section custom feedback comments (JSONB): { hook: "...", body: "...", cta: "...", hashtags: "..." }';
