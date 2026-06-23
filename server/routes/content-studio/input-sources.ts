/**
 * Input Sources API Routes
 * CRUD for client_input_sources (configuration storage only - fetching logic comes later)
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  );
}

// GET /api/content-studio/sources/:clientId - List sources for a client
router.get('/sources/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('client_input_sources')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ sources: data || [] });
  } catch (error) {
    console.error('Error fetching input sources:', error);
    res.status(500).json({ message: 'Failed to fetch input sources' });
  }
});

// POST /api/content-studio/sources - Create a new source
router.post('/sources', async (req, res) => {
  try {
    const { client_id, source_type, display_name, config, cron_schedule, fetch_interval_minutes, is_active } = req.body;

    if (!client_id || !source_type || !display_name) {
      return res.status(400).json({ message: 'client_id, source_type, and display_name are required' });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('client_input_sources')
      .insert({
        client_id,
        source_type,
        display_name,
        config: config || {},
        cron_schedule: cron_schedule || null,
        fetch_interval_minutes: fetch_interval_minutes || 1440,
        is_active: is_active || false,
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error creating input source:', error);
    res.status(500).json({ message: 'Failed to create input source' });
  }
});

// PUT /api/content-studio/sources/:id - Update a source
router.put('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    if (req.body.display_name !== undefined) updates.display_name = req.body.display_name;
    if (req.body.config !== undefined) updates.config = req.body.config;
    if (req.body.cron_schedule !== undefined) updates.cron_schedule = req.body.cron_schedule;
    if (req.body.fetch_interval_minutes !== undefined) updates.fetch_interval_minutes = req.body.fetch_interval_minutes;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
    updates.updated_at = new Date().toISOString();

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('client_input_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating input source:', error);
    res.status(500).json({ message: 'Failed to update input source' });
  }
});

// DELETE /api/content-studio/sources/:id - Delete a source
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('client_input_sources')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting input source:', error);
    res.status(500).json({ message: 'Failed to delete input source' });
  }
});

// ============================================================================
// PIPELINE CONFIG (stored on content_clients.pipeline_config)
// ============================================================================

// GET /api/content-studio/pipeline-config/:clientId
router.get('/pipeline-config/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('content_clients')
      .select('pipeline_config')
      .eq('id', clientId)
      .single();

    if (error) throw error;

    res.json({ config: data?.pipeline_config || null });
  } catch (error) {
    console.error('Error fetching pipeline config:', error);
    res.status(500).json({ message: 'Failed to fetch pipeline config' });
  }
});

// PUT /api/content-studio/pipeline-config/:clientId
router.put('/pipeline-config/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ message: 'config is required' });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('content_clients')
      .update({ pipeline_config: config, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select('pipeline_config')
      .single();

    if (error) throw error;

    res.json({ config: data?.pipeline_config });
  } catch (error) {
    console.error('Error saving pipeline config:', error);
    res.status(500).json({ message: 'Failed to save pipeline config' });
  }
});

// ============================================================================
// PIPELINE RUNS (observability)
// ============================================================================

// GET /api/content-studio/pipeline-runs/:clientId - Recent runs for a client
router.get('/pipeline-runs/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('client_id', clientId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ runs: data || [] });
  } catch (error) {
    console.error('Error fetching pipeline runs:', error);
    res.status(500).json({ message: 'Failed to fetch pipeline runs' });
  }
});

export default router;
