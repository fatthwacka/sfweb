-- Add submission_completed flag to shoot_previews table
-- This tracks when a client has finalized their image selection

ALTER TABLE shoot_previews 
ADD COLUMN IF NOT EXISTS submission_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE shoot_previews 
ADD COLUMN IF NOT EXISTS submission_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE shoot_previews 
ADD COLUMN IF NOT EXISTS submission_completed_by TEXT;

-- Add index for faster queries on submission status
CREATE INDEX IF NOT EXISTS idx_shoot_previews_submission_completed 
ON shoot_previews(submission_completed) 
WHERE submission_completed = TRUE;