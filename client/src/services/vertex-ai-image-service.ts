/**
 * Vertex AI Image Generation Service
 * Reusable module for generating AI images using Google Vertex AI Imagen 3.0
 */

// Types
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
  success: boolean;
  message?: string;
}

export interface PromptAnalysisRequest {
  articleContext?: {
    headline?: string;
    hook?: string;
    content?: string;
  };
  artStyle: string;
  imageStyle: string;
}

export interface UnsplashSearchRequest {
  articleContext?: {
    headline?: string;
    hook?: string;
    content?: string;
  };
  artStyle: string;
  imageStyle: string;
}

export interface PromptAnalysisResult {
  searchTerm: string;
  success: boolean;
  message?: string;
}

/**
 * Generate an AI image using Vertex AI Imagen 3.0
 */
export async function generateVertexAIImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  try {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate image');
    }

    const result = await response.json();
    
    return {
      imageUrl: result.imageUrl,
      success: true,
      message: 'Image generated successfully',
    };
  } catch (error: any) {
    console.error('Error generating Vertex AI image:', error);
    
    return {
      imageUrl: '',
      success: false,
      message: error.message || 'Failed to generate image',
    };
  }
}

/**
 * Analyze article context to generate optimized image prompt
 */
export async function analyzeImagePrompt(
  request: PromptAnalysisRequest
): Promise<PromptAnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze-image-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze prompt');
    }

    const result = await response.json();
    
    return {
      searchTerm: result.suggestedPrompt || result.searchTerm,
      success: true,
      message: 'Prompt analyzed successfully',
    };
  } catch (error: any) {
    console.error('Error analyzing image prompt:', error);
    
    return {
      searchTerm: '',
      success: false,
      message: error.message || 'Failed to analyze prompt',
    };
  }
}

/**
 * Generate Unsplash search term from article context
 */
export async function generateUnsplashSearchTerm(
  request: UnsplashSearchRequest
): Promise<PromptAnalysisResult> {
  try {
    const response = await fetch('/api/ai/generate-unsplash-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate search term');
    }

    const result = await response.json();
    
    return {
      searchTerm: result.searchTerm,
      success: true,
      message: 'Search term generated successfully',
    };
  } catch (error: any) {
    console.error('Error generating search term:', error);
    
    return {
      searchTerm: '',
      success: false,
      message: error.message || 'Failed to generate search term',
    };
  }
}

/**
 * Art style options for image generation - Updated with descriptions
 */
export const ART_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic', description: 'Realistic photography' },
  { value: 'illustrated', label: 'Illustrated', description: 'Digital illustration' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like quality' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple style' },
  { value: 'abstract', label: 'Abstract', description: 'Conceptual art style' },
  { value: 'vintage', label: 'Vintage', description: 'Retro, classic look' },
  { value: 'modern', label: 'Modern', description: 'Contemporary design' },
  { value: 'artistic', label: 'Artistic', description: 'Creative interpretation' }
];

/**
 * Image style options for generation - Updated with descriptions
 */
export const IMAGE_STYLES = [
  { value: 'professional', label: 'Professional', description: 'Business-appropriate, polished' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'Natural, authentic feel' },
  { value: 'dramatic', label: 'Dramatic', description: 'High contrast, striking' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple design' },
  { value: 'corporate', label: 'Corporate', description: 'Business environment' },
  { value: 'creative', label: 'Creative', description: 'Artistic, unique perspective' },
  { value: 'warm', label: 'Warm', description: 'Cozy, inviting atmosphere' },
  { value: 'modern', label: 'Modern', description: 'Contemporary aesthetic' }
];

/**
 * Resolution options - Updated for Vertex AI compatibility
 */
export const RESOLUTION_OPTIONS = [
  { value: '1024', label: '1024px' },
  { value: '1500', label: '1500px' },
  { value: '2048', label: '2048px' }
];

/**
 * Aspect ratio options
 */
export const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '4:5', label: 'Instagram (4:5)' },
  { value: '2:3', label: 'Classic Portrait (2:3)' },
  { value: '3:2', label: 'Classic Landscape (3:2)' },
  { value: '16:9', label: 'Wide (16:9)' },
];