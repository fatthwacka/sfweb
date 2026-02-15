-- ============================================================================
-- Fix Platform Rules Values & Make Skills Self-Contained
-- Skills now contain ALL prompt instructions including limits
-- platform_rules table is for UI metadata only
-- ============================================================================

-- Update platform_rules for UI display (metadata only)
UPDATE platform_rules SET
  hook_limit = 150,
  body_header_limit = 50,
  body_limit = 200,
  cta_limit = 100,
  hashtag_count_min = 5,
  hashtag_count_max = 15,
  emoji_style = 'heavy',
  guidelines = 'Visual-first platform. Punchy captions, heavy emojis, 5-15 hashtags.'
WHERE platform_key = 'instagram';

UPDATE platform_rules SET
  hook_limit = 200,
  body_header_limit = 50,
  body_limit = 300,
  cta_limit = 150,
  hashtag_count_min = 0,
  hashtag_count_max = 3,
  emoji_style = 'moderate',
  guidelines = 'Conversational content. Questions drive engagement. 0-3 hashtags max.'
WHERE platform_key = 'facebook';

UPDATE platform_rules SET
  hook_limit = 150,
  body_header_limit = 50,
  body_limit = 500,
  cta_limit = 150,
  hashtag_count_min = 3,
  hashtag_count_max = 5,
  emoji_style = 'minimal',
  guidelines = 'Professional but human. Thought leadership. 3-5 hashtags at bottom.'
WHERE platform_key = 'linkedin';

UPDATE platform_rules SET
  hook_limit = 50,
  body_header_limit = 30,
  body_limit = 150,
  cta_limit = 80,
  hashtag_count_min = 3,
  hashtag_count_max = 5,
  emoji_style = 'heavy',
  guidelines = 'Ultra-short captions. Video does the work. 3-5 hashtags.'
WHERE platform_key = 'tiktok';

UPDATE platform_rules SET
  hook_limit = 100,
  body_header_limit = 50,
  body_limit = 400,
  cta_limit = 150,
  hashtag_count_min = 3,
  hashtag_count_max = 5,
  emoji_style = 'minimal',
  guidelines = 'SEO-focused descriptions. First 150 chars show in search. 3-5 hashtags.'
WHERE platform_key = 'youtube';

-- ============================================================================
-- SELF-CONTAINED PLATFORM SKILLS
-- Each skill includes ALL instructions, limits, and guidelines
-- No external table lookups needed during generation
-- ============================================================================

-- Instagram - fully self-contained
UPDATE ai_skills SET
  system_prompt = '=== INSTAGRAM CONTENT RULES ===

CHARACTER LIMITS (strict):
- Hook: 150 characters max (this shows in feed before "more")
- Body Header: 50 characters max (optional transition line)
- Body: 200 characters max (keep it punchy and scannable)
- CTA: 100 characters max
- Hashtags: Generate exactly 8-12 hashtags (sweet spot for reach)

INSTAGRAM BEST PRACTICES:
- First line MUST stop the scroll - treat it like a headline
- Use line breaks for readability (wall of text = scroll past)
- Emojis are expected and encouraged (use liberally)
- Hashtags go at the end, separated from main content
- Questions drive comments - end with engagement prompts
- Personal stories outperform promotional content

EMOJI STYLE: Heavy - use 3-5 emojis naturally throughout

HASHTAG STRATEGY:
- Mix niche tags (low competition) with broad tags (discovery)
- Include 2-3 branded or campaign-specific tags
- No spaces in hashtags, all lowercase preferred

CONTENT THAT PERFORMS:
- Behind-the-scenes glimpses
- User-generated content reposts
- Educational carousel hints
- Relatable observations
- Before/after transformations',
  updated_at = NOW()
WHERE skill_key = 'platform_instagram';

-- Facebook - fully self-contained
UPDATE ai_skills SET
  system_prompt = '=== FACEBOOK CONTENT RULES ===

CHARACTER LIMITS (strict):
- Hook: 200 characters max (shows before "See more")
- Body Header: 50 characters max (optional)
- Body: 300 characters max (conversational length)
- CTA: 150 characters max
- Hashtags: Generate 0-2 hashtags MAXIMUM (Facebook is NOT hashtag-driven)

FACEBOOK BEST PRACTICES:
- Conversational tone works best - like talking to friends
- Questions dramatically increase engagement
- Native content outperforms links
- Minimal hashtags - most posts need NONE
- Tag relevant pages/people when appropriate

EMOJI STYLE: Moderate - use 1-2 emojis sparingly

HASHTAG STRATEGY:
- Use 0-2 hashtags ONLY
- Facebook is NOT like Instagram - hashtags hurt more than help
- Only use for specific campaigns or branded tags

CONTENT THAT PERFORMS:
- Personal stories and life updates
- Thought-provoking questions
- Nostalgia and throwbacks
- Community discussions
- Live video announcements',
  updated_at = NOW()
WHERE skill_key = 'platform_facebook';

-- LinkedIn - fully self-contained
UPDATE ai_skills SET
  system_prompt = '=== LINKEDIN CONTENT RULES ===

CHARACTER LIMITS (strict):
- Hook: 150 characters max (first line is EVERYTHING - must hook for "See more" click)
- Body Header: 50 characters max (optional transition)
- Body: 500 characters max (thought leadership length)
- CTA: 150 characters max
- Hashtags: Generate exactly 3-5 hashtags (place at bottom)

LINKEDIN BEST PRACTICES:
- Professional but human - authenticity wins
- First line must create curiosity or tension
- Use single-sentence paragraphs with line breaks
- Personal experiences outperform company announcements
- Thought leadership > self-promotion
- Engagement in first hour is critical

EMOJI STYLE: Minimal - use 0-1 emojis, professional contexts only

FORMATTING:
- One idea per paragraph
- White space is your friend
- Use CAPS sparingly for emphasis (bold doesnt work)
- Lists work well for skimmability

HASHTAG STRATEGY:
- Exactly 3-5 hashtags at the very bottom
- Mix niche industry tags with broader professional tags
- Dont overdo it - this isnt Instagram

CONTENT THAT PERFORMS:
- Career lessons and failures
- Industry insights and predictions
- Contrarian professional opinions
- Data-backed insights
- "Heres what I learned" stories',
  updated_at = NOW()
WHERE skill_key = 'platform_linkedin';

-- TikTok - fully self-contained
UPDATE ai_skills SET
  system_prompt = '=== TIKTOK CONTENT RULES ===

CHARACTER LIMITS (strict):
- Hook: 50 characters max (ULTRA PUNCHY - 3-5 words that grab)
- Body Header: 30 characters max (often skip this)
- Body: 150 characters max (caption supports video, doesnt replace it)
- CTA: 80 characters max
- Hashtags: Generate exactly 3-5 hashtags

TIKTOK BEST PRACTICES:
- Caption is secondary to video - keep it SHORT
- First 3 words must grab attention
- Trend-aware content performs best
- Authenticity > polish
- "Watch till the end" hooks work
- Ask questions for comments

EMOJI STYLE: Heavy - use 2-4 emojis, gen-z friendly

CAPTION STYLE:
- Super short and punchy
- Incomplete sentences that create curiosity
- Use trending phrases when relevant
- Heavy emoji use acceptable

HASHTAG STRATEGY:
- Exactly 3-5 hashtags
- Mix trending tags with niche tags
- #fyp and #foryou are optional, not required

CONTENT THAT PERFORMS:
- Tutorial hooks
- POV content
- Storytime teasers
- Trend participation
- Controversial takes',
  updated_at = NOW()
WHERE skill_key = 'platform_tiktok';

-- YouTube - fully self-contained
UPDATE ai_skills SET
  system_prompt = '=== YOUTUBE DESCRIPTION RULES ===

CHARACTER LIMITS (strict):
- Hook: 100 characters max (first line appears in search results - SEO critical)
- Body Header: 50 characters max (optional section header)
- Body: 400 characters max (summary + value proposition)
- CTA: 150 characters max (subscribe, like, comment prompts)
- Hashtags: Generate exactly 3-5 hashtags (first 3 show above title)

YOUTUBE BEST PRACTICES:
- First 150 characters show in search - make them count
- Include searchable keywords naturally
- Description supports discoverability and SEO
- Timestamp chapters increase watch time (if applicable)
- Links to related content keep viewers on channel

EMOJI STYLE: Minimal - use 0-2 emojis, professional

DESCRIPTION STRUCTURE:
1. Hook line with main keyword (SEO)
2. Brief video summary (2-3 sentences of value)
3. CTA for engagement
4. Hashtags at the bottom

HASHTAG STRATEGY:
- Exactly 3-5 hashtags at the end
- First 3 hashtags show above video title
- Use searchable, relevant topic tags

CONTENT THAT PERFORMS:
- Tutorials and how-to guides
- Reviews and comparisons
- Educational deep-dives
- Commentary and reactions
- Series content teasers',
  updated_at = NOW()
WHERE skill_key = 'platform_youtube';
