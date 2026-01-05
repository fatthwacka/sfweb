-- FINAL: Create site_config table for dynamic website configuration
-- Run this in Supabase SQL editor (PostgreSQL compatible)

-- Create site_config table
CREATE TABLE IF NOT EXISTS public.site_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_config_key ON public.site_config(key);

-- Enable RLS (Row Level Security)
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (PostgreSQL compatible)
DO $$
BEGIN
  -- Only create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'site_config' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
    ON public.site_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Insert initial config data (safe - won't overwrite existing)
INSERT INTO public.site_config (key, value, updated_at) VALUES
('contact', '{}', NOW()),
('home', '{}', NOW()),
('portfolio', '{}', NOW()),
('categoryPages', '{}', NOW()),
('gradients', '{}', NOW()),
('about', '{}', NOW())
ON CONFLICT (key) DO NOTHING;