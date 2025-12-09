import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Create Supabase client for direct connection
function getSupabaseClient() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * GET /api/category-heroes
 * Fetch all category hero images
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('category_heroes')
      .select('*');

    if (error) {
      throw error;
    }

    // Return as a map keyed by `{page_type}_{category}` for easy lookup
    const heroMap = (data || []).reduce((acc, hero) => {
      const key = `${hero.page_type}_${hero.category}`;
      acc[key] = {
        id: hero.id,
        pageType: hero.page_type,
        category: hero.category,
        imageUrl: hero.image_url,
        heroHeight: hero.hero_height || 60, // Default 60vh
        imageAlign: hero.image_align || 'center', // Default center
        createdAt: hero.created_at,
        updatedAt: hero.updated_at
      };
      return acc;
    }, {} as Record<string, any>);

    res.json(heroMap);
  } catch (error) {
    console.error('Failed to fetch category heroes:', error);
    res.status(500).json({ message: 'Failed to fetch category hero images' });
  }
});

/**
 * GET /api/category-heroes/:pageType/:category
 * Fetch hero image for a specific category
 */
router.get('/:pageType/:category', async (req, res) => {
  try {
    const { pageType, category } = req.params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('category_heroes')
      .select('*')
      .eq('page_type', pageType)
      .eq('category', category)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'No hero image found for this category' });
    }

    res.json({
      id: data.id,
      pageType: data.page_type,
      category: data.category,
      imageUrl: data.image_url,
      heroHeight: data.hero_height || 60,
      imageAlign: data.image_align || 'center',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Failed to fetch category hero:', error);
    res.status(500).json({ message: 'Failed to fetch category hero image' });
  }
});

/**
 * PUT /api/category-heroes/:pageType/:category
 * Create or update hero settings for a specific category
 * Accepts: imageUrl, heroHeight (40-100), imageAlign (top/center/bottom)
 */
router.put('/:pageType/:category', async (req, res) => {
  try {
    const { pageType, category } = req.params;
    const { imageUrl, heroHeight, imageAlign } = req.body;
    const supabase = getSupabaseClient();

    // At least one field must be provided
    if (!imageUrl && heroHeight === undefined && !imageAlign) {
      return res.status(400).json({ message: 'At least one of imageUrl, heroHeight, or imageAlign is required' });
    }

    // Validate heroHeight if provided
    if (heroHeight !== undefined && (heroHeight < 40 || heroHeight > 100)) {
      return res.status(400).json({ message: 'heroHeight must be between 40 and 100' });
    }

    // Validate imageAlign if provided
    if (imageAlign && !['top', 'center', 'bottom'].includes(imageAlign)) {
      return res.status(400).json({ message: 'imageAlign must be top, center, or bottom' });
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('category_heroes')
      .select('*')
      .eq('page_type', pageType)
      .eq('category', category)
      .single();

    let data;
    let error;

    if (existing) {
      // UPDATE existing record - only update provided fields
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      if (imageUrl) updateData.image_url = imageUrl;
      if (heroHeight !== undefined) updateData.hero_height = heroHeight;
      if (imageAlign) updateData.image_align = imageAlign;

      const result = await supabase
        .from('category_heroes')
        .update(updateData)
        .eq('page_type', pageType)
        .eq('category', category)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // INSERT new record - imageUrl is required for new records
      if (!imageUrl) {
        return res.status(400).json({ message: 'imageUrl is required when creating a new hero record' });
      }

      const insertData: Record<string, any> = {
        page_type: pageType,
        category: category,
        image_url: imageUrl,
        hero_height: heroHeight || 60,
        image_align: imageAlign || 'center',
        updated_at: new Date().toISOString()
      };

      const result = await supabase
        .from('category_heroes')
        .insert(insertData)
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    console.log(`✅ Updated hero for ${pageType}/${category}:`, { imageUrl, heroHeight, imageAlign });

    res.json({
      id: data.id,
      pageType: data.page_type,
      category: data.category,
      imageUrl: data.image_url,
      heroHeight: data.hero_height || 60,
      imageAlign: data.image_align || 'center',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Failed to update category hero:', error);
    res.status(500).json({ message: 'Failed to update category hero settings' });
  }
});

/**
 * DELETE /api/category-heroes/:pageType/:category
 * Delete hero image for a specific category (revert to default)
 */
router.delete('/:pageType/:category', async (req, res) => {
  try {
    const { pageType, category } = req.params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('category_heroes')
      .delete()
      .eq('page_type', pageType)
      .eq('category', category);

    if (error) {
      throw error;
    }

    res.json({ message: 'Hero image reset to default' });
  } catch (error) {
    console.error('Failed to delete category hero:', error);
    res.status(500).json({ message: 'Failed to reset category hero image' });
  }
});

export { router as categoryHeroesRouter };
