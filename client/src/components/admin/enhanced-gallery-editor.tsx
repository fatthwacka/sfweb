import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Settings,
  Save,
  ArrowUp,
  ArrowDown,
  Star,
  Crown,
  Download,
  LinkIcon,
  ImageIcon,
  Copy,
  Eye,
  Palette,
  Grid,
  Columns
} from 'lucide-react';

interface GalleryImage {
  id: string;
  filename: string;
  storagePath: string;
  downloadCount: number;
  sequence: number;
}

interface EnhancedGalleryEditorProps {
  shootId: string;
}

export function EnhancedGalleryEditor({ shootId }: EnhancedGalleryEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  
  // Gallery appearance settings matching dashboard
  const [gallerySettings, setGallerySettings] = useState({
    backgroundColor: '#1a1a1a',
    borderStyle: 'rounded',
    padding: 'normal',
    layoutStyle: 'masonry',
    imageSpacing: 'normal'
  });
  
  // Fetch shoot data
  const { data: shootData, isLoading } = useQuery({
    queryKey: ['/api/shoots', shootId],
    enabled: !!shootId
  });

  const shoot = shootData?.shoot;
  const images: GalleryImage[] = shootData?.images || [];

  // Initialize settings from shoot data
  useEffect(() => {
    if (shoot) {
      setCustomSlug(shoot.customSlug || '');
      setSelectedCover(shoot.bannerImageId);
    }
  }, [shoot]);

  // Save customization mutation
  const saveCustomizationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}/customization`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      setEditMode(false);
      toast({ title: "Gallery settings saved successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save gallery settings",
        variant: "destructive" 
      });
    }
  });

  const handleSaveChanges = () => {
    if (!customSlug.trim()) {
      toast({
        title: "Error",
        description: "Gallery slug cannot be empty",
        variant: "destructive"
      });
      return;
    }

    const data = {
      customSlug: customSlug.trim(),
      bannerImageId: selectedCover,
      gallerySettings: gallerySettings
    };

    saveCustomizationMutation.mutate(data);
  };

  const setAlbumCover = (imageId: string) => {
    setSelectedCover(selectedCover === imageId ? null : imageId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salmon mx-auto mb-4"></div>
          <p>Loading gallery editor...</p>
        </div>
      </div>
    );
  }

  if (!shoot) {
    return (
      <Card className="bg-salmon-dark border border-salmon/30">
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Shoot Not Found</h3>
          <p className="text-muted-foreground">The selected shoot could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Settings Panel */}
      <Card className="bg-salmon-dark border border-salmon/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-salmon flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gallery Settings - {shoot.title}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode(!editMode)}
                className={editMode ? "bg-cyan text-black" : "border-border hover:border-cyan text-white"}
              >
                {editMode ? 'Cancel' : 'Edit Settings'}
              </Button>
              {editMode && (
                <Button
                  onClick={handleSaveChanges}
                  disabled={saveCustomizationMutation.isPending}
                  className="bg-salmon text-white hover:bg-salmon-muted"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveCustomizationMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {editMode ? (
            <div className="space-y-6">
              {/* URL Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Gallery URL</h3>
                <div className="space-y-2">
                  <Label htmlFor="customSlug">Custom URL Slug</Label>
                  <Input
                    id="customSlug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="sarah-michael-wedding-2024"
                    className="bg-background"
                  />
                  <p className="text-sm text-muted-foreground">
                    Gallery will be accessible at: <code>/gallery/{customSlug || 'your-slug'}</code>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Appearance Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Gallery Appearance</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Background Color</Label>
                    <Select 
                      value={gallerySettings.backgroundColor} 
                      onValueChange={(value) => setGallerySettings(prev => ({...prev, backgroundColor: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#1a1a1a">Dark Charcoal</SelectItem>
                        <SelectItem value="#000000">Pure Black</SelectItem>
                        <SelectItem value="#2d2d2d">Medium Dark</SelectItem>
                        <SelectItem value="#ffffff">Pure White</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Layout Style</Label>
                    <Select 
                      value={gallerySettings.layoutStyle} 
                      onValueChange={(value) => setGallerySettings(prev => ({...prev, layoutStyle: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masonry">Masonry (Pinterest-style)</SelectItem>
                        <SelectItem value="grid">Square Grid</SelectItem>
                        <SelectItem value="columns">Equal Columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Border Style</Label>
                    <Select 
                      value={gallerySettings.borderStyle} 
                      onValueChange={(value) => setGallerySettings(prev => ({...prev, borderStyle: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded Corners</SelectItem>
                        <SelectItem value="sharp">Sharp Corners</SelectItem>
                        <SelectItem value="circular">Circular (for portraits)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Image Spacing</Label>
                    <Select 
                      value={gallerySettings.imageSpacing} 
                      onValueChange={(value) => setGallerySettings(prev => ({...prev, imageSpacing: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tight">Tight (2px gaps)</SelectItem>
                        <SelectItem value="normal">Normal (8px gaps)</SelectItem>
                        <SelectItem value="loose">Loose (16px gaps)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-salmon" />
                <span className="font-medium">Gallery URL:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">/gallery/{customSlug || 'not-set'}</code>
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(`/gallery/${customSlug}`)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan" />
                <span className="font-medium">Total Images:</span>
                <Badge variant="outline">{images.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-salmon" />
                <span className="font-medium">Layout:</span>
                <Badge variant="outline" className="capitalize">{gallerySettings.layoutStyle}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="bg-salmon-dark border border-salmon/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-salmon flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg p-4"
            style={{ 
              backgroundColor: gallerySettings.backgroundColor,
              minHeight: '300px'
            }}
          >
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              {shoot.customTitle || shoot.title}
            </h2>
            
            {gallerySettings.layoutStyle === 'masonry' ? (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
                {images.slice(0, 12).map((image) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden break-inside-avoid mb-2
                      ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : 
                        gallerySettings.borderStyle === 'circular' ? 'rounded-full' : ''}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                    `}
                    onClick={() => editMode && setAlbumCover(image.id)}
                  >
                    <img
                      src={image.storagePath}
                      alt={image.filename}
                      className="w-full h-auto object-cover"
                    />
                    {selectedCover === image.id && (
                      <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                        Cover
                      </div>
                    )}
                    {editMode && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant={selectedCover === image.id ? "default" : "secondary"}
                          onClick={() => setAlbumCover(image.id)}
                          className={selectedCover === image.id ? "bg-salmon text-white" : ""}
                        >
                          {selectedCover === image.id ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`
                grid gap-${gallerySettings.imageSpacing === 'tight' ? '1' : gallerySettings.imageSpacing === 'loose' ? '4' : '2'}
                ${gallerySettings.layoutStyle === 'grid' ? 'grid-cols-4' : 'grid-cols-3'}
              `}>
                {images.slice(0, 12).map((image) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden aspect-square
                      ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : 
                        gallerySettings.borderStyle === 'circular' ? 'rounded-full' : ''}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                    `}
                    onClick={() => editMode && setAlbumCover(image.id)}
                  >
                    <img
                      src={image.storagePath}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                    {selectedCover === image.id && (
                      <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                        Cover
                      </div>
                    )}
                    {editMode && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant={selectedCover === image.id ? "default" : "secondary"}
                          onClick={() => setAlbumCover(image.id)}
                          className={selectedCover === image.id ? "bg-salmon text-white" : ""}
                        >
                          {selectedCover === image.id ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {images.length > 12 && (
              <div className="text-center mt-4 text-muted-foreground">
                ... and {images.length - 12} more images
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Management */}
      <Card className="bg-salmon-dark border border-salmon/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-salmon">Image Sequence & Cover Selection</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Images Yet</h3>
              <p className="text-muted-foreground">Upload images to this shoot to start managing the gallery.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div 
                  key={image.id} 
                  className={`relative group bg-black/20 rounded-lg overflow-hidden ${
                    selectedCover === image.id ? 'ring-2 ring-salmon' : ''
                  }`}
                >
                  <img 
                    src={image.storagePath} 
                    alt={image.filename}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Album Cover Badge */}
                  {selectedCover === image.id && (
                    <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-sm font-bold">
                      Cover
                    </div>
                  )}

                  {/* Download Count */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {image.downloadCount}
                  </div>

                  {/* Filename */}
                  <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-sm max-w-32 truncate">
                    {image.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}