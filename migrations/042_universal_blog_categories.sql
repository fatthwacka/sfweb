-- Migration 042: Replace photography-specific blog categories with universal content marketing categories
-- Existing categories are deactivated (not deleted) to preserve foreign key references on existing posts

-- Deactivate photography-specific categories
UPDATE blog_categories SET is_active = false WHERE slug IN (
  'wedding-stories',
  'portrait-sessions',
  'corporate-events',
  'photography-tips',
  'client-features',
  'venue-spotlights',
  'tutorial',
  'case-study'
);

-- Update "Behind the Scenes" description to be industry-agnostic
UPDATE blog_categories
  SET description = 'Transparency, process insights, and company culture'
  WHERE slug = 'behind-the-scenes';

-- Update "Case Studies" description
UPDATE blog_categories
  SET description = 'Client success stories with measurable outcomes'
  WHERE slug = 'case-studies';

-- Insert new universal categories (skip if slug already exists)
INSERT INTO blog_categories (name, slug, description, color, is_active, display_order) VALUES
  ('Thought Leadership',  'thought-leadership',  'Expert opinions, industry perspectives, and authority-building content',  '#7c3aed', true, 1),
  ('Industry Insights',   'industry-insights',   'Trends, data, market analysis, and sector commentary',                  '#2563eb', true, 2),
  ('How-To Guides',       'how-to-guides',       'Educational step-by-step tutorials and walkthroughs',                   '#f59e0b', true, 3),
  ('Pain Points',         'pain-points',          'Problem-awareness content addressing audience challenges',              '#ef4444', true, 5),
  ('Tips & Best Practices','tips-best-practices', 'Actionable advice, quick wins, and professional recommendations',      '#10b981', true, 6),
  ('News & Updates',      'news-updates',         'Company news, product launches, and announcements',                    '#06b6d4', true, 7),
  ('Inspirational',       'inspirational',        'Motivational stories, vision-casting, and aspiration content',          '#ec4899', true, 8),
  ('FAQs & Myths',        'faqs-myths',           'Misconception-busting, common questions, and myth debunking',          '#84cc16', true, 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  is_active = true,
  display_order = EXCLUDED.display_order;

-- Reorder existing kept categories
UPDATE blog_categories SET display_order = 4 WHERE slug = 'case-studies';
UPDATE blog_categories SET display_order = 9 WHERE slug = 'behind-the-scenes';
