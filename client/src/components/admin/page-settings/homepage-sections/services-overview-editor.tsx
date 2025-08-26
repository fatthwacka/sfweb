import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, Type, Palette, Search, Eye, Camera, Video } from 'lucide-react';
import { DragDropImageUpload } from '../shared/drag-drop-image-upload';
import { ColorPicker } from '../shared/color-picker';
import { useSiteConfig } from '@/hooks/use-site-config';

interface ServicesOverviewEditorProps {
  onChange: (data: any) => void;
  onSave: () => void;
}

export function ServicesOverviewEditor({ onChange, onSave }: ServicesOverviewEditorProps) {
  const { config, updateConfig } = useSiteConfig();
  
  const [servicesSettings, setServicesSettings] = useState({
    // Main heading
    mainHeading: 'Capturing Life\'s Beautiful Moments',
    subtitle: 'From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence.',
    
    // Photography card
    photographyTitle: 'Photography',
    photographyDescription: 'Capture life\'s precious moments with our professional photography services. From weddings to corporate events, we create stunning visual narratives.',
    photographyImage: '/images/services/photography-service-showcase.jpg',
    photographyServices: ['Weddings', 'Portraits', 'Corporate', 'Events', 'Products', 'Graduation'],
    
    // Videography card  
    videographyTitle: 'Videography',
    videographyDescription: 'Bring your stories to life with cinematic videography. From wedding films to corporate content, we create compelling visual experiences.',
    videographyImage: '/images/services/videography-service-showcase.jpg',
    videographyServices: ['Wedding Films', 'Corporate Videos', 'Events', 'Product Videos', 'Social Media', 'Animation'],
    
    // Styling
    backgroundColor: 'bg-gradient-to-br from-indigo-900/40 via-background to-blue-900/30',
    photographyAccentColor: '#F97316', // salmon
    videographyAccentColor: '#06B6D4', // cyan
    
    // SEO
    sectionTitle: 'Our Services',
    seoDescription: 'Professional photography and videography services in Cape Town'
  });

  const handleImageUpload = async (type: 'photography' | 'videography', file: File) => {
    const assetKey = type === 'photography' ? 'services-photography' : 'services-videography';
    const filename = type === 'photography' ? 
      'services/photography-service-showcase.jpg' : 
      'services/videography-service-showcase.jpg';
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Create new asset endpoint for services if doesn't exist
      const response = await fetch(`/api/simple-assets/${assetKey}`, {
        method: 'POST', 
        body: formData
      });
      
      if (response.ok) {
        const timestamp = Date.now();
        const newImageUrl = `/images/${filename}?t=${timestamp}`;
        
        setServicesSettings(prev => ({
          ...prev,
          [`${type}Image`]: newImageUrl
        }));
        
        onChange({ [`${type}Image`]: newImageUrl });
      }
    } catch (error) {
      console.error(`${type} image upload failed:`, error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setServicesSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    onChange({ [key]: value });
  };

  const handleServiceListChange = (type: 'photography' | 'videography', services: string[]) => {
    const key = `${type}Services`;
    handleSettingChange(key, services);
  };

  const ServiceListEditor = ({ 
    type, 
    services, 
    color 
  }: { 
    type: 'photography' | 'videography'; 
    services: string[]; 
    color: string; 
  }) => {
    const [newService, setNewService] = useState('');
    
    const addService = () => {
      if (newService.trim()) {
        const updated = [...services, newService.trim()];
        handleServiceListChange(type, updated);
        setNewService('');
      }
    };
    
    const removeService = (index: number) => {
      const updated = services.filter((_, i) => i !== index);
      handleServiceListChange(type, updated);
    };
    
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {services.map((service, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-3 py-1 rounded-md border"
              style={{ 
                borderColor: color + '50',
                backgroundColor: color + '10',
                color: color
              }}
            >
              <span className="text-sm">• {service}</span>
              <button 
                onClick={() => removeService(index)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            placeholder={`Add ${type} service...`}
            className="bg-slate-800 border-slate-600 text-white"
            onKeyPress={(e) => e.key === 'Enter' && addService()}
          />
          <Button onClick={addService} size="sm">Add</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Preview */}
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-blue-800/10">
        <CardHeader>
          <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Services Section Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-indigo-900/20 via-slate-800/20 to-blue-900/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{servicesSettings.mainHeading}</h2>
              <p className="text-gray-300 text-sm">{servicesSettings.subtitle}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Photography Card Preview */}
              <div className="relative rounded-lg overflow-hidden h-24 bg-cover bg-center"
                   style={{ backgroundImage: `url(${servicesSettings.photographyImage})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2">
                  <h3 className="text-sm font-semibold" style={{ color: servicesSettings.photographyAccentColor }}>
                    {servicesSettings.photographyTitle}
                  </h3>
                </div>
              </div>
              
              {/* Videography Card Preview */}
              <div className="relative rounded-lg overflow-hidden h-24 bg-cover bg-center"
                   style={{ backgroundImage: `url(${servicesSettings.videographyImage})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2">
                  <h3 className="text-sm font-semibold" style={{ color: servicesSettings.videographyAccentColor }}>
                    {servicesSettings.videographyTitle}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="photography" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photography
          </TabsTrigger>
          <TabsTrigger value="videography" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Videography
          </TabsTrigger>
          <TabsTrigger value="styling" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Styling
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Section Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="main-heading" className="text-white">Main Heading</Label>
                <Input
                  id="main-heading"
                  value={servicesSettings.mainHeading}
                  onChange={(e) => handleSettingChange('mainHeading', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-white">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={servicesSettings.subtitle}
                  onChange={(e) => handleSettingChange('subtitle', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photography Tab */}
        <TabsContent value="photography" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photography Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DragDropImageUpload
                currentImage={servicesSettings.photographyImage}
                onUpload={(file) => handleImageUpload('photography', file)}
                label="Photography Showcase Image"
                description="Main image for photography services card"
                aspectRatio="4:3"
              />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Card Title</Label>
                  <Input
                    value={servicesSettings.photographyTitle}
                    onChange={(e) => handleSettingChange('photographyTitle', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={servicesSettings.photographyDescription}
                    onChange={(e) => handleSettingChange('photographyDescription', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Service List</Label>
                <ServiceListEditor 
                  type="photography"
                  services={servicesSettings.photographyServices}
                  color={servicesSettings.photographyAccentColor}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videography Tab */}
        <TabsContent value="videography" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="w-5 h-5" />
                Videography Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DragDropImageUpload
                currentImage={servicesSettings.videographyImage}
                onUpload={(file) => handleImageUpload('videography', file)}
                label="Videography Showcase Image"
                description="Main image for videography services card"
                aspectRatio="4:3"
              />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Card Title</Label>
                  <Input
                    value={servicesSettings.videographyTitle}
                    onChange={(e) => handleSettingChange('videographyTitle', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={servicesSettings.videographyDescription}
                    onChange={(e) => handleSettingChange('videographyDescription', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Service List</Label>
                <ServiceListEditor 
                  type="videography"
                  services={servicesSettings.videographyServices}
                  color={servicesSettings.videographyAccentColor}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styling Tab */}
        <TabsContent value="styling" className="space-y-4">
          <Card className="border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Color Scheme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Photography Accent</Label>
                  <ColorPicker
                    color={servicesSettings.photographyAccentColor}
                    onChange={(color) => handleSettingChange('photographyAccentColor', color)}
                    presets={['#F97316', '#EF4444', '#8B5CF6', '#10B981']}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Videography Accent</Label>
                  <ColorPicker
                    color={servicesSettings.videographyAccentColor}
                    onChange={(color) => handleSettingChange('videographyAccentColor', color)}
                    presets={['#06B6D4', '#3B82F6', '#8B5CF6', '#10B981']}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset Changes</Button>
        <Button onClick={onSave} className="bg-purple-600 hover:bg-purple-700">
          Save Services Section
        </Button>
      </div>
    </div>
  );
}