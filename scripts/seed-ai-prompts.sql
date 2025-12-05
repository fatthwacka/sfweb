-- AI Prompts table for storing customizable AI generation prompts
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL UNIQUE, -- e.g., 'title', 'content', 'seo', 'content:case-study'
  name TEXT NOT NULL, -- Human-readable name
  description TEXT, -- What this prompt does
  prompt_text TEXT NOT NULL, -- The actual prompt template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_prompts_key ON ai_prompts(prompt_key);

-- Enable RLS
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for all authenticated users
CREATE POLICY "Allow read access" ON ai_prompts FOR SELECT USING (true);

-- Policy: Allow update for authenticated users (admin check can be added later)
CREATE POLICY "Allow update access" ON ai_prompts FOR UPDATE USING (true);

-- Seed with default prompts
INSERT INTO ai_prompts (prompt_key, name, description, prompt_text) VALUES

-- Title generation prompt
('title', 'Title Generator', 'Generates 5 engaging blog post titles',
'Generate 5 engaging blog post titles about the given topic.

Requirements:
- Professional but engaging tone
- SEO-friendly (60 characters or less)
- Relevant to the topic
- Appeal to potential clients
- Avoid clickbait

Return as a JSON array of strings.'),

-- Content generation prompts by type
('content:case-study', 'Case Study Content', 'Generates case study format blog posts',
'Write a CASE STUDY blog post about the given topic.

Structure:
- Tell a story about a specific project or client
- Include the challenge, solution, and results
- Use specific details and outcomes
- Showcase expertise through real examples

Return as JSON: {"introduction": "...", "body": "...", "conclusion": "..."}'),

('content:news', 'News/Announcement Content', 'Generates news format blog posts',
'Write a NEWS/ANNOUNCEMENT blog post about the given topic.

Structure:
- Lead with the most important information
- Keep it timely and relevant
- Include key details: who, what, when, where, why
- End with next steps or call-to-action

Return as JSON: {"introduction": "...", "body": "...", "conclusion": "..."}'),

('content:informational', 'Informational Content', 'Generates tips and advice blog posts',
'Write an INFORMATIONAL/TIPS blog post about the given topic.

Structure:
- Provide practical, actionable advice
- Use numbered tips or clear sections
- Include expert insights and best practices
- Help readers solve a problem or learn something new

Return as JSON: {"introduction": "...", "body": "...", "conclusion": "..."}'),

('content:showcase', 'Project Showcase Content', 'Generates showcase format blog posts',
'Write a PROJECT SHOWCASE blog post about the given topic.

Structure:
- Highlight the visual/creative aspects
- Describe the creative process
- Emphasize unique elements and results
- Let the work speak for itself with supporting narrative

Return as JSON: {"introduction": "...", "body": "...", "conclusion": "..."}'),

-- SEO prompts
('seo-title', 'SEO Title Generator', 'Generates SEO-optimized page titles',
'Generate an SEO-optimized title (max 60 characters) for the blog post.

Requirements:
- Under 60 characters for Google search results
- Include primary keyword naturally
- Compelling for click-through rates
- Professional tone

Return just the title text, no quotes or formatting.'),

('seo-description', 'SEO Description Generator', 'Generates meta descriptions',
'Write an SEO meta description (max 155 characters) for the blog post.

Requirements:
- Under 155 characters for search snippets
- Include target keywords naturally
- Compelling call-to-action
- Summarize the value proposition

Return just the description text, no quotes or formatting.'),

-- Excerpt prompt
('excerpt', 'Excerpt Generator', 'Generates post excerpts for listings',
'Write a compelling excerpt (2-3 sentences, max 160 characters) for the blog post.

Requirements:
- Summarize the main value proposition
- Entice readers to click and read more
- Professional but approachable language
- Optimized for social media sharing

Return just the excerpt text, no quotes or formatting.')

ON CONFLICT (prompt_key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  updated_at = now();
