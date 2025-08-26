import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface DragDropImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => Promise<void>;
  label: string;
  description?: string;
  aspectRatio?: string;
  maxSize?: string;
  className?: string;
}

export function DragDropImageUpload({
  currentImage,
  onUpload,
  label,
  description,
  aspectRatio = "16:9",
  maxSize = "5MB",
  className = ""
}: DragDropImageUploadProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggedOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await handleFileUpload(imageFile);
    } else {
      setUploadError('Please drop an image file');
      setTimeout(() => setUploadError(null), 3000);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      await onUpload(file);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "16:9":
        return "aspect-video";
      case "4:3":
        return "aspect-[4/3]";
      case "1:1":
        return "aspect-square";
      case "3:2":
        return "aspect-[3/2]";
      default:
        return "aspect-video";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{label}</h3>
        {maxSize && (
          <span className="text-xs text-gray-400">Max: {maxSize}</span>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-gray-400">{description}</p>
      )}

      <Card 
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDraggedOver 
            ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/25' 
            : 'border-gray-600 hover:border-purple-500/50'
        } ${isUploading ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className={`${getAspectRatioClass()} relative rounded-lg overflow-hidden bg-gray-800`}>
            {currentImage ? (
              <div className="relative w-full h-full group">
                <img
                  src={currentImage}
                  alt={label}
                  className="w-full h-full object-cover"
                />
                
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploading ? (
                    <div className="text-center text-white">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm">Uploading...</p>
                    </div>
                  ) : (
                    <div className="text-center text-white">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Drop new image to replace</p>
                      <p className="text-xs opacity-75">or click to browse</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  {isUploading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">No image uploaded</p>
                      <p className="text-xs opacity-75">Drag & drop or click to upload</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
          
          {/* Upload error */}
          {uploadError && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {uploadError}
            </div>
          )}
          
          {/* Upload status */}
          {!currentImage && !isUploading && !uploadError && (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.querySelector<HTMLInputElement>(`input[type="file"]`)?.click()}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Supported formats: JPG, PNG, WebP</div>
        <div>• Recommended aspect ratio: {aspectRatio}</div>
        <div>• File will be renamed and replace existing image</div>
      </div>
    </div>
  );
}