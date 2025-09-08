import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useSimpleSelections } from '@/hooks/use-simple-selections';
import { 
  Heart,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Eye,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';

interface ImagePickerFastProps {
  shootId: string;
  previewSettings: {
    id: string;
    selectionLimit: number;
  };
  userEmail: string;
}

export function ImagePickerFast({ shootId, previewSettings, userEmail }: ImagePickerFastProps) {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const IMAGES_PER_PAGE = 40;
  
  // Fetch preview images
  const { data: previewResponse, isLoading: imagesLoading, error } = useQuery({
    queryKey: ['/api/preview-images', shootId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/preview-images/${shootId}`);
      return await response.json();
    },
    enabled: !!shootId,
  });

  const previewImages = previewResponse?.images || [];
  
  // Pagination calculations
  const totalPages = Math.ceil(previewImages.length / IMAGES_PER_PAGE);
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const currentPageImages = previewImages.slice(startIndex, endIndex);
  
  // Pagination handler
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Use the SIMPLE selections hook - no complex state management
  const {
    selections,
    isLoading: selectionsLoading,
    isUpdating,
    favoriteCount,
    likeCount,
    dislikeCount,
    updateSelection,
    clearAllSelections,
    isSelected,
  } = useSimpleSelections({ shootId, userEmail });

  const handleSelection = (filename: string, action: 'favorite' | 'like' | 'dislike' | 'none') => {
    // Check favorite limit
    if (action === 'favorite' && favoriteCount >= previewSettings.selectionLimit && !isSelected(filename, 'favorite')) {
      // Simple limit message - no complex popup
      alert(`You can only select ${previewSettings.selectionLimit} favorite images`);
      return;
    }
    
    // Simple update call - no batching, no page management
    updateSelection(filename, action);
  };

  const handleClearAll = async () => {
    if (confirm('Clear all selections? This cannot be undone.')) {
      await clearAllSelections();
      setShowClearDialog(false);
    }
  };

  // Simplified Pagination Component
  const PaginationControls = () => (
    <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border border-transparent rounded-lg">
      {/* Left Arrow */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      {/* Page Indicator */}
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      
      {/* Right Arrow */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );

  if (imagesLoading || selectionsLoading) {
    return (
      <Card className="admin-gradient-card">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan mr-3" />
          <span className="text-lg text-cyan">Loading images...</span>
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
            Could not load preview images. Please refresh and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mobile-container">
      {/* Simple Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="mobile-safe-area py-3">
          <div className="text-center">
            <h1 className="font-semibold text-lg">Select Your Images</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Camera className="w-4 h-4 text-blue-500" />
                {previewImages.length}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                {favoriteCount}/{previewSettings.selectionLimit}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                {likeCount}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-4 h-4 text-yellow-500" />
                {dislikeCount}
              </span>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                title="Clear all selections"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-safe-area py-6 space-y-6">
        {/* Top Pagination Controls */}
        {totalPages > 1 && <PaginationControls />}
        
        {/* Image Grid - WITH PAGINATION */}
        <div className="mobile-image-grid">
          {currentPageImages.map((image: any) => {
            const selection = isSelected(image.filename, 'favorite') ? 'favorite' :
                            isSelected(image.filename, 'like') ? 'like' :
                            isSelected(image.filename, 'dislike') ? 'dislike' : 'none';
            
            return (
              <div key={image.filename} className="mobile-image-item">
                {/* Image Container */}
                <div className="mobile-image-container relative">
                  <img
                    src={image.thumbnailUrl || '/images/logos/slyfox-logo-white.png'}
                    alt={image.filename}
                    className="mobile-image"
                    loading="lazy"
                  />
                  
                  {/* Filename overlay */}
                  <div className="mobile-image-filename">
                    {image.filename}
                  </div>
                  
                  {/* Eye icon for modal */}
                  <button
                    onClick={() => setSelectedImage(image)}
                    className="mobile-image-view-btn"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  
                  {/* Show updating spinner */}
                  {isUpdating(image.filename) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Simple Action Buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  {/* Heart (Favorite) */}
                  <button
                    onClick={() => handleSelection(image.filename, selection === 'favorite' ? 'none' : 'favorite')}
                    className={`mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      selection === 'favorite'
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : 'bg-gray-500 hover:bg-red-500'
                    }`}
                    disabled={isUpdating(image.filename)}
                    title="Favorite (counts toward limit)"
                  >
                    <Heart className={`w-4 h-4 ${selection === 'favorite' ? 'text-white fill-white' : 'text-gray-300'}`} />
                  </button>

                  {/* Thumbs Up (Like) */}
                  <button
                    onClick={() => handleSelection(image.filename, selection === 'like' ? 'none' : 'like')}
                    className={`mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      selection === 'like'
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : 'bg-gray-500 hover:bg-green-500'
                    }`}
                    disabled={isUpdating(image.filename)}
                    title="Like"
                  >
                    <ThumbsUp className={`w-4 h-4 ${selection === 'like' ? 'text-white' : 'text-gray-300'}`} />
                  </button>

                  {/* Thumbs Down (Dislike) */}
                  <button
                    onClick={() => handleSelection(image.filename, selection === 'dislike' ? 'none' : 'dislike')}
                    className={`mobile-touch-button rounded-full flex items-center justify-center transition-all ${
                      selection === 'dislike'
                        ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                        : 'bg-gray-500 hover:bg-yellow-500'
                    }`}
                    disabled={isUpdating(image.filename)}
                    title="Dislike"
                  >
                    <ThumbsDown className={`w-4 h-4 ${selection === 'dislike' ? 'text-white' : 'text-gray-300'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bottom Pagination Controls */}
        {totalPages > 1 && <PaginationControls />}
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
              {selectedImage.metadata && (
                <p className="text-sm text-gray-300">
                  Size: {(selectedImage.metadata.size / 1024 / 1024).toFixed(1)}MB
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}