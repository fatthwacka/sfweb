-- ============================================================================
-- Fix Platform Rules - Correct Character Limits
-- Total = hook + body_header + body + cta (excluding hashtags)
-- ============================================================================

-- Instagram: 150 + 50 + 200 + 100 = 500 total
UPDATE platform_rules SET
  hook_limit = 150,
  body_header_limit = 50,
  body_limit = 200,
  cta_limit = 100,
  total_character_limit = 500,
  hashtag_count_min = 5,
  hashtag_count_max = 15,
  emoji_style = 'heavy',
  guidelines = 'Visual-first platform. Punchy captions, heavy emojis, 5-15 hashtags.'
WHERE platform_key = 'instagram';

-- Facebook: 200 + 50 + 300 + 150 = 700 total
UPDATE platform_rules SET
  hook_limit = 200,
  body_header_limit = 50,
  body_limit = 300,
  cta_limit = 150,
  total_character_limit = 700,
  hashtag_count_min = 0,
  hashtag_count_max = 3,
  emoji_style = 'moderate',
  guidelines = 'Conversational content. Questions drive engagement. 0-3 hashtags max.'
WHERE platform_key = 'facebook';

-- LinkedIn: 150 + 50 + 500 + 150 = 850 total
UPDATE platform_rules SET
  hook_limit = 150,
  body_header_limit = 50,
  body_limit = 500,
  cta_limit = 150,
  total_character_limit = 850,
  hashtag_count_min = 3,
  hashtag_count_max = 5,
  emoji_style = 'minimal',
  guidelines = 'Professional but human. Thought leadership. 3-5 hashtags at bottom.'
WHERE platform_key = 'linkedin';

-- TikTok: 50 + 30 + 150 + 80 = 310 total
UPDATE platform_rules SET
  hook_limit = 50,
  body_header_limit = 30,
  body_limit = 150,
  cta_limit = 80,
  total_character_limit = 310,
  hashtag_count_min = 3,
  hashtag_count_max = 5,
  emoji_style = 'heavy',
  guidelines = 'Ultra-short captions. Video does the work. 3-5 hashtags.'
WHERE platform_key = 'tiktok';

-- YouTube: 100 + 50 + 400 + 150 = 700 total
UPDATE platform_rules SET
  hook_limit = 100,
  body_header_limit = 50,
  body_limit = 400,
  cta_limit = 150,
  total_character_limit = 700,
  hashtag_count_min = 3,
  hashtag_count_max = 5,
  emoji_style = 'minimal',
  guidelines = 'SEO-focused descriptions. First 150 chars show in search. 3-5 hashtags.'
WHERE platform_key = 'youtube';

-- ============================================================================
-- Summary of platform limits:
-- Instagram: 500 total (150 + 50 + 200 + 100)
-- Facebook:  700 total (200 + 50 + 300 + 150)
-- LinkedIn:  850 total (150 + 50 + 500 + 150)
-- TikTok:    310 total (50 + 30 + 150 + 80)
-- YouTube:   700 total (100 + 50 + 400 + 150)
-- ============================================================================
