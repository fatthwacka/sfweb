-- ============================================
-- MINI TOOLS HUB - DATABASE MIGRATION
-- Run in Supabase SQL Editor
-- Created: December 2025
-- ============================================

-- ============================================
-- PART 1: Extend profiles table for subscriptions
-- ============================================

-- Add subscription columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(100),
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Update default role from 'client' to 'user' for new signups
-- (existing users keep their current role)
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Add comment for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription level: free, pro, enterprise';
COMMENT ON COLUMN profiles.email_verified_at IS 'When user verified their email address';
COMMENT ON COLUMN profiles.role IS 'User role: super_admin, staff, client (photography customers), user (generic signups)';

-- ============================================
-- PART 2: Tool access configuration table
-- ============================================

CREATE TABLE IF NOT EXISTS tool_access_tiers (
  id SERIAL PRIMARY KEY,
  tool_slug VARCHAR(50) UNIQUE NOT NULL,
  min_tier VARCHAR(20) NOT NULL DEFAULT 'anonymous',
  is_active BOOLEAN DEFAULT true,
  usage_limit_anonymous INTEGER,
  usage_limit_verified INTEGER,
  usage_limit_pro INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tool_access_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access (tools config is public)
DROP POLICY IF EXISTS "Anyone can read tool access tiers" ON tool_access_tiers;
CREATE POLICY "Anyone can read tool access tiers" ON tool_access_tiers
  FOR SELECT USING (true);

-- Only staff can modify
DROP POLICY IF EXISTS "Staff can manage tool access tiers" ON tool_access_tiers;
CREATE POLICY "Staff can manage tool access tiers" ON tool_access_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'staff')
    )
  );

-- ============================================
-- PART 3: Tool usage tracking table
-- ============================================

CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  tool_slug VARCHAR(50) NOT NULL,
  action VARCHAR(50) DEFAULT 'execute',
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- Users can see their own usage
DROP POLICY IF EXISTS "Users can view own tool usage" ON tool_usage;
CREATE POLICY "Users can view own tool usage" ON tool_usage
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'staff')
    )
  );

-- Allow inserts (tracked server-side)
DROP POLICY IF EXISTS "Allow tool usage inserts" ON tool_usage;
CREATE POLICY "Allow tool usage inserts" ON tool_usage
  FOR INSERT WITH CHECK (true);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tool_usage_user ON tool_usage(user_id, tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id, tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_usage_daily ON tool_usage(tool_slug, created_at);

-- ============================================
-- PART 4: Subscriptions table (future payment integration)
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',

  -- Payment provider fields (for future Stripe/Paddle integration)
  provider VARCHAR(20),
  provider_subscription_id VARCHAR(100),
  provider_customer_id VARCHAR(100),

  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Staff can view all subscriptions
DROP POLICY IF EXISTS "Staff can view all subscriptions" ON subscriptions;
CREATE POLICY "Staff can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'staff')
    )
  );

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

-- ============================================
-- PART 5: Seed default tool access tiers
-- ============================================

INSERT INTO tool_access_tiers (tool_slug, min_tier, usage_limit_anonymous, usage_limit_verified, usage_limit_pro) VALUES
  ('file-renamer', 'anonymous', 100, 500, NULL),
  ('bulk-mover', 'anonymous', 100, 500, NULL),
  ('duplicate-finder', 'anonymous', 50, 200, NULL),
  ('smart-organiser', 'verified', NULL, 50, 500),
  ('ai-duplicate-matcher', 'verified', NULL, 30, 300),
  ('article-editor', 'verified', NULL, 20, 200),
  ('n8n-gallery-email', 'staff', NULL, NULL, NULL),
  ('n8n-social-post', 'staff', NULL, NULL, NULL),
  ('batch-image-processor', 'pro', NULL, NULL, 100),
  ('api-access', 'enterprise', NULL, NULL, NULL)
ON CONFLICT (tool_slug) DO UPDATE SET
  min_tier = EXCLUDED.min_tier,
  usage_limit_anonymous = EXCLUDED.usage_limit_anonymous,
  usage_limit_verified = EXCLUDED.usage_limit_verified,
  usage_limit_pro = EXCLUDED.usage_limit_pro,
  updated_at = NOW();

-- ============================================
-- PART 6: Helper function for usage counting
-- ============================================

CREATE OR REPLACE FUNCTION get_tool_usage_today(
  p_user_id UUID,
  p_session_id VARCHAR,
  p_tool_slug VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO usage_count
  FROM tool_usage
  WHERE tool_slug = p_tool_slug
    AND created_at >= CURRENT_DATE
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR
      (p_user_id IS NULL AND session_id = p_session_id)
    );

  RETURN COALESCE(usage_count, 0);
END;
$$;

-- ============================================
-- PART 7: Helper function for access check
-- ============================================

CREATE OR REPLACE FUNCTION check_tool_access(
  p_user_id UUID,
  p_tool_slug VARCHAR
)
RETURNS TABLE(
  has_access BOOLEAN,
  user_tier VARCHAR,
  required_tier VARCHAR,
  usage_today INTEGER,
  usage_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tier VARCHAR;
  v_required_tier VARCHAR;
  v_role VARCHAR;
  v_subscription_tier VARCHAR;
  v_email_verified TIMESTAMP;
  v_usage_limit INTEGER;
  v_usage_today INTEGER;
  tier_order TEXT[] := ARRAY['anonymous', 'verified', 'pro', 'enterprise', 'staff'];
BEGIN
  -- Get tool requirements
  SELECT t.min_tier INTO v_required_tier
  FROM tool_access_tiers t
  WHERE t.tool_slug = p_tool_slug;

  IF v_required_tier IS NULL THEN
    v_required_tier := 'anonymous'; -- Default if tool not in config
  END IF;

  -- Determine user tier
  IF p_user_id IS NULL THEN
    v_user_tier := 'anonymous';
  ELSE
    SELECT
      p.role,
      p.subscription_tier,
      p.email_verified_at
    INTO v_role, v_subscription_tier, v_email_verified
    FROM profiles p
    WHERE p.id = p_user_id;

    IF v_role IN ('super_admin', 'staff') THEN
      v_user_tier := 'staff';
    ELSIF v_subscription_tier = 'enterprise' THEN
      v_user_tier := 'enterprise';
    ELSIF v_subscription_tier = 'pro' THEN
      v_user_tier := 'pro';
    ELSIF v_email_verified IS NOT NULL THEN
      v_user_tier := 'verified';
    ELSE
      v_user_tier := 'anonymous';
    END IF;
  END IF;

  -- Get usage limit for user's tier
  SELECT
    CASE v_user_tier
      WHEN 'anonymous' THEN t.usage_limit_anonymous
      WHEN 'verified' THEN t.usage_limit_verified
      WHEN 'pro' THEN t.usage_limit_pro
      ELSE NULL
    END INTO v_usage_limit
  FROM tool_access_tiers t
  WHERE t.tool_slug = p_tool_slug;

  -- Get today's usage
  v_usage_today := get_tool_usage_today(p_user_id, NULL, p_tool_slug);

  RETURN QUERY SELECT
    array_position(tier_order, v_user_tier) >= array_position(tier_order, v_required_tier),
    v_user_tier,
    v_required_tier,
    v_usage_today,
    v_usage_limit;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================

-- Uncomment these to verify the migration worked:

-- Check tool tiers were created
-- SELECT * FROM tool_access_tiers ORDER BY tool_slug;

-- Check profiles columns were added
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- AND column_name IN ('subscription_tier', 'email_verified_at', 'role');

-- Test the access check function (anonymous user)
-- SELECT * FROM check_tool_access(NULL, 'file-renamer');

-- ============================================
-- DONE!
-- ============================================
