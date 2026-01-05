import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SHOOT_TYPES } from '@shared/schema';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabaseOperations } from '@/lib/supabase-operations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GallerySettingsCard } from '@/components/gallery/gallery-settings-card';
import { useAutoSaveGallerySettings } from '@/hooks/use-debounced-auto-save';
import { useAutoSave } from '@/hooks/use-auto-save';
import { ConflictResolutionDialog } from '@/components/admin/conflict-resolution-dialog';
import { VideoConflictResolutionDialog } from '@/components/admin/video-conflict-resolution-dialog';
import type { ConflictInfo, ConflictResolution, VideoConflictInfo, VideoConflictResolution } from '@shared/schema';
import { 
  Camera, 
  Settings, 
  Upload, 
  Palette, 
  Save, 
  User, 
  Edit, 
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface BasicInfoSectionProps {
  editableShoot: any;
  setEditableShoot: (fn: (prev: any) => any) => void;
  clients: any[];
  clientReassignDialogOpen: boolean;
  setClientReassignDialogOpen: (open: boolean) => void;
  shootId: string;
  toast: any;
  images: any[];
}

export function BasicInfoSection({ 
  editableShoot, 
  setEditableShoot, 
  clients, 
  clientReassignDialogOpen, 
  setClientReassignDialogOpen, 
  shootId,
  toast,
  images 
}: BasicInfoSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  const { debouncedSave, saveImmediately, saveStatus, isSaving } = useAutoSave({
    shootId,
    successMessage: "Basic shoot information saved successfully!",
    errorMessage: "Failed to save basic information"
  });

  const queryClient = useQueryClient();

  // Classification update mutation
  const classificationMutation = useMutation({
    mutationFn: async (classification: string) => {
      // Get all images for this shoot and update their classification
      const shootImages = await supabaseOperations.images.getByShoot(shootId);
      const imageIds = shootImages.map(img => img.id);
      
      if (imageIds.length > 0) {
        await supabaseOperations.images.updateClassification(imageIds, classification);
      }
      
      return { success: true, updatedCount: imageIds.length, message: `Updated ${imageIds.length} images to "${classification}" classification` };
    },
    onSuccess: (response) => {
      toast({
        title: "Success", 
        description: response.message || "Classification updated successfully",
        duration: 2000
      });
      // Refresh image data
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ queryKey: ['shoots', shootId] });
    },
    onError: (error: any) => {
      toast({
        title: "Classification Update Failed",
        description: error.message || "Failed to update image classifications",
        variant: "destructive"
      });
    }
  });

  // Debounced classification update (1000ms)
  const debouncedUpdateClassification = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (classification: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (images.length > 0) {
          classificationMutation.mutate(classification);
        }
      }, 1000);
    };
  }, [classificationMutation, images.length]);

  // Enhanced setEditableShoot that triggers auto-save
  const setEditableShootWithAutoSave = React.useCallback((updateFn: (prev: any) => any, immediate = false) => {
    setEditableShoot((prev) => {
      const newShoot = updateFn(prev);
      
      // Prepare data for API
      const data = {
        title: newShoot.title?.trim(),
        location: newShoot.location?.trim(),
        shootDate: newShoot.shootDate,
        description: newShoot.description?.trim(),
        customTitle: newShoot.customTitle?.trim(),
        customSlug: newShoot.customSlug?.trim(),
        clientId: newShoot.clientId,
        shootType: newShoot.shootType,
        isPrivate: newShoot.isPrivate,
        notes: newShoot.notes?.trim(),
        seoTags: newShoot.seoTags?.trim(),
        groupName: newShoot.groupName?.trim() || null
      };
      
      // Check if shootType changed for classification update
      const shootTypeChanged = prev.shootType !== newShoot.shootType;
      
      // Trigger auto-save
      if (immediate) {
        saveImmediately(data);
      } else {
        debouncedSave(data);
      }
      
      // Trigger classification update if shootType changed
      if (shootTypeChanged && newShoot.shootType && images.length > 0) {
        const classification = newShoot.shootType.toLowerCase();
        debouncedUpdateClassification(classification);
      }
      
      return newShoot;
    });
  }, [setEditableShoot, debouncedSave, saveImmediately, images.length, debouncedUpdateClassification]);

  // Save status indicator component
  const SaveStatusIndicator = () => {
    switch (saveStatus.status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-4 h-4" />
            <span className="text-sm">Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="admin-gradient-card">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-salmon flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Gallery Basic Info
          </CardTitle>
          <div className="flex items-center gap-3">
            {isExpanded && <SaveStatusIndicator />}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-salmon" />
            ) : (
              <ChevronDown className="w-5 h-5 text-salmon" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shootTitle">Shoot Title *</Label>
              <Input
                id="shootTitle"
                value={editableShoot.title}
                onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, title: e.target.value}))}
                placeholder="Sarah & Michael's Wedding"
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="shootLocation">Location *</Label>
              <Input
                id="shootLocation"
                value={editableShoot.location}
                onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, location: e.target.value}))}
                placeholder="Durban Waterfront"
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="shootDate">Shoot Date *</Label>
              <div 
                className="relative bg-background border border-input rounded-md cursor-pointer hover:border-salmon transition-colors"
                onClick={() => {
                  const input = document.getElementById('shootDate') as HTMLInputElement;
                  input?.focus();
                  // Safely call showPicker - may fail in iframe environments
                  try {
                    input?.showPicker?.();
                  } catch (error) {
                    // Silently ignore cross-origin restrictions - input focus still works
                  }
                }}
              >
                <Input
                  id="shootDate"
                  type="date"
                  value={editableShoot.shootDate}
                  onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, shootDate: e.target.value}))}
                  className="bg-transparent border-0 cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-salmon pointer-events-none" />
              </div>
            </div>
          <div>
            <Label htmlFor="shootType">Shoot Type *</Label>
            <Select 
              value={editableShoot.shootType} 
              onValueChange={(value) => setEditableShootWithAutoSave(prev => ({...prev, shootType: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shoot type" />
              </SelectTrigger>
              <SelectContent>
                {SHOOT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Portfolio Group Management */}
          <PortfolioGroupSection 
            editableShoot={editableShoot}
            setEditableShootWithAutoSave={setEditableShootWithAutoSave}
          />
        </div>
        
        <div>
          <Label htmlFor="shootDescription">Description</Label>
          <Textarea
            id="shootDescription"
            value={editableShoot.description}
            onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, description: e.target.value}))}
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
                    <Select onValueChange={(value) => setEditableShootWithAutoSave(prev => ({...prev, clientId: value}))}>
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
        </CardContent>
      )}
    </Card>
  );
}

interface AdvancedSettingsSectionProps {
  editableShoot: any;
  setEditableShoot: (fn: (prev: any) => any) => void;
  shootId: string;
  toast: any;
}

export function AdvancedSettingsSection({ editableShoot, setEditableShoot, shootId, toast }: AdvancedSettingsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  const { debouncedSave, saveImmediately, saveStatus, isSaving } = useAutoSave({
    shootId,
    successMessage: "Advanced settings saved successfully!",
    errorMessage: "Failed to save advanced settings"
  });

  // Enhanced setEditableShoot that triggers auto-save
  const setEditableShootWithAutoSave = React.useCallback((updateFn: (prev: any) => any, immediate = false) => {
    setEditableShoot((prev) => {
      const newShoot = updateFn(prev);
      
      // Prepare data for API
      const data = {
        customTitle: newShoot.customTitle?.trim(),
        customSlug: newShoot.customSlug?.trim(),
        seoTags: newShoot.seoTags?.trim(),
        isPrivate: newShoot.isPrivate,
        notes: newShoot.notes?.trim()
      };
      
      // Trigger auto-save
      if (immediate) {
        saveImmediately(data);
      } else {
        debouncedSave(data);
      }
      
      return newShoot;
    });
  }, [setEditableShoot, debouncedSave, saveImmediately]);

  // Save status indicator component
  const SaveStatusIndicator = () => {
    switch (saveStatus.status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-4 h-4" />
            <span className="text-sm">Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="admin-gradient-card">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-salmon flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gallery Advanced Settings
          </CardTitle>
          <div className="flex items-center gap-3">
            {isExpanded && <SaveStatusIndicator />}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-salmon" />
            ) : (
              <ChevronDown className="w-5 h-5 text-salmon" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customTitle">Custom Gallery Title</Label>
              <Input
                id="customTitle"
                value={editableShoot.customTitle}
                onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, customTitle: e.target.value}))}
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
                onChange={(e) => {
                  const slugValue = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
                  setEditableShootWithAutoSave(prev => ({...prev, customSlug: slugValue}));
                }}
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
            onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, seoTags: e.target.value}))}
            placeholder="wedding photography, durban, romantic, outdoor"
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
            onCheckedChange={(checked) => setEditableShootWithAutoSave(prev => ({...prev, isPrivate: checked}))}
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
            onChange={(e) => setEditableShootWithAutoSave(prev => ({...prev, notes: e.target.value}))}
            placeholder="Internal notes for staff reference..."
            rows={3}
            className="bg-background"
          />
        </div>
        </CardContent>
      )}
    </Card>
  );
}

interface AddImagesSectionProps {
  onUpload: (files: File[], resolutions?: ConflictResolution[]) => void;
  isUploading: boolean;
  toast: any;
  shootId: string;
  mediaType?: 'photo' | 'video';
}

export function AddImagesSection({ onUpload, isUploading, toast, shootId, mediaType = 'photo' }: AddImagesSectionProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isCheckingConflicts, setIsCheckingConflicts] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<ConflictInfo[]>([]);
  const [videoConflicts, setVideoConflicts] = React.useState<VideoConflictInfo[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = React.useState(false);
  const [videoConflictDialogOpen, setVideoConflictDialogOpen] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);

  // Determine if this is a video album based on mediaType prop
  const isVideo = mediaType === 'video';

  // Status indicator for upload state
  const UploadStatusIndicator = () => {
    if (isUploading) {
      return (
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Uploading...</span>
        </div>
      );
    }
    if (isCheckingConflicts) {
      return (
        <div className="flex items-center gap-2 text-orange-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking conflicts...</span>
        </div>
      );
    }
    if (selectedFiles.length > 0) {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{selectedFiles.length} ready</span>
        </div>
      );
    }
    return null;
  };

  const handleFileSelect = (files: File[]) => {
    console.log('handleFileSelect called with:', files.length, 'files');
    setSelectedFiles(files);
    toast({
      title: isVideo ? "Videos Selected" : "Images Selected",
      description: `${files.length} ${isVideo ? 'video(s)' : 'image(s)'} ready for upload. Click "Upload ${isVideo ? 'Videos' : 'Images'}" to proceed.`,
    });
  };

  const checkConflicts = async (files: File[]): Promise<{ conflicts: ConflictInfo[]; safe: string[] }> => {
    const filenames = files.map(f => f.name);
    const result = await supabaseOperations.images.checkConflicts(shootId, filenames);
    
    // Add file sizes to conflicts from selected files
    result.conflicts = result.conflicts.map((conflict: ConflictInfo) => {
      const file = files.find(f => f.name === conflict.filename);
      return {
        ...conflict,
        newFileSize: file?.size || 0
      };
    });
    
    return result;
  };

  const checkVideoConflicts = async (files: File[]): Promise<{ conflicts: VideoConflictInfo[]; safe: string[] }> => {
    const filenames = files.map(f => f.name);
    const result = await supabaseOperations.videos.checkConflicts(shootId, filenames);
    
    // Add file sizes and duration to conflicts from selected files
    result.conflicts = result.conflicts.map((conflict: VideoConflictInfo) => {
      const file = files.find(f => f.name === conflict.filename);
      return {
        ...conflict,
        newFileSize: file?.size || 0,
        newDuration: 0 // Will be updated when video metadata is available
      };
    });
    
    return result;
  };

  const handleUploadClick = async () => {
    if (selectedFiles.length === 0) return;

    setIsCheckingConflicts(true);

    try {
      if (isVideo) {
        // Check for video conflicts
        const { conflicts: foundConflicts, safe } = await checkVideoConflicts(selectedFiles);

        if (foundConflicts.length > 0) {
          // Show video conflict resolution dialog
          setVideoConflicts(foundConflicts);
          setPendingFiles(selectedFiles);
          setVideoConflictDialogOpen(true);
        } else {
          // No conflicts, proceed with upload
          onUpload(selectedFiles);
          setSelectedFiles([]);
        }
      } else {
        // Check for image conflicts
        const { conflicts: foundConflicts, safe } = await checkConflicts(selectedFiles);

        if (foundConflicts.length > 0) {
          // Show conflict resolution dialog
          setConflicts(foundConflicts);
          setPendingFiles(selectedFiles);
          setConflictDialogOpen(true);
        } else {
          // No conflicts, proceed with upload
          onUpload(selectedFiles);
          setSelectedFiles([]);
        }
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast({
        title: "Error",
        description: `Failed to check for ${isVideo ? 'video' : 'image'} conflicts. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const handleConflictResolution = (resolutions: ConflictResolution[]) => {
    // Filter files based on resolutions
    const filesToUpload = pendingFiles.filter(file => {
      const resolution = resolutions.find(r => r.filename === file.name);
      return !resolution || resolution.action !== 'skip';
    });
    
    if (filesToUpload.length > 0) {
      // TODO: Pass resolutions to upload function for enhanced handling
      onUpload(filesToUpload, resolutions);
    }
    
    // Clean up state
    setSelectedFiles([]);
    setPendingFiles([]);
    setConflicts([]);
    setConflictDialogOpen(false);
    
    if (filesToUpload.length === 0) {
      toast({
        title: "Upload Cancelled",
        description: "All files were skipped.",
      });
    }
  };

  const handleVideoConflictResolution = (resolutions: VideoConflictResolution[]) => {
    // Filter files based on resolutions
    const filesToUpload = pendingFiles.filter(file => {
      const resolution = resolutions.find(r => r.filename === file.name);
      return !resolution || resolution.action !== 'skip';
    });
    
    if (filesToUpload.length > 0) {
      // Convert video resolutions to the format expected by the upload handler
      const convertedResolutions = resolutions.map(res => ({
        filename: res.filename,
        action: res.action,
        keepPosition: res.keepPosition,
        targetImageId: res.targetVideoId // Use the video ID but keep the same field name for compatibility
      }));
      onUpload(filesToUpload, convertedResolutions);
    }
    
    // Clean up state
    setSelectedFiles([]);
    setPendingFiles([]);
    setVideoConflicts([]);
    setVideoConflictDialogOpen(false);
    
    if (filesToUpload.length === 0) {
      toast({
        title: "Upload Cancelled",
        description: "All video files were skipped.",
      });
    }
  };

  const handleConflictCancel = () => {
    setPendingFiles([]);
    setConflicts([]);
    setConflictDialogOpen(false);
    toast({
      title: "Upload Cancelled",
      description: "No files were uploaded.",
    });
  };

  const handleVideoConflictCancel = () => {
    setPendingFiles([]);
    setVideoConflicts([]);
    setVideoConflictDialogOpen(false);
    toast({
      title: "Upload Cancelled",
      description: "No video files were uploaded.",
    });
  };

  return (
    <Card className="admin-gradient-card">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-salmon flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Add {isVideo ? 'Videos' : 'Images'}
          </CardTitle>
          <div className="flex items-center gap-3">
            {isExpanded && <UploadStatusIndicator />}
            {isExpanded && (
              <div className="relative">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="bg-salmon text-white hover:bg-salmon-muted"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}${isVideo ? 'Videos' : 'Images'}`}
                </Button>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-salmon" />
            ) : (
              <ChevronDown className="w-5 h-5 text-salmon" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <div 
          className="border-2 border-dashed border-salmon/30 rounded-lg p-8 text-center bg-background/50 transition-colors hover:border-salmon/50"
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add('border-salmon', 'bg-salmon/10');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('border-salmon', 'bg-salmon/10');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('border-salmon', 'bg-salmon/10');

            // Get files from dataTransfer
            const files = Array.from(e.dataTransfer.files);
            const validFiles = files.filter(file =>
              isVideo ? file.type.startsWith('video/') : file.type.startsWith('image/')
            );

            console.log('Dropped files:', files.length, `Valid ${isVideo ? 'video' : 'image'} files:`, validFiles.length);

            if (validFiles.length > 0) {
              handleFileSelect(validFiles);
            } else if (files.length > 0) {
              toast({
                title: "Invalid Files",
                description: isVideo
                  ? "Please drop video files only (MP4, MOV, AVI, WEBM)"
                  : "Please drop image files only (JPG, PNG, WEBP)",
                variant: "destructive"
              });
            }
          }}
        >
          <Upload className="w-12 h-12 text-salmon mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Drag and drop {isVideo ? 'videos' : 'images'} here, or click to browse
          </p>
          <input
            type="file"
            multiple
            accept={isVideo ? "video/*" : "image/*"}
            className="hidden"
            id="imageUploadInput"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                handleFileSelect(files);
              }
            }}
          />
          <Button
            variant="outline"
            className="border-salmon text-salmon hover:bg-salmon hover:text-white"
            onClick={() => document.getElementById('imageUploadInput')?.click()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Select {isVideo ? 'Videos' : 'Images'} to Upload
          </Button>
          {selectedFiles.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {selectedFiles.length} {isVideo ? 'video(s)' : 'image(s)'} selected: {selectedFiles.map(f => f.name).join(', ')}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {isVideo
              ? 'Supports: MP4, MOV, AVI, WEBM • Max 500MB per video • Up to 20 videos per batch'
              : 'Supports: JPG, PNG, WEBP • Max 10MB per image • Up to 50 images per batch'}
          </p>
        </div>
        </CardContent>
      )}
      
      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflicts={conflicts}
        onResolve={handleConflictResolution}
        onCancel={handleConflictCancel}
      />
      
      {/* Video Conflict Resolution Dialog */}
      <VideoConflictResolutionDialog
        open={videoConflictDialogOpen}
        onOpenChange={setVideoConflictDialogOpen}
        conflicts={videoConflicts}
        onResolve={handleVideoConflictResolution}
        onCancel={handleVideoConflictCancel}
      />
    </Card>
  );
}

interface GalleryAppearanceSectionProps {
  gallerySettings: any;
  setGallerySettings: (fn: (prev: any) => any) => void;
  selectedCover: string | null;
  setSelectedCover: (id: string | null) => void;
  imageOrder: string[];
  shootId: string;
}

export function GalleryAppearanceSection({ 
  gallerySettings, 
  setGallerySettings, 
  selectedCover, 
  setSelectedCover,
  imageOrder,
  shootId
}: GalleryAppearanceSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  // Auto-save gallery settings hook  
  const { debouncedSave, saveImmediately, saveStatus, isSaving } = useAutoSaveGallerySettings({
    shootId
  });

  // Enhanced setGallerySettings that triggers auto-save
  const handleGallerySettingsChange = React.useCallback((updateFn: (prev: any) => any) => {
    setGallerySettings((prev) => {
      const newSettings = updateFn(prev);
      
      // Trigger auto-save with the new settings
      debouncedSave(newSettings);
      
      return newSettings;
    });
  }, [setGallerySettings, debouncedSave]);

  // Manual save function for Save button
  const handleManualSave = () => {
    saveImmediately(gallerySettings);
  };

  return (
    <Card className="admin-gradient-card">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-salmon flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Gallery Appearance
          </CardTitle>
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-salmon" />
            ) : (
              <ChevronDown className="w-5 h-5 text-salmon" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - Gallery Settings */}
            <div className="w-full">
              <div className="space-y-4 w-full gallery-two-column-layout">
                <GallerySettingsCard
                  gallerySettings={gallerySettings}
                  setGallerySettings={handleGallerySettingsChange}
                  onSave={handleManualSave}
                  isSaving={isSaving}
                  standalone={false}
                />
              </div>
            </div>
            
            {/* Right Panel - Dropdown Controls */}
            <div className="w-full space-y-4 gallery-two-column-layout">
              <div className="gallery-slider-container w-full">
                <div className="gallery-slider-header">
                  <Label className="gallery-slider-label">Layout Style</Label>
                </div>
                <div className="mt-2">
                  <Select 
                    value={gallerySettings.layoutStyle || 'automatic'}
                    defaultValue="automatic"
                    onValueChange={(value) => {
                      handleGallerySettingsChange(prev => ({...prev, layoutStyle: value}));
                    }}
                  >
                    <SelectTrigger className="gallery-select-trigger w-full">
                      <SelectValue placeholder="Select layout..." />
                    </SelectTrigger>
                    <SelectContent className="gallery-select-content">
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="square">Square 1:1</SelectItem>
                      <SelectItem value="portrait">Portrait 2:3</SelectItem>
                      <SelectItem value="landscape">Landscape 3:2</SelectItem>
                      <SelectItem value="instagram">Instagram 4:5</SelectItem>
                      <SelectItem value="upright">Upright 9:16</SelectItem>
                      <SelectItem value="wide">Wide 16:9</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="gallery-slider-container w-full">
                <div className="gallery-slider-header">
                  <Label className="gallery-slider-label">Cover Pic Alignment</Label>
                </div>
                <div className="mt-2">
                  <Select 
                    value={gallerySettings.coverPicAlignment || 'centre'}
                    defaultValue="centre"
                    onValueChange={(value) => {
                      handleGallerySettingsChange(prev => ({...prev, coverPicAlignment: value}));
                    }}
                  >
                    <SelectTrigger className="gallery-select-trigger w-full">
                      <SelectValue placeholder="Select alignment..." />
                    </SelectTrigger>
                    <SelectContent className="gallery-select-content">
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="centre">Centre</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="gallery-slider-container w-full">
                <div className="gallery-slider-header">
                  <Label className="gallery-slider-label">Navigation Position</Label>
                </div>
                <div className="mt-2">
                  <Select 
                    value={gallerySettings.navbarPosition || 'top-left'}
                    defaultValue="top-left"
                    onValueChange={(value) => {
                      // Use setTimeout to prevent immediate re-renders that affect main navigation
                      setTimeout(() => {
                        handleGallerySettingsChange(prev => ({...prev, navbarPosition: value}));
                      }, 0);
                    }}
                  >
                    <SelectTrigger className="gallery-select-trigger w-full">
                      <SelectValue placeholder="Select position..." />
                    </SelectTrigger>
                    <SelectContent className="gallery-select-content">
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Portfolio Group Management Component
interface PortfolioGroupSectionProps {
  editableShoot: any;
  setEditableShootWithAutoSave: (updateFn: (prev: any) => any, immediate?: boolean) => void;
}

function PortfolioGroupSection({ editableShoot, setEditableShootWithAutoSave }: PortfolioGroupSectionProps) {
  const [showCreateNew, setShowCreateNew] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [customSlug, setCustomSlug] = React.useState('');
  const [slugError, setSlugError] = React.useState('');
  
  // Fetch existing group names for dropdown
  const { data: existingGroups = [] } = useQuery<string[]>({
    queryKey: ['portfolio-groups'],
    queryFn: () => supabaseOperations.portfolio.getGroups()
  });

  // Generate slug from group name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Auto-generate slug when group name changes
  React.useEffect(() => {
    if (newGroupName) {
      const generatedSlug = generateSlug(newGroupName);
      setCustomSlug(generatedSlug);
    }
  }, [newGroupName]);

  const validateSlug = async (slug: string) => {
    if (!slug) {
      setSlugError('Slug is required');
      return false;
    }
    
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }

    // Check if slug already exists
    const existingSlugs = existingGroups.map(name => generateSlug(name));
    if (existingSlugs.includes(slug)) {
      setSlugError('This slug is already in use');
      return false;
    }

    setSlugError('');
    return true;
  };

  const handleGroupChange = (value: string) => {
    if (value === 'create-new') {
      setShowCreateNew(true);
    } else if (value === 'none') {
      setEditableShootWithAutoSave(prev => ({ ...prev, groupName: null }));
      setShowCreateNew(false);
    } else {
      setEditableShootWithAutoSave(prev => ({ ...prev, groupName: value }));
      setShowCreateNew(false);
    }
  };

  const handleCreateNewGroup = async () => {
    if (newGroupName.trim() && await validateSlug(customSlug)) {
      setEditableShootWithAutoSave(prev => ({ ...prev, groupName: newGroupName.trim() }));
      setNewGroupName('');
      setCustomSlug('');
      setShowCreateNew(false);
      setSlugError('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Portfolio Group
          <span className="text-xs text-muted-foreground">(Bundle related galleries)</span>
        </Label>
      </div>
      
      {/* Current Group Display */}
      <div className="text-sm">
        <span className="text-muted-foreground">Currently assigned to: </span>
        {editableShoot.groupName ? (
          <span className="text-green-400 font-medium bg-green-900/20 px-2 py-1 rounded text-xs">
            {editableShoot.groupName}
          </span>
        ) : (
          <span className="text-gray-400 italic">No group assigned</span>
        )}
      </div>
      
      <div className="space-y-3">
        <Select 
          value={editableShoot.groupName || 'none'} 
          onValueChange={handleGroupChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="No portfolio group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No portfolio group</SelectItem>
            {existingGroups.map(groupName => (
              <SelectItem key={groupName} value={groupName}>
                {groupName}
              </SelectItem>
            ))}
            <SelectItem value="create-new">
              <div className="flex items-center gap-2">
                <Plus className="w-3 h-3" />
                Create New Group...
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {showCreateNew && (
          <div className="bg-background/50 p-3 rounded-lg border border-salmon/20 space-y-3">
            <div className="space-y-3">
              <div>
                <Label htmlFor="newGroupName" className="text-sm font-medium">
                  Portfolio Group Name
                </Label>
                <Input
                  id="newGroupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., POCAS Bubble Tea Party Kit"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="customSlug" className="text-sm font-medium">
                  URL Slug
                </Label>
                <Input
                  id="customSlug"
                  value={customSlug}
                  onChange={(e) => {
                    setCustomSlug(e.target.value);
                    validateSlug(e.target.value);
                  }}
                  placeholder="e.g., pocas-bubble-tea-party-kit"
                  className={`mt-1 ${slugError ? 'border-red-500' : ''}`}
                />
                {slugError && (
                  <p className="text-xs text-red-500 mt-1">{slugError}</p>
                )}
                {customSlug && !slugError && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will be accessible at: <code>/portfolio/{customSlug}</code>
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleCreateNewGroup}
                disabled={!newGroupName.trim() || !customSlug.trim() || !!slugError}
                className="bg-salmon hover:bg-salmon/90"
              >
                <Check className="w-3 h-3 mr-1" />
                Create Group
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setShowCreateNew(false);
                  setNewGroupName('');
                  setCustomSlug('');
                  setSlugError('');
                }}
              >
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Galleries with the same group name will be bundled together in the portfolio page.
            </p>
          </div>
        )}

        {editableShoot.groupName && (
          <div className="bg-green-900/20 border border-green-700/30 p-2 rounded text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-3 h-3" />
              <span>This gallery will be bundled with other "{editableShoot.groupName}" galleries</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}