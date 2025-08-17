import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Grid, Square, Layers, Palette } from "lucide-react";
import type { Image, ImageClassification } from "@shared/schema";

interface GalleryLivePreviewProps {
  images: Image[];
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  galleryLayout?: 'masonry' | 'square' | 'automatic';
  onLayoutChange?: (layout: 'masonry' | 'square' | 'automatic') => void;
  showClassificationFilter?: boolean;
}

interface AspectRatioData {
  ratio: number;
  count: number;
  category: 'landscape' | 'portrait' | 'square';
}

export const GalleryLivePreview: React.FC<GalleryLivePreviewProps> = ({
  images,
  backgroundColor = '#1a1a1a',
  onBackgroundColorChange,
  galleryLayout = 'automatic',
  onLayoutChange,
  showClassificationFilter = true
}) => {
  const [selectedClassification, setSelectedClassification] = useState<ImageClassification | 'all'>('all');
  const [aspectRatioData, setAspectRatioData] = useState<AspectRatioData[]>([]);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Filter images by classification
  const filteredImages = selectedClassification === 'all' 
    ? images 
    : images.filter(img => img.classification === selectedClassification);

  // Automatic aspect ratio detection system
  useEffect(() => {
    const startTime = performance.now();
    
    // Simulate aspect ratio detection (in real app, this would analyze actual image dimensions)
    const ratioMap = new Map<string, AspectRatioData>();
    
    filteredImages.forEach(image => {
      // Simulate aspect ratio detection (replace with actual image analysis)
      const mockRatio = Math.random() > 0.6 ? (4/3) : (3/4); // Mock landscape vs portrait
      const category: 'landscape' | 'portrait' | 'square' = 
        mockRatio > 1.1 ? 'landscape' : 
        mockRatio < 0.9 ? 'portrait' : 'square';
      
      const key = category;
      const existing = ratioMap.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        ratioMap.set(key, {
          ratio: mockRatio,
          count: 1,
          category
        });
      }
    });
    
    const aspectData = Array.from(ratioMap.values()).sort((a, b) => b.count - a.count);
    setAspectRatioData(aspectData);
    
    const endTime = performance.now();
    setProcessingTime(endTime - startTime);
  }, [filteredImages]);

  // Determine optimal grid columns based on viewport and content
  const getGridColumns = () => {
    const imageCount = filteredImages.length;
    
    if (previewMode === 'mobile') return 'grid-cols-2';
    if (previewMode === 'tablet') return 'grid-cols-3';
    
    // Desktop responsive columns based on image count and layout
    if (galleryLayout === 'square') {
      return imageCount > 20 ? 'grid-cols-5' : imageCount > 10 ? 'grid-cols-4' : 'grid-cols-3';
    }
    
    if (galleryLayout === 'masonry') {
      return 'masonry-grid-seamless';
    }
    
    // Automatic layout based on aspect ratio analysis
    const dominantCategory = aspectRatioData[0]?.category;
    if (dominantCategory === 'landscape') return 'grid-cols-2 md:grid-cols-3';
    if (dominantCategory === 'portrait') return 'grid-cols-3 md:grid-cols-4 2xl:grid-cols-5';
    return 'grid-cols-3 md:grid-cols-4';
  };

  // Background color presets
  const backgroundPresets = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#1a1a1a' },
    { name: 'White', value: '#ffffff' },
    { name: 'Warm Gray', value: '#2d2d2d' },
    { name: 'Cool Gray', value: '#1e293b' },
  ];

  // Mock image component for preview
  const PreviewImage = ({ image, index }: { image: Image, index: number }) => (
    <div 
      className={`
        relative group cursor-pointer transition-all hover:brightness-90
        ${galleryLayout === 'masonry' ? 'break-inside-avoid' : 'aspect-square'}
        ${galleryLayout === 'automatic' && aspectRatioData[0]?.category === 'landscape' ? 'aspect-[4/3]' : ''}
        ${galleryLayout === 'automatic' && aspectRatioData[0]?.category === 'portrait' ? 'aspect-[3/4]' : ''}
      `}
    >
      {/* Mock image placeholder */}
      <div 
        className={`
          seamless-image bg-gradient-to-br from-gray-600 to-gray-800
          flex items-center justify-center text-white text-sm
          ${galleryLayout === 'masonry' ? '' : 'rounded-none'}
        `}
        style={{ 
          background: `linear-gradient(${45 + (index * 23) % 180}deg, #4a5568, #2d3748)`
        }}
      >
        <div className="text-center">
          <div className="font-medium">{image.classification}</div>
          <div className="text-xs opacity-75">#{index + 1}</div>
        </div>
      </div>
      
      {/* Classification badge */}
      <Badge 
        className="absolute bottom-2 left-2 bg-black/75 text-white text-xs"
        variant="secondary"
      >
        {image.classification}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Gallery Live Preview
            <Badge variant="outline" className="ml-auto">
              {processingTime.toFixed(1)}ms detection
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Layout and Viewport Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gallery Layout</Label>
              <Select 
                value={galleryLayout} 
                onValueChange={(value: 'masonry' | 'square' | 'automatic') => onLayoutChange?.(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Automatic (Smart)
                    </div>
                  </SelectItem>
                  <SelectItem value="masonry">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4" />
                      Masonry
                    </div>
                  </SelectItem>
                  <SelectItem value="square">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      Square Grid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preview Device</Label>
              <Select 
                value={previewMode} 
                onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setPreviewMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showClassificationFilter && (
              <div className="space-y-2">
                <Label>Filter by Type</Label>
                <Select 
                  value={selectedClassification} 
                  onValueChange={(value: ImageClassification | 'all') => setSelectedClassification(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Images</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Background Color Controls */}
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex gap-2 flex-wrap">
              {backgroundPresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={backgroundColor === preset.value ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => onBackgroundColorChange?.(preset.value)}
                >
                  <div 
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: preset.value }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Analysis */}
          {aspectRatioData.length > 0 && (
            <div className="space-y-2">
              <Label>Aspect Ratio Analysis</Label>
              <div className="flex gap-2 flex-wrap">
                {aspectRatioData.map((data, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    <Palette className="w-3 h-3" />
                    {data.category}: {data.count} images
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardContent className="p-6">
          <div 
            className={`
              rounded-lg p-6 transition-all duration-300
              ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : 
                previewMode === 'tablet' ? 'max-w-2xl mx-auto' : 'w-full'}
            `}
            style={{ backgroundColor }}
          >
            <div className="mb-4 text-center">
              <h3 className={`font-semibold ${backgroundColor === '#ffffff' ? 'text-black' : 'text-white'}`}>
                Gallery Preview
              </h3>
              <p className={`text-sm opacity-75 ${backgroundColor === '#ffffff' ? 'text-gray-600' : 'text-gray-300'}`}>
                {filteredImages.length} images • {galleryLayout} layout • {previewMode} view
              </p>
            </div>

            {filteredImages.length > 0 ? (
              <div 
                className={`
                  ${galleryLayout === 'masonry' ? getGridColumns() : `grid grid-seamless ${getGridColumns()}`}
                `}
              >
                {filteredImages.slice(0, 20).map((image, index) => (
                  <PreviewImage key={image.id} image={image} index={index} />
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${backgroundColor === '#ffffff' ? 'text-gray-500' : 'text-gray-400'}`}>
                <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No images to display</p>
                <p className="text-sm">Select a different classification or add images to the gallery</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};