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

## 📁 CRITICAL CONFIGURATION FILES

**⚠️ PHOTOGRAPHY CATEGORY SYSTEM ARCHITECTURE (100% VERIFIED)**

**PRIMARY FILES:**

1. **`/shared/types/category-config.ts`** - DEFAULT FALLBACK CONTENT
   - Contains `defaultCategoryPageConfig` used by admin dashboard when no saved data exists
   - **CRITICAL**: This is where "Cape Town" appears in fallbacks - MUST be updated to "Durban"
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

**🛑 MANDATORY VALIDATION CHECKPOINTS**

BEFORE writing ANY code, validate against these CORE RULES:

1. **❌ ZERO INLINE CSS**: Never use `style={{}}` props - use CSS classes only
2. **❌ ZERO HARDCODING**: Never hardcode colors, URLs, text, or values - use config/constants
3. **❌ ZERO MOCK DATA**: Never create placeholder/example data - use real config sources
4. **❌ ZERO CUSTOM HOOKS**: Never create `useCategoryConfig` - extend existing hooks only
5. **❌ ZERO ARCHITECTURAL VARIATIONS**: Never deviate from GradientBackground pattern

**🔍 MANDATORY PRE-IMPLEMENTATION CHECKLIST:**
- [ ] Am I using ANY `style={{}}` props? → STOP and use CSS classes
- [ ] Am I hardcoding ANY values? → STOP and use config sources  
- [ ] Am I creating mock/placeholder data? → STOP and use real data
- [ ] Am I creating custom solutions? → STOP and extend existing patterns
- [ ] Does my implementation match working homepage sections EXACTLY? → If no, STOP

**⚠️ CRITICAL: COLOR IMPLEMENTATION STANDARDS**

When implementing colors in any component:

1. **USE GRADIENTBACKGROUND COMPONENT**: Always wrap sections in `<GradientBackground section="sectionName">`
2. **USE CSS CLASSES**: Use `text-salmon`, `text-cyan`, `btn-salmon`, `btn-cyan` etc. (defined in index.css)
3. **SECTION MAPPING**: Map sections to established names: `services`, `portfolio`, `testimonials`, `contact`, `privateGallery`
4. **NO CSS VARIABLES IN COMPONENTS**: Don't use `var(--color-*)` directly - use CSS classes that resolve them
5. **FOLLOW WORKING PATTERNS**: Copy exact color implementation from working homepage sections

**⚠️ MANDATORY: NO ALBUM-SPECIFIC OR ID-SPECIFIC CODE MODIFICATIONS**

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

**⚠️ MANDATORY: COLOR IMPLEMENTATION STANDARD**

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

**⚠️ MANDATORY: ALWAYS consult [`DEV_SERVER_STARTUP.md`](./DEV_SERVER_STARTUP.md) BEFORE attempting to start the development server or troubleshoot startup issues.**

This project uses Docker for development. Do NOT use `npm run dev` directly - it will fail.

## Development Commands

**Primary Development (REQUIRED):**
- `npm run docker:dev` - **ONLY correct way to start development environment**
- `docker-compose --profile dev up adminer -d` - **Start database admin interface (Adminer)**

**Other Commands:**
- `npm run build` - Build for production (Vite client + esbuild server bundle)
- `npm run start` - Start production server (runs built application)
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes with Drizzle

**📋 For complete development setup instructions, see:** [`DEV_SERVER_STARTUP.md`](./DEV_SERVER_STARTUP.md)
- **File structure & storage configuration** (Dropbox vs local)
- Cross-platform setup guide (macOS, Windows, Linux)
- Docker storage optimization and cleanup
- Port conflict resolution  
- Device switching workflow
- Troubleshooting and emergency recovery
- Quick reference commands

## 🔧 Development Startup Checklist

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

## 🤖 BEST PRACTICES FOR CLAUDE CODE INTERACTIONS

### For Users: How to Get Better Results

**📋 Before Starting Any Task:**
1. **Be Specific About Scope**: "Update the contact form validation" vs. "Fix the website"
2. **Reference Existing Patterns**: "Use the same color system as the homepage services section"  
3. **Mention Documentation**: "Follow the established patterns in SITE_MANAGEMENT_GUIDE.md"
4. **Specify No Variations**: "Don't create new architecture, use the existing pattern"

**✅ Effective Request Examples:**
- ✅ "Add a testimonials section to the about page using the GradientBackground pattern from the homepage"
- ✅ "Fix the pricing cards to match the exact styling of the services section"  
- ✅ "Follow the ImageBrowser component pattern from category settings"

**❌ Requests That Lead to Problems:**
- ❌ "Make the colors work" (too vague)
- ❌ "Add some styling" (no reference pattern)
- ❌ "Fix this quickly" (encourages shortcuts)

**🔍 When Issues Arise:**
1. **Stop and Audit**: Ask Claude to check existing working examples first
2. **Reference Documentation**: Point to specific guides that should be followed
3. **Demand Consistency**: "Use the exact same pattern as [working example]"
4. **Reject Variations**: "Don't create a new approach, use the established one"

### For Claude: Systematic Implementation

**📋 MANDATORY Process for Any New Feature:**
1. **Read Documentation First**: Check SITE_MANAGEMENT_GUIDE.md and CLAUDE.md
2. **Find Working Example**: Locate similar functioning component/page
3. **Copy Architecture Exactly**: Use same hooks, components, and patterns
4. **No Custom Solutions**: Never create new patterns when existing ones work
5. **Verify Against Rules**: Ensure no inline styles, custom hooks, or architectural variations

## Architecture Overview

This is a full-stack photography studio website (SlyFox Studios) built with modern web technologies:

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for images
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter (client-side)

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types (Zod validation)
- `public/` - Static assets (images, videos)

### Key Architecture Patterns

**Build System**:
- Development uses Vite dev server with API proxy to Express backend
- Production builds client to `dist/public` and server to `dist/index.js`
- Single Express server serves both API routes and static files in production
- All services run on port 3000 in both development and production

**Database Schema** (`shared/schema.ts`):
- `profiles` - User accounts (Supabase auth integration, primary user table)
- `clients` - Client management with email-based matching
- `shoots` - Photography session metadata with customization options
- `images` - Image files and metadata with sequence ordering
- `packages` - Service packages and pricing
- `analytics` - User interaction tracking

**Authentication Architecture**:
- Supabase Auth for user management with role-based access control
- Server-side auth verification using Supabase admin client
- Role hierarchy: `client` (gallery access) → `staff` (content management) → `super_admin` (full access)
- Mock auth fallback for development without full Supabase setup

**Frontend Architecture**:
- Component organization: `admin/`, `auth/`, `client/`, `common/`, `gallery/`, `layout/`, `sections/`, `shared/`, `ui/`
- Context providers for theme and authentication state
- React Query for server state management
- Wouter for client-side routing
- Path aliases: `@/` (client src), `@shared/` (shared schemas), `@assets/` (attached assets)

**Backend Architecture**:
- Express routes with comprehensive API endpoints for auth, clients, shoots, images
- Multer for file upload handling (10MB limit, images only)
- Request/response logging middleware for API calls
- Supabase integration for both auth and storage operations
- Database seeding and admin initialization utilities

### Component Structure Analysis

**Component Organization**:
- Components are organized by feature: `admin/`, `common/`, `gallery/`, `layout/`, `sections/`, `shared/`, `ui/`
- UI components follow a consistent pattern with variants managed by class-variance-authority (cva)
- Card components use composition pattern (Header, Title, Description, Content, Footer)
- Navigation components implement responsive design with mobile/desktop variations

**Gallery Components Architecture**:
- `GalleryRenderer` - Unified rendering component supporting 8 layout modes with dynamic aspect ratio detection
- `GallerySettingsCard` - Modular settings panel with real-time preview integration
- Layout modes: Automatic, Square 1:1, Portrait 2:3, Landscape 3:2, Instagram 4:5, Upright 9:16, Wide 16:9, Masonry
- Automatic mode uses browser Image API to analyze collection and select optimal aspect ratio
- Real-time color picker with popover interface (non-blocking preview)
- Pixel-precise border radius and image spacing controls (0-40px range)

**Component Relationships**:
- Layout components (`Navigation`, `Footer`) wrap page content
- Page components compose multiple section components
- UI components (Button, Card, Dialog) are used throughout the application
- Admin components use tab-based navigation for different management areas
- Gallery settings provide real-time preview updates across all controls
- Modular gallery architecture allows independent component updates without affecting preview

### Routing Implementation

**Route Configuration**:
- Implemented in `client/src/App.tsx` using Wouter's `Switch` and `Route` components
- Static routes: `/`, `/photography`, `/videography`, `/about`, `/pricing`, `/contact`
- Dynamic routes: 
  - `/photography/:category` - Photography category pages
  - `/videography/:category` - Videography category pages
  - `/gallery/:slug` - Client gallery pages
- Authentication routes: `/login`, `/dashboard`, `/client-portal`, `/admin`

**Route Handling**:
- Parameterized routes use `useParams` hook to access route parameters
- Gallery route uses render prop pattern to pass `shootId` to `ClientGallery` component
- Protected routes redirect based on user authentication state
- Admin routes have role-based access control

### State Management

**Context Providers**:
- `ThemeContext` (client/src/contexts/theme-context.tsx):
  - Manages dark/light theme preference
  - Persists theme selection to localStorage
  - Provides `theme` state and `toggleTheme` function
  - Applied to document element for CSS styling

- `AuthProvider` (client/src/hooks/use-auth.tsx):
  - Manages user authentication state
  - Handles login/logout functionality
  - Persists user session to localStorage
  - Provides role-based access control
  - Integrates with Supabase Auth (mocked in development)

### Custom Hooks

**Key Hooks**:
- `useAuth` (client/src/hooks/use-auth.tsx):
  - Provides authentication state and methods
  - Handles user session management
  - Implements role-based access control

- `useAnalytics` (client/src/hooks/use-analytics.tsx):
  - Tracks page views using Google Analytics
  - Listens to route changes via `useLocation`
  - Prevents duplicate tracking for same route

- `useScrollToTop` (client/src/hooks/use-scroll-to-top.tsx):
  - Scrolls to top of page on route change
  - Uses `useLocation` to detect navigation events

- `useToast` (client/src/hooks/use-toast.ts):
  - Manages toast notifications
  - Implements queue system with dismissal timeout
  - Provides consistent notification experience

- `useMobile` (client/src/hooks/use-mobile.tsx):
  - Detects mobile viewport size
  - Uses window.matchMedia for responsive behavior
  - Returns boolean indicating mobile state

### UI Component Library

**Implementation Details**:
- Built on shadcn/ui component library with Radix UI primitives
- Uses class-variance-authority (cva) for variant management
- Components follow consistent composition patterns
- Tailwind CSS with custom theme configuration

**Key Components**:
- `Button` (client/src/components/ui/button.tsx):
  - Multiple variants (default, destructive, outline, secondary, ghost, link)
  - Multiple sizes (default, sm, lg, icon)
  - Uses cva for variant management
  - Supports asChild prop for component composition

- `Card` (client/src/components/ui/card.tsx):
  - Composition pattern with Header, Title, Description, Content, Footer
  - Consistent styling across the application
  - Used for data display and content organization

- `Dialog` (client/src/components/ui/dialog.tsx):
  - Modal implementation using Radix UI
  - Includes Header, Footer, Title, Description subcomponents
  - Handles accessibility and focus management

**Styling Approach**:
- Tailwind CSS with custom theme configuration
- Class variance authority (cva) for component variants
- CSS variables for theme colors
- Responsive design patterns throughout

### Data Fetching Patterns

**Data Fetching Architecture**:
- React Query for server state management
- Custom `apiRequest` utility for API calls
- Supabase integration for auth and storage
- Mock implementations for development

**Key Files**:
- `queryClient.ts` (client/src/lib/queryClient.ts):
  - Configures React Query client
  - Implements error handling with `throwIfResNotOk`
  - Sets default query options (staleTime, retry, etc.)
  - Provides `getQueryFn` for consistent data fetching

- `supabase.ts` (client/src/lib/supabase.ts):
  - Mock implementation of Supabase client
  - Handles authentication (signIn, signUp, signOut)
  - Manages user roles (client, staff)
  - Will be replaced with real Supabase integration

**Data Flow**:
- Page components use `useQuery` for data fetching
- API routes handle database operations via Drizzle ORM
- Supabase manages authentication and image storage
- React Query handles caching, refetching, and state management

### Application Architecture Diagram

```mermaid
graph LR
    subgraph Frontend
        A[React Components] --> B[Wouter Routing]
        B --> C[Page Components]
        C --> D[UI Components]
        D --> E[shadcn/ui]
        A --> F[React Query]
        F --> G[API Calls]
    end

    subgraph Backend
        H[Express API] --> I[Drizzle ORM]
        I --> J[PostgreSQL]
        H --> K[Supabase Auth]
        H --> L[Supabase Storage]
    end

    G --> H
    K --> M[User Management]
    L --> N[Image Storage]
    A --> O[Context Providers]
    O --> P[Theme Context]
    O --> Q[Auth Context]
    A --> R[Custom Hooks]
    R --> S[useAuth]
    R --> T[useAnalytics]
```

### Environment Configuration
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `VITE_RECAPTCHA_SITE_KEY` - Google reCAPTCHA v3 site key for form protection
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA v3 secret key for server-side verification
- `SMTP_EMAIL` - Gmail SMTP sender email address
- `SMTP_PASSWORD` - Gmail app password for email authentication

**⚠️ Docker Environment Variable Configuration:**
All environment variables must be explicitly listed in `docker-compose.yml` under the `app` service's `environment` section. Environment variables from `.env` are not automatically available in Docker containers unless explicitly mapped.

## Production Deployment

### VPS Configuration
- **Server**: vps.netfox.co.za (168.231.86.89)
- **OS**: Ubuntu 24.04 LTS
- **Resources**: 3.8GB RAM, 1 CPU core, 48GB storage
- **Provider**: Hostinger

### Deployment Architecture
The application is deployed on a VPS alongside N8N automation platform:

**Applications Running:**
- **SlyFox Studios** (this app): Port 3000 → http://168.231.86.89:3000
- **N8N Automation**: Port 5678 → http://168.231.86.89:5678

**Infrastructure Services:**
- **Traefik Reverse Proxy**: Ports 80/443 (SSL termination, HTTP→HTTPS redirect)
- **PostgreSQL**: Port 5432 (SlyFox database)

### Production File Structure
```
VPS Locations:
/opt/sfweb/              # Main application deployment
├── docker-compose.yml   # Production Docker setup
├── .env                 # Production environment variables
└── [project files]      # Complete application codebase

/root/                   # N8N + Traefik configuration
├── docker-compose.yml   # Traefik + N8N setup
├── .env                 # N8N environment variables
└── traefik-certs.yml    # SSL certificate configuration
```

### Production Deployment

**⚠️ MANDATORY: ALWAYS use automated deployment script for production deployments.**

```bash
# Automated production deployment (REQUIRED method)
./deploy-production.sh

# Manual deployment commands (advanced use only)
cd /opt/sfweb
docker-compose down
docker-compose up -d --build

# Monitor application
docker logs sfweb-app --tail 20
docker stats --no-stream

# Database access
docker-compose exec postgres psql -U postgres -d slyfox_studios
```

**📋 For complete production deployment instructions, see:** [`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md)
- **Automated deployment script**: `./deploy-production.sh` with full verification
- **SSH key authentication**: Pre-configured for seamless deployment
- **Configuration persistence**: Docker volumes ensure settings survive deployments
- **Production monitoring**: Container status, resource usage, and log analysis
- **Troubleshooting**: Common deployment issues and recovery procedures

### Domain Configuration
- **Target Domain**: slyfox.co.za (A record pending)
- **Current Access**: http://168.231.86.89:3000
- **SSL**: Automatic Let's Encrypt certificates via Traefik

### Version Control & Deployment
- **Repository**: https://github.com/fatthwacka/sfweb.git
- **Local Development**: Dockerized setup syncs via Dropbox across Intel/ARM devices  
- **Production Deployment**: Automated deployment script with SSH key authentication
- **Code Synchronization**: rsync-based file transfer with exclusions for build artifacts
- **Configuration Persistence**: Docker volumes ensure site management settings survive deployments
- **Deployment Pipeline**: Backup → Sync → Build → Verify → Status Report

### Key Features
- **Advanced Gallery Management**: 8 layout modes with intelligent automatic aspect ratio detection
- **Real-time Gallery Customization**: Live preview with pixel-precise controls (border radius, spacing: 0-40px)
- **Smart Layout Detection**: Browser-based image analysis for optimal aspect ratio selection
- **Non-blocking Color Picker**: Popover-based color selection with real-time background preview
- **Unified Gallery Architecture**: Modular components supporting both admin and client rendering modes
- **Consistent Responsive Design**: Identical breakpoints across all layout modes (2-3-4-5 columns)
- **Precise Masonry Layout**: Accurate gap control matching slider settings exactly
- **Comprehensive Site Management**: Centralized admin interface for all website content with persistent configuration
- **Dynamic Content Configuration**: Hero slides, company info, and page settings management with atomic file persistence
- **Visual Content Editing**: Drag-and-drop image uploads with thumbnail management
- **Real-time Configuration**: Changes reflect immediately across all pages and survive deployments
- **Image upload, organization, and sequence management**
- **SEO-optimized gallery URLs with slug-based routing**
- **Analytics tracking for user interactions**
- **Mobile-responsive design with theme switching**
- **Admin dashboard for comprehensive content management**
- **Real-time image processing and storage via Supabase**
- **Enhanced Scroll Behavior**: Automatic scroll-to-top with browser restoration disabled
- **Professional Contact Form**: Google reCAPTCHA v3 protection with email delivery to dax@slyfox.co.za
- **Phone Number Validation**: South African format (083 123 4567) and international support (+27831234567)
- **Photography Category Pages**: Unified template with "Professional [Category] Photography" branding

## Gallery System Architecture

### Layout Modes (8 Total)
1. **Automatic** - Analyzes image collection using browser Image API to determine most common aspect ratio
2. **Square 1:1** - Forces all images to square aspect ratio (`aspect-square`)
3. **Portrait 2:3** - Standard portrait photography ratio (`aspect-[2/3]`)
4. **Landscape 3:2** - Classic landscape photography ratio (`aspect-[3/2]`)
5. **Instagram 4:5** - Social media optimized portrait (`aspect-[4/5]`)
6. **Upright 9:16** - Vertical video/mobile format (`aspect-[9/16]`)
7. **Wide 16:9** - Cinematic/widescreen format (`aspect-[16/9]`)
8. **Masonry** - Pinterest-style layout preserving natural image ratios

### Automatic Mode Intelligence
```javascript
// Analyzes up to 10 images for performance
// Categorizes into specific aspect ratio buckets:
// - Square: 0.9-1.1 ratio
// - Portrait 2:3: 0.6-0.7 ratio  
// - Landscape 3:2: 1.4-1.6 ratio
// - Instagram 4:5: 0.75-0.85 ratio
// - And more specific ranges...
// Returns the most frequent ratio as CSS class
```

### Gallery Settings Controls
- **Layout Style**: Dropdown with 8 modes, defaults to Automatic
- **Background Color**: Real-time color picker with 5 presets + custom popover
- **Border Radius**: 0-40px slider with inline numeric input
- **Image Spacing**: 0-40px slider matching border radius interface
- **All controls**: Unified `.gallery-slider-container` styling with dark purple gradients

### CSS Architecture
```css
/* Reusable slider container styling */
.gallery-slider-container {
  background: linear-gradient(to right, hsl(280, 60%, 15%), hsl(280, 50%, 10%));
  border: 1px solid hsl(280, 50%, 20%);
  /* Consistent styling for all gallery controls */
}

/* Color picker swatches */
.color-swatch {
  flex: 1; /* Full-width spanning */
  border-radius: 0.25rem; /* Square with rounded corners */
  border: 1px solid hsl(280, 50%, 20%); /* Matching container border */
}

/* Masonry precision spacing */
.masonry-item {
  vertical-align: top;
  break-inside: avoid;
  /* Ensures precise gap control */
}
```

### Performance Optimizations
- **Dynamic Dimension Loading**: Browser Image API reads actual file dimensions (no database required)
- **Smart Sampling**: Automatic mode analyzes first 10 images only
- **Parallel Loading**: Concurrent dimension requests with Promise.all()
- **Real-time Updates**: All controls update live preview immediately
- **Graceful Fallbacks**: Defaults to square while dimensions load

### Browser Compatibility
- **Scroll Restoration**: Disabled via `history.scrollRestoration = 'manual'`
- **Image API**: Uses native `Image()` constructor for dimension reading
- **CSS Grid/Columns**: Modern browser support for layout modes
- **Popover API**: Radix UI popover for non-blocking color picker

## Site Management System Architecture

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

## Contact Form & Email System

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