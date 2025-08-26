import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUrl } from "@/lib/image-utils";
import { Eye, Crown, X, Trash2 } from "lucide-react";
import type { Image } from "@shared/schema";

interface GallerySettings {
  backgroundColor?: string;
  layoutStyle?: string;
  borderStyle?: string; // Legacy support
  borderRadius?: number; // New pixel-based radius
  imageSpacing?: string; // Legacy support
  imageSpacingValue?: number; // New pixel-based spacing
  coverPicAlignment?: string;
  navbarPosition?: string;
  coverPicSize?: number;
}

interface GalleryRendererProps {
  images: Image[];
  gallerySettings: GallerySettings;
  selectedCover?: string | null;
  onCoverChange?: (imageId: string | null) => void;
  draggedImage?: string | null;
  onDragStart?: (e: React.DragEvent, imageId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetImageId: string) => void;
  onImageClick?: (imageId: string) => void;
  onViewFullRes?: (storagePath: string) => void;
  onRemoveImage?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
  isDragReorderingEnabled?: boolean;
  visibleImageCount?: number;
  dragStartTime?: number;
  onMouseDown?: (e: React.MouseEvent) => void;
  // For admin panel functionality
  isAdminMode?: boolean;
  saveAppearanceMutation?: any;
}

export const GalleryRenderer: React.FC<GalleryRendererProps> = ({
  images,
  gallerySettings,
  selectedCover,
  onCoverChange,
  draggedImage,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onImageClick,
  onViewFullRes,
  onRemoveImage,
  onDeleteImage,
  isDragReorderingEnabled = false,
  visibleImageCount = 20,
  dragStartTime = 0,
  onMouseDown,
  isAdminMode = false,
  saveAppearanceMutation
}) => {
  const getOrderedImages = () => images.slice(0, visibleImageCount);

  const getSpacingStyle = () => {
    // Use new imageSpacingValue if available, otherwise fall back to imageSpacing
    if (gallerySettings.imageSpacingValue !== undefined) {
      return `${gallerySettings.imageSpacingValue}px`;
    }
    
    // Legacy imageSpacing support
    switch (gallerySettings.imageSpacing) {
      case 'tight': return '2px';
      case 'loose': return '16px';
      default: return '8px'; // normal
    }
  };

  const getBorderStyle = () => {
    // Use new borderRadius if available, otherwise fall back to borderStyle
    if (gallerySettings.borderRadius !== undefined) {
      return { borderRadius: `${gallerySettings.borderRadius}px` };
    }
    
    // Legacy borderStyle support
    switch (gallerySettings.borderStyle) {
      case 'sharp': return { borderRadius: '0px' };
      case 'circular': return { borderRadius: '50%' };
      default: return { borderRadius: '8px' }; // rounded
    }
  };

  const getBorderClass = () => {
    // For CSS classes, we still need some base styling
    if (gallerySettings.borderRadius !== undefined) {
      return 'overflow-hidden'; // Let inline styles handle the radius
    }
    
    // Legacy support
    switch (gallerySettings.borderStyle) {
      case 'sharp': return 'rounded-none';
      case 'circular': return 'rounded-full';
      default: return 'rounded-lg';
    }
  };


  const [imageDimensions, setImageDimensions] = React.useState<Record<string, {width: number, height: number}>>({});
  const [dimensionsLoaded, setDimensionsLoaded] = React.useState(false);

  // Load image dimensions dynamically
  React.useEffect(() => {
    if (images.length === 0) return;
    
    const loadImageDimensions = async () => {
      console.log('Loading dimensions for', images.length, 'images');
      const dimensionsMap: Record<string, {width: number, height: number}> = {};
      
      const loadPromises = images.slice(0, 10).map((image) => { // Limit to first 10 for performance
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            dimensionsMap[image.id] = { width: img.naturalWidth, height: img.naturalHeight };
            console.log(`Loaded ${image.filename}: ${img.naturalWidth}x${img.naturalHeight}`);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load dimensions for ${image.filename}`);
            resolve();
          };
          img.src = ImageUrl.forViewing(image.storagePath);
        });
      });
      
      await Promise.all(loadPromises);
      setImageDimensions(dimensionsMap);
      setDimensionsLoaded(true);
    };
    
    loadImageDimensions();
  }, [images]);

  const getAutomaticAspectRatio = () => {
    // Wait for dimensions to load
    if (!dimensionsLoaded || Object.keys(imageDimensions).length === 0) {
      console.log('Dimensions not loaded yet, defaulting to square');
      return 'aspect-square';
    }
    
    // Count specific aspect ratio buckets with tolerance
    const ratioGroups = {
      square: 0,        // 0.9 - 1.1 (1:1)
      portrait_2_3: 0,  // 0.6 - 0.7 (2:3)
      portrait_3_4: 0,  // 0.7 - 0.8 (3:4) 
      portrait_4_5: 0,  // 0.75 - 0.85 (4:5 Instagram)
      portrait_9_16: 0, // 0.5 - 0.6 (9:16 vertical)
      landscape_3_2: 0, // 1.4 - 1.6 (3:2)
      landscape_4_3: 0, // 1.25 - 1.4 (4:3)
      landscape_16_9: 0,// 1.7 - 1.9 (16:9 wide)
      other: 0
    };
    
    Object.entries(imageDimensions).forEach(([imageId, dimensions]) => {
      const ratio = dimensions.width / dimensions.height;
      console.log(`Image ${imageId}: ${dimensions.width}x${dimensions.height} = ${ratio.toFixed(2)}`);
      
      if (ratio >= 0.9 && ratio <= 1.1) ratioGroups.square++;
      else if (ratio >= 0.6 && ratio <= 0.7) ratioGroups.portrait_2_3++;
      else if (ratio >= 0.7 && ratio <= 0.8) ratioGroups.portrait_3_4++;
      else if (ratio >= 0.75 && ratio <= 0.85) ratioGroups.portrait_4_5++;
      else if (ratio >= 0.5 && ratio <= 0.6) ratioGroups.portrait_9_16++;
      else if (ratio >= 1.4 && ratio <= 1.6) ratioGroups.landscape_3_2++;
      else if (ratio >= 1.25 && ratio <= 1.4) ratioGroups.landscape_4_3++;
      else if (ratio >= 1.7 && ratio <= 1.9) ratioGroups.landscape_16_9++;
      else ratioGroups.other++;
    });
    
    // Find the most common ratio group
    let maxCount = 0;
    let mostCommonRatio = 'square';
    
    Object.entries(ratioGroups).forEach(([ratio, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonRatio = ratio;
      }
    });
    
    console.log('Ratio groups:', ratioGroups);
    console.log('Most common ratio:', mostCommonRatio, 'with count:', maxCount);
    
    // Map to CSS aspect ratio classes
    const result = (() => {
      switch (mostCommonRatio) {
        case 'portrait_2_3': return 'aspect-[2/3]';
        case 'portrait_3_4': return 'aspect-[3/4]';
        case 'portrait_4_5': return 'aspect-[4/5]';
        case 'portrait_9_16': return 'aspect-[9/16]';
        case 'landscape_3_2': return 'aspect-[3/2]';
        case 'landscape_4_3': return 'aspect-[4/3]';
        case 'landscape_16_9': return 'aspect-[16/9]';
        case 'square':
        case 'other':
        default: return 'aspect-square';
      }
    })();
    
    console.log('Automatic mode selected aspect ratio:', result);
    return result;
  };

  const getAspectRatioClass = () => {
    switch (gallerySettings.layoutStyle) {
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[2/3]';
      case 'landscape': return 'aspect-[3/2]';
      case 'instagram': return 'aspect-[4/5]';
      case 'upright': return 'aspect-[9/16]';
      case 'wide': return 'aspect-[16/9]';
      case 'automatic': return getAutomaticAspectRatio();
      case 'masonry': return ''; // No fixed aspect ratio for masonry
      default: return getAutomaticAspectRatio();
    }
  };

  const getGridColumnsClass = () => {
    // Consistent breakpoints for all grid layouts (not masonry)
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  };

  // Admin mode rendering with all advanced features
  if (isAdminMode) {
    return (
      <div className="p-4" style={{ backgroundColor: gallerySettings.backgroundColor }}>
        {gallerySettings.layoutStyle === 'masonry' ? (
          // For masonry layout, choose between Grid (draggable) or CSS columns (view-only)
          isDragReorderingEnabled ? (
            // CSS Grid for draggable masonry in admin mode
            <div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-max"
              style={{ gap: getSpacingStyle() }}
            >
              {getOrderedImages().map((image, index) => {
                const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                
                return (
                  <div 
                    key={image.id}
                    className={`
                      relative group w-full
                      ${getBorderClass()}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      ${draggedImage === image.id ? 'opacity-50 scale-95' : ''}
                      cursor-pointer transition-all duration-200
                    `}
                    style={{ 
                      transform: draggedImage === image.id ? 'scale(0.95)' : 'scale(1)',
                      transition: 'transform 0.2s ease, opacity 0.2s ease',
                      ...getBorderStyle()
                    }}
                    draggable={isDragReorderingEnabled}
                    onDragStart={(e) => {
                      if (!isDragReorderingEnabled || !onDragStart) {
                        e.preventDefault();
                        return;
                      }
                      onDragStart(e, image.id);
                    }}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop?.(e, image.id)}
                    onMouseDown={onMouseDown}
                    onClick={(e) => {
                      const clickDuration = Date.now() - dragStartTime;
                      if (clickDuration < 200) {
                        onImageClick?.(image.id);
                      }
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={image.filename}
                        className="w-full h-auto object-cover block"
                        style={{ verticalAlign: 'top', ...getBorderStyle() }}
                        onError={(e) => {
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
                        {onViewFullRes && (
                          <Button size="sm" variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700" title="View Full Resolution" onClick={(e) => { e.stopPropagation(); onViewFullRes(image.storagePath); }}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        {onCoverChange && (
                          <Button size="sm" variant="secondary" className="bg-salmon text-white hover:bg-salmon-muted" title="Make Cover" onClick={(e) => { e.stopPropagation(); const newCover = selectedCover === image.id ? null : image.id; onCoverChange(newCover); if (saveAppearanceMutation) { saveAppearanceMutation.mutate({ bannerImageId: newCover, gallerySettings, imageSequences: {} }); } }}>
                            <Crown className="w-3 h-3" />
                          </Button>
                        )}
                        {onRemoveImage && (
                          <Button size="sm" variant="secondary" className="bg-yellow-600 text-white hover:bg-yellow-700" title="Remove from Album" onClick={(e) => { e.stopPropagation(); onRemoveImage(image.id); }}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteImage && (
                          <Button size="sm" variant="destructive" title="Delete from Database" onClick={(e) => { e.stopPropagation(); onDeleteImage(image.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
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
            // CSS columns masonry for view-only admin mode
            <div 
              className="masonry-grid-seamless"
              style={{ 
                columnGap: getSpacingStyle(),
                columnFill: 'balance',
                orphans: 1,
                widows: 1,
                '--masonry-gap': getSpacingStyle()
              } as React.CSSProperties}
            >
              {getOrderedImages().map((image, index) => {
                const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                
                return (
                  <div 
                    key={image.id}
                    className={`
                      relative group break-inside-avoid inline-block w-full masonry-item
                      ${getBorderClass()}
                      ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                      ${draggedImage === image.id ? 'opacity-50 scale-95' : ''}
                      cursor-pointer transition-all duration-200
                    `}
                    style={{ 
                      marginBottom: getSpacingStyle(),
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      transform: draggedImage === image.id ? 'scale(0.95)' : 'scale(1)',
                      transition: 'transform 0.2s ease, opacity 0.2s ease',
                      ...getBorderStyle()
                    }}
                    draggable={isDragReorderingEnabled}
                    onDragStart={(e) => {
                      if (!isDragReorderingEnabled || !onDragStart) {
                        e.preventDefault();
                        return;
                      }
                      onDragStart(e, image.id);
                    }}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop?.(e, image.id)}
                    onMouseDown={onMouseDown}
                    onClick={(e) => {
                      const clickDuration = Date.now() - dragStartTime;
                      if (clickDuration < 200) {
                        onImageClick?.(image.id);
                      }
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={image.filename}
                        className="w-full h-auto object-cover block"
                        style={{ verticalAlign: 'top', ...getBorderStyle() }}
                        onError={(e) => {
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
                        {onViewFullRes && (
                          <Button size="sm" variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700" title="View Full Resolution" onClick={(e) => { e.stopPropagation(); onViewFullRes(image.storagePath); }}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        {onCoverChange && (
                          <Button size="sm" variant="secondary" className="bg-salmon text-white hover:bg-salmon-muted" title="Make Cover" onClick={(e) => { e.stopPropagation(); const newCover = selectedCover === image.id ? null : image.id; onCoverChange(newCover); if (saveAppearanceMutation) { saveAppearanceMutation.mutate({ bannerImageId: newCover, gallerySettings, imageSequences: {} }); } }}>
                            <Crown className="w-3 h-3" />
                          </Button>
                        )}
                        {onRemoveImage && (
                          <Button size="sm" variant="secondary" className="bg-yellow-600 text-white hover:bg-yellow-700" title="Remove from Album" onClick={(e) => { e.stopPropagation(); onRemoveImage(image.id); }}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteImage && (
                          <Button size="sm" variant="destructive" title="Delete from Database" onClick={(e) => { e.stopPropagation(); onDeleteImage(image.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
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
          )
        ) : (
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            style={{ 
              gap: getSpacingStyle()
            }}
          >
            {getOrderedImages().map((image, index) => {
              const imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
              
              return (
                <div 
                  key={image.id}
                  className={`
                    relative group ${getAspectRatioClass()}
                    ${getBorderClass()}
                    ${selectedCover === image.id ? 'ring-2 ring-salmon' : ''}
                    ${draggedImage === image.id ? 'opacity-50' : ''}
                    cursor-pointer transition-all duration-200
                  `}
                  style={getBorderStyle()}
                  draggable={isDragReorderingEnabled}
                  onDragStart={(e) => {
                    if (!isDragReorderingEnabled || !onDragStart) {
                      e.preventDefault();
                      return;
                    }
                    onDragStart(e, image.id);
                  }}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop?.(e, image.id)}
                  onMouseDown={onMouseDown}
                  onClick={(e) => {
                    const clickDuration = Date.now() - dragStartTime;
                    if (clickDuration < 200) { // Quick click = modal
                      onImageClick?.(image.id);
                    }
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                      style={getBorderStyle()}
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
                  
                  {/* Same hover buttons as masonry */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {/* Same buttons implementation as masonry layout */}
                      {onViewFullRes && (
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
                      )}
                      {onCoverChange && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-salmon text-white hover:bg-salmon-muted"
                          title="Make Cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newCover = selectedCover === image.id ? null : image.id;
                            onCoverChange(newCover);
                            
                            if (saveAppearanceMutation) {
                              saveAppearanceMutation.mutate({
                                bannerImageId: newCover,
                                gallerySettings,
                                imageSequences: {}
                              });
                            }
                          }}
                        >
                          <Crown className="w-3 h-3" />
                        </Button>
                      )}
                      {onRemoveImage && (
                        <Button
                          size="sm"
                          variant="secondary" 
                          className="bg-yellow-600 text-white hover:bg-yellow-700"
                          title="Remove from Album"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage(image.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      {onDeleteImage && (
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Delete from Database"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(image.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
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
          )
        }
      </div>
    );
  }

  // Simple client mode rendering (for public galleries)
  return (
    <div style={{ backgroundColor: gallerySettings.backgroundColor }}>
      {gallerySettings.layoutStyle === 'masonry' ? (
        <div 
          className="masonry-grid-seamless"
          style={{ 
            columnGap: getSpacingStyle(),
            columnFill: 'balance',
            orphans: 1,
            widows: 1
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group cursor-pointer break-inside-avoid masonry-item ${getBorderClass()}`}
              onClick={() => onImageClick?.(image.id)}
              style={{ 
                marginBottom: getSpacingStyle(),
                ...getBorderStyle()
              }}
            >
              <img
                src={ImageUrl.forViewing(image.storagePath)}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-auto object-cover transition-all duration-300 group-hover:brightness-90"
                loading="lazy"
                style={getBorderStyle()}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          style={{ gap: getSpacingStyle() }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative ${getAspectRatioClass()} group cursor-pointer ${getBorderClass()}`}
              onClick={() => onImageClick?.(image.id)}
              style={getBorderStyle()}
            >
              <img
                src={ImageUrl.forViewing(image.storagePath)}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-90"
                loading="lazy"
                style={getBorderStyle()}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};