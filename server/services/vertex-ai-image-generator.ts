/**
 * Vertex AI Image Generator Service
 * Handles AI-powered image generation using Google Vertex AI Imagen with proper service account authentication
 */

import { GoogleAuth } from 'google-auth-library';

export interface ReferenceImage {
  bytesBase64Encoded: string;
  mimeType: string;
  subjectType: 'product' | 'person' | 'animal' | 'style';
  subjectDescription?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  includeTitle: boolean;
  includeSubtitle: boolean;
  artStyle: string;
  imageStyle: string;
  resolution: string;
  aspectRatio: string;
  model: string;
  articleContext?: {
    headline?: string;
    hook?: string;
    content?: string;
  };
  brandIntelligence?: {
    brandId: string;
    activeToggles: string[];
    finalBenefits: string[];
    brandData: any;
  };
  // Reference image for product/subject placement (Image Ingredients)
  referenceImage?: ReferenceImage;
}

export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  metadata: {
    artStyle: string;
    imageStyle: string;
    resolution: string;
    aspectRatio: string;
    model: string;
    generatedAt: string;
  };
}

export class VertexAIImageGenerator {
  private projectId = process.env.GOOGLE_PROJECT_ID;
  private location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
  private serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  private serviceAccountKey = process.env.GOOGLE_PRIVATE_KEY; // The private key from service account JSON
  private lastRequestTime = 0;
  private minRequestInterval = 3000; // 3 seconds minimum between requests
  private auth: GoogleAuth;

  constructor() {
    if (!this.projectId) {
      throw new Error('Google Project ID not configured (GOOGLE_PROJECT_ID)');
    }
    if (!this.serviceAccountEmail) {
      throw new Error('Google Service Account Email not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL)');
    }
    if (!this.serviceAccountKey) {
      throw new Error('Google Service Account Key not configured (GOOGLE_PRIVATE_KEY)');
    }

    console.log('🔧 Initializing Vertex AI with service account authentication...');
    console.log('📧 Service Account Email:', this.serviceAccountEmail);
    console.log('🏗️ Project ID:', this.projectId);
    console.log('🗝️ Key format check:', this.serviceAccountKey.substring(0, 30) + '...');
    
    // Check if the key looks like a proper private key
    if (!this.serviceAccountKey.includes('BEGIN PRIVATE KEY')) {
      console.warn('⚠️  Warning: Key does not appear to be in private key format');
      console.log('💡 Expected format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n');
      
      // Try to use it as-is but with alternative authentication
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      // Use proper service account credentials with fixed newlines
      this.auth = new GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: this.projectId,
          private_key_id: 'vertex-ai-image-gen',
          private_key: this.serviceAccountKey.replace(/\\n/g, '\n'), // Fix escaped newlines
          client_email: this.serviceAccountEmail,
          client_id: '',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(this.serviceAccountEmail)}`,
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    console.log('🎨 Starting Vertex AI image generation...');
    
    // Rate limiting - ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before Vertex AI call...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    // Enhanced prompt with style and context
    const enhancedPrompt = this.buildEnhancedPrompt(request);
    console.log('📝 Enhanced prompt:', enhancedPrompt);
    console.log('🏷️ Include title:', request.includeTitle, 'Title:', request.articleContext?.headline);
    console.log('🏷️ Include subtitle:', request.includeSubtitle, 'Subtitle:', request.articleContext?.hook);

    // Convert aspect ratio to Vertex AI format
    const imageSpec = this.buildImageSpecification(request);

    try {
      console.log('🤖 Generating image with Vertex AI Imagen...');
      console.log('📐 Image specification:', imageSpec);
      console.log('🔑 Service Account configured:', !!this.serviceAccountKey);
      console.log('🏗️ Project ID:', this.projectId);
      console.log('📍 Location:', this.location);
      
      // Call appropriate Vertex AI API based on model type
      const imageUrl = await this.callVertexAI(enhancedPrompt, imageSpec, request.model, request);

      console.log('✅ Image generated successfully with Vertex AI');
      console.log('🔗 Generated image URL:', imageUrl);

      return {
        imageUrl,
        prompt: enhancedPrompt,
        metadata: {
          artStyle: request.artStyle,
          imageStyle: request.imageStyle,
          resolution: request.resolution,
          aspectRatio: request.aspectRatio,
          model: request.model,
          generatedAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      console.error('💥 Error generating image:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  private buildEnhancedPrompt(request: ImageGenerationRequest): string {
    let prompt = request.prompt;

    // Brand Intelligence Enhancement - apply brand-aware modifications first
    if (request.brandIntelligence) {
      prompt = this.applyBrandIntelligence(prompt, request.brandIntelligence);
    }

    // Add text overlay requests if requested
    const textOverlays = [];
    if (request.includeTitle && request.articleContext?.headline) {
      textOverlays.push(`with text overlay "${request.articleContext.headline}" prominently displayed at the top`);
    }
    
    if (request.includeSubtitle && request.articleContext?.hook) {
      textOverlays.push(`with subtitle text "${request.articleContext.hook}" in smaller text below the main title`);
    }

    if (textOverlays.length > 0) {
      prompt = `${prompt}, ${textOverlays.join(', ')}`;
    }

    // Add style specifications
    const styleModifiers = this.getStyleModifiers(request.artStyle, request.imageStyle);
    prompt = `${prompt}, ${styleModifiers}`;

    // Add quality and technical specifications
    prompt += ', high quality, professional, sharp details, well composed';

    // Add negative prompts (only avoid watermarks if no text overlays are requested)
    const negativePrompts = ['blurry', 'low quality', 'distorted', 'poorly composed'];
    if (textOverlays.length === 0) {
      negativePrompts.push('text overlays', 'watermarks');
    }
    prompt += `. Avoid: ${negativePrompts.join(', ')}`;

    return prompt;
  }

  private getStyleModifiers(artStyle: string, imageStyle: string): string {
    const artModifiers: Record<string, string> = {
      'photorealistic': 'photorealistic, realistic photography, natural lighting',
      'illustrated': 'illustration style, digital art, artistic rendering',
      'cinematic': 'cinematic lighting, dramatic composition, movie-like quality',
      'minimalist': 'minimalist design, clean composition, simple elements',
      'abstract': 'abstract art style, conceptual design, artistic abstraction',
      'vintage': 'vintage style, retro aesthetic, classic timeless look',
      'modern': 'modern style, contemporary design, sleek and current',
      'artistic': 'artistic interpretation, creative composition, expressive style',
    };

    const styleModifiers: Record<string, string> = {
      'professional': 'professional setting, business appropriate, polished look',
      'lifestyle': 'lifestyle photography, natural setting, authentic feel',
      'dramatic': 'dramatic lighting, high contrast, striking composition',
      'minimalist': 'clean minimalist composition, uncluttered design',
      'corporate': 'corporate style, business environment, professional atmosphere',
      'creative': 'creative composition, unique perspective, innovative artistic approach',
      'warm': 'warm inviting atmosphere, cozy friendly feel, welcoming ambiance',
      'modern': 'contemporary modern aesthetic, sleek current design, up-to-date style',
    };

    return `${artModifiers[artStyle] || artStyle} style, ${styleModifiers[imageStyle] || imageStyle} composition`;
  }

  private buildImageSpecification(request: ImageGenerationRequest) {
    const resolution = parseInt(request.resolution);
    
    return {
      // Vertex AI Imagen parameters
      aspectRatio: request.aspectRatio,
      resolution: resolution,
      imageSize: this.getImageSize(request.aspectRatio, resolution),
    };
  }

  private getImageSize(aspectRatio: string, resolution: number): string {
    // Convert aspect ratio to Vertex AI format
    const ratioMap: Record<string, string> = {
      '1:1': '1024x1024',
      '9:16': '768x1152', // Portrait (tall)
      '3:4': '768x1024',  // Portrait
      '4:5': '896x1152',  // Instagram portrait
      '2:3': '768x1152',  // Classic portrait
      '3:2': '1152x768',  // Landscape
      '4:3': '1024x768',  // Standard
      '16:9': '1152x768', // Widescreen
    };

    let baseSize = ratioMap[aspectRatio] || '1024x1024';
    
    // Adjust for requested resolution
    if (resolution !== 1000) {
      const [width, height] = baseSize.split('x').map(Number);
      const scale = resolution / 1000;
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);
      baseSize = `${newWidth}x${newHeight}`;
    }

    return baseSize;
  }

  private convertAspectRatio(aspectRatio: string): string {
    // Vertex AI aspect ratio format
    const ratioMap: Record<string, string> = {
      '1:1': '1:1',
      '9:16': '9:16',
      '3:4': '3:4',
      '4:5': '4:5',
      '2:3': '2:3',
      '3:2': '3:2',
      '4:3': '4:3',
      '16:9': '16:9',
    };

    return ratioMap[aspectRatio] || '1:1';
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('🔑 Getting OAuth 2.0 access token using service account...');
      
      // Get an authenticated client using service account credentials
      const authClient = await this.auth.getClient();
      
      // Get access token from the authenticated client
      const accessTokenResponse = await authClient.getAccessToken();
      
      if (!accessTokenResponse.token) {
        throw new Error('Failed to get access token from service account');
      }
      
      console.log('✅ Successfully obtained OAuth 2.0 access token');
      return accessTokenResponse.token;
      
    } catch (error) {
      console.error('❌ Failed to get OAuth access token:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  private async uploadToCloudStorage(base64Data: string): Promise<string> {
    const bucketName = 'netfox-veo-generations';
    const fileName = `ai-images/generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    
    try {
      console.log(`📤 Uploading to Cloud Storage: gs://${bucketName}/${fileName}`);
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      console.log(`📊 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Get access token using our auth client
      const authClient = await this.auth.getClient();
      const accessToken = await authClient.getAccessToken();
      
      // Upload to Cloud Storage using REST API
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length.toString(),
        },
        body: imageBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Storage upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Make the object publicly readable
      const aclUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}/acl`;
      const aclResponse = await fetch(aclUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity: 'allUsers',
          role: 'READER'
        }),
      });

      if (!aclResponse.ok) {
        console.warn('⚠️ Failed to make object public, but upload succeeded');
      } else {
        console.log('🔓 Object made publicly readable');
      }
      
      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      
      console.log('✅ Cloud Storage upload successful');
      console.log('🔗 Public URL:', publicUrl);
      
      return publicUrl;
      
    } catch (error: any) {
      console.error('❌ Cloud Storage upload error:', error);
      throw new Error(`Cloud Storage upload failed: ${error.message}`);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  private async callVertexAI(prompt: string, imageSpec: any, model: string, originalRequest?: ImageGenerationRequest): Promise<string> {
    // Extract actual model name (handle frontend unique IDs)
    let actualModel = model;
    
    // Map frontend unique IDs to actual model names
    if (model.startsWith('gemini-3-pro-image-preview-')) {
      actualModel = 'gemini-3-pro-image-preview';
    } else if (model.startsWith('imagen-4.0-')) {
      // Keep imagen models as-is since they're already correct
      actualModel = model;
    }
    
    console.log('🔍 Model routing check:', { 
      frontendModel: model, 
      actualModel, 
      isGemini: actualModel.includes('gemini') 
    });
    
    if (actualModel.includes('gemini')) {
      console.log('📡 Routing to Gemini API for model:', actualModel);
      return await this.callGeminiAPI(prompt, imageSpec, actualModel, originalRequest);
    } else {
      console.log('📡 Routing to Imagen API for model:', actualModel);
      return await this.callImagenAPI(prompt, imageSpec, actualModel);
    }
  }

  private async callImagenAPI(prompt: string, imageSpec: any, model: string): Promise<string> {
    console.log('🔴 ENTERING IMAGEN API METHOD for model:', model);
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;
    
    console.log('🌐 Vertex AI endpoint:', endpoint);
    console.log('🤖 Using model:', model);
    console.log('🔄 Getting access token...');
    
    const accessToken = await this.getAccessToken();
    console.log('🔑 Access token length:', accessToken.length);
    
    // Build the request payload for Imagen (text-to-image generation)
    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: this.convertAspectRatio(imageSpec.aspectRatio),
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };

    console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('📡 Making API call to Vertex AI...');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📈 Vertex AI response status:', response.status);
      console.log('📋 Vertex AI response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Vertex AI API error:', response.status, errorText);
        throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📝 Vertex AI response keys:', Object.keys(result));
      console.log('📝 Full Vertex AI response:', JSON.stringify(result, null, 2));

      // Extract the generated image
      if (!result.predictions || !result.predictions[0] || !result.predictions[0].bytesBase64Encoded) {
        throw new Error('No image data in Vertex AI response');
      }

      const base64Image = result.predictions[0].bytesBase64Encoded;
      
      // Upload the base64 image to Cloud Storage
      const imageUrl = await this.uploadToCloudStorage(base64Image);
      
      return imageUrl;

    } catch (error: any) {
      console.error('💥 Vertex AI generation error:', error);
      throw error;
    }
  }

  private async callGeminiAPI(prompt: string, imageSpec: any, model: string, originalRequest?: ImageGenerationRequest): Promise<string> {
    console.log('🟢 ENTERING GEMINI API METHOD for model:', model);
    // Gemini image generation requires 'global' location, not regional
    const geminiLocation = 'global';
    const endpoint = `https://aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${geminiLocation}/publishers/google/models/${model}:generateContent`;

    console.log('🌐 Gemini endpoint:', endpoint);
    console.log('🤖 Using Gemini model:', model);
    console.log('📍 Using global location for Gemini');
    console.log('🔄 Getting access token...');

    const accessToken = await this.getAccessToken();
    console.log('🔑 Access token length:', accessToken.length);

    // Build parts array - include reference image if provided (Image Ingredients)
    const parts: any[] = [];

    // Add reference image first if provided (for product/subject placement)
    if (originalRequest?.referenceImage) {
      const refImg = originalRequest.referenceImage;
      console.log('🖼️ Adding reference image for subject placement');
      console.log('📦 Subject type:', refImg.subjectType);
      console.log('📝 Subject description:', refImg.subjectDescription || 'none');
      console.log('🗂️ MIME type:', refImg.mimeType);
      console.log('📊 Base64 length:', refImg.bytesBase64Encoded.length);

      // Enhance prompt with subject context for better placement
      const subjectContext = refImg.subjectDescription
        ? `Using the provided ${refImg.subjectType} image (${refImg.subjectDescription}), `
        : `Using the provided ${refImg.subjectType} image, `;

      parts.push({
        inlineData: {
          mimeType: refImg.mimeType,
          data: refImg.bytesBase64Encoded
        }
      });

      // Prepend subject context to prompt
      parts.push({
        text: subjectContext + prompt
      });
    } else {
      // No reference image - just use the text prompt
      parts.push({
        text: prompt
      });
    }

    // Build the request payload for Gemini image generation
    // CRITICAL: Must include both TEXT and IMAGE in response_modalities
    const requestBody = {
      contents: [{
        role: 'user',
        parts: parts
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include both!
        imageConfig: {
          aspectRatio: imageSpec.aspectRatio,
          imageSize: originalRequest?.resolution || imageSpec.resolution // Use original K-scale string (1K, 2K, 4K)
        }
      }
    };

    console.log('📋 Gemini request body:', JSON.stringify(requestBody, null, 2));
    console.log('📡 Making API call to Gemini...');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📈 Gemini response status:', response.status);
      console.log('📋 Gemini response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📝 Gemini response keys:', Object.keys(result));
      console.log('📝 Full Gemini response:', JSON.stringify(result, null, 2));

      // Extract the generated image from Gemini response
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts) {
        throw new Error('No image data in Gemini response');
      }

      console.log('🔍 Gemini response structure analysis:');
      console.log('  - candidates length:', result.candidates.length);
      console.log('  - first candidate content parts:', result.candidates[0].content.parts.length);
      
      // Log the structure of each part to debug the response format
      result.candidates[0].content.parts.forEach((part, index) => {
        console.log(`  - Part ${index}:`, Object.keys(part));
        if (part.inline_data) {
          console.log(`    - inline_data keys:`, Object.keys(part.inline_data));
        }
        if (part.inlineData) {
          console.log(`    - inlineData keys:`, Object.keys(part.inlineData));
        }
      });

      // Try both inline_data and inlineData formats (Google APIs sometimes vary)
      // Note: Gemini typically uses camelCase (inlineData), not snake_case (inline_data)
      let imagePart = result.candidates[0].content.parts.find(part => part.inlineData);
      if (!imagePart) {
        imagePart = result.candidates[0].content.parts.find(part => part.inline_data);
      }

      if (!imagePart) {
        console.error('❌ No image part found. Available part keys:', result.candidates[0].content.parts.map(part => Object.keys(part)));
        throw new Error('No image data found in Gemini response parts');
      }

      // Extract base64 data from either format (prioritize Gemini's camelCase format)
      let base64Image;
      if (imagePart.inlineData && imagePart.inlineData.data) {
        base64Image = imagePart.inlineData.data;
        console.log('✅ Found image data in inlineData.data format');
      } else if (imagePart.inline_data && imagePart.inline_data.data) {
        base64Image = imagePart.inline_data.data;
        console.log('✅ Found image data in inline_data.data format');
      } else {
        console.error('❌ Image part found but no data. Part structure:', JSON.stringify(imagePart, null, 2));
        throw new Error('No base64 data in image part');
      }
      
      // Upload the base64 image to Cloud Storage
      const imageUrl = await this.uploadToCloudStorage(base64Image);
      
      return imageUrl;

    } catch (error: any) {
      console.error('💥 Gemini generation error:', error);
      throw error;
    }
  }

  private parseGeminiResolution(resolution: string): string {
    // Convert K format to actual pixel dimensions
    const resolutionMap: Record<string, string> = {
      '1K': '1024',
      '2K': '2048', 
      '4K': '4096'
    };
    
    return resolutionMap[resolution] || '1024';
  }


  private extractKeywords(prompt: string): string {
    // Remove style modifiers and extract core subject matter
    const cleanPrompt = prompt
      .replace(/,.*style.*,/gi, '')
      .replace(/high quality.*$/gi, '')
      .replace(/avoid:.*$/gi, '')
      .replace(/relating to.*?,/gi, '')
      .replace(/with theme:.*?,/gi, '')
      .trim();

    // Extract the first meaningful part of the prompt
    const words = cleanPrompt.split(/[,.]/).filter(part => part.trim().length > 3);
    return words.slice(0, 3).join(' ').trim() || 'abstract art';
  }

  /**
   * Apply brand intelligence enhancements to the prompt based on active toggles
   * Following patterns from handoff document
   */
  private applyBrandIntelligence(prompt: string, brandIntelligence: NonNullable<ImageGenerationRequest['brandIntelligence']>): string {
    let enhanced = prompt;
    const { activeToggles, finalBenefits, brandData } = brandIntelligence;

    console.log('🧠 Applying brand intelligence with toggles:', activeToggles);
    console.log('⭐ Final benefits:', finalBenefits);

    // Apply Visual Style enhancements
    if (activeToggles.includes('visual') && brandData?.client_brand_profiles?.[0]) {
      const profile = brandData.client_brand_profiles[0];
      const visualEnhancements = [];
      
      if (profile.color_personality) {
        visualEnhancements.push(profile.color_personality);
      }
      if (profile.visual_mood) {
        visualEnhancements.push(profile.visual_mood);
      }
      if (profile.primary_color) {
        visualEnhancements.push(`incorporating ${profile.primary_color} color palette`);
      }
      
      if (visualEnhancements.length > 0) {
        enhanced += `, ${visualEnhancements.join(', ')}`;
        console.log('🎨 Added visual style:', visualEnhancements.join(', '));
      }
    }

    // Apply Industry Context enhancements
    if (activeToggles.includes('industry') && brandData) {
      const industryContext = [];
      
      if (brandData.industry) {
        industryContext.push(`${brandData.industry.toLowerCase()} industry context`);
      }
      if (brandData.client_brand_profiles?.[0]?.business_niche) {
        industryContext.push(brandData.client_brand_profiles[0].business_niche);
      }
      
      if (industryContext.length > 0) {
        enhanced += `, ${industryContext.join(', ')}`;
        console.log('🏢 Added industry context:', industryContext.join(', '));
      }
    }

    // Apply Target Audience enhancements
    if (activeToggles.includes('audience') && brandData?.client_brand_profiles?.[0]) {
      const profile = brandData.client_brand_profiles[0];
      
      if (profile.target_audience) {
        enhanced += `, appealing to ${profile.target_audience}`;
        console.log('👥 Added target audience:', profile.target_audience);
      } else if (profile.target_audience_description) {
        enhanced += `, designed for ${profile.target_audience_description}`;
        console.log('👥 Added audience description:', profile.target_audience_description);
      }
    }

    // Apply Smart Benefits highlighting
    if (activeToggles.includes('benefits') && finalBenefits.length > 0) {
      enhanced += `, highlighting: ${finalBenefits.join(', ')}`;
      console.log('⭐ Added benefits:', finalBenefits.join(', '));
    }

    // Apply Content Guidelines
    if (activeToggles.includes('guidelines') && brandData?.client_brand_profiles?.[0]?.positive_examples) {
      const examples = brandData.client_brand_profiles[0].positive_examples;
      if (examples && examples.length > 0) {
        enhanced += `, following successful content patterns`;
        console.log('✅ Applied content guidelines');
      }
    }

    // Apply Compliance Rules (add to negative prompts)
    if (activeToggles.includes('compliance') && brandData?.client_brand_profiles?.[0]) {
      const profile = brandData.client_brand_profiles[0];
      const avoidTerms = [];
      
      if (profile.forbidden_phrases && profile.forbidden_phrases.length > 0) {
        avoidTerms.push(...profile.forbidden_phrases);
      }
      if (profile.prohibited_terms && profile.prohibited_terms.length > 0) {
        avoidTerms.push(...profile.prohibited_terms);
      }
      
      if (avoidTerms.length > 0) {
        enhanced += `. Additionally avoid: ${avoidTerms.join(', ')}`;
        console.log('🚫 Added compliance restrictions:', avoidTerms.join(', '));
      }
    }

    console.log('🧠 Brand-enhanced prompt:', enhanced);
    return enhanced;
  }
}