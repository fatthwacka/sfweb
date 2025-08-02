import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, Video, Settings, Eye, Star, AlertTriangle, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/shared/smart-image";

// Asset keys defined locally to avoid circular imports
const ASSET_KEYS = {
  'hero/cape-town-wedding-photography-slyfox-studios': 'Main Home Page Hero',
  'hero/professional-photography-services-cape-town': 'Photography Services Landing',
  'hero/cape-town-wedding-photographer-portfolio': 'Weddings Portfolio Hero',
  'hero/portrait-photographer-cape-town-studio': 'Portraits Portfolio Hero',
  'hero/corporate-photography-cape-town-business': 'Corporate Photography Hero',
  'hero/event-photographer-cape-town-professional': 'Events Portfolio Hero',
  'hero/graduation-photography-cape-town-ceremony': 'Graduation Photography Hero',
  'hero/product-photography-cape-town-commercial': 'Product Photography Hero',
  'hero/matric-dance-photographer-cape-town': 'Matric Dance Photography Hero',
  'backgrounds/photography-studio-cape-town-texture': 'Main Site Background',
  'backgrounds/wedding-photography-background-elegant': 'Wedding Portfolio Background',
  'backgrounds/portrait-photography-studio-backdrop': 'Portrait Studio Background'
} as const;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LocalSiteAsset, ImageClassification, IMAGE_CLASSIFICATIONS } from "@shared/schema";

interface SiteAssetsPanelProps {
  userRole: string;
}

export const SiteAssetsPanel: React.FC<SiteAssetsPanelProps> = ({ userRole }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [editingAltText, setEditingAltText] = useState<string | null>(null);

  // Only super_admin can access this panel
  if (userRole !== 'super_admin') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Super Admin Access Required</h3>
          <p className="text-gray-600">Site asset management is restricted to super administrators.</p>
        </CardContent>
      </Card>
    );
  }

  // Fetch local site assets
  const { data: localAssets, isLoading } = useQuery({
    queryKey: ['local-site-assets'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/local-assets');
        return response as LocalSiteAsset[];
      } catch (error) {
        console.warn('Failed to fetch local assets:', error);
        return [] as LocalSiteAsset[];
      }
    }
  });

  // Fetch featured images for homepage gallery management
  const { data: featuredImages } = useQuery({
    queryKey: ['featured-images'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/images/featured');
        return response as any[];
      } catch (error) {
        console.warn('Failed to fetch featured images:', error);
        return [] as any[];
      }
    }
  });

  // Upload new asset mutation
  const uploadAsset = useMutation({
    mutationFn: async ({ assetKey, file }: { assetKey: string, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetKey', assetKey);
      
      const response = await fetch('/api/local-assets/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['local-site-assets'] });
      toast({
        title: "Success",
        description: `Asset ${variables.assetKey} updated successfully`
      });
      setUploadingAsset(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to upload asset',
        variant: "destructive"
      });
      setUploadingAsset(null);
    }
  });

  // Update alt text mutation
  const updateAltText = useMutation({
    mutationFn: async ({ assetKey, altText }: { assetKey: string, altText: string }) => {
      const response = await fetch(`/api/local-assets/${assetKey}/alt-text`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText })
      });
      
      if (!response.ok) {
        throw new Error('Update failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-site-assets'] });
      toast({
        title: "Success",
        description: 'Alt text updated successfully'
      });
      setEditingAltText(null);
    }
  });

  // Remove asset mutation (reverts to fallback)
  const removeAsset = useMutation({
    mutationFn: async (assetKey: string) => {
      const response = await fetch(`/api/local-assets/${assetKey}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Remove failed');
      }
      
      return response.json();
    },
    onSuccess: (data, assetKey) => {
      queryClient.invalidateQueries({ queryKey: ['local-site-assets'] });
      toast({
        title: "Success",
        description: `Asset removed - reverted to fallback image`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to remove asset',
        variant: "destructive"
      });
    }
  });

  // Validate alt text input
  const validateAltText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Remove multiple consecutive hyphens
      .slice(0, 125);               // SEO optimal length
  };

  const handleFileUpload = (assetKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: 'Please upload a valid image file (JPG, PNG, or WebP)',
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: 'File size must be less than 10MB',
        variant: "destructive"
      });
      return;
    }

    setUploadingAsset(assetKey);
    uploadAsset.mutate({ assetKey, file });
  };

  const AssetCard = ({ assetKey, asset }: { assetKey: string, asset?: LocalSiteAsset }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
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
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          handleFileUpload(assetKey, { target: { files: [file] } } as any);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please drop an image file (JPG, PNG, WebP)",
            variant: "destructive"
          });
        }
      }
    };
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div 
            className={`aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden relative border-2 border-dashed transition-colors ${
              isDragOver ? 'border-salmon bg-salmon/10' : 'border-transparent'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <SmartImage
              assetKey={assetKey}
              alt={asset?.altText || `${assetKey} image`}
              className="w-full h-full object-cover"
              onFallbackUsed={(key) => console.warn(`Fallback used for ${key}`)}
            />
            {isDragOver && (
              <div className="absolute inset-0 bg-salmon/20 flex items-center justify-center">
                <div className="text-salmon font-medium">Drop image here</div>
              </div>
            )}
          </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm">{ASSET_KEYS[assetKey as keyof typeof ASSET_KEYS] || assetKey}</h4>
            <p className="text-xs text-gray-500">
              {asset?.altText || 'No alt text set'}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Upload new image */}
            <label className="flex-1">
              <Button 
                size="sm" 
                className="w-full"
                disabled={uploadingAsset === assetKey}
              >
                <Upload className="w-3 h-3 mr-1" />
                {uploadingAsset === assetKey ? 'Uploading...' : 'Upload Image'}
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(assetKey, e)}
                className="hidden"
              />
            </label>

            {/* Remove Image Button */}
            {asset && (
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0"
                onClick={() => removeAsset.mutate(assetKey)}
                disabled={removeAsset.isPending}
                title="Remove image and revert to fallback"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}

            {/* Edit alt text */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="w-3 h-3" />
                  Alt Text
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Alt Text - {assetKey}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="altText">Alt Text (SEO Description)</Label>
                    <Input
                      id="altText"
                      defaultValue={asset?.altText || ''}
                      placeholder="Professional Cape Town wedding photographer"
                      maxLength={255}
                      onChange={(e) => {
                        const preview = validateAltText(e.target.value);
                        // Show preview in real-time
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only letters, numbers, and hyphens allowed. Spaces will be converted to hyphens.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      const input = document.getElementById('altText') as HTMLInputElement;
                      const validatedText = validateAltText(input.value);
                      updateAltText.mutate({ assetKey, altText: validatedText });
                    }}
                    disabled={updateAltText.isPending}
                    className="w-full"
                  >
                    {updateAltText.isPending ? 'Updating Alt Text...' : 'Save Alt Text'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card> 
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="w-8 h-8 border-2 border-salmon border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading site assets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Site Asset Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage hero images, backgrounds, and featured content. Each asset has a fallback system for reliability.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="local-assets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local-assets" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Local Assets
          </TabsTrigger>
          <TabsTrigger value="featured-work" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Featured Work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local-assets" className="space-y-6">
          {/* Hero Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hero Images (9 Total)</CardTitle>
              <p className="text-sm text-gray-600">
                Primary images displayed on key pages across the photography website. Each has automatic fallback protection.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ASSET_KEYS)
                  .filter(([key]) => key.startsWith('hero/'))
                  .map(([assetKey, title]) => (
                    <AssetCard 
                      key={assetKey}
                      assetKey={assetKey} 
                      asset={localAssets?.find((a) => a.assetKey === assetKey)}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Background Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Background Images (3 Total)</CardTitle>
              <p className="text-sm text-gray-600">
                Subtle background textures and patterns used throughout the site sections.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ASSET_KEYS)
                  .filter(([key]) => key.startsWith('backgrounds/'))
                  .map(([assetKey, title]) => (
                    <AssetCard 
                      key={assetKey}
                      assetKey={assetKey} 
                      asset={localAssets?.find((a) => a.assetKey === assetKey)}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured-work" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Featured Work Gallery</CardTitle>
              <p className="text-sm text-gray-600">
                Images displayed on the homepage. Currently showing {featuredImages?.length || 0} featured images.
              </p>
            </CardHeader>
            <CardContent>
              {featuredImages && featuredImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {featuredImages.map((image: any) => (
                    <div key={image.id} className="relative group">
                      <img 
                        src={`https://your-supabase-url.supabase.co/storage/v1/object/public/images/${image.storagePath}`}
                        alt={`Featured ${image.classification} photography`}
                        className="aspect-square object-cover rounded"
                      />
                      <Badge 
                        className="absolute bottom-2 left-2 bg-black/75 text-white text-xs"
                      >
                        {image.classification}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No featured images selected yet.</p>
                  <p className="text-sm">Use the Gallery Management tab to add featured images.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};