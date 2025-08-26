/**
 * TypeScript interfaces for SlyFox Studios Site Configuration
 * 
 * These interfaces provide complete type safety for the site configuration
 * and enable excellent IntelliSense support in the IDE.
 */

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradientStart: string;
    gradientEnd: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: {
      hero: string;
      heading: string;
      subheading: string;
      body: string;
      small: string;
    };
  };
  spacing: {
    containerMaxWidth: string;
    sectionPadding: string;
    componentGap: string;
  };
}

export interface FrontPageConfig {
  featured: {
    numberOfImages: number;
    borderThickness: number;
    borderRoundness: number;
    imagePadding: number;
    layoutStyle: 'square' | 'portrait' | 'landscape' | 'masonry' | 'instagram' | 'upright' | 'wide' | 'automatic';
    colors: {
      backgroundColor: string;
      borderColor: string;
      textColor: string;
    };
    backgroundGradient: {
      enabled: boolean;
      colors: string[];
    };
    gallery: {
      galleryId: string;
      showTitles: boolean;
      titlePosition: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'overlay-center';
      overlayOpacity: number;
    };
  };
}

export interface HeroConfig {
  backgroundImage: string;
  overlayOpacity: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface HeroesConfig {
  home: HeroConfig;
  photography: HeroConfig;
  videography: HeroConfig;
  about: HeroConfig;
  contact: HeroConfig;
}

export interface ServicePackage {
  name: string;
  price: number;
  duration: string;
}

export interface ServiceCategory {
  name: string;
  slug: string;
  description: string;
  image: string;
  features: string[];
  pricing?: {
    startingPrice: number;
    currency: string;
    packages: ServicePackage[];
  };
}

export interface PhotographyConfig {
  categories: ServiceCategory[];
}

export interface VideographyConfig {
  categories: Omit<ServiceCategory, 'pricing'>[];
}

export interface Statistic {
  number: string;
  label: string;
  icon: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  image: string;
  description: string;
}

export interface AboutConfig {
  stats: Statistic[];
  team: TeamMember[];
  story: {
    founded: string;
    location: string;
    mission: string;
    values: string[];
  };
}

export interface SEOPageConfig {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
}

export interface SEOConfig {
  global: {
    siteName: string;
    domain: string;
    defaultImage: string;
    twitterHandle: string;
    locale: string;
  };
  pages: {
    home: SEOPageConfig;
    photography: SEOPageConfig;
    videography: SEOPageConfig;
    about: SEOPageConfig;
    contact: SEOPageConfig;
  };
}

export interface AssetsConfig {
  logos: {
    main: string;
    dark: string;
    icon: string;
    favicon: string;
  };
  placeholders: {
    avatar: string;
    image: string;
    video: string;
  };
  social: {
    ogImageDefault: string;
    twitterCard: string;
    linkedinCard: string;
  };
}

export interface ContactMethod {
  type: 'phone' | 'email' | 'whatsapp' | 'location';
  title: string;
  icon: string;
  details: string[];
  action: string | null;
  priority: number;
}

export interface ContactConfig {
  business: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    whatsapp: string;
    bookingEmail: string;
    address: {
      street: string;
      city: string;
      province: string;
      postal: string;
      country: string;
      displayText: string;
    };
  };
  methods: ContactMethod[];
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    weekdaysDisplay: string;
    weekdaysTime: string;
    saturdayDisplay: string;
    saturdayTime: string;
    sundayDisplay: string;
    sundayTime: string;
    note: string;
  };
  responseTimes: {
    email: {
      title: string;
      time: string;
      description: string;
    };
    whatsapp: {
      title: string;
      time: string;
      description: string;
    };
    phone: {
      title: string;
      time: string;
      description: string;
    };
  };
  serviceAreas: {
    primary: {
      title: string;
      area: string;
      description: string;
    };
    extended: {
      title: string;
      area: string;
      description: string;
    };
    destination: {
      title: string;
      area: string;
      description: string;
    };
    note: string;
  };
  emergency: {
    title: string;
    subtitle: string;
    phone: string;
    whatsapp: string;
  };
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
}

export interface TechnicalConfig {
  analytics: {
    googleAnalyticsId: string;
    facebookPixelId: string;
    hotjarId: string;
  };
  integrations: {
    supabaseUrl: string | undefined;
    supabaseAnonKey: string | undefined;
    emailService: 'emailjs' | 'sendgrid' | 'mailchimp';
  };
  features: {
    maintenanceMode: boolean;
    clientPortalEnabled: boolean;
    bookingSystemEnabled: boolean;
    paymentProcessingEnabled: boolean;
  };
}

/**
 * Complete site configuration interface
 */
export interface SiteConfigInterface {
  theme: ThemeConfig;
  frontPage: FrontPageConfig;
  heroes: HeroesConfig;
  photography: PhotographyConfig;
  videography: VideographyConfig;
  about: AboutConfig;
  seo: SEOConfig;
  assets: AssetsConfig;
  contact: ContactConfig;
  technical: TechnicalConfig;
}

/**
 * Admin panel update interfaces
 */
export interface ConfigUpdatePayload {
  section: keyof SiteConfigInterface;
  data: Partial<SiteConfigInterface[keyof SiteConfigInterface]>;
  updatedBy?: string;
  timestamp?: string;
}

export interface ConfigUpdateResponse {
  success: boolean;
  message: string;
  updatedSection: string;
  timestamp: string;
  gitCommit?: {
    hash: string;
    message: string;
  };
}

/**
 * Gallery-specific types for the featured section
 */
export interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface GalleryData {
  id: string;
  name: string;
  images: GalleryImage[];
  settings?: {
    layout: FrontPageConfig['featured']['layoutStyle'];
    showTitles: boolean;
    titlePosition: FrontPageConfig['featured']['gallery']['titlePosition'];
  };
}

/**
 * Utility type for deep partial updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type guard functions for configuration validation
 */
export function isValidLayoutStyle(style: string): style is FrontPageConfig['featured']['layoutStyle'] {
  return ['square', 'portrait', 'landscape', 'masonry', 'instagram', 'upright', 'wide', 'automatic'].includes(style);
}

export function isValidTitlePosition(position: string): position is FrontPageConfig['featured']['gallery']['titlePosition'] {
  return ['bottom-left', 'bottom-center', 'bottom-right', 'overlay-center'].includes(position);
}

export function isValidEmailService(service: string): service is TechnicalConfig['integrations']['emailService'] {
  return ['emailjs', 'sendgrid', 'mailchimp'].includes(service);
}

/**
 * Configuration validation schema
 */
export interface ConfigValidationError {
  field: string;
  message: string;
  value: unknown;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: string[];
}

/**
 * Export commonly used union types
 */
export type PageKey = keyof SEOConfig['pages'];
export type ThemeColor = keyof ThemeConfig['colors'];
export type FontFamily = keyof ThemeConfig['typography']['fontFamily'];
export type FontSize = keyof ThemeConfig['typography']['fontSize'];
export type AssetCategory = keyof AssetsConfig;
export type SocialPlatform = keyof ContactConfig['social'];