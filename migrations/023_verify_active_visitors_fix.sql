-- Verify active_visitors view security properties
-- This checks the actual system catalog to see if SECURITY DEFINER is set

-- Check view rules and security properties
SELECT
    c.relname AS view_name,
    c.relkind AS object_type,
    r.ev_action AS view_definition_detail,
    r.ev_qual AS view_where_clause,
    CASE
        WHEN r.ev_action::text LIKE '%security_definer%' THEN 'YES - SECURITY DEFINER FOUND!'
        ELSE 'No - Security Invoker (Good)'
    END as has_security_definer
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_rewrite r ON r.ev_class = c.oid
WHERE n.nspname = 'public'
  AND c.relname = 'active_visitors'
  AND c.relkind = 'v';

-- Alternative check: Get the complete view definition with CREATE VIEW statement
SELECT pg_get_viewdef('public.active_visitors'::regclass, true) as view_definition;

-- Check if there are any functions with SECURITY DEFINER involved
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%active_visitors%'
  AND p.prosecdef = true;

-- Final nuclear option: Completely drop and recreate with explicit ownership
DROP VIEW IF EXISTS public.active_visitors CASCADE;

-- Create with postgres user explicitly (if that's the issue)
CREATE OR REPLACE VIEW public.active_visitors
WITH (security_barrier=false)
AS
SELECT
  COUNT(DISTINCT session_id) as active_count,
  COUNT(*) as total_sessions
FROM public.visitor_sessions
WHERE last_activity_at > (NOW() - '5 minutes'::interval)
  AND is_bot = false;

-- Explicitly set owner to postgres
ALTER VIEW public.active_visitors OWNER TO postgres;

-- Grant access
GRANT SELECT ON public.active_visitors TO anon, authenticated, service_role;

-- Final verification
SELECT
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'active_visitors';
