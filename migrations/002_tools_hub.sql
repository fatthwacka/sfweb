-- Tools Hub Database Schema Migration
-- Created: December 2025
-- Purpose: Add tables and columns for tools hub functionality

-- ============================================
-- 1. UPDATE EXISTING USERS TABLE
-- ============================================

-- Add subscription tier column
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  subscription_tier VARCHAR(20) DEFAULT 'free';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level: free, pro, enterprise';

-- Add subscription expiry
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  subscription_expires_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN users.subscription_expires_at IS 'When the current subscription expires';

-- Add email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email_verified_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN users.email_verified_at IS 'When the email was verified';

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email_verification_token VARCHAR(100);
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email_verification_expires_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN users.email_verification_expires_at IS 'When the verification token expires';

-- ============================================
-- 2. CREATE TOOL ACCESS TIERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tool_access_tiers (
  id SERIAL PRIMARY KEY,
  tool_slug VARCHAR(50) UNIQUE NOT NULL,
  min_tier VARCHAR(20) NOT NULL DEFAULT 'anonymous',
  -- Values: 'anonymous', 'verified', 'pro', 'enterprise', 'staff'
  
  is_active BOOLEAN DEFAULT true,
  usage_limit_anonymous INTEGER,
  usage_limit_verified INTEGER,
  usage_limit_pro INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE tool_access_tiers IS 'Configuration for tool access requirements and limits';

-- ============================================
-- 3. CREATE TOOL USAGE TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tool_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),
  tool_slug VARCHAR(50) NOT NULL,
  action VARCHAR(50),
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE tool_usage IS 'Tracks tool usage for rate limiting and analytics';

-- ============================================
-- 4. CREATE SUBSCRIPTIONS TABLE (FUTURE)
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  
  provider VARCHAR(20),
  provider_subscription_id VARCHAR(100),
  provider_customer_id VARCHAR(100),
  
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Future payment subscription tracking';

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tool_usage_user ON tool_usage(user_id, tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id, tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

-- ============================================
-- 6. INSERT DEFAULT TOOL CONFIGURATIONS
-- ============================================

INSERT INTO tool_access_tiers (tool_slug, min_tier, is_active, usage_limit_anonymous, usage_limit_verified, usage_limit_pro)
VALUES 
  ('file-renamer', 'anonymous', true, 100, 500, null),
  ('bulk-mover', 'anonymous', true, 100, 500, null),
  ('duplicate-finder', 'anonymous', true, 50, 200, null),
  ('smart-organiser', 'verified', true, 0, 100, null),
  ('ai-duplicate-matcher', 'verified', true, 0, 50, null),
  ('article-editor', 'verified', true, 0, 100, null),
  ('n8n-gallery-email', 'staff', true, 0, 0, 0),
  ('n8n-social-post', 'staff', true, 0, 0, 0),
  ('batch-image-processor', 'pro', true, 0, 0, 50),
  ('api-access', 'enterprise', true, 0, 0, 0)
ON CONFLICT (tool_slug) DO UPDATE
SET 
  min_tier = EXCLUDED.min_tier,
  is_active = EXCLUDED.is_active,
  usage_limit_anonymous = EXCLUDED.usage_limit_anonymous,
  usage_limit_verified = EXCLUDED.usage_limit_verified,
  usage_limit_pro = EXCLUDED.usage_limit_pro,
  updated_at = NOW();

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_tool_access_tiers_updated_at BEFORE UPDATE ON tool_access_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Assuming you're using row-level security
-- Adjust these based on your Supabase RLS policies

-- Enable RLS on new tables
ALTER TABLE tool_access_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to tool configurations
CREATE POLICY "Tool access tiers are viewable by everyone" ON tool_access_tiers
    FOR SELECT USING (true);

-- Create policies for tool usage tracking
CREATE POLICY "Users can view their own tool usage" ON tool_usage
    FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Anonymous users can insert tool usage" ON tool_usage
    FOR INSERT WITH CHECK (true);

-- Create policies for subscriptions (users can only see their own)
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- ============================================
-- End of migration
-- ============================================