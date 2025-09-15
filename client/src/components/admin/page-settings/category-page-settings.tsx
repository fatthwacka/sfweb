import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { ImageBrowser } from '@/components/shared/image-browser';
import { CategoryPageConfig, defaultCategoryPageConfig } from '@shared/types/category-config';

interface CategoryPageSettingsProps {
  type: 'photography' | 'videography';
  category: string;
}

interface SiteConfig {
  categoryPages?: {
    photography: Record<string, CategoryPageConfig>;
    videography: Record<string, CategoryPageConfig>;
  };
  [key: string]: any;
}

const defaultSiteConfig: SiteConfig = {};

export function CategoryPageSettings({ type, category }: CategoryPageSettingsProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const queryClient = useQueryClient();

  // Get current category page config
  const categoryConfig = config?.categoryPages?.[type]?.[category] || defaultCategoryPageConfig;

  // Site configuration query
  const { data: siteConfig, isLoading } = useQuery({
    queryKey: ['/api/site-config'],
    queryFn: async () => {
      const response = await fetch('/api/site-config');
      if (!response.ok) throw new Error('Failed to load site configuration');
      return response.json() as SiteConfig;
    }
  });

  // Update local config when data loads
  useEffect(() => {
    if (siteConfig) {
      setConfig(siteConfig);
    }
  }, [siteConfig]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (newConfig: SiteConfig) => {
      const response = await fetch('/api/site-config/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved successfully!",
        description: `${category} ${type} page updated.`
      });
      queryClient.invalidateQueries(['/api/site-config']);
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: `Unable to save changes: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update category page configuration
  const updateCategoryConfig = (updates: Partial<CategoryPageConfig>) => {
    const newConfig = {
      ...config,
      categoryPages: {
        ...config.categoryPages,
        [type]: {
          ...config.categoryPages?.[type],
          [category]: {
            ...categoryConfig,
            ...updates
          }
        }
      }
    };
    setConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  // File upload handler
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const { filename } = await response.json();
    return `/uploads/${filename}`;
  };

  // Hero section handlers
  const updateHeroConfig = (updates: Partial<CategoryPageConfig['hero']>) => {
    updateCategoryConfig({
      hero: {
        ...categoryConfig.hero,
        ...updates
      }
    });
  };

  const handleHeroImageUpload = async (file: File) => {
    try {
      console.log('Starting SEO upload for:', file.name, 'Category:', category, 'Type:', type);
      
      // Try SEO-optimized upload endpoint first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('type', type);
      
      let response = await fetch('/api/upload/category-hero', {
        method: 'POST',
        body: formData
      });
      
      // If SEO endpoint doesn't exist (404 or returns HTML), fall back to regular upload
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        console.log('SEO endpoint not available, falling back to regular upload');
        
        // Use regular upload endpoint as fallback
        const regularFormData = new FormData();
        regularFormData.append('file', file);
        
        response = await fetch('/api/upload', {
          method: 'POST',
          body: regularFormData
        });
        
        if (!response.ok) {
          throw new Error('Both upload methods failed');
        }
        
        const data = await response.json();
        
        // Generate alt text client-side for fallback
        const categoryDescriptions: { [key: string]: string } = {
          weddings: "elegant wedding ceremony with bride and groom",
          wedding: "elegant wedding ceremony with bride and groom",
          portraits: "professional portrait session with studio lighting",
          portrait: "professional portrait session with studio lighting",
          corporate: "executive headshot in modern office setting",
          events: "dynamic event photography capturing special moments",
          event: "dynamic event photography capturing special moments",
          products: "commercial product showcase with professional lighting",
          product: "commercial product showcase with professional lighting",
          graduation: "graduation ceremony photography with academic regalia"
        };
        
        const categoryKey = category.toLowerCase().replace(/s$/, '');
        const description = categoryDescriptions[categoryKey] || categoryDescriptions[category.toLowerCase()] || "professional photography session";
        const generatedAltText = `Professional ${category} ${type} by SlyFox Studios in Durban - ${description}`;
        
        // Update with regular upload path and client-generated alt text
        updateHeroConfig({ 
          image: data.path,
          alt: generatedAltText 
        });
        
        toast({
          title: "Hero image uploaded",
          description: "Using standard upload (SEO endpoint will be available after server restart)"
        });
      } else {
        // SEO endpoint worked!
        const data = await response.json();
        const { path, generatedAltText, filename } = data;
        
        // Update both image path and auto-generated alt text
        updateHeroConfig({ 
          image: path,
          alt: generatedAltText 
        });
        
        toast({
          title: "Hero image uploaded",
          description: `SEO-optimized upload: ${filename}`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload hero image",
        variant: "destructive"
      });
    }
  };

  const handleServiceOverviewImageUpload = async (file: File) => {
    try {
      const imagePath = await handleImageUpload(file);
      updateServiceOverviewConfig({ image: imagePath });
      toast({
        title: "Service overview image uploaded",
        description: "Service overview image updated successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload service overview image",
        variant: "destructive"
      });
    }
  };

  // Service overview handlers
  const updateServiceOverviewConfig = (updates: Partial<CategoryPageConfig['serviceOverview']>) => {
    updateCategoryConfig({
      serviceOverview: {
        ...categoryConfig.serviceOverview,
        ...updates
      }
    });
  };

  // Package handlers
  const updatePackagesConfig = (updates: Partial<CategoryPageConfig['packages']>) => {
    updateCategoryConfig({
      packages: {
        ...categoryConfig.packages,
        ...updates
      }
    });
  };

  // Recent work handlers
  const updateRecentWorkConfig = (updates: Partial<CategoryPageConfig['recentWork']>) => {
    updateCategoryConfig({
      recentWork: {
        ...categoryConfig.recentWork,
        ...updates
      }
    });
  };

  const handleRecentWorkImageUpload = async (file: File) => {
    try {
      const imagePath = await handleImageUpload(file);
      const newImages = [...categoryConfig.recentWork.images, imagePath];
      updateRecentWorkConfig({ images: newImages });
      toast({
        title: "Gallery image uploaded",
        description: "Gallery image added successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload gallery image",
        variant: "destructive"
      });
    }
  };

  const removeRecentWorkImage = (index: number) => {
    const newImages = categoryConfig.recentWork.images.filter((_, i) => i !== index);
    updateRecentWorkConfig({ images: newImages });
  };

  // SEO content handlers
  const updateSeoContentConfig = (updates: Partial<CategoryPageConfig['seoContent']>) => {
    updateCategoryConfig({
      seoContent: {
        ...categoryConfig.seoContent,
        ...updates
      }
    });
  };

  // Handle save
  const handleSave = () => {
    saveMutation.mutate(config);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading {category} {type} settings...</p>
        </div>
      </div>
    );
  }

  const categoryDisplayName = category.charAt(0).toUpperCase() + category.slice(1) + 
    (category.endsWith('s') ? '' : category === 'photography' ? ' Photography' : ' Videography');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 rounded-lg p-6">
        <Tabs defaultValue="hero" className="space-y-0">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-600 mb-0">
            <TabsTrigger value="hero" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Hero</TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Service Overview</TabsTrigger>
            <TabsTrigger value="packages" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Packages</TabsTrigger>
            <TabsTrigger value="work" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Recent Work</TabsTrigger>
          </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Hero Section - Visual Customization</CardTitle>
                  <CardDescription>
                    Manage the hero background image for your {categoryDisplayName.toLowerCase()} page
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </div>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saveMutation.isPending}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Image Upload */}
              <div className="gallery-slider-container">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-4 text-white">Hero Background Image</h4>
                  <ImageBrowser
                    currentImage={categoryConfig.hero.image}
                    onSelect={(imagePath) => updateHeroConfig({ image: imagePath })}
                    onUpload={handleHeroImageUpload}
                    label="Hero Background Image"
                    className=""
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose from existing images or upload a new high-resolution hero background
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Overview Section */}
        <TabsContent value="overview" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Service Overview - Visual Customization</CardTitle>
                  <CardDescription>
                    Manage section colors and feature image for your service overview
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </div>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saveMutation.isPending}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Colors */}
              <div className="gallery-slider-container">
                <GradientPicker
                  sectionKey={`${type}-${category}-overview`}
                  label="Service Overview Section Colors"
                  gradient={categoryConfig.serviceOverview.gradients}
                  onChange={(gradient) => updateServiceOverviewConfig({ gradients: gradient })}
                  showDirection={true}
                  showTextColors={true}
                />
              </div>

              {/* Section Image */}
              <div className="gallery-slider-container">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-4 text-white">Service Overview Image</h4>
                  <ImageBrowser
                    currentImage={categoryConfig.serviceOverview.image}
                    onSelect={(imagePath) => updateServiceOverviewConfig({ image: imagePath })}
                    onUpload={handleServiceOverviewImageUpload}
                    label="Service Overview Image"
                    className=""
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose an image to display alongside the service description
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Section */}
        <TabsContent value="packages" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Pricing Packages - Visual Customization</CardTitle>
                  <CardDescription>
                    Manage section colors for your pricing packages display
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </div>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saveMutation.isPending}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Colors */}
              <div className="gallery-slider-container">
                <GradientPicker
                  sectionKey={`${type}-${category}-packages`}
                  label="Packages Section Colors"
                  gradient={categoryConfig.packages.gradients}
                  onChange={(gradient) => updatePackagesConfig({ gradients: gradient })}
                  showDirection={true}
                  showTextColors={true}
                />
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-600/30">
                <p className="text-slate-300 text-sm">
                  Package details (names, prices, features) are now managed in the application code for SEO consistency.
                  Use this section to customize the visual appearance of your pricing section.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Work Section */}
        <TabsContent value="work" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Recent Work Gallery - Visual Customization</CardTitle>
                  <CardDescription>
                    Manage gallery images and section styling
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </div>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saveMutation.isPending}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Colors */}
              <div className="gallery-slider-container">
                <GradientPicker
                  sectionKey={`${type}-${category}-work`}
                  label="Recent Work Section Colors"
                  gradient={categoryConfig.recentWork.gradients}
                  onChange={(gradient) => updateRecentWorkConfig({ gradients: gradient })}
                  showDirection={true}
                  showTextColors={true}
                />
              </div>

              {/* Gallery Images */}
              <div className="gallery-slider-container">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-white">Gallery Images</h4>
                    <div>
                      <ImageBrowser
                        onSelect={(imagePath) => {
                          const newImages = [...categoryConfig.recentWork.images, imagePath];
                          updateRecentWorkConfig({ images: newImages });
                          toast({
                            title: "Gallery image added",
                            description: "Image added to recent work gallery"
                          });
                        }}
                        onUpload={handleRecentWorkImageUpload}
                        label="Add Gallery Image"
                        className="w-auto"
                      />
                    </div>
                  </div>

                  {categoryConfig.recentWork.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categoryConfig.recentWork.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRecentWorkImage(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No gallery images yet</p>
                      <p className="text-sm text-muted-foreground">Upload images to showcase your recent work</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}