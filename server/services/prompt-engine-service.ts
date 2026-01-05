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

    // 4. Build enhanced system prompt
    const systemPrompt = this.buildSystemPrompt(request, brandContext, contentType);

    // 5. Call Gemini API
    const geminiResult = await this.callGeminiAPI(systemPrompt, request.prompt);

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

    // Add technical parameters
    if (request.artStyle) {
      systemPrompt += `\\n\\nART STYLE: ${request.artStyle}`;
    }
    if (request.imageStyle) {
      systemPrompt += `\\nIMAGE STYLE: ${request.imageStyle}`;
    }
    if (request.targetLength) {
      systemPrompt += `\\nTARGET LENGTH: Approximately ${request.targetLength} words`;
    }

    systemPrompt += `\\n\\nPLEASE ENHANCE THE FOLLOWING PROMPT:`;

    return systemPrompt;
  }

  private getBaseSystemPrompt(contentType: string): string {
    switch (contentType) {
      case 'image':
        return `You are an expert AI image prompt engineer. Your task is to enhance prompts for image generation to be more descriptive, visually compelling, and technically optimized for AI image models. Focus on visual details, composition, lighting, style, and mood.`;
        
      case 'video':
        return `You are an expert video content prompt engineer. Enhance prompts for video generation and scripting. Focus on scene descriptions, visual flow, pacing, and cinematic elements that work well for video content.`;
        
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

  private async callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<any> {
    console.log('🤖 Calling Gemini API for prompt enhancement...');
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\\n\\n"${userPrompt}"`
              }]
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
    const enhancedPrompt = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || request.prompt;

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
}