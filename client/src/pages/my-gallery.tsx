import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: number;
  url: string;
  title?: string;
  downloadUrl?: string;
  sequence: number;
}

interface GalleryData {
  id: number;
  clientName: string;
  shootType: string;
  shootDate: string;
  location?: string;
  albumCover: string;
  customTitle?: string;
  customSlug: string;
  images: GalleryImage[];
}

// DEPRECATED: This page is no longer used. Use /client-portal for client access.
const demoGallery: GalleryData = {
  id: 1,
  clientName: "DEPRECATED - Use /client-portal",
  shootType: "DEPRECATED",
  shootDate: "2024-06-15",
  location: "DEPRECATED",
  albumCover: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  customTitle: "DEPRECATED - Use /client-portal",
  customSlug: "deprecated",
  images: [
    { id: 1, url: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 1 },
    { id: 2, url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 2 },
    { id: 3, url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 3 },
    { id: 4, url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 4 },
    { id: 5, url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 5 },
    { id: 6, url: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 6 },
    { id: 7, url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 7 },
    { id: 8, url: "https://images.unsplash.com/photo-1529636798458-92182e662485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 8 },
    { id: 9, url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 9 },
    { id: 10, url: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 10 },
    { id: 11, url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 11 },
    { id: 12, url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 12 },
    { id: 13, url: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 13 },
    { id: 14, url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 14 },
    { id: 15, url: "https://images.unsplash.com/photo-1551836022-8b2858c9c69b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 15 },
    { id: 16, url: "https://images.unsplash.com/photo-1594736797933-d0c4c33bd96f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 16 },
    { id: 17, url: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 17 },
    { id: 18, url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 18 },
    { id: 19, url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 19 },
    { id: 20, url: "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 20 },
    { id: 21, url: "https://images.unsplash.com/photo-1511795409834-432f7b3d6e79?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 21 },
    { id: 22, url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 22 },
    { id: 23, url: "https://images.unsplash.com/photo-1543199088-7e8ad230b96a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 23 },
    { id: 24, url: "https://images.unsplash.com/photo-1560472354-81bf77eb9d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 24 },
    { id: 25, url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 25 },
    { id: 26, url: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 26 },
    { id: 27, url: "https://images.unsplash.com/photo-1529636798458-92182e662485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 27 },
    { id: 28, url: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 28 },
    { id: 29, url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 29 },
    { id: 30, url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 30 },
    { id: 31, url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 31 },
    { id: 32, url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 32 },
    { id: 33, url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 33 },
    { id: 34, url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 34 },
    { id: 35, url: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 35 },
    { id: 36, url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 36 },
    { id: 37, url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 37 },
    { id: 38, url: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 38 },
    { id: 39, url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 39 },
    { id: 40, url: "https://images.unsplash.com/photo-1551836022-8b2858c9c69b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", sequence: 40 }
  ]
};

export default function MyGallery() {
  const { slug } = useParams();
  const [gallery] = useState<GalleryData>(demoGallery);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [displayedImages, setDisplayedImages] = useState(20);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Sort images by sequence and limit display
  const sortedImages = gallery.images.sort((a, b) => a.sequence - b.sequence);
  const visibleImages = sortedImages.slice(0, displayedImages);
  const hasMoreImages = displayedImages < sortedImages.length;

  const loadMoreImages = () => {
    setDisplayedImages(prev => Math.min(prev + 20, sortedImages.length));
  };

  const openFullscreen = (imageIndex: number) => {
    setSelectedImage(imageIndex);
  };

  const closeFullscreen = () => {
    setSelectedImage(null);
    setShowDownload(false);
  };

  const nextImage = () => {
    if (selectedImage !== null && selectedImage < visibleImages.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const downloadImage = (imageUrl: string, imageName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!selectedImage) return;
    
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe left - next image
        nextImage();
      } else {
        // Swipe right - previous image
        prevImage();
      }
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      switch (e.key) {
        case 'Escape':
          closeFullscreen();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  // Set page title and meta
  useEffect(() => {
    document.title = gallery.customTitle || `${gallery.clientName} - ${gallery.shootType} | SlyFox Studios`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        `${gallery.clientName}'s ${gallery.shootType} gallery by SlyFox Studios. Professional photography in ${gallery.location || 'Durban'}.`
      );
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    if (ogTitle) ogTitle.setAttribute('content', gallery.customTitle || `${gallery.clientName} - SlyFox Studios`);
    if (ogDescription) ogDescription.setAttribute('content', `${gallery.clientName}'s ${gallery.shootType} gallery`);
    if (ogImage) ogImage.setAttribute('content', gallery.albumCover);

  }, [gallery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Album Cover */}
      <section 
        className="gallery-hero-section relative flex items-center justify-center text-center text-white overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${gallery.albumCover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '70vh'
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="h1-gradient text-5xl lg:text-7xl font-saira font-black mb-6">
            {gallery.clientName}
          </h1>
          <p className="hero-tagline text-2xl lg:text-3xl font-corinthia italic font-light">
            {gallery.shootType}
          </p>
          {gallery.location && (
            <p className="text-xl text-white/80 mt-4 font-barlow">
              {gallery.location} • {new Date(gallery.shootDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="masonry-grid">
            {visibleImages.map((image, index) => (
              <div 
                key={image.id}
                className="masonry-item cursor-pointer group relative overflow-hidden rounded-lg"
                onClick={() => openFullscreen(index)}
              >
                <img
                  src={image.url}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMoreImages && (
            <div className="text-center mt-12">
              <Button 
                onClick={loadMoreImages}
                className="btn-salmon text-lg px-8 py-4"
              >
                Load More Images
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen Modal */}
      {selectedImage !== null && (
        <div className="gallery-modal fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={closeFullscreen}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation Arrows */}
          {selectedImage > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              onClick={prevImage}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {selectedImage < visibleImages.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              onClick={nextImage}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Main Image */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onMouseEnter={() => setShowDownload(true)}
            onMouseLeave={() => setShowDownload(false)}
            onTouchStart={(e) => {
              setShowDownload(true);
              handleTouchStart(e);
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={visibleImages[selectedImage].url}
              alt={`Gallery image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Download Button */}
            {showDownload && (
              <Button
                className="absolute bottom-4 right-4 bg-salmon text-black hover:bg-salmon-muted"
                onClick={() => downloadImage(
                  visibleImages[selectedImage].url, 
                  `${gallery.customSlug}-image-${selectedImage + 1}.jpg`
                )}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {selectedImage + 1} of {visibleImages.length}
          </div>
        </div>
      )}
    </div>
  );
}