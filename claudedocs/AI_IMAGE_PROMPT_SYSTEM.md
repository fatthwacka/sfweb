# AI Image Generator - Prompt Enhancement System

> **Document Version:** 1.0
> **Last Updated:** January 2026
> **Status:** Current Implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Prompt Components](#prompt-components)
5. [Enhancement Paths](#enhancement-paths)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Frontend Integration](#frontend-integration)
9. [Fallback Hierarchy](#fallback-hierarchy)
10. [Configuration Options](#configuration-options)

---

## System Overview

The AI Image Generator uses a **multi-stage prompt enhancement pipeline** that transforms simple user descriptions into rich, detailed prompts optimised for Vertex AI image generation.

### Key Concepts

| Term | Description |
|------|-------------|
| **User Prompt** | The raw description entered by the user (e.g., "coffee cup on table") |
| **System Prompt** | Instructions for Gemini on HOW to enhance prompts |
| **Enhancement Guidelines** | Specific rules for elaborating prompts (Path A or Path B) |
| **Enhanced Prompt** | The final, detailed prompt sent to Vertex AI |
| **Image Ingredients** | Reference images uploaded for composition guidance |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│   │  Image           │    │  Brand           │    │  Image           │     │
│   │  Description     │    │  Intelligence    │    │  Ingredients     │     │
│   │  (User Prompt)   │    │  (Optional)      │    │  (Reference PNGs)│     │
│   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│            │                       │                       │                │
│            └───────────────────────┼───────────────────────┘                │
│                                    │                                        │
│                                    ▼                                        │
│                        ┌───────────────────────┐                            │
│                        │   ENHANCE BUTTON (✨)  │                            │
│                        │   Triggers Gemini     │                            │
│                        └───────────┬───────────┘                            │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GEMINI ENHANCEMENT LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        PROMPT ASSEMBLY                               │   │
│   │                                                                      │   │
│   │   1. System Prompt (from ai_prompt_overrides or hardcoded default)  │   │
│   │   2. Enhancement Guidelines (Path A or Path B based on assets)      │   │
│   │   3. Brand Context (if brand intelligence enabled)                  │   │
│   │   4. User Prompt (the actual description)                           │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                                    │                                        │
│                                    ▼                                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     GEMINI 2.0 FLASH                                 │   │
│   │                                                                      │   │
│   │   Input:  System + Enhancement + Brand + User Prompt                │   │
│   │   Output: Enhanced, detailed image generation prompt                │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERTEX AI IMAGE GENERATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Model Selection:                                                          │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│   │  Nano Lite     │  │  Nano Pro      │  │  Imagen Ultra  │               │
│   │  512px ($0.01) │  │  1024px ($0.02)│  │  2048px ($0.04)│               │
│   │  + Ingredients │  │  + Ingredients │  │  Text Only     │               │
│   └────────────────┘  └────────────────┘  └────────────────┘               │
│                                                                              │
│   API Payload:                                                              │
│   • Enhanced Prompt (from Gemini)                                           │
│   • Style Parameters (art style, image style)                               │
│   • Technical Settings (aspect ratio, resolution)                           │
│   • Reference Images (if Nano model selected)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Step-by-Step Process

```
1. USER INPUT
   ├── User types: "coffee cup on marble table"
   ├── Selects brand: "Artisan Coffee Co." (optional)
   └── Uploads: product.png as [product1] ingredient (optional)

2. PATH DETECTION
   ├── Has image ingredients?
   │   ├── YES → Use "Path B: With Assets" enhancement guidelines
   │   └── NO  → Use "Path A: No Assets" enhancement guidelines

3. PROMPT ASSEMBLY (for Gemini)
   ├── System Prompt: "You are an expert AI image prompt engineer..."
   ├── Enhancement Guidelines: [Path A or Path B instructions]
   ├── Brand Context: "Industry: Coffee/Hospitality, Colors: Warm browns..."
   └── User Prompt: "coffee cup on marble table"

4. GEMINI ENHANCEMENT
   └── Output: "A artisanal ceramic coffee cup with a rich crema sits
       elegantly on a white Carrara marble surface. Soft morning light
       streams from the left, creating gentle shadows. Steam wisps rise
       in delicate spirals. Shallow depth of field with warm amber tones
       and a hint of golden hour warmth..."

5. VERTEX AI GENERATION
   ├── Model: imagen-3.0-generate-001 (Nano Pro)
   ├── Enhanced Prompt: [from step 4]
   ├── Reference Images: [product1] = product.png
   ├── Aspect Ratio: 1:1
   └── Resolution: 1024px

6. OUTPUT
   └── Generated AI image displayed in preview panel
```

---

## Prompt Components

### 1. System Prompt

**Purpose:** High-level instructions that define Gemini's role and behaviour.

**Location:**
- Database: `ai_prompt_overrides` table (content_type='image', prompt_component='system')
- Fallback: Hardcoded in `server/routes/ai-prompt-overrides.ts`

**Current Default:**
```
You are an expert AI image prompt engineer. Your task is to enhance
prompts for image generation to be more descriptive, visually compelling,
and technically optimized for AI image models.

Focus on:
- Visual details: lighting, composition, colours, textures
- Style guidance: photorealistic, cinematic, illustrated, etc.
- Technical parameters: aspect ratio considerations, resolution hints
- Mood and atmosphere: emotional tone, time of day, weather

IMPORTANT: Return ONLY the enhanced prompt. No introductions,
explanations, or formatting markers.
```

---

### 2. Enhancement Guidelines

**Purpose:** Specific instructions for HOW to elaborate the user's prompt.

**Two Paths:**

#### Path A: No Assets (enhancement_no_assets)

Used when the user has NOT uploaded any reference images.

```
You are an expert image prompt engineer. The user has provided a brief
creative concept. Your job is to elaborate it into a rich, detailed
image generation prompt.

YOUR TASK:
Take the user's short concept and expand it into a detailed, evocative
image prompt. Add:
- Specific visual details that bring the scene to life
- Atmospheric elements (lighting, time of day, weather, mood)
- Camera perspective and lens characteristics (wide angle, macro, depth of field)
- Composition guidance (rule of thirds, leading lines, foreground interest)
- Material textures and surface qualities
- Colour palette suggestions that match the mood

Keep the user's core idea intact but enrich it with professional
photography/art direction knowledge.
```

#### Path B: With Assets (enhancement_with_assets)

Used when the user HAS uploaded reference images (image ingredients).

```
You are an expert image prompt engineer. The user has uploaded reference
images and provided a creative concept. Your job is to elaborate their
vision into a rich, cinematic image prompt.

ADD FREELY:
- Dramatic lighting (golden hour, rim lighting, soft diffused, dramatic shadows)
- Atmospheric mood (misty, ethereal, energetic, serene, electric)
- Camera craft (shallow depth of field, wide angle drama, macro detail, dynamic angle)
- Surface textures and material qualities (glossy reflections, matte surfaces, fabric textures)
- Environmental atmosphere (floating particles, light rays, subtle bokeh)
- Motion and energy (frozen motion, gentle movement, dynamic action)
- Colour grading and mood (warm tones, cool blues, vibrant saturation)

DO NOT:
- Describe what's IN the reference images (their appearance, colours, shapes)
- Add new people, products, or objects the user didn't mention
- Remove elements the user requested
```

**Key Difference:** Path B explicitly instructs Gemini NOT to describe the reference images themselves, since Vertex AI will see them directly.

---

### 3. Brand Context (Optional)

**Purpose:** Inject brand-specific styling and constraints.

**Source:** `client_brand_profiles` table via Brand Intelligence panel.

**Toggleable Elements:**
| Toggle | Data Injected |
|--------|---------------|
| Visual Style | Color personality, visual mood, brand colors |
| Industry Context | Business segment, niche, industry keywords |
| Target Audience | Customer demographics, psychographics |
| Smart Benefits | Priority and secondary product benefits |
| Content Guidelines | Positive content examples, approved themes |
| Compliance Rules | Forbidden phrases, restricted topics |

---

### 4. User Prompt

**Purpose:** The actual creative concept from the user.

**Examples:**
- Simple: "coffee cup"
- Moderate: "coffee cup on marble table with morning light"
- Detailed: "artisan pour-over coffee being prepared, steam rising, rustic cafe setting"

---

## Enhancement Paths

### Decision Logic

```javascript
// In enhancePrompt() function:

const hasAssets = Object.keys(ingredients).length > 0;

if (hasAssets) {
  // Use Path B: enhancement_with_assets
  enhancementInstructions = enhancementWithAssets;
} else {
  // Use Path A: enhancement_no_assets
  enhancementInstructions = enhancementNoAssets;
}
```

### Visual Decision Tree

```
                    User clicks "Enhance" (✨)
                              │
                              ▼
                    ┌─────────────────┐
                    │ Any ingredients │
                    │   uploaded?     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
        ┌─────────┐                   ┌─────────┐
        │   NO    │                   │   YES   │
        └────┬────┘                   └────┬────┘
             │                             │
             ▼                             ▼
    ┌────────────────┐           ┌────────────────┐
    │    PATH A      │           │    PATH B      │
    │  No Assets     │           │  With Assets   │
    │                │           │                │
    │ • Add visual   │           │ • Add mood &   │
    │   details      │           │   atmosphere   │
    │ • Add lighting │           │ • DON'T describe│
    │ • Add camera   │           │   the images   │
    │   angles       │           │ • DON'T add new│
    │ • Full creative│           │   objects      │
    │   freedom      │           │                │
    └────────────────┘           └────────────────┘
```

---

## Database Schema

### Table: `ai_prompt_overrides`

```sql
CREATE TABLE ai_prompt_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES content_clients(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,        -- 'image', 'video', 'caption', 'blog', 'script'
  prompt_component TEXT NOT NULL,    -- 'system', 'enhancement_no_assets',
                                     -- 'enhancement_with_assets', 'gemini_config'
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Points:
- **client_id = NULL** means global default (applies to all)
- **client_id = UUID** means client-specific override
- **prompt_component** determines which part of the pipeline this text controls

### Lookup Priority:
1. Client-specific override (if clientId provided)
2. Global override (client_id IS NULL)
3. Hardcoded default (in server code)

---

## API Endpoints

### GET `/api/ai-prompt-overrides/:contentType`

Fetch a specific prompt component.

**Query Parameters:**
- `clientId` (optional) - UUID of specific client
- `component` (optional) - 'system' | 'enhancement_no_assets' | 'enhancement_with_assets' | 'gemini_config'

**Response:**
```json
{
  "id": "uuid-or-null",
  "client_id": "uuid-or-null",
  "content_type": "image",
  "prompt_component": "system",
  "prompt_text": "You are an expert...",
  "is_active": true,
  "is_default": false,
  "created_at": "2026-01-18T...",
  "updated_at": "2026-01-18T..."
}
```

### POST `/api/ai-prompt-overrides`

Create or update a prompt override.

**Request Body:**
```json
{
  "clientId": null,
  "contentType": "image",
  "promptComponent": "enhancement_no_assets",
  "promptText": "Your custom enhancement instructions..."
}
```

### GET `/api/ai-prompt-overrides/all/:contentType`

Fetch ALL prompt components for a content type (useful for the editor UI).

---

## Frontend Integration

### State Management

```typescript
// Panel states for collapsible UI
const [panelStates, setPanelStates] = useState({
  imageDescription: true,      // expanded by default
  aiModel: false,              // collapsed
  textOverlays: false,         // collapsed
  brandIntelligence: false,    // collapsed
  styleSettings: false,        // collapsed
  enhancementGuidelines: true, // expanded by default
  imageIngredients: false,     // collapsed
  generatedPreview: false,     // collapsed
  systemPrompt: true,          // expanded by default
  apiPreview: true,            // expanded by default
});

// Prompt states
const [systemPrompt, setSystemPrompt] = useState('');
const [enhancementNoAssets, setEnhancementNoAssets] = useState('');
const [enhancementWithAssets, setEnhancementWithAssets] = useState('');

// Committed versions (for reset functionality)
const [committedSystemPrompt, setCommittedSystemPrompt] = useState('');
const [committedEnhancementNoAssets, setCommittedEnhancementNoAssets] = useState('');
const [committedEnhancementWithAssets, setCommittedEnhancementWithAssets] = useState('');
```

### Enhancement Flow

```typescript
const enhancePrompt = async () => {
  // 1. Determine which enhancement path to use
  const hasAssets = Object.keys(ingredients).length > 0;
  const enhancementInstructions = hasAssets
    ? enhancementWithAssets
    : enhancementNoAssets;

  // 2. Build brand context if enabled
  const brandContext = buildBrandContext();

  // 3. Call enhancement API
  const response = await fetch('/api/ai/enhance-prompt', {
    method: 'POST',
    body: JSON.stringify({
      prompt: userPrompt,
      systemPrompt: systemPrompt,
      enhancementInstructions: enhancementInstructions,
      brandContext: brandContext,
      contentType: 'image'
    })
  });

  // 4. Update UI with enhanced prompt
  const { enhancedPrompt } = await response.json();
  setPrompt(enhancedPrompt);
};
```

---

## Fallback Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    PROMPT RESOLUTION                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. CHECK: Client-specific override exists?                │
│      │                                                       │
│      ├── YES → Use client override                          │
│      │                                                       │
│      └── NO ↓                                               │
│                                                              │
│   2. CHECK: Global override exists (client_id IS NULL)?     │
│      │                                                       │
│      ├── YES → Use global override                          │
│      │                                                       │
│      └── NO ↓                                               │
│                                                              │
│   3. FALLBACK: Use hardcoded default from server code       │
│      └── DEFAULT_PROMPTS[contentType][component]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Options

### Gemini Configuration

Stored in `prompt_component = 'gemini_config'`:

```json
{
  "temperature": 0.7,
  "topK": 40,
  "topP": 0.95,
  "maxOutputTokens": 800
}
```

### Content Type Defaults

| Content Type | Temperature | Max Tokens | Use Case |
|--------------|-------------|------------|----------|
| image | 0.7 | 800 | Balanced creativity |
| video | 0.5 | 600 | More controlled (VEO rules) |
| caption | 0.8 | 200 | High creativity, short output |
| blog | 0.7 | 1500 | Balanced, longer output |
| script | 0.6 | 1000 | Moderate creativity |

---

## Files Reference

| File | Purpose |
|------|---------|
| `client/src/pages/tools/ai-image-generator.tsx` | Main UI component |
| `server/routes/ai-prompt-overrides.ts` | API routes + hardcoded defaults |
| `server/services/vertex-ai-image-generator.ts` | Vertex AI integration |
| `scripts/migrations/create_ai_prompt_overrides.sql` | Database schema |

---

## Future Considerations

1. **Per-client prompt customisation** - Currently global only; client_id field ready for use
2. **A/B testing prompts** - Track which enhancement guidelines produce better results
3. **Prompt versioning** - History of changes for rollback capability
4. **Analytics integration** - Track prompt length vs generation quality correlation

---

*Document maintained in `/claudedocs/AI_IMAGE_PROMPT_SYSTEM.md`*
