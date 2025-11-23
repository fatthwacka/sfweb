# Portfolio Grouping Architecture - Complete Analysis & Documentation

## 🎯 FEATURE OVERVIEW

The portfolio grouping system allows multiple related photo/video shoots to be bundled under a single group name, displaying as one card on the main portfolio page instead of individual scattered albums. This creates a clean, organized portfolio experience for clients with multiple brands, products, or related shoots.

**Business Use Case**: A client with 3 brands, each having multiple product shoots, can group them by brand name. Instead of showing 9 individual shoot cards cluttering the portfolio, it shows 3 branded group cards.

## 🗄️ DATABASE ARCHITECTURE

### Core Schema Changes
**Table**: `shoots` (schema.ts:46-67)
```sql
-- Key field added for grouping functionality
groupName: text("group_name"), // Line 64 - stores the bundle name like "POCAS Bubble Tea Party Kit"
```

**Data Flow**:
- Each shoot can have an optional `group_name` value
- Shoots with the same `group_name` are bundled together
- Shoots without `group_name` display as individual cards
- Admin interface allows assigning/editing group names

## 🔧 API ARCHITECTURE

### Core Endpoints

**1. `/api/galleries/public` (routes.ts:851-942)**
- **Purpose**: Main portfolio data source - returns both grouped and individual shoots
- **Logic**: Groups shoots by `groupName`, creates bundled cards for groups
- **Output**: Mixed array of individual shoots and group objects

**2. `/api/portfolio/groups/:groupName` (routes.ts:956-1019)**
- **Purpose**: Fetch all shoots within a specific group
- **Usage**: Powers the dynamic `/project/:groupName` pages
- **Logic**: Filters shoots by decoded group name, adds cover media

**3. `/api/portfolio/groups` (routes.ts:945-953)**
- **Purpose**: Get all existing group names for admin dropdowns
- **Usage**: Admin interface group selection

## 🎨 FRONTEND ARCHITECTURE

### Component Hierarchy
```
Portfolio System
├── pages/portfolio.tsx - Main portfolio landing page
├── pages/portfolio-group.tsx - Dynamic group/client pages (/project/:groupName)
├── components/portfolio/
│   ├── portfolio-grid.tsx - Grid container & data fetching
│   └── portfolio-card.tsx - Individual card rendering (groups + standalone)
└── App.tsx - Routing configuration
```

### URL Structure & Routing (App.tsx:107-119)
```javascript
// Main portfolio page - shows all groups and standalone shoots
/portfolio → Portfolio component

// Group detail pages - shows shoots within a group
/project/:groupName → PortfolioGroup component
// Example: /project/pocas-bubble-tea-kit

// Client portfolio pages - shows all shoots for a client
/portfolio/:clientSlug → PortfolioGroup component (dual-purpose)
// Example: /portfolio/pocas-client
```

### Data Flow Architecture

**1. Main Portfolio Page (`/portfolio`)**
```
portfolio-grid.tsx → fetch('/api/galleries/public') → portfolio-card.tsx
                                    ↓
    Returns mixed array: [groupCards, standaloneShootCards]
                                    ↓
    Each groupCard: { isGroup: true, groupName, shootCount, shoots[] }
    Each standaloneCard: { isGroup: false, normal shoot data }
```

**2. Group Detail Pages (`/project/:groupName`)**
```
portfolio-group.tsx → fetch('/api/portfolio/groups/:groupName') → portfolio-card.tsx
                                    ↓
    Returns group data: { groupName, shoots[], shootCount }
                                    ↓
    Renders shoots within the group as individual cards
```

## 🎭 CARD DESIGN ARCHITECTURE

### Two Card Types in portfolio-card.tsx

**1. Group Cards (lines 36-101)**
- **Trigger**: `shoot.isGroup === true`
- **URL**: `/project/${groupSlug}` (where groupSlug = groupName.toLowerCase().replace(/\s+/g, '-'))
- **Display**: 
  - Group name as title
  - Cover image from first shoot
  - "X galleries" count badge
  - Media type badge

**2. Individual Shoot Cards (lines 103-163)**
- **Trigger**: `shoot.isGroup !== true`
- **URL**: `/gallery/${shoot.customSlug || shoot.id}`
- **Display**:
  - Shoot title
  - Cover image/video thumbnail
  - Date and media type

### CSS Styling System (index.css:1607-1650)
```css
.portfolio-card {
  /* Base card container with hover effects */
  @apply relative overflow-hidden shadow-lg hover:shadow-2xl 
         transition-all duration-300 rounded-lg cursor-pointer;
}

.portfolio-card-image {
  @apply relative aspect-[3/2] bg-gray-800; /* Fixed 3:2 aspect ratio */
}

.portfolio-card-footer {
  @apply bg-slate-900 p-4; /* Dark footer with metadata */
}
```

## ✅ RESOLVED ISSUES (November 23, 2025)

### 1. **Grid Alignment** - FIXED
- Cards now properly center-aligned on all pages

### 2. **Unified Card System** - IMPLEMENTED
- Created single `unified-card.tsx` component used everywhere
- All cards now share consistent design and behavior
- Single source of truth for visual changes
- Located at: `/client/src/components/portfolio/unified-card.tsx`

### 3. **Date Display** - FIXED
- All cards now properly use `shoot.shootDate` 
- Fallback to "Portfolio Gallery" when date unavailable
- Consistent date formatting across all card types

## 🔗 KEY INTEGRATION POINTS

### Admin Interface Integration
- **Component**: `gallery-sections.tsx` 
- **API**: Uses `/api/portfolio/groups` for dropdown options
- **Function**: Allows staff to assign group names to shoots
- **Persistence**: Saves directly to `shoots.groupName` in database

### Client Portfolio Integration  
- **Dual-Purpose Page**: `portfolio-group.tsx` handles both:
  - Group pages: `/project/:groupName` 
  - Client pages: `/portfolio/:clientSlug`
- **Logic**: Tries group fetch first, falls back to client fetch
- **Filter**: Shows only shoots belonging to specific client/group

## 📋 IMPLEMENTATION CHECKLIST

### ✅ **Completed Features**
- [x] Database schema with `groupName` column
- [x] API endpoints for grouped data
- [x] Admin interface for group assignment  
- [x] Dual routing for groups and clients
- [x] Group card rendering with metadata
- [x] Data persistence and loading

### ❌ **Outstanding Issues**
- [ ] Fix grid alignment (use working portfolio-showcase pattern)
- [ ] Standardize card design across site
- [ ] Fix hardcoded date display
- [ ] Test edge cases (empty groups, special characters in names)
- [ ] Performance optimization for large group collections

## 🛠️ RECOMMENDED FIXES

### 1. **Fix Grid Alignment**
```javascript
// Copy exact pattern from portfolio-showcase.tsx:311-316
<div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-2 md:grid-cols-3" style={gridStyles}>
    {/* cards */}
  </div>
</div>
```

### 2. **Standardize Card Design**  
```javascript
// Use portfolio-showcase.tsx:338-382 as template
// Replace current portfolio-card.tsx footer structure
// Implement consistent hover effects and overlays
```

### 3. **Fix Date Display**
```javascript
// Replace hardcoded date with actual shoot date
shoot.shootDate ? 
  new Date(shoot.shootDate).toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  }) : 'Date not available'
```

## 📁 FILES SUMMARY

| File | Purpose | Key Functions |
|------|---------|--------------|
| `shared/schema.ts:64` | Database schema | `groupName` field definition |
| `server/routes.ts:851-1019` | API layer | Group bundling & data serving |
| `client/src/pages/portfolio.tsx` | Main portfolio | Entry point, calls PortfolioGrid |
| `client/src/pages/portfolio-group.tsx` | Dynamic pages | Handles `/project/:group` & `/portfolio/:client` |
| `client/src/components/portfolio/portfolio-grid.tsx` | Grid container | Data fetching & layout |
| `client/src/components/portfolio/portfolio-card.tsx` | Card wrapper | Simple pass-through to unified-card |
| `client/src/components/portfolio/unified-card.tsx` | **Unified Card Component** | Single source of truth for all card rendering |
| `client/src/index.css:1607-1650` | Styling | Card CSS classes |
| `PORTFOLIO_GROUPING_HANDOFF.md` | Documentation | Previous implementation attempts |

---

**Created**: November 23, 2025  
**Status**: Architecture Complete, Implementation Issues Identified  
**Next Steps**: Address grid alignment and card design consistency issues