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
  Eye,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Shoot {
  id: string;
  clientId: string;
  title: string;
  description: string;
  shootType: string;
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
    layoutStyle: string;
    backgroundColor: string;
    borderRadius?: number;
    imageSpacingValue?: number;
    navbarPosition?: string;
    coverPicSize?: number;
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
  const {
    data: shoot,
    isLoading: shootLoading,
    error: shootError,
  } = useQuery<Shoot>({
    queryKey: ["/api/gallery", slug],
    enabled: !!slug,
  });

  // Fetch shoot images
  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/shoots", shoot?.id, "images"],
    enabled: !!shoot?.id,
  });

  // Fetch all shoots for the same client to enable next/previous album navigation
  const { data: clientShoots = [] } = useQuery({
    queryKey: ["/api/shoots", "client", shoot?.clientId],
    enabled: !!shoot?.clientId,
  });

  // Modal navigation functions - defined before useEffect
  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalImageIndex(null);
    document.body.style.overflow = "auto";
  };

  const navigateModal = (direction: "prev" | "next") => {
    if (modalImageIndex === null || images.length === 0) return;

    if (direction === "prev") {
      setModalImageIndex(
        modalImageIndex > 0 ? modalImageIndex - 1 : images.length - 1,
      );
    } else {
      setModalImageIndex(
        modalImageIndex < images.length - 1 ? modalImageIndex + 1 : 0,
      );
    }
  };

  // Keyboard navigation for modal - moved up to ensure consistent hook order
  useEffect(() => {
    if (modalImageIndex === null) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateModal("prev");
      if (e.key === "ArrowRight") navigateModal("next");
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Share gallery functionality
  const handleShareGallery = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        toast({
          title: "Gallery link copied!",
          description: "Share this link to let others view this gallery.",
        });
      })
      .catch(() => {
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
      const link = document.createElement("a");
      link.href = url;

      // Generate proper filename - use provided name or fallback to shoot-based name
      const downloadFilename =
        filename && filename !== "null"
          ? filename
          : `${shoot?.title?.replace(/[^a-zA-Z0-9]/g, "-")}-image-${Date.now()}.jpg`;

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
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement bulk download functionality
    toast({
      title: "Download started",
      description: `Downloading ${selectedImages.size} images...`,
    });
  };

  // Share individual image
  const handleShareImage = (imageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const imageUrl = `${window.location.origin}/gallery/${slug}?image=${imageIndex}`;
    navigator.clipboard
      .writeText(imageUrl)
      .then(() => {
        toast({
          title: "Image link copied!",
          description: "Share this link to show this specific image.",
        });
      })
      .catch(() => {
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
        <nav
          className={`fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 transition-transform duration-300 ${navbarVisible ? "translate-y-0" : "-translate-y-full"}`}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <Link href="/">
              <img
                src="/images/logos/slyfox-logo-white.png"
                alt="SlyFox Studios"
                className="h-8"
              />
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
      shootError?.message?.includes("status code 403") ||
      shootError?.message?.includes("403") ||
      (shootError as any)?.response?.status === 403 ||
      (shootError as any)?.status === 403;

    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Simple navbar for error state */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 transition-transform duration-300 ${navbarVisible ? "translate-y-0" : "-translate-y-full"}`}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <Link href="/">
              <img
                src="/images/logos/slyfox-logo-white.png"
                alt="SlyFox Studios"
                className="h-8"
              />
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
                  <p className="text-muted-foreground mb-8">
                    This gallery doesn't exist or has been removed.
                  </p>
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
  const coverImage = images.find((img) => img.id === shoot.bannerImageId);

  // Gallery layout helper functions
  const getGalleryLayoutClasses = () => {
    const layoutStyle = gallerySettings?.layoutStyle || 'automatic';
    
    switch (layoutStyle) {
      case 'masonry':
        return "gallery-grid-masonry";
      case 'square':
        return "grid gallery-grid-square";
      case 'portrait':
      case 'landscape':
      case 'instagram':
      case 'upright':
      case 'wide':
        return "grid gallery-grid-square"; // Use standard grid for aspect ratio layouts
      case 'automatic':
      default:
        // For automatic mode, use masonry as default until images load and determine aspect ratio
        return "gallery-grid-masonry";
    }
  };

  // Removed getGalleryPaddingClasses - using imageSpacingValue directly

  const getSpacingStyle = () => {
    const spacing = gallerySettings?.imageSpacingValue !== undefined ? gallerySettings.imageSpacingValue : 8;
    return `${spacing}px`;
  };

  const getBackgroundStyle = () => {
    return { backgroundColor: gallerySettings?.backgroundColor || '#ffffff' };
  };

  const getBorderStyle = () => {
    const radius = gallerySettings?.borderRadius !== undefined ? gallerySettings.borderRadius : 8;
    return { borderRadius: `${radius}px` };
  };

  const getImageClasses = () => {
    const layoutStyle = gallerySettings?.layoutStyle || 'automatic';
    if (layoutStyle === 'masonry' || layoutStyle === 'automatic') {
      return 'gallery-image overflow-hidden gallery-masonry-item gallery-image-auto';
    } else {
      return 'gallery-image overflow-hidden gallery-image-square';
    }
  };

  const getAspectRatioClass = () => {
    const layoutStyle = gallerySettings?.layoutStyle || 'automatic';
    
    switch (layoutStyle) {
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[2/3]';
      case 'landscape': return 'aspect-[3/2]';
      case 'instagram': return 'aspect-[4/5]';
      case 'upright': return 'aspect-[9/16]';
      case 'wide': return 'aspect-[16/9]';
      case 'masonry': return ''; // No fixed aspect ratio for masonry
      case 'automatic':
      default:
        return ''; // Let masonry handle natural ratios
    }
  };

  // Get navbar positioning classes and styles based on gallery settings
  const getNavbarPositioning = () => {
    const position = shoot?.gallerySettings?.navbarPosition || 'top-left';
    const coverSize = shoot?.gallerySettings?.coverPicSize || 80;
    
    switch (position) {
      case 'top-left':
        return { 
          classes: 'top-4 left-4',
          styles: {}
        };
      case 'top-center':
        return { 
          classes: 'top-4 left-1/2 -translate-x-1/2',
          styles: {}
        };
      case 'top-right':
        return { 
          classes: 'top-4 right-4',
          styles: {}
        };
      case 'center':
        return { 
          classes: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          styles: {}
        };
      case 'bottom-left':
        return { 
          classes: 'left-4',
          styles: {
            bottom: `calc(100vh - ${coverSize}vh + 1rem)`
          }
        };
      case 'bottom-right':
        return { 
          classes: 'right-4',
          styles: {
            bottom: `calc(100vh - ${coverSize}vh + 1rem)`
          }
        };
      default:
        return { 
          classes: 'top-4 left-4',
          styles: {}
        };
    }
  };

  // Get cover pic size (default to 80vh)
  const getCoverPicSize = () => {
    const size = shoot?.gallerySettings?.coverPicSize !== undefined ? shoot?.gallerySettings?.coverPicSize : 80;
    return `${size}vh`;
  };

  const getCoverImageAlignment = () => {
    const alignment = shoot?.gallerySettings?.coverPicAlignment || 'top';
    
    switch (alignment) {
      case 'top': return 'center top';
      case 'centre': return 'center center'; // British spelling from admin panel
      case 'center': return 'center center'; // American spelling fallback
      case 'bottom': return 'center bottom'; 
      default: return 'center top';
    }
  };

  // Get navigation for previous/next albums
  const getCurrentShootIndex = () => {
    return clientShoots.findIndex((s: any) => s.id === shoot.id);
  };

  const getPreviousShoot = () => {
    const currentIndex = getCurrentShootIndex();
    return currentIndex > 0 ? clientShoots[currentIndex - 1] : null;
  };

  const getNextShoot = () => {
    const currentIndex = getCurrentShootIndex();
    return currentIndex < clientShoots.length - 1
      ? clientShoots[currentIndex + 1]
      : null;
  };

  const previousShoot = getPreviousShoot();
  const nextShoot = getNextShoot();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>{shoot.customTitle || shoot.title} | SlyFox Studios</title>
      <meta
        name="description"
        content={`View ${shoot.customTitle || shoot.title} gallery by SlyFox Studios. ${shoot.description || "Professional photography showcasing beautiful moments."}`}
      />

      {/* Custom Navigation Bar for Gallery */}
      <nav
        className={`fixed ${getNavbarPositioning().classes} z-50 transition-all duration-300 ${navbarVisible ? "" : "opacity-0"}`}
        style={{ 
          margin: "30px",
          opacity: navbarVisible ? 1.0 : 0,
          ...getNavbarPositioning().styles
        }}
      >
        <div className="bg-black/05 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-6 shadow-lg">
          {/* Vertical Stack Layout */}
          <div className="flex flex-col items-center text-center space-y-4">
            
            {/* Main Title (Shoot Type) */}
            <h2 className="font-barlow font-bold text-3xl text-white uppercase tracking-wide" style={{ color: '#ffffff', opacity: 1 }}>
              {shoot.customTitle || shoot.title || (shoot.shootType ? 
                shoot.shootType.charAt(0).toUpperCase() + shoot.shootType.slice(1) 
                : "Portfolio")}
            </h2>

            {/* Shoot Date */}
            {shoot.shootDate && (
              <div className="font-barlow font-light text-sm text-white/80 uppercase tracking-widest">
                {new Date(shoot.shootDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                }).replace(',', 'TH,')}
              </div>
            )}

            {/* VIEW GALLERY Button */}
            <Button
              onClick={() => {
                document.querySelector('.gallery-container-public')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
              className="border border-white/40 text-white hover:bg-white hover:text-black transition-all duration-300 px-6 py-2 rounded-md font-barlow font-medium text-sm uppercase tracking-wide bg-transparent"
            >
              VIEW GALLERY
            </Button>

            {/* Action Icons Row */}
            <div className="flex items-center justify-center gap-6 mt-4">
              
              {/* Logo/Home Link */}
              <div className="relative group flex items-center justify-center">
                <Link href="/" className="flex items-center justify-center">
                  <img
                    src="/images/logos/slyfox-logo-white.png"
                    alt="SlyFox Studios"
                    className="h-8 w-8 object-contain hover:scale-110 transition-all duration-300"
                  />
                </Link>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  SlyFox Studios
                </div>
              </div>

              {/* Shoot Info Icon */}
              <div className="relative group flex items-center justify-center">
                <Info className="w-6 h-6 text-white cursor-default hover:scale-110 transition-all duration-300" />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <div className="flex items-center gap-4">
                    {shoot.location && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {shoot.location}
                      </div>
                    )}
                    {shoot.shootDate && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(shoot.shootDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <div className="relative group flex items-center justify-center">
                <button
                  onClick={handleShareGallery}
                  className="bg-transparent text-white hover:scale-110 transition-all duration-300 p-0 flex items-center justify-center"
                >
                  <Share2 className="w-6 h-6" />
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  Share Gallery
                </div>
              </div>
            </div>

            {/* Navigation Buttons Row (if any exist) */}
            {(previousShoot || nextShoot) && (
              <div className="flex items-center gap-3 mt-2">
                {/* Previous Album Button */}
                {previousShoot && (
                  <Link href={`/gallery/${previousShoot.customSlug}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 text-xs font-barlow"
                      title="Previous Album"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      {previousShoot.customSlug}
                    </Button>
                  </Link>
                )}

                {/* Next Album Button */}
                {nextShoot && (
                  <Link href={`/gallery/${nextShoot.customSlug}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 text-xs font-barlow"
                      title="Next Album"
                    >
                      {nextShoot.customSlug}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Cover Image - Dynamic height */}
      <section
        className="relative bg-gradient-to-br from-black via-charcoal to-black flex items-center"
        style={{
          height: getCoverPicSize(),
          ...getBackgroundStyle(),
          ...(coverImage && {
            backgroundImage: `url(${ImageUrl.forFullSize(coverImage.storagePath)})`,
            backgroundSize: "cover",
            backgroundPosition: getCoverImageAlignment(),
          }),
        }}
      >
        {/* Hero content removed - titles now in navbar */}
      </section>

      {/* Image Gallery Section - Full Width */}
      <section style={{
        ...getBackgroundStyle(),
        paddingTop: getSpacingStyle(),
        paddingBottom: getSpacingStyle()
      }}>
        <div className="gallery-container-public">
          {imagesLoading ? (
            <div 
              className={getGalleryLayoutClasses()}
              style={{ gap: getSpacingStyle() }}
            >
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
            false ? (
              <div 
                className="masonry-grid-seamless"
                style={{ 
                  columnGap: getSpacingStyle(),
                  columnFill: 'balance',
                  orphans: 1,
                  widows: 1,
                  minHeight: images.length > 12 ? '100vh' : 'auto',
                  columns: window.innerWidth >= 1150 ? '5' : window.innerWidth >= 1024 ? '4' : window.innerWidth >= 768 ? '3' : '2'
                }}
              >
                {images
                  .sort((a, b) => a.sequence - b.sequence)
                  .slice(0, visibleImageCount)
                  .map((image, actualIndex) => {
                    // actualIndex is now the correct index in the sorted array

                    return (
                      <div
                        key={image.id}
                        className={`
                          relative group cursor-pointer break-inside-avoid inline-block w-full masonry-item
                          ${selectedImages.has(image.id) ? "ring-2 ring-salmon" : ""}
                        `}
                        style={{ 
                          marginBottom: getSpacingStyle(),
                          ...getBorderStyle()
                        }}
                        onClick={() => openModal(actualIndex)}
                      >
                        <img
                          src={ImageUrl.forViewing(image.storagePath)}
                          alt={image.filename}
                          className="w-full h-auto object-cover block transition-all duration-300 group-hover:brightness-90"
                          style={{ verticalAlign: 'top', ...getBorderStyle() }}
                          loading="lazy"
                        />

                        {/* Gallery image overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

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
                                downloadImage(
                                  image.storagePath,
                                  image.originalName,
                                );
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
                    );
                  })}
                </div>
              ) : (
                <div 
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  style={{ gap: getSpacingStyle() }}
                >
                  {images
                    .sort((a, b) => a.sequence - b.sequence)
                    .slice(0, visibleImageCount)
                    .map((image, actualIndex) => {
                      // actualIndex is now the correct index in the sorted array

                      return (
                        <div
                          key={image.id}
                          className={`
                            relative ${getAspectRatioClass()} group cursor-pointer
                            ${selectedImages.has(image.id) ? "ring-2 ring-salmon" : ""}
                          `}
                          style={getBorderStyle()}
                          onClick={() => openModal(actualIndex)}
                        >
                          <img
                            src={ImageUrl.forViewing(image.storagePath)}
                            alt={image.filename}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-90"
                            style={getBorderStyle()}
                            loading="lazy"
                          />

                          {/* Gallery image overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

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
                                  downloadImage(
                                    image.storagePath,
                                    image.originalName,
                                  );
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
                      );
                    })}
                </div>
              )
            )}

          {/* Load More Button */}
          {visibleImageCount < images.length && (
            <div className="text-center mt-8">
              <Button
                onClick={() =>
                  setVisibleImageCount((prev) =>
                    Math.min(prev + 30, images.length),
                  )
                }
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
            onClick={() => navigateModal("prev")}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={() => navigateModal("next")}
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
            <span>
              {modalImageIndex + 1} of {images.length}
            </span>
            <span>•</span>
            <span>{images[modalImageIndex]?.originalName}</span>
            <span>•</span>
            <button
              onClick={() =>
                downloadImage(
                  images[modalImageIndex]?.storagePath,
                  images[modalImageIndex]?.originalName,
                )
              }
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
