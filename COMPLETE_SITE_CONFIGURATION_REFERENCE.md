# Complete Site Configuration System Reference

This document provides a comprehensive mapping of ALL configuration files, dashboard components, and target pages in the SlyFox Studios site management system.

## 🗂️ ALL Configuration Files That Store Settings

### **Primary Configuration Storage**

#### 1. **`/server/data/site-config-overrides.json`** ⭐ **PRIMARY PERSISTENCE FILE**
- **Purpose**: Main configuration storage for all site management settings
- **Scope**: Homepage, contact, about, portfolio, gradients, category pages
- **Persistence**: Atomic file writes, survives deployments via Docker volumes
- **API Access**: 
  - GET `/api/site-config` (merged with defaults)
  - PATCH `/api/site-config/bulk` (updates this file)
- **Admin Components**: ALL admin settings components write to this file
- **Content Structure**:
```json
{
  "contact": { "business": {}, "methods": [], "hours": {}, "responseTimes": {}, "serviceAreas": {}, "emergency": {} },
  "home": { "hero": { "slides": [] }, "servicesOverview": {}, "testimonials": {}, "privateGallery": {} },
  "portfolio": { "featured": {} },
  "about": { "hero": {}, "story": {}, "values": {}, "team": {}, "cta": {} },
  "categoryPages": { 
    "photography": { "weddings": {}, "corporate": {}, "portraits": {}, "events": {}, "products": {}, "graduation": {} },
    "videography": { /* similar structure */ }
  },
  "gradients": { "services": {}, "testimonials": {}, "contact": {}, "privateGallery": {}, "portfolio": {} }
}
```

#### 2. **`/shared/types/category-config.ts`** ⭐ **DEFAULT FALLBACKS FOR CATEGORIES**
- **Purpose**: Default content for photography/videography category pages
- **Scope**: Category page fallbacks when no saved data exists
- **Usage**: Provides `defaultCategoryPageConfig` structure
- **Admin Components**: Used by `CategoryPageSettings` component
- **Content**: Complete category page structure (hero, serviceOverview, packages, recentWork, seoContent, seo)
- **Critical Note**: Contains "Cape Town" references that should be "Durban" for proper fallbacks

### **Backup and Recovery Files**

#### 3. **`/server/data/site-config-backup-*.json`** 📦 **DEPLOYMENT BACKUPS**
- **Purpose**: Automatic backups created during deployments
- **Naming**: `site-config-backup-YYYYMMDD-HHMMSS.json`
- **Usage**: Recovery files if deployment corrupts configuration
- **Created By**: `deploy-production.sh` script before deployments

#### 4. **`/tmp/dev-config-backup.json`** 📦 **SYNC BACKUP**
- **Purpose**: Temporary backup during dev→production sync operations
- **Usage**: Manual backup created for configuration synchronization
- **Scope**: Complete site configuration for safe syncing

## 🎛️ ALL Dashboard Components → Configuration Files Mapping

### **Homepage Management** 🏠

#### **HomepageSettings Component**
- **File**: `/client/src/components/admin/page-settings/homepage-settings.tsx`
- **Configuration Target**: `/server/data/site-config-overrides.json`
- **Config Paths Managed**:
  - `home.hero.slides[]` - Hero slides with images, titles, subtitles, CTAs
  - `home.servicesOverview` - Services section content and structure
  - `home.testimonials` - Customer testimonials and reviews
  - `home.privateGallery` - Private gallery section content
- **API Methods**: PATCH `/api/site-config/bulk`
- **Sections with Colors**: Hero, Services, Testimonials, Private Gallery (all with GradientPicker)

### **Contact Management** 📞

#### **ContactSettings Component**
- **File**: `/client/src/components/admin/page-settings/contact-settings.tsx`
- **Configuration Target**: `/server/data/site-config-overrides.json`
- **Config Paths Managed**:
  - `contact.business` - Company name, tagline, phone, email, address
  - `contact.methods[]` - Contact method cards with icons and details
  - `contact.hours` - Business hours for all days + display formatting
  - `contact.responseTimes` - Response time expectations for each method
  - `contact.serviceAreas` - Primary, extended, and destination service areas
  - `contact.emergency` - Emergency contact section with multiple numbers
- **API Methods**: PATCH `/api/site-config/bulk`
- **Sections with Colors**: Contact section with GradientPicker

### **About Page Management** 👥

#### **AboutSettings Component**
- **File**: `/client/src/components/admin/page-settings/about-settings.tsx`
- **Configuration Target**: `/server/data/site-config-overrides.json`
- **Config Paths Managed**:
  - `about.hero` - Title, description, statistics with icons
  - `about.story` - Title and multiple paragraph content blocks
  - `about.values` - Title, description, values array with icons
  - `about.team` - Title, description, team members with photos
  - `about.cta` - Call-to-action section with background image
- **API Methods**: PATCH `/api/site-config/bulk`
- **Sections with Colors**: Story, Values, Team, Location, CTA (all with GradientPicker)

### **Portfolio Management** 🖼️

#### **PortfolioSettings Component**
- **File**: `/client/src/components/admin/page-settings/portfolio-settings.tsx`
- **Configuration Target**: `/server/data/site-config-overrides.json`
- **Config Paths Managed**: `portfolio.featured` - Featured portfolio settings
- **API Methods**: PATCH `/api/site-config/bulk`

#### **FrontPageSettings Component** ⚠️ **LEGACY**
- **File**: `/client/src/components/admin/front-page-settings.tsx`
- **Configuration Target**: `/server/data/site-config-overrides.json`
- **Config Paths Managed**: 
  - `portfolio.featured` - Image layout, padding, border radius, count, colors
  - Advanced gallery controls with 0-40px sliders
- **API Methods**: Direct PATCH `/api/site-config/bulk` calls
- **Note**: Marked for cleanup/refactoring to follow current patterns

### **Photography Category Management** 📸

#### **PhotographySettings Component**
- **File**: `/client/src/components/admin/page-settings/photography-settings.tsx`
- **Purpose**: Tab interface coordinator for 6 photography categories
- **Manages**: Weddings, Portraits, Corporate, Events, Products, Graduation

#### **CategoryPageSettings Component**
- **File**: `/client/src/components/admin/page-settings/category-page-settings.tsx`
- **Configuration Targets**:
  - **Primary**: `/server/data/site-config-overrides.json`
  - **Fallbacks**: `/shared/types/category-config.ts`
- **Config Paths Managed**:
  - `categoryPages.photography.[category].hero` - Hero section with image, title, subtitle, CTA
  - `categoryPages.photography.[category].serviceOverview` - Features, description, gradients, image
  - `categoryPages.photography.[category].packages` - Pricing tiers with features and popular flags
  - `categoryPages.photography.[category].recentWork` - Gallery images with title and description
  - `categoryPages.photography.[category].seoContent` - Structured content sections for SEO
  - `categoryPages.photography.[category].seo` - Meta tags, title, description, keywords
- **API Methods**: PATCH `/api/site-config/bulk`
- **Categories**: weddings, corporate, portraits, events, products, graduation
- **Sections with Colors**: Service Overview, Packages, Recent Work, SEO Content (all with GradientPicker)

## 🎯 ALL Target Pages → Admin Component Mapping

### **Homepage** (`/pages/home.tsx`)
**URL**: `/`
**Admin Manager**: `HomepageSettings` + `ContactSettings`

**Section Components**:

1. **Enhanced Hero Slider** (`/components/sections/enhanced-hero-slider.tsx`)
   - **Config Path**: `config.home.hero.slides[]`
   - **GradientBackground Section**: `hero`
   - **Admin Component**: HomepageSettings → Hero Slides tab
   - **Content**: Image, title, subtitle, CTA button text, gradients

2. **Services Overview** (`/components/sections/services-overview.tsx`)
   - **Config Path**: `config.home.servicesOverview`
   - **GradientBackground Section**: `services`
   - **Admin Component**: HomepageSettings → Services tab
   - **Content**: Headline, description, service cards with icons and descriptions

3. **Portfolio Showcase** (`/components/sections/portfolio-showcase.tsx`)
   - **Config Path**: `config.portfolio.featured`
   - **GradientBackground Section**: `portfolio`
   - **Admin Component**: PortfolioSettings / FrontPageSettings (legacy)
   - **Content**: Featured work grid, layout controls, border settings

4. **Testimonials** (`/components/sections/testimonials.tsx`)
   - **Config Path**: `config.home.testimonials.items[]`
   - **GradientBackground Section**: `testimonials`
   - **Admin Component**: HomepageSettings → Testimonials tab
   - **Content**: Customer reviews, ratings, names, photos

5. **Client Gallery Access** (`/components/sections/client-gallery-access.tsx`)
   - **Config Path**: `config.home.privateGallery`
   - **GradientBackground Section**: `privateGallery`
   - **Admin Component**: HomepageSettings → Private Gallery tab
   - **Content**: Access instructions, features, CTA buttons

6. **Contact Section** (`/components/sections/contact-section.tsx`)
   - **Config Path**: `config.contact.business.*`
   - **GradientBackground Section**: `contact`
   - **Admin Component**: ContactSettings
   - **Content**: Contact form, business info, methods, reCAPTCHA integration

### **About Page** (`/pages/about.tsx`)
**URL**: `/about`
**Admin Manager**: `AboutSettings`

**Section Breakdown**:
1. **Hero Section** - Statistics and company overview
2. **Story Section** - Company history and narrative
3. **Values Section** - Core principles with icons
4. **Team Section** - Team member profiles with photos
5. **CTA Section** - Call-to-action with background image

**Config Paths**: `config.about.hero.*`, `config.about.story.*`, `config.about.values.*`, `config.about.team.*`, `config.about.cta.*`
**GradientBackground Sections**: `aboutStory`, `aboutValues`, `aboutTeam`, `aboutLocation`, `aboutCta`

### **Contact Page** (`/pages/contact.tsx`)
**URL**: `/contact`
**Admin Manager**: `ContactSettings`

**Content Sections**:
- Business information (name, tagline, phone, email, address)
- Contact methods grid (phone, email, WhatsApp, location)
- Business hours display
- Response time expectations
- Service areas (primary, extended, destination)
- Emergency contact information

**Config Path**: `config.contact.*`
**API Integration**: Uses `useSiteConfig()` + form submission to `/api/contact`

### **Photography Category Pages** 📸
**Template**: `/pages/photography-category.tsx` (dynamic template)
**Individual Pages**: `/pages/photography-{category}.tsx`
**Admin Manager**: `CategoryPageSettings` (type: 'photography')

**Dynamic URLs**:
- `/photography/weddings`
- `/photography/corporate`
- `/photography/portraits`
- `/photography/events`
- `/photography/products`
- `/photography/graduation`

**Section Structure** (consistent across all categories):
1. **Hero Section** - Category-specific title, subtitle, hero image, CTA
2. **Service Overview** - Features list, description, service image, gradients
3. **Packages Section** - Pricing tiers, features, popular package highlighting
4. **Recent Work Gallery** - Category-specific portfolio images
5. **SEO Content** - Structured content sections for search optimization

**Config Path**: `config.categoryPages.photography.[category].*`
**Fallback Source**: `defaultCategoryPageConfig` from `/shared/types/category-config.ts`
**GradientBackground Integration**: Category-specific section mappings

### **Videography Category Pages** 📹
**Template**: `/pages/videography-category.tsx`
**Admin Manager**: `CategoryPageSettings` (type: 'videography')
**Config Path**: `config.categoryPages.videography.[category].*`
**Note**: Same structure as photography categories but for videography services

## 🔄 Complete Data Flow Architecture

### **Configuration Hierarchy** (Priority Order)
1. **Saved Settings**: `/server/data/site-config-overrides.json` (highest priority)
2. **Default Fallbacks**: TypeScript constants in component files
3. **Category Defaults**: `/shared/types/category-config.ts` for category pages
4. **Hardcoded Content**: Last resort for undefined sections

### **API Endpoints and Methods**

#### **Configuration Management**
- **GET `/api/site-config`** - Returns complete merged configuration (overrides + defaults)
- **PATCH `/api/site-config/bulk`** ⚠️ **REQUIRED METHOD** - Updates configuration overrides
- **GET `/api/site-config/overrides`** - Returns only custom overrides (debugging)

#### **Content Management**
- **POST `/api/upload`** - Image uploads for admin interface
- **POST `/api/contact`** - Contact form submission with reCAPTCHA validation

### **Frontend Data Access Pattern**
All target pages use the `useSiteConfig()` hook:
```typescript
const { config, updateConfigBulk } = useSiteConfig();
// config contains complete merged configuration
// updateConfigBulk sends PATCH requests to /api/site-config/bulk
```

### **GradientBackground Section System**
The `GradientBackground` component manages dynamic colors for these sections:

| Section Name | Used By | Config Location |
|--------------|---------|-----------------|
| `hero` | Enhanced Hero Slider | `config.gradients.hero` |
| `services` | Services Overview | `config.gradients.services` |
| `testimonials` | Testimonials | `config.gradients.testimonials` |
| `portfolio` | Portfolio Showcase | `config.gradients.portfolio` |
| `contact` | Contact Section | `config.gradients.contact` |
| `privateGallery` | Client Gallery Access | `config.gradients.privateGallery` |
| `aboutStory` | About Story Section | `config.gradients.aboutStory` |
| `aboutValues` | About Values Section | `config.gradients.aboutValues` |
| `aboutTeam` | About Team Section | `config.gradients.aboutTeam` |
| `aboutLocation` | About Location Section | `config.gradients.aboutLocation` |
| `aboutCta` | About CTA Section | `config.gradients.aboutCta` |

### **CSS Variable System**
Each section gets CSS variables applied automatically:
```css
[data-gradient-section="services"] h1, 
[data-gradient-section="services"] h2 {
  color: var(--services-text-primary, #ffffff) !important;
}
```

## 📋 Static Content (No Admin Management)

These pages/components do NOT use configuration and remain static:
- `/pages/pricing.tsx` - Static pricing content
- `/components/layout/footer.tsx` - Static footer content  
- `/components/layout/navigation.tsx` - Static navigation structure
- `/pages/photography.tsx` - Static photography overview page
- `/pages/videography.tsx` - Static videography overview page

## 🚨 Critical Implementation Rules

### **API Method Requirements**
- ✅ **ALWAYS use PATCH method** for `/api/site-config/bulk`
- ❌ **NEVER use POST method** (will cause 405 Method Not Allowed)

### **Configuration File Updates**
- **Primary storage**: `/server/data/site-config-overrides.json`
- **Atomic writes**: Temporary file → atomic rename (prevents corruption)
- **Docker persistence**: Volume mounting ensures survival across deployments
- **Backup strategy**: Automatic backups during deployments

### **Fallback Behavior**
- Missing configuration → TypeScript defaults
- Category pages → `/shared/types/category-config.ts` defaults
- Empty arrays/objects → Component-level fallbacks

### **⚠️ Configuration Data Merging Behavior**

**CRITICAL DEBUGGING PRINCIPLE**: The API endpoint `/api/site-config` performs a `deepMerge(defaultConfig, configOverrides)` operation that can create unexpected data combinations when debugging configuration issues.

**The Problem**:
```javascript
// site-config-api.ts line 1220
const mergedConfig = deepMerge(defaultConfig, configOverrides);
```

**What This Means**:
- **Default config** provides baseline data (e.g., 3 testimonials hardcoded in API)
- **Config overrides** adds additional data (e.g., 4 testimonials saved via admin panel)
- **Merge result** combines both sources (e.g., 7 testimonials total in frontend)

**Debugging Confusion**:
- ❌ **Config files show**: Only saved/override data (partial picture)
- ❌ **TypeScript defaults show**: Only baseline data (partial picture)
- ✅ **API response shows**: Complete merged data (actual runtime data)

**Investigation Method**:
1. **Check API response first**: `curl http://localhost:3000/api/site-config`
2. **Then check individual sources**: config files vs. TypeScript defaults
3. **Understand the merge logic**: Arrays concatenate, objects merge deeply

**Common Scenarios**:
- **Arrays**: Default items + override items = combined array
- **Objects**: Default properties + override properties = merged object
- **Replacements**: Override completely replaces default (depends on merge strategy)

**When Data Sources Don't Match Runtime**:
- Frontend displays X items but config file shows Y items
- Component works with merged data, not individual file data
- Admin panel saves incremental changes, not complete replacements

This behavior is architectural - not a bug - but creates debugging confusion when the data source isn't immediately obvious.

This reference provides complete visibility into the entire site configuration system, enabling efficient development, deployment, and troubleshooting.