# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**📁 Detailed Documentation:** See [`SYSTEM_DOCUMENTATION/`](./SYSTEM_DOCUMENTATION/) folder for in-depth guides on specific systems.

## 🇬🇧 LANGUAGE & SPELLING

**Always use British English spelling throughout this codebase.**

Examples:
- ✅ colour, favour, honour (not color, favor, honor)
- ✅ specialise, organise, realise (not specialize, organize, realize)
- ✅ centre, metre, theatre (not center, meter, theater)
- ✅ programme (not program, unless referring to code)
- ✅ catalogue, dialogue (not catalog, dialog)

---

## 📋 GIT COMMIT GUIDELINES

**⚠️ CRITICAL: Follow these rules for ALL git commits**

### **🔒 Pre-Commit Security Requirements (MANDATORY)**
- **AUTOMATED SECURITY SCANNING**: All commits are automatically scanned for hardcoded credentials, API keys, and sensitive data
- **COMMIT BLOCKED IF UNSAFE**: Git operations will be prevented if security hooks detect dangerous content
- **NO MANUAL CONFIRMATIONS**: Security protection is automatic - no "yes" prompting required
- **COMPLETE VPS_DEPLOYMENT.md READING MANDATORY**: You MUST read and understand the complete VPS_DEPLOYMENT.md before ANY production deployment
- **CATASTROPHIC DAMAGE PREVENTION**: Bypassing security hooks or deployment procedures can cause "days and days of work to recover from catastrophic damage"

### **🔒 Commit Frequency & Timing**
- **NEVER commit during active development** - wait for end of development session
- **BUNDLE related changes** into meaningful commits with clear purpose
- **COMMIT at logical breakpoints**: feature completion, major fixes, end of session
- **AVOID micro-commits** - each commit should represent substantial progress

### **🔐 Security & File Management**
- **✅ `.env` files are gitignored** - never commit environment variables
- **✅ Pre-commit hooks active** - automated scanning prevents secret leaks (Dec 2025)
- **✅ Check `git status`** before staging any files
- **✅ Use `git add` selectively** - never use `git add .` without review
- **❌ NEVER commit**: API keys, passwords, personal data, temp files

### **🛡️ Security Hooks & Safeguards (NEW - Dec 2025)**
- **Automated Secret Detection**: Pre-commit hooks scan for Supabase keys, API tokens, passwords
- **Environment Validation**: Server startup verifies all required environment variables
- **Key Format Enforcement**: New Supabase key format (`sb_publishable_*`, `sb_secret_*`) for clarity
- **Legacy Pattern Prevention**: System blocks old environment variable patterns
- **Development Safety**: All hardcoded keys detected and prevented before git operations

### **📝 Commit Message Standards**
```bash
# GOOD: Descriptive, explains the "why"
git commit -m "Implement section-by-section AI enhancement system for blog editor

Features added:
- 4 enhancement buttons: reduce/increase word count, grammar check, complete rewrite
- 5th tone adjustment dropdown with 12 professional tone options
- Smart visual feedback and 10-second undo functionality

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"

# BAD: Vague, no context
git commit -m "fix stuff"
git commit -m "update files"
```

### **🚀 Deployment Commits**
- **Production deployments** require comprehensive commit before push
- **Include all session changes** in pre-deployment commit
- **Test thoroughly** before final production commit

---

## 🤖 SPECIALIZED AGENTS - USE PROACTIVELY

**⚠️ IMPORTANT: These specialist agents MUST be used for their respective domains. Don't attempt complex tasks in these areas without consulting the appropriate specialist first.**

Available in root directory:
- **`auth-security-specialist.md`** - Authentication, security, privacy, user management
- **`backend-specialist.md`** - Express.js, Node.js, PostgreSQL, Drizzle ORM, API development
- **`css-specialist.md`** - Styling, design system, fonts, colors, component consistency
- **`database-specialist.md`** - PostgreSQL queries, schema design, performance optimization
- **`frontend-specialist.md`** - React/TypeScript, components, responsive design, performance
- **`gallery-specialist.md`** - Image management, gallery systems, client access, visual presentation
- **`seo-marketing-specialist.md`** - SEO optimization, meta tags, marketing pages, conversions
- **`meta-agent-updater.md`** - Updates all agents based on learnings and development patterns

**Usage Pattern**: Use the Task tool with the appropriate `subagent_type` parameter. These agents should be used PROACTIVELY - don't wait for the user to request them. If working on gallery features → use gallery-specialist, styling issues → use css-specialist, etc.

---

## ☁️ MEDIA STORAGE = GOOGLE CLOUD STORAGE (AUGUST 2026 — SUPABASE OFFBOARDING)

**Gallery images, gallery videos, preview images and brand assets live in the GCS bucket `sfweb-media`
(public URLs `https://storage.googleapis.com/sfweb-media/<bucket>/<key>`), NOT in Supabase Storage.**
All server storage access goes through `server/media/media-store.ts` (never call `supabase.storage`
directly); `server/media/supabase-compat.ts` is a temporary shim for `server/routes.ts`. Supabase
still provides the database and auth until Phase 2 — **on the Free plan since 2026-08-21** (VPS cron keeps it alive daily and takes a nightly `pg_dump`; the four old sfweb buckets are empty). Full status, runbook and tooling:
[`SYSTEM_DOCUMENTATION/SUPABASE_OFFBOARDING.md`](./SYSTEM_DOCUMENTATION/SUPABASE_OFFBOARDING.md).

---

## 🎨 VERTEX AI IMAGE GENERATION (UPDATED - JANUARY 2026)

**⚠️ FULLY OPERATIONAL: Real AI image generation using Google Vertex AI Imagen 3.0**

### **Modular Architecture (January 2026)**

- **Core Component**: `AIImageGeneratorCore.tsx` - Single source of truth for all AI image generation
- **Full Page**: `/tools/ai-image-generator` wraps core with page layout
- **Modal Wrapper**: `AIImageGeneratorModal.tsx` for embedding in other tools (e.g., Article Editor)
- **Unsplash Modal**: `UnsplashModal.tsx` - Dedicated Unsplash search (separated from AI generation)

**Key Benefit**: Any enhancement to `AIImageGeneratorCore` automatically propagates to all deployment contexts.

### **Backend Service**

- **Service**: `VertexAIImageGenerator` in `/server/services/vertex-ai-image-generator.ts`
- **Authentication**: OAuth 2.0 service account with private key credentials
- **API**: Google Cloud Vertex AI Imagen 3.0 Generate model
- **Image Hosting**: ImgBB for generated image URLs

### **Authentication Architecture**
```typescript
// Service account authentication (OAuth 2.0)
const auth = new GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // ... other fields
  },
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
```

### **Environment Variables Required**
```bash
GOOGLE_PROJECT_ID=slyfox-media-engine
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_EMAIL=n8n-workflow-user@slyfox-media-engine.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
IMGBB_API_KEY=your_imgbb_api_key
```

### **Key Features**
- **Real AI Generation**: Replaces Unsplash fallbacks with actual AI-generated images
- **Image Ingredients**: Upload reference images (product PNGs) for scene placement
- **Style Controls**: Art style (photorealistic, illustrated, cinematic, etc.) + image style (professional, lifestyle, dramatic, etc.)
- **Aspect Ratio Support**: 1:1, 9:16, 4:5, 2:3, 3:2, 16:9 with proper Vertex AI formatting
- **Resolution Scaling**: 512px to 2048px with intelligent size calculations
- **Rate Limiting**: 3-second minimum intervals between API calls
- **Error Handling**: Graceful fallbacks and detailed logging

### **Image Ingredients (Reference Images)**
Upload a product PNG and have AI place it naturally into generated scenes:
```typescript
// Reference image structure
interface ReferenceImage {
  base64Data: string;      // Image data (PNG recommended for transparency)
  subjectType: 'product' | 'person' | 'animal' | 'style';
  description?: string;    // Optional description for better placement
}

// API includes reference in multimodal request
POST /api/ai/generate-image
{
  "prompt": "Professional product photo on marble surface",
  "referenceImage": {
    "base64Data": "data:image/png;base64,...",
    "subjectType": "product",
    "description": "Skincare bottle with gold cap"
  }
}
```

### **Technical Notes**
- **Dependencies**: Requires `google-auth-library` package for authentication
- **Request Format**: Text-to-image generation (no empty image field)  
- **Image Processing**: Base64 → ImgBB upload → Public URL
- **Cost**: Approximately $0.02-0.04 per image generation

### **Troubleshooting**

- **Docker Rebuild Required**: After adding `google-auth-library` dependency
- **Authentication Errors**: Verify service account JSON format and environment variables
- **API Errors**: Check Cloud Console for Vertex AI API quotas and permissions
- **Rate Limiting**: System enforces 3-second minimum between requests to prevent overuse

**📋 Full documentation:** [`SYSTEM_DOCUMENTATION/AI_IMAGE_GENERATOR.md`](./SYSTEM_DOCUMENTATION/AI_IMAGE_GENERATOR.md)

---

## 🎥 VEO VIDEO GENERATOR (NEW - JANUARY 2026)

**⚠️ FULLY OPERATIONAL: AI video generation using Google Vertex AI VEO with image-aware prompt enhancement**

### **Core Implementation**
- **Frontend Page**: `/tools/veo-video-generator` with starting frame upload and prompt enhancement
- **Backend Service**: `VertexAIVeoGenerator` in `/server/services/vertex-ai-veo-generator.ts`
- **Prompt Engine Integration**: Image-aware enhancement via `/api/prompt-engine/enhance`
- **Cloud Storage**: Generated videos stored in `netfox-veo-generations` bucket

### **Key Features**
- **Starting Frame Upload**: Upload an image as the first frame of your video
- **Image-Aware Prompt Enhancement**: Gemini sees your starting frame and describes only the motion
- **Single Continuous Shot**: All prompts enforce one unbroken camera movement (no cuts/fades/transitions)
- **Duration Control**: 5-8 second videos with `durationSeconds` parameter
- **Resolution Options**: 720p or 1080p (default)
- **Aspect Ratios**: 16:9, 9:16, 1:1

### **Prompt Enhancement Rules**
The prompt engine enforces strict video generation rules:
```typescript
// FORBIDDEN (waste compute, produce bad results):
- "fade", "cut", "transition", "dissolve", "wipe"
- "final shot", "opening shot", "next scene", "new angle"
- Multiple shots or scenes
- Any post-production editing terms

// ALLOWED camera movements:
- "very slow pan left/right"
- "gentle gradual zoom in/out"
- "smooth unhurried dolly forward/backward"
- "leisurely orbit around subject"
- Static locked camera
```

### **Image-Aware Enhancement**
When a starting frame is uploaded:
- Gemini **sees** the actual image
- Does NOT describe the scene (it's already visible)
- Does NOT define starting camera position (the image IS the position)
- ONLY describes what happens NEXT from that frame
- Uses slow speed qualifiers ("very slow pan" not "pan")

### **Technical Architecture**
```typescript
// API Request with starting frame
POST /api/prompt-engine/enhance
{
  "prompt": "slow zoom into the coffee cup",
  "contentType": "video",
  "startingFrameImage": "data:image/jpeg;base64,..." // 768px compressed
}

// VEO Generation Request
POST /api/veo/generate
{
  "prompt": "Enhanced video prompt...",
  "startingFrameUrl": "https://storage.googleapis.com/...",
  "duration": 5,
  "resolution": "1080p",
  "aspectRatio": "16:9"
}
```

### **Post-Processing Sanitisation**
Even after enhancement, prompts are sanitised to remove forbidden terms:
```typescript
// Patterns automatically stripped:
/\bfade\s*(to|in|out|from)?\s*(black|white)?\b/gi
/\bcut\s*(to|away)?\b/gi
/\bfinal\s*shot\b/gi
/\btransition\s*(to|into)?\b/gi
// ... and more
```

### **Troubleshooting**
- **413 Payload Too Large**: Fixed in `prod-index.ts` with `express.json({ limit: '10mb' })`
- **Duration Not Working**: Use `durationSeconds` parameter (not `videoDuration`)
- **Cuts/Fades in Output**: Check prompt sanitiser is running; avoid editing terminology in prompts
- **Policy Violation**: Content moderation triggered; adjust prompt content

---

## 📁 CLOUD STORAGE BROWSER (JANUARY 2026)

**Tool for browsing and managing AI-generated assets in Google Cloud Storage**

### **Location**: `/tools/cloud-storage-browser`

### **Folder Structure**
```
netfox-veo-generations/
├── ai-images/           # Full resolution AI-generated images (Imagen 3.0)
├── ai-videos/           # AI-generated videos (VEO)
└── compressed-images/   # Compressed starting frames for VEO (768px)
```

### **UI Features**
- **Folder Selector**: Toggle between "Full Res Images" (`ai-images/`) and "Compressed Images" (`compressed-images/`)
- **Media Type Filter**: Images or Videos
- **Sort Options**: By date or name, ascending/descending
- **Search**: Filter by filename
- **Unified Menu Bar**: All controls in single consolidated bar

### **Backend Caching**

- Per-prefix caching for folder filtering
- Automatic cache invalidation on new uploads

---

## 📱 SOCIAL CONTENT GENERATOR

**Feedback Analysis:** `./scripts/social-content-feedback-analysis.sh [all|issues|low|high]`

📋 **Full documentation:** [`SYSTEM_DOCUMENTATION/SOCIAL_CONTENT_GENERATOR_HANDOFF.md`](./SYSTEM_DOCUMENTATION/SOCIAL_CONTENT_GENERATOR_HANDOFF.md)

---

## 🔄 N8N WORKFLOW AUTOMATION

**⚠️ COMPREHENSIVE DOCUMENTATION: All n8n integration details are in [`N8N_INTEGRATION.md`](./N8N_INTEGRATION.md)**

### **Quick Reference**
- **n8n Instance**: http://168.231.86.89:5678 (VPS-hosted)
- **Active MCP Integration**: n8n-workflow server configured
- **32 Workflows Available**: 4 active, 28 ready for mini-app integration
- **API Authentication**: JWT token-based (expires 2025-01-31)

### **Common n8n Tasks**
```bash
# List all workflows
"List all my n8n workflows"

# Control workflow state
"Activate/deactivate workflow [name or ID]"

# Workflow analysis
"Show me the structure of [workflow name]"

# Create new automation
"Create a workflow for [specific purpose]"

# Debug issues
"Debug the last execution of [workflow name]"
```

### **Mini-App Integration Strategy**
High-potential workflows for Slyfox mini-apps:
- **🎥 Veo 3 Video Generator** - AI video creation
- **📝 Smart Article Writer** - AI content generation
- **🗺️ Local Business Intelligence** - Google Maps data scraping
- **🔊 Podcast Generator** - Research + voice AI with ElevenLabs
- **💬 Client Communication** - META auto-responder system

**📋 Complete setup, workflow inventory, and development guide:** [`N8N_INTEGRATION.md`](./N8N_INTEGRATION.md)

---

## 🏗️ CURRENT ARCHITECTURE (DECEMBER 2025)

**⚠️ HYBRID SYSTEM: HARDCODED CORE + DYNAMIC VISUALS + AI-ENHANCED BLOG + BRAND INTELLIGENCE DASHBOARD**

### **🧠 Brand Intelligence Dashboard (UPDATED - JANUARY 2026)**

Comprehensive brand profile management system for AI-powered content generation:

**Core Components:**
- **Dashboard**: `/client/src/components/content-management/` - Content client management with real-time analytics
- **Brand Profile Editor**: Complete modal system for brand identity configuration
- **Supabase Integration**: `client_brand_profiles` table with simplified single-record system
- **Content Control Centre**: Individual client management interfaces
- **Field Mapping Documentation**: `BRAND_INTELLIGENCE_FIELD_MAPPING.md` - Complete field-to-column mapping

**Brand Profile System:**
```typescript
interface BrandProfile {
  // Business Context
  industry_segment: string;        // AI context for content generation
  products_services: string;       // Service offerings description
  
  // Voice & Tone (12 attributes)
  voice_tone: {
    creative, technical, approachable, professional,
    friendly, authoritative, casual, formal,
    playful, serious, innovative, traditional
  };
  
  // Visual Identity (6-color system)
  primary_color: string;
  secondary_colors: string[];      // 5 additional brand colors
  
  // Content Strategy
  key_messages: string[];          // Core brand messaging
  key_benefits_features: string[]; // Product/service highlights
  content_themes: string[];        // Content categorization
  forbidden_phrases: string[];     // Content restrictions
}
```

**Technical Architecture:**
- **Frontend**: React Query for state management, TypeScript interfaces
- **Backend**: Express.js API with Supabase admin client (simplified delete+insert pattern)
- **Database**: PostgreSQL via Supabase with RLS policies
- **No Versioning**: Single active record per client (simplified January 2026)
- **CSS Framework**: Content-system.css design system with modal variants

**Key Features:**
- ✅ Real-time brand profile editing with auto-save
- ✅ 6-color brand palette management with visual color pickers
- ✅ 12-attribute voice & tone configuration system
- ✅ Industry context for AI content generation
- ✅ Comprehensive content guidelines and restrictions
- ✅ Clean modal architecture with responsive 2-column layouts
- ✅ Version control system for brand profile changes

**API Endpoints:**
- `GET /api/content-management/brand-intelligence/clients` - List all content clients
- `GET /api/content-management/brand-intelligence/clients/:id` - Get client with full brand profile
- `PUT /api/content-management/brand-intelligence/clients/:id/brand-profile` - Update brand profile
- `GET /api/content-management/brand-intelligence/dashboard` - Dashboard analytics

**Current Status (January 1, 2026):**
- ✅ **Brand Profile Editor**: Complete modal with all enhanced fields
- ✅ **Layout Optimization**: Fixed unbalanced grid layouts, clean 2-column sections
- ✅ **Array Field Handling**: Fixed add/remove functionality for all dynamic arrays
- ✅ **6-Color Palette**: Primary + 5 secondary colors with visual pickers
- ✅ **12 Voice Attributes**: Expanded voice/tone options for AI context
- ✅ **Modal Architecture**: Clean separation of sections with proper responsive design
- ✅ **Font Optimization**: Removed problematic font preload causing console warnings

**Next Session Priorities:**
- **AI Content Settings Panel**: Create separate modal for content examples (good/bad)
- **Performance Cards**: Implement functional Performance and AI Insights cards
- **Content Generation**: Connect brand profiles to actual AI content generation
- **Real Data Integration**: Test with production Supabase data

**Future Development:**
- **AI Content Settings Panel**: Content examples (good/bad), generation preferences, prompt customization
- **Performance Analytics**: Content performance tracking and optimization recommendations
- **Social Media Integration**: Platform-specific content generation and posting
- **Content Calendar**: Automated content planning and scheduling

### **🧠 PROMPT ENGINE MICROTOOL (NEW - JANUARY 2026)**

**⚠️ FULLY OPERATIONAL: Standalone brand-aware prompt enhancement tool using Gemini 2.0-flash**

### **Core Implementation**
- **Frontend Page**: `/tools/prompt-engine` with two-panel design and auto-resizing output
- **Backend API**: `/api/prompt-engine/enhance` and `/api/prompt-engine/health` endpoints
- **Service Classes**: `PromptEngineService` with Gemini integration + `BrandContextLoader` for Supabase brand data
- **Reusable Hook**: `usePromptEngine` for easy integration into other content tools

### **Brand Intelligence Integration**
```typescript
// Brand context structure
interface BrandContext {
  industry: string;           // Business niche and segment
  visual: string;            // Color personality, visual mood, style notes
  voice: string;             // Tone, humor level, sentence length preferences
  audience: string;          // Target demographic descriptions
  benefits: string[];        // Priority product/service benefits
  guidelines: string[];      // Positive content examples
  compliance: string[];      // Forbidden phrases and restrictions
}
```

### **Content Type Support**
- **Image Generation**: Visual style guidance, composition tips, technical parameters
- **Video Content**: Scene descriptions, pacing, cinematic elements
- **Social Captions**: Platform-optimized, engaging short-form content
- **Blog Articles**: SEO-friendly, structured long-form content
- **Voice Scripts**: Natural speech flow, pronunciation, audio-friendly language

### **Key Features**
- **AI Enhancement**: Transforms basic prompts using Gemini 2.0-flash (~7-8 second processing)
- **Brand Feature Toggles**: 6 toggleable brand intelligence panels (industry, visual, voice, audience, benefits, guidelines, compliance)
- **Auto-Resizing Output**: Enhanced prompts display in full height (200px-600px with scroll)
- **Brand Influence Tracking**: Shows which brand elements were applied to the enhancement
- **Copy & Refresh**: One-click copy-to-clipboard and re-enhancement options

### **Technical Architecture**
```typescript
// API Request Structure
POST /api/prompt-engine/enhance
{
  "prompt": "Basic prompt text",
  "contentType": "image|video|caption|blog|script",
  "brandContext": {
    "clientId": "uuid",
    "enabledFeatures": ["industry", "visual", "voice"]
  },
  "startingFrameImage": "data:image/jpeg;base64,..."  // Optional: for video content type
}

// API Response Structure
{
  "enhancedPrompt": "Detailed enhanced prompt text",
  "alternatives": [],
  "brandInfluence": {
    "appliedIndustry": "Photography & Videography",
    "appliedVisual": "Warm golds and deep blues"
  },
  "processingTime": 7038,
  "metadata": {...}
}
```

### **Current Status (January 13, 2026)**
- ✅ **Core Tool**: Complete standalone prompt enhancement page
- ✅ **Brand Integration**: Successfully loads and applies Supabase brand profiles
- ✅ **API Architecture**: Full REST API with health checks and error handling
- ✅ **UI Enhancement**: Auto-resizing output containers for long Gemini responses
- ✅ **Tool Registry**: Properly registered in tools hub with brain emoji and "NEW" badge
- ✅ **Image-Aware Video Enhancement**: Gemini multimodal sees starting frames (768px compressed)
- ✅ **Video Prompt Sanitisation**: Post-processing strips forbidden editing terms

### **Next Session Priorities**
- **Input Requirements Enhancement**: Improve prompt component for better user guidance
- **Content Type Definitions**: Create Supabase table for content-type-specific parameters (word counts, style guides)
- **Backend Dashboard**: Simple admin interface for editing content type definitions
- **Enhanced Brand Panels**: Connect remaining 4 brand intelligence panels (audience, benefits, guidelines, compliance)
- **Alternative Prompts**: Implement Gemini-based prompt variations system

### **Performance Metrics**
- **Processing Time**: ~7-8 seconds for comprehensive prompt enhancement
- **Enhancement Ratio**: Typically 10-20x longer than original (e.g., 32 chars → 4,108 chars)
- **Brand Context Loading**: ~500ms Supabase query with full profile data
- **API Reliability**: Graceful fallbacks ensure parent tools never break


**📋 For detailed architecture information, see:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 🔧 DEVELOPMENT SETUP

**⚠️ MANDATORY: ALWAYS consult [`DEV_SERVER_STARTUP.md`](./DEV_SERVER_STARTUP.md) BEFORE attempting to start the development server or troubleshoot startup issues.**

This project uses Docker for development. Do NOT use `npm run dev` directly - it will fail.

**⚠️ Node 22 required (Jun 2026):** The Docker base image is `node:22-alpine`. Current
`@supabase/supabase-js` (`realtime-js`) crashes on Node 20 ("native WebSocket" error) at every
`createClient()`. If the app container crash-loops on startup, see
[`DEV_SERVER_STARTUP.md`](./DEV_SERVER_STARTUP.md) → Common Startup Issues (Node 22 + the stale
`node_modules` anonymous-volume gotcha).

**⚠️ Deploys use rsync, not git; dev & prod share ONE Supabase project.** The VPS `git log` does
NOT reflect what is deployed (check the built bundle instead). Migrations run during dev are
already live in prod (shared DB `dwkjfuhykdjtzvrzdnrr`). See
[`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md) → Critical Lessons (Jun 2026). Known open issue:
production video uploads fail due to a missing `upload.slyfox.co.za` DNS record — see
[`SYSTEM_DOCUMENTATION/VIDEO_UPLOAD_DEBUG_HANDOFF.md`](./SYSTEM_DOCUMENTATION/VIDEO_UPLOAD_DEBUG_HANDOFF.md).

### Quick Start Commands

**Primary Development (REQUIRED):**
- `npm run docker:dev` - **ONLY correct way to start development environment**
- `docker-compose --profile dev up adminer -d` - **Start database admin interface (Adminer)**

**Other Commands:**
- `npm run build` - Build for production (Vite client + esbuild server bundle)
- `npm run start` - Start production server (runs built application)
- `npm run check` - Run TypeScript type checking

### Database Migrations

**⚠️ IMPORTANT: DO NOT use `npm run db:push` - we use Supabase SQL Editor for migrations**

All database schema changes are managed via SQL migration files:
1. Create a numbered SQL file in `/migrations/` (e.g., `024_add_youtube_video_support.sql`)
2. Run the SQL directly in **Supabase SQL Editor** (Dashboard → SQL Editor)
3. The Drizzle schema in `shared/schema.ts` is for TypeScript types only

```bash
# Example migration workflow:
# 1. Create migration file
touch migrations/025_my_new_feature.sql

# 2. Add SQL commands to the file
# 3. Open Supabase Dashboard → SQL Editor
# 4. Paste and run the migration SQL
```

**Database Access Patterns:**
- **Frontend**: Uses `supabaseOperations` (Supabase JS client direct connection)
- **Backend**: Uses Drizzle ORM for type-safe queries + Supabase client for auth/storage
- **Schema**: Defined in `shared/schema.ts` using Drizzle's `pgTable` (for TypeScript types)

### Development Startup Checklist

Before any development work:
1. ✅ Read [`DEV_SERVER_STARTUP.md`](./DEV_SERVER_STARTUP.md)
2. ✅ Ensure Docker Desktop is running
3. ✅ Use `npm run docker:dev` (never `npm run dev`)
4. ✅ Wait for "express serving on port 5000" message (2-4 minutes)
5. ✅ Verify http://localhost:3000 responds with HTTP 200 OK
6. ✅ Start Adminer for database access: `docker-compose --profile dev up adminer -d` (optional)

**⚠️ Important Startup Notes:**
- **Total startup time**: 3-4 minutes on first run, 30-60 seconds when cached
- **Silent period**: After "express serving on port 5000", output may pause for 1-2 minutes while Vite initializes - this is NORMAL
- **Server ready**: Application is accessible immediately at http://localhost:3000 (don't wait for Vite messages)
- **Vite integration**: Vite runs as Express middleware (no separate server message)
- **HMR activation**: Hot reload becomes active when first [vite] log appears

**⚠️ ARM-based Apple Silicon Note (M1/M2/M3 Macs):**
- Docker containers automatically build for both ARM64 and AMD64 architectures
- Expect longer build times: 3-5 minutes (first run) vs 2-3 minutes on Intel
- No special steps required - the multi-platform build handles compatibility
- Total local storage requirement: ~1.1GB (see DEV_SERVER_STARTUP.md for breakdown)

---

## 🚀 PRODUCTION DEPLOYMENT

**🚨 CRITICAL DEPLOYMENT RULE - ZERO EXCEPTIONS 🚨**

**BEFORE attempting ANY production deployment, you MUST:**

1. **READ [`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md) IN FULL** - Every single line, every time
2. **FOLLOW THE EXACT PROCESS** - No shortcuts, no improvisation, no assumptions
3. **USE THE DOCUMENTED COMMANDS** - Copy exact commands from the guide
4. **NEVER deviate from the deployment guide** - Even if you "think" you know better

**Why This Is Non-Negotiable:**
- ⏰ **Needless Downtime**: Skipping steps causes production outages
- 💰 **Business Impact**: Every minute offline = lost revenue and reputation
- 🔥 **Historical Disasters**: Past deployments without full guide reading caused 4+ hour outages
- 📖 **Guide Contains Critical Lessons**: Multi-platform issues, cache problems, permission fixes

**📋 Complete deployment reference:** [`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md)

---

## 📰 BLOG CONTENT STUDIO (NEW - APRIL 2026)

**⚠️ ACTIVE DEVELOPMENT: Multi-client blog pipeline with input sources, editor, and output connectors**

### **Quick Reference**
- **Tool Page**: `/tools/blog-content-studio`
- **Status**: Phase 1A complete, Phase 1B (pipeline executor) next
- **Components**: `client/src/components/blog-studio/` (8 files)
- **Backend**: `server/routes/content-studio/` + `server/services/connectors/`
- **Migrations**: 040-043 (all run in Supabase)

### **Three-Stage Pipeline**
```
[Input Sources] ──► [Blog Editor] ──► [Output Destinations]
RSS, Google News,    AI generation,    Supabase + Static HTML,
Competitor Blogs,    Section enhance,  WordPress REST API,
Manual URLs,         Image gen,        (Webflow, Ghost, etc. planned)
Research Agent (*)   SEO metadata
```

### **Key Architecture**
- **Client scoping**: All data partitioned by `client_id` from Brand Intelligence API
- **WordPress connector**: Full REST API (publish, update, categories, tags, media, Yoast SEO)
- **Credential encryption**: AES-256-CBC, never sent to frontend
- **Anti-repetition**: 4-layer system (URL hash, topic fingerprint, cooldown, trigram match)
- **Scheduling**: VPS cron → `POST /api/content-studio/pipeline/run` (no in-process scheduler)

**📋 Full documentation:** [`SYSTEM_DOCUMENTATION/BLOG_CONTENT_STUDIO.md`](./SYSTEM_DOCUMENTATION/BLOG_CONTENT_STUDIO.md)

---

## 📝 BLOG SYSTEM ARCHITECTURE (DECEMBER 2025)

### **Core Components**

**Blog Management Interface**: `/client/src/components/admin/blog-management.tsx`
- **Full CRUD Operations**: Create, edit, delete, publish blog posts
- **Advanced Filtering**: Search, status, category, date filters with dynamic population
- **AI Integration**: Complete article generation with structured content sections
- **Category Management**: Inline category creation with auto-slug generation
- **Visual Enhancements**: Clickable cards, enhanced UI, gradient customization

**AI Content Generation System**:
- **Endpoint**: `/api/ai/generate-blog-content` (Gemini 2.0-flash)
- **Full Generation**: Title suggestions, structured content, SEO metadata, excerpts
- **Section Enhancement**: Individual section improvements with context awareness
- **Content Types**: Case studies, news, informational, project showcases
- **Cost**: ~$0.001 per article (essentially free with generous quotas)

**Content Structure**:
```typescript
interface BlogContent {
  subtitle: string;           // 8-12 words expanding on title
  introduction: string;       // 2-3 hook sentences
  mainSections: Array<{      // 3 structured sections
    heading: string;          // SEO-friendly H2
    content: string;          // 5-6 sentences
  }>;
  pullQuote: string;         // 10-15 word quotable insight
  conclusion: {              // CTA section
    heading: string;
    content: string;
  };
}
```

### **Section Enhancement System**

**Visual Interface**: 5 buttons per content section
- **➖ Reduce**: Remove unnecessary words, aim for 40-50% reduction
- **➕ Increase**: Append one relevant, insightful sentence
- **✅ Grammar**: Fix spelling, grammar, improve sentence flow
- **🔄 Rewrite**: Complete fresh phrasing, preserve meaning
- **📝 Tone**: 12 professional tone options (formal, conversational, technical, etc.)

**Smart Feedback States**:
- **Grey icons**: No content present (disabled)
- **White icons**: Content ready for enhancement
- **Amber pulsing**: Processing with status text ("Reducing...", "Expanding...")
- **Blue undo button**: 10-second auto-dismiss with content restoration

**Applied To Sections**:
- ✅ Subtitle field
- ✅ Introduction field
- ✅ Section 1 heading and content
- 🔄 Additional sections can be added following same pattern

### **Per-Article Gradient System**

**Gradient Management**: Integrated with existing Supabase gradient system
```typescript
// Section key format for blog gradients
sectionKey: `blog-post-${postId}`  // e.g., "blog-post-a1b2c3d4-..."

// Fallback hierarchy
blogGradient || getGradient('stories-content') || defaults
```

**Editor Integration**: GradientPicker component in blog editor sidebar
- **Location**: Between "Post Settings" and "SEO Settings"
- **Features**: Real-time background preview, all color controls, auto-save
- **Inheritance**: Defaults to stories-content section colors
- **Persistence**: Tied to post ID (survives slug changes)

**Page Display**: Enhanced GradientBackground component
- **Smooth Transitions**: 700ms fade when custom gradients load
- **Fallback Support**: New `fallbackSection` prop for seamless inheritance
- **Performance**: No visual jumps, graceful loading states

---

## 🎨 SITE MANAGEMENT SYSTEM

### Configuration Management
The site management system provides a centralized approach to managing dynamic website content through an admin interface with real-time persistence and immediate updates across all pages.

**Core Components:**
- **GradientPicker Component System**: Reusable Section Colors controls with unified styling
- **Site Configuration API**: RESTful endpoints (`/api/site-config`, `/api/site-config/bulk`) with atomic persistence
- **Admin Interface**: Role-based management panels with visual editing and real-time preview
- **CSS Variable Integration**: Section-specific text color mappings with automatic resolution
- **File Upload System**: Direct image upload with automatic path integration

**Complete Documentation:**
- **📋 Primary Implementation Guide**: [`SITE_MANAGEMENT_GUIDE.md`](./SITE_MANAGEMENT_GUIDE.md)
  - **GradientPicker Component System**: Complete reusable Section Colors methodology
  - **Site Configuration Architecture**: Data flow, persistence, and API integration
  - **CSS Integration System**: Section-specific variable mappings and text color controls
  - **Component Implementation Patterns**: Homepage settings, portfolio settings, and admin interfaces
  - **API Usage Requirements**: PATCH method enforcement and error handling
  - **Performance Optimizations**: Debounced saves, optimistic updates, and React Query integration

**Key Implementation Details:**
```typescript
// Configuration Structure
interface SiteConfig {
  contact: BusinessInfo & ContactMethods;
  home: {
    hero: { slides: HeroSlide[]; autoAdvance: boolean; };
    servicesOverview: ServicesConfiguration;
    testimonials: TestimonialsSection;
  };
}

// Admin Component Integration
<HomepageSettings />  // Hero slides, company info management
<ContactSettings />   // Business details, contact methods

// Data Flow: Admin → API → Memory → All Pages
saveMutation.mutate(config) → configOverrides → deepMerge(defaults, overrides)
```

---

## 🖼️ GALLERY SYSTEM ARCHITECTURE

### Layout Modes (8 Total)
1. **Automatic** - Analyzes image collection using browser Image API to determine most common aspect ratio
2. **Square 1:1** - Forces all images to square aspect ratio (`aspect-square`)
3. **Portrait 2:3** - Standard portrait photography ratio (`aspect-[2/3]`)
4. **Landscape 3:2** - Classic landscape photography ratio (`aspect-[3/2]`)
5. **Instagram 4:5** - Social media optimized portrait (`aspect-[4/5]`)
6. **Upright 9:16** - Vertical video/mobile format (`aspect-[9/16]`)
7. **Wide 16:9** - Cinematic/widescreen format (`aspect-[16/9]`)
8. **Masonry** - Pinterest-style layout preserving natural image ratios

### Gallery Settings Controls
- **Layout Style**: Dropdown with 8 modes, defaults to Automatic
- **Background Color**: Real-time color picker with 5 presets + custom popover
- **Border Radius**: 0-40px slider with inline numeric input
- **Image Spacing**: 0-40px slider matching border radius interface
- **All controls**: Unified `.gallery-slider-container` styling with dark purple gradients

### Performance Optimizations
- **Dynamic Dimension Loading**: Browser Image API reads actual file dimensions (no database required)
- **Smart Sampling**: Automatic mode analyzes first 10 images only
- **Parallel Loading**: Concurrent dimension requests with Promise.all()
- **Real-time Updates**: All controls update live preview immediately
- **Graceful Fallbacks**: Defaults to square while dimensions load

---

## 🚨 CRITICAL DEVELOPMENT RULES

**⚠️ MANDATORY: ALWAYS READ AND FOLLOW EXISTING ARCHITECTURE FIRST**

Before implementing ANY new feature or page:

1. **READ DOCUMENTATION FIRST**: Always consult [`SITE_MANAGEMENT_GUIDE.md`](./SITE_MANAGEMENT_GUIDE.md) for established patterns
2. **ANALYZE WORKING COMPONENTS**: Study working implementations like `services-overview.tsx`, `testimonials.tsx`, homepage sections
3. **USE ESTABLISHED PATTERNS**: Copy the exact architecture of working components:
   - `GradientBackground` component with proper section mapping
   - CSS classes like `text-salmon`, `text-cyan` (NOT inline styles)
   - `useSiteConfig()` hook (NOT custom hooks)
   - Site-wide CSS variables and color system
4. **NO INLINE STYLES**: Never use `style={}` props without explicit instruction - use CSS classes
5. **NO CUSTOM HOOKS**: Use established hooks (`useSiteConfig`, not custom variants like `useCategoryConfig`)
6. **NO ARCHITECTURE VARIATIONS**: Follow the documented `GradientBackground` + CSS classes pattern
7. **TEST COLOR IMPLEMENTATION**: Verify that dashboard color changes reflect on actual pages

### 🛑 CORE DEVELOPMENT RULES

**MANDATORY VALIDATION CHECKLIST:**
1. ❌ **ZERO INLINE CSS**: Use CSS classes only, never `style={{}}`
2. ❌ **ZERO HARDCODING**: Use config/constants for all values
3. ❌ **ZERO MOCK DATA**: Use real config sources
4. ❌ **ZERO CUSTOM HOOKS**: Extend existing hooks only
5. ❌ **ZERO ARCHITECTURAL VARIATIONS**: Follow GradientBackground pattern

**COLOR IMPLEMENTATION STANDARD:**
```tsx
<GradientBackground section="services" className="py-20">
  <h2 className="text-salmon">Title</h2>
  <p className="text-muted-foreground">Content</p>
</GradientBackground>
```

**Available Sections**: `services`, `portfolio`, `testimonials`, `contact`, `blog-post-{id}`

**UNIVERSAL CODE RULE**: Never target specific IDs/slugs - write code that works for ALL records equally.

---

## 🎯 CLAUDE CODE BEST PRACTICES

### For Users: How to Get Better Results

1. **BE SPECIFIC ABOUT REQUIREMENTS**
   - Instead of "fix the colors" → "the dashboard color changes for Services section aren't reflecting on the homepage"
   - Include specific component names, file paths, or page URLs when possible
   - Mention if the issue affects all pages or specific ones

2. **REFERENCE WORKING EXAMPLES**
   - Point to working implementations: "make it work like the Services section on homepage"
   - Mention if other similar features work correctly: "testimonials colors work but services don't"

3. **PROVIDE CONTEXT ABOUT PREVIOUS ATTEMPTS**
   - "We've tried this before and it broke" helps avoid repeating failed approaches
   - "This used to work but stopped after X" helps identify regressions

4. **VALIDATE ARCHITECTURAL CONSISTENCY**
   - Ask Claude to verify the implementation follows established patterns
   - Request that changes be tested against working examples
   - Ask for documentation updates when patterns change

### For Claude Code: Development Standards

**MANDATORY PROTOCOL:**
1. **VALIDATE FIRST** - Check rules before writing any code
2. **ESCALATE CONSTRAINTS** - Ask for guidance if patterns don't fit
3. **ZERO TOLERANCE** - Never deviate from established patterns
4. **FOLLOW EXAMPLES** - Study `services-overview.tsx`, `testimonials.tsx` first
5. **MAINTAIN CONSISTENCY** - Update documentation when patterns evolve

**ANTI-PATTERNS TO AVOID:**
❌ Architectural variations ❌ Inline styles ❌ Custom hooks ❌ Inconsistent data sources

**BEST PRACTICES:**
✅ Follow working implementations ✅ Use established CSS classes ✅ Test thoroughly

---


### Contact Form & Email System (Status: Current - December 2025)

**Architecture**: The contact form system provides secure form submission with spam protection and automated email delivery to the studio owner.

**Core Components:**
- **Frontend Form** (`client/src/components/sections/contact-section.tsx`): React form with validation and reCAPTCHA integration
- **Backend API** (`server/routes.ts`): `/api/contact` endpoint with reCAPTCHA verification and email sending
- **Email Service** (`server/email-service.ts`): Nodemailer-based email delivery with Gmail SMTP
- **reCAPTCHA Service** (`server/recaptcha-service.ts`): Google reCAPTCHA v3 bot protection
- **reCAPTCHA Site Key**: Loaded in `client/index.html` via Google script

**⚠️ Known Issue: reCAPTCHA Timeout (FIXED - December 2025)**

**Issue**: Contact form button silent failure in production (works in development)
**Cause**: `executeRecaptcha()` Promise can hang indefinitely
**Fix**: 5-second timeout wrapper using `Promise.race()` - form never hangs

**Troubleshooting:**
1. Check browser console for reCAPTCHA errors
2. Test API directly: `curl -X POST https://slyfox.co.za/api/contact`
3. Verify `.env` has valid `RECAPTCHA_SECRET_KEY` and Gmail SMTP credentials

---

## 🛡️ ENHANCED SECURITY SYSTEM (December 2025)

**🚨 CRITICAL: Automated security scanning and mandatory confirmation implemented**

### **Key Security Features:**
- **Pre-commit hooks**: Automatically scan for API keys, tokens, and credentials
- **Mandatory confirmation**: Every commit requires explicit "yes" confirmation
- **Environment validation**: Server startup verifies all required variables
- **Supabase key separation**: Clear client vs server key distinction

### **Environment Variables (Standard Format)**
```bash
# Client keys (browser-safe)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[project_id]_[random_string]

# Server keys (admin access)  
SUPABASE_SECRET_KEY=sb_secret_[project_id]_[random_string]
```

### **Security Measures Active:**
- ✅ **Automatic secret detection** for Supabase, N8N, and major API providers
- ✅ **Commit confirmation required** - prevents accidental commits
- ✅ **Startup validation** ensures all required environment variables present
- ✅ **Production deployment verification** checks configuration before deploy

**📋 For detailed security implementation:** Check `/.git/hooks/pre-commit` and `server/startup-validation.ts`