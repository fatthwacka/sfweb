import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Settings, ChevronUp, ChevronDown, Save, CheckCircle, AlertCircle } from "lucide-react";
import { useDebouncedApiSave } from '@/hooks/use-debounced-api-save';

interface FrontPageSettings {
  imagePadding?: number;
  borderRadius?: number;
  imageCount?: number;
  layoutStyle?: string;
  borderColor?: string;
  borderColorEnd?: string;
  borderThickness?: number;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientMiddle?: string;
  textColor?: string;
  // New text color controls
  textColorPrimary?: string;
  textColorSecondary?: string;
  textColorTertiary?: string;
}

interface FrontPageSettingsProps {
  settings?: FrontPageSettings;
  onSettingsChange?: (settings: FrontPageSettings) => void;
  onSave?: (settingsToSave?: FrontPageSettings) => void;
  isSaving?: boolean;
}

export const FrontPageSettingsCard: React.FC<FrontPageSettingsProps> = ({
  settings = {},
  onSettingsChange,
  onSave,
  isSaving = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Default settings
  const defaultSettings: FrontPageSettings = {
    imagePadding: 2, // Gap between images (0-40px)
    borderRadius: 8, // Border roundness (0-40px)
    imageCount: 9, // Number of images (3-12)
    layoutStyle: 'square', // Layout style: square, 2:3, 4:5
    borderColor: '#ffffff', // Border color start for images
    borderColorEnd: '#cccccc', // Border color end for images
    borderThickness: 0, // Border thickness (0-3px)
    backgroundGradientStart: '#1e293b', // Section background gradient start
    backgroundGradientEnd: '#0f172a', // Section background gradient end
    backgroundGradientMiddle: '#334155', // Section background gradient middle
    textColor: '#e2e8f0', // Legacy paragraph text color
    // New text color controls
    textColorPrimary: '#ffffff', // Main title text
    textColorSecondary: '#e2e8f0', // Subtitle & paragraph text
    textColorTertiary: '#94a3b8' // All other text
  };

  // Hybrid state: Local state for immediate updates, server state as source of truth
  const serverSettings = { ...defaultSettings, ...settings };
  const [localSettings, setLocalSettings] = useState<FrontPageSettings>(serverSettings);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Manual save only - no auto-save
  // const { debouncedSave, forceSave, isSaving: isApiSaving, saveError } = useDebouncedApiSave({
  //   delay: 500
  // });

  // Sync local state ONLY on initial load - no auto-sync after that
  useEffect(() => {
    setLocalSettings(serverSettings);
    
    // On initial load, sync existing portfolio gradient to new system
    if (serverSettings.backgroundGradientStart || serverSettings.backgroundGradientMiddle || serverSettings.backgroundGradientEnd) {
      syncCompleteGradientToNewSystem({
        startColor: serverSettings.backgroundGradientStart || '#1e293b',
        middleColor: serverSettings.backgroundGradientMiddle || '#334155', 
        endColor: serverSettings.backgroundGradientEnd || '#0f172a'
      });
    }
  }, []); // Only run once on mount

  // Local state for input fields (for immediate responsiveness)
  const [paddingInputValue, setPaddingInputValue] = useState(localSettings.imagePadding?.toString() || '2');
  const [radiusInputValue, setRadiusInputValue] = useState(localSettings.borderRadius?.toString() || '8');
  const [countInputValue, setCountInputValue] = useState(localSettings.imageCount?.toString() || '9');
  const [thicknessInputValue, setThicknessInputValue] = useState(localSettings.borderThickness?.toString() || '0');

  // Sync input values when local settings change
  useEffect(() => {
    setPaddingInputValue(localSettings.imagePadding?.toString() || '2');
    setRadiusInputValue(localSettings.borderRadius?.toString() || '8');
    setCountInputValue(localSettings.imageCount?.toString() || '9');
    setThicknessInputValue(localSettings.borderThickness?.toString() || '0');
  }, [localSettings.imagePadding, localSettings.borderRadius, localSettings.imageCount, localSettings.borderThickness]);

  const updateSettings = (updates: Partial<FrontPageSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    
    // Only update local state - no auto-save
    setLocalSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  // Manual save function
  const handleManualSave = () => {
    // Pass the current local settings directly to save function
    if (onSave) {
      onSave(localSettings);
    }
    // Also update parent for any other uses
    onSettingsChange?.(localSettings);
  };

  // Image padding control - local only
  const updateImagePadding = (padding: number) => {
    const clampedPadding = Math.max(0, Math.min(40, padding));
    setPaddingInputValue(clampedPadding.toString());
    setLocalSettings(prev => ({ ...prev, imagePadding: clampedPadding }));
    setHasLocalChanges(true);
  };

  const handlePaddingInputChange = (value: string) => {
    setPaddingInputValue(value);
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateImagePadding(numericValue);
    }
  };

  const handlePaddingInputBlur = () => {
    const numericValue = parseInt(paddingInputValue);
    if (isNaN(numericValue)) {
      setPaddingInputValue(localSettings.imagePadding?.toString() || '2');
    } else {
      updateImagePadding(numericValue);
    }
  };

  // Border radius control - local only
  const updateBorderRadius = (radius: number) => {
    const clampedRadius = Math.max(0, Math.min(40, radius));
    setRadiusInputValue(clampedRadius.toString());
    setLocalSettings(prev => ({ ...prev, borderRadius: clampedRadius }));
    setHasLocalChanges(true);
  };

  const handleRadiusInputChange = (value: string) => {
    setRadiusInputValue(value);
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateBorderRadius(numericValue);
    }
  };

  const handleRadiusInputBlur = () => {
    const numericValue = parseInt(radiusInputValue);
    if (isNaN(numericValue)) {
      setRadiusInputValue(localSettings.borderRadius?.toString() || '8');
    } else {
      updateBorderRadius(numericValue);
    }
  };

  // Image count control - local only
  const updateImageCount = (count: number) => {
    const clampedCount = Math.max(3, Math.min(12, count));
    setCountInputValue(clampedCount.toString());
    setLocalSettings(prev => ({ ...prev, imageCount: clampedCount }));
    setHasLocalChanges(true);
  };

  const handleCountInputChange = (value: string) => {
    setCountInputValue(value);
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateImageCount(numericValue);
    }
  };

  const handleCountInputBlur = () => {
    const numericValue = parseInt(countInputValue);
    if (isNaN(numericValue)) {
      setCountInputValue(localSettings.imageCount?.toString() || '9');
    } else {
      updateImageCount(numericValue);
    }
  };

  // Layout style control
  const updateLayoutStyle = (style: string) => {
    updateSettings({ layoutStyle: style });
  };

  // Border color controls
  const updateBorderColor = (color: string) => {
    updateSettings({ borderColor: color });
  };

  const updateBorderColorEnd = (color: string) => {
    updateSettings({ borderColorEnd: color });
  };

  // Border thickness control
  const updateBorderThickness = (thickness: number, shouldSave: boolean = true) => {
    const clampedThickness = Math.max(0, Math.min(3, thickness));
    setThicknessInputValue(clampedThickness.toString());
    updateSettings({ borderThickness: clampedThickness }, shouldSave);
  };

  const handleThicknessInputChange = (value: string) => {
    setThicknessInputValue(value);
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateBorderThickness(numericValue);
    }
  };

  const handleThicknessInputBlur = () => {
    const numericValue = parseInt(thicknessInputValue);
    if (isNaN(numericValue)) {
      setThicknessInputValue(localSettings.borderThickness?.toString() || '0');
    } else {
      updateBorderThickness(numericValue);
    }
  };

  // Background gradient controls - sync with both old and new gradient systems
  const updateGradientStart = (color: string) => {
    updateSettings({ backgroundGradientStart: color });
    // Also sync with new gradient system
    syncToGradientSystem('startColor', color);
  };

  const updateGradientMiddle = (color: string) => {
    updateSettings({ backgroundGradientMiddle: color });
    // Also sync with new gradient system
    syncToGradientSystem('middleColor', color);
  };

  const updateGradientEnd = (color: string) => {
    updateSettings({ backgroundGradientEnd: color });
    // Also sync with new gradient system
    syncToGradientSystem('endColor', color);
  };

  // Sync portfolio gradient changes to new gradient system
  const syncToGradientSystem = (colorKey: string, color: string) => {
    // Update the new gradient system structure
    fetch('/api/site-config/bulk', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gradients: {
          portfolio: {
            [colorKey]: color,
            direction: '135deg' // Default direction for portfolio
          }
        }
      }),
    }).catch(error => {
      console.error('Failed to sync portfolio gradient to new system:', error);
    });
  };

  // Sync complete gradient set to new system (for initial load)
  const syncCompleteGradientToNewSystem = (gradient: {startColor: string, middleColor: string, endColor: string}) => {
    fetch('/api/site-config/bulk', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gradients: {
          portfolio: {
            startColor: gradient.startColor,
            middleColor: gradient.middleColor,
            endColor: gradient.endColor,
            direction: '135deg' // Default direction for portfolio
          }
        }
      }),
    }).catch(error => {
      console.error('Failed to sync complete portfolio gradient to new system:', error);
    });
  };

  // Text color control (legacy)
  const updateTextColor = (color: string) => {
    updateSettings({ textColor: color });
  };

  // New text color controls
  const updateTextColorPrimary = (color: string) => {
    updateSettings({ textColorPrimary: color });
  };
  const updateTextColorSecondary = (color: string) => {
    updateSettings({ textColorSecondary: color });
  };
  const updateTextColorTertiary = (color: string) => {
    updateSettings({ textColorTertiary: color });
  };

  return (
    <Card className="admin-gradient-card mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-salmon flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Front Page Featured Section Settings
            </CardTitle>
            
            {/* Save Status - Manual save only */}
            <div className="flex items-center gap-1 text-sm">
              {isSaving ? (
                <div className="flex items-center gap-1 text-blue-400">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  Ready to save
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Manual Save Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="text-salmon hover:text-salmon-muted border-salmon/30"
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save Now'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-salmon hover:text-salmon-muted"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          {/* Top Row - Number of Images, Border Thickness, Border Color, [Remove Border Roundness per grouping] */}
          <div className="flex gap-4">
            
            {/* Number of Images Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Number of Images</Label>
                <Input
                  type="number"
                  value={countInputValue}
                  onChange={(e) => handleCountInputChange(e.target.value)}
                  onBlur={handleCountInputBlur}
                  min={3}
                  max={12}
                  className="gallery-slider-input"
                />
              </div>
              <div className="gallery-slider-track">
                <SliderPrimitive.Root
                  value={[localSettings.imageCount || 9]}
                  onValueChange={(value) => updateImageCount(value[0])}
                  max={12}
                  min={3}
                  step={1}
                  className="relative flex w-full touch-none select-none items-center"
                >
                  <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-secondary">
                    <SliderPrimitive.Range className="absolute h-full bg-primary" />
                  </SliderPrimitive.Track>
                  <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
                </SliderPrimitive.Root>
              </div>
              <div className="text-xs text-gray-400 mt-1">Maximum images displayed (3-12)</div>
            </div>

            {/* Border Thickness Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Border Thickness</Label>
                <Input
                  type="number"
                  value={thicknessInputValue}
                  onChange={(e) => handleThicknessInputChange(e.target.value)}
                  onBlur={handleThicknessInputBlur}
                  min={0}
                  max={3}
                  className="gallery-slider-input"
                />
              </div>
              <div className="gallery-slider-track">
                <SliderPrimitive.Root
                  value={[localSettings.borderThickness || 0]}
                  onValueChange={(value) => updateBorderThickness(value[0], false)}
                  onValueCommit={(value) => updateBorderThickness(value[0], true)}
                  max={3}
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
              <div className="text-xs text-gray-400 mt-1">Border thickness (0-3px)</div>
            </div>

            {/* Border Roundness Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Border Roundness</Label>
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
                  value={[localSettings.borderRadius || 8]}
                  onValueChange={(value) => updateBorderRadius(value[0])}
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
              <div className="text-xs text-gray-400 mt-1">Corner roundness (0-40px)</div>
            </div>

            {/* Border Color Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Border Color</Label>
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.borderColor || '#ffffff'}
                  onChange={(e) => updateBorderColor(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="Start Color"
                />
                <input
                  type="color"
                  value={localSettings.borderColorEnd || '#cccccc'}
                  onChange={(e) => updateBorderColorEnd(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="End Color"
                />
                <div className="flex-1"></div>
              </div>
            </div>

          </div>

          {/* Bottom Row - Image Padding, Layout Style, Background Gradient, Reserved */}
          <div className="flex gap-4 mt-6">

            {/* Image Padding Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Image Padding</Label>
                <Input
                  type="number"
                  value={paddingInputValue}
                  onChange={(e) => handlePaddingInputChange(e.target.value)}
                  onBlur={handlePaddingInputBlur}
                  min={0}
                  max={40}
                  className="gallery-slider-input"
                />
              </div>
              <div className="gallery-slider-track">
                <SliderPrimitive.Root
                  value={[localSettings.imagePadding || 2]}
                  onValueChange={(value) => updateImagePadding(value[0])}
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
              <div className="text-xs text-gray-400 mt-1">Gap between images (0-40px)</div>
            </div>

            {/* Layout Style Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Layout Style</Label>
              </div>
              <Select
                value={localSettings.layoutStyle || 'square'}
                onValueChange={updateLayoutStyle}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select layout style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square (1:1)</SelectItem>
                  <SelectItem value="portrait">Portrait (2:3)</SelectItem>
                  <SelectItem value="instagram">Instagram (4:5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background Gradient Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Background Gradient</Label>
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.backgroundGradientStart || '#1e293b'}
                  onChange={(e) => updateGradientStart(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="Start Color"
                />
                <input
                  type="color"
                  value={localSettings.backgroundGradientMiddle || '#334155'}
                  onChange={(e) => updateGradientMiddle(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="Middle Color"
                />
                <input
                  type="color"
                  value={localSettings.backgroundGradientEnd || '#0f172a'}
                  onChange={(e) => updateGradientEnd(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="End Color"
                />
              </div>
            </div>

            {/* Text Color Control */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Text Color</Label>
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.textColor || '#e2e8f0'}
                  onChange={(e) => updateTextColor(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                />
                <div className="flex-1"></div>
                <div className="flex-1"></div>
              </div>
            </div>

          </div>

          {/* Third Row - Text Color Controls */}
          <div className="flex gap-4 mt-6">

            {/* Main Title Text */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Main Title Text</Label>
              </div>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (localSettings.textColorPrimary === 'var(--color-salmon)' || localSettings.textColorPrimary === 'hsl(16, 100%, 73%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
                  onClick={() => updateTextColorPrimary('var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (localSettings.textColorPrimary === 'var(--color-cyan)' || localSettings.textColorPrimary === 'hsl(180, 100%, 50%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
                  onClick={() => updateTextColorPrimary('var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={localSettings.textColorPrimary?.startsWith('var(') ? '#ffffff' : (localSettings.textColorPrimary || '#ffffff')}
                  onChange={(e) => updateTextColorPrimary(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>

            {/* Subtitle & Paragraph Text */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">Subtitle & Paragraph Text</Label>
              </div>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (localSettings.textColorSecondary === 'var(--color-salmon)' || localSettings.textColorSecondary === 'hsl(16, 100%, 73%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
                  onClick={() => updateTextColorSecondary('var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (localSettings.textColorSecondary === 'var(--color-cyan)' || localSettings.textColorSecondary === 'hsl(180, 100%, 50%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
                  onClick={() => updateTextColorSecondary('var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={localSettings.textColorSecondary?.startsWith('var(') ? '#e2e8f0' : (localSettings.textColorSecondary || '#e2e8f0')}
                  onChange={(e) => updateTextColorSecondary(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>

            {/* All Other Text */}
            <div className="gallery-slider-container flex-1">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label">All Other Text</Label>
              </div>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (localSettings.textColorTertiary === 'var(--color-salmon)' || localSettings.textColorTertiary === 'hsl(16, 100%, 73%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
                  onClick={() => updateTextColorTertiary('var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (localSettings.textColorTertiary === 'var(--color-cyan)' || localSettings.textColorTertiary === 'hsl(180, 100%, 50%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
                  onClick={() => updateTextColorTertiary('var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={localSettings.textColorTertiary?.startsWith('var(') ? '#94a3b8' : (localSettings.textColorTertiary || '#94a3b8')}
                  onChange={(e) => updateTextColorTertiary(e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>

            {/* Empty slot for alignment */}
            <div className="gallery-slider-container flex-1 opacity-50">
              <div className="gallery-slider-header">
                <Label className="gallery-slider-label text-gray-500">Reserved</Label>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 h-8 bg-gray-700 rounded border border-gray-600"></div>
                <div className="flex-1 h-8 bg-gray-700 rounded border border-gray-600"></div>
                <div className="flex-1 h-8 bg-gray-700 rounded border border-gray-600"></div>
              </div>
            </div>

          </div>
        </CardContent>
      )}
    </Card>
  );
};