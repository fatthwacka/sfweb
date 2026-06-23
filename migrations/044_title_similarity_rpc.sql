-- ============================================================================
-- Migration 044: Title Similarity RPC Function
-- Creates a PostgreSQL function for pg_trgm title similarity checking
-- callable via Supabase .rpc() from the pipeline screening layer.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_title_similarity(
  p_title text,
  p_client_id uuid,
  p_threshold float DEFAULT 0.4
)
RETURNS TABLE(id uuid, title text, sim float) AS $$
BEGIN
  RETURN QUERY
  SELECT bp.id, bp.title, similarity(bp.title, p_title)::float AS sim
  FROM blog_posts bp
  WHERE bp.client_id = p_client_id
    AND bp.status = 'published'
    AND similarity(bp.title, p_title) > p_threshold
  UNION ALL
  SELECT ia.id, ia.title, similarity(ia.title, p_title)::float AS sim
  FROM ingested_articles ia
  WHERE ia.client_id = p_client_id
    AND ia.status NOT IN ('rejected', 'expired')
    AND similarity(ia.title, p_title) > p_threshold
  ORDER BY sim DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
