/**
 * AI Image Generator - Dedicated page for AI-powered image generation
 * Uses Google Vertex AI Imagen and Gemini models for professional image creation
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Loader2, Download, Info, Eye } from 'lucide-react';
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
    value: 'imagen-4.0-ultra',
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
    value: 'imagen-4.0-standard',
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
    value: 'imagen-4.0-fast',
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

  // Update resolution to native resolution when model changes
  useEffect(() => {
    const modelConfig = getModelConfig(model);
    setResolution(modelConfig.nativeResolution);
  }, [model]);

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
          userPrompt: titleText, 
          artStyle, 
          imageStyle,
          includeTitle,
          includeSubtitle,
          titleText: includeTitle ? transformTextCase(titleText, titleCase) : '',
          subtitleText: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTitleText(data.suggestedPrompt || data.enhancedTitle);
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
          userPrompt: subtitleText, 
          artStyle, 
          imageStyle,
          includeTitle,
          includeSubtitle,
          titleText: includeTitle ? transformTextCase(titleText, titleCase) : '',
          subtitleText: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubtitleText(data.suggestedPrompt || data.enhancedSubtitle);
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
        
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/tools')}
                className="text-salmon hover:text-salmon-muted"
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
                          <div className="text-center text-sm font-semibold text-purple-400 pb-1">🍌 Nano Banana</div>
                          <div className="text-center text-sm font-semibold text-blue-400 pb-1">🎨 Imagen</div>
                        </div>
                        
                        {/* Model Options */}
                        <div className="grid grid-cols-2 gap-3">
                          {VERTEX_MODELS.map((modelOption) => {
                            if (!modelOption.position) return null;
                            
                            const { row, col } = modelOption.position;
                            
                            return (
                              <label
                                key={modelOption.value}
                                className={`
                                  relative cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:shadow-md
                                  ${model === modelOption.value
                                    ? col === 0 
                                      ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                                      : 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200'
                                    : 'border-gray-600 bg-gray-800 text-white hover:border-gray-500'
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
                                  <div className="text-sm font-semibold">{modelOption.label}</div>
                                  <div className="text-xs opacity-75">
                                    {modelOption.nativeResolutionFormat === 'k-scale' 
                                      ? modelOption.resolutions.join(', ')
                                      : modelOption.resolutions.slice(0, 2).join(', ')
                                    } ({modelOption.description.match(/\(\$[\d\.]+\)/)?.[0] || '~$0.04'})
                                  </div>
                                </div>
                                {model === modelOption.value && (
                                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 border-2 border-white"></div>
                                )}
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