import { Router } from 'express';
import { db } from '../db';
import { siteGradients } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { getDefaultGradient } from '@shared/constants/gradient-defaults';

const router = Router();

/**
 * GET /api/gradients/:sectionKey
 * Fetch gradient configuration for a specific section
 */
router.get('/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;

    const gradient = await db
      .select()
      .from(siteGradients)
      .where(eq(siteGradients.sectionKey, sectionKey))
      .limit(1);

    if (gradient.length === 0) {
      return res.status(404).json({ message: 'No custom gradient configuration found' });
    }

    res.json(gradient[0]);
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

    if (!gradientConfig) {
      return res.status(400).json({ message: 'gradientConfig is required' });
    }

    // Upsert the gradient configuration
    const result = await db
      .insert(siteGradients)
      .values({
        sectionKey,
        gradientConfig,
        updatedAt: sql`now()`
      })
      .onConflictDoUpdate({
        target: siteGradients.sectionKey,
        set: {
          gradientConfig,
          updatedAt: sql`now()`
        }
      })
      .returning();

    res.json(result[0]);
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

    await db
      .delete(siteGradients)
      .where(eq(siteGradients.sectionKey, sectionKey));

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
    const gradients = await db.select().from(siteGradients);

    // Return as a map with section keys
    const gradientMap = gradients.reduce((acc, gradient) => {
      acc[gradient.sectionKey] = gradient.gradientConfig;
      return acc;
    }, {} as Record<string, any>);

    res.json(gradientMap);
  } catch (error) {
    console.error('Failed to fetch all gradients:', error);
    res.status(500).json({ message: 'Failed to fetch gradient configurations' });
  }
});

export { router as gradientRoutes };