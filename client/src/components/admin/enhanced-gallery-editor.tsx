import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Columns,
  User,
  Calendar,
  MapPin,
  Camera,
  AlertTriangle,
  Edit,
  Upload,
  Plus
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
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  
  // All editable shoot parameters
  const [editableShoot, setEditableShoot] = useState({
    title: '',
    location: '',
    shootDate: '',
    description: '',
    customTitle: '',
    customSlug: '',
    clientId: '',
    shootType: '',
    isPrivate: false,
    notes: '',
    seoTags: ''
  });
  
  const [clientReassignDialogOpen, setClientReassignDialogOpen] = useState(false);
  
  // Gallery appearance settings matching dashboard - defaults as requested
  const [gallerySettings, setGallerySettings] = useState({
    backgroundColor: '#ffffff',
    borderStyle: 'sharp',
    padding: 'tight',
    layoutStyle: 'grid',
    imageSpacing: 'tight'
  });
  
  // Fetch shoot data
  const { data: shootData, isLoading } = useQuery({
    queryKey: ['/api/shoots', shootId],
    enabled: !!shootId
  });

  // Fetch clients for reassignment dialog
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients']
  });

  const shoot = shootData?.shoot;
  const images: GalleryImage[] = shootData?.images || [];

  // Initialize settings from shoot data
  useEffect(() => {
    if (shoot) {
      setCustomSlug(shoot.customSlug || '');
      setSelectedCover(shoot.bannerImageId);
      setEditableShoot({
        title: shoot.title || '',
        location: shoot.location || '',
        shootDate: shoot.shootDate ? new Date(shoot.shootDate).toISOString().split('T')[0] : '',
        description: shoot.description || '',
        customTitle: shoot.customTitle || '',
        customSlug: shoot.customSlug || '',
        clientId: shoot.clientId || '',
        shootType: shoot.shootType || '',
        isPrivate: shoot.isPrivate || false,
        notes: shoot.notes || '',
        seoTags: Array.isArray(shoot.seoTags) ? shoot.seoTags.join(', ') : (shoot.seoTags || '')
      });
    }
  }, [shoot]);

  // Initialize image order from sequence
  useEffect(() => {
    if (images.length > 0) {
      const sortedImages = [...images].sort((a, b) => a.sequence - b.sequence);
      setImageOrder(sortedImages.map(img => img.id));
    }
  }, [images]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, imageId: string) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    
    if (!draggedImage || draggedImage === targetImageId) {
      setDraggedImage(null);
      return;
    }

    setImageOrder(currentOrder => {
      const newOrder = [...currentOrder];
      const draggedIndex = newOrder.indexOf(draggedImage);
      const targetIndex = newOrder.indexOf(targetImageId);
      
      // Remove dragged item and insert at new position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedImage);
      
      return newOrder;
    });
    
    setDraggedImage(null);
  }, [draggedImage]);

  const handleDragEnd = useCallback(() => {
    setDraggedImage(null);
  }, []);

  // Get ordered images for display
  const getOrderedImages = useCallback(() => {
    if (imageOrder.length === 0) return images;
    
    const imageMap = new Map(images.map(img => [img.id, img]));
    const orderedImages = imageOrder
      .map(id => imageMap.get(id))
      .filter(Boolean) as GalleryImage[];
    
    // Add any new images not in order yet
    const orderedIds = new Set(imageOrder);
    const newImages = images.filter(img => !orderedIds.has(img.id));
    
    return [...orderedImages, ...newImages];
  }, [images, imageOrder]);

  // Save comprehensive shoot updates
  const saveCustomizationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      setEditMode(false);
      toast({ title: "All changes saved successfully!" });
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save changes. Please try again.",
        variant: "destructive" 
      });
    }
  });

  const handleSaveChanges = async () => {
    // Validation
    if (!editableShoot.title.trim()) {
      toast({
        title: "Error",
        description: "Shoot title is required",
        variant: "destructive"
      });
      return;
    }

    if (!editableShoot.location.trim()) {
      toast({
        title: "Error", 
        description: "Location is required",
        variant: "destructive"
      });
      return;
    }

    if (!editableShoot.shootDate) {
      toast({
        title: "Error",
        description: "Shoot date is required", 
        variant: "destructive"
      });
      return;
    }

    // Handle image uploads first
    const fileInput = document.getElementById('imageUploadInput') as HTMLInputElement;
    const filesToUpload = fileInput?.files ? Array.from(fileInput.files) : [];
    
    try {
      // Upload images to Supabase if any selected
      if (filesToUpload.length > 0) {
        toast({
          title: "Uploading Images",
          description: `Uploading ${filesToUpload.length} image(s)...`,
        });

        // Create FormData for image upload
        const uploadData = new FormData();
        uploadData.append('shootId', shootId);
        filesToUpload.forEach((file, index) => {
          uploadData.append(`images`, file);
        });

        // Upload images via API
        const uploadResponse = await fetch('/api/images/upload', {
          method: 'POST',
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        toast({
          title: "Images Uploaded",
          description: `Successfully uploaded ${filesToUpload.length} image(s)`,
        });

        // Clear the file input
        fileInput.value = '';
      }

      // Update image sequences based on current order
      const imageSequences = imageOrder.length > 0 
        ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
        : {};

      // Prepare comprehensive shoot update data
      const updateData = {
        // Basic shoot information
        title: editableShoot.title.trim(),
        location: editableShoot.location.trim(),
        shootDate: editableShoot.shootDate,
        description: editableShoot.description.trim(),
        shootType: editableShoot.shootType,
        clientId: editableShoot.clientId, // This is the email for our system
        isPrivate: editableShoot.isPrivate,
        notes: editableShoot.notes.trim(),
        seoTags: editableShoot.seoTags.split(',').map(tag => tag.trim()).filter(Boolean),
        
        // Gallery customization
        customTitle: editableShoot.customTitle.trim() || null,
        customSlug: editableShoot.customSlug.trim() || null,
        bannerImageId: selectedCover,
        gallerySettings: gallerySettings,
        imageSequences
      };

      // Save all changes
      await saveCustomizationMutation.mutateAsync(updateData);
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
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
      <Card className="admin-gradient-card">
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
              {/* Basic Shoot Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Shoot Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shootTitle">Shoot Title *</Label>
                    <Input
                      id="shootTitle"
                      value={editableShoot.title}
                      onChange={(e) => setEditableShoot(prev => ({...prev, title: e.target.value}))}
                      placeholder="Sarah & Michael's Wedding"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shootLocation">Location *</Label>
                    <Input
                      id="shootLocation"
                      value={editableShoot.location}
                      onChange={(e) => setEditableShoot(prev => ({...prev, location: e.target.value}))}
                      placeholder="Cape Town Waterfront"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shootDate">Shoot Date *</Label>
                    <Input
                      id="shootDate"
                      type="date"
                      value={editableShoot.shootDate}
                      onChange={(e) => setEditableShoot(prev => ({...prev, shootDate: e.target.value}))}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shootType">Shoot Type *</Label>
                    <Select 
                      value={editableShoot.shootType} 
                      onValueChange={(value) => setEditableShoot(prev => ({...prev, shootType: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shoot type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="maternity">Maternity</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="shootDescription">Description</Label>
                  <Textarea
                    id="shootDescription"
                    value={editableShoot.description}
                    onChange={(e) => setEditableShoot(prev => ({...prev, description: e.target.value}))}
                    placeholder="Brief description of the shoot..."
                    rows={3}
                    className="bg-background"
                  />
                </div>

                {/* Client Assignment with Warning */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client Assignment
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Current: {(() => {
                        const client = clients.find(c => c.email === editableShoot.clientId);
                        return client ? `${client.name} (${client.email})` : editableShoot.clientId || 'No client assigned';
                      })()}
                    </span>
                    <Dialog open={clientReassignDialogOpen} onOpenChange={setClientReassignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-salmon text-salmon hover:bg-salmon hover:text-white">
                          <Edit className="w-3 h-3 mr-1" />
                          Change Client
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="admin-gradient-card">
                        <DialogHeader>
                          <DialogTitle className="text-salmon flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Reassign Shoot to Different Client
                          </DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            <strong>Warning:</strong> This will reassign this entire shoot and all its images to a different client. 
                            The original client will lose access to this gallery. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newClientId">Select New Client *</Label>
                            <Select onValueChange={(value) => setEditableShoot(prev => ({...prev, clientId: value}))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a client" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map(client => (
                                  <SelectItem key={client.id} value={client.email}>
                                    {client.name} ({client.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              className="flex-1 bg-salmon text-white hover:bg-salmon-muted"
                              onClick={() => {
                                setClientReassignDialogOpen(false);
                                toast({
                                  title: "Client Updated",
                                  description: "Shoot will be reassigned when you save changes.",
                                });
                              }}
                            >
                              Confirm Reassignment
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setClientReassignDialogOpen(false)}
                              className="border-border hover:border-salmon"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Gallery Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Gallery Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customTitle">Custom Gallery Title</Label>
                    <Input
                      id="customTitle"
                      value={editableShoot.customTitle}
                      onChange={(e) => setEditableShoot(prev => ({...prev, customTitle: e.target.value}))}
                      placeholder="Leave empty to use shoot title"
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be displayed as the main gallery heading
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customSlug">Custom URL Slug</Label>
                    <Input
                      id="customSlug"
                      value={editableShoot.customSlug}
                      onChange={(e) => setEditableShoot(prev => ({...prev, customSlug: e.target.value}))}
                      placeholder="sarah-michael-wedding-2024"
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Gallery will be accessible at: <code>/gallery/{editableShoot.customSlug || 'your-slug'}</code>
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="seoTags">SEO Tags</Label>
                  <Input
                    id="seoTags"
                    value={editableShoot.seoTags}
                    onChange={(e) => setEditableShoot(prev => ({...prev, seoTags: e.target.value}))}
                    placeholder="wedding photography, cape town, romantic, outdoor"
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated tags for SEO optimization
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isPrivate" 
                    checked={editableShoot.isPrivate}
                    onCheckedChange={(checked) => setEditableShoot(prev => ({...prev, isPrivate: checked}))}
                  />
                  <Label htmlFor="isPrivate" className="text-sm">
                    Make gallery private (requires login to view)
                  </Label>
                </div>

                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={editableShoot.notes}
                    onChange={(e) => setEditableShoot(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Internal notes for staff reference..."
                    rows={3}
                    className="bg-background"
                  />
                </div>
              </div>

              <Separator />

              {/* Image Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Add New Images</h3>
                <div className="border-2 border-dashed border-salmon/30 rounded-lg p-8 text-center bg-background/50">
                  <Upload className="w-12 h-12 text-salmon mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Drag and drop images here, or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="imageUploadInput"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        toast({
                          title: "Images Selected",
                          description: `${files.length} image(s) ready for upload. Click "Save Changes" to upload and save all modifications.`,
                        });
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    className="border-salmon text-salmon hover:bg-salmon hover:text-white"
                    onClick={() => document.getElementById('imageUploadInput')?.click()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Select Images to Upload
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: JPG, PNG, WEBP • Max 10MB per image • Bulk upload supported
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
      <Card className="admin-gradient-card">
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
              <div className={`columns-2 md:columns-3 lg:columns-4 gap-${gallerySettings.imageSpacing === 'tight' ? '1' : gallerySettings.imageSpacing === 'loose' ? '4' : '2'} space-y-${gallerySettings.imageSpacing === 'tight' ? '1' : gallerySettings.imageSpacing === 'loose' ? '4' : '2'}`}>
                {getOrderedImages().slice(0, 12).map((image) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden break-inside-avoid mb-${gallerySettings.imageSpacing === 'tight' ? '1' : gallerySettings.imageSpacing === 'loose' ? '4' : '2'}
                      ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : 
                        gallerySettings.borderStyle === 'circular' ? 'rounded-full' : ''}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      ${editMode ? 'cursor-move' : 'cursor-pointer'}
                      ${draggedImage === image.id ? 'opacity-50' : ''}
                    `}
                    onClick={() => editMode && setAlbumCover(image.id)}
                    draggable={editMode}
                    onDragStart={editMode ? (e) => handleDragStart(e, image.id) : undefined}
                    onDragOver={editMode ? handleDragOver : undefined}
                    onDrop={editMode ? (e) => handleDrop(e, image.id) : undefined}
                    onDragEnd={editMode ? handleDragEnd : undefined}
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
                {getOrderedImages().slice(0, 12).map((image) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden aspect-square
                      ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : 
                        gallerySettings.borderStyle === 'circular' ? 'rounded-full' : ''}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      ${editMode ? 'cursor-move' : 'cursor-pointer'}
                      ${draggedImage === image.id ? 'opacity-50' : ''}
                    `}
                    onClick={() => editMode && setAlbumCover(image.id)}
                    draggable={editMode}
                    onDragStart={editMode ? (e) => handleDragStart(e, image.id) : undefined}
                    onDragOver={editMode ? handleDragOver : undefined}
                    onDrop={editMode ? (e) => handleDrop(e, image.id) : undefined}
                    onDragEnd={editMode ? handleDragEnd : undefined}
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
          {images.length > 0 && (
            <p className="text-muted-foreground text-sm">
              Drag and drop images to reorder them. Changes are saved when you click "Save Changes" above.
            </p>
          )}
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
              {getOrderedImages().map((image, index) => (
                <div 
                  key={image.id} 
                  className={`relative group bg-black/20 rounded-lg overflow-hidden cursor-move transition-all ${
                    selectedCover === image.id ? 'ring-2 ring-salmon' : ''
                  } ${draggedImage === image.id ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, image.id)}
                  onDragEnd={handleDragEnd}
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