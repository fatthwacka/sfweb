import express from 'express';
import { supabaseAdmin as supabase } from '../../supabase-auth.js';
import type { 
  ContentClient, 
  ClientBrandProfile, 
  CreateContentClientRequest,
  UpdateBrandProfileRequest 
} from './types.js';

const router = express.Router();

// ============================================================================
// DASHBOARD OVERVIEW DATA
// ============================================================================

// GET /api/content-management/brand-intelligence/dashboard - Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get total and active clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('content_clients')
      .select('id, is_active, created_at')
      .is('deleted_at', null);

    if (clientsError) {
      console.error('Error fetching clients for dashboard:', clientsError);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }

    const clients = clientsData || [];
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.is_active).length;

    // Get generation limits to calculate monthly spend
    const { data: limitsData, error: limitsError } = await supabase
      .from('generation_limits')
      .select('current_month_spend, max_monthly_cost')
      .not('current_month_spend', 'is', null);

    const limits = limitsData || [];
    const totalMonthlySpend = limits.reduce((sum, limit) => sum + (limit.current_month_spend || 0), 0);

    // Get recent activity (last 10 activities)
    const recentActivity = clients
      .slice(0, 10)
      .map(client => ({
        type: 'client_created' as const,
        client: client,
        timestamp: client.created_at,
        details: `New content client "${client.id}" was created`
      }));

    // Mock top performing clients for now (will be replaced with real metrics)
    const topPerformingClients = clients
      .slice(0, 5)
      .map(client => ({
        client,
        performanceScore: Math.floor(Math.random() * 100),
        monthlySpend: Math.floor(Math.random() * 100)
      }));

    const dashboardData = {
      totalClients,
      activeClients,
      totalMonthlySpend,
      averageEngagementRate: 0, // Will be calculated from real metrics later
      topPerformingClients,
      recentActivity
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// CONTENT CLIENTS CRUD
// ============================================================================

// GET /api/content-management/clients - List all content clients
router.get('/clients', async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('content_clients')
      .select(`
        *,
        client_brand_profiles (
          id,
          version,
          brand_description,
          voice_rules,
          visual_rules,
          created_at
        ),
        generation_limits (
          max_monthly_cost,
          current_month_spend,
          video_enabled,
          voice_enabled
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content clients:', error);
      return res.status(500).json({ error: 'Failed to fetch content clients' });
    }

    res.json({ data: { clients: clients || [] } });
  } catch (error) {
    console.error('Content clients fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content-management/clients/:clientId - Get single client with full brand profile
router.get('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: client, error } = await supabase
      .from('content_clients')
      .select(`
        *,
        client_brand_profiles (
          *
        ),
        generation_limits (*),
        client_performance_metrics (
          id,
          metric_type,
          platform,
          metric_data,
          created_at
        )
      `)
      .eq('id', clientId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Client fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content-management/clients - Create new content client
router.post('/clients', async (req, res) => {
  try {
    const clientData = req.body as CreateContentClientRequest;
    
    // Validate required fields
    if (!clientData.name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    // Generate slug from name
    const slug = clientData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    // Start transaction by creating client first
    const { data: client, error: clientError } = await supabase
      .from('content_clients')
      .insert({
        name: clientData.name,
        slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
        email: clientData.email,
        website_url: clientData.website_url,
        industry: clientData.industry,
        created_by: req.user?.id // Will be available from auth middleware
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return res.status(500).json({ error: 'Failed to create client' });
    }

    // Create default brand profile
    const { data: brandProfile, error: brandError } = await supabase
      .from('client_brand_profiles')
      .insert({
        client_id: client.id,
        brand_description: clientData.brand_description || '',
        voice_rules: {
          tone: 'professional',
          sentence_length: 'medium',
          humor: 'minimal',
          profanity: 'none'
        },
        visual_rules: {
          style: 'modern',
          imagery: 'professional'
        },
        platform_rules: {
          instagram: { hashtags: 5, length: 'short' },
          linkedin: { hashtags: 3, length: 'medium' }
        },
        created_by: req.user?.id
      })
      .select()
      .single();

    if (brandError) {
      console.error('Error creating brand profile:', brandError);
      // Clean up client if brand profile fails
      await supabase.from('content_clients').delete().eq('id', client.id);
      return res.status(500).json({ error: 'Failed to create brand profile' });
    }

    // Create default generation limits
    const { error: limitsError } = await supabase
      .from('generation_limits')
      .insert({
        client_id: client.id,
        max_cost_per_run: 50.00,
        max_monthly_cost: 500.00,
        video_enabled: true,
        voice_enabled: false
      });

    if (limitsError) {
      console.error('Error creating generation limits:', limitsError);
    }

    res.status(201).json({ 
      client: {
        ...client,
        client_brand_profiles: [brandProfile]
      }
    });
  } catch (error) {
    console.error('Client creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/content-management/clients/:clientId - Update client basic info
router.put('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const updateData = req.body;

    const { data: client, error } = await supabase
      .from('content_clients')
      .update({
        name: updateData.name,
        email: updateData.email,
        website_url: updateData.website_url,
        industry: updateData.industry,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return res.status(500).json({ error: 'Failed to update client' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Client update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/content-management/clients/:clientId - Soft delete client
router.delete('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { error } = await supabase
      .from('content_clients')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', clientId);

    if (error) {
      console.error('Error deleting client:', error);
      return res.status(500).json({ error: 'Failed to delete client' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Client deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// BRAND PROFILE MANAGEMENT
// ============================================================================


// PUT /api/content-management/clients/:clientId/brand-profile - Update brand profile
router.put('/clients/:clientId/brand-profile', async (req, res) => {
  try {
    const { clientId } = req.params;
    const profileData = req.body as UpdateBrandProfileRequest;

    console.log('🔄 Brand profile update request for client:', clientId);
    console.log('📝 Profile data received:', Object.keys(profileData));
    console.log('🔍 Raw profile data:', profileData);
    console.log('🚨🚨🚨 CODE UPDATE TEST - NEW LOGGING ACTIVE 🚨🚨🚨');

    // CRITICAL FIX: Add explicit products_services logging
    console.log('🚨 PRODUCTS SERVICES FIELD TRANSFORMATION:');
    console.log('  📥 INPUT products_services:', JSON.stringify(profileData.products_services));
    console.log('  📥 INPUT type:', typeof profileData.products_services);
    console.log('  📥 INPUT length:', profileData.products_services?.length);
    
    // FIXED: Include required fields that exist in current data structure
    const profileToSave = {
      client_id: clientId,
      
      // REQUIRED FIELDS based on existing data structure
      version: 1, // Default version for new records
      is_active: true, // Default active state
      
      // Basic info - now using direct column mapping
      brand_description: profileData.brand_description || 'Default brand description',
      products_services: profileData.products_services || null,
      
      // AI enhancement fields (confirmed to exist)
      business_niche: profileData.business_niche || null,
      color_personality: profileData.color_personality || null,
      visual_mood: profileData.visual_mood || null,
      target_audience: profileData.target_audience || null,
      priority_benefits: profileData.priority_benefits || [],
      secondary_benefits: profileData.secondary_benefits || [],
      positive_examples: profileData.positive_examples || [],
      
      // Voice and visual rules (confirmed to exist) - provide defaults
      voice_tone: profileData.voice_tone || {},
      voice_rules: profileData.voice_rules || {
        tone: 'professional',
        humor: 'minimal',
        sentence_length: 'medium'
      },
      visual_rules: profileData.visual_rules || {
        style: 'modern',
        primary_color: '#8B5CF6'
      },
      
      // Content strategy (confirmed to exist) - provide defaults
      key_messages: profileData.key_messages || [],
      forbidden_phrases: profileData.forbidden_phrases || [],
      preferred_terminology: profileData.preferred_terminology || {},
      content_themes: profileData.content_themes || [],
      target_audience_description: profileData.target_audience_description || null,
      content_length_preferences: profileData.content_length_preferences || {},
      
      // Language and localization settings (NEW columns added)
      language: profileData.language || 'english',
      region: profileData.region || 'global', 
      spelling: profileData.spelling || 'british',
      
      // Visual identity (confirmed to exist)
      primary_color: profileData.primary_color || '#8B5CF6',
      secondary_colors: profileData.secondary_colors || [],
      logo_url: profileData.logo_url || null,
      visual_style_notes: profileData.visual_style_notes || null,
      
      // Performance data (confirmed to exist)
      top_performing_content_types: profileData.top_performing_content_types || [],
      successful_hooks: profileData.successful_hooks || [],
      content_to_avoid: profileData.content_to_avoid || [],
      approved_examples: profileData.approved_examples || [],
      negative_examples: profileData.negative_examples || [],
      platform_rules: profileData.platform_rules || {},
      
      // Store industry_segment in notes field if provided (workaround - no industry_segment column)
      notes: profileData.industry_segment ? 
        `Industry: ${profileData.industry_segment}${profileData.notes ? '\n\n' + profileData.notes : ''}` : 
        profileData.notes,
        
      // Set metadata
      created_by: null
    };

    // CRITICAL DEBUG: Verify products_services is in final object
    console.log('🔍 FINAL OBJECT products_services:', JSON.stringify(profileToSave.products_services));
    console.log('🔍 FINAL OBJECT has products_services?:', 'products_services' in profileToSave);

    console.log('💾 Saving brand profile for client:', clientId);
    console.log('📋 Profile data to save:', JSON.stringify(profileToSave, null, 2));

    // Delete any existing brand profiles for this client, then insert new one
    console.log('🗑️ Deleting existing profiles for client:', clientId);
    const { error: deleteError } = await supabase
      .from('client_brand_profiles')
      .delete()
      .eq('client_id', clientId);

    if (deleteError) {
      console.error('❌ Error deleting existing profiles:', deleteError);
      return res.status(500).json({ error: 'Failed to delete existing profiles', details: deleteError });
    }
    console.log('✅ Existing profiles deleted successfully');

    // First, let's test what columns actually exist by doing a simple query
    console.log('🔍 Testing table structure...');
    const { data: existingData, error: testError } = await supabase
      .from('client_brand_profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing table:', testError);
    } else {
      console.log('📋 Sample record structure:', existingData?.[0] ? Object.keys(existingData[0]) : 'No records found');
    }

    // Insert the new profile
    console.log('➕ Inserting new profile...');
    const { data: result, error: insertError } = await supabase
      .from('client_brand_profiles')
      .insert(profileToSave)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting brand profile:', insertError);
      console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
      console.error('❌ Error code:', insertError.code);
      console.error('❌ Error message:', insertError.message);
      return res.status(500).json({ error: 'Failed to save brand profile', details: insertError });
    }
    
    console.log('✅ Brand profile saved successfully for client:', clientId);
    console.log('📄 Saved profile result:', JSON.stringify(result, null, 2));

    res.json({ brandProfile: result });
  } catch (error) {
    console.error('Brand profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content-management/clients/:clientId/brand-profile/history - Get brand profile history
router.get('/clients/:clientId/brand-profile/history', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: profiles, error } = await supabase
      .from('client_brand_profiles')
      .select('id, version, is_active, brand_description, created_at, created_by, notes')
      .eq('client_id', clientId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching brand profile history:', error);
      return res.status(500).json({ error: 'Failed to fetch brand profile history' });
    }

    res.json({ profiles: profiles || [] });
  } catch (error) {
    console.error('Brand profile history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// GENERATION LIMITS MANAGEMENT
// ============================================================================

// GET /api/content-management/clients/:clientId/limits - Get generation limits
router.get('/clients/:clientId/limits', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: limits, error } = await supabase
      .from('generation_limits')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Error fetching generation limits:', error);
      return res.status(404).json({ error: 'Generation limits not found' });
    }

    res.json({ limits });
  } catch (error) {
    console.error('Generation limits fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/content-management/clients/:clientId/limits - Update generation limits
router.put('/clients/:clientId/limits', async (req, res) => {
  try {
    const { clientId } = req.params;
    const limitsData = req.body;

    const { data: limits, error } = await supabase
      .from('generation_limits')
      .update({
        max_cost_per_run: limitsData.max_cost_per_run,
        max_monthly_cost: limitsData.max_monthly_cost,
        video_enabled: limitsData.video_enabled,
        voice_enabled: limitsData.voice_enabled,
        bulk_generation_enabled: limitsData.bulk_generation_enabled,
        auto_post_enabled: limitsData.auto_post_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating generation limits:', error);
      return res.status(500).json({ error: 'Failed to update generation limits' });
    }

    res.json({ limits });
  } catch (error) {
    console.error('Generation limits update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;