/**
 * Social Content Generator API Routes
 * Handles platform-aware social media content generation with brand intelligence
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { BrandContextLoader, FlatBrandContext } from '../services/brand-context-loader';

const router = Router();
const brandLoader = new BrandContextLoader();

// ============================================================================
// RATE LIMITING
// ============================================================================

// Global rate limiter for skill testing (3-second cooldown between ANY test requests)
// This prevents API spam when quickly switching between platforms/tones
let lastSkillTestTime = 0;
const SKILL_TEST_COOLDOWN_MS = 3000;

function checkSkillTestRateLimit(): { allowed: boolean; waitMs: number } {
  const now = Date.now();
  const elapsed = now - lastSkillTestTime;

  if (elapsed < SKILL_TEST_COOLDOWN_MS) {
    return { allowed: false, waitMs: SKILL_TEST_COOLDOWN_MS - elapsed };
  }

  lastSkillTestTime = now;
  return { allowed: true, waitMs: 0 };
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

// Supabase client for platform rules
const getSupabase = () => createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ============================================================================
// AI MODEL CONFIGURATIONS
// ============================================================================

type AIModel = 'gemini' | 'openai' | 'claude';

interface ModelConfig {
  name: string;
  displayName: string;
  inputCostPer1M: number;   // USD per 1M tokens
  outputCostPer1M: number;  // USD per 1M tokens
  avgLatencyMs: number;     // Typical response time
}

const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  gemini: {
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    avgLatencyMs: 1500
  },
  openai: {
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    avgLatencyMs: 2500
  },
  claude: {
    name: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    avgLatencyMs: 3000
  }
};

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// API URLs
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Unified AI call function - routes to appropriate provider
 */
async function callAI(
  model: AIModel,
  systemPrompt: string,
  temperature: number = 0.85
): Promise<{ text: string; model: string; latencyMs: number }> {
  const startTime = Date.now();
  let text = '';

  switch (model) {
    case 'gemini': {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: 2000,
            topP: 0.9
          }
        })
      });
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      break;
    }

    case 'openai': {
      if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
      const response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: systemPrompt }],
          temperature,
          max_tokens: 2000
        })
      });
      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const data = await response.json();
      text = data?.choices?.[0]?.message?.content || '';
      break;
    }

    case 'claude': {
      if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
      const response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature
        })
      });
      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
      const data = await response.json();
      text = data?.content?.[0]?.text || '';
      break;
    }

    default:
      throw new Error(`Unknown model: ${model}`);
  }

  return {
    text,
    model: MODEL_CONFIGS[model].displayName,
    latencyMs: Date.now() - startTime
  };
}

// ============================================================================
// GET AVAILABLE AI MODELS
// ============================================================================

router.get('/models', (req, res) => {
  // Check which models are actually configured
  const availableModels = Object.entries(MODEL_CONFIGS).map(([key, config]) => {
    let available = false;
    switch (key) {
      case 'gemini': available = !!GEMINI_API_KEY; break;
      case 'openai': available = !!OPENAI_API_KEY; break;
      case 'claude': available = !!ANTHROPIC_API_KEY; break;
    }
    return {
      key,
      ...config,
      available,
      // Calculate cost per 100 prompts (1,200 input + 300 output tokens each)
      costPer100: (
        (1200 * 100 / 1_000_000 * config.inputCostPer1M) +
        (300 * 100 / 1_000_000 * config.outputCostPer1M)
      ).toFixed(3)
    };
  });

  res.json({
    success: true,
    models: availableModels,
    defaultModel: 'gemini'
  });
});

// ============================================================================
// GET PLATFORM RULES
// ============================================================================

router.get('/platforms', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: platforms, error } = await supabase
      .from('platform_rules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    res.json({
      success: true,
      platforms: platforms || []
    });
  } catch (error) {
    console.error('❌ Error fetching platforms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platforms' });
  }
});

// ============================================================================
// GET FLAT BRAND CONTEXT
// ============================================================================

router.get('/brand-context/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const context = await brandLoader.loadFlatBrandContext(clientId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Brand profile not found'
      });
    }

    // Debug log to verify content_focus_options is being returned
    console.log(`🎯 Brand context loaded for ${context.client_name}:`, {
      content_focus_options: context.content_focus_options,
      hasOptions: context.content_focus_options?.length > 0
    });

    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('❌ Error fetching brand context:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch brand context' });
  }
});

// ============================================================================
// PREVIEW CONSTRUCTED PROMPT (for dev/fine-tuning visibility)
// ============================================================================

router.post('/preview-prompt', async (req, res) => {
  try {
    const { prompt, platform, tone, brandClientId } = req.body;
    const userPrompt = prompt?.trim() || '';

    const supabase = getSupabase();

    // Load brand context if provided
    let brandContext: FlatBrandContext | null = null;
    if (brandClientId) {
      brandContext = await brandLoader.loadFlatBrandContext(brandClientId);
    }

    // Load relevant skills AND platform rules
    const [skillsResult, platformRulesResult] = await Promise.all([
      supabase
        .from('ai_skills')
        .select('skill_key, system_prompt')
        .in('skill_key', [
          'content_enhancer',
          `platform_${platform}`,
          `tone_${tone}`,
          'brand_intel_summary'
        ])
        .eq('is_active', true),
      supabase
        .from('platform_rules')
        .select('*')
        .eq('platform_key', platform)
        .single()
    ]);

    const skills = skillsResult.data;
    const platformRule = platformRulesResult.data;

    // Build skill context map
    const skillMap = new Map<string, string>();
    skills?.forEach(s => skillMap.set(s.skill_key, s.system_prompt));

    // Build the full prompt (same as generation)
    const constructedPrompt = buildGenerationSystemPromptWithSkills(
      platformRule,
      brandContext,
      tone,
      userPrompt,
      skillMap
    );

    res.json({
      success: true,
      constructedPrompt,
      skillsUsed: Array.from(skillMap.keys())
    });

  } catch (error) {
    console.error('❌ Preview prompt error:', error);
    res.status(500).json({ success: false, error: 'Failed to construct prompt' });
  }
});

// ============================================================================
// GENERATE ALL SECTIONS (Option B: Skills as prompt context - 1 API call)
// ============================================================================

// Brand elements interface for filtering
interface BrandElements {
  industry: boolean;
  products: boolean;
  voice: boolean;
  audience: boolean;
  benefits: boolean;
  positiveExamples: boolean;
  negativeExamples: boolean;
  forbidden: boolean;
  spelling: boolean;
}

interface PreparedSkillOutputs {
  contentType: string | null;
  platform: string | null;
  tone: string | null;
  brand: string | null;
}

router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      platform,
      tone,
      contentType,  // NEW: Content type (behind_scenes, promo_offer, etc.)
      contentFocus,  // NEW: Content focus from brand's content_focus_options
      brandClientId,
      model = 'gemini',
      brandElements,
      preparedSkillOutputs  // NEW: Pre-computed skill outputs from two-stage flow
    } = req.body;
    const userPrompt = prompt?.trim() || '';  // Allow empty prompt
    const selectedModel = (model as AIModel) || 'gemini';
    const prepared = preparedSkillOutputs as PreparedSkillOutputs | null;

    // Default all brand elements to true if not provided
    const elements: BrandElements = brandElements || {
      industry: true, products: true, voice: true, audience: true,
      benefits: true, positiveExamples: true, negativeExamples: true,
      forbidden: true, spelling: true
    };

    const supabase = getSupabase();

    // Load brand context if provided
    let brandContext: FlatBrandContext | null = null;
    if (brandClientId) {
      brandContext = await brandLoader.loadFlatBrandContext(brandClientId);
    }

    // Load relevant skills for context (Option B: use as prompt context, not separate calls)
    const skillKeysToLoad = [
      'content_enhancer',
      `platform_${platform}`,
      `tone_${tone}`,
      'brand_intel_summary'
    ];

    // Add content type skill if provided
    if (contentType) {
      skillKeysToLoad.push(`content_type_${contentType}`);
    }

    // Load skills AND platform rules in parallel
    const [skillsResult, platformRulesResult] = await Promise.all([
      supabase
        .from('ai_skills')
        .select('skill_key, system_prompt')
        .in('skill_key', skillKeysToLoad)
        .eq('is_active', true),
      supabase
        .from('platform_rules')
        .select('*')
        .eq('platform_key', platform)
        .single()
    ]);

    const skills = skillsResult.data;
    const platformRule = platformRulesResult.data;

    // Helper to substitute template variables in skill prompts
    const substituteVars = (template: string, vars: Record<string, string | number | undefined>) => {
      let result = template;
      Object.entries(vars).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
      });
      return result;
    };

    // Build skill context map - use prepared outputs if available, otherwise use skill prompts
    const skillMap = new Map<string, string>();
    skills?.forEach(s => {
      // Check if we have a prepared output for this skill type
      if (prepared) {
        if (s.skill_key.startsWith('content_type_') && prepared.contentType) {
          skillMap.set(s.skill_key, prepared.contentType);
          return;
        }
        if (s.skill_key.startsWith('platform_') && prepared.platform) {
          skillMap.set(s.skill_key, prepared.platform);
          return;
        }
        if (s.skill_key.startsWith('tone_') && prepared.tone) {
          skillMap.set(s.skill_key, prepared.tone);
          return;
        }
        if (s.skill_key === 'brand_intel_summary' && prepared.brand) {
          skillMap.set(s.skill_key, prepared.brand);
          return;
        }
      }

      // For platform skills, substitute the actual character limits from platform_rules
      if (s.skill_key.startsWith('platform_') && platformRule) {
        const substituted = substituteVars(s.system_prompt, {
          hook_limit: platformRule.hook_limit,
          body_header_limit: platformRule.body_header_limit,
          body_limit: platformRule.body_limit,
          cta_limit: platformRule.cta_limit,
          emoji_style: platformRule.emoji_style,
          hashtag_count_min: platformRule.hashtag_count_min,
          hashtag_count_max: platformRule.hashtag_count_max
        });
        skillMap.set(s.skill_key, substituted);
        return;
      }

      // Fall back to skill's system prompt
      skillMap.set(s.skill_key, s.system_prompt);
    });

    // Build system prompt with skills as context + platform limits for strict enforcement
    const systemPrompt = buildGenerationSystemPromptWithSkills(
      platformRule,  // Pass platform limits for strict character enforcement
      brandContext,
      tone,
      userPrompt,
      skillMap,
      elements,
      contentType,
      contentFocus
    );

    // Call AI with selected model (unified interface)
    const { text: rawOutput, model: modelUsed, latencyMs } = await callAI(
      selectedModel,
      systemPrompt,
      0.85
    );

    // Parse sections from JSON response
    const sections = parseGeminiSections(rawOutput);

    console.log(`✅ Generated social content [${modelUsed}] in ${latencyMs}ms for ${platform}`, userPrompt ? '(with prompt)' : '(creative mode)');

    res.json({
      success: true,
      ...sections,
      metadata: {
        model: modelUsed,
        latencyMs,
        promptLength: systemPrompt.length
      }
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Content generation failed'
    });
  }
});

// ============================================================================
// ENHANCE INDIVIDUAL SECTION
// ============================================================================

router.post('/enhance-section', async (req, res) => {
  try {
    const {
      sectionKey,
      content,
      action,
      tone,
      customPrompt,
      platform,
      brandClientId,
      spelling = 'british'
    } = req.body;

    if (!sectionKey || (!content && action !== 'increase')) {
      return res.status(400).json({
        success: false,
        error: 'Section key and content are required'
      });
    }

    // Load platform rules for context
    const supabase = getSupabase();
    const { data: platformRule } = await supabase
      .from('platform_rules')
      .select('*')
      .eq('platform_key', platform)
      .single();

    // Load brand context if provided
    let brandContext: FlatBrandContext | null = null;
    if (brandClientId) {
      brandContext = await brandLoader.loadFlatBrandContext(brandClientId);
    }

    // Build enhancement prompt based on action
    const enhancementPrompt = buildEnhancementPrompt(
      sectionKey,
      content,
      action,
      { tone, customPrompt, platformRule, brandContext, spelling }
    );

    // Call Gemini API
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: enhancementPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiData = await response.json();
    let enhanced = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;

    // For rewrite action, if model returned multiple options, take only the first one
    if (action === 'rewrite' && sectionKey !== 'hashtags') {
      // Split by double newlines (common pattern for multiple options)
      const options = enhanced.split(/\n\n+/);
      if (options.length > 1) {
        enhanced = options[0].trim();
      }
    }

    res.json({
      success: true,
      enhanced
    });

  } catch (error) {
    console.error('❌ Enhancement error:', error);
    res.status(500).json({
      success: false,
      error: 'Enhancement failed',
      enhanced: req.body.content // Return original on failure
    });
  }
});

// ============================================================================
// AI SKILLS - CRUD Operations
// ============================================================================

router.get('/skills', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: skills, error } = await supabase
      .from('ai_skills')
      .select('*')
      .or('tool_context.eq.social_content,tool_context.eq.all')
      .eq('is_active', true)
      .order('stage', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      skills: skills || []
    });
  } catch (error) {
    console.error('❌ Error fetching skills:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch skills' });
  }
});

router.get('/skills/:skillKey', async (req, res) => {
  try {
    const { skillKey } = req.params;
    const supabase = getSupabase();

    const { data: skill, error } = await supabase
      .from('ai_skills')
      .select('*')
      .eq('skill_key', skillKey)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      skill
    });
  } catch (error) {
    console.error('❌ Error fetching skill:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch skill' });
  }
});

router.put('/skills/:skillKey', async (req, res) => {
  try {
    const { skillKey } = req.params;
    const { system_prompt, name, description, temperature, max_tokens } = req.body;

    const supabase = getSupabase();

    const { data: skill, error } = await supabase
      .from('ai_skills')
      .update({
        system_prompt,
        name,
        description,
        temperature,
        max_tokens,
        updated_at: new Date().toISOString()
      })
      .eq('skill_key', skillKey)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Updated skill:', skillKey);

    res.json({
      success: true,
      skill
    });
  } catch (error) {
    console.error('❌ Error updating skill:', error);
    res.status(500).json({ success: false, error: 'Failed to update skill' });
  }
});

// Test a skill with given input data (rate limited to prevent API spam)
router.post('/skills/test', async (req, res) => {
  try {
    const { skillKey, systemPrompt, inputData, temperature = 0.7 } = req.body;

    // Global rate limiting - prevents API spam when quickly switching platforms/tones
    const rateCheck = checkSkillTestRateLimit();

    if (!rateCheck.allowed) {
      console.log(`⏳ Rate limited skill test, wait ${rateCheck.waitMs}ms`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(rateCheck.waitMs / 1000),
        message: `Please wait ${Math.ceil(rateCheck.waitMs / 1000)} seconds before testing again`
      });
    }

    if (!systemPrompt) {
      return res.status(400).json({
        success: false,
        error: 'System prompt is required'
      });
    }

    // Replace template variables in the prompt
    let processedPrompt = systemPrompt;
    if (inputData) {
      Object.entries(inputData).forEach(([key, value]) => {
        processedPrompt = processedPrompt.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value) || ''
        );
      });
    }

    // Call Gemini to test the skill
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: processedPrompt }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: 1000,
          topP: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiData = await response.json();
    const output = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('✅ Tested skill:', skillKey || 'custom');

    res.json({
      success: true,
      output,
      processedPrompt
    });

  } catch (error) {
    console.error('❌ Skill test error:', error);
    res.status(500).json({
      success: false,
      error: 'Skill test failed'
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build generation prompt with skills as context (Option B)
 * Skills are SELF-CONTAINED - they include all limits and guidelines
 * No external table lookups needed
 * @param brandElements - Which brand context fields to include (user-toggled)
 */
// Content type labels for display
const CONTENT_TYPE_LABELS: Record<string, string> = {
  behind_scenes: 'Behind the Scenes',
  promo_offer: 'Promo/Offer',
  advert: 'Advertisement',
  statistic: 'Statistic',
  problem_solution: 'Problem/Solution',
  backstory: 'Back Story',
  curiosity: 'Curiosity',
  proud_announcement: 'Proud Announcement',
  project_excerpt: 'Project Excerpt',
  latest_news: 'Latest News',
  tip_hack: 'Tip/Hack',
  testimonial: 'Testimonial'
};

interface PlatformLimits {
  hook_limit: number;
  body_header_limit: number;
  body_limit: number;
  cta_limit: number;
  hashtag_count_min: number;
  hashtag_count_max: number;
}

function buildGenerationSystemPromptWithSkills(
  platformLimits: PlatformLimits | null,
  brandContext: FlatBrandContext | null,
  tone: string,
  userPrompt: string,
  skillMap: Map<string, string>,
  brandElements?: BrandElements,
  contentType?: string,
  contentFocus?: string | null
): string {
  // Default all elements to true if not provided
  const elements = brandElements || {
    industry: true, products: true, voice: true, audience: true,
    benefits: true, positiveExamples: true, negativeExamples: true,
    forbidden: true, spelling: true
  };

  // Get skill prompts (these are fully self-contained with all limits baked in)
  const enhancerSkill = skillMap.get('content_enhancer') || '';

  // Find the content type skill
  let contentTypeSkill = '';
  let contentTypeName = 'General';
  if (contentType) {
    contentTypeSkill = skillMap.get(`content_type_${contentType}`) || '';
    contentTypeName = CONTENT_TYPE_LABELS[contentType] || contentType.replace(/_/g, ' ');
  }

  // Find the platform skill (we need to check all platform keys)
  let platformSkill = '';
  let platformName = 'Social Media';
  Array.from(skillMap.entries()).forEach(([key, value]) => {
    if (key.startsWith('platform_') && !platformSkill) {
      platformSkill = value;
      platformName = key.replace('platform_', '').charAt(0).toUpperCase() + key.replace('platform_', '').slice(1);
    }
  });

  const toneSkill = skillMap.get(`tone_${tone}`) || '';

  let prompt = `You are an expert social media content writer. Generate engaging social media content.

=== MASTER INSTRUCTIONS ===
${enhancerSkill || 'Generate compelling, engaging content that fits the platform and tone.'}

=== CONTENT TYPE: ${contentTypeName.toUpperCase()} ===
${contentTypeSkill || 'Create content appropriate for the selected type.'}
${contentFocus ? `
=== CONTENT FOCUS: ${contentFocus.toUpperCase()} ===
Focus this content specifically on: ${contentFocus}
Ensure the hook, body, and CTA all relate to this specific area of the brand's offerings.
` : ''}
=== PLATFORM: ${platformName.toUpperCase()} ===
${platformSkill || 'Follow platform best practices.'}

=== TONE: ${tone.toUpperCase()} ===
${toneSkill || `Write in a ${tone} voice.`}

`;

  // Add brand context if available (filtered by user-selected elements)
  if (brandContext) {
    const brandLines: string[] = [];
    brandLines.push(`- Client: ${brandContext.client_name || 'Unknown'}`);

    if (elements.spelling) {
      brandLines.push(`- Spelling: Use ${brandContext.spelling} English`);
    }
    if (elements.industry && brandContext.industry_segment) {
      brandLines.push(`- Industry: ${brandContext.industry_segment}`);
    }
    if (elements.products && brandContext.products_services) {
      brandLines.push(`- Products/Services: ${brandContext.products_services}`);
    }
    if (elements.voice && brandContext.voice_tone) {
      brandLines.push(`- Voice: ${brandContext.voice_tone}`);
    }
    if (elements.audience && brandContext.target_audience) {
      brandLines.push(`- Target Audience: ${brandContext.target_audience}`);
    }
    if (elements.benefits && brandContext.priority_benefits?.length) {
      brandLines.push(`- Key Benefits: ${brandContext.priority_benefits.slice(0, 3).join(', ')}`);
    }

    if (brandLines.length > 1) {  // More than just client name
      prompt += `=== BRAND CONTEXT ===
${brandLines.join('\n')}

`;
    }

    // Add positive examples if enabled (few-shot learning)
    // NOTE: Softened instruction - examples are for TONE/VOICE only, not structure
    // The hook formulas in content_enhancer skill define STRUCTURE
    if (elements.positiveExamples && brandContext.positive_examples?.length) {
      prompt += `TONE REFERENCE EXAMPLES (match the voice/energy, NOT the structure):
These show the brand's personality and energy level. Use them to calibrate tone only.
The HOOK FORMULAS in Master Instructions define your actual opening structure.
${brandContext.positive_examples.slice(0, 3).map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

`;
    }

    // Add negative examples if enabled
    if (elements.negativeExamples && brandContext.negative_examples?.length) {
      prompt += `BAD CONTENT EXAMPLES (avoid this style):
${brandContext.negative_examples.slice(0, 2).map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

`;
    }

    // Add forbidden phrases if enabled
    if (elements.forbidden && brandContext.forbidden_phrases?.length) {
      prompt += `FORBIDDEN PHRASES (never use these):
${brandContext.forbidden_phrases.join(', ')}

`;
    }
  }

  // Add user prompt section
  prompt += `=== USER REQUEST ===
${userPrompt ? `Topic/Idea: "${userPrompt}"` : 'Generate an engaging post that fits the platform, tone, and brand. Pick a relevant topic, seasonal angle, tip, or evergreen theme.'}

=== OUTPUT FORMAT ===
Return ONLY valid JSON with these exact keys (no markdown, no explanation, no extra text).
${platformLimits ? `
⚠️ STRICT CHARACTER LIMITS - DO NOT EXCEED:
- hook: MAX ${platformLimits.hook_limit} characters
- bodyHeader: MAX ${platformLimits.body_header_limit} characters
- body: MAX ${platformLimits.body_limit} characters
- cta: MAX ${platformLimits.cta_limit} characters
- hashtags: ${platformLimits.hashtag_count_min}-${platformLimits.hashtag_count_max} hashtags
` : ''}
{
  "hook": "[scroll-stopping opener - MUST be under limit]",
  "bodyHeader": "[brief transition - MUST be under limit]",
  "body": "[main content - MUST be under limit]",
  "cta": "[clear action - MUST be under limit]",
  "hashtags": "#tag1 #tag2 #tag3..."
}`;

  return prompt;
}

function parseGeminiSections(rawOutput: string): {
  hook: string;
  bodyHeader: string;
  body: string;
  cta: string;
  hashtags: string;
} {
  const defaults = {
    hook: '',
    bodyHeader: '',
    body: '',
    cta: '',
    hashtags: ''
  };

  try {
    // Try to extract JSON from the response
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        hook: parsed.hook || '',
        bodyHeader: parsed.bodyHeader || parsed.body_header || '',
        body: parsed.body || '',
        cta: parsed.cta || '',
        hashtags: parsed.hashtags || ''
      };
    }
  } catch (e) {
    console.warn('Failed to parse JSON, attempting regex extraction');
  }

  // Fallback: regex extraction
  const hookMatch = rawOutput.match(/hook["\s:]+([^"]+)/i);
  const bodyHeaderMatch = rawOutput.match(/bodyHeader["\s:]+([^"]+)/i);
  const bodyMatch = rawOutput.match(/body["\s:]+([^"]+)/i);
  const ctaMatch = rawOutput.match(/cta["\s:]+([^"]+)/i);
  const hashtagsMatch = rawOutput.match(/(#\w+[\s#\w]*)/);

  return {
    hook: hookMatch?.[1]?.trim() || '',
    bodyHeader: bodyHeaderMatch?.[1]?.trim() || '',
    body: bodyMatch?.[1]?.trim() || '',
    cta: ctaMatch?.[1]?.trim() || '',
    hashtags: hashtagsMatch?.[1]?.trim() || ''
  };
}

// ============================================================================
// CONTENT HISTORY & FEEDBACK SYSTEM
// ============================================================================

interface QuickFeedback {
  rating: 'excellent' | 'good' | 'neutral' | 'poor';
  issue?: string; // Optional issue tag for 'poor' ratings
}

interface DetailedFeedback {
  // Summary feedback (overall rating)
  summary?: {
    score: number | null;
    issues: string[];
    otherText: string;
  };
  // Per-section ratings (1-9 scale)
  sectionRatings?: {
    hook?: number | null;
    bodyHeader?: number | null;
    body?: number | null;
    cta?: number | null;
    hashtags?: number | null;
  };
  // Per-section issues (quick feedback chips)
  sectionIssues?: {
    hook?: string[];
    body?: string[];
    cta?: string[];
    hashtags?: string[];
  };
  // Per-section custom comments
  sectionComments?: {
    hook?: string;
    body?: string;
    cta?: string;
    hashtags?: string;
  };
  tags?: string[];   // Summary issues for backward compatibility
  comment?: string;  // Summary comment for backward compatibility
}

interface ContentHistoryEntry {
  clientId: string;
  platform: string;
  tone: string;
  model: string;
  originalPrompt: string;
  brandElements: BrandElements;
  hook: string;
  bodyHeader: string;
  body: string;
  cta: string;
  hashtags: string;
  fullPrompt?: string;
  generationTimeMs?: number;
}

// Map quick rating to numeric score
const RATING_SCORES: Record<string, number> = {
  excellent: 9,
  good: 7,
  neutral: 5,
  poor: 2
};

/**
 * Save generated content to history (called after generation)
 * Stores both current content AND original AI output for modification tracking
 */
router.post('/history', async (req, res) => {
  try {
    const entry: ContentHistoryEntry = req.body;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('social_content_history')
      .insert({
        client_id: entry.clientId || null,
        platform: entry.platform,
        tone: entry.tone,
        model: entry.model,
        original_prompt: entry.originalPrompt,
        brand_elements: entry.brandElements,
        // Current content (may be modified later)
        hook: entry.hook,
        body_header: entry.bodyHeader,
        body: entry.body,
        cta: entry.cta,
        hashtags: entry.hashtags,
        assembled_content: `${entry.hook}\n\n${entry.bodyHeader}\n\n${entry.body}\n\n${entry.cta}\n\n${entry.hashtags}`,
        full_prompt: entry.fullPrompt,
        generation_time_ms: entry.generationTimeMs,
        // Original AI output (immutable - for training data)
        original_hook: entry.hook,
        original_body_header: entry.bodyHeader,
        original_body: entry.body,
        original_cta: entry.cta,
        original_hashtags: entry.hashtags,
        was_modified: false,
        is_curated_example: false
      })
      .select()
      .single();

    if (error) throw error;

    console.log('📝 Saved content to history:', data.id);

    res.json({ success: true, contentId: data.id });
  } catch (error) {
    console.error('❌ Error saving content history:', error);
    res.status(500).json({ success: false, error: 'Failed to save content history' });
  }
});

/**
 * Submit feedback for generated content
 * Handles both quick and detailed feedback
 * Auto-injects high/low rated content into brand profiles
 */
router.post('/feedback', async (req, res) => {
  try {
    const { contentId, quickFeedback, detailedFeedback, markProcessed, finalContent, iterationNumber } = req.body as {
      contentId: string;
      quickFeedback?: QuickFeedback;
      detailedFeedback?: DetailedFeedback;
      markProcessed?: boolean;
      iterationNumber?: number;  // Which rating iteration this is (1, 2, 3...)
      // Final content at feedback time (may differ from original)
      finalContent?: {
        hook: string;
        bodyHeader: string;
        body: string;
        cta: string;
        hashtags: string;
      };
    };

    if (!contentId) {
      return res.status(400).json({ success: false, error: 'Content ID is required' });
    }

    const supabase = getSupabase();

    // Build update object
    const updates: Record<string, any> = {
      rated_at: new Date().toISOString()
    };

    // If final content is provided, update it and detect modifications
    if (finalContent) {
      // First, fetch the original content to compare
      const { data: existing } = await supabase
        .from('social_content_history')
        .select('original_hook, original_body_header, original_body, original_cta, original_hashtags')
        .eq('id', contentId)
        .single();

      // Update the current content fields
      updates.hook = finalContent.hook;
      updates.body_header = finalContent.bodyHeader;
      updates.body = finalContent.body;
      updates.cta = finalContent.cta;
      updates.hashtags = finalContent.hashtags;
      updates.assembled_content = `${finalContent.hook}\n\n${finalContent.bodyHeader}\n\n${finalContent.body}\n\n${finalContent.cta}\n\n${finalContent.hashtags}`;

      // Detect if content was modified from original
      if (existing) {
        const wasModified =
          finalContent.hook !== existing.original_hook ||
          finalContent.bodyHeader !== existing.original_body_header ||
          finalContent.body !== existing.original_body ||
          finalContent.cta !== existing.original_cta ||
          finalContent.hashtags !== existing.original_hashtags;

        updates.was_modified = wasModified;
      }
    }

    // Support marking as processed for skill evolution
    if (markProcessed) {
      updates.processed_for_evolution = true;
    }

    if (quickFeedback) {
      updates.quick_rating = quickFeedback.rating;
      updates.quick_rating_score = RATING_SCORES[quickFeedback.rating];
      if (quickFeedback.issue) {
        updates.quick_issue = quickFeedback.issue;
      }
    }

    if (detailedFeedback) {
      // Summary feedback - use as quick rating if provided
      if (detailedFeedback.summary?.score) {
        updates.quick_rating_score = detailedFeedback.summary.score;
        // Map score to rating category for backward compatibility
        if (detailedFeedback.summary.score >= 8) updates.quick_rating = 'excellent';
        else if (detailedFeedback.summary.score >= 6) updates.quick_rating = 'good';
        else if (detailedFeedback.summary.score >= 4) updates.quick_rating = 'neutral';
        else updates.quick_rating = 'poor';
      }

      // Summary issues and comment
      if (detailedFeedback.summary?.issues?.length) {
        updates.feedback_tags = detailedFeedback.summary.issues;
      }
      if (detailedFeedback.summary?.otherText) {
        updates.feedback_comment = detailedFeedback.summary.otherText;
      }

      // Per-section ratings (stored as JSONB)
      if (detailedFeedback.sectionRatings) {
        updates.section_ratings = detailedFeedback.sectionRatings;
      }

      // Per-section issues (stored as JSONB)
      if (detailedFeedback.sectionIssues) {
        updates.section_issues = detailedFeedback.sectionIssues;
      }

      // Per-section comments (stored as JSONB)
      if (detailedFeedback.sectionComments) {
        updates.section_comments = detailedFeedback.sectionComments;
      }

      // Legacy fields for backward compatibility
      if (detailedFeedback.tags?.length) {
        updates.feedback_tags = detailedFeedback.tags;
      }
      if (detailedFeedback.comment) {
        updates.feedback_comment = detailedFeedback.comment;
      }
    }

    // Track iteration count
    if (iterationNumber) {
      updates.rating_iteration_count = iterationNumber;
    }

    // Track highest score ever given (for training - use best version)
    // We need to fetch current highest first to compare
    const { data: existing } = await supabase
      .from('social_content_history')
      .select('highest_rating_score')
      .eq('id', contentId)
      .single();

    const currentScore = updates.quick_rating_score;
    const existingHighest = existing?.highest_rating_score || 0;
    if (currentScore && currentScore > existingHighest) {
      updates.highest_rating_score = currentScore;
    }

    // Update content history with feedback
    const { data: content, error: updateError } = await supabase
      .from('social_content_history')
      .update(updates)
      .eq('id', contentId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`⭐ Feedback saved for content ${contentId}: ${quickFeedback?.rating || 'detailed'} (iteration ${iterationNumber || 1}, highest: ${content.highest_rating_score})`)

    // Auto-inject to brand profile if high/low rating
    const score = updates.quick_rating_score;
    if (content.client_id && (score >= 8 || score <= 3)) {
      await autoInjectToBrandProfile(supabase, content, score);
    }

    res.json({
      success: true,
      contentId,
      autoInjected: content.client_id && (score >= 8 || score <= 3)
    });
  } catch (error) {
    console.error('❌ Error saving feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to save feedback' });
  }
});

/**
 * Get content history for a client (with optional filters)
 */
router.get('/history', async (req, res) => {
  try {
    const { clientId, platform, limit = 50, offset = 0, onlyRated } = req.query;
    const supabase = getSupabase();

    let query = supabase
      .from('social_content_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }
    if (onlyRated === 'true') {
      query = query.not('quick_rating_score', 'is', null);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      history: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('❌ Error fetching content history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content history' });
  }
});

/**
 * Get pending feedback count for evolution review
 */
router.get('/pending-feedback-count', async (req, res) => {
  try {
    const supabase = getSupabase();

    const { count, error } = await supabase
      .from('social_content_history')
      .select('*', { count: 'exact', head: true })
      .eq('processed_for_evolution', false)
      .not('quick_rating_score', 'is', null);

    if (error) throw error;

    res.json({
      success: true,
      pendingCount: count || 0,
      readyForEvolution: (count || 0) >= 5
    });
  } catch (error) {
    console.error('❌ Error fetching pending count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending count' });
  }
});

/**
 * Auto-inject high/low rated content into brand profile examples
 */
async function autoInjectToBrandProfile(
  supabase: ReturnType<typeof getSupabase>,
  content: any,
  score: number
): Promise<void> {
  try {
    // Load current brand profile
    const { data: profile, error: loadError } = await supabase
      .from('client_brand_profiles')
      .select('positive_examples, negative_examples')
      .eq('client_id', content.client_id)
      .single();

    if (loadError || !profile) {
      console.log('No brand profile found for auto-injection');
      return;
    }

    // Build the example entry
    const example = {
      platform: content.platform,
      tone: content.tone,
      hook: content.hook,
      body: content.body?.substring(0, 200), // Truncate for storage
      rating: score,
      addedAt: new Date().toISOString(),
      source: 'auto_feedback'
    };

    const updates: Record<string, any> = {};

    if (score >= 8) {
      // Append to positive examples (limit to 10 most recent)
      const positiveExamples = Array.isArray(profile.positive_examples)
        ? profile.positive_examples
        : [];
      updates.positive_examples = [...positiveExamples, example].slice(-10);
      console.log(`✅ Auto-injected positive example to brand ${content.client_id}`);
    } else if (score <= 3) {
      // Append to negative examples (limit to 5 most recent)
      const negativeExamples = Array.isArray(profile.negative_examples)
        ? profile.negative_examples
        : [];
      updates.negative_examples = [...negativeExamples, example].slice(-5);
      console.log(`⚠️ Auto-injected negative example to brand ${content.client_id}`);
    }

    // Update brand profile
    await supabase
      .from('client_brand_profiles')
      .update(updates)
      .eq('client_id', content.client_id);

    // Mark content as injected
    await supabase
      .from('social_content_history')
      .update({ auto_injected_to_brand: true })
      .eq('id', content.id);

  } catch (error) {
    console.error('❌ Auto-inject to brand profile failed:', error);
    // Non-fatal - don't throw, just log
  }
}

/**
 * Mark feedbacks as processed for skill evolution
 * Called after skill evolution analysis has been applied
 */
router.put('/history/mark-processed', async (req, res) => {
  try {
    const { feedbackIds } = req.body;

    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'feedbackIds array is required'
      });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('social_content_history')
      .update({ processed_for_evolution: true })
      .in('id', feedbackIds);

    if (error) throw error;

    console.log(`✅ Marked ${feedbackIds.length} feedbacks as processed for evolution`);

    res.json({
      success: true,
      processedCount: feedbackIds.length,
      message: `${feedbackIds.length} feedbacks marked as processed`
    });
  } catch (error) {
    console.error('❌ Error marking feedbacks as processed:', error);
    res.status(500).json({ success: false, error: 'Failed to mark feedbacks as processed' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildEnhancementPrompt(
  sectionKey: string,
  content: string,
  action: string,
  options: {
    tone?: string;
    customPrompt?: string;
    platformRule?: any;
    brandContext?: FlatBrandContext | null;
    spelling: string;
  }
): string {
  const { tone, customPrompt, platformRule, brandContext, spelling } = options;

  const sectionNames: Record<string, string> = {
    hook: 'Hook (attention-grabbing opening)',
    bodyHeader: 'Body Header (subheading/transition)',
    body: 'Body (main content)',
    cta: 'Call to Action',
    hashtags: 'Hashtags'
  };

  const sectionName = sectionNames[sectionKey] || sectionKey;
  const isHashtags = sectionKey === 'hashtags';

  let prompt = `You are a social media content editor. Your task is to enhance the following ${sectionName}.

CURRENT CONTENT:
"${content}"

SPELLING: Use ${spelling} English spelling.
`;

  // Add action-specific instructions
  switch (action) {
    case 'reduce':
      if (isHashtags) {
        prompt += `\nTASK: Remove one hashtag from this list. Keep the most relevant ones.\n`;
      } else {
        prompt += `\nTASK: Reduce the word count by approximately 30-40%. Keep the core message but make it more concise.\n`;
      }
      break;
    case 'increase':
      if (isHashtags) {
        prompt += `\nTASK: Add one more relevant hashtag to this list.\n`;
      } else {
        prompt += `\nTASK: Expand the content by adding one more relevant sentence or detail. Increase length by about 30-40%.\n`;
      }
      break;
    case 'grammar':
      prompt += `\nTASK: Fix any grammar, spelling, or punctuation errors. Improve sentence flow while preserving the meaning.\n`;
      break;
    case 'rewrite':
      if (isHashtags) {
        prompt += `\nTASK: Generate a completely new set of hashtags (same count) that are relevant to the topic.\n`;
      } else {
        prompt += `\nTASK: Completely rewrite this content with fresh phrasing. Keep the same meaning but use different words and sentence structure. Provide ONE single rewrite only - do NOT provide multiple options or alternatives.\n`;
      }
      break;
    case 'tone':
      prompt += `\nTASK: Rewrite this content in a ${tone} tone. Adjust the language, energy, and style to match the ${tone} voice.\n`;
      break;
    case 'custom':
      prompt += `\nTASK: ${customPrompt}\n`;
      break;
  }

  // Add brand context for compliance
  if (brandContext?.forbidden_phrases?.length) {
    prompt += `\nIMPORTANT: AVOID these phrases: ${brandContext.forbidden_phrases.join(', ')}\n`;
  }

  prompt += `\nReturn ONLY the enhanced content with no explanations, quotes, or preamble. Just the improved text.`;

  return prompt;
}

// ============================================================================
// SKILL EVOLUTION ORCHESTRATOR
// Self-improving AI that analyses feedback and modifies skills
// ============================================================================

interface EvolutionModification {
  type: 'SKILL_INSTRUCTION' | 'SKILL_EXAMPLE' | 'BRAND_POSITIVE' | 'BRAND_NEGATIVE' | 'BRAND_FORBIDDEN' | 'DESCRIPTION_OVER_EXAMPLE' | 'ORCHESTRATOR_SELF';
  target: string;  // skill_key or client_id
  change: 'append' | 'replace' | 'remove' | 'rewrite';
  content: string;
  reasoning: string;
  confidence: number;
}

interface OrchestratorResponse {
  analysis_summary: string;
  modifications: EvolutionModification[];
  feedback_processed: string[];
  self_improvement_note?: string;
}

/**
 * GET evolution stats for dashboard
 */
router.get('/evolution/stats', async (req, res) => {
  try {
    const supabase = getSupabase();

    // Get pending feedback count
    const { count: pendingCount } = await supabase
      .from('social_content_history')
      .select('*', { count: 'exact', head: true })
      .eq('processed_for_evolution', false)
      .not('quick_rating_score', 'is', null);

    // Get evolution cycle count
    const { data: lastEvolution } = await supabase
      .from('skill_evolution_log')
      .select('evolution_cycle')
      .order('evolution_cycle', { ascending: false })
      .limit(1)
      .single();

    // Get recent modifications
    const { data: recentMods } = await supabase
      .from('skill_evolution_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      stats: {
        pendingFeedbackCount: pendingCount || 0,
        totalEvolutionCycles: lastEvolution?.evolution_cycle || 0,
        recentModifications: recentMods || [],
        readyForEvolution: (pendingCount || 0) >= 3
      }
    });
  } catch (error) {
    console.error('❌ Error fetching evolution stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch evolution stats' });
  }
});

/**
 * POST /api/social-content/evolve
 * Triggers the skill evolution orchestrator
 * Uses OpenAI GPT-4o for analysis and decision-making
 */
router.post('/evolve', async (req, res) => {
  const startTime = Date.now();

  try {
    const supabase = getSupabase();

    // 1. Load pending feedback (unprocessed rated content)
    const { data: pendingFeedback, error: feedbackError } = await supabase
      .from('social_content_history')
      .select('*')
      .eq('processed_for_evolution', false)
      .not('quick_rating_score', 'is', null)
      .order('rated_at', { ascending: false })
      .limit(50);

    if (feedbackError) throw feedbackError;

    if (!pendingFeedback || pendingFeedback.length === 0) {
      return res.json({
        success: true,
        message: 'No pending feedback to process',
        modificationsApplied: 0
      });
    }

    console.log(`🔄 Evolution: Processing ${pendingFeedback.length} pending feedback entries`);

    // 2. Load current skills (including orchestrator's own skill)
    const { data: skills, error: skillsError } = await supabase
      .from('ai_skills')
      .select('skill_key, name, system_prompt')
      .eq('is_active', true);

    if (skillsError) throw skillsError;

    // 3. Get unique client IDs for brand context loading
    const clientIds = [...new Set(pendingFeedback
      .filter(f => f.client_id)
      .map(f => f.client_id))];

    // Load brand profiles for these clients
    const { data: brandProfiles } = await supabase
      .from('client_brand_profiles')
      .select('client_id, positive_examples, negative_examples, forbidden_phrases')
      .in('client_id', clientIds.length > 0 ? clientIds : ['none']);

    // 4. Get the orchestrator's own skill prompt
    const orchestratorSkill = skills?.find(s => s.skill_key === 'evolution_orchestrator');
    if (!orchestratorSkill) {
      throw new Error('Evolution orchestrator skill not found in database');
    }

    // 5. Calculate current evolution cycle
    const { data: lastCycle } = await supabase
      .from('skill_evolution_log')
      .select('evolution_cycle')
      .order('evolution_cycle', { ascending: false })
      .limit(1)
      .single();

    const currentCycle = (lastCycle?.evolution_cycle || 0) + 1;

    // 6. Build comprehensive input for orchestrator
    const orchestratorInput = buildOrchestratorInput(
      pendingFeedback,
      skills || [],
      brandProfiles || []
    );

    // 7. Call OpenAI with orchestrator skill
    const fullPrompt = `${orchestratorSkill.system_prompt}

=== CURRENT EVOLUTION CYCLE: ${currentCycle} ===

${orchestratorInput}

Remember:
- Return valid JSON only
- Confidence must be ≥0.7 for any modification
- For self-modification (ORCHESTRATOR_SELF), confidence must be ≥0.9
- Prefer small, targeted changes over large rewrites`;

    console.log('🧠 Calling OpenAI for evolution analysis...');

    const { text: rawResponse, latencyMs } = await callAI('openai', fullPrompt, 0.4);

    // 8. Parse orchestrator response
    let orchestratorResponse: OrchestratorResponse;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in orchestrator response');
      }
      orchestratorResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse orchestrator response:', rawResponse);
      throw new Error('Failed to parse orchestrator response as JSON');
    }

    console.log(`📊 Orchestrator analysis: ${orchestratorResponse.analysis_summary}`);
    console.log(`📝 Proposed modifications: ${orchestratorResponse.modifications?.length || 0}`);

    // 9. Apply modifications with logging
    const appliedModifications: any[] = [];

    for (const mod of orchestratorResponse.modifications || []) {
      // Skip low-confidence modifications
      if (mod.confidence < 0.7) {
        console.log(`⏭️ Skipping low-confidence modification (${mod.confidence}): ${mod.type} on ${mod.target}`);
        continue;
      }

      // For self-modification, require higher confidence
      if (mod.type === 'ORCHESTRATOR_SELF' && mod.confidence < 0.9) {
        console.log(`⏭️ Skipping self-modification with insufficient confidence (${mod.confidence})`);
        continue;
      }

      try {
        const applied = await applyEvolutionModification(supabase, mod, currentCycle, latencyMs);
        if (applied) {
          appliedModifications.push(applied);
        }
      } catch (modError) {
        console.error(`❌ Failed to apply modification:`, mod, modError);
        // Continue with other modifications
      }
    }

    // 10. Mark feedback as processed
    const feedbackIds = pendingFeedback.map(f => f.id);
    await supabase
      .from('social_content_history')
      .update({
        processed_for_evolution: true,
        evolution_cycle_processed: currentCycle
      })
      .in('id', feedbackIds);

    const totalTime = Date.now() - startTime;

    console.log(`✅ Evolution cycle ${currentCycle} complete: ${appliedModifications.length} modifications applied in ${totalTime}ms`);

    res.json({
      success: true,
      evolutionCycle: currentCycle,
      feedbackProcessed: feedbackIds.length,
      modificationsApplied: appliedModifications.length,
      modifications: appliedModifications,
      analysisSummary: orchestratorResponse.analysis_summary,
      selfImprovementNote: orchestratorResponse.self_improvement_note,
      processingTimeMs: totalTime
    });

  } catch (error) {
    console.error('❌ Evolution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Evolution process failed'
    });
  }
});

/**
 * Build comprehensive input for the orchestrator
 */
function buildOrchestratorInput(
  feedback: any[],
  skills: any[],
  brandProfiles: any[]
): string {
  // Calculate feedback stats
  const avgScore = feedback.reduce((sum, f) => sum + (f.quick_rating_score || 0), 0) / feedback.length;
  const poorCount = feedback.filter(f => f.quick_rating_score <= 3).length;
  const goodCount = feedback.filter(f => f.quick_rating_score >= 7).length;

  // Group issues
  const issueCounts: Record<string, number> = {};
  feedback.forEach(f => {
    if (f.quick_issue) {
      issueCounts[f.quick_issue] = (issueCounts[f.quick_issue] || 0) + 1;
    }
    // Also count section-level issues
    if (f.section_issues) {
      Object.values(f.section_issues).forEach((issues: any) => {
        if (Array.isArray(issues)) {
          issues.forEach(issue => {
            issueCounts[issue] = (issueCounts[issue] || 0) + 1;
          });
        }
      });
    }
  });

  // Group by platform/tone
  const platformStats: Record<string, { count: number; avgScore: number }> = {};
  const toneStats: Record<string, { count: number; avgScore: number }> = {};

  feedback.forEach(f => {
    // Platform stats
    if (!platformStats[f.platform]) {
      platformStats[f.platform] = { count: 0, avgScore: 0 };
    }
    platformStats[f.platform].count++;
    platformStats[f.platform].avgScore += f.quick_rating_score || 0;

    // Tone stats
    if (!toneStats[f.tone]) {
      toneStats[f.tone] = { count: 0, avgScore: 0 };
    }
    toneStats[f.tone].count++;
    toneStats[f.tone].avgScore += f.quick_rating_score || 0;
  });

  // Calculate averages
  Object.keys(platformStats).forEach(p => {
    platformStats[p].avgScore /= platformStats[p].count;
  });
  Object.keys(toneStats).forEach(t => {
    toneStats[t].avgScore /= toneStats[t].count;
  });

  let input = `=== UNPROCESSED FEEDBACK SUMMARY ===
Total entries: ${feedback.length}
Average score: ${avgScore.toFixed(1)}/9
Poor ratings (≤3): ${poorCount}
Good ratings (≥7): ${goodCount}

=== ISSUE FREQUENCY ===
${Object.entries(issueCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([issue, count]) => `- "${issue}": ${count}x`)
  .join('\n') || '(no issues reported)'}

=== PLATFORM PERFORMANCE ===
${Object.entries(platformStats)
  .map(([platform, stats]) => `- ${platform}: ${stats.count} entries, avg ${stats.avgScore.toFixed(1)}/9`)
  .join('\n')}

=== TONE PERFORMANCE ===
${Object.entries(toneStats)
  .map(([tone, stats]) => `- ${tone}: ${stats.count} entries, avg ${stats.avgScore.toFixed(1)}/9`)
  .join('\n')}

=== SAMPLE LOW-RATED CONTENT (score ≤3) ===
${feedback
  .filter(f => f.quick_rating_score <= 3)
  .slice(0, 5)
  .map(f => `
Platform: ${f.platform} | Tone: ${f.tone} | Score: ${f.quick_rating_score}
Issue: ${f.quick_issue || 'none'}
Hook: "${f.hook}"
Body: "${f.body?.substring(0, 200)}..."
${f.was_modified ? '(User modified from original)' : '(Unmodified AI output)'}
---`)
  .join('\n') || '(no low-rated content)'}

=== SAMPLE HIGH-RATED CONTENT (score ≥7) ===
${feedback
  .filter(f => f.quick_rating_score >= 7)
  .slice(0, 5)
  .map(f => `
Platform: ${f.platform} | Tone: ${f.tone} | Score: ${f.quick_rating_score}
Hook: "${f.hook}"
Body: "${f.body?.substring(0, 200)}..."
${f.was_modified ? '(User modified from original)' : '(Unmodified AI output)'}
---`)
  .join('\n') || '(no high-rated content yet)'}

=== CURRENT SKILLS ===
${skills.map(s => `
### ${s.skill_key} (${s.name || s.skill_key})
${s.system_prompt.substring(0, 500)}${s.system_prompt.length > 500 ? '...' : ''}
`).join('\n')}

=== CURRENT BRAND PROFILES ===
${brandProfiles.map(bp => `
Client ID: ${bp.client_id}
Positive examples: ${bp.positive_examples?.length || 0}
Negative examples: ${bp.negative_examples?.length || 0}
Forbidden phrases: ${bp.forbidden_phrases?.join(', ') || 'none'}
`).join('\n') || '(no brand profiles)'}

=== FEEDBACK IDS TO PROCESS ===
${feedback.map(f => f.id).join(', ')}
`;

  return input;
}

/**
 * Apply a single evolution modification and log it
 */
async function applyEvolutionModification(
  supabase: ReturnType<typeof getSupabase>,
  mod: EvolutionModification,
  evolutionCycle: number,
  processingTimeMs: number
): Promise<any | null> {
  let targetType: string;
  let previousValue: string | null = null;
  let newValue: string | null = null;

  switch (mod.type) {
    case 'SKILL_INSTRUCTION':
    case 'SKILL_EXAMPLE':
    case 'DESCRIPTION_OVER_EXAMPLE':
    case 'ORCHESTRATOR_SELF': {
      targetType = mod.type === 'ORCHESTRATOR_SELF' ? 'orchestrator_self' : 'skill';

      // Fetch current skill
      const { data: skill } = await supabase
        .from('ai_skills')
        .select('system_prompt')
        .eq('skill_key', mod.target)
        .single();

      if (!skill) {
        console.log(`⚠️ Skill not found: ${mod.target}`);
        return null;
      }

      previousValue = skill.system_prompt;

      // Apply modification based on change type
      switch (mod.change) {
        case 'append':
          newValue = skill.system_prompt + '\n\n' + mod.content;
          break;
        case 'replace':
        case 'rewrite':
          newValue = mod.content;
          break;
        case 'remove':
          newValue = skill.system_prompt.replace(mod.content, '');
          break;
        default:
          newValue = skill.system_prompt + '\n\n' + mod.content;
      }

      // Update skill
      await supabase
        .from('ai_skills')
        .update({
          system_prompt: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('skill_key', mod.target);

      console.log(`✏️ Updated skill: ${mod.target} (${mod.change})`);
      break;
    }

    case 'BRAND_POSITIVE':
    case 'BRAND_NEGATIVE':
    case 'BRAND_FORBIDDEN': {
      targetType = mod.type.toLowerCase();

      // Fetch current brand profile
      const { data: profile } = await supabase
        .from('client_brand_profiles')
        .select('positive_examples, negative_examples, forbidden_phrases')
        .eq('client_id', mod.target)
        .single();

      if (!profile) {
        console.log(`⚠️ Brand profile not found: ${mod.target}`);
        return null;
      }

      const fieldMap: Record<string, keyof typeof profile> = {
        BRAND_POSITIVE: 'positive_examples',
        BRAND_NEGATIVE: 'negative_examples',
        BRAND_FORBIDDEN: 'forbidden_phrases'
      };
      const field = fieldMap[mod.type];
      const currentArray = (profile[field] as any[]) || [];

      previousValue = JSON.stringify(currentArray);

      // Apply modification
      let newArray: any[];
      switch (mod.change) {
        case 'append':
          newArray = [...currentArray, mod.content];
          // Enforce limits
          if (mod.type === 'BRAND_POSITIVE') newArray = newArray.slice(-10);
          if (mod.type === 'BRAND_NEGATIVE') newArray = newArray.slice(-5);
          break;
        case 'remove':
          newArray = currentArray.filter(item =>
            typeof item === 'string' ? item !== mod.content : JSON.stringify(item) !== mod.content
          );
          break;
        default:
          newArray = [...currentArray, mod.content];
      }

      newValue = JSON.stringify(newArray);

      // Update brand profile
      await supabase
        .from('client_brand_profiles')
        .update({ [field]: newArray })
        .eq('client_id', mod.target);

      console.log(`📝 Updated brand profile: ${mod.target} (${field})`);
      break;
    }

    default:
      console.log(`⚠️ Unknown modification type: ${mod.type}`);
      return null;
  }

  // Log the modification
  const { data: logEntry, error: logError } = await supabase
    .from('skill_evolution_log')
    .insert({
      target_type: targetType,
      target_key: mod.target,
      change_type: mod.change,
      previous_value: previousValue,
      new_value: newValue,
      reasoning: mod.reasoning,
      confidence: mod.confidence,
      evolution_cycle: evolutionCycle,
      model_used: 'gpt-4o-mini',
      processing_time_ms: processingTimeMs
    })
    .select()
    .single();

  if (logError) {
    console.error('❌ Failed to log evolution:', logError);
  }

  return {
    type: mod.type,
    target: mod.target,
    change: mod.change,
    reasoning: mod.reasoning,
    confidence: mod.confidence,
    logId: logEntry?.id
  };
}

/**
 * GET /api/social-content/evolution/log
 * Retrieve evolution history for review
 */
router.get('/evolution/log', async (req, res) => {
  try {
    const { limit = 50, offset = 0, cycle } = req.query;
    const supabase = getSupabase();

    let query = supabase
      .from('skill_evolution_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (cycle) {
      query = query.eq('evolution_cycle', Number(cycle));
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      log: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('❌ Error fetching evolution log:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch evolution log' });
  }
});

/**
 * POST /api/social-content/evolution/rollback/:logId
 * Rollback a specific evolution modification
 */
router.post('/evolution/rollback/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const supabase = getSupabase();

    // Get the log entry
    const { data: logEntry, error: fetchError } = await supabase
      .from('skill_evolution_log')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError || !logEntry) {
      return res.status(404).json({ success: false, error: 'Log entry not found' });
    }

    if (logEntry.rolled_back) {
      return res.status(400).json({ success: false, error: 'Already rolled back' });
    }

    // Restore previous value
    if (logEntry.target_type === 'skill' || logEntry.target_type === 'orchestrator_self') {
      await supabase
        .from('ai_skills')
        .update({
          system_prompt: logEntry.previous_value,
          updated_at: new Date().toISOString()
        })
        .eq('skill_key', logEntry.target_key);
    } else {
      // Brand profile rollback
      const fieldMap: Record<string, string> = {
        brand_positive: 'positive_examples',
        brand_negative: 'negative_examples',
        brand_forbidden: 'forbidden_phrases'
      };
      const field = fieldMap[logEntry.target_type];
      if (field) {
        await supabase
          .from('client_brand_profiles')
          .update({ [field]: JSON.parse(logEntry.previous_value) })
          .eq('client_id', logEntry.target_key);
      }
    }

    // Mark as rolled back
    await supabase
      .from('skill_evolution_log')
      .update({
        rolled_back: true,
        rolled_back_at: new Date().toISOString(),
        rolled_back_by: 'manual'
      })
      .eq('id', logId);

    console.log(`↩️ Rolled back evolution: ${logId}`);

    res.json({
      success: true,
      message: 'Modification rolled back successfully',
      logId
    });
  } catch (error) {
    console.error('❌ Rollback error:', error);
    res.status(500).json({ success: false, error: 'Rollback failed' });
  }
});

export default router;
