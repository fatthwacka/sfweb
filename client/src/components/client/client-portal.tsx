import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUrl } from "@/lib/image-utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, 
  Calendar, 
  MapPin, 
  Eye, 
  Download, 
  Search,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  LogOut,
  User,
  Settings,
  Palette,
  Save,
  Crown,
  X,
  Trash2,
  MousePointer,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Wand2,
  AlertTriangle
} from "lucide-react";
import { ImagePickerFast } from "./image-picker-fast";
import { GallerySettingsCard } from "@/components/gallery/gallery-settings-card";
import { GalleryRenderer } from "@/components/gallery/gallery-renderer";
import { useAutoSaveGallerySettings } from "@/hooks/use-debounced-auto-save";
import { useAutoSaveImageOrder } from '@/hooks/use-auto-save-image-order';

interface Shoot {
  id: string;
  clientId: string;
  title: string;
  location: string;
  shootDate: string;
  shootType: string;
  description: string;
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

interface ClientPortalProps {
  userEmail: string;
  userName?: string;
}

export function ClientPortal({ userEmail, userName }: ClientPortalProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShoot, setSelectedShoot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'images' | 'shootinfo' | 'settings' | 'preview'>('images');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    shootInfo: false,
    gallerySettings: false,
    livePreview: false
  });
  const [gallerySettings, setGallerySettings] = useState({
    backgroundColor: "#1a1a1a",
    layoutStyle: "masonry",
    borderRadius: 8,
    imageSpacingValue: 8,
    coverPicAlignment: "centre",
    navbarPosition: "top-left",
    coverPicSize: 80
  });
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [visibleImageCount, setVisibleImageCount] = useState(20);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageId, setModalImageId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-save hooks - must be at top level of component
  const { debouncedSave, saveImmediately, saveStatus, isSaving } = useAutoSaveGallerySettings({
    shootId: selectedShoot || ''
  });

  const { debouncedSave: debouncedSaveImageOrder, saveStatus: imageOrderSaveStatus } = useAutoSaveImageOrder({
    shootId: selectedShoot || ''
  });

  // Handler functions - moved to top level to avoid hooks rule violations
  const handleGallerySettingsChange = (updateFn: (prev: any) => any) => {
    setGallerySettings((prev) => {
      const newSettings = updateFn(prev);
      console.log('🔍 DEBUG: Saving settings to DB:', newSettings);
      console.log('🔍 DEBUG: Border radius being saved:', newSettings.borderRadius, typeof newSettings.borderRadius);
      
      // Trigger auto-save with the new settings
      debouncedSave(newSettings);
      
      return newSettings;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    
    if (!draggedImage || draggedImage === targetImageId) {
      setDraggedImage(null);
      return;
    }

    setImageOrder(currentOrder => {
      const newOrder = [...currentOrder];
      const draggedIndex = newOrder.indexOf(draggedImage);
      const targetIndex = newOrder.indexOf(targetImageId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged item
        newOrder.splice(draggedIndex, 1);
        // Insert at new position
        newOrder.splice(targetIndex, 0, draggedImage);
      }
      
      // Auto-save new order
      debouncedSaveImageOrder(newOrder, selectedCover);
      
      return newOrder;
    });
    
    setDraggedImage(null);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
  };

  // Modal handlers
  const handleViewFullRes = (storagePath: string) => {
    const orderedImages = getOrderedImages();
    const imageIndex = orderedImages.findIndex(img => img.storagePath === storagePath);
    if (imageIndex !== -1) {
      setCurrentImageIndex(imageIndex);
      setModalImageId(orderedImages[imageIndex].id);
      setIsModalOpen(true);
    }
  };

  const handleDownloadImage = async (storagePath: string, filename: string) => {
    try {
      const imageUrl = ImageUrl.forViewing(storagePath);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const navigateModal = (direction: 'prev' | 'next') => {
    const orderedImages = getOrderedImages();
    const currentIndex = currentImageIndex;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : orderedImages.length - 1;
    } else {
      newIndex = currentIndex < orderedImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentImageIndex(newIndex);
    setModalImageId(orderedImages[newIndex].id);
  };

  // Get ordered images for display (main function)
  const getOrderedImages = () => {
    if (!images || images.length === 0) return [];
    if (!imageOrder || imageOrder.length === 0) return images;
    
    const imageMap = new Map(images.map(img => [img.id, img]));
    const orderedImages = imageOrder
      .map(id => imageMap.get(id))
      .filter(Boolean) as typeof images;
    
    // Add any new images not in order yet
    const existingIds = new Set(imageOrder);
    const newImages = images.filter(img => !existingIds.has(img.id));
    
    return [...orderedImages, ...newImages];
  };

  // Load more images function
  const loadMoreImages = () => {
    setVisibleImageCount(prev => Math.min(prev + 20, 100));
  };

  // Enable drag reordering for visible images
  const isDragReorderingEnabled = true;

  // Debug logging to help identify loading issues
  console.log('ClientPortal loading for:', userEmail);

  // Fetch client's shoots based on email
  const { data: shoots = [], isLoading: shootsLoading, error } = useQuery<Shoot[]>({
    queryKey: ["/api/client/shoots", userEmail],
    queryFn: () => fetch(`/api/client/shoots?email=${encodeURIComponent(userEmail)}`).then(res => {
      console.log('API Response status:', res.status);
      return res.json();
    }),
  });

  // ROBUST APPROACH: Fetch workflow states using new atomic service
  const { data: workflowStates = {} } = useQuery({
    queryKey: ["/api/workflow/states", shoots.map(s => s.id)],
    queryFn: async () => {
      if (!shoots.length) return {};
      
      const shootIds = shoots.map(s => s.id);
      const response = await apiRequest('POST', `/api/workflow/states`, { shootIds });
      
      return await response.json();
    },
    enabled: shoots.length > 0
  });

  // Keep legacy preview settings for ImagePickerFast component compatibility
  const { data: previewSettings = {} } = useQuery({
    queryKey: ["/api/preview-settings/by-shoots", shoots.map(s => s.id)],
    queryFn: async () => {
      const settingsMap: Record<string, any> = {};
      
      // Fetch preview settings for each shoot
      await Promise.all(
        shoots.map(async (shoot) => {
          try {
            const response = await apiRequest('GET', `/api/shoots/${shoot.id}/preview-settings`);
            const settings = await response.json();
            if (settings && (settings.dropboxFolderPath || settings.dropboxShareLink || settings.isActive)) {
              settingsMap[shoot.id] = settings;
            }
          } catch (error) {
            // Shoot has no preview settings - that's fine
          }
        })
      );
      
      return settingsMap;
    },
    enabled: shoots.length > 0,
  });

  // Debug logging 
  console.log('Shoots loading:', shootsLoading, 'Error:', error, 'Shoots count:', shoots.length);
  console.log('Shoots data:', shoots);
  console.log('🎯 Workflow states:', workflowStates);
  console.log('Legacy preview settings:', previewSettings);

  // Fetch shoot data with images (same as admin approach)
  const { data: shootData, isLoading: imagesLoading } = useQuery({
    queryKey: ["/api/shoots", selectedShoot],
    queryFn: () => fetch(`/api/shoots/${selectedShoot}`).then(res => res.json()),
    enabled: !!selectedShoot,
  });

  const shoot = (shootData as any)?.shoot || null;
  const images: Image[] = (shootData as any)?.images ? ((shootData as any).images as Image[]) : [];

  // Initialize all settings from shoot data when shoot changes (same as admin)
  useEffect(() => {
    if (shoot && shoot.id && images.length > 0) {
      // Set cover: use bannerImageId if valid, otherwise use first image as fallback
      if (shoot.bannerImageId && images.some(img => img.id === shoot.bannerImageId)) {
        setSelectedCover(shoot.bannerImageId);
      } else {
        setSelectedCover(images[0].id);
      }
      
      // Initialize gallery settings from shoot data (provide defaults for null gallerySettings)
      const settings = shoot.gallerySettings || {};
      console.log('🔍 DEBUG: Reading settings from shoot:', settings);
      console.log('🔍 DEBUG: Border radius from DB:', settings.borderRadius, typeof settings.borderRadius);
      setGallerySettings({
        backgroundColor: settings.backgroundColor || '#1a1a1a',
        layoutStyle: settings.layoutStyle || 'masonry',
        borderRadius: settings.borderRadius !== undefined ? settings.borderRadius : 8,
        imageSpacingValue: settings.imageSpacingValue !== undefined ? settings.imageSpacingValue : 8,
        coverPicAlignment: settings.coverPicAlignment || 'centre',
        navbarPosition: settings.navbarPosition || 'top-left',
        coverPicSize: settings.coverPicSize !== undefined ? settings.coverPicSize : 80
      });
    } else {
      // Clear state when switching galleries to prevent stale state
      setSelectedCover(null);
    }
  }, [shoot?.id, images.length]);

  // Initialize image order from sequence - fix blank gaps issue
  useEffect(() => {
    if (images.length > 0) {
      const sortedImages = [...images].sort((a, b) => a.sequence - b.sequence);
      const newOrder = sortedImages.map(img => img.id);
      
      // Only update if the order actually changed to prevent unnecessary re-renders
      if (JSON.stringify(newOrder) !== JSON.stringify(imageOrder)) {
        setImageOrder(newOrder);
      }
    } else {
      // Clear order when no images
      if (imageOrder.length > 0) {
        setImageOrder([]);
      }
    }
  }, [images.length, images.map(img => `${img.id}-${img.sequence}`).join(',')]);

  const filteredShoots = shoots.filter(shoot => {
    const matchesSearch = shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shoot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shoot.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || shoot.shootType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueShootTypes = Array.from(new Set(shoots.map(shoot => shoot.shootType)));

  // ROBUST APPROACH: Helper functions using atomic workflow states
  const isPreviewAlbum = (shootId: string) => {
    return workflowStates[shootId]?.state === 'preview';
  };
  
  const isSubmittedAlbum = (shootId: string) => {
    return workflowStates[shootId]?.state === 'editing';
  };
  
  const isEditingComplete = (shootId: string) => {
    return workflowStates[shootId]?.state === 'complete';
  };
  
  // Get state-specific UI configuration
  const getWorkflowConfig = (shootId: string) => {
    const state = workflowStates[shootId]?.state || 'default';
    
    const configs = {
      'default': {
        color: 'bg-salmon text-white',
        buttonText: 'View Gallery',
        action: 'gallery'
      },
      'preview': {
        color: 'bg-cyan text-white',
        buttonText: 'Select Images',
        action: 'image-picker'
      },
      'editing': {
        color: 'bg-yellow text-black',
        buttonText: 'View Gallery (Processing)',
        action: 'gallery'
      },
      'complete': {
        color: 'bg-green-500 text-white',
        buttonText: 'View Gallery (Ready)', 
        action: 'gallery'
      }
    };
    
    return configs[state];
  };

  // Client-specific save order handler
  const handleSaveOrder = async () => {
    if (!selectedShoot) return;
    
    try {
      const imageSequences = imageOrder.length > 0 
        ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
        : {};
      
      await apiRequest('PATCH', `/api/shoots/${selectedShoot}`, {
        bannerImageId: selectedCover,
        imageSequences: imageSequences
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/client/shoots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', selectedShoot] });
      toast({ title: "Image order and cover saved successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save image order", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getShootTypeColor = (type: string) => {
    const colors = {
      'wedding': 'bg-pink-500',
      'portrait': 'bg-blue-500',
      'commercial': 'bg-green-500',
      'event': 'bg-purple-500',
      'lifestyle': 'bg-cyan-500',
      'other': 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (shootsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-dark via-background to-grey-dark flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-12 h-12 text-salmon mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your galleries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-dark via-background to-grey-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with User Menu */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-saira font-bold text-salmon mb-2">
              Welcome back{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-muted-foreground">
              Access your private galleries and download your photos
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4 text-sm mt-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan" />
              <span>{shoots.length} galleries available</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-salmon" />
              <span>{shoots.reduce((total, shoot) => total + shoot.viewCount, 0)} total views</span>
            </div>
          </div>
        </div>

        {/* Gallery Selection */}
        {!selectedShoot && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search your galleries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  {uniqueShootTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-border hover:border-salmon"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Shoots Grid/List */}
            {filteredShoots.length === 0 ? (
              <Card className="admin-gradient-card">
                <CardContent className="p-8 text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Galleries Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter settings.'
                      : 'Your photographer will share galleries with you soon.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredShoots.map(shoot => (
                  <Card 
                    key={shoot.id} 
                    className="admin-gradient-card hover:border-salmon transition-colors cursor-pointer"
                    onClick={() => setSelectedShoot(shoot.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className={`${
                            (() => {
                              const state = workflowStates[shoot.id]?.state || 'default';
                              switch (state) {
                                case 'preview': return 'text-cyan';
                                case 'editing': return 'text-yellow-400';
                                case 'complete': return 'text-green-500';
                                default: return 'text-salmon';
                              }
                            })()
                          } text-lg`}>
                            {shoot.customTitle || shoot.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getShootTypeColor(shoot.shootType)} text-white text-xs`}>
                              {shoot.shootType}
                            </Badge>
                            {shoot.isPrivate && (
                              <Badge variant="outline" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                        {(() => {
                          const state = workflowStates[shoot.id]?.state || 'default';
                          const workflowConfig = getWorkflowConfig(shoot.id);
                          
                          switch (state) {
                            case 'preview':
                              return (
                                <div className="text-xs text-cyan font-medium">
                                  image picker
                                </div>
                              );
                            case 'editing':
                              return (
                                <div className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                                  <Wand2 className="w-3 h-3" />
                                  editing in progress
                                </div>
                              );
                            case 'complete':
                              return (
                                <div className="text-xs text-green-500 font-medium">
                                  editing complete
                                </div>
                              );
                            default:
                              return null;
                          }
                        })()}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {shoot.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {shoot.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 icon-cyan" />
                          {formatDate(shoot.shootDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 icon-salmon" />
                          {shoot.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 icon-cyan" />
                          {shoot.viewCount} views
                        </div>
                      </div>
                      
                      <Button 
                        className={`w-full text-white ${
                          (() => {
                            const state = workflowStates[shoot.id]?.state || 'default';
                            switch (state) {
                              case 'preview': return 'bg-cyan hover:bg-cyan/90';
                              case 'editing': return 'bg-yellow-500 hover:bg-yellow-600';
                              case 'complete': return 'bg-green-600 hover:bg-green-700';
                              default: return 'bg-salmon hover:bg-salmon-muted';
                            }
                          })()
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShoot(shoot.id);
                        }}
                      >
                        {(() => {
                          const state = workflowStates[shoot.id]?.state || 'default';
                          switch (state) {
                            case 'preview': return 'Select Images';
                            case 'editing': return 'View Gallery (Processing)';
                            case 'complete': return 'View Gallery (Ready)';
                            default: return 'View Gallery';
                          }
                        })()}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Image Gallery View */}
        {selectedShoot && workflowStates[selectedShoot]?.state !== 'preview' && (
          <div className="space-y-6">
            {/* Gallery Header */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={() => setSelectedShoot(null)}
                className="border-border hover:border-salmon"
              >
                ← Back to Galleries
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border hover:border-cyan">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </Button>
                <Button variant="outline" size="sm" className="border-border hover:border-salmon">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Current Shoot Info */}
            {(() => {
              const currentShoot = shoots.find(s => s.id === selectedShoot);
              return currentShoot ? (
                <Card className="admin-gradient-card">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-saira font-bold text-salmon mb-2">
                      {currentShoot.customTitle || currentShoot.title}
                      {isSubmittedAlbum(selectedShoot) && (
                        <span className="ml-3 text-sm text-yellow-400 font-normal">
                          (Selection submitted - editing in progress)
                        </span>
                      )}
                      {isEditingComplete(selectedShoot) && (
                        <span className="ml-3 text-sm text-green-500 font-normal">
                          (Editing complete)
                        </span>
                      )}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 icon-cyan" />
                        {formatDate(currentShoot.shootDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 icon-salmon" />
                        {currentShoot.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 icon-cyan" />
                        {images.length} photos
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Card-Based Gallery Management Interface */}
            <div className="space-y-6">
              {/* Basic Shoot Info Card */}
              <Card className="admin-gradient-card">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedCards(prev => ({...prev, shootInfo: !prev.shootInfo}))}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-salmon font-saira flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Basic Shoot Info
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {expandedCards.shootInfo && (() => {
                        const currentShoot = shoots.find(s => s.id === selectedShoot);
                        return (
                          <Button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const locationValue = (document.getElementById('location') as HTMLInputElement)?.value || currentShoot?.location;
                              const titleValue = (document.getElementById('customTitle') as HTMLInputElement)?.value || currentShoot?.customTitle;
                              
                              try {
                                await apiRequest('PATCH', `/api/shoots/${selectedShoot}`, {
                                  location: locationValue,
                                  customTitle: titleValue
                                });
                                queryClient.invalidateQueries({ queryKey: ['/api/client/shoots'] });
                                queryClient.invalidateQueries({ queryKey: ['/api/shoots', selectedShoot] });
                                toast({ title: "Shoot info updated successfully!" });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to save shoot info", variant: "destructive" });
                              }
                            }}
                            className="bg-salmon text-white hover:bg-salmon-muted"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        );
                      })()}
                      {expandedCards.shootInfo ? (
                        <ChevronUp className="w-5 h-5 text-salmon" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-salmon" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedCards.shootInfo && (() => {
                  const currentShoot = shoots.find(s => s.id === selectedShoot);
                  return currentShoot ? (
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            defaultValue={currentShoot.location}
                            placeholder="Enter shoot location"
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            The location where this shoot took place
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="customTitle">Gallery Title</Label>
                          <Input
                            id="customTitle"
                            defaultValue={currentShoot.customTitle || currentShoot.title}
                            placeholder="Custom title for your gallery"
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This will be displayed as your gallery heading
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="albumSlug">Album Slug</Label>
                          <div className="p-2 bg-background rounded-md border">
                            <code className="text-sm text-cyan-400">{currentShoot.customSlug}</code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            URL-friendly identifier for your gallery
                          </p>
                        </div>
                        <div>
                          <Label className="mb-2 block">Live Album</Label>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                window.open(`/gallery/${currentShoot.customSlug}`, '_blank');
                              }}
                              className="bg-salmon text-white hover:bg-salmon-muted"
                            >
                              View Live Album
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(`/gallery/${currentShoot.customSlug}`, '_blank');
                              }}
                              className="border-border hover:border-cyan"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Opens your public gallery in a new tab
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  ) : null;
                })()}
              </Card>

              {/* Gallery Appearance Settings Card */}
              <Card className="admin-gradient-card">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedCards(prev => ({...prev, gallerySettings: !prev.gallerySettings}))}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-salmon font-saira flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Gallery Appearance
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {expandedCards.gallerySettings ? (
                        <ChevronUp className="w-5 h-5 text-salmon" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-salmon" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedCards.gallerySettings && (
                  <CardContent className="space-y-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Left Panel - Gallery Settings */}
                      <div className="w-full">
                        <div className="space-y-4 w-full gallery-two-column-layout">
                              <GallerySettingsCard
                                gallerySettings={gallerySettings}
                                setGallerySettings={handleGallerySettingsChange}
                                onSave={() => saveImmediately(gallerySettings)}
                                isSaving={isSaving}
                                standalone={false}
                              />
                            </div>
                          </div>
                          
                          {/* Right Panel - Dropdown Controls */}
                          <div className="w-full space-y-4 gallery-two-column-layout">
                            <div className="gallery-slider-container w-full">
                              <div className="gallery-slider-header">
                                <Label className="gallery-slider-label">Layout Style</Label>
                              </div>
                              <div className="mt-2">
                                <Select 
                                  value={gallerySettings.layoutStyle || 'automatic'}
                                  defaultValue="automatic"
                                  onValueChange={(value) => {
                                    handleGallerySettingsChange(prev => ({...prev, layoutStyle: value}));
                                  }}
                                >
                                  <SelectTrigger className="gallery-select-trigger w-full">
                                    <SelectValue placeholder="Select layout..." />
                                  </SelectTrigger>
                                  <SelectContent className="gallery-select-content">
                                    <SelectItem value="automatic">Automatic</SelectItem>
                                    <SelectItem value="square">Square 1:1</SelectItem>
                                    <SelectItem value="portrait">Portrait 2:3</SelectItem>
                                    <SelectItem value="landscape">Landscape 3:2</SelectItem>
                                    <SelectItem value="instagram">Instagram 4:5</SelectItem>
                                    <SelectItem value="upright">Upright 9:16</SelectItem>
                                    <SelectItem value="wide">Wide 16:9</SelectItem>
                                    <SelectItem value="masonry">Masonry</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="gallery-slider-container w-full">
                              <div className="gallery-slider-header">
                                <Label className="gallery-slider-label">Cover Pic Alignment</Label>
                              </div>
                              <div className="mt-2">
                                <Select 
                                  value={gallerySettings.coverPicAlignment || 'centre'}
                                  defaultValue="centre"
                                  onValueChange={(value) => {
                                    handleGallerySettingsChange(prev => ({...prev, coverPicAlignment: value}));
                                  }}
                                >
                                  <SelectTrigger className="gallery-select-trigger w-full">
                                    <SelectValue placeholder="Select alignment..." />
                                  </SelectTrigger>
                                  <SelectContent className="gallery-select-content">
                                    <SelectItem value="top">Top</SelectItem>
                                    <SelectItem value="centre">Centre</SelectItem>
                                    <SelectItem value="bottom">Bottom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="gallery-slider-container w-full">
                              <div className="gallery-slider-header">
                                <Label className="gallery-slider-label">Navigation Position</Label>
                              </div>
                              <div className="mt-2">
                                <Select 
                                  value={gallerySettings.navbarPosition || 'top-left'}
                                  defaultValue="top-left"
                                  onValueChange={(value) => {
                                    // Use setTimeout to prevent immediate re-renders that affect main navigation
                                    setTimeout(() => {
                                      handleGallerySettingsChange(prev => ({...prev, navbarPosition: value}));
                                    }, 0);
                                  }}
                                >
                                  <SelectTrigger className="gallery-select-trigger w-full">
                                    <SelectValue placeholder="Select position..." />
                                  </SelectTrigger>
                                  <SelectContent className="gallery-select-content">
                                    <SelectItem value="top-left">Top Left</SelectItem>
                                    <SelectItem value="top-center">Top Center</SelectItem>
                                    <SelectItem value="top-right">Top Right</SelectItem>
                                    <SelectItem value="center">Center</SelectItem>
                                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
              </Card>

              {/* Gallery Live Preview Card */}
              <Card className="admin-gradient-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-salmon flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Gallery Live Preview
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {(() => {
                        switch (imageOrderSaveStatus.status) {
                          case 'saving':
                            return (
                              <div className="flex items-center gap-2 text-blue-400">
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Saving...</span>
                              </div>
                            );
                          case 'saved':
                            return (
                              <div className="flex items-center gap-2 text-green-400">
                                <div className="w-4 h-4 border-2 border-green-400 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                </div>
                                <span className="text-sm">Saved</span>
                              </div>
                            );
                          case 'error':
                            return (
                              <div className="flex items-center gap-2 text-red-400">
                                <div className="w-4 h-4 border-2 border-red-400 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                </div>
                                <span className="text-sm">Save failed</span>
                              </div>
                            );
                          default:
                            return null;
                        }
                      })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="rounded-lg overflow-hidden"
                    style={{ 
                      backgroundColor: gallerySettings.backgroundColor,
                      minHeight: '400px'
                    }}
                  >
                    {/* Cover Image Strip */}
                    {selectedCover && (() => {
                      const orderedImages = getOrderedImages();
                      const coverImage = orderedImages.find(img => img.id === selectedCover);
                      const coverImageUrl = coverImage?.storagePath ? ImageUrl.forViewing(coverImage.storagePath) : null;
                      
                      return coverImageUrl ? (
                        <div 
                          className="relative h-48 w-full bg-cover flex items-center justify-center"
                          style={{
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${coverImageUrl})`,
                            backgroundPosition: (() => {
                              switch (gallerySettings.coverPicAlignment) {
                                case 'top': return 'center top';
                                case 'bottom': return 'center bottom';
                                case 'centre':
                                default: return 'center center';
                              }
                            })(),
                            marginBottom: `${gallerySettings.imageSpacingValue || 8}px`
                          }}
                        >
                          <h2 className="text-xl font-bold text-white text-center">
                            {shoot?.customTitle || shoot?.title || 'Gallery'}
                          </h2>
                        </div>
                      ) : (
                        <div className="relative h-48 w-full bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600">
                          <div className="text-center text-gray-400">
                            <Eye className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Cover image loading...</p>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Gallery Title when no cover */}
                    {!selectedCover && (
                      <div className="p-4">
                        <h2 className="text-xl font-bold text-white mb-4 text-center">
                          {shoot?.customTitle || shoot?.title || 'Gallery'}
                        </h2>
                      </div>
                    )}
                    
                    {/* Gallery Renderer */}
                    <GalleryRenderer
                      images={getOrderedImages()}
                      gallerySettings={gallerySettings}
                      selectedCover={selectedCover}
                      onCoverChange={setSelectedCover}
                      draggedImage={draggedImage}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onImageClick={(imageId) => {
                        console.log('Preview image clicked:', imageId);
                      }}
                      onViewFullRes={handleViewFullRes}
                      onDownloadImage={handleDownloadImage}
                      isDragReorderingEnabled={isDragReorderingEnabled}
                      visibleImageCount={visibleImageCount}
                      dragStartTime={dragStartTime}
                      onMouseDown={() => setDragStartTime(Date.now())}
                      isAdminMode={true}
                    />
                    
                    {/* Load More Button */}
                    {images.length > visibleImageCount && visibleImageCount < 100 && (
                      <div className="text-center mt-6 p-4">
                        <Button
                          variant="outline"
                          onClick={loadMoreImages}
                          className="px-8 py-2"
                        >
                          Load More Images ({Math.min(20, Math.min(100, images.length) - visibleImageCount)} more)
                        </Button>
                      </div>
                    )}
                    
                    {/* Large Album Notice */}
                    {images.length > 100 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4 mx-4">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Large Album Notice</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          This album has {images.length} images. For performance, only the first 100 images are shown in the preview. You can still reorder the visible images.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        )}

        {/* Preview Album Image Picker */}
        {selectedShoot && workflowStates[selectedShoot]?.state === 'preview' && (
          <div className="space-y-6">
            {/* Preview Header */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={() => setSelectedShoot(null)}
                className="border-border hover:border-cyan"
              >
                ← Back to Galleries
              </Button>
              
            </div>

            {/* Current Preview Album Info */}
            {(() => {
              const currentShoot = shoots.find(s => s.id === selectedShoot);
              const currentPreviewSettings = previewSettings[selectedShoot];
              return currentShoot ? (
                <Card className="admin-gradient-card">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-saira font-bold text-cyan mb-2">
                      {currentShoot.customTitle || currentShoot.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 icon-cyan" />
                        {formatDate(currentShoot.shootDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 icon-salmon" />
                        {currentShoot.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 icon-cyan" />
                        Select up to {currentPreviewSettings?.selectionLimit || 20} images
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Image Picker Interface */}
            <ImagePickerFast 
              shootId={selectedShoot}
              previewSettings={previewSettings[selectedShoot]}
              userEmail={userEmail}
            />
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black border-none">
          {modalImageId && (() => {
            const orderedImages = getOrderedImages();
            const currentImage = orderedImages[currentImageIndex];
            if (!currentImage) return null;
            
            const imageUrl = currentImage?.storagePath ? ImageUrl.forViewing(currentImage.storagePath) : null;
            
            return (
              <div className="relative w-full h-full flex items-center justify-center">
                {imageUrl && (
                  <>
                    {/* Main Image */}
                    <img
                      src={imageUrl}
                      alt={currentImage.filename}
                      className="max-w-full max-h-[95vh] object-contain"
                      style={{ maxHeight: 'calc(100vh - 40px)' }}
                    />
                    
                    {/* Navigation Areas - Left 40% */}
                    <div
                      className="absolute left-0 top-0 w-[40%] h-full cursor-pointer flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity duration-200"
                      onClick={() => navigateModal('prev')}
                      title="Previous image"
                    >
                      <div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
                        <ChevronDown className="w-6 h-6 transform rotate-90" />
                      </div>
                    </div>
                    
                    {/* Navigation Areas - Right 40% */}
                    <div
                      className="absolute right-0 top-0 w-[40%] h-full cursor-pointer flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity duration-200"
                      onClick={() => navigateModal('next')}
                      title="Next image"
                    >
                      <div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
                        <ChevronDown className="w-6 h-6 transform -rotate-90" />
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Image Info */}
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded backdrop-blur-sm">
                      <div className="text-sm">
                        {currentImageIndex + 1} of {orderedImages.length}
                      </div>
                      <div className="text-xs text-gray-300">
                        {currentImage.filename}
                      </div>
                    </div>
                    
                    {/* Download Button */}
                    <div className="absolute bottom-4 right-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                        onClick={() => handleDownloadImage(currentImage.storagePath, currentImage.filename)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
