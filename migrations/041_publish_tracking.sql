-- Migration 041: Add publish_tracking to blog_posts
-- Tracks external post IDs for update-vs-create logic when publishing to WordPress etc.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS publish_tracking jsonb DEFAULT '{}';
COMMENT ON COLUMN blog_posts.publish_tracking IS 'Maps destination_id -> external_id for WordPress update tracking';
