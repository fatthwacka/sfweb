# Portfolio Grouping Implementation - Handoff Document
## Date: November 22, 2025

## 🎯 OBJECTIVE
Implement portfolio grouping functionality where multiple galleries can be bundled under a group name, displayed as a single card on portfolio pages.

## ✅ WHAT'S WORKING
1. **Database & API**:
   - `groupName` field exists in shoots table
   - API correctly returns grouped bundles at `/api/portfolio/groups/:groupName`
   - API correctly returns both grouped and ungrouped items at `/api/galleries/public`
   - Admin panel successfully saves groupName to database

2. **Admin Interface**:
   - Can assign galleries to groups
   - Saves to database correctly
   - NOW LOADS saved groupName on page refresh (was broken, now fixed)

3. **Data Flow**:
   - Client portfolios correctly filter to show both grouped AND ungrouped albums
   - Group pages (`/project/:groupName`) load data correctly
   - Client pages (`/portfolio/:clientSlug`) load data correctly

## ❌ PERSISTENT ISSUES (NOT FIXED DESPITE MULTIPLE ATTEMPTS)

### 1. **Card Grid Left Alignment**
**Problem**: Cards are left-aligned instead of center-aligned on both `/portfolio/:clientSlug` and `/project/:groupName` pages

**What We've Tried**:
- `justify-center` on grid (doesn't work with CSS Grid)
- `justify-items-center` (centers items within cells, not the grid)
- `place-items-center` (same issue)
- `max-w-6xl mx-auto` wrapper (should work but isn't)
- Various flex wrapper approaches

**Current Code Structure**:
```jsx
// In PortfolioGrid component
<div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
    {items.map(item => <PortfolioCard />)}
  </div>
</div>
```

**What SHOULD Work**: The `max-w-6xl mx-auto` pattern works everywhere else in the site (see `/client/src/components/sections/portfolio-showcase.tsx` line 311-316)

### 2. **Card Design Not Matching Site Standard**
**Problem**: Cards look different from the site-wide standard used elsewhere

**Current Card Structure** (in `/client/src/components/portfolio/portfolio-card.tsx`):
- Has gradient overlay at bottom (lines 135-145)
- Has Photo/Video badge in top-right (lines 126-129)
- Has hover effects with scale transform

**Reference Images Provided**:
- User showed screenshots of desired card appearance
- Cards should have consistent styling with rest of site
- User states "we've used that card as our site wide standard, it's used all over"

## 📂 KEY FILES

### Components:
- `/client/src/components/portfolio/portfolio-grid.tsx` - Grid container
- `/client/src/components/portfolio/portfolio-card.tsx` - Card component
- `/client/src/pages/portfolio-group.tsx` - Handles both `/project/:groupName` and `/portfolio/:clientSlug` routes

### For Reference (Working Examples):
- `/client/src/components/sections/portfolio-showcase.tsx` - Has working centered grid (line 311-316)
- `/client/src/pages/portfolio.tsx` - Main portfolio page that calls PortfolioGrid

### API Routes:
- `/api/portfolio/groups` - Lists all group names
- `/api/portfolio/groups/:groupName` - Gets specific group with its shoots
- `/api/galleries/public` - Gets all public galleries (grouped and ungrouped)
- `/api/clients/:slug` - Gets client with their shoots

## 🔍 DEBUGGING OBSERVATIONS

1. **Double Container Issue**: Found and removed nested `max-w-6xl mx-auto` containers, but didn't fix the alignment

2. **CSS Conflicts**: Possibly conflicting CSS from elsewhere overriding the centering

3. **Grid Behavior**: CSS Grid with `grid-cols-2 md:grid-cols-3` should respect the max-width container, but seems not to

## 💡 SUGGESTIONS FOR FRESH APPROACH

1. **Check Computed Styles**: Use browser dev tools to see what's actually being applied to the grid container

2. **Compare Working vs Broken**: 
   - Open `/portfolio` (main page) and `/portfolio/pocas` (client page) side by side
   - Check what's different in the DOM/CSS

3. **Simplify First**: 
   - Try removing all styling and adding back piece by piece
   - Start with just `mx-auto` on a fixed-width div to ensure centering works

4. **Check Parent Containers**: 
   - The issue might be in parent containers constraining or affecting the grid
   - Check the `<div className="w-full px-4 sm:px-6 lg:px-8">` wrapper

5. **Copy Exact Working Pattern**:
   - Find a working centered grid elsewhere in the codebase
   - Copy it EXACTLY, including all parent wrappers
   - Then modify to fit the portfolio needs

## 🔨 NUCLEAR OPTIONS

1. **Revert Everything**: 
   ```bash
   git diff HEAD -- client/src/components/portfolio/
   git checkout HEAD -- client/src/components/portfolio/
   ```
   Then rebuild from scratch using EXACTLY the patterns from working components

2. **Use Flexbox Instead**: 
   Replace grid with flexbox which has simpler centering:
   ```jsx
   <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
   ```

3. **Hard-code Testing**: 
   Temporarily hard-code specific widths and margins to diagnose where the issue is

## 📝 FINAL NOTES

- User is frustrated with the loop of attempts that don't work
- The card design apparently already exists somewhere in the codebase as the "site-wide standard"
- The centering pattern (`max-w-6xl mx-auto`) works elsewhere but not here
- Multiple attempts with different CSS approaches have all failed

## RECOMMENDATION
Start fresh by:
1. Finding an existing working portfolio/gallery grid in the codebase
2. Copying it exactly 
3. Modifying only the data source to use the new grouped data
4. Test thoroughly before making any styling changes