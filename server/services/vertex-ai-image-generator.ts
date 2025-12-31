/**
 * Vertex AI Image Generator Service
 * Handles AI-powered image generation using Google Vertex AI Imagen with proper service account authentication
 */

import { GoogleAuth } from 'google-auth-library';

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
      // Use proper service account credentials
      this.auth = new GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: this.projectId,
          private_key_id: 'vertex-ai-image-gen',
          private_key: this.serviceAccountKey,
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
      
      // Call Vertex AI Imagen API
      const imageUrl = await this.callVertexAIImagen(enhancedPrompt, imageSpec);

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

    // Add text overlay requests if requested
    const textOverlays = [];
    if (request.includeTitle && request.articleContext?.headline) {
      textOverlays.push(`with text overlay "${request.articleContext.headline}" prominently displayed`);
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


  private async callVertexAIImagen(prompt: string, imageSpec: any): Promise<string> {
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-001:predict`;
    
    console.log('🌐 Vertex AI endpoint:', endpoint);
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
      
      // Upload the base64 image to ImgBB
      const imageUrl = await this.uploadToImgBB(base64Image);
      
      return imageUrl;

    } catch (error: any) {
      console.error('💥 Vertex AI generation error:', error);
      throw error;
    }
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
}