/**
 * Brand Context Loader Service
 * Loads and processes brand profile data for prompt enhancement
 */

import { createClient } from '@supabase/supabase-js';

export interface BrandContext {
  client_name?: string;
  client_website?: string;
  client_brand_profiles: Array<{
    business_niche?: string;
    color_personality?: string;
    visual_mood?: string;
    visual_style_notes?: string;
    voice_rules?: {
      tone?: string;
      humor?: string;
      sentence_length?: string;
    };
    language?: string;
    spelling?: string;
    target_audience_description?: string;
    priority_benefits?: string[];
    positive_examples?: string[];
    forbidden_phrases?: string[];
    notes?: string;
  }>;
}

export class BrandContextLoader {
  
  async loadBrandContext(clientId: string): Promise<BrandContext | null> {
    try {
      console.log(`🧠 Loading brand context for client: ${clientId}`);
      
      // Create Supabase client for server-side operations
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      // Load client with brand profile data
      const { data: client, error } = await supabase
        .from('content_clients')
        .select(`
          *,
          client_brand_profiles (*)
        `)
        .eq('id', clientId)
        .single();

      if (error) {
        console.error('Error loading brand context:', error);
        return null;
      }

      if (!client || !client.client_brand_profiles?.length) {
        console.log('No brand profile found for client');
        return null;
      }

      // Process and validate brand profile data
      const profile = client.client_brand_profiles[0];
      
      // Ensure voice_rules is properly parsed if it's a string
      if (typeof profile.voice_rules === 'string') {
        try {
          profile.voice_rules = JSON.parse(profile.voice_rules);
        } catch (e) {
          console.warn('Failed to parse voice_rules JSON:', e);
          profile.voice_rules = {};
        }
      }

      // Ensure arrays are properly handled
      if (typeof profile.priority_benefits === 'string') {
        profile.priority_benefits = profile.priority_benefits.split(',').map((s: string) => s.trim());
      }
      
      if (typeof profile.positive_examples === 'string') {
        profile.positive_examples = profile.positive_examples.split(',').map((s: string) => s.trim());
      }
      
      if (typeof profile.forbidden_phrases === 'string') {
        profile.forbidden_phrases = profile.forbidden_phrases.split(',').map((s: string) => s.trim());
      }

      console.log(`✅ Brand context loaded successfully for ${client.name}`);
      
      return {
        client_name: client.name,
        client_website: client.website,
        client_brand_profiles: [profile]
      };
      
    } catch (error) {
      console.error('❌ Failed to load brand context:', error);
      return null;
    }
  }

  /**
   * Get available brand features for a client
   */
  async getAvailableFeatures(clientId: string): Promise<string[]> {
    const context = await this.loadBrandContext(clientId);
    if (!context?.client_brand_profiles?.[0]) return [];

    const profile = context.client_brand_profiles[0];
    const features: string[] = [];

    // Check which features have data
    if (profile.business_niche) features.push('industry');
    if (profile.color_personality || profile.visual_mood) features.push('visual');
    if (profile.voice_rules?.tone) features.push('voice');
    if (profile.target_audience_description) features.push('audience');
    if (profile.priority_benefits?.length) features.push('benefits');
    if (profile.positive_examples?.length) features.push('guidelines');
    if (profile.forbidden_phrases?.length) features.push('compliance');

    return features;
  }
}