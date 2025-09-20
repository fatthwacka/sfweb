import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextColorsGroup } from "@/components/ui/text-color-picker";
import { useAllGradients } from "@/hooks/use-all-gradients";
import { Loader2, Check } from "lucide-react";

// Utility function to convert section keys to readable titles
function formatSectionTitle(sectionKey: string): string {
  // Remove common prefixes and suffixes
  let title = sectionKey
    .replace(/^(photography|videography)-/, '')
    .replace(/^(landing|category)-/, '')
    .replace(/-/g, ' ');
  
  // Convert to title case
  return title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface TextColorsConfig {
  primary: string;
  secondary: string;
  tertiary: string;
}

interface GradientConfig {
  startColor: string;
  middleColor: string;
  endColor: string;
  accentColor?: string;
  direction: string;
  opacity?: number;
  textColors?: TextColorsConfig;
}

interface GradientPickerProps {
  sectionKey: string;
  label?: string; // Now optional, will auto-generate from sectionKey if not provided
  title?: string; // Optional custom title
  description?: string; // Optional description
  showDirection?: boolean;
  showOpacity?: boolean;
  showAccentColor?: boolean;
  showTextColors?: boolean;
}

const DIRECTION_OPTIONS = [
  { value: '135deg', label: 'Diagonal (Default)' },
  { value: 'to bottom', label: 'Top to Bottom' },
  { value: 'to right', label: 'Left to Right' },
  { value: 'to bottom right', label: 'Top-Left to Bottom-Right' },
  { value: 'to bottom left', label: 'Top-Right to Bottom-Left' },
  { value: '45deg', label: 'Diagonal 45°' },
  { value: '90deg', label: 'Vertical' },
  { value: '180deg', label: 'Bottom to Top' }
];

export function GradientPicker({
  sectionKey,
  label,
  title,
  description,
  showDirection = true,
  showOpacity = false,
  showAccentColor = false,
  showTextColors = false
}: GradientPickerProps) {

  // Auto-generate label if not provided
  const displayLabel = label || formatSectionTitle(sectionKey);
  const displayTitle = title || displayLabel;

  // UNIFIED HOOK SYSTEM - Single source of truth for gradient data and updates
  const { 
    getGradient, 
    isLoading, 
    updateGradient, 
    updateColor: updateColorUnified,
    updateTextColor: updateTextColorUnified,
    isUpdating 
  } = useAllGradients();

  // Get gradient from unified system (includes defaults fallback)
  const serverGradient = getGradient(sectionKey);

  // Local state for real-time updates
  const [localGradient, setLocalGradient] = useState<GradientConfig>(serverGradient);

  // Update local state when server data changes
  useEffect(() => {
    setLocalGradient(serverGradient);
  }, [JSON.stringify(serverGradient)]);

  // Use local gradient for display (real-time updates)
  const gradient = localGradient;

  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  // Show success feedback when update completes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isUpdating && showSuccess) {
      timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000); // 2 seconds for better visibility
    }
    return () => clearTimeout(timer);
  }, [isUpdating, showSuccess]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Simple debounce implementation
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // FIXED DEBOUNCED SAVE - Delay both spinner and API call
  const debouncedSave = useCallback(
    (gradientData: GradientConfig) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Don't set pending state immediately - wait for debounce
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        // Now set pending and start the actual save
        setPendingSave(true);
        setShowSuccess(true);
        
        // BATCH UPDATE - Single API call instead of multiple individual calls
        updateGradient(sectionKey, gradientData);

        setPendingSave(false);
      }, 2000); // 2 second debounce - no spinner until this delay passes
    },
    [updateGradient, sectionKey]
  );

  // Real-time local update + debounced save
  const updateGradientLocal = (updates: Partial<GradientConfig>) => {
    // Instant local update for real-time preview
    const newGradient = { ...gradient, ...updates };
    setLocalGradient(newGradient);
    
    // Debounced API save
    debouncedSave(newGradient);
  };

  // Real-time text color update + debounced save
  const updateTextColorLocal = (colorType: keyof TextColorsConfig, color: string) => {
    // Instant local update for real-time preview
    const newGradient = {
      ...gradient,
      textColors: {
        ...gradient.textColors,
        [colorType]: color
      }
    };
    setLocalGradient(newGradient);
    
    // Debounced API save
    debouncedSave(newGradient);
  };

  // Generate preview gradient (without opacity to avoid text issues)
  const previewStyle = {
    background: `linear-gradient(${gradient.direction}, ${gradient.startColor} 0%, ${gradient.middleColor} 50%, ${gradient.endColor} 100%)`
  };

  // Generate card background style using the exact same gradient as preview
  const cardBackgroundStyle = {
    background: `linear-gradient(${gradient.direction}, ${gradient.startColor} 0%, ${gradient.middleColor} 50%, ${gradient.endColor} 100%)`,
    position: 'relative' as const
  };

  if (isLoading) {
    return (
      <div className="gallery-slider-container">
        <div className="gallery-slider-header">
          <Label className="gallery-slider-label">Loading...</Label>
        </div>
        <div className="animate-pulse h-24 bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      className="gallery-slider-container relative rounded-lg overflow-hidden"
      style={cardBackgroundStyle}
    >
      {/* Very light overlay for text readability without color distortion */}
      <div className="absolute inset-0 bg-black/20 z-0" />
      
      {/* Content container with enhanced text styling for readability */}
      <div className="relative z-10" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
        {/* Success indicator positioned at top-right of container */}
        {(pendingSave || isUpdating || showSuccess) && (
          <div className="absolute top-4 right-4 z-20">
            {pendingSave && (
              <div className="flex items-center gap-2 text-sm text-amber-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {isUpdating && !pendingSave && (
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {!isUpdating && !pendingSave && showSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check className="h-4 w-4" />
                <span>All changes saved</span>
              </div>
            )}
          </div>
        )}

      <div className="gallery-slider-header">
        <div className="flex items-center justify-between">
          <Label className="text-white text-lg font-bold">
            {displayTitle}
          </Label>
          {description && (
            <span className="text-white/80 text-sm font-medium">{description}</span>
          )}
        </div>
      </div>
      
      {showTextColors ? (
        /* Row-based layout for perfect horizontal alignment */
        <div className="space-y-4 mb-4">
          {/* Row 1: Preview + Main Title Text */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">{displayTitle} Preview</Label>
              <div 
                className="w-full h-8 rounded border-2 border-white/50 shadow-lg"
                style={previewStyle}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Main Title Text</Label>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 bg-theme-salmon ${
                    (gradient.textColors?.primary === 'var(--color-salmon)' || gradient.textColors?.primary === 'var(--salmon)') ? 'border-white' : 'border-slate-500'
                  }`}
                  onClick={() => updateTextColorLocal('primary', 'var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 bg-theme-cyan ${
                    (gradient.textColors?.primary === 'var(--color-cyan)' || gradient.textColors?.primary === 'var(--cyan)') ? 'border-white' : 'border-slate-500'
                  }`}
                  onClick={() => updateTextColorLocal('primary', 'var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={gradient.textColors?.primary?.startsWith('var(') ? '#ffffff' : (gradient.textColors?.primary || '#ffffff')}
                  onChange={(e) => updateTextColorLocal('primary', e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Background Gradient + Section Subtitle */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Background Gradient</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={gradient.startColor || '#1e293b'}
                  onChange={(e) => updateGradientLocal({ startColor: e.target.value })}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-white/30 shadow-md"
                  title="Start Color"
                />
                <input
                  type="color"
                  value={gradient.middleColor || '#334155'}
                  onChange={(e) => updateGradientLocal({ middleColor: e.target.value })}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-white/30 shadow-md"
                  title="Middle Color"
                />
                <input
                  type="color"
                  value={gradient.endColor || '#0f172a'}
                  onChange={(e) => updateGradientLocal({ endColor: e.target.value })}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-white/30 shadow-md"
                  title="End Color"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Section Subtitle</Label>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 bg-theme-salmon ${
                    (gradient.textColors?.secondary === 'var(--color-salmon)' || gradient.textColors?.secondary === 'var(--salmon)') ? 'border-white' : 'border-slate-500'
                  }`}
                  onClick={() => updateTextColorLocal('secondary', 'var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 bg-theme-cyan ${
                    (gradient.textColors?.secondary === 'var(--color-cyan)' || gradient.textColors?.secondary === 'var(--cyan)') ? 'border-white' : 'border-slate-500'
                  }`}
                  onClick={() => updateTextColorLocal('secondary', 'var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={gradient.textColors?.secondary?.startsWith('var(') ? '#e2e8f0' : (gradient.textColors?.secondary || '#e2e8f0')}
                  onChange={(e) => updateTextColorLocal('secondary', e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Direction + Card Features */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {showDirection && (
              <div className="space-y-2">
                <Label className="text-white text-xs font-medium">Direction</Label>
                <Select 
                  value={gradient.direction} 
                  onValueChange={(value) => updateGradientLocal({ direction: value })}
                >
                  <SelectTrigger className="bg-slate-800/80 border-white/30 text-white h-8 shadow-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {DIRECTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Card Features</Label>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 bg-theme-salmon ${
                    (gradient.textColors?.tertiary === 'var(--color-salmon)' || gradient.textColors?.tertiary === 'var(--salmon)') ? 'border-white' : 'border-slate-500'
                  }`}
                  onClick={() => updateTextColorLocal('tertiary', 'var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 bg-theme-cyan ${
                    (gradient.textColors?.tertiary === 'var(--color-cyan)' || gradient.textColors?.tertiary === 'var(--cyan)') ? 'border-white' : 'border-slate-500'
                  }`}
                  onClick={() => updateTextColorLocal('tertiary', 'var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={gradient.textColors?.tertiary?.startsWith('var(') ? '#94a3b8' : (gradient.textColors?.tertiary || '#94a3b8')}
                  onChange={(e) => updateTextColorLocal('tertiary', e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Original layout when text colors are disabled */
        <div className="space-y-4 mb-4">
          {/* Gradient Preview */}
          <div className="space-y-2">
            <div 
              className="w-full h-8 rounded border-2 border-white/50 shadow-lg"
              style={previewStyle}
            />
          </div>

          {/* Color Controls - Compact 3-rectangle layout like portfolio settings */}
          <div className="flex gap-2">
            <input
              type="color"
              value={gradient.startColor || '#1e293b'}
              onChange={(e) => updateGradientLocal({ startColor: e.target.value })}
              className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-white/30 shadow-md"
              title="Start Color"
            />
            <input
              type="color"
              value={gradient.middleColor || '#334155'}
              onChange={(e) => updateGradientLocal({ middleColor: e.target.value })}
              className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-white/30 shadow-md"
              title="Middle Color"
            />
            <input
              type="color"
              value={gradient.endColor || '#0f172a'}
              onChange={(e) => updateGradientLocal({ endColor: e.target.value })}
              className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-white/30 shadow-md"
              title="End Color"
            />
          </div>

          {/* Direction Control - Compact */}
          {showDirection && (
            <div className="space-y-2">
              <Label className="text-white text-sm">Direction</Label>
              <Select 
                value={gradient.direction} 
                onValueChange={(value) => updateGradientLocal({ direction: value })}
              >
                <SelectTrigger className="bg-slate-800/80 border-white/30 text-white h-8 shadow-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {DIRECTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
            </div>
          )}
        </div>
      )}

      {/* CSS Output - Collapsed/Hidden for now */}
      {false && (
        <div className="space-y-2 mt-4">
          <Label className="text-white text-sm">CSS Output</Label>
          <div className="p-2 bg-slate-900 rounded border border-slate-600 text-xs text-green-400 font-mono">
            background: linear-gradient({gradient.direction}, {gradient.startColor} 0%, {gradient.middleColor} 50%, {gradient.endColor} 100%);
          </div>
        </div>
      )}
      </div> {/* Close content container */}
    </div>
  );
}