-- Migration 045: leads table for bot_army_01_svc service account
-- Mirrors the isolation pattern of bot_army_01: table grant + RLS + role policy.

CREATE TABLE IF NOT EXISTS public.leads (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event         TEXT,
  business_id   TEXT,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  tier          INTEGER,
  revenue_score NUMERIC(5,1),
  category      TEXT,
  city          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_tier  ON public.leads (tier);
CREATE INDEX IF NOT EXISTS idx_leads_city  ON public.leads (city);

-- Revoke Supabase's default-granted access from anon/authenticated so this
-- table is NOT exposed via PostgREST with the public anon key.
REVOKE ALL ON public.leads FROM anon, authenticated;

-- Grant the service account full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO bot_army_01_svc;

-- Enable RLS and add a permissive policy for the service role
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bot_army_01_svc_leads_access ON public.leads;
CREATE POLICY bot_army_01_svc_leads_access
  ON public.leads
  AS PERMISSIVE
  FOR ALL
  TO bot_army_01_svc
  USING (true)
  WITH CHECK (true);
