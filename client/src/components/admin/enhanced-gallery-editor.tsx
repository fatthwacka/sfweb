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
import { 
  BasicInfoSection, 
  AdvancedSettingsSection, 
  AddImagesSection, 
  GalleryAppearanceSection 
} from './gallery-sections';

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

  // All mutations must be declared before any conditional returns (Rules of Hooks)
  const saveBasicInfoMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      toast({ title: "Basic information saved successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save basic info", variant: "destructive" })
  });

  const saveAdvancedSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      toast({ title: "Advanced settings saved successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save advanced settings", variant: "destructive" })
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadData = new FormData();
      uploadData.append('shootId', shootId);
      files.forEach((file) => {
        uploadData.append('images', file);
      });
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: uploadData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({ title: "Images uploaded successfully!" });
      const fileInput = document.getElementById('imageUploadInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: () => toast({ title: "Error", description: "Failed to upload images", variant: "destructive" })
  });

  const saveAppearanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      toast({ title: "Gallery appearance saved successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save appearance", variant: "destructive" })
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
  const images: GalleryImage[] = (shootData?.images as GalleryImage[]) || [];

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
      <Card className="admin-gradient-card">
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Shoot Not Found</h3>
          <p className="text-muted-foreground">The selected shoot could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }



  const handleSaveBasicInfo = () => {
    if (!editableShoot.title.trim() || !editableShoot.location.trim() || !editableShoot.shootDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    const data = {
      title: editableShoot.title.trim(),
      location: editableShoot.location.trim(),
      shootDate: editableShoot.shootDate,
      description: editableShoot.description.trim(),
      shootType: editableShoot.shootType,
      clientId: editableShoot.clientId,
    };
    saveBasicInfoMutation.mutate(data);
  };

  const handleSaveAdvancedSettings = () => {
    const data = {
      isPrivate: editableShoot.isPrivate,
      notes: editableShoot.notes.trim(),
      seoTags: editableShoot.seoTags.split(',').map(tag => tag.trim()).filter(Boolean),
      customTitle: editableShoot.customTitle.trim() || null,
      customSlug: editableShoot.customSlug.trim() || null,
    };
    saveAdvancedSettingsMutation.mutate(data);
  };

  const handleUploadImages = async () => {
    const fileInput = document.getElementById('imageUploadInput') as HTMLInputElement;
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    
    if (files.length === 0) {
      toast({ title: "Error", description: "Please select images to upload", variant: "destructive" });
      return;
    }

    uploadImagesMutation.mutate(files);
  };

  const handleSaveAppearance = () => {
    const imageSequences = imageOrder.length > 0 
      ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
      : {};

    const data = {
      bannerImageId: selectedCover,
      gallerySettings: gallerySettings,
      imageSequences
    };
    saveAppearanceMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Basic Shoot Information */}
      <BasicInfoSection
        editableShoot={editableShoot}
        setEditableShoot={setEditableShoot}
        clients={clients}
        clientReassignDialogOpen={clientReassignDialogOpen}
        setClientReassignDialogOpen={setClientReassignDialogOpen}
        onSave={handleSaveBasicInfo}
        isSaving={saveBasicInfoMutation.isPending}
        toast={toast}
      />

      {/* Advanced Settings */}
      <AdvancedSettingsSection
        editableShoot={editableShoot}
        setEditableShoot={setEditableShoot}
        onSave={handleSaveAdvancedSettings}
        isSaving={saveAdvancedSettingsMutation.isPending}
      />

      {/* Add Images */}
      <AddImagesSection
        onUpload={handleUploadImages}
        isUploading={uploadImagesMutation.isPending}
        toast={toast}
      />

      {/* Gallery Appearance */}
      <GalleryAppearanceSection
        gallerySettings={gallerySettings}
        setGallerySettings={setGallerySettings}
        selectedCover={selectedCover}
        setSelectedCover={setSelectedCover}
        imageOrder={imageOrder}
        onSave={handleSaveAppearance}
        isSaving={saveAppearanceMutation.isPending}
      />

      {/* Live Preview Card */}
      <Card className="admin-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-salmon flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Gallery Live Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-salmon" />
              <span className="text-sm">URL:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">/gallery/{shoot.customSlug || 'not-set'}</code>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(`/gallery/${shoot.customSlug}`)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
                {getOrderedImages().slice(0, 12).map((image) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden break-inside-avoid mb-2 rounded-lg
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      cursor-pointer
                    `}
                    onClick={() => setAlbumCover(image.id)}
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {getOrderedImages().slice(0, 12).map((image) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden aspect-square rounded-lg
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      cursor-pointer
                    `}
                    onClick={() => setAlbumCover(image.id)}
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
    </div>
  );
}
