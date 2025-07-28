import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, Crown, X, Trash2, MousePointer, Camera } from "lucide-react";
import { ImageUrl } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Image {
  id: string;
  filename: string;
  storagePath: string;
  sequence: number;
}

interface Shoot {
  id: string;
  title: string;
  customTitle?: string;
  bannerImageId?: string;
}

interface GallerySettings {
  backgroundColor: string;
  layoutStyle: string;
  borderStyle: string;
  imageSpacing: string;
}

interface GalleryLivePreviewProps {
  shoot: Shoot | null;
  images: Image[];
  imagesLoading: boolean;
  gallerySettings: GallerySettings;
  selectedCover: string | null;
  setSelectedCover: (id: string | null) => void;
  imageOrder: string[];
  setImageOrder: React.Dispatch<React.SetStateAction<string[]>>;
  visibleImageCount: number;
  setVisibleImageCount: React.Dispatch<React.SetStateAction<number>>;
  isClientMode?: boolean;
  onRemoveImage?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
  onViewFullRes?: (storagePath: string) => void;
}

export function GalleryLivePreview({
  shoot,
  images,
  imagesLoading,
  gallerySettings,
  selectedCover,
  setSelectedCover,
  imageOrder,
  setImageOrder,
  visibleImageCount,
  setVisibleImageCount,
  isClientMode = false,
  onRemoveImage,
  onDeleteImage,
  onViewFullRes
}: GalleryLivePreviewProps) {
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const isDragReorderingEnabled = images.length <= 100;

  const handleSaveOrder = async () => {
    if (!shoot) return;
    
    try {
      const imageSequences = imageOrder.length > 0 
        ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
        : {};
      
      await apiRequest('PATCH', `/api/shoots/${shoot.id}`, {
        bannerImageId: selectedCover,
        imageSequences: imageSequences
      });
      
      // Invalidate queries based on mode
      if (isClientMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/client/shoots'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/shoots'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/shoots', shoot.id] });
      
      toast({ title: "Image order and cover saved successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save image order", variant: "destructive" });
    }
  };

  const handleCoverSelection = async (imageId: string) => {
    if (!shoot) return;
    
    const newCover = selectedCover === imageId ? null : imageId;
    setSelectedCover(newCover);
    
    try {
      await apiRequest('PATCH', `/api/shoots/${shoot.id}`, {
        bannerImageId: newCover
      });
      
      if (isClientMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/client/shoots'] });
      }
      
      toast({ 
        title: "Cover image updated!", 
        description: newCover ? "New cover set" : "Cover removed" 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update cover", variant: "destructive" });
      setSelectedCover(selectedCover); // Revert on error
    }
  };

  const handleImageAction = (action: string, imageId: string, storagePath?: string) => {
    switch (action) {
      case 'viewFullRes':
        if (onViewFullRes && storagePath) {
          onViewFullRes(storagePath);
        } else if (storagePath) {
          window.open(ImageUrl.forFullSize(storagePath), '_blank');
        }
        break;
      case 'makeCover':
        handleCoverSelection(imageId);
        break;
      case 'remove':
        if (isClientMode) {
          if (confirm('Remove this image from your album? It will be moved to SlyFox archive.')) {
            toast({ title: "Image removed from album", description: "Image moved to SlyFox archive" });
          }
        } else if (onRemoveImage) {
          onRemoveImage(imageId);
        }
        break;
      case 'delete':
        if (isClientMode) {
          toast({ 
            title: "Delete functionality not available to clients", 
            description: "Contact SlyFox Studios for permanent deletions", 
            variant: "destructive" 
          });
        } else if (onDeleteImage) {
          onDeleteImage(imageId);
        }
        break;
    }
  };

  const renderImageGrid = (isMasonry: boolean) => {
    const containerClass = isMasonry 
      ? "columns-2 md:columns-3 lg:columns-4"
      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    
    const containerStyle = { 
      gap: gallerySettings.imageSpacing === 'tight' ? '2px' : 
           gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
    };

    return (
      <div className={containerClass} style={containerStyle}>
        {getOrderedImages().slice(0, visibleImageCount).map((image) => {
          const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
          
          return (
            <div 
              key={image.id}
              className={`
                relative group overflow-hidden 
                ${isMasonry ? 'break-inside-avoid' : 'aspect-square'}
                ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : 
                  gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full aspect-square'}
                ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                ${draggedImage === image.id ? 'opacity-50' : ''}
                cursor-pointer transition-all duration-200
              `}
              style={isMasonry ? { 
                marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : 
                             gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
              } : {}}
              draggable={isDragReorderingEnabled}
              onDragStart={(e) => {
                if (!isDragReorderingEnabled) {
                  e.preventDefault();
                  return;
                }
                setDraggedImage(image.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => setDraggedImage(null)}
              onDragOver={(e) => isDragReorderingEnabled && e.preventDefault()}
              onDrop={(e) => {
                if (!isDragReorderingEnabled) return;
                e.preventDefault();
                if (draggedImage && draggedImage !== image.id) {
                  setImageOrder(currentOrder => {
                    const newOrder = [...currentOrder];
                    const draggedIndex = newOrder.indexOf(draggedImage);
                    const targetIndex = newOrder.indexOf(image.id);
                    
                    if (draggedIndex !== -1 && targetIndex !== -1) {
                      newOrder.splice(draggedIndex, 1);
                      newOrder.splice(targetIndex, 0, draggedImage);
                    }
                    return newOrder;
                  });
                }
                setDraggedImage(null);
              }}
              onMouseDown={() => setDragStartTime(Date.now())}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={image.filename}
                  className={`w-full object-cover ${
                    isMasonry 
                      ? (gallerySettings.borderStyle === 'circular' ? 'h-full aspect-square' : 'h-auto')
                      : 'h-full'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.image-error-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = `image-error-placeholder flex items-center justify-center ${
                        isMasonry ? 'h-32' : 'w-full h-full'
                      } bg-gray-800 text-gray-400 text-sm`;
                      placeholder.innerHTML = 'Image unavailable';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div className={`flex items-center justify-center ${
                  isMasonry ? 'h-32' : 'w-full h-full'
                } bg-gray-800 text-gray-400 text-sm`}>
                  Loading...
                </div>
              )}
            
              {/* Hover Buttons */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    title="View Full Resolution"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageAction('viewFullRes', image.id, image.storagePath);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-salmon text-white hover:bg-salmon-muted"
                    title="Make Cover"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageAction('makeCover', image.id);
                    }}
                  >
                    <Crown className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary" 
                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                    title={isClientMode ? "Remove from Album" : "Remove from Album"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageAction('remove', image.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    title={isClientMode ? "Delete Permanently (Client Restricted)" : "Delete from Database"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageAction('delete', image.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Cover Badge */}
              {selectedCover === image.id && (
                <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                  Cover
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="admin-gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-salmon flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Gallery Live Preview
          </CardTitle>
          <Button 
            onClick={handleSaveOrder}
            className="bg-salmon hover:bg-salmon-muted text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Order
          </Button>
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
                className="relative h-48 w-full bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${coverImageUrl})`,
                  marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : 
                               gallerySettings.imageSpacing === 'normal' ? '8px' : '16px'
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
          
          {/* Image Grid */}
          <div className="p-4">
            {!selectedCover && (
              <h2 className="text-xl font-bold text-white mb-4 text-center">
                {shoot?.customTitle || shoot?.title || 'Gallery'}
              </h2>
            )}
          
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
                <p className="text-muted-foreground">
                  {isClientMode 
                    ? "Images will appear here once uploaded by SlyFox Studios."
                    : "Upload images to get started with this gallery."
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    <MousePointer className="w-4 h-4 inline mr-1" />
                    Drag and drop to reorder images • Hover for options
                  </p>
                  <Badge variant="secondary">
                    {images.length} {images.length === 1 ? 'image' : 'images'}
                  </Badge>
                </div>
                
                {/* Large Album Notice */}
                {images.length > 100 && (
                  <div className="mb-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                    <p className="text-amber-400 text-sm">
                      <strong>Large Album ({images.length} images):</strong> Drag reordering disabled for performance. 
                      Showing first 100 images with pagination.
                    </p>
                  </div>
                )}
                
                {/* Render appropriate grid */}
                {gallerySettings.layoutStyle === 'masonry' 
                  ? renderImageGrid(true)
                  : renderImageGrid(false)
                }
                
                {/* Load More Button */}
                {images.length > visibleImageCount && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => setVisibleImageCount(prev => Math.min(prev + 20, 100))}
                      variant="outline"
                      className="text-salmon border-salmon hover:bg-salmon/10"
                      disabled={visibleImageCount >= 100}
                    >
                      {visibleImageCount >= 100 ? (
                        "100 Image Limit Reached"
                      ) : (
                        `Load More (${Math.min(20, images.length - visibleImageCount)} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}