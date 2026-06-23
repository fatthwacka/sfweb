# Blog Content Studio — Complete System Documentation

**Created**: 7 April 2026
**Last Updated**: 7 April 2026
**Status**: Phase 1A complete, Phase 1B (pipeline executor) next

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture — Three-Stage Pipeline](#architecture--three-stage-pipeline)
3. [File Inventory](#file-inventory)
4. [Database Schema](#database-schema)
5. [Frontend Components](#frontend-components)
6. [Backend Routes & Services](#backend-routes--services)
7. [WordPress Connector](#wordpress-connector)
8. [Credential Encryption](#credential-encryption)
9. [Content Ingestion Pipeline Design](#content-ingestion-pipeline-design)
10. [Anti-Repetition System](#anti-repetition-system)
11. [Pipeline Scheduling Architecture](#pipeline-scheduling-architecture)
12. [Client Modes](#client-modes)
13. [Universal Blog Categories](#universal-blog-categories)
14. [UI Architecture & Design Decisions](#ui-architecture--design-decisions)
15. [AI Image Generation Integration](#ai-image-generation-integration)
16. [Known Issues & Fixes Applied](#known-issues--fixes-applied)
17. [What's Built vs What's Planned](#whats-built-vs-whats-planned)
18. [Environment Variables Required](#environment-variables-required)
19. [Resuming Development — Next Steps](#resuming-development--next-steps)

---

## Overview

The Blog Content Studio is a standalone tool (available at `/tools/blog-content-studio`) that provides a complete content pipeline for multi-client blog management. It was duplicated from the admin blog editor (`blog-management.tsx`) as an independent 4,000+ line component and extended with:

- **Input Stage** — Configurable content sources (RSS, Google News, competitor blogs, manual URLs) with a planned Research Agent
- **Editor Stage** — Full blog editor with AI content generation, section-by-section enhancement, image generation, and per-article gradients
- **Output Stage** — Multi-destination publishing (built-in Supabase/static HTML + WordPress via REST API, with stubs for Webflow, Wix, Shopify, Ghost, Medium)

All data is **client-scoped** — each client has separate input sources, output destinations, pipeline configuration, and blog posts.

---

## Architecture — Three-Stage Pipeline

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    INPUT STAGE       │     │    EDITOR STAGE      │     │    OUTPUT STAGE      │
│                      │     │                      │     │                      │
│  RSS Feeds           │     │  Blog Post Editor    │     │  Supabase + Static   │
│  Google News         │ ──► │  AI Content Gen      │ ──► │  WordPress REST API  │
│  Competitor Blogs    │     │  Image Generation    │     │  Webflow (planned)   │
│  Manual URLs         │     │  Section Enhancement │     │  Wix (planned)       │
│  Research Agent (*)  │     │  SEO Metadata        │     │  Shopify (planned)   │
│                      │     │  Gradient System     │     │  Ghost (planned)     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
        │                                                          │
        └──── client_input_sources ────┐    ┌── client_output_destinations ──┘
                                       │    │
                              ┌────────┴────┴────────┐
                              │   content_clients     │
                              │   (brand intelligence │
                              │    single source of   │
                              │    truth for clients)  │
                              └───────────────────────┘
```

**(*) Research Agent** = planned autonomous system, not yet built.

---

## File Inventory

### Frontend — New Files

| File | Purpose |
|------|---------|
| `client/src/pages/tools/blog-content-studio.tsx` | Tool page wrapper with route |
| `client/src/components/blog-studio/BlogStudioEditor.tsx` | Main editor (4,000+ lines, independent copy from blog-management.tsx) |
| `client/src/components/blog-studio/BlogStudioProvider.tsx` | React context: clientId, activeTab, pipeline state, AI trigger |
| `client/src/components/blog-studio/InputSourcesPanel.tsx` | CRUD for RSS/Google News/manual URL/competitor sources |
| `client/src/components/blog-studio/OutputDestinationsPanel.tsx` | Destination management with WordPress wizard |
| `client/src/components/blog-studio/PipelineSettingsPanel.tsx` | Per-client research schedule, production mode, quality gates |
| `client/src/components/blog-studio/PipelineStatusBar.tsx` | Visual `[Inputs] → [Editor] → [Outputs]` indicator |
| `client/src/components/blog-studio/WordPressWizardModal.tsx` | 5-step WordPress setup wizard |
| `client/src/components/blog-studio/DestinationSettingsPanel.tsx` | Collapsible per-destination inline settings |
| `client/src/styles/blog-studio.css` | Three-panel layout, taskbar, responsive styles |

### Backend — New Files

| File | Purpose |
|------|---------|
| `server/routes/content-studio/output-destinations.ts` | CRUD + test connection + publish orchestration |
| `server/routes/content-studio/input-sources.ts` | CRUD for sources + pipeline config + pipeline runs |
| `server/services/connectors/connector-interface.ts` | `CMSConnector` interface contract |
| `server/services/connectors/wordpress-connector.ts` | Full WP REST API connector with retry, taxonomy, media |
| `server/services/connectors/retry-fetch.ts` | Exponential backoff wrapper (3 retries, 1-8s) |
| `server/services/credentials-encryption.ts` | AES-256-CBC credential encryption via `node:crypto` |

### Migrations (All Run in Supabase)

| File | Purpose |
|------|---------|
| `migrations/040_blog_content_studio.sql` | `client_id` on blog_posts, `client_output_destinations`, `client_input_sources` |
| `migrations/041_publish_tracking.sql` | `publish_tracking` jsonb on blog_posts for WP update-vs-create |
| `migrations/042_universal_blog_categories.sql` | Deactivate photography-specific, add 10 universal categories |
| `migrations/043_content_ingestion_pipeline.sql` | `ingested_articles`, `topic_cooldowns`, `pipeline_runs`, pg_trgm |

### Modified Files

| File | Change |
|------|--------|
| `client/src/App.tsx` | Added `/tools/blog-content-studio` route |
| `shared/config/tools-registry.tsx` | Added blog-content-studio entry to tools hub |
| `shared/schema.ts` | Added `clientId`, new table definitions, `PipelineConfig` type |
| `server/routes.ts` | Mounted content-studio routes |
| `server/routes/blog.ts` | `client_id` filter on blog post queries |
| `server/static-generator.ts` | Client subdirectory support for static HTML |
| `client/src/components/ai-tools/AIImageGeneratorCore.tsx` | Exported `VERTEX_MODELS` and `getDefaultModel` |
| `server/services/vertex-ai-image-generator.ts` | Fixed `imageSize` bug (was sending raw string) |

---

## Database Schema

### Extended Tables

```sql
-- blog_posts: Added columns
client_id uuid REFERENCES content_clients(id)      -- Multi-client scoping
publish_tracking jsonb                               -- {destination_id: external_post_id}
topic_fingerprint text                               -- For anti-repetition matching
topic_keywords text[]                                -- Extracted key phrases

-- content_clients: Added column
pipeline_config jsonb                                -- Research/production/quality settings
```

### New Tables

#### `client_output_destinations`
```sql
id uuid PRIMARY KEY
client_id uuid NOT NULL REFERENCES content_clients(id)
destination_type text NOT NULL        -- 'supabase_static', 'wordpress', 'webflow', etc.
display_name text NOT NULL
credentials_encrypted text            -- AES-256-CBC encrypted JSON
config jsonb DEFAULT '{}'             -- Non-sensitive config (siteUrl, mappings)
is_active boolean DEFAULT false
last_published_at timestamptz
```

#### `client_input_sources`
```sql
id uuid PRIMARY KEY
client_id uuid NOT NULL REFERENCES content_clients(id)
source_type text NOT NULL             -- 'rss', 'google_news', 'manual_url', 'competitor_blog'
display_name text NOT NULL
config jsonb DEFAULT '{}'             -- Type-specific: url, query, filterKeywords, etc.
cron_schedule text                    -- Cron expression
fetch_interval_minutes integer DEFAULT 1440
is_active boolean DEFAULT false
last_fetched_at timestamptz
error_count integer DEFAULT 0
last_error text
priority integer DEFAULT 0
```

#### `ingested_articles`
```sql
id uuid PRIMARY KEY
client_id uuid NOT NULL
source_id uuid REFERENCES client_input_sources(id)
external_url text
url_hash text NOT NULL                -- SHA-256 of normalised URL (Layer 1 dedup)
title text NOT NULL
summary text                          -- AI-generated 2-3 sentence summary
topic_fingerprint text                -- Short normalised topic phrase (Layer 2)
topic_keywords text[]
raw_content text
source_published_at timestamptz
status text DEFAULT 'new'             -- 'new','screened','approved','rejected','used','expired'
rejection_reason text
similarity_score numeric(4,3)
matched_post_id uuid
relevance_score numeric(4,3)          -- AI-assessed relevance (0-1)
freshness_score numeric(4,3)          -- Timeliness score (0-1)
expires_at timestamptz
```

#### `topic_cooldowns`
```sql
id uuid PRIMARY KEY
client_id uuid NOT NULL
topic_fingerprint text NOT NULL
topic_label text NOT NULL             -- Human-readable
last_published_at timestamptz NOT NULL
blog_post_id uuid
post_sequence_number integer DEFAULT 0
cooldown_days integer DEFAULT 30      -- Min days before topic resurfaces
cooldown_posts integer DEFAULT 5      -- Min posts between same topic
```

#### `pipeline_runs`
```sql
id uuid PRIMARY KEY
client_id uuid NOT NULL
run_type text DEFAULT 'research'      -- 'research' or 'production'
started_at timestamptz
completed_at timestamptz
items_discovered integer DEFAULT 0
items_screened_out integer DEFAULT 0
items_approved integer DEFAULT 0
articles_generated integer DEFAULT 0
status text DEFAULT 'running'         -- 'running','completed','no_fresh_content','error'
error_message text
duration_ms integer
metadata jsonb DEFAULT '{}'
```

### Indexes

- `idx_ingested_url_hash` — UNIQUE on `(client_id, url_hash)` for fast exact dedup
- `idx_ingested_title_trgm` — GIN trigram index on `ingested_articles.title`
- `idx_blog_posts_title_trgm` — GIN trigram index on `blog_posts.title`
- `idx_blog_posts_topic_fingerprint` — B-tree on `(client_id, topic_fingerprint)`
- `idx_cooldown_client_topic` — UNIQUE on `(client_id, topic_fingerprint)`
- `idx_pipeline_runs_client` — B-tree on `(client_id, started_at DESC)`

---

## Frontend Components

### BlogStudioProvider (React Context)

Provides shared state across all studio components:

- **`clientId`** — Selected client UUID (persisted to `localStorage` under key `blog-studio-selected-client`)
- **`clients`** — Fetched from `/api/content-management/brand-intelligence/clients` (single source of truth)
- **`activeTab`** — `'inputs' | 'editor' | 'outputs'` — controls which full-page panel is shown
- **`pipelineState`** — Counts of active/total input sources and output destinations
- **`triggerAIGeneration`** — Cross-component signal from taskbar to editor

### Tab-Based Layout

The UI uses a **tab-based layout** (not three-column) with:

1. **Taskbar (page level)** — Three tabs: Configure Input (cyan/orange), Editor (cyan/orange), Configure Output (cyan/orange). Always visible.
2. **Editor Bar (component level)** — Client dropdown, Posts button (labelled with client name), search field, Save Draft, Publish. Visually joined to taskbar via CSS.

Active tab = orange background. Inactive = cyan. Hover = green.

### Image System

The editor supports **4 image targets**: hero, post1, post2, featured. Each has 5 buttons:
- **AI Generate** — Opens `AIImageGeneratorModal`
- **Unsplash** — Opens `UnsplashModal`
- **Cloud** — Opens `CloudStorageBrowserModal`
- **Crop** — In-browser crop tool
- **Upload** — Local file upload with compression

Modals are rendered **inside the editor's early return block** (critical — see Known Issues).

### Generate with AI (Full Article)

The "Generate with AI" button in the taskbar triggers staged generation:
1. **Phase 1**: Generate text content (title, sections, SEO) → toast "Content Generated"
2. **Phase 2**: Generate images for all 4 targets using AI models from `AIImageGeneratorCore.tsx`

Image models are imported directly from the source of truth (`VERTEX_MODELS`, `getDefaultModel`) — never hardcoded.

---

## Backend Routes & Services

### API Endpoints

#### Output Destinations (`/api/content-studio/destinations/...`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/destinations/:clientId` | List destinations (credentials stripped) |
| POST | `/destinations` | Create destination with encrypted credentials |
| PUT | `/destinations/:id` | Update destination |
| DELETE | `/destinations/:id` | Delete destination |
| POST | `/destinations/:id/test` | Test connection via connector |
| GET | `/destinations/:id/categories` | Discover remote CMS categories |
| GET | `/destinations/:id/tags` | Discover remote CMS tags |
| PUT | `/destinations/:id/config` | Update destination config (mappings, defaults) |
| POST | `/publish/:postId` | **Orchestrate publishing** to all active destinations |

#### Input Sources (`/api/content-studio/sources/...`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/sources/:clientId` | List sources for client |
| POST | `/sources` | Create source |
| PUT | `/sources/:id` | Update source |
| DELETE | `/sources/:id` | Delete source |
| GET | `/pipeline-config/:clientId` | Get pipeline settings |
| PUT | `/pipeline-config/:clientId` | Save pipeline settings |
| GET | `/pipeline-runs/:clientId` | Recent pipeline runs |

### Publish Orchestration Flow

`POST /api/content-studio/publish/:postId`:

1. Fetch post with category name
2. **Always** generate static HTML (non-blocking if fails)
3. Fetch all active destinations for client
4. For each WordPress destination:
   - Decrypt credentials
   - Check `publish_tracking` for existing external ID
   - If exists → `updatePost()`, else → `publishPost()`
   - Save external ID back to `publish_tracking`
5. Return per-destination results with success/failure/URLs

---

## WordPress Connector

**File**: `server/services/connectors/wordpress-connector.ts`

### Features
- **Authentication**: Basic Auth with Application Passwords (WP 5.6+)
- **Redirect handling**: Custom `authFetch()` follows redirects manually to preserve Authorization header (Node.js `fetch` strips it per spec)
- **Retry**: All requests use `retryFetch` — exponential backoff (3 retries, 1-8s, respects Retry-After)
- **Taxonomy**: Full category/tag discovery with pagination, get-or-create with race condition handling
- **Media**: Downloads featured image from URL, uploads to WP media library
- **SEO**: Yoast SEO meta fields (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`) on create and update
- **Password handling**: Strips spaces from application passwords (WP displays them with spaces)

### Interface Contract

```typescript
interface CMSConnector {
  testConnection(config): Promise<ConnectionTestResult>;
  publishPost(config, post): Promise<PublishResult>;
  updatePost(config, externalId, post): Promise<PublishResult>;
  discoverCategories?(config): Promise<RemoteCategory[]>;
  discoverTags?(config): Promise<RemoteTag[]>;
  getOrCreateCategory?(config, name, slug): Promise<RemoteCategory>;
  getOrCreateTag?(config, name, slug): Promise<RemoteTag>;
}
```

Future connectors (Webflow, Ghost, etc.) implement the same interface.

---

## Credential Encryption

**File**: `server/services/credentials-encryption.ts`

- **Algorithm**: AES-256-CBC
- **Key derivation**: `scrypt` with static salt from passphrase in `CONTENT_STUDIO_ENCRYPTION_KEY`
- **Format**: Stored as `iv_hex:encrypted_hex`
- **Security model**: Credentials never sent to frontend — `credentials_encrypted` is stripped from all API responses, replaced with `has_credentials: boolean`

---

## Content Ingestion Pipeline Design

### 4-Layer Anti-Repetition System

| Layer | Method | Cost | What It Catches |
|-------|--------|------|-----------------|
| 1. URL Hash | SHA-256 of normalised URL | Zero | Exact same article from same source |
| 2. Topic Fingerprint | 3-8 word normalised phrase via Gemini | Free (piggybacks on summarisation) | Same topic from different sources |
| 3. Cooldown Registry | Per-topic timestamp + configurable cooldown | 1 DB query | Topics resurfacing too soon |
| 4. Trigram Title Match | PostgreSQL `pg_trgm` similarity | 1 DB query | Paraphrased titles |

**Why not embeddings**: pgvector not installed, each embedding costs an API call, layers 1-4 catch 95%+ at near-zero cost. Can add embeddings later as Layer 5 if needed.

### Pipeline Flow

```
DISCOVER → SCREEN (4 layers) → RANK → SYNOPSIS → QUEUE
                                                    │
                                              If everything rejected:
                                              EXIT cleanly (no loop)
```

**Critical design choice**: The pipeline is a **linear, one-pass flow** that exits cleanly if no fresh content passes screening. This prevents the loop problem where an agent generates content, discovers it duplicates existing posts, starts over, and gets stuck.

### Dual Cooldown System

Each topic has TWO cooldown thresholds that BOTH must be satisfied before the topic can resurface:

1. **`cooldown_days`** (default: 30) — Minimum days since topic was last published
2. **`cooldown_posts`** (default: 5) — Minimum number of posts published since topic was last covered

Example: "biometrics" was the feature article 3 posts ago. Even if 30 days have passed, it won't resurface until at least 5 other posts have been published.

---

## Pipeline Scheduling Architecture

### Two Independent Cycles

```
RESEARCH CYCLE                    PRODUCTION CYCLE
(Gather & screen intel)           (Distill intel → draft → publish)

Every hour/4h/8h/daily/weekly     Weekly/fortnightly/on-demand
        │                                  │
        ▼                                  ▼
Fetch from sources                Read ingested_articles (status='approved')
Screen through 4 layers           Synthesise into blog post
Store in ingested_articles        Generate images
Log in pipeline_runs              Queue for review or auto-publish
```

### Scheduling Mechanism

- **NO in-process scheduler** — avoids Docker container restart issues
- **VPS-level cron** calls `POST /api/content-studio/pipeline/run` every 15 minutes
- Endpoint checks each source's `last_fetched_at + fetch_interval_minutes` to determine what's due
- Each run is logged in `pipeline_runs` for observability

---

## Client Modes

Three operating modes per client (stored in `pipeline_config.production.mode`):

| Mode | Research | Production | Publish |
|------|----------|------------|---------|
| **Full Auto-Pilot** | Automated on schedule | Automated on schedule | Auto-publish as draft or live |
| **Research Auto, Write Manual** | Automated on schedule | Triggered manually from Content Queue | Manual |
| **Fully Manual** | No automation | Manual write/generate | Manual |

---

## Universal Blog Categories

Migration `042` replaced photography-specific categories with 10 universal categories that work across all industries:

1. Thought Leadership
2. Industry Insights
3. How-To Guides
4. Case Studies
5. Pain Points
6. Tips & Best Practices
7. News & Updates
8. Inspirational
9. Behind the Scenes
10. FAQs & Myths

---

## UI Architecture & Design Decisions

### Key Design Decisions (from user feedback)

1. **Tab-based, not three-column** — Input/Output panels are full-page tabs, not side columns
2. **Two-bar visual join** — Taskbar (page level) + editor bar (component level), CSS-joined into one block
3. **Client dropdown in editor bar** — Left-most, before Posts button
4. **Posts button label** — Shows selected client name ("DCS Posts", not "My Posts")
5. **Dark navy/blue-grey taskbar** — Not pale grey; active = orange, inactive = cyan, hover = green
6. **Font consistency** — 0.875rem base, `#94a3b8` text on inactive elements
7. **Independent copy** — Editor is NOT a shared extraction; it's a separate 4,000+ line file to avoid risky refactor
8. **Source of truth for clients** — Brand Intelligence API (`/api/content-management/brand-intelligence/clients`), response shape: `data?.data?.clients || data?.clients || data || []`

---

## AI Image Generation Integration

### Model Source of Truth

Image models are **imported directly** from `AIImageGeneratorCore.tsx`:

```typescript
import { VERTEX_MODELS, getDefaultModel } from '@/components/ai-tools/AIImageGeneratorCore';
```

The `VERTEX_MODELS` array and `getDefaultModel()` function are exported from the core component. The Blog Studio editor imports them directly — **no hardcoded model IDs**.

### Image Generation Flow

The "Generate with AI" button triggers:
1. Text content generation via Gemini
2. For each image target (hero, post1, post2, featured):
   - Generate contextually appropriate prompt based on article content
   - Call `/api/ai/generate-image` with selected model, aspect ratio, and resolution
   - Apply returned URL to the appropriate image field

### Image Progress Overlay

Orange spinner with progress bar during generation, per-image progress feedback.

---

## Known Issues & Fixes Applied

### Critical Bugs Fixed During Development

1. **Modals not rendering in editor view** — The editor uses an early `return` when `activeView === 'editor'`. Image modals were in the *main* return block (post-list view). Fixed by moving modals into the editor's early return.

2. **`imageSize` sending raw string** — `vertex-ai-image-generator.ts` line 689 was sending the raw resolution string (e.g., `'1024x1024'`) instead of computed pixel dimensions. Fixed to use the computed width/height.

3. **WordPress auth header lost on redirects** — Node.js `fetch` with `redirect: 'follow'` strips the Authorization header per the Fetch spec. Fixed by implementing `authFetch()` with `redirect: 'manual'` that follows redirects manually while preserving auth.

4. **WordPress password truncation** — Application passwords with spaces were being truncated. Fixed by stripping all spaces from the password before encoding.

5. **Client dropdown not populating** — Server returns `{ data: { clients: [...] } }` but provider expected `data.clients`. Fixed to handle: `data?.data?.clients || data?.clients || data || []`.

6. **`post2` missing from image targets** — Only hero, post1, and featured were in the `imageTargets` array. Added `post2`.

---

## What's Built vs What's Planned

### Built (Phase 1A) ✅

- [x] Blog Studio Editor (independent copy, client-scoped)
- [x] BlogStudioProvider context
- [x] Tab-based UI with taskbar
- [x] Input Sources panel (CRUD for RSS, Google News, Manual URLs, Competitor Blog)
- [x] Output Destinations panel (Supabase always-on + WordPress)
- [x] WordPress Connector (full: test, publish, update, categories, tags, media, Yoast SEO)
- [x] 5-step WordPress Wizard Modal
- [x] Credential encryption (AES-256-CBC)
- [x] Publish orchestration endpoint
- [x] Pipeline Settings panel (research schedule, production mode, quality gates)
- [x] Database schema for ingestion pipeline (migrations 040-043)
- [x] Universal blog categories
- [x] AI image generation with model source of truth
- [x] Per-article gradient system
- [x] Pipeline runs observability display

### Built (Phase 1B) — Pipeline Executor ✅

- [x] **Gemini client helper** (`server/services/pipeline/gemini-client.ts`) — Thin Gemini 2.0-flash wrapper with rate limiting
- [x] **Source fetchers** (`server/services/pipeline/source-fetchers/`):
  - `rss-fetcher.ts` — RSS/Atom feed parser with keyword filtering (uses `rss-parser`)
  - `google-news-fetcher.ts` — Google News RSS with redirect resolution and domain exclusion
  - `url-extractor.ts` — Arbitrary URL content extraction with cheerio (og:tags, article body)
  - `competitor-blog-fetcher.ts` — Multi-strategy: direct RSS → common paths → auto-discovery → sitemap fallback
- [x] **Screening layers** (`server/services/pipeline/screening/`):
  - Layer 1: `url-dedup.ts` — SHA-256 hash of normalised URL (strips tracking params, fragments)
  - Layer 2: `title-similarity.ts` — PostgreSQL pg_trgm via Supabase RPC (threshold: 0.4)
  - Layer 3: `topic-fingerprinter.ts` — Gemini extracts 3-8 word normalised topic phrase
  - Layer 4: `cooldown-checker.ts` — Dual cooldown (days since + posts since)
- [x] **Pipeline executor** (`server/services/pipeline/pipeline-executor.ts`) — Main orchestrator: DISCOVER → SCREEN → STORE → LOG
- [x] **Pipeline API** (`server/routes/content-studio/pipeline.ts`):
  - `POST /api/content-studio/pipeline/run` — Cron endpoint (all clients or specific)
  - `POST /api/content-studio/pipeline/run/:clientId` — Manual trigger per client
  - Optional `PIPELINE_CRON_SECRET` bearer token protection
- [x] **Migration 044** — `check_title_similarity()` RPC function for pg_trgm queries
- [x] Route registered in `server/routes.ts`

### Action Required — Migration 044

Run `migrations/044_title_similarity_rpc.sql` in Supabase SQL Editor before testing the pipeline.

### Action Required — VPS Cron Setup

Add a cron job on the VPS to call the pipeline endpoint every 15 minutes:
```bash
*/15 * * * * curl -s -X POST http://localhost:5000/api/content-studio/pipeline/run -H "Content-Type: application/json" -H "X-Pipeline-Token: YOUR_SECRET" > /dev/null 2>&1
```

Set `PIPELINE_CRON_SECRET` in `.env` to match the token.

### Planned (Phase 2) — Production Cycle

- [ ] **Content Queue UI** — View approved ingested articles, select for blog creation
- [ ] **AI Synopsis Generator** — Distill multiple ingested articles into a single blog post
- [ ] **Auto-production scheduler** — Scheduled and auto-pilot modes
- [ ] **Quality gates enforcement** — Min relevance score, human review requirement

### Planned (Phase 3) — Research Agent

- [ ] **Research Agent** — Configurable autonomous tool per client
- [ ] Pre-defined feeds/sites per industry
- [ ] Native browser and research ability
- [ ] Cron config for fully autonomous operation

### Planned (Future) — Additional Connectors

- [ ] Webflow connector
- [ ] Wix connector
- [ ] Shopify Blog connector
- [ ] Ghost connector
- [ ] Medium connector

---

## Environment Variables Required

```bash
# Credential encryption (mandatory for WordPress connector)
CONTENT_STUDIO_ENCRYPTION_KEY=your-secret-passphrase

# Pipeline cron security (optional — if set, cron must send matching token)
PIPELINE_CRON_SECRET=your-cron-secret

# Gemini API (used by topic fingerprinter — existing, shared with other tools)
GEMINI_API_KEY=your-gemini-key

# Supabase (existing)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-secret-key

# AI Image Generation (existing)
GOOGLE_PROJECT_ID=slyfox-media-engine
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
IMGBB_API_KEY=your-imgbb-key
```

---

## Resuming Development — Next Steps

**Last completed**: Phase 1B — Pipeline executor fully built (8 April 2026). All source fetchers, screening layers, orchestrator, and API endpoint created.

**Completed setup**:
- ✅ Migration 044 run in Supabase
- ✅ `PIPELINE_CRON_SECRET` set in `.env`

**Still required before testing**:
1. Docker rebuild (new `rss-parser` dependency)
2. Test pipeline with a client that has active input sources configured
3. Set up VPS cron: `*/15 * * * * curl -s -X POST http://localhost:5000/api/content-studio/pipeline/run -H "Content-Type: application/json" -H "X-Pipeline-Token: <PIPELINE_CRON_SECRET>" > /dev/null 2>&1`

**Next development task**: Phase 2 — Production Cycle:

1. **Content Queue UI** — View approved `ingested_articles`, select for blog creation
2. **AI Synopsis Generator** — Distill multiple ingested articles into a single blog post via Gemini
3. **Auto-production scheduler** — Scheduled and auto-pilot modes (use pipeline_config.production settings)
4. **Quality gates enforcement** — Min relevance score, human review requirement, notification on draft
