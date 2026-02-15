# Social Content Generator - Complete System Documentation

**Last Updated:** 8 February 2026
**Status:** Fully Implemented and Operational

---

## Overview

The Social Content Generator is a production AI content tool with brand intelligence integration, multi-model support, feedback tracking, and a self-improving skill evolution system. It generates structured social media content (Hook, Body Header, Body, CTA, Hashtags) using customisable brand context.

**Location:** `/tools/social-content-generator`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOCIAL CONTENT GENERATOR                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────────────────┐  │
│  │   Frontend  │───►│   Backend API    │───►│   AI Models               │  │
│  │   React     │    │   Express.js     │    │   Gemini/GPT-4o/Claude    │  │
│  └─────────────┘    └──────────────────┘    └───────────────────────────┘  │
│         │                   │                          │                    │
│         │                   ▼                          │                    │
│         │          ┌──────────────────┐                │                    │
│         │          │   Supabase DB    │◄───────────────┘                    │
│         │          │   - ai_skills    │                                     │
│         │          │   - platform_rules│                                    │
│         │          │   - brand_profiles│                                    │
│         │          │   - content_history│                                   │
│         │          │   - evolution_log │                                    │
│         │          └──────────────────┘                                     │
│         │                   │                                               │
│         │                   ▼                                               │
│         │          ┌──────────────────┐                                     │
│         └─────────►│  Feedback Panel  │──────► Skill Evolution Orchestrator │
│                    │  (Quick Rating)  │                                     │
│                    └──────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/tools/social-content-generator.tsx` | Main frontend component (~1400 lines) |
| `client/src/components/social-content/FeedbackPanel.tsx` | Feedback/rating UI component |
| `server/routes/social-content.ts` | All backend API routes (~2100 lines) |
| `server/services/brand-context-loader.ts` | Loads brand profiles from Supabase |
| `migrations/026-038_*.sql` | Database schema migrations |

---

## AI Model Configuration

### Available Models

| Model | Key | Cost (per 100 prompts) | Latency | Status |
|-------|-----|------------------------|---------|--------|
| Gemini 2.0 Flash | `gemini` | $0.024 | ~1.5s | Default |
| GPT-4o Mini | `openai` | $0.036 | ~2.5s | Active |
| Claude 3.5 Haiku | `claude` | $0.068 | ~3.0s | Needs API key |

**Configuration Location:** `server/routes/social-content.ts` lines 60-81

```typescript
const AI_MODELS = {
  gemini: {
    name: 'gemini-2.0-flash',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
  },
  openai: {
    name: 'gpt-4o-mini',  // Used for both generation AND evolution
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  claude: {
    name: 'claude-3-5-haiku-20241022',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
  }
};
```

### Model Usage

- **Content Generation:** User-selectable (Gemini default)
- **Section Enhancement:** Same as generation model
- **Skill Evolution Orchestrator:** GPT-4o Mini (hardcoded for analysis quality)

---

## Database Schema

### Core Tables

#### `social_content_history`
Stores all generated content with feedback tracking.

```sql
CREATE TABLE social_content_history (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES content_clients(id),

  -- Generation context
  platform VARCHAR(50) NOT NULL,
  tone VARCHAR(50) NOT NULL,
  content_type VARCHAR(50),
  model VARCHAR(50) NOT NULL,
  original_prompt TEXT,
  brand_elements JSONB,

  -- Generated content (current state after any edits)
  hook TEXT,
  body_header TEXT,
  body TEXT,
  cta TEXT,
  hashtags TEXT,

  -- Original AI output (immutable - for training comparison)
  original_hook TEXT,
  original_body_header TEXT,
  original_body TEXT,
  original_cta TEXT,
  original_hashtags TEXT,

  -- Modification tracking
  was_modified BOOLEAN DEFAULT false,
  is_curated_example BOOLEAN DEFAULT false,

  -- Quick feedback (primary rating system)
  quick_rating_score SMALLINT CHECK (quick_rating_score BETWEEN 1 AND 9),
  quick_issue VARCHAR(100),  -- Single top issue

  -- Detailed feedback (optional)
  feedback_tags VARCHAR(50)[],
  feedback_comment TEXT,
  section_issues JSONB,  -- Per-section issues

  -- Iteration tracking (re-rating same content)
  rating_iteration_count INT DEFAULT 1,
  highest_rating_score SMALLINT,  -- Best score ever (for training)

  -- Evolution system
  processed_for_evolution BOOLEAN DEFAULT false,
  evolution_cycle_processed INT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rated_at TIMESTAMPTZ
);
```

#### `ai_skills`
Reusable prompt templates that power generation.

```sql
CREATE TABLE ai_skills (
  id UUID PRIMARY KEY,
  skill_key VARCHAR(100) UNIQUE NOT NULL,
  skill_name VARCHAR(200),
  system_prompt TEXT NOT NULL,  -- The actual prompt content
  tool_context VARCHAR(50) DEFAULT 'social_content',
  temperature DECIMAL(3,2) DEFAULT 0.85,
  max_tokens INT DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Skills:**
- `content_enhancer` - Master generation instructions with hook formulas
- `platform_instagram`, `platform_facebook`, `platform_linkedin`, `platform_x` - Platform-specific rules
- `tone_professional`, `tone_casual`, `tone_viral`, etc. - Tone modifiers
- `content_type_*` - Content type instructions (behind_scenes, promo_offer, etc.)
- `evolution_orchestrator` - Self-improvement AI skill

#### `platform_rules`
Platform-specific character limits and guidelines.

```sql
CREATE TABLE platform_rules (
  id UUID PRIMARY KEY,
  platform_key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100),
  icon VARCHAR(10),
  hook_limit INT,
  body_header_limit INT,
  body_limit INT,
  cta_limit INT,
  total_character_limit INT,
  hashtag_count_min INT,
  hashtag_count_max INT,
  emoji_style VARCHAR(50),
  default_tone VARCHAR(50),
  guidelines TEXT,
  is_active BOOLEAN DEFAULT true
);
```

#### `client_brand_profiles`
Brand intelligence data for content personalisation.

```sql
CREATE TABLE client_brand_profiles (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES content_clients(id),

  -- Business context
  industry_segment VARCHAR(200),
  business_niche VARCHAR(200),
  products_services TEXT,
  content_focus_options TEXT[],  -- NEW: Brand-specific content categories

  -- Voice & tone
  voice_rules JSONB,  -- {tone, humor, sentence_length}
  spelling VARCHAR(20) DEFAULT 'british',

  -- Content guidelines
  positive_examples TEXT[],  -- Few-shot examples to emulate
  negative_examples TEXT[],  -- Examples to avoid
  forbidden_phrases TEXT[],
  key_messages TEXT[],

  -- Audience
  target_audience_description TEXT,
  priority_benefits TEXT[],
  secondary_benefits TEXT[]
);
```

#### `skill_evolution_log`
Audit trail of all skill modifications by the evolution system.

```sql
CREATE TABLE skill_evolution_log (
  id UUID PRIMARY KEY,
  evolution_cycle INT NOT NULL,
  target_type VARCHAR(50),  -- 'skill', 'brand_positive', 'brand_negative', etc.
  target_key VARCHAR(200),  -- skill_key or client_id
  change_type VARCHAR(50),  -- 'append', 'replace', 'remove', 'rewrite'
  previous_value TEXT,
  new_value TEXT,
  reasoning TEXT,
  confidence DECIMAL(3,2),
  model_used VARCHAR(50),
  processing_time_ms INT,
  rolled_back BOOLEAN DEFAULT false,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Views

#### `v_evolution_pending_feedback`
Efficient view for loading unprocessed feedback.

```sql
CREATE VIEW v_evolution_pending_feedback AS
SELECT
  h.id, h.platform, h.tone, h.client_id,
  h.quick_rating_score as score,
  h.quick_issue as issue,
  h.feedback_tags, h.feedback_comment,
  h.hook, h.body_header, h.body, h.cta, h.hashtags,
  h.original_hook, h.original_body,
  h.was_modified, h.rating_iteration_count,
  h.created_at, h.rated_at
FROM social_content_history h
WHERE h.quick_rating_score IS NOT NULL
  AND h.processed_for_evolution = false
ORDER BY h.rated_at DESC;
```

---

## API Endpoints

### Content Generation

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/generate` | POST | Generate all content sections |
| `/api/social-content/enhance-section` | POST | Enhance a single section |
| `/api/social-content/preview-prompt` | POST | Preview constructed prompt |

### Platform & Model Configuration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/platforms` | GET | List active platforms with rules |
| `/api/social-content/models` | GET | List available AI models with costs |

### Brand Context

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/brand-context/:clientId` | GET | Load flat brand context |

### Skills Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/skills` | GET | List active skills |
| `/api/social-content/skills/:skillKey` | PUT | Update skill prompt |
| `/api/social-content/skills/test` | POST | Test skill with rate limiting |

### Feedback System

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/feedback` | POST | Submit rating and feedback |
| `/api/social-content/feedback/analysis` | GET | Aggregated feedback analytics |

### Skill Evolution

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social-content/evolve` | POST | Trigger evolution cycle |
| `/api/social-content/evolution/stats` | GET | Dashboard stats |
| `/api/social-content/evolution/log` | GET | View evolution history |
| `/api/social-content/evolution/rollback/:logId` | POST | Rollback a modification |

---

## Content Focus Feature

### Overview

Content Focus allows brands to define specific content categories (e.g., "weddings", "portraits", "achievements") that appear as selectable pill buttons in the UI. The selected focus is injected into the AI prompt to guide content generation.

### Database Column

```sql
-- Migration: 037_add_content_focus_options.sql
ALTER TABLE client_brand_profiles
ADD COLUMN content_focus_options TEXT[] DEFAULT '{}';
```

### UI Location

Content Focus pills appear inside the Brand Selector panel, below the brand pills, with a separator border:

```tsx
{/* Content Focus Selector - Only show if brand has content_focus_options */}
{brandContext?.content_focus_options?.length > 0 && (
  <div className="mt-3 pt-3 border-t border-gray-600">
    <Label className="text-xs text-gray-400 mb-2 block">Content Focus</Label>
    <div className="pill-btn-group flex-wrap">
      <button className={`pill-btn ${!selectedContentFocus ? 'pill-btn-active' : ''}`}>
        All
      </button>
      {brandContext.content_focus_options.map((focus) => (
        <button className={`pill-btn ${selectedContentFocus === focus ? 'pill-btn-active' : ''}`}>
          {focus}
        </button>
      ))}
    </div>
  </div>
)}
```

### Prompt Injection

When a content focus is selected, it's added to the system prompt:

```typescript
${contentFocus ? `
=== CONTENT FOCUS: ${contentFocus.toUpperCase()} ===
Focus this content specifically on: ${contentFocus}
Ensure the hook, body, and CTA all relate to this specific area of the brand's offerings.
` : ''}
```

### Management

Content Focus options are managed via the Brand Profile Editor in the Content Management Dashboard:
- Navigate to Content Management → Select Client → Edit Brand Profile
- Find "Content Focus Options" section
- Add/remove focus categories as needed

---

## Brand Intelligence Integration

### FlatBrandContext Interface

```typescript
interface FlatBrandContext {
  // Client info
  client_name: string;
  client_website?: string;

  // MANDATORY
  spelling: 'british' | 'american' | 'canadian' | 'australian';

  // Business context
  industry_segment: string;
  business_niche: string;
  products_services: string;
  content_focus_options: string[];  // NEW

  // Content rules
  positive_examples: string[];
  negative_examples: string[];
  forbidden_phrases: string[];
  key_messages: string[];

  // Voice settings
  voice_tone: string;
  voice_humor: string;
  voice_sentence_length: string;

  // Visual settings (for image generation context)
  visual_style: string;
  color_personality: string;
  visual_mood: string;

  // Audience & benefits
  target_audience: string;
  priority_benefits: string[];
  secondary_benefits: string[];
}
```

### Brand Element Toggles

Users can cherry-pick which brand elements to include via the "Elements" modal:

- Industry & Niche
- Products & Services
- Voice & Tone
- Target Audience
- Benefits
- Positive Examples (few-shot learning)
- Negative Examples (anti-patterns)
- Forbidden Phrases
- Spelling Preference

All elements default to ON. Toggles update the live prompt preview in real-time.

---

## Feedback System

### Quick Feedback (Primary)

The FeedbackPanel provides streamlined rating:

1. **Score:** 1-9 scale with emoji indicators
2. **Issue:** Single dropdown selection (Too Generic, Wrong Tone, Weak Hook, etc.)
3. **Tags:** Optional multi-select for additional categorisation
4. **Comment:** Optional free-text

### Iteration Tracking

When users re-rate the same content (after editing):
- `rating_iteration_count` increments
- `highest_rating_score` tracks the best score ever given
- Current content fields are updated to reflect edits
- Original AI output remains immutable in `original_*` columns

### Hybrid Content Tracking

```sql
-- Pure AI feedback (unmodified output) - most valuable for training
SELECT * FROM social_content_history
WHERE was_modified = false AND quick_rating_score IS NOT NULL;

-- Human-polished (AI generated, then refined by user)
SELECT * FROM social_content_history
WHERE was_modified = true AND is_curated_example = false;

-- Curated examples (manually injected ideal content)
SELECT * FROM social_content_history
WHERE is_curated_example = true;
```

---

## Skill Evolution System

### Overview

A self-improving AI orchestrator that analyses user feedback and autonomously modifies skills, brand examples, and even its own orchestrator prompt.

### Evolution Cycle Flow

```
1. Load pending feedback from v_evolution_pending_feedback view
2. Load current skills from ai_skills (including orchestrator's own skill)
3. Load brand context for relevant clients
4. Call OpenAI GPT-4o-mini with orchestrator skill prompt
5. Parse JSON response for modifications
6. Apply changes to ai_skills and client_brand_profiles
7. Log all changes to skill_evolution_log
8. Mark feedback as processed
```

### Modification Types

| Type | Target | Description |
|------|--------|-------------|
| `SKILL_INSTRUCTION` | skill_key | Add/modify rule in skill prompt |
| `SKILL_EXAMPLE` | skill_key | Add concrete example to skill |
| `BRAND_POSITIVE` | client_id | Add high-rated content to positive_examples |
| `BRAND_NEGATIVE` | client_id | Add low-rated content to negative_examples |
| `BRAND_FORBIDDEN` | client_id | Add phrase to forbidden_phrases |
| `DESCRIPTION_OVER_EXAMPLE` | skill_key | Add descriptive instruction |
| `ORCHESTRATOR_SELF` | evolution_orchestrator | Self-modify orchestrator prompt |

### Quality Thresholds

- Minimum 3 feedback entries before patterns are acted upon
- Confidence ≥0.7 required for any modification
- Confidence ≥0.9 required for self-modification (ORCHESTRATOR_SELF)
- Positive examples capped at 10 (oldest rotated out)
- Negative examples capped at 5

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

Every modification is logged with `previous_value`, enabling manual rollback via API or direct SQL.

---

## Section Enhancement Tools

Per-section editing buttons for fine-tuning generated content:

| Button | Action | Description |
|--------|--------|-------------|
| ➖ Reduce | `reduce` | Remove unnecessary words, aim for 40-50% reduction |
| ➕ Increase | `increase` | Append one relevant, insightful sentence |
| ✅ Grammar | `grammar` | Fix spelling, grammar, improve sentence flow |
| 🔄 Rewrite | `rewrite` | Complete fresh phrasing, preserve meaning |
| 📝 Tone | dropdown | 12 professional tone options |

### Visual States

- **Grey icons:** No content present (disabled)
- **White icons:** Content ready for enhancement
- **Amber pulsing:** Processing with status text
- **Blue undo button:** 10-second auto-dismiss with content restoration

---

## Prompt Architecture

### Single Prompt Strategy (Option B)

All skills are concatenated into a single comprehensive prompt:

```
=== MASTER INSTRUCTIONS ===
{content_enhancer skill}

=== CONTENT TYPE: {TYPE} ===
{content_type_* skill}

=== CONTENT FOCUS: {FOCUS} ===  (if selected)
Focus this content specifically on: {focus}

=== PLATFORM: {PLATFORM} ===
{platform_* skill with baked-in character limits}

=== TONE: {TONE} ===
{tone_* skill}

=== BRAND CONTEXT ===
{filtered brand elements based on toggles}

=== USER REQUEST ===
{user prompt or creative mode instruction}

=== OUTPUT FORMAT ===
{JSON structure for sections}
```

### Template Variable Substitution

Platform skills include template variables that are replaced at runtime:
- `{{hook_limit}}` → actual character limit
- `{{body_limit}}` → actual character limit
- etc.

---

## Feedback Analysis Script

**Location:** `scripts/social-content-feedback-analysis.sh`

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
./scripts/social-content-feedback-analysis.sh raw        # Raw JSON
```

**Requirements:** Dev server running on `localhost:3000`, `jq` installed

---

## Environment Variables

```bash
GEMINI_API_KEY=...           # Required for Gemini
OPENAI_API_KEY=...           # Required for GPT-4o (and evolution)
ANTHROPIC_API_KEY=...        # Required for Claude
VITE_SUPABASE_URL=...        # Supabase connection
SUPABASE_SECRET_KEY=...      # Supabase admin access
```

---

## Migrations Reference

| Migration | Purpose |
|-----------|---------|
| `026_add_social_content_skills.sql` | Initial skills table setup |
| `027_fix_platform_rules_values.sql` | Platform rules fixes |
| `033_rewrite_skills_compact.sql` | Ultra-compact skill rewrite |
| `034_fix_platform_total_limits.sql` | Template variable substitution |
| `035_add_original_content_tracking.sql` | Hybrid content tracking columns |
| `036_skill_evolution_system.sql` | Evolution log + views |
| `037_add_content_focus_options.sql` | Content Focus array column |
| `038_fix_evolution_security.sql` | Security fixes for views and RLS |

---

## Known Issues

1. **getSkill helper unused** - TypeScript hint warning (non-blocking)
2. **Rate limiting on skill test** - 3-second cooldown may feel slow
3. **Claude not available** - Needs ANTHROPIC_API_KEY environment variable

---

## Future Enhancements

### High Priority
- Add Claude API key for third model option
- Skills refinement based on feedback patterns
- Content history sidebar for quick reuse

### Medium Priority
- Platform character validation warnings in UI
- Copy individual sections buttons
- A/B variation generation

### Future
- Image generation integration
- Scheduling/queue system
- Real performance tracking from published content
- Cross-platform learning (Instagram patterns inform LinkedIn)

---

*Document generated from implementation on 8 February 2026*
