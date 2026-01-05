import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseOperations } from '@/lib/supabase-operations';
import { ImageUploadZone } from './image-upload-zone';
import { ImageIcon } from 'lucide-react';
import {
  Upload,
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Wand2,
  FileText,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Mail,
  Trash2,
  AlertTriangle,
  X,
  BarChart3,
  Unlock
} from 'lucide-react';

interface PreviewSettingsCardProps {
  shootId: string;
}

interface PreviewSettings {
  id?: string;
  shootId: string;
  selectionLimit: number;
  additionalBundle5Price: string;
  additionalBundle10Price: string;
  unlimitedBundlePrice: string;
  isActive: boolean;
  submissionCompleted?: boolean;
  submissionCompletedAt?: string;
  submissionCompletedBy?: string;
  editingCompleted?: boolean;
  editingCompletedAt?: string;
  imageUploadCompleted?: boolean;
}

interface ClientSelection {
  id: string;
  shootId: string;
  clientId: string;
  imageFilename: string;
  selectionStatus: string;
  isFinalSelection: boolean;
  selectedAt: string | null;
  editingComplete: boolean;
  editingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Selection Badge Component
interface SelectionBadgeProps {
  status: 'favorite' | 'like' | 'dislike' | 'none';
}

const SelectionBadge: React.FC<SelectionBadgeProps> = ({ status }) => {
  if (status === 'none') return null;
  
  const badgeConfig = {
    favorite: {
      icon: Heart,
      bgColor: 'bg-red-500/90',
      borderColor: 'border-red-300',
      iconColor: 'text-white'
    },
    like: {
      icon: ThumbsUp,
      bgColor: 'bg-green-500/90', 
      borderColor: 'border-green-300',
      iconColor: 'text-white'
    },
    dislike: {
      icon: ThumbsDown,
      bgColor: 'bg-yellow-500/90',
      borderColor: 'border-yellow-300', 
      iconColor: 'text-white'
    }
  };
  
  const config = badgeConfig[status];
  const IconComponent = config.icon;
  
  return (
    <div className={`
      absolute bottom-2 left-2 z-10
      w-6 h-6 rounded-full flex items-center justify-center
      ${config.bgColor} ${config.borderColor} border-2
      shadow-lg backdrop-blur-sm
    `}>
      <IconComponent className={`w-3 h-3 ${config.iconColor}`} />
    </div>
  );
};

export function PreviewSettingsCard({ shootId }: PreviewSettingsCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLimitsExpanded, setIsLimitsExpanded] = useState(false);
  const [showSelectionsModal, setShowSelectionsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [displayedImageCount, setDisplayedImageCount] = useState(24);
  const [settings, setSettings] = useState<PreviewSettings>({
    shootId,
    selectionLimit: 20,
    additionalBundle5Price: '150.00',
    additionalBundle10Price: '250.00',
    unlimitedBundlePrice: '500.00',
    isActive: false,
    submissionCompleted: false,
    imageUploadCompleted: false,
  });

  // Fetch client selections for the modal and deletion count
  const { data: clientSelections = [] } = useQuery<ClientSelection[]>({
    queryKey: ['client-selections', shootId],
    queryFn: () => supabaseOperations.clientSelections.getByShoot(shootId),
    enabled: !!shootId, // Always fetch to check for orphaned records
  });

  // Fetch preview images for this shoot
  const { data: previewImagesData = {} } = useQuery({
    queryKey: ['preview-images', shootId],
    queryFn: () => supabaseOperations.previewImages.getByShoot(shootId),
    enabled: !!shootId,
  });
  
  const previewImages = previewImagesData.images || [];

  // Create selection status lookup map for visual badges
  const selectionStatusMap = useMemo(() => {
    const map: Record<string, 'favorite' | 'like' | 'dislike' | 'none'> = {};
    clientSelections.forEach((selection) => {
      map[selection.imageFilename] = selection.selectionStatus as 'favorite' | 'like' | 'dislike' | 'none';
    });
    return map;
  }, [clientSelections]);

  // Helper function to get selection status for a filename
  const getSelectionStatus = (filename: string): 'favorite' | 'like' | 'dislike' | 'none' => {
    return selectionStatusMap[filename] || 'none';
  };

  // Fetch shoot details for the name
  const { data: shootDetails } = useQuery({
    queryKey: ['shoot-details', shootId],
    queryFn: () => supabaseOperations.shoots.getById(shootId),
    enabled: !!shootId,
  });

  // Helper function to check if submitted
  const isSubmitted = settings.submissionCompleted;
  const isEditingComplete = settings.editingCompleted;
  const isLocked = isSubmitted && !isEditing;

  // Mutation to update editing status
  const updateEditingStatusMutation = useMutation({
    mutationFn: ({ selectionId, editingComplete }: { selectionId: string; editingComplete: boolean }) => 
      supabaseOperations.clientSelections.updateEditingStatus(selectionId, editingComplete),
    onSuccess: () => {
      // Refetch the client selections to update the UI
      queryClient.invalidateQueries({ queryKey: ['client-selections', shootId] });
      toast({
        title: 'Success',
        description: 'Editing status updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating editing status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update editing status',
        variant: 'destructive',
      });
    },
  });

  // Helper function to handle checkbox change
  const handleEditingStatusChange = (selectionId: string, checked: boolean) => {
    updateEditingStatusMutation.mutate({ selectionId, editingComplete: checked });
  };

  // Handler for Mark Complete button - checks conditions or shows modal
  const handleMarkCompleteClick = () => {
    if (isSubmitted) {
      // Toggle completion status - if complete, unmark it; if incomplete, mark it
      toggleEditingCompleteMutation.mutate(!isEditingComplete);
    } else {
      // Show modal explaining what's needed
      setShowMarkCompleteModal(true);
    }
  };

  // Bulk editing status handlers for tick-all functionality
  const handleBulkEditingStatusChange = async (selectionType: 'favorite' | 'like' | 'dislike', markAsComplete: boolean) => {
    const selectionsToUpdate = clientSelections.filter(s => s.selectionStatus === selectionType);
    
    // Update all selections of this type
    const updatePromises = selectionsToUpdate.map(selection => 
      updateEditingStatusMutation.mutateAsync({ 
        selectionId: selection.id, 
        editingComplete: markAsComplete 
      })
    );
    
    try {
      await Promise.all(updatePromises);
      toast({
        title: 'Success',
        description: `All ${selectionType} images ${markAsComplete ? 'marked as complete' : 'marked as incomplete'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update some ${selectionType} images`,
        variant: 'destructive',
      });
    }
  };

  // Mutation to toggle client submission status (reopen selections)
  const toggleSubmissionMutation = useMutation({
    mutationFn: (reopenSubmission: boolean) => 
      supabaseOperations.previewSettings.updateByShoot(shootId, {
        submission_completed: !reopenSubmission,
        submission_completed_at: reopenSubmission ? null : new Date().toISOString(),
        submission_completed_by: reopenSubmission ? null : 'admin'
      }),
    onSuccess: (data, reopenSubmission) => {
      // Refetch the preview settings
      queryClient.invalidateQueries({ queryKey: ['preview-settings', shootId] });
      toast({
        title: 'Success',
        description: reopenSubmission ? 'Client selections reopened for editing' : 'Client selections locked',
      });
    },
    onError: (error) => {
      console.error('Error toggling submission status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update submission status',
        variant: 'destructive',
      });
    },
  });

  // Mutation to toggle entire preview editing completion status
  const toggleEditingCompleteMutation = useMutation({
    mutationFn: (markAsComplete: boolean) => 
      supabaseOperations.previewSettings.updateByShoot(shootId, {
        editing_completed: markAsComplete,
        editing_completed_at: markAsComplete ? new Date().toISOString() : null
      }),
    onSuccess: (data, markAsComplete) => {
      // Refetch the preview settings
      queryClient.invalidateQueries({ queryKey: ['preview-settings', shootId] });
      toast({
        title: 'Success',
        description: markAsComplete ? 'Preview marked as editing complete' : 'Preview marked as editing incomplete',
      });
    },
    onError: (error) => {
      console.error('Error toggling editing status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update editing status',
        variant: 'destructive',
      });
    },
  });

  // Email client mutation (keep as API call - server-side email logic)
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/client/email-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shootId })
      });
      if (!response.ok) throw new Error('Failed to send email');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Album ready notification sent successfully!',
      });
    },
    onError: (error) => {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email notification',
        variant: 'destructive',
      });
    },
  });

  // Delete preview data mutation (keep as API call - complex server-side logic)
  const deletePreviewDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shoots/${shootId}/preview-data`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete preview data');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Preview data deleted successfully. ${data.deletedSelections || 0} selections removed.`,
      });
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['preview-settings', shootId] });
      queryClient.invalidateQueries({ queryKey: ['client-selections', shootId] });
      queryClient.invalidateQueries({ queryKey: ['shoot-images', shootId] });
    },
    onError: (error) => {
      console.error('Error deleting preview data:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete preview data. Please ensure all final images have been delivered.',
        variant: 'destructive',
      });
    },
  });

  // Fetch existing preview settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['preview-settings', shootId],
    queryFn: () => supabaseOperations.previewSettings.getByShoot(shootId),
    enabled: !!shootId,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (existingSettings) {
      setSettings({
        ...existingSettings,
        shootId,
      });
      setIsEditing(false);
    }
  }, [existingSettings, shootId]);

  // Save preview settings mutation
  const saveMutation = useMutation({
    mutationFn: (data: PreviewSettings) => {
      console.log('Save mutation data:', data);
      
      if (existingSettings?.id) {
        console.log('Updating existing preview settings:', existingSettings.id);
        return supabaseOperations.previewSettings.update(existingSettings.id, data);
      } else {
        console.log('Creating new preview settings');
        return supabaseOperations.previewSettings.create(data);
      }
    },
    onSuccess: (response) => {
      console.log('Save mutation success:', response);
      toast({
        title: 'Success',
        description: 'Preview settings saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['preview-settings', shootId] });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Save mutation error:', error);
      toast({
        title: 'Error',
        description: `Failed to save preview settings. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Handle upload completion
  const handleUploadComplete = () => {
    setSettings(prev => ({ ...prev, imageUploadCompleted: true }));
    queryClient.invalidateQueries({ queryKey: ['preview-images', shootId] });
    // CRITICAL: Invalidate preview-settings cache so client portal shows cyan state
    queryClient.invalidateQueries({ queryKey: ['preview-settings', shootId] });
    queryClient.invalidateQueries({ queryKey: ["/api/preview-settings/by-shoots"] });
    toast({
      title: 'Success',
      description: 'All images uploaded successfully! Client portal updated.',
    });
  };

  // Delete preview image mutation
  const deletePreviewImageMutation = useMutation({
    mutationFn: (filename: string) => 
      supabaseOperations.previewImages.delete(shootId, filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-images', shootId] });
      toast({
        title: 'Success',
        description: 'Preview image deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete preview image.',
        variant: 'destructive',
      });
    },
  });

  // Handle delete preview image
  const handleDeletePreviewImage = (filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      deletePreviewImageMutation.mutate(filename);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleCancel = () => {
    if (existingSettings) {
      setSettings({
        ...existingSettings,
        shootId,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="admin-gradient-card">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-salmon" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="admin-gradient-card">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-salmon flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
Gallery Preview Selection
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* Just the expand/collapse chevron */}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-salmon" />
            ) : (
              <ChevronDown className="w-5 h-5 text-salmon" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6">
        
        {/* Action Bar - Clean and Simple */}
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600/20">
          <div className="flex items-center gap-2">
            {/* Status Text */}
          </div>
          
          <div className="flex items-center gap-2">
            {/* All Action Buttons */}
            {isSubmitted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReopenModal(true)}
                disabled={toggleSubmissionMutation.isPending}
                className="border-orange-500/30 text-orange-400 hover:border-orange-500 hover:bg-orange-500/20"
                title="Reopen client selections for editing (in case of client requests)"
              >
                {toggleSubmissionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 mr-1" />
                )}
                Reopen Selections
              </Button>
            )}
            
            {clientSelections?.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSelectionsModal(true)}
                className="border-cyan-500/30 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/20"
                title="View detailed client selection statistics and manage editing progress"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Statistics
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkCompleteClick}
              disabled={toggleEditingCompleteMutation.isPending}
              className={`${
                isEditingComplete
                  ? 'border-green-500/30 text-green-400 hover:border-green-500 hover:bg-green-500/20'
                  : isSubmitted && !isEditingComplete
                  ? 'border-yellow-500/30 text-yellow-400 hover:border-yellow-500 hover:bg-yellow-500/20'
                  : 'border-gray-500/30 text-gray-500 hover:border-gray-500 hover:bg-gray-500/20'
              }`}
              title={
                isEditingComplete
                  ? 'Click to unmark as complete (reopen editing)'
                  : isSubmitted && !isEditingComplete
                  ? 'Mark all editing as complete'
                  : 'Client selections required first'
              }
            >
              {toggleEditingCompleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : isEditingComplete ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <Wand2 className="w-4 h-4 mr-1" />
              )}
              {isEditingComplete ? 'Completed' : 'Mark Complete'}
            </Button>
            
            {previewImages.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                disabled={sendEmailMutation.isPending}
                className="border-blue-500/30 text-blue-400 hover:border-blue-500 hover:bg-blue-500/20"
                title="Send album ready notification email to client with gallery link"
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-1" />
                )}
                Email Client
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500/20"
              title="Delete all preview data and client selections (only after final delivery)"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Preview Data
            </Button>
            
          </div>
        </div>

        {/* Direct Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan" />
              <Label className="text-sm font-medium">Preview Images</Label>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                {previewImages.length > 0 ? `${previewImages.length} images` : 'no images uploaded'}
              </Badge>
              {previewImages.length > 0 && (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>

          {/* Direct upload - no toggle, always visible */}
          <ImageUploadZone 
            shootId={shootId} 
            onUploadComplete={handleUploadComplete}
            maxFileSize={10}
          />

          {/* Preview Images Grid */}
          {previewImages.length > 0 && (
            <div className="mt-4 p-4 bg-slate-800/20 rounded-lg border border-slate-600/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300">Uploaded Preview Images</h4>
                <Badge variant="outline" className="text-xs">
                  {previewImages.length} image{previewImages.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {previewImages.slice(0, displayedImageCount).map((image: any, index: number) => (
                  <div key={image.filename + index} className="group relative">
                    {/* Image Container */}
                    <div className="aspect-square bg-slate-700 rounded-md overflow-hidden relative">
                      <img
                        src={image.thumbnailUrl}
                        alt={image.filename}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                      />
                      {/* Selection Badge - Always visible, bottom center */}
                      <SelectionBadge status={getSelectionStatus(image.filename)} />
                      {/* Delete Button - Only visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreviewImage(image.filename);
                        }}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title={`Delete ${image.filename}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Filename - Always visible below thumbnail */}
                    <div className="mt-1 px-1">
                      <span className="text-xs text-gray-300 leading-tight block text-center break-words">
                        {image.filename}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {previewImages.length > displayedImageCount && (
                <div className="mt-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisplayedImageCount(prev => Math.min(prev + 24, previewImages.length))}
                    className="text-cyan border-cyan/30 hover:border-cyan hover:bg-cyan/20"
                  >
                    Show More (+{previewImages.length - displayedImageCount} images)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selection Limits */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setIsLimitsExpanded(!isLimitsExpanded)}>
            <Package className="w-4 h-4 text-cyan" />
            <Label className="text-sm font-medium cursor-pointer">Selection Limits & Bundles</Label>
            {isLimitsExpanded ? (
              <ChevronUp className="w-4 h-4 text-salmon ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-salmon ml-auto" />
            )}
          </div>

          {isLimitsExpanded && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selection-limit">Base Selection Limit</Label>
              <Input
                id="selection-limit"
                type="number"
                min="1"
                max="100"
                value={settings.selectionLimit}
                onChange={(e) => setSettings({ ...settings, selectionLimit: parseInt(e.target.value) || 20 })}
                disabled={!isEditing || isLocked}
                className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Number of images included in base package
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-5">5 Image Bundle Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="bundle-5"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.additionalBundle5Price}
                  onChange={(e) => setSettings({ ...settings, additionalBundle5Price: e.target.value })}
                  disabled={!isEditing || isLocked}
                  className={`pl-9 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-10">10 Image Bundle Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="bundle-10"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.additionalBundle10Price}
                  onChange={(e) => setSettings({ ...settings, additionalBundle10Price: e.target.value })}
                  disabled={!isEditing || isLocked}
                  className={`pl-9 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-unlimited">Unlimited Bundle Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="bundle-unlimited"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.unlimitedBundlePrice}
                  onChange={(e) => setSettings({ ...settings, unlimitedBundlePrice: e.target.value })}
                  disabled={!isEditing || isLocked}
                  className={`pl-9 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>
          )}
        </div>


        {/* Detailed Info Section */}
        {!isEditing && (isEditingComplete || isSubmitted || (!settings.isActive && previewImages.length === 0)) && (
          <div className="p-4 bg-slate-800/20 rounded-lg border border-slate-600/20">
            <div className="space-y-3">
              {isEditingComplete && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-green-400 font-medium mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Editing Complete
                  </div>
                  <p className="text-gray-400 text-xs">
                    All selected images edited and ready for delivery.
                    {settings.editingCompletedAt && ` Completed ${new Date(settings.editingCompletedAt).toLocaleDateString()}.`}
                  </p>
                </div>
              )}
              
              {isSubmitted && !isEditingComplete && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-yellow-400 font-medium mb-1">
                    <Wand2 className="w-4 h-4" />
                    Client Selections Received
                  </div>
                  <p className="text-gray-400 text-xs">
                    Settings locked to prevent changes.
                    {settings.submissionCompletedBy && ` Submitted by ${settings.submissionCompletedBy}`}
                    {settings.submissionCompletedAt && ` on ${new Date(settings.submissionCompletedAt).toLocaleDateString()}`}.
                  </p>
                </div>
              )}
              
              {!isSubmitted && settings.isActive && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-blue-400 font-medium mb-1">
                    <Eye className="w-4 h-4" />
                    Selection Limit Information
                  </div>
                  <p className="text-gray-400 text-xs">
                    Clients can select up to {settings.selectionLimit} images from the preview collection.
                  </p>
                </div>
              )}
              
              {!settings.isActive && previewImages.length === 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-gray-400 font-medium mb-1">
                    <Upload className="w-4 h-4" />
                    Setup Instructions
                  </div>
                  <p className="text-gray-400 text-xs">
                    Upload preview images and configure pricing to activate client selection.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </CardContent>
      )}

      {/* Client Selections Modal */}
      <Dialog open={showSelectionsModal} onOpenChange={setShowSelectionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-600">
              <BarChart3 className="w-5 h-5" />
              Client Selection Statistics
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-800">Overall Progress</span>
                <span className="text-blue-600">
                  {clientSelections.filter(s => (s.selectionStatus === 'favorite' || s.selectionStatus === 'like') && s.editingComplete).length} / {clientSelections.filter(s => s.selectionStatus === 'favorite' || s.selectionStatus === 'like').length} images edited
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${clientSelections.filter(s => s.selectionStatus === 'favorite' || s.selectionStatus === 'like').length > 0 ? (clientSelections.filter(s => (s.selectionStatus === 'favorite' || s.selectionStatus === 'like') && s.editingComplete).length / clientSelections.filter(s => s.selectionStatus === 'favorite' || s.selectionStatus === 'like').length) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
            {/* Submission Info */}
            {isSubmitted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Selection Submitted</h3>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Submitted by:</strong> {settings.submissionCompletedBy}</p>
                  <p><strong>Submitted at:</strong> {settings.submissionCompletedAt ? new Date(settings.submissionCompletedAt).toLocaleString() : 'Unknown'}</p>
                  <p className="text-yellow-600">⚠️ Preview settings are now locked to prevent accidental changes.</p>
                </div>
              </div>
            )}

            {/* Selections Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-red-700">Favorites</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {clientSelections.filter(s => s.selectionStatus === 'favorite' && s.editingComplete).length} / {clientSelections.filter(s => s.selectionStatus === 'favorite').length}
                </div>
                <div className="text-xs text-red-500 mt-1">edited</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-green-700">Likes</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {clientSelections.filter(s => s.selectionStatus === 'like' && s.editingComplete).length} / {clientSelections.filter(s => s.selectionStatus === 'like').length}
                </div>
                <div className="text-xs text-green-500 mt-1">edited</div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ThumbsDown className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-700">Dislikes</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {clientSelections.filter(s => s.selectionStatus === 'dislike' && s.editingComplete).length} / {clientSelections.filter(s => s.selectionStatus === 'dislike').length}
                </div>
                <div className="text-xs text-yellow-500 mt-1">edited</div>
              </div>
            </div>

            {/* Image Lists */}
            <div className="space-y-6">
              {/* Favorites */}
              {clientSelections.filter(s => s.selectionStatus === 'favorite').length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600">
                      <Heart className="w-5 h-5" />
                      Favorite Images ({clientSelections.filter(s => s.selectionStatus === 'favorite').length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Mark all as:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkEditingStatusChange('favorite', true)}
                        disabled={updateEditingStatusMutation.isPending}
                        className="text-xs px-2 py-1 border-green-500/30 text-green-600 hover:border-green-500 hover:bg-green-500/20"
                      >
                        {updateEditingStatusMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          "✓ "
                        )}
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkEditingStatusChange('favorite', false)}
                        disabled={updateEditingStatusMutation.isPending}
                        className="text-xs px-2 py-1 border-gray-500/30 text-gray-600 hover:border-gray-500 hover:bg-gray-500/20"
                      >
                        {updateEditingStatusMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          "✗ "
                        )}
                        Incomplete
                      </Button>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {clientSelections
                        .filter(s => s.selectionStatus === 'favorite')
                        .sort((a, b) => a.imageFilename.localeCompare(b.imageFilename))
                        .map((selection) => (
                          <div key={selection.id} className={`flex items-center gap-3 p-3 rounded border transition-all ${
                            selection.editingComplete 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-white border-red-200 text-red-700'
                          }`}>
                            <Checkbox
                              checked={selection.editingComplete}
                              onCheckedChange={(checked) => handleEditingStatusChange(selection.id, !!checked)}
                              disabled={updateEditingStatusMutation.isPending}
                            />
                            <span className="font-mono text-xs flex-1">{selection.imageFilename}</span>
                            {selection.editingComplete && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Likes */}
              {clientSelections.filter(s => s.selectionStatus === 'like').length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-green-600">
                      <ThumbsUp className="w-5 h-5" />
                      Liked Images ({clientSelections.filter(s => s.selectionStatus === 'like').length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Mark all as:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkEditingStatusChange('like', true)}
                        disabled={updateEditingStatusMutation.isPending}
                        className="text-xs px-2 py-1 border-green-500/30 text-green-600 hover:border-green-500 hover:bg-green-500/20"
                      >
                        {updateEditingStatusMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          "✓ "
                        )}
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkEditingStatusChange('like', false)}
                        disabled={updateEditingStatusMutation.isPending}
                        className="text-xs px-2 py-1 border-gray-500/30 text-gray-600 hover:border-gray-500 hover:bg-gray-500/20"
                      >
                        {updateEditingStatusMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          "✗ "
                        )}
                        Incomplete
                      </Button>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {clientSelections
                        .filter(s => s.selectionStatus === 'like')
                        .sort((a, b) => a.imageFilename.localeCompare(b.imageFilename))
                        .map((selection) => (
                          <div key={selection.id} className={`flex items-center gap-3 p-3 rounded border transition-all ${
                            selection.editingComplete 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-white border-green-200 text-green-700'
                          }`}>
                            <Checkbox
                              checked={selection.editingComplete}
                              onCheckedChange={(checked) => handleEditingStatusChange(selection.id, !!checked)}
                              disabled={updateEditingStatusMutation.isPending}
                            />
                            <span className="font-mono text-xs flex-1">{selection.imageFilename}</span>
                            {selection.editingComplete && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dislikes */}
              {clientSelections.filter(s => s.selectionStatus === 'dislike').length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-600">
                      <ThumbsDown className="w-5 h-5" />
                      Disliked Images ({clientSelections.filter(s => s.selectionStatus === 'dislike').length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Mark all as:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkEditingStatusChange('dislike', true)}
                        disabled={updateEditingStatusMutation.isPending}
                        className="text-xs px-2 py-1 border-green-500/30 text-green-600 hover:border-green-500 hover:bg-green-500/20"
                      >
                        {updateEditingStatusMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          "✓ "
                        )}
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkEditingStatusChange('dislike', false)}
                        disabled={updateEditingStatusMutation.isPending}
                        className="text-xs px-2 py-1 border-gray-500/30 text-gray-600 hover:border-gray-500 hover:bg-gray-500/20"
                      >
                        {updateEditingStatusMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          "✗ "
                        )}
                        Incomplete
                      </Button>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {clientSelections
                        .filter(s => s.selectionStatus === 'dislike')
                        .map((selection) => (
                          <div key={selection.id} className={`flex items-center gap-3 p-3 rounded border transition-all ${
                            selection.editingComplete 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-white border-yellow-200 text-yellow-700'
                          }`}>
                            <Checkbox
                              checked={selection.editingComplete}
                              onCheckedChange={(checked) => handleEditingStatusChange(selection.id, !!checked)}
                              disabled={updateEditingStatusMutation.isPending}
                            />
                            <span className="font-mono text-xs flex-1">{selection.imageFilename}</span>
                            {selection.editingComplete && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {clientSelections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No client selections found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Preview Data Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Delete Preview Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
              <p className="text-sm text-gray-300 mb-3">
                <strong className="text-red-400">⚠️ Warning:</strong> This action will permanently delete:
              </p>
              <ul className="text-sm text-gray-400 space-y-1 ml-4">
                <li>• All client selections ({clientSelections?.length || 0} items)</li>
                <li>• Selection package data</li>
                <li>• Analytics/tracking records</li>
                <li>• Preview configuration</li>
                {clientSelections?.length > 0 && !settings.submissionCompleted && (
                  <li className="text-yellow-400">• ⚠️ Found orphaned selection records</li>
                )}
              </ul>
            </div>

            <div className="p-4 bg-yellow-950/30 border border-yellow-900/50 rounded-lg">
              <p className="text-sm text-yellow-300">
                {clientSelections?.length > 0 && !settings.submissionCompleted ? (
                  <>
                    <strong>Note:</strong> Orphaned preview records detected. These may be from previous client assignments or incomplete preview setups. Deleting will clean up these records and allow normal album deletion.
                  </>
                ) : (
                  <>
                    <strong>Important:</strong> Only delete after complete and full sign-off of final album delivery by the client.
                  </>
                )}
              </p>
            </div>

            {shootDetails && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">You are about to delete preview data for:</p>
                <p className="font-semibold text-white">
                  {shootDetails.title || shootDetails.customTitle || `Shoot ${shootDetails.id}`}
                </p>
                {shootDetails.date && (
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {new Date(shootDetails.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation" className="text-sm">
                Type <strong className="text-red-400">yes</strong> to confirm deletion:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type 'yes' to confirm"
                className="bg-slate-800/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletePreviewDataMutation.mutate()}
                disabled={deleteConfirmation.toLowerCase() !== 'yes' || deletePreviewDataMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletePreviewDataMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Preview Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Requirements Modal */}
      <Dialog open={showMarkCompleteModal} onOpenChange={setShowMarkCompleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <Wand2 className="w-5 h-5" />
              Mark Editing Complete
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              To mark this preview as editing complete, the following conditions must be met:
            </p>

            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                isSubmitted 
                  ? 'bg-green-950/30 border-green-900/50' 
                  : 'bg-red-950/30 border-red-900/50'
              }`}>
                {isSubmitted ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${isSubmitted ? 'text-green-300' : 'text-red-300'}`}>
                    Client selections submitted
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isSubmitted 
                      ? `Submitted by ${settings.submissionCompletedBy || 'client'} on ${settings.submissionCompletedAt ? new Date(settings.submissionCompletedAt).toLocaleDateString() : 'unknown date'}`
                      : 'Client needs to submit their final image selections first'
                    }
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                !isEditingComplete
                  ? 'bg-green-950/30 border-green-900/50' 
                  : 'bg-yellow-950/30 border-yellow-900/50'
              }`}>
                {!isEditingComplete ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${!isEditingComplete ? 'text-green-300' : 'text-yellow-300'}`}>
                    Editing not yet marked complete
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {!isEditingComplete 
                      ? 'Ready to mark as complete once client selections are received'
                      : 'This preview has already been marked as editing complete'
                    }
                  </p>
                </div>
              </div>
            </div>

            {!isSubmitted && (
              <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Next steps:</strong> Client needs to review and submit their image selections through their gallery portal before editing can be marked as complete.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowMarkCompleteModal(false)}
                className="border-gray-500/30 text-gray-400 hover:border-gray-500 hover:bg-gray-500/20"
              >
                Understood
              </Button>
              {isSubmitted && !isEditingComplete && (
                <Button
                  onClick={() => {
                    setShowMarkCompleteModal(false);
                    toggleEditingCompleteMutation.mutate(true);
                  }}
                  disabled={toggleEditingCompleteMutation.isPending}
                  className="border-yellow-500/30 text-yellow-400 hover:border-yellow-500 hover:bg-yellow-500/20"
                  variant="outline"
                >
                  {toggleEditingCompleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Mark Complete Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Client Confirmation Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Mail className="w-5 h-5" />
              Email Client Notification
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              You are about to send an email notification to the client informing them that their finalized album is now live and ready for viewing.
            </p>

            <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg">
              <h4 className="font-medium text-blue-300 mb-2">📧 Email will include:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• ✨ Album completion notification</li>
                <li>• 🔗 Direct link to their gallery</li>
                <li>• 📥 Download instructions</li>
                <li>• 📞 Contact information for support</li>
              </ul>
            </div>

            {shootDetails && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Shoot details:</p>
                <p className="font-semibold text-white">
                  {shootDetails.title || shootDetails.customTitle || `Shoot ${shootDetails.id}`}
                </p>
                {shootDetails.clientId && (
                  <p className="text-sm text-gray-400 mt-1">
                    Client: {shootDetails.clientId}
                  </p>
                )}
                {shootDetails.date && (
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {new Date(shootDetails.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="p-4 bg-green-950/30 border border-green-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-300">Ready for delivery</h4>
              </div>
              <p className="text-sm text-gray-300">
                {previewImages.length} images uploaded and ready for client access.
                {isEditingComplete && " Editing marked as complete."}
              </p>
            </div>

            {!isEditingComplete && (
              <div className="p-4 bg-yellow-950/30 border border-yellow-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-medium text-yellow-300">Note</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Editing is not yet marked as complete. You can still send the notification, but consider marking editing complete first if all work is finished.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className="border-gray-500/30 text-gray-400 hover:border-gray-500 hover:bg-gray-500/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowEmailModal(false);
                  sendEmailMutation.mutate();
                }}
                disabled={sendEmailMutation.isPending}
                className="border-blue-500/30 text-blue-400 hover:border-blue-500 hover:bg-blue-500/20"
                variant="outline"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reopen Selections Confirmation Modal */}
      <Dialog open={showReopenModal} onOpenChange={setShowReopenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <Unlock className="w-5 h-5" />
              Reopen Client Selections
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              You are about to reopen client selections, allowing the client to make additional changes to their image choices.
            </p>

            <div className="p-4 bg-orange-950/30 border border-orange-900/50 rounded-lg">
              <h4 className="font-medium text-orange-300 mb-2">⚠️ This action will:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Unlock the client's selection interface</li>
                <li>• Allow them to modify their choices</li>
                <li>• Reset submission status to "pending"</li>
                <li>• Require them to resubmit when done</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <h4 className="font-medium text-blue-300">Current submission details:</h4>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <p><strong>Submitted by:</strong> {settings.submissionCompletedBy || 'Unknown'}</p>
                <p><strong>Submitted at:</strong> {settings.submissionCompletedAt ? new Date(settings.submissionCompletedAt).toLocaleString() : 'Unknown'}</p>
                <p><strong>Total selections:</strong> {clientSelections.filter(s => s.selectionStatus === 'favorite' || s.selectionStatus === 'like').length} images</p>
              </div>
            </div>

            {shootDetails && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Shoot:</p>
                <p className="font-semibold text-white">
                  {shootDetails.title || shootDetails.customTitle || `Shoot ${shootDetails.id}`}
                </p>
              </div>
            )}

            <div className="p-4 bg-yellow-950/30 border border-yellow-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-medium text-yellow-300">Recommendation</h4>
              </div>
              <p className="text-sm text-gray-300">
                Only reopen selections if the client has specifically requested changes. This ensures proper workflow management and client communication.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReopenModal(false)}
                className="border-gray-500/30 text-gray-400 hover:border-gray-500 hover:bg-gray-500/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowReopenModal(false);
                  toggleSubmissionMutation.mutate(true);
                }}
                disabled={toggleSubmissionMutation.isPending}
                className="border-orange-500/30 text-orange-400 hover:border-orange-500 hover:bg-orange-500/20"
                variant="outline"
              >
                {toggleSubmissionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reopening...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Reopen Selections
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}