import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { type PricingPackage, type PricingTier } from '@shared/types/pricing';
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

  if (isLoading) {
    return (
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading packages...</p>
          </div>
        </div>
      </div>
    );
  }

  // Use fallback data if no pricing data exists
  if (!pricingPackage || !pricingPackage.tiers || pricingPackage.tiers.length === 0) {
    // Try to get fallback data for this page identifier
    const fallbackTiers = defaultPricingTiers[pageIdentifier];
    if (!fallbackTiers || fallbackTiers.length === 0) {
      return null; // No fallback available, don't render
    }

    // Use fallback data
    const fallbackPackage = {
      tiers: fallbackTiers,
      section_colors: {}
    };
    const { tiers, section_colors } = fallbackPackage;

    return (
      <div className={className}>
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
            tiers.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
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
                '--pricing-accent-light': `hsl(${hsl.h + 8}, ${hsl.s + 15}%, 75%)`
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
                    {tier.description && (
                      <p className="text-muted-foreground mt-3 text-sm">
                        {tier.description}
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="studio-card-feature">
                        <Check className="studio-card-feature-icon" />
                        <span>{feature}</span>
                      </li>
                    ))}
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

  const { tiers, section_colors } = pricingPackage;

  // Apply section colors as CSS variables if provided
  const sectionStyle = section_colors ? {
    '--section-bg-gradient': section_colors.backgroundGradient,
    '--section-text-main': section_colors.mainTitle,
    '--section-text-subtitle': section_colors.subtitle,
    '--section-text-other': section_colors.allOther,
  } as React.CSSProperties : {};

  return (
    <div className={`${className}`} style={sectionStyle}>
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
          tiers.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
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
              '--pricing-accent-light': `hsl(${hsl.h + 8}, ${hsl.s + 15}%, 75%)`
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
                  {tier.description && (
                    <p className="text-muted-foreground mt-3 text-sm">
                      {tier.description}
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="studio-card-feature">
                      <Check className="studio-card-feature-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
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

// Default fallback pricing data for common pages
export const defaultPricingTiers: Record<string, PricingTier[]> = {
  'photography_weddings': [
    {
      title: 'Essential',
      price: 'R8,500',
      subtitle: '4 hours coverage',
      featured: false,
      features: [
        'Professional photographer',
        '200+ edited images',
        'Online gallery',
        'Print release rights',
        'Pre-wedding consultation'
      ]
    },
    {
      title: 'Premium',
      price: 'R15,000',
      subtitle: '8 hours coverage',
      featured: true,
      featured_text: 'Most Popular',
      features: [
        'Lead + second photographer',
        '400+ edited images',
        'Online gallery',
        'Print release rights',
        'Engagement shoot included',
        'Premium album (20 pages)',
        'Same-day sneak peeks'
      ]
    },
    {
      title: 'Luxury',
      price: 'R25,000',
      subtitle: 'Full day coverage',
      featured: false,
      features: [
        'Lead + 2 photographers',
        '600+ edited images',
        'Online gallery',
        'Print release rights',
        'Engagement shoot included',
        'Premium album (40 pages)',
        'Same-day sneak peeks',
        'Drone photography',
        'Video highlights reel'
      ]
    }
  ],
  'photography_corporate': [
    {
      title: 'Headshots',
      price: 'R2,500',
      subtitle: 'Per session',
      featured: false,
      features: [
        'Up to 10 people',
        '2 edited images per person',
        'On-location setup',
        'Professional lighting',
        'Quick turnaround'
      ]
    },
    {
      title: 'Half Day',
      price: 'R4,500',
      subtitle: '4 hours',
      featured: true,
      featured_text: 'Popular',
      features: [
        'Event coverage',
        'Team photos',
        'Candid shots',
        '100+ edited images',
        'Online gallery',
        'Commercial usage rights'
      ]
    },
    {
      title: 'Full Day',
      price: 'R8,000',
      subtitle: '8 hours',
      featured: false,
      features: [
        'Complete event coverage',
        'Multiple locations',
        'Team & individual shots',
        '250+ edited images',
        'Online gallery',
        'Commercial usage rights',
        'Rush delivery available'
      ]
    }
  ],
  'photography_events': [
    {
      title: 'Basic',
      price: 'R3,500',
      subtitle: '4 hours coverage',
      featured: false,
      features: [
        'Professional photographer',
        '150+ edited images',
        'Online gallery',
        'Print release rights',
        'Basic event coverage'
      ]
    },
    {
      title: 'Premium',
      price: 'R6,500',
      subtitle: '8 hours coverage',
      featured: true,
      featured_text: 'Popular',
      features: [
        'Professional photographer',
        '300+ edited images',
        'Online gallery',
        'Print release rights',
        'Full event coverage',
        'Same-day highlights'
      ]
    },
    {
      title: 'Complete',
      price: 'R10,000',
      subtitle: 'Full day coverage',
      featured: false,
      features: [
        'Lead + assistant photographer',
        '500+ edited images',
        'Online gallery',
        'Print release rights',
        'Complete event coverage',
        'Same-day highlights',
        'Video highlights reel'
      ]
    }
  ],
  'photography_portraits': [
    {
      title: 'Individual',
      price: 'R1,500',
      subtitle: '1 hour session',
      featured: false,
      features: [
        'Professional photographer',
        '20+ edited images',
        'Online gallery',
        'Print release rights',
        'Studio or outdoor location'
      ]
    },
    {
      title: 'Family',
      price: 'R2,500',
      subtitle: '2 hour session',
      featured: true,
      featured_text: 'Popular',
      features: [
        'Professional photographer',
        '40+ edited images',
        'Online gallery',
        'Print release rights',
        'Multiple outfit changes',
        'Studio or outdoor location'
      ]
    }
  ],
  'photography_graduation': [
    {
      title: 'Individual',
      price: 'R800',
      subtitle: 'Per graduate',
      featured: false,
      features: [
        'Professional photographer',
        '10+ edited images',
        'Online gallery',
        'Print release rights',
        'Traditional cap & gown shots'
      ]
    },
    {
      title: 'Group Package',
      price: 'R2,500',
      subtitle: 'Up to 5 graduates',
      featured: true,
      featured_text: 'Best Value',
      features: [
        'Professional photographer',
        '40+ edited images',
        'Online gallery',
        'Print release rights',
        'Individual & group shots',
        'Family photos included'
      ]
    }
  ],
  'photography_products': [
    {
      title: 'Basic',
      price: 'R1,200',
      subtitle: 'Up to 5 products',
      featured: false,
      features: [
        'Professional photographer',
        '2 images per product',
        'White background',
        'High resolution files',
        'Basic retouching'
      ]
    },
    {
      title: 'Premium',
      price: 'R2,500',
      subtitle: 'Up to 10 products',
      featured: true,
      featured_text: 'Most Popular',
      features: [
        'Professional photographer',
        '4 images per product',
        'Multiple backgrounds',
        'High resolution files',
        'Advanced retouching',
        'Lifestyle shots included'
      ]
    }
  ]
};