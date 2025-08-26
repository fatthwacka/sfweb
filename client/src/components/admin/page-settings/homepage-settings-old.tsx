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

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: [string, string];
}

interface HomepageSettingsProps {
  onSettingsChange?: (settings: any) => void;
}

export function HomepageSettings({ onSettingsChange }: HomepageSettingsProps) {
  const { config, updateConfigBulk } = useSiteConfig();
  const [hasChanges, setHasChanges] = useState(false);
  
  const [homeData, setHomeData] = useState({
    // Hero section
    heroBackgroundImage: config?.home?.hero?.backgroundImage || '/images/hero/homepage-main-hero.jpg',
    heroCtaButtonText: config?.home?.hero?.ctaButtonText || 'Book Your Session',
    heroAutoAdvance: config?.home?.hero?.autoAdvance ?? true,
    heroInterval: config?.home?.hero?.interval || 6000,
    
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

  // Hero slides state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(
    config?.home?.hero?.slides || [
      {
        id: "slide-1",
        image: "/images/hero/homepage-main-hero.jpg",
        title: "Capturing Life's Beautiful Moments",
        subtitle: "Professional Photography & Videography",
        cta: "Book Your Session",
        gradient: ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)"]
      },
      {
        id: "slide-2", 
        image: "/images/hero/wedding-photography-hero.jpg",
        title: "Your Love Story Awaits",
        subtitle: "Wedding Photography Specialists",
        cta: "View Wedding Gallery",
        gradient: ["rgba(139,69,19,0.6)", "rgba(255,20,147,0.4)"]
      },
      {
        id: "slide-3",
        image: "/images/hero/portrait-photography-hero.jpg", 
        title: "Professional Portraits",
        subtitle: "Corporate & Lifestyle Photography",
        cta: "Book Portrait Session",
        gradient: ["rgba(25,25,112,0.6)", "rgba(0,191,255,0.4)"]
      }
    ]
  );

  const [selectedEffect] = useState<string>(
    "liquid_dissolve" // Single amazing effect
  );

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

  // Hero slide management functions
  const addHeroSlide = () => {
    const newId = `slide-${heroSlides.length + 1}`;
    setHeroSlides(prev => [...prev, {
      id: newId,
      image: '/images/hero/default-hero.jpg',
      title: 'New Slide Title',
      subtitle: 'New Slide Subtitle',
      cta: 'Call to Action',
      gradient: ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)"]
    }]);
    setHasChanges(true);
  };

  const removeHeroSlide = (id: string) => {
    setHeroSlides(prev => prev.filter(slide => slide.id !== id));
    setHasChanges(true);
  };

  const updateHeroSlide = (id: string, field: keyof HeroSlide, value: any) => {
    setHeroSlides(prev => prev.map(slide => 
      slide.id === id ? { ...slide, [field]: value } : slide
    ));
    setHasChanges(true);
  };

  // Remove effect toggling since we only have one effect

  const handleSave = async () => {
    try {
      await updateConfigBulk({
        home: {
          hero: {
            backgroundImage: homeData.heroBackgroundImage,
            ctaButtonText: homeData.heroCtaButtonText,
            slides: heroSlides,
            autoAdvance: homeData.heroAutoAdvance,
            interval: homeData.heroInterval,
            effects: [selectedEffect]
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
            Hero Slider
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
                Hero Slider Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slider Settings */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Auto Advance</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-advance"
                        checked={homeData.heroAutoAdvance}
                        onChange={(e) => handleInputChange('heroAutoAdvance', e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      <label htmlFor="auto-advance" className="text-sm text-gray-300">
                        Automatically advance slides
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-interval" className="text-white">Slide Interval (ms)</Label>
                    <Input
                      id="hero-interval"
                      type="number"
                      value={homeData.heroInterval}
                      onChange={(e) => handleInputChange('heroInterval', parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="6000"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-600" />

              {/* Transition Effect Info */}
              <div className="space-y-3">
                <Label className="text-white">Transition Effect</Label>
                <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 animate-pulse"></div>
                    <span className="text-white font-medium">Liquid Dissolve</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Advanced fluid particle system with wave distortion and dynamic color trails</p>
                </div>
              </div>

              <Separator className="bg-slate-600" />

              {/* Slides Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Hero Slides</Label>
                  <Button 
                    onClick={addHeroSlide}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slide
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {heroSlides.map((slide, index) => (
                    <Card key={slide.id} className="border-slate-600 bg-slate-700/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm text-white">
                            Slide {index + 1}
                          </CardTitle>
                          {heroSlides.length > 1 && (
                            <Button
                              onClick={() => removeHeroSlide(slide.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-white text-xs">Image URL</Label>
                            <Input
                              value={slide.image}
                              onChange={(e) => updateHeroSlide(slide.id, 'image', e.target.value)}
                              className="bg-slate-600 border-slate-500 text-white text-sm"
                              placeholder="/images/hero/slide.jpg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white text-xs">Call to Action</Label>
                            <Input
                              value={slide.cta}
                              onChange={(e) => updateHeroSlide(slide.id, 'cta', e.target.value)}
                              className="bg-slate-600 border-slate-500 text-white text-sm"
                              placeholder="Book Your Session"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white text-xs">Title</Label>
                          <Input
                            value={slide.title}
                            onChange={(e) => updateHeroSlide(slide.id, 'title', e.target.value)}
                            className="bg-slate-600 border-slate-500 text-white text-sm"
                            placeholder="Slide Title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white text-xs">Subtitle</Label>
                          <Input
                            value={slide.subtitle}
                            onChange={(e) => updateHeroSlide(slide.id, 'subtitle', e.target.value)}
                            className="bg-slate-600 border-slate-500 text-white text-sm"
                            placeholder="Slide Subtitle"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-white text-xs">Gradient Start</Label>
                            <Input
                              value={slide.gradient[0]}
                              onChange={(e) => updateHeroSlide(slide.id, 'gradient', [e.target.value, slide.gradient[1]])}
                              className="bg-slate-600 border-slate-500 text-white text-xs"
                              placeholder="rgba(0,0,0,0.7)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white text-xs">Gradient End</Label>
                            <Input
                              value={slide.gradient[1]}
                              onChange={(e) => updateHeroSlide(slide.id, 'gradient', [slide.gradient[0], e.target.value])}
                              className="bg-slate-600 border-slate-500 text-white text-xs"
                              placeholder="rgba(0,0,0,0.3)"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Section Tab - truncated for brevity */}
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

