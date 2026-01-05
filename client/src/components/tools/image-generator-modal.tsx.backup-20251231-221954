/**
 * Image Generator Modal - Simplified Structure
 * Clean tabbed interface for AI and Unsplash image generation
 * Stable layout with top-anchored content and proper pagination
 */

import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Sparkles, Search, Loader2, ChevronDown, Info } from 'lucide-react';
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
  'photorealistic', 'digital-art', 'illustration', 'painting', 'sketch',
  'watercolor', 'oil-painting', 'pencil-drawing', 'cartoon', 'anime'
];

const IMAGE_STYLES = [
  'hero', 'featured', 'thumbnail', 'social-media', 'background',
  'portrait', 'landscape', 'action-shot', 'close-up', 'wide-angle'
];

const RESOLUTIONS = ['1024', '1500', '2048'];

const ASPECT_RATIOS = [
  '16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3'
];

const UNSPLASH_QUALITY_OPTIONS = [
  { value: 'thumb', label: 'Thumbnail (200px)', description: 'Small preview' },
  { value: 'small', label: 'Small (400px)', description: 'Web optimized' },
  { value: 'regular', label: 'Regular (1080px)', description: 'Standard quality' },
  { value: 'full', label: 'Full (2000px+)', description: 'High resolution' },
];

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

  // AI Generation states
  const [prompt, setPrompt] = useState(initialPrompt);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeSubtitle, setIncludeSubtitle] = useState(false);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [imageStyle, setImageStyle] = useState('hero');
  const [resolution, setResolution] = useState('1500');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [aiAnalyzedPrompt, setAiAnalyzedPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
  const [hasMoreUnsplashImages, setHasMoreUnsplashImages] = useState(true);
  const [unsplashAttribution, setUnsplashAttribution] = useState<{user: string; username: string} | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImage(null);
      setAiAnalyzedPrompt('');
      setUseAiPrompt(false);
      setPrompt(initialPrompt);
      setUnsplashImages([]);
      setSelectedUnsplashImage(null);
      setUnsplashSearchTerm('');
      setUnsplashPage(1);
      setHasMoreUnsplashImages(true);
      setUnsplashAttribution(null);
      setActiveTab('ai');
      setHasAnalyzed(false);
    }
  }, [isOpen, initialPrompt]);

  // Auto-analyze when modal opens (only once)
  useEffect(() => {
    if (isOpen && !hasAnalyzed && articleContext && (articleContext.headline || articleContext.hook || articleContext.content)) {
      analyzeArticleContent();
    }
  }, [isOpen, hasAnalyzed]); // Removed articleContext to prevent circular loop

  const analyzeArticleContent = async () => {
    if (!articleContext || hasAnalyzed) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleContext, artStyle, imageStyle }),
      });

      if (!response.ok) throw new Error('Failed to analyze content');

      const result = await response.json();
      setAiAnalyzedPrompt(result.suggestedPrompt);
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
        articleContext,
      };

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
      orientation: aspectRatio === '16:9' || aspectRatio === '3:2' ? 'landscape' : 
                  aspectRatio === '9:16' || aspectRatio === '2:3' ? 'portrait' : 'all'
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

  const useGeneratedImage = () => {
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
      imageUrl = generatedImage;
      description = 'AI-generated image has been added to your article.';
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
      metadata: { artStyle, imageStyle, resolution, aspectRatio },
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
      const response = await fetch(imageToDownload);
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
      toast({
        title: 'Download Failed',
        description: 'Could not download image.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
                {/* AI Configuration Panel */}
                <div className="space-y-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-orange-600">AI Configuration</h3>
                  
                  {/* Prompt Section */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Image Description</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the image you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* AI Analysis Section */}
                  {articleContext && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 font-medium">AI Article Analysis</Label>
                        <Button
                          onClick={() => {
                            setHasAnalyzed(false);
                            analyzeArticleContent();
                          }}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                        </Button>
                      </div>
                      {aiAnalyzedPrompt && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="use-ai-prompt"
                              checked={useAiPrompt}
                              onChange={(e) => setUseAiPrompt(e.target.checked)}
                            />
                            <Label htmlFor="use-ai-prompt" className="text-sm font-medium text-gray-700">
                              Use AI-suggested prompt
                            </Label>
                          </div>
                          <p className="text-sm mt-2 text-gray-700">{aiAnalyzedPrompt}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuration Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="art-style">Art Style</Label>
                      <Select value={artStyle} onValueChange={setArtStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ART_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-style">Image Style</Label>
                      <Select value={imageStyle} onValueChange={setImageStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMAGE_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resolution">Resolution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOLUTIONS.map((res) => (
                            <SelectItem key={res} value={res}>
                              {res}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map((ratio) => (
                            <SelectItem key={ratio} value={ratio}>
                              {ratio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Options */}
                  <TooltipProvider>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-title"
                          checked={includeTitle}
                          onChange={(e) => setIncludeTitle(e.target.checked)}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="include-title" className="text-sm cursor-pointer">
                              Include article title overlay{articleContext?.headline ? ` (${articleContext.headline.slice(0, 50)}${articleContext.headline.length > 50 ? '...' : ''})` : ''}
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tell the AI generator to add the title as text overlay on the image</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-subtitle"
                          checked={includeSubtitle}
                          onChange={(e) => setIncludeSubtitle(e.target.checked)}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="include-subtitle" className="text-sm cursor-pointer">
                              Include article subtitle overlay{articleContext?.hook ? ` (${articleContext.hook.slice(0, 50)}${articleContext.hook.length > 50 ? '...' : ''})` : ''}
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tell the AI generator to add the subtitle as text overlay on the image</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </TooltipProvider>

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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-orange-600">AI Preview</h3>
                  
                  <div className="bg-gray-50 rounded-lg min-h-[400px] flex items-center justify-center">
                    {generatedImage ? (
                      <div className="relative w-full">
                        <img 
                          src={generatedImage} 
                          alt="Generated" 
                          className="w-full h-auto rounded-lg"
                        />
                        <div className="absolute top-2 right-2 space-x-2">
                          <Button onClick={downloadImage} size="sm" variant="secondary">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 text-orange-300" />
                        <p>Generated image will appear here</p>
                      </div>
                    )}
                  </div>

                  {generatedImage && (
                    <div className="flex gap-2">
                      <Button onClick={useGeneratedImage} className="flex-1 bg-orange-500 hover:bg-orange-600">
                        Use This Image
                      </Button>
                      <Button onClick={generateImage} variant="outline">
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

                  {/* Quality Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="quality">Image Quality</Label>
                    <Select value={unsplashQuality} onValueChange={setUnsplashQuality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNSPLASH_QUALITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
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
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    {isSearchingUnsplash ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    {isSearchingUnsplash ? 'Searching...' : 'Search Unsplash'}
                  </Button>
                </div>

                {/* Unsplash Preview Panel */}
                <div className="space-y-4 flex flex-col">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--cyan)' }}>Unsplash Results</h3>
                  
                  <div className="flex-1 overflow-y-auto">
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