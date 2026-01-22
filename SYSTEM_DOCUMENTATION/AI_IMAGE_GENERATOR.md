# AI Image Generator System

**Last Updated:** January 2026

## Overview

The AI Image Generator provides professional image generation using Google Vertex AI (Gemini/Imagen models). It features a modular architecture that allows deployment in multiple contexts while maintaining a single source of truth.

---

## Architecture

### Component Structure

```
client/src/components/ai-tools/
├── AIImageGeneratorCore.tsx    # Single source of truth (~1900 lines)
├── AIImageGeneratorModal.tsx   # Modal wrapper for embedding
└── BrandAssetPicker.tsx        # Brand asset selection component

client/src/components/tools/
└── UnsplashModal.tsx           # Dedicated Unsplash search (separated from AI)

client/src/pages/tools/
└── ai-image-generator.tsx      # Full page wrapper (~85 lines)
```

### Deployment Contexts

| Context | Component | Use Case |
|---------|-----------|----------|
| Full Page | `ai-image-generator.tsx` | Standalone tool at `/tools/ai-image-generator` |
| Article Editor | `AIImageGeneratorModal` | Modal for generating article images |
| Future Tools | `AIImageGeneratorModal` | Any tool needing AI image generation |

### Key Benefit

**Any enhancement to `AIImageGeneratorCore` automatically propagates to all deployment contexts.**

---

## Features

### Core Features (AIImageGeneratorCore)

- **6 Image Ingredient Slots**: Upload reference images (products, models, scenes)
- **Brand Asset Metadata**: Size, flavour, material, industry context from brand profiles
- **Prompt Enhancement**: Two-path system (with/without assets)
  - PATH A: Full creative freedom with quality enhancements
  - PATH B: Targeted creativity preserving uploaded assets
- **Mandatory Quality Instructions**: Fine details, imperfections, realism (dust particles, skin pores, surface textures)
- **System Prompt Management**: localStorage + Supabase persistence
- **Multiple AI Models**: Gemini 3 Pro Image Preview, Imagen 4.0 Ultra
- **Style Controls**: Art style + image style combinations
- **Text Overlays**: Title/subtitle with case transformation
- **Resolution/Aspect Ratio**: 512px-4096px, multiple aspect ratios

### UX Features

- **Double-click Prevention**: 2-second debounce on Generate button
- **Collapsible Panels**: System prompt, API preview, settings
- **Real-time Preview**: Generated images displayed immediately
- **Download Support**: Direct download via proxy endpoint

---

## Backend Services

### VertexAIImageGenerator

**Location:** `/server/services/vertex-ai-image-generator.ts`

**Features:**
- OAuth 2.0 service account authentication
- Support for Gemini (multimodal) and Imagen (text-to-image) models
- Reference image handling for product placement
- ImgBB upload for generated image hosting
- Rate limiting (3-second minimum between requests)

### AIPromptAnalyzer

**Location:** `/server/services/ai-prompt-analyzer.ts`

**Features:**
- Prompt enhancement via Gemini 2.0-flash
- Brand asset metadata integration
- Dimension parsing and size anchoring
- Two-path enhancement (with/without assets)

---

## API Endpoints

### Image Generation

```
POST /api/ai/generate-image
{
  "prompt": "Product on marble surface",
  "model": "gemini-3-pro-image-preview-2k",
  "artStyle": "photorealistic",
  "imageStyle": "professional",
  "resolution": 2048,
  "aspectRatio": "1:1",
  "imageIngredients": [...],  // Optional: reference images
  "includeTitle": false,
  "includeSubtitle": false
}
```

### Prompt Enhancement

```
POST /api/ai/enhance-prompt
{
  "userPrompt": "product on table",
  "artStyle": "photorealistic",
  "imageStyle": "professional",
  "imageIngredients": [...],  // Optional: for PATH B
  "customSystemPrompt": "..."  // Optional: additional guidance
}
```

---

## Environment Variables

```bash
GOOGLE_PROJECT_ID=slyfox-media-engine
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
IMGBB_API_KEY=your_imgbb_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## Troubleshooting

### 429 Rate Limit Errors

- **Cause**: Too many requests or transient Google capacity issues
- **Solution**: Wait 30-60 seconds and retry; double-click prevention helps

### Image Not Reflecting Assets

- **Cause**: PATH B prompt may not emphasize product tags enough
- **Check**: Ensure image ingredients are properly uploaded and tagged

### Prompt Enhancement Not Adding Details

- **Check**: Verify the sparkle (✨) enhance button was clicked
- **Note**: Auto-generated prompts from article context are NOT enhanced until user clicks enhance

---

## Related Documentation

- [IMAGE_ARCHITECTURE.md](./IMAGE_ARCHITECTURE.md) - General image handling
- [CLAUDE.md](../CLAUDE.md) - Main project documentation (Vertex AI section)
