/**
 * Category Page Configuration Types for SlyFox Studios Site Management
 * 
 * This file defines the complete configuration structure for photography and videography
 * category pages, following the established GradientPicker architecture patterns.
 */

/**
 * Gradient configuration for sections - follows existing GradientPicker pattern
 */
export interface GradientConfig {
  startColor: string;
  middleColor: string;
  endColor: string;
  accentColor?: string;
  direction: string;
  opacity?: number;
  textColors?: {
    primary: string;    // Main title text
    secondary: string;  // Subtitle & paragraph text
    tertiary: string;   // All other text
  };
}

/**
 * Package tier configuration for pricing section
 */
export interface PackageTier {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
}

/**
 * Complete category page configuration interface
 */
export interface CategoryPageConfig {
  // Hero section - full-screen image with overlays
  hero: {
    image: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink?: string;
  };

  // Service overview section - description + feature bullets
  serviceOverview: {
    title: string;
    description: string;
    features: string[];
    image?: string;
    gradients: GradientConfig;
  };

  // Pricing packages section - 3 tiers with detailed info
  packages: {
    title: string;
    description: string;
    tiers: PackageTier[];
    gradients: GradientConfig;
  };

  // Recent work section - gallery showcase
  recentWork: {
    title: string;
    description: string;
    images: string[];
    gradients: GradientConfig;
  };

  // SEO content section - rich text content
  seoContent: {
    title: string;
    content: {
      section1: {
        title: string;
        text: string;
      };
      section2: {
        title: string;
        text: string;
      };
      conclusion: string;
    };
    gradients: GradientConfig;
  };

  // SEO metadata
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

/**
 * Default gradient configuration following established patterns
 */
export const defaultGradientConfig: GradientConfig = {
  startColor: 'hsl(220, 13%, 18%)',
  middleColor: 'hsl(220, 13%, 15%)',
  endColor: 'hsl(220, 13%, 12%)',
  direction: 'to right',
  opacity: 1,
  textColors: {
    primary: '#ffffff',
    secondary: '#e2e8f0',
    tertiary: '#94a3b8'
  }
};

/**
 * Default category page configuration
 */
export const defaultCategoryPageConfig: CategoryPageConfig = {
  hero: {
    image: '/images/hero/wedding-photography-hero.jpg',
    title: 'Wedding Photography',
    subtitle: 'Love stories captured timelessly',
    ctaText: 'Book Session'
  },
  serviceOverview: {
    title: 'Professional Wedding Photography',
    description: 'Your wedding day is one of the most important days of your life, and we\'re here to ensure every precious moment is captured with artistic vision and emotional depth. Our wedding photography approach combines candid storytelling with stunning portraits, creating a comprehensive visual narrative of your celebration.',
    features: [
      'Engagement session included',
      'Full ceremony coverage',
      'Reception photography',
      'Bridal party portraits',
      'Family group photos',
      'Detail shots of decor',
      'Online gallery delivery',
      'High-resolution downloads'
    ],
    image: '/images/placeholder-gallery.jpg',
    gradients: { 
      ...defaultGradientConfig,
      startColor: 'hsl(305, 100%, 15%)',
      middleColor: 'hsl(280, 70%, 12%)',
      endColor: 'hsl(260, 60%, 10%)',
      opacity: 0.9
    }
  },
  packages: {
    title: 'Wedding Photography Packages',
    description: 'Choose the perfect package for your needs. All packages include professional editing and digital delivery.',
    tiers: [
      {
        id: 'essential',
        name: 'Essential',
        price: 'R8,500',
        duration: '6 hours',
        features: [
          'Pre-wedding consultation',
          '6 hours coverage',
          '200+ edited photos',
          'Online gallery',
          'USB drive'
        ],
        isPopular: false
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 'R12,500',
        duration: '8 hours',
        features: [
          'Engagement session',
          '8 hours coverage',
          '400+ edited photos',
          'Premium gallery',
          'USB drive',
          'Print release'
        ],
        isPopular: true
      },
      {
        id: 'elite',
        name: 'Elite',
        price: 'R18,500',
        duration: 'Full day',
        features: [
          'Engagement session',
          'Full day coverage',
          '600+ edited photos',
          'Luxury gallery',
          '2 photographers',
          'Photo album',
          'Print release'
        ],
        isPopular: false
      }
    ],
    gradients: { 
      ...defaultGradientConfig,
      startColor: 'hsl(200, 100%, 15%)',
      middleColor: 'hsl(190, 70%, 12%)',
      endColor: 'hsl(180, 60%, 10%)',
      opacity: 0.8
    }
  },
  recentWork: {
    title: 'Recent Work',
    description: 'Browse our latest wedding photography projects',
    images: [
      '/images/gallery/wedding-gallery-1.jpg',
      '/images/gallery/wedding-gallery-2.jpg',
      '/images/gallery/wedding-gallery-3.jpg'
    ],
    gradients: { 
      ...defaultGradientConfig,
      startColor: 'hsl(340, 100%, 15%)',
      middleColor: 'hsl(320, 70%, 12%)',
      endColor: 'hsl(300, 60%, 10%)',
      opacity: 0.7
    }
  },
  seoContent: {
    title: 'Professional Wedding Photography in Durban',
    content: {
      section1: {
        title: 'Durban Wedding Photography Specialists',
        text: 'Our Durban wedding photography team specializes in capturing the most precious moments of your special day. With years of experience in wedding photography, we understand the importance of preserving every emotion, every glance, and every celebration that makes your wedding unique. Our wedding photographers combine artistic vision with technical expertise to create stunning wedding albums that tell your love story.'
      },
      section2: {
        title: 'Wedding Photography Packages and Pricing',
        text: 'We offer comprehensive wedding photography packages designed to fit different budgets and requirements. Our wedding photography services include engagement sessions, full wedding day coverage, professional editing, and beautiful wedding albums. Each package is carefully crafted to ensure you receive exceptional value and stunning photographs that capture the magic of your wedding day.'
      },
      conclusion: 'Book your Durban wedding photographer today and ensure your special day is captured with the artistry and professionalism it deserves. Our wedding photography team is committed to creating timeless images that you\'ll treasure for a lifetime. Contact us to discuss your wedding photography needs and learn more about our packages and availability.'
    },
    gradients: { ...defaultGradientConfig }
  },
  seo: {
    title: 'Wedding Photography Durban | SlyFox Studios',
    description: 'Capture your special day with timeless elegance and emotion. Professional wedding photography services in Durban.',
    keywords: 'Durban wedding photographer, wedding photography Durban, South African wedding photographer, bridal photography, wedding ceremony photography'
  }
};

/**
 * Category page collection interface
 */
export interface CategoryPagesConfig {
  photography: {
    weddings: CategoryPageConfig;
    portraits: CategoryPageConfig;
    corporate: CategoryPageConfig;
    events: CategoryPageConfig;
    products: CategoryPageConfig;
    graduation: CategoryPageConfig;
  };
  videography: {
    weddings: CategoryPageConfig;
    corporate: CategoryPageConfig;
    events: CategoryPageConfig;
    promotional: CategoryPageConfig;
    documentary: CategoryPageConfig;
    social: CategoryPageConfig;
  };
}

/**
 * Extended SiteConfig interface to include category pages
 */
export interface ExtendedSiteConfig {
  // Existing configuration (preserving all current structure)
  contact: {
    business: {
      name: string;
      tagline: string;
      phone: string;
      email: string;
      address: {
        displayText: string;
      };
    };
  };
  home: {
    hero: {
      slides: any[];
      autoAdvance: boolean;
      interval: number;
      effects: string[];
    };
    servicesOverview: any;
    testimonials: any;
  };
  gradients?: {
    [sectionName: string]: GradientConfig;
  };
  portfolio?: any;

  // New category pages configuration
  categoryPages: CategoryPagesConfig;
}

/**
 * Type for category page updates
 */
export type CategoryPageUpdatePayload = {
  type: 'photography' | 'videography';
  category: string;
  config: Partial<CategoryPageConfig>;
};

/**
 * Utility type for section-specific updates
 */
export type CategorySectionUpdate = {
  type: 'photography' | 'videography';
  category: string;
  section: keyof CategoryPageConfig;
  data: any;
};