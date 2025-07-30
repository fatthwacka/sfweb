import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, Save, Crown, X, Trash2, AlertTriangle } from "lucide-react";
import { ImageUrl } from "@/lib/image-utils";

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
  gallerySettings: GallerySettings;
  selectedCover: string | null;
  setSelectedCover: (id: string | null) => void;
  imageOrder: string[];
  setImageOrder: React.Dispatch<React.SetStateAction<string[]>>;
  visibleImageCount: number;
  setVisibleImageCount: React.Dispatch<React.SetStateAction<number>>;
  getOrderedImages: () => Image[];
  onSaveOrder: () => void;
  isSaving?: boolean;
  onRemoveImage?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
  onViewFullRes?: (storagePath: string) => void;
}

export function GalleryLivePreview({
  shoot,
  images,
  gallerySettings,
  selectedCover,
  setSelectedCover,
  imageOrder,
  setImageOrder,
  visibleImageCount,
  setVisibleImageCount,
  getOrderedImages,
  onSaveOrder,
  isSaving = false,
  onRemoveImage,
  onDeleteImage,
  onViewFullRes
}: GalleryLivePreviewProps) {
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Map<string, number>>(new Map());

  const isDragReorderingEnabled = images.length <= 100;

  // Analyze image aspect ratios for automatic layout
  const analyzeImageAspectRatios = (images: Image[]) => {
    images.forEach(image => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        setImageAspectRatios(prev => new Map(prev).set(image.id, ratio));
      };
      img.src = ImageUrl.forViewing(image.storagePath);
    });
  };

  // Get most common aspect ratio
  const getMostCommonAspectRatio = (): number => {
    if (imageAspectRatios.size === 0) return 3/2; // Default fallback
    
    const ratioFrequency: { [key: number]: number } = {};
    Array.from(imageAspectRatios.values()).forEach(ratio => {
      const roundedRatio = Math.round(ratio * 100) / 100;
      ratioFrequency[roundedRatio] = (ratioFrequency[roundedRatio] || 0) + 1;
    });
    
    const mostCommon = Object.keys(ratioFrequency)
      .reduce((a, b) => ratioFrequency[parseFloat(a)] > ratioFrequency[parseFloat(b)] ? a : b);
    
    return parseFloat(mostCommon);
  };

  // Get responsive grid classes
  const getGridClasses = () => {
    return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // Get gap spacing based on gallery settings
  const getGapClass = () => {
    const spacing = gallerySettings.imageSpacing;
    if (spacing === 'tight') return 'gap-0.5';
    if (spacing === 'normal') return 'gap-2';
    if (spacing === 'loose') return 'gap-4';
    return 'gap-1'; // default
  };

  // Analyze images when they load
  useEffect(() => {
    if (images.length > 0) {
      analyzeImageAspectRatios(images);
    }
  }, [images]);

  // Load more images handler
  const loadMoreImages = () => {
    setVisibleImageCount(prev => Math.min(prev + 20, Math.min(100, images.length)));
  };

  return (
    <>
      <Card className="admin-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-salmon flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Gallery Live Preview
            </CardTitle>
            <Button 
              onClick={onSaveOrder}
              disabled={isSaving}
              className="bg-salmon hover:bg-salmon-muted text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Order
                </>
              )}
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
                    marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px'
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
            
              {gallerySettings.layoutStyle === 'masonry' ? (
                <div 
                  className="columns-2 md:columns-3 lg:columns-4"
                  style={{ 
                    gap: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                  }}
                >
                  {getOrderedImages().slice(0, visibleImageCount).map((image, index) => {
                    const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                    
                    return (
                      <div 
                        key={image.id}
                        className={`
                          relative group overflow-hidden break-inside-avoid 
                          ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full aspect-square'}
                          ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                          ${draggedImage === image.id ? 'opacity-50' : ''}
                          cursor-pointer transition-all duration-200
                        `}
                        style={{ 
                          marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                        }}
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
                                // Remove from old position
                                newOrder.splice(draggedIndex, 1);
                                // Insert at new position  
                                newOrder.splice(targetIndex, 0, draggedImage);
                              }
                              return newOrder;
                            });
                          }
                          setDraggedImage(null);
                        }}
                        onMouseDown={(e) => setDragStartTime(Date.now())}
                        onClick={(e) => {
                          const clickDuration = Date.now() - dragStartTime;
                          if (clickDuration < 200) { // Quick click = modal
                            setSelectedImageModal(image.id);
                          }
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={image.filename}
                            className={`w-full object-cover ${gallerySettings.borderStyle === 'circular' ? 'h-full aspect-square' : 'h-auto'}`}
                            onError={(e) => {
                              // Fallback to a placeholder on image load error
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.image-error-placeholder')) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'image-error-placeholder flex items-center justify-center h-32 bg-gray-800 text-gray-400 text-sm';
                                placeholder.innerHTML = 'Image unavailable';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-gray-800 text-gray-400 text-sm">
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
                                if (onViewFullRes) {
                                  onViewFullRes(image.storagePath);
                                } else {
                                  window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
                                }
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
                                const newCover = selectedCover === image.id ? null : image.id;
                                setSelectedCover(newCover);
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
                                if (onRemoveImage) {
                                  onRemoveImage(image.id);
                                }
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              title="Delete from Database"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteImage) {
                                  onDeleteImage(image.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {selectedCover === image.id && (
                          <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                            Cover
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : gallerySettings.layoutStyle === 'grid' ? (
                <div className={`${getGridClasses()} ${getGapClass()}`}>
                  {getOrderedImages().slice(0, visibleImageCount).map((image, index) => {
                    const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                    
                    return (
                      <div 
                        key={image.id}
                        className={`
                          relative group overflow-hidden aspect-square
                          ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full'}
                          ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                          ${draggedImage === image.id ? 'opacity-50' : ''}
                          cursor-pointer transition-all duration-200
                        `}
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
                                // Remove from old position
                                newOrder.splice(draggedIndex, 1);
                                // Insert at new position
                                newOrder.splice(targetIndex, 0, draggedImage);
                              }
                              return newOrder;
                            });
                          }
                          setDraggedImage(null);
                        }}
                        onMouseDown={(e) => setDragStartTime(Date.now())}
                        onClick={(e) => {
                          const clickDuration = Date.now() - dragStartTime;
                          if (clickDuration < 200) { // Quick click = modal
                            setSelectedImageModal(image.id);
                          }
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={image.filename}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.image-error-placeholder')) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'image-error-placeholder flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-sm';
                                placeholder.innerHTML = 'Image unavailable';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-sm">
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
                                if (onViewFullRes) {
                                  onViewFullRes(image.storagePath);
                                } else {
                                  window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
                                }
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
                                const newCover = selectedCover === image.id ? null : image.id;
                                setSelectedCover(newCover);
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
                                if (onRemoveImage) {
                                  onRemoveImage(image.id);
                                }
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              title="Delete from Database"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteImage) {
                                  onDeleteImage(image.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {selectedCover === image.id && (
                          <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                            Cover
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Automatic Layout (columns with most common aspect ratio)
                <div className={`${getGridClasses()} ${getGapClass()}`}>
                  {getOrderedImages().slice(0, visibleImageCount).map((image, index) => {
                    const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                    const commonRatio = getMostCommonAspectRatio();
                    
                    return (
                      <div 
                        key={image.id}
                        className={`
                          relative group overflow-hidden
                          ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full'}
                          ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                          ${draggedImage === image.id ? 'opacity-50' : ''}
                          cursor-pointer transition-all duration-200
                        `}
                        style={{ aspectRatio: commonRatio }}
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
                                // Remove from old position
                                newOrder.splice(draggedIndex, 1);
                                // Insert at new position
                                newOrder.splice(targetIndex, 0, draggedImage);
                              }
                              return newOrder;
                            });
                          }
                          setDraggedImage(null);
                        }}
                        onMouseDown={(e) => setDragStartTime(Date.now())}
                        onClick={(e) => {
                          const clickDuration = Date.now() - dragStartTime;
                          if (clickDuration < 200) { // Quick click = modal
                            setSelectedImageModal(image.id);
                          }
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={image.filename}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.image-error-placeholder')) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'image-error-placeholder flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-sm';
                                placeholder.innerHTML = 'Image unavailable';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-sm">
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
                                if (onViewFullRes) {
                                  onViewFullRes(image.storagePath);
                                } else {
                                  window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
                                }
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
                                const newCover = selectedCover === image.id ? null : image.id;
                                setSelectedCover(newCover);
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
                                if (onRemoveImage) {
                                  onRemoveImage(image.id);
                                }
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              title="Delete from Database"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteImage) {
                                  onDeleteImage(image.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {selectedCover === image.id && (
                          <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                            Cover
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Load More Button */}
              {visibleImageCount < Math.min(100, images.length) && (
                <div className="text-center mt-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreImages}
                    className="px-8 py-2"
                  >
                    Load More Images ({Math.min(20, Math.min(100, images.length) - visibleImageCount)} more)
                  </Button>
                </div>
              )}
              
              {images.length > 100 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImageModal && (
        <Dialog open={!!selectedImageModal} onOpenChange={() => setSelectedImageModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>Gallery-optimized image preview</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <img
                src={ImageUrl.forViewing(getOrderedImages().find(img => img.id === selectedImageModal)?.storagePath || '')}
                alt="Gallery preview"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setSelectedImageModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}