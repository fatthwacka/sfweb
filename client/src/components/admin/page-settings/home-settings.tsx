import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Image, 
  Users,
  Star,
  Briefcase,
  Video,
  Camera,
  Save,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { useSiteConfig } from '@/hooks/use-site-config';
import { toast } from '@/hooks/use-toast';

interface TestimonialItem {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
}

export function HomeSettings() {
  const { config, updateConfigBulk } = useSiteConfig();
  const [hasChanges, setHasChanges] = useState(false);
  
  const [homeData, setHomeData] = useState({
    // Hero section
    heroBackgroundImage: config?.home?.hero?.backgroundImage || '/images/hero/homepage-main-hero.jpg',
    heroCtaButtonText: config?.home?.hero?.ctaButtonText || 'Book Your Session',
    
    // Services Overview
    servicesHeadline: config?.home?.servicesOverview?.headline || 'Capturing Life\'s Beautiful Moments',
    servicesDescription: config?.home?.servicesOverview?.description || 'From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence.',
    
    // Photography section
    photographyTitle: config?.home?.servicesOverview?.photography?.title || 'Photography',
    photographyDescription: config?.home?.servicesOverview?.photography?.description || 'Capture life\'s precious moments with our professional photography services. From weddings to corporate events, we create stunning visual narratives.',
    photographyImage: config?.home?.servicesOverview?.photography?.image || '/images/services/photography-service-showcase.jpg',
    photographyServices: config?.home?.servicesOverview?.photography?.services?.join(', ') || 'Weddings, Portraits, Corporate, Events, Products, Graduation',
    photographyCtaText: config?.home?.servicesOverview?.photography?.ctaText || 'Explore Photography',
    
    // Videography section
    videographyTitle: config?.home?.servicesOverview?.videography?.title || 'Videography',
    videographyDescription: config?.home?.servicesOverview?.videography?.description || 'Bring your stories to life with cinematic videography. From wedding films to corporate content, we create compelling visual experiences.',
    videographyImage: config?.home?.servicesOverview?.videography?.image || '/images/services/photography-service-showcase.jpg',
    videographyServices: config?.home?.servicesOverview?.videography?.services?.join(', ') || 'Wedding Films, Corporate Videos, Events, Product Videos, Social Media, Animation',
    videographyCtaText: config?.home?.servicesOverview?.videography?.ctaText || 'Explore Videography',
    
    // Testimonials
    testimonialsHeadline: config?.home?.testimonials?.headline || 'What Our Clients Say',
    testimonialsDescription: config?.home?.testimonials?.description || 'Don\'t just take our word for it. Here\'s what our clients have to say about their experience with SlyFox Studios.',
  });

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    config?.home?.testimonials?.items || [
      {
        id: 1,
        name: 'Sarah Mitchell',
        role: 'Wedding Client',
        image: '/images/testimonials/client-sarah-jones.jpg',
        quote: 'SlyFox Studios made our wedding day absolutely magical. The attention to detail and artistic vision exceeded all our expectations. Our photos are truly works of art.',
        rating: 5
      },
      {
        id: 2,
        name: 'Michael Thompson',
        role: 'Corporate Client', 
        image: '/images/testimonials/client-mike-johnson.jpg',
        quote: 'Professional, creative, and incredibly talented. The corporate headshots they took for our team elevated our brand image significantly. Highly recommended!',
        rating: 5
      },
      {
        id: 3,
        name: 'Emma Rodriguez',
        role: 'Family Portrait Client',
        image: '/images/testimonials/client-emma-davis.jpg',
        quote: 'The family portrait session was comfortable and fun. They captured our personalities perfectly, and the online gallery made sharing with relatives so easy.',
        rating: 5
      }
    ]
  );

  // Update local state when API config loads
  useEffect(() => {
    if (config?.home) {
      console.log('🔄 HomeSettings: Updating state with API config:', config.home.servicesOverview?.headline);
      setHomeData({
        // Hero section
        heroBackgroundImage: config.home.hero?.backgroundImage || '/images/hero/homepage-main-hero.jpg',
        heroCtaButtonText: config.home.hero?.ctaButtonText || 'Book Your Session',
        
        // Services Overview
        servicesHeadline: config.home.servicesOverview?.headline || 'Capturing Life\'s Beautiful Moments',
        servicesDescription: config.home.servicesOverview?.description || 'From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence.',
        
        // Photography section
        photographyTitle: config.home.servicesOverview?.photography?.title || 'Photography',
        photographyDescription: config.home.servicesOverview?.photography?.description || 'Capture life\'s precious moments with our professional photography services. From weddings to corporate events, we create stunning visual narratives.',
        photographyImage: config.home.servicesOverview?.photography?.image || '/images/services/photography-service-showcase.jpg',
        photographyServices: config.home.servicesOverview?.photography?.services?.join(', ') || 'Weddings, Portraits, Corporate, Events, Products, Graduation',
        photographyCtaText: config.home.servicesOverview?.photography?.ctaText || 'Explore Photography',
        
        // Videography section
        videographyTitle: config.home.servicesOverview?.videography?.title || 'Videography',
        videographyDescription: config.home.servicesOverview?.videography?.description || 'Bring your stories to life with cinematic videography. From wedding films to corporate content, we create compelling visual experiences.',
        videographyImage: config.home.servicesOverview?.videography?.image || '/images/services/photography-service-showcase.jpg',
        videographyServices: config.home.servicesOverview?.videography?.services?.join(', ') || 'Wedding Films, Corporate Videos, Events, Product Videos, Social Media, Animation',
        videographyCtaText: config.home.servicesOverview?.videography?.ctaText || 'Explore Videography',
        
        // Testimonials
        testimonialsHeadline: config.home.testimonials?.headline || 'What Our Clients Say',
        testimonialsDescription: config.home.testimonials?.description || 'Don\'t just take our word for it. Here\'s what our clients have to say about their experience with SlyFox Studios.',
      });

      if (config.home.testimonials?.items) {
        setTestimonials(config.home.testimonials.items);
      }
    }
  }, [config]);

  const handleInputChange = (field: string, value: string) => {
    setHomeData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleTestimonialChange = (id: number, field: keyof TestimonialItem, value: string | number) => {
    setTestimonials(prev => prev.map(testimonial => 
      testimonial.id === id ? { ...testimonial, [field]: value } : testimonial
    ));
    setHasChanges(true);
  };

  const addTestimonial = () => {
    const newId = Math.max(...testimonials.map(t => t.id)) + 1;
    setTestimonials(prev => [...prev, {
      id: newId,
      name: '',
      role: '',
      image: '/images/testimonials/default-client.jpg',
      quote: '',
      rating: 5
    }]);
    setHasChanges(true);
  };

  const removeTestimonial = (id: number) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateConfigBulk({
        home: {
          hero: {
            backgroundImage: homeData.heroBackgroundImage,
            ctaButtonText: homeData.heroCtaButtonText
          },
          servicesOverview: {
            headline: homeData.servicesHeadline,
            description: homeData.servicesDescription,
            photography: {
              title: homeData.photographyTitle,
              description: homeData.photographyDescription,
              image: homeData.photographyImage,
              services: homeData.photographyServices.split(',').map(s => s.trim()),
              ctaText: homeData.photographyCtaText
            },
            videography: {
              title: homeData.videographyTitle,
              description: homeData.videographyDescription,
              image: homeData.videographyImage,
              services: homeData.videographyServices.split(',').map(s => s.trim()),
              ctaText: homeData.videographyCtaText
            }
          },
          testimonials: {
            headline: homeData.testimonialsHeadline,
            description: homeData.testimonialsDescription,
            items: testimonials
          }
        }
      });

      setHasChanges(false);
      toast({
        title: "Home Page Settings Saved",
        description: "Your home page settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save home settings:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your home page settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Home className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Home Page Settings</h2>
            <p className="text-gray-400">Customize your home page content and layout</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {hasChanges && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Image className="w-5 h-5" />
                Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-background" className="text-white">Background Image URL</Label>
                <Input
                  id="hero-background"
                  value={homeData.heroBackgroundImage}
                  onChange={(e) => handleInputChange('heroBackgroundImage', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="/images/hero/homepage-main-hero.jpg"
                />
                <p className="text-sm text-gray-400">Path to the hero section background image</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-cta" className="text-white">Call-to-Action Button Text</Label>
                <Input
                  id="hero-cta"
                  value={homeData.heroCtaButtonText}
                  onChange={(e) => handleInputChange('heroCtaButtonText', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Book Your Session"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Section Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Services Overview Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="services-headline" className="text-white">Section Headline</Label>
                <Input
                  id="services-headline"
                  value={homeData.servicesHeadline}
                  onChange={(e) => handleInputChange('servicesHeadline', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="services-description" className="text-white">Section Description</Label>
                <Textarea
                  id="services-description"
                  rows={3}
                  value={homeData.servicesDescription}
                  onChange={(e) => handleInputChange('servicesDescription', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photography Section */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photography Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photo-title" className="text-white">Title</Label>
                  <Input
                    id="photo-title"
                    value={homeData.photographyTitle}
                    onChange={(e) => handleInputChange('photographyTitle', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo-cta" className="text-white">Call-to-Action Text</Label>
                  <Input
                    id="photo-cta"
                    value={homeData.photographyCtaText}
                    onChange={(e) => handleInputChange('photographyCtaText', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo-description" className="text-white">Description</Label>
                <Textarea
                  id="photo-description"
                  rows={3}
                  value={homeData.photographyDescription}
                  onChange={(e) => handleInputChange('photographyDescription', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo-image" className="text-white">Image URL</Label>
                <Input
                  id="photo-image"
                  value={homeData.photographyImage}
                  onChange={(e) => handleInputChange('photographyImage', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo-services" className="text-white">Services (comma-separated)</Label>
                <Input
                  id="photo-services"
                  value={homeData.photographyServices}
                  onChange={(e) => handleInputChange('photographyServices', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Weddings, Portraits, Corporate, Events"
                />
              </div>
            </CardContent>
          </Card>

          {/* Videography Section */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="w-5 h-5" />
                Videography Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video-title" className="text-white">Title</Label>
                  <Input
                    id="video-title"
                    value={homeData.videographyTitle}
                    onChange={(e) => handleInputChange('videographyTitle', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-cta" className="text-white">Call-to-Action Text</Label>
                  <Input
                    id="video-cta"
                    value={homeData.videographyCtaText}
                    onChange={(e) => handleInputChange('videographyCtaText', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="video-description" className="text-white">Description</Label>
                <Textarea
                  id="video-description"
                  rows={3}
                  value={homeData.videographyDescription}
                  onChange={(e) => handleInputChange('videographyDescription', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="video-image" className="text-white">Image URL</Label>
                <Input
                  id="video-image"
                  value={homeData.videographyImage}
                  onChange={(e) => handleInputChange('videographyImage', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="video-services" className="text-white">Services (comma-separated)</Label>
                <Input
                  id="video-services"
                  value={homeData.videographyServices}
                  onChange={(e) => handleInputChange('videographyServices', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Wedding Films, Corporate Videos, Events"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-5 h-5" />
                Testimonials Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testimonials-headline" className="text-white">Section Headline</Label>
                <Input
                  id="testimonials-headline"
                  value={homeData.testimonialsHeadline}
                  onChange={(e) => handleInputChange('testimonialsHeadline', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="testimonials-description" className="text-white">Section Description</Label>
                <Textarea
                  id="testimonials-description"
                  rows={3}
                  value={homeData.testimonialsDescription}
                  onChange={(e) => handleInputChange('testimonialsDescription', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Individual Testimonials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Testimonials</h3>
              <Button 
                onClick={addTestimonial}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Testimonial
              </Button>
            </div>

            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.id} className="border-slate-700 bg-slate-800/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Testimonial #{index + 1}</CardTitle>
                    <Button 
                      onClick={() => removeTestimonial(testimonial.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Client Name</Label>
                      <Input
                        value={testimonial.name}
                        onChange={(e) => handleTestimonialChange(testimonial.id, 'name', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Sarah Mitchell"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Client Role</Label>
                      <Input
                        value={testimonial.role}
                        onChange={(e) => handleTestimonialChange(testimonial.id, 'role', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Wedding Client"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Image URL</Label>
                    <Input
                      value={testimonial.image}
                      onChange={(e) => handleTestimonialChange(testimonial.id, 'image', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="/images/testimonials/client-photo.jpg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Testimonial Quote</Label>
                    <Textarea
                      rows={3}
                      value={testimonial.quote}
                      onChange={(e) => handleTestimonialChange(testimonial.id, 'quote', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Write the client's testimonial here..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Rating (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={testimonial.rating}
                      onChange={(e) => handleTestimonialChange(testimonial.id, 'rating', parseInt(e.target.value) || 5)}
                      className="bg-slate-700 border-slate-600 text-white w-24"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Advanced settings coming soon</p>
                <p className="text-sm">Additional home page customization options will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}