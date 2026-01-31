/**
 * Prompt Engine Service
 * Core business logic for brand-aware prompt enhancement
 */

import { BrandContextLoader } from './brand-context-loader';
import { ContentTypesService } from './content-types-service';

export interface PromptEngineRequest {
  prompt: string;
  contentType: 'image' | 'video' | 'caption' | 'blog' | 'script';
  brandContext?: {
    clientId: string;
    enabledFeatures: string[];
  };
  artStyle?: string;
  imageStyle?: string;
  targetLength?: number;
  // Optional starting frame image for video enhancement (base64 with mime prefix)
  startingFrameImage?: string;
}

export interface PromptEngineResult {
  enhancedPrompt: string;
  alternatives: string[];
  brandInfluence: {
    appliedIndustry?: string;
    appliedVisual?: string;
    appliedVoice?: string;
  } | null;
}

export class PromptEngineService {
  private geminiApiKey = process.env.GEMINI_API_KEY;
  private brandLoader = new BrandContextLoader();
  private contentTypesService = new ContentTypesService();
  private lastRequestTime = 0;
  private minRequestInterval = 2000; // 2 seconds minimum between requests

  constructor() {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }
  }

  async enhancePrompt(request: PromptEngineRequest): Promise<PromptEngineResult> {
    // 1. Rate limiting
    await this.enforceRateLimit();

    // 2. Load content type definition
    const contentType = await this.contentTypesService.getContentType(request.contentType);

    // 3. Load brand context
    const brandContext = request.brandContext 
      ? await this.brandLoader.loadBrandContext(request.brandContext.clientId).catch(() => null)
      : null;

    // 4. Build enhanced system prompt (adjusts based on whether image is provided)
    const systemPrompt = this.buildSystemPrompt(request, brandContext, contentType);

    // 5. Call Gemini API (with optional image for video content)
    const geminiResult = await this.callGeminiAPI(systemPrompt, request.prompt, request.startingFrameImage);

    // 6. Process and return results
    return this.processResults(geminiResult, request, brandContext);
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before API call...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private buildSystemPrompt(request: PromptEngineRequest, brandContext: any, contentType: any): string {
    // Use content type system prompt (with fallback to old method)
    let systemPrompt = this.contentTypesService.getSystemPrompt(request.contentType, contentType);

    // Add brand intelligence if available
    if (brandContext && request.brandContext?.enabledFeatures) {
      systemPrompt += this.buildBrandContext(brandContext, request.brandContext.enabledFeatures, request.contentType);
    }

    // Special handling for video with starting frame image
    if (request.contentType === 'video' && request.startingFrameImage) {
      systemPrompt += `

CRITICAL - A starting frame image IS PROVIDED. You can SEE this image.

The image IS the opening frame. The camera position is ALREADY SET. DO NOT:
- Describe the scene (it's already visible in the image)
- Define a starting camera position (the image IS the starting position)
- Say "camera starts at" or "opening on" or "we see" (we already see it)
- Invent elements not visible in the image

YOUR ONLY JOB is to describe what happens NEXT from this exact frame:
- Take the user's motion intent and ELABORATE on it
- Describe the camera movement that continues FROM this frame
- Describe any motion of elements visible in the frame
- Use SLOW, SMOOTH, GRADUAL movement descriptors
- Add cinematic quality words but stay true to user's intent

SPEED CONTROL - Always specify slow speeds:
- "very slow pan" not "pan"
- "gentle gradual zoom" not "zoom"
- "smooth unhurried dolly" not "dolly"
- "leisurely orbit" not "orbit"

Output format: Just describe what happens from the starting frame onwards.
Example: "Very slow dolly forward, the steam from the cup rises gently, soft focus shift to background, warm golden light intensifies gradually"`;
    } else if (request.contentType === 'video') {
      systemPrompt += `

NOTE: No starting frame image provided. Describe the scene AND the motion.
Use SLOW movement speeds: "very slow pan", "gentle zoom", "gradual dolly".`;
    }

    // Add technical parameters
    if (request.artStyle) {
      systemPrompt += `\n\nART STYLE: ${request.artStyle}`;
    }
    if (request.imageStyle) {
      systemPrompt += `\nIMAGE STYLE: ${request.imageStyle}`;
    }
    if (request.targetLength) {
      systemPrompt += `\nTARGET LENGTH: Approximately ${request.targetLength} words`;
    }

    systemPrompt += `\n\nPLEASE ENHANCE THE FOLLOWING PROMPT:`;

    return systemPrompt;
  }

  private getBaseSystemPrompt(contentType: string): string {
    switch (contentType) {
      case 'image':
        return `You are an expert AI image prompt engineer. Your task is to enhance prompts for image generation to be more descriptive, visually compelling, and technically optimized for AI image models. Focus on visual details, composition, lighting, style, and mood.`;
        
      case 'video':
        return `You are an expert AI video prompt engineer for VEO video generation.

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

ALLOWED camera movements: slow pan, slow tilt, smooth dolly, gentle orbit, subtle zoom, static camera, smooth tracking.

Your output should describe motion and action within ONE continuous take.`;
        
      case 'caption':
        return `You are an expert social media caption writer. Enhance prompts to be engaging, platform-appropriate, and compelling for social media audiences. Focus on hooks, engagement, and concise impactful messaging.`;
        
      case 'blog':
        return `You are an expert content writer specializing in blog articles. Enhance prompts to be comprehensive, well-structured, and valuable for readers. Focus on clarity, depth, SEO optimization, and reader engagement.`;
        
      case 'script':
        return `You are an expert scriptwriter for voice and audio content. Enhance prompts for natural speech flow, clear pronunciation, and engaging delivery. Focus on pacing, tone, and audio-friendly language.`;
        
      default:
        return `You are an expert prompt engineer. Enhance the given prompt to be more effective, detailed, and optimized for its intended purpose.`;
    }
  }

  private buildBrandContext(brandContext: any, enabledFeatures: string[], contentType: string): string {
    let context = '';
    const profile = brandContext.client_brand_profiles?.[0];
    const clientName = brandContext.client_name;
    const clientWebsite = brandContext.client_website;
    
    if (!profile) return context;

    // Basic Business Information
    if (clientName || clientWebsite) {
      context += `\\n\\nBUSINESS INFORMATION:`;
      if (clientName) {
        context += ` Company name is "${clientName}".`;
      }
      if (clientWebsite) {
        context += ` Website is ${clientWebsite}.`;
      }
    }

    // Industry Context
    if (enabledFeatures.includes('industry') && profile.business_niche) {
      context += `\\n\\nINDUSTRY CONTEXT: This content is for ${clientName || 'a business'} in ${profile.business_niche}.`;
      
      // Extract industry from notes field if available
      if (profile.notes && profile.notes.includes('Industry:')) {
        const industry = profile.notes.split('Industry:')[1]?.split('\\n')[0]?.trim();
        if (industry) {
          context += ` They operate specifically in ${industry}.`;
        }
      }
    }

    // Visual Style (for visual content types)
    if (enabledFeatures.includes('visual') && ['image', 'video'].includes(contentType)) {
      if (profile.color_personality) {
        context += `\\n\\nVISUAL STYLE: Color personality should be ${profile.color_personality}.`;
      }
      if (profile.visual_mood) {
        context += ` Visual mood: ${profile.visual_mood}.`;
      }
      if (profile.visual_style_notes) {
        context += ` Style notes: ${profile.visual_style_notes}.`;
      }
    }

    // Voice & Tone (for text-heavy content)
    if (enabledFeatures.includes('voice') && ['caption', 'blog', 'script', 'video'].includes(contentType)) {
      if (profile.voice_rules) {
        context += `\\n\\nVOICE & TONE: Use ${profile.voice_rules.tone || 'professional'} tone`;
        
        if (profile.voice_rules.humor) {
          context += ` with ${profile.voice_rules.humor} humor`;
        }
        
        if (profile.voice_rules.sentence_length) {
          context += ` and ${profile.voice_rules.sentence_length} sentences`;
        }
        
        context += '.';
      }

      // Language and spelling
      if (profile.language && profile.spelling) {
        context += ` Use ${profile.language} language with ${profile.spelling} spelling.`;
      }
    }

    // Target Audience
    if (enabledFeatures.includes('audience') && profile.target_audience_description) {
      context += `\\n\\nTARGET AUDIENCE: ${profile.target_audience_description}`;
    }

    // Key Messages/Benefits
    if (enabledFeatures.includes('benefits') && profile.priority_benefits?.length) {
      context += `\\n\\nKEY BENEFITS TO HIGHLIGHT: ${profile.priority_benefits.slice(0, 3).join(', ')}`;
    }

    // Content Guidelines
    if (enabledFeatures.includes('guidelines') && profile.positive_examples?.length) {
      context += `\\n\\nCONTENT STYLE EXAMPLES: Follow these positive examples: ${profile.positive_examples.slice(0, 2).join('; ')}`;
    }

    // Compliance Rules
    if (enabledFeatures.includes('compliance') && profile.forbidden_phrases?.length) {
      context += `\\n\\nIMPORTANT: Avoid these prohibited terms: ${profile.forbidden_phrases.join(', ')}`;
    }

    return context;
  }

  private async callGeminiAPI(systemPrompt: string, userPrompt: string, imageBase64?: string): Promise<any> {
    console.log('🤖 Calling Gemini API for prompt enhancement...');

    try {
      // Build parts array - text only or multimodal (image + text)
      const parts: any[] = [];

      // If image provided, add it first (helps Gemini understand context)
      if (imageBase64) {
        // Extract mime type and base64 data from data URL
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const sizeKB = Math.round((base64Data.length * 3/4) / 1024);
          console.log(`🖼️ Including image in multimodal request: ${mimeType}, ~${sizeKB}KB`);

          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        } else {
          console.warn('⚠️ Image provided but could not parse base64 data URL format');
        }
      } else {
        console.log('📝 Text-only request (no image)');
      }

      // Add the text prompt
      parts.push({
        text: `${systemPrompt}\n\n"${userPrompt}"`
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: parts
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
              topP: 0.9,
              topK: 40
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      throw error;
    }
  }

  private processResults(geminiResult: any, request: PromptEngineRequest, brandContext: any): PromptEngineResult {
    // Extract enhanced prompt from Gemini response
    let enhancedPrompt = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || request.prompt;

    // For video content, strip any forbidden words that slipped through
    if (request.contentType === 'video') {
      enhancedPrompt = this.sanitizeVideoPrompt(enhancedPrompt);
    }

    // Create brand influence summary
    const brandInfluence = this.createBrandInfluenceSummary(brandContext, request.brandContext?.enabledFeatures || []);

    // Generate simple alternatives (for now, return variations)
    const alternatives = this.generateAlternatives(enhancedPrompt);

    return {
      enhancedPrompt,
      alternatives,
      brandInfluence
    };
  }

  private createBrandInfluenceSummary(brandContext: any, enabledFeatures: string[]) {
    if (!brandContext || !enabledFeatures.length) return null;

    const profile = brandContext.client_brand_profiles?.[0];
    const clientName = brandContext.client_name;
    if (!profile) return null;

    const influence: any = {};

    // Basic business info
    if (clientName) {
      influence.appliedBusiness = clientName;
    }

    // All 6 brand intelligence categories
    if (enabledFeatures.includes('industry') && profile.business_niche) {
      influence.appliedIndustry = profile.business_niche;
    }

    if (enabledFeatures.includes('visual') && profile.color_personality) {
      influence.appliedVisual = profile.color_personality;
    }

    if (enabledFeatures.includes('voice') && profile.voice_rules?.tone) {
      influence.appliedVoice = profile.voice_rules.tone;
    }

    if (enabledFeatures.includes('audience') && profile.target_audience_description) {
      influence.appliedAudience = profile.target_audience_description.substring(0, 50) + '...';
    }

    if (enabledFeatures.includes('benefits') && profile.priority_benefits?.length) {
      influence.appliedBenefits = profile.priority_benefits.slice(0, 2).join(', ');
    }

    if (enabledFeatures.includes('guidelines') && profile.positive_examples?.length) {
      influence.appliedGuidelines = `${profile.positive_examples.length} content examples`;
    }

    if (enabledFeatures.includes('compliance') && profile.forbidden_phrases?.length) {
      influence.appliedCompliance = `${profile.forbidden_phrases.length} prohibited terms`;
    }

    return Object.keys(influence).length > 0 ? influence : null;
  }

  private generateAlternatives(enhancedPrompt: string): string[] {
    // For now, return empty array - can be enhanced later with additional Gemini calls
    // or prompt variation techniques
    return [];
  }

  async getAvailableContentTypes() {
    return await this.contentTypesService.getAllContentTypes();
  }

  // Strip forbidden video editing terms that might slip through
  private sanitizeVideoPrompt(prompt: string): string {
    // Patterns to remove (case insensitive)
    const forbiddenPatterns = [
      /\bfade\s*(to|in|out|from)?\s*(black|white|color)?\b/gi,
      /\bcrossfade\b/gi,
      /\bdissolve\b/gi,
      /\bwipe\s*(to|from)?\b/gi,
      /\bcut\s*(to|away)?\b/gi,
      /\bjump\s*cut\b/gi,
      /\bfinal\s*shot\b/gi,
      /\bopening\s*shot\b/gi,
      /\bnext\s*scene\b/gi,
      /\bnew\s*angle\b/gi,
      /\bswitch\s*(to|angle|perspective)\b/gi,
      /\btransition\s*(to|into)?\b/gi,
      /\bends?\s*with\s*(a\s*)?(fade|black|white)\b/gi,
      /\bbegins?\s*with\s*(a\s*)?(fade|black|white)\b/gi,
      /,?\s*fading\s*(to|into|out)?\s*(black|white)?\s*\.?/gi,
      /\.\s*fade\s*(to|out|in)\s*(black|white)?\.?$/gi,
    ];

    let sanitized = prompt;
    let modified = false;

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '');
        modified = true;
      }
    }

    // Clean up double spaces, trailing commas, etc.
    sanitized = sanitized
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*\./g, '.')
      .replace(/\.\s*\./g, '.')
      .replace(/^\s*,\s*/g, '')
      .replace(/\s*,\s*$/g, '')
      .trim();

    if (modified) {
      console.log('🧹 Sanitized video prompt - removed forbidden editing terms');
    }

    return sanitized;
  }
}