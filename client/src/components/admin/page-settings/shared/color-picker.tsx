import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presets?: string[];
  allowTransparency?: boolean;
  className?: string;
}

export function ColorPicker({ 
  color, 
  onChange, 
  presets = [], 
  allowTransparency = false,
  className = ""
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);

  const handlePresetClick = (presetColor: string) => {
    onChange(presetColor);
    setCustomColor(presetColor);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handleCustomColorSubmit = () => {
    onChange(customColor);
    setIsOpen(false);
  };

  const getDisplayColor = () => {
    if (color.startsWith('rgba') || color.startsWith('hsla')) {
      return color;
    }
    return color;
  };

  const defaultPresets = [
    '#F97316', // Salmon/Orange
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#10B981', // Green
    '#3B82F6', // Blue
    '#06B6D4', // Cyan
    '#F59E0B', // Yellow
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#000000', // Black
    '#FFFFFF', // White
  ];

  const transparencyPresets = allowTransparency ? [
    'rgba(0,0,0,0.1)',
    'rgba(0,0,0,0.3)', 
    'rgba(0,0,0,0.5)',
    'rgba(0,0,0,0.7)',
    'rgba(255,255,255,0.1)',
    'rgba(255,255,255,0.3)',
    'rgba(255,255,255,0.5)',
    'rgba(255,255,255,0.7)',
  ] : [];

  const allPresets = [...(presets.length > 0 ? presets : defaultPresets), ...transparencyPresets];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full h-10 p-2 border-slate-600 bg-slate-800 hover:bg-slate-700 ${className}`}
        >
          <div className="flex items-center gap-3 w-full">
            <div 
              className="w-6 h-6 rounded-md border border-slate-500 flex-shrink-0"
              style={{ backgroundColor: getDisplayColor() }}
            />
            <span className="text-white text-sm font-mono flex-1 text-left">
              {color}
            </span>
            <Palette className="w-4 h-4 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4 bg-slate-800 border-slate-600" align="start">
        <div className="space-y-4">
          {/* Preset Colors */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Color Presets</h4>
            <div className="grid grid-cols-6 gap-2">
              {allPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                    preset === color ? 'border-purple-400 shadow-md' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Custom Color</h4>
            <div className="flex gap-2">
              <Input
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder={allowTransparency ? "e.g., #FF5733 or rgba(255,87,51,0.5)" : "e.g., #FF5733"}
                className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
              />
              <Button
                onClick={handleCustomColorSubmit}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Color Format Examples */}
          {allowTransparency && (
            <div className="text-xs text-gray-400 space-y-1">
              <div className="font-semibold">Supported formats:</div>
              <div>• Hex: #FF5733</div>
              <div>• RGB: rgb(255, 87, 51)</div>
              <div>• RGBA: rgba(255, 87, 51, 0.5)</div>
              <div>• HSL: hsl(9, 100%, 60%)</div>
            </div>
          )}
          
          {/* Current Color Preview */}
          <div className="border-t border-slate-600 pt-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-8 rounded-md border border-slate-500"
                style={{ backgroundColor: getDisplayColor() }}
              />
              <div className="flex-1">
                <div className="text-xs text-gray-400">Current Color</div>
                <div className="text-sm text-white font-mono">{color}</div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}