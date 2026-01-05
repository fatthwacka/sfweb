/**
 * AI Prompt Analyzer Service
 * Analyzes article content and generates intelligent image prompts using Gemini
 */

export interface ArticleContext {
  headline?: string;
  hook?: string;
  content?: string;
}

export interface PromptAnalysisRequest {
  articleContext: ArticleContext;
  artStyle: string;
  imageStyle: string;
}

export interface StandalonePromptRequest {
  userPrompt: string;
  artStyle: string;
  imageStyle: string;
  includeTitle?: boolean;
  includeSubtitle?: boolean;
  titleText?: string;
  subtitleText?: string;
}

export interface PromptAnalysisResult {
  suggestedPrompt: string;
  analysisReasoning: string;
  alternativePrompts: string[];
  keyVisualElements: string[];
}

export class AIPromptAnalyzer {
  private geminiApiKey = process.env.GEMINI_API_KEY;
  private lastRequestTime = 0;
  private minRequestInterval = 2000; // 2 seconds minimum between requests

  constructor() {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }
  }

  async analyzeContent(request: PromptAnalysisRequest): Promise<PromptAnalysisResult> {
    console.log('🧠 Starting AI prompt analysis...');
    
    // Rate limiting - ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before API call...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    const analysisPrompt = this.buildAnalysisPrompt(request);
    
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
                text: analysisPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Gemini API error:', response.status, errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const analysisText = result.candidates[0].content.parts[0].text;
      const parsedAnalysis = this.parseAnalysisResponse(analysisText);

      console.log('✅ AI prompt analysis completed successfully');
      
      return parsedAnalysis;

    } catch (error: any) {
      console.error('💥 Error analyzing content:', error);
      
      // Add delay on any error to prevent spam retries
      if (error.message.includes('429') || error.message.includes('quota')) {
        console.log('⏳ Rate limit hit - adding 5 second delay...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('⏳ Adding 2 second delay after error...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error(`Prompt analysis failed: ${error.message}`);
    }
  }

  async enhanceStandalonePrompt(request: StandalonePromptRequest): Promise<PromptAnalysisResult> {
    console.log('✨ Starting standalone prompt enhancement...');
    
    // Rate limiting - ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before API call...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    const enhancementPrompt = this.buildStandalonePrompt(request);
    
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
                text: enhancementPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1200,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Gemini API error:', response.status, errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const enhancementText = result.candidates[0].content.parts[0].text;
      const parsedEnhancement = this.parseAnalysisResponse(enhancementText);

      console.log('✅ Standalone prompt enhancement completed successfully');
      
      return parsedEnhancement;

    } catch (error: any) {
      console.error('💥 Error enhancing prompt:', error);
      
      // Add delay on any error to prevent spam retries
      if (error.message.includes('429') || error.message.includes('quota')) {
        await this.delay(5000);
      }
      
      throw error;
    }
  }

  private buildAnalysisPrompt(request: PromptAnalysisRequest): string {
    const { articleContext, artStyle, imageStyle } = request;

    return `
You are an expert AI image prompt engineer specializing in creating compelling visual content for articles. Analyze the following article content and generate optimized image prompts for ${artStyle} style ${imageStyle} images.

ARTICLE CONTENT:
${articleContext.headline ? `Headline: "${articleContext.headline}"` : ''}
${articleContext.hook ? `Hook/Subtitle: "${articleContext.hook}"` : ''}
${articleContext.content ? `Content Preview: "${articleContext.content.slice(0, 500)}..."` : ''}

TARGET STYLE:
- Art Style: ${artStyle}
- Image Style: ${imageStyle}

TASK:
Generate a comprehensive image prompt analysis in the following JSON format:

{
  "suggestedPrompt": "The main optimized prompt for image generation",
  "analysisReasoning": "Brief explanation of why this prompt captures the article essence",
  "alternativePrompts": ["alternative prompt 1", "alternative prompt 2", "alternative prompt 3"],
  "keyVisualElements": ["element 1", "element 2", "element 3", "element 4"]
}

PROMPT ENGINEERING GUIDELINES:
1. Extract the core theme and emotion from the article content
2. Include relevant visual metaphors that relate to the topic
3. Consider the target style (${artStyle} + ${imageStyle})
4. Avoid including actual text/typography in the image prompt
5. Focus on visual elements: composition, lighting, colors, subjects, environment
6. Make prompts specific enough to generate relevant images but flexible enough for creativity
7. Consider the intended audience and article context

For ${artStyle} style:
- If photorealistic: Focus on realistic scenes, proper lighting, authentic environments
- If illustrated: Include artistic elements, creative compositions, stylized features  
- If arty: Emphasize creative interpretation, unique angles, artistic expression
- If minimalist: Stress clean compositions, simple elements, negative space
- If cinematic: Include dramatic lighting, movie-like composition, depth
- If abstract: Focus on conceptual representations, symbolic elements

For ${imageStyle} composition:
- If hero: Wide format suitable, impactful composition, banner-appropriate
- If lifestyle: Natural settings, authentic feel, relatable scenarios
- If professional: Business-appropriate, polished look, formal environment
- If casual: Relaxed atmosphere, informal style, approachable feel
- If dramatic: High contrast, striking composition, bold elements
- If corporate: Business environment, professional atmosphere, clean aesthetic

RESPOND ONLY WITH THE JSON OBJECT - NO ADDITIONAL TEXT.
`;
  }

  private buildStandalonePrompt(request: StandalonePromptRequest): string {
    const { userPrompt, artStyle, imageStyle, includeTitle, includeSubtitle, titleText, subtitleText } = request;

    // Build text overlay instructions
    let textOverlayInstructions = '';
    const overlayRequests = [];
    
    if (includeTitle && titleText) {
      overlayRequests.push(`prominently display the title text "${titleText}" at the top of the image`);
    }
    
    if (includeSubtitle && subtitleText) {
      overlayRequests.push(`include the subtitle text "${subtitleText}" in smaller text below the main title`);
    }
    
    if (overlayRequests.length > 0) {
      textOverlayInstructions = `\n\nTEXT OVERLAY REQUIREMENTS:
The enhanced prompt MUST include instructions to ${overlayRequests.join(' and ')}. Position the text overlays prominently but naturally within the composition, ensuring they are readable against the background.`;
    }

    return `
You are an expert AI image prompt engineer specializing in enhancing user prompts for professional image generation. Transform the following user prompt into an optimized prompt for ${artStyle} style ${imageStyle} images.

USER PROMPT:
"${userPrompt}"

TARGET STYLE:
- Art Style: ${artStyle}
- Image Style: ${imageStyle}${textOverlayInstructions}

TASK:
Enhance and optimize the user prompt, then provide a comprehensive analysis in the following JSON format:

{
  "suggestedPrompt": "The enhanced and optimized prompt for image generation",
  "analysisReasoning": "Brief explanation of the improvements made to the original prompt",
  "alternativePrompts": ["alternative enhanced prompt 1", "alternative enhanced prompt 2", "alternative enhanced prompt 3"],
  "keyVisualElements": ["enhanced element 1", "enhanced element 2", "enhanced element 3", "enhanced element 4"]
}

ENHANCEMENT GUIDELINES:
1. Preserve the user's core intent and subject matter
2. Add professional photography/artistic terminology relevant to the style
3. Include specific details about composition, lighting, and mood
4. Incorporate style-specific keywords (${artStyle} + ${imageStyle})
5. Add technical parameters that improve image quality
6. Suggest complementary visual elements that enhance the scene
7. Remove any vague terms and replace with specific descriptive language
8. Ensure the prompt flows naturally and is easy to understand${includeTitle || includeSubtitle ? '\n9. CRITICAL: Include the specified text overlay requirements in the enhanced prompt' : ''}

STYLE-SPECIFIC ENHANCEMENTS:
- For ${artStyle}: Apply appropriate artistic techniques and visual characteristics
- For ${imageStyle}: Include relevant mood, setting, and compositional elements

RESPOND ONLY WITH THE JSON OBJECT - NO ADDITIONAL TEXT.
`;
  }

  private parseAnalysisResponse(analysisText: string): PromptAnalysisResult {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.suggestedPrompt || !parsed.analysisReasoning || !Array.isArray(parsed.alternativePrompts) || !Array.isArray(parsed.keyVisualElements)) {
        throw new Error('Invalid response format');
      }

      return {
        suggestedPrompt: parsed.suggestedPrompt,
        analysisReasoning: parsed.analysisReasoning,
        alternativePrompts: parsed.alternativePrompts || [],
        keyVisualElements: parsed.keyVisualElements || [],
      };

    } catch (error) {
      console.error('❌ Error parsing analysis response:', error);
      
      // Fallback: Generate a basic prompt from the content
      return this.generateFallbackPrompt(analysisText);
    }
  }

  private generateFallbackPrompt(content: string): PromptAnalysisResult {
    // Extract key themes from the content for a fallback prompt
    const themes = this.extractKeyThemes(content);
    
    return {
      suggestedPrompt: `Professional image representing ${themes.join(', ')}, high quality, well composed`,
      analysisReasoning: 'Generated fallback prompt based on content analysis',
      alternativePrompts: [
        `Creative visualization of ${themes[0] || 'business concept'}`,
        `Modern interpretation of ${themes[1] || 'professional theme'}`,
        `Artistic representation of ${themes[0] || 'main topic'}`
      ],
      keyVisualElements: themes.slice(0, 4),
    };
  }

  private extractKeyThemes(content: string): string[] {
    // Simple keyword extraction for fallback
    const commonBusinessTerms = [
      'business', 'technology', 'innovation', 'growth', 'success', 
      'professional', 'digital', 'modern', 'solution', 'service',
      'team', 'corporate', 'development', 'strategy', 'quality'
    ];

    const words = content.toLowerCase().split(/\W+/);
    const foundThemes = commonBusinessTerms.filter(term => 
      words.some(word => word.includes(term) || term.includes(word))
    );

    return foundThemes.length > 0 ? foundThemes.slice(0, 3) : ['business', 'professional', 'modern'];
  }
}