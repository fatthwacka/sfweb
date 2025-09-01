import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ThumbnailWithButtonsProps {
  imagePath: string;
  onImageChange: (newPath: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showButtons?: boolean;
  className?: string;
  alt?: string;
}

export function ThumbnailWithButtons({ 
  imagePath, 
  onImageChange,
  size = 'md',
  showButtons = true,
  className = '',
  alt = 'Image thumbnail'
}: ThumbnailWithButtonsProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
  const [browserCallback, setBrowserCallback] = useState<((path: string) => void) | null>(null);

  // Size configurations
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-24 h-24'
  };

  const buttonSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7'
  };

  const iconSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  // Fetch ALL images from ALL folders for image browser
  const { data: allImages, isLoading: imagesLoading } = useQuery({
    queryKey: ['all-site-images'],
    queryFn: async () => {
      const response = await fetch('/api/browse-images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      return response.json();
    }
  });

  useEffect(() => {
    // Create preview URL for the image - handle both absolute and relative paths
    const fullPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    setPreviewUrl(`${fullPath}?t=${Date.now()}`);
  }, [imagePath]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      onImageChange(result.path);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image browser selection
  const handleBrowseImages = (onSelectCallback: (path: string) => void) => {
    setBrowserCallback(() => onSelectCallback);
    setIsImageBrowserOpen(true);
  };

  const handleImageSelect = (imagePath: string) => {
    if (browserCallback) {
      browserCallback(imagePath);
    }
    setIsImageBrowserOpen(false);
    setBrowserCallback(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  return (
    <>
      <div className={`space-y-1 ${className}`}>
        <div 
          className={`relative group ${isDragOver ? 'scale-105' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100 border-2 transition-all duration-200 ${
            isDragOver ? 'border-salmon bg-salmon/10' : 'border-gray-200'
          }`}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl('')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Upload size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
            {isDragOver && (
              <div className="absolute inset-0 bg-salmon bg-opacity-20 flex items-center justify-center">
                <Upload className="text-salmon" size={20} />
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={16} />
          </div>
        </div>
        
        {/* Icon-based Image Management Buttons */}
        {showButtons && (
          <TooltipProvider>
            <div className="flex justify-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    size="icon"
                    variant="outline" 
                    onClick={() => handleBrowseImages(onImageChange)}
                    className={`${buttonSizeClasses[size]} border-slate-500 text-white hover:bg-slate-600`}
                  >
                    <FolderOpen className={iconSizeClasses[size]} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold text-sm">Browse existing images</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    size="icon"
                    variant="outline" 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files[0]) {
                          handleFileUpload(files[0]);
                        }
                      };
                      input.click();
                    }}
                    className={`${buttonSizeClasses[size]} border-slate-500 text-white hover:bg-slate-600`}
                  >
                    <Upload className={iconSizeClasses[size]} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold text-sm">Upload new image</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Image Browser Dialog */}
      <Dialog open={isImageBrowserOpen} onOpenChange={setIsImageBrowserOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Browse Site Images
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {imagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : allImages && Object.keys(allImages).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(allImages).map(([folderName, images]) => (
                  <div key={folderName}>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {folderName} ({(images as string[]).length} images)
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {(images as string[]).map((imagePath, index) => (
                        <div 
                          key={index}
                          className="relative aspect-square cursor-pointer rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => handleImageSelect(imagePath)}
                        >
                          <img
                            src={`${imagePath}?t=${Date.now()}`}
                            alt={`${folderName} ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No images found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload some images first or check your image folders
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}