/**
 * Default Configuration Values
 * 
 * Fallback values used when config is loading or unavailable.
 * These ensure the application never breaks due to missing configuration.
 */

import type { SiteConfigInterface } from './types';

export const defaultConfig: SiteConfigInterface = {
  theme: {
    colors: {
      primary: "#8B5CF6",
      secondary: "#F59E0B", 
      accent: "#EF4444",
      gradientStart: "#1a1a2e",
      gradientEnd: "#16213e",
      textPrimary: "#ffffff",
      textSecondary: "#94a3b8",
      textMuted: "#64748b"
    },
    typography: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        hero: "3.5rem",
        heading: "2.25rem",
        subheading: "1.5rem", 
        body: "1rem",
        small: "0.875rem"
      }
    },
    spacing: {
      containerMaxWidth: "1200px",
      sectionPadding: "4rem",
      componentGap: "2rem"
    }
  },

  frontPage: {
    featured: {
      numberOfImages: 6,
      borderThickness: 1,
      borderRoundness: 8,
      imagePadding: 21,
      layoutStyle: "square",
      colors: {
        backgroundColor: "#1a1a2e",
        borderColor: "#8B5CF6", 
        textColor: "#ffffff"
      },
      backgroundGradient: {
        enabled: true,
        colors: ["#1a1a2e", "#2d1b69", "#1a1a2e"]
      },
      gallery: {
        galleryId: "gallery-6746be8c404da3c6a5f63f36",
        showTitles: true,
        titlePosition: "bottom-left",
        overlayOpacity: 0.4
      }
    }
  },

  heroes: {
    home: {
      backgroundImage: "/images/hero/professional-photography-services-durban.jpg",
      overlayOpacity: 0.6,
      title: "Professional Photography Services in Durban", 
      subtitle: "Capturing life's most precious moments with artistic vision and technical excellence",
      ctaText: "View Our Work",
      ctaLink: "/photography"
    },
    photography: {
      backgroundImage: "/images/hero/wedding-photography-hero.jpg",
      overlayOpacity: 0.5,
      title: "Photography Services",
      subtitle: "From intimate portraits to grand celebrations, we capture your story",
      ctaText: "Explore Categories", 
      ctaLink: "#categories"
    },
    videography: {
      backgroundImage: "/images/hero/videography-hero.jpg",
      overlayOpacity: 0.5,
      title: "Videography Services",
      subtitle: "Cinematic storytelling that brings your moments to life",
      ctaText: "View Video Portfolio",
      ctaLink: "#video-portfolio"
    },
    about: {
      backgroundImage: "/images/hero/about-hero.jpg", 
      overlayOpacity: 0.4,
      title: "About SlyFox Studios",
      subtitle: "Meet the creative minds behind Durban's premier photography studio",
      ctaText: "Get In Touch",
      ctaLink: "/contact"
    },
    contact: {
      backgroundImage: "/images/hero/contact-hero.jpg",
      overlayOpacity: 0.7,
      title: "Let's Create Something Beautiful Together",
      subtitle: "Ready to capture your special moments? We'd love to hear from you", 
      ctaText: "Send Message",
      ctaLink: "#contact-form"
    }
  },

  photography: {
    categories: []
  },

  videography: {
    categories: []
  },

  about: {
    stats: [],
    team: [],
    story: {
      founded: "2019", 
      location: "Durban, South Africa",
      mission: "To capture life's most precious moments with artistic vision and technical excellence",
      values: []
    }
  },

  seo: {
    global: {
      siteName: "SlyFox Studios",
      domain: "https://slyfox.co.za",
      defaultImage: "/images/og/slyfox-og-default.jpg", 
      twitterHandle: "@SlyFoxStudios",
      locale: "en_ZA"
    },
    pages: {
      home: {
        title: "SlyFox Studios - Professional Photography & Videography",
        description: "Durban's premier photography and videography studio.",
        keywords: [],
        canonicalUrl: "/",
        ogImage: "/images/og/slyfox-home-og.jpg"
      },
      photography: {
        title: "Photography Services | SlyFox Studios", 
        description: "Professional photography services in Durban.",
        keywords: [],
        canonicalUrl: "/photography",
        ogImage: "/images/og/slyfox-photography-og.jpg"
      },
      videography: {
        title: "Videography Services | SlyFox Studios",
        description: "Professional videography services in Durban.",
        keywords: [],
        canonicalUrl: "/videography", 
        ogImage: "/images/og/slyfox-videography-og.jpg"
      },
      about: {
        title: "About SlyFox Studios",
        description: "Meet the creative team behind SlyFox Studios.",
        keywords: [],
        canonicalUrl: "/about",
        ogImage: "/images/og/slyfox-about-og.jpg"
      },
      contact: {
        title: "Contact SlyFox Studios",
        description: "Get in touch with SlyFox Studios.",
        keywords: [],
        canonicalUrl: "/contact",
        ogImage: "/images/og/slyfox-contact-og.jpg"
      }
    }
  },

  assets: {
    logos: {
      main: "/images/logos/slyfox-logo-white.svg",
      dark: "/images/logos/slyfox-logo-dark.svg",
      icon: "/images/logos/slyfox-icon.svg", 
      favicon: "/images/logos/favicon.ico"
    },
    placeholders: {
      avatar: "/images/placeholders/default-avatar.jpg",
      image: "/images/placeholders/image-placeholder.jpg",
      video: "/images/placeholders/video-placeholder.jpg"
    },
    social: {
      ogImageDefault: "/images/og/slyfox-default-og.jpg",
      twitterCard: "/images/social/twitter-card.jpg",
      linkedinCard: "/images/social/linkedin-card.jpg"
    }
  },

  contact: {
    business: {
      name: "SlyFox Studios", 
      tagline: "Professional Photography & Videography",
      phone: "+27 (0)21 XXX-XXXX",
      email: "hello@slyfox.co.za",
      bookingEmail: "bookings@slyfox.co.za",
      address: {
        street: "123 Long Street",
        city: "Durban",
        province: "KwaZulu-Natal",
        postal: "8001", 
        country: "South Africa"
      }
    },
    hours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "Closed"
    },
    social: {
      instagram: "https://instagram.com/slyfoxstudios",
      facebook: "https://facebook.com/slyfoxstudios",
      twitter: "https://twitter.com/slyfoxstudios",
      linkedin: "https://linkedin.com/company/slyfoxstudios",
      youtube: "https://youtube.com/@slyfoxstudios"
    }
  },

  technical: {
    analytics: {
      googleAnalyticsId: "",
      facebookPixelId: "",
      hotjarId: ""
    },
    integrations: {
      supabaseUrl: undefined,
      supabaseAnonKey: undefined,
      emailService: "emailjs"
    },
    features: {
      maintenanceMode: false,
      clientPortalEnabled: true,
      bookingSystemEnabled: true,
      paymentProcessingEnabled: false
    }
  }
};

/**
 * Merge configuration with defaults
 * Ensures no undefined values exist in the configuration
 */
export function mergeWithDefaults<T extends Record<string, any>>(
  config: Partial<T>, 
  defaults: T
): T {
  const result = { ...defaults };
  
  for (const key in config) {
    if (config[key] !== undefined) {
      if (typeof config[key] === 'object' && config[key] !== null && !Array.isArray(config[key])) {
        result[key] = mergeWithDefaults(config[key], defaults[key] || {});
      } else {
        result[key] = config[key];
      }
    }
  }
  
  return result;
}