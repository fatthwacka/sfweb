/**
 * Vertex AI Image Generator Service
 * Handles AI-powered image generation using Google Vertex AI Imagen
 */

export interface ImageGenerationRequest {
  prompt: string;
  includeTitle: boolean;
  includeSubtitle: boolean;
  artStyle: string;
  imageStyle: string;
  resolution: string;
  aspectRatio: string;
  articleContext?: {
    headline?: string;
    hook?: string;
    content?: string;
  };
}

export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  metadata: {
    artStyle: string;
    imageStyle: string;
    resolution: string;
    aspectRatio: string;
    generatedAt: string;
  };
}

export class VertexAIImageGenerator {
  private apiKey = process.env.GOOGLE_VERTEX_API_KEY;
  private projectId = process.env.GOOGLE_PROJECT_ID;
  private location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

  constructor() {
    if (!this.apiKey) {
      throw new Error('Google Vertex AI API key not configured (GOOGLE_VERTEX_API_KEY)');
    }
    if (!this.projectId) {
      throw new Error('Google Project ID not configured (GOOGLE_PROJECT_ID)');
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    console.log('🎨 Starting Vertex AI image generation...');
    
    // Enhanced prompt with style and context
    const enhancedPrompt = this.buildEnhancedPrompt(request);
    console.log('📝 Enhanced prompt:', enhancedPrompt);

    // Convert aspect ratio to Vertex AI format
    const imageSpec = this.buildImageSpecification(request);

    try {
      // TEMPORARY FALLBACK: Use Unsplash API for image search until Vertex AI Imagen is configured
      // TODO: Replace with proper Vertex AI Imagen implementation once API is set up
      console.log('🔄 Using Unsplash fallback for image generation...');
      
      const imageUrl = await this.generateWithUnsplashFallback(enhancedPrompt);

      console.log('✅ Image generated and uploaded successfully');

      return {
        imageUrl,
        prompt: enhancedPrompt,
        metadata: {
          artStyle: request.artStyle,
          imageStyle: request.imageStyle,
          resolution: request.resolution,
          aspectRatio: request.aspectRatio,
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

    // Add article context if requested
    if (request.articleContext) {
      const contextElements = [];
      
      if (request.includeTitle && request.articleContext.headline) {
        contextElements.push(`relating to "${request.articleContext.headline}"`);
      }
      
      if (request.includeSubtitle && request.articleContext.hook) {
        contextElements.push(`with theme: ${request.articleContext.hook}`);
      }

      if (contextElements.length > 0) {
        prompt = `${prompt}, ${contextElements.join(', ')}`;
      }
    }

    // Add style specifications
    const styleModifiers = this.getStyleModifiers(request.artStyle, request.imageStyle);
    prompt = `${prompt}, ${styleModifiers}`;

    // Add quality and technical specifications
    prompt += ', high quality, professional, sharp details, well composed';

    // Add negative prompts to avoid unwanted elements
    prompt += '. Avoid: text overlays, watermarks, blurry, low quality, distorted';

    return prompt;
  }

  private getStyleModifiers(artStyle: string, imageStyle: string): string {
    const artModifiers: Record<string, string> = {
      'photorealistic': 'photorealistic, realistic photography, natural lighting',
      'illustrated': 'illustration style, digital art, artistic rendering',
      'arty': 'artistic style, creative composition, artistic interpretation',
      'minimalist': 'minimalist design, clean composition, simple elements',
      'cinematic': 'cinematic lighting, dramatic composition, movie-like quality',
      'abstract': 'abstract art style, conceptual design, artistic abstraction',
    };

    const styleModifiers: Record<string, string> = {
      'hero': 'banner style, hero image composition, wide format suitable',
      'lifestyle': 'lifestyle photography, natural setting, authentic feel',
      'professional': 'professional setting, business appropriate, polished look',
      'casual': 'casual setting, relaxed atmosphere, informal style',
      'dramatic': 'dramatic lighting, high contrast, striking composition',
      'corporate': 'corporate style, business environment, professional atmosphere',
    };

    return `${artModifiers[artStyle] || artStyle} style, ${styleModifiers[imageStyle] || imageStyle} composition`;
  }

  private buildImageSpecification(request: ImageGenerationRequest) {
    const resolution = parseInt(request.resolution);
    
    return {
      // Vertex AI Imagen parameters
      imageSize: this.getImageSize(request.aspectRatio, resolution),
    };
  }

  private getImageSize(aspectRatio: string, resolution: number): string {
    // Convert aspect ratio to Vertex AI format
    const ratioMap: Record<string, string> = {
      '1:1': '1024x1024',
      '9:16': '768x1152', // Portrait
      '4:5': '896x1152', // Instagram portrait
      '2:3': '768x1152', // Classic portrait
      '3:2': '1152x768', // Landscape
      '16:9': '1152x768', // Widescreen
    };

    let baseSize = ratioMap[aspectRatio] || '1152x768';
    
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
      '4:5': '4:5',
      '2:3': '2:3',
      '3:2': '3:2',
      '16:9': '16:9',
    };
    
    return ratioMap[aspectRatio] || '16:9';
  }

  private async getAccessToken(): Promise<string> {
    // For Vertex AI, we can use the API key directly
    // In production, you might want to use service account credentials
    return this.apiKey!;
  }

  private async uploadToImgBB(base64Data: string): Promise<string> {
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    
    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not configured');
    }

    try {
      const formData = new FormData();
      formData.append('image', base64Data);
      formData.append('key', imgbbApiKey);
      formData.append('name', `ai-generated-${Date.now()}`);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ImgBB upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('ImgBB upload failed: ' + (result.error?.message || 'Unknown error'));
      }

      return result.data.url;
    } catch (error: any) {
      console.error('❌ ImgBB upload error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }
}