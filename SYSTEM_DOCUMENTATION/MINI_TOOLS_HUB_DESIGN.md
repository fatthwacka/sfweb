# Mini Tools Hub - Design Architecture

> **Created**: December 2025
> **Status**: Design Phase - Ready for Implementation
> **Author**: Claude Code / Dax Tucker

---

## Executive Summary

A comprehensive tools hub for Sly Fox Studios that provides:
- Staff productivity tools (file management, content editing)
- Public-facing tool demos (lead generation)
- Future monetisation pathway (subscription tiers)
- n8n workflow triggers for automation

---

## Core Design Decisions

### 1. AI Provider: Gemini 2.0 Flash
- **Decision**: Use Gemini Flash, NOT self-hosted Ollama
- **Rationale**:
  - Already integrated for blog AI
  - Essentially free at our scale (~$0.02 per 1,000 analyses)
  - No VPS resource constraints
  - Better model quality than llama3.2:1b

### 2. Access Tier System

```
ANONYMOUS        VERIFIED           SUBSCRIBER         STAFF
(No login)       (Email verified)   (Future paid)      (Admin)

┌─────────┐      ┌─────────┐        ┌─────────┐       ┌─────────┐
│ Browse  │  →   │ All     │   →    │ Premium │   →   │ All +   │
│ Basic   │      │ Free    │        │ Tools   │       │ n8n     │
│ Tools   │      │ Tools   │        │         │       │ Triggers│
└─────────┘      └─────────┘        └─────────┘       └─────────┘
```

### 3. Modal Messaging Strategy

| Access Level | Modal Title | Description |
|--------------|-------------|-------------|
| `login-required` | "Sign in to continue" | Create a free account to access this tool |
| `verify-email` | "Verify your email" | Please verify your email to continue |
| `upgrade-required` | "Upgrade to Pro" | This premium tool is available on our Pro plan |
| `staff-only` | "Team Feature" | Available exclusively to team members |

---

## Database Schema (Supabase)

### New Columns on `users` Table

```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  subscription_tier VARCHAR(20) DEFAULT 'free';
  -- Values: 'free', 'pro', 'enterprise'

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  subscription_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email_verification_token VARCHAR(100);

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email_verification_expires_at TIMESTAMP WITH TIME ZONE;
```

### New Tables

```sql
-- Tool access configuration
CREATE TABLE IF NOT EXISTS tool_access_tiers (
  id SERIAL PRIMARY KEY,
  tool_slug VARCHAR(50) UNIQUE NOT NULL,
  min_tier VARCHAR(20) NOT NULL DEFAULT 'anonymous',
  -- 'anonymous', 'verified', 'pro', 'enterprise', 'staff'

  is_active BOOLEAN DEFAULT true,
  usage_limit_anonymous INTEGER,
  usage_limit_verified INTEGER,
  usage_limit_pro INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking (rate limiting & analytics)
CREATE TABLE IF NOT EXISTS tool_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),
  tool_slug VARCHAR(50) NOT NULL,
  action VARCHAR(50),
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Future: Subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,

  provider VARCHAR(20),
  provider_subscription_id VARCHAR(100),
  provider_customer_id VARCHAR(100),

  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tool_usage_user ON tool_usage(user_id, tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id, tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);
```

---

## TypeScript Types

### Location: `shared/types/tools.ts`

```typescript
export type AccessTier = 'anonymous' | 'verified' | 'pro' | 'enterprise' | 'staff';

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'file-management' | 'content' | 'automation' | 'ai-powered';

  // Access control
  minTier: AccessTier;
  requiresAuth: boolean;

  // Feature flags
  usesAI: boolean;
  usesLocalFiles: boolean;

  // Usage limits per tier (null = unlimited)
  limits: {
    anonymous?: number;
    verified?: number;
    pro?: number;
    enterprise?: number;
    staff?: null;
  };

  // UI
  comingSoon?: boolean;
  badge?: 'new' | 'beta' | 'popular' | 'pro';
  thumbnailUrl?: string;
}

export type AccessModalType =
  | 'login-required'
  | 'verify-email'
  | 'upgrade-required'
  | 'staff-only';
```

---

## Tool Registry

### Location: `shared/config/tools-registry.ts`

| Tool | Slug | Min Tier | Uses AI | Category |
|------|------|----------|---------|----------|
| File Renamer | `file-renamer` | anonymous | No | file-management |
| Bulk Mover | `bulk-mover` | anonymous | No | file-management |
| Duplicate Finder | `duplicate-finder` | anonymous | No | file-management |
| Smart Organiser | `smart-organiser` | verified | Yes | ai-powered |
| AI Duplicate Matcher | `ai-duplicate-matcher` | verified | Yes | ai-powered |
| Article Editor | `article-editor` | verified | Yes | content |
| Send Gallery Email | `n8n-gallery-email` | staff | No | automation |
| Social Media Post | `n8n-social-post` | staff | No | automation |
| Batch Image Processor | `batch-image-processor` | pro | No | file-management |
| API Access | `api-access` | enterprise | Yes | automation |

---

## API Routes

### Public Endpoints
- `GET /api/tools` - List all tools with access info
- `GET /api/tools/usage/:toolSlug` - Get usage stats

### Protected Endpoints (require auth + tool access)
- `POST /api/tools/ai/analyse-files` - Gemini file analysis
- `POST /api/tools/ai/find-duplicates` - AI duplicate matching
- `GET /api/tools/articles` - Airtable proxy (read)
- `PATCH /api/tools/articles/:id` - Airtable proxy (update)
- `POST /api/tools/n8n/:workflowId` - n8n webhook trigger

---

## Component Structure

```
client/src/
├── pages/
│   └── tools/
│       ├── index.tsx              # Tools hub landing
│       ├── file-renamer.tsx       # Individual tool pages
│       ├── bulk-mover.tsx
│       ├── duplicate-finder.tsx
│       ├── smart-organiser.tsx
│       └── article-editor.tsx
├── components/
│   └── tools/
│       ├── tool-card.tsx          # Card component
│       ├── access-modal.tsx       # Access control modal
│       ├── tool-layout.tsx        # Shared tool layout
│       └── usage-indicator.tsx    # Rate limit display
└── hooks/
    └── use-tool-access.ts         # Access control hook
```

---

## Security Considerations

### API Keys (Server-Side Only)
- Airtable token: `process.env.AIRTABLE_TOKEN`
- ImgBB key: `process.env.IMGBB_API_KEY`
- Gemini key: `process.env.GEMINI_API_KEY` (already exists)
- n8n webhook URLs: `process.env.N8N_WEBHOOK_*`

### Rate Limiting
- Anonymous: 50-100 operations/day per tool
- Verified: 200-500 operations/day per tool
- Pro: Unlimited or very high limits
- Based on user_id (logged in) or session_id (anonymous)

### File Operations
- All file operations use browser File System Access API
- Files never leave user's machine (except AI analysis of filenames)
- Server only receives filenames/metadata, never file contents

---

## Future Payment Integration

### Prepared Infrastructure
- `subscriptions` table ready for Stripe/Paddle data
- `subscription_tier` column on users
- Access control checks tier from user record
- Usage tracking captures conversion funnel data

### When Adding Payments
1. Add Stripe/Paddle webhook endpoint
2. Implement `SubscriptionService` methods
3. Connect webhook to upgrade/downgrade functions
4. No changes needed to tool access logic

---

## Implementation Order

### Phase 1: Foundation
1. ✅ Design document (this file)
2. ⬜ Run Supabase schema migration
3. ⬜ Create TypeScript types
4. ⬜ Create tools registry config

### Phase 2: Core Components
5. ⬜ Build `use-tool-access` hook
6. ⬜ Build `ToolCard` component
7. ⬜ Build `AccessModal` component
8. ⬜ Create tools hub landing page

### Phase 3: Tool Migration
9. ⬜ Convert file-renamer to React
10. ⬜ Convert bulk-mover to React
11. ⬜ Convert duplicate-finder to React
12. ⬜ Convert smart-organiser to React

### Phase 4: Secure Rebuilds
13. ⬜ Build article-editor with server proxy
14. ⬜ Add AI endpoints (Gemini integration)
15. ⬜ Add n8n trigger endpoints

### Phase 5: Polish
16. ⬜ Email verification flow
17. ⬜ Usage tracking & rate limiting
18. ⬜ Analytics dashboard (admin)

---

## Airtable Migration Notes

Current Airtable usage (as of Dec 2025):
- Editors: 2/5
- Records: 254/1,000
- API calls: 4/1,000 per month
- Attachments: 12.5MB/1GB

**Recommendation**: Consider migrating to Supabase when:
- Approaching 1,000 records
- Multiple staff cause API call spikes
- Need real-time collaboration features

Migration path: Create `articles` table in Supabase with same schema, build migration script, update article-editor to use Supabase directly.
