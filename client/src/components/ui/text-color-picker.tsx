import React from 'react';
import { Label } from '@/components/ui/label';

interface TextColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  sectionKey: string;
}

export function TextColorPicker({ label, value, onChange, sectionKey }: TextColorPickerProps) {
  // Actual color values for visual display
  const cssVariables = {
    primary: 'var(--color-salmon)',     // Variable for saving
    secondary: 'var(--color-cyan)'      // Variable for saving
  };

  // Actual colors for visual display in swatches
  const displayColors = {
    primary: 'hsl(16, 100%, 73%)',     // Salmon color
    secondary: 'hsl(180, 100%, 50%)'   // Cyan color
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-white">{label}</Label>
      <div className="flex gap-1">
        {/* CSS Primary Color Swatch */}
        <div
          className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
            value === cssVariables.primary || value === displayColors.primary ? 'border-white' : 'border-slate-500'
          }`}
          style={{ backgroundColor: displayColors.primary }}
          onClick={() => onChange(cssVariables.primary)}
          title="Theme Primary Color (Salmon)"
        />

        {/* CSS Secondary Color Swatch */}
        <div
          className={`flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2 ${
            value === cssVariables.secondary || value === displayColors.secondary ? 'border-white' : 'border-slate-500'
          }`}
          style={{ backgroundColor: displayColors.secondary }}
          onClick={() => onChange(cssVariables.secondary)}
          title="Theme Secondary Color (Cyan)"
        />

        {/* Custom HTML5 Color Picker */}
        <input
          type="color"
          value={value.startsWith('var(') ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 rounded cursor-pointer custom-color-input border-2 border-slate-500 hover:border-slate-400 transition-colors"
          title="Custom Color Picker"
        />
      </div>
    </div>
  );
}

interface TextColorsGroupProps {
  sectionKey: string;
  textColors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  onUpdateTextColor: (colorType: 'primary' | 'secondary' | 'tertiary', color: string) => void;
}

export function TextColorsGroup({ sectionKey, textColors, onUpdateTextColor }: TextColorsGroupProps) {
  return (
    <div className="space-y-4">
      <TextColorPicker
        label="Main Title Text"
        value={textColors.primary || '#ffffff'}
        onChange={(color) => onUpdateTextColor('primary', color)}
        sectionKey={sectionKey}
      />

      <TextColorPicker
        label="Subtitle & Paragraph Text"
        value={textColors.secondary || '#e2e8f0'}
        onChange={(color) => onUpdateTextColor('secondary', color)}
        sectionKey={sectionKey}
      />

      <TextColorPicker
        label="All Other Text"
        value={textColors.tertiary || '#94a3b8'}
        onChange={(color) => onUpdateTextColor('tertiary', color)}
        sectionKey={sectionKey}
      />
    </div>
  );
}