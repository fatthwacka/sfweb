import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSiteConfig } from "@/hooks/use-site-config";
import { ImageUrl } from "@/lib/image-utils";
import { Camera, ChevronLeft, ChevronRight, X, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getImagesByCategory, getNextImageBatch, formatClassification, type CategoryKey } from "@/lib/classification-utils";
import type { Image } from "@shared/schema";

interface CategoryFeaturedGridProps {
  categoryKey: CategoryKey;  // 'weddings' | 'portraits' | 'corporate' | 'events' | 'products' | 'graduation'
  imageCount?: number;       // Default: 6
}

export function CategoryFeaturedGrid({ 
  categoryKey, 
  imageCount = 6 
}: CategoryFeaturedGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [displayedImages, setDisplayedImages] = useState<Image[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const [previousBatch, setPreviousBatch] = useState<Image[]>([]);
  
  // Get styling config from SAME place as homepage portfolio
  const { config } = useSiteConfig();
  const styleSettings = config?.portfolio?.featured;
  
  // Query featured images from Supabase
  const { data: featuredImages, isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images/featured'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Filter images by category using clumping logic
  const allCategoryImages = useMemo(() => {
    if (!featuredImages) return [];
    
    return getImagesByCategory(categoryKey, featuredImages);
  }, [featuredImages, categoryKey]);
  
  // Set initial displayed images
  useEffect(() => {
    if (allCategoryImages.length > 0 && displayedImages.length === 0) {
      const initial = getNextImageBatch(allCategoryImages, 0, imageCount, []);
      setDisplayedImages(initial.images);
      setCurrentPage(0);
      setRenderKey(0);
      setPreviousBatch([]);
    }
  }, [allCategoryImages, imageCount, displayedImages.length]);
  
  // Check if there are more images to load (always true unless < imageCount total)
  const hasMoreImages = allCategoryImages.length >= imageCount;
  
  // Modal navigation functions
  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % displayedImages.length);
  }, [displayedImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + displayedImages.length) % displayedImages.length);
  }, [displayedImages.length]);

  // Load more images function - swap to next page of exactly 6 images
  const loadMoreImages = useCallback(() => {
    if (!hasMoreImages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Store current batch as previous batch for anti-repetition
    const currentBatch = [...displayedImages];
    
    // Get next page of exactly imageCount images with aggressive shuffle
    const nextPageNum = currentPage + 1;
    const result = getNextImageBatch(allCategoryImages, nextPageNum, imageCount, currentBatch);
    
    setTimeout(() => {
      setPreviousBatch(currentBatch); // Remember previous batch
      setDisplayedImages(result.images); // Replace with exactly imageCount images
      setCurrentPage(result.nextPage);
      setCurrentImageIndex(0); // Reset modal index for new batch
      setRenderKey(prev => prev + 1); // Force complete re-render
      setIsLoadingMore(false);
    }, 300); // Small delay for loading effect
  }, [hasMoreImages, isLoadingMore, allCategoryImages, currentPage, imageCount]);

  // Keyboard navigation
  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          setModalOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, nextImage, prevImage]);

  const currentImage = displayedImages[currentImageIndex];
  
  // Get aspect ratio class based on layout style (inherited from homepage)
  const getAspectRatioClass = () => {
    switch (styleSettings?.layoutStyle) {
      case 'portrait':
        return 'aspect-[2/3]';
      case 'instagram':
        return 'aspect-[4/5]';
      case 'square':
      default:
        return 'aspect-square';
    }
  };
  
  // Grid styling (inherited from homepage)
  const gridStyles = {
    gap: `${styleSettings?.imagePadding || 2}px`,
  };
  
  // Image styling (inherited from homepage)
  const imageStyles = {
    borderRadius: `${styleSettings?.borderRadius || 8}px`,
  };
  
  // Border styling (inherited from homepage)
  const getBorderStyles = () => {
    if (!styleSettings?.borderThickness) {
      return null;
    }
    
    return {
      background: `linear-gradient(135deg, ${styleSettings.borderColor || '#ffffff'} 0%, ${styleSettings.borderColorEnd || '#cccccc'} 100%)`,
      padding: `${styleSettings.borderThickness}px`,
      borderRadius: `${styleSettings.borderRadius || 8}px`,
    };
  };
  
  const borderStyles = getBorderStyles();
  const aspectRatioClass = getAspectRatioClass();
  
  if (isLoading) {
    // Loading skeleton - 6 items in 3x2 grid
    return (
      <div className="grid grid-cols-2 md:grid-cols-3" style={gridStyles}>
        {Array.from({ length: imageCount }).map((_, i) => (
          <div key={i} className="animate-pulse">
            {borderStyles ? (
              <div style={borderStyles}>
                <div 
                  className={`bg-gray-800/50 ${aspectRatioClass}`}
                  style={imageStyles}
                ></div>
              </div>
            ) : (
              <div 
                className={`bg-gray-800/50 ${aspectRatioClass}`}
                style={imageStyles}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  if (!displayedImages || displayedImages.length === 0) {
    // No images fallback
    return (
      <div className="text-center py-12">
        <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No {categoryKey} images available</p>
      </div>
    );
  }
  
  // Render the image grid with modal
  return (
    <>
      <div className="relative">
        {/* Load More Arrow - positioned above top-right image */}
        {hasMoreImages && (
          <Button
            onClick={loadMoreImages}
            disabled={isLoadingMore}
            className="absolute -top-12 right-0 z-10 w-8 h-8 p-0 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 hover:scale-110"
            title="Load more images"
          >
            {isLoadingMore ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3" style={gridStyles}>
          {displayedImages.map((image, index) => (
            <div key={`${renderKey}-${image.id}-${index}`} className="group cursor-pointer" onClick={() => openModal(index)}>
            {borderStyles ? (
              <div style={borderStyles}>
                <div 
                  className={`relative overflow-hidden ${aspectRatioClass} shadow-lg hover:shadow-2xl transition-all duration-300`}
                  style={imageStyles}
                >
                  <img 
                    src={ImageUrl.forViewing(image.storagePath)} 
                    alt={image.filename} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="text-left p-4 w-full">
                      <p className="text-gray-200 text-sm lg:text-base">
                        {formatClassification(image.classification)} Photography
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className={`relative overflow-hidden ${aspectRatioClass} shadow-lg hover:shadow-2xl transition-all duration-300`}
                style={imageStyles}
              >
                <img 
                  src={ImageUrl.forViewing(image.storagePath)} 
                  alt={image.filename} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="text-left p-4 w-full">
                    <p className="text-gray-200 text-sm lg:text-base">
                      {formatClassification(image.classification)} Photography
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Image Modal with Enhanced Navigation */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogTitle className="sr-only">
          {currentImage ? `Viewing ${categoryKey} - ${currentImage.filename}` : 'Image Gallery'}
        </DialogTitle>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 border-none bg-black/95" aria-describedby="image-modal-description">
          <div className="relative h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => setModalOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Previous Navigation Zone - Full height clickable area */}
          {displayedImages.length > 1 && (
            <div
              className="absolute left-0 top-0 bottom-0 w-20 z-50 flex items-center justify-start pl-4 bg-gradient-to-r from-black/20 to-transparent hover:from-black/40 cursor-pointer transition-all duration-200 group"
              onClick={prevImage}
              aria-label="Previous image"
            >
              <div className="bg-white/10 group-hover:bg-white/20 rounded-full p-2 transition-all duration-200">
                <ChevronLeft className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Next Navigation Zone - Full height clickable area */}
          {displayedImages.length > 1 && (
            <div
              className="absolute right-0 top-0 bottom-0 w-20 z-50 flex items-center justify-end pr-4 bg-gradient-to-l from-black/20 to-transparent hover:from-black/40 cursor-pointer transition-all duration-200 group"
              onClick={nextImage}
              aria-label="Next image"
            >
              <div className="bg-white/10 group-hover:bg-white/20 rounded-full p-2 transition-all duration-200">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Image Display */}
          {currentImage && (
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <img
                src={ImageUrl.forModal(currentImage.storagePath)}
                alt={currentImage.filename}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Image Info Overlay */}
              <div id="image-modal-description" className="absolute bottom-8 left-8 right-8 bg-black/70 text-white p-4 rounded-lg">
                <h3 className="text-xl font-bold text-salmon mb-2">
                  {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)} Photography
                </h3>
                <p className="text-gray-300">
                  {formatClassification(currentImage.classification)} Photography
                </p>
                {displayedImages.length > 1 && (
                  <p className="text-sm text-gray-400 mt-2">
                    {currentImageIndex + 1} of {displayedImages.length}
                  </p>
                )}
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}