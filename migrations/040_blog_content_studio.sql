-- ============================================================================
-- Migration 040: Blog Content Studio
-- Adds multi-client support, output destinations, and input sources
-- ============================================================================

-- Add client_id to blog_posts (nullable for backward compatibility with existing posts)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES content_clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_client_id ON blog_posts(client_id);

-- Output destinations table - stores configured publishing targets per client
CREATE TABLE IF NOT EXISTS client_output_destinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,
  destination_type text NOT NULL,  -- 'supabase_static', 'wordpress', 'webflow', 'wix', 'shopify', 'ghost', 'medium'
  display_name text NOT NULL,
  credentials_encrypted text,      -- AES-256-CBC encrypted JSON (server-side only)
  config jsonb DEFAULT '{}',       -- Non-sensitive configuration (site URL, etc.)
  is_active boolean DEFAULT false,
  last_published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Input sources table - stores configured content feeds per client (for future Research Agent)
CREATE TABLE IF NOT EXISTS client_input_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,
  source_type text NOT NULL,       -- 'rss', 'website', 'social', 'research_agent'
  display_name text NOT NULL,
  config jsonb DEFAULT '{}',       -- URLs, selectors, filters
  cron_schedule text,              -- e.g., '0 9 * * 1' for Monday mornings
  is_active boolean DEFAULT false,
  last_fetched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for efficient client-scoped queries
CREATE INDEX IF NOT EXISTS idx_client_output_destinations_client ON client_output_destinations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_input_sources_client ON client_input_sources(client_id);

-- RLS policies for output destinations
ALTER TABLE client_output_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to output destinations for authenticated users"
  ON client_output_destinations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for input sources
ALTER TABLE client_input_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to input sources for authenticated users"
  ON client_input_sources
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role full access (for server-side operations)
CREATE POLICY "Service role full access to output destinations"
  ON client_output_destinations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to input sources"
  ON client_input_sources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
