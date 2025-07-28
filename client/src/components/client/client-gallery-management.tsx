import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImageUrl } from "@/lib/image-utils";
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Palette, 
  Eye,
  Save,
  Camera,
  Settings,
  Crown,
  X,
  Trash2,
  MousePointer
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

interface ClientGalleryManagementProps {
  userEmail: string;
}

export function ClientGalleryManagement({ userEmail }: ClientGalleryManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [expandedCards, setExpandedCards] = useState({
    shootInfo: false,
    gallerySettings: false,
    livePreview: true
  });

  // Gallery settings state - matching admin panel structure
  const [gallerySettings, setGallerySettings] = useState({
    backgroundColor: '#ffffff',
    borderStyle: 'sharp',
    padding: 'tight',
    layoutStyle: 'grid',
    imageSpacing: 'tight'
  });

  // Image management state
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [visibleImageCount, setVisibleImageCount] = useState(20);
  
  // Fetch client's shoots
  const { data: shoots = [], isLoading: shootsLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/client/shoots", userEmail],
    queryFn: () => fetch(`/api/client/shoots?email=${encodeURIComponent(userEmail)}`).then(res => res.json()),
  });

  // Fetch images for selected shoot
  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/shoots", selectedShootId, "images"],
    queryFn: () => fetch(`/api/shoots/${selectedShootId}/images`).then(res => res.json()),
    enabled: !!selectedShootId,
  });

  // Auto-select single shoot
  useEffect(() => {
    if (shoots.length === 1 && !selectedShootId) {
      setSelectedShootId(shoots[0].id);
    }
  }, [shoots, selectedShootId]);

  const selectedShoot = shoots.find(s => s.id === selectedShootId);

  // Initialize gallery settings from shoot data
  useEffect(() => {
    if (selectedShoot?.gallerySettings) {
      setGallerySettings(selectedShoot.gallerySettings);
    }
    if (selectedShoot?.bannerImageId) {
      setSelectedCover(selectedShoot.bannerImageId);
    }
  }, [selectedShoot]);

  const toggleCard = (card: keyof typeof expandedCards) => {
    setExpandedCards(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  // Mutations for client gallery management
  const updateShootInfoMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${selectedShootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/shoots", userEmail] });
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", selectedShootId, "images"] });
      toast({ title: "Shoot info updated successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update shoot info", variant: "destructive" })
  });

  const updateGallerySettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/shoots/${selectedShootId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/shoots", userEmail] });
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", selectedShootId, "images"] });
      toast({ title: "Gallery settings updated successfully!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update gallery settings", variant: "destructive" })
  });

  // Image management functions
  const handleDragStart = (imageId: string) => {
    setDraggedImage(imageId);
    setDragStartTime(Date.now());
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
  };

  const handleDrop = (targetImageId: string) => {
    if (!draggedImage || draggedImage === targetImageId) return;
    
    const draggedIndex = images.findIndex(img => img.id === draggedImage);
    const targetIndex = images.findIndex(img => img.id === targetImageId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Update sequence order optimistically
    const newImages = [...images];
    const [draggedImg] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImg);
    
    // Update sequences
    const imageSequences = Object.fromEntries(
      newImages.map((img, index) => [img.id, index + 1])
    );
    
    updateGallerySettingsMutation.mutate({ imageSequences });
  };

  const setAlbumCover = (imageId: string) => {
    const newCover = selectedCover === imageId ? null : imageId;
    setSelectedCover(newCover);
    updateGallerySettingsMutation.mutate({ bannerImageId: newCover });
  };

  const handleViewFullRes = (storagePath: string) => {
    window.open(ImageUrl.forDownload(storagePath), '_blank');
  };

  const handleRemoveImage = (imageId: string) => {
    // Move image to SlyFox archive
    apiRequest('PATCH', `/api/images/${imageId}`, { shootId: '676d656f-4c38-4530-97f8-415742188acf' })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/shoots", selectedShootId, "images"] });
        toast({ title: "Success", description: "Image moved to SlyFox archive" });
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to remove image", variant: "destructive" });
      });
  };



  if (shootsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salmon"></div>
      </div>
    );
  }

  if (shoots.length === 0) {
    return (
      <div className="text-center p-8">
        <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Galleries Found</h3>
        <p className="text-muted-foreground">Contact SlyFox Studios to have your galleries set up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Select Shoot to Manage */}
      <Card className="admin-gradient-card">
        <CardHeader>
          <CardTitle className="text-salmon font-saira">Select Gallery to Manage</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedShootId} onValueChange={setSelectedShootId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a gallery to manage..." />
            </SelectTrigger>
            <SelectContent>
              {shoots.map((shoot) => (
                <SelectItem key={shoot.id} value={shoot.id}>
                  {shoot.customTitle || shoot.title} - {new Date(shoot.shootDate).toLocaleDateString()} - {shoot.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedShoot && (
        <>
          {/* Card 1: Shoot Info - Clients can edit Location and Gallery Title */}
          <Card className="admin-gradient-card">
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleCard('shootInfo')}
            >
              <CardTitle className="text-salmon font-saira flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shoot Info
              </CardTitle>
              <div className="flex items-center gap-2">
                {expandedCards.shootInfo && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const locationValue = (document.getElementById('location') as HTMLInputElement)?.value || selectedShoot.location;
                      const titleValue = (document.getElementById('customTitle') as HTMLInputElement)?.value || selectedShoot.customTitle;
                      updateShootInfoMutation.mutate({
                        location: locationValue,
                        customTitle: titleValue
                      });
                    }}
                    disabled={updateShootInfoMutation.isPending}
                    className="bg-salmon text-white hover:bg-salmon-muted"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateShootInfoMutation.isPending ? 'Saving...' : 'Save Info'}
                  </Button>
                )}
                {expandedCards.shootInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {expandedCards.shootInfo && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      defaultValue={selectedShoot.location}
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
                      defaultValue={selectedShoot.customTitle || selectedShoot.title}
                      placeholder="Custom title for your gallery"
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be displayed as your gallery heading
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Card 2: Gallery Settings - Complete clone from admin panel */}
          <Card className="admin-gradient-card">
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleCard('gallerySettings')}
            >
              <CardTitle className="text-salmon font-saira flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Gallery Settings
              </CardTitle>
              <div className="flex items-center gap-2">
                {expandedCards.gallerySettings && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateGallerySettingsMutation.mutate({
                        gallerySettings: gallerySettings,
                        bannerImageId: selectedCover
                      });
                    }}
                    disabled={updateGallerySettingsMutation.isPending}
                    className="bg-salmon text-white hover:bg-salmon-muted"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateGallerySettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                )}
                {expandedCards.gallerySettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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

          {/* Card 3: Live Preview - Complete clone with drag/drop and 4-button hover */}
          <Card className="admin-gradient-card">
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleCard('livePreview')}
            >
              <CardTitle className="text-salmon font-saira flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              {expandedCards.livePreview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardHeader>
            {expandedCards.livePreview && (
              <CardContent>
                {imagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salmon mx-auto mb-4"></div>
                      <p>Loading images...</p>
                    </div>
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center p-8">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Images Yet</h3>
                    <p className="text-muted-foreground">Images will appear here once uploaded by SlyFox Studios.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        <MousePointer className="w-4 h-4 inline mr-1" />
                        Drag and drop to reorder images • Hover for options
                      </p>
                      <Badge variant="secondary">
                        {images.length} {images.length === 1 ? 'image' : 'images'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {images.slice(0, visibleImageCount).map((image) => (
                        <div
                          key={image.id}
                          className={`group relative cursor-pointer bg-background rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl ${
                            draggedImage === image.id ? 'opacity-50' : ''
                          } ${
                            gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : 
                            gallerySettings.borderStyle === 'circular' ? 'rounded-full aspect-square' : 
                            gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-lg'
                          }`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            handleDragStart(image.id);
                          }}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(image.id);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onMouseDown={() => setDragStartTime(Date.now())}
                        >
                          <img
                            src={ImageUrl.forViewing(image.storagePath)}
                            alt={image.filename}
                            className={`w-full h-full object-cover ${
                              gallerySettings.borderStyle === 'circular' ? 'aspect-square' : 'h-auto'
                            }`}
                          />
                          
                          {/* 4-Button Hover System - Exact clone from admin */}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-purple-600 text-white hover:bg-purple-700"
                                title="View Full Resolution"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFullRes(image.storagePath);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className={selectedCover === image.id ? 
                                  "bg-gold text-black hover:bg-gold-muted" : 
                                  "bg-salmon text-white hover:bg-salmon-muted"
                                }
                                title={selectedCover === image.id ? "Remove as Cover" : "Make Cover"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAlbumCover(image.id);
                                }}
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-yellow-600 text-white hover:bg-yellow-700"
                                title="Remove from Album"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Remove this image from your album? It will be moved to SlyFox archive.')) {
                                    handleRemoveImage(image.id);
                                  }
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-red-600 text-white hover:bg-red-700"
                                title="Delete Permanently"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast({ title: "Delete functionality not available to clients", description: "Contact SlyFox Studios for permanent deletions", variant: "destructive" });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Cover indicator */}
                          {selectedCover === image.id && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gold text-black">
                                <Crown className="w-3 h-3 mr-1" />
                                Cover
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Load More Button */}
                    {images.length > visibleImageCount && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          onClick={() => setVisibleImageCount(prev => Math.min(prev + 20, images.length))}
                          className="border-salmon text-salmon hover:bg-salmon hover:text-white"
                        >
                          Load More ({Math.min(20, images.length - visibleImageCount)} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// Basic Info Form Component
function BasicInfoForm({ shoot, onSave, isLoading }: {
  shoot: Shoot;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [location, setLocation] = useState(shoot.location || "");
  const [customTitle, setCustomTitle] = useState(shoot.customTitle || "");

  const handleSave = () => {
    onSave({
      location: location.trim(),
      customTitle: customTitle.trim() || null
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location">Gallery Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Cape Town Vineyards"
        />
      </div>
      
      <div>
        <Label htmlFor="customTitle">Custom Gallery Title</Label>
        <Input
          id="customTitle"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Leave empty to use the shoot title"
        />
        <p className="text-sm text-muted-foreground mt-1">
          This will be displayed as your gallery title instead of "{shoot.title}"
        </p>
      </div>

      <Button 
        onClick={handleSave}
        disabled={isLoading}
        className="bg-salmon text-white hover:bg-salmon-muted"
      >
        <Save className="w-4 h-4 mr-2" />
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

// Appearance Form Component  
function AppearanceForm({ shoot, onSave, isLoading }: {
  shoot: Shoot;
  onSave: (settings: any) => void;
  isLoading: boolean;
}) {
  const [settings, setSettings] = useState(shoot.gallerySettings || {
    padding: "normal",
    borderStyle: "rounded",
    layoutStyle: "grid",
    imageSpacing: "normal",
    backgroundColor: "#ffffff"
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Border Style</Label>
          <Select value={settings.borderStyle} onValueChange={(value) => 
            setSettings(prev => ({ ...prev, borderStyle: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sharp">Sharp Corners</SelectItem>
              <SelectItem value="rounded">Rounded Corners</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Image Spacing</Label>
          <Select value={settings.imageSpacing} onValueChange={(value) => 
            setSettings(prev => ({ ...prev, imageSpacing: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tight">Tight</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="loose">Loose</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Background Color</Label>
        <Input
          type="color"
          value={settings.backgroundColor}
          onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
          className="w-full h-12"
        />
      </div>

      <Button 
        onClick={handleSave}
        disabled={isLoading}
        className="bg-salmon text-white hover:bg-salmon-muted"
      >
        <Save className="w-4 h-4 mr-2" />
        {isLoading ? "Saving..." : "Save Appearance"}
      </Button>
    </div>
  );
}

// Gallery Preview Component
function GalleryPreview({ shoot, images, isLoading }: {
  shoot: Shoot;
  images: Image[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-salmon"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No images in this gallery yet.
      </div>
    );
  }

  const settings = shoot.gallerySettings || {};
  
  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
      style={{ 
        backgroundColor: settings.backgroundColor || "#ffffff",
        padding: settings.padding === "tight" ? "8px" : settings.padding === "loose" ? "24px" : "16px"
      }}
    >
      {images.slice(0, 12).map((image) => (
        <div
          key={image.id}
          className={`aspect-square overflow-hidden ${
            settings.borderStyle === "circular" ? "rounded-full" :
            settings.borderStyle === "sharp" ? "rounded-none" : "rounded-lg"
          }`}
          style={{
            margin: settings.imageSpacing === "tight" ? "2px" : 
                   settings.imageSpacing === "loose" ? "8px" : "4px"
          }}
        >
          <img
            src={ImageUrl.forViewing(image.storagePath)}
            alt={image.originalName}
            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
          />
        </div>
      ))}
      {images.length > 12 && (
        <div className="aspect-square flex items-center justify-center bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">+{images.length - 12} more</span>
        </div>
      )}
    </div>
  );
}