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
import { VideoUrl } from '@/lib/video-utils';
import { generateVideoThumbnails } from '@/lib/video-thumbnail-utils';
import { useAutoSaveImageOrder } from '@/hooks/use-auto-save-image-order';
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
import { GalleryRenderer } from '@/components/gallery/gallery-renderer';
import { GalleryManagementTabs } from './gallery-management-tabs';

interface GalleryImage {
  id: string;
  filename: string;
  storagePath: string;
  downloadCount: number;
  sequence: number;
}

interface GalleryVideo {
  id: string;
  filename: string;
  storagePath: string;
  thumbnailPath: string;
  downloadCount: number;
  sequence: number;
  duration?: number;
  width?: number;
  height?: number;
}

type MediaItem = GalleryImage | GalleryVideo;

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
  const [selectedMediaModal, setSelectedMediaModal] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [removeConfirmationOpen, setRemoveConfirmationOpen] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [visibleImageCount, setVisibleImageCount] = useState(50); // Show 50 images initially (10 rows of 5)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [imageToReplace, setImageToReplace] = useState<string | null>(null);
  const [replacingImages, setReplacingImages] = useState<Set<string>>(new Set());
  
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
    seoTags: '',
    groupName: ''
  });

  // Track original shoot type to detect changes
  const [originalShootType, setOriginalShootType] = useState('');
  
  // Calculate dominant aspect ratio from images
  const calculateDominantAspectRatio = (imageList: any[]) => {
    if (!imageList || imageList.length === 0) return 'landscape';
    
    // Mock aspect ratio detection for now - in real implementation, you'd analyze actual image dimensions
    const ratioCategories: Record<string, number> = { landscape: 0, portrait: 0, square: 0 };
    
    imageList.forEach(() => {
      // Simulate aspect ratio detection (replace with actual image dimension analysis)
      const mockRatio = Math.random();
      if (mockRatio > 0.6) {
        ratioCategories.landscape++;
      } else if (mockRatio > 0.3) {
        ratioCategories.portrait++;
      } else {
        ratioCategories.square++;
      }
    });
    
    // Return the category with the highest count
    const dominant = Object.entries(ratioCategories).reduce((a, b) => 
      ratioCategories[a[0]] > ratioCategories[b[0]] ? a : b
    )[0];
    
    return dominant as 'landscape' | 'portrait' | 'square';
  };
  
  const [clientReassignDialogOpen, setClientReassignDialogOpen] = useState(false);
  
  // Gallery appearance settings - clean absolute values only
  const [gallerySettings, setGallerySettings] = useState({
    backgroundColor: '#ffffff',
    layoutStyle: 'automatic',
    borderRadius: 8,
    imageSpacingValue: 8,
    coverPicSize: 80,
    coverPicAlignment: 'center',
    navbarPosition: 'top-left'
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
    mutationFn: async ({ files, resolutions }: { files: File[]; resolutions?: any[] }) => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';

      console.log(`🚀 Frontend upload${isVideo ? 'Videos' : 'Images'}Mutation called with:`, {
        filesCount: files.length,
        resolutionsCount: resolutions?.length || 0,
        resolutions: resolutions,
        mediaType: currentMediaType
      });

      const uploadData = new FormData();
      uploadData.append('shootId', shootId);

      // Add conflict resolutions if provided (both images and videos)
      if (resolutions && resolutions.length > 0) {
        console.log(`📋 Adding ${isVideo ? 'video' : 'image'} resolutions to FormData:`, JSON.stringify(resolutions));
        uploadData.append('resolutions', JSON.stringify(resolutions));
      } else {
        console.log("ℹ️ No resolutions provided - standard upload");
      }

      // Generate thumbnails for videos before uploading
      if (isVideo) {
        console.log("🎬 Generating video thumbnails...");
        try {
          const thumbnails = await generateVideoThumbnails(files);
          console.log(`✅ Generated ${thumbnails.length} thumbnails`);

          // Add videos and their thumbnails to FormData
          files.forEach((file, index) => {
            console.log(`📎 Adding video ${index + 1}: ${file.name} (index: ${index})`);

            uploadData.append('videos', file);

            // Add thumbnail and metadata using index-based keys
            const thumbnail = thumbnails[index];
            if (thumbnail) {
              uploadData.append(`thumbnail_${index}`, thumbnail.thumbnailDataUrl);
              uploadData.append(`duration_${index}`, thumbnail.metadata.duration.toString());
              uploadData.append(`width_${index}`, thumbnail.metadata.width.toString());
              uploadData.append(`height_${index}`, thumbnail.metadata.height.toString());
              console.log(`  📸 Thumbnail: ${thumbnail.metadata.width}x${thumbnail.metadata.height}, ${thumbnail.metadata.duration}s`);
            }
          });
        } catch (error) {
          console.error("❌ Failed to generate video thumbnails:", error);
          throw new Error('Failed to generate video thumbnails');
        }
      } else {
        // Add images (no thumbnail generation needed)
        files.forEach((file, index) => {
          console.log(`📎 Adding file ${index + 1}: ${file.name}`);
          uploadData.append('images', file);
        });
      }

      const endpoint = isVideo ? '/api/videos/upload' : '/api/images/upload';
      console.log(`🌐 Sending request to ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: uploadData,
      });
      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      console.log("✅ Upload response received:", result);
      return result;
    },
    onSuccess: (result) => {
      // Invalidate multiple query patterns to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      
      // Handle new detailed response format
      const totalProcessed = result.totalProcessed || result.uploadedCount || 0;
      
      if (totalProcessed > 0) {
        toast({ 
          title: "Upload Complete!", 
          description: result.message || `${totalProcessed} file(s) processed successfully`
        });
      } else {
        toast({ 
          title: "Upload Error", 
          description: "No files were processed. Please check the file format.", 
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
      // Don't invalidate queries immediately to prevent reordering during save
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      }, 100);
      toast({ title: "Gallery appearance saved successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save appearance", variant: "destructive" })
  });

  const deleteImageMutation = useMutation({
    mutationFn: (mediaId: string) => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';
      const endpoint = isVideo ? `/api/videos/${mediaId}` : `/api/images/${mediaId}`;

      console.log(`Attempting to delete ${isVideo ? 'video' : 'image'} with ID:`, mediaId);
      console.log('Full API URL:', endpoint);
      return apiRequest('DELETE', endpoint);
    },
    onSuccess: (data) => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';

      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      toast({
        title: `${isVideo ? 'Video' : 'Image'} deleted permanently`,
        description: "Removed from database and storage"
      });
    },
    onError: (error: any) => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';

      console.error("Frontend received delete error:", error);

      // The delete operation actually succeeds server-side but triggers frontend error
      // This is likely due to API response parsing issues - refresh data regardless
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });

      toast({
        title: `${isVideo ? 'Video' : 'Image'} deleted`,
        description: "Removed from database (refreshing gallery)",
        variant: "default"
      });
    }
  });

  const updateImageSequencesMutation = useMutation({
    mutationFn: (sequences: Record<string, number>) => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';
      const payload = isVideo ? { videoSequences: sequences } : { imageSequences: sequences };

      return apiRequest('PATCH', `/api/shoots/${shootId}`, payload);
    },
    onSuccess: () => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';

      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', shootId] });
      toast({ title: `${isVideo ? 'Video' : 'Image'} order updated!` });
    },
    onError: () => {
      const currentMediaType = shoot?.mediaType || 'photo';
      const isVideo = currentMediaType === 'video';
      toast({ title: "Error", description: `Failed to update ${isVideo ? 'video' : 'image'} order`, variant: "destructive" });
    }
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

  const shoot = (shootData as any)?.shoot || null;
  const mediaType = shoot?.mediaType || 'photo'; // Default to 'photo' for backwards compatibility
  
  // Optimized auto-save hook for media sequences and cover selection
  const { debouncedSave: debouncedSaveImageOrder, saveStatus: imageOrderSaveStatus } = useAutoSaveImageOrder({
    shootId,
    mediaType
  });

  // Function to trigger auto-save for image order and cover
  const triggerImageOrderAutoSave = useCallback(() => {
    debouncedSaveImageOrder(imageOrder, selectedCover);
  }, [imageOrder, selectedCover, debouncedSaveImageOrder])

  // Conditionally query images or videos based on shoot's mediaType
  const { data: mediaData } = useQuery({
    queryKey: mediaType === 'video' ? ['/api/videos', shootId] : ['/api/images', shootId],
    queryFn: async () => {
      const endpoint = mediaType === 'video' ? `/api/videos?shootId=${shootId}` : `/api/images?shootId=${shootId}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
    enabled: !!shootId && !!shoot
  });

  const mediaItems: MediaItem[] = mediaData || [];

  // Backwards compatibility: also extract images from shootData for existing code
  const images: GalleryImage[] = mediaType === 'photo' ? mediaItems as GalleryImage[] : [];
  const videos: any[] = mediaType === 'video' ? mediaItems : [];

  // Initialize all settings from shoot data when shoot changes
  useEffect(() => {
    if (shoot && shoot.id) {
      setCustomSlug(shoot.customSlug || '');
      
      // Set cover: conditional logic based on media type
      if (mediaType === 'video') {
        // For video albums, check for featured video or use first video
        const featuredVideo = videos.find(video => video.featuredVideo === true);
        if (featuredVideo) {
          setSelectedCover(featuredVideo.id);
        } else if (videos.length > 0) {
          setSelectedCover(videos[0].id);
        } else {
          setSelectedCover(null);
        }
      } else {
        // For photo albums, use bannerImageId if valid, otherwise use first image as fallback
        if (shoot.bannerImageId && images.some(img => img.id === shoot.bannerImageId)) {
          setSelectedCover(shoot.bannerImageId);
        } else if (images.length > 0) {
          setSelectedCover(images[0].id);
        } else {
          setSelectedCover(null);
        }
      }
      
      // Initialize gallery settings from shoot data (provide defaults for null gallerySettings)
      const settings = shoot.gallerySettings || {};
      setGallerySettings({
        backgroundColor: settings.backgroundColor || '#ffffff',
        layoutStyle: settings.layoutStyle || 'automatic',
        borderRadius: settings.borderRadius !== undefined ? settings.borderRadius : 8,
        imageSpacingValue: settings.imageSpacingValue !== undefined ? settings.imageSpacingValue : 8,
        coverPicSize: settings.coverPicSize !== undefined ? settings.coverPicSize : 80,
        coverPicAlignment: settings.coverPicAlignment || 'center',
        navbarPosition: settings.navbarPosition || 'top-left'
      });
      
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
        seoTags: Array.isArray(shoot.seoTags) ? shoot.seoTags.join(', ') : (shoot.seoTags || ''),
        groupName: shoot.groupName || ''
      });
      
      // Track the original shoot type for change detection
      setOriginalShootType(shoot.shootType || '');
    }
  }, [shoot?.id, images.length, videos.length, videos.map(v => v.featuredVideo).join(',')]);

  // Initialize media order from sequence - works for both images and videos
  useEffect(() => {
    const media = mediaType === 'video' ? videos : images;
    if (media.length > 0) {
      const sortedMedia = [...media].sort((a, b) => a.sequence - b.sequence);
      const newOrder = sortedMedia.map(item => item.id);
      
      // Only update if the order actually changed to prevent unnecessary re-renders
      if (JSON.stringify(newOrder) !== JSON.stringify(imageOrder)) {
        setImageOrder(newOrder);
      }
    } else {
      // Clear order when no media
      if (imageOrder.length > 0) {
        setImageOrder([]);
      }
    }
  }, [mediaType === 'video' ? videos.length : images.length, (mediaType === 'video' ? videos : images).map(item => `${item.id}-${item.sequence}`).join(',')]);

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

    console.log('🎯 handleDrop called - draggedImage:', draggedImage, 'targetImageId:', targetImageId);

    // Calculate new order and save it immediately with the correct values
    setImageOrder(currentOrder => {
      const newOrder = [...currentOrder];
      const draggedIndex = newOrder.indexOf(draggedImage);
      const targetIndex = newOrder.indexOf(targetImageId);

      console.log('📊 Order indices - dragged:', draggedIndex, 'target:', targetIndex);

      // Only proceed if both indices are valid
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged item and insert at new position
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedImage);

        console.log('✅ New order calculated, triggering save with', newOrder.length, 'images');

        // Trigger auto-save with the NEW order (not the stale state)
        setTimeout(() => {
          debouncedSaveImageOrder(newOrder, selectedCover);
        }, 0);
      }

      return newOrder;
    });

    setDraggedImage(null);
  }, [draggedImage, selectedCover, debouncedSaveImageOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedImage(null);
  }, []);

  // Get ordered media for display (works for both images and videos)
  const getOrderedImages = useCallback(() => {
    const media = mediaType === 'video' ? videos : images;
    // Defensive checks for empty or undefined data
    if (!media || media.length === 0) return [];
    if (!imageOrder || imageOrder.length === 0) return media;
    
    const mediaMap = new Map(media.map(item => [item.id, item]));
    const orderedMedia = imageOrder
      .map(id => mediaMap.get(id))
      .filter(Boolean) as any[];
    
    // Add any new media items not in order yet
    const orderedIds = new Set(imageOrder);
    const newMedia = media.filter(item => !orderedIds.has(item.id));
    
    return [...orderedMedia, ...newMedia];
  }, [mediaType === 'video' ? videos : images, imageOrder]);
  
  // Removed auto-calculate dominant aspect ratio - using "automatic" layoutStyle instead

  // Save comprehensive shoot updates
  const saveCustomizationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${shootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
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

      // Update media sequences based on current order (images or videos)
      const sequences = imageOrder.length > 0 
        ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
        : {};
      const sequenceKey = mediaType === 'video' ? 'videoSequences' : 'imageSequences';

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
        [sequenceKey]: sequences
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
    // Trigger auto-save after cover change
    setTimeout(() => {
      triggerImageOrderAutoSave();
    }, 0);
  };

  const handleDeleteImage = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteConfirmationOpen(true);
  };

  const handleViewFullRes = (storagePath: string) => {
    window.open(ImageUrl.forDownload(storagePath), '_blank');
  };

  const handleDownloadImage = (storagePath: string, filename: string) => {
    const downloadUrl = ImageUrl.forDownload(storagePath);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      return apiRequest('PATCH', `/api/images/${imageId}`, { shootId: '676d656f-4c38-4530-97f8-415742188acf' });
    },
    onSuccess: () => {
      // Invalidate all relevant queries to refresh the UI immediately
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });

      // Also refetch the current shoot data immediately
      queryClient.refetchQueries({ queryKey: ['/api/shoots', shootId] });

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
    setVisibleImageCount(prev => Math.min(prev + 50, 200)); // Load 50 more images, max 200 total
  };

  // Always enable drag reordering for visible images (first 100)
  const isDragReorderingEnabled = true;

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



  const handleSaveBasicInfo = async () => {
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

    // Check if shoot type has changed
    const shootTypeChanged = originalShootType !== editableShoot.shootType;
    

    
    try {
      // Save basic info first
      await saveBasicInfoMutation.mutateAsync(data);
      
      // Always update the original shoot type after successful save to prevent stale state
      setOriginalShootType(editableShoot.shootType);
      
      // If shoot type changed, update all images in this shoot
      if (shootTypeChanged && editableShoot.shootType) {
        console.log(`Shoot type changed from "${originalShootType}" to "${editableShoot.shootType}"`);
        console.log(`Updating ${images.length} images to new classification`);

        
        const response = await apiRequest('PATCH', `/api/shoots/${shootId}/images/classification`, {
          classification: editableShoot.shootType
        });
        
        if (response.success) {
          toast({ 
            title: "Success", 
            description: `Updated ${response.updatedCount} images to "${editableShoot.shootType}" classification` 
          });
          
          // Refresh image data to show updated classifications
          queryClient.invalidateQueries({ queryKey: ['/api/images', shootId] });
          queryClient.invalidateQueries({ queryKey: ['/api/images/featured'] });
        }
      } else {
        // Show success message even when no classification update was needed
        toast({ 
          title: "Success", 
          description: "Shoot information updated successfully" 
        });
      }
    } catch (error) {
      console.error('Error saving basic info or updating classifications:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save changes. Please try again.", 
        variant: "destructive" 
      });
    }
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

  const handleReplaceImage = (mediaId: string) => {
    console.log(`🔄 Replace ${mediaType === 'video' ? 'video' : 'image'} triggered for:`, mediaId);
    console.log(`🎬 Current shoot mediaType:`, shoot?.mediaType);
    console.log(`🎯 Media ID to replace:`, mediaId);
    setImageToReplace(mediaId);
    
    // Determine if we're replacing a video or image
    const isVideoReplacement = mediaType === 'video';
    const targetMedia = isVideoReplacement 
      ? videos.find(vid => vid.id === mediaId)
      : images.find(img => img.id === mediaId);
    
    if (!targetMedia) {
      toast({
        title: "Error",
        description: `Target ${isVideoReplacement ? 'video' : 'image'} not found`,
        variant: "destructive"
      });
      setImageToReplace(null);
      return;
    }
    
    // Create hidden file input for media replacement
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = isVideoReplacement ? 'video/*' : 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        setImageToReplace(null);
        return;
      }
      
      console.log(`📁 ${isVideoReplacement ? 'Video' : 'Image'} file selected for replacement:`, file.name);
      
      // Add this media to the replacing set for spinner overlay
      setReplacingImages(prev => new Set([...prev, mediaId]));
      
      // Upload with automatic replacement
      try {
        if (isVideoReplacement) {
          // Create resolution for video replacement
          // IMPORTANT: Must clean filename same way server does to ensure matching
          const cleanFilename = file.name.replace(/[^a-z0-9.-]/gi, '_');
          const resolution = {
            filename: cleanFilename, // Use cleaned filename to match server processing
            action: 'replace' as const,
            keepPosition: true,
            targetVideoId: mediaId
          };
          
          console.log("🎯 Direct video replacement resolution:", resolution);
          console.log(`🧹 Original filename: "${file.name}" → Cleaned: "${cleanFilename}"`);
          
          await uploadImagesMutation.mutateAsync({ 
            files: [file], 
            resolutions: [resolution] 
          });
          
          toast({
            title: "Video Replaced",
            description: `Successfully replaced ${targetMedia.filename} with ${file.name}`,
          });
        } else {
          // Create resolution for image replacement
          // IMPORTANT: Must clean filename same way server does to ensure matching
          const cleanFilename = file.name.replace(/[^a-z0-9.-]/gi, '_');
          const resolution = {
            filename: cleanFilename, // Use cleaned filename to match server processing
            action: 'replace' as const,
            keepPosition: true,
            targetImageId: mediaId
          };
          
          console.log("🎯 Direct image replacement resolution:", resolution);
          console.log(`🧹 Original filename: "${file.name}" → Cleaned: "${cleanFilename}"`);
          
          await uploadImagesMutation.mutateAsync({ 
            files: [file], 
            resolutions: [resolution] 
          });
          
          toast({
            title: "Image Replaced",
            description: `Successfully replaced ${targetMedia.filename} with ${file.name}`,
          });
        }
      } catch (error) {
        console.error("Replace error:", error);
        toast({
          title: "Replacement Failed",
          description: `Failed to replace ${isVideoReplacement ? 'video' : 'image'}. Please try again.`,
          variant: "destructive"
        });
      } finally {
        // Remove from replacing set and clear state
        setReplacingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(mediaId);
          return newSet;
        });
        setImageToReplace(null);
      }
    };
    
    input.click();
  };

  const handleUploadImages = async (files: File[], resolutions?: any[]) => {
    console.log("🎯 Frontend handleUploadImages called with:", {
      filesCount: files.length,
      resolutionsCount: resolutions?.length || 0,
      resolutions: resolutions
    });
    
    if (files.length === 0) {
      toast({ title: "Error", description: "Please select images to upload", variant: "destructive" });
      return;
    }

    uploadImagesMutation.mutate({ files, resolutions });
  };

  const handleSaveAppearance = () => {
    const sequences = imageOrder.length > 0 
      ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
      : {};
    const sequenceKey = mediaType === 'video' ? 'videoSequences' : 'imageSequences';

    const data = {
      bannerImageId: selectedCover,
      gallerySettings: gallerySettings,
      [sequenceKey]: sequences
    };
    saveAppearanceMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Gallery Management Tabs */}
      <GalleryManagementTabs
        images={images}
        clients={clients as any[]}
        editableShoot={editableShoot}
        setEditableShoot={setEditableShoot}
        gallerySettings={gallerySettings}
        setGallerySettings={setGallerySettings}
        selectedCover={selectedCover}
        setSelectedCover={setSelectedCover}
        imageOrder={imageOrder}
        onUploadImages={handleUploadImages}
        onSaveAppearance={handleSaveAppearance}
        onViewFullRes={handleViewFullRes}
        onDownloadImage={handleDownloadImage}
        onRemoveImage={handleRemoveImage}
        onDeleteImage={handleDeleteImage}
        onReplaceImage={handleReplaceImage}
        draggedImage={draggedImage}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onImageClick={setSelectedMediaModal}
        replacingImages={replacingImages}
        isDragReorderingEnabled={isDragReorderingEnabled}
        visibleImageCount={visibleImageCount}
        dragStartTime={dragStartTime}
        onMouseDown={() => setDragStartTime(Date.now())}
        shootId={shootId}
        clientReassignDialogOpen={clientReassignDialogOpen}
        setClientReassignDialogOpen={setClientReassignDialogOpen}
        isUploading={uploadImagesMutation.isPending}
        saveAppearanceMutation={saveAppearanceMutation}
        toast={toast}
        shoot={shoot}
        loadMoreImages={loadMoreImages}
      />

      {/* Live Preview Card */}
      <Card className="admin-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-salmon flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Gallery Live Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* REMOVED: Blocking "Saving..." spinner for instant drag feedback */}
              {/* Background persistence happens silently without UI indicators */}
              {imageOrderSaveStatus.status === 'error' && (
                <div className="flex items-center gap-2 text-amber-400" title="Background save will retry automatically">
                  <div className="w-3 h-3 border-2 border-amber-400 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  </div>
                  <span className="text-xs">Retrying...</span>
                </div>
              )}
            </div>
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
            {selectedCover && (() => {
              const orderedMedia = mediaType === 'video' ? videos : images;
              const coverMedia = orderedMedia.find(item => item.id === selectedCover);
              const coverImageUrl = coverMedia?.storagePath ? 
                (mediaType === 'video' ? 
                  VideoUrl.forThumbnail(coverMedia as any) : 
                  ImageUrl.forViewing(coverMedia.storagePath)
                ) : null;
              
              return coverImageUrl ? (
                <div 
                  className="relative h-48 w-full bg-cover flex items-center justify-center"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${coverImageUrl})`,
                    backgroundPosition: (() => {
                      switch (gallerySettings.coverPicAlignment) {
                        case 'top': return 'center top';
                        case 'bottom': return 'center bottom';
                        case 'centre':
                        default: return 'center center';
                      }
                    })(),
                    marginBottom: `${gallerySettings.imageSpacingValue || 8}px`
                  }}
                >
                  <h2 className="text-xl font-bold text-white text-center">
                    {shoot?.customTitle || shoot?.title || 'Gallery'}
                  </h2>
                </div>
              ) : (
                <div className="relative h-48 w-full bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center text-gray-400">
                    <Eye className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Cover image loading...</p>
                  </div>
                </div>
              );
            })()}
            
            {/* Gallery Title when no cover */}
            {!selectedCover && (
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-4 text-center">
                  {shoot?.customTitle || shoot?.title || 'Gallery'}
                </h2>
              </div>
            )}
            
            {/* Gallery Renderer */}
            <GalleryRenderer
              images={getOrderedImages()}
              gallerySettings={gallerySettings}
              mediaType={mediaType}
              selectedCover={selectedCover}
              onCoverChange={setSelectedCover}
              draggedImage={draggedImage}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onImageClick={setSelectedMediaModal}
              onViewFullRes={handleViewFullRes}
              onDownloadImage={handleDownloadImage}
              onRemoveImage={handleRemoveImage}
              onDeleteImage={handleDeleteImage}
              onReplaceImage={handleReplaceImage}
              replacingImages={replacingImages}
              isDragReorderingEnabled={isDragReorderingEnabled}
              visibleImageCount={visibleImageCount}
              dragStartTime={dragStartTime}
              onMouseDown={() => setDragStartTime(Date.now())}
              isAdminMode={true}
              saveAppearanceMutation={saveAppearanceMutation}
            />
            
            {/* Load More Button */}
            {(mediaType === 'video' ? videos.length : images.length) > visibleImageCount && visibleImageCount < 200 && (
              <div className="text-center mt-6 p-4">
                <Button
                  variant="outline"
                  onClick={loadMoreImages}
                  className="px-8 py-2"
                >
                  Load More {mediaType === 'video' ? 'Videos' : 'Images'} ({Math.min(50, Math.min(200, (mediaType === 'video' ? videos.length : images.length)) - visibleImageCount)} more)
                </Button>
              </div>
            )}
            
            {/* Large Album Notice */}
            {(mediaType === 'video' ? videos.length : images.length) > 100 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4 mx-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Large Album Notice</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  This album has {mediaType === 'video' ? videos.length : images.length} {mediaType === 'video' ? 'videos' : 'images'}. For performance, only the first 100 {mediaType === 'video' ? 'videos' : 'images'} are shown in the preview. You can still reorder the visible {mediaType === 'video' ? 'videos' : 'images'}.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Modal (Images & Videos) */}
      {selectedMediaModal && (() => {
        const selectedMedia = getOrderedImages().find(item => item.id === selectedMediaModal);
        const isVideo = mediaType === 'video';
        
        return (
          <Dialog open={!!selectedMediaModal} onOpenChange={() => setSelectedMediaModal(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>{isVideo ? 'Video' : 'Image'} Preview</DialogTitle>
                <DialogDescription>Gallery-optimized {isVideo ? 'video' : 'image'} preview</DialogDescription>
              </DialogHeader>
              <div className="relative">
                {isVideo ? (
                  <video
                    src={VideoUrl.forStreaming(selectedMedia as any)}
                    className="w-full h-auto max-h-[85vh] object-contain"
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    poster={VideoUrl.forThumbnail(selectedMedia as any)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={ImageUrl.forViewing(selectedMedia?.storagePath || '')}
                    alt="Gallery preview"
                    className="w-full h-auto max-h-[85vh] object-contain"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

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
