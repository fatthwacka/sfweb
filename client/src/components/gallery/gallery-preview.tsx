import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, Eye } from "lucide-react";
import { ImageUrl } from "@/lib/image-utils";
import type { Image as ImageType, Shoot } from "@shared/schema";

interface GalleryPreviewProps {
  images: ImageType[];
  shoot: Shoot;
  className?: string;
}

export function GalleryPreview({ images, shoot, className = "" }: GalleryPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const visibleImages = images.filter(img => !img.isPrivate);

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : visibleImages.length - 1;
    } else {
      newIndex = currentIndex < visibleImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(visibleImages[newIndex].id);
  };

  // Parse gallery settings from the gallerySettings JSONB field
  const gallerySettings = shoot.gallerySettings as any || {};

  const getBackgroundStyle = () => {
    switch (gallerySettings.backgroundColor || 'white') {
      case 'black': return 'bg-black';
      case 'dark-grey': return 'bg-slate-700';
      default: return 'bg-white';
    }
  };

  const getGridClasses = () => {
    if (gallerySettings.layoutStyle === 'grid') {
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
    return 'columns-2 md:columns-3 lg:columns-4 xl:columns-5'; // Use CSS columns for masonry
  };

  const getGridGap = () => {
    switch (gallerySettings.imageSpacing) {
      case 'tight': return '2px';
      case 'normal': return '8px';
      case 'loose': return '16px';
      default: return '8px'; // default to normal
    }
  };

  const getImageClasses = () => {
    return ''; // Border radius handled via inline styles
  };

  return (
    <div className={`${className}`}>
      {/* Gallery Container */}
      <div className={`${getBackgroundStyle()}`}>
        {gallerySettings.layoutStyle === 'grid' ? (
          /* Square Grid Layout */
          <div 
            className={`grid ${getGridClasses()}`}
            style={{ gap: getGridGap() }}
          >
            {visibleImages.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square group cursor-pointer overflow-hidden ${getImageClasses()}`}
                onClick={() => setSelectedImage(image.id)}
              >
                <img
                  src={ImageUrl.forViewing(image.storagePath)}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        ) : (
          /* Masonry Layout */
          <div 
            className={`${getGridClasses()}`}
            style={{ columnGap: getGridGap() }}
          >
            {visibleImages.map((image, index) => (
              <div
                key={image.id}
                className={`relative group cursor-pointer overflow-hidden break-inside-avoid ${getImageClasses()}`}
                onClick={() => setSelectedImage(image.id)}
                style={{ marginBottom: getGridGap() }}
              >
                <img
                  src={ImageUrl.forViewing(image.storagePath)}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-auto object-cover transition-all duration-300 group-hover:brightness-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {selectedImage !== null && (
        <div className="gallery-modal fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation */}
          {visibleImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                onClick={() => navigateImage('prev')}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                onClick={() => navigateImage('next')}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div className="max-w-full max-h-full p-4">
            {(() => {
              const currentImage = visibleImages.find(img => img.id === selectedImage);
              return currentImage ? (
                <img
                  src={ImageUrl.forViewing(currentImage.storagePath)}
                  alt="Full size gallery image"
                  className="max-w-full max-h-full object-contain"
                />
              ) : null;
            })()}
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 z-10"
              onClick={() => {
                const currentImage = visibleImages.find(img => img.id === selectedImage);
                if (currentImage) {
                  window.open(ImageUrl.forFullSize(currentImage.storagePath), '_blank');
                }
              }}
              title="View Full Resolution"
            >
              <Eye className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 z-10"
              onClick={() => {
                const currentImage = visibleImages.find(img => img.id === selectedImage);
                if (currentImage) {
                  const link = document.createElement('a');
                  link.href = ImageUrl.forFullSize(currentImage.storagePath);
                  link.download = currentImage.filename;
                  link.click();
                }
              }}
              title="Download Original"
            >
              <Download className="w-6 h-6" />
            </Button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {visibleImages.findIndex(img => img.id === selectedImage) + 1} of {visibleImages.length}
          </div>
        </div>
      )}
    </div>
  );
}