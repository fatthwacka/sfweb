# Video Gallery System

This document covers the video gallery architecture, including native video uploads and YouTube video integration.

## Overview

The gallery system supports two types of video content:
- **Native Videos**: Uploaded directly to Supabase Storage with 3-tier processing
- **YouTube Videos**: Embedded via iframe, stored as references in the database

## Database Schema

### Videos Table Fields

```sql
-- Core fields (all videos)
id: uuid PRIMARY KEY
shoot_id: uuid REFERENCES shoots(id)
filename: text NOT NULL
storage_path: text NOT NULL        -- Empty string for YouTube videos
thumbnail_path: text NOT NULL      -- Supabase URL or YouTube thumbnail URL
file_size: integer NOT NULL        -- 0 for YouTube videos
sequence: integer DEFAULT 0
duration: integer                  -- Seconds (null for YouTube)
width: integer
height: integer
download_count: integer DEFAULT 0
featured_video: boolean DEFAULT false

-- YouTube integration fields
source_type: text DEFAULT 'native' -- 'native' | 'youtube'
external_id: text                  -- YouTube video ID (e.g., 'dQw4w9WgXcQ')
external_url: text                 -- Full YouTube URL for reference
```

## Native Video Processing (3-Tier System)

Native videos are processed into three versions:

| Tier | Purpose | Specs |
|------|---------|-------|
| `storagePath` | Original upload, downloads | Full resolution |
| `optimizedPath` | Web streaming | 1080p, optimised bitrate |
| `thumbnailPath` | Grid display, loading states | 1200px JPEG |

Processing is handled by `server/video-processing.ts` using FFmpeg.

## YouTube Video Integration

### Adding YouTube Videos

**Admin UI**: Gallery Management → Upload tab → "Add YouTube Video" section

**API Endpoints**:
```
GET  /api/youtube/oembed         - Fetch video metadata (no API key needed)
POST /api/youtube/add-to-gallery - Add YouTube video to a gallery
PATCH /api/youtube/:id/thumbnail - Update custom thumbnail
```

### URL Parsing

Supported YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- Raw video ID (11 characters)

### Thumbnail Handling

YouTube videos can use:
1. **Auto-generated**: `https://img.youtube.com/vi/{videoId}/maxresdefault.jpg`
2. **Custom upload**: Admin can upload a custom thumbnail

The `VideoUrl.forThumbnail()` utility automatically handles both cases.

## Video URL Utilities

**File**: `client/src/lib/video-utils.ts`

### Key Functions

```typescript
// Check video source type
VideoUrl.isYouTube(video): boolean

// Get appropriate URLs based on source type
VideoUrl.forThumbnail(video): string   // Native path or YouTube thumbnail
VideoUrl.forStreaming(video): string   // Native optimized or YouTube embed URL
VideoUrl.forDownload(video): string | null  // Native path or null (YouTube)
VideoUrl.forFullSize(video): string    // Native original or YouTube watch URL

// YouTube-specific
VideoUrl.getYouTubeUrl(video): string | null  // Direct YouTube link
VideoUrl.supportsDownload(video): boolean     // false for YouTube
```

### Parsing Utilities

```typescript
parseYouTubeUrl(url: string): string | null      // Extract video ID
getYouTubeThumbnailUrl(videoId, quality): string // Thumbnail URL
getYouTubeEmbedUrl(videoId, options): string     // Embed URL with params
getYouTubeWatchUrl(videoId): string              // Direct watch URL
```

## Gallery Display

### Grid Thumbnails

Both native and YouTube videos display as thumbnail images in the gallery grid:
- Native: Uses `thumbnailPath` from Supabase Storage
- YouTube: Uses YouTube's auto-thumbnail or custom uploaded thumbnail
- YouTube videos show a red YouTube badge in the corner

### Modal Playback

```tsx
// Native videos
<video src={VideoUrl.forStreaming(video)} controls />

// YouTube videos
<iframe
  src={VideoUrl.forStreaming(video)}
  allow="fullscreen"
  allowFullScreen
/>
```

### Cover Display

For gallery hero/cover sections:
- **Native videos**: Autoplay muted with loop
- **YouTube videos**: Static thumbnail image (no autoplay iframe)

Portfolio cards only show video-on-hover for native videos.

## Download Behaviour

| Source | Download Button | Action |
|--------|-----------------|--------|
| Native | Enabled | Downloads original file |
| YouTube | "Open in YouTube" | Opens YouTube in new tab |

## Cover Priority Logic

When determining gallery cover:
1. Always prefer explicit cover image (`coverImageUrl`)
2. For video covers, prefer native videos over YouTube
3. YouTube video thumbnails used as fallback only

## Related Files

- `shared/schema.ts` - Database schema with YouTube fields
- `client/src/lib/video-utils.ts` - URL utilities
- `server/routes/youtube.ts` - YouTube API endpoints
- `client/src/pages/client-gallery.tsx` - Gallery display
- `client/src/components/admin/gallery-sections.tsx` - Upload UI
- `client/src/components/portfolio/unified-card.tsx` - Portfolio cards
- `migrations/024_add_youtube_video_support.sql` - Migration

## Migration

To add YouTube support to an existing database:

```sql
-- Run in Supabase SQL Editor
-- See: migrations/024_add_youtube_video_support.sql

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'native';

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS external_id TEXT;

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS external_url TEXT;

CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);
```
