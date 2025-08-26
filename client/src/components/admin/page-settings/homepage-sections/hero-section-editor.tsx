import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, Type, Palette, Search, Eye } from 'lucide-react';
import { DragDropImageUpload } from '../shared/drag-drop-image-upload';
import { ColorPicker } from '../shared/color-picker';
import { useSiteConfig } from '@/hooks/use-site-config';

interface HeroSectionEditorProps {
  onChange: (data: any) => void;
  onSave: () => void;
}

export function HeroSectionEditor({ onChange, onSave }: HeroSectionEditorProps) {
  const { config, updateConfig } = useSiteConfig();
  const [previewMode, setPreviewMode] = useState(false);
  
  // Local state for hero settings
  const [heroSettings, setHeroSettings] = useState({
    // Image settings
    backgroundImage: config?.heroes?.home?.backgroundImage || '/images/hero/homepage-main-hero.jpg',
    overlayOpacity: config?.heroes?.home?.overlayOpacity || 0.6,
    
    // Content settings  
    ctaText: config?.heroes?.home?.ctaText || 'Book Your Session',
    ctaLink: config?.heroes?.home?.ctaLink || '/contact',
    
    // Styling
    ctaButtonColor: '#F97316', // salmon
    gradientColors: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)'],
    
    // SEO
    imageAlt: 'Professional photography services in Cape Town by SlyFox Studios',
    seoDescription: 'Book your photography session with Cape Town\'s premier studio',
    structuredData: {
      '@type': 'Service',
      'name': 'Professional Photography Services',
      'provider': 'SlyFox Studios'
    }
  });

  const handleImageUpload = async (file: File) => {
    // Use existing drag-drop system to replace homepage-main-hero.jpg
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/simple-assets/hero-main', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Update timestamp to force cache refresh
        const timestamp = Date.now();
        const newImageUrl = `/images/hero/homepage-main-hero.jpg?t=${timestamp}`;
        
        setHeroSettings(prev => ({
          ...prev,
          backgroundImage: newImageUrl
        }));
        
        onChange({ backgroundImage: newImageUrl });
      }
    } catch (error) {
      console.error('Hero image upload failed:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setHeroSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    onChange({ [key]: value });
  };

  const handleSave = async () => {
    try {
      // Update site config
      await updateConfig('heroes.home', heroSettings);
      onSave();
    } catch (error) {
      console.error('Failed to save hero settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Preview */}
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-blue-800/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mini hero preview */}
          <div 
            className="relative h-32 rounded-lg overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroSettings.backgroundImage})`
            } as React.CSSProperties}
          >
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${heroSettings.gradientColors.join(', ')})`,
                opacity: heroSettings.overlayOpacity
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                className="px-6 py-2 text-sm"
                style={{ backgroundColor: heroSettings.ctaButtonColor }}
              >
                {heroSettings.ctaText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="styling" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Styling
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Image Tab */}
        <TabsContent value="image" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Hero Background Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DragDropImageUpload
                currentImage={heroSettings.backgroundImage}
                onUpload={handleImageUpload}
                label="Homepage Hero Background"
                description="Drag and drop a new hero image. File will be renamed to 'homepage-main-hero.jpg'"
                aspectRatio="16:9"
                maxSize="5MB"
              />
              
              <div className="space-y-2">
                <Label className="text-white">Overlay Opacity</Label>
                <Slider
                  value={[heroSettings.overlayOpacity]}
                  onValueChange={([value]) => handleSettingChange('overlayOpacity', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-gray-400">
                  Current: {Math.round(heroSettings.overlayOpacity * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Call-to-Action Button</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cta-text" className="text-white">Button Text</Label>
                <Input
                  id="cta-text"
                  value={heroSettings.ctaText}
                  onChange={(e) => handleSettingChange('ctaText', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="e.g., Book Your Session"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cta-link" className="text-white">Button Link</Label>
                <Input
                  id="cta-link"
                  value={heroSettings.ctaLink}
                  onChange={(e) => handleSettingChange('ctaLink', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="e.g., /contact"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styling Tab */}
        <TabsContent value="styling" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Visual Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">CTA Button Color</Label>
                <ColorPicker
                  color={heroSettings.ctaButtonColor}
                  onChange={(color) => handleSettingChange('ctaButtonColor', color)}
                  presets={['#F97316', '#8B5CF6', '#EF4444', '#10B981', '#3B82F6']}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Gradient Overlay Colors</Label>
                <div className="grid grid-cols-3 gap-2">
                  {heroSettings.gradientColors.map((color, index) => (
                    <div key={index} className="space-y-1">
                      <Label className="text-xs text-gray-400">Stop {index + 1}</Label>
                      <ColorPicker
                        color={color}
                        onChange={(newColor) => {
                          const newColors = [...heroSettings.gradientColors];
                          newColors[index] = newColor;
                          handleSettingChange('gradientColors', newColors);
                        }}
                        allowTransparency
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">SEO & Accessibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-alt" className="text-white">Image Alt Text</Label>
                <Input
                  id="image-alt"
                  value={heroSettings.imageAlt}
                  onChange={(e) => handleSettingChange('imageAlt', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Describe the hero image for accessibility"
                />
                <div className="text-xs text-gray-500">
                  {heroSettings.imageAlt.length}/120 characters recommended
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seo-desc" className="text-white">Section Description</Label>
                <Input
                  id="seo-desc"
                  value={heroSettings.seoDescription}
                  onChange={(e) => handleSettingChange('seoDescription', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Brief description for search engines"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setHeroSettings(prev => ({ ...prev, ...(config?.heroes?.home || {}) }))}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
          Save Hero Section
        </Button>
      </div>
    </div>
  );
}