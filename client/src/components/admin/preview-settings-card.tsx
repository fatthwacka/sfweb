import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Image,
  Link,
  Settings,
  Save,
  RefreshCw,
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
  ThumbsDown
} from 'lucide-react';

interface PreviewSettingsCardProps {
  shootId: string;
}

interface PreviewSettings {
  id?: string;
  shootId: string;
  dropboxFolderPath?: string;
  dropboxShareLink?: string;
  selectionLimit: number;
  additionalBundle5Price: string;
  additionalBundle10Price: string;
  unlimitedBundlePrice: string;
  isActive: boolean;
  submissionCompleted?: boolean;
  submissionCompletedAt?: string;
  submissionCompletedBy?: string;
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

export function PreviewSettingsCard({ shootId }: PreviewSettingsCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLimitsExpanded, setIsLimitsExpanded] = useState(false);
  const [showSelectionsModal, setShowSelectionsModal] = useState(false);
  const [settings, setSettings] = useState<PreviewSettings>({
    shootId,
    dropboxFolderPath: '',
    dropboxShareLink: '',
    selectionLimit: 20,
    additionalBundle5Price: '150.00',
    additionalBundle10Price: '250.00',
    unlimitedBundlePrice: '500.00',
    isActive: false,
    submissionCompleted: false,
  });

  // Fetch client selections for the modal
  const { data: clientSelections = [] } = useQuery<ClientSelection[]>({
    queryKey: ['client-selections', shootId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/client-selections/${shootId}`);
      return await response.json();
    },
    enabled: !!shootId && showSelectionsModal,
  });

  // Helper function to check if submitted
  const isSubmitted = settings.submissionCompleted;
  const isLocked = isSubmitted && !isEditing;

  // Mutation to update editing status
  const updateEditingStatusMutation = useMutation({
    mutationFn: async ({ selectionId, editingComplete }: { selectionId: string; editingComplete: boolean }) => {
      const response = await apiRequest('PATCH', `/api/client-selections/${selectionId}/editing-status`, {
        editingComplete
      });
      return await response.json();
    },
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

  // Fetch existing preview settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['preview-settings', shootId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shoots/${shootId}/preview-settings`);
      return await response.json();
    },
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

  // Save preview settings mutation with migration support
  const saveMutation = useMutation({
    mutationFn: async (data: PreviewSettings) => {
      console.log('Save mutation data:', data);
      const method = existingSettings?.id ? 'PATCH' : 'POST';
      const url = existingSettings?.id 
        ? `/api/preview-settings/${existingSettings.id}`
        : '/api/preview-settings';
      
      console.log('Save mutation URL:', url, 'Method:', method);
      
      const response = await apiRequest(method, url, data);
      const result = await response.json();
      
      // If there's a Dropbox share link, wait for migration to complete
      if (data.dropboxShareLink) {
        console.log('🚀 Dropbox share link detected - waiting for image migration...');
        // Add a delay to allow migration to process
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      return result;
    },
    onSuccess: (response) => {
      console.log('Save mutation success:', response);
      toast({
        title: 'Success',
        description: settings.dropboxShareLink 
          ? 'Preview settings saved and images migrated successfully'
          : 'Preview settings saved successfully',
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

  // Test Dropbox connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      // Send only the appropriate parameter - either folderPath OR shareLink, not both
      const requestBody: any = {};
      if (settings.dropboxFolderPath?.trim()) {
        requestBody.folderPath = settings.dropboxFolderPath.trim();
      } else if (settings.dropboxShareLink?.trim()) {
        requestBody.shareLink = settings.dropboxShareLink.trim();
      }
      
      const response = await apiRequest('POST', '/api/dropbox/test-connection', requestBody);
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log('Test connection success:', data);
      toast({
        title: 'Connection Successful',
        description: `Found ${data.imageCount} images in the folder`,
      });
    },
    onError: (error) => {
      console.error('Test connection error:', error);
      toast({
        title: 'Connection Failed',
        description: `Could not connect to Dropbox folder. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

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
            <Image className="w-5 h-5" />
            Client Preview Selection Settings
          </CardTitle>
          <div className="flex items-center gap-2">
            {isSubmitted && (
              <Badge variant="default" className="bg-yellow-500">
                <Wand2 className="w-3 h-3 mr-1" />
                Selection Submitted
              </Badge>
            )}
            {!isSubmitted && settings.isActive && (
              <Badge variant="default" className="bg-green-600">
                <Eye className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            {!isSubmitted && !settings.isActive && (
              <Badge variant="secondary">
                <EyeOff className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
            {/* View Selections button - always visible when submitted */}
            {isSubmitted && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSelectionsModal(true);
                }}
                className="border-yellow-500/30 text-yellow-600 hover:border-yellow-500 hover:bg-yellow-500 hover:text-white"
              >
                <FileText className="w-4 h-4 mr-1" />
                View Selections
              </Button>
            )}
            {/* Expanded state buttons */}
            {isExpanded && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                disabled={isSubmitted}
                className={`border-salmon/30 text-salmon hover:border-salmon hover:bg-salmon hover:text-white ${
                  isSubmitted ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Settings className="w-4 h-4 mr-1" />
                Configure
              </Button>
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
        <CardContent className="space-y-6">

        {/* Dropbox Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dropbox-link">Dropbox Shared Link</Label>
            <Textarea
              id="dropbox-link"
              placeholder="https://www.dropbox.com/sh/..."
              value={settings.dropboxShareLink}
              onChange={(e) => setSettings({ ...settings, dropboxShareLink: e.target.value })}
              disabled={!isEditing || isLocked}
              className={`font-mono text-sm min-h-[60px] ${
                isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {isEditing && (settings.dropboxFolderPath || settings.dropboxShareLink) && !isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending || isLocked}
              className="w-full"
            >
              {testConnectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
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

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || (!settings.dropboxFolderPath && !settings.dropboxShareLink)}
              className="bg-salmon text-white hover:bg-salmon-muted"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {settings.dropboxShareLink ? 'Migrating Images...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        )}

        {/* Info Section */}
        {!isEditing && isSubmitted && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Wand2 className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-600">Client Selection Submitted</p>
                <p className="text-xs text-muted-foreground">
                  The client has finalized their image selection. Settings are locked to prevent accidental changes.
                  Submitted by {settings.submissionCompletedBy} on {settings.submissionCompletedAt ? new Date(settings.submissionCompletedAt).toLocaleDateString() : 'Unknown date'}.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isEditing && !isSubmitted && settings.isActive && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-500">Preview Selection Active</p>
                <p className="text-xs text-muted-foreground">
                  Clients can now select their favorite images from the preview collection.
                  Selection limit: {settings.selectionLimit} images
                </p>
              </div>
            </div>
          </div>
        )}

        {!isEditing && !settings.isActive && (!settings.dropboxFolderPath && !settings.dropboxShareLink) && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-500">Setup Required</p>
                <p className="text-xs text-muted-foreground">
                  Configure Dropbox folder path or shared link to enable client preview selection.
                </p>
              </div>
            </div>
          </div>
        )}
        </CardContent>
      )}

      {/* Client Selections Modal */}
      <Dialog open={showSelectionsModal} onOpenChange={setShowSelectionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <FileText className="w-5 h-5" />
              Client Image Selections - Editing Checklist
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-800">Overall Progress</span>
                <span className="text-blue-600">
                  {clientSelections.filter(s => s.editingComplete).length} / {clientSelections.length} images edited
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${clientSelections.length > 0 ? (clientSelections.filter(s => s.editingComplete).length / clientSelections.length) * 100 : 0}%`
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
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 mb-3">
                    <Heart className="w-5 h-5" />
                    Favorite Images ({clientSelections.filter(s => s.selectionStatus === 'favorite').length})
                  </h3>
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
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-green-600 mb-3">
                    <ThumbsUp className="w-5 h-5" />
                    Liked Images ({clientSelections.filter(s => s.selectionStatus === 'like').length})
                  </h3>
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
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-600 mb-3">
                    <ThumbsDown className="w-5 h-5" />
                    Disliked Images ({clientSelections.filter(s => s.selectionStatus === 'dislike').length})
                  </h3>
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
    </Card>
  );
}