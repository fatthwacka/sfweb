-- Add editing_complete column to client_selections table
-- This tracks which images have been edited by the photographer

ALTER TABLE client_selections 
ADD COLUMN IF NOT EXISTS editing_complete BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE client_selections 
ADD COLUMN IF NOT EXISTS editing_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on editing status
CREATE INDEX IF NOT EXISTS idx_client_selections_editing_complete 
ON client_selections(editing_complete);

-- Update the schema to include the new field
COMMENT ON COLUMN client_selections.editing_complete IS 'Tracks whether the photographer has completed editing this image';
COMMENT ON COLUMN client_selections.editing_completed_at IS 'Timestamp when the image editing was marked complete';