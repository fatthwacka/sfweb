import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Camera, Download, Heart, Share2, Filter, Grid, 
  Search, Eye, ChevronLeft, ChevronRight, X,
  Calendar, MapPin, User, Mail, Phone
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Image, Shoot, ImageClassification } from "@shared/schema";

interface ClientGalleryProps {
  shootId?: string;
  clientEmail?: string;
}

export const ClientGallery: React.FC<ClientGalleryProps> = ({
  shootId: propShootId,
  clientEmail: propClientEmail
}) => {
  const [match, params] = useRoute('/gallery/:slug');
  const shootId = propShootId || params?.slug;
  const { toast } = useToast();
  
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<ImageClassification | 'all'>('all');
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'square' | 'automatic'>('automatic');
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch shoot details and images
  const { data: shoot, isLoading: shootLoading } = useQuery({
    queryKey: ['gallery', shootId],
    queryFn: async () => {
      if (!shootId) throw new Error('No shoot ID');
      const response = await apiRequest(`/api/gallery/${shootId}`);
      return response as Shoot;
    },
    enabled: !!shootId
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['gallery-images', shootId],
    queryFn: async () => {
      if (!shootId) throw new Error('No shoot ID');
      const response = await apiRequest(`/api/shoots/${shootId}/images`);
      return response as Image[];
    },
    enabled: !!shootId
  });

  // Filter and search images
  const filteredImages = images.filter(image => {
    const matchesSearch = image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.originalName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClassification = classificationFilter === 'all' || image.classification === classificationFilter;
    return matchesSearch && matchesClassification;
  });

  // Auto-detect optimal layout based on image aspect ratios
  useEffect(() => {
    if (layoutMode === 'automatic' && filteredImages.length > 0) {
      // Simulate aspect ratio detection
      const landscapeCount = filteredImages.filter(() => Math.random() > 0.5).length;
      const portraitCount = filteredImages.length - landscapeCount;
      
      // Auto-select best layout
      if (portraitCount > landscapeCount * 1.5) {
        // Mostly portraits - use tighter grid
        console.log('🔍 Auto-detected: Portrait-heavy gallery, using 4-column grid');
      } else if (landscapeCount > portraitCount * 1.5) {
        // Mostly landscapes - use wider grid
        console.log('🔍 Auto-detected: Landscape-heavy gallery, using 3-column grid');
      } else {
        // Mixed content - use masonry
        console.log('🔍 Auto-detected: Mixed content, using masonry layout');
      }
    }
  }, [filteredImages, layoutMode]);

  // Handle image selection and lightbox
  const openLightbox = (imageIndex: number) => {
    setLightboxIndex(imageIndex);
    setSelectedImage(filteredImages[imageIndex]);
  };

  const closeLightbox = () => {
    setLightboxIndex(-1);
    setSelectedImage(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, lightboxIndex - 1)
      : Math.min(filteredImages.length - 1, lightboxIndex + 1);
    
    setLightboxIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  // Handle favorites
  const toggleFavorite = (imageId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(imageId)) {
      newFavorites.delete(imageId);
      toast({ title: 'Removed from favorites' });
    } else {
      newFavorites.add(imageId);
      toast({ title: 'Added to favorites' });
    }
    setFavorites(newFavorites);
  };

  // Handle downloads
  const downloadImage = async (image: Image) => {
    try {
      toast({ title: `Downloading ${image.filename}` });
      // In real implementation, this would trigger actual download
      console.log('📥 Downloading image:', image.filename);
    } catch (error) {
      toast({ title: 'Failed to download image', variant: 'destructive' });
    }
  };

  // Handle sharing
  const shareGallery = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shoot?.title || 'Photo Gallery',
          text: `Check out this photo gallery: ${shoot?.title}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Gallery link copied to clipboard' });
      }
    } catch (error) {
      toast({ title: 'Failed to share gallery', variant: 'destructive' });
    }
  };

  // Grid layout classes
  const getGridClasses = () => {
    if (layoutMode === 'masonry') {
      return 'columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4';
    }
    
    if (layoutMode === 'square') {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
    }
    
    // Automatic layout
    const landscapeRatio = 0.6; // Mock detection result
    if (landscapeRatio > 0.7) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    } else {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
    }
  };

  if (shootLoading || imagesLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-salmon border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!shoot) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">Gallery Not Found</h2>
          <p className="text-gray-400">The requested gallery could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Gallery Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {shoot.customTitle || shoot.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-gray-300 text-sm">
              {shoot.shootDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(shoot.shootDate).toLocaleDateString()}
                </div>
              )}
              {shoot.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {shoot.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {filteredImages.length} photos
              </div>
            </div>
          </div>

          {/* Gallery Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
                />
              </div>

              <Select 
                value={classificationFilter} 
                onValueChange={(value: ImageClassification | 'all') => setClassificationFilter(value)}
              >
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={layoutMode} 
                onValueChange={(value: 'masonry' | 'square' | 'automatic') => setLayoutMode(value)}
              >
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <Grid className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Auto Layout</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="square">Square Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareGallery}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {favorites.size > 0 && (
                <Badge variant="secondary" className="bg-salmon text-white">
                  {favorites.size} favorites
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredImages.length > 0 ? (
          <div className={getGridClasses()}>
            {filteredImages.map((image, index) => (
              <div 
                key={image.id}
                className={`
                  relative group cursor-pointer transition-transform hover:scale-105
                  ${layoutMode === 'masonry' ? 'break-inside-avoid mb-4' : ''}
                  ${layoutMode === 'square' ? 'aspect-square' : ''}
                `}
                onClick={() => openLightbox(index)}
              >
                {/* Mock image placeholder */}
                <div 
                  className="w-full bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg overflow-hidden"
                  style={{ 
                    aspectRatio: layoutMode === 'square' ? '1' : Math.random() > 0.5 ? '4/3' : '3/4',
                    background: `linear-gradient(${45 + (index * 23) % 180}deg, #4a5568, #2d3748)`
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-sm font-medium">{image.classification}</div>
                      <div className="text-xs opacity-75">#{index + 1}</div>
                    </div>
                  </div>
                </div>

                {/* Image overlay controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(image.id);
                      }}
                      className={`
                        ${favorites.has(image.id) ? 'bg-red-500 text-white' : 'bg-white/90 text-black'}
                      `}
                    >
                      <Heart className={`w-4 h-4 ${favorites.has(image.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image);
                      }}
                      className="bg-white/90 text-black"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Classification badge */}
                <Badge 
                  className="absolute bottom-2 left-2 bg-black/75 text-white text-xs"
                  variant="secondary"
                >
                  {image.classification}
                </Badge>

                {/* Favorite indicator */}
                {favorites.has(image.id) && (
                  <Heart className="absolute top-2 right-2 w-5 h-5 text-red-500 fill-current" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No photos found</h3>
            <p className="text-gray-400">
              {searchTerm || classificationFilter !== 'all' 
                ? 'Try adjusting your search or filter settings' 
                : 'This gallery is currently empty'}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && lightboxIndex >= 0 && (
        <Dialog open={true} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-7xl w-full h-full bg-black border-none p-0">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Navigation buttons */}
              {lightboxIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateLightbox('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              )}

              {lightboxIndex < filteredImages.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateLightbox('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              )}

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center p-8">
                <div 
                  className="max-w-full max-h-full bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center"
                  style={{ 
                    aspectRatio: Math.random() > 0.5 ? '4/3' : '3/4',
                    minHeight: '400px',
                    minWidth: '300px'
                  }}
                >
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{selectedImage.classification}</h3>
                    <p className="text-gray-300">{selectedImage.filename}</p>
                  </div>
                </div>
              </div>

              {/* Image info */}
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm">
                  {lightboxIndex + 1} of {filteredImages.length}
                </p>
                <p className="text-xs text-gray-300">{selectedImage.filename}</p>
              </div>

              {/* Actions */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleFavorite(selectedImage.id)}
                  className={`
                    ${favorites.has(selectedImage.id) ? 'bg-red-500 text-white' : 'bg-white/90 text-black'}
                  `}
                >
                  <Heart className={`w-4 h-4 ${favorites.has(selectedImage.id) ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadImage(selectedImage)}
                  className="bg-white/90 text-black"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientGallery;