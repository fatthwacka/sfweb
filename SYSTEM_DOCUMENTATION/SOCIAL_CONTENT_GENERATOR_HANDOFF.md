# Social Content Generator - Handoff Document

**Date:** 8 February 2026
**Status:** Functional MVP with brand intelligence, feedback tracking, and self-improvement tooling

---

## Overview

The Social Content Generator is a platform-aware social media content tool with brand intelligence integration. It generates structured content (Hook, Body Header, Body, CTA, Hashtags) using AI models with customisable brand context.

**Location:** `/tools/social-content-generator`

---

## Architecture

### Frontend
- **Page:** `client/src/pages/tools/social-content-generator.tsx`
- **Route:** Registered in `shared/config/tools-registry.tsx`

### Backend
- **Routes:** `server/routes/social-content.ts`
- **Brand Loader:** `server/services/brand-context-loader.ts`

### Database (Supabase)
- **`platform_rules`** - Platform-specific limits and guidelines
- **`ai_skills`** - Reusable prompt templates (content_enhancer, platform_*, tone_*)
- **`client_brand_profiles`** - Brand intelligence data

---

## What's Working

### Multi-Model AI Support
- **Gemini 2.0 Flash** (default) - $0.024/100 prompts
- **GPT-4o Mini** - $0.036/100 prompts
- **Claude 3.5 Haiku** - $0.068/100 prompts (needs API key)

Unified `callAI()` abstraction routes to appropriate provider. Model selector uses pill-btn styling matching other selectors.

### Brand Intelligence Integration
Brand context flows from Supabase through to the AI prompt:
- Industry & niche
- Products & services
- Voice & tone
- Target audience
- Key benefits
- **Positive examples** (few-shot learning - examples to emulate)
- **Negative examples** (examples to avoid)
- Forbidden phrases
- Spelling preference (British/American)

### Brand Element Toggles
Users can cherry-pick which brand elements to include via the "Elements" modal:
- All elements default to ON
- Toggles update live prompt preview in real-time
- `brandElements` object sent to backend with generate request
- Backend filters brand context based on enabled elements

### Skills System
Skills are loaded from `ai_skills` table and concatenated into single prompt (Option B architecture):
- `content_enhancer` - Master generation instructions
- `platform_{platform}` - Platform-specific rules (Instagram, Facebook, LinkedIn, X)
- `tone_{tone}` - Tone-specific writing style

Skills are **self-contained** with all character limits baked in - no external table lookups needed.

### Live Prompt Preview
The "Final Constructed Prompt" panel shows exactly what will be sent to AI:
- Updates live as user changes settings
- Respects brand element toggles
- Shows which skills are loaded
- Character count display

### Section Enhancement Tools
Per-section editing buttons:
- Reduce/Increase word count
- Grammar check
- Complete rewrite
- Custom prompt
- Tone adjustment (12 options)
- 10-second undo functionality

---

## Recent Changes (This Session)

### Session 1 (Previous)

1. **Multi-model support** - Added OpenAI and Claude alongside Gemini
2. **Model selector UI** - Pill buttons matching brand/platform/tone selectors
3. **SlyFox default brand** - Auto-selected on page load
4. **Generate button validation** - Disabled unless brand OR prompt provided
5. **Brand element toggles** - Separated positive/negative examples, all default ON
6. **Brand elements flow-through** - Fixed: toggles now actually filter the prompt

### Session 2 (6 Feb 2026 - Evening)

1. **Full API testing completed** - All endpoints verified working
2. **Rewrite action fix** - Now returns single rewrite instead of multiple options
3. **British spelling confirmed** - Brand context correctly applies spelling preference
4. **OpenAI model verified** - GPT-4o Mini working alongside Gemini

### Session 3 (8 Feb 2026)

1. **Ultra-compact skill rewrite** - Reduced skills from ~30KB to ~15KB total
   - Added hook formulas (Contrarian, Pain, Failure, Lessons, Stat)
   - Platform personalities and anti-cliché rules
   - Migration: `033_rewrite_skills_compact.sql`

2. **Platform character limits fix** - Template variable substitution now working
   - `{{hook_limit}}` etc. replaced with actual values from `platform_rules`
   - Total character limits corrected per platform
   - Migration: `034_fix_platform_total_limits.sql`

3. **Hybrid content tracking** - Store both original AI output AND user-modified content
   - `original_hook`, `original_body`, etc. columns (immutable after generation)
   - `was_modified` flag - true if user edited any section
   - `is_curated_example` flag - for manually injected training examples
   - Migration: `035_add_original_content_tracking.sql`

4. **Feedback analysis script** - Reusable CLI tool for quality analysis
   - Location: `scripts/social-content-feedback-analysis.sh`
   - Instant metrics: scores, issues, platform/tone breakdown
   - See "Self-Improvement Tooling" section below

5. **Positive examples priority fix** - Examples were overshadowing hook formulas
   - Changed label from "GOOD CONTENT EXAMPLES (match this style)" to "TONE REFERENCE EXAMPLES"
   - Added explicit instruction: "match the voice/energy, NOT the structure"
   - Reminded AI that "HOOK FORMULAS in Master Instructions define your actual opening structure"
   - File: `server/routes/social-content.ts` lines 877-886

### Session 4 (8 Feb 2026 - Evening)

1. **Content Focus feature** - Brand-specific content categories
   - New column: `client_brand_profiles.content_focus_options TEXT[]`
   - Examples: SlyFox uses ['weddings', 'portraits', 'product', 'commercial']
   - Migration: `037_add_content_focus_options.sql`
   - UI: Pill buttons inside Brand Selector panel (grouped logically)
   - Prompt injection: Adds `=== CONTENT FOCUS: {focus} ===` section

2. **Content Focus UI location fix** - Moved from top of form to Brand Selector
   - Previously at line ~1167 near Content Type
   - Now at line ~1359 inside Brand Selector panel after brand pills
   - Separated by `border-t border-gray-600` for visual grouping

3. **Model configuration clarification**
   - Content generation: User-selectable (Gemini default, GPT-4o Mini, Claude)
   - Evolution orchestrator: GPT-4o Mini (hardcoded at line 1683)
   - Current OpenAI model: `gpt-4o-mini` (not GPT-4.1)
   - Decision: Stay with cheap model for debugging, upgrade to GPT-4.1 later

4. **Security fixes for evolution system**
   - Views recreated with `SECURITY INVOKER` (not DEFINER)
   - RLS enabled on `skill_evolution_log` table
   - Migration: `038_fix_evolution_security.sql`

5. **Brand context loader update**
   - `content_focus_options` added to `FlatBrandContext` interface
   - `BrandContextLoader.loadFlatBrandContext()` now returns content focus options
   - File: `server/services/brand-context-loader.ts`

---

## Self-Improvement Tooling

### Feedback Analysis Script

**Location:** `scripts/social-content-feedback-analysis.sh`

Run instant feedback analysis without manual API exploration:

```bash
# Quick summary (default)
./scripts/social-content-feedback-analysis.sh

# Full analysis
./scripts/social-content-feedback-analysis.sh all

# Specific reports
./scripts/social-content-feedback-analysis.sh issues     # Issue breakdown
./scripts/social-content-feedback-analysis.sh platforms  # By platform
./scripts/social-content-feedback-analysis.sh tones      # By tone
./scripts/social-content-feedback-analysis.sh low        # Low-rated content (≤3)
./scripts/social-content-feedback-analysis.sh high       # High-rated content (≥7)
./scripts/social-content-feedback-analysis.sh raw        # Raw JSON for custom analysis
```

**Requirements:**

- Dev server running on `localhost:3000`
- `jq` installed (`brew install jq`)

**Output includes:**

- Total rated entries and average score
- Score distribution (1-9 scale)
- Quality tiers (Poor/Neutral/Good)
- Top issues (summary + section-level)
- Platform and tone performance
- Example low/high-rated content

### Training Data Queries

Use these SQL patterns for skill evolution:

```sql
-- Pure AI feedback (unmodified output)
SELECT * FROM social_content_history
WHERE was_modified = false AND quick_rating_score IS NOT NULL;

-- Human-polished (AI generated, then refined)
SELECT * FROM social_content_history
WHERE was_modified = true AND is_curated_example = false;

-- Curated examples (manually injected ideal content)
SELECT * FROM social_content_history
WHERE is_curated_example = true;
```

---

## Database Tables

### platform_rules
```sql
- platform_key (instagram, facebook, linkedin, x)
- hook_limit, body_header_limit, body_limit, cta_limit
- hashtag_count_min, hashtag_count_max
- total_character_limit
- emoji_style, default_tone, guidelines
```

### ai_skills
```sql
- skill_key (content_enhancer, platform_instagram, tone_professional, etc.)
- system_prompt (the actual prompt template)
- tool_context ('social_content' or 'all')
- temperature, max_tokens
- is_active
```

### client_brand_profiles
```sql
- client_id (FK to content_clients)
- industry_segment, products_services
- voice_tone, target_audience
- positive_examples, negative_examples (arrays)
- forbidden_phrases (array)
- spelling ('british'|'american')
- priority_benefits (array)
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/platforms` | GET | List active platforms with rules |
| `/api/social-content/models` | GET | List available AI models with costs |
| `/api/social-content/brand-context/:clientId` | GET | Load flat brand context |
| `/api/social-content/skills` | GET | List active skills |
| `/api/social-content/skills/:skillKey` | PUT | Update skill prompt |
| `/api/social-content/skills/test` | POST | Test skill with rate limiting |
| `/api/social-content/generate` | POST | Generate all sections |
| `/api/social-content/enhance-section` | POST | Enhance single section |
| `/api/social-content/preview-prompt` | POST | Preview constructed prompt |

---

## Key Files

```
client/src/pages/tools/social-content-generator.tsx  # Main frontend
server/routes/social-content.ts                       # All API routes
server/services/brand-context-loader.ts               # Brand data loader
migrations/026_add_social_content_skills.sql          # Skills table setup
migrations/027_fix_platform_rules_values.sql          # Platform rules fixes
```

---

## Environment Variables Required

```bash
GEMINI_API_KEY=...           # Required for Gemini
OPENAI_API_KEY=...           # Required for GPT-4o
ANTHROPIC_API_KEY=...        # Required for Claude (not yet configured)
VITE_SUPABASE_URL=...        # Supabase connection
SUPABASE_SECRET_KEY=...      # Supabase admin access
```

---

## Potential Next Steps

### High Priority
1. **Test actual generation** - Verify content quality with different brands/platforms
2. **Add Claude API key** - Enable third model option
3. **Skills refinement** - Fine-tune platform and tone skills based on output quality

### Medium Priority
4. **Content history** - Save generated content to database
5. **Favourites/templates** - Save successful prompts for reuse
6. **Platform character validation** - Visual warnings when content exceeds limits
7. **Copy individual sections** - Per-section copy buttons

### Future Enhancements
8. **Image generation integration** - Connect to AI Image Generator
9. **Scheduling** - Queue posts for future publishing
10. **Analytics** - Track which prompts/brands perform best
11. **A/B variations** - Generate multiple versions for testing

---

## Known Issues

1. **getSkill helper unused** - TypeScript hint warning (non-blocking)
2. **Rate limiting on skill test** - 3-second cooldown may feel slow
3. **No content persistence** - Generated content lost on page refresh
4. **Claude not available** - Needs ANTHROPIC_API_KEY environment variable

---

## Architecture Decision: Option B (Single Prompt)

We chose **Option B: Skills as prompt context (1 API call)** over Option A (multi-stage).

**Rationale:**
- More cost-efficient (1 call vs 4-5 calls)
- Faster generation time
- Skills are concatenated into single comprehensive prompt
- Easier to maintain and debug

The prompt structure:
```
=== MASTER INSTRUCTIONS ===
{content_enhancer skill}

=== PLATFORM: {PLATFORM} ===
{platform_* skill with baked-in limits}

=== TONE: {TONE} ===
{tone_* skill}

=== BRAND CONTEXT ===
{filtered brand elements}

=== USER REQUEST ===
{user prompt or creative mode instruction}

=== OUTPUT FORMAT ===
{JSON structure for sections}
```

---

## Testing Checklist

- [x] Generate with SlyFox brand (default) ✅ Verified
- [ ] Generate with no brand (just prompt)
- [x] Generate with no prompt (just brand - creative mode) ✅ Verified
- [x] Toggle brand elements off and verify prompt changes ✅ Verified
- [x] Switch between Gemini and GPT-4o ✅ Both working
- [x] Test section enhancement tools ✅ All actions working
- [x] Verify undo functionality ✅ Client-side implementation
- [ ] Check character count warnings (UI needs manual testing)

---

## Skill Evolution System (NEW - 8 February 2026)

### Overview

A self-improving AI orchestrator that analyses user feedback and autonomously modifies skills, brand examples, and even its own orchestrator prompt.

### Architecture

**Database Tables:**
- `skill_evolution_log` - Audit trail of all skill/brand modifications

**New Columns on `social_content_history`:**
- `rating_iteration_count` - How many times this content was re-rated
- `highest_rating_score` - Best score ever given (for training - use best version)
- `evolution_cycle_processed` - Which evolution cycle processed this feedback

**Key Skill:**
- `evolution_orchestrator` - AI skill stored in Supabase that can self-modify

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/evolve` | POST | Trigger evolution cycle |
| `/api/social-content/evolution/stats` | GET | Dashboard stats |
| `/api/social-content/evolution/log` | GET | View evolution history |
| `/api/social-content/evolution/rollback/:logId` | POST | Rollback a modification |

### Evolution Cycle Flow

1. Load pending feedback from `v_evolution_pending_feedback` view
2. Load current skills from `ai_skills` (including orchestrator's own skill)
3. Load brand context for relevant clients
4. Call OpenAI GPT-4o-mini with orchestrator skill prompt
5. Parse JSON response for modifications
6. Apply changes to `ai_skills` and `client_brand_profiles`
7. Log all changes to `skill_evolution_log`
8. Mark feedback as processed

### Modification Types

| Type | Target | Description |
|------|--------|-------------|
| `SKILL_INSTRUCTION` | skill_key | Add/modify rule in skill prompt |
| `SKILL_EXAMPLE` | skill_key | Add concrete example to skill |
| `BRAND_POSITIVE` | client_id | Add high-rated content to positive_examples |
| `BRAND_NEGATIVE` | client_id | Add low-rated content to negative_examples |
| `BRAND_FORBIDDEN` | client_id | Add phrase to forbidden_phrases |
| `ORCHESTRATOR_SELF` | evolution_orchestrator | Self-modify orchestrator prompt |

### Quality Thresholds

- Minimum 3 feedback entries before patterns are acted upon
- Confidence ≥0.7 required for any modification
- Confidence ≥0.9 required for self-modification
- Positive examples capped at 10 (oldest rotated out)
- Negative examples capped at 5

### Feedback Iteration Tracking

The system tracks re-ratings on the existing history record (no separate table):

- `rating_iteration_count` increments with each re-rating
- `highest_rating_score` tracks the best score (for training - use best version)
- Current content is always updated, so the final version reflects human polish

```typescript
// Frontend sends iteration number
const iterationNumber = submissionCount + 1;
await fetch('/api/social-content/feedback', {
  body: JSON.stringify({
    contentId,
    iterationNumber,
    finalContent: { hook, body, cta, ... },
    detailedFeedback: { summary: { score, issues } }
  })
});
```

### Triggering Evolution

```bash
# Manual trigger (dev/testing)
curl -X POST http://localhost:3000/api/social-content/evolve

# Check stats
curl http://localhost:3000/api/social-content/evolution/stats

# View history
curl http://localhost:3000/api/social-content/evolution/log

# Rollback a change
curl -X POST http://localhost:3000/api/social-content/evolution/rollback/{logId}
```

### Rollback Support

Every modification is logged with `previous_value`, enabling manual rollback:

```sql
-- View recent modifications
SELECT * FROM skill_evolution_log
ORDER BY created_at DESC
LIMIT 10;

-- Rollback via API
POST /api/social-content/evolution/rollback/:logId
```

### Migration Required

Run `migrations/036_skill_evolution_system.sql` in Supabase SQL Editor before using.

---

*Last updated: 8 February 2026 (Session 4)*
