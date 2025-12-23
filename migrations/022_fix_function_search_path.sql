-- Migration: Fix SECURITY DEFINER function search_path warnings
-- Generated: 2025-12-23
-- Issue: Functions with SECURITY DEFINER should explicitly set search_path
--        to prevent security vulnerabilities from search_path manipulation
-- Solution: Add "SET search_path = public, pg_temp" to all SECURITY DEFINER functions

-- ============================================================================
-- 1. Fix handle_new_user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    theme_preference,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'theme_preference', 'dark'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates a profile row when a new user signs up via Supabase Auth.
Reads role from user_metadata, defaulting to ''user'' for generic signups.
''client'' role should only be assigned manually when someone books a shoot.
SECURITY: search_path is set to public, pg_temp to prevent injection attacks.';

-- ============================================================================
-- 2. Fix get_tool_usage_today function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tool_usage_today(
  p_user_id UUID,
  p_session_id VARCHAR,
  p_tool_slug VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

COMMENT ON FUNCTION public.get_tool_usage_today(UUID, VARCHAR, VARCHAR) IS
'Counts tool usage for today for a given user or session.
SECURITY: search_path is set to public, pg_temp to prevent injection attacks.';

-- ============================================================================
-- 3. Fix check_tool_access function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_tool_access(
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
SET search_path = public, pg_temp
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
    v_required_tier := 'anonymous';
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

COMMENT ON FUNCTION public.check_tool_access(UUID, VARCHAR) IS
'Checks if a user has access to a specific tool based on their tier and usage limits.
SECURITY: search_path is set to public, pg_temp to prevent injection attacks.';

-- ============================================================================
-- 4. Fix update_videos_updated_at function (if exists)
-- ============================================================================

-- This function may exist in your database for the videos table
-- If it doesn't exist, this will create it; if it does, it will be replaced with fixed version
CREATE OR REPLACE FUNCTION public.update_videos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_videos_updated_at() IS
'Automatically updates updated_at timestamp on videos table.
SECURITY: search_path is set to public, pg_temp to prevent injection attacks.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify functions are fixed:

-- Check that all functions have proper search_path set
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  pg_get_functiondef(p.oid) LIKE '%SET search_path%' as has_search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true
  AND n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'get_tool_usage_today',
    'check_tool_access',
    'update_videos_updated_at',
    'update_updated_at_column'
  )
ORDER BY p.proname;

-- Expected result: All functions should show has_search_path = true
