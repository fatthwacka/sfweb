/**
 * Output Destinations API Routes
 * CRUD for client_output_destinations with credential encryption
 * Publish orchestration for multi-destination output
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { encryptCredentials, decryptCredentials, isEncryptionConfigured } from '../../services/credentials-encryption';
import { wordpressConnector } from '../../services/connectors/wordpress-connector';
import { staticBlogGenerator } from '../../static-generator';
import type { BlogPostData } from '../../services/connectors/connector-interface';

const router = Router();

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  );
}

// GET /api/content-studio/destinations/:clientId - List destinations for a client
router.get('/destinations/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('client_output_destinations')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Strip encrypted credentials from response (never send to client)
    const destinations = (data || []).map(d => ({
      ...d,
      credentials_encrypted: undefined,
      has_credentials: !!d.credentials_encrypted,
    }));

    res.json({ destinations });
  } catch (error) {
    console.error('Error fetching output destinations:', error);
    res.status(500).json({ message: 'Failed to fetch output destinations' });
  }
});

// POST /api/content-studio/destinations - Create a new destination
router.post('/destinations', async (req, res) => {
  try {
    const { client_id, destination_type, display_name, config, credentials, is_active } = req.body;

    if (!client_id || !destination_type || !display_name) {
      return res.status(400).json({ message: 'client_id, destination_type, and display_name are required' });
    }

    // Encrypt credentials if provided
    let credentialsEncrypted: string | null = null;
    if (credentials && Object.keys(credentials).length > 0) {
      if (!isEncryptionConfigured()) {
        return res.status(500).json({ message: 'Credential encryption is not configured. Set CONTENT_STUDIO_ENCRYPTION_KEY.' });
      }
      credentialsEncrypted = encryptCredentials(credentials);
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('client_output_destinations')
      .insert({
        client_id,
        destination_type,
        display_name,
        credentials_encrypted: credentialsEncrypted,
        config: config || {},
        is_active: is_active || false,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      credentials_encrypted: undefined,
      has_credentials: !!credentialsEncrypted,
    });
  } catch (error) {
    console.error('Error creating output destination:', error);
    res.status(500).json({ message: 'Failed to create output destination' });
  }
});

// PUT /api/content-studio/destinations/:id - Update a destination
router.put('/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    if (req.body.display_name !== undefined) updates.display_name = req.body.display_name;
    if (req.body.config !== undefined) updates.config = req.body.config;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
    updates.updated_at = new Date().toISOString();

    // Re-encrypt credentials if provided
    if (req.body.credentials && Object.keys(req.body.credentials).length > 0) {
      if (!isEncryptionConfigured()) {
        return res.status(500).json({ message: 'Credential encryption is not configured' });
      }
      updates.credentials_encrypted = encryptCredentials(req.body.credentials);
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('client_output_destinations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      credentials_encrypted: undefined,
      has_credentials: !!data.credentials_encrypted,
    });
  } catch (error) {
    console.error('Error updating output destination:', error);
    res.status(500).json({ message: 'Failed to update output destination' });
  }
});

// DELETE /api/content-studio/destinations/:id - Delete a destination
router.delete('/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('client_output_destinations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting output destination:', error);
    res.status(500).json({ message: 'Failed to delete output destination' });
  }
});

// POST /api/content-studio/destinations/:id/test - Test connection
router.post('/destinations/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    // Fetch the destination with encrypted credentials
    const { data: dest, error } = await supabase
      .from('client_output_destinations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dest) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    if (!dest.credentials_encrypted) {
      return res.json({ success: false, message: 'No credentials configured' });
    }

    // Decrypt credentials
    const credentials = decryptCredentials(dest.credentials_encrypted);
    console.log('[test-connection] Decrypted credential keys:', Object.keys(credentials));
    console.log('[test-connection] username present:', !!credentials.username, '| appPassword present:', !!credentials.appPassword);
    console.log('[test-connection] siteUrl:', dest.config?.siteUrl);

    // Route to appropriate connector
    if (dest.destination_type === 'wordpress') {
      const result = await wordpressConnector.testConnection({
        siteUrl: dest.config?.siteUrl || '',
        credentials,
      });
      return res.json(result);
    }

    res.json({ success: false, message: `Connector for '${dest.destination_type}' is not yet implemented` });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ success: false, message: 'Connection test failed' });
  }
});

// GET /api/content-studio/destinations/:id/categories - Discover remote categories
router.get('/destinations/:id/categories', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { data: dest, error } = await supabase
      .from('client_output_destinations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dest) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    if (!dest.credentials_encrypted) {
      return res.status(400).json({ message: 'No credentials configured' });
    }

    const credentials = decryptCredentials(dest.credentials_encrypted);

    if (dest.destination_type === 'wordpress' && wordpressConnector.discoverCategories) {
      const categories = await wordpressConnector.discoverCategories({
        siteUrl: dest.config?.siteUrl || '',
        credentials,
      });
      return res.json({ categories });
    }

    res.json({ categories: [], message: `Category discovery not supported for '${dest.destination_type}'` });
  } catch (error) {
    console.error('Error discovering categories:', error);
    res.status(500).json({ message: 'Failed to discover categories' });
  }
});

// GET /api/content-studio/destinations/:id/tags - Discover remote tags
router.get('/destinations/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { data: dest, error } = await supabase
      .from('client_output_destinations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dest) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    if (!dest.credentials_encrypted) {
      return res.status(400).json({ message: 'No credentials configured' });
    }

    const credentials = decryptCredentials(dest.credentials_encrypted);

    if (dest.destination_type === 'wordpress' && wordpressConnector.discoverTags) {
      const tags = await wordpressConnector.discoverTags({
        siteUrl: dest.config?.siteUrl || '',
        credentials,
      });
      return res.json({ tags });
    }

    res.json({ tags: [], message: `Tag discovery not supported for '${dest.destination_type}'` });
  } catch (error) {
    console.error('Error discovering tags:', error);
    res.status(500).json({ message: 'Failed to discover tags' });
  }
});

// PUT /api/content-studio/destinations/:id/config - Update destination config (mappings, defaults)
router.put('/destinations/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    // Fetch current destination
    const { data: dest, error: fetchError } = await supabase
      .from('client_output_destinations')
      .select('config')
      .eq('id', id)
      .single();

    if (fetchError || !dest) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    // Merge new config fields into existing config
    const updatedConfig = {
      ...(dest.config || {}),
      ...req.body,
    };

    const { data, error } = await supabase
      .from('client_output_destinations')
      .update({ config: updatedConfig, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      credentials_encrypted: undefined,
      has_credentials: !!data.credentials_encrypted,
    });
  } catch (error) {
    console.error('Error updating destination config:', error);
    res.status(500).json({ message: 'Failed to update destination config' });
  }
});

// POST /api/content-studio/publish/:postId - Orchestrate publishing to all active destinations
router.post('/publish/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { clientId } = req.body;
    const supabase = getSupabase();

    // 1. Fetch the post with its category name
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*, blog_categories(name, slug)')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Resolve local category name for the post
    const localCategoryName = (post as any).blog_categories?.name || null;

    // Validate client ownership if clientId provided
    if (clientId && post.client_id && clientId !== post.client_id) {
      return res.status(403).json({ message: 'Post does not belong to this client' });
    }

    const publishTracking: Record<string, string> = post.publish_tracking || {};
    const results: Array<{
      destinationId: string;
      displayName: string;
      platform: string;
      success: boolean;
      url?: string;
      externalId?: string;
      message: string;
    }> = [];

    // 2. Always generate static HTML (cheap archive for all clients)
    let staticHtml = { success: false, path: '', message: '' };
    try {
      const staticSuccess = await staticBlogGenerator.generateStaticPost(postId);
      staticHtml = {
        success: staticSuccess,
        path: `/stories/${post.slug}.html`,
        message: staticSuccess ? 'Static HTML file generated' : 'Static generation returned false',
      };
    } catch (staticError) {
      console.warn('Static generation failed (non-blocking):', staticError);
      staticHtml = {
        success: false,
        path: '',
        message: `Static generation error: ${staticError instanceof Error ? staticError.message : 'Unknown'}`,
      };
    }

    // 3. Fetch active external destinations for this client
    const effectiveClientId = clientId || post.client_id;
    if (effectiveClientId) {
      const { data: destinations, error: destError } = await supabase
        .from('client_output_destinations')
        .select('*')
        .eq('client_id', effectiveClientId)
        .eq('is_active', true);

      if (destError) {
        console.error('Error fetching destinations:', destError);
      }

      // 4. Process each destination
      for (const dest of (destinations || [])) {
        if (dest.destination_type === 'wordpress') {
          if (!dest.credentials_encrypted) {
            results.push({
              destinationId: dest.id,
              displayName: dest.display_name,
              platform: 'wordpress',
              success: false,
              message: 'No credentials configured',
            });
            continue;
          }

          try {
            const credentials = decryptCredentials(dest.credentials_encrypted);
            const destConfig = dest.config || {};
            const connectorConfig = {
              siteUrl: destConfig.siteUrl || '',
              credentials,
              categoryMapping: destConfig.categoryMapping || {},
              tagMapping: destConfig.tagMapping || {},
            };

            // Determine image handling from destination defaults
            const imageHandling = destConfig.defaults?.imageHandling || 'upload';

            // Build the post data for the connector
            const blogPostData: BlogPostData = {
              title: post.title,
              slug: post.slug,
              content: post.content || '',
              excerpt: post.excerpt || undefined,
              coverImageUrl: imageHandling !== 'skip' ? (post.cover_image || undefined) : undefined,
              status: post.status === 'published' ? 'publish' : (destConfig.defaults?.postStatus || 'draft'),
              categories: localCategoryName ? [localCategoryName] : undefined,
              seoTitle: post.seo_title || undefined,
              seoDescription: post.seo_description || undefined,
            };

            const existingExternalId = publishTracking[dest.id];
            let result;

            if (existingExternalId) {
              // Update existing post
              console.log(`Updating WordPress post ${existingExternalId} on ${dest.display_name}`);
              result = await wordpressConnector.updatePost(connectorConfig, existingExternalId, blogPostData);
            } else {
              // Create new post
              console.log(`Publishing new post to ${dest.display_name}`);
              result = await wordpressConnector.publishPost(connectorConfig, blogPostData);
            }

            // Track the external ID for future updates
            if (result.success && result.externalId) {
              publishTracking[dest.id] = result.externalId;
            }

            results.push({
              destinationId: dest.id,
              displayName: dest.display_name,
              platform: 'wordpress',
              success: result.success,
              url: result.url,
              externalId: result.externalId,
              message: result.message,
            });

            // Update last_published_at on the destination
            if (result.success) {
              await supabase
                .from('client_output_destinations')
                .update({ last_published_at: new Date().toISOString() })
                .eq('id', dest.id);
            }
          } catch (connError) {
            console.error(`WordPress publish error for ${dest.display_name}:`, connError);
            results.push({
              destinationId: dest.id,
              displayName: dest.display_name,
              platform: 'wordpress',
              success: false,
              message: `Connector error: ${connError instanceof Error ? connError.message : 'Unknown'}`,
            });
          }
        } else {
          results.push({
            destinationId: dest.id,
            displayName: dest.display_name,
            platform: dest.destination_type,
            success: false,
            message: `Connector for '${dest.destination_type}' is not yet implemented`,
          });
        }
      }
    }

    // 5. Save updated publish_tracking back to the post
    await supabase
      .from('blog_posts')
      .update({ publish_tracking: publishTracking })
      .eq('id', postId);

    res.json({ staticHtml, results });
  } catch (error) {
    console.error('Publish orchestration error:', error);
    res.status(500).json({ message: 'Publish failed', error: error instanceof Error ? error.message : 'Unknown' });
  }
});

export default router;
