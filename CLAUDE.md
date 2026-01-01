# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## 🎨 VERTEX AI IMAGE GENERATION (NEW - DECEMBER 2025)

**⚠️ FULLY OPERATIONAL: Real AI image generation using Google Vertex AI Imagen 3.0**

### **Core Implementation**
- **Service**: `VertexAIImageGenerator` in `/server/services/vertex-ai-image-generator.ts`
- **Authentication**: OAuth 2.0 service account with private key credentials
- **API**: Google Cloud Vertex AI Imagen 3.0 Generate model
- **Image Hosting**: ImgBB for generated image URLs
- **Integration**: AI Image Generator modal in Tools section

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
- **Style Controls**: Art style (photorealistic, illustrated, cinematic, etc.) + image style (professional, lifestyle, dramatic, etc.)
- **Aspect Ratio Support**: 1:1, 9:16, 4:5, 2:3, 3:2, 16:9 with proper Vertex AI formatting
- **Resolution Scaling**: 512px to 2048px with intelligent size calculations
- **Rate Limiting**: 3-second minimum intervals between API calls
- **Error Handling**: Graceful fallbacks and detailed logging

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

**⚠️ HYBRID SYSTEM: HARDCODED CORE + DYNAMIC VISUALS + AI-ENHANCED BLOG**

### **📝 Blog System (NEW - December 2025)**
Complete AI-powered blog management system:
- **Blog Management**: `/client/src/components/admin/blog-management.tsx` - Full CRUD with filtering
- **AI Content Generation**: Gemini 2.0-flash integration for automated content creation
- **Section Enhancement System**: Per-section AI improvements (reduce, increase, grammar, rewrite, tone)
- **Dynamic Category Management**: Inline category creation with auto-slug generation
- **Custom Gradients**: Per-article background color customization via Supabase
- **SEO Optimization**: Auto-generated titles, descriptions, structured data

### **🎨 Per-Article Gradient System (NEW - December 2025)**
Blog posts can override default gradients:
- **Gradient Storage**: Supabase `siteGradients` table with `blog-post-{id}` keys
- **Fallback Chain**: Custom gradient → stories-content → defaults
- **Real-time Editor**: GradientPicker component in blog editor sidebar
- **Smooth Transitions**: 700ms fade between gradients on page load
- **Auto-save**: Changes persist automatically with 2-second debounce

### **🤖 AI Enhancement Features (NEW - December 2025)**
Section-by-section content improvement:
- **5 Enhancement Options**:
  - ➖ Reduce (40-50% word reduction)
  - ➕ Increase (append relevant sentence)
  - ✅ Grammar (spelling, grammar, flow)
  - 🔄 Rewrite (complete fresh phrasing)
  - 📝 Tone (12 professional tone options)
- **Visual Feedback**: Grey→white→amber states, processing indicators
- **Undo System**: 10-second auto-dismiss with content restoration
- **Context-Aware**: Prompts include section title and article context

### **Hardcoded Content Pages**
Core content is hardcoded in React components for optimal performance:
- **Contact Page**: `/client/src/pages/contact.tsx` - Business info, hours, contact methods
- **About Page**: `/client/src/pages/about.tsx` - Team members, story, values, stats
- **Admin Panels**: Text management removed, visual controls (gradients/images) preserved

### **Dynamic Configuration Pages**
These still use JSON configuration:
- **Homepage**: Hero slides, services overview, testimonials
- **Photography Categories**: All 6 static pages use config data
- **Portfolio**: Featured content and visual settings (now via Supabase gradients API)
- **Gradients**: All section background colors via Supabase database
- **Pricing Packages**: Per-card accent colors stored in `pricing_packages` table

### **Key Benefits**
- ✅ AI-powered content creation and enhancement
- ✅ Per-article visual customization
- ✅ Faster page loads (no config loading delays)
- ✅ Better reliability (eliminates config corruption)
- ✅ Professional content quality with minimal effort
- ✅ Granular design control (individual post colors)

**📋 For detailed architecture information, see:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 🔧 DEVELOPMENT SETUP

**⚠️ MANDATORY: ALWAYS consult [`DEV_SERVER_STARTUP.md`](./DEV_SERVER_STARTUP.md) BEFORE attempting to start the development server or troubleshoot startup issues.**

This project uses Docker for development. Do NOT use `npm run dev` directly - it will fail.

### Quick Start Commands

**Primary Development (REQUIRED):**
- `npm run docker:dev` - **ONLY correct way to start development environment**
- `docker-compose --profile dev up adminer -d` - **Start database admin interface (Adminer)**

**Other Commands:**
- `npm run build` - Build for production (Vite client + esbuild server bundle)
- `npm run start` - Start production server (runs built application)
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes with Drizzle

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

## 📝 BLOG SYSTEM ARCHITECTURE (NEW - DECEMBER 2025)

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

### 🛑 MANDATORY VALIDATION CHECKPOINTS

BEFORE writing ANY code, validate against these CORE RULES:

1. **❌ ZERO INLINE CSS**: Never use `style={{}}` props - use CSS classes only
2. **❌ ZERO HARDCODING**: Never hardcode colors, URLs, text, or values - use config/constants
3. **❌ ZERO MOCK DATA**: Never create placeholder/example data - use real config sources
4. **❌ ZERO CUSTOM HOOKS**: Never create `useCategoryConfig` - extend existing hooks only
5. **❌ ZERO ARCHITECTURAL VARIATIONS**: Never deviate from GradientBackground pattern

### ⚠️ COLOR IMPLEMENTATION STANDARD

All dynamic colors MUST follow this exact pattern (NO EXCEPTIONS):

1. **Use `GradientBackground` Component**:
   ```tsx
   <GradientBackground section="services" className="py-20">
     <h2 className="text-salmon">Title</h2>
     <p className="text-muted-foreground">Content</p>
   </GradientBackground>
   ```

2. **Use CSS Classes for Colors**:
   - Headers: `text-salmon`, `text-cyan`
   - Body text: `text-muted-foreground`
   - NEVER use `style={{ color: '...' }}` inline styles

3. **Use `useSiteConfig()` Hook**:
   ```tsx
   const { config } = useSiteConfig();
   const sectionData = config?.home?.services || fallback;
   ```

4. **Available GradientBackground Sections**:
   - `services` - Service overview sections
   - `portfolio` - Package/pricing sections
   - `testimonials` - Gallery/recent work sections
   - `contact` - Contact/CTA sections
   - `blog-post-{id}` - Individual blog post gradients

### ⚠️ NO ALBUM-SPECIFIC OR ID-SPECIFIC CODE MODIFICATIONS

When working on dynamic gallery pages or any dynamic content system:

- **NEVER** target specific albums, IDs, slugs, or individual records in conditional logic
- **NEVER** use conditions like `if (albumSlug === 'specific-album')` or similar targeting
- **ALWAYS** work on the universal, dynamic code that affects ALL records equally
- **If experimenting with a single record is needed:**
  1. Clearly state it's a temporary experiment
  2. Immediately roll the solution back to universal code once identified
  3. Never leave album-specific conditions in the codebase

This rule prevents maintenance nightmares, ensures consistent user experience, and maintains system scalability.

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

**🔒 MANDATORY PROTOCOL: RULE VALIDATION BEFORE ANY CODE**

1. **STOP AND VALIDATE FIRST**
   - Run through MANDATORY VALIDATION CHECKPOINTS before writing a single line
   - If ANY checkpoint fails → Ask user for guidance instead of proceeding
   - Never justify rule violations with "technical constraints" - get approval first

2. **ESCALATION PROTOCOL FOR CONSTRAINTS**
   - If established pattern doesn't fit → STOP and ask for guidance
   - If data structure doesn't match → STOP and ask how to transform or extend
   - If CSS classes don't exist → STOP and ask where to add them

3. **ZERO TOLERANCE IMPLEMENTATION**
   - ❌ NEVER write `style={{}}` - use CSS classes or ask for new ones
   - ❌ NEVER hardcode values - use config or ask where to get them
   - ❌ NEVER create mock data - use real data or ask for data structure
   - ❌ NEVER create architectural variations - extend existing patterns or ask for guidance

4. **ARCHITECTURAL ANALYSIS SEQUENCE**
   - Read existing working components first (`services-overview.tsx`, `testimonials.tsx`)
   - Understand the established patterns before implementing variations
   - Identify and follow the exact data flow and component structure
   - If pattern doesn't apply → ESCALATE, don't deviate

5. **DOCUMENTATION AND CONSISTENCY**
   - Update `CLAUDE.md` when patterns evolve (with user approval)
   - Add clear rules to prevent future inconsistencies
   - Include working examples in documentation
   - Follow documented patterns even across different conversation sessions

### Common Anti-Patterns to Avoid

❌ **Creating architectural variations** - stick to established patterns
❌ **Using inline styles** - use CSS classes defined in index.css
❌ **Custom hooks for standard functionality** - use `useSiteConfig()` consistently
❌ **Forgetting section mapping** - ensure `GradientBackground` sections align with CSS
❌ **Not testing color changes** - verify dashboard updates reflect on pages
❌ **Inconsistent data sources** - use unified config system, not multiple sources

✅ **Follow working implementations exactly**
✅ **Use established CSS classes and components**
✅ **Maintain architectural consistency**
✅ **Test implementations thoroughly**
✅ **Update documentation when patterns change**

---

## 📚 APPENDIX - LEGACY/UNCERTAIN SECTIONS

*The following sections contain information that may be outdated or superseded by newer implementations. Review carefully before using.*

### Photography Category Pages (Status: Uncertain)
**Template Architecture:**
- **Single Template**: `client/src/pages/photography-category.tsx` serves all photography categories
- **Dynamic Categories**: wedding, portrait, corporate, event, product, graduation, matric-dance
- **URL Structure**: `/photography/:category` (e.g., `/photography/weddings`)
- **Title Format**: "Professional [Category Name] Photography" (e.g., "Professional Wedding Photography")
- **Content Sections**: Hero, About/Features, Packages, Gallery, SEO content

*Note: This may have been superseded by newer category management system. Verify current implementation.*

### Dynamic Configuration Files (Status: Partially Superseded)
**⚠️ PHOTOGRAPHY CATEGORY SYSTEM ARCHITECTURE**

*Note: Parts of this may be outdated with new blog system and configuration management changes.*

**PRIMARY FILES:**

1. **`/shared/types/category-config.ts`** - DEFAULT FALLBACK CONTENT
   - Contains `defaultCategoryPageConfig` used by admin dashboard when no saved data exists
   - Used by admin component when `config.categoryPages.photography.[category]` is empty

2. **`/server/data/site-config-overrides.json`** - PERSISTENT SAVED DATA
   - Stores actual saved content from admin dashboard
   - Structure: `categoryPages.photography.[category]` (e.g., `categoryPages.photography.corporate`)
   - API: `/api/site-config/bulk` (PATCH method ONLY)

*Verify if this is still the current configuration management approach.*

### Contact Form & Email System (Status: Current - December 2025)

**Architecture**: The contact form system provides secure form submission with spam protection and automated email delivery to the studio owner.

**Core Components:**
- **Frontend Form** (`client/src/components/sections/contact-section.tsx`): React form with validation and reCAPTCHA integration
- **Backend API** (`server/routes.ts`): `/api/contact` endpoint with reCAPTCHA verification and email sending
- **Email Service** (`server/email-service.ts`): Nodemailer-based email delivery with Gmail SMTP
- **reCAPTCHA Service** (`server/recaptcha-service.ts`): Google reCAPTCHA v3 bot protection
- **reCAPTCHA Site Key**: Loaded in `client/index.html` via Google script

**⚠️ Known Issue & Fix: reCAPTCHA Timeout (December 2025)**

**Symptoms:**
- Contact form button works for validation errors (shows toast on invalid phone)
- Button presses silently with no response when all fields are valid
- Works in development but fails in production
- Backend API works fine when tested directly via curl

**Root Cause:**
The `executeRecaptcha()` Promise from `react-google-recaptcha-v3` can hang indefinitely in production environments. This happens when:
- reCAPTCHA script loads slowly or partially
- Network issues prevent reCAPTCHA from completing verification
- Third-party script blockers interfere with Google's reCAPTCHA service

**The Fix (Implemented):**
A 5-second timeout wrapper using `Promise.race()` ensures the form never hangs:
```typescript
// Execute reCAPTCHA with timeout (don't block form submission if it fails)
let recaptchaToken: string | null = null;
if (isRecaptchaLoaded()) {
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    );
    recaptchaToken = await Promise.race([
      executeRecaptcha('contact_form'),
      timeoutPromise
    ]);
    if (!recaptchaToken) {
      console.warn('reCAPTCHA timed out or failed, proceeding without token');
    }
  } catch (error) {
    console.error('reCAPTCHA error:', error);
  }
}
```

**Backend Handling:**
The backend (`server/routes.ts`) handles missing tokens gracefully - it logs a warning but still processes the submission. This ensures legitimate users aren't blocked by reCAPTCHA failures.

**Troubleshooting Contact Form Issues:**
1. **Check browser console** - Look for reCAPTCHA errors or network failures
2. **Test backend directly**: `curl -X POST https://slyfoxstudios.co.za/api/contact -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","message":"test","phone":""}'`
3. **Verify reCAPTCHA keys** - Check `.env` has valid `RECAPTCHA_SECRET_KEY`
4. **Check email service** - Verify Gmail SMTP credentials in `.env`

---

## 🛡️ ENHANCED SECURITY SYSTEM (December 2025)

### **Pre-Commit Safety Hooks to Prevent Future Leaks**

**🚨 CRITICAL UPDATE: Automated Security Scanning + Mandatory Confirmation Implemented**

A comprehensive pre-commit hook system has been implemented to prevent accidental exposure of sensitive credentials and API keys. **Every commit now requires explicit manual confirmation.**

#### **Safety Hook Components:**

**1. Git Pre-Commit Hook (`/.git/hooks/pre-commit`)**
```bash
#!/bin/sh
# Automated security scanning before every commit

echo "🔍 Running security checks..."

# Check for Supabase API keys
if git diff --cached --name-only | xargs grep -l "sb_secret_" 2>/dev/null; then
    echo "❌ BLOCKED: Supabase secret key detected in staged files"
    echo "💡 Remove hardcoded keys and use environment variables instead"
    exit 1
fi

# Check for environment variable leaks
if git diff --cached --name-only | xargs grep -l "SUPABASE_SECRET_KEY.*=" 2>/dev/null; then
    echo "❌ BLOCKED: Environment variable assignment detected"
    exit 1
fi

# Check for N8N token patterns
if git diff --cached --name-only | xargs grep -l "Bearer eyJ[a-zA-Z0-9]" 2>/dev/null; then
    echo "❌ BLOCKED: Hardcoded Bearer token detected"
    exit 1
fi

# Check for password patterns
if git diff --cached --name-only | xargs grep -l "password.*=" 2>/dev/null; then
    echo "⚠️ WARNING: Password assignment detected - verify this is safe"
fi

echo "✅ Security checks passed"
```

**2. Environment Variable Validation (`server/startup-validation.ts`)**
```typescript
// Validates required environment variables at server startup
export function validateEnvironmentVariables() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SMTP_EMAIL',
    'SMTP_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ All required environment variables present');
}
```

**3. Supabase Key Format Validation**
New environment variable naming enforces clarity and prevents confusion:
- **Client Keys**: `VITE_SUPABASE_PUBLISHABLE_KEY` (safe for browser exposure, starts with `sb_publishable_`)
- **Server Keys**: `SUPABASE_SECRET_KEY` (server-only admin access, starts with `sb_secret_`)

#### **Security Measures Implemented:**

**✅ Mandatory Commit Confirmation (NEW - December 2025)**
- **EVERY commit requires typing "yes"** to proceed - no accidental commits possible
- **Shows file list** before any git operation for manual review
- **Blocks all automated commits** - human confirmation required for every operation
- **Prevents batch operations** without conscious review of each change

**✅ Automatic Secret Detection**
- Pre-commit hooks scan for hardcoded API keys before allowing commits
- **Enhanced pattern matching** for Supabase keys (`sb_secret_*`, `sb_publishable_*`), N8N tokens (`Bearer eyJ*`), and all major API providers
- Blocks commits containing sensitive data with clear error messages

**✅ Environment Variable Enforcement**
- Server startup validates all required environment variables are present
- Production deployment scripts verify configuration before deployment
- Clear error messages guide resolution of missing credentials

**✅ Key Format Standardization**
- New Supabase key naming convention prevents confusion between client/server keys
- Descriptive variable names make security implications clear
- Consistent format across all environments (development, staging, production)

#### **Historical Security Issue Resolved**

**Background**: In December 2025, a major security audit revealed multiple instances where sensitive API keys were inadvertently committed to the repository, including:
- Hardcoded N8N authentication tokens in `server/routes.ts`
- Mixed usage of old vs new Supabase environment variable names
- Inconsistent environment variable validation across different components

**Resolution**: Complete security overhaul implemented with:
1. **Retroactive cleanup** of all hardcoded credentials from codebase
2. **Automated prevention** through pre-commit hooks
3. **Standardized naming** for all environment variables
4. **Enhanced validation** at startup and deployment time

### **Updated Supabase Authentication Architecture**

#### **New Direct Method Integration (December 2025)**

**Previous Architecture**: Mixed client-side and server-side Supabase integration with inconsistent key usage

**New Architecture**: Unified, secure Supabase integration with proper key separation

**Key Components:**

**1. Server-Side Supabase Client (`server/lib/supabase.ts`)**
```typescript
import { createClient } from '@supabase/supabase-js';

// Unified Supabase client for all server operations
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,  // Admin access for server operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**2. Client-Side Integration (`client/src/lib/supabase.ts`)**
```typescript
import { createClient } from '@supabase/supabase-js';

// Client-safe Supabase client for browser operations
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!  // Safe for browser exposure
);
```

**3. Environment Variable Migration**
```bash
# Current standard (Dec 2025)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[project_id]_[random_string]
SUPABASE_SECRET_KEY=sb_secret_[project_id]_[random_string]
```

#### **Security Benefits:**

**🔒 Clear Key Separation**
- Publishable keys for client-side operations (row-level security enforced)
- Secret keys for server-side admin operations (bypass RLS when needed)
- Naming convention makes security implications immediately clear

**🔒 Improved Access Control**
- Server operations use admin client with full database access
- Client operations respect row-level security policies
- No client access to sensitive admin operations

**🔒 Future-Proof Architecture**
- Consistent with Supabase's latest security recommendations
- Easy key rotation without code changes
- Clear audit trail for all database operations

#### **Migration Impact:**

**✅ All Files Updated**: Complete codebase migration to new key format completed
- 21+ files updated across client and server components
- All old environment variable references removed
- Comprehensive testing verified functionality maintained

**✅ Production Ready**: New system deployed and verified in production
- All API endpoints functioning correctly
- Authentication flow working seamlessly
- Gallery access and admin operations confirmed

**✅ Documentation Updated**: All technical documentation reflects new system
- Environment setup guides updated
- Deployment documentation includes new validation steps
- Security procedures documented for future developers