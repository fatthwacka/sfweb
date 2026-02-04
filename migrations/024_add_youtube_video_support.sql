-- Migration: Add YouTube video support to videos table
-- Date: 2026-02-03
-- Description: Extends videos table to support both native uploads and YouTube embeds

-- Add source_type column to distinguish native vs YouTube videos
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'native';

-- Add external_id for YouTube video ID (e.g., 'dQw4w9WgXcQ')
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add external_url for full YouTube URL reference
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN videos.source_type IS 'Video source: native (uploaded) or youtube (embedded)';
COMMENT ON COLUMN videos.external_id IS 'YouTube video ID for youtube source type';
COMMENT ON COLUMN videos.external_url IS 'Full external URL for reference';

-- Create index for querying by source type
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);
