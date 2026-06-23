/**
 * Image Generator Modal - Simplified Structure
 * Clean tabbed interface for AI and Unsplash image generation
 * Stable layout with top-anchored content and proper pagination
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, RefreshCw, Sparkles, Search, Loader2, ChevronDown, Info, Upload, Package, User, Cat, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
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
  // Image Ingredients - reference image for product/subject placement
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
  };
  attribution?: {
    user: string;
    username: string;
    source: 'unsplash' | 'ai' | 'upload';
  };
}

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (result: ImageGenerationResult) => void;
  articleContext?: {
    headline?: string;
    hook?: string;
    content?: string;
  };
  initialPrompt?: string;
}

// Constants
const ART_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic', description: 'Realistic photography' },
  { value: 'illustrated', label: 'Illustrated', description: 'Digital illustration' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like quality' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple style' },
  { value: 'abstract', label: 'Abstract', description: 'Conceptual art style' },
  { value: 'vintage', label: 'Vintage', description: 'Retro, classic look' },
  { value: 'modern', label: 'Modern', description: 'Contemporary design' },
  { value: 'artistic', label: 'Artistic', description: 'Creative interpretation' }
];

const IMAGE_STYLES = [
  { value: 'professional', label: 'Professional', description: 'Business-appropriate, polished' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'Natural, authentic feel' },
  { value: 'dramatic', label: 'Dramatic', description: 'High contrast, striking' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple design' },
  { value: 'corporate', label: 'Corporate', description: 'Business environment' },
  { value: 'creative', label: 'Creative', description: 'Artistic, unique perspective' },
  { value: 'warm', label: 'Warm', description: 'Cozy, inviting atmosphere' },
  { value: 'modern', label: 'Modern', description: 'Contemporary aesthetic' }
];

// Model Grid: Nano Pro (Premium) → Flash Image (Budget), ordered by cost
const VERTEX_MODELS = [
  // Nano Pro (Gemini 3 Pro) - Premium tier at different resolutions
  {
    value: 'gemini-3-pro-image-preview-4k',
    actualModel: 'gemini-3-pro-image-preview',
    label: 'Nano Pro',
    description: 'Best multimodal AI ($0.24)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['4K'],
    nativeResolutionFormat: 'k-scale',
    position: { row: 0, col: 0 },
    default: false
  },
  {
    value: 'gemini-3-pro-image-preview-2k',
    actualModel: 'gemini-3-pro-image-preview',
    label: 'Nano Pro',
    description: 'Standard AI ($0.134)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['2K'],
    nativeResolutionFormat: 'k-scale',
    position: { row: 1, col: 0 }
  },
  {
    value: 'gemini-3-pro-image-preview-1k',
    actualModel: 'gemini-3-pro-image-preview',
    label: 'Nano Pro',
    description: 'Budget AI ($0.134)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['1K'],
    nativeResolutionFormat: 'k-scale',
    position: { row: 2, col: 0 }
  },

  // Flash Image (Gemini 3.1 Flash) - Budget tier
  {
    value: 'gemini-3.1-flash-image-preview-2k',
    actualModel: 'gemini-3.1-flash-image-preview',
    label: 'Flash Image',
    description: 'Budget Gemini (~$0.10)',
    category: 'flash-image',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
    resolutions: ['2K'],
    nativeResolutionFormat: 'k-scale',
    position: { row: 0, col: 1 },
    default: true
  },
  {
    value: 'gemini-3.1-flash-image-preview-1k',
    actualModel: 'gemini-3.1-flash-image-preview',
    label: 'Flash Image',
    description: 'Cheapest option (~$0.07)',
    category: 'flash-image',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
    resolutions: ['1K'],
    nativeResolutionFormat: 'k-scale',
    position: { row: 1, col: 1 }
  }
];

const getModelConfig = (modelValue: string) => {
  return VERTEX_MODELS.find(m => m.value === modelValue) || VERTEX_MODELS[0];
};

const getDefaultModel = () => {
  return VERTEX_MODELS.find(m => m.default) || VERTEX_MODELS[0]; // Fallback to first Nano Banana model
};

const RESOLUTIONS = ['1024', '1152', '1280', '1408', '1536', '1792', '2048', '2304', '2560', '2816'];

const ASPECT_RATIOS = [
  '1:1', '3:4', '4:3', '9:16', '16:9'
];

const UNSPLASH_QUALITY_OPTIONS = [
  { value: 'thumb', label: 'Thumbnail (200px)', description: 'Small preview' },
  { value: 'small', label: 'Small (400px)', description: 'Web optimized' },
  { value: 'regular', label: 'Regular (1080px)', description: 'Standard quality' },
  { value: 'full', label: 'Full (2000px+)', description: 'High resolution' },
];

// Image compression utility - max 2400x2400 at 80% quality, uploads to cloud storage
const compressImage = async (imageUrl: string, maxSize = 2400, quality = 0.8): Promise<string> => {
  console.log('🔄 Starting image compression for:', imageUrl);

  // Step 1: Load and compress the image
  const compressedDataUrl = await new Promise<string>((resolve, reject) => {
    const img = new Image();
    // No crossOrigin needed - proxy is same-origin

    img.onload = () => {
      console.log('✅ Image loaded for compression:', img.width, 'x', img.height);
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        console.log(`🖼️ Image compressed: ${img.width}x${img.height} → ${width}x${height} @ ${quality * 100}% quality`);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Use proxy to avoid CORS issues
    img.src = `/api/download/image?url=${encodeURIComponent(imageUrl)}`;
  });

  // Step 2: Upload compressed image to cloud storage
  const dataSize = Math.round(compressedDataUrl.length / 1024);
  console.log(`📤 Uploading compressed image to cloud storage (${dataSize} KB)...`);

  const uploadResponse = await fetch('/api/upload/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: compressedDataUrl }),
  });

  console.log('📤 Upload response status:', uploadResponse.status);

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('❌ Upload failed:', errorText);
    throw new Error(errorText || 'Failed to upload compressed image');
  }

  const result = await uploadResponse.json();
  console.log(`✅ Compressed image uploaded: ${result.url}`);

  return result.url;
};

export function ImageGeneratorModal({
  isOpen,
  onClose,
  onImageGenerated,
  articleContext,
  initialPrompt = '',
}: ImageGeneratorModalProps) {
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<'ai' | 'unsplash'>('ai');

  // Reference image (Image Ingredients) states
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [referenceSubjectType, setReferenceSubjectType] = useState<'product' | 'person' | 'animal' | 'style'>('product');
  const [referenceSubjectDescription, setReferenceSubjectDescription] = useState('');
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation states
  const [prompt, setPrompt] = useState(initialPrompt);
  const [includeTitle, setIncludeTitle] = useState(false); // Default off
  const [includeSubtitle, setIncludeSubtitle] = useState(false); // Default off
  const [titleText, setTitleText] = useState(articleContext?.headline || '');
  const [subtitleText, setSubtitleText] = useState(articleContext?.hook || '');
  const [titleCase, setTitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [subtitleCase, setSubtitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingSubtitle, setIsEnhancingSubtitle] = useState(false);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [imageStyle, setImageStyle] = useState('professional');
  const [model, setModel] = useState(() => getDefaultModel().value);
  const [resolution, setResolution] = useState(() => getDefaultModel().resolutions[0]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [aiAnalyzedPrompt, setAiAnalyzedPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [useAiPrompt, setUseAiPrompt] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Unsplash states
  const [unsplashSearchTerm, setUnsplashSearchTerm] = useState('');
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [selectedUnsplashImage, setSelectedUnsplashImage] = useState<UnsplashImage | null>(null);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [isGeneratingSearchTerm, setIsGeneratingSearchTerm] = useState(false);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashQuality, setUnsplashQuality] = useState('regular');
  const [unsplashOrientation, setUnsplashOrientation] = useState('squarish');
  const [hasMoreUnsplashImages, setHasMoreUnsplashImages] = useState(true);
  const [unsplashAttribution, setUnsplashAttribution] = useState<{user: string; username: string} | null>(null);

  // Model configuration effect - update available options when model changes
  useEffect(() => {
    const modelConfig = getModelConfig(model);

    // Update resolution if current one is not available for selected model
    if (!modelConfig.resolutions.includes(resolution)) {
      setResolution(modelConfig.resolutions[0]);
    }

    // Update aspect ratio if current one is not available for selected model
    if (!modelConfig.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(modelConfig.aspectRatios[0]);
    }
  }, [model]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImage(null);
      setAiAnalyzedPrompt('');
      setUseAiPrompt(false);
      setPrompt(initialPrompt);
      // Reset title/subtitle state
      setIncludeTitle(false);
      setIncludeSubtitle(false);
      setTitleText(articleContext?.headline || '');
      setSubtitleText(articleContext?.hook || '');
      setTitleCase('as-typed');
      setSubtitleCase('as-typed');
      setIsEnhancingTitle(false);
      setIsEnhancingSubtitle(false);
      // Reset reference image (Image Ingredients) state
      setReferenceImage(null);
      setReferenceImagePreview(null);
      setReferenceImageBase64(null);
      setReferenceSubjectType('product');
      setReferenceSubjectDescription('');
      // Reset model state
      const defaultModel = getDefaultModel();
      setModel(defaultModel.value);
      setResolution(defaultModel.resolutions[0]);
      setAspectRatio('1:1');
      // Reset Unsplash state
      setUnsplashImages([]);
      setSelectedUnsplashImage(null);
      setUnsplashSearchTerm('');
      setUnsplashPage(1);
      setHasMoreUnsplashImages(true);
      setUnsplashAttribution(null);
      setActiveTab('ai');
      setHasAnalyzed(false);
    }
  }, [isOpen, initialPrompt, articleContext]);

  // Removed auto-analysis to save tokens - user must manually click analyze

  const analyzeArticleContent = async () => {
    if (!articleContext) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          articleContext, 
          artStyle, 
          imageStyle,
          // Include title/subtitle if checked
          includeTitle,
          includeSubtitle,
          titleText: includeTitle ? transformTextCase(titleText, titleCase) : '',
          subtitleText: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : ''
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze content');

      const result = await response.json();
      setAiAnalyzedPrompt(result.suggestedPrompt);
      setUseAiPrompt(true); // Auto-tick checkbox when analysis succeeds
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Error analyzing article content:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze article content. You can still enter a custom prompt.',
        variant: 'destructive',
      });
      setHasAnalyzed(true); // Mark as analyzed even on error to prevent retries
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enhanceStandalonePrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userPrompt: prompt, 
          artStyle, 
          imageStyle,
          // Include title/subtitle if checked
          includeTitle,
          includeSubtitle,
          titleText: includeTitle ? transformTextCase(titleText, titleCase) : '',
          subtitleText: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : ''
        }),
      });

      if (!response.ok) throw new Error('Failed to enhance prompt');

      const result = await response.json();
      setAiAnalyzedPrompt(result.suggestedPrompt);
      setUseAiPrompt(true); // Auto-tick checkbox when enhancement succeeds
      setHasAnalyzed(true);
      
      toast({
        title: 'Prompt Enhanced!',
        description: 'Your prompt has been optimized for better image generation.',
      });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. You can still use your original prompt.',
        variant: 'destructive',
      });
      setHasAnalyzed(true); // Mark as analyzed even on error to prevent retries
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to transform text case
  const transformTextCase = (text: string, caseType: 'as-typed' | 'sentence' | 'uppercase'): string => {
    switch (caseType) {
      case 'sentence':
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case 'uppercase':
        return text.toUpperCase();
      case 'as-typed':
      default:
        return text;
    }
  };

  // Toggle case for title
  const toggleTitleCase = () => {
    const cases: ('as-typed' | 'sentence' | 'uppercase')[] = ['as-typed', 'sentence', 'uppercase'];
    const currentIndex = cases.indexOf(titleCase);
    const nextCase = cases[(currentIndex + 1) % cases.length];
    setTitleCase(nextCase);
  };

  // Toggle case for subtitle  
  const toggleSubtitleCase = () => {
    const cases: ('as-typed' | 'sentence' | 'uppercase')[] = ['as-typed', 'sentence', 'uppercase'];
    const currentIndex = cases.indexOf(subtitleCase);
    const nextCase = cases[(currentIndex + 1) % cases.length];
    setSubtitleCase(nextCase);
  };

  // Enhance title specifically
  const enhanceTitle = async () => {
    if (!titleText.trim()) return;
    
    setIsEnhancingTitle(true);
    try {
      const response = await fetch('/api/ai/enhance-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titleText, 
          artStyle, 
          imageStyle,
          articleContext 
        }),
      });

      if (!response.ok) throw new Error('Failed to enhance title');

      const result = await response.json();
      setTitleText(result.enhancedTitle);
      
      toast({
        title: 'Title Enhanced!',
        description: 'Your title has been optimized for better visual impact.',
      });
    } catch (error) {
      console.error('Error enhancing title:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance title. You can still edit it manually.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingTitle(false);
    }
  };

  // Enhance subtitle specifically
  const enhanceSubtitle = async () => {
    if (!subtitleText.trim()) return;
    
    setIsEnhancingSubtitle(true);
    try {
      const response = await fetch('/api/ai/enhance-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subtitleText, 
          artStyle, 
          imageStyle,
          articleContext 
        }),
      });

      if (!response.ok) throw new Error('Failed to enhance subtitle');

      const result = await response.json();
      setSubtitleText(result.enhancedSubtitle);
      
      toast({
        title: 'Subtitle Enhanced!',
        description: 'Your subtitle has been optimized for better visual impact.',
      });
    } catch (error) {
      console.error('Error enhancing subtitle:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance subtitle. You can still edit it manually.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingSubtitle(false);
    }
  };

  // Reference image (Image Ingredients) handlers
  const handleReferenceImageSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PNG, JPEG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (7MB limit for Gemini inline data)
    if (file.size > 7 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 7MB.',
        variant: 'destructive',
      });
      return;
    }

    setReferenceImage(file);
    setReferenceImagePreview(URL.createObjectURL(file));

    // Convert to base64 for API
    try {
      const base64 = await fileToBase64(file);
      setReferenceImageBase64(base64);

      toast({
        title: 'Reference image added',
        description: `${file.name} ready for Image Ingredients generation.`,
      });
    } catch (error) {
      toast({
        title: 'Processing failed',
        description: 'Could not process image. Please try another.',
        variant: 'destructive',
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix to get raw base64
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
    setReferenceImageBase64(null);
    setReferenceSubjectDescription('');
    if (referenceFileInputRef.current) {
      referenceFileInputRef.current.value = '';
    }
  };

  const handleReferenceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleReferenceImageSelect(files[0]);
    }
  };

  // Check if current model supports Image Ingredients (only Nano Banana / Gemini models)
  const supportsImageIngredients = () => {
    const modelConfig = getModelConfig(model);
    return modelConfig.category === 'nano-banana';
  };

  const generateImage = async () => {
    const finalPrompt = useAiPrompt && aiAnalyzedPrompt ? aiAnalyzedPrompt : prompt;
    
    if (!finalPrompt.trim()) {
      toast({
        title: 'Missing Prompt',
        description: 'Please enter a description for the image you want to generate.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const request: ImageGenerationRequest = {
        prompt: finalPrompt,
        includeTitle,
        includeSubtitle,
        artStyle,
        imageStyle,
        resolution,
        aspectRatio,
        model,
        articleContext: {
          ...articleContext,
          // Override with user-entered text and case transformations
          headline: includeTitle ? transformTextCase(titleText, titleCase) : articleContext?.headline,
          hook: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : articleContext?.hook,
        },
        // Include reference image if provided (Image Ingredients)
        ...(referenceImageBase64 && supportsImageIngredients() && {
          referenceImage: {
            bytesBase64Encoded: referenceImageBase64,
            mimeType: referenceImage?.type || 'image/png',
            subjectType: referenceSubjectType,
            subjectDescription: referenceSubjectDescription || undefined,
          }
        }),
      };

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        const userMessage = error.details?.includes('ImgBB upload failed') 
          ? 'Image hosting service temporarily unavailable. Please try again in a moment.'
          : error.message || 'Failed to generate image';
        throw new Error(userMessage);
      }

      const result = await response.json();
      setGeneratedImage(result.imageUrl);
      setSelectedUnsplashImage(null);
      
      toast({
        title: 'Image Generated!',
        description: 'Your AI-generated image is ready.',
      });
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateUnsplashSearchTerm = async () => {
    if (!articleContext) return;

    setIsGeneratingSearchTerm(true);
    try {
      const response = await fetch('/api/ai/generate-unsplash-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleContext, artStyle, imageStyle }),
      });

      if (!response.ok) throw new Error('Failed to generate search term');

      const result = await response.json();
      setUnsplashSearchTerm(result.searchTerm);
      
      // Automatically search with the generated term
      await searchUnsplash(result.searchTerm, false);
    } catch (error: any) {
      console.error('Error generating search term:', error);
      toast({
        title: 'Search Term Generation Failed',
        description: 'Could not generate search term. Try entering one manually.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSearchTerm(false);
    }
  };

  const searchUnsplash = async (searchTerm?: string, loadMore = false) => {
    const term = searchTerm || unsplashSearchTerm;
    
    if (!term.trim()) {
      toast({
        title: 'Missing Search Term',
        description: 'Please enter a search term for Unsplash images.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearchingUnsplash(true);
    
    let pageToFetch = 1;
    if (loadMore) {
      pageToFetch = unsplashPage + 1;
    } else {
      setUnsplashImages([]);
      setHasMoreUnsplashImages(true);
    }
    
    const requestBody = {
      query: term,
      page: pageToFetch,
      per_page: 6,
      orientation: unsplashOrientation
    };
    
    try {
      const response = await fetch('/api/unsplash/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to search Unsplash');

      const result = await response.json();
      const newImages = result.results || [];
      
      if (loadMore) {
        setUnsplashImages(prev => {
          const newUniqueImages = newImages.filter(newImg => 
            !prev.some(existingImg => existingImg.id === newImg.id)
          );
          return [...prev, ...newUniqueImages];
        });
        setUnsplashPage(pageToFetch);
      } else {
        setUnsplashImages(newImages);
        setGeneratedImage(null);
        setUnsplashPage(1);
      }
      
      setHasMoreUnsplashImages(newImages.length === 6);
      
      if (newImages.length > 0) {
        toast({
          title: loadMore ? 'More Images Loaded!' : 'Images Found!',
          description: loadMore 
            ? `Loaded ${newImages.length} more images from Unsplash.`
            : `Found ${newImages.length} images from Unsplash.`,
        });
      } else if (!loadMore) {
        toast({
          title: 'No Images Found',
          description: 'Try a different search term or be more specific.',
          variant: 'destructive',
        });
      } else {
        setHasMoreUnsplashImages(false);
        toast({
          title: 'No More Images',
          description: 'All available images for this search have been loaded.',
        });
      }
    } catch (error: any) {
      console.error('Error searching Unsplash:', error);
      toast({
        title: 'Search Failed',
        description: error.message || 'Could not search Unsplash. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingUnsplash(false);
    }
  };

  const selectUnsplashImage = (image: UnsplashImage) => {
    setSelectedUnsplashImage(image);
    setGeneratedImage(null);
    setUnsplashAttribution({
      user: image.user.name,
      username: image.user.username
    });
  };

  const useGeneratedImage = async () => {
    let imageUrl: string;
    let description: string;
    let attribution: {user: string; username: string; source: 'unsplash' | 'ai'} | undefined;

    if (activeTab === 'unsplash' && selectedUnsplashImage) {
      imageUrl = selectedUnsplashImage.urls[unsplashQuality as keyof typeof selectedUnsplashImage.urls] || selectedUnsplashImage.urls.regular;
      description = 'Unsplash image has been added to your article.';
      attribution = {
        user: selectedUnsplashImage.user.name,
        username: selectedUnsplashImage.user.username,
        source: 'unsplash'
      };
    } else if (activeTab === 'ai' && generatedImage) {
      // Compress AI-generated images before using (max 2400px, 80% quality)
      setIsCompressing(true);
      try {
        imageUrl = await compressImage(generatedImage, 2400, 0.8);
        description = 'AI-generated image has been compressed and added to your article.';
      } catch (error: any) {
        console.error('Image compression failed, using original:', error);
        toast({
          title: 'Compression Failed',
          description: `Using original image. Error: ${error.message}`,
          variant: 'destructive',
        });
        imageUrl = generatedImage;
        description = 'AI-generated image has been added to your article (uncompressed).';
      } finally {
        setIsCompressing(false);
      }
      attribution = {
        user: 'AI Generated',
        username: 'vertex-ai',
        source: 'ai'
      };
    } else {
      toast({
        title: 'No Image Selected',
        description: 'Please generate an image or select one from Unsplash first.',
        variant: 'destructive',
      });
      return;
    }

    const result: ImageGenerationResult = {
      imageUrl,
      prompt: activeTab === 'unsplash'
        ? unsplashSearchTerm
        : (useAiPrompt && aiAnalyzedPrompt ? aiAnalyzedPrompt : prompt),
      metadata: { artStyle, imageStyle, resolution, aspectRatio, model },
      attribution,
    };

    onImageGenerated(result);
    onClose();

    toast({
      title: 'Image Added',
      description,
    });
  };

  const downloadImage = async () => {
    const imageToDownload = generatedImage || selectedUnsplashImage?.urls[unsplashQuality as keyof typeof selectedUnsplashImage.urls];
    if (!imageToDownload) return;

    try {
      // Use proxy endpoint to bypass CORS issues
      const proxyUrl = `/api/download/image?url=${encodeURIComponent(imageToDownload)}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Started',
        description: 'Your image download has begun.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download image.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl">AI Image Generator</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'unsplash')} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 grid w-full max-w-md grid-cols-2 shrink-0 border border-gray-300 h-12">
            <TabsTrigger 
              value="ai" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-orange-600 text-sm py-2"
            >
              AI Generator
            </TabsTrigger>
            <TabsTrigger 
              value="unsplash" 
              className="text-cyan-600 text-sm py-2"
              style={{
                backgroundColor: activeTab === 'unsplash' ? 'var(--cyan)' : undefined,
                color: activeTab === 'unsplash' ? '#1f2937' : undefined
              }}
            >
              Unsplash Search
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="ai" className="h-full mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full overflow-hidden">
                {/* AI Configuration Panel */}
                <div className="space-y-4 overflow-y-auto max-h-full pr-2" style={{ maxHeight: 'calc(95vh - 200px)' }}>
                  <h3 className="text-lg font-semibold text-orange-600">AI Configuration</h3>
                  
                  {/* Title/Subtitle Section */}
                  <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                    <h4 className="text-sm font-semibold text-cyan font-medium">Text Overlays</h4>
                    
                    {/* Title Field */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-title-overlay"
                          checked={includeTitle}
                          onChange={(e) => setIncludeTitle(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="include-title-overlay" className="text-sm font-medium">
                          Title Overlay
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Enter title text..."
                          value={titleText}
                          onChange={(e) => setTitleText(e.target.value)}
                          disabled={!includeTitle}
                          className={`flex-1 ${!includeTitle ? 'opacity-50' : ''}`}
                        />
                        <Button
                          onClick={toggleTitleCase}
                          disabled={!includeTitle || !titleText.trim()}
                          variant="outline"
                          size="sm"
                          className="px-2 text-xs font-mono"
                          title={`Case: ${titleCase}`}
                        >
                          TT
                        </Button>
                        <Button
                          onClick={enhanceTitle}
                          disabled={!includeTitle || !titleText.trim() || isEnhancingTitle}
                          variant="outline"
                          size="sm"
                          className="px-2"
                          title="Enhance title"
                        >
                          {isEnhancingTitle ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {titleText && includeTitle && (
                        <div className="text-xs text-gray-600 px-2 py-1 bg-white rounded border">
                          Preview: "{transformTextCase(titleText, titleCase)}"
                        </div>
                      )}
                    </div>

                    {/* Subtitle Field */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-subtitle-overlay"
                          checked={includeSubtitle}
                          onChange={(e) => setIncludeSubtitle(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="include-subtitle-overlay" className="text-sm font-medium">
                          Subtitle Overlay
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Enter subtitle text..."
                          value={subtitleText}
                          onChange={(e) => setSubtitleText(e.target.value)}
                          disabled={!includeSubtitle}
                          className={`flex-1 ${!includeSubtitle ? 'opacity-50' : ''}`}
                        />
                        <Button
                          onClick={toggleSubtitleCase}
                          disabled={!includeSubtitle || !subtitleText.trim()}
                          variant="outline"
                          size="sm"
                          className="px-2 text-xs font-mono"
                          title={`Case: ${subtitleCase}`}
                        >
                          TT
                        </Button>
                        <Button
                          onClick={enhanceSubtitle}
                          disabled={!includeSubtitle || !subtitleText.trim() || isEnhancingSubtitle}
                          variant="outline"
                          size="sm"
                          className="px-2"
                          title="Enhance subtitle"
                        >
                          {isEnhancingSubtitle ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {subtitleText && includeSubtitle && (
                        <div className="text-xs text-gray-600 px-2 py-1 bg-white rounded border">
                          Preview: "{transformTextCase(subtitleText, subtitleCase)}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Ingredients Section - Only for Nano Banana models */}
                  {supportsImageIngredients() && (
                    <div className="space-y-3 p-4 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-600/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-purple-300">🧪 Image Ingredients</h4>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-purple-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-xs">
                                  <p><strong>Product Placement:</strong> Upload a product image and describe the scene - AI will place your product in the generated image.</p>
                                  <p><strong>Style Transfer:</strong> Upload a style reference to influence the visual style of generation.</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {referenceImage && (
                          <Button
                            onClick={removeReferenceImage}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>

                      {!referenceImage ? (
                        <div
                          className="border-2 border-dashed border-purple-500/50 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400/70 hover:bg-purple-900/20 transition-colors"
                          onDrop={handleReferenceDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => referenceFileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                          <p className="text-purple-200 text-sm font-medium">
                            Drop product/reference image here
                          </p>
                          <p className="text-xs text-purple-400 mt-1">
                            PNG, JPEG, WebP • Max 7MB
                          </p>
                          <input
                            ref={referenceFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => e.target.files?.[0] && handleReferenceImageSelect(e.target.files[0])}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Preview */}
                          <div className="flex items-start space-x-3">
                            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500 flex-shrink-0">
                              <img
                                src={referenceImagePreview!}
                                alt="Reference"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-purple-200 truncate">
                                {referenceImage.name}
                              </p>
                              <p className="text-xs text-purple-400">
                                {(referenceImage.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>

                          {/* Subject Type Selection */}
                          <div className="space-y-2">
                            <Label className="text-xs text-purple-300">Subject Type</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { value: 'product', label: 'Product', icon: Package },
                                { value: 'person', label: 'Person', icon: User },
                                { value: 'animal', label: 'Animal', icon: Cat },
                                { value: 'style', label: 'Style', icon: Palette },
                              ].map(({ value, label, icon: Icon }) => (
                                <button
                                  key={value}
                                  onClick={() => setReferenceSubjectType(value as any)}
                                  className={`
                                    flex flex-col items-center justify-center p-2 rounded-md border transition-all
                                    ${referenceSubjectType === value
                                      ? 'border-purple-400 bg-purple-500/30 text-purple-200'
                                      : 'border-purple-600/50 bg-purple-900/20 text-purple-400 hover:border-purple-500/70'
                                    }
                                  `}
                                >
                                  <Icon className="h-4 w-4 mb-1" />
                                  <span className="text-xs">{label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Subject Description */}
                          <div className="space-y-1">
                            <Label className="text-xs text-purple-300">Description (optional)</Label>
                            <Input
                              placeholder={`Describe the ${referenceSubjectType}...`}
                              value={referenceSubjectDescription}
                              onChange={(e) => setReferenceSubjectDescription(e.target.value)}
                              className="bg-purple-900/30 border-purple-600/50 text-purple-100 placeholder:text-purple-500 text-sm h-8"
                            />
                            <p className="text-xs text-purple-500">
                              e.g., "red coffee mug with logo", "golden retriever puppy"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Usage hint */}
                      <div className="text-xs text-purple-400 bg-purple-900/30 rounded p-2">
                        💡 <strong>Tip:</strong> Describe how you want the {referenceSubjectType} placed in your prompt below.
                        {referenceSubjectType === 'product' && ' e.g., "Place this product on a marble countertop in a modern kitchen"'}
                        {referenceSubjectType === 'style' && ' The generated image will adopt this visual style.'}
                      </div>
                    </div>
                  )}

                  {/* Image Description Section */}
                  <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-cyan font-medium">Image Description</h4>
                      {!articleContext && prompt.trim() && (
                        <Button
                          onClick={enhanceStandalonePrompt}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          {isAnalyzing ? 'Enhancing...' : hasAnalyzed ? 'Re-enhance' : 'Enhance prompt'}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the image you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    
                    {/* AI Enhanced Prompt Display - Only for standalone mode */}
                    {!articleContext && aiAnalyzedPrompt && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            id="use-ai-prompt-standalone"
                            checked={useAiPrompt}
                            onChange={(e) => setUseAiPrompt(e.target.checked)}
                          />
                          <Label htmlFor="use-ai-prompt-standalone" className="text-sm font-medium text-gray-700">
                            Use enhanced prompt
                          </Label>
                        </div>
                        <p className="text-sm text-gray-700">{aiAnalyzedPrompt}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis Section - Always visible */}
                  {articleContext && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 font-medium">AI Article Analysis</Label>
                        <Button
                          onClick={analyzeArticleContent}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          {isAnalyzing ? 'Generating...' : hasAnalyzed ? 'Regenerate prompt' : 'Generate prompt'}
                        </Button>
                      </div>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="use-ai-prompt"
                            checked={useAiPrompt}
                            onChange={(e) => setUseAiPrompt(e.target.checked)}
                          />
                          <Label htmlFor="use-ai-prompt" className="text-sm font-medium text-gray-700">
                            Use AI prompt
                          </Label>
                        </div>
                        {aiAnalyzedPrompt ? (
                          <p className="text-sm mt-2 text-gray-700">{aiAnalyzedPrompt}</p>
                        ) : (
                          <p className="text-sm mt-2 text-gray-500 italic">Click "Generate prompt" to analyze your article content</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Model Selection Section */}
                  <div className="space-y-2 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-cyan font-medium">AI Model</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1 text-xs">
                              <p><strong>Nano Banana:</strong> Premium Gemini Pro with K-scale resolutions (1K, 2K, 4K)</p>
                              <p><strong>Flash Image:</strong> Budget Gemini 3.1 Flash (1K, 2K)</p>
                              <p>Top row: Best quality, Bottom row: Budget options</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* 2x3 Model Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Column Headers */}
                      <div className="text-center text-xs font-semibold text-purple-700">🍌 Nano Banana</div>
                      <div className="text-center text-xs font-semibold text-blue-700">⚡ Flash Image</div>

                      {/* Model Grid */}
                      {Array.from({ length: 3 }, (_, row) => (
                        Array.from({ length: 2 }, (_, col) => {
                          const modelOption = VERTEX_MODELS.find(m =>
                            m.position?.row === row && m.position?.col === col
                          );
                          if (!modelOption) return null;

                          return (
                            <label
                              key={modelOption.value}
                              className={`
                                relative cursor-pointer rounded-md border-2 py-2 px-2 text-center transition-all duration-200 hover:shadow-md
                                ${model === modelOption.value
                                  ? col === 0
                                    ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                                    : 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name="model"
                                value={modelOption.value}
                                checked={model === modelOption.value}
                                onChange={(e) => setModel(e.target.value)}
                                className="sr-only"
                              />
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold">{modelOption.label}</div>
                                <div className="text-[10px] opacity-75 leading-tight">
                                  {modelOption.nativeResolutionFormat === 'k-scale'
                                    ? modelOption.resolutions.join(', ')
                                    : modelOption.resolutions.slice(0, 2).join(', ')
                                  } ({modelOption.description.match(/\(\$[\d\.]+\)/)?.[0] || '~$0.04'})
                                </div>
                              </div>
                              {model === modelOption.value && (
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 border-2 border-white"></div>
                              )}
                            </label>
                          );
                        })
                      )).flat().filter(Boolean)}
                    </div>
                  </div>

                  {/* Style & Settings Section */}
                  <div className="space-y-2 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                    <h4 className="text-sm font-semibold text-cyan font-medium">Style & Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 min-w-0">
                        <Label htmlFor="art-style" className="text-xs">Art Style</Label>
                        <Select value={artStyle} onValueChange={setArtStyle}>
                          <SelectTrigger className="h-8 text-sm max-w-full focus:ring-1 focus:ring-orange-500 focus:ring-inset">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="start" className="max-h-80 overflow-y-auto z-50 max-w-xs">
                            {ART_STYLES.map((style) => (
                              <SelectItem key={style.value} value={style.value} className="py-1.5">
                                <div className="space-y-0.5 text-left">
                                  <div className="font-medium text-sm">{style.label}</div>
                                  <div className="text-xs text-gray-500">{style.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <Label htmlFor="image-style" className="text-xs">Image Style</Label>
                        <Select value={imageStyle} onValueChange={setImageStyle}>
                          <SelectTrigger className="h-8 text-sm max-w-full focus:ring-1 focus:ring-orange-500 focus:ring-inset">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="start" className="max-h-80 overflow-y-auto z-50 max-w-xs">
                            {IMAGE_STYLES.map((style) => (
                              <SelectItem key={style.value} value={style.value} className="py-1.5">
                                <div className="space-y-0.5 text-left">
                                  <div className="font-medium text-sm">{style.label}</div>
                                  <div className="text-xs text-gray-500">{style.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <Label htmlFor="resolution" className="text-xs">Resolution</Label>
                        <Select value={resolution} onValueChange={setResolution}>
                          <SelectTrigger className="h-8 text-sm max-w-full focus:ring-1 focus:ring-orange-500 focus:ring-inset">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="start">
                            {getModelConfig(model).resolutions.map((res) => (
                              <SelectItem key={res} value={res} className="text-left">
                                {res}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <Label htmlFor="aspect-ratio" className="text-xs">Aspect Ratio</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className="h-8 text-sm max-w-full focus:ring-1 focus:ring-orange-500 focus:ring-inset">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="start">
                            {getModelConfig(model).aspectRatios.map((ratio) => (
                              <SelectItem key={ratio} value={ratio} className="text-left">
                                {ratio}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={generateImage}
                    disabled={isGenerating}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate AI Image'}
                  </Button>
                </div>

                {/* AI Preview Panel */}
                <div className="flex flex-col h-full overflow-hidden">
                  <h3 className="text-lg font-semibold text-orange-600 shrink-0">AI Preview</h3>

                  <div className="flex-1 overflow-y-auto mt-3">
                    <div
                      className="bg-gray-800 rounded-lg flex items-center justify-center w-full"
                      style={{
                        aspectRatio: aspectRatio.replace(':', '/'),
                        maxHeight: aspectRatio === '9:16' || aspectRatio === '2:3' || aspectRatio === '3:4' || aspectRatio === '4:5'
                          ? 'calc(95vh - 280px)'
                          : 'auto'
                      }}
                    >
                      {generatedImage ? (
                        <div className="relative w-full h-full">
                          <img
                            src={generatedImage}
                            alt="Generated"
                            className="w-full h-full object-contain rounded-lg"
                          />
                          <div className="absolute top-2 right-2 space-x-2">
                            <Button onClick={downloadImage} size="sm" variant="secondary">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 p-6">
                          <Sparkles className="h-10 w-10 mx-auto mb-2 text-orange-400" />
                          <p className="text-sm">Generated image will appear here</p>
                          <p className="text-xs text-gray-500 mt-1">Aspect ratio: {aspectRatio}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {generatedImage && (
                    <div className="flex gap-2 mt-3 shrink-0">
                      <Button
                        onClick={useGeneratedImage}
                        disabled={isCompressing}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Compressing...
                          </>
                        ) : (
                          'Use This Image'
                        )}
                      </Button>
                      <Button onClick={generateImage} variant="outline" disabled={isCompressing}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="unsplash" className="h-full mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
                {/* Unsplash Configuration Panel */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--cyan)' }}>Unsplash Search</h3>
                  
                  {/* Search Section */}
                  <div className="space-y-2">
                    <Label htmlFor="search-term">Search Term</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search-term"
                        placeholder="Enter search keywords..."
                        value={unsplashSearchTerm}
                        onChange={(e) => setUnsplashSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                      />
                      {articleContext && (
                        <Button
                          onClick={generateUnsplashSearchTerm}
                          disabled={isGeneratingSearchTerm}
                          variant="outline"
                          size="sm"
                        >
                          {isGeneratingSearchTerm ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Orientation Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Image Orientation</Label>
                    <Select value={unsplashOrientation} onValueChange={setUnsplashOrientation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="squarish" className="text-left">Any (Square-ish)</SelectItem>
                        <SelectItem value="landscape" className="text-left">Landscape (Wide)</SelectItem>
                        <SelectItem value="portrait" className="text-left">Portrait (Tall)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="quality">Image Quality</Label>
                    <Select value={unsplashQuality} onValueChange={setUnsplashQuality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        {UNSPLASH_QUALITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => searchUnsplash()}
                    disabled={isSearchingUnsplash || !unsplashSearchTerm.trim()}
                    className="w-full font-bold border-2 shadow-lg"
                    style={{ 
                      backgroundColor: 'var(--cyan)', 
                      color: '#000000', 
                      borderColor: 'var(--cyan)'
                    }}
                  >
                    {isSearchingUnsplash ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    {isSearchingUnsplash ? 'Searching...' : 'Search Unsplash'}
                  </Button>

                  {/* Selected Image Preview */}
                  {selectedUnsplashImage && (
                    <div className="space-y-2">
                      <Label>Selected Image Preview</Label>
                      <div className="relative">
                        <div className="w-full h-96 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--cyan)' }}>
                          <img 
                            src={selectedUnsplashImage.urls.small} 
                            alt={selectedUnsplashImage.alt_description || 'Selected image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 p-2 rounded bg-gray-800/50 text-xs text-gray-300">
                          <p className="font-medium">📷 {selectedUnsplashImage.user.name}</p>
                          {selectedUnsplashImage.alt_description && (
                            <p className="mt-1 opacity-75">{selectedUnsplashImage.alt_description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unsplash Preview Panel */}
                <div className="space-y-4 flex flex-col">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--cyan)' }}>Unsplash Results</h3>
                  
                  <div className="flex-1 overflow-y-auto max-h-[600px]">
                    {unsplashImages.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          {unsplashImages.map((image) => (
                            <div
                              key={image.id}
                              onClick={() => selectUnsplashImage(image)}
                              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                selectedUnsplashImage?.id === image.id 
                                  ? 'border-cyan-500 ring-2 ring-cyan-200' 
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                            >
                              <img 
                                src={image.urls.small} 
                                alt={image.alt_description || 'Unsplash image'}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-600 truncate">
                                  by {image.user.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {hasMoreUnsplashImages && (
                          <Button
                            onClick={() => searchUnsplash(undefined, true)}
                            disabled={isSearchingUnsplash}
                            variant="outline"
                            className="w-full"
                          >
                            {isSearchingUnsplash ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                            Load More Images
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-center text-gray-500">
                        <div>
                          <Search className="h-12 w-12 mx-auto mb-2 text-cyan-300" />
                          <p>Search results will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedUnsplashImage && (
                    <div className="space-y-2 border-t pt-4">
                      <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3">
                        <p className="text-sm text-gray-700">
                          Selected: <strong>{selectedUnsplashImage.alt_description || 'Untitled'}</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          Photo by {selectedUnsplashImage.user.name} on Unsplash
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={useGeneratedImage} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                          Use This Image
                        </Button>
                        <Button onClick={downloadImage} variant="outline" className="border-cyan-300 text-cyan-600 hover:bg-cyan-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}