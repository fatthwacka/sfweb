-- ============================================================================
-- Social Content Feedback & Evolution System
-- Captures content history, ratings, and skill evolution tracking
-- Part of the self-improving content generation architecture
-- ============================================================================

-- 1. Content History Table
-- Stores all generated content with ratings and feedback
CREATE TABLE IF NOT EXISTS social_content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES content_clients(id) ON DELETE SET NULL,

  -- Generation context
  platform VARCHAR(50) NOT NULL,
  tone VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  original_prompt TEXT,
  brand_elements JSONB,

  -- Generated content (individual sections)
  hook TEXT,
  body_header TEXT,
  body TEXT,
  cta TEXT,
  hashtags TEXT,
  assembled_content TEXT, -- Full post for easy display

  -- Quick feedback (frictionless mode)
  quick_rating VARCHAR(20) CHECK (quick_rating IN ('excellent', 'good', 'neutral', 'poor')),
  quick_rating_score SMALLINT CHECK (quick_rating_score IN (9, 7, 5, 2)),
  quick_issue VARCHAR(100), -- Optional issue tag for poor ratings

  -- Detailed feedback (optional expanded mode)
  section_ratings JSONB, -- { hook: 8, bodyHeader: 7, body: 6, cta: 9, hashtags: 5 }
  feedback_tags TEXT[], -- ['too_formal', 'great_hook', 'wrong_cta']
  feedback_comment TEXT,

  -- Evolution tracking
  processed_for_evolution BOOLEAN DEFAULT FALSE,
  auto_injected_to_brand BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rated_at TIMESTAMPTZ,

  -- Store the full constructed prompt for debugging/analysis
  full_prompt TEXT,
  generation_time_ms INT
);

-- 2. Skill Proposal History Table
-- Tracks skill modification proposals and rejections for learning
CREATE TABLE IF NOT EXISTS skill_proposal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_key VARCHAR(100) NOT NULL,

  -- Proposal details
  proposal_hash TEXT NOT NULL, -- Hash for similarity matching
  change_summary TEXT NOT NULL,
  change_type VARCHAR(20) CHECK (change_type IN ('add', 'modify', 'remove')),
  current_text TEXT,
  proposed_text TEXT,

  -- Analysis context
  issue_description TEXT,
  occurrences INT DEFAULT 1,
  confidence INT CHECK (confidence BETWEEN 0 AND 100),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  reasoning TEXT,

  -- Decision tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  decision_reason TEXT,
  rejection_count INT DEFAULT 0, -- Incremented on similar rejections

  -- Attribution
  based_on_feedback_ids UUID[], -- References to social_content_history
  feedback_count INT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Content history: find unprocessed feedbacks for evolution
CREATE INDEX IF NOT EXISTS idx_content_history_unprocessed
  ON social_content_history(client_id, processed_for_evolution)
  WHERE processed_for_evolution = FALSE AND quick_rating_score IS NOT NULL;

-- Content history: find high-rated content for brand example injection
CREATE INDEX IF NOT EXISTS idx_content_history_high_rated
  ON social_content_history(client_id, quick_rating_score DESC)
  WHERE quick_rating_score >= 8 AND auto_injected_to_brand = FALSE;

-- Content history: find low-rated content for negative examples
CREATE INDEX IF NOT EXISTS idx_content_history_low_rated
  ON social_content_history(client_id, quick_rating_score)
  WHERE quick_rating_score <= 3 AND auto_injected_to_brand = FALSE;

-- Content history: client + platform for analytics
CREATE INDEX IF NOT EXISTS idx_content_history_client_platform
  ON social_content_history(client_id, platform, created_at DESC);

-- Proposal history: find rejected proposals for a skill
CREATE INDEX IF NOT EXISTS idx_proposal_rejected
  ON skill_proposal_history(skill_key, status)
  WHERE status = 'rejected';

-- Proposal history: pending proposals
CREATE INDEX IF NOT EXISTS idx_proposal_pending
  ON skill_proposal_history(status, created_at DESC)
  WHERE status = 'pending';

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE social_content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_proposal_history ENABLE ROW LEVEL SECURITY;

-- Content history: authenticated users can read all, only service role can write
CREATE POLICY "social_content_history_read_authenticated"
  ON social_content_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "social_content_history_insert_authenticated"
  ON social_content_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "social_content_history_update_authenticated"
  ON social_content_history
  FOR UPDATE
  TO authenticated
  USING (true);

-- Skill proposal history: similar access pattern
CREATE POLICY "skill_proposal_history_read_authenticated"
  ON skill_proposal_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "skill_proposal_history_insert_authenticated"
  ON skill_proposal_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "skill_proposal_history_update_authenticated"
  ON skill_proposal_history
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- Helpful Views
-- ============================================================================

-- View: Pending feedbacks summary for evolution review
CREATE OR REPLACE VIEW pending_feedback_summary AS
SELECT
  client_id,
  platform,
  tone,
  COUNT(*) as feedback_count,
  AVG(quick_rating_score) as avg_score,
  MIN(created_at) as oldest_feedback,
  MAX(created_at) as newest_feedback
FROM social_content_history
WHERE processed_for_evolution = FALSE
  AND quick_rating_score IS NOT NULL
GROUP BY client_id, platform, tone;

-- View: Content ready for brand injection
CREATE OR REPLACE VIEW content_for_brand_injection AS
SELECT
  id,
  client_id,
  platform,
  tone,
  hook,
  body,
  cta,
  quick_rating_score,
  CASE
    WHEN quick_rating_score >= 8 THEN 'positive'
    WHEN quick_rating_score <= 3 THEN 'negative'
    ELSE NULL
  END as injection_type
FROM social_content_history
WHERE auto_injected_to_brand = FALSE
  AND (quick_rating_score >= 8 OR quick_rating_score <= 3);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE social_content_history IS 'Stores generated social content with user ratings and feedback for continuous improvement';
COMMENT ON COLUMN social_content_history.quick_rating IS 'Frictionless rating: excellent (9), good (7), neutral (5), poor (2)';
COMMENT ON COLUMN social_content_history.processed_for_evolution IS 'True once feedback has been analysed by /sc:skill-evolution';
COMMENT ON COLUMN social_content_history.auto_injected_to_brand IS 'True once high/low rated content has been added to brand examples';

COMMENT ON TABLE skill_proposal_history IS 'Tracks skill modification proposals and their outcomes for learning what works';
COMMENT ON COLUMN skill_proposal_history.proposal_hash IS 'Hash of proposed change for detecting similar proposals';
COMMENT ON COLUMN skill_proposal_history.rejection_count IS 'Number of times similar proposals have been rejected - blocks at 3';
