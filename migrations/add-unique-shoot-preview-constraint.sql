-- Migration: Add unique constraint to prevent duplicate shoot_previews
-- Date: 2025-09-13
-- Purpose: Ensure atomic preview workflow - only one preview workflow per shoot

-- Add unique constraint on shootId to prevent duplicate preview workflows
ALTER TABLE shoot_previews 
ADD CONSTRAINT unique_shoot_preview_per_shoot UNIQUE (shoot_id);

-- Add helpful index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shoot_previews_active 
ON shoot_previews (shoot_id, is_active) 
WHERE is_active = true;

-- Add index for workflow state queries
CREATE INDEX IF NOT EXISTS idx_shoot_previews_submission_status 
ON shoot_previews (shoot_id, submission_completed, editing_completed);

-- Verify constraint works by checking current data
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) - COUNT(DISTINCT shoot_id) 
    INTO duplicate_count 
    FROM shoot_previews;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate shoot_previews records that need cleanup', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicate shoot_previews found - constraint can be safely applied';
    END IF;
END $$;