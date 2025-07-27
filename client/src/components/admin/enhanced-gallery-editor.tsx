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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ImageUrl } from '@/lib/image-utils';
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
  Plus,
  X,
  Trash2,
  MousePointer
} from 'lucide-react';
import { 
  BasicInfoSection, 
  AdvancedSettingsSection, 
  AddImagesSection, 
  GalleryAppearanceSection 
} from './gallery-sections';
import { GalleryImageCard } from './gallery-image-card';

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
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [removeConfirmationOpen, setRemoveConfirmationOpen] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [visibleImageCount, setVisibleImageCount] = useState(20); // Show 20 images initially (4 rows of 5)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  
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
    onSuccess: (result) => {
      // Invalidate multiple query patterns to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      
      if (result.uploadedCount > 0) {
        toast({ 
          title: "Upload Successful!", 
          description: `${result.uploadedCount} image(s) uploaded successfully` 
        });
      } else {
        toast({ 
          title: "Upload Error", 
          description: "No images were uploaded. Please check the file format.", 
          variant: "destructive" 
        });
      }
      
      const fileInput = document.getElementById('imageUploadInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to upload images. Please try again.", 
        variant: "destructive" 
      });
    }
  });

  const saveAppearanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      toast({ title: "Gallery appearance saved successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save appearance", variant: "destructive" })
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => apiRequest('DELETE', `/api/images/${imageId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      toast({ 
        title: "Image deleted permanently", 
        description: "Removed from database and storage" 
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      toast({ 
        title: "Delete failed", 
        description: errorMessage.includes("not found") 
          ? "Image was already deleted or doesn't exist"
          : `Error: ${errorMessage}`,
        variant: "destructive" 
      });
    }
  });

  const updateImageSequencesMutation = useMutation({
    mutationFn: (imageSequences: Record<string, number>) => 
      apiRequest('PATCH', `/api/shoots/${shootId}`, { imageSequences }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({ title: "Image order updated!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update image order", variant: "destructive" })
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

  const shoot = shootData?.shoot || null;
  const images: GalleryImage[] = (shootData?.images as GalleryImage[]) || [];

  // Initialize settings from shoot data
  useEffect(() => {
    if (shoot && shoot.id && !editableShoot.title) {
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
  }, [shoot?.id]);

  // Initialize image order from sequence
  useEffect(() => {
    if (images.length > 0 && imageOrder.length === 0) {
      const sortedImages = [...images].sort((a, b) => a.sequence - b.sequence);
      setImageOrder(sortedImages.map(img => img.id));
    }
  }, [images.length]);

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

  const handleDeleteImage = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteConfirmationOpen(true);
  };

  const handleViewFullRes = (storagePath: string) => {
    window.open(ImageUrl.forDownload(storagePath), '_blank');
  };

  const confirmDeleteImage = () => {
    if (imageToDelete) {
      deleteImageMutation.mutate(imageToDelete);
      setImageToDelete(null);
      setDeleteConfirmationOpen(false);
    }
  };

  // Remove image from current album by reassigning to SlyFox bin
  const removeImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest(`/api/images/${imageId}`, {
        method: 'PATCH',
        body: { shootId: '676d656f-4c38-4530-97f8-415742188acf' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      toast({ title: "Success", description: "Image moved to SlyFox archive" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove image from album", variant: "destructive" });
    }
  });

  const handleRemoveImage = (imageId: string) => {
    setImageToRemove(imageId);
    setRemoveConfirmationOpen(true);
  };

  const confirmRemoveImage = () => {
    if (imageToRemove) {
      removeImageMutation.mutate(imageToRemove);
      setImageToRemove(null);
      setRemoveConfirmationOpen(false);
    }
  };

  const loadMoreImages = () => {
    setVisibleImageCount(prev => prev + 20); // Load 20 more images (4 more rows)
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

  const handleUploadImages = async (files: File[]) => {
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
        clients={clients as any[]}
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
            <Button 
              onClick={() => {
                const imageSequences = imageOrder.length > 0 
                  ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
                  : {};
                updateImageSequencesMutation.mutate(imageSequences);
              }}
              disabled={updateImageSequencesMutation.isPending}
              className="bg-salmon hover:bg-salmon-muted text-white"
            >
              {updateImageSequencesMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Order
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: gallerySettings.backgroundColor,
              minHeight: '400px'
            }}
          >
            {/* Cover Image Strip */}
            {selectedCover && (
              <div 
                className="relative h-48 w-full bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${ImageUrl.forViewing(getOrderedImages().find(img => img.id === selectedCover)?.storagePath || '')})`,
                  marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px'
                }}
              >
                <h2 className="text-xl font-bold text-white text-center">
                  {shoot.customTitle || shoot.title}
                </h2>
              </div>
            )}
            
            {/* Image Grid */}
            <div className="p-4">
              {!selectedCover && (
                <h2 className="text-xl font-bold text-white mb-4 text-center">
                  {shoot.customTitle || shoot.title}
                </h2>
              )}
            
            {gallerySettings.layoutStyle === 'masonry' ? (
              <div 
                className={`columns-2 md:columns-3 lg:columns-4 space-y-${gallerySettings.imageSpacing === 'tight' ? '1' : gallerySettings.imageSpacing === 'normal' ? '2' : '4'}`}
                style={{ 
                  gap: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                }}
              >
                {getOrderedImages().slice(0, visibleImageCount).map((image, index) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden break-inside-avoid 
                      ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full aspect-square'}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      ${draggedImage === image.id ? 'opacity-50' : ''}
                      cursor-pointer transition-all duration-200
                    `}
                    style={{ 
                      marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                    }}
                    draggable
                    onDragStart={(e) => {
                      setDraggedImage(image.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedImage(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedImage && draggedImage !== image.id) {
                        const newOrder = [...imageOrder];
                        const draggedIndex = newOrder.indexOf(draggedImage);
                        const targetIndex = newOrder.indexOf(image.id);
                        
                        if (draggedIndex !== -1 && targetIndex !== -1) {
                          newOrder.splice(draggedIndex, 1);
                          newOrder.splice(targetIndex, 0, draggedImage);
                          setImageOrder(newOrder);
                        }
                      }
                    }}
                    onMouseDown={(e) => setDragStartTime(Date.now())}
                    onClick={(e) => {
                      const clickDuration = Date.now() - dragStartTime;
                      if (clickDuration < 200) { // Quick click = modal
                        setSelectedImageModal(image.id);
                      }
                    }}
                  >
                    <img
                      src={ImageUrl.forViewing(image.storagePath)}
                      alt={image.filename}
                      className={`w-full object-cover ${gallerySettings.borderStyle === 'circular' ? 'h-full aspect-square' : 'h-auto'}`}

                    />
                    
                    {/* Hover Buttons */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-purple-600 text-white hover:bg-purple-700"
                          title="View Full Resolution"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullRes(image.storagePath);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-salmon text-white hover:bg-salmon-muted"
                          title="Make Cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newCover = selectedCover === image.id ? null : image.id;
                            setSelectedCover(newCover);
                            
                            // Save cover selection immediately to database
                            saveAppearanceMutation.mutate({
                              bannerImageId: newCover,
                              gallerySettings,
                              imageSequences: imageOrder.length > 0 
                                ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
                                : {}
                            });
                          }}
                        >
                          <Crown className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary" 
                          className="bg-yellow-600 text-white hover:bg-yellow-700"
                          title="Remove from Album"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(image.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Delete from Database"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {selectedCover === image.id && (
                      <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="grid grid-cols-4"
                style={{ 
                  gap: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                }}
              >
                {getOrderedImages().slice(0, visibleImageCount).map((image, index) => (
                  <div 
                    key={image.id}
                    className={`
                      relative group overflow-hidden aspect-square
                      ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full'}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      ${draggedImage === image.id ? 'opacity-50' : ''}
                      cursor-pointer transition-all duration-200
                    `}
                    draggable
                    onDragStart={(e) => {
                      setDraggedImage(image.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedImage(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedImage && draggedImage !== image.id) {
                        const newOrder = [...imageOrder];
                        const draggedIndex = newOrder.indexOf(draggedImage);
                        const targetIndex = newOrder.indexOf(image.id);
                        
                        if (draggedIndex !== -1 && targetIndex !== -1) {
                          newOrder.splice(draggedIndex, 1);
                          newOrder.splice(targetIndex, 0, draggedImage);
                          setImageOrder(newOrder);
                        }
                      }
                      setDraggedImage(null);
                    }}
                    onMouseDown={(e) => setDragStartTime(Date.now())}
                    onClick={(e) => {
                      const clickDuration = Date.now() - dragStartTime;
                      if (clickDuration < 200) { // Quick click = modal
                        setSelectedImageModal(image.id);
                      }
                    }}
                  >
                    <img
                      src={ImageUrl.forViewing(image.storagePath)}
                      alt={image.filename}
                      className="w-full h-full object-cover"

                    />
                    
                    {/* Hover Buttons */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-purple-600 text-white hover:bg-purple-700"
                          title="View Full Resolution"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullRes(image.storagePath);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-salmon text-white hover:bg-salmon-muted"
                          title="Make Cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newCover = selectedCover === image.id ? null : image.id;
                            setSelectedCover(newCover);
                            
                            // Save cover selection immediately to database
                            saveAppearanceMutation.mutate({
                              bannerImageId: newCover,
                              gallerySettings,
                              imageSequences: imageOrder.length > 0 
                                ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
                                : {}
                            });
                          }}
                        >
                          <Crown className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary" 
                          className="bg-yellow-600 text-white hover:bg-yellow-700"
                          title="Remove from Album"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(image.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Delete from Database"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {selectedCover === image.id && (
                      <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {images.length > visibleImageCount && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMoreImages}
                  className="px-8 py-2"
                >
                  Load More Images ({Math.min(20, images.length - visibleImageCount)} more)
                </Button>
              </div>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImageModal && (
        <Dialog open={!!selectedImageModal} onOpenChange={() => setSelectedImageModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>Gallery-optimized image preview</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <img
                src={ImageUrl.forViewing(getOrderedImages().find(img => img.id === selectedImageModal)?.storagePath || '')}
                alt="Gallery preview"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setSelectedImageModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeConfirmationOpen} onOpenChange={setRemoveConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Image from Album</AlertDialogTitle>
            <AlertDialogDescription>
              This image will be removed from the current album and moved to the SlyFox archive. The image will remain in the database and can be reassigned to other albums later. This action does not permanently delete the image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveConfirmationOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveImage}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Remove from Album
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image from the database and remove it from Supabase storage. The image will be completely removed from all galleries and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmationOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
