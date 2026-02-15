-- ============================================================================
-- UNRESTRICTED RLS Policies for Feedback System
-- Replaces authenticated-only policies with unrestricted access
-- Matches the pattern used by ai_skills table
-- ============================================================================

-- 1. Drop existing restrictive policies on social_content_history
DROP POLICY IF EXISTS "social_content_history_read_authenticated" ON social_content_history;
DROP POLICY IF EXISTS "social_content_history_insert_authenticated" ON social_content_history;
DROP POLICY IF EXISTS "social_content_history_update_authenticated" ON social_content_history;

-- 2. Drop existing restrictive policies on skill_proposal_history
DROP POLICY IF EXISTS "skill_proposal_history_read_authenticated" ON skill_proposal_history;
DROP POLICY IF EXISTS "skill_proposal_history_insert_authenticated" ON skill_proposal_history;
DROP POLICY IF EXISTS "skill_proposal_history_update_authenticated" ON skill_proposal_history;

-- 3. Add UNRESTRICTED policies for social_content_history
CREATE POLICY "unrestricted_select" ON social_content_history
  FOR SELECT USING (true);

CREATE POLICY "unrestricted_insert" ON social_content_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "unrestricted_update" ON social_content_history
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "unrestricted_delete" ON social_content_history
  FOR DELETE USING (true);

-- 4. Add UNRESTRICTED policies for skill_proposal_history
CREATE POLICY "unrestricted_select" ON skill_proposal_history
  FOR SELECT USING (true);

CREATE POLICY "unrestricted_insert" ON skill_proposal_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "unrestricted_update" ON skill_proposal_history
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "unrestricted_delete" ON skill_proposal_history
  FOR DELETE USING (true);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON POLICY "unrestricted_select" ON social_content_history IS 'Allow all users to read content history';
COMMENT ON POLICY "unrestricted_insert" ON social_content_history IS 'Allow all users to create content history records';
COMMENT ON POLICY "unrestricted_update" ON social_content_history IS 'Allow all users to update content history (for feedback)';
COMMENT ON POLICY "unrestricted_delete" ON social_content_history IS 'Allow all users to delete content history';

COMMENT ON POLICY "unrestricted_select" ON skill_proposal_history IS 'Allow all users to read skill proposals';
COMMENT ON POLICY "unrestricted_insert" ON skill_proposal_history IS 'Allow all users to create skill proposals';
COMMENT ON POLICY "unrestricted_update" ON skill_proposal_history IS 'Allow all users to update skill proposals';
COMMENT ON POLICY "unrestricted_delete" ON skill_proposal_history IS 'Allow all users to delete skill proposals';
