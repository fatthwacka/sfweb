/**
 * VEO Video Generator - Dedicated page for AI-powered video generation
 * Uses Google Vertex AI VEO model for professional video creation
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Download, Info, Upload, X } from 'lucide-react';
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

// VEO Model configurations (verified 2025)
const VEO_MODELS = [
  // Best Quality Column
  {
    value: 'veo-3.0-generate-001',
    position: { row: 0, col: 0 },
    label: 'VEO 3 Standard',
    description: 'Highest quality video generation',
    category: 'premium',
    aspectRatios: ['16:9', '9:16'],
    resolutions: [
      { value: '1080p', label: '1080p (~$1.50)', price: 1.50 },
      { value: '720p', label: '720p (~$0.75)', price: 0.75, default: true }
    ],
    durations: [4, 6, 8],
    default: true,
  },
  // Fast Generation Column  
  {
    value: 'veo-3.0-fast-generate-001',
    position: { row: 0, col: 1 },
    label: 'VEO 3 Fast',
    description: 'High quality with low latency',
    category: 'fast',
    aspectRatios: ['16:9', '9:16'],
    resolutions: [
      { value: '1080p', label: '1080p (~$0.75)', price: 0.75 },
      { value: '720p', label: '720p (~$0.38)', price: 0.38, default: true }
    ],
    durations: [4, 6, 8],
  },
];

const getModelConfig = (modelValue: string) => {
  return VEO_MODELS.find(m => m.value === modelValue) || VEO_MODELS[0];
};

const getDefaultModel = () => {
  return VEO_MODELS.find(m => m.default) || VEO_MODELS[0];
};

export default function VEOVideoGenerator() {
  const [, setLocation] = useLocation();
  
  // Video generation state
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(getDefaultModel().value);
  const [resolution, setResolution] = useState('1080p'); // Default to 1080p for best quality
  const [aspectRatio, setAspectRatio] = useState('9:16'); // Default to vertical for social media
  const [duration, setDuration] = useState(4); // Default 4 seconds for lowest cost
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Starting frame image state
  const [startingFrameImage, setStartingFrameImage] = useState<File | null>(null);
  const [compressedImageData, setCompressedImageData] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rate limiting state
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Rate limiting: 2 requests per minute (conservative)
  const RATE_LIMIT_MS = 30000; // 30 seconds between requests

  // Update cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const remaining = Math.max(0, RATE_LIMIT_MS - timeSinceLastRequest);
      setCooldownRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastRequestTime]);

  // Image processing helper
  const compressImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Target resolution based on user selection
        const maxWidth = resolution === '1080p' ? 1920 : 1280;
        const maxHeight = resolution === '1080p' ? 1080 : 720;
        
        let { width, height } = img;
        
        // Calculate optimal dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with 80% quality
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG or PNG image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 20MB.',
        variant: 'destructive',
      });
      return;
    }

    setStartingFrameImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));

    try {
      const compressed = await compressImageToBase64(file);
      setCompressedImageData(compressed);
      
      toast({
        title: 'Image processed',
        description: `Optimized for ${resolution} video generation.`,
      });
    } catch (error) {
      toast({
        title: 'Processing failed',
        description: 'Could not process image. Please try another.',
        variant: 'destructive',
      });
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setStartingFrameImage(null);
    setImagePreviewUrl(null);
    setCompressedImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Compress image specifically for prompt enhancement (smaller for speed)
  const compressImageForPromptEngine = async (): Promise<string | null> => {
    if (!startingFrameImage) return null;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Use 768px max for prompt enhancement - enough detail, fast upload
        const maxSize = 768;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Use 70% quality for smaller file size
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        const sizeKB = Math.round((base64.length * 3/4) / 1024);
        console.log(`🖼️ Compressed image for prompt engine: ${width}x${height}, ~${sizeKB}KB`);
        resolve(base64);
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(startingFrameImage);
    });
  };

  // Prompt enhancement - sends starting frame to Gemini if available
  const enhancePrompt = async () => {
    if (!prompt.trim()) return;

    setIsEnhancingPrompt(true);
    try {
      // Build request body - include starting frame image if available
      const requestBody: any = {
        prompt: prompt.trim(),
        contentType: 'video'
      };

      // If we have a starting frame, compress it smaller for prompt enhancement
      if (startingFrameImage) {
        const smallImage = await compressImageForPromptEngine();
        if (smallImage) {
          requestBody.startingFrameImage = smallImage;
          console.log('🖼️ Sending starting frame to prompt enhancer for context-aware enhancement');
        }
      }

      const response = await fetch('/api/prompt-engine/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enhancedPrompt) {
          setPrompt(data.enhancedPrompt);
          toast({
            title: 'Prompt Enhanced',
            description: compressedImageData
              ? 'Motion description optimized based on your starting frame.'
              : 'Your video description has been optimized.',
          });
        }
      }
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Video generation
  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for your video.',
        variant: 'destructive',
      });
      return;
    }

    if (!startingFrameImage || !compressedImageData) {
      toast({
        title: 'Starting Frame Required',
        description: 'Please upload an image to use as the starting frame.',
        variant: 'destructive',
      });
      return;
    }

    // Check rate limiting
    if (cooldownRemaining > 0) {
      toast({
        title: 'Rate Limited',
        description: `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before generating another video.`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setLastRequestTime(Date.now());

    try {
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          resolution,
          aspectRatio,
          duration,
          sampleCount: 1, // CRITICAL: Always force to 1 for cost control
          image: {
            bytesBase64Encoded: compressedImageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
            mimeType: 'image/jpeg'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedVideo(data.videoUrl);
        toast({
          title: 'Video Generated',
          description: 'Your AI video has been created successfully.',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Could not generate video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get current model pricing info
  const getCurrentPrice = () => {
    const modelConfig = getModelConfig(model);
    const resConfig = modelConfig.resolutions.find(r => r.value === resolution);
    return resConfig?.price || 0;
  };

  return (
    <GradientBackground section="tools" className="min-h-screen">
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <div className="flex-1 pt-20 pb-8">
          <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-28">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={() => setLocation('/tools')}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Tools
                </Button>
              </div>
              
              <div className="text-center">
                <h1 className="text-4xl lg:text-5xl text-white mb-3">
                  🎬 VEO Video Generator
                </h1>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                  Transform your images into dynamic videos using Google Vertex AI VEO technology
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                
                {/* Configuration Panel */}
                <div className="space-y-6">
                  
                  {/* Starting Frame Upload */}
                  <div className="space-y-4 p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Starting Frame Image</h3>
                    
                    {!startingFrameImage ? (
                      <div
                        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">
                          Drop your image here or click to upload
                        </p>
                        <p className="text-sm text-gray-400">
                          JPEG or PNG • Max 20MB • Recommended: {resolution} resolution
                        </p>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={imagePreviewUrl!}
                            alt="Starting frame"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            onClick={removeImage}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          <p className="font-medium text-white">{startingFrameImage.name}</p>
                          <p>Optimized for {resolution} generation • Ready for video creation</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-4 p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Model & Quality</h3>
                    
                    {/* Model Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {VEO_MODELS.map((modelConfig) => (
                        <div
                          key={modelConfig.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            model === modelConfig.value
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                          }`}
                          onClick={() => setModel(modelConfig.value)}
                        >
                          <div className="text-center">
                            <h4 className="font-semibold text-white mb-1">{modelConfig.label}</h4>
                            <p className="text-xs text-gray-400 mb-3">{modelConfig.description}</p>
                            
                            {/* Resolution options for this model */}
                            <div className="space-y-2">
                              {modelConfig.resolutions.map((res) => (
                                <Button
                                  key={res.value}
                                  variant={resolution === res.value && model === modelConfig.value ? "default" : "outline"}
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModel(modelConfig.value);
                                    setResolution(res.value);
                                  }}
                                >
                                  {res.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Video Settings */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">Aspect Ratio</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">Duration</Label>
                        <Select value={duration.toString()} onValueChange={(val) => setDuration(parseInt(val))}>
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 seconds</SelectItem>
                            <SelectItem value="6">6 seconds</SelectItem>
                            <SelectItem value="8">8 seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Sample Count (Locked to 1) */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-300">Sample Count</Label>
                      <Select disabled value="1">
                        <SelectTrigger className="bg-gray-700 border-gray-600 opacity-60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Video (Cost Control)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Fixed at 1 video per generation for cost control</p>
                    </div>

                    {/* Cost Display */}
                    <div className="border-t border-gray-600 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Generation Cost:</span>
                        <span className="font-semibold text-orange-400">${getCurrentPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Video Description */}
                  <div className="space-y-4 p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Video Description</h3>
                      <Button
                        onClick={enhancePrompt}
                        disabled={!prompt.trim() || isEnhancingPrompt}
                        variant="outline"
                        size="sm"
                        className="px-3"
                        title="Enhance prompt with AI"
                      >
                        {isEnhancingPrompt ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the video motion and scene you want to create from your starting frame..."
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 min-h-[120px]"
                    />

                    <p className="text-xs text-gray-400">
                      Describe the motion and camera movement (pan, dolly, orbit, zoom, or static). Single continuous shots work best.
                    </p>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateVideo}
                    disabled={isGenerating || !prompt.trim() || !startingFrameImage || cooldownRemaining > 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Generating Video... (This may take 2-3 minutes)
                      </>
                    ) : cooldownRemaining > 0 ? (
                      <>
                        Rate Limited ({Math.ceil(cooldownRemaining / 1000)}s remaining)
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate AI Video (${getCurrentPrice().toFixed(2)})
                      </>
                    )}
                  </Button>

                  {cooldownRemaining > 0 && (
                    <p className="text-xs text-center text-gray-400">
                      Rate limiting: {Math.ceil(cooldownRemaining / 1000)} seconds until next generation
                    </p>
                  )}
                </div>

                {/* Preview Panel */}
                <div className="space-y-6">
                  <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Video Preview</h3>
                    
                    {generatedVideo ? (
                      <div className="space-y-4">
                        <video
                          controls
                          className="w-full rounded-lg"
                          poster={imagePreviewUrl || undefined}
                        >
                          <source src={generatedVideo} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        
                        <Button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = generatedVideo;
                            a.download = 'veo-generated-video.mp4';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Video
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        {isGenerating ? (
                          <div className="space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                            <p>Creating your video...</p>
                            <p className="text-sm">This usually takes 2-3 minutes</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="h-12 w-12 bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
                              🎬
                            </div>
                            <p>Upload a starting frame and describe your video to begin</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info Panel */}
                  <div className="p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2 text-sm text-blue-200">
                        <h4 className="font-semibold">VEO Video Generation Tips</h4>
                        <ul className="space-y-1 text-blue-300">
                          <li>• Use high-quality starting frame images (1080p+ recommended)</li>
                          <li>• Describe specific motions: "camera pans left", "subject walks forward"</li>
                          <li>• Include lighting and atmosphere details</li>
                          <li>• Generation takes 2-3 minutes - please be patient</li>
                          <li>• Rate limited to 2 generations per minute for cost control</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
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