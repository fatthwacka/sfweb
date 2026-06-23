/**
 * Pipeline API Routes
 * Cron-triggered endpoint for running the content ingestion pipeline.
 * Also provides manual trigger per client.
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { pipelineExecutor } from '../../services/pipeline/pipeline-executor';

const router = Router();

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * POST /api/content-studio/pipeline/run
 *
 * Called by VPS cron every 15 minutes.
 * If body.clientId is provided, runs for that client only.
 * Otherwise, runs for all clients that have active input sources.
 *
 * Protected by optional PIPELINE_CRON_SECRET token.
 */
router.post('/pipeline/run', async (req, res) => {
  // Simple bearer token check (optional — skipped if env var not set)
  const cronSecret = process.env.PIPELINE_CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['x-pipeline-token'] || req.headers['authorization'];
    const token = typeof authHeader === 'string'
      ? authHeader.replace(/^Bearer\s+/i, '')
      : '';
    if (token !== cronSecret) {
      return res.status(401).json({ message: 'Unauthorised' });
    }
  }

  try {
    const { clientId } = req.body;

    if (clientId) {
      // Run for a specific client
      console.log(`[pipeline] Manual run triggered for client ${clientId}`);
      const summary = await pipelineExecutor.executeResearchRun(clientId);
      return res.json({ runs: [summary] });
    }

    // Run for all clients with active sources
    const supabase = getSupabase();
    const { data: clientsWithSources, error } = await supabase
      .from('client_input_sources')
      .select('client_id')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch clients with sources: ${error.message}`);
    }

    // Deduplicate client IDs
    const uniqueClientIds = Array.from(new Set((clientsWithSources || []).map(s => s.client_id)));

    if (uniqueClientIds.length === 0) {
      return res.json({ runs: [], message: 'No clients with active sources' });
    }

    console.log(`[pipeline] Cron run for ${uniqueClientIds.length} client(s)`);

    // Process clients sequentially (avoids overwhelming Gemini API)
    const runs = [];
    for (const cId of uniqueClientIds) {
      try {
        const summary = await pipelineExecutor.executeResearchRun(cId);
        runs.push(summary);
      } catch (clientError) {
        const msg = clientError instanceof Error ? clientError.message : 'Unknown error';
        console.error(`[pipeline] Error processing client ${cId}:`, msg);
        runs.push({
          runId: '',
          clientId: cId,
          status: 'error',
          itemsDiscovered: 0,
          itemsScreenedOut: 0,
          itemsApproved: 0,
          durationMs: 0,
          errors: [msg],
          sourcesProcessed: [],
        });
      }
    }

    res.json({ runs });
  } catch (error) {
    console.error('[pipeline] Run endpoint error:', error);
    res.status(500).json({
      message: 'Pipeline run failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/content-studio/pipeline/run/:clientId
 * Manual trigger for a specific client (from the frontend).
 */
router.post('/pipeline/run/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log(`[pipeline] Manual run for client ${clientId}`);
    const summary = await pipelineExecutor.executeResearchRun(clientId);
    res.json(summary);
  } catch (error) {
    console.error('[pipeline] Manual run error:', error);
    res.status(500).json({
      message: 'Pipeline run failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
