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

// Demo data - will be replaced with API calls
const demoGallery: GalleryData = {
  id: 1,
  clientName: "Sarah & Michael",
  shootType: "Wedding Photography",
  shootDate: "2024-06-15",
  location: "Cape Town",
  albumCover: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  customTitle: "Sarah & Michael's Dream Wedding",
  customSlug: "sarah-michael_SlyFox_wedding_2024-06-15",
  images: [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 1
    },
    {
      id: 2, 
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 2
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 3
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 4
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 5
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 6
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 7
    },
    {
      id: 8,
      url: "https://images.unsplash.com/photo-1529636798458-92182e662485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      sequence: 8
    }
  ]
};

export default function MyGallery() {
  const { slug } = useParams();
  const [gallery] = useState<GalleryData>(demoGallery);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Sort images by sequence
  const sortedImages = gallery.images.sort((a, b) => a.sequence - b.sequence);

  const openFullscreen = (imageIndex: number) => {
    setSelectedImage(imageIndex);
  };

  const closeFullscreen = () => {
    setSelectedImage(null);
    setShowDownload(false);
  };

  const nextImage = () => {
    if (selectedImage !== null && selectedImage < sortedImages.length - 1) {
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
        `${gallery.clientName}'s ${gallery.shootType} gallery by SlyFox Studios. Professional photography in ${gallery.location || 'Cape Town'}.`
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
          <p className="hero-tagline text-2xl lg:text-3xl font-cormorant italic font-light">
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
            {sortedImages.map((image, index) => (
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
        </div>
      </section>

      {/* Fullscreen Modal */}
      {selectedImage !== null && (
        <div className="gallery-modal fixed inset-0 bg-black z-50 flex items-center justify-center">
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

          {selectedImage < sortedImages.length - 1 && (
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
              src={sortedImages[selectedImage].url}
              alt={`Gallery image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Download Button */}
            {showDownload && (
              <Button
                className="absolute bottom-4 right-4 bg-salmon text-black hover:bg-salmon-muted"
                onClick={() => downloadImage(
                  sortedImages[selectedImage].url, 
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
            {selectedImage + 1} of {sortedImages.length}
          </div>
        </div>
      )}
    </div>
  );
}