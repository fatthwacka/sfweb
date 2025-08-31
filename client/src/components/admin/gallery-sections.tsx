import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SHOOT_TYPES } from '@shared/schema';
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
}

export function BasicInfoSection({ 
  editableShoot, 
  setEditableShoot, 
  clients, 
  clientReassignDialogOpen, 
  setClientReassignDialogOpen, 
  shootId,
  toast 
}: BasicInfoSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const { debouncedSave, saveImmediately, saveStatus, isSaving } = useAutoSave({
    shootId,
    successMessage: "Basic shoot information saved successfully!",
    errorMessage: "Failed to save basic information"
  });

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
        seoTags: newShoot.seoTags?.trim()
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
            <Camera className="w-5 h-5" />
            Basic Shoot Info
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  
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
            Advanced Settings
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
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  toast: any;
  shootId: string;
}

export function AddImagesSection({ onUpload, isUploading, toast, shootId }: AddImagesSectionProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isExpanded, setIsExpanded] = React.useState(false);

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
      title: "Images Selected",
      description: `${files.length} image(s) ready for upload. Click "Upload Images" to proceed.`,
    });
  };

  const handleUploadClick = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]); // Clear selection after upload
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
            <Upload className="w-5 h-5" />
            Add Images
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
                  {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Images`}
                </Button>
                
                {/* Futuristic Upload Progress Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-salmon/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-6 h-6 border-2 border-cyan-300/30 rounded-full"></div>
                        <div className="absolute inset-0 w-6 h-6 border-2 border-t-cyan-400 border-r-purple-400 border-b-salmon border-l-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="text-white font-semibold text-sm tracking-wider">
                        UPLOADING
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-salmon rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
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
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            console.log('Dropped files:', files.length, 'Image files:', imageFiles.length);
            
            if (imageFiles.length > 0) {
              handleFileSelect(imageFiles);
            } else if (files.length > 0) {
              toast({
                title: "Invalid Files",
                description: "Please drop image files only (JPG, PNG, WEBP)",
                variant: "destructive"
              });
            }
          }}
        >
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
            Select Images to Upload
          </Button>
          {selectedFiles.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {selectedFiles.length} image(s) selected: {selectedFiles.map(f => f.name).join(', ')}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Supports: JPG, PNG, WEBP • Max 10MB per image • Bulk upload supported
          </p>
        </div>
        </CardContent>
      )}
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  
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