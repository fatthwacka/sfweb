import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Save, AlertCircle, ChevronUp, ChevronDown, X, Plus, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { useGradient } from '@/hooks/use-gradient';
import { CategoryPagesConfig } from '@shared/types/category-config';

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

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  image?: string;
  rating: number;
}

interface SiteConfig {
  contact: {
    business: {
      name: string;
      tagline: string;
      phone: string;
      email: string;
      address: {
        displayText: string;
      };
    };
  };
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
    testimonials: {
      headline: string;
      description: string;
      items: Testimonial[];
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
  contact: {
    business: {
      name: '',
      tagline: '',
      phone: '',
      email: '',
      address: {
        displayText: ''
      }
    }
  },
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
  const [browserCallback, setBrowserCallback] = useState<((path: string) => void) | null>(null);

  // Fetch ALL images from ALL folders for image browser
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

  // Fetch current site config
  const { data: siteConfig, isLoading } = useQuery({
    queryKey: ['/api/site-config'],
    queryFn: async () => {
      const response = await fetch('/api/site-config');
      if (!response.ok) throw new Error('Failed to fetch site config');
      return response.json() as SiteConfig;
    }
  });

  // Save mutation - MUST be before any conditional returns
  const saveMutation = useMutation({
    mutationFn: async (newConfig: SiteConfig) => {
      const response = await fetch('/api/site-config/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (!response.ok) throw new Error('Failed to save site config');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
      setHasUnsavedChanges(false);
      toast({
        title: "Settings saved",
        description: "Homepage settings have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  // Update local state when data loads - MUST be before conditional returns
  useEffect(() => {
    if (siteConfig) {
      // Migrate old data format to new format if needed
      let migratedConfig = migrateServicesData(siteConfig);
      migratedConfig = migrateTestimonialsData(migratedConfig);
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

  // Migration function to ensure testimonials have proper structure
  const migrateTestimonialsData = (config: SiteConfig): SiteConfig => {
    if (!config.home?.testimonials?.items) return config;
    
    const migratedTestimonials = config.home.testimonials.items.map((testimonial, index) => {
      // Ensure each testimonial has required fields
      return {
        id: testimonial.id || `testimonial-${Date.now()}-${index}`,
        name: testimonial.name || 'Customer Name',
        role: testimonial.role || 'Customer',
        company: testimonial.company || '',
        quote: testimonial.quote || '',
        image: testimonial.image || '/images/testimonials/customer-placeholder.jpg',
        rating: testimonial.rating || 5,
        ...testimonial
      };
    });
    
    return {
      ...config,
      home: {
        ...config.home,
        testimonials: {
          ...config.home.testimonials,
          items: migratedTestimonials
        }
      }
    };
  };

  // Auto-save will be implemented in next iteration

  const handleConfigChange = (newConfig: SiteConfig) => {
    setConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(config);
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

  // Testimonial management functions
  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: `testimonial-${Date.now()}`,
      name: 'New Customer',
      role: 'Customer',
      company: 'Company Name',
      quote: 'Add your testimonial quote here...',
      image: '/images/testimonials/customer-placeholder.jpg',
      rating: 5
    };

    // Ensure testimonials array exists
    if (!config.home?.testimonials?.items) {
      if (!config.home?.testimonials) {
        config.home!.testimonials = { headline: '', description: '', items: [] };
      } else {
        config.home.testimonials.items = [];
      }
    }
    const currentTestimonials = config.home.testimonials.items;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        testimonials: {
          ...config.home?.testimonials,
          items: [...currentTestimonials, newTestimonial]
        }
      }
    });
  };

  const removeTestimonial = (testimonialId: string) => {
    if (!config.home?.testimonials?.items) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        testimonials: {
          ...config.home.testimonials,
          items: config.home.testimonials.items.filter(testimonial => testimonial.id !== testimonialId)
        }
      }
    });
  };

  const updateTestimonial = (testimonialId: string, updates: Partial<Testimonial>) => {
    if (!config.home?.testimonials?.items) return;
    
    handleConfigChange({
      ...config,
      home: {
        ...config.home,
        testimonials: {
          ...config.home.testimonials,
          items: config.home.testimonials.items.map(testimonial =>
            testimonial.id === testimonialId ? { ...testimonial, ...updates } : testimonial
          )
        }
      }
    });
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
              Manage your homepage content, hero slides, and company information
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-300 bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-500/30">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveMutation.isPending}
              className="bg-salmon hover:bg-salmon-muted text-white"
            >
              {saveMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save size={16} />
                  Save Changes
                </div>
              )}
            </Button>
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
          <TabsTrigger value="private-gallery" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Private Gallery
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="company" className="data-[state=active]:bg-salmon data-[state=active]:text-white">
            Company Info
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Service Cards</h3>
                <p className="text-sm text-gray-300">Manage the service offerings displayed on your homepage</p>
              </div>
              <Button onClick={addService} className="bg-salmon hover:bg-salmon-muted text-white">
                <Plus size={16} className="mr-2" />
                Add Service
              </Button>
            </div>
            
            {/* Services Overview Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="services-headline" className="text-white">Section Headline</Label>
                  <Input
                    id="services-headline"
                    value={config.home?.servicesOverview?.headline || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      home: {
                        ...config.home,
                        servicesOverview: {
                          ...config.home?.servicesOverview,
                          headline: e.target.value
                        }
                      }
                    })}
                    placeholder="Capturing Life's Beautiful Moments"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="services-description" className="text-white">Section Description</Label>
                  <Textarea
                    id="services-description"
                    value={config.home?.servicesOverview?.description || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      home: {
                        ...config.home,
                        servicesOverview: {
                          ...config.home?.servicesOverview,
                          description: e.target.value
                        }
                      }
                    })}
                    placeholder="From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence."
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Service Cards */}
            <div className="space-y-4">
              {config.home?.servicesOverview?.services?.map((service, index) => (
                <div key={service.id} className="p-4 rounded-lg border bg-slate-700/50 border-slate-600">
                  <div className="flex items-start gap-4">
                    {/* Reorder Controls */}
                    <div className="flex flex-col gap-1 mt-2">
                      <Button
                        onClick={() => moveServiceUp(service.id)}
                        disabled={index === 0}
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 border-slate-500 text-white hover:bg-slate-600"
                      >
                        <ChevronUp size={14} />
                      </Button>
                      <Button
                        onClick={() => moveServiceDown(service.id)}
                        disabled={index === (config.home?.servicesOverview?.services?.length || 0) - 1}
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 border-slate-500 text-white hover:bg-slate-600"
                      >
                        <ChevronDown size={14} />
                      </Button>
                    </div>

                    <ImageThumbnail
                      imagePath={service.image}
                      onPathChange={(newPath) => updateService(service.id, { image: newPath })}
                    />

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`service-${service.id}-title`} className="text-white">Service Title</Label>
                          <Input
                            id={`service-${service.id}-title`}
                            value={service.title}
                            onChange={(e) => updateService(service.id, { title: e.target.value })}
                            className="mt-1 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`service-${service.id}-cta`} className="text-white">CTA Text</Label>
                          <Input
                            id={`service-${service.id}-cta`}
                            value={service.ctaText}
                            onChange={(e) => updateService(service.id, { ctaText: e.target.value })}
                            className="mt-1 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`service-${service.id}-description`} className="text-white">Description</Label>
                        <Textarea
                          id={`service-${service.id}-description`}
                          value={service.description}
                          onChange={(e) => updateService(service.id, { description: e.target.value })}
                          className="mt-1 bg-slate-700 border-slate-600 text-white"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`service-${service.id}-color`} className="text-white">Theme Color</Label>
                          <select
                            id={`service-${service.id}-color`}
                            value={service.color || 'salmon'}
                            onChange={(e) => updateService(service.id, { color: e.target.value })}
                            className="mt-1 w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                          >
                            <option value="salmon">Salmon</option>
                            <option value="cyan">Cyan</option>
                            <option value="purple">Purple</option>
                            <option value="gold">Gold</option>
                            <option value="green">Green</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`service-${service.id}-image-path`} className="text-white">Background Image Path</Label>
                          <Input
                            id={`service-${service.id}-image-path`}
                            value={service.image}
                            onChange={(e) => updateService(service.id, { image: e.target.value })}
                            placeholder="/images/services/service-showcase.jpg"
                            className="mt-1 text-sm bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => removeService(service.id)}
                      variant="outline"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border-red-500/30"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!config.home?.servicesOverview?.services || config.home.servicesOverview.services.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  No services yet. Click "Add Service" to create your first service card.
                </div>
              )}
            </div>

            {/* Services Background Gradient */}
            <div className="space-y-4">
              <ServicesGradientSection />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="private-gallery">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Private Gallery Section</h3>
              <p className="text-sm text-gray-300">Configure the private client gallery section content and styling</p>
            </div>

            {/* Gradient Background */}
            <PrivateGalleryGradientSection />

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="private-gallery-headline" className="text-sm font-medium text-white">Section Headline</Label>
                  <Input
                    id="private-gallery-headline"
                    value={config.home?.privateGallery?.headline || ''}
                    onChange={(e) => updatePrivateGalleryField('headline', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Your Private Gallery"
                  />
                </div>

                <div>
                  <Label htmlFor="private-gallery-description" className="text-sm font-medium text-white">Description</Label>
                  <Textarea
                    id="private-gallery-description"
                    value={config.home?.privateGallery?.description || ''}
                    onChange={(e) => updatePrivateGalleryField('description', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                    placeholder="Access your photos anytime, anywhere..."
                  />
                </div>

                {/* Hero Image - moved to left side with larger thumbnail */}
                <div>
                  <h4 className="font-medium text-white mb-3">Hero Image</h4>
                  <div className="space-y-3">
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative group">
                      {config.home?.privateGallery?.image ? (
                        <img
                          src={config.home.privateGallery.image}
                          alt="Private gallery hero"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Upload size={32} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.path) {
                                updatePrivateGalleryField('image', data.path);
                              }
                            })
                            .catch(error => console.error('Upload error:', error));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <Input
                      value={config.home?.privateGallery?.image || ''}
                      onChange={(e) => updatePrivateGalleryField('image', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-xs"
                      placeholder="/images/gallery/wedding-gallery-1.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Action Buttons</h4>
                
                <div>
                  <Label htmlFor="primary-button-text" className="text-sm font-medium text-white">Primary Button Text</Label>
                  <Input
                    id="primary-button-text"
                    value={config.home?.privateGallery?.buttons?.primary?.text || ''}
                    onChange={(e) => updatePrivateGalleryButton('primary', { text: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Access My Gallery"
                  />
                </div>

                <div>
                  <Label htmlFor="primary-button-action" className="text-sm font-medium text-white">Primary Button Link</Label>
                  <Input
                    id="primary-button-action"
                    value={config.home?.privateGallery?.buttons?.primary?.action || ''}
                    onChange={(e) => updatePrivateGalleryButton('primary', { action: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="/client-gallery"
                  />
                </div>

                <div>
                  <Label htmlFor="secondary-button-text" className="text-sm font-medium text-white">Secondary Button Text</Label>
                  <Input
                    id="secondary-button-text"
                    value={config.home?.privateGallery?.buttons?.secondary?.text || ''}
                    onChange={(e) => updatePrivateGalleryButton('secondary', { text: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Gallery Demo"
                  />
                </div>

                <div>
                  <Label htmlFor="secondary-button-action" className="text-sm font-medium text-white">Secondary Button Link</Label>
                  <Input
                    id="secondary-button-action"
                    value={config.home?.privateGallery?.buttons?.secondary?.action || ''}
                    onChange={(e) => updatePrivateGalleryButton('secondary', { action: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="/gallery/demo"
                  />
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">Features</h4>
              {config.home?.privateGallery?.features?.map((feature, index) => (
                <div key={feature.id} className="p-4 rounded-lg border bg-slate-700/50 border-slate-600 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`feature-${feature.id}-title`} className="text-sm font-medium text-white">Feature Title</Label>
                      <Input
                        id={`feature-${feature.id}-title`}
                        value={feature.title}
                        onChange={(e) => updatePrivateGalleryFeature(feature.id, { title: e.target.value })}
                        className="bg-slate-600 border-slate-500 text-white"
                        placeholder="Feature Title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`feature-${feature.id}-description`} className="text-sm font-medium text-white">Feature Description</Label>
                      <Textarea
                        id={`feature-${feature.id}-description`}
                        value={feature.description}
                        onChange={(e) => updatePrivateGalleryFeature(feature.id, { description: e.target.value })}
                        className="bg-slate-600 border-slate-500 text-white min-h-[60px]"
                        placeholder="Feature description..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="testimonials">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Testimonials</h3>
                <p className="text-sm text-gray-300">Manage customer testimonials and reviews</p>
              </div>
              <Button onClick={addTestimonial} className="bg-salmon hover:bg-salmon-muted text-white">
                <Plus size={16} className="mr-2" />
                Add Testimonial
              </Button>
            </div>
            
            {/* Testimonials Overview Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="testimonials-headline" className="text-white">Section Headline</Label>
                  <Input
                    id="testimonials-headline"
                    value={config.home?.testimonials?.headline || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      home: {
                        ...config.home,
                        testimonials: {
                          ...config.home?.testimonials,
                          headline: e.target.value
                        }
                      }
                    })}
                    placeholder="What Our Clients Say"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="testimonials-description" className="text-white">Section Description</Label>
                  <Textarea
                    id="testimonials-description"
                    value={config.home?.testimonials?.description || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      home: {
                        ...config.home,
                        testimonials: {
                          ...config.home?.testimonials,
                          description: e.target.value
                        }
                      }
                    })}
                    placeholder="Hear from our satisfied clients about their experience working with us."
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Testimonials Background Gradient */}
            <div className="space-y-4">
              <TestimonialsGradientSection />
            </div>

            {/* Dynamic Testimonials */}
            <div className="space-y-4">
              {config.home?.testimonials?.items?.map((testimonial, index) => (
                <div key={testimonial.id} className="p-4 rounded-lg border bg-slate-700/50 border-slate-600">
                  <div className="flex items-start gap-4">
                    <ImageThumbnail
                      imagePath={testimonial.image || '/images/testimonials/customer-placeholder.jpg'}
                      onPathChange={(newPath) => updateTestimonial(testimonial.id, { image: newPath })}
                    />

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`testimonial-${testimonial.id}-name`} className="text-white">Client Name</Label>
                          <Input
                            id={`testimonial-${testimonial.id}-name`}
                            value={testimonial.name}
                            onChange={(e) => updateTestimonial(testimonial.id, { name: e.target.value })}
                            className="mt-1 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`testimonial-${testimonial.id}-role`} className="text-white">Role/Title</Label>
                          <Input
                            id={`testimonial-${testimonial.id}-role`}
                            value={testimonial.role}
                            onChange={(e) => updateTestimonial(testimonial.id, { role: e.target.value })}
                            className="mt-1 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`testimonial-${testimonial.id}-company`} className="text-white">Company</Label>
                          <Input
                            id={`testimonial-${testimonial.id}-company`}
                            value={testimonial.company}
                            onChange={(e) => updateTestimonial(testimonial.id, { company: e.target.value })}
                            className="mt-1 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`testimonial-${testimonial.id}-rating`} className="text-white">Rating (1-5)</Label>
                          <select
                            id={`testimonial-${testimonial.id}-rating`}
                            value={testimonial.rating}
                            onChange={(e) => updateTestimonial(testimonial.id, { rating: parseInt(e.target.value) })}
                            className="mt-1 w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                          >
                            <option value={1}>1 Star</option>
                            <option value={2}>2 Stars</option>
                            <option value={3}>3 Stars</option>
                            <option value={4}>4 Stars</option>
                            <option value={5}>5 Stars</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`testimonial-${testimonial.id}-quote`} className="text-white">Testimonial Quote</Label>
                        <Textarea
                          id={`testimonial-${testimonial.id}-quote`}
                          value={testimonial.quote || ''}
                          onChange={(e) => updateTestimonial(testimonial.id, { quote: e.target.value })}
                          className="mt-1 bg-slate-700 border-slate-600 text-white"
                          rows={4}
                          placeholder="Enter the testimonial quote here..."
                        />
                      </div>
                      <div>
                        <Label htmlFor={`testimonial-${testimonial.id}-image-path`} className="text-white">Client Photo Path</Label>
                        <Input
                          id={`testimonial-${testimonial.id}-image-path`}
                          value={testimonial.image || ''}
                          onChange={(e) => updateTestimonial(testimonial.id, { image: e.target.value })}
                          placeholder="/images/testimonials/client-photo.jpg"
                          className="mt-1 text-sm bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => removeTestimonial(testimonial.id)}
                      variant="outline"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border-red-500/30"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!config.home?.testimonials?.items || config.home.testimonials.items.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  No testimonials yet. Click "Add Testimonial" to create your first client testimonial.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="company">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Company Information</h3>
              <p className="text-sm text-gray-300">Update your company details and contact information</p>
            </div>
            
            {/* Company Branding Section */}
            <div className="p-4 rounded-lg border bg-slate-700/50 border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-4">Company Branding</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">Company Name</Label>
                  <Input
                    id="name"
                    value={config.contact?.business?.name || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      contact: { 
                        ...config.contact, 
                        business: { ...config.contact?.business, name: e.target.value }
                      }
                    })}
                    placeholder="SlyFox Studios"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="tagline" className="text-white">Company Tagline</Label>
                  <Input
                    id="tagline"
                    value={config.contact?.business?.tagline || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      contact: { 
                        ...config.contact, 
                        business: { ...config.contact?.business, tagline: e.target.value }
                      }
                    })}
                    placeholder="Professional Photography & Videography"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="p-4 rounded-lg border bg-slate-700/50 border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-white">Phone Number</Label>
                    <Input
                      id="phone"
                      value={config.contact?.business?.phone || ''}
                      onChange={(e) => handleConfigChange({
                        ...config,
                        contact: { 
                          ...config.contact, 
                          business: { ...config.contact?.business, phone: e.target.value }
                        }
                      })}
                      placeholder="+27 123 456 789"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={config.contact?.business?.email || ''}
                      onChange={(e) => handleConfigChange({
                        ...config,
                        contact: { 
                          ...config.contact, 
                          business: { ...config.contact?.business, email: e.target.value }
                        }
                      })}
                      placeholder="info@slyfox.co.za"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-white">Business Address</Label>
                  <Input
                    id="address"
                    value={config.contact?.business?.address?.displayText || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      contact: { 
                        ...config.contact, 
                        business: { 
                          ...config.contact?.business, 
                          address: { ...config.contact?.business?.address, displayText: e.target.value }
                        }
                      }
                    })}
                    placeholder="Durban, South Africa"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Business Information Section */}
            <div className="p-4 rounded-lg border bg-slate-700/50 border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-4">Business Information</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-white">Business Description</Label>
                  <Textarea
                    id="description"
                    value={config.contact?.business?.description || ''}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      contact: { 
                        ...config.contact, 
                        business: { ...config.contact?.business, description: e.target.value }
                      }
                    })}
                    placeholder="Describe your business, services, and what makes you unique..."
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="established" className="text-white">Year Established</Label>
                    <Input
                      id="established"
                      type="number"
                      value={config.contact?.business?.yearEstablished || ''}
                      onChange={(e) => handleConfigChange({
                        ...config,
                        contact: { 
                          ...config.contact, 
                          business: { ...config.contact?.business, yearEstablished: e.target.value }
                        }
                      })}
                      placeholder="2020"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-white">Website URL</Label>
                    <Input
                      id="website"
                      type="url"
                      value={config.contact?.business?.website || ''}
                      onChange={(e) => handleConfigChange({
                        ...config,
                        contact: { 
                          ...config.contact, 
                          business: { ...config.contact?.business, website: e.target.value }
                        }
                      })}
                      placeholder="https://slyfox.co.za"
                      className="mt-1 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact/CTA Background Gradient */}
            <div className="space-y-4">
              <ContactGradientSection />
            </div>
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

// Gradient Section Components  
function HeroGradientSection() {
  const { gradient, updateGradient } = useGradient('hero');

  return (
    <GradientPicker
      sectionKey="hero" 
      label="Hero Section Background Gradient"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
    />
  );
}

function ServicesGradientSection() {
  const { gradient, updateGradient } = useGradient('services');

  return (
    <GradientPicker
      sectionKey="services" 
      label="Services Section Background Gradient"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function TestimonialsGradientSection() {
  const { gradient, updateGradient } = useGradient('testimonials');

  return (
    <GradientPicker
      sectionKey="testimonials" 
      label="Testimonials Background Gradient"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function ContactGradientSection() {
  const { gradient, updateGradient } = useGradient('contact');

  return (
    <GradientPicker
      sectionKey="contact" 
      label="Contact/CTA Background Gradient"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function PrivateGalleryGradientSection() {
  const { gradient, updateGradient } = useGradient('privateGallery');

  return (
    <GradientPicker
      sectionKey="privateGallery" 
      label="Private Gallery Background Gradient"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}