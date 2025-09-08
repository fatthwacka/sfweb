import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// import { SelectionCounter } from './selection-counter'; // REMOVED for mobile optimization
import { ImageSelectionGrid } from './image-selection-grid';
import {
  Camera,
  Calendar,
  MapPin,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Info
} from 'lucide-react';

interface ClientSelectionDashboardProps {
  shootId: string;
  clientId: string;
}

interface PreviewSettings {
  id: string;
  shootId: string;
  dropboxFolderPath?: string;
  dropboxShareLink?: string;
  selectionLimit: number;
  additionalBundle5Price: string;
  additionalBundle10Price: string;
  unlimitedBundlePrice: string;
  isActive: boolean;
}

interface ShootInfo {
  id: string;
  title: string;
  description?: string;
  shootDate?: string;
  location?: string;
  shootType?: string;
}

interface SelectionPackage {
  id: string;
  baseLimit: number;
  purchasedAdditional: number;
  totalAllowed: number;
}

export function ClientSelectionDashboard({ shootId, clientId }: ClientSelectionDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<'5' | '10' | 'unlimited'>('5');

  // Fetch shoot info
  const { data: shootInfo, isLoading: shootLoading } = useQuery({
    queryKey: ['shoot-info', shootId],
    queryFn: () => apiRequest(`/api/shoots/${shootId}`),
  });

  // Fetch preview settings
  const { data: previewSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['preview-settings', shootId],
    queryFn: () => apiRequest(`/api/shoots/${shootId}/preview-settings`),
  });

  // Fetch selection package
  const { data: selectionPackage } = useQuery({
    queryKey: ['selection-package', shootId, clientId],
    queryFn: () => apiRequest(`/api/selection-packages/${shootId}/${clientId}`),
  });

  // Fetch preview images from Dropbox
  const { data: previewImages, isLoading: imagesLoading, refetch: refetchImages } = useQuery({
    queryKey: ['preview-images', shootId],
    queryFn: () => apiRequest(`/api/dropbox/preview-images/${shootId}`),
    enabled: !!previewSettings?.isActive,
  });

  // Fetch current selections
  const { data: selections = [], refetch: refetchSelections } = useQuery({
    queryKey: ['client-selections', shootId],
    queryFn: () => apiRequest(`/api/client-selections/${shootId}`),
    enabled: !!previewSettings?.isActive,
  });

  // Calculate current state
  const currentSelections = selections.filter((s: any) => s.isFinalSelection).length;
  const totalAllowed = selectionPackage?.totalAllowed || previewSettings?.selectionLimit || 20;
  const baseLimit = previewSettings?.selectionLimit || 20;

  // Transform images for grid component
  const gridImages = previewImages?.images?.map((img: any) => {
    const selection = selections.find((s: any) => s.imageFilename === img.filename);
    return {
      id: img.filename, // Use filename as ID
      filename: img.filename,
      thumbnailUrl: img.thumbnailUrl,
      fullImageUrl: img.fullImageUrl,
      selectionStatus: selection?.selectionStatus || 'none',
      isFinalSelection: selection?.isFinalSelection || false,
      metadata: img.metadata,
    };
  }) || [];

  // Handle selection changes
  const handleSelectionChange = (imageId: string, status: 'none' | 'favorite' | 'like' | 'dislike') => {
    // Optimistically update local state
    queryClient.invalidateQueries({ queryKey: ['client-selections', shootId] });
  };

  // Upgrade package mutation
  const upgradeMutation = useMutation({
    mutationFn: (upgradeType: '5' | '10' | 'unlimited') => {
      return apiRequest(`/api/selection-packages/${shootId}/${clientId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeType }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Package Upgraded!',
        description: 'Your selection limit has been increased.',
      });
      queryClient.invalidateQueries({ queryKey: ['selection-package', shootId, clientId] });
      setUpgradeDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Upgrade Failed',
        description: 'There was an issue processing your upgrade. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleUpgrade = () => {
    setUpgradeDialogOpen(true);
  };

  const confirmUpgrade = () => {
    upgradeMutation.mutate(selectedUpgrade);
  };

  if (shootLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-salmon" />
          <p className="text-muted-foreground">Loading your selection dashboard...</p>
        </div>
      </div>
    );
  }

  if (!previewSettings?.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Selection Not Available</h2>
            <p className="text-muted-foreground mb-4">
              Image selection has not been set up for this shoot yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your photographer for more information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-background">
      {/* Mobile-Optimized Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="font-semibold text-lg">{shootInfo?.title || 'Select Images'}</h1>
              <div className="text-sm text-muted-foreground">
                ❤️ {currentSelections}/{totalAllowed} selected
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-safe-area px-4 py-6 pb-24 space-y-6">

        {/* Shoot Info */}
        {shootInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-salmon" />
                {shootInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                {shootInfo.shootDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(shootInfo.shootDate).toLocaleDateString()}
                  </div>
                )}
                {shootInfo.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {shootInfo.location}
                  </div>
                )}
                {shootInfo.shootType && (
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {shootInfo.shootType}
                  </div>
                )}
              </div>
              {shootInfo.description && (
                <p className="mt-4 text-sm">{shootInfo.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content - Full Width */}
        <div className="w-full">
            {imagesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-salmon mb-4" />
                <p className="text-muted-foreground">Loading preview images...</p>
              </div>
            ) : previewImages?.images?.length > 0 ? (
              <ImageSelectionGrid
                images={gridImages}
                shootId={shootId}
                onSelectionChange={handleSelectionChange}
                maxSelections={totalAllowed}
                currentSelections={currentSelections}
                className="mobile-image-grid"
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Images Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Preview images haven't been uploaded yet.
                  </p>
                  <Button variant="outline" onClick={() => refetchImages()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Again
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan mt-0.5" />
              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">How to select your images:</h4>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Click the <strong>heart icon</strong> to mark images as favorites (these get retouched)</li>
                  <li>• Use the <strong>thumbs up</strong> for images you like but don't need retouched</li>
                  <li>• Use the <strong>thumbs down</strong> for images you don't want</li>
                  <li>• Click any image to view it full-size</li>
                  <li>• Use keyboard shortcuts: Arrow keys to navigate, F to favorite, Esc to close</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-cyan" />
              Upgrade Your Package
            </DialogTitle>
            <DialogDescription>
              Need to select more images? Choose an upgrade option below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="upgrade"
                  value="5"
                  checked={selectedUpgrade === '5'}
                  onChange={(e) => setSelectedUpgrade(e.target.value as '5')}
                  className="text-cyan"
                />
                <div className="flex-1">
                  <div className="font-medium">Add 5 Images</div>
                  <div className="text-sm text-muted-foreground">
                    ${previewSettings.additionalBundle5Price}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="upgrade"
                  value="10"
                  checked={selectedUpgrade === '10'}
                  onChange={(e) => setSelectedUpgrade(e.target.value as '10')}
                  className="text-cyan"
                />
                <div className="flex-1">
                  <div className="font-medium">Add 10 Images</div>
                  <div className="text-sm text-muted-foreground">
                    ${previewSettings.additionalBundle10Price}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="upgrade"
                  value="unlimited"
                  checked={selectedUpgrade === 'unlimited'}
                  onChange={(e) => setSelectedUpgrade(e.target.value as 'unlimited')}
                  className="text-cyan"
                />
                <div className="flex-1">
                  <div className="font-medium">Unlimited Selection</div>
                  <div className="text-sm text-muted-foreground">
                    ${previewSettings.unlimitedBundlePrice}
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setUpgradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-cyan text-white hover:bg-cyan-muted"
                onClick={confirmUpgrade}
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                Upgrade Package
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}