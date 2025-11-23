-- SQL script to create video-thumbnails bucket in Supabase
-- Run this in the Supabase SQL editor

-- Create the bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-thumbnails', 'video-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Set the allowed MIME types for the bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png']::text[]
WHERE id = 'video-thumbnails';

-- Create a policy to allow public access to thumbnails
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'video-thumbnails');

-- Create a policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'video-thumbnails');

-- Create a policy to allow service role to manage thumbnails
CREATE POLICY "Service role can manage thumbnails" ON storage.objects
FOR ALL USING (bucket_id = 'video-thumbnails')
WITH CHECK (bucket_id = 'video-thumbnails');