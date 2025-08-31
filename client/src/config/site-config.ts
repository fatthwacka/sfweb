/**
 * SlyFox Studios - Comprehensive Site Configuration
 * 
 * This file contains all configurable site-wide settings that can be modified
 * through the admin panel. Changes here are automatically reflected across
 * the entire website in real-time via React Query cache invalidation.
 * 
 * Last updated: 2025-08-23
 */

export const siteConfig = {
  /**
   * THEME & VISUAL SETTINGS
   * Global colors, typography, and visual styling
   */
  theme: {
    colors: {
      // Primary brand colors
      primary: "#8B5CF6",        // Purple brand color
      secondary: "#F59E0B",      // Amber accent
      accent: "#EF4444",         // Red highlights
      
      // Background gradients
      gradientStart: "#1a1a2e",
      gradientEnd: "#16213e",
      
      // Text colors
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

  /**
   * FRONT PAGE FEATURED SECTION
   * Settings for the homepage portfolio showcase
   */
  frontPage: {
    featured: {
      numberOfImages: 6,
      borderThickness: 1,        // 0-3px
      borderRoundness: 8,        // 0-40px  
      imagePadding: 21,          // 0-40px gap between images
      layoutStyle: "square",     // square, portrait, landscape, masonry, etc.
      
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
        galleryId: "gallery-6746be8c404da3c6a5f63f36", // Default gallery to display
        showTitles: true,
        titlePosition: "bottom-left", // bottom-left, bottom-center, bottom-right, overlay-center
        overlayOpacity: 0.4
      }
    }
  },

  /**
   * HERO IMAGES & CONTENT
   * Per-page hero sections with backgrounds and content
   */
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

  /**
   * PHOTOGRAPHY CATEGORIES  
   * Service categories with descriptions, images, and features
   */
  photography: {
    hero: {
      title: "Professional Photography",
      subtitle: "Capturing life's beautiful moments",
      backgroundImage: "/images/hero/photography-hero.jpg",
      overlayOpacity: 0.5
    },
    sections: {
      intro: {
        title: "Professional Photography",
        subtitle: "Discover our range of photography services, each tailored to capture the unique essence of your moments."
      },
      callToAction: {
        title: "Ready to Capture Your Story?",
        subtitle: "Let's discuss your photography needs and create something beautiful together.",
        primaryButton: {
          text: "Start Your Project",
          link: "/contact"
        },
        secondaryButton: {
          text: "View Pricing", 
          link: "/pricing"
        }
      }
    },
    categories: [
      {
        name: "Weddings & Newborn",
        slug: "weddings",
        description: "Capturing your special day with timeless elegance and emotion",
        image: "/images/hero/wedding-photography-hero.jpg", 
        features: [
          "Engagement sessions",
          "Ceremony coverage", 
          "Reception photography",
          "Bridal portraits"
        ],
        pricing: {
          startingPrice: 2500,
          currency: "ZAR",
          packages: [
            { name: "Essential", price: 2500, duration: "4 hours" },
            { name: "Premium", price: 4500, duration: "8 hours" },
            { name: "Complete", price: 7500, duration: "Full day" }
          ]
        }
      },
      {
        name: "Portraits & Headshots", 
        slug: "portraits",
        description: "Professional headshots and personal portraits that tell your story",
        image: "/images/hero/portrait-photography-hero.jpg",
        features: [
          "Executive headshots",
          "Family portraits", 
          "Personal branding",
          "Studio sessions"
        ],
        pricing: {
          startingPrice: 800,
          currency: "ZAR", 
          packages: [
            { name: "Individual", price: 800, duration: "1 hour" },
            { name: "Family", price: 1200, duration: "1.5 hours" },
            { name: "Corporate", price: 1800, duration: "2 hours" }
          ]
        }
      },
      {
        name: "Products & Brands",
        slug: "products",
        description: "Showcase your products with stunning commercial photography",
        image: "/images/hero/product-photography-hero.jpg",
        features: [
          "E-commerce photography",
          "Catalog shoots",
          "Lifestyle product shots",
          "360° product views"
        ],
        pricing: {
          startingPrice: 1200,
          currency: "ZAR",
          packages: [
            { name: "Basic", price: 1200, duration: "2 hours" },
            { name: "Standard", price: 2200, duration: "4 hours" },
            { name: "Premium", price: 3500, duration: "Full day" }
          ]
        }
      },
      {
        name: "Events & Functions",
        slug: "events", 
        description: "Documenting memorable moments at conferences, parties, and gatherings",
        image: "/images/hero/Event-photography-hero.jpg",
        features: [
          "Conference photography",
          "Party coverage",
          "Award ceremonies",
          "Networking events"
        ],
        pricing: {
          startingPrice: 1500,
          currency: "ZAR",
          packages: [
            { name: "Half Day", price: 1500, duration: "4 hours" },
            { name: "Full Day", price: 2800, duration: "8 hours" },
            { name: "Multi-Day", price: 5000, duration: "3 days" }
          ]
        }
      },
      {
        name: "Corporate & Business",
        slug: "corporate",
        description: "Elevate your business image with professional corporate photography",
        image: "/images/hero/corporate-photography-hero.jpg",
        features: [
          "Team headshots",
          "Office photography",
          "Corporate events",
          "Brand documentation"
        ],
        pricing: {
          startingPrice: 1800,
          currency: "ZAR",
          packages: [
            { name: "Team Session", price: 1800, duration: "3 hours" },
            { name: "Office Package", price: 3200, duration: "6 hours" },
            { name: "Brand Package", price: 5500, duration: "Full day" }
          ]
        }
      },
      {
        name: "Graduation & Matric Dances",
        slug: "graduation",
        description: "Celebrate academic achievements with memorable graduation photos",
        image: "/images/hero/graduation-photography-hero.jpg",
        features: [
          "Graduation ceremonies",
          "Individual portraits",
          "Family group shots",
          "Campus photography"
        ],
        pricing: {
          startingPrice: 900,
          currency: "ZAR",
          packages: [
            { name: "Individual", price: 900, duration: "1 hour" },
            { name: "Family Package", price: 1400, duration: "2 hours" },
            { name: "Ceremony Coverage", price: 2500, duration: "4 hours" }
          ]
        }
      }
    ]
  },

  /**
   * VIDEOGRAPHY CATEGORIES
   * Video service categories and offerings  
   */
  videography: {
    categories: [
      {
        name: "Wedding Films",
        slug: "wedding-films",
        description: "Cinematic wedding videos that tell your love story",
        image: "/images/hero/wedding-videography-hero.jpg",
        features: [
          "Cinematic highlights",
          "Ceremony recording",
          "Reception coverage",
          "Drone footage"
        ]
      },
      {
        name: "Corporate Videos", 
        slug: "corporate-videos",
        description: "Professional corporate video production and branding",
        image: "/images/hero/corporate-videography-hero.jpg", 
        features: [
          "Company profiles",
          "Training videos",
          "Product showcases",
          "Event documentation"
        ]
      }
    ]
  },

  /**
   * ABOUT PAGE CONTENT
   * Team information, company stats, and story
   */
  about: {
    stats: [
      { number: "500+", label: "Happy Clients", icon: "Users" },
      { number: "5 Years", label: "Experience", icon: "Clock" },
      { number: "1000+", label: "Events Captured", icon: "Camera" },
      { number: "Durban", label: "Based & Proud", icon: "MapPin" }
    ],
    
    team: [
      {
        name: "Dax Tucker",
        role: "Founder & Lead Photographer", 
        email: "dax@slyfox.co.za",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "With over 5 years of experience, Dax brings artistic vision and technical expertise to every project."
      },
      {
        name: "Eben",
        role: "Senior Videographer",
        email: "eben@slyfox.co.za", 
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Eben specializes in cinematic videography and brings stories to life through compelling visual narratives."
      },
      {
        name: "Kyle",
        role: "Creative Director",
        email: "kyle@slyfox.co.za",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Kyle leads our creative direction and ensures every project meets our high standards of artistic excellence."
      }
    ],

    story: {
      founded: "2019",
      location: "Durban, South Africa", 
      mission: "To capture life's most precious moments with artistic vision and technical excellence",
      values: [
        "Artistic Excellence",
        "Client-Focused Service",
        "Technical Innovation",
        "Authentic Storytelling"
      ]
    }
  },

  /**
   * SEO & METADATA
   * Page-specific SEO settings and meta information
   */
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
        title: "SlyFox Studios - Professional Photography & Videography in Durban", 
        description: "Durban's premier photography and videography studio. Specializing in weddings, portraits, events, and corporate video production. Book your session today.",
        keywords: ["photography durban", "wedding photographer", "videography", "professional portraits", "corporate photography"],
        canonicalUrl: "/",
        ogImage: "/images/og/slyfox-home-og.jpg"
      },
      
      photography: {
        title: "Photography Services - Weddings, Portraits & Events | SlyFox Studios",
        description: "Professional photography services in Durban. Wedding photography, portrait sessions, headshots, and event coverage. View our portfolio and book today.",
        keywords: ["photography services", "wedding photographer durban", "portrait photography", "headshots", "event photography"],
        canonicalUrl: "/photography", 
        ogImage: "/images/og/slyfox-photography-og.jpg"
      },
      
      videography: {
        title: "Professional Videography Services Durban | SlyFox Studios",
        description: "Cinematic videography services including wedding films, corporate videos, and event documentation. Professional video production in Durban.",
        keywords: ["videography durban", "wedding videographer", "corporate video", "video production", "cinematic films"],
        canonicalUrl: "/videography",
        ogImage: "/images/og/slyfox-videography-og.jpg" 
      },
      
      about: {
        title: "About SlyFox Studios - Durban Photography & Video Team",
        description: "Meet the creative team behind SlyFox Studios. Learn about our story, mission, and the passionate photographers and videographers serving Durban.",
        keywords: ["about slyfox studios", "photography team durban", "professional photographers", "videography team"],
        canonicalUrl: "/about",
        ogImage: "/images/og/slyfox-about-og.jpg"
      },
      
      contact: {
        title: "Contact SlyFox Studios - Book Your Photography Session",
        description: "Get in touch with SlyFox Studios to book your photography or videography session. Serving Durban and surrounding areas. Free consultations available.",
        keywords: ["contact photographer durban", "book photography session", "wedding photographer booking", "photography consultation"],
        canonicalUrl: "/contact", 
        ogImage: "/images/og/slyfox-contact-og.jpg"
      }
    }
  },

  /**
   * GLOBAL ASSETS
   * Logos, icons, and reusable media assets
   */
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

  /**
   * CONTACT INFORMATION
   * Business contact details and locations
   */
  contact: {
    business: {
      name: "SlyFox Studios",
      tagline: "Professional Photography & Videography", 
      phone: "+27 12 345 6789",
      email: "info@slyfox.co.za",
      whatsapp: "+27 12 345 6789",
      bookingEmail: "bookings@slyfox.co.za",
      address: {
        street: "Durban, South Africa", 
        city: "Durban",
        province: "KwaZulu-Natal",
        postal: "8001",
        country: "South Africa",
        displayText: "Durban, South Africa"
      }
    },

    // Contact methods for quick contact section
    methods: [
      {
        type: "phone",
        title: "Call Us",
        icon: "Phone",
        details: ["+27 12 345 6789", "Available Mon-Fri 9AM-6PM"],
        action: "tel:+27123456789",
        priority: 1
      },
      {
        type: "email", 
        title: "Email Us",
        icon: "Mail",
        details: ["info@slyfox.co.za", "We respond within 24 hours"],
        action: "mailto:info@slyfox.co.za",
        priority: 2
      },
      {
        type: "whatsapp",
        title: "WhatsApp", 
        icon: "MessageCircle",
        details: ["+27 12 345 6789", "Quick responses during business hours"],
        action: "https://wa.me/27123456789",
        priority: 3
      },
      {
        type: "location",
        title: "Visit Us",
        icon: "MapPin", 
        details: ["Durban, South Africa", "By appointment only"],
        action: null,
        priority: 4
      }
    ],
    
    hours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM", 
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "By appointment",
      weekdaysDisplay: "Monday - Friday",
      weekdaysTime: "9:00 AM - 6:00 PM",
      saturdayDisplay: "Saturday", 
      saturdayTime: "10:00 AM - 4:00 PM",
      sundayDisplay: "Sunday",
      sundayTime: "By appointment",
      note: "Evening and weekend shoots available by arrangement."
    },

    // Response times for different contact methods
    responseTimes: {
      email: {
        title: "Email Inquiries",
        time: "Within 24 hours", 
        description: "Detailed responses to all project inquiries"
      },
      whatsapp: {
        title: "WhatsApp Messages",
        time: "Within 2 hours",
        description: "Quick questions and availability checks"
      },
      phone: {
        title: "Phone Calls", 
        time: "Immediate",
        description: "Direct line during business hours"
      }
    },

    // Service areas
    serviceAreas: {
      primary: {
        title: "Primary Area:",
        area: "Durban Metro (no travel fees)",
        description: "Durban Metro"
      },
      extended: {
        title: "Extended Area:",
        area: "KwaZulu-Natal Province", 
        description: "KwaZulu-Natal Province"
      },
      destination: {
        title: "Destination:",
        area: "Anywhere in South Africa & beyond",
        description: "Anywhere in South Africa & beyond"
      },
      note: "Travel costs calculated based on distance and duration. Accommodation provided for multi-day shoots."
    },

    // Emergency/urgent contact
    emergency: {
      title: "Need Urgent Assistance?",
      subtitle: "For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response.",
      phone: "+27123456789",
      whatsapp: "https://wa.me/27123456789"
    },
    
    social: {
      instagram: "https://instagram.com/slyfoxstudios",
      facebook: "https://facebook.com/slyfoxstudios",
      twitter: "https://twitter.com/slyfoxstudios", 
      linkedin: "https://linkedin.com/company/slyfoxstudios",
      youtube: "https://youtube.com/@slyfoxstudios"
    }
  },

  /**
   * TECHNICAL SETTINGS
   * Internal configuration for features and integrations
   */
  technical: {
    analytics: {
      googleAnalyticsId: "GA_MEASUREMENT_ID", 
      facebookPixelId: "FB_PIXEL_ID",
      hotjarId: "HOTJAR_ID"
    },
    
    integrations: {
      supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
      emailService: "emailjs", // or "sendgrid", "mailchimp"
    },
    
    features: {
      maintenanceMode: false,
      clientPortalEnabled: true,
      bookingSystemEnabled: true,
      paymentProcessingEnabled: false
    }
  }
} as const;

/**
 * TypeScript type inference for the entire configuration
 * This ensures type safety when accessing config values throughout the app
 */
export type SiteConfig = typeof siteConfig;

/**
 * Helper function to get nested config values safely  
 * Usage: getConfigValue('theme.colors.primary', '#8B5CF6')
 */
export function getConfigValue<T>(path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current: any = siteConfig;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current ?? defaultValue;
}

/**
 * Export individual sections for convenience
 * Allows importing specific parts: import { theme, heroes } from '@/config/site-config'
 */
export const {
  theme,
  frontPage,
  heroes,
  photography,
  videography, 
  about,
  seo,
  assets,
  contact,
  technical
} = siteConfig;