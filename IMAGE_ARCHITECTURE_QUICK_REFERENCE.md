# Image Handling System - Quick Reference Guide

## Critical Files

| File | Purpose | Key Functions |
|------|---------|----------------|
| `/client/src/lib/image-utils.ts` | URL optimization | `ImageUrl.forViewing()`, `ImageUrl.forModal()`, `getOptimizedImageUrl()` |
| `/server/routes.ts` | Upload endpoints | `/api/images/upload`, `/api/images/check-conflicts` |
| `/server/supabase-storage.ts` | Database operations | `deleteImage()`, `updateImage()`, `batchUpdateImageSequences()` |
| `/client/src/components/admin/enhanced-gallery-editor.tsx` | Admin editor | `handleReplaceImage()`, `handleUploadImages()` |
| `/client/src/components/admin/conflict-resolution-dialog.tsx` | Conflict UI | Conflict resolution dialog with side-by-side comparison |
| `/client/src/components/gallery/gallery-renderer.tsx` | Gallery display | All 8 layout modes, responsive rendering |

## Storage Path Quick Facts

**Bucket**: `gallery-images`
**Path Pattern**: `shoots/{shootId}/{timestamp}_{randomId}.{ext}`
**URL Format**: `https://{supabase}/storage/v1/object/public/gallery-images/shoots/{shootId}/{file}`

## Image URL Methods

```typescript
// ✅ USE THESE EVERYWHERE IMAGES DISPLAY
ImageUrl.forViewing(storagePath)    // Standard viewing (2400px, quality 80)
ImageUrl.forModal(storagePath)      // Modal viewing (2400px, quality 80)
ImageUrl.forFullSize(storagePath)   // Full resolution (original)
ImageUrl.forDownload(storagePath)   // Download link (original)
```

## Upload Flow (5 Steps)

```
1. SELECT FILES → 2. CHECK CONFLICTS → 3. RESOLVE CONFLICTS → 4. UPLOAD → 5. DISPLAY
```

### Step 1: File Selection
- Drag-and-drop or file picker in `AddImagesSection`
- Up to 50 files per batch, 10MB each

### Step 2: Conflict Detection
```
POST /api/images/check-conflicts
{ shootId, filenames: string[] }
↓
Returns: { conflicts: [], safe: [] }
```

### Step 3: Conflict Resolution
- Dialog shows: existing image (size, date, position)
- User chooses per file: Replace (keep position), Replace (new), Skip, Add New
- Options: `keepPosition: boolean`, `targetImageId: string`

### Step 4: Upload
```
POST /api/images/upload
{ files, shootId, resolutions[] }
↓
Server: Upload → Update DB → Delete old → Return summary
```

### Step 5: Display
```
Query: SELECT * FROM images WHERE shootId = ? ORDER BY sequence
↓
Transform: storagePath → ImageUrl.forViewing() → Supabase render API
↓
Render: Apply layout mode (8 options) → Display
```

## In-Situ Replacement (One-Click)

**Trigger**: RefreshCw button on image card hover
**Process**:
1. Click refresh button on image
2. Select new image from file picker
3. Automatic replacement resolution created
4. Upload with `keepPosition: true`
5. Spinner overlay shown during upload
6. Toast notification on completion

**Code Location**: `enhanced-gallery-editor.tsx:752-824`

## Gallery Layout Modes (8 Total)

| Mode | CSS Class | Use Case |
|------|-----------|----------|
| Automatic | Detect | For mixed aspect ratios |
| Square | `aspect-square` | Uniform 1:1 grids |
| Portrait | `aspect-[2/3]` | Vertical photography |
| Landscape | `aspect-[3/2]` | Horizontal photography |
| Instagram | `aspect-[4/5]` | Social media format |
| Upright | `aspect-[9/16]` | Vertical video |
| Wide | `aspect-[16/9]` | Cinematic |
| Masonry | Pinterest-style | Natural aspect ratios |

## Key Database Fields

**Images Table**:
- `id`: UUID (primary)
- `shootId`: UUID (foreign)
- `storagePath`: Full public URL
- `filename`: Original filename (conflict detection)
- `sequence`: Sort order (1-based)
- `classification`: Category for featured images
- `featuredImage`: Boolean for portfolio

**Shoots Table**:
- `layoutType`: Selected layout mode
- `backgroundColor`: Gallery background
- `borderRadius`: 0-40px
- `imagePadding`: 0-40px spacing
- `bannerImageId`: Cover image UUID

## All Component Display Points

### Admin Dashboard
- `gallery-image-card.tsx` - Grid thumbnail
- `enhanced-gallery-editor.tsx` - Preview + cover
- `gallery-preview.tsx` - Live preview
- `gallery-customization.tsx` - Appearance panel

### Public Galleries
- `client-gallery.tsx` - Main gallery (hero, grid, modal)
- `client-portfolio.tsx` - Multi-shoot portfolio
- `gallery-renderer.tsx` - Core rendering engine

### Homepage
- `portfolio-showcase.tsx` - Featured grid
- `category-featured-grid.tsx` - Category showcase

### Pages
- `gallery-demo.tsx` - Demo galleries
- `photography.tsx` - Category pages
- `videography.tsx` - Video categories

## API Endpoints Cheat Sheet

```bash
# Upload with conflict resolution
POST /api/images/upload
{ files, shootId, resolutions[] }

# Pre-flight conflict check
POST /api/images/check-conflicts
{ shootId, filenames[] }

# Delete image
DELETE /api/images/{id}

# Get all images
GET /api/images

# Get featured images for portfolio
GET /api/images/featured

# Get images for shoot
GET /api/shoots/{id}/images

# Update gallery appearance
PATCH /api/shoots/{id}
{ layoutType, backgroundColor, borderRadius, imagePadding, bannerImageId }
```

## Performance Facts

- **Image Size**: ~364KB optimized at 2400px
- **Batch Update**: <700ms for 64 images (was 9-64s)
- **Conflict Check**: Real-time filename matching
- **Lazy Load**: Images load on-demand in grids
- **Render API**: Server-side transformation (saves bandwidth)

## Troubleshooting Guide

| Issue | Cause | Fix |
|-------|-------|-----|
| Image not updating | React Query cache | `queryClient.invalidateQueries()` |
| Wrong URL used | Not using `ImageUrl.*` | Switch to `ImageUrl.forViewing()` |
| Position lost | keepPosition=false | Set `keepPosition: true` in resolution |
| Old file remains | Delete failed silently | Check Supabase storage bucket |
| Layout broken | Wrong aspect ratio mode | Select "Automatic" to auto-detect |

## Component Props Reference

### EnhancedGalleryEditor
```typescript
interface EnhancedGalleryEditorProps {
  shootId: string;
}
```

### GalleryImageCard
```typescript
interface GalleryImageCardProps {
  image: { id, filename, storagePath };
  selectedCover: string | null;
  onReplace: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onMakeCover: (imageId: string) => void;
  // ... other callbacks
}
```

### GalleryRenderer
```typescript
interface GalleryRendererProps {
  shoot: Shoot;
  images: Image[];
  className?: string;
}
```

## Directory Structure

```
client/src/
├── lib/image-utils.ts              ← Core optimization
├── components/
│   ├── admin/
│   │   ├── enhanced-gallery-editor.tsx    ← Main editor
│   │   ├── gallery-image-card.tsx         ← Card component
│   │   ├── gallery-sections.tsx           ← Form sections
│   │   ├── conflict-resolution-dialog.tsx ← Conflict UI
│   │   └── gallery-management-tabs.tsx
│   ├── gallery/
│   │   ├── gallery-renderer.tsx     ← Core renderer
│   │   ├── gallery-preview.tsx      ← Preview component
│   │   ├── gallery-customization.tsx
│   │   └── gallery-settings-card.tsx
│   └── sections/
│       ├── portfolio-showcase.tsx   ← Featured grid
│       └── category-featured-grid.tsx ← Category showcase
└── pages/
    ├── client-gallery.tsx           ← Client gallery page
    ├── client-portfolio.tsx         ← Portfolio page
    ├── gallery-demo.tsx             ← Demo page
    └── [category pages]

server/
├── routes.ts                    ← All endpoints
├── supabase-storage.ts          ← Database ops
└── storage.ts                   ← Storage interface
```

## Sequence Number System (Critical!)

The `sequence` field controls display order, NOT creation order:
```
sequence = 1  → First image
sequence = 2  → Second image
...
sequence = n  → Last image
```

**Replacement keeps sequence**: When replacing with `keepPosition: true`, the new image gets the old image's sequence number.

**Batch update**: Uses CASE statement for ultra-fast updates:
```sql
UPDATE images
SET sequence = CASE
  WHEN id = '123' THEN 1
  WHEN id = '456' THEN 2
  ...
END
WHERE id = ANY(ARRAY['123', '456', ...])
```

## Featured Image Classification

Images can be tagged with classifications for categorization:
```
classification = 'wedding' | 'portrait' | 'product' | 'corporate' | 'event' | 'graduation'
```

These are used by:
- Portfolio showcase (featured images grid)
- Category featured grids (filtered by category)
- Homepage gallery sections

## Quick Start: Adding Image to Component

```typescript
// 1. Import the utility
import { ImageUrl } from '@/lib/image-utils';

// 2. Use in JSX
<img src={ImageUrl.forViewing(image.storagePath)} alt={image.filename} />

// 3. For modal
<img src={ImageUrl.forModal(image.storagePath)} alt={image.filename} />

// 4. For full resolution
<a href={ImageUrl.forDownload(image.storagePath)} download>
  Download Full Resolution
</a>
```

---

**Last Updated**: November 2024
**Tested With**: Supabase Storage, PostgreSQL, React Query, Drizzle ORM
**Browser Support**: All modern browsers (Chrome, Safari, Firefox, Edge)
