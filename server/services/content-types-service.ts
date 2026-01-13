/**
 * Content Types Service
 * Manages content type definitions for prompt enhancement
 */

import { createClient } from '@supabase/supabase-js';

export interface ContentType {
  id: string;
  type_key: string;
  label: string;
  description: string;
  word_limit: number | null;
  character_limit: number | null;
  guidelines: string;
  system_prompt: string;
  is_active: boolean;
  sort_order: number;
}

export class ContentTypesService {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  
  private cache = new Map<string, ContentType>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getContentType(typeKey: string): Promise<ContentType | null> {
    // Check cache first
    if (this.isCacheValid(typeKey)) {
      return this.cache.get(typeKey) || null;
    }

    try {
      const { data, error } = await this.supabase
        .from('content_types')
        .select('*')
        .eq('type_key', typeKey)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error(`❌ Content type fetch error for ${typeKey}:`, error);
        return null;
      }

      // Cache the result
      if (data) {
        this.cache.set(typeKey, data);
        this.cacheExpiry.set(typeKey, Date.now() + this.CACHE_TTL);
      }

      return data;
    } catch (error) {
      console.error(`❌ Content type service error for ${typeKey}:`, error);
      return null;
    }
  }

  async getAllContentTypes(): Promise<ContentType[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Content types fetch error:', error);
      return [];
    }
  }

  getSystemPrompt(typeKey: string, contentType: ContentType | null): string {
    if (!contentType) {
      // Fallback to hardcoded prompts if not found in database
      return this.getFallbackSystemPrompt(typeKey);
    }

    let systemPrompt = contentType.system_prompt;

    // Add content constraints if specified
    if (contentType.word_limit) {
      systemPrompt += `\n\nIMPORTANT: Keep the enhanced prompt within ${contentType.word_limit} words.`;
    }
    
    if (contentType.character_limit) {
      systemPrompt += `\n\nIMPORTANT: Keep the enhanced prompt within ${contentType.character_limit} characters.`;
    }

    // Add content guidelines
    if (contentType.guidelines) {
      systemPrompt += `\n\nGUIDELINES: ${contentType.guidelines}`;
    }

    // Add the critical instruction for clean output
    systemPrompt += `\n\nCRITICAL: Return ONLY the enhanced prompt. No introductions, explanations, preambles, formatting markers, asterisks, or labels like "Enhanced Prompt:". Just the direct, clean prompt text that can be immediately copy-pasted.`;

    return systemPrompt;
  }

  private getFallbackSystemPrompt(typeKey: string): string {
    const fallbacks: Record<string, string> = {
      image: 'You are an expert AI image prompt engineer. Create enhanced prompts for image generation that are descriptive and technically optimized. Return ONLY the enhanced prompt with no explanations.',
      video: `You are an expert AI video prompt engineer for VEO video generation.

ABSOLUTE RULES - NEVER include ANY of these (they waste compute and produce bad results):
- NEVER use the word "fade" in any context (no fade to black, fade to white, fade in, fade out, crossfade)
- NEVER use "cut", "edit", "transition", "dissolve", "wipe"
- NEVER use "final shot", "opening shot", "next scene", "new angle", "switch to"
- NEVER describe multiple shots or scenes
- NEVER suggest any post-production editing

THE VIDEO MUST BE:
- ONE single continuous unbroken shot from start to finish
- ONE camera perspective throughout (no angle changes)
- Smooth gradual movement only

ALLOWED camera movements:
- Slow pan left/right
- Slow tilt up/down
- Smooth dolly forward/backward
- Gentle orbit around subject
- Subtle zoom in/out
- Static locked camera
- Smooth tracking shot

Your output should describe motion and action within ONE continuous take.
The video starts and ends - there is no fade, no transition, just the shot.

Return ONLY the enhanced prompt. No explanations.`,
      caption: 'You are an expert social media caption writer. Enhance prompts to be engaging and platform-appropriate. Keep within 100 words. Return ONLY the enhanced prompt with no explanations.',
      blog: 'You are an expert content writer. Enhance prompts for comprehensive blog articles. Return ONLY the enhanced prompt with no explanations.',
      script: 'You are an expert scriptwriter for voice content. Enhance prompts for natural speech flow and engaging delivery. Return ONLY the enhanced prompt with no explanations.'
    };

    return fallbacks[typeKey] || 'You are an expert prompt engineer. Enhance the given prompt to be more effective and detailed. Return ONLY the enhanced prompt with no explanations.';
  }

  private isCacheValid(typeKey: string): boolean {
    const expiry = this.cacheExpiry.get(typeKey);
    return expiry !== undefined && Date.now() < expiry;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}