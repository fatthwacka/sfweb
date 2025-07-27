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
  Camera
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
    basicInfo: false,
    appearance: false,
    preview: true
  });
  
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

  const toggleCard = (card: keyof typeof expandedCards) => {
    setExpandedCards(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  // Update basic info mutation
  const updateBasicInfoMutation = useMutation({
    mutationFn: async (data: { location?: string; customTitle?: string }) => {
      return apiRequest('PATCH', `/api/shoots/${selectedShootId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/shoots"] });
      toast({ title: "Gallery updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update gallery", variant: "destructive" });
    }
  });

  // Update appearance mutation
  const updateAppearanceMutation = useMutation({
    mutationFn: async (gallerySettings: any) => {
      return apiRequest('PATCH', `/api/shoots/${selectedShootId}`, { gallerySettings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/shoots"] });
      toast({ title: "Gallery appearance updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update appearance", variant: "destructive" });
    }
  });

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
          {/* Basic Shoot Info */}
          <Card className="admin-gradient-card">
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleCard('basicInfo')}
            >
              <CardTitle className="text-salmon font-saira flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Gallery Settings
              </CardTitle>
              {expandedCards.basicInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardHeader>
            {expandedCards.basicInfo && (
              <CardContent className="space-y-4">
                <BasicInfoForm 
                  shoot={selectedShoot}
                  onSave={(data) => updateBasicInfoMutation.mutate(data)}
                  isLoading={updateBasicInfoMutation.isPending}
                />
              </CardContent>
            )}
          </Card>

          {/* Gallery Appearance */}
          <Card className="admin-gradient-card">
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleCard('appearance')}
            >
              <CardTitle className="text-salmon font-saira flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Gallery Appearance
              </CardTitle>
              {expandedCards.appearance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardHeader>
            {expandedCards.appearance && (
              <CardContent className="space-y-4">
                <AppearanceForm 
                  shoot={selectedShoot}
                  onSave={(settings) => updateAppearanceMutation.mutate(settings)}
                  isLoading={updateAppearanceMutation.isPending}
                />
              </CardContent>
            )}
          </Card>

          {/* Gallery Live Preview */}
          <Card className="admin-gradient-card">
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleCard('preview')}
            >
              <CardTitle className="text-salmon font-saira flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Gallery Live Preview
              </CardTitle>
              {expandedCards.preview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardHeader>
            {expandedCards.preview && (
              <CardContent>
                <GalleryPreview 
                  shoot={selectedShoot}
                  images={images}
                  isLoading={imagesLoading}
                />
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