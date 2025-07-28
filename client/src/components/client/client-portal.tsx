import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUrl } from "@/lib/image-utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { GalleryLivePreview } from "@/components/shared/gallery-live-preview";
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
  ChevronDown
} from "lucide-react";

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
    borderStyle: "rounded", 
    imageSpacing: "normal"
  });
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [visibleImageCount, setVisibleImageCount] = useState(20);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [imageOrder, setImageOrder] = useState<string[]>([]);

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

  // Debug logging
  console.log('Shoots loading:', shootsLoading, 'Error:', error, 'Shoots count:', shoots.length);
  console.log('Shoots data:', shoots);

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
      setGallerySettings({
        backgroundColor: settings.backgroundColor || '#1a1a1a',
        borderStyle: settings.borderStyle || 'rounded',
        layoutStyle: settings.layoutStyle || 'masonry',
        imageSpacing: settings.imageSpacing || 'normal'
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

  // Get ordered images for display
  const getOrderedImages = () => {
    if (imageOrder.length === 0) return images;
    
    const imageMap = new Map(images.map(img => [img.id, img]));
    const orderedImages = imageOrder
      .map(id => imageMap.get(id))
      .filter(Boolean) as Image[];
    
    // Add any new images not in order yet
    const orderedIds = new Set(imageOrder);
    const newImages = images.filter(img => !orderedIds.has(img.id));
    
    return [...orderedImages, ...newImages];
  };

  const filteredShoots = shoots.filter(shoot => {
    const matchesSearch = shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shoot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shoot.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || shoot.shootType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueShootTypes = Array.from(new Set(shoots.map(shoot => shoot.shootType)));

  const handleDownloadImage = async (image: Image) => {
    try {
      // Use full resolution URL for downloads
      const response = await fetch(ImageUrl.forFullSize(image.storagePath));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.originalName || image.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleViewFullRes = (image: Image) => {
    // Open full resolution image in new tab
    window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
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
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-saira font-bold text-salmon mb-2">
                Welcome back{userName ? `, ${userName}` : ''}
              </h1>
              <p className="text-muted-foreground">
                Access your private galleries and download your photos
              </p>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-lg border border-border">
                <User className="w-4 h-4 text-cyan" />
                <span className="text-sm">{userEmail}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="border-border hover:border-salmon"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4 text-sm">
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
                          <CardTitle className="text-salmon text-lg">
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
                        className="w-full bg-salmon text-white hover:bg-salmon-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShoot(shoot.id);
                        }}
                      >
                        View Gallery
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Image Gallery View */}
        {selectedShoot && (
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
                    <div className="flex items-center gap-2">
                      {expandedCards.gallerySettings && (
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await apiRequest('PATCH', `/api/shoots/${selectedShoot}`, {
                                gallerySettings: gallerySettings
                              });
                              queryClient.invalidateQueries({ queryKey: ['/api/client/shoots'] });
                              queryClient.invalidateQueries({ queryKey: ['/api/shoots', selectedShoot] });
                              toast({ title: "Gallery settings updated successfully!" });
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to save gallery settings", variant: "destructive" });
                            }
                          }}
                          className="bg-salmon text-white hover:bg-salmon-muted"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </Button>
                      )}
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
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Background Color</Label>
                        <Select 
                          value={gallerySettings.backgroundColor} 
                          onValueChange={(value) => setGallerySettings(prev => ({...prev, backgroundColor: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="#1a1a1a">Dark Charcoal</SelectItem>
                            <SelectItem value="#000000">Pure Black</SelectItem>
                            <SelectItem value="#2d2d2d">Medium Dark</SelectItem>
                            <SelectItem value="#ffffff">Pure White</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Layout Style</Label>
                        <Select 
                          value={gallerySettings.layoutStyle} 
                          onValueChange={(value) => setGallerySettings(prev => ({...prev, layoutStyle: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masonry">Masonry (Pinterest-style)</SelectItem>
                            <SelectItem value="grid">Square Grid</SelectItem>
                            <SelectItem value="columns">Equal Columns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Border Style</Label>
                        <Select 
                          value={gallerySettings.borderStyle} 
                          onValueChange={(value) => setGallerySettings(prev => ({...prev, borderStyle: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rounded">Rounded Corners</SelectItem>
                            <SelectItem value="sharp">Sharp Corners</SelectItem>
                            <SelectItem value="circular">Circular (for portraits)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Image Spacing</Label>
                        <Select 
                          value={gallerySettings.imageSpacing} 
                          onValueChange={(value) => setGallerySettings(prev => ({...prev, imageSpacing: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tight">Tight (2px gaps)</SelectItem>
                            <SelectItem value="normal">Normal (8px gaps)</SelectItem>
                            <SelectItem value="loose">Loose (16px gaps)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Gallery Live Preview - Using Shared Component */}
              <GalleryLivePreview
                shoot={shoot}
                images={images}
                gallerySettings={gallerySettings}
                selectedCover={selectedCover}
                setSelectedCover={setSelectedCover}
                imageOrder={imageOrder}
                setImageOrder={setImageOrder}
                visibleImageCount={visibleImageCount}
                setVisibleImageCount={setVisibleImageCount}
                getOrderedImages={getOrderedImages}
                onSaveOrder={handleSaveOrder}
                isSaving={false}
              />
            </div>


          </div>
        )}
      </div>
    </div>
  );
}
