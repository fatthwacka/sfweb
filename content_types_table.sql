-- Create the content_types table
CREATE TABLE content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  word_limit INTEGER,
  character_limit INTEGER,
  guidelines TEXT,
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all content types
CREATE POLICY "Authenticated users can read content types" ON content_types
  FOR SELECT TO authenticated USING (true);

-- Policy for admin users to manage content types (simplified - allows all authenticated users for now)
CREATE POLICY "Authenticated users can manage content types" ON content_types
  FOR ALL TO authenticated USING (true);

-- Insert default content types
INSERT INTO content_types (type_key, label, description, word_limit, character_limit, guidelines, system_prompt, sort_order) VALUES
('image', 'Image Generation', 'AI image prompts with visual style guidance', NULL, 2000, 'Focus on visual details, composition, lighting, style, and mood. Include specific technical parameters for AI models.', 'You are an expert AI image prompt engineer. Create enhanced prompts for image generation that are descriptive, visually compelling, and technically optimized. Return ONLY the enhanced prompt with no explanations or preamble.', 1),

('video', 'Video Content', 'Video scripts and scene descriptions', 300, NULL, 'Focus on scene descriptions, visual flow, pacing, and cinematic elements. Consider camera angles, transitions, and visual storytelling.', 'You are an expert video content prompt engineer. Enhance prompts for video generation with detailed scene descriptions, pacing, and cinematic elements. Return ONLY the enhanced prompt with no explanations or preamble.', 2),

('caption', 'Social Caption', 'Short-form social media posts', 100, 280, 'Create engaging, platform-appropriate content with strong hooks. Focus on brevity, impact, and social engagement.', 'You are an expert social media caption writer. Enhance prompts to be engaging, concise, and platform-appropriate for social media. Keep within 100 words maximum. Return ONLY the enhanced prompt with no explanations or preamble.', 3),

('blog', 'Blog Article', 'Long-form written content', 2000, NULL, 'Structure content for readability with clear sections, SEO optimization, and valuable insights. Focus on depth and reader engagement.', 'You are an expert content writer specializing in blog articles. Enhance prompts for comprehensive, well-structured, and valuable blog content. Return ONLY the enhanced prompt with no explanations or preamble.', 4),

('script', 'Voice Script', 'Voiceover and audio scripts', 500, NULL, 'Write for natural speech flow with clear pronunciation guides. Consider pacing, tone, and audio-friendly language patterns.', 'You are an expert scriptwriter for voice and audio content. Enhance prompts for natural speech flow, clear delivery, and engaging audio content. Return ONLY the enhanced prompt with no explanations or preamble.', 5);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_types_updated_at BEFORE UPDATE
  ON content_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_content_types_type_key ON content_types(type_key);
CREATE INDEX idx_content_types_active ON content_types(is_active);
CREATE INDEX idx_content_types_sort ON content_types(sort_order);