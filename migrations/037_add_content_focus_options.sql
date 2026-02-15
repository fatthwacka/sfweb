-- ============================================================================
-- Content Focus Options - Brand-Specific Content Categories
-- ============================================================================
--
-- Adds content_focus_options array to client_brand_profiles for populating
-- the Content Focus pill buttons in Social Content Generator.
--
-- Examples:
--   SlyFox: ['weddings', 'portraits', 'product', 'commercial', 'event', 'graduation']
--   DCS: ['achievement', 'pain point', 'project news']
--
-- ============================================================================

-- Add content_focus_options column
ALTER TABLE client_brand_profiles
ADD COLUMN IF NOT EXISTS content_focus_options TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN client_brand_profiles.content_focus_options IS
  'Array of content focus categories for this brand (e.g., weddings, portraits, achievements). Used to populate Content Focus pill buttons in Social Content Generator.';

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
--
-- Populate via Brand Profile Editor in Content Management Dashboard
--
-- If empty, Social Content Generator will either:
--   1. Show generic defaults based on industry_segment
--   2. Hide the Content Focus row entirely
--
-- Selected content focus is appended to the AI prompt for context
--
-- ============================================================================
