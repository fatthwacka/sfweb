import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowUp,
  ArrowDown,
  Copy,
  Edit,
  Star,
  Download,
  Image as ImageIcon,
  Link as LinkIcon
} from "lucide-react";

interface GalleryImage {
  id: number;
  shootId: number;
  filename: string;
  storagePath: string;
  thumbnailPath: string | null;
  sequence: number;
  downloadCount: number;
  createdAt: string;
}

interface GalleryEditorProps {
  shootId: number;
}

export function GalleryEditor({ shootId }: GalleryEditorProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [selectedCover, setSelectedCover] = useState<number | null>(null);
  
  // Demo data - would be replaced with actual API calls
  const demoImages: GalleryImage[] = [
    { id: 1, shootId, filename: "wedding-1.jpg", storagePath: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 1, downloadCount: 5, createdAt: new Date().toISOString() },
    { id: 2, shootId, filename: "wedding-2.jpg", storagePath: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 2, downloadCount: 3, createdAt: new Date().toISOString() },
    { id: 3, shootId, filename: "wedding-3.jpg", storagePath: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 3, downloadCount: 8, createdAt: new Date().toISOString() },
    { id: 4, shootId, filename: "wedding-4.jpg", storagePath: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 4, downloadCount: 2, createdAt: new Date().toISOString() },
    { id: 5, shootId, filename: "wedding-5.jpg", storagePath: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 5, downloadCount: 6, createdAt: new Date().toISOString() },
    { id: 6, shootId, filename: "wedding-6.jpg", storagePath: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 6, downloadCount: 4, createdAt: new Date().toISOString() },
  ];

  const [images, setImages] = useState(demoImages);
  
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
    setSelectedCover(imageId);
    toast({ title: "Album cover updated" });
  };

  const updateGallerySettings = () => {
    // Would make API call here
    setEditMode(false);
    toast({ title: "Gallery settings updated successfully!" });
  };

  return (
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
                <Button onClick={updateGallerySettings} className="bg-gold text-black hover:bg-gold-muted">
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
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => moveImage(image.id, 'up')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Move Down */}
                    {index < images.length - 1 && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => moveImage(image.id, 'down')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Set as Cover */}
                    <Button 
                      size="sm" 
                      variant={selectedCover === image.id ? "default" : "secondary"}
                      onClick={() => setAlbumCover(image.id)}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
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
  );
}