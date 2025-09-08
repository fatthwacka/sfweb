import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useOptimisticSelections } from '@/hooks/use-optimistic-selections';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface ImageSelectionItem {
  id: string;
  filename: string;
  thumbnailUrl: string;
  fullImageUrl: string;
  selectionStatus: 'none' | 'favorite' | 'like' | 'dislike';
  isFinalSelection: boolean;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
  };
}

interface ImageSelectionGridProps {
  images: ImageSelectionItem[];
  shootId: string;
  onSelectionChange?: (imageId: string, status: 'none' | 'favorite' | 'like' | 'dislike') => void;
  maxSelections?: number;
  currentSelections?: number;
  className?: string;
}

export function ImageSelectionGrid({
  images,
  shootId,
  onSelectionChange,
  maxSelections = 20,
  currentSelections = 0,
  className = ''
}: ImageSelectionGridProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<ImageSelectionItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'likes' | 'dislikes'>('all');

  // Replace existing mutation with optimistic hook
  const {
    updateSelection,
    getSelectionStatus,
    isPending,
  } = useOptimisticSelections({
    shootId,
    onError: (imageId, error) => {
      toast({
        title: 'Selection Failed',
        description: 'Your selection couldn\'t be saved. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSelectionUpdate = useCallback(async (
    imageId: string, 
    newStatus: 'none' | 'favorite' | 'like' | 'dislike'
  ) => {
    const currentImage = images.find(img => img.id === imageId);
    if (!currentImage) return;

    // Check limit for favorites
    if (newStatus === 'favorite' && currentSelections >= maxSelections) {
      toast({
        title: 'Selection Limit Reached',
        description: `You can only select ${maxSelections} images.`,
        variant: 'destructive',
      });
      return;
    }

    // Update with optimistic response
    updateSelection(imageId, newStatus, currentImage.filename);
    onSelectionChange?.(imageId, newStatus);
  }, [images, currentSelections, maxSelections, updateSelection, onSelectionChange, toast]);

  const openImageModal = useCallback((image: ImageSelectionItem) => {
    setSelectedImage(image);
    setCurrentIndex(images.findIndex(img => img.id === image.id));
  }, [images]);

  const navigateModal = useCallback((direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + images.length) % images.length
      : (currentIndex + 1) % images.length;
    
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  }, [selectedImage, currentIndex, images]);

  const getFilteredImages = useCallback((imagesToFilter: any[]) => {
    switch (filter) {
      case 'favorites':
        return imagesToFilter.filter(img => img.selectionStatus === 'favorite');
      case 'likes':
        return imagesToFilter.filter(img => img.selectionStatus === 'like');
      case 'dislikes':
        return imagesToFilter.filter(img => img.selectionStatus === 'dislike');
      default:
        return imagesToFilter;
    }
  }, [filter]);

  // Transform images with optimistic status
  const transformedImages = images.map(image => ({
    ...image,
    selectionStatus: getSelectionStatus(image.id, image.selectionStatus),
    isPending: isPending(image.id),
  }));

  const filteredImages = getFilteredImages(transformedImages);

  const getSelectionIcon = (status: string) => {
    switch (status) {
      case 'favorite':
        return <Heart className="w-4 h-4" fill="currentColor" />;
      case 'like':
        return <ThumbsUp className="w-4 h-4" fill="currentColor" />;
      case 'dislike':
        return <ThumbsDown className="w-4 h-4" fill="currentColor" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'favorite':
        return 'text-red-500';
      case 'like':
        return 'text-green-500';
      case 'dislike':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Keyboard navigation for modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigateModal('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateModal('next');
          break;
        case 'Escape':
          setSelectedImage(null);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleSelectionUpdate(selectedImage.id, 
            selectedImage.selectionStatus === 'favorite' ? 'none' : 'favorite'
          );
          break;
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, navigateModal, handleSelectionUpdate]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-salmon text-white' : ''}
        >
          All Images ({transformedImages.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'favorites' ? 'default' : 'outline'}
          onClick={() => setFilter('favorites')}
          className={filter === 'favorites' ? 'bg-red-500 text-white' : ''}
        >
          <Heart className="w-3 h-3 mr-1" />
          Favorites ({transformedImages.filter(img => img.selectionStatus === 'favorite').length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'likes' ? 'default' : 'outline'}
          onClick={() => setFilter('likes')}
          className={filter === 'likes' ? 'bg-green-500 text-white' : ''}
        >
          <ThumbsUp className="w-3 h-3 mr-1" />
          Liked ({transformedImages.filter(img => img.selectionStatus === 'like').length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'dislikes' ? 'default' : 'outline'}
          onClick={() => setFilter('dislikes')}
          className={filter === 'dislikes' ? 'bg-gray-500 text-white' : ''}
        >
          <ThumbsDown className="w-3 h-3 mr-1" />
          Disliked ({transformedImages.filter(img => img.selectionStatus === 'dislike').length})
        </Button>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredImages.map((image) => (
          <Card 
            key={image.id} 
            className={`group relative overflow-hidden transition-all duration-200 hover:scale-105 cursor-pointer ${
              image.selectionStatus !== 'none' ? 'ring-2 ring-offset-2' : ''
            } ${
              image.selectionStatus === 'favorite' ? 'ring-red-500' :
              image.selectionStatus === 'like' ? 'ring-green-500' :
              image.selectionStatus === 'dislike' ? 'ring-gray-500' : ''
            }`}
          >
            {/* Image */}
            <div 
              className="aspect-square relative overflow-hidden"
              onClick={() => openImageModal(image)}
            >
              <img
                src={image.thumbnailUrl}
                alt={`Preview ${image.filename}`}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  image.selectionStatus === 'dislike' ? 'opacity-50' : 'group-hover:opacity-90'
                }`}
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
              
              {/* View Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>

              {/* Status Badge */}
              {image.selectionStatus !== 'none' && (
                <div className={`absolute top-2 right-2 ${getStatusColor(image.selectionStatus)}`}>
                  <div className="bg-white/90 rounded-full p-1">
                    {getSelectionIcon(image.selectionStatus)}
                  </div>
                </div>
              )}

              {/* Loading Overlay - Updated for Optimistic Updates */}
              {image.isPending && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-white/95 rounded-full p-2 shadow-lg">
                    <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <CardContent className="p-3">
              <div className="flex justify-between items-center gap-2">
                <Button
                  size="sm"
                  variant={image.selectionStatus === 'favorite' ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectionUpdate(image.id, 
                      image.selectionStatus === 'favorite' ? 'none' : 'favorite'
                    );
                  }}
                  disabled={image.isPending}
                  className={`
                    flex-1 mobile-touch-button
                    px-3 py-2 text-base
                    ${image.selectionStatus === 'favorite' 
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                      : 'hover:bg-red-50 hover:text-red-600 border-2 hover:border-red-500'
                    }
                  `}
                >
                  <Heart className="w-5 h-5" />
                </Button>

                <Button
                  size="sm"
                  variant={image.selectionStatus === 'like' ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectionUpdate(image.id, 
                      image.selectionStatus === 'like' ? 'none' : 'like'
                    );
                  }}
                  disabled={image.isPending}
                  className={`
                    flex-1 mobile-touch-button
                    px-3 py-2 text-base
                    ${image.selectionStatus === 'like' 
                      ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                      : 'hover:bg-green-50 hover:text-green-600 border-2 hover:border-green-500'
                    }
                  `}
                >
                  <ThumbsUp className="w-5 h-5" />
                </Button>

                <Button
                  size="sm"
                  variant={image.selectionStatus === 'dislike' ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectionUpdate(image.id, 
                      image.selectionStatus === 'dislike' ? 'none' : 'dislike'
                    );
                  }}
                  disabled={image.isPending}
                  className={`
                    flex-1 mobile-touch-button
                    px-3 py-2 text-base
                    ${image.selectionStatus === 'dislike' 
                      ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500' 
                      : 'hover:bg-gray-50 hover:text-gray-600 border-2 hover:border-gray-500'
                    }
                  `}
                >
                  <ThumbsDown className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            {filter === 'all' ? 'No images found' : `No ${filter} selected yet`}
          </div>
          {filter !== 'all' && (
            <Button variant="outline" onClick={() => setFilter('all')}>
              View All Images
            </Button>
          )}
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          {selectedImage && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <DialogHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg">
                    {selectedImage.filename} ({currentIndex + 1} of {images.length})
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    {selectedImage.selectionStatus !== 'none' && (
                      <Badge variant="outline" className={getStatusColor(selectedImage.selectionStatus)}>
                        {getSelectionIcon(selectedImage.selectionStatus)}
                        <span className="ml-1 capitalize">{selectedImage.selectionStatus}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Image */}
              <div className="flex-1 relative overflow-hidden bg-black">
                <img
                  src={selectedImage.fullImageUrl}
                  alt={selectedImage.filename}
                  className="w-full h-full object-contain"
                />

                {/* Navigation Buttons */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigateModal('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigateModal('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t bg-background">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Use arrow keys to navigate • Press F to favorite • Press Esc to close
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={selectedImage.selectionStatus === 'favorite' ? 'default' : 'outline'}
                      onClick={() => handleSelectionUpdate(selectedImage.id, 
                        selectedImage.selectionStatus === 'favorite' ? 'none' : 'favorite'
                      )}
                      disabled={selectedImage.isPending || false}
                      className={selectedImage.selectionStatus === 'favorite' 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'hover:bg-red-50 hover:text-red-600'
                      }
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      Favorite
                    </Button>

                    <Button
                      size="sm"
                      variant={selectedImage.selectionStatus === 'like' ? 'default' : 'outline'}
                      onClick={() => handleSelectionUpdate(selectedImage.id, 
                        selectedImage.selectionStatus === 'like' ? 'none' : 'like'
                      )}
                      disabled={selectedImage.isPending || false}
                      className={selectedImage.selectionStatus === 'like' 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'hover:bg-green-50 hover:text-green-600'
                      }
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Like
                    </Button>

                    <Button
                      size="sm"
                      variant={selectedImage.selectionStatus === 'dislike' ? 'default' : 'outline'}
                      onClick={() => handleSelectionUpdate(selectedImage.id, 
                        selectedImage.selectionStatus === 'dislike' ? 'none' : 'dislike'
                      )}
                      disabled={selectedImage.isPending || false}
                      className={selectedImage.selectionStatus === 'dislike' 
                        ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                        : 'hover:bg-gray-50 hover:text-gray-600'
                      }
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Dislike
                    </Button>

                    {selectedImage.selectionStatus !== 'none' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectionUpdate(selectedImage.id, 'none')}
                        disabled={selectedImage.isPending || false}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}