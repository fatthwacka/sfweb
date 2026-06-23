-- ============================================================================
-- Migration 043: Content Ingestion Pipeline
-- Adds ingested articles, topic cooldowns, pipeline runs,
-- and extends existing tables for the research-to-editor pipeline.
-- ============================================================================

-- Enable pg_trgm for title similarity matching (may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. Extend client_input_sources with operational fields
-- ============================================================================

ALTER TABLE client_input_sources
  ADD COLUMN IF NOT EXISTS fetch_interval_minutes integer DEFAULT 1440,  -- Default daily (24h)
  ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;

-- ============================================================================
-- 2. Add pipeline_config to content_clients
-- ============================================================================

ALTER TABLE content_clients
  ADD COLUMN IF NOT EXISTS pipeline_config jsonb DEFAULT '{
    "research": {
      "frequency": "daily",
      "maxItemsPerRun": 20,
      "topicCooldownDays": 30,
      "topicCooldownPosts": 5
    },
    "production": {
      "mode": "manual",
      "articlesPerRun": 1,
      "autoPublishStatus": "draft",
      "minSourcesRequired": 3,
      "skipIfInsufficient": true
    },
    "quality": {
      "minRelevanceScore": 0.6,
      "requireHumanReview": true,
      "notifyOnDraft": true
    }
  }'::jsonb;

-- ============================================================================
-- 3. Add topic fingerprinting to blog_posts
-- ============================================================================

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS topic_fingerprint text,
  ADD COLUMN IF NOT EXISTS topic_keywords text[];

CREATE INDEX IF NOT EXISTS idx_blog_posts_topic_fingerprint
  ON blog_posts(client_id, topic_fingerprint)
  WHERE topic_fingerprint IS NOT NULL;

-- Trigram index for title similarity matching
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_trgm
  ON blog_posts USING gin (title gin_trgm_ops);

-- ============================================================================
-- 4. Ingested articles — raw content holding tank
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingested_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,
  source_id uuid REFERENCES client_input_sources(id) ON DELETE SET NULL,

  -- Content identity
  external_url text,
  url_hash text NOT NULL,                   -- SHA-256 of normalised URL (fast exact dedup)
  title text NOT NULL,
  summary text,                             -- AI-generated 2-3 sentence summary

  -- Topic fingerprinting (critical for anti-repetition)
  topic_fingerprint text,                   -- Short normalised topic phrase
  topic_keywords text[],                    -- Extracted key phrases for matching

  -- Raw content
  raw_content text,                         -- Full extracted text
  source_published_at timestamptz,          -- When the source article was published

  -- Pipeline state
  status text DEFAULT 'new' NOT NULL,       -- 'new', 'screened', 'approved', 'rejected', 'used', 'expired'
  rejection_reason text,                    -- Why it was rejected
  similarity_score numeric(4,3),            -- Highest similarity score found
  matched_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,

  -- Scoring
  relevance_score numeric(4,3),             -- AI-assessed relevance to client niche (0-1)
  freshness_score numeric(4,3),             -- How recent/timely the content is (0-1)

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz                    -- Auto-expire after N days if unused
);

-- Critical indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingested_url_hash
  ON ingested_articles(client_id, url_hash);

CREATE INDEX IF NOT EXISTS idx_ingested_status
  ON ingested_articles(client_id, status);

CREATE INDEX IF NOT EXISTS idx_ingested_topic
  ON ingested_articles(client_id, topic_fingerprint)
  WHERE topic_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingested_created
  ON ingested_articles(created_at);

-- Trigram index for title dedup
CREATE INDEX IF NOT EXISTS idx_ingested_title_trgm
  ON ingested_articles USING gin (title gin_trgm_ops);

-- ============================================================================
-- 5. Topic cooldowns — temporal dedup registry
-- ============================================================================

CREATE TABLE IF NOT EXISTS topic_cooldowns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,
  topic_fingerprint text NOT NULL,
  topic_label text NOT NULL,                -- Human-readable topic name
  last_published_at timestamptz NOT NULL,
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  post_sequence_number integer NOT NULL DEFAULT 0,  -- Which post number this was (for post-count cooldown)
  cooldown_days integer DEFAULT 30,
  cooldown_posts integer DEFAULT 5,         -- Minimum number of posts before topic can resurface
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cooldown_client_topic
  ON topic_cooldowns(client_id, topic_fingerprint);

-- ============================================================================
-- 6. Pipeline runs — execution log for observability
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,
  run_type text DEFAULT 'research' NOT NULL,  -- 'research', 'production'
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  items_discovered integer DEFAULT 0,
  items_screened_out integer DEFAULT 0,
  items_approved integer DEFAULT 0,
  articles_generated integer DEFAULT 0,       -- For production runs
  status text DEFAULT 'running' NOT NULL,     -- 'running', 'completed', 'no_fresh_content', 'error'
  error_message text,
  duration_ms integer,
  metadata jsonb DEFAULT '{}'                 -- Extra run details (sources processed, etc.)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_client
  ON pipeline_runs(client_id, started_at DESC);

-- ============================================================================
-- 7. RLS policies
-- ============================================================================

ALTER TABLE ingested_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Authenticated user access
CREATE POLICY "Allow all access to ingested articles for authenticated users"
  ON ingested_articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to topic cooldowns for authenticated users"
  ON topic_cooldowns FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to pipeline runs for authenticated users"
  ON pipeline_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access to ingested articles"
  ON ingested_articles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to topic cooldowns"
  ON topic_cooldowns FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to pipeline runs"
  ON pipeline_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
