import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Heart,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface PreviewImage {
  filename: string;
  thumbnailUrl?: string;
  fullImageUrl?: string;
  metadata: {
    size: number;
    modified: string;
  };
}

interface ImageSelection {
  filename: string;
  isFavorite: boolean;
  status: 'like' | 'dislike' | 'trash' | 'none';
}

interface ImagePickerProps {
  shootId: string;
  previewSettings: {
    id: string;
    dropboxFolderPath?: string;
    dropboxShareLink?: string;
    selectionLimit: number;
  };
  userEmail: string;
}

export function ImagePicker({ shootId, previewSettings, userEmail }: ImagePickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<PreviewImage | null>(null);
  const [selections, setSelections] = useState<Record<string, ImageSelection>>({});
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // Fetch preview images from Supabase
  const { data: previewResponse, isLoading: imagesLoading, error } = useQuery({
    queryKey: ['/api/preview-images', shootId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/preview-images/${shootId}`);
      return await response.json();
    },
    enabled: !!shootId,
  });

  const previewImages = previewResponse?.images || [];

  // Fetch existing selections from database
  const { data: existingSelections = [] } = useQuery({
    queryKey: ['/api/client-selections', shootId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/client-selections/${shootId}`);
      return await response.json();
    },
    enabled: !!shootId,
  });

  // Initialize selections state from database - SIMPLE VERSION
  useEffect(() => {
    if (existingSelections.length > 0) {
      const selectionsMap: Record<string, ImageSelection> = {};
      existingSelections.forEach((selection: any) => {
        selectionsMap[selection.imageFilename] = {
          filename: selection.imageFilename,
          isFavorite: selection.selectionStatus === 'favorite',
          status: selection.selectionStatus === 'favorite' ? 'none' : selection.selectionStatus,
        };
      });
      setSelections(selectionsMap);
    }
  }, [existingSelections.length]); // Only depend on length

  // Save selection mutation
  const saveSelectionMutation = useMutation({
    mutationFn: async ({ filename, status }: { filename: string; status: string }) => {
      const response = await apiRequest('POST', `/api/client-selections/${shootId}`, {
        imageFilename: filename,
        selectionStatus: status,
        userEmail: userEmail,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Don't invalidate queries - use optimistic updates only to prevent state conflicts
      // queryClient.invalidateQueries({ queryKey: ['/api/client-selections', shootId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save selection',
        variant: 'destructive',
      });
      // On error, we could refetch to restore correct state
      queryClient.invalidateQueries({ queryKey: ['/api/client-selections', shootId] });
    },
  });

  // Calculate counts
  const favoriteCount = Object.values(selections).filter(s => s.isFavorite).length;
  const likeCount = Object.values(selections).filter(s => s.status === 'like').length;
  const dislikeCount = Object.values(selections).filter(s => s.status === 'dislike').length;
  const trashCount = Object.values(selections).filter(s => s.status === 'trash').length;

  const handleSelection = (filename: string, selectionType: 'favorite' | 'like' | 'dislike' | 'trash') => {
    const currentSelection = selections[filename];
    
    console.log('Selection Debug:', {
      filename,
      selectionType,
      currentSelection,
      beforeSelections: Object.keys(selections).length
    });
    
    if (selectionType === 'favorite') {
      // Handle favorite toggle independently
      const wasFavorite = currentSelection?.isFavorite || false;
      const newIsFavorite = !wasFavorite;
      
      setSelections(prev => ({
        ...prev,
        [filename]: {
          filename,
          isFavorite: newIsFavorite,
          status: currentSelection?.status || 'none',
        }
      }));
      
      // Save favorite status to database
      saveSelectionMutation.mutate({ filename, status: newIsFavorite ? 'favorite' : 'none' });
      
      // Check for upsell popup (only for new favorites)
      if (newIsFavorite) {
        const currentFavoriteCount = Object.values(selections).filter(s => s.isFavorite).length;
        const newFavoriteCount = currentFavoriteCount + 1;
        if (newFavoriteCount === previewSettings.selectionLimit) {
          setShowUpsellModal(true);
        }
      }
    } else {
      // Handle like/dislike/trash - these are mutually exclusive but don't affect favorites
      const currentStatus = currentSelection?.status || 'none';
      const finalStatus = currentStatus === selectionType ? 'none' : selectionType;
      
      setSelections(prev => ({
        ...prev,
        [filename]: {
          filename,
          isFavorite: currentSelection?.isFavorite || false,
          status: finalStatus,
        }
      }));
      
      // Save to database
      saveSelectionMutation.mutate({ filename, status: finalStatus });
    }
  };

  const getIconStatus = (filename: string, iconType: string) => {
    const selection = selections[filename];
    if (!selection) return false;
    if (iconType === 'favorite') {
      return selection.isFavorite;
    }
    return selection.status === iconType;
  };

  // Debug logging
  console.log('ImagePicker Debug:', {
    imagesLoading,
    error: error?.message,
    previewImagesCount: previewImages.length,
    firstImageUrl: previewImages[0]?.thumbnailUrl,
    selections: Object.keys(selections).length
  });

  if (imagesLoading) {
    return (
      <Card className="admin-gradient-card">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan mr-3" />
          <span className="text-lg text-cyan">Loading your preview images...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="admin-gradient-card">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h3>
          <p className="text-muted-foreground">
            Could not load preview images. Please contact your photographer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Selection Summary */}
      <Card className="admin-gradient-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Badge className="bg-red-500 text-white flex items-center gap-1">
                <Heart className="w-4 h-4" />
                Top 20: {favoriteCount}
              </Badge>
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                Liked: {likeCount}
              </Badge>
              <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                <ThumbsDown className="w-4 h-4" />
                Disliked: {dislikeCount}
              </Badge>
              <Badge className="bg-gray-500 text-white flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
                Removed: {trashCount}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {previewImages.length} images total
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="admin-gradient-card mb-4">
        <CardContent className="p-4">
          <div className="text-sm text-white">
            <p>Debug: {previewImages.length} images loaded</p>
            {previewImages.length > 0 && (
              <p>First image URL: {previewImages[0].thumbnailUrl}</p>
            )}
            <p>Selections count: {Object.keys(selections).length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Image Grid */}
      <Card className="admin-gradient-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {previewImages.map((image) => (
              <div key={image.filename} className="relative group">
                {/* Image Container */}
                <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-border hover:border-cyan transition-colors">
                  <img
                    src={image.thumbnailUrl || '/images/logos/slyfox-logo-white.png'}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image failed to load:', image.filename, image.thumbnailUrl);
                      console.error('Error details:', e);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', image.filename);
                    }}
                  />
                  
                  {/* Filename overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                    {image.filename}
                  </div>
                  
                  {/* Eye icon for modal */}
                  <button
                    onClick={() => setSelectedImage(image)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Action Icons */}
                <div className="flex justify-center gap-1 mt-2">
                  {/* Heart (Favorite) */}
                  <button
                    onClick={() => handleSelection(image.filename, 'favorite')}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'favorite')
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : 'bg-gray-700 hover:bg-red-500'
                    }`}
                    title="Top 20 Selected Image"
                  >
                    <Heart className={`w-4 h-4 ${getIconStatus(image.filename, 'favorite') ? 'text-white fill-white' : 'text-gray-300'}`} />
                    {getIconStatus(image.filename, 'favorite') && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-red-500 text-xs rounded-full flex items-center justify-center font-bold">
                        {favoriteCount}
                      </span>
                    )}
                  </button>

                  {/* Thumbs Up (Like) */}
                  <button
                    onClick={() => handleSelection(image.filename, 'like')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'like')
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : 'bg-gray-700 hover:bg-green-500'
                    }`}
                    title="Liked Image"
                  >
                    <ThumbsUp className={`w-4 h-4 ${getIconStatus(image.filename, 'like') ? 'text-white' : 'text-gray-300'}`} />
                  </button>

                  {/* Thumbs Down (Dislike) */}
                  <button
                    onClick={() => handleSelection(image.filename, 'dislike')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'dislike')
                        ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                        : 'bg-gray-700 hover:bg-yellow-500'
                    }`}
                    title="Dislike Image"
                  >
                    <ThumbsDown className={`w-4 h-4 ${getIconStatus(image.filename, 'dislike') ? 'text-white' : 'text-gray-300'}`} />
                  </button>

                  {/* Trash (Remove) */}
                  <button
                    onClick={() => handleSelection(image.filename, 'trash')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'trash')
                        ? 'bg-gray-500 shadow-lg shadow-gray-500/50'
                        : 'bg-gray-700 hover:bg-gray-500'
                    }`}
                    title="Remove Image"
                  >
                    <Trash2 className={`w-4 h-4 ${getIconStatus(image.filename, 'trash') ? 'text-white' : 'text-gray-300'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={selectedImage.fullImageUrl || selectedImage.thumbnailUrl || '/images/logos/slyfox-logo-white.png'}
              alt={selectedImage.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
              <h3 className="font-semibold">{selectedImage.filename}</h3>
              <p className="text-sm text-gray-300">
                Size: {(selectedImage.metadata.size / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upsell Modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <Card className="admin-gradient-card max-w-md">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-cyan mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-cyan mb-2">
                Great Selection! 
              </h3>
              <p className="text-muted-foreground mb-4">
                You've selected {previewSettings.selectionLimit} amazing images! 
                Feel free to continue selecting more favorites - our team will 
                contact you to discuss additional options and packages.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowUpsellModal(false)}
                  className="flex-1 bg-cyan text-white hover:bg-cyan/90"
                >
                  Continue Selecting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}