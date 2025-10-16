# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## 🏗️ CURRENT ARCHITECTURE (OCTOBER 2025)

**⚠️ HYBRID SYSTEM: HARDCODED CORE + DYNAMIC VISUALS**

### **Hardcoded Content Pages**
Core content is now hardcoded in React components for optimal performance:
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

### **Recent Architecture Improvements**
- **Per-Card Pricing Colors**: Individual accent color control for each pricing tier card
- **Portfolio Migration**: Moved from JSON config to Supabase gradients API
- **Enhanced Color System**: 8-color palette with HSL manipulation for sophisticated color schemes
- **CategoryNavigation Component**: Reusable navigation for photography/videography categories

### **Key Benefits**
- ✅ Faster page loads (no config loading delays)
- ✅ Simpler deployments (no JSON sync issues)
- ✅ Better reliability (eliminates config corruption)
- ✅ Visual customization preserved (gradients + per-card colors)
- ✅ Granular design control (individual card accent colors)

**📋 For detailed architecture information, see:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 📁 DYNAMIC CONFIGURATION FILES

**⚠️ PHOTOGRAPHY CATEGORY SYSTEM ARCHITECTURE**

**PRIMARY FILES:**

1. **`/shared/types/category-config.ts`** - DEFAULT FALLBACK CONTENT
   - Contains `defaultCategoryPageConfig` used by admin dashboard when no saved data exists
   - Used by admin component when `config.categoryPages.photography.[category]` is empty

2. **`/server/data/site-config-overrides.json`** - PERSISTENT SAVED DATA
   - Stores actual saved content from admin dashboard
   - Structure: `categoryPages.photography.[category]` (e.g., `categoryPages.photography.corporate`)
   - API: `/api/site-config/bulk` (PATCH method ONLY)

3. **`/client/src/components/admin/page-settings/category-page-settings.tsx`** - ADMIN DASHBOARD
   - Manages photography category settings (wedding, corporate, portraits, etc.)
   - Saves via PATCH `/api/site-config/bulk`
   - Falls back to `defaultCategoryPageConfig` when no saved data

4. **`/client/src/pages/photography-category.tsx`** - TARGET PAGES
   - Displays live photography category pages (`/photography/corporate`, etc.)
   - Gets data from same API endpoint
   - Different fallback: hardcoded generic object (not the TypeScript defaults)

**🔄 DATA FLOW**: Admin saves → JSON file → API serves → Target page displays
**🚨 PATCH METHOD REQUIRED**: Never use POST - always PATCH for configuration updates

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

### 🔍 MANDATORY PRE-IMPLEMENTATION CHECKLIST

- [ ] Am I using ANY `style={{}}` props? → STOP and use CSS classes
- [ ] Am I hardcoding ANY values? → STOP and use config sources
- [ ] Am I creating mock/placeholder data? → STOP and use real data
- [ ] Am I creating custom solutions? → STOP and extend existing patterns
- [ ] Does my implementation match working homepage sections EXACTLY? → If no, STOP

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

**Why This Pattern Works**:
- ✅ Colors are controlled by dashboard settings
- ✅ CSS variables are set automatically
- ✅ Works in both development and production
- ✅ Consistent across all sections
- ✅ No inline style maintenance

### ⚠️ NO ALBUM-SPECIFIC OR ID-SPECIFIC CODE MODIFICATIONS

When working on dynamic gallery pages or any dynamic content system:

- **NEVER** target specific albums, IDs, slugs, or individual records in conditional logic
- **NEVER** use conditions like `if (albumSlug === 'specific-album')` or similar targeting
- **ALWAYS** work on the universal, dynamic code that affects ALL records equally
- **If experimenting with a single record is needed:**
  1. Clearly state it's a temporary experiment
  2. Immediately roll the solution back to universal code once identified
  3. Never leave album-specific conditions in the codebase

**Example of FORBIDDEN patterns:**
```javascript
// ❌ NEVER DO THIS
if (shoot?.customSlug === 'aloe') { /* special handling */ }
if (album.id === 'specific-id') { /* different logic */ }
```

**Example of CORRECT patterns:**
```javascript
// ✅ ALWAYS DO THIS
if (images.length > 12) { /* universal logic based on data characteristics */ }
if (gallerySettings?.layoutStyle === 'masonry') { /* universal logic based on settings */ }
```

This rule prevents maintenance nightmares, ensures consistent user experience, and maintains system scalability.

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
4. ✅ Start Adminer for database access: `docker-compose --profile dev up adminer -d`
5. ✅ Verify http://localhost:3000 responds with HTTP 200 OK
6. ✅ Verify http://localhost:8080 shows Adminer interface

**⚠️ ARM-based Apple Silicon Note (M1/M2/M3 Macs):**
- Docker containers automatically build for both ARM64 and AMD64 architectures
- No special steps required - the multi-platform build handles compatibility
- Expect slightly longer initial build times compared to Intel Macs
- Total local storage requirement: ~1.1GB (see DEV_SERVER_STARTUP.md for breakdown)

---

## 🚀 PRODUCTION DEPLOYMENT

**⚠️ MANDATORY: ALWAYS use automated deployment script for production deployments.**

### Quick Deployment

```bash
# Automated production deployment (REQUIRED method)
./deploy-production.sh
```

**📋 For complete production deployment instructions, see:** [`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md)
- **Automated deployment script**: `./deploy-production.sh` with full verification
- **SSH key authentication**: Pre-configured for seamless deployment
- **Configuration persistence**: Docker volumes ensure settings survive deployments
- **Production monitoring**: Container status, resource usage, and log analysis
- **Troubleshooting**: Common deployment issues and recovery procedures

### Common Deployment Issues

**🚨 PRODUCTION DEPLOYMENT TROUBLESHOOTING:**
- **HTTP 500 with ERR_MODULE_NOT_FOUND**: Use "nuclear option" fix in [`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md)
- **Code changes not reflecting**: Docker build cache issue - see "Docker Build Cache Issues" section in [`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md) for `--no-cache` rebuild process
- **Client-side routing broken**: Test with real browser, not curl commands (server-side routing only serves index.html)

### VPS Configuration
- **Server**: vps.netfox.co.za (168.231.86.89)
- **Domain**: slyfox.co.za
- **OS**: Ubuntu 24.04 LTS
- **Resources**: 3.8GB RAM, 1 CPU core, 48GB storage
- **Provider**: Hostinger
- **Repository**: https://github.com/fatthwacka/sfweb.git

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

- **🤖 Site Management Specialist Agent**: [`site-management-specialist.md`](./site-management-specialist.md)
  - Expert agent for site configuration governance and component development
  - References complete implementation guide for technical details

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

**Management Interface Features:**
- **Visual Thumbnail Management**: 80px image previews with drag-and-drop upload
- **Hero Slide Management**: Add/remove/reorder with up/down controls
- **Real-time Validation**: Unsaved changes tracking with visual indicators
- **Company Information**: Business details, contact info, address management
- **File Upload Integration**: POST `/api/upload` with automatic path updates
- **Configuration Persistence**: Atomic file writes with Docker volume persistence across deployments
- **Production Deployment**: Settings automatically backed up and restored during deployments

---

## 📧 CONTACT FORM & EMAIL SYSTEM

### Architecture
The contact form system provides secure form submission with spam protection and automated email delivery to the studio owner.

**Core Components:**
- **Frontend Form** (`client/src/components/sections/contact-section.tsx`): React form with validation and reCAPTCHA integration
- **Backend API** (`server/routes.ts`): `/api/contact` endpoint with reCAPTCHA verification and email sending
- **Email Service** (`server/email-service.ts`): Nodemailer-based email delivery with Gmail SMTP
- **reCAPTCHA Service** (`server/recaptcha-service.ts`): Google reCAPTCHA v3 bot protection

### Phone Number Validation
**Supported Formats:**
- **South African Local**: 9 digits starting with 0 (e.g., `0831234567`, displayed as `083 123 4567`)
- **International**: 12-15 digits starting with + (e.g., `+27831234567`, `+1234567890123`)
- **Regex Patterns**:
  ```javascript
  const southAfricanRegex = /^0\d{8}$/; // 9 digits starting with 0
  const internationalRegex = /^\+\d{11,14}$/; // 12-15 digits starting with +
  ```
- **Optional Field**: Phone number validation only runs if field contains content

### reCAPTCHA v3 Integration
**Implementation Details:**
- **Client-side**: `useRecaptcha` hook loads Google reCAPTCHA v3 script and executes on form submission
- **Script Loading**: reCAPTCHA script loaded in `client/index.html` with site key: `6Le3Y7YrAAAAAJn-74S3y_kLoDIax3vY6MyisDPs`
- **Server-side**: Verification via Google's verification API with secret key
- **Action**: `contact_form` action used for scoring and analysis
- **Score Threshold**: Scores above 0.5 are considered human (configurable)

### Email Delivery System
**SMTP Configuration:**
- **Service**: Gmail SMTP (`smtp.gmail.com:587`)
- **Authentication**: App-specific password (not regular Gmail password)
- **Sender**: `dax.tucker@gmail.com`
- **Recipient**: `dax@slyfox.co.za`
- **Dependencies**: Requires `nodemailer` package (already in package.json)

**Email Template Features:**
- **HTML Format**: Professional styled email with contact details and message
- **Plain Text Fallback**: Ensures compatibility across all email clients
- **Contact Information**: Name, email, phone (if provided), service type, message
- **Timestamp**: Automatic timestamp of form submission
- **Direct Action Links**: Clickable email and phone links for immediate response

### Error Handling & Debugging
**Common Issues:**
1. **Environment Variables**: All variables must be listed in `docker-compose.yml`
2. **Nodemailer Import**: Use `nodemailer.createTransport` (not `createTransporter`)
3. **reCAPTCHA Site Key**: Must match in both `.env` and `client/index.html`
4. **Gmail Security**: Requires app password, not regular password

**Debugging Commands:**
```bash
# Check email service logs
docker-compose logs app | grep -i email

# Test contact form directly
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","message":"Test message"}'
```

### Photography Category Pages
**Template Architecture:**
- **Single Template**: `client/src/pages/photography-category.tsx` serves all photography categories
- **Dynamic Categories**: wedding, portrait, corporate, event, product, graduation, matric-dance
- **URL Structure**: `/photography/:category` (e.g., `/photography/weddings`)
- **Title Format**: "Professional [Category Name] Photography" (e.g., "Professional Wedding Photography")
- **Content Sections**: Hero, About/Features, Packages, Gallery, SEO content

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
   - If established pattern doesn't fit → STOP and ask: "I need to extend the GradientBackground pattern for dynamic category data. Should I create a gradientOverride prop, or would you prefer a different approach?"
   - If data structure doesn't match → STOP and ask: "The category data structure differs from homepage. Should I transform the data to match, or extend the component?"
   - If CSS classes don't exist → STOP and ask: "I need new CSS classes for this implementation. Should I add them to index.css following the existing pattern?"

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
   - Update `CLAUDE.md` and `SITE_MANAGEMENT_GUIDE.md` when patterns evolve (with user approval)
   - Add clear rules to prevent future inconsistencies
   - Include "working vs broken" examples in documentation
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
