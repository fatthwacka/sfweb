import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Camera,
  HelpCircle,
  Send,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Wand2
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
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

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    
    try {
      // Get all selections organized by type
      const favorites: string[] = [];
      const likes: string[] = [];
      const dislikes: string[] = [];
      
      Object.entries(selections).forEach(([filename, selection]) => {
        if (selection.action === 'favorite') {
          favorites.push(filename);
        } else if (selection.action === 'like') {
          likes.push(filename);
        } else if (selection.action === 'dislike') {
          dislikes.push(filename);
        }
      });

      // Send to API
      const response = await apiRequest('POST', `/api/selections/${shootId}/submit`, {
        userEmail,
        favorites,
        likes,
        dislikes,
        totalImages: previewImages.length
      });

      if (response.ok) {
        // Mark the preview as submitted in the database
        await apiRequest('PATCH', `/api/shoots/${shootId}/preview-settings`, {
          submission_completed: true,
          submission_completed_at: new Date().toISOString(),
          submission_completed_by: userEmail
        });
        
        setHasSubmitted(true);
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          // Reload the page to update the UI
          window.location.reload();
        }, 3000);
      } else {
        const error = await response.json();
        alert(`Failed to submit selection: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit selection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSelection = () => {
    if (favoriteCount === 0 && likeCount === 0 && dislikeCount === 0) {
      alert('Please select at least one image before submitting');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
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
      {/* Enhanced Header with proper mobile spacing */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b mt-4 md:mt-0">
        <div className="mobile-safe-area py-3">
          <div className="text-center">
            <h1 className="font-semibold text-xl mb-3">Select Your Images</h1>
            
            {/* Buttons Row - Top */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                title="Clear all selections"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
                title="How to use"
              >
                <HelpCircle className="w-3 h-3" />
                Help
              </button>
              <button
                onClick={handleSubmitSelection}
                disabled={isSubmitting || (favoriteCount === 0 && likeCount === 0 && dislikeCount === 0)}
                className={`flex items-center gap-1 px-3 py-1 text-white text-xs rounded-md transition-colors ${
                  isSubmitting || (favoriteCount === 0 && likeCount === 0 && dislikeCount === 0)
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title="Submit your selection to the photographer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Submit Selection
                  </>
                )}
              </button>
            </div>
            
            {/* Statistics Row - Bottom */}
            <div className="flex items-center justify-center gap-4 text-base text-muted-foreground">
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
            
            {/* Close Button - Safely positioned below navigation */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-24 right-4 w-10 h-10 bg-gray-700/90 hover:bg-gray-600 rounded-full flex items-center justify-center shadow-xl transition-all z-50 border border-white/30"
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

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-salmon flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  How to Guide
                </h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-cyan mb-2">Buttons</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <RotateCcw className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Clear:</strong> Reset all your selections to start over.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Send className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Submit:</strong> Finalise and send your choices for editing.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Help:</strong> Opens this guide.</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-cyan mb-2">Selection Options</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Heart className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Heart (Favourite):</strong> Your final picks for professional editing. The number of edits is limited by your package (default: {previewSettings.selectionLimit}). If you want more, select them anyway—your photographer will contact you about upgrading.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ThumbsUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Thumbs Up (Like):</strong> Shortlist your favourites before making final Heart selections.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ThumbsDown className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Thumbs Down (Dislike):</strong> Mark the ones you don't want. This also helps guide your photographer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Trash Can (Remove):</strong> Permanently delete an image from your album (only available in full-screen view).</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-cyan mb-2">The Process</h3>
                  <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                    <li><strong>Select:</strong> Review and mark your choices.</li>
                    <li><strong>Submit:</strong> Send your final selections to your photographer.</li>
                    <li><strong>Pro Album:</strong> Your selected images will be professionally edited. You'll get an email when your gallery is ready.</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold text-cyan mb-2">How to Browse and Select</h3>
                  <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>Browse your images in grid view.</li>
                    <li>Click an image or the eye icon to open full size.</li>
                    <li>Mark images with Heart, Like, or Dislike.</li>
                    <li>Change your mind anytime—click a different button or click the same button again to clear.</li>
                    <li>Use arrows in full-screen view to move between images.</li>
                  </ol>
                </div>
                
                <div className="bg-cyan/10 p-3 rounded-lg">
                  <p className="text-cyan text-xs">
                    <strong>Tip:</strong> You can revisit and adjust your selections as often as you like, until you hit Submit. Once submitted, the preview album closes and pro-editing begins!
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowHelpModal(false)}
                  className="bg-salmon text-white hover:bg-salmon-muted"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 border-purple-600 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Ready to Begin the Magic?
            </DialogTitle>
            <DialogDescription className="text-gray-200 space-y-3 pt-4">
              <p className="text-base">
                🎨 <strong>Your professional album processing is about to begin!</strong>
              </p>
              <p>
                You've selected <span className="text-cyan font-semibold">{favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''}</span>
                {likeCount > 0 && <span>, <span className="text-green-400 font-semibold">{likeCount} like{likeCount !== 1 ? 's' : ''}</span></span>}
                {dislikeCount > 0 && <span>, and <span className="text-yellow-400 font-semibold">{dislikeCount} dislike{dislikeCount !== 1 ? 's' : ''}</span></span>}.
              </p>
              <div className="bg-purple-950/50 p-3 rounded-lg border border-purple-600/50">
                <p className="flex items-start gap-2">
                  <Wand2 className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    <strong>Important:</strong> Once submitted, your selection will be final and you won't be able to change it. Your photographer will begin the professional editing process immediately.
                  </span>
                </p>
              </div>
              <p className="text-sm text-gray-300 italic">
                The artistic transformation of your memories is about to begin...
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 bg-transparent border-gray-400 text-gray-200 hover:bg-purple-800/50"
            >
              Review Again
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-green-500 text-white hover:from-cyan-600 hover:to-green-600 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Selection
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 max-w-md animate-slide-in-right">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">Selection Submitted!</h3>
            <p className="text-sm">Thank you for confirming your selection. Your photographer will begin professional edits on your images.</p>
          </div>
        </div>
      )}
    </div>
  );
}