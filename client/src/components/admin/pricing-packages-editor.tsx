import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ChevronUp, ChevronDown, Star, AlertCircle, Check } from 'lucide-react';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { type PricingPackage, type PricingTier, defaultPricingTier } from '@shared/types/pricing';
import { useToast } from '@/hooks/use-toast';

interface PricingPackagesEditorProps {
  pageIdentifier: string;
  pageType: 'photography' | 'videography';
  category: string;
  onSave?: () => void;
}

export function PricingPackagesEditor({
  pageIdentifier,
  pageType,
  category,
  onSave
}: PricingPackagesEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingPackage, setPricingPackage] = useState<PricingPackage | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  // Function to convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Load pricing package data
  useEffect(() => {
    loadPricingPackage();
  }, [pageIdentifier]);

  const handleSave = useCallback(async () => {
    if (!pricingPackage) return;

    try {
      setSaving(true);

      // Clean the data before sending - remove null fields
      const cleanPackage = {
        ...pricingPackage,
        created_by: undefined,
        updated_by: undefined,
        created_at: undefined,
        updated_at: undefined,
        id: undefined
      };

      console.log('Saving pricing package:', cleanPackage);
      console.log('Tiers being saved:', cleanPackage.tiers);

      const response = await fetch(`/api/pricing-packages/${pageIdentifier}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanPackage)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Silent save for auto-save, no toast

      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving pricing package:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing packages',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [pricingPackage, pageIdentifier, toast, onSave]);


  // Auto-save effect - triggers when pricingPackage changes
  useEffect(() => {
    if (!pricingPackage || !hasChanges) return;

    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000);

    setSaveTimeoutId(timeoutId);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pricingPackage, hasChanges, handleSave]);

  const loadPricingPackage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pricing-packages/${pageIdentifier}`);
      const result = await response.json();

      if (result.data && result.data.id) {
        // Load existing data from Supabase and ensure it has default tiers if empty
        const loadedPackage = result.data;

        // If no tiers exist, initialize with 3 default placeholder tiers
        if (!loadedPackage.tiers || loadedPackage.tiers.length === 0) {
          loadedPackage.tiers = [
            {
              title: 'Essential',
              price: 'R2,500',
              subtitle: '4 hours coverage',
              featured: false,
              featured_text: '',
              description: 'Perfect for smaller events and intimate gatherings',
              accent_color: '#ff6b6b', // Salmon for basic tier
              features: [
                'Professional photographer',
                'Up to 100 edited images',
                'Online gallery access',
                'Print release rights',
                '2-hour photo delivery'
              ]
            },
            {
              title: 'Premium',
              price: 'R4,500',
              subtitle: '6 hours coverage',
              featured: true,
              featured_text: 'Most Popular',
              description: 'Our most popular package with extended coverage',
              accent_color: '#4ecdc4', // Cyan for premium tier
              features: [
                'Professional photographer',
                'Up to 200 edited images',
                'Online gallery access',
                'Print release rights',
                '24-hour photo delivery',
                'Second photographer',
                'Engagement shoot included'
              ]
            },
            {
              title: 'Luxury',
              price: 'R7,500',
              subtitle: 'Full day coverage',
              featured: false,
              featured_text: '',
              description: 'Complete premium service for your special day',
              accent_color: '#a855f7', // Purple for luxury tier
              features: [
                'Lead + assistant photographer',
                'Up to 400 edited images',
                'Online gallery access',
                'Print release rights',
                'Same-day highlights reel',
                'Premium album included',
                'Engagement shoot included',
                'Drone photography'
              ]
            }
          ];
        }

        setPricingPackage(loadedPackage);
      } else {
        // Initialize with default package with 3 sample tiers
        const defaultPackage: PricingPackage = {
          page_identifier: pageIdentifier,
          page_type: pageType,
          category: category,
          section_colors: {},
          tiers: [
            {
              title: 'Essential',
              price: 'R2,500',
              subtitle: '4 hours coverage',
              featured: false,
              featured_text: '',
              description: 'Perfect for smaller events and intimate gatherings',
              accent_color: '#ff6b6b', // Salmon for basic tier
              features: [
                'Professional photographer',
                'Up to 100 edited images',
                'Online gallery access',
                'Print release rights',
                '2-hour photo delivery'
              ]
            },
            {
              title: 'Premium',
              price: 'R4,500',
              subtitle: '6 hours coverage',
              featured: true,
              featured_text: 'Most Popular',
              description: 'Our most popular package with extended coverage',
              accent_color: '#4ecdc4', // Cyan for premium tier
              features: [
                'Professional photographer',
                'Up to 200 edited images',
                'Online gallery access',
                'Print release rights',
                '24-hour photo delivery',
                'Second photographer',
                'Engagement shoot included'
              ]
            },
            {
              title: 'Luxury',
              price: 'R7,500',
              subtitle: 'Full day coverage',
              featured: false,
              featured_text: '',
              description: 'Complete premium service for your special day',
              accent_color: '#a855f7', // Purple for luxury tier
              features: [
                'Lead + assistant photographer',
                'Up to 400 edited images',
                'Online gallery access',
                'Print release rights',
                'Same-day highlights reel',
                'Premium album included',
                'Engagement shoot included',
                'Drone photography'
              ]
            }
          ]
        };
        setPricingPackage(defaultPackage);
        // Save the default to Supabase
        await fetch(`/api/pricing-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultPackage)
        });
      }
    } catch (error) {
      console.error('Error loading pricing package:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing packages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };


  const updateTier = (index: number, updates: Partial<PricingTier>) => {
    if (!pricingPackage) return;

    const newTiers = [...pricingPackage.tiers];
    newTiers[index] = { ...newTiers[index], ...updates };

    setPricingPackage({ ...pricingPackage, tiers: newTiers });
    setHasChanges(true);
  };

  const addTier = () => {
    if (!pricingPackage) return;
    if (pricingPackage.tiers.length >= 4) {
      toast({
        title: 'Maximum tiers reached',
        description: 'You can only have up to 4 pricing tiers',
        variant: 'destructive'
      });
      return;
    }

    setPricingPackage({
      ...pricingPackage,
      tiers: [...pricingPackage.tiers, { ...defaultPricingTier }]
    });
    setHasChanges(true);
  };

  const removeTier = (index: number) => {
    if (!pricingPackage) return;

    const newTiers = pricingPackage.tiers.filter((_, i) => i !== index);
    setPricingPackage({ ...pricingPackage, tiers: newTiers });
    setHasChanges(true);
  };

  const moveTier = (index: number, direction: 'up' | 'down') => {
    if (!pricingPackage) return;

    const newTiers = [...pricingPackage.tiers];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newTiers.length) return;

    [newTiers[index], newTiers[newIndex]] = [newTiers[newIndex], newTiers[index]];

    setPricingPackage({ ...pricingPackage, tiers: newTiers });
    setHasChanges(true);
  };

  // Features are now handled inline in the component for better UX

  // Section colors are now handled by the standard GradientPicker component
  // which saves directly to the gradient system

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading pricing packages...</p>
        </div>
      </div>
    );
  }

  if (!pricingPackage) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load pricing packages</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Packages Section Colors</CardTitle>
          <CardDescription>
            Manage section colors for your pricing packages display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GradientPicker
            sectionKey={`${pageType}-${category.replace('s', '')}-packages`}
            label="Packages Section Colors"
            showDirection={true}
            showTextColors={true}
          />
        </CardContent>
      </Card>


      {/* Pricing Tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pricing Tiers</CardTitle>
              <CardDescription>
                Manage up to 4 pricing tiers with features
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {saving && (
                <div className="flex items-center text-blue-400 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  Auto-saving...
                </div>
              )}
              {hasChanges && !saving && (
                <div className="flex items-center text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unsaved changes
                </div>
              )}
              {!hasChanges && !saving && (
                <div className="flex items-center text-green-400 text-sm">
                  <Check className="w-4 h-4 mr-1" />
                  All changes saved
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!pricingPackage ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Loading pricing data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 3-Column Grid Layout for Tiers */}
              <div className={`grid gap-6 ${
                pricingPackage.tiers.length <= 3
                  ? 'lg:grid-cols-3 md:grid-cols-2 grid-cols-1'
                  : 'lg:grid-cols-3 md:grid-cols-2 grid-cols-1'
              }`}>
                {pricingPackage.tiers.map((tier, tierIndex) => (
                  <div
                    key={tierIndex}
                    className="relative rounded-2xl p-6 border border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/70"
                  >
                    {/* Tier Controls */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => moveTier(tierIndex, 'up')}
                        disabled={tierIndex === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => moveTier(tierIndex, 'down')}
                        disabled={tierIndex === pricingPackage.tiers.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeTier(tierIndex)}
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>

                    {/* Featured Badge Preview */}
                    {tier.featured && tier.featured_text && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          {tier.featured_text}
                        </span>
                      </div>
                    )}

                    {/* Tier Header Section */}
                    <div className="text-center mb-6 pt-2">
                      <Input
                        value={tier.title}
                        onChange={(e) => {
                          updateTier(tierIndex, { title: e.target.value });
                          setHasChanges(true);
                        }}
                        placeholder="Package Title"
                        className="text-center text-2xl font-bold mb-4 bg-transparent border-0 border-b-2 rounded-none focus:ring-0 pb-2"
                      />
                      <div className="mb-3">
                        <Input
                          value={tier.price}
                          onChange={(e) => {
                            updateTier(tierIndex, { price: e.target.value });
                            setHasChanges(true);
                          }}
                          placeholder="R2,500"
                          className="text-center text-4xl font-bold bg-transparent border-0 border-b-2 rounded-none focus:ring-0 pb-2"
                        />
                      </div>
                      <Input
                        value={tier.subtitle || ''}
                        onChange={(e) => {
                          updateTier(tierIndex, { subtitle: e.target.value });
                          setHasChanges(true);
                        }}
                        placeholder="e.g., 2 hours coverage"
                        className="text-center text-sm bg-transparent border-0 border-b rounded-none focus:ring-0 pb-2"
                      />
                    </div>

                    {/* Featured Toggle */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Switch
                        checked={tier.featured || false}
                        onCheckedChange={(checked) => updateTier(tierIndex, { featured: checked })}
                        className="scale-90"
                      />
                      <Label className="text-xs">Featured</Label>
                      {tier.featured && (
                        <Input
                          value={tier.featured_text || ''}
                          onChange={(e) => {
                            updateTier(tierIndex, { featured_text: e.target.value });
                            setHasChanges(true);
                          }}
                          placeholder="Badge text"
                          className="ml-2 text-xs h-7 w-24"
                        />
                      )}
                    </div>

                    {/* Description */}
                    <Textarea
                      value={tier.description || ''}
                      onChange={(e) => {
                        updateTier(tierIndex, { description: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="Brief description"
                      rows={2}
                      className="mb-4 text-sm resize-none"
                    />

                    {/* Features List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-medium">Package Features</Label>
                        <span className="text-xs text-muted-foreground">10 features max</span>
                      </div>
                      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                        {Array.from({ length: 10 }, (_, featureIndex) => {
                          const feature = tier.features?.[featureIndex] || '';
                          const isEmpty = !feature || feature.trim() === '';

                          return (
                            <div key={featureIndex} className="flex items-center group relative">
                              {/* Left icon - fixed width */}
                              <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all mr-3 ${
                                isEmpty
                                  ? 'bg-slate-600/30 border border-slate-600/50'
                                  : 'bg-green-500 border-0'
                              }`}>
                                {!isEmpty && <Check className="h-2.5 w-2.5 text-white" />}
                                {isEmpty && <span className="text-xs text-slate-500">{featureIndex + 1}</span>}
                              </div>

                              {/* Input field - fills available space */}
                              <Input
                                value={feature}
                                onChange={(e) => {
                                  const newFeatures = [...(tier.features || [])];
                                  while (newFeatures.length <= featureIndex) {
                                    newFeatures.push('');
                                  }
                                  newFeatures[featureIndex] = e.target.value;
                                  while (newFeatures.length > 0 && newFeatures[newFeatures.length - 1] === '') {
                                    newFeatures.pop();
                                  }
                                  updateTier(tierIndex, { features: newFeatures });
                                  setHasChanges(true);
                                }}
                                placeholder={`Feature ${featureIndex + 1}${featureIndex < 5 ? ' (core feature)' : ' (bonus feature)'}`}
                                className={`text-xs h-8 transition-all ${
                                  isEmpty
                                    ? 'bg-slate-800/30 border-slate-700/50 text-slate-400 placeholder:text-slate-500'
                                    : 'bg-slate-800/60 border-slate-600 text-slate-200'
                                } hover:border-cyan-400/50 focus:border-cyan-400 focus:bg-slate-800/80`}
                                style={{ marginRight: '40px' }}
                              />

                              {/* Right delete button - fixed position */}
                              {!isEmpty && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 absolute right-0 top-1/2 transform -translate-y-1/2 mr-1"
                                  onClick={() => {
                                    const newFeatures = [...(tier.features || [])];
                                    newFeatures[featureIndex] = '';
                                    while (newFeatures.length > 0 && newFeatures[newFeatures.length - 1] === '') {
                                      newFeatures.pop();
                                    }
                                    updateTier(tierIndex, { features: newFeatures });
                                    setHasChanges(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Card Accent Color Picker */}
                      <div className="mt-4 pt-3 border-t">
                        <div className="mb-3">
                          <Label className="text-xs font-medium mb-2 block">Card Color</Label>
                          <div className="relative">
                            <input
                              type="color"
                              value={tier.accent_color || '#a855f7'}
                              onChange={(e) => {
                                console.log('Setting accent color:', e.target.value, 'for tier:', tierIndex);
                                updateTier(tierIndex, { accent_color: e.target.value });
                                setHasChanges(true);
                              }}
                              className="w-full h-10 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-400 transition-all"
                              title="Choose card accent color"
                            />
                          </div>
                        </div>
                        
                        {/* Simple CTA Button Preview */}
                        <Button
                          className="w-full text-white font-semibold py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700"
                          disabled
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Tier Button */}
              {pricingPackage.tiers.length < 4 && (
                <div className="flex justify-center">
                  <Button
                    onClick={addTier}
                    variant="outline"
                    className="w-full max-w-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pricing Tier ({pricingPackage.tiers.length}/4)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}