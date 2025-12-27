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

export interface PromptAnalysisResult {
  suggestedPrompt: string;
  analysisReasoning: string;
  alternativePrompts: string[];
  keyVisualElements: string[];
}

export class AIPromptAnalyzer {
  private geminiApiKey = process.env.GEMINI_API_KEY;

  constructor() {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }
  }

  async analyzeContent(request: PromptAnalysisRequest): Promise<PromptAnalysisResult> {
    console.log('🧠 Starting AI prompt analysis...');
    
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
      throw new Error(`Prompt analysis failed: ${error.message}`);
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