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

export interface ImageIngredientInfo {
  tag: string;       // e.g., '[product1]', '[model]', '[scene]'
  type: string;      // 'product', 'model', or 'scene'
  description?: string;
}

export interface StandalonePromptRequest {
  userPrompt: string;
  artStyle: string;
  imageStyle: string;
  includeTitle?: boolean;
  includeSubtitle?: boolean;
  titleText?: string;
  subtitleText?: string;
  imageIngredients?: ImageIngredientInfo[];  // Reference images already uploaded
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
    const hasAssets = request.imageIngredients && request.imageIngredients.length > 0;
    console.log(`✨ Starting prompt enhancement (${hasAssets ? 'with assets' : 'no assets'})...`);

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms...`);
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
              temperature: hasAssets ? 0.5 : 0.8,  // Lower temp when assets present (stay faithful)
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 800,  // Shorter outputs work better with Vertex
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

      console.log('✅ Prompt enhancement completed');
      console.log('📝 Enhanced prompt:', parsedEnhancement.suggestedPrompt.substring(0, 200) + '...');

      return parsedEnhancement;

    } catch (error: any) {
      console.error('💥 Error enhancing prompt:', error);

      if (error.message.includes('429') || error.message.includes('quota')) {
        await new Promise(resolve => setTimeout(resolve, 5000));
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

  // Parse dimension instructions and associate with image references
  private parseDimensionInstructions(userPrompt: string, imageIngredients?: ImageIngredientInfo[]): {
    dimensionBlock: string;
    cleanedPrompt: string;
    productDimensions: Map<string, string>;
  } {
    const productDimensions = new Map<string, string>();
    let cleanedPrompt = userPrompt;

    console.log('📏 Parsing dimensions from:', userPrompt);

    // Simple, robust dimension extraction - just find all "number + unit" patterns
    const simpleDimPattern = /\d+\.?\d*\s*(?:inch|inches|in|"|cm|mm|m|ft|foot|feet|ml|oz|fl\.?\s*oz|g|kg|lb|lbs)\s*(?:wide|tall|high|deep|long)?/gi;
    const simpleMatches = userPrompt.match(simpleDimPattern) || [];

    // Also look for "NxNxN unit" patterns
    const multiDimPattern = /\d+\.?\d*\s*(?:x|by)\s*\d+\.?\d*(?:\s*(?:x|by)\s*\d+\.?\d*)?\s*(?:inch|inches|in|"|cm|mm)/gi;
    const multiMatches = userPrompt.match(multiDimPattern) || [];

    // Combine all found dimensions
    const allDimensions = [...new Set([...simpleMatches, ...multiMatches])];
    console.log('📏 Found dimensions:', allDimensions);

    // If we have image ingredients, try to associate dimensions with them
    if (imageIngredients && imageIngredients.length > 0) {
      const products = imageIngredients.filter(i => i.type === 'product');

      // Look for explicit product references like "product1 is 6 inches"
      for (const product of products) {
        const tag = product.tag.replace(/[\[\]]/g, ''); // e.g., "product1"
        const explicitPattern = new RegExp(
          `${tag}\\s*(?:is|should be|:)?\\s*([\\d.]+\\s*(?:x|by)?\\s*[\\d.]*\\s*(?:x|by)?\\s*[\\d.]*\\s*(?:inch|inches|in|cm|mm|"|ml|oz))`,
          'gi'
        );
        const match = userPrompt.match(explicitPattern);
        if (match) {
          productDimensions.set(tag, match[0].replace(new RegExp(`^${tag}\\s*(?:is|should be|:)?\\s*`, 'i'), '').trim());
        }
      }

      // If dimensions found but not explicitly assigned to specific products
      if (allDimensions.length > 0 && productDimensions.size === 0) {
        const combinedDims = allDimensions.join(', ');
        console.log(`📏 Combined dimensions string: "${combinedDims}"`);
        console.log(`📏 Number of products: ${products.length}`);

        // Apply dimensions to ALL products (they likely share dimensions)
        for (const product of products) {
          const tag = product.tag.replace(/[\[\]]/g, '');
          productDimensions.set(tag, combinedDims);
        }
        console.log(`📏 Applied dimensions to ${products.length} products:`, Object.fromEntries(productDimensions));
      }
    } else if (allDimensions.length > 0) {
      // No image ingredients, but dimensions found - store them generically
      console.log(`📏 Dimensions found but no products uploaded: ${allDimensions.join(', ')}`);
    }

    // Build dimension block for prompt
    let dimensionBlock = '';
    if (productDimensions.size > 0) {
      const lines = Array.from(productDimensions.entries())
        .map(([tag, dims]) => `[${tag}] size: ${dims}`)
        .join('\n');
      dimensionBlock = `\nPRODUCT DIMENSIONS (MUST INCLUDE IN PROMPT):\n${lines}`;
    } else if (allDimensions.length > 0) {
      // No specific assignment, just list the dimensions
      const uniqueDims = [...new Set(allDimensions)];
      dimensionBlock = `\nDIMENSIONS TO PRESERVE: ${uniqueDims.join(', ')}`;
    }

    return { dimensionBlock, cleanedPrompt, productDimensions };
  }

  // Extract colours from prompt
  private extractColours(userPrompt: string): string[] {
    const colourMatches = userPrompt.match(/\b(red|blue|green|yellow|orange|purple|pink|black|white|grey|gray|gold|silver|bronze|brown|beige|cream|navy|teal|coral|maroon|burgundy|turquoise|lavender|mint|peach|rose|ivory|charcoal|slate|olive|rust|copper|champagne|amber|crimson|scarlet|emerald|sapphire|ruby|pearl|mahogany|tan|khaki|cyan|magenta|violet|indigo)\b/gi) || [];
    return [...new Set(colourMatches)];
  }

  // Post-process to guarantee dimensions are attached to EACH product tag
  private ensureDimensionsPreserved(
    originalPrompt: string,
    enhancedPrompt: string,
    productDimensions: Map<string, string>
  ): string {
    let result = enhancedPrompt;

    console.log('📏 Post-processor called with productDimensions:', Object.fromEntries(productDimensions));
    console.log('📏 Enhanced prompt to process:', enhancedPrompt.substring(0, 200) + '...');

    // If we have product-specific dimensions, ensure EACH product tag has dimensions after it
    if (productDimensions.size > 0) {
      // Process tags in reverse order of appearance to avoid index shifting issues
      const tagPositions: { tag: string; dims: string; index: number }[] = [];

      let tagsFoundCount = 0;
      let tagsAlreadyHaveDimsCount = 0;

      for (const [tag, dims] of productDimensions) {
        const bracketTag = `[${tag}]`;
        let searchIndex = 0;

        // Find first occurrence of this tag
        const tagIndex = result.toLowerCase().indexOf(bracketTag.toLowerCase(), searchIndex);
        if (tagIndex === -1) {
          console.log(`📏 Tag ${bracketTag} not found in prompt`);
          continue;
        }

        tagsFoundCount++;
        console.log(`📏 Found ${bracketTag} at index ${tagIndex}`);

        // Check if this tag already has dimensions nearby
        const afterTag = result.slice(tagIndex + bracketTag.length, tagIndex + bracketTag.length + 15);
        console.log(`📏 Text after tag: "${afterTag}"`);

        // Simple check: does it start with " (" followed by a digit?
        const alreadyHasDims = /^\s*\(\s*\d/.test(afterTag);
        console.log(`📏 Already has dims: ${alreadyHasDims}`);

        if (alreadyHasDims) {
          tagsAlreadyHaveDimsCount++;
        } else {
          tagPositions.push({ tag: bracketTag, dims, index: tagIndex });
          console.log(`📏 Will inject at index ${tagIndex}`);
        }
      }

      console.log(`📏 Tags found: ${tagsFoundCount}, already have dims: ${tagsAlreadyHaveDimsCount}, need injection: ${tagPositions.length}`);

      // Sort by index descending so we inject from end to start (avoids index shifting)
      tagPositions.sort((a, b) => b.index - a.index);

      for (const { tag, dims, index } of tagPositions) {
        const insertPos = index + tag.length;
        result = result.slice(0, insertPos) + ` (${dims})` + result.slice(insertPos);
        console.log(`📏 Injected dimensions for ${tag}: ${dims}`);
      }

      // Only prepend if NO tags were found at all (Gemini didn't use bracket notation)
      if (tagsFoundCount === 0 && productDimensions.size > 0) {
        const dimsList = Array.from(productDimensions.entries())
          .map(([tag, dims]) => `[${tag}] (${dims})`)
          .join(', ');
        result = `${dimsList}. ${result}`;
        console.log(`📏 Prepended all product dimensions since no tags found in prompt`);
      }

      console.log(`📏 Final result (first 300 chars): ${result.substring(0, 300)}...`);
    } else {
      console.log('📏 No productDimensions to process');
      // Fallback: extract raw dimensions from original and ensure they appear somewhere
      const dimPattern = /\d+\.?\d*\s*(inch|inches|in|cm|mm|"|ml|oz|fl\.?\s*oz|litre|liter|l)\b/gi;
      const originalDims = originalPrompt.match(dimPattern) || [];
      const uniqueDims = [...new Set(originalDims)];

      for (const dim of uniqueDims) {
        if (!result.toLowerCase().includes(dim.toLowerCase())) {
          // Find first product tag to inject after
          const bracketMatch = result.match(/\[(product\d?)\]/i);
          if (bracketMatch && bracketMatch.index !== undefined) {
            const pos = bracketMatch.index + bracketMatch[0].length;
            result = result.slice(0, pos) + ` (${dim})` + result.slice(pos);
          } else {
            result = `${dim} - ${result}`;
          }
          console.log(`📏 Injected missing dimension: "${dim}"`);
        }
      }
    }

    return result;
  }

  // Map dimensions to real-world size comparisons (Vertex prefers these over exact measurements)
  private dimensionToRealWorld(dimText: string): string {
    // Extract numeric values
    const numbers = dimText.match(/\d+\.?\d*/g)?.map(Number) || [];
    if (numbers.length === 0) return 'small handheld object';

    // Get the largest dimension mentioned
    const maxDim = Math.max(...numbers);
    const unit = dimText.toLowerCase();

    // Convert to inches for comparison
    let inches = maxDim;
    if (unit.includes('cm')) inches = maxDim / 2.54;
    else if (unit.includes('mm')) inches = maxDim / 25.4;
    else if (unit.includes('ft') || unit.includes('foot') || unit.includes('feet')) inches = maxDim * 12;

    // Map to real-world comparisons
    if (inches <= 1) return 'coin-sized';
    if (inches <= 2) return 'thumb-sized, like a USB stick';
    if (inches <= 3) return 'credit card sized';
    if (inches <= 4) return 'palm-sized, like a smartphone';
    if (inches <= 6) return 'hand-sized, like a small book';
    if (inches <= 8) return 'paperback book sized';
    if (inches <= 12) return 'tablet-sized, fits in one hand';
    if (inches <= 18) return 'laptop-sized';
    if (inches <= 24) return 'briefcase-sized';
    return 'large object';
  }

  private buildStandalonePrompt(request: StandalonePromptRequest): string {
    const { userPrompt, artStyle, imageStyle, includeTitle, includeSubtitle, titleText, subtitleText, imageIngredients } = request;

    const hasAssets = imageIngredients && imageIngredients.length > 0;

    // Text overlay info
    let textOverlay = '';
    if (includeTitle && titleText) textOverlay += `Include text overlay: "${titleText}". `;
    if (includeSubtitle && subtitleText) textOverlay += `Subtitle: "${subtitleText}". `;

    // ═══════════════════════════════════════════════════════════════
    // PATH A: NO ASSETS - Be creative, elaborate the scene
    // ═══════════════════════════════════════════════════════════════
    if (!hasAssets) {
      console.log('🎨 PATH A: No assets - creative elaboration mode');

      return `You are an expert image prompt engineer. The user has provided a brief creative concept. Your job is to elaborate it into a rich, detailed image generation prompt.

USER'S CONCEPT: "${userPrompt}"

STYLE REQUIREMENTS:
- Art style: ${artStyle}
- Image style: ${imageStyle}
${textOverlay ? `- ${textOverlay}` : ''}

YOUR TASK:
Take the user's short concept and expand it into a detailed, evocative image prompt. Add:
- Specific visual details that bring the scene to life
- Atmospheric elements (lighting, time of day, weather, mood)
- Camera perspective and lens characteristics (wide angle, macro, depth of field)
- Composition guidance (rule of thirds, leading lines, foreground interest)
- Material textures and surface qualities
- Colour palette suggestions that match the mood

Keep the user's core idea intact but enrich it with professional photography/art direction knowledge.

RESPOND WITH JSON ONLY:
{
  "suggestedPrompt": "Your elaborated, detailed prompt here",
  "analysisReasoning": "Brief note on creative choices",
  "alternativePrompts": [],
  "keyVisualElements": []
}`;
    }

    // ═══════════════════════════════════════════════════════════════
    // PATH B: HAS ASSETS - Creative enhancement WITH reference images
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 PATH B: Assets present - creative enhancement with refs');

    // Parse any dimension specifications
    const dimPattern = /\d+\.?\d*\s*(?:inch|inches|in|"|cm|mm|ft|foot|feet)\s*(?:wide|tall|high|deep|long|x\s*\d+\.?\d*\s*(?:inch|inches|in|"|cm|mm))?/gi;
    const dimensions = userPrompt.match(dimPattern) || [];

    // Build asset list
    const assetList = imageIngredients!.map(i => {
      const tag = i.type === 'product' ? i.tag.replace(/[\[\]]/g, '') : i.type;
      return `[${tag}]`;
    }).join(', ');

    // If dimensions found, create real-world comparison
    let sizeGuidance = '';
    if (dimensions.length > 0) {
      const realWorldSize = this.dimensionToRealWorld(dimensions[0]);
      sizeGuidance = `\n\nSIZE: User said "${dimensions.join(', ')}" → describe as "${realWorldSize}"`;
    }

    return `You are an expert image prompt engineer. The user has uploaded reference images and provided a creative concept. Your job is to elaborate their vision into a rich, cinematic image prompt.

USER'S CONCEPT: "${userPrompt}"

UPLOADED IMAGES: ${assetList}
(These are actual images - reference them by tag, never describe their appearance)

STYLE: ${artStyle}, ${imageStyle}
${textOverlay ? `TEXT: ${textOverlay}` : ''}${sizeGuidance}

YOUR TASK:
Transform the user's concept into an evocative, detailed prompt. Be creative and embellish!

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
- Remove elements the user requested

EXAMPLE:
User: "model throws products into air, products are 4 inches"
Enhanced: "[model] gracefully tosses [product1] and [product2] skyward, palm-sized products suspended in a balletic arc against a gradient studio backdrop, frozen motion with subtle motion trails, dramatic rim lighting creating luminous edges, shallow depth of field with creamy bokeh, high-energy fashion editorial aesthetic"

RESPOND WITH JSON ONLY:
{
  "suggestedPrompt": "Your richly embellished prompt here",
  "analysisReasoning": "Brief creative note",
  "alternativePrompts": [],
  "keyVisualElements": []
}`;
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