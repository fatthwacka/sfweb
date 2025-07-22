import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowUp,
  ArrowDown,
  Copy,
  Edit,
  Star,
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  Crown,
  Palette
} from "lucide-react";

interface GalleryImage {
  id: number;
  shootId: number;
  filename: string;
  imagePath: string;
  thumbnailPath: string | null;
  sequenceOrder: number;
  downloadCount: number;
  createdAt: string;
}

interface GalleryEditorProps {
  shootId: number;
}

export function GalleryEditor({ shootId }: GalleryEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('white');
  
  // Fetch shoot data
  const { data: shoot } = useQuery({
    queryKey: ['/api/shoots', shootId],
    queryFn: async () => {
      const response = await fetch(`/api/shoots/${shootId}`);
      if (!response.ok) throw new Error('Failed to fetch shoot');
      return response.json();
    }
  });

  // Fetch images for this shoot
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['/api/images', shootId],
    queryFn: async () => {
      const response = await fetch(`/api/images?shootId=${shootId}`);
      if (!response.ok) throw new Error('Failed to fetch images');
      return response.json();
    }
  });

  // Update shoot customization
  const updateShootMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/shoots/${shootId}/customization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update shoot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      toast({ title: "Gallery settings updated successfully!" });
      setEditMode(false);
    }
  });
  
  const moveImage = (imageId: number, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];
    
    // Update sequence numbers
    newImages.forEach((img, index) => {
      img.sequence = index + 1;
    });
    
    setImages(newImages);
    toast({ title: "Image order updated" });
  };

  const setAlbumCover = (imageId: number) => {
    updateShootMutation.mutate({
      albumCoverId: imageId,
      backgroundColor: backgroundColor,
    });
  };

  const updateGallerySettings = () => {
    updateShootMutation.mutate({
      customTitle: customTitle || null,
      customSlug: customSlug || null,
      backgroundColor: backgroundColor,
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Gallery Settings */}
      <Card className="bg-charcoal/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gold">Gallery Settings</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditMode(!editMode)}
              className="border-border hover:border-gold"
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customTitle">Custom Title</Label>
                  <Input
                    id="customTitle"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Sarah & Michael's Wedding"
                  />
                </div>
                <div>
                  <Label htmlFor="customSlug">Custom URL Slug</Label>
                  <Input
                    id="customSlug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="sarah-michael_SlyFox_wedding_2024"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateGallerySettings} className="bg-gold text-black hover:bg-gold/80">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 icon-salmon" />
                <span className="font-medium">Gallery URL:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">/gallery/sarah-michael_SlyFox_wedding_2024</code>
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText('/gallery/sarah-michael_SlyFox_wedding_2024')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 icon-cyan" />
                <span className="font-medium">Total Images:</span>
                <Badge variant="outline">{images.length}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Management */}
      <Card className="bg-charcoal/80">
        <CardHeader>
          <CardTitle className="text-gold">Image Sequence & Album Cover</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div 
                key={image.id} 
                className={`relative group bg-black/20 rounded-lg overflow-hidden ${
                  selectedCover === image.id ? 'ring-2 ring-gold' : ''
                }`}
              >
                <img 
                  src={image.storagePath} 
                  alt={image.filename}
                  className="w-full h-48 object-cover"
                />
                
                {/* Image Controls Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-2">
                    {/* Move Up */}
                    {index > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => moveImage(image.id, 'up')}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move image up in sequence</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {/* Move Down */}
                    {index < images.length - 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => moveImage(image.id, 'down')}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move image down in sequence</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {/* Set as Cover */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant={selectedCover === image.id ? "default" : "secondary"}
                          onClick={() => setAlbumCover(image.id)}
                          className={selectedCover === image.id ? "bg-gold text-black" : ""}
                        >
                          {selectedCover === image.id ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedCover === image.id ? "Current album cover" : "Set as album cover"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Sequence Number */}
                <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-sm font-bold">
                  #{image.sequence}
                </div>

                {/* Album Cover Badge */}
                {selectedCover === image.id && (
                  <div className="absolute top-2 right-2 bg-gold text-black px-2 py-1 rounded text-sm font-bold">
                    Cover
                  </div>
                )}

                {/* Download Count */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {image.downloadCount}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}