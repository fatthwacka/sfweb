import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Crown, X, Trash2 } from 'lucide-react';
import { ImageUrl } from '@/lib/image-utils';

interface GalleryImageCardProps {
  image: {
    id: string;
    filename: string;
    storagePath: string;
  };
  selectedCover: string | null;
  gallerySettings: any;
  draggedImage: string | null;
  dragStartTime: number;
  onDragStart: (imageId: string) => void;
  onDragEnd: () => void;
  onDrop: (imageId: string) => void;
  onMouseDown: () => void;
  onClick: (imageId: string) => void;
  onMakeCover: (imageId: string) => void;
  onViewFullRes: (storagePath: string) => void;
  onDelete: (imageId: string) => void;
  toast: any;
}

export function GalleryImageCard({
  image,
  selectedCover,
  gallerySettings,
  draggedImage,
  dragStartTime,
  onDragStart,
  onDragEnd,
  onDrop,
  onMouseDown,
  onClick,
  onMakeCover,
  onViewFullRes,
  onDelete,
  toast
}: GalleryImageCardProps) {
  return (
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
        onDragStart(image.id);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(image.id);
      }}
      onDragOver={(e) => e.preventDefault()}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        const clickDuration = Date.now() - dragStartTime;
        if (clickDuration < 200) {
          onClick(image.id);
        }
      }}
    >
      <img
        src={ImageUrl.forViewing(image.storagePath)}
        alt={image.filename}
        className={`w-full h-full object-cover ${
          gallerySettings.borderStyle === 'circular' ? 'aspect-square' : 'h-auto'
        }`}
      />
      
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
              onViewFullRes(image.storagePath);
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
              onMakeCover(image.id);
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
              toast({ 
                title: "Feature Coming Soon", 
                description: "Remove from album functionality" 
              });
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
              onDelete(image.id);
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
}