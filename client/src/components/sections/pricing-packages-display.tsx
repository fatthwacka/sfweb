import { Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { type PricingPackage, type PricingTier, normalizeFeatures, getFeatureDisplayText, isFeatureEnabled } from '@shared/types/pricing';
import { usePricingPackages, formatPrice, isTierHighlighted } from '@/hooks/use-pricing-packages';

interface PricingPackagesDisplayProps {
  pageIdentifier: string;
  title?: string;
  description?: string;
  ctaLink?: string;
  ctaText?: string;
  className?: string;
}

export function PricingPackagesDisplay({
  pageIdentifier,
  title = 'Our Packages',
  description,
  ctaLink = '/contact',
  ctaText = 'Get Started',
  className = ''
}: PricingPackagesDisplayProps) {
  const { data: pricingPackage, isLoading } = usePricingPackages(pageIdentifier);

  // Get fallback tiers for this page
  const fallbackTiers = defaultPricingTiers[pageIdentifier] || [];

  // Use real data if available, otherwise use fallback defaults
  const hasRealData = pricingPackage?.tiers && pricingPackage.tiers.length > 0;
  const tiers = hasRealData ? pricingPackage.tiers : fallbackTiers;
  const section_colors = hasRealData ? pricingPackage.section_colors : {};

  // No data at all - don't render
  if (tiers.length === 0) {
    return null;
  }

  // Apply section colors as CSS variables if provided
  const sectionStyle = section_colors ? {
    '--section-bg-gradient': section_colors.backgroundGradient,
    '--section-text-main': section_colors.mainTitle,
    '--section-text-subtitle': section_colors.subtitle,
    '--section-text-other': section_colors.allOther,
  } as React.CSSProperties : {};

  return (
    <div className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-90' : 'opacity-100'}`} style={sectionStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
            {title}
          </h2>
          {description && (
            <h3 className="text-xl max-w-3xl mx-auto">
              {description}
            </h3>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className={`pricing-cards-grid gap-6 ${
          tiers.length === 1 ? 'max-w-md mx-auto' :
          tiers.length === 2 ? 'max-w-2xl mx-auto grid-cols-1 md:grid-cols-2' :
          tiers.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {tiers.map((tier: PricingTier, index: number) => {
            const isHighlighted = isTierHighlighted(tier, index, tiers.length);

            // Convert hex accent color to HSL for CSS variables
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

            // Get accent color from tier data, fallback to purple
            const accentColor = tier.accent_color || '#a855f7';
            const hsl = hexToHsl(accentColor);

            // Set CSS variables for this specific card
            const cardStyle = {
              '--pricing-accent-hue': hsl.h.toString(),
              '--pricing-accent-sat': `${hsl.s}%`,
              '--pricing-accent-light': `${hsl.l}%`,
              '--pricing-accent': `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
              '--pricing-accent-dark': `hsl(${hsl.h - 5}, ${Math.round(hsl.s / 2)}%, 20%)`,
              '--pricing-accent-light': `hsl(${hsl.h + 8}, ${hsl.s + 15}%, 75%)`,
              '--pricing-border-color': `hsl(${hsl.h - 10}, ${hsl.s}%, ${hsl.l}%, 0.5)`,
              '--pricing-border-color-hover': `hsl(${hsl.h - 10}, ${hsl.s}%, ${hsl.l}%, 0.8)`
            } as React.CSSProperties;

            return (
              <div key={index} className="studio-card-accent relative" style={cardStyle}>
                {/* Featured Badge */}
                {tier.featured && tier.featured_text && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="studio-card-featured-badge">
                      <Star className="w-4 h-4 mr-1" />
                      {tier.featured_text}
                    </span>
                  </div>
                )}

                {/* Tier Header */}
                <div className="text-center mb-8">
                  <h3 className="studio-card-title-accent">
                    {tier.title}
                  </h3>
                  <div className="studio-card-price">{formatPrice(tier.price)}</div>
                  {tier.subtitle && (
                    <p className="studio-card-duration">{tier.subtitle}</p>
                  )}
                  {/* Temporarily commented out for experiment
                  {tier.description && (
                    <p className="text-muted-foreground mt-3 text-sm">
                      {tier.description}
                    </p>
                  )}
                  */}
                </div>

                {/* Features List */}
                <ul className="space-y-1 mb-8 mt-16">
                  {normalizeFeatures(tier.features).map((feature, featureIndex) => {
                    const enabled = isFeatureEnabled(feature);
                    const text = getFeatureDisplayText(feature);
                    return (
                      <li key={featureIndex} className="studio-card-feature">
                        {/* <CheckCircle2 className={`studio-card-feature-icon ${enabled ? 'enabled' : 'disabled'}`} /> */}
                        <div className={`studio-card-feature-circle ${enabled ? 'enabled' : 'disabled'}`} />
                        <span className={enabled ? '' : 'studio-card-feature-disabled'}>{text}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA Button */}
                <Link href={ctaLink}>
                  <button className="studio-card-button-accent">
                    {ctaText}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Default fallback pricing data - synced from Supabase (Dec 2025)
// These provide instant SEO-friendly content while real data loads
export const defaultPricingTiers: Record<string, PricingTier[]> = {
  'photography_weddings': [
    {
      title: 'Timeless',
      price: 'R8,500',
      subtitle: '4 hrs, 100 pics',
      featured: false,
      accent_color: '#d6ae1f',
      features: [
        { text: '20 Magazine-Grade Edits', enabled: true },
        { text: '80 Professional Edits', enabled: true },
        { text: 'Stunning Online Gallery', enabled: true },
        { text: 'USB with all images', enabled: true },
        { text: 'Add 2nd Photographer R3,500', enabled: false },
        { text: 'Add Videographer & Film R4,500', enabled: false },
        { text: 'Add Cinematic Film edit R2,500', enabled: false },
        { text: 'Add Drone footage R3,500', enabled: false },
        { text: 'add Gold leaf Wedding Album R3,500', enabled: false }
      ]
    },
    {
      title: 'Eternal',
      price: 'R12,500',
      subtitle: '8 hrs, 200 pics, video',
      featured: true,
      featured_text: 'Popular',
      accent_color: '#4deac3',
      features: [
        { text: '40 Magazine-Grade Edits', enabled: true },
        { text: '160 Professional Edits', enabled: true },
        { text: 'Stunning Online Gallery', enabled: true },
        { text: 'USB with all images & videos', enabled: true },
        { text: 'Videographer & Wedding Film', enabled: true },
        { text: 'Add Cinematic Film edit R2,500', enabled: false },
        { text: 'Add Drone footage R3,500', enabled: false },
        { text: 'add Gold leaf Wedding Album R3,500', enabled: false }
      ]
    },
    {
      title: 'Infinity',
      price: 'R24,500',
      subtitle: '12 hrs, 300 pics, video',
      featured: false,
      accent_color: '#ec3c82',
      features: [
        { text: '80 Magazine-Grade Edits', enabled: true },
        { text: '200+ Professional Edits', enabled: true },
        { text: 'Stunning Online Gallery', enabled: true },
        { text: 'USB with all images & videos', enabled: true },
        { text: 'Videographer & Wedding Film', enabled: true },
        { text: '2nd Photographer & Videographer included', enabled: true },
        { text: 'Cinematic Film edit included', enabled: true },
        { text: 'Drone footage included', enabled: true }
      ]
    }
  ],
  'photography_corporate': [
    {
      title: 'Axis',
      price: 'R2,500',
      subtitle: '1 hours',
      featured: false,
      accent_color: '#6bff6e',
      features: [
        { text: 'Professional photographer', enabled: true },
        { text: '20 Magazine-Grade Pro Edits', enabled: true },
        { text: '20 Professional Basic Edits', enabled: true },
        { text: 'On site & Travel included to 25km', enabled: true },
        { text: 'Stunning Online Gallery', enabled: true },
        { text: 'File Storage & Backup', enabled: true },
        { text: 'Print release rights', enabled: false }
      ]
    },
    {
      title: 'Summit',
      price: 'R5,500',
      subtitle: '4 hours',
      featured: true,
      featured_text: 'Most Popular',
      accent_color: '#4ccda2',
      features: [
        { text: 'Professional photographer', enabled: true },
        { text: '40 Magazine-Grade Pro Edits', enabled: true },
        { text: '40 Professional Basic Edits', enabled: true },
        { text: 'On site & Travel included to 25km', enabled: true },
        { text: 'Stunning Online Gallery', enabled: true },
        { text: 'File Storage & Backup', enabled: true }
      ]
    },
    {
      title: 'Pinnacle',
      price: 'R11,500',
      subtitle: 'up to 8 hours',
      featured: false,
      accent_color: '#f77555',
      features: [
        { text: 'Lead + assistant photographer', enabled: true },
        { text: '60 Magazine-Grade Pro Edits', enabled: true },
        { text: '60 Professional Basic Edits', enabled: true },
        { text: 'On site & Travel included to 25km', enabled: true },
        { text: 'Stunning Online Gallery', enabled: true },
        { text: 'File Storage & Backup', enabled: true },
        { text: 'Highlight Reel', enabled: true }
      ]
    }
  ],
  'photography_events': [
    {
      title: 'Kindling',
      price: 'R4,500',
      subtitle: '4 hours',
      featured: false,
      accent_color: '#c32c4b',
      features: [
        { text: 'Lead Photographer 4 hours', enabled: true },
        { text: 'Add Videographer (4hrs) R3,500', enabled: true },
        { text: 'Add Social Media Reels (5 pack) R3,500', enabled: true },
        { text: 'Add Live Image Editor (4hrs) R3,500', enabled: true },
        { text: 'Add Videographer (4hrs) R3,500', enabled: true },
        { text: 'Add 2nd Live Image Editor (8hrs) R3,500', enabled: false },
        { text: 'Add Cinematic Aftermovie', enabled: false }
      ]
    },
    {
      title: 'Sizzler',
      price: 'R9,500',
      subtitle: '8 hours',
      featured: true,
      featured_text: 'Most Popular',
      accent_color: '#d94126',
      features: [
        { text: 'Lead Photographer 8 hours', enabled: true },
        { text: 'Videographer included (8 hrs)', enabled: true },
        { text: 'Social Media Reels (5 pack) included', enabled: true },
        { text: 'Add Live Image Editor (8hrs) R5,500', enabled: false },
        { text: 'Add 2nd Photographer (8hrs) R5,500', enabled: true },
        { text: 'Add 2nd Live Image Editor (8hrs) R5,500', enabled: true },
        { text: 'Add Cinematic Aftermovie R3,500', enabled: true }
      ]
    },
    {
      title: 'Scorcher',
      price: 'R19,500',
      subtitle: '12 hours',
      featured: false,
      accent_color: '#e9931c',
      features: [
        { text: 'Lead Photographer (12 hrs)', enabled: true },
        { text: 'Videographer included (12 hrs)', enabled: true },
        { text: 'Social Media Reels (10 pack) included', enabled: true },
        { text: 'Live Image Editor included (12 hrs)', enabled: true },
        { text: '2nd Photographer included (12 hrs)', enabled: true },
        { text: '2nd Live Image Editor included (12 hrs)', enabled: true },
        { text: 'Cinematic Aftermovie included', enabled: true }
      ]
    }
  ],
  'photography_portraits': [
    {
      title: 'Vogue',
      price: 'R1,200',
      subtitle: '1 hour, 30 pics',
      featured: true,
      featured_text: 'Popular',
      accent_color: '#ee7e72',
      features: [
        { text: '20 Magazine-Grade Pro Edits', enabled: true },
        { text: '10 Professional Basic Edits', enabled: true },
        { text: '1 Hour Photographer', enabled: true },
        { text: 'Stunning Online gallery', enabled: true },
        { text: 'Free Image Storage & Backup', enabled: true }
      ]
    },
    {
      title: 'Muse',
      price: 'R2,200',
      subtitle: '2 hours, 60 pics',
      featured: false,
      featured_text: 'Most Popular',
      accent_color: '#6deee5',
      features: [
        { text: '30 Magazine-Grade Pro Edits', enabled: true },
        { text: '30 Professional Basic Edits', enabled: true },
        { text: '2 Hours Photographer', enabled: true },
        { text: 'Stunning Online gallery', enabled: true },
        { text: 'Free Image Storage & Backup', enabled: true }
      ]
    },
    {
      title: 'Halo',
      price: 'R3,200',
      subtitle: '3 hours, 90 pics',
      featured: false,
      accent_color: '#9951db',
      features: [
        { text: '40 Magazine-Grade Pro Edits', enabled: true },
        { text: '50 Professional Basic Edits', enabled: true },
        { text: '3 Hours Photographer', enabled: true },
        { text: 'Stunning Online gallery', enabled: true },
        { text: 'Free Image Storage & Backup', enabled: true }
      ]
    }
  ],
  'photography_graduation': [
    {
      title: 'Essential',
      price: 'R1,250',
      subtitle: '1 hours coverage',
      featured: false,
      accent_color: '#f07070',
      features: [
        { text: 'Professional lighting', enabled: true },
        { text: '20 magazine-grade image', enabled: true },
        { text: 'Online gallery access', enabled: true },
        { text: 'Print release rights', enabled: false }
      ]
    },
    {
      title: 'Premium',
      price: 'R2,500',
      subtitle: '2 hours coverage',
      featured: true,
      featured_text: 'Most Popular',
      accent_color: '#57dbd2',
      features: [
        { text: 'Professional lighting', enabled: true },
        { text: '40 magazine-grade image', enabled: true },
        { text: 'Online gallery access', enabled: true }
      ]
    },
    {
      title: 'Luxury',
      price: 'R3,500',
      subtitle: '3 hours coverage',
      featured: false,
      accent_color: '#a865e6',
      features: [
        { text: 'Professional lighting', enabled: true },
        { text: '60 magazine-grade image', enabled: true },
        { text: 'Online gallery access', enabled: true }
      ]
    }
  ],
  'photography_products': [
    {
      title: 'Startup',
      price: 'R500',
      subtitle: 'Ecommerce Images',
      featured: false,
      accent_color: '#55f767',
      features: [
        { text: 'Product on White Background', enabled: true },
        { text: 'Up to 10 Products', enabled: true },
        { text: 'File Storage & Backup', enabled: true },
        { text: 'Ultra High Resolution Images', enabled: true },
        { text: 'Magazine Grade Product Adverts', enabled: false },
        { text: 'Lifestyle shots with Models', enabled: false },
        { text: 'Add Product Hero Video R3,500', enabled: false }
      ]
    },
    {
      title: 'Executive',
      price: 'R4,500',
      subtitle: 'Advertisement Grade',
      featured: true,
      featured_text: 'Most Popular',
      accent_color: '#55f4f7',
      features: [
        { text: 'Product on White Background', enabled: true },
        { text: 'Product Hero on colourful Poster', enabled: true },
        { text: 'Up to 10 Products', enabled: true },
        { text: 'Magazine Grade Product Adverts', enabled: true },
        { text: 'File Storage & Backup', enabled: true },
        { text: 'Ultra High Resolution Images', enabled: true }
      ]
    },
    {
      title: 'Corporate',
      price: 'R7,500',
      subtitle: 'Advert & Video',
      featured: false,
      accent_color: '#f755d4',
      features: [
        { text: 'Product on White Background', enabled: true },
        { text: 'Product on Colourful Poster', enabled: true },
        { text: 'Up to 20 Products', enabled: true },
        { text: 'Magazine Grade Product Adverts', enabled: true },
        { text: 'Lifestyle shots with Models', enabled: true },
        { text: 'File Storage & Backup', enabled: true },
        { text: 'Ultra High Resolution Images', enabled: true }
      ]
    }
  ]
};