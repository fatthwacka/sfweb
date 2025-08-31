import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Folder, Image as ImageIcon, Upload } from 'lucide-react';

interface ImageBrowserProps {
  currentImage?: string;
  onSelect: (imagePath: string) => void;
  onUpload?: (file: File) => void;
  label?: string;
  className?: string;
}

export function ImageBrowser({ 
  currentImage, 
  onSelect, 
  onUpload, 
  label = "Choose Image",
  className = "" 
}: ImageBrowserProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch ALL images from ALL folders
  const { data: allImages, isLoading } = useQuery({
    queryKey: ['all-site-images'],
    queryFn: async () => {
      const response = await fetch('/api/browse-images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      return response.json();
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    // Reset the input
    event.target.value = '';
  };

  const handleImageSelect = (imagePath: string) => {
    onSelect(imagePath);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current image preview */}
      {currentImage && (
        <div className="flex items-center space-x-3">
          <img 
            src={currentImage} 
            alt="Current selection" 
            className="w-32 h-20 rounded-lg object-cover border border-border shadow-sm"
          />
          <div className="text-sm text-muted-foreground">
            Current: {currentImage.split('/').pop()}
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button 
          type="button"
          variant="outline" 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          Browse Existing
        </Button>
        
        {onUpload && (
          <div className="relative">
            <Button 
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload New
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Image browser modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Browse Site Images
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading images...</p>
                </div>
              </div>
            ) : allImages && Object.keys(allImages).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(allImages).map(([folder, images]) => (
                  <div key={folder}>
                    <h3 className="font-semibold text-lg mb-3 capitalize flex items-center gap-2 text-gold">
                      <Folder className="w-4 h-4" />
                      {folder.replace(/[-_]/g, ' ')}
                      <span className="text-sm text-muted-foreground font-normal">
                        ({(images as string[]).length} images)
                      </span>
                    </h3>
                    <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
                      {(images as string[]).map((imagePath, index) => (
                        <div
                          key={`${folder}-${index}`}
                          className="group relative cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:scale-105"
                          onClick={() => handleImageSelect(imagePath)}
                        >
                          <img 
                            src={imagePath} 
                            alt={imagePath.split('/').pop() || 'Image'}
                            className="w-full aspect-square object-cover group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transition-opacity">
                              <ImageIcon className="w-4 h-4 text-gray-800" />
                            </div>
                          </div>
                          {/* Image name tooltip */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            {imagePath.split('/').pop()?.replace(/\.[^/.]+$/, '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No images found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload some images first or check your image folders
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}