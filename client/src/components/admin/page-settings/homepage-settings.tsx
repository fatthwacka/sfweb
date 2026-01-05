import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, ChevronUp, ChevronDown, X, Plus, FolderOpen, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { useAllGradients } from '@/hooks/use-all-gradients';
import { CategoryPagesConfig } from '@shared/types/category-config';
import { FrontPageSettingsCard } from '../front-page-settings';
import { useSiteConfig } from '@/hooks/use-site-config';
import { supabaseOperations } from '@/lib/supabase-operations';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  gradient?: string[];
}

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  services?: string[];
  color?: string;
}


interface SiteConfig {
  home: {
    hero: {
      slides: HeroSlide[];
      autoAdvance: boolean;
      interval: number;
      effects: string[];
    };
    servicesOverview: {
      headline: string;
      description: string;
      // Keep backward compatibility with existing data structure
      photography?: any;
      videography?: any;
      // New dynamic services array
      services?: ServiceCard[];
    };
  };
  // New category pages configuration
  categoryPages?: CategoryPagesConfig;
  // Existing gradients configuration
  gradients?: {
    [sectionName: string]: any;
  };
  portfolio?: any;
}

const defaultSiteConfig: SiteConfig = {
  home: {
    hero: {
      slides: [],
      autoAdvance: true,
      interval: 5000,
      effects: []
    },
    servicesOverview: {
      headline: '',
      description: '',
      photography: null,
      videography: null,
      services: []
    },
    testimonials: {
      headline: '',
      description: '',
      items: []
    }
  }
};

export function HomepageSettings() {
  const queryClient = useQueryClient();
  const { config: siteConfig, isLoading, updateConfigBulk, isUpdating } = useSiteConfig();
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
  const [browserCallback, setBrowserCallback] = useState<((path: string) => void) | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch ALL images from ALL folders for image browser - keeping old approach for now
  const { data: allImages, isLoading: imagesLoading } = useQuery({
    queryKey: ['all-site-images'],
    queryFn: async () => {
      const response = await fetch('/api/browse-images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      return response.json();
    }
  });

  // Auto-save function using useSiteConfig hook
  const saveMutation = {
    mutate: (newConfig: SiteConfig) => {
      updateConfigBulk(newConfig);
      setIsAutoSaving(false);
    },
    isPending: isUpdating,
  };

  // Debounced auto-save function
  const debouncedAutoSave = useCallback((newConfig: SiteConfig) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set loading state immediately
    setIsAutoSaving(true);

    // Set new timeout for 2000ms
    debounceTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(newConfig);
    }, 2000);
  }, [saveMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Update local state when data loads - MUST be before conditional returns
  useEffect(() => {
    if (siteConfig) {
      // Migrate old data format to new format if needed
      let migratedConfig = migrateServicesData(siteConfig as SiteConfig);
      setConfig(migratedConfig);
    }
  }, [siteConfig]);

  // Migration function to convert old photography/videography format to services array
  const migrateServicesData = (config: SiteConfig): SiteConfig => {
    if (!config.home?.servicesOverview) return config;
    
    const servicesOverview = config.home.servicesOverview;
    
    // If we already have services array, return as is
    if (servicesOverview.services && servicesOverview.services.length > 0) {
      return config;
    }
    
    // If we have old photography/videography format, migrate to services array
    const services: ServiceCard[] = [];
    
    if (servicesOverview.photography) {
      services.push({
        id: 'photography-service',
        title: servicesOverview.photography.title || 'Photography',
        description: servicesOverview.photography.description || 'Capture life\'s precious moments with our professional photography services.',
        image: servicesOverview.photography.image || '/images/services/photography-service-showcase.jpg',
        ctaText: servicesOverview.photography.ctaText || 'Explore Photography',
        services: servicesOverview.photography.services || ['Weddings', 'Portraits', 'Corporate'],
        color: 'salmon'
      });
    }
    
    if (servicesOverview.videography) {
      services.push({
        id: 'videography-service',
        title: servicesOverview.videography.title || 'Videography',
        description: servicesOverview.videography.description || 'Bring your stories to life with cinematic videography.',
        image: servicesOverview.videography.image || '/images/services/videography-service-showcase.jpg',
        ctaText: servicesOverview.videography.ctaText || 'Explore Videography',
        services: servicesOverview.videography.services || ['Wedding Films', 'Corporate Videos', 'Events'],
        color: 'cyan'
      });
    }
    
    return {
      ...config,
      home: {
        ...config.home,
        servicesOverview: {
          ...servicesOverview,
          services
        }
      }
    };
  };


  // Auto-save configuration changes with 2000ms debounce
  const handleConfigChange = (newConfig: SiteConfig) => {
    // Update local state immediately for responsive UI
    setConfig(newConfig);
    // Trigger debounced auto-save
    debouncedAutoSave(newConfig);
  };

  // Early return if loading or config not ready - AFTER all hooks
  if (isLoading || !config.home?.hero) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Hero slide management
  const moveSlideUp = (slideId: string) => {
    if (!config.home?.hero?.slides) return;
    
    const slides = [...config.home.hero.slides];
    const index = slides.findIndex(slide => slide.id === slideId);
    if (index > 0) {
      [slides[index], slides[index - 1]] = [slides[index - 1], slides[index]];
      handleConfigChange({ 
        ...config, 
        home: { 
          ...config.home, 
          hero: { 
            ...config.home.hero, 
            slides 
          } 
        } 
      });
    }
  };

  const moveSlideDown = (slideId: string) => {
    if (!config.home?.hero?.slides) return;
    
    const slides = [...config.home.hero.slides];
    const index = slides.findIndex(slide => slide.id === slideId);
    if (index < slides.length - 1) {
      [slides[index], slides[index + 1]] = [slides[index + 1], slides[index]];
      handleConfigChange({ 
        ...config, 
        home: { 
          ...config.home, 
          hero: { 
            ...config.home.hero, 
            slides 
          } 
        } 
      });
    }
  };

  const addHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: 'New Hero Slide',
      subtitle: 'Add your subtitle here',
      image: '/assets/hero/hero-placeholder.jpg',
      cta: 'Learn More',
      gradient: ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']
    };

    const currentSlides = config.home?.hero?.slides || [];
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        hero: {
          ...config.home?.hero,
          slides: [...currentSlides, newSlide]
        }
      }
    });
  };

  const removeHeroSlide = (slideId: string) => {
    if (!config.home?.hero?.slides) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        hero: {
          ...config.home.hero,
          slides: config.home.hero.slides.filter(slide => slide.id !== slideId)
        }
      }
    });
  };

  const updateHeroSlide = (slideId: string, updates: Partial<HeroSlide>) => {
    if (!config.home?.hero?.slides) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        hero: {
          ...config.home.hero,
          slides: config.home.hero.slides.map(slide =>
            slide.id === slideId ? { ...slide, ...updates } : slide
          )
        }
      }
    });
  };

  // Service management functions
  const addService = () => {
    const newService: ServiceCard = {
      id: `service-${Date.now()}`,
      title: 'New Service',
      description: 'Add your service description here',
      image: '/images/services/service-placeholder.jpg',
      ctaText: 'Explore Service',
      services: ['Service Type 1', 'Service Type 2', 'Service Type 3'],
      color: 'salmon'
    };

    // Ensure services array exists
    if (!config.home?.servicesOverview?.services) {
      config.home!.servicesOverview!.services = [];
    }
    const currentServices = config.home.servicesOverview.services;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        servicesOverview: {
          ...config.home?.servicesOverview,
          services: [...currentServices, newService]
        }
      }
    });
  };

  const removeService = (serviceId: string) => {
    if (!config.home?.servicesOverview?.services) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        servicesOverview: {
          ...config.home.servicesOverview,
          services: config.home.servicesOverview.services.filter(service => service.id !== serviceId)
        }
      }
    });
  };

  const updateService = (serviceId: string, updates: Partial<ServiceCard>) => {
    if (!config.home?.servicesOverview?.services) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        servicesOverview: {
          ...config.home.servicesOverview,
          services: config.home.servicesOverview.services.map(service =>
            service.id === serviceId ? { ...service, ...updates } : service
          )
        }
      }
    });
  };

  const moveServiceUp = (serviceId: string) => {
    if (!config.home?.servicesOverview?.services) return;
    
    const services = [...config.home.servicesOverview.services];
    const index = services.findIndex(service => service.id === serviceId);
    if (index > 0) {
      [services[index], services[index - 1]] = [services[index - 1], services[index]];
      handleConfigChange({ 
        ...config, 
        home: { 
          ...config.home, 
          servicesOverview: { 
            ...config.home.servicesOverview, 
            services 
          } 
        } 
      });
    }
  };

  const moveServiceDown = (serviceId: string) => {
    if (!config.home?.servicesOverview?.services) return;
    
    const services = [...config.home.servicesOverview.services];
    const index = services.findIndex(service => service.id === serviceId);
    if (index < services.length - 1) {
      [services[index], services[index + 1]] = [services[index + 1], services[index]];
      handleConfigChange({ 
        ...config, 
        home: { 
          ...config.home, 
          servicesOverview: { 
            ...config.home.servicesOverview, 
            services 
          } 
        } 
      });
    }
  };


  // Private Gallery helper functions
  const updatePrivateGalleryField = (field: string, value: string) => {
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        privateGallery: {
          ...config.home?.privateGallery,
          [field]: value
        }
      }
    });
  };

  const updatePrivateGalleryFeature = (featureId: string, updates: { title?: string; description?: string }) => {
    if (!config.home?.privateGallery?.features) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        privateGallery: {
          ...config.home.privateGallery,
          features: config.home.privateGallery.features.map(feature =>
            feature.id === featureId ? { ...feature, ...updates } : feature
          )
        }
      }
    });
  };

  const updatePrivateGalleryButton = (buttonType: 'primary' | 'secondary', updates: { text?: string; action?: string }) => {
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        privateGallery: {
          ...config.home?.privateGallery,
          buttons: {
            ...config.home?.privateGallery?.buttons,
            [buttonType]: {
              ...config.home?.privateGallery?.buttons?.[buttonType],
              ...updates
            }
          }
        }
      }
    });
  };

  // Handle image browser selection
  const handleBrowseImages = (onSelectCallback: (path: string) => void) => {
    setBrowserCallback(() => onSelectCallback);
    setIsImageBrowserOpen(true);
  };

  const handleImageSelect = (imagePath: string) => {
    if (browserCallback) {
      browserCallback(imagePath);
    }
    setIsImageBrowserOpen(false);
    setBrowserCallback(null);
  };

  // Image thumbnail component
  const ImageThumbnail = ({ imagePath, onPathChange }: { 
    imagePath: string; 
    onPathChange: (newPath: string) => void;
  }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState(false);
    const isUploading = uploadingFiles.has(imagePath);

    useEffect(() => {
      // Create preview URL for the image - handle both absolute and relative paths
      const fullPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      setPreviewUrl(`${fullPath}?t=${Date.now()}`);
    }, [imagePath]);

    const handleFileUpload = async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      setUploadingFiles(prev => new Set([...prev, imagePath]));

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();
        
        // Update the image path in the slide
        onPathChange(result.path || `/uploads/${file.name}`);
        
        toast({
          title: "Image uploaded",
          description: `Successfully uploaded ${file.name}`
        });
        
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
        });
      } finally {
        setUploadingFiles(prev => {
          const next = new Set(prev);
          next.delete(imagePath);
          return next;
        });
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    };

    return (
      <div className="space-y-1">
        <div 
          className={`relative group ${isDragOver ? 'scale-105' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 transition-all duration-200 ${
            isDragOver ? 'border-salmon bg-salmon/10' : 'border-gray-200'
          }`}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Hero slide thumbnail"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl('')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Upload size={24} />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
            {isDragOver && (
              <div className="absolute inset-0 bg-salmon bg-opacity-20 flex items-center justify-center">
                <Upload className="text-salmon" size={20} />
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={16} />
          </div>
        </div>
        
        {/* Icon-based Image Management Buttons */}
        <TooltipProvider>
          <div className="flex justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  size="icon"
                  variant="outline" 
                  onClick={() => handleBrowseImages(onPathChange)}
                  className="h-6 w-6 border-slate-500 text-white hover:bg-slate-600"
                >
                  <FolderOpen className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold text-sm">Browse existing images</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  size="icon"
                  variant="outline" 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        handleFileUpload(files[0]);
                      }
                    };
                    input.click();
                  }}
                  className="h-6 w-6 border-slate-500 text-white hover:bg-slate-600"
                >
                  <Upload className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold text-sm">Upload new image</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    );
  };


  return (
    <Card className="admin-settings-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Homepage Settings</CardTitle>
            <CardDescription className="text-gray-300">
              Manage your homepage content, hero slides, and section styling
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save Status Indicator */}
            <div className="flex items-center gap-1 text-sm">
              {isAutoSaving || saveMutation.isPending ? (
                <div className="flex items-center gap-2 text-blue-400 bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-500/30">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Auto-saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 bg-green-900/30 px-3 py-1.5 rounded-full border border-green-500/30">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-sm font-medium">Auto-save enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="hero-slides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="hero-slides" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Hero Slides
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Services
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="private-gallery" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Private Gallery
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Testimonials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero-slides">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Hero Slides</h3>
                <p className="text-sm text-gray-300">Manage the rotating hero slides on your homepage</p>
              </div>
              <Button onClick={addHeroSlide} className="bg-salmon hover:bg-salmon-muted text-white">
                <Plus size={16} className="mr-2" />
                Add Slide
              </Button>
            </div>
              <div className="space-y-4">
                {config.home?.hero?.slides?.map((slide, index) => (
                  <div key={slide.id} className="p-4 rounded-lg border bg-slate-700/50 border-slate-600">
                    <div className="flex items-start gap-4">
                      {/* Reorder Controls */}
                      <div className="flex flex-col gap-1 mt-2">
                        <Button
                          onClick={() => moveSlideUp(slide.id)}
                          disabled={index === 0}
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 border-slate-500 text-white hover:bg-slate-600"
                        >
                          <ChevronUp size={14} />
                        </Button>
                        <Button
                          onClick={() => moveSlideDown(slide.id)}
                          disabled={index === (config.home?.hero?.slides?.length || 0) - 1}
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 border-slate-500 text-white hover:bg-slate-600"
                        >
                          <ChevronDown size={14} />
                        </Button>
                      </div>

                      <ImageThumbnail
                        imagePath={slide.image}
                        onPathChange={(newPath) => updateHeroSlide(slide.id, { image: newPath })}
                      />

                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`slide-${slide.id}-title`} className="text-white">Title</Label>
                            <Input
                              id={`slide-${slide.id}-title`}
                              value={slide.title}
                              onChange={(e) => updateHeroSlide(slide.id, { title: e.target.value })}
                              className="mt-1 bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`slide-${slide.id}-subtitle`} className="text-white">Subtitle</Label>
                            <Input
                              id={`slide-${slide.id}-subtitle`}
                              value={slide.subtitle}
                              onChange={(e) => updateHeroSlide(slide.id, { subtitle: e.target.value })}
                              className="mt-1 bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor={`slide-${slide.id}-cta`} className="text-white">CTA Text</Label>
                            <Input
                              id={`slide-${slide.id}-cta`}
                              value={slide.cta}
                              onChange={(e) => updateHeroSlide(slide.id, { cta: e.target.value })}
                              className="mt-1 bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`slide-${slide.id}-image-path`} className="text-white">Image Path</Label>
                          <Input
                            id={`slide-${slide.id}-image-path`}
                            value={slide.image}
                            onChange={(e) => updateHeroSlide(slide.id, { image: e.target.value })}
                            placeholder="/assets/hero/your-image.jpg"
                            className="mt-1 text-sm bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => removeHeroSlide(slide.id)}
                        variant="outline"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border-red-500/30"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!config.home?.hero?.slides || config.home.hero.slides.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    No hero slides yet. Click "Add Slide" to create your first slide.
                  </div>
                )} 
              </div>

            {/* Hero Background Gradient */}
            <div className="space-y-4">
              <HeroGradientSection />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Services Section Styling</h3>
              <p className="text-sm text-gray-300">Customize the services section background and text colors</p>
            </div>

            <ServicesGradientSection />
          </div>
        </TabsContent>

        <TabsContent value="portfolio">
          <div className="space-y-6">
            {/* Portfolio Front Page Settings - Now uses gradient system */}
            <PortfolioGradientSection />
          </div>
        </TabsContent>


        <TabsContent value="private-gallery">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Private Gallery Styling</h3>
              <p className="text-sm text-gray-300">Configure colors for the private gallery section (content is hardcoded)</p>
            </div>

            {/* Gradient Background Color Picker Only */}
            <PrivateGalleryGradientSection />
          </div>
        </TabsContent>

        <TabsContent value="testimonials">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Testimonials</h3>
              <p className="text-sm text-gray-300">Customize testimonials section colors and styling</p>
            </div>

            <TestimonialsGradientSection />
          </div>
        </TabsContent>
        </Tabs>
      </CardContent>

      {/* Image Browser Dialog */}
      <Dialog open={isImageBrowserOpen} onOpenChange={setIsImageBrowserOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Browse Site Images
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {imagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : allImages && Object.keys(allImages).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(allImages).map(([folderName, images]) => (
                  <div key={folderName}>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {folderName} ({(images as string[]).length} images)
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {(images as string[]).map((imagePath, index) => (
                        <div 
                          key={index}
                          className="relative aspect-square cursor-pointer rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => handleImageSelect(imagePath)}
                        >
                          <img
                            src={`${imagePath}?t=${Date.now()}`}
                            alt={`${folderName} ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No images found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload some images first or check your image folders
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </Card>
  );
}

// Gradient Section Components - Updated to use optimized system
function HeroGradientSection() {
  return (
    <GradientPicker
      sectionKey="hero" 
      title="Hero Section"
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function ServicesGradientSection() {
  return (
    <GradientPicker
      sectionKey="services" 
      title="Services Section"
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function TestimonialsGradientSection() {
  return (
    <GradientPicker
      sectionKey="testimonials"
      title="Testimonials Section"
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function PrivateGalleryGradientSection() {
  return (
    <GradientPicker
      sectionKey="privateGallery"
      title="Private Gallery Section"
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function PortfolioGradientSection() {
  return (
    <div className="space-y-6">
      {/* Portfolio Background Colors */}
      <GradientPicker
        sectionKey="portfolio"
        title="Portfolio Section"
        showDirection={true}
        showOpacity={false}
        showTextColors={true}
      />
      
      {/* Portfolio Settings Card with integrated gradient system */}
      <PortfolioSettingsCard />
    </div>
  );
}

function PortfolioSettingsCard() {
  const { getPortfolioSettings } = useAllGradients();
  const portfolioSettings = getPortfolioSettings();
  
  return (
    <FrontPageSettingsCard
      settings={portfolioSettings}
      // No onSave prop = auto-save mode enabled
    />
  );
}