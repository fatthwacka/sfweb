/**
 * AI Image Generator - Dedicated page for AI-powered image generation
 * Uses Google Vertex AI Imagen and Gemini models for professional image creation
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Download, Info, Eye, Brain, CheckSquare, Square, Upload, Package, User, Cat, Palette, X } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';

// AI Model configurations
const VERTEX_MODELS = [
  {
    value: 'gemini-3-pro-image-preview-4k',
    position: { row: 0, col: 0 },
    label: 'Nano Pro',
    description: 'Best multimodal AI ($0.24)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['4K'],
    nativeResolution: '4K',
    nativeResolutionFormat: 'k-scale',
    default: true,
  },
  {
    value: 'imagen-4.0-ultra-generate-001',
    position: { row: 0, col: 1 },
    label: 'Imagen Ultra',
    description: 'Highest quality (~$0.04)',
    category: 'imagen',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
    resolutions: ['2048px', '1536px', '1024px'],
    nativeResolution: '2048px',
    nativeResolutionFormat: 'px',
  },
  {
    value: 'gemini-3-pro-image-preview-2k',
    position: { row: 1, col: 0 },
    label: 'Nano Mid',
    description: 'Standard AI ($0.134)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['2K'],
    nativeResolution: '2K',
    nativeResolutionFormat: 'k-scale',
  },
  {
    value: 'imagen-4.0-generate-001',
    position: { row: 1, col: 1 },
    label: 'Imagen Standard',
    description: 'Mid-range quality (~$0.04)',
    category: 'imagen',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
    resolutions: ['1536px', '1024px'],
    nativeResolution: '1536px',
    nativeResolutionFormat: 'px',
  },
  {
    value: 'gemini-3-pro-image-preview-1k',
    position: { row: 2, col: 0 },
    label: 'Nano Fast',
    description: 'Budget AI ($0.134)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['1K'],
    nativeResolution: '1K',
    nativeResolutionFormat: 'k-scale',
  },
  {
    value: 'imagen-4.0-fast-generate-001',
    position: { row: 2, col: 1 },
    label: 'Imagen Fast',
    description: 'Budget option (~$0.039)',
    category: 'imagen',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
    resolutions: ['1024px'],
    nativeResolution: '1024px',
    nativeResolutionFormat: 'px',
  },
];

const ART_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic', description: 'Realistic photography style' },
  { value: 'illustrated', label: 'Illustrated', description: 'Digital art and illustration' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like dramatic composition' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple design' },
  { value: 'abstract', label: 'Abstract', description: 'Conceptual artistic interpretation' },
  { value: 'vintage', label: 'Vintage', description: 'Retro and classic style' },
];

const IMAGE_STYLES = [
  { value: 'professional', label: 'Professional', description: 'Business and corporate appropriate' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'Natural and authentic feel' },
  { value: 'dramatic', label: 'Dramatic', description: 'High contrast and striking' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean and uncluttered' },
  { value: 'corporate', label: 'Corporate', description: 'Business environment focused' },
  { value: 'creative', label: 'Creative', description: 'Unique and innovative approach' },
];

const getModelConfig = (modelValue: string) => {
  return VERTEX_MODELS.find(m => m.value === modelValue) || VERTEX_MODELS[0];
};

const getDefaultModel = () => {
  return VERTEX_MODELS.find(m => m.default) || VERTEX_MODELS[0];
};

export default function AIImageGenerator() {
  const [, setLocation] = useLocation();

  // Reference image (Image Ingredients) state
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [referenceSubjectType, setReferenceSubjectType] = useState<'product' | 'person' | 'animal' | 'style'>('product');
  const [referenceSubjectDescription, setReferenceSubjectDescription] = useState('');
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  // AI Generator state
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(getDefaultModel().value);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [imageStyle, setImageStyle] = useState('professional');
  const [resolution, setResolution] = useState(getDefaultModel().nativeResolution);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Title/Subtitle state
  const [includeTitle, setIncludeTitle] = useState(false);
  const [includeSubtitle, setIncludeSubtitle] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [titleCase, setTitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [subtitleCase, setSubtitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingSubtitle, setIsEnhancingSubtitle] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Brand Intelligence state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandToggles, setBrandToggles] = useState<Set<string>>(new Set(['industry', 'visual']));
  const [checkedPriority, setCheckedPriority] = useState<string[]>([]);
  const [checkedSecondary, setCheckedSecondary] = useState<string[]>([]);
  const [brandClients, setBrandClients] = useState([]);
  const [brandProfile, setBrandProfile] = useState(null);

  // Update resolution to native resolution when model changes
  useEffect(() => {
    const modelConfig = getModelConfig(model);
    setResolution(modelConfig.nativeResolution);
  }, [model]);

  // Load brand clients on mount
  useEffect(() => {
    const loadBrandClients = async () => {
      try {
        const response = await fetch('/api/content-management/brand-intelligence/clients');
        if (response.ok) {
          const data = await response.json();
          setBrandClients(data.data?.clients || []);
        }
      } catch (error) {
        console.error('Failed to load brand clients:', error);
      }
    };
    loadBrandClients();
  }, []);

  // Load brand profile when brand is selected
  useEffect(() => {
    if (selectedBrand) {
      const loadBrandProfile = async () => {
        try {
          const response = await fetch(`/api/content-management/brand-intelligence/clients/${selectedBrand}`);
          if (response.ok) {
            const data = await response.json();
            console.log('🧠 Brand profile loaded:', data);
            setBrandProfile(data.client || null);
          }
        } catch (error) {
          console.error('Failed to load brand profile:', error);
        }
      };
      loadBrandProfile();
    } else {
      setBrandProfile(null);
    }
  }, [selectedBrand]);

  // Benefits selection algorithm from handoff document
  const generateBenefitsSelection = (checkedPriority: string[], checkedSecondary: string[]) => {
    const allSelected = [...checkedPriority, ...checkedSecondary];

    if (allSelected.length <= 3) return allSelected;

    // Use 2-3 benefits randomly from user selections
    const shuffled = allSelected.sort(() => Math.random() - 0.5);
    const useCount = Math.min(3, Math.max(2, Math.floor(allSelected.length * 0.6)));
    return shuffled.slice(0, useCount);
  };

  // Text transformation helper
  const transformTextCase = (text: string, caseType: 'as-typed' | 'sentence' | 'uppercase') => {
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

  // Case toggle functions
  const toggleTitleCase = () => {
    const cases: Array<'as-typed' | 'sentence' | 'uppercase'> = ['as-typed', 'sentence', 'uppercase'];
    const currentIndex = cases.indexOf(titleCase);
    const nextIndex = (currentIndex + 1) % cases.length;
    setTitleCase(cases[nextIndex]);
  };

  const toggleSubtitleCase = () => {
    const cases: Array<'as-typed' | 'sentence' | 'uppercase'> = ['as-typed', 'sentence', 'uppercase'];
    const currentIndex = cases.indexOf(subtitleCase);
    const nextIndex = (currentIndex + 1) % cases.length;
    setSubtitleCase(cases[nextIndex]);
  };

  // Enhancement functions
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
          articleContext: undefined // No article context in standalone mode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTitleText(data.enhancedTitle);
        toast({
          title: 'Title Enhanced',
          description: 'Your title has been optimized for visual impact.',
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance title. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingTitle(false);
    }
  };

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
          articleContext: undefined // No article context in standalone mode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubtitleText(data.enhancedSubtitle);
        toast({
          title: 'Subtitle Enhanced',
          description: 'Your subtitle has been optimized for clarity.',
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance subtitle. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingSubtitle(false);
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsEnhancingPrompt(true);
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
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrompt(data.suggestedPrompt || data.enhancedPrompt);
        toast({
          title: 'Prompt Enhanced',
          description: 'Your image description has been optimized for AI generation.',
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Reference image (Image Ingredients) handlers
  const handleReferenceImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PNG, JPEG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

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

  const supportsImageIngredients = () => {
    const modelConfig = getModelConfig(model);
    return modelConfig.category === 'nano-banana';
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for your image.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          artStyle,
          imageStyle,
          resolution,
          aspectRatio,
          includeTitle,
          includeSubtitle,
          articleContext: includeTitle || includeSubtitle ? {
            headline: includeTitle ? transformTextCase(titleText, titleCase) : undefined,
            hook: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : undefined,
          } : undefined,
          // Brand intelligence integration from handoff document
          brandIntelligence: selectedBrand ? {
            brandId: selectedBrand,
            activeToggles: Array.from(brandToggles),
            finalBenefits: generateBenefitsSelection(checkedPriority, checkedSecondary),
            brandData: brandProfile?.client
          } : undefined,
          // Image Ingredients - reference image for product/subject placement
          ...(referenceImageBase64 && supportsImageIngredients() && {
            referenceImage: {
              bytesBase64Encoded: referenceImageBase64,
              mimeType: referenceImage?.type || 'image/png',
              subjectType: referenceSubjectType,
              subjectDescription: referenceSubjectDescription || undefined,
            }
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImage(data.imageUrl);
        toast({
          title: 'Image Generated',
          description: 'Your AI image has been created successfully.',
        });
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/tools')}
                className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-salmon mb-4">AI Image Generator</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Generate professional images using Google Vertex AI with custom prompts, styles, and text overlays
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuration Panel */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-salmon">Configuration</h2>
                    
                    {/* Text Overlays Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <h3 className="text-sm font-semibold text-cyan font-medium">Text Overlays</h3>
                      
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
                          <Label htmlFor="include-title-overlay" className="text-sm font-medium text-white">
                            Title Overlay
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Enter title text..."
                            value={titleText}
                            onChange={(e) => setTitleText(e.target.value)}
                            disabled={!includeTitle}
                            className="flex-1"
                          />
                          <Button
                            onClick={toggleTitleCase}
                            disabled={!includeTitle || !titleText.trim()}
                            variant="outline"
                            size="sm"
                            className="px-2"
                            title="Toggle case"
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
                          <div className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded border">
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
                          <Label htmlFor="include-subtitle-overlay" className="text-sm font-medium text-white">
                            Subtitle Overlay
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Enter subtitle text..."
                            value={subtitleText}
                            onChange={(e) => setSubtitleText(e.target.value)}
                            disabled={!includeSubtitle}
                            className="flex-1"
                          />
                          <Button
                            onClick={toggleSubtitleCase}
                            disabled={!includeSubtitle || !subtitleText.trim()}
                            variant="outline"
                            size="sm"
                            className="px-2"
                            title="Toggle case"
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
                          <div className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded border">
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
                            <h3 className="text-sm font-semibold text-purple-300">🧪 Image Ingredients</h3>
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

                    {/* Brand Intelligence Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-cyan font-medium">Brand Intelligence</h3>
                      </div>
                      
                      {/* Brand Selection Dropdown */}
                      <div className="space-y-2">
                        <Label htmlFor="brand-select" className="text-white">Select Client Brand</Label>
                        <Select value={selectedBrand || 'none'} onValueChange={(value) => setSelectedBrand(value === 'none' ? null : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No brand intelligence</SelectItem>
                            {brandClients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}{client.industry ? ` - ${client.industry}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Brand Toggle Grid - Only show when brand is selected */}
                      {selectedBrand && brandProfile && (
                        <div className="space-y-3">
                          {/* Toggle Switches Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'visual', label: 'Visual Style', desc: 'Color personality + mood' },
                              { id: 'industry', label: 'Industry Context', desc: 'Business segment + niche' },
                              { id: 'audience', label: 'Target Audience', desc: 'Customer demographics' },
                              { id: 'benefits', label: 'Smart Benefits', desc: 'Priority + secondary benefits' },
                              { id: 'guidelines', label: 'Content Guidelines', desc: 'Positive examples' },
                              { id: 'compliance', label: 'Compliance Rules', desc: 'Prohibited terms' }
                            ].map((toggle) => (
                              <label
                                key={toggle.id}
                                className={`radio-btn-base ${
                                  brandToggles.has(toggle.id)
                                    ? 'radio-btn-brand-selected'
                                    : 'radio-btn-unselected'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={brandToggles.has(toggle.id)}
                                  onChange={(e) => {
                                    const newToggles = new Set(brandToggles);
                                    if (e.target.checked) {
                                      newToggles.add(toggle.id);
                                    } else {
                                      newToggles.delete(toggle.id);
                                    }
                                    setBrandToggles(newToggles);
                                  }}
                                  className="sr-only"
                                />
                                <div className="space-y-1">
                                  <div className="radio-btn-text">{toggle.label}</div>
                                  <div className="radio-btn-desc">{toggle.desc}</div>
                                </div>
                              </label>
                            ))}
                          </div>

                          {/* Benefits Selection - Only show when benefits toggle is active */}
                          {brandToggles.has('benefits') && brandProfile?.client_brand_profiles?.[0] && (
                            <div className="space-y-2 p-3 bg-gray-800 rounded border">
                              <p className="text-xs font-medium text-cyan">Smart Benefits Selection</p>
                              
                              {/* Priority Benefits */}
                              {brandProfile.client_brand_profiles[0].priority_benefits?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-purple-400 font-medium">Priority Benefits</p>
                                  <div className="flex flex-wrap gap-1">
                                    {brandProfile.client.client_brand_profiles[0].priority_benefits.map((benefit: string) => (
                                      <button
                                        key={benefit}
                                        onClick={() => {
                                          if (checkedPriority.includes(benefit)) {
                                            setCheckedPriority(prev => prev.filter(b => b !== benefit));
                                          } else {
                                            setCheckedPriority(prev => [...prev, benefit]);
                                          }
                                        }}
                                        className={`text-xs px-2 py-1 rounded border ${
                                          checkedPriority.includes(benefit)
                                            ? 'bg-purple-500 text-white border-purple-400'
                                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                                        }`}
                                      >
                                        {checkedPriority.includes(benefit) ? (
                                          <CheckSquare className="h-3 w-3 inline mr-1" />
                                        ) : (
                                          <Square className="h-3 w-3 inline mr-1" />
                                        )}
                                        {benefit}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Secondary Benefits */}
                              {brandProfile.client.client_brand_profiles[0].secondary_benefits?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-blue-400 font-medium">Secondary Benefits</p>
                                  <div className="flex flex-wrap gap-1">
                                    {brandProfile.client.client_brand_profiles[0].secondary_benefits.map((benefit: string) => (
                                      <button
                                        key={benefit}
                                        onClick={() => {
                                          if (checkedSecondary.includes(benefit)) {
                                            setCheckedSecondary(prev => prev.filter(b => b !== benefit));
                                          } else {
                                            setCheckedSecondary(prev => [...prev, benefit]);
                                          }
                                        }}
                                        className={`text-xs px-2 py-1 rounded border ${
                                          checkedSecondary.includes(benefit)
                                            ? 'bg-blue-500 text-white border-blue-400'
                                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                                        }`}
                                      >
                                        {checkedSecondary.includes(benefit) ? (
                                          <CheckSquare className="h-3 w-3 inline mr-1" />
                                        ) : (
                                          <Square className="h-3 w-3 inline mr-1" />
                                        )}
                                        {benefit}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Selection Summary */}
                              {(checkedPriority.length > 0 || checkedSecondary.length > 0) && (
                                <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                                  Selected: {checkedPriority.length + checkedSecondary.length} → AI uses {generateBenefitsSelection(checkedPriority, checkedSecondary).length} randomly
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image Description Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-cyan font-medium">Image Description</h3>
                        <Button
                          onClick={enhancePrompt}
                          disabled={!prompt.trim() || isEnhancingPrompt}
                          variant="outline"
                          size="sm"
                          className="px-2"
                          title="Enhance prompt with Gemini AI"
                        >
                          {isEnhancingPrompt ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Describe the image you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px] resize-y"
                      />
                    </div>

                    {/* AI Model Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-cyan font-medium">AI Model</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p><strong>Nano Banana:</strong> Advanced AI with K-scale resolutions (1K, 2K, 4K)</p>
                                <p><strong>Imagen:</strong> Professional models with px resolutions</p>
                                <p>Top row: Best quality, Bottom row: Budget options</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {/* Model Grid */}
                      <div className="space-y-3">
                        {/* Column Headers */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center text-sm font-semibold text-purple-400 pb-1">Nano Banana</div>
                          <div className="text-center text-sm font-semibold text-blue-400 pb-1">Imagen</div>
                        </div>
                        
                        {/* Model Options */}
                        <div className="grid grid-cols-2 gap-3">
                          {VERTEX_MODELS.map((modelOption) => {
                            if (!modelOption.position) return null;
                            
                            const { row, col } = modelOption.position;
                            
                            return (
                              <label
                                key={modelOption.value}
                                className={`radio-btn-base ${
                                  model === modelOption.value
                                    ? col === 0 
                                      ? 'radio-btn-purple-selected'
                                      : 'radio-btn-blue-selected'
                                    : 'radio-btn-unselected'
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
                                <div className="space-y-1">
                                  <div className="radio-btn-text">{modelOption.label}</div>
                                  <div className="radio-btn-desc">
                                    {modelOption.nativeResolutionFormat === 'k-scale' 
                                      ? modelOption.resolutions.join(', ')
                                      : modelOption.resolutions.slice(0, 2).join(', ')
                                    } {modelOption.description.match(/\(\$[\d\.]+\)/)?.[0] || '(~$0.04)'}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Style & Settings Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <h3 className="text-sm font-semibold text-cyan font-medium">Style & Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="art-style" className="text-white">Art Style</Label>
                          <Select value={artStyle} onValueChange={setArtStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ART_STYLES.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  <div className="space-y-0.5 text-left">
                                    <div className="font-medium text-sm">{style.label}</div>
                                    <div className="text-xs text-gray-500">{style.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="image-style" className="text-white">Image Style</Label>
                          <Select value={imageStyle} onValueChange={setImageStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_STYLES.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  <div className="space-y-0.5 text-left">
                                    <div className="font-medium text-sm">{style.label}</div>
                                    <div className="text-xs text-gray-500">{style.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resolution" className="text-white">Resolution</Label>
                          <Select value={resolution} onValueChange={setResolution}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getModelConfig(model).resolutions.map((res) => (
                                <SelectItem key={res} value={res}>
                                  {res}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="aspect-ratio" className="text-white">Aspect Ratio</Label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getModelConfig(model).aspectRatios.map((ratio) => (
                                <SelectItem key={ratio} value={ratio}>
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
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate AI Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Preview Panel */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-salmon">Preview</h2>
                    
                    <div className="bg-gray-100 rounded-lg min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300">
                      {generatedImage ? (
                        <div className="w-full flex items-center justify-center p-4">
                          <img 
                            src={generatedImage} 
                            alt="Generated AI Image" 
                            className="max-w-full max-h-[500px] object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <Sparkles className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                          <p className="text-lg font-medium">Generated image will appear here</p>
                          <p className="text-sm">Enter a description and click "Generate AI Image" to start</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons below preview */}
                    {generatedImage && (
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            window.open(generatedImage, '_blank');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Full Size
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = generatedImage;
                            link.download = `ai-generated-image-${Date.now()}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        </div>

        <Footer />
        <Toaster />
      </div>
    </GradientBackground>
  );
}