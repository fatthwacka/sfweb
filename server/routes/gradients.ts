import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Create Supabase client for direct connection (even in dev)
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
 * GET /api/gradients/:sectionKey
 * Fetch gradient configuration for a specific section
 */
router.get('/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('site_gradients')
      .select('*')
      .eq('section_key', sectionKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'No custom gradient configuration found' });
    }

    // Transform snake_case to camelCase for frontend
    res.json({
      id: data.id,
      sectionKey: data.section_key,
      gradientConfig: data.gradient_config,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Failed to fetch gradient:', error);
    res.status(500).json({ message: 'Failed to fetch gradient configuration' });
  }
});

/**
 * PUT /api/gradients/:sectionKey
 * Create or update gradient configuration for a specific section
 */
router.put('/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const { gradientConfig } = req.body;
    const supabase = getSupabaseClient();

    if (!gradientConfig) {
      return res.status(400).json({ message: 'gradientConfig is required' });
    }

    // Upsert the gradient configuration
    const { data, error } = await supabase
      .from('site_gradients')
      .upsert({
        section_key: sectionKey,
        gradient_config: gradientConfig,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'section_key'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Transform snake_case to camelCase for frontend
    res.json({
      id: data.id,
      sectionKey: data.section_key,
      gradientConfig: data.gradient_config,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Failed to update gradient:', error);
    res.status(500).json({ message: 'Failed to update gradient configuration' });
  }
});

/**
 * DELETE /api/gradients/:sectionKey
 * Delete custom gradient configuration (revert to defaults)
 */
router.delete('/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('site_gradients')
      .delete()
      .eq('section_key', sectionKey);

    if (error) {
      throw error;
    }

    res.json({ message: 'Gradient configuration reset to defaults' });
  } catch (error) {
    console.error('Failed to delete gradient:', error);
    res.status(500).json({ message: 'Failed to reset gradient configuration' });
  }
});

/**
 * GET /api/gradients
 * Get all gradient configurations (useful for admin overview)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('site_gradients')
      .select('*');

    if (error) {
      throw error;
    }

    // Return as a map with section keys (camelCase)
    const gradientMap = (data || []).reduce((acc, gradient) => {
      acc[gradient.section_key] = gradient.gradient_config;
      return acc;
    }, {} as Record<string, any>);

    res.json(gradientMap);
  } catch (error) {
    console.error('Failed to fetch all gradients:', error);
    res.status(500).json({ message: 'Failed to fetch gradient configurations' });
  }
});

export { router as gradientRoutes };
