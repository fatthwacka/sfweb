-- ============================================================================
-- Social Content Generator - Original Content Tracking
-- Stores both AI-generated original and user-modified final content
-- Enables clean training data + manual example injection
-- ============================================================================

-- Add original content columns (what AI actually generated)
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS original_hook TEXT,
ADD COLUMN IF NOT EXISTS original_body_header TEXT,
ADD COLUMN IF NOT EXISTS original_body TEXT,
ADD COLUMN IF NOT EXISTS original_cta TEXT,
ADD COLUMN IF NOT EXISTS original_hashtags TEXT;

-- Add modification tracking flags
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS was_modified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_curated_example BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- Column Documentation
-- ============================================================================
COMMENT ON COLUMN social_content_history.original_hook IS 'AI-generated hook (immutable after generation)';
COMMENT ON COLUMN social_content_history.original_body_header IS 'AI-generated body header (immutable after generation)';
COMMENT ON COLUMN social_content_history.original_body IS 'AI-generated body (immutable after generation)';
COMMENT ON COLUMN social_content_history.original_cta IS 'AI-generated CTA (immutable after generation)';
COMMENT ON COLUMN social_content_history.original_hashtags IS 'AI-generated hashtags (immutable after generation)';
COMMENT ON COLUMN social_content_history.was_modified IS 'True if user modified any section after generation';
COMMENT ON COLUMN social_content_history.is_curated_example IS 'True if manually injected as ideal training example';

-- ============================================================================
-- Usage Notes:
--
-- For AI-generated content:
--   original_* = what AI produced (never changes)
--   hook/body/cta/etc = current state (may be user-edited)
--   was_modified = true if any original_* differs from current
--   is_curated_example = false
--
-- For manually injected examples:
--   original_* = NULL
--   hook/body/cta/etc = the curated ideal content
--   was_modified = true (technically all manual)
--   is_curated_example = true
--
-- Training data queries:
--   Pure AI feedback: WHERE was_modified = false
--   Human-polished:   WHERE was_modified = true AND is_curated_example = false
--   Curated examples: WHERE is_curated_example = true
-- ============================================================================
