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
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [deletedImages, setDeletedImages] = useState<Set<string>>(new Set());
  
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

  const allPreviewImages = previewResponse?.images || [];
  
  // Filter out deleted images
  const previewImages = allPreviewImages.filter((img: any) => !deletedImages.has(img.filename));
  
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

  const handleDeleteImage = async (imageFilename: string) => {
    if (!confirm(`Are you sure you want to remove "${imageFilename}" from this preview?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    setDeletingImage(imageFilename);
    
    try {
      const response = await apiRequest('DELETE', `/api/preview-images/${shootId}/image/${encodeURIComponent(imageFilename)}`, {
        userEmail
      });
      
      if (response.ok) {
        // Add to deleted images set (optimistic UI update)
        setDeletedImages(prev => new Set(prev).add(imageFilename));
        
        // Close modal if this was the deleted image
        if (selectedImage?.filename === imageFilename) {
          setSelectedImage(null);
        }
        
        // Check if current page will be empty after deletion
        const remainingImagesOnPage = currentPageImages.filter(img => img.filename !== imageFilename);
        if (remainingImagesOnPage.length === 0 && currentPage > 1) {
          // Go to previous page if current page becomes empty
          setTimeout(() => goToPage(currentPage - 1), 100);
        }
        
        // Optional: Show success message
        console.log(`✅ Successfully removed ${imageFilename} from preview`);
        
      } else {
        const error = await response.json();
        alert(`Failed to delete image: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeletingImage(null);
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
            <h1 className="font-semibold text-xl">Select Your Images</h1>
            <div className="flex items-center justify-center gap-4 text-base text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Camera className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{previewImages.length}</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-medium">{favoriteCount}/{previewSettings.selectionLimit}</span>
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                <span className="font-medium">{likeCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{dislikeCount}</span>
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
                {/* Image Container - Click anywhere to open modal */}
                <div 
                  className="mobile-image-container relative cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
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
                  
                  {/* Eye icon for modal - stopPropagation to prevent double trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                    }}
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

      {/* Enhanced Image Modal with Navigation */}
      {selectedImage && (() => {
        const currentIndex = currentPageImages.findIndex((img: any) => img.filename === selectedImage.filename);
        const hasNext = currentIndex < currentPageImages.length - 1 || currentPage < totalPages;
        const hasPrev = currentIndex > 0 || currentPage > 1;
        
        const goToImage = (direction: 'next' | 'prev') => {
          if (direction === 'next') {
            if (currentIndex < currentPageImages.length - 1) {
              setSelectedImage(currentPageImages[currentIndex + 1]);
            } else if (currentPage < totalPages) {
              goToPage(currentPage + 1);
              setTimeout(() => {
                setSelectedImage(previewImages[currentPage * IMAGES_PER_PAGE]);
              }, 100);
            }
          } else {
            if (currentIndex > 0) {
              setSelectedImage(currentPageImages[currentIndex - 1]);
            } else if (currentPage > 1) {
              goToPage(currentPage - 1);
              setTimeout(() => {
                const prevPageLastIndex = (currentPage - 2) * IMAGES_PER_PAGE + IMAGES_PER_PAGE - 1;
                setSelectedImage(previewImages[prevPageLastIndex]);
              }, 100);
            }
          }
        };
        
        const selection = isSelected(selectedImage.filename, 'favorite') ? 'favorite' :
                        isSelected(selectedImage.filename, 'like') ? 'like' :
                        isSelected(selectedImage.filename, 'dislike') ? 'dislike' : 'none';
        
        return (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* ROBUST NAVIGATION TOUCH ZONES - Full coverage with dead zone in middle */}
            {hasPrev && (
              <div 
                className="absolute top-[20%] left-0 w-[35%] h-[60%] z-30 flex items-center justify-start pl-6 cursor-pointer"
                onClick={() => goToImage('prev')}
                aria-label="Previous image"
              >
                {/* Visual indicator - always visible on mobile, enhanced on interaction */}
                <div className="opacity-60 hover:opacity-100 active:opacity-100 active:scale-110 bg-black/70 rounded-full p-2 transition-all duration-200 pointer-events-none shadow-xl border border-white/20">
                  <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
            )}
            
            {hasNext && (
              <div 
                className="absolute top-[20%] right-0 w-[35%] h-[60%] z-30 flex items-center justify-end pr-6 cursor-pointer"
                onClick={() => goToImage('next')}
                aria-label="Next image"
              >
                <div className="opacity-60 hover:opacity-100 active:opacity-100 active:scale-110 bg-black/70 rounded-full p-2 transition-all duration-200 pointer-events-none shadow-xl border border-white/20">
                  <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
            )}
            
            {/* Close Button - Top Right, Enhanced visibility */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-700/90 hover:bg-gray-600 rounded-full flex items-center justify-center shadow-xl transition-all z-50 border border-white/30"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-white font-bold" strokeWidth={2.5} />
            </button>
            
            {/* Image Container - Fills remaining space above control bar */}
            <div className="flex-1 relative flex items-center justify-center p-4 pb-0">              
              {/* Image - Fills available space */}
              <img
                src={selectedImage.fullImageUrl || selectedImage.thumbnailUrl || '/images/logos/slyfox-logo-white.png'}
                alt={selectedImage.filename}
                className="max-w-full max-h-full object-contain"
                style={{
                  // Ensure image doesn't exceed available height
                  maxHeight: 'calc(100vh - 200px)' // Reserve 200px for control bar
                }}
              />
            </div>
            
            {/* Fixed Control Bar - Always at bottom with iOS safe area */}
            <div className="bg-black/95 text-white px-4 pt-3 pb-6 border-t border-white/10" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>              
              {/* Action Buttons - Top row, mobile optimized with larger icons */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                {/* Heart (Favorite) */}
                <button
                  onClick={() => handleSelection(selectedImage.filename, selection === 'favorite' ? 'none' : 'favorite')}
                  className={`h-14 rounded-xl flex items-center justify-center transition-all ${
                    selection === 'favorite'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white'
                  }`}
                  disabled={isUpdating(selectedImage.filename)}
                  title="Add to favorites"
                >
                  <Heart className={`w-6 h-6 ${selection === 'favorite' ? 'fill-white' : ''}`} />
                </button>

                {/* Thumbs Up (Like) */}
                <button
                  onClick={() => handleSelection(selectedImage.filename, selection === 'like' ? 'none' : 'like')}
                  className={`h-14 rounded-xl flex items-center justify-center transition-all ${
                    selection === 'like'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-green-500 hover:text-white'
                  }`}
                  disabled={isUpdating(selectedImage.filename)}
                  title="Like this image"
                >
                  <ThumbsUp className="w-6 h-6" />
                </button>

                {/* Thumbs Down (Dislike) */}
                <button
                  onClick={() => handleSelection(selectedImage.filename, selection === 'dislike' ? 'none' : 'dislike')}
                  className={`h-14 rounded-xl flex items-center justify-center transition-all ${
                    selection === 'dislike'
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-yellow-500 hover:text-white'
                  }`}
                  disabled={isUpdating(selectedImage.filename)}
                  title="Dislike this image"
                >
                  <ThumbsDown className="w-6 h-6" />
                </button>
                
                {/* Trash (Remove) */}
                <button
                  onClick={() => handleDeleteImage(selectedImage.filename)}
                  disabled={deletingImage === selectedImage.filename}
                  className={`h-14 rounded-xl flex items-center justify-center transition-all ${
                    deletingImage === selectedImage.filename
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white'
                  }`}
                  title={deletingImage === selectedImage.filename ? 'Removing...' : 'Remove from preview'}
                >
                  {deletingImage === selectedImage.filename ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Trash2 className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Image Info - Bottom row (near iOS safe area) */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs text-gray-300 truncate">{selectedImage.filename}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                    {selectedImage.metadata && (
                      <span>{(selectedImage.metadata.size / 1024 / 1024).toFixed(1)}MB</span>
                    )}
                    <span>{currentIndex + 1 + (currentPage - 1) * IMAGES_PER_PAGE} / {previewImages.length}</span>
                  </div>
                </div>
              </div>
              
              {/* Global updating indicator */}
              {isUpdating(selectedImage.filename) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    <span className="text-white text-sm">Updating selection...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}