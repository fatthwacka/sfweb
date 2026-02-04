/**
 * YouTube API Routes
 * Handles YouTube video metadata fetching and video management
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Supabase admin client for database operations
const getSupabaseAdmin = () => {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
};

/**
 * Parse YouTube URL to extract video ID
 * Supports various YouTube URL formats
 */
function parseYouTubeUrl(url: string): string | null {
  if (!url) return null;

  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Old embed URL: youtube.com/v/VIDEO_ID
  const oldEmbedMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (oldEmbedMatch) return oldEmbedMatch[1];

  // Shorts URL: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Raw video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * GET /api/youtube/oembed
 * Fetch YouTube video metadata using oEmbed API (no API key needed)
 */
router.get('/oembed', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = parseYouTubeUrl(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }

    // Fetch oEmbed data from YouTube (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Video not found or is private' });
      }
      throw new Error(`YouTube oEmbed API error: ${response.status}`);
    }

    const oembedData = await response.json();

    // Generate thumbnail URLs (YouTube provides multiple quality options)
    const thumbnails = {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,        // 120x90
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,       // 320x180
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,         // 480x360
      standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,     // 640x480
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,   // 1280x720
    };

    // Return structured video metadata
    res.json({
      videoId,
      title: oembedData.title,
      authorName: oembedData.author_name,
      authorUrl: oembedData.author_url,
      thumbnailUrl: oembedData.thumbnail_url,
      thumbnails,
      width: oembedData.width,
      height: oembedData.height,
      // oEmbed doesn't provide duration, but we include the field for consistency
      duration: null,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      watchUrl: `https://youtu.be/${videoId}`,
    });

  } catch (error) {
    console.error('YouTube oEmbed error:', error);
    res.status(500).json({ error: 'Failed to fetch video metadata' });
  }
});

/**
 * POST /api/youtube/add-to-gallery
 * Add a YouTube video to a gallery (shoot)
 */
router.post('/add-to-gallery', async (req, res) => {
  try {
    const { shootId, youtubeUrl, customThumbnail, sequence } = req.body;

    if (!shootId || !youtubeUrl) {
      return res.status(400).json({ error: 'shootId and youtubeUrl are required' });
    }

    const videoId = parseYouTubeUrl(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }

    // Fetch video metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Video not found or is private' });
      }
      throw new Error(`YouTube oEmbed API error: ${response.status}`);
    }

    const oembedData = await response.json();

    // Determine thumbnail URL
    const thumbnailPath = customThumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Get current max sequence for the shoot if not provided
    const supabase = getSupabaseAdmin();
    let videoSequence = sequence;

    if (videoSequence === undefined) {
      const { data: existingVideos } = await supabase
        .from('videos')
        .select('sequence')
        .eq('shoot_id', shootId)
        .order('sequence', { ascending: false })
        .limit(1);

      videoSequence = existingVideos && existingVideos.length > 0
        ? existingVideos[0].sequence + 1
        : 0;
    }

    // Insert YouTube video record
    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        shoot_id: shootId,
        filename: oembedData.title || `YouTube Video ${videoId}`,
        storage_path: '', // Empty for YouTube videos
        thumbnail_path: thumbnailPath,
        file_size: 0, // YouTube videos have no local file size
        sequence: videoSequence,
        width: oembedData.width || 1920,
        height: oembedData.height || 1080,
        source_type: 'youtube',
        external_id: videoId,
        external_url: youtubeUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting YouTube video:', error);
      return res.status(500).json({ error: 'Failed to add video to gallery' });
    }

    res.json({
      success: true,
      video: {
        id: video.id,
        filename: video.filename,
        thumbnailPath: video.thumbnail_path,
        sourceType: video.source_type,
        externalId: video.external_id,
        externalUrl: video.external_url,
        sequence: video.sequence,
      },
    });

  } catch (error) {
    console.error('Add YouTube video error:', error);
    res.status(500).json({ error: 'Failed to add YouTube video to gallery' });
  }
});

/**
 * PATCH /api/youtube/:videoId/thumbnail
 * Update custom thumbnail for a YouTube video
 */
router.patch('/:videoId/thumbnail', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { thumbnailUrl } = req.body;

    if (!thumbnailUrl) {
      return res.status(400).json({ error: 'thumbnailUrl is required' });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('videos')
      .update({ thumbnail_path: thumbnailUrl })
      .eq('id', videoId)
      .eq('source_type', 'youtube')
      .select()
      .single();

    if (error) {
      console.error('Error updating thumbnail:', error);
      return res.status(500).json({ error: 'Failed to update thumbnail' });
    }

    if (!data) {
      return res.status(404).json({ error: 'YouTube video not found' });
    }

    res.json({ success: true, video: data });

  } catch (error) {
    console.error('Update thumbnail error:', error);
    res.status(500).json({ error: 'Failed to update thumbnail' });
  }
});

export default router;
