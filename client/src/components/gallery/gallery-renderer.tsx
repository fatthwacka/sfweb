import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUrl } from "@/lib/image-utils";
import { VideoUrl } from "@/lib/video-utils";
import { Eye, Crown, X, Trash2, Download, RefreshCw, Loader2, PlayCircle } from "lucide-react";
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
  mediaType?: 'photo' | 'video'; // NEW: Determine whether rendering photos or videos
  selectedCover?: string | null;
  onCoverChange?: (imageId: string | null) => void;
  draggedImage?: string | null;
  onDragStart?: (e: React.DragEvent, imageId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetImageId: string) => void;
  onImageClick?: (imageId: string) => void;
  onViewFullRes?: (storagePath: string) => void;
  onDownloadImage?: (storagePath: string, filename: string) => void;
  onRemoveImage?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
  onReplaceImage?: (imageId: string) => void;
  replacingImages?: Set<string>;
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
  mediaType = 'photo', // Default to 'photo' for backwards compatibility
  selectedCover,
  onCoverChange,
  draggedImage,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onImageClick,
  onViewFullRes,
  onDownloadImage,
  onRemoveImage,
  onDeleteImage,
  onReplaceImage,
  replacingImages = new Set(),
  isDragReorderingEnabled = false,
  visibleImageCount = 20,
  dragStartTime = 0,
  onMouseDown,
  isAdminMode = false,
  saveAppearanceMutation
}) => {
  const isVideo = mediaType === 'video';
  
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

  // Load image/video thumbnail dimensions dynamically
  React.useEffect(() => {
    if (images.length === 0) return;
    
    const loadImageDimensions = async () => {
      const dimensionsMap: Record<string, {width: number, height: number}> = {};
      
      const loadPromises = images.slice(0, 10).map((item) => { // Limit to first 10 for performance
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            dimensionsMap[item.id] = { width: img.naturalWidth, height: img.naturalHeight };
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load dimensions for ${item.filename}`);
            resolve();
          };
          // For videos, use thumbnail path directly (already a complete URL)
          // For images, use storage path with ImageUrl transformation
          if (isVideo) {
            const thumbnailPath = (item as any).thumbnailPath;
            // Only load dimensions if we have a valid thumbnail (ends with .jpg)
            if (thumbnailPath && thumbnailPath.endsWith('.jpg')) {
              img.src = thumbnailPath;
            } else {
              // No valid thumbnail, skip dimension loading
              resolve();
              return;
            }
          } else if (item.storagePath) {
            img.src = ImageUrl.forViewing(item.storagePath);
          } else {
            img.src = '';
          }
        });
      });
      
      await Promise.all(loadPromises);
      setImageDimensions(dimensionsMap);
      setDimensionsLoaded(true);
    };
    
    loadImageDimensions();
  }, [images, isVideo]);

  const getAutomaticAspectRatio = () => {
    // Wait for dimensions to load
    if (!dimensionsLoaded || Object.keys(imageDimensions).length === 0) {
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
                // Use appropriate URL utility for videos vs images
                let displayUrl = null;
                if (isVideo) {
                  // Use VideoUrl utility for proper 3-tier video handling
                  displayUrl = VideoUrl.forThumbnail(image as any);
                  if (index === 0) console.log(`🎬 VideoUrl.forThumbnail: ${displayUrl}`);
                } else {
                  displayUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                  if (index === 0) console.log(`📸 ImageUrl.forViewing: ${displayUrl}`);
                }

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
                    {displayUrl ? (
                      <>
                        <img
                          src={displayUrl}
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
                              placeholder.innerHTML = isVideo ? 'Video thumbnail unavailable' : 'Image unavailable';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                        {/* Play icon overlay for videos */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full p-3">
                              <PlayCircle className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-gray-800 text-gray-400 text-sm relative">
                        {isVideo ? (
                          <>
                            <div className="text-center">
                              <PlayCircle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                              <div className="text-xs">Video thumbnail unavailable</div>
                              <div className="text-xs text-gray-500 mt-1">{image.filename}</div>
                            </div>
                          </>
                        ) : (
                          'Loading...'
                        )}
                      </div>
                    )}
                  
                    {/* Spinner Overlay for Replacing Images */}
                    {replacingImages.has(image.id) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-salmon" />
                          <span className="text-sm font-medium text-gray-700">Replacing...</span>
                        </div>
                      </div>
                    )}
                  
                    {/* Hover Buttons */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {onViewFullRes && (
                          <Button size="xs" variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700 w-6 h-6 p-0" title="View Full Resolution" onClick={(e) => { e.stopPropagation(); onViewFullRes(image.storagePath); }}>
                            <Eye className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onDownloadImage && (
                          <Button size="xs" variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 w-6 h-6 p-0" title="Download Image" onClick={(e) => { e.stopPropagation(); onDownloadImage(image.storagePath, image.filename); }}>
                            <Download className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onCoverChange && (
                          <Button size="xs" variant="secondary" className="bg-salmon text-white hover:bg-salmon-muted w-6 h-6 p-0" title={isVideo ? "Make Cover Video" : "Make Cover"} onClick={async (e) => { 
                            e.stopPropagation(); 
                            const newCover = selectedCover === image.id ? null : image.id; 
                            onCoverChange(newCover); 
                            
                            if (saveAppearanceMutation && isVideo && newCover) {
                              // For videos, call the cover video API
                              try {
                                await fetch(`/api/shoots/${(image as any).shootId}/cover-video`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ videoId: newCover })
                                });
                              } catch (error) {
                                console.error('Failed to set cover video:', error);
                              }
                            } else if (saveAppearanceMutation) { 
                              saveAppearanceMutation.mutate({ bannerImageId: newCover, gallerySettings, imageSequences: {} }); 
                            } 
                          }}>
                            <Crown className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onReplaceImage && (
                          <Button size="xs" variant="secondary" className="bg-green-600 text-white hover:bg-green-700 w-6 h-6 p-0" title={`Replace ${isVideo ? 'Video' : 'Image'}`} onClick={(e) => { e.stopPropagation(); onReplaceImage(image.id); }}>
                            <RefreshCw className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onRemoveImage && (
                          <Button size="xs" variant="secondary" className="bg-yellow-600 text-white hover:bg-yellow-700 w-6 h-6 p-0" title="Remove from Album" onClick={(e) => { e.stopPropagation(); onRemoveImage(image.id); }}>
                            <X className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onDeleteImage && (
                          <Button size="xs" variant="destructive" className="w-6 h-6 p-0" title="Delete from Database" onClick={(e) => { e.stopPropagation(); onDeleteImage(image.id); }}>
                            <Trash2 className="w-2.5 h-2.5" />
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
                // Use appropriate URL utility for videos vs images
                let imageUrl = null;
                if (isVideo) {
                  // Use VideoUrl utility for proper 3-tier video handling
                  imageUrl = VideoUrl.forThumbnail(image as any);
                } else {
                  imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                }
                
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
                  
                    {/* Spinner Overlay for Replacing Images */}
                    {replacingImages.has(image.id) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-salmon" />
                          <span className="text-sm font-medium text-gray-700">Replacing...</span>
                        </div>
                      </div>
                    )}
                  
                    {/* Hover Buttons */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {onViewFullRes && (
                          <Button size="xs" variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700 w-6 h-6 p-0" title="View Full Resolution" onClick={(e) => { e.stopPropagation(); onViewFullRes(image.storagePath); }}>
                            <Eye className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onDownloadImage && (
                          <Button size="xs" variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 w-6 h-6 p-0" title="Download Image" onClick={(e) => { e.stopPropagation(); onDownloadImage(image.storagePath, image.filename); }}>
                            <Download className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onCoverChange && (
                          <Button size="xs" variant="secondary" className="bg-salmon text-white hover:bg-salmon-muted w-6 h-6 p-0" title={isVideo ? "Make Cover Video" : "Make Cover"} onClick={async (e) => { 
                            e.stopPropagation(); 
                            const newCover = selectedCover === image.id ? null : image.id; 
                            onCoverChange(newCover); 
                            
                            if (saveAppearanceMutation && isVideo && newCover) {
                              // For videos, call the cover video API
                              try {
                                await fetch(`/api/shoots/${(image as any).shootId}/cover-video`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ videoId: newCover })
                                });
                              } catch (error) {
                                console.error('Failed to set cover video:', error);
                              }
                            } else if (saveAppearanceMutation) { 
                              saveAppearanceMutation.mutate({ bannerImageId: newCover, gallerySettings, imageSequences: {} }); 
                            } 
                          }}>
                            <Crown className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onReplaceImage && (
                          <Button size="xs" variant="secondary" className="bg-green-600 text-white hover:bg-green-700 w-6 h-6 p-0" title={`Replace ${isVideo ? 'Video' : 'Image'}`} onClick={(e) => { e.stopPropagation(); onReplaceImage(image.id); }}>
                            <RefreshCw className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onRemoveImage && (
                          <Button size="xs" variant="secondary" className="bg-yellow-600 text-white hover:bg-yellow-700 w-6 h-6 p-0" title="Remove from Album" onClick={(e) => { e.stopPropagation(); onRemoveImage(image.id); }}>
                            <X className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {onDeleteImage && (
                          <Button size="xs" variant="destructive" className="w-6 h-6 p-0" title="Delete from Database" onClick={(e) => { e.stopPropagation(); onDeleteImage(image.id); }}>
                            <Trash2 className="w-2.5 h-2.5" />
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
              // Use appropriate URL utility for videos vs images
              let imageUrl = null;
              if (isVideo) {
                // Use VideoUrl utility for proper 3-tier video handling
                imageUrl = VideoUrl.forThumbnail(image as any);
                if (index === 0) console.log(`🎬 Grid mode - VideoUrl.forThumbnail: ${imageUrl}`);
              } else {
                imageUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
                if (index === 0) console.log(`📸 Grid mode - ImageUrl.forViewing: ${imageUrl}`);
              }
              
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
                  
                  {/* Spinner Overlay for Replacing Images */}
                  {replacingImages.has(image.id) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-salmon" />
                        <span className="text-sm font-medium text-gray-700">Replacing...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Same hover buttons as masonry */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {/* Same buttons implementation as masonry layout */}
                      {onViewFullRes && (
                        <Button
                          size="xs"
                          variant="secondary"
                          className="bg-purple-600 text-white hover:bg-purple-700 w-6 h-6 p-0"
                          title="View Full Resolution"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewFullRes(image.storagePath);
                          }}
                        >
                          <Eye className="w-2.5 h-2.5" />
                        </Button>
                      )}
                      {onCoverChange && (
                        <Button
                          size="xs"
                          variant="secondary"
                          className="bg-salmon text-white hover:bg-salmon-muted w-6 h-6 p-0"
                          title={isVideo ? "Make Cover Video" : "Make Cover"}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newCover = selectedCover === image.id ? null : image.id;
                            onCoverChange(newCover);
                            
                            if (saveAppearanceMutation && isVideo && newCover) {
                              // For videos, call the cover video API
                              try {
                                await fetch(`/api/shoots/${(image as any).shootId}/cover-video`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ videoId: newCover })
                                });
                              } catch (error) {
                                console.error('Failed to set cover video:', error);
                              }
                            } else if (saveAppearanceMutation) {
                              saveAppearanceMutation.mutate({
                                bannerImageId: newCover,
                                gallerySettings,
                                imageSequences: {}
                              });
                            }
                          }}
                        >
                          <Crown className="w-2.5 h-2.5" />
                        </Button>
                      )}
                      {onReplaceImage && (
                        <Button
                          size="xs"
                          variant="secondary"
                          className="bg-green-600 text-white hover:bg-green-700 w-6 h-6 p-0"
                          title="Replace Image"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplaceImage(image.id);
                          }}
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                        </Button>
                      )}
                      {onRemoveImage && (
                        <Button
                          size="xs"
                          variant="secondary" 
                          className="bg-yellow-600 text-white hover:bg-yellow-700 w-6 h-6 p-0"
                          title="Remove from Album"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage(image.id);
                          }}
                        >
                          <X className="w-2.5 h-2.5" />
                        </Button>
                      )}
                      {onDeleteImage && (
                        <Button
                          size="xs"
                          variant="destructive"
                          className="w-6 h-6 p-0"
                          title="Delete from Database"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(image.id);
                          }}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
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
          {images.map((image, index) => {
            // Use appropriate URL utility for videos vs images
            let displayUrl;
            if (isVideo) {
              // Use VideoUrl utility for proper 3-tier video handling
              displayUrl = VideoUrl.forThumbnail(image as any);
            } else {
              displayUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
            }

            return (
            <div
              key={image.id}
              className={`relative group cursor-pointer break-inside-avoid masonry-item ${getBorderClass()}`}
              onClick={() => onImageClick?.(image.id)}
              style={{ 
                marginBottom: getSpacingStyle(),
                ...getBorderStyle()
              }}
            >
              {displayUrl ? (
                <>
                  <img
                    src={displayUrl}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-auto object-cover transition-all duration-300 group-hover:brightness-95"
                    loading="lazy"
                    style={getBorderStyle()}
                  />
                  {/* Play icon overlay for videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 rounded-full p-3">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-800 text-gray-400 text-sm">
                  {isVideo ? 'Video thumbnail unavailable' : 'Image unavailable'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>
            );
          })}
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          style={{ gap: getSpacingStyle() }}
        >
          {images.map((image, index) => {
            // Use appropriate URL utility for videos vs images
            let displayUrl;
            if (isVideo) {
              // Use VideoUrl utility for proper 3-tier video handling
              displayUrl = VideoUrl.forThumbnail(image as any);
            } else {
              displayUrl = image?.storagePath ? ImageUrl.forViewing(image.storagePath) : null;
            }

            return (
            <div
              key={image.id}
              className={`relative ${getAspectRatioClass()} group cursor-pointer ${getBorderClass()}`}
              onClick={() => onImageClick?.(image.id)}
              style={getBorderStyle()}
            >
              {displayUrl ? (
                <>
                  <img
                    src={displayUrl}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-95"
                    loading="lazy"
                    style={getBorderStyle()}
                  />
                  {/* Play icon overlay for videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 rounded-full p-3">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-sm">
                  {isVideo ? 'Video thumbnail unavailable' : 'Image unavailable'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};