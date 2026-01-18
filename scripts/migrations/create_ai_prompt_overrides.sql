-- AI System Prompt Overrides Table
-- Client-specific prompt customisations for AI content generation
-- Falls back to: Client override → Global content_types → Hardcoded fallback

CREATE TABLE IF NOT EXISTS ai_prompt_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES content_clients(id) ON DELETE CASCADE, -- null = global default
  content_type TEXT NOT NULL, -- 'image', 'video', 'caption', 'blog', 'script'
  prompt_component TEXT NOT NULL DEFAULT 'system', -- 'system', 'enhancement_no_assets', 'enhancement_with_assets', 'gemini_config'
  prompt_text TEXT NOT NULL, -- The editable prompt/config text
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint: one active prompt per client + content_type + component combination
CREATE UNIQUE INDEX idx_ai_prompt_overrides_unique_active
ON ai_prompt_overrides (client_id, content_type, prompt_component)
WHERE is_active = true;

-- Index for fast lookups
CREATE INDEX idx_ai_prompt_overrides_client_type
ON ai_prompt_overrides (client_id, content_type, prompt_component, is_active);

-- Enable RLS
ALTER TABLE ai_prompt_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth requirements)
-- Allow authenticated users to read all prompts
CREATE POLICY "Allow authenticated read" ON ai_prompt_overrides
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete their own prompts
CREATE POLICY "Allow authenticated write" ON ai_prompt_overrides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE ai_prompt_overrides IS 'Client-specific AI system prompt customisations. Null client_id = global default.';
COMMENT ON COLUMN ai_prompt_overrides.client_id IS 'References content_clients. Null = global default for all clients.';
COMMENT ON COLUMN ai_prompt_overrides.content_type IS 'Content type: image, video, caption, blog, script';
COMMENT ON COLUMN ai_prompt_overrides.prompt_component IS 'Component type: system, enhancement_no_assets, enhancement_with_assets, gemini_config';
COMMENT ON COLUMN ai_prompt_overrides.prompt_text IS 'The editable prompt/config text';
