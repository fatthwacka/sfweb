import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertCircle, Camera, Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { ImageBrowser } from '@/components/shared/image-browser';
import { CategoryPageConfig, defaultCategoryPageConfig } from '@shared/types/category-config';
import { PricingPackagesEditor } from '@/components/admin/pricing-packages-editor';
import { createPageIdentifier } from '@shared/types/pricing';
import { useCategoryHeroes } from '@/hooks/use-category-heroes';
import { useSiteConfig } from '@/hooks/use-site-config';

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

// Hero image compression settings
const HERO_MAX_WIDTH = 2400;
const HERO_QUALITY = 0.82;
const MAX_FILE_SIZE_MB = 20;
const COMPRESSION_THRESHOLD_KB = 650; // Only compress images larger than this

export function CategoryPageSettings({ type, category }: CategoryPageSettingsProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { config: siteConfig, updateConfigBulk, isLoading, isUpdating: isSiteConfigUpdating } = useSiteConfig();
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [heroUploading, setHeroUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const heroDropRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Use the new Supabase-backed hero images system
  const { getHeroImage, isCustomHero, getHeroHeight, getImageAlign, updateHero, updateHeroSettings, isUpdating } = useCategoryHeroes();
  const currentHeroImage = getHeroImage(type, category);
  const hasCustomHero = isCustomHero(type, category);
  const savedHeroHeight = getHeroHeight(type, category);
  const savedImageAlign = getImageAlign(type, category);

  // Local state for optimistic UI updates (slider/dropdown respond immediately)
  const [localHeroHeight, setLocalHeroHeight] = useState<number>(savedHeroHeight);
  const [localImageAlign, setLocalImageAlign] = useState<'top' | 'center' | 'bottom'>(savedImageAlign);

  // Sync local state when saved data changes
  useEffect(() => {
    setLocalHeroHeight(savedHeroHeight);
  }, [savedHeroHeight]);

  useEffect(() => {
    setLocalImageAlign(savedImageAlign);
  }, [savedImageAlign]);

  // Get current category page config
  const categoryConfig = config?.categoryPages?.[type]?.[category] || defaultCategoryPageConfig;

  // Client-side image compression for hero images (2400px @ 82% quality)
  const compressHeroImage = async (file: File): Promise<File> => {
    // Only compress JPEG/PNG images
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return file;
    }

    // Skip compression for images under threshold (already optimised)
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB <= COMPRESSION_THRESHOLD_KB) {
      console.log(`⏭️ Skipping compression: ${fileSizeKB.toFixed(0)}KB is under ${COMPRESSION_THRESHOLD_KB}KB threshold`);
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Only resize if larger than max width
          if (width > HERO_MAX_WIDTH) {
            height = (height * HERO_MAX_WIDTH) / width;
            width = HERO_MAX_WIDTH;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              // Only use compressed version if it's actually smaller
              if (optimizedFile.size < file.size) {
                const reduction = ((file.size - optimizedFile.size) / file.size * 100).toFixed(0);
                console.log(`✨ Hero compressed: ${(file.size / 1024).toFixed(0)}KB → ${(optimizedFile.size / 1024).toFixed(0)}KB (${reduction}% reduction)`);
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            HERO_QUALITY
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Update local config when data loads
  useEffect(() => {
    if (siteConfig) {
      setConfig(siteConfig as SiteConfig);
    }
  }, [siteConfig]);

  // Save function using useSiteConfig hook
  const saveConfiguration = async (newConfig: SiteConfig) => {
    try {
      await updateConfigBulk(newConfig);
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved successfully!",
        description: `${category} ${type} page updated.`
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: `Unable to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

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

  // Hero image upload handler - uploads to local file system and updates site-config
  const handleHeroImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({ title: "Error", description: `Image must be less than ${MAX_FILE_SIZE_MB}MB`, variant: "destructive" });
      return;
    }

    setHeroUploading(true);

    try {
      const originalSize = file.size;
      const compressedFile = await compressHeroImage(file);
      const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(0);

      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      const imagePath = data.path || `/uploads/${file.name}`;

      // Update site-config with the new local hero image path
      updateHero({ pageType: type, category, imageUrl: imagePath });

      toast({
        title: "Hero image uploaded",
        description: `Saved locally${Number(compressionRatio) > 5 ? ` (${compressionRatio}% compressed)` : ''}`
      });
    } catch (error) {
      console.error('Hero upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload hero image",
        variant: "destructive"
      });
    } finally {
      setHeroUploading(false);
    }
  };

  // Handle drag and drop for hero images
  const handleHeroDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleHeroDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleHeroDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await handleHeroImageUpload(file);
      } else {
        toast({ title: "Error", description: "Please drop an image file", variant: "destructive" });
      }
    }
  };

  // Reset hero to default (clear custom image from site-config)
  const handleResetHero = () => {
    // Set image back to empty so the hook falls back to categoryDefaults
    updateHero({ pageType: type, category, imageUrl: '' });
    toast({
      title: "Hero image reset",
      description: "Now using the default hero image"
    });
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

  // SEO handlers
  const updateSeoConfig = (updates: Partial<CategoryPageConfig['seo']>) => {
    updateCategoryConfig({
      seo: {
        ...categoryConfig.seo,
        ...updates
      }
    });
  };

  const updateSeoContentConfig = (updates: Partial<CategoryPageConfig['seoContent']>) => {
    updateCategoryConfig({
      seoContent: {
        ...categoryConfig.seoContent,
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

  // Handle save
  const handleSave = () => {
    saveConfiguration(config);
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
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-600 mb-0">
            <TabsTrigger value="hero" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Hero</TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Service Overview</TabsTrigger>
            <TabsTrigger value="packages" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Packages</TabsTrigger>
            <TabsTrigger value="work" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">Recent Work</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:font-semibold text-slate-300">SEO Content</TabsTrigger>
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
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Image Upload - Now with Supabase Storage */}
              <div className="gallery-slider-container">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-white">Hero Background Image</h4>
                    {hasCustomHero && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetHero}
                        className="text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Reset to Default
                      </Button>
                    )}
                  </div>

                  {/* Current Image Preview */}
                  <div className="mb-4">
                    <div className="relative rounded-lg overflow-hidden border border-slate-600">
                      <img
                        src={currentHeroImage}
                        alt="Current hero"
                        className="w-full h-48 object-cover"
                      />
                      {hasCustomHero && (
                        <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                          Custom Image
                        </div>
                      )}
                      {!hasCustomHero && (
                        <div className="absolute top-2 right-2 bg-slate-500/80 text-white text-xs px-2 py-1 rounded">
                          Default Image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drag and Drop Upload Zone */}
                  <div
                    ref={heroDropRef}
                    onDragOver={handleHeroDragOver}
                    onDragLeave={handleHeroDragLeave}
                    onDrop={handleHeroDrop}
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
                      ${isDragging
                        ? 'border-salmon bg-salmon/10'
                        : 'border-slate-600 hover:border-slate-500'
                      }
                      ${heroUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    {heroUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-salmon mb-2" />
                        <p className="text-sm text-muted-foreground">Compressing and uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop an image here, or click to browse
                        </p>
                        <p className="text-xs text-slate-500">
                          Max {MAX_FILE_SIZE_MB}MB • Will be compressed to {HERO_MAX_WIDTH}px @ {Math.round(HERO_QUALITY * 100)}% quality
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHeroImageUpload(file);
                            e.target.value = '';
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>

                  {/* Browse Existing Button */}
                  <div className="mt-4">
                    <ImageBrowser
                      currentImage={currentHeroImage}
                      onSelect={async (imagePath) => {
                        // When selecting from existing images, update Supabase
                        try {
                          updateHero({ pageType: type, category, imageUrl: imagePath });
                          toast({
                            title: "Hero image updated",
                            description: "Selected image saved to Supabase"
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update hero image",
                            variant: "destructive"
                          });
                        }
                      }}
                      label="Browse Existing Images"
                      className=""
                    />
                  </div>
                </div>
              </div>

              {/* Hero Display Settings */}
              <div className="gallery-slider-container">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-white mb-4">Hero Display Settings</h4>
                  {!hasCustomHero && (
                    <p className="text-xs text-amber-400 mb-4">
                      ⚠️ Upload a custom hero image first to enable height and alignment settings
                    </p>
                  )}

                  {/* Hero Height Slider */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-300">Hero Height</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={40}
                          max={100}
                          value={localHeroHeight}
                          disabled={!hasCustomHero}
                          onChange={(e) => {
                            const value = Math.min(100, Math.max(40, parseInt(e.target.value) || 60));
                            setLocalHeroHeight(value);
                          }}
                          onBlur={() => {
                            if (hasCustomHero && localHeroHeight !== savedHeroHeight) {
                              updateHeroSettings({ pageType: type, category, heroHeight: localHeroHeight });
                            }
                          }}
                          className="w-16 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white text-center disabled:opacity-50"
                        />
                        <span className="text-sm text-slate-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      value={localHeroHeight}
                      disabled={!hasCustomHero}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setLocalHeroHeight(value);
                      }}
                      onMouseUp={() => {
                        if (hasCustomHero) {
                          updateHeroSettings({ pageType: type, category, heroHeight: localHeroHeight });
                        }
                      }}
                      onTouchEnd={() => {
                        if (hasCustomHero) {
                          updateHeroSettings({ pageType: type, category, heroHeight: localHeroHeight });
                        }
                      }}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-salmon disabled:opacity-50"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>40%</span>
                      <span>70%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Image Alignment Dropdown */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Image Alignment</label>
                    <select
                      value={localImageAlign}
                      disabled={!hasCustomHero}
                      onChange={(e) => {
                        const value = e.target.value as 'top' | 'center' | 'bottom';
                        setLocalImageAlign(value);
                        if (hasCustomHero) {
                          updateHeroSettings({ pageType: type, category, imageAlign: value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-salmon disabled:opacity-50"
                    >
                      <option value="top">Top - Focus on upper part of image</option>
                      <option value="center">Center - Focus on middle of image (default)</option>
                      <option value="bottom">Bottom - Focus on lower part of image</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      Controls how the hero image is positioned when cropped to fit the hero area
                    </p>
                  </div>
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
                    disabled={!hasUnsavedChanges || isSiteConfigUpdating}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSiteConfigUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Colors */}
              <div className="gallery-slider-container">
                <GradientPicker
                  sectionKey={`${type}-${category.replace('s', '')}-services`}
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
          <PricingPackagesEditor
            pageIdentifier={createPageIdentifier(type, category)}
            pageType={type}
            category={category}
            onSave={() => {
              // Refresh any data if needed
              queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
            }}
          />
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
                    disabled={!hasUnsavedChanges || isSiteConfigUpdating}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSiteConfigUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Colors */}
              <div className="gallery-slider-container">
                <GradientPicker
                  sectionKey={`${type}-${category.replace('s', '')}-recent-work`}
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

        {/* SEO Content Section */}
        <TabsContent value="seo" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>SEO Content Section</CardTitle>
                  <CardDescription>
                    Manage SEO content and visual styling for your {categoryDisplayName.toLowerCase()} page
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
                    disabled={!hasUnsavedChanges || isSiteConfigUpdating}
                    className="btn-salmon"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSiteConfigUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO Section Colors */}
              <div className="gallery-slider-container">
                <GradientPicker
                  sectionKey={`${type}-${category.replace(/s$/, '')}-seo`}
                  title="SEO Content Section"
                  showDirection={true}
                  showTextColors={true}
                />
              </div>
              
              {/* SEO Meta Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">SEO Meta Information</h4>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      SEO Page Title
                    </label>
                    <input
                      type="text"
                      value={categoryConfig.seo?.title || ''}
                      onChange={(e) => updateSeoConfig({ title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`${categoryDisplayName} Photography Durban | SlyFox Studios`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={categoryConfig.seo?.description || ''}
                      onChange={(e) => updateSeoConfig({ description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder={`Professional ${category} photography services in Durban...`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={categoryConfig.seo?.keywords || ''}
                      onChange={(e) => updateSeoConfig({ keywords: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Durban ${category} photographer, ${category} photography, SlyFox Studios`}
                    />
                  </div>
                </div>
              </div>

              {/* SEO Content Sections */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">SEO Content Sections</h4>
                <div className="grid gap-6">
                  {/* Section 1 */}
                  <div className="space-y-3">
                    <h5 className="text-md font-medium text-slate-300">Content Section 1</h5>
                    <div className="grid gap-3">
                      <input
                        type="text"
                        value={categoryConfig.seoContent?.content?.section1?.title || ''}
                        onChange={(e) => updateSeoContentConfig({ 
                          content: {
                            ...categoryConfig.seoContent?.content,
                            section1: {
                              ...categoryConfig.seoContent?.content?.section1,
                              title: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Section 1 Title"
                      />
                      <textarea
                        value={categoryConfig.seoContent?.content?.section1?.text || ''}
                        onChange={(e) => updateSeoContentConfig({ 
                          content: {
                            ...categoryConfig.seoContent?.content,
                            section1: {
                              ...categoryConfig.seoContent?.content?.section1,
                              text: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Section 1 content text..."
                      />
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-3">
                    <h5 className="text-md font-medium text-slate-300">Content Section 2</h5>
                    <div className="grid gap-3">
                      <input
                        type="text"
                        value={categoryConfig.seoContent?.content?.section2?.title || ''}
                        onChange={(e) => updateSeoContentConfig({ 
                          content: {
                            ...categoryConfig.seoContent?.content,
                            section2: {
                              ...categoryConfig.seoContent?.content?.section2,
                              title: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Section 2 Title"
                      />
                      <textarea
                        value={categoryConfig.seoContent?.content?.section2?.text || ''}
                        onChange={(e) => updateSeoContentConfig({ 
                          content: {
                            ...categoryConfig.seoContent?.content,
                            section2: {
                              ...categoryConfig.seoContent?.content?.section2,
                              text: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Section 2 content text..."
                      />
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="space-y-3">
                    <h5 className="text-md font-medium text-slate-300">Conclusion</h5>
                    <textarea
                      value={categoryConfig.seoContent?.content?.conclusion || ''}
                      onChange={(e) => updateSeoContentConfig({ 
                        content: {
                          ...categoryConfig.seoContent?.content,
                          conclusion: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Conclusion text..."
                    />
                  </div>
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