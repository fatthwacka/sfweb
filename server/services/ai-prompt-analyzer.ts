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

// Brand asset metadata for intelligent prompt enhancement
export interface BrandAssetMetadata {
  assetId: string;
  assetName: string;
  assetType: string;       // product, logo, material, style_reference, background, texture
  material?: string;       // glass, metal, fabric, etc.
  similarTo?: string;      // e.g., "perfume bottle", "skincare jar"
  usageNotes?: string;     // usage guidance from brand settings
  clientId?: string;       // for industry context lookup
  clientIndustry?: string; // e.g., "Beauty & Skincare", "Fashion"
}

export interface ImageIngredientInfo {
  tag: string;       // e.g., '[product1]', '[model]', '[scene]'
  slotId: string;    // e.g., 'product1', 'model', 'scene'
  type: string;      // 'product', 'model', or 'scene'
  description?: string;
  brandAssetMetadata?: BrandAssetMetadata; // Optional: rich metadata from brand assets
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
  customSystemPrompt?: string;  // Optional: user-provided system prompt override
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
    const { userPrompt, artStyle, imageStyle, includeTitle, includeSubtitle, titleText, subtitleText, imageIngredients, customSystemPrompt } = request;

    const hasAssets = imageIngredients && imageIngredients.length > 0;

    // Text overlay info (used in both paths)
    let textOverlay = '';
    if (includeTitle && titleText) textOverlay += `Include text overlay: "${titleText}". `;
    if (includeSubtitle && subtitleText) textOverlay += `Subtitle: "${subtitleText}". `;

    // ═══════════════════════════════════════════════════════════════
    // PATH A: NO ASSETS - Full creative freedom with quality focus
    // (customSystemPrompt can fully override here since no assets to protect)
    // ═══════════════════════════════════════════════════════════════
    if (!hasAssets) {
      console.log('🎨 PATH A: No assets - full creative elaboration mode');

      // If custom system prompt provided and no assets, allow it to guide (but still add quality rules)
      if (customSystemPrompt) {
        console.log('🎨 PATH A with custom guidance appended');
        return `You are an expert image prompt engineer creating ULTRA-HIGH DETAIL prompts for professional AI image generation.

USER'S CONCEPT: "${userPrompt}"

STYLE: ${artStyle}, ${imageStyle}
${textOverlay ? `TEXT OVERLAY: ${textOverlay}` : ''}

ADDITIONAL USER GUIDANCE:
${customSystemPrompt}

YOUR TASK:
Transform the user's concept into an ULTRA-DETAILED, photorealistic prompt. You have FULL CREATIVE FREEDOM - imagine every element of the scene.

═══════════════════════════════════════════════════════════════
MANDATORY QUALITY ENHANCEMENTS:
═══════════════════════════════════════════════════════════════
Your prompt MUST include:
1. PHOTOREALISTIC IMPERFECTIONS: Add subtle dust particles, micro-scratches, fingerprint smudges on glass, fabric texture irregularities, surface wear
2. HUMAN REALISM (if people present): Specify skin pores, subtle freckles, minor blemishes, natural skin texture variations, asymmetrical features, stray hairs, visible pore texture
3. SURFACE DETAIL: Specify material grain, reflection imperfections, subtle wear patterns, micro-textures, surface irregularities
4. LIGHTING NUANCE: Specify caustics, subsurface scattering, chromatic aberration, lens flare characteristics, light falloff
5. ENVIRONMENTAL PARTICLES: Add floating dust motes in light beams, atmospheric haze, bokeh characteristics, lens artifacts

CREATIVE ELEMENTS TO ADD:
- Specific, concrete visual details (not vague adjectives)
- Atmospheric elements with SPECIFIC lighting direction and quality
- Camera craft: lens mm equivalent, aperture effect, focus plane
- Material textures with SPECIFIC surface qualities
- Colour palette with SPECIFIC colour names and tones
- Composition with SPECIFIC placement and framing

CRITICAL RULES:
- DO NOT mention aspect ratio or image dimensions (these are set separately)
- DO NOT use generic terms like "high quality", "professional", "stunning" - be SPECIFIC
- Use concrete, measurable descriptors rather than subjective adjectives
- Include at least 3 types of imperfections/texture details

RESPOND WITH JSON ONLY:
{
  "suggestedPrompt": "Your ultra-detailed prompt with mandatory quality enhancements",
  "analysisReasoning": "Brief note on creative choices",
  "alternativePrompts": [],
  "keyVisualElements": []
}`;
      }

      // Standard PATH A - no custom prompt, no assets
      return `You are an expert image prompt engineer creating ULTRA-HIGH DETAIL prompts for professional AI image generation.

USER'S CONCEPT: "${userPrompt}"

STYLE: ${artStyle}, ${imageStyle}
${textOverlay ? `TEXT OVERLAY: ${textOverlay}` : ''}

YOUR TASK:
Transform the user's concept into an ULTRA-DETAILED, photorealistic prompt. You have FULL CREATIVE FREEDOM - imagine every element of the scene.

═══════════════════════════════════════════════════════════════
MANDATORY QUALITY ENHANCEMENTS:
═══════════════════════════════════════════════════════════════
Your prompt MUST include:
1. PHOTOREALISTIC IMPERFECTIONS: Add subtle dust particles, micro-scratches, fingerprint smudges on glass, fabric texture irregularities, surface wear
2. HUMAN REALISM (if people present): Specify skin pores, subtle freckles, minor blemishes, natural skin texture variations, asymmetrical features, stray hairs, visible pore texture
3. SURFACE DETAIL: Specify material grain, reflection imperfections, subtle wear patterns, micro-textures, surface irregularities
4. LIGHTING NUANCE: Specify caustics, subsurface scattering, chromatic aberration, lens flare characteristics, light falloff
5. ENVIRONMENTAL PARTICLES: Add floating dust motes in light beams, atmospheric haze, bokeh characteristics, lens artifacts

CREATIVE ELEMENTS TO ADD:
- Specific, concrete visual details (not vague adjectives)
- Atmospheric elements with SPECIFIC lighting direction and quality
- Camera craft: lens mm equivalent, aperture effect, focus plane
- Material textures with SPECIFIC surface qualities
- Colour palette with SPECIFIC colour names and tones
- Composition with SPECIFIC placement and framing

CRITICAL RULES:
- DO NOT mention aspect ratio or image dimensions (these are set separately)
- DO NOT use generic terms like "high quality", "professional", "stunning" - be SPECIFIC
- Use concrete, measurable descriptors rather than subjective adjectives
- Include at least 3 types of imperfections/texture details

RESPOND WITH JSON ONLY:
{
  "suggestedPrompt": "Your ultra-detailed prompt with mandatory quality enhancements",
  "analysisReasoning": "Brief note on creative choices",
  "alternativePrompts": [],
  "keyVisualElements": []
}`;
    }

    // ═══════════════════════════════════════════════════════════════
    // PATH B: HAS ASSETS - Creative enhancement WITH reference images
    // TARGETED CREATIVITY: Only restrict imagination for loaded asset types
    // customSystemPrompt is SUPPLEMENTARY guidance, NOT a replacement
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 PATH B: Assets present - targeted creativity mode');
    if (customSystemPrompt) {
      console.log('📦 PATH B: Custom system prompt will be included as supplementary guidance');
    }

    // Categorise loaded assets by type
    const loadedProducts = imageIngredients!.filter(i => i.type === 'product' || i.slotId?.startsWith('product'));
    const hasLoadedModel = imageIngredients!.some(i => i.type === 'model' || i.slotId === 'model');
    const hasLoadedScene = imageIngredients!.some(i => i.type === 'scene' || i.slotId === 'scene');

    console.log(`📦 Loaded: ${loadedProducts.length} products, model: ${hasLoadedModel}, scene: ${hasLoadedScene}`);

    // Build detailed product specifications from brand asset metadata
    const productSpecs: string[] = [];
    for (const product of loadedProducts) {
      const meta = product.brandAssetMetadata;
      const tag = product.tag || `[${product.slotId}]`;

      if (meta) {
        const specs: string[] = [];
        if (meta.assetName) specs.push(`"${meta.assetName}"`);
        if (meta.similarTo) specs.push(`is a ${meta.similarTo}`);
        if (meta.material) specs.push(`made of ${meta.material}`);
        if (meta.assetType && meta.assetType !== 'product') specs.push(`(${meta.assetType})`);
        if (meta.clientIndustry) specs.push(`from the ${meta.clientIndustry} industry`);
        if (meta.usageNotes) specs.push(`— usage note: ${meta.usageNotes}`);

        if (specs.length > 0) {
          productSpecs.push(`${tag}: ${specs.join(', ')}`);
          console.log(`📦 Product spec: ${tag} -> ${specs.join(', ')}`);
        } else {
          productSpecs.push(`${tag}: product image uploaded`);
        }
      } else if (product.description) {
        productSpecs.push(`${tag}: ${product.description}`);
      } else {
        productSpecs.push(`${tag}: product image uploaded`);
      }
    }

    // Parse any dimension specifications from user prompt
    const dimPattern = /\d+\.?\d*\s*(?:inch|inches|in|"|cm|mm|ft|foot|feet)\s*(?:wide|tall|high|deep|long|x\s*\d+\.?\d*\s*(?:inch|inches|in|"|cm|mm))?/gi;
    const dimensions = userPrompt.match(dimPattern) || [];

    let sizeGuidance = '';
    if (dimensions.length > 0) {
      const realWorldSize = this.dimensionToRealWorld(dimensions[0]);
      sizeGuidance = `\nSIZE REFERENCE: "${dimensions.join(', ')}" → approximately ${realWorldSize}`;
    }

    // Build targeted creativity guidance
    const creativityGuidance: string[] = [];

    if (!hasLoadedModel) {
      creativityGuidance.push('- FREELY IMAGINE any human models, hands, or people - describe their appearance, pose, clothing, expression');
    }
    if (!hasLoadedScene) {
      creativityGuidance.push('- FREELY IMAGINE the environment, backdrop, setting, and location - be creative with scenery');
    }
    if (loadedProducts.length === 0) {
      creativityGuidance.push('- FREELY IMAGINE any products or objects - describe their appearance fully');
    }

    const restrictions: string[] = [];
    if (loadedProducts.length > 0) {
      restrictions.push(`- DO NOT describe the appearance of uploaded products (${loadedProducts.map(p => p.tag || `[${p.slotId}]`).join(', ')}) - they are already defined by the reference images`);
    }
    if (hasLoadedModel) {
      restrictions.push('- DO NOT describe the model\'s appearance - use [model] tag only, their look comes from the reference');
    }
    if (hasLoadedScene) {
      restrictions.push('- DO NOT reimagine the scene/background - use [scene] tag, the setting comes from the reference');
    }

    // Build the supplementary guidance section (if custom system prompt provided)
    const supplementaryGuidance = customSystemPrompt
      ? `
═══════════════════════════════════════════════════════════════
ADDITIONAL USER GUIDANCE (incorporate these preferences):
═══════════════════════════════════════════════════════════════
${customSystemPrompt}
`
      : '';

    return `You are an expert image prompt engineer creating ULTRA-HIGH DETAIL prompts for professional AI image generation.

USER'S CONCEPT: "${userPrompt}"

═══════════════════════════════════════════════════════════════
UPLOADED REFERENCE IMAGES (use these tags - they're real images):
═══════════════════════════════════════════════════════════════
${productSpecs.length > 0 ? `PRODUCTS:\n${productSpecs.join('\n')}` : ''}
${hasLoadedModel ? '[model] - Human model reference uploaded (do not describe their appearance)' : ''}
${hasLoadedScene ? '[scene] - Background/environment reference uploaded (do not reimagine the setting)' : ''}
${sizeGuidance}

═══════════════════════════════════════════════════════════════
STYLE: ${artStyle}, ${imageStyle}
${textOverlay ? `TEXT OVERLAY: ${textOverlay}` : ''}
${supplementaryGuidance}
═══════════════════════════════════════════════════════════════
TARGETED CREATIVITY RULES:
═══════════════════════════════════════════════════════════════
${creativityGuidance.length > 0 ? 'BE FULLY CREATIVE WITH:\n' + creativityGuidance.join('\n') : ''}

${restrictions.length > 0 ? 'RESTRICTIONS (preserve these from references):\n' + restrictions.join('\n') : ''}

═══════════════════════════════════════════════════════════════
MANDATORY QUALITY ENHANCEMENTS (ALWAYS INCLUDE THESE):
═══════════════════════════════════════════════════════════════
Your prompt MUST include:
1. PHOTOREALISTIC IMPERFECTIONS: Add subtle dust particles, micro-scratches on surfaces, fingerprint smudges on glass, fabric texture irregularities
2. HUMAN REALISM (if people present): Specify skin pores, subtle freckles, minor blemishes, natural skin texture variations, asymmetrical features, stray hairs
3. SURFACE DETAIL: Specify material grain, reflection imperfections, subtle wear patterns, micro-textures
4. LIGHTING NUANCE: Specify caustics, subsurface scattering, chromatic aberration, lens characteristics
5. ENVIRONMENTAL PARTICLES: Add floating dust motes in light beams, atmospheric haze, bokeh characteristics

CRITICAL RULES:
- DO NOT mention aspect ratio or image dimensions (these are set separately)
- DO NOT use generic terms like "high quality" - be SPECIFIC about what creates quality
- Reference products by their tags (e.g., [product1]) - NEVER describe their visual appearance
- Use concrete, specific descriptors rather than vague adjectives
- ALWAYS include the product metadata in your prompt (material, type, usage context)

EXAMPLE (with loaded product, no model/scene):
User: "perfume bottle on marble"
Good: "[product1] (luxury perfume bottle made of glass, from the Beauty & Skincare industry) resting on veined Calacatta marble surface with subtle grey striations, elegant female hand with natural nail polish and visible knuckle creases reaching toward the bottle, soft window light creating caustic patterns through the glass, micro dust particles visible in the light beam, shallow depth of field with creamy bokeh, subtle chromatic aberration at frame edges"

RESPOND WITH JSON ONLY:
{
  "suggestedPrompt": "Your ultra-detailed prompt with product metadata and mandatory quality enhancements",
  "analysisReasoning": "Brief note on creative approach",
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