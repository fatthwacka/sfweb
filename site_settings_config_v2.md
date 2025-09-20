# Site Settings Configuration V2 - Migration Pattern

**PROVEN PATTERN**: Wedding Photography Page Successfully Migrated (Sep 2025)

## Overview

This document outlines the systematic approach to migrate from the old category-specific gradient system to the new unified Supabase gradient system. Each page/section requires specific mapping between target page, Supabase records, admin dashboard, and CSS variables.

## Migration Pattern (6-Step Process)

### Step 1: Update Target Page Components
```tsx
// Update GradientBackground section props to match new naming convention
<GradientBackground
  section="photography-wedding-services"  // Changed from "services"
  className="py-20"
  categoryType="photography"
  categoryName="weddings"
  categorySectionName="serviceOverview"
>
```

### Step 2: Add CSS Variable Rules
```css
/* Add specific section CSS rules for text color mapping */
[data-gradient-section="photography-wedding-services"] h1,
[data-gradient-section="photography-wedding-services"] h2 {
  color: var(--photography-wedding-services-text-primary, #ffffff) !important;
}

[data-gradient-section="photography-wedding-services"] p,
[data-gradient-section="photography-wedding-services"] h3 {
  color: var(--photography-wedding-services-text-secondary, #e2e8f0) !important;
}

[data-gradient-section="photography-wedding-services"] .text-muted-foreground {
  color: var(--photography-wedding-services-text-tertiary, #94a3b8) !important;
}
```

### Step 3: Extract Live Site Colors
```javascript
// Extract actual live site gradients from category config
// Path: server/data/site-config-overrides.json
config?.categoryPages?.[type]?.[category]?.[section]?.gradients

// Example paths:
// config.categoryPages.photography.weddings.serviceOverview.gradients
// config.categoryPages.photography.weddings.packages.gradients
// config.categoryPages.photography.weddings.recentWork.gradients
// config.categoryPages.photography.weddings.seoContent.gradients
```

### Step 4: Create Supabase Records
```bash
# Use PUT method to create/update gradient records
curl -X PUT http://localhost:3000/api/gradients/photography-wedding-services \
  -H "Content-Type: application/json" \
  -d '{
    "gradientConfig": {
      "startColor": "#305a3d",
      "middleColor": "#285a41",
      "endColor": "#33564a",
      "direction": "135deg",
      "textColors": {
        "primary": "#ffffff",
        "secondary": "#e2e8f0",
        "tertiary": "#94a3b8"
      }
    }
  }'
```

### Step 5: Verify Data Flow
```javascript
// Test complete data flow works:
// 1. Admin Dashboard loads current colors from Supabase
// 2. Admin changes save to Supabase successfully
// 3. Target page reflects changes immediately
// 4. Text colors apply via CSS variables
```

### Step 6: Update Admin Dashboard Keys (if needed)
```tsx
// Admin dashboard keys should already work from wedding pattern
// But verify section keys in admin components match Supabase records

// CategoryPageSettings (Service Overview):
<GradientPicker
  sectionKey={`${type}-${category.replace('s', '')}-services`}
  // photography-weddings-overview → photography-wedding-services
/>

// CategoryPageSettings (Recent Work):
<GradientPicker
  sectionKey={`${type}-${category.replace('s', '')}-recent-work`}
  // photography-weddings-work → photography-wedding-recent-work
/>

// PricingPackagesEditor (Packages):
<GradientPicker
  sectionKey={`${pageType}-${category.replace('s', '')}-packages`}
  // pricing-photography_weddings → photography-wedding-packages
/>
```

## Data Flow Verification

**Complete Flow**: Admin Dashboard → Supabase → Target Page → CSS Variables

1. **Admin Dashboard**: Uses correct `sectionKey` matching Supabase record
2. **Supabase Record**: Stores gradient colors and text colors
3. **Target Page**: `GradientBackground` component fetches from Supabase
4. **CSS Variables**: Component sets `--{section}-text-{type}` variables
5. **CSS Rules**: Apply variables to specific `[data-gradient-section]` selectors

## Section Naming Conventions

### Target Page Sections
```
{pageType}-{category-singular}-{sectionName}
```

### Category Mapping
```javascript
// Plural to singular conversion
'weddings' → 'wedding'
'portraits' → 'portrait'
'corporate' → 'corporate' (no change)
'events' → 'event'
'products' → 'product'
'graduation' → 'graduation' (no change)
```

### Section Name Mapping
```javascript
// Admin tab → Section name mapping
'overview' → 'services'      // Service Overview tab
'packages' → 'packages'      // Packages tab
'work' → 'recent-work'       // Recent Work tab
'seo' → 'seo'               // SEO content (if exists)
```

## Complete Wedding Example

**Target Page Sections**:
- `photography-wedding-services`
- `photography-wedding-packages`
- `photography-wedding-recent-work`
- `photography-wedding-seo`

**Admin Dashboard Keys**:
- Service Overview: `photography-wedding-services`
- Packages: `photography-wedding-packages`
- Recent Work: `photography-wedding-recent-work`

**CSS Variable Names**:
- `--photography-wedding-services-text-primary`
- `--photography-wedding-packages-text-secondary`
- `--photography-wedding-recent-work-text-tertiary`

## Migration Checklist

### Per Page/Section:
- [ ] **Step 1**: Update target page `GradientBackground` section props to new naming
- [ ] **Step 2**: Add CSS rules for new section selectors (12 rules per category: 4 sections × 3 text colors)
- [ ] **Step 3**: Extract live site gradient colors from category config (`server/data/site-config-overrides.json`)
- [ ] **Step 4**: Create Supabase records with extracted colors (4 PUT requests per category)
- [ ] **Step 5**: Verify complete data flow works: Admin → Supabase → Page → CSS
- [ ] **Step 6**: Update admin dashboard `sectionKey` props (if not already correct from wedding pattern)

### Validation Tests:
- [ ] Admin dashboard displays current live colors
- [ ] Admin changes save to Supabase successfully
- [ ] Target page reflects admin changes immediately
- [ ] Text colors apply correctly via CSS variables

## Pages Requiring Migration

### Photography Categories
- `/photography/weddings` ✅ **COMPLETED**
- `/photography/portraits`
- `/photography/corporate`
- `/photography/events`
- `/photography/products`
- `/photography/graduation`

### Videography Categories
- `/videography/weddings`
- `/videography/corporate`
- `/videography/events`

### Landing Pages
- `/web-apps` (Tailwind-based sections)
- `/social-media` (Tailwind-based sections)

## Success Criteria

A successful migration results in:
1. ✅ Admin dashboard loads actual live site colors
2. ✅ Admin changes immediately reflect on target page
3. ✅ Text colors flow through CSS variable system
4. ✅ No console errors or missing gradient records
5. ✅ Consistent visual appearance before/after migration

---

**Next Target**: Apply this exact pattern to `/photography/portraits` page sections.