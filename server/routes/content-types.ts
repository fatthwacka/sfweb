/**
 * Content Types API Routes
 * Manages content type definitions for prompt enhancement
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Create admin Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Get all content types
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      contentTypes: data || []
    });

  } catch (error) {
    console.error('❌ Content types fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content types'
    });
  }
});

// Get single content type by key
router.get('/:typeKey', async (req, res) => {
  try {
    const { typeKey } = req.params;

    const { data, error } = await supabase
      .from('content_types')
      .select('*')
      .eq('type_key', typeKey)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      contentType: data
    });

  } catch (error) {
    console.error('❌ Content type fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Content type not found'
    });
  }
});

// Get all content types for admin (including inactive)
router.get('/admin/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      contentTypes: data || []
    });

  } catch (error) {
    console.error('❌ Admin content types fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content types'
    });
  }
});

// Create new content type
router.post('/', async (req, res) => {
  try {
    const {
      type_key,
      label,
      description,
      word_limit,
      character_limit,
      guidelines,
      system_prompt,
      is_active = true,
      sort_order = 0
    } = req.body;

    // Validate required fields
    if (!type_key || !label || !system_prompt) {
      return res.status(400).json({
        success: false,
        error: 'type_key, label, and system_prompt are required'
      });
    }

    const { data, error } = await supabase
      .from('content_types')
      .insert({
        type_key,
        label,
        description,
        word_limit,
        character_limit,
        guidelines,
        system_prompt,
        is_active,
        sort_order
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      contentType: data
    });

  } catch (error) {
    console.error('❌ Content type creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create content type'
    });
  }
});

// Update content type
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      label,
      description,
      word_limit,
      character_limit,
      guidelines,
      system_prompt,
      is_active,
      sort_order
    } = req.body;

    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (description !== undefined) updateData.description = description;
    if (word_limit !== undefined) updateData.word_limit = word_limit;
    if (character_limit !== undefined) updateData.character_limit = character_limit;
    if (guidelines !== undefined) updateData.guidelines = guidelines;
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from('content_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      contentType: data
    });

  } catch (error) {
    console.error('❌ Content type update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content type'
    });
  }
});

// Delete content type (soft delete - set inactive)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('content_types')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Content type deactivated successfully'
    });

  } catch (error) {
    console.error('❌ Content type deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content type'
    });
  }
});

export default router;