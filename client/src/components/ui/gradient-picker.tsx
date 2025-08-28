import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextColorsGroup } from "@/components/ui/text-color-picker";

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
  label: string;
  gradient: GradientConfig;
  onChange: (gradient: GradientConfig) => void;
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
  gradient,
  onChange,
  showDirection = true,
  showOpacity = false,
  showAccentColor = false,
  showTextColors = false
}: GradientPickerProps) {

  const updateGradient = (updates: Partial<GradientConfig>) => {
    onChange({ ...gradient, ...updates });
  };

  const updateTextColor = (colorType: keyof TextColorsConfig, color: string) => {
    const updatedTextColors = {
      ...gradient.textColors,
      [colorType]: color
    };
    updateGradient({ textColors: updatedTextColors });
  };

  // Generate preview gradient (without opacity to avoid text issues)
  const previewStyle = {
    background: `linear-gradient(${gradient.direction}, ${gradient.startColor} 0%, ${gradient.middleColor} 50%, ${gradient.endColor} 100%)`
  };


  return (
    <div className="gallery-slider-container">
      <div className="gallery-slider-header">
        <Label className={`${showTextColors ? 'text-white text-lg font-bold' : 'gallery-slider-label'}`}>
          {showTextColors ? 'Section Colors' : label}
        </Label>
      </div>
      
      {showTextColors ? (
        /* Row-based layout for perfect horizontal alignment */
        <div className="space-y-4 mb-4">
          {/* Row 1: Preview + Main Title Text */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Preview</Label>
              <div 
                className="w-full h-8 rounded border border-slate-600"
                style={previewStyle}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Main Title Text</Label>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (gradient.textColors?.primary === 'var(--color-salmon)' || gradient.textColors?.primary === 'hsl(16, 100%, 73%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
                  onClick={() => updateTextColor('primary', 'var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (gradient.textColors?.primary === 'var(--color-cyan)' || gradient.textColors?.primary === 'hsl(180, 100%, 50%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
                  onClick={() => updateTextColor('primary', 'var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={gradient.textColors?.primary?.startsWith('var(') ? '#ffffff' : (gradient.textColors?.primary || '#ffffff')}
                  onChange={(e) => updateTextColor('primary', e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Background Gradient + Subtitle & Paragraph Text */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Background Gradient</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={gradient.startColor || '#1e293b'}
                  onChange={(e) => updateGradient({ startColor: e.target.value })}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="Start Color"
                />
                <input
                  type="color"
                  value={gradient.middleColor || '#334155'}
                  onChange={(e) => updateGradient({ middleColor: e.target.value })}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="Middle Color"
                />
                <input
                  type="color"
                  value={gradient.endColor || '#0f172a'}
                  onChange={(e) => updateGradient({ endColor: e.target.value })}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input"
                  title="End Color"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-xs font-medium">Subtitle & Paragraph Text</Label>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (gradient.textColors?.secondary === 'var(--color-salmon)' || gradient.textColors?.secondary === 'hsl(16, 100%, 73%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
                  onClick={() => updateTextColor('secondary', 'var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (gradient.textColors?.secondary === 'var(--color-cyan)' || gradient.textColors?.secondary === 'hsl(180, 100%, 50%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
                  onClick={() => updateTextColor('secondary', 'var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={gradient.textColors?.secondary?.startsWith('var(') ? '#e2e8f0' : (gradient.textColors?.secondary || '#e2e8f0')}
                  onChange={(e) => updateTextColor('secondary', e.target.value)}
                  className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
                  title="Custom Color Picker"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Direction + All Other Text */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {showDirection && (
              <div className="space-y-2">
                <Label className="text-white text-xs font-medium">Direction</Label>
                <Select 
                  value={gradient.direction} 
                  onValueChange={(value) => updateGradient({ direction: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
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
              <Label className="text-white text-xs font-medium">All Other Text</Label>
              <div className="flex gap-1">
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (gradient.textColors?.tertiary === 'var(--color-salmon)' || gradient.textColors?.tertiary === 'hsl(16, 100%, 73%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
                  onClick={() => updateTextColor('tertiary', 'var(--color-salmon)')}
                  title="Theme Primary Color (Salmon)"
                />
                <div
                  className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
                    (gradient.textColors?.tertiary === 'var(--color-cyan)' || gradient.textColors?.tertiary === 'hsl(180, 100%, 50%)') ? 'border-white' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
                  onClick={() => updateTextColor('tertiary', 'var(--color-cyan)')}
                  title="Theme Secondary Color (Cyan)"
                />
                <input
                  type="color"
                  value={gradient.textColors?.tertiary?.startsWith('var(') ? '#94a3b8' : (gradient.textColors?.tertiary || '#94a3b8')}
                  onChange={(e) => updateTextColor('tertiary', e.target.value)}
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
              className="w-full h-8 rounded border border-slate-600"
              style={previewStyle}
            />
          </div>

          {/* Color Controls - Compact 3-rectangle layout like portfolio settings */}
          <div className="flex gap-2">
            <input
              type="color"
              value={gradient.startColor || '#1e293b'}
              onChange={(e) => updateGradient({ startColor: e.target.value })}
              className="flex-1 h-8 rounded cursor-pointer custom-color-input"
              title="Start Color"
            />
            <input
              type="color"
              value={gradient.middleColor || '#334155'}
              onChange={(e) => updateGradient({ middleColor: e.target.value })}
              className="flex-1 h-8 rounded cursor-pointer custom-color-input"
              title="Middle Color"
            />
            <input
              type="color"
              value={gradient.endColor || '#0f172a'}
              onChange={(e) => updateGradient({ endColor: e.target.value })}
              className="flex-1 h-8 rounded cursor-pointer custom-color-input"
              title="End Color"
            />
          </div>

          {/* Direction Control - Compact */}
          {showDirection && (
            <div className="space-y-2">
              <Label className="text-white text-sm">Direction</Label>
              <Select 
                value={gradient.direction} 
                onValueChange={(value) => updateGradient({ direction: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
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
    </div>
  );
}