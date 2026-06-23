/**
 * AI Prompt Overrides API Routes
 * Manages client-specific system prompt customisations
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const router = Router();

// Supabase admin client (WebSocket transport for Node.js 20)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { realtime: { transport: WebSocket } }
);

// Valid prompt components
const VALID_COMPONENTS = ['system', 'enhancement_no_assets', 'enhancement_with_assets', 'gemini_config'];

// Default system prompts (fallbacks)
const DEFAULT_PROMPTS: Record<string, Record<string, string>> = {
  image: {
    system: `You are an expert AI image prompt engineer. Your task is to enhance prompts for image generation to be more descriptive, visually compelling, and technically optimized for AI image models.

Focus on:
- Visual details: lighting, composition, colours, textures
- Style guidance: photorealistic, cinematic, illustrated, etc.
- Technical parameters: aspect ratio considerations, resolution hints
- Mood and atmosphere: emotional tone, time of day, weather

IMPORTANT: Return ONLY the enhanced prompt. No introductions, explanations, or formatting markers.`,

    enhancement_no_assets: `You are an expert image prompt engineer. The user has provided a brief creative concept. Your job is to elaborate it into a rich, detailed image generation prompt.

YOUR TASK:
Take the user's short concept and expand it into a detailed, evocative image prompt. Add:
- Specific visual details that bring the scene to life
- Atmospheric elements (lighting, time of day, weather, mood)
- Camera perspective and lens characteristics (wide angle, macro, depth of field)
- Composition guidance (rule of thirds, leading lines, foreground interest)
- Material textures and surface qualities
- Colour palette suggestions that match the mood

Keep the user's core idea intact but enrich it with professional photography/art direction knowledge.`,

    enhancement_with_assets: `You are an expert image prompt engineer. The user has uploaded reference images and provided a creative concept. Your job is to elaborate their vision into a rich, cinematic image prompt.

ADD FREELY:
- Dramatic lighting (golden hour, rim lighting, soft diffused, dramatic shadows)
- Atmospheric mood (misty, ethereal, energetic, serene, electric)
- Camera craft (shallow depth of field, wide angle drama, macro detail, dynamic angle)
- Surface textures and material qualities (glossy reflections, matte surfaces, fabric textures)
- Environmental atmosphere (floating particles, light rays, subtle bokeh)
- Motion and energy (frozen motion, gentle movement, dynamic action)
- Colour grading and mood (warm tones, cool blues, vibrant saturation)

DO NOT:
- Describe what's IN the reference images (their appearance, colours, shapes)
- Add new people, products, or objects the user didn't mention
- Remove elements the user requested`,

    gemini_config: JSON.stringify({
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 800
    }, null, 2)
  },

  video: {
    system: `You are an expert AI video prompt engineer for VEO video generation.

ABSOLUTE RULES - NEVER include ANY of these:
- NEVER use "fade", "cut", "transition", "dissolve", "wipe"
- NEVER use "final shot", "opening shot", "next scene", "new angle"
- NEVER describe multiple shots or scenes
- NEVER suggest any post-production editing

THE VIDEO MUST BE:
- ONE single continuous unbroken shot
- ONE camera perspective throughout
- Smooth gradual movement only

ALLOWED camera movements: slow pan, slow tilt, smooth dolly, gentle orbit, subtle zoom, static camera.

Return ONLY the enhanced prompt. No explanations.`,

    enhancement_no_assets: `Transform the user's video concept into a single continuous shot description. Focus on motion, camera movement, and atmosphere within ONE unbroken take.`,

    enhancement_with_assets: `Using the provided reference image as a starting frame, describe what happens NEXT. Focus on motion and camera movement within ONE continuous shot.`,

    gemini_config: JSON.stringify({
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 600
    }, null, 2)
  },

  caption: {
    system: `You are an expert social media caption writer. Enhance prompts to be engaging, platform-appropriate, and compelling. Focus on hooks, engagement, and concise impactful messaging. Keep within 100 words. Return ONLY the enhanced prompt.`,
    enhancement_no_assets: `Create an engaging social media caption from the user's concept.`,
    enhancement_with_assets: `Create an engaging social media caption that complements the visual content.`,
    gemini_config: JSON.stringify({ temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 200 }, null, 2)
  },

  blog: {
    system: `You are an expert content writer specializing in blog articles. Enhance prompts to be comprehensive, well-structured, and valuable for readers. Focus on clarity, depth, SEO optimization, and reader engagement. Return ONLY the enhanced prompt.`,
    enhancement_no_assets: `Expand the user's blog topic into a structured article outline.`,
    enhancement_with_assets: `Expand the user's blog topic incorporating visual elements for engagement.`,
    gemini_config: JSON.stringify({ temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1500 }, null, 2)
  },

  script: {
    system: `You are an expert scriptwriter for voice and audio content. Enhance prompts for natural speech flow, clear pronunciation, and engaging delivery. Focus on pacing, tone, and audio-friendly language. Return ONLY the enhanced prompt.`,
    enhancement_no_assets: `Convert the concept into natural spoken dialogue with clear pacing.`,
    enhancement_with_assets: `Create a voiceover script that complements the visual content.`,
    gemini_config: JSON.stringify({ temperature: 0.6, topK: 40, topP: 0.95, maxOutputTokens: 1000 }, null, 2)
  }
};

/**
 * GET /api/ai-prompt-overrides/:contentType
 * Get the active system prompt for a content type
 * Query params:
 *   - clientId (optional) - specific client's prompt
 *   - component (optional) - prompt component: 'system', 'enhancement_no_assets', 'enhancement_with_assets', 'gemini_config'
 */
router.get('/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params;
    const { clientId, component } = req.query;
    const promptComponent = (component as string) || 'system';

    // Validate content type
    if (!['image', 'video', 'caption', 'blog', 'script'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // Validate prompt component
    if (!VALID_COMPONENTS.includes(promptComponent)) {
      return res.status(400).json({ error: 'Invalid prompt component' });
    }

    let prompt = null;

    // 1. Try client-specific prompt if clientId provided
    if (clientId) {
      const { data: clientPrompt } = await supabase
        .from('ai_prompt_overrides')
        .select('*')
        .eq('client_id', clientId)
        .eq('content_type', contentType)
        .eq('prompt_component', promptComponent)
        .eq('is_active', true)
        .single();

      if (clientPrompt) {
        prompt = clientPrompt;
      }
    }

    // 2. Try global prompt (client_id is null)
    if (!prompt) {
      const { data: globalPrompt } = await supabase
        .from('ai_prompt_overrides')
        .select('*')
        .is('client_id', null)
        .eq('content_type', contentType)
        .eq('prompt_component', promptComponent)
        .eq('is_active', true)
        .single();

      if (globalPrompt) {
        prompt = globalPrompt;
      }
    }

    // 3. Fall back to hardcoded default
    if (!prompt) {
      const defaultPrompt = DEFAULT_PROMPTS[contentType]?.[promptComponent] ||
                           DEFAULT_PROMPTS.image?.[promptComponent] ||
                           DEFAULT_PROMPTS.image.system;
      return res.json({
        id: null,
        client_id: null,
        content_type: contentType,
        prompt_component: promptComponent,
        prompt_text: defaultPrompt,
        is_active: true,
        is_default: true, // Flag to indicate this is the hardcoded fallback
        created_at: null,
        updated_at: null
      });
    }

    res.json({ ...prompt, is_default: false });
  } catch (error) {
    console.error('Error fetching prompt override:', error);
    res.status(500).json({ error: 'Failed to fetch prompt override' });
  }
});

/**
 * POST /api/ai-prompt-overrides
 * Create or update a system prompt override
 */
router.post('/', async (req, res) => {
  try {
    const { clientId, contentType, promptComponent, promptText, createdBy } = req.body;
    const component = promptComponent || 'system';

    // Validate required fields
    if (!contentType || !promptText) {
      return res.status(400).json({ error: 'contentType and promptText are required' });
    }

    // Validate content type
    if (!['image', 'video', 'caption', 'blog', 'script'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // Validate prompt component
    if (!VALID_COMPONENTS.includes(component)) {
      return res.status(400).json({ error: 'Invalid prompt component' });
    }

    // Build the filter for checking existing records
    let query = supabase
      .from('ai_prompt_overrides')
      .select('id')
      .eq('content_type', contentType)
      .eq('prompt_component', component)
      .eq('is_active', true);

    // Handle null client_id properly
    if (clientId) {
      query = query.eq('client_id', clientId);
    } else {
      query = query.is('client_id', null);
    }

    const { data: existing } = await query.single();

    if (existing) {
      // Update existing prompt
      const { data, error } = await supabase
        .from('ai_prompt_overrides')
        .update({
          prompt_text: promptText,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ ...data, updated: true });
    }

    // Create new prompt
    const { data, error } = await supabase
      .from('ai_prompt_overrides')
      .insert({
        client_id: clientId || null,
        content_type: contentType,
        prompt_component: component,
        prompt_text: promptText,
        is_active: true,
        created_by: createdBy || null
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, created: true });
  } catch (error) {
    console.error('Error saving prompt override:', error);
    res.status(500).json({ error: 'Failed to save prompt override' });
  }
});

/**
 * DELETE /api/ai-prompt-overrides/:id
 * Delete (deactivate) a prompt override
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ai_prompt_overrides')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Prompt override deactivated' });
  } catch (error) {
    console.error('Error deleting prompt override:', error);
    res.status(500).json({ error: 'Failed to delete prompt override' });
  }
});

/**
 * GET /api/ai-prompt-overrides/default/:contentType
 * Get the hardcoded default prompt for a content type
 * Query params: component (optional) - prompt component
 */
router.get('/default/:contentType', async (req, res) => {
  const { contentType } = req.params;
  const { component } = req.query;
  const promptComponent = (component as string) || 'system';

  if (!DEFAULT_PROMPTS[contentType]) {
    return res.status(404).json({ error: 'No default prompt for this content type' });
  }

  const defaultPrompt = DEFAULT_PROMPTS[contentType][promptComponent];
  if (!defaultPrompt) {
    return res.status(404).json({ error: `No default ${promptComponent} prompt for ${contentType}` });
  }

  res.json({
    content_type: contentType,
    prompt_component: promptComponent,
    prompt_text: defaultPrompt,
    is_default: true
  });
});

/**
 * GET /api/ai-prompt-overrides/all/:contentType
 * Get all prompt components for a content type
 * Query params: clientId (optional) - specific client's prompts
 */
router.get('/all/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params;
    const { clientId } = req.query;

    // Validate content type
    if (!['image', 'video', 'caption', 'blog', 'script'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const result: Record<string, any> = {};

    // Fetch all components for this content type
    for (const component of VALID_COMPONENTS) {
      let prompt = null;

      // 1. Try client-specific prompt if clientId provided
      if (clientId) {
        const { data: clientPrompt } = await supabase
          .from('ai_prompt_overrides')
          .select('*')
          .eq('client_id', clientId)
          .eq('content_type', contentType)
          .eq('prompt_component', component)
          .eq('is_active', true)
          .single();

        if (clientPrompt) {
          prompt = clientPrompt;
        }
      }

      // 2. Try global prompt (client_id is null)
      if (!prompt) {
        const { data: globalPrompt } = await supabase
          .from('ai_prompt_overrides')
          .select('*')
          .is('client_id', null)
          .eq('content_type', contentType)
          .eq('prompt_component', component)
          .eq('is_active', true)
          .single();

        if (globalPrompt) {
          prompt = globalPrompt;
        }
      }

      // 3. Fall back to hardcoded default
      if (!prompt) {
        const defaultPrompt = DEFAULT_PROMPTS[contentType]?.[component] ||
                             DEFAULT_PROMPTS.image?.[component];
        result[component] = {
          id: null,
          client_id: null,
          content_type: contentType,
          prompt_component: component,
          prompt_text: defaultPrompt || '',
          is_active: true,
          is_default: true,
          created_at: null,
          updated_at: null
        };
      } else {
        result[component] = { ...prompt, is_default: false };
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching all prompt overrides:', error);
    res.status(500).json({ error: 'Failed to fetch prompt overrides' });
  }
});

export default router;
