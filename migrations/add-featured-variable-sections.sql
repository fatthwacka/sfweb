-- Add featured_section and variable_content columns to blog_posts table

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS featured_section JSONB,
ADD COLUMN IF NOT EXISTS variable_content TEXT;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.featured_section IS 'JSON object containing featured content section configuration (image, video, gallery, quote, or CTA)';
COMMENT ON COLUMN blog_posts.variable_content IS 'Additional variable content area for custom HTML or markdown content';