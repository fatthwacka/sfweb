import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useOptimisticSelections } from '@/hooks/use-optimistic-selections';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add optimistic updates hook
  const {
    updateSelection: optimisticUpdateSelection,
    getSelectionStatus,
    isPending,
  } = useOptimisticSelections({
    shootId,
    userEmail,
    onError: (imageId, error) => {
      toast({
        title: 'Selection Failed',
        description: 'Your selection couldn\'t be saved. Please try again.',
        variant: 'destructive',
      });
    },
  });

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

  // Pagination logic
  const totalPages = Math.ceil(previewImages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageImages = previewImages.slice(startIndex, endIndex);

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


  // Calculate counts
  const favoriteCount = Object.values(selections).filter(s => s.isFavorite).length;
  const likeCount = Object.values(selections).filter(s => s.status === 'like').length;
  const dislikeCount = Object.values(selections).filter(s => s.status === 'dislike').length;
  const trashCount = Object.values(selections).filter(s => s.status === 'trash').length;

  const handleSelection = (filename: string, selectionType: 'favorite' | 'like' | 'dislike' | 'trash') => {
    const currentSelection = selections[filename];
    
    if (selectionType === 'favorite') {
      // Handle favorite toggle independently
      const wasFavorite = currentSelection?.isFavorite || false;
      const newIsFavorite = !wasFavorite;
      const newStatus = newIsFavorite ? 'favorite' : 'none';
      
      // Update local state immediately for instant feedback
      setSelections(prev => ({
        ...prev,
        [filename]: {
          filename,
          isFavorite: newIsFavorite,
          status: currentSelection?.status || 'none',
        }
      }));
      
      // Use optimistic update for API call - provides instant response with retry logic
      optimisticUpdateSelection(filename, newStatus, filename);
      
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
      
      // Update local state immediately for instant feedback
      setSelections(prev => ({
        ...prev,
        [filename]: {
          filename,
          isFavorite: currentSelection?.isFavorite || false,
          status: finalStatus,
        }
      }));
      
      // Use optimistic update for API call - provides instant response with retry logic
      optimisticUpdateSelection(filename, finalStatus, filename);
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
    <div className="mobile-container">
      {/* Mobile-Optimized Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="mobile-safe-area py-3">
          <div className="text-center">
            <h1 className="font-semibold text-lg">Select Your Images</h1>
            <div className="text-sm text-muted-foreground">
              ❤️ {favoriteCount}/{previewSettings.selectionLimit} selected
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-safe-area py-6 space-y-6">


        {/* Mobile-Optimized Image Grid - Paginated */}
        <div className="mobile-image-grid">
            {currentPageImages.map((image) => (
              <div key={image.filename} className="relative group w-full max-w-full min-w-0 box-border">
                {/* Image Container */}
                <div className="relative aspect-square bg-gray-600 rounded-lg overflow-hidden border-2 border-border hover:border-cyan transition-colors w-full max-w-full">
                  <img
                    src={image.thumbnailUrl || '/images/logos/slyfox-logo-white.png'}
                    alt={image.filename}
                    className="w-full h-full object-cover max-w-full"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image failed to load:', image.filename, image.thumbnailUrl);
                      console.error('Error details:', e);
                    }}
                    onLoad={() => {
                      // Image loaded successfully
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

                {/* Mobile-Optimized Action Buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  {/* Heart (Favorite) - Mobile Touch Friendly */}
                  <button
                    onClick={() => handleSelection(image.filename, 'favorite')}
                    className={`relative mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'favorite')
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : 'bg-gray-500 hover:bg-red-500'
                    }`}
                    title="Top 20 Selected Image"
                  >
                    <Heart className={`w-5 h-5 ${getIconStatus(image.filename, 'favorite') ? 'text-white fill-white' : 'text-gray-300'}`} />
                    {getIconStatus(image.filename, 'favorite') && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-500 text-xs rounded-full flex items-center justify-center font-bold">
                        {favoriteCount}
                      </span>
                    )}
                  </button>

                  {/* Thumbs Up (Like) - Mobile Touch Friendly */}
                  <button
                    onClick={() => handleSelection(image.filename, 'like')}
                    className={`mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'like')
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : 'bg-gray-500 hover:bg-green-500'
                    }`}
                    title="Liked Image"
                  >
                    <ThumbsUp className={`w-5 h-5 ${getIconStatus(image.filename, 'like') ? 'text-white' : 'text-gray-300'}`} />
                  </button>

                  {/* Thumbs Down (Dislike) - Mobile Touch Friendly */}
                  <button
                    onClick={() => handleSelection(image.filename, 'dislike')}
                    className={`mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'dislike')
                        ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                        : 'bg-gray-500 hover:bg-yellow-500'
                    }`}
                    title="Dislike Image"
                  >
                    <ThumbsDown className={`w-5 h-5 ${getIconStatus(image.filename, 'dislike') ? 'text-white' : 'text-gray-300'}`} />
                  </button>

                  {/* Trash (Remove) - Mobile Touch Friendly */}
                  <button
                    onClick={() => handleSelection(image.filename, 'trash')}
                    className={`mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      getIconStatus(image.filename, 'trash')
                        ? 'bg-gray-500 shadow-lg shadow-gray-500/50'
                        : 'bg-gray-500 hover:bg-gray-400'
                    }`}
                    title="Remove Image"
                  >
                    <Trash2 className={`w-5 h-5 ${getIconStatus(image.filename, 'trash') ? 'text-white' : 'text-gray-300'}`} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Mobile Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="mobile-touch-button px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
            >
              ← Previous
            </button>
            
            <div className="text-center">
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, previewImages.length)} of {previewImages.length} images
              </div>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="mobile-touch-button px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
            >
              Next →
            </button>
          </div>
        )}
      </div>

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
    </div>
  );
}