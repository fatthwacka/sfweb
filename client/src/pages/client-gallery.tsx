import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageUrl } from "@/lib/image-utils";
import { VideoUrl } from "@/lib/video-utils";
import { Link } from "wouter";
import { trackPageView } from "@/lib/analytics";
import { supabaseOperations } from "@/lib/supabase-operations";
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
  Package,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface Shoot {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  custom_slug: string | null;
  banner_image_id: string | null;
  is_private: boolean;
  group_name: string | null;
  media_type: string | null;
  view_count: number;
  gallery_settings?: {
    layoutStyle: string;
    backgroundColor: string;
    borderRadius?: number;
    imageSpacingValue?: number;
    navbarPosition?: string;
    coverPicSize?: number;
    coverPicAlignment?: string;
  };
  created_at: string;
  updated_at: string;
}

interface Image {
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  fileSize: number | null;
  sequence: number;
  featuredImage: boolean;
  classification: string;
  createdAt: string;
  updatedAt: string;
}

interface Video {
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  optimizedPath?: string | null;
  thumbnailPath: string;
  fileSize: number;
  sequence: number;
  duration?: number;
  width?: number;
  height?: number;
  featuredVideo: boolean;
  classification: string;
  createdAt: string;
  updatedAt: string;
}

interface MediaItem extends Partial<Image>, Partial<Video> {
  mediaType: 'image' | 'video';
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  sequence: number;
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
  const [bulkDownloadModal, setBulkDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    isDownloading: boolean;
    progress: number;
    status: string;
    currentFile?: string;
  }>({ isDownloading: false, progress: 0, status: '' });
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

  // Track page view for dynamic gallery pages
  useEffect(() => {
    if (slug) {
      trackPageView(`/gallery/${slug}`);
    }
  }, [slug]);

  // Load user interactions from localStorage on mount
  useEffect(() => {
    const interactions = getUserInteractions();
    const interactionMap = new Map<string, 'heart' | 'like' | 'dislike'>();
    interactions.forEach(({ imageId, type }) => {
      interactionMap.set(imageId, type);
    });
    setUserInteractions(interactionMap);
  }, []);

  // Fetch shoot data directly by slug using Supabase
  const {
    data: shoot,
    isLoading: shootLoading,
    error: shootError,
  } = useQuery<Shoot>({
    queryKey: ['shoots', 'by-slug', slug],
    queryFn: async () => {
      console.log('🔍 ClientGallery: Fetching shoot by slug:', slug);
      const shoots = await supabaseOperations.shoots.getAll();
      
      // Find shoot by custom_slug or ID
      const foundShoot = shoots.find(s => 
        s.custom_slug === slug || s.id === slug
      );
      
      if (!foundShoot) {
        throw new Error('Gallery not found');
      }
      
      // Check if gallery is private
      if ((foundShoot as any).is_private) {
        throw new Error('This is a private gallery');
      }
      
      console.log('✅ ClientGallery: Found shoot:', foundShoot.title);
      console.log('🎨 Gallery settings data:', foundShoot.gallery_settings);
      
      // Debug: Log the complete shoot object to see all available fields
      console.log('🔍 Complete shoot object structure:', foundShoot);
      
      return foundShoot as Shoot;
    },
    enabled: !!slug,
  });

  // Fetch shoot media (images and videos)
  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/gallery", shoot?.id, "images"],
    enabled: !!shoot?.id,
  });

  // Fetch all shoots for the same client to enable next/previous album navigation
  const { data: clientShoots = [] } = useQuery({
    queryKey: ["/api/shoots", "client", shoot?.client_id],
    enabled: !!shoot?.client_id,
  });

  // Fetch client information for portfolio link
  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients/by-email", shoot?.client_id],
    enabled: !!shoot?.client_id,
  });

  // Modal navigation functions - defined before useEffect
  const openModal = (imageIndex: number) => {
    console.log('🚪 openModal called with index:', imageIndex, 'total images:', mediaItems.length);
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
    if (modalImageIndex === null || mediaItems.length === 0) {
      console.log('🚫 Navigation blocked - modalIndex:', modalImageIndex, 'imageCount:', mediaItems.length);
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
      newIndex = modalImageIndex > 0 ? modalImageIndex - 1 : mediaItems.length - 1;
    } else {
      newIndex = modalImageIndex < mediaItems.length - 1 ? modalImageIndex + 1 : 0;
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
  }, [modalImageIndex, mediaItems.length]);

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
  }, [modalImageIndex]); // Only depend on modal state - mediaItems.length should be stable

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

  // Download media function with support for both images and videos
  const downloadMedia = async (item: MediaItem) => {
    try {
      let downloadUrl: string;
      let downloadFilename: string;
      let mediaTypeName: string;

      if (item.mediaType === 'video') {
        downloadUrl = VideoUrl.forDownload(item as Video);
        mediaTypeName = 'video';
        // Get proper video extension from filename or fallback to .mp4
        const originalExtension = item.filename ? 
          item.filename.split('.').pop()?.toLowerCase() : 'mp4';
        downloadFilename = item.filename && item.filename !== "null"
          ? item.filename
          : `${shoot?.title?.replace(/[^a-zA-Z0-9]/g, "-")}-video-${Date.now()}.${originalExtension}`;
      } else {
        downloadUrl = ImageUrl.forFullSize(item.storagePath);
        mediaTypeName = 'image';
        // Get proper image extension from filename or fallback to .jpg
        const originalExtension = item.filename ? 
          item.filename.split('.').pop()?.toLowerCase() : 'jpg';
        downloadFilename = item.filename && item.filename !== "null"
          ? item.filename
          : `${shoot?.title?.replace(/[^a-zA-Z0-9]/g, "-")}-image-${Date.now()}.${originalExtension}`;
      }

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
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
        description: `Could not download the ${item.mediaType}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Legacy function for backward compatibility - prefer downloadMedia()
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

  // Handle bulk download initiation
  const handleBulkDownload = () => {
    setBulkDownloadModal(true);
  };

  // Calculate bulk download size estimate
  const getBulkDownloadEstimate = () => {
    const imageCount = mediaItems.length;
    // Calculate total size from database file sizes (default to 4MB if not available)
    // Add 50% safety margin for ZIP overhead and any missing metadata
    const totalBytes = mediaItems.reduce((sum, img) => sum + (img.fileSize || 4000000), 0);
    const estimatedBytes = Math.round(totalBytes * 1.5);
    const estimatedMB = Math.round(estimatedBytes / (1024 * 1024));
    const estimatedGB = estimatedMB > 1000 ? (estimatedMB / 1000).toFixed(1) : null;

    return {
      count: imageCount,
      sizeMB: estimatedMB,
      sizeGB: estimatedGB,
      sizeText: estimatedGB ? `${estimatedGB}GB` : `${estimatedMB}MB`,
      isLargeAlbum: imageCount > 65
    };
  };

  // Execute bulk download
  const executeBulkDownload = async () => {
    const estimate = getBulkDownloadEstimate();

    // Calculate real total size from images data
    const totalBytes = mediaItems.reduce((sum, img) => sum + (img.fileSize || 3000000), 0);
    const totalMB = totalBytes / (1024 * 1024);

    // Dynamic timing based on actual file size
    // Server processing (fetching + building) is ~90% of total time: ~500ms per MB (min 15s, max 60s)
    // This represents the time before response starts streaming
    const serverProcessingDuration = Math.max(15000, Math.min(totalMB * 500, 60000));

    setDownloadProgress({
      isDownloading: true,
      progress: 0,
      status: 'Preparing download...'
    });

    // Track interval for cleanup
    let serverProcessingInterval: NodeJS.Timeout | null = null;

    try {
      setDownloadProgress({
        isDownloading: true,
        progress: 10,
        status: 'Contacting server...'
      });

      // Stage 1: Smooth progress from 10% → 85% during server processing
      // This represents fetching images from Supabase + building ZIP (90% of total time)
      let currentProgress = 10;
      const serverProcessingIncrement = 75 / (serverProcessingDuration / 200); // 75% over dynamic duration
      serverProcessingInterval = setInterval(() => {
        currentProgress += serverProcessingIncrement;
        if (currentProgress < 85) {
          setDownloadProgress({
            isDownloading: true,
            progress: Math.floor(currentProgress),
            status: 'Server processing images and building ZIP...'
          });
        }
      }, 200);

      const response = await fetch(`/api/gallery/${slug}/download`);

      // Clear server processing interval
      if (serverProcessingInterval) {
        clearInterval(serverProcessingInterval);
        serverProcessingInterval = null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Jump to 85% - server processing complete
      currentProgress = Math.max(currentProgress, 85);

      // Get response data with real progress tracking
      const contentLength = response.headers.get('Content-Length');
      const total = parseInt(contentLength || '0', 10);

      setDownloadProgress({
        isDownloading: true,
        progress: 85,
        status: `Downloading ZIP (${(total / (1024 * 1024)).toFixed(1)}MB)...`
      });

      // Stage 2: Real streaming progress from 85% → 98%
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress from 85% to 98% based on actual download progress
        if (total > 0) {
          const downloadProgress = (receivedLength / total);
          const progressPercent = 85 + Math.floor(downloadProgress * 13); // 85% to 98%
          const receivedMB = (receivedLength / (1024 * 1024)).toFixed(1);
          const totalMB = (total / (1024 * 1024)).toFixed(1);

          setDownloadProgress({
            isDownloading: true,
            progress: progressPercent,
            status: `Downloading ${receivedMB}MB / ${totalMB}MB...`
          });
        }
      }

      // Create blob from chunks
      const blob = new Blob(chunks);

      // Stage 3: Preparing file 98% → 99%
      setDownloadProgress({
        isDownloading: true,
        progress: 98,
        status: 'Preparing file...'
      });

      // Create download URL and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${slug}-gallery.zip`;

      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);

      // Stage 4: Ready to download 99%
      setDownloadProgress({
        isDownloading: true,
        progress: 99,
        status: 'Starting download...'
      });

      // Trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Stage 5: Complete 100%
      setDownloadProgress({
        isDownloading: true,
        progress: 100,
        status: 'Download started!'
      });

      // Close modal and show completion
      setBulkDownloadModal(false);

      setTimeout(() => {
        setDownloadProgress({
          isDownloading: false,
          progress: 0,
          status: ''
        });
      }, 2000);

      toast({
        title: "Download successful!",
        description: `ZIP file ready: ${estimate.count} images (${estimate.sizeText})`,
        duration: 5000,
      });
      
    } catch (error) {
      // Clean up interval on error
      if (serverProcessingInterval) clearInterval(serverProcessingInterval);

      setDownloadProgress({
        isDownloading: false,
        progress: 0,
        status: ''
      });

      toast({
        title: "Download failed",
        description: "Could not start bulk download. Please try again.",
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

  // Apply gallery settings from the shoot (provide defaults for null gallery_settings)
  const gallerySettings = shoot.gallery_settings || {};
  const coverImage = mediaItems.find((img) => img.id === shoot.banner_image_id);
  
  // Get cover video for video albums
  const getCoverVideo = () => {
    if (shoot.media_type !== 'video') return null;
    
    // Find featured video first
    const featuredVideo = mediaItems.find((item) => 
      item.mediaType === 'video' && (item as Video).featuredVideo === true
    );
    if (featuredVideo) return featuredVideo as Video;
    
    // Fallback to first video by sequence
    const firstVideo = mediaItems
      .filter(item => item.mediaType === 'video')
      .sort((a, b) => a.sequence - b.sequence)[0];
    
    return firstVideo as Video || null;
  };
  
  const coverVideo = getCoverVideo();

  // Gallery layout helper functions
  const getGalleryLayoutClasses = () => {
    let layoutStyle = gallerySettings?.layoutStyle || 'automatic';
    
    // For video albums, force 'automatic' to 'square' for better video thumbnail display
    if (layoutStyle === 'automatic' && shoot.media_type === 'video') {
      layoutStyle = 'square';
    }
    
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
        // For automatic mode on photo albums, use masonry as default until images load and determine aspect ratio
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
    let layoutStyle = gallerySettings?.layoutStyle || 'automatic';
    
    // For video albums, force 'automatic' to 'square' for better video thumbnail display
    if (layoutStyle === 'automatic' && shoot.media_type === 'video') {
      layoutStyle = 'square';
    }
    
    if (layoutStyle === 'masonry' || layoutStyle === 'automatic') {
      return 'gallery-image overflow-hidden gallery-masonry-item gallery-image-auto';
    } else {
      return 'gallery-image overflow-hidden gallery-image-square';
    }
  };

  const getAspectRatioClass = () => {
    let layoutStyle = gallerySettings?.layoutStyle || 'automatic';
    
    // For video albums, force 'automatic' to 'square' for better video thumbnail display
    if (layoutStyle === 'automatic' && shoot.media_type === 'video') {
      layoutStyle = 'square';
    }
    
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
    const position = gallerySettings?.navbarPosition || 'top-left';
    const coverSize = gallerySettings?.coverPicSize || 80;
    
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
    const size = gallerySettings?.coverPicSize !== undefined ? gallerySettings?.coverPicSize : 80;
    return `${size}vh`;
  };

  const getCoverImageAlignment = () => {
    const alignment = gallerySettings?.coverPicAlignment || 'top';
    
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
            
            {/* Main Title (Shoot Type) with Info Tooltip */}
            <div className="relative group">
              <h2 className="font-barlow font-bold text-3xl text-white uppercase tracking-wide cursor-default" style={{ color: '#ffffff', opacity: 1 }}>
                {shoot.customTitle || shoot.title || (shoot.shootType ? 
                  shoot.shootType.charAt(0).toUpperCase() + shoot.shootType.slice(1) 
                  : "Portfolio")}
              </h2>
              {/* Shoot info tooltip */}
              {(shoot.location || shoot.description) && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none max-w-lg z-50">
                  <div className="flex flex-col gap-1.5">
                    <div className="font-semibold">{shoot.customTitle || shoot.title}</div>
                    {shoot.location && <div className="text-gray-300">{shoot.location}</div>}
                    {shoot.description && <div className="text-gray-400 break-words">{shoot.description}</div>}
                  </div>
                </div>
              )}
            </div>

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

              {/* Download Album Icon */}
              <div className="relative group flex items-center justify-center">
                <button
                  onClick={handleBulkDownload}
                  className="bg-transparent text-white hover:scale-110 transition-all duration-300 p-0 flex items-center justify-center"
                  title="Download entire album"
                >
                  <Package className="w-7 h-7" />
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  Download entire album
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
                  <Link href={`/gallery/${(previousShoot as any).custom_slug}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 text-xs font-barlow"
                      title="Previous Album"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      {(previousShoot as any).custom_slug}
                    </Button>
                  </Link>
                )}

                {/* Next Album Button */}
                {nextShoot && (
                  <Link href={`/gallery/${(nextShoot as any).custom_slug}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 text-xs font-barlow"
                      title="Next Album"
                    >
                      {(nextShoot as any).custom_slug}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Cover Media - Dynamic height */}
      <section
        className="relative bg-gradient-to-br from-black via-charcoal to-black flex items-center overflow-hidden"
        style={{
          height: getCoverPicSize(),
          ...getBackgroundStyle(),
        }}
      >
        {/* Video Background for Video Albums */}
        {coverVideo && shoot.media_type === 'video' ? (
          <video
            src={VideoUrl.forStreaming(coverVideo)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: getCoverImageAlignment(),
            }}
            autoPlay
            loop
            muted
            playsInline
            poster={VideoUrl.forThumbnail(coverVideo)}
          >
            Your browser does not support the video tag.
          </video>
        ) : coverImage ? (
          /* Image Background for Photo Albums */
          <div
            className="absolute inset-0 w-full h-full bg-cover"
            style={{
              backgroundImage: `url(${ImageUrl.forViewing(coverImage.storagePath)})`,
              backgroundPosition: getCoverImageAlignment(),
            }}
          />
        ) : null}

        {/* No overlay - full brightness (100%) for cover images/videos */}

        {/* Hero content removed - titles now in navbar */}
      </section>

      {/* Image Gallery Section - Full Width */}
      <section style={{
        ...getBackgroundStyle(),
        paddingTop: getSpacingStyle(),
        paddingBottom: getSpacingStyle()
      }}>
        <div className="gallery-container-public">
          {mediaLoading ? (
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
          ) : mediaItems.length === 0 ? (
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
                {mediaItems
                  .sort((a, b) => a.sequence - b.sequence)
                  .slice(0, visibleImageCount)
                  .map((item, actualIndex) => {
                    // actualIndex is now the correct index in the sorted array

                    return (
                      <div
                        key={item.id}
                        className={`
                          relative group cursor-pointer break-inside-avoid inline-block w-full masonry-item
                          ${selectedImages.has(item.id) ? "ring-2 ring-salmon" : ""}
                        `}
                        style={{ 
                          marginBottom: getSpacingStyle(),
                          ...getBorderStyle()
                        }}
                        onClick={(e) => {
                          console.log('🖱️ Gallery item clicked, opening modal at index:', actualIndex);
                          openModal(actualIndex);
                        }}
                      >
                        {item.mediaType === 'video' ? (
                          <div className="relative">
                            <img
                              src={VideoUrl.forThumbnail(item as Video)}
                              alt={item.filename}
                              className="w-full h-auto object-cover block transition-all duration-300 group-hover:brightness-[0.97]"
                              style={{ verticalAlign: 'top', ...getBorderStyle() }}
                              loading="lazy"
                            />
                            {/* Video play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/70 rounded-full p-4 backdrop-blur-sm">
                                <Play className="w-8 h-8 text-white fill-current" />
                              </div>
                            </div>
                            {/* Video duration badge */}
                            {item.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <img
                            src={ImageUrl.forViewing(item.storagePath)}
                            alt={item.filename}
                            className="w-full h-auto object-cover block transition-all duration-300 group-hover:brightness-[0.97]"
                            style={{ verticalAlign: 'top', ...getBorderStyle() }}
                            loading="lazy"
                          />
                        )}

                        {/* Gallery image overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300" />

                        {/* Selection indicator */}
                        {selectedImages.has(item.id) && (
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
                                onClick={(e) => handleImageInteraction(item.id, 'heart', e)}
                                className={`backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors ${
                                  userInteractions.get(item.id) === 'heart'
                                    ? 'bg-red-500'
                                    : 'bg-white/20'
                                }`}
                                title="Love"
                              >
                                <Heart className={`w-4 h-4 ${
                                  userInteractions.get(item.id) === 'heart'
                                    ? 'fill-white text-white'
                                    : 'text-white'
                                }`} />
                              </button>
                              <button
                                onClick={(e) => handleImageInteraction(item.id, 'like', e)}
                                className={`backdrop-blur-sm p-2 rounded-full hover:bg-green-500 transition-colors ${
                                  userInteractions.get(item.id) === 'like'
                                    ? 'bg-green-500'
                                    : 'bg-white/20'
                                }`}
                                title="Like"
                              >
                                <ThumbsUp className={`w-4 h-4 ${
                                  userInteractions.get(item.id) === 'like'
                                    ? 'fill-white text-white'
                                    : 'text-white'
                                }`} />
                              </button>
                              <button
                                onClick={(e) => handleImageInteraction(item.id, 'dislike', e)}
                                className={`backdrop-blur-sm p-2 rounded-full hover:bg-yellow-500 transition-colors ${
                                  userInteractions.get(item.id) === 'dislike'
                                    ? 'bg-yellow-500'
                                    : 'bg-white/20'
                                }`}
                                title="Dislike"
                              >
                                <ThumbsDown className={`w-4 h-4 ${
                                  userInteractions.get(item.id) === 'dislike'
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
                                  downloadMedia(item);
                                }}
                                className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                                title="Download"
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
                                href={ImageUrl.forFullSize(item.storagePath)}
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
                  {mediaItems
                    .sort((a, b) => a.sequence - b.sequence)
                    .slice(0, visibleImageCount)
                    .map((item, actualIndex) => {
                      // actualIndex is now the correct index in the sorted array

                      return (
                        <div
                          key={item.id}
                          className={`
                            relative ${getAspectRatioClass()} group cursor-pointer
                            ${selectedImages.has(item.id) ? "ring-2 ring-salmon" : ""}
                          `}
                          style={getBorderStyle()}
                          onClick={(e) => {
                            console.log('🖱️ Gallery item clicked, opening modal at index:', actualIndex);
                            openModal(actualIndex);
                          }}
                        >
                          {item.mediaType === 'video' ? (
                            <div className={`relative w-full h-full ${getAspectRatioClass()}`}>
                              <img
                                src={VideoUrl.forThumbnail(item as Video)}
                                alt={item.filename}
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
                                style={getBorderStyle()}
                                loading="lazy"
                              />
                              {/* Video play overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/70 rounded-full p-3 backdrop-blur-sm">
                                  <Play className="w-6 h-6 text-white fill-current" />
                                </div>
                              </div>
                              {/* Video duration badge */}
                              {item.duration && (
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
                                  {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <img
                              src={ImageUrl.forViewing(item.storagePath)}
                              alt={item.filename}
                              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
                              style={getBorderStyle()}
                              loading="lazy"
                            />
                          )}

                          {/* Gallery image overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300" />

                          {/* Selection indicator */}
                          {selectedImages.has(item.id) && (
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
                                  onClick={(e) => handleImageInteraction(item.id, 'heart', e)}
                                  className={`backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors ${
                                    userInteractions.get(item.id) === 'heart'
                                      ? 'bg-red-500'
                                      : 'bg-white/20'
                                  }`}
                                  title="Love"
                                >
                                  <Heart className={`w-4 h-4 ${
                                    userInteractions.get(item.id) === 'heart'
                                      ? 'fill-white text-white'
                                      : 'text-white'
                                  }`} />
                                </button>
                                <button
                                  onClick={(e) => handleImageInteraction(item.id, 'like', e)}
                                  className={`backdrop-blur-sm p-2 rounded-full hover:bg-green-500 transition-colors ${
                                    userInteractions.get(item.id) === 'like'
                                      ? 'bg-green-500'
                                      : 'bg-white/20'
                                  }`}
                                  title="Like"
                                >
                                  <ThumbsUp className={`w-4 h-4 ${
                                    userInteractions.get(item.id) === 'like'
                                      ? 'fill-white text-white'
                                      : 'text-white'
                                  }`} />
                                </button>
                                <button
                                  onClick={(e) => handleImageInteraction(item.id, 'dislike', e)}
                                  className={`backdrop-blur-sm p-2 rounded-full hover:bg-yellow-500 transition-colors ${
                                    userInteractions.get(item.id) === 'dislike'
                                      ? 'bg-yellow-500'
                                      : 'bg-white/20'
                                  }`}
                                  title="Dislike"
                                >
                                  <ThumbsDown className={`w-4 h-4 ${
                                    userInteractions.get(item.id) === 'dislike'
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
                                    downloadMedia(item);
                                  }}
                                  className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                                  title="Download"
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
                                  href={ImageUrl.forFullSize(item.storagePath)}
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
          {visibleImageCount < mediaItems.length && (
            <div className="text-center mt-8">
              <Button
                onClick={() =>
                  setVisibleImageCount((prev) =>
                    Math.min(prev + 30, mediaItems.length),
                  )
                }
                variant="outline"
                className="border-salmon text-salmon hover:bg-salmon hover:text-white"
              >
                Load More ({mediaItems.length - visibleImageCount} remaining)
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

      {/* Media Modal (Images & Videos) */}
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
            aria-label="Previous media"
          >
            <ChevronLeft className="w-8 h-8 md:w-12 md:h-12 group-hover:scale-110 transition-transform" />
          </button>

          {/* Right navigation bar - 1/3 screen height clickable area */}
          <button
            onClick={() => navigateModal("next")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-1/3 w-16 md:w-24 flex items-center justify-center text-white hover:bg-white/10 transition-all z-10 group"
            aria-label="Next media"
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
              {mediaItems[modalImageIndex]?.mediaType === 'video' ? (
                <video
                  src={VideoUrl.forStreaming(mediaItems[modalImageIndex] as Video)}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                  style={{
                    maxWidth: 'calc(100vw - 2rem)',
                    maxHeight: 'calc(100vh - 8rem)',
                    touchAction: 'none'
                  }}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  poster={VideoUrl.forThumbnail(mediaItems[modalImageIndex] as Video)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={ImageUrl.forViewing(mediaItems[modalImageIndex]?.storagePath)}
                  alt={mediaItems[modalImageIndex]?.filename}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                  style={{
                    maxWidth: 'calc(100vw - 2rem)',
                    maxHeight: 'calc(100vh - 8rem)',
                    touchAction: 'none'
                  }}
                  draggable={false}
                />
              )}
            </div>
          </div>

          {/* Image info bar with interaction buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-3 rounded-full text-white text-sm z-20">
            <div className="flex items-center gap-3 whitespace-nowrap">
            {/* Image counter */}
            <span>
              {modalImageIndex + 1} of {mediaItems.length}
            </span>
            
            {/* Filename (hidden on mobile for space) */}
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline truncate max-w-32">{mediaItems[modalImageIndex]?.originalName}</span>
            
            {/* Interaction buttons */}
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleImageInteraction(mediaItems[modalImageIndex]?.id, 'heart', e)}
                className={`p-2 rounded-full hover:bg-red-500/80 transition-colors ${
                  userInteractions.get(mediaItems[modalImageIndex]?.id) === 'heart'
                    ? 'bg-red-500'
                    : 'bg-white/20'
                }`}
                title="Love"
              >
                <Heart className={`w-4 h-4 ${
                  userInteractions.get(mediaItems[modalImageIndex]?.id) === 'heart'
                    ? 'fill-white text-white'
                    : 'text-white'
                }`} />
              </button>
              <button
                onClick={(e) => handleImageInteraction(mediaItems[modalImageIndex]?.id, 'like', e)}
                className={`p-2 rounded-full hover:bg-green-500/80 transition-colors ${
                  userInteractions.get(mediaItems[modalImageIndex]?.id) === 'like'
                    ? 'bg-green-500'
                    : 'bg-white/20'
                }`}
                title="Like"
              >
                <ThumbsUp className={`w-4 h-4 ${
                  userInteractions.get(mediaItems[modalImageIndex]?.id) === 'like'
                    ? 'fill-white text-white'
                    : 'text-white'
                }`} />
              </button>
              <button
                onClick={(e) => handleImageInteraction(mediaItems[modalImageIndex]?.id, 'dislike', e)}
                className={`p-2 rounded-full hover:bg-yellow-500/80 transition-colors ${
                  userInteractions.get(mediaItems[modalImageIndex]?.id) === 'dislike'
                    ? 'bg-yellow-500'
                    : 'bg-white/20'
                }`}
                title="Dislike"
              >
                <ThumbsDown className={`w-4 h-4 ${
                  userInteractions.get(mediaItems[modalImageIndex]?.id) === 'dislike'
                    ? 'fill-white text-white'
                    : 'text-white'
                }`} />
              </button>
            </div>
            
            {/* Download button */}
            <span>•</span>
            <button
              onClick={() =>
                downloadMedia(mediaItems[modalImageIndex])
              }
              className="p-2 rounded-full hover:bg-white/30 bg-white/20 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            </div>
          </div>

        </div>
      )}

      {/* Bulk Download Confirmation Modal */}
      {bulkDownloadModal && (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Download Entire Album</h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                You are about to download <strong>{getBulkDownloadEstimate().count} images</strong>
              </p>
              <p className="text-gray-600 text-sm">
                Estimated size: <strong>{getBulkDownloadEstimate().sizeText}</strong>
              </p>
              {getBulkDownloadEstimate().isLargeAlbum ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm">
                    <strong>Large Album Notice:</strong> This album has more than 65 images. 
                    Currently, only albums with 65 images or fewer can be downloaded at once.
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  Files will be downloaded as a ZIP archive to your Downloads folder.
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBulkDownloadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDownload}
                disabled={getBulkDownloadEstimate().isLargeAlbum}
                className={`px-6 py-2 rounded-md transition-colors ${
                  getBulkDownloadEstimate().isLargeAlbum
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-salmon text-white hover:bg-salmon-muted'
                }`}
              >
                {getBulkDownloadEstimate().isLargeAlbum ? 'Album Too Large' : 'Download Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Modal */}
      {downloadProgress.isDownloading && (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[420px] mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Downloading Album</h3>
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-salmon h-3 rounded-full transition-all duration-500"
                  style={{ width: `${downloadProgress.progress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm text-center min-h-[20px]">
                {downloadProgress.status}
              </p>
              {downloadProgress.currentFile && (
                <p className="text-gray-500 text-xs text-center truncate">
                  {downloadProgress.currentFile}
                </p>
              )}
            </div>
            {downloadProgress.progress < 100 && (
              <button
                onClick={() => setDownloadProgress({ 
                  isDownloading: false, 
                  progress: 0, 
                  status: '' 
                })}
                className="mt-4 w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel Download
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
