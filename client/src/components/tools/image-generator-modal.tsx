/**
 * Reusable AI Image Generator Modal
 * Compatible with Article Editor and future blog editor
 * Uses Vertex AI Imagen for image generation
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Image as ImageIcon, Download, RefreshCw, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
}

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
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
  isLoading?: boolean;
  initialPrompt?: string;
}

const ART_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustrated', label: 'Illustrated' },
  { value: 'arty', label: 'Arty/Artistic' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'abstract', label: 'Abstract' },
];

const IMAGE_STYLES = [
  { value: 'hero', label: 'Hero/Banner' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'corporate', label: 'Corporate' },
];

const RESOLUTIONS = [
  { value: '1000', label: '1000px (Standard)' },
  { value: '2000', label: '2000px (High Quality)' },
  { value: '1500', label: '1500px (Medium)' },
];

const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:5', label: '4:5 (Instagram)' },
  { value: '2:3', label: '2:3 (Classic Portrait)' },
  { value: '3:2', label: '3:2 (Landscape)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
];

export function ImageGeneratorModal({
  isOpen,
  onClose,
  onImageGenerated,
  articleContext,
  isLoading = false,
  initialPrompt = ''
}: ImageGeneratorModalProps) {
  // Form state
  const [prompt, setPrompt] = useState(initialPrompt);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeSubtitle, setIncludeSubtitle] = useState(true);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [imageStyle, setImageStyle] = useState('hero');
  const [resolution, setResolution] = useState('1500');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [aiAnalyzedPrompt, setAiAnalyzedPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [useAiPrompt, setUseAiPrompt] = useState(false);

  // Unsplash-specific states
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [selectedUnsplashImage, setSelectedUnsplashImage] = useState<UnsplashImage | null>(null);
  const [unsplashSearchTerm, setUnsplashSearchTerm] = useState('');
  const [isGeneratingSearchTerm, setIsGeneratingSearchTerm] = useState(false);
  const [currentImageSource, setCurrentImageSource] = useState<'ai' | 'unsplash' | null>(null);

  // Auto-analyze article content when modal opens
  useEffect(() => {
    if (isOpen && articleContext && (articleContext.headline || articleContext.hook || articleContext.content)) {
      analyzeArticleContent();
    }
  }, [isOpen, articleContext]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImage(null);
      setAiAnalyzedPrompt('');
      setUseAiPrompt(false);
      setPrompt(initialPrompt);
      setUnsplashImages([]);
      setSelectedUnsplashImage(null);
      setUnsplashSearchTerm('');
      setCurrentImageSource(null);
    }
  }, [isOpen, initialPrompt]);

  const analyzeArticleContent = async () => {
    if (!articleContext) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-image-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleContext,
          artStyle,
          imageStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const result = await response.json();
      setAiAnalyzedPrompt(result.suggestedPrompt);
    } catch (error) {
      console.error('Error analyzing article content:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze article content. You can still enter a custom prompt.',
        variant: 'destructive',
      });
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
    setCurrentImageSource('ai');
    
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate image');
      }

      const result = await response.json();
      setGeneratedImage(result.imageUrl);
      setSelectedUnsplashImage(null); // Clear Unsplash selection
      
      toast({
        title: 'Image Generated!',
        description: 'Your AI-generated image is ready. You can regenerate or use this image.',
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleContext,
          artStyle,
          imageStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate search term');
      }

      const result = await response.json();
      setUnsplashSearchTerm(result.searchTerm);
      
      // Automatically search Unsplash with the generated term
      await searchUnsplash(result.searchTerm);
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

  const searchUnsplash = async (searchTerm?: string) => {
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
    setCurrentImageSource('unsplash');
    
    try {
      const response = await fetch('/api/unsplash/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: term,
          per_page: 6, // Get 6 images for selection
          orientation: aspectRatio === '16:9' || aspectRatio === '3:2' ? 'landscape' : 
                      aspectRatio === '9:16' || aspectRatio === '2:3' ? 'portrait' : 'all'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search Unsplash');
      }

      const result = await response.json();
      setUnsplashImages(result.results || []);
      setGeneratedImage(null); // Clear AI generated image
      
      if (result.results && result.results.length > 0) {
        toast({
          title: 'Images Found!',
          description: `Found ${result.results.length} images from Unsplash. Click to select one.`,
        });
      } else {
        toast({
          title: 'No Images Found',
          description: 'Try a different search term or be more specific.',
          variant: 'destructive',
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
    setGeneratedImage(null); // Clear AI generated image
  };

  const refreshUnsplashSearch = () => {
    if (unsplashSearchTerm) {
      searchUnsplash();
    }
  };

  const useGeneratedImage = () => {
    let imageUrl: string;
    let description: string;
    
    if (currentImageSource === 'unsplash' && selectedUnsplashImage) {
      imageUrl = selectedUnsplashImage.urls.regular;
      description = 'Unsplash image has been added to your article.';
    } else if (currentImageSource === 'ai' && generatedImage) {
      imageUrl = generatedImage;
      description = 'AI-generated image has been added to your article.';
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
      prompt: currentImageSource === 'unsplash' 
        ? unsplashSearchTerm 
        : (useAiPrompt && aiAnalyzedPrompt ? aiAnalyzedPrompt : prompt),
      metadata: {
        artStyle,
        imageStyle,
        resolution,
        aspectRatio,
      },
    };

    onImageGenerated(result);
    onClose();
    
    toast({
      title: 'Image Added',
      description,
    });
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ai-generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Started',
        description: 'Your AI-generated image is being downloaded.',
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Image Generator
          </DialogTitle>
          <DialogDescription>
            Generate custom images using AI for your articles. Powered by Vertex AI Imagen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* AI Analysis Section */}
            {articleContext && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">AI Content Analysis</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={analyzeArticleContent}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Re-analyze
                      </>
                    )}
                  </Button>
                </div>
                
                {aiAnalyzedPrompt && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-ai-prompt"
                        checked={useAiPrompt}
                        onCheckedChange={(checked) => setUseAiPrompt(checked === true)}
                      />
                      <Label htmlFor="use-ai-prompt" className="text-sm">
                        Use AI-suggested prompt
                      </Label>
                      <Badge variant="secondary" className="ml-2">
                        Smart
                      </Badge>
                    </div>
                    {useAiPrompt && (
                      <Textarea
                        value={aiAnalyzedPrompt}
                        onChange={(e) => setAiAnalyzedPrompt(e.target.value)}
                        className="min-h-[80px] text-sm"
                        placeholder="AI-analyzed prompt will appear here..."
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Prompt Section */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="flex items-center gap-2">
                Custom Prompt
                {!useAiPrompt && <Badge variant="outline">Active</Badge>}
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="min-h-[100px]"
                disabled={useAiPrompt}
              />
            </div>

            {/* Generation Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="art-style">Art Style</Label>
                <Select value={artStyle} onValueChange={setArtStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ART_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
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
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((res) => (
                      <SelectItem key={res.value} value={res.value}>
                        {res.label}
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
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Inclusion Options */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Include in Image</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-title"
                    checked={includeTitle}
                    onCheckedChange={(checked) => setIncludeTitle(checked === true)}
                  />
                  <Label htmlFor="include-title" className="text-sm">
                    Article title/headline
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-subtitle"
                    checked={includeSubtitle}
                    onCheckedChange={(checked) => setIncludeSubtitle(checked === true)}
                  />
                  <Label htmlFor="include-subtitle" className="text-sm">
                    Subtitle/hook text
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* AI Generation Button */}
              <Button
                onClick={generateImage}
                disabled={isGenerating || isLoading || (!prompt.trim() && !useAiPrompt)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating AI Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Image
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

              {/* Unsplash Search Section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Search Unsplash Images</Label>
                
                {/* Search Term Input */}
                <div className="flex gap-2">
                  <Input
                    value={unsplashSearchTerm}
                    onChange={(e) => setUnsplashSearchTerm(e.target.value)}
                    placeholder="Enter search term..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && unsplashSearchTerm.trim()) {
                        searchUnsplash();
                      }
                    }}
                  />
                  <Button
                    onClick={() => searchUnsplash()}
                    disabled={!unsplashSearchTerm.trim() || isSearchingUnsplash}
                    variant="outline"
                    size="icon"
                  >
                    {isSearchingUnsplash ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={refreshUnsplashSearch}
                    disabled={!unsplashSearchTerm.trim() || isSearchingUnsplash}
                    variant="outline"
                    size="icon"
                    title="Refresh search"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* AI Generate Search Term Button */}
                {articleContext && (
                  <Button
                    onClick={generateUnsplashSearchTerm}
                    disabled={isGeneratingSearchTerm}
                    variant="outline"
                    className="w-full"
                  >
                    {isGeneratingSearchTerm ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating search term...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Generate Search Term
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            {/* AI Generated Image Preview */}
            {currentImageSource === 'ai' && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold">AI Generated Image</Label>
                <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="AI generated image"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">AI generated image will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unsplash Images Grid */}
            {currentImageSource === 'unsplash' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Unsplash Images {unsplashSearchTerm && `for "${unsplashSearchTerm}"`}
                  </Label>
                  {unsplashImages.length > 0 && (
                    <Badge variant="secondary">{unsplashImages.length} found</Badge>
                  )}
                </div>
                
                {unsplashImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {unsplashImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedUnsplashImage?.id === image.id
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => selectUnsplashImage(image)}
                      >
                        <img
                          src={image.urls.small}
                          alt={image.alt_description || 'Unsplash image'}
                          className="w-full h-24 object-cover"
                        />
                        {selectedUnsplashImage?.id === image.id && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-blue-500 rounded-full p-1">
                              <ImageIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                          <p className="text-white text-xs truncate">
                            by {image.user.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentImageSource === 'unsplash' ? (
                  <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Search Unsplash for images</p>
                    </div>
                  </div>
                ) : null}

                {/* Selected Unsplash Image Preview */}
                {selectedUnsplashImage && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Selected Image</Label>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={selectedUnsplashImage.urls.regular}
                        alt={selectedUnsplashImage.alt_description || 'Selected Unsplash image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Photo by {selectedUnsplashImage.user.name} on Unsplash
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Default State */}
            {!currentImageSource && (
              <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Generate AI image or search Unsplash</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(generatedImage || selectedUnsplashImage) && (
              <div className="flex gap-2">
                <Button onClick={useGeneratedImage} className="flex-1">
                  Use This Image
                </Button>
                {generatedImage && (
                  <Button onClick={downloadImage} variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setGeneratedImage(null);
                    setSelectedUnsplashImage(null);
                    setCurrentImageSource(null);
                  }}
                  variant="outline"
                  size="icon"
                  title="Clear selection"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Current Settings Summary */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Current Settings</Label>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Art: {ART_STYLES.find(s => s.value === artStyle)?.label}</div>
                <div>Style: {IMAGE_STYLES.find(s => s.value === imageStyle)?.label}</div>
                <div>Resolution: {resolution}px</div>
                <div>Ratio: {aspectRatio}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}