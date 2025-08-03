import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageUrl } from "@/lib/image-utils";
import { Link } from "wouter";
import { 
  Download, 
  Share2, 
  Calendar, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";

interface Shoot {
  id: string;
  clientId: string;
  title: string;
  description: string;
  shootDate: string;
  location: string;
  notes: string;
  isPrivate: boolean;
  bannerImageId: string | null;
  seoTags: string;
  viewCount: number;
  createdBy: string;
  customSlug: string;
  customTitle: string;
  gallerySettings: {
    padding: string;
    borderStyle: string;
    layoutStyle: string;
    imageSpacing: string;
    backgroundColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Image {
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  originalName: string;
  sequence: number;
  downloadCount: number;
  createdAt: string;
}

export default function ClientGallery({ shootId }: { shootId?: string }) {
  const params = useParams();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [visibleImageCount, setVisibleImageCount] = useState(30);
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const slug = shootId || params.slug;

  // Fetch shoot data directly by slug - this is a public gallery for a single shoot
  const { data: shoot, isLoading: shootLoading, error: shootError } = useQuery<Shoot>({
    queryKey: ["/api/gallery", slug],
    enabled: !!slug
  });

  // Fetch shoot images
  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/shoots", shoot?.id, "images"],
    enabled: !!shoot?.id
  });

  // Modal navigation functions - defined before useEffect
  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalImageIndex(null);
    document.body.style.overflow = 'auto';
  };

  const navigateModal = (direction: 'prev' | 'next') => {
    if (modalImageIndex === null || images.length === 0) return;
    
    if (direction === 'prev') {
      setModalImageIndex(modalImageIndex > 0 ? modalImageIndex - 1 : images.length - 1);
    } else {
      setModalImageIndex(modalImageIndex < images.length - 1 ? modalImageIndex + 1 : 0);
    }
  };

  // Keyboard navigation for modal - moved up to ensure consistent hook order
  useEffect(() => {
    if (modalImageIndex === null) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateModal('prev');
      if (e.key === 'ArrowRight') navigateModal('next');
      if (e.key === 'Escape') closeModal();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [modalImageIndex, images.length]);

  // Navbar hide/show on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY === 0) {
        // At the top, always show navbar
        setNavbarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px, hide navbar
        setNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up, show navbar
        setNavbarVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Share gallery functionality
  const handleShareGallery = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({
        title: "Gallery link copied!",
        description: "Share this link to let others view this gallery.",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy link",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    });
  };

  const handleImageSelect = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Download image function with proper file download
  const downloadImage = async (storagePath: string, filename: string) => {
    try {
      const fullSizeUrl = ImageUrl.forFullSize(storagePath);
      const response = await fetch(fullSizeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate proper filename - use provided name or fallback to shoot-based name
      const downloadFilename = filename && filename !== 'null' 
        ? filename 
        : `${shoot?.title?.replace(/[^a-zA-Z0-9]/g, '-')}-image-${Date.now()}.jpg`;
      
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success toast that auto-dismisses
      toast({
        title: "Download complete",
        description: `${downloadFilename} has been downloaded`,
        duration: 3000, // Auto-dismiss after 3 seconds
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSelected = () => {
    if (selectedImages.size === 0) {
      toast({
        title: "No images selected",
        description: "Please select images to download",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement bulk download functionality
    toast({
      title: "Download started",
      description: `Downloading ${selectedImages.size} images...`
    });
  };

  // Share individual image
  const handleShareImage = (imageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const imageUrl = `${window.location.origin}/gallery/${slug}?image=${imageIndex}`;
    navigator.clipboard.writeText(imageUrl).then(() => {
      toast({
        title: "Image link copied!",
        description: "Share this link to show this specific image.",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy link",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    });
  };

  if (shootLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Simple navbar for loading state */}
        <nav className={`fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 transition-transform duration-300 ${navbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex items-center justify-between h-16 px-6">
            <Link href="/">
              <img src="/images/logos/slyfox-logo-white.png" alt="SlyFox Studios" className="h-8" />
            </Link>
          </div>
        </nav>
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (shootError || !shoot) {
    // Check if it's a private gallery error - TanStack Query wraps fetch errors
    const isPrivateGallery = 
      shootError?.message?.includes('status code 403') || 
      shootError?.message?.includes('403') ||
      (shootError as any)?.response?.status === 403 ||
      (shootError as any)?.status === 403;
    
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Simple navbar for error state */}
        <nav className={`fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 transition-transform duration-300 ${navbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex items-center justify-between h-16 px-6">
            <Link href="/">
              <img src="/images/logos/slyfox-logo-white.png" alt="SlyFox Studios" className="h-8" />
            </Link>
          </div>
        </nav>
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {isPrivateGallery ? (
                <>
                  <h1 className="text-4xl mb-4 text-salmon">Private Gallery</h1>
                  <p className="text-muted-foreground mb-8">
                    Only this album owner may view this gallery.{" "}
                    <Link href="/login" className="text-salmon hover:underline">
                      Login here
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl mb-4">Gallery Not Found</h1>
                  <p className="text-muted-foreground mb-8">This gallery doesn't exist or has been removed.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Apply gallery settings from the shoot  
  const { gallerySettings } = shoot;
  const coverImage = images.find(img => img.id === shoot.bannerImageId);

  // Gallery layout helper functions
  const getGalleryLayoutClasses = () => {
    if (gallerySettings?.layoutStyle === 'masonry') {
      return 'columns-2 md:columns-3 lg:columns-4 xl:columns-5';
    }
    if (gallerySettings?.layoutStyle === 'square') {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
    // Default grid layout
    return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  };

  const getGallerySpacingClasses = () => {
    if (gallerySettings?.imageSpacing === 'tight') {
      return 'gap-1';
    }
    return 'gap-2';
  };

  const getImageHeightClass = () => {
    if (gallerySettings?.layoutStyle === 'masonry') {
      return 'h-auto'; // Let masonry determine height
    }
    if (gallerySettings?.layoutStyle === 'square') {
      return 'aspect-square h-full';
    }
    return 'h-64'; // Default height
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>{shoot.customTitle || shoot.title} | SlyFox Studios</title>
      <meta name="description" content={`View ${shoot.customTitle || shoot.title} gallery by SlyFox Studios. ${shoot.description || 'Professional photography showcasing beautiful moments.'}`} />
      
      {/* Custom Navigation Bar for Gallery */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-sm transition-transform duration-300 ${navbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-[1000px] mx-auto flex items-center justify-between h-16 px-6">
          {/* SlyFox Logo - Left Side */}
          <Link href="/">
            <img src="/images/logos/slyfox-logo-white.png" alt="SlyFox Studios" className="h-8 hover:opacity-80 transition-opacity" />
          </Link>
          
          {/* Location and Date - Center */}
          <div className="flex items-center gap-6 text-sm text-gray-300">
            {shoot.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {shoot.location}
              </div>
            )}
            {shoot.shootDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(shoot.shootDate).toLocaleDateString()}
              </div>
            )}
          </div>
          
          {/* Share Button - Right Side */}
          <Button 
            onClick={handleShareGallery}
            className="bg-salmon text-white p-2 hover:bg-salmon-muted transition-all duration-300"
            title="Share Gallery"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </nav>
      
      {/* Hero Section with Cover Image - 70% height */}
      <section 
        className="relative h-[70vh] bg-gradient-to-br from-black via-charcoal to-black flex items-center"
        style={{
          backgroundColor: gallerySettings.backgroundColor || '#1a1a1a',
          ...(coverImage && {
            backgroundImage: `url(${ImageUrl.forFullSize(coverImage.storagePath)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="text-5xl lg:text-6xl mb-6 text-white">
            {shoot.customTitle || shoot.title}
          </h1>
          {shoot.description && (
            <p className="text-4xl text-gray-200 max-w-3xl mx-auto mb-4 font-corinthia">
              {shoot.description}
            </p>
          )}
        </div>
      </section>

      {/* Image Gallery Section - Full Width */}
      <section 
        className="py-8" 
        style={{ backgroundColor: gallerySettings.backgroundColor || 'transparent' }}
      >
        <div className="px-4 max-w-none w-full">
          {imagesLoading ? (
            <div className={`${getGalleryLayoutClasses()} ${getGallerySpacingClasses()}`}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-800 rounded"></div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">No images found in this gallery.</p>
            </div>
          ) : (
            <div className={`${getGalleryLayoutClasses()} ${getGallerySpacingClasses()}`}>
              {images.slice(0, visibleImageCount)
                .sort((a, b) => a.sequence - b.sequence)
                .map((image, visibleIndex) => {
                  // Find the actual index in the full sorted images array
                  const sortedImages = images.sort((a, b) => a.sequence - b.sequence);
                  const actualIndex = sortedImages.findIndex(img => img.id === image.id);
                  
                  return (
                    <div
                      key={image.id}
                      className={`
                        relative group overflow-hidden
                        ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-lg'}
                        ${selectedImages.has(image.id) ? 'ring-2 ring-salmon' : ''}
                        ${gallerySettings?.layoutStyle === 'masonry' ? 'break-inside-avoid mb-2' : ''}
                        ${gallerySettings?.layoutStyle === 'square' ? 'aspect-square' : ''}
                        cursor-pointer transition-all duration-200
                      `}
                      onClick={() => openModal(actualIndex)}
                  >
                    <img
                      src={ImageUrl.forViewing(image.storagePath)}
                      alt={image.filename}
                      className={`w-full object-cover ${getImageHeightClass()} transition-all duration-200 group-hover:brightness-90`}
                      loading="lazy"
                    />
                    
                    {/* Selection indicator */}
                    {selectedImages.has(image.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-salmon rounded-full flex items-center justify-center z-10">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Hover overlay with buttons at bottom */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image.storagePath, image.originalName);
                          }}
                          className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                          title="Download Image"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => handleShareImage(actualIndex, e)}
                          className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                          title="Share Image"
                        >
                          <Share2 className="w-4 h-4 text-white" />
                        </button>
                        <a
                          href={ImageUrl.forFullSize(image.storagePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                          title="View Full Resolution"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>
                )})}
            </div>
          )}

          {/* Load More Button */}
          {visibleImageCount < images.length && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setVisibleImageCount(prev => Math.min(prev + 30, images.length))}
                variant="outline"
                className="border-salmon text-salmon hover:bg-salmon hover:text-white"
              >
                Load More ({images.length - visibleImageCount} remaining)
              </Button>
            </div>
          )}

          {/* Download Selected Button */}
          {selectedImages.size > 0 && (
            <div className="fixed bottom-6 right-6 z-40">
              <Button
                onClick={handleDownloadSelected}
                className="bg-salmon text-white hover:bg-salmon-muted shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Selected ({selectedImages.size})
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Image Modal */}
      {modalImageIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          <button
            onClick={() => navigateModal('prev')}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => navigateModal('next')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Modal image - uses transformed URL for faster loading */}
          <div className="max-w-screen-lg max-h-screen p-4 flex items-center justify-center">
            <img
              src={ImageUrl.forViewing(images[modalImageIndex]?.storagePath)}
              alt={images[modalImageIndex]?.filename}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Image info bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
            <span>{modalImageIndex + 1} of {images.length}</span>
            <span>•</span>
            <span>{images[modalImageIndex]?.originalName}</span>
            <span>•</span>
            <button
              onClick={() => downloadImage(images[modalImageIndex]?.storagePath, images[modalImageIndex]?.originalName)}
              className="hover:text-salmon transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}