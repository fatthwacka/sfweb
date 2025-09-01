import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Save, AlertCircle, ChevronUp, ChevronDown, X, Plus, Camera, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { useGradient } from '@/hooks/use-gradient';
import { ImageBrowser } from '@/components/shared/image-browser';
import { CategoryPageConfig, PackageTier, defaultCategoryPageConfig } from '@shared/types/category-config';

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
      const imagePath = await handleImageUpload(file);
      updateHeroConfig({ image: imagePath });
      toast({
        title: "Hero image uploaded",
        description: "Hero image updated successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload hero image",
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

  const addFeature = () => {
    const newFeatures = [...categoryConfig.serviceOverview.features, ''];
    updateServiceOverviewConfig({ features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...categoryConfig.serviceOverview.features];
    newFeatures[index] = value;
    updateServiceOverviewConfig({ features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = categoryConfig.serviceOverview.features.filter((_, i) => i !== index);
    updateServiceOverviewConfig({ features: newFeatures });
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

  const updatePackageTier = (tierIndex: number, updates: Partial<PackageTier>) => {
    const newTiers = [...categoryConfig.packages.tiers];
    newTiers[tierIndex] = { ...newTiers[tierIndex], ...updates };
    updatePackagesConfig({ tiers: newTiers });
  };

  const addPackageFeature = (tierIndex: number) => {
    const newTiers = [...categoryConfig.packages.tiers];
    newTiers[tierIndex].features = [...newTiers[tierIndex].features, ''];
    updatePackagesConfig({ tiers: newTiers });
  };

  const updatePackageFeature = (tierIndex: number, featureIndex: number, value: string) => {
    const newTiers = [...categoryConfig.packages.tiers];
    newTiers[tierIndex].features[featureIndex] = value;
    updatePackagesConfig({ tiers: newTiers });
  };

  const removePackageFeature = (tierIndex: number, featureIndex: number) => {
    const newTiers = [...categoryConfig.packages.tiers];
    newTiers[tierIndex].features = newTiers[tierIndex].features.filter((_, i) => i !== featureIndex);
    updatePackagesConfig({ tiers: newTiers });
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

  const updateSeoSection = (section: keyof CategoryPageConfig['seoContent']['content'], updates: any) => {
    updateSeoContentConfig({
      content: {
        ...categoryConfig.seoContent.content,
        [section]: {
          ...categoryConfig.seoContent.content[section],
          ...updates
        }
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 rounded-lg p-6">
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-600">
            <TabsTrigger value="hero" className="data-[state=active]:bg-secondary data-[state=active]:font-semibold" style={{color: '#374151'}}>Hero</TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:font-semibold" style={{color: '#374151'}}>Service Overview</TabsTrigger>
            <TabsTrigger value="packages" className="data-[state=active]:bg-secondary data-[state=active]:font-semibold" style={{color: '#374151'}}>Packages</TabsTrigger>
            <TabsTrigger value="work" className="data-[state=active]:bg-secondary data-[state=active]:font-semibold" style={{color: '#374151'}}>Recent Work</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-secondary data-[state=active]:font-semibold" style={{color: '#374151'}}>SEO Content</TabsTrigger>
          </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Hero Section</CardTitle>
                  <CardDescription>
                    Manage the full-screen hero image and overlay text
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
              <div className="space-y-4">
                <Label>Hero Background Image</Label>
                <ImageBrowser
                  currentImage={categoryConfig.hero.image}
                  onSelect={(imagePath) => updateHeroConfig({ image: imagePath })}
                  onUpload={handleHeroImageUpload}
                  label="Hero Background Image"
                  className=""
                />
                <p className="text-xs text-muted-foreground">
                  Choose from existing images or upload a new high-resolution hero background
                </p>
              </div>

              {/* Hero Text Content */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hero-title">Main Title</Label>
                    <Input
                      id="hero-title"
                      value={categoryConfig.hero.title}
                      onChange={(e) => updateHeroConfig({ title: e.target.value })}
                      placeholder="e.g., Wedding Photography"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-subtitle">Subtitle/Tagline</Label>
                    <Input
                      id="hero-subtitle"
                      value={categoryConfig.hero.subtitle}
                      onChange={(e) => updateHeroConfig({ subtitle: e.target.value })}
                      placeholder="e.g., Love stories captured timelessly"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hero-cta">Call-to-Action Text</Label>
                    <Input
                      id="hero-cta"
                      value={categoryConfig.hero.ctaText}
                      onChange={(e) => updateHeroConfig({ ctaText: e.target.value })}
                      placeholder="e.g., Book Session"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-cta-link">CTA Link (optional)</Label>
                    <Input
                      id="hero-cta-link"
                      value={categoryConfig.hero.ctaLink || ''}
                      onChange={(e) => updateHeroConfig({ ctaLink: e.target.value })}
                      placeholder="e.g., /contact"
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Overview Section */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Service Overview Section</CardTitle>
                  <CardDescription>
                    Manage the service description and feature list with section colors
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
                  label="Service Overview Colors"
                  gradient={categoryConfig.serviceOverview.gradients}
                  onChange={(gradient) => updateServiceOverviewConfig({ gradients: gradient })}
                  showDirection={true}
                  showTextColors={true}
                />
              </div>

              {/* Section Image */}
              <div className="gallery-slider-container">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-4 text-white">Section Image</h4>
                  <ImageBrowser
                    currentImage={categoryConfig.serviceOverview.image}
                    onSelect={(imagePath) => updateServiceOverviewConfig({ image: imagePath })}
                    onUpload={handleServiceOverviewImageUpload}
                    label="Section Image"
                    className=""
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose an image to display alongside the service description
                  </p>
                </div>
              </div>

              {/* Content Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="overview-title">Section Title</Label>
                    <Input
                      id="overview-title"
                      value={categoryConfig.serviceOverview.title}
                      onChange={(e) => updateServiceOverviewConfig({ title: e.target.value })}
                      placeholder="e.g., Professional Wedding Photography"
                    />
                  </div>
                  <div>
                    <Label htmlFor="overview-description">Description</Label>
                    <Textarea
                      id="overview-description"
                      rows={4}
                      value={categoryConfig.serviceOverview.description}
                      onChange={(e) => updateServiceOverviewConfig({ description: e.target.value })}
                      placeholder="Describe your service offering..."
                    />
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Service Features</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addFeature}
                      className="btn-cyan"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Feature
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categoryConfig.serviceOverview.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Enter feature..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeFeature(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {categoryConfig.serviceOverview.features.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No features added yet. Click "Add Feature" to get started.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Continue with other sections... This is getting quite long, so I'll break it here for now */}
        
        {/* Packages Section */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Pricing Packages Section</CardTitle>
                  <CardDescription>
                    Manage pricing tiers with detailed features and section colors
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

              {/* Section Headers */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="packages-title">Section Title</Label>
                  <Input
                    id="packages-title"
                    value={categoryConfig.packages.title}
                    onChange={(e) => updatePackagesConfig({ title: e.target.value })}
                    placeholder="e.g., Photography Packages"
                  />
                </div>
                <div>
                  <Label htmlFor="packages-description">Section Description</Label>
                  <Textarea
                    id="packages-description"
                    rows={2}
                    value={categoryConfig.packages.description}
                    onChange={(e) => updatePackagesConfig({ description: e.target.value })}
                    placeholder="Describe your package offerings..."
                  />
                </div>
              </div>

              {/* Package Tiers */}
              <div>
                <Label className="text-lg font-semibold">Package Tiers</Label>
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                  {categoryConfig.packages.tiers.map((tier, tierIndex) => (
                    <Card key={tier.id} className={tier.isPopular ? "border-cyan-400 bg-cyan-950/20" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={tier.isPopular}
                              onChange={(e) => updatePackageTier(tierIndex, { isPopular: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <Label className="text-xs">Popular</Label>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Package Basic Info */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Package Name</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) => updatePackageTier(tierIndex, { name: e.target.value })}
                              placeholder="e.g., Premium"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Price</Label>
                              <Input
                                value={tier.price}
                                onChange={(e) => updatePackageTier(tierIndex, { price: e.target.value })}
                                placeholder="e.g., R2,500"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Duration</Label>
                              <Input
                                value={tier.duration}
                                onChange={(e) => updatePackageTier(tierIndex, { duration: e.target.value })}
                                placeholder="e.g., 4 hours"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Package Features */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs">Features</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addPackageFeature(tierIndex)}
                              className="h-6 px-2 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {tier.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center gap-1">
                                <Input
                                  value={feature}
                                  onChange={(e) => updatePackageFeature(tierIndex, featureIndex, e.target.value)}
                                  placeholder="Enter feature..."
                                  className="flex-1 h-8 text-xs"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removePackageFeature(tierIndex, featureIndex)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            {tier.features.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No features added
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Work Section */}
        <TabsContent value="work">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Recent Work Gallery</CardTitle>
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

              {/* Section Headers */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="work-title">Section Title</Label>
                  <Input
                    id="work-title"
                    value={categoryConfig.recentWork.title}
                    onChange={(e) => updateRecentWorkConfig({ title: e.target.value })}
                    placeholder="e.g., Recent Work"
                  />
                </div>
                <div>
                  <Label htmlFor="work-description">Section Description</Label>
                  <Input
                    id="work-description"
                    value={categoryConfig.recentWork.description}
                    onChange={(e) => updateRecentWorkConfig({ description: e.target.value })}
                    placeholder="e.g., Browse our latest projects"
                  />
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">Gallery Images</Label>
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

            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Content Section */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>SEO Content Section</CardTitle>
                  <CardDescription>
                    Manage rich text content for search optimization
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
                  sectionKey={`${type}-${category}-seo`}
                  label="SEO Content Section Colors"
                  gradient={categoryConfig.seoContent.gradients}
                  onChange={(gradient) => updateSeoContentConfig({ gradients: gradient })}
                  showDirection={true}
                  showTextColors={true}
                />
              </div>

              {/* Main Section Title */}
              <div>
                <Label htmlFor="seo-main-title">Main Section Title</Label>
                <Input
                  id="seo-main-title"
                  value={categoryConfig.seoContent.title}
                  onChange={(e) => updateSeoContentConfig({ title: e.target.value })}
                  placeholder="e.g., Professional Photography Services in Durban"
                />
              </div>

              {/* SEO Content Sections */}
              <div className="space-y-6">
                {/* Section 1 */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Content Section 1</h4>
                    <div>
                      <Label htmlFor="seo-section1-title">Section 1 Title</Label>
                      <Input
                        id="seo-section1-title"
                        value={categoryConfig.seoContent.content.section1.title}
                        onChange={(e) => updateSeoSection('section1', { title: e.target.value })}
                        placeholder="e.g., Expert Photography Services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-section1-text">Section 1 Content</Label>
                      <Textarea
                        id="seo-section1-text"
                        rows={4}
                        value={categoryConfig.seoContent.content.section1.text}
                        onChange={(e) => updateSeoSection('section1', { text: e.target.value })}
                        placeholder="Write detailed content about your services..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Section 2 */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Content Section 2</h4>
                    <div>
                      <Label htmlFor="seo-section2-title">Section 2 Title</Label>
                      <Input
                        id="seo-section2-title"
                        value={categoryConfig.seoContent.content.section2.title}
                        onChange={(e) => updateSeoSection('section2', { title: e.target.value })}
                        placeholder="e.g., Package Options & Pricing"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-section2-text">Section 2 Content</Label>
                      <Textarea
                        id="seo-section2-text"
                        rows={4}
                        value={categoryConfig.seoContent.content.section2.text}
                        onChange={(e) => updateSeoSection('section2', { text: e.target.value })}
                        placeholder="Write about your packages and pricing..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Conclusion */}
                <div>
                  <Label htmlFor="seo-conclusion">Conclusion Paragraph</Label>
                  <Textarea
                    id="seo-conclusion"
                    rows={3}
                    value={categoryConfig.seoContent.content.conclusion}
                    onChange={(e) => updateSeoContentConfig({
                      content: {
                        ...categoryConfig.seoContent.content,
                        conclusion: e.target.value
                      }
                    })}
                    placeholder="Write a compelling conclusion..."
                  />
                </div>
              </div>

              {/* SEO Metadata */}
              <Card className="p-4">
                <h4 className="font-semibold mb-4">SEO Metadata</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="seo-meta-title">Page Title</Label>
                    <Input
                      id="seo-meta-title"
                      value={categoryConfig.seo.title}
                      onChange={(e) => updateCategoryConfig({
                        seo: { ...categoryConfig.seo, title: e.target.value }
                      })}
                      placeholder="e.g., Wedding Photography Durban | SlyFox Studios"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo-meta-description">Meta Description</Label>
                    <Textarea
                      id="seo-meta-description"
                      rows={2}
                      value={categoryConfig.seo.description}
                      onChange={(e) => updateCategoryConfig({
                        seo: { ...categoryConfig.seo, description: e.target.value }
                      })}
                      placeholder="Brief description for search engines..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo-keywords">Keywords</Label>
                    <Input
                      id="seo-keywords"
                      value={categoryConfig.seo.keywords}
                      onChange={(e) => updateCategoryConfig({
                        seo: { ...categoryConfig.seo, keywords: e.target.value }
                      })}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </Card>

            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}