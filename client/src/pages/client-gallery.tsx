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
  ChevronDown,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Play,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

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

interface Client {
  id: number;
  name: string;
  slug: string;
  email: string;
}

// LocalStorage key for user interactions
const INTERACTIONS_STORAGE_KEY = 'slyfox_image_interactions';

interface ImageInteraction {
  imageId: string;
  type: 'heart' | 'like' | 'dislike';
  timestamp: number;
}

// Helper to get user interactions from localStorage
const getUserInteractions = (): ImageInteraction[] => {
  try {
    const stored = localStorage.getItem(INTERACTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save user interactions to localStorage
const saveUserInteractions = (interactions: ImageInteraction[]) => {
  try {
    localStorage.setItem(INTERACTIONS_STORAGE_KEY, JSON.stringify(interactions));
  } catch (error) {
    console.error('Failed to save interactions to localStorage:', error);
  }
};

export default function ClientGallery({ shootId }: { shootId?: string }) {
  const params = useParams();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [visibleImageCount, setVisibleImageCount] = useState(30);
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [userInteractions, setUserInteractions] = useState<Map<string, 'heart' | 'like' | 'dislike'>>(new Map());
  // Touch gesture state for modal
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Removed swipe hint - no longer needed
  
  // Use refs for touch tracking to avoid React state timing issues
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const initialTimeRef = useRef(0);
  const isValidSwipeRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  
  // Debug modal state changes (simplified)
  useEffect(() => {
    if (modalImageIndex !== null) {
      console.log('📱 Modal opened at index:', modalImageIndex);
    }
  }, [modalImageIndex]);
  
  const slug = shootId || params.slug;

  // Load user interactions from localStorage on mount
  useEffect(() => {
    const interactions = getUserInteractions();
    const interactionMap = new Map<string, 'heart' | 'like' | 'dislike'>();
    interactions.forEach(({ imageId, type }) => {
      interactionMap.set(imageId, type);
    });
    setUserInteractions(interactionMap);
  }, []);

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

  // Fetch client information for portfolio link
  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients/by-email", shoot?.clientId],
    enabled: !!shoot?.clientId,
  });

  // Modal navigation functions - defined before useEffect
  const openModal = (imageIndex: number) => {
    console.log('🚪 openModal called with index:', imageIndex, 'total images:', images.length);
    setModalImageIndex(imageIndex);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalImageIndex(null);
    document.body.style.overflow = "auto";
    // Reset drag state when closing modal
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setIsTransitioning(false);
  };

  const navigateModal = (direction: "prev" | "next") => {
    if (modalImageIndex === null || images.length === 0) {
      console.log('🚫 Navigation blocked - modalIndex:', modalImageIndex, 'imageCount:', images.length);
      return;
    }

    console.log('🧭 Navigate:', direction, 'from index:', modalImageIndex);

    // Reset drag state when navigating
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setIsTransitioning(false);
    isDraggingRef.current = false;
    isValidSwipeRef.current = false;

    let newIndex;
    if (direction === "prev") {
      newIndex = modalImageIndex > 0 ? modalImageIndex - 1 : images.length - 1;
    } else {
      newIndex = modalImageIndex < images.length - 1 ? modalImageIndex + 1 : 0;
    }
    
    console.log('📱 Setting new modal index:', newIndex);
    setModalImageIndex(newIndex);
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

  // Enhanced touch/swipe navigation for mobile with visual feedback
  useEffect(() => {
    // Only attach touch handlers when modal is actually open
    if (modalImageIndex === null) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle single touch events
      if (e.touches.length !== 1) return;
      
      // Only handle touches on the image container (not on buttons)
      const target = e.target as Element;
      const isImageContainer = target.closest('.modal-image-container') || target.tagName === 'IMG';
      if (!isImageContainer) return;
      
      console.log('👆 Touch start detected');
      
      // Reset all touch state properly
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      initialTimeRef.current = Date.now();
      isValidSwipeRef.current = true;
      isDraggingRef.current = true;
      dragOffsetRef.current = 0;
      setDragOffset(0);
      setIsDragging(true);
      setIsTransitioning(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !isValidSwipeRef.current || e.touches.length !== 1) return;

      // Prevent all page scrolling immediately
      e.preventDefault();

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartXRef.current;
      const deltaY = currentY - touchStartYRef.current;

      // Only cancel if we have significant movement and it's clearly vertical
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50 && Math.abs(deltaX) < 20) {
        console.log('📱 Cancelled swipe - vertical scroll detected');
        isValidSwipeRef.current = false;
        isDraggingRef.current = false;
        setDragOffset(0);
        setIsDragging(false);
        return;
      }

      // Apply light elastic resistance only at extreme distances
      const screenWidth = window.innerWidth;
      const freeZone = screenWidth * 0.6; // Free movement zone (60% of screen)
      const maxDrag = screenWidth * 0.9; // Maximum drag distance (90% of screen)
      
      let adjustedDelta = deltaX;
      
      // Only apply resistance beyond the free zone
      if (Math.abs(deltaX) > freeZone) {
        const excess = Math.abs(deltaX) - freeZone;
        const resistanceZone = maxDrag - freeZone;
        const resistance = Math.min(excess / resistanceZone, 0.6); // Max 60% resistance, much lighter
        adjustedDelta = deltaX > 0 
          ? freeZone + excess * (1 - resistance)
          : -freeZone - excess * (1 - resistance);
      }

      setDragOffset(adjustedDelta);
      dragOffsetRef.current = adjustedDelta;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      const currentDragOffset = dragOffsetRef.current; // Use ref value
      
      console.log('👆 Touch end - dragOffset:', currentDragOffset, 'isValidSwipe:', isValidSwipeRef.current);
      
      isDraggingRef.current = false;
      setIsDragging(false);
      setIsTransitioning(true);

      // Calculate velocity for more responsive navigation
      const touchDuration = Date.now() - initialTimeRef.current;
      const velocity = Math.abs(currentDragOffset) / touchDuration;

      // Determine if we should navigate based on distance and velocity
      const shouldNavigate = Math.abs(currentDragOffset) > 80 || velocity > 0.3;
      
      console.log('🧮 Navigation check - shouldNavigate:', shouldNavigate, 'velocity:', velocity.toFixed(3));

      if (isValidSwipeRef.current && shouldNavigate) {
        // Animate image sliding fully off screen before navigation
        const screenWidth = window.innerWidth;
        const direction = currentDragOffset > 0 ? 'prev' : 'next'; // Capture direction before state changes
        const finalOffset = currentDragOffset > 0 ? screenWidth : -screenWidth;
        
        setDragOffset(finalOffset);
        dragOffsetRef.current = finalOffset;

        // Navigate after animation completes
        setTimeout(() => {
          navigateModal(direction);
        }, 300); // Match transition duration
      } else {
        // No navigation - just snap back to center
        setTimeout(() => {
          setDragOffset(0);
          dragOffsetRef.current = 0;
          setIsTransitioning(false);
        }, 150);
      }
    };

    // Use a timeout to ensure modal DOM is ready
    const timeoutId = setTimeout(() => {
      // Use a more reliable selector - look for any modal container
      const modalContainer = document.querySelector('.fixed.inset-0.z-\\[100\\]');
      
      if (modalContainer) {
        modalContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
        modalContainer.addEventListener("touchmove", handleTouchMove, { passive: false });
        modalContainer.addEventListener("touchend", handleTouchEnd, { passive: false });
        console.log('✅ Touch listeners attached to modal');
      } else {
        console.log('❌ Modal container not found for touch listeners');
      }
    }, 10); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timeoutId);
      // Clean up with the same selector
      const modalContainer = document.querySelector('.fixed.inset-0.z-\\[100\\]');
      if (modalContainer) {
        modalContainer.removeEventListener("touchstart", handleTouchStart);
        modalContainer.removeEventListener("touchmove", handleTouchMove);
        modalContainer.removeEventListener("touchend", handleTouchEnd);
        console.log('🧹 Touch listeners removed from modal');
      }
    };
  }, [modalImageIndex]); // Only depend on modal state - images.length should be stable

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
      }
      // Removed the scroll up condition - navbar only reappears at top

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

  // Handle image interactions (heart, like, dislike)
  const handleImageInteraction = async (imageId: string, type: 'heart' | 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if user already has this interaction
    const currentInteraction = userInteractions.get(imageId);
    const action = currentInteraction === type ? 'remove' : 'add';

    // Optimistically update UI
    const newInteractions = new Map(userInteractions);
    if (action === 'remove') {
      newInteractions.delete(imageId);
    } else {
      newInteractions.set(imageId, type);
    }
    setUserInteractions(newInteractions);

    // Save to localStorage
    const storageInteractions = getUserInteractions().filter(i => i.imageId !== imageId);
    if (action === 'add') {
      storageInteractions.push({ imageId, type, timestamp: Date.now() });
    }
    saveUserInteractions(storageInteractions);

    // Send to backend
    try {
      const response = await fetch(`/api/images/${imageId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update interaction');
      }

      // Show success toast
      const messages = {
        heart: action === 'add' ? 'Added to favorites ❤️' : 'Removed from favorites',
        like: action === 'add' ? 'Liked 👍' : 'Like removed',
        dislike: action === 'add' ? 'Disliked 👎' : 'Dislike removed'
      };

      toast({
        title: messages[type],
        duration: 2000,
      });
    } catch (error) {
      // Revert optimistic update on error
      setUserInteractions(userInteractions);
      const originalInteractions = getUserInteractions();
      saveUserInteractions(originalInteractions);

      toast({
        title: "Failed to save interaction",
        description: "Please try again",
        variant: "destructive",
      });
    }
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

            {/* Client Portfolio Button */}
            {client && (
              <Link href={`/portfolio/${client.slug}`}>
                <Button
                  className="border border-white/40 text-white hover:bg-white hover:text-black transition-all duration-300 px-6 py-2 rounded-md font-barlow font-medium text-sm uppercase tracking-wide bg-transparent"
                >
                  {client.name.split(' ')[0]}
                </Button>
              </Link>
            )}

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
                  Slyfox - home
                </div>
              </div>

              {/* View Album Icon (Down Arrow) */}
              <div className="relative group flex items-center justify-center">
                <button
                  onClick={() => {
                    document.querySelector('.gallery-container-public')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }}
                  className="bg-transparent text-white hover:scale-110 transition-all duration-300 p-0 flex items-center justify-center"
                >
                  <ChevronDown className="w-7 h-7" />
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  View Album
                </div>
              </div>

              {/* Start Slideshow Button */}
              <div className="relative group flex items-center justify-center">
                <button
                  onClick={() => {
                    console.log('🎬 Starting slideshow from first image');
                    openModal(0);
                  }}
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:scale-110 transition-all duration-300 p-2 rounded-full flex items-center justify-center"
                  title="Start Slideshow"
                >
                  <Play className="w-5 h-5" />
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  Start Slideshow
                </div>
              </div>

              {/* Shoot Info Icon */}
              <div className="relative group flex items-center justify-center">
                <Info className="w-7 h-7 text-white cursor-default hover:scale-110 transition-all duration-300" />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none max-w-lg">
                  <div className="flex flex-col gap-1.5">
                    <div className="font-semibold">{shoot.customTitle || shoot.title}</div>
                    {shoot.location && <div className="text-gray-300">{shoot.location}</div>}
                    {shoot.description && <div className="text-gray-400 break-words">{shoot.description}</div>}
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
            backgroundImage: `url(${ImageUrl.forViewing(coverImage.storagePath)})`,
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
            (gallerySettings?.layoutStyle === 'masonry') ? (
              <div
                className="masonry-grid-seamless"
                style={{
                  columnGap: getSpacingStyle(),
                  columnFill: 'balance',
                  orphans: 1,
                  widows: 1
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
                        onClick={(e) => {
                          console.log('🖱️ Gallery image clicked, opening modal at index:', actualIndex);
                          openModal(actualIndex);
                        }}
                      >
                        <img
                          src={ImageUrl.forViewing(image.storagePath)}
                          alt={image.filename}
                          className="w-full h-auto object-cover block transition-all duration-300 group-hover:brightness-[0.97]"
                          style={{ verticalAlign: 'top', ...getBorderStyle() }}
                          loading="lazy"
                        />

                        {/* Gallery image overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300" />

                        {/* Selection indicator */}
                        {selectedImages.has(image.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-salmon rounded-full flex items-center justify-center z-10">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}

                        {/* Hover overlay with buttons at bottom */}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between gap-2">
                            {/* Left side - Interaction buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleImageInteraction(image.id, 'heart', e)}
                                className={`backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors ${
                                  userInteractions.get(image.id) === 'heart'
                                    ? 'bg-red-500'
                                    : 'bg-white/20'
                                }`}
                                title="Love"
                              >
                                <Heart className={`w-4 h-4 ${
                                  userInteractions.get(image.id) === 'heart'
                                    ? 'fill-white text-white'
                                    : 'text-white'
                                }`} />
                              </button>
                              <button
                                onClick={(e) => handleImageInteraction(image.id, 'like', e)}
                                className={`backdrop-blur-sm p-2 rounded-full hover:bg-green-500 transition-colors ${
                                  userInteractions.get(image.id) === 'like'
                                    ? 'bg-green-500'
                                    : 'bg-white/20'
                                }`}
                                title="Like"
                              >
                                <ThumbsUp className={`w-4 h-4 ${
                                  userInteractions.get(image.id) === 'like'
                                    ? 'fill-white text-white'
                                    : 'text-white'
                                }`} />
                              </button>
                              <button
                                onClick={(e) => handleImageInteraction(image.id, 'dislike', e)}
                                className={`backdrop-blur-sm p-2 rounded-full hover:bg-yellow-500 transition-colors ${
                                  userInteractions.get(image.id) === 'dislike'
                                    ? 'bg-yellow-500'
                                    : 'bg-white/20'
                                }`}
                                title="Dislike"
                              >
                                <ThumbsDown className={`w-4 h-4 ${
                                  userInteractions.get(image.id) === 'dislike'
                                    ? 'fill-white text-white'
                                    : 'text-white'
                                }`} />
                              </button>
                            </div>

                            {/* Right side - Action buttons */}
                            <div className="flex gap-2">
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
                                className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                                title="View Full Resolution"
                              >
                                <span className="text-white text-xs font-bold">HD</span>
                              </a>
                            </div>
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
                          onClick={(e) => {
                            console.log('🖱️ Gallery image clicked, opening modal at index:', actualIndex);
                            openModal(actualIndex);
                          }}
                        >
                          <img
                            src={ImageUrl.forViewing(image.storagePath)}
                            alt={image.filename}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
                            style={getBorderStyle()}
                            loading="lazy"
                          />

                          {/* Gallery image overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300" />

                          {/* Selection indicator */}
                          {selectedImages.has(image.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-salmon rounded-full flex items-center justify-center z-10">
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                          )}

                          {/* Hover overlay with buttons at bottom */}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between gap-2">
                              {/* Left side - Interaction buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleImageInteraction(image.id, 'heart', e)}
                                  className={`backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors ${
                                    userInteractions.get(image.id) === 'heart'
                                      ? 'bg-red-500'
                                      : 'bg-white/20'
                                  }`}
                                  title="Love"
                                >
                                  <Heart className={`w-4 h-4 ${
                                    userInteractions.get(image.id) === 'heart'
                                      ? 'fill-white text-white'
                                      : 'text-white'
                                  }`} />
                                </button>
                                <button
                                  onClick={(e) => handleImageInteraction(image.id, 'like', e)}
                                  className={`backdrop-blur-sm p-2 rounded-full hover:bg-green-500 transition-colors ${
                                    userInteractions.get(image.id) === 'like'
                                      ? 'bg-green-500'
                                      : 'bg-white/20'
                                  }`}
                                  title="Like"
                                >
                                  <ThumbsUp className={`w-4 h-4 ${
                                    userInteractions.get(image.id) === 'like'
                                      ? 'fill-white text-white'
                                      : 'text-white'
                                  }`} />
                                </button>
                                <button
                                  onClick={(e) => handleImageInteraction(image.id, 'dislike', e)}
                                  className={`backdrop-blur-sm p-2 rounded-full hover:bg-yellow-500 transition-colors ${
                                    userInteractions.get(image.id) === 'dislike'
                                      ? 'bg-yellow-500'
                                      : 'bg-white/20'
                                  }`}
                                  title="Dislike"
                                >
                                  <ThumbsDown className={`w-4 h-4 ${
                                    userInteractions.get(image.id) === 'dislike'
                                      ? 'fill-white text-white'
                                      : 'text-white'
                                  }`} />
                                </button>
                              </div>

                              {/* Right side - Action buttons */}
                              <div className="flex gap-2">
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
                                  className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                                  title="View Full Resolution"
                                >
                                  <span className="text-white text-xs font-bold">HD</span>
                                </a>
                              </div>
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
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden" 
          style={{ touchAction: 'none' }}
          data-modal-index={modalImageIndex}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Left navigation bar - 1/3 screen height clickable area */}
          <button
            onClick={() => navigateModal("prev")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1/3 w-16 md:w-24 flex items-center justify-center text-white hover:bg-white/10 transition-all z-10 group"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8 md:w-12 md:h-12 group-hover:scale-110 transition-transform" />
          </button>

          {/* Right navigation bar - 1/3 screen height clickable area */}
          <button
            onClick={() => navigateModal("next")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-1/3 w-16 md:w-24 flex items-center justify-center text-white hover:bg-white/10 transition-all z-10 group"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8 md:w-12 md:h-12 group-hover:scale-110 transition-transform" />
          </button>

          {/* Modal image container - properly sized to fill available space */}
          <div className="modal-image-container w-full h-full p-4 md:p-8 flex items-center justify-center">
            <div 
              className="w-auto h-auto max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `translateX(${dragOffset}px)`,
                transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                willChange: 'transform'
              }}
            >
              <img
                src={ImageUrl.forViewing(images[modalImageIndex]?.storagePath)}
                alt={images[modalImageIndex]?.filename}
                className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                style={{
                  maxWidth: 'calc(100vw - 2rem)',
                  maxHeight: 'calc(100vh - 8rem)',
                  touchAction: 'none'
                }}
                draggable={false}
              />
            </div>
          </div>

          {/* Image info bar with interaction buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-3 rounded-full text-white text-sm z-20">
            <div className="flex items-center gap-3 whitespace-nowrap">
            {/* Image counter */}
            <span>
              {modalImageIndex + 1} of {images.length}
            </span>
            
            {/* Filename (hidden on mobile for space) */}
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline truncate max-w-32">{images[modalImageIndex]?.originalName}</span>
            
            {/* Interaction buttons */}
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleImageInteraction(images[modalImageIndex]?.id, 'heart', e)}
                className={`p-2 rounded-full hover:bg-red-500/80 transition-colors ${
                  userInteractions.get(images[modalImageIndex]?.id) === 'heart'
                    ? 'bg-red-500'
                    : 'bg-white/20'
                }`}
                title="Love"
              >
                <Heart className={`w-4 h-4 ${
                  userInteractions.get(images[modalImageIndex]?.id) === 'heart'
                    ? 'fill-white text-white'
                    : 'text-white'
                }`} />
              </button>
              <button
                onClick={(e) => handleImageInteraction(images[modalImageIndex]?.id, 'like', e)}
                className={`p-2 rounded-full hover:bg-green-500/80 transition-colors ${
                  userInteractions.get(images[modalImageIndex]?.id) === 'like'
                    ? 'bg-green-500'
                    : 'bg-white/20'
                }`}
                title="Like"
              >
                <ThumbsUp className={`w-4 h-4 ${
                  userInteractions.get(images[modalImageIndex]?.id) === 'like'
                    ? 'fill-white text-white'
                    : 'text-white'
                }`} />
              </button>
              <button
                onClick={(e) => handleImageInteraction(images[modalImageIndex]?.id, 'dislike', e)}
                className={`p-2 rounded-full hover:bg-yellow-500/80 transition-colors ${
                  userInteractions.get(images[modalImageIndex]?.id) === 'dislike'
                    ? 'bg-yellow-500'
                    : 'bg-white/20'
                }`}
                title="Dislike"
              >
                <ThumbsDown className={`w-4 h-4 ${
                  userInteractions.get(images[modalImageIndex]?.id) === 'dislike'
                    ? 'fill-white text-white'
                    : 'text-white'
                }`} />
              </button>
            </div>
            
            {/* Download button */}
            <span>•</span>
            <button
              onClick={() =>
                downloadImage(
                  images[modalImageIndex]?.storagePath,
                  images[modalImageIndex]?.originalName,
                )
              }
              className="p-2 rounded-full hover:bg-white/30 bg-white/20 transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
