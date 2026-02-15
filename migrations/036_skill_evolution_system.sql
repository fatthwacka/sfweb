-- ============================================================================
-- Skill Evolution System - Self-Improving AI Orchestrator
-- ============================================================================
--
-- This migration adds:
-- 1. Evolution log table (audit trail of all skill changes)
-- 2. The orchestrator's own skill (can self-modify)
-- 3. Helper columns on history table for iteration tracking
--
-- NOTE: We keep iterations simple - just update the existing history record
-- with each re-rating (tracking count), rather than a separate table.
--
-- ============================================================================

-- ============================================================================
-- 1. EVOLUTION LOG TABLE
-- Audit trail of every skill/brand modification made by orchestrator
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_evolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was changed
  target_type TEXT NOT NULL CHECK (target_type IN ('skill', 'brand_positive', 'brand_negative', 'brand_forbidden', 'orchestrator_self')),
  target_key TEXT NOT NULL,           -- skill_key or client_id

  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN ('append', 'replace', 'remove', 'rewrite')),
  previous_value TEXT,                -- What it was before
  new_value TEXT,                     -- What it is now

  -- Reasoning (from orchestrator)
  reasoning TEXT NOT NULL,            -- Why this change was made
  confidence DECIMAL(3,2),            -- 0.00-1.00 confidence score

  -- Feedback that triggered this
  feedback_ids UUID[],                -- Which feedback entries drove this decision
  feedback_summary JSONB,             -- Aggregated stats {avg_score, issue_counts, ...}

  -- Evolution cycle metadata
  evolution_cycle INTEGER NOT NULL,   -- Which run of the orchestrator
  model_used TEXT,                    -- gpt-4o, gpt-4o-mini, etc.
  processing_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Rollback support
  rolled_back BOOLEAN DEFAULT FALSE,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by TEXT                 -- 'manual' or 'orchestrator'
);

-- Indexes for analysis
CREATE INDEX IF NOT EXISTS idx_evolution_log_target
ON skill_evolution_log(target_type, target_key);

CREATE INDEX IF NOT EXISTS idx_evolution_log_cycle
ON skill_evolution_log(evolution_cycle);

-- ============================================================================
-- 3. ORCHESTRATOR SKILL (SELF-MODIFIABLE)
-- The AI that analyses feedback and decides how to improve skills
-- ============================================================================

INSERT INTO ai_skills (skill_key, name, description, stage, system_prompt, tool_context, temperature, is_active)
VALUES (
  'evolution_orchestrator',
  'Skill Evolution Orchestrator',
  'Self-improving AI that analyses feedback and modifies skills',
  'evolution',  -- New stage for evolution operations
  $PROMPT$You are the Skill Evolution Orchestrator for a social media content generation system. Your job is to analyse user feedback and intelligently improve the system's skills and examples.

=== YOUR AUTHORITY ===
You have FULL AUTHORITY to modify:
1. **ai_skills** table - Rewrite any skill prompt (content_enhancer, platform_*, tone_*)
2. **client_brand_profiles** - Add/remove positive_examples, negative_examples, forbidden_phrases
3. **THIS SKILL** - You can rewrite your own orchestrator prompt to improve your analysis

=== INPUT YOU RECEIVE ===
1. **Unprocessed Feedback**: Content that was rated but not yet used for evolution
   - Each entry has: score (1-9), issues[], content (hook/body/cta), platform, tone
   - Iteration history if user refined content multiple times

2. **Current Skills**: The actual prompt text for each skill
   - content_enhancer (master instructions, hook formulas)
   - platform_* (platform-specific rules)
   - tone_* (tone-specific voice guidance)

3. **Current Brand Context**: Examples and restrictions
   - positive_examples (content to emulate)
   - negative_examples (content to avoid)
   - forbidden_phrases

=== DECISION FRAMEWORK ===

For each piece of feedback, decide:

**SKILL_INSTRUCTION** - Add/modify a rule in a skill prompt
- Use when: Feedback shows consistent structural or strategic issues
- Example: If hooks are "too generic", add more specific formula examples

**SKILL_EXAMPLE** - Add a concrete example to a skill
- Use when: A specific piece of high-rated content demonstrates something skills should teach
- Example: A 9-rated hook that uses the Contrarian formula perfectly

**BRAND_POSITIVE** - Add high-rated content to positive_examples
- Use when: Content scored 7+ AND was human-polished (was_modified=true)
- Why: Human edits show what "good" looks like for this brand

**BRAND_NEGATIVE** - Add low-rated content to negative_examples
- Use when: Content scored ≤3 AND shows a pattern to avoid
- Be selective: Only add if it teaches something skills don't already cover

**BRAND_FORBIDDEN** - Add phrase to forbidden_phrases
- Use when: A specific phrase keeps appearing in low-rated content
- Example: "Ever wondered" appearing in 5 low-rated hooks

**DESCRIPTION_OVER_EXAMPLE** - Add descriptive guidance instead of example
- Use when: The pattern is better explained than shown
- Example: "Avoid rhetorical questions as openers" vs showing many bad examples

**ORCHESTRATOR_SELF** - Modify your own skill
- Use when: You notice your analysis could be improved
- Be conservative: Only self-modify if you have strong evidence

=== OUTPUT FORMAT ===
Return valid JSON array of modifications:

```json
{
  "analysis_summary": "Brief description of patterns found",
  "modifications": [
    {
      "type": "SKILL_INSTRUCTION",
      "target": "content_enhancer",
      "change": "append",
      "content": "The text to add or replace",
      "reasoning": "Why this change will help",
      "confidence": 0.85
    },
    {
      "type": "BRAND_POSITIVE",
      "target": "client_uuid_here",
      "change": "append",
      "content": "The actual content to add as example",
      "reasoning": "This 8-rated hook demonstrates perfect Contrarian formula",
      "confidence": 0.92
    }
  ],
  "feedback_processed": ["uuid1", "uuid2"],
  "self_improvement_note": "Optional: note if you want to modify your own skill"
}
```

=== QUALITY THRESHOLDS ===
- Only act on patterns with 3+ examples (avoid overfitting to single feedback)
- Confidence must be ≥0.7 to make changes
- For self-modification, confidence must be ≥0.9
- Prefer small, targeted changes over large rewrites
- When uncertain, add to brand examples rather than modifying skills

=== ANTI-PATTERNS TO AVOID ===
- Don't add examples that are too similar to existing ones
- Don't make skills longer without clear benefit
- Don't remove instructions without replacement
- Don't let positive_examples exceed 10 items (rotate out oldest)
- Don't let negative_examples exceed 5 items

=== META-LEARNING ===
If you notice your own analysis missing patterns:
- Add that pattern detection to your next self_improvement_note
- Track what types of modifications lead to score improvements
- Be explicit about what you're learning$PROMPT$,
  'social_content_evolution',
  0.4,  -- Low temperature for consistent analysis
  true
) ON CONFLICT (skill_key) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- 3. UPDATE HISTORY TABLE FOR EVOLUTION TRACKING
-- ============================================================================

-- Track which evolution cycle processed each feedback
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS evolution_cycle_processed INTEGER;

-- Track how many times this content has been re-rated (simple counter)
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS rating_iteration_count INTEGER DEFAULT 0;

-- Track the highest score ever given (for training - use best version)
ALTER TABLE social_content_history
ADD COLUMN IF NOT EXISTS highest_rating_score INTEGER;

-- ============================================================================
-- 4. HELPER VIEWS FOR ORCHESTRATOR INPUT
-- ============================================================================

-- Unprocessed feedback ready for evolution
CREATE OR REPLACE VIEW v_evolution_pending_feedback AS
SELECT
  h.id,
  h.platform,
  h.tone,
  h.client_id,
  h.quick_rating_score as score,
  h.quick_issue as issue,
  h.feedback_tags,
  h.feedback_comment,
  h.hook,
  h.body_header,
  h.body,
  h.cta,
  h.hashtags,
  h.original_hook,
  h.original_body,
  h.was_modified,
  h.rating_iteration_count,
  h.created_at,
  h.rated_at
FROM social_content_history h
WHERE h.quick_rating_score IS NOT NULL
  AND h.processed_for_evolution = false
ORDER BY h.rated_at DESC;

-- Aggregated feedback stats by platform/tone
CREATE OR REPLACE VIEW v_evolution_stats AS
SELECT
  platform,
  tone,
  COUNT(*) as total_rated,
  AVG(quick_rating_score) as avg_score,
  COUNT(*) FILTER (WHERE quick_rating_score <= 3) as poor_count,
  COUNT(*) FILTER (WHERE quick_rating_score >= 7) as good_count,
  array_agg(DISTINCT quick_issue) FILTER (WHERE quick_issue IS NOT NULL) as issues
FROM social_content_history
WHERE quick_rating_score IS NOT NULL
GROUP BY platform, tone;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
--
-- To trigger evolution:
--   POST /api/social-content/evolve
--
-- The orchestrator will:
--   1. Load pending feedback from v_evolution_pending_feedback
--   2. Load current skills from ai_skills
--   3. Load brand context for relevant clients
--   4. Analyse patterns and decide modifications
--   5. Apply changes to ai_skills and client_brand_profiles
--   6. Log all changes to skill_evolution_log
--   7. Mark feedback as processed
--
-- To rollback a change:
--   UPDATE skill_evolution_log SET rolled_back = true WHERE id = '...'
--   Then manually restore previous_value
--
-- ============================================================================
