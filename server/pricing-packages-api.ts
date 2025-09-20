import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin as supabase } from './supabase-auth.js';
import { pricingPackageSchema, type PricingPackage } from '@shared/types/pricing';

const router = Router();

// Get pricing package for a specific page
router.get('/api/pricing-packages/:pageIdentifier', async (req, res) => {
  try {
    const { pageIdentifier } = req.params;

    const { data, error } = await supabase
      .from('pricing_packages')
      .select('*')
      .eq('page_identifier', pageIdentifier)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching pricing package:', error);
      return res.status(500).json({
        data: null,
        error: 'Failed to fetch pricing package'
      });
    }

    res.json({
      data: data || null,
      error: null
    });
  } catch (error) {
    console.error('Error in GET /api/pricing-packages/:pageIdentifier:', error);
    res.status(500).json({
      data: null,
      error: 'Internal server error'
    });
  }
});

// Get all pricing packages (admin)
router.get('/api/pricing-packages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pricing_packages')
      .select('*')
      .order('page_type', { ascending: true })
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching pricing packages:', error);
      return res.status(500).json({
        data: null,
        error: 'Failed to fetch pricing packages'
      });
    }

    res.json({
      data: data || [],
      error: null
    });
  } catch (error) {
    console.error('Error in GET /api/pricing-packages:', error);
    res.status(500).json({
      data: null,
      error: 'Internal server error'
    });
  }
});

// Update pricing package
router.patch('/api/pricing-packages/:pageIdentifier', async (req, res) => {
  try {
    const { pageIdentifier } = req.params;

    // Validate request body
    const validationResult = pricingPackageSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        data: null,
        error: 'Invalid pricing package data',
        details: validationResult.error.flatten()
      });
    }

    const updates = validationResult.data;

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    const { data, error } = await supabase
      .from('pricing_packages')
      .update(updateData)
      .eq('page_identifier', pageIdentifier)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing package:', error);
      return res.status(500).json({
        data: null,
        error: 'Failed to update pricing package'
      });
    }

    res.json({
      data,
      error: null
    });
  } catch (error) {
    console.error('Error in PATCH /api/pricing-packages/:pageIdentifier:', error);
    res.status(500).json({
      data: null,
      error: 'Internal server error'
    });
  }
});

// Create or update pricing package (upsert)
router.post('/api/pricing-packages', async (req, res) => {
  try {
    // Validate request body
    const validationResult = pricingPackageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        data: null,
        error: 'Invalid pricing package data',
        details: validationResult.error.flatten()
      });
    }

    const packageData = validationResult.data;

    // Upsert the pricing package
    const { data, error } = await supabase
      .from('pricing_packages')
      .upsert(packageData, {
        onConflict: 'page_identifier',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting pricing package:', error);
      return res.status(500).json({
        data: null,
        error: 'Failed to save pricing package'
      });
    }

    res.json({
      data,
      error: null
    });
  } catch (error) {
    console.error('Error in POST /api/pricing-packages:', error);
    res.status(500).json({
      data: null,
      error: 'Internal server error'
    });
  }
});

// Delete a pricing tier from a package
router.delete('/api/pricing-packages/:pageIdentifier/tiers/:tierIndex', async (req, res) => {
  try {
    const { pageIdentifier, tierIndex } = req.params;
    const index = parseInt(tierIndex, 10);

    // First, get the current package
    const { data: currentPackage, error: fetchError } = await supabase
      .from('pricing_packages')
      .select('*')
      .eq('page_identifier', pageIdentifier)
      .single();

    if (fetchError || !currentPackage) {
      return res.status(404).json({
        data: null,
        error: 'Pricing package not found'
      });
    }

    // Remove the tier at the specified index
    const tiers = currentPackage.tiers || [];
    if (index < 0 || index >= tiers.length) {
      return res.status(400).json({
        data: null,
        error: 'Invalid tier index'
      });
    }

    tiers.splice(index, 1);

    // Update the package with the modified tiers
    const { data, error } = await supabase
      .from('pricing_packages')
      .update({
        tiers,
        updated_at: new Date().toISOString()
      })
      .eq('page_identifier', pageIdentifier)
      .select()
      .single();

    if (error) {
      console.error('Error deleting tier:', error);
      return res.status(500).json({
        data: null,
        error: 'Failed to delete tier'
      });
    }

    res.json({
      data,
      error: null
    });
  } catch (error) {
    console.error('Error in DELETE /api/pricing-packages/:pageIdentifier/tiers/:tierIndex:', error);
    res.status(500).json({
      data: null,
      error: 'Internal server error'
    });
  }
});

export default router;