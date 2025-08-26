import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Save } from "lucide-react";

interface GallerySettings {
  backgroundColor?: string;
  layoutStyle?: string;
  borderStyle?: string;
  imageSpacing?: string;
  dominantAspectRatio?: string;
  borderRadius?: number;
  imageSpacingValue?: number;
  coverPicAlignment?: string;
  navbarPosition?: string;
  coverPicSize?: number;
}

interface GallerySettingsCardProps {
  gallerySettings: GallerySettings;
  setGallerySettings: (fn: (prev: GallerySettings) => GallerySettings) => void;
  onSave?: () => void;
  isSaving?: boolean;
  standalone?: boolean; // Whether to render as standalone card or just content
}

export const GallerySettingsCard: React.FC<GallerySettingsCardProps> = ({
  gallerySettings,
  setGallerySettings,
  onSave,
  isSaving = false,
  standalone = true
}) => {
  // Convert borderStyle to borderRadius for the slider
  const getBorderRadius = () => {
    switch (gallerySettings.borderStyle) {
      case 'sharp': return 0;
      case 'circular': return 44;
      default: return 22; // rounded
    }
  };

  // Local slider values (only for UI, not connected to settings during drag)
  const [localRadius, setLocalRadius] = useState(getCurrentRadius());
  const [localSpacing, setLocalSpacing] = useState(getCurrentSpacing());
  const [localCoverSize, setLocalCoverSize] = useState(getCurrentCoverSize());
  
  // Input field state
  const [radiusInputValue, setRadiusInputValue] = useState(getCurrentRadius().toString());
  
  // Simple timeouts for debounced saving
  const radiusTimeoutRef = useRef<NodeJS.Timeout>();
  const spacingTimeoutRef = useRef<NodeJS.Timeout>();
  const coverSizeTimeoutRef = useRef<NodeJS.Timeout>();

  // Convert imageSpacing to imageSpacingValue for the slider
  const getImageSpacingValue = () => {
    switch (gallerySettings.imageSpacing) {
      case 'tight': return 2;
      case 'loose': return 16;
      default: return 8; // normal
    }
  };

  // Simple input field state only
  const [spacingInputValue, setSpacingInputValue] = useState(getCurrentSpacing().toString());

  // Simple update - no auto-save
  const updateSpacing = (spacing: number) => {
    setLocalSpacing(spacing);
    setSpacingInputValue(spacing.toString());
  };

  // Handle spacing input field changes
  const handleSpacingInputChange = (value: string) => {
    setSpacingInputValue(value);
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateImageSpacing(numericValue);
    }
  };

  // Handle spacing input field blur
  const handleSpacingInputBlur = () => {
    const numericValue = parseInt(spacingInputValue);
    if (isNaN(numericValue)) {
      // Reset to current value if invalid input
      setSpacingInputValue(getImageSpacingValue().toString());
    } else {
      updateImageSpacing(numericValue);
    }
  };

  // Get current spacing value (use imageSpacingValue if available, fallback to converted value)
  const getCurrentSpacing = () => {
    return gallerySettings.imageSpacingValue !== undefined ? gallerySettings.imageSpacingValue : getImageSpacingValue();
  };

  // Ensure layoutStyle defaults to 'automatic' if not set
  useEffect(() => {
    if (!gallerySettings.layoutStyle) {
      console.log('Setting default layoutStyle to automatic');
      setGallerySettings(prev => ({...prev, layoutStyle: 'automatic'}));
    } else {
      console.log('Current layoutStyle:', gallerySettings.layoutStyle);
    }
  }, [gallerySettings.layoutStyle, setGallerySettings]);


  // Color picker preset colors
  const presetColors = [
    { name: 'Pure Black', value: '#000000' },
    { name: 'Dark Charcoal', value: '#1a1a1a' },
    { name: 'Warm Gray', value: '#2d2d2d' },
    { name: 'Cool Gray', value: '#1e293b' },
    { name: 'Pure White', value: '#ffffff' }
  ];

  // Local state for custom color picker
  const [customColor, setCustomColor] = useState(gallerySettings.backgroundColor || '#ffffff');
  const [hexInputValue, setHexInputValue] = useState(gallerySettings.backgroundColor || '#ffffff');

  // Update background color
  const updateBackgroundColor = (color: string) => {
    setGallerySettings(prev => ({...prev, backgroundColor: color}));
    setCustomColor(color);
    setHexInputValue(color);
  };

  // Save all local changes to settings
  const handleSave = () => {
    setGallerySettings(prev => ({
      ...prev,
      borderRadius: localRadius,
      imageSpacingValue: localSpacing,
      coverPicSize: localCoverSize
    }));
    if (onSave) {
      onSave();
    }
  };

  // Handle hex input changes
  const handleHexInputChange = (value: string) => {
    setHexInputValue(value);
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      updateBackgroundColor(value);
    }
  };

  // Handle hex input blur
  const handleHexInputBlur = () => {
    if (!/^#[0-9A-F]{6}$/i.test(hexInputValue)) {
      // Reset to current value if invalid input
      setHexInputValue(localBackgroundColor || '#ffffff');
    }
  };

  // Simple update - no auto-save
  const updateRadius = (radius: number) => {
    setLocalRadius(radius);
    setRadiusInputValue(radius.toString());
  };

  // Handle input field changes
  const handleRadiusInputChange = (value: string) => {
    setRadiusInputValue(value);
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateBorderRadius(numericValue);
    }
  };

  // Handle input field blur (when user finishes editing)
  const handleRadiusInputBlur = () => {
    const numericValue = parseInt(radiusInputValue);
    if (isNaN(numericValue)) {
      // Reset to current value if invalid input
      setRadiusInputValue(getBorderRadius().toString());
    } else {
      updateBorderRadius(numericValue);
    }
  };

  // Get current radius value (use borderRadius if available, fallback to converted value)
  const getCurrentRadius = () => {
    return gallerySettings.borderRadius !== undefined ? gallerySettings.borderRadius : getBorderRadius();
  };

  // Get current cover size value (default to 80%)
  const getCurrentCoverSize = () => {
    return gallerySettings.coverPicSize !== undefined ? gallerySettings.coverPicSize : 80;
  };

  // Handle cover size slider change
  const [coverSizeInputValue, setCoverSizeInputValue] = useState(getCurrentCoverSize().toString());

  const handleCoverSizeInputChange = (value: string) => {
    setCoverSizeInputValue(value);
  };

  const handleCoverSizeInputBlur = () => {
    const numValue = parseInt(coverSizeInputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(60, Math.min(100, numValue));
      setCoverSizeInputValue(clampedValue.toString());
      setGallerySettings(prev => ({...prev, coverPicSize: clampedValue}));
    } else {
      setCoverSizeInputValue(getCurrentCoverSize().toString());
    }
  };

  // Simple update - no auto-save
  const updateCoverSize = (value: number) => {
    setLocalCoverSize(value);
    setCoverSizeInputValue(value.toString());
  };

  const content = (
    <div className="space-y-4 w-full">

      {/* Background Color Control */}
      <div className="gallery-slider-container">
        <div className="gallery-slider-header">
          <Label className="gallery-slider-label">Background Color</Label>
          <Input
            type="text"
            value={hexInputValue}
            onChange={(e) => handleHexInputChange(e.target.value)}
            onBlur={handleHexInputBlur}
            placeholder="#ffffff"
            className="gallery-slider-input"
          />
        </div>
        <div className="flex gap-2 mt-2 w-full">
          {/* Preset Color Swatches */}
          {presetColors.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`
                color-swatch
                ${localBackgroundColor === color.value 
                  ? 'selected' 
                  : 'unselected'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
              onClick={() => updateBackgroundColor(color.value)}
            />
          ))}
          
          {/* Custom Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`
                  color-swatch relative overflow-hidden
                  ${!presetColors.some(c => c.value === localBackgroundColor)
                    ? 'selected' 
                    : 'unselected'
                  }
                `}
                style={{ 
                  background: !presetColors.some(c => c.value === localBackgroundColor)
                    ? localBackgroundColor 
                    : 'linear-gradient(45deg, #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%)'
                }}
                title="Custom Color"
              >
                {presetColors.some(c => c.value === localBackgroundColor) && (
                  <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center bg-black/20">
                    🌈
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="start">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="color-picker">Choose Color</Label>
                  <input
                    id="color-picker"
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setCustomColor(newColor);
                      updateBackgroundColor(newColor); // Real-time update
                    }}
                    className="w-full h-12 rounded-md border cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor="hex-input">Hex Code</Label>
                  <Input
                    id="hex-input"
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setCustomColor(newColor);
                      // Update background in real-time if valid hex
                      if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                        updateBackgroundColor(newColor);
                      }
                    }}
                    placeholder="#ffffff"
                    className="font-mono"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Border Radius Control */}
      <div className="gallery-slider-container">
        <div className="gallery-slider-header">
          <Label className="gallery-slider-label">Border Radius</Label>
          <Input
            type="number"
            value={radiusInputValue}
            onChange={(e) => handleRadiusInputChange(e.target.value)}
            onBlur={handleRadiusInputBlur}
            min={0}
            max={40}
            className="gallery-slider-input"
          />
        </div>
        <div className="gallery-slider-track">
          <SliderPrimitive.Root
            value={[localRadius]}
            onValueChange={(value) => updateRadius(value[0])}
            max={40}
            min={0}
            step={1}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-secondary">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
        </div>
      </div>

      {/* Image Spacing Control */}
      <div className="gallery-slider-container">
        <div className="gallery-slider-header">
          <Label className="gallery-slider-label">Image Spacing</Label>
          <Input
            type="number"
            value={spacingInputValue}
            onChange={(e) => handleSpacingInputChange(e.target.value)}
            onBlur={handleSpacingInputBlur}
            min={0}
            max={40}
            className="gallery-slider-input"
          />
        </div>
        <div className="gallery-slider-track">
          <SliderPrimitive.Root
            value={[localSpacing]}
            onValueChange={(value) => updateSpacing(value[0])}
            max={40}
            min={0}
            step={1}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-secondary">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
        </div>
      </div>

      {/* Cover Pic Size Control */}
      <div className="gallery-slider-container">
        <div className="gallery-slider-header">
          <Label className="gallery-slider-label">Cover Pic Size</Label>
          <Input
            type="number"
            value={coverSizeInputValue}
            onChange={(e) => handleCoverSizeInputChange(e.target.value)}
            onBlur={handleCoverSizeInputBlur}
            min={60}
            max={100}
            className="gallery-slider-input"
          />
        </div>
        <div className="gallery-slider-track">
          <SliderPrimitive.Root
            value={[localCoverSize]}
            onValueChange={(value) => updateCoverSize(value[0])}
            max={100}
            min={60}
            step={1}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-secondary">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
        </div>
      </div>

    </div>
  );

  if (standalone) {
    return (
      <Card className="admin-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-salmon flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Gallery Settings
            </CardTitle>
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-salmon text-white hover:bg-salmon-muted"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};