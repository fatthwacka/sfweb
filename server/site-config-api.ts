import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Path to the persistent config overrides file
const CONFIG_OVERRIDES_PATH = path.join(process.cwd(), 'server', 'data', 'site-config-overrides.json');

// In-memory cache of configuration overrides
let configOverrides: any = {};

// Atomic file write function to prevent corruption
async function saveConfigOverrides(overrides: any): Promise<void> {
  const tempPath = `${CONFIG_OVERRIDES_PATH}.tmp.${Date.now()}`;
  
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(CONFIG_OVERRIDES_PATH), { recursive: true });
    
    // Write to temporary file first
    await fs.writeFile(tempPath, JSON.stringify(overrides, null, 2));
    
    // Atomic rename (guaranteed by OS)
    await fs.rename(tempPath, CONFIG_OVERRIDES_PATH);
    
    console.log('✅ Config overrides saved to disk successfully');
  } catch (error) {
    // Cleanup temp file if it exists
    try { await fs.unlink(tempPath); } catch {}
    console.error('❌ Failed to save config overrides:', error);
    throw error;
  }
}

// Load configuration overrides from disk
async function loadConfigOverrides(): Promise<any> {
  try {
    const data = await fs.readFile(CONFIG_OVERRIDES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('📁 No config overrides file found, starting with empty overrides');
      return {};
    }
    console.error('❌ Failed to load config overrides:', error);
    return {};
  }
}

// Initialize configuration overrides from disk on startup
(async () => {
  try {
    configOverrides = await loadConfigOverrides();
    console.log('🔄 Loaded config overrides from disk:', Object.keys(configOverrides));
  } catch (error) {
    console.error('⚠️ Failed to initialize config overrides, starting fresh:', error);
    configOverrides = {};
  }
})();

// Get photography configuration specifically
router.get('/api/site-config/photography', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Return the photography section from config overrides if it exists
    if (configOverrides.photography) {
      return res.json(configOverrides.photography);
    }
    
    // If no custom photography config, return 404 so frontend falls back to defaults
    return res.status(404).json({ 
      error: 'No custom photography configuration found' 
    });
  } catch (error) {
    console.error('❌ Error fetching photography config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current site configuration
router.get('/api/site-config', async (req, res) => {
  try {
    // Disable caching to always serve fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    // For development, we'll provide the static config
    // In production, this would read from a database or persistent storage
    
    // Default configuration that matches the current site-config.ts structure
    const defaultConfig = {
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
        emergency: {
          title: "Need Urgent Assistance?",
          subtitle: "For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response.",
          phone: "+27123456789",
          whatsapp: "https://wa.me/27123456789"
        }
      },
      home: {
        hero: {
          slides: [
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
          ],
          autoAdvance: true,
          interval: 6000,
          effects: ["liquid_dissolve"]
        },
        servicesOverview: {
          headline: "Capturing Life's Beautiful Moments",
          description: "From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence.",
          photography: {
            title: "Photography",
            description: "Capture life's precious moments with our professional photography services. From weddings to corporate events, we create stunning visual narratives.",
            image: "/images/services/photography-service-showcase.jpg",
            services: ["Weddings", "Portraits", "Corporate", "Events", "Products", "Graduation"],
            ctaText: "Explore Photography"
          },
          videography: {
            title: "Videography", 
            description: "Bring your stories to life with cinematic videography. From wedding films to corporate content, we create compelling visual experiences.",
            image: "/images/services/photography-service-showcase.jpg",
            services: ["Wedding Films", "Corporate Videos", "Events", "Product Videos", "Social Media", "Animation"],
            ctaText: "Explore Videography"
          }
        },
        testimonials: {
          headline: "What Our Clients Say",
          description: "Don't just take our word for it. Here's what our clients have to say about their experience with SlyFox Studios.",
          items: [
            {
              id: 1,
              name: "Sarah Mitchell",
              role: "Wedding Client",
              image: "/images/testimonials/client-sarah-jones.jpg",
              quote: "SlyFox Studios made our wedding day absolutely magical. The attention to detail and artistic vision exceeded all our expectations. Our photos are truly works of art.",
              rating: 5
            },
            {
              id: 2,
              name: "Michael Thompson", 
              role: "Corporate Client",
              image: "/images/testimonials/client-mike-johnson.jpg",
              quote: "Professional, creative, and incredibly talented. The corporate headshots they took for our team elevated our brand image significantly. Highly recommended!",
              rating: 5
            },
            {
              id: 3,
              name: "Emma Rodriguez",
              role: "Family Portrait Client", 
              image: "/images/testimonials/client-emma-davis.jpg",
              quote: "The family portrait session was comfortable and fun. They captured our personalities perfectly, and the online gallery made sharing with relatives so easy.",
              rating: 5
            }
          ]
        }
      },
      portfolio: {
        featured: {
          imageCount: 9,
          borderThickness: 0,
          borderRadius: 8,
          borderColor: "#ffffff",
          borderColorEnd: "#cccccc",
          imagePadding: 2,
          layoutStyle: "square",
          backgroundGradientStart: "#1e293b",
          backgroundGradientMiddle: "#334155",
          backgroundGradientEnd: "#0f172a",
          textColor: "#e2e8f0"
        }
      },
      categoryPages: {
        photography: {
          weddings: {
            hero: {
              image: "/images/hero/wedding-photography-hero.jpg",
              title: "Wedding Photography",
              subtitle: "Love stories captured timelessly",
              ctaText: "Book Session"
            },
            serviceOverview: {
              title: "Professional Wedding Photography",
              description: "Your wedding day is one of the most important days of your life, and we're here to ensure every precious moment is captured with artistic vision and emotional depth.",
              features: [
                "Engagement session included",
                "Full ceremony coverage", 
                "Reception photography",
                "Bridal party portraits",
                "Family group photos",
                "Detail shots of decor",
                "Online gallery delivery",
                "High-resolution downloads"
              ],
              gradients: {
                startColor: "hsl(305, 100%, 15%)",
                middleColor: "hsl(280, 70%, 12%)",
                endColor: "hsl(260, 60%, 10%)",
                direction: "to right",
                opacity: 0.9,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            packages: {
              title: "Wedding Photography Packages",
              description: "Choose the perfect package for your needs. All packages include professional editing and digital delivery.",
              tiers: [
                {
                  id: "essential",
                  name: "Essential",
                  price: "R8,500",
                  duration: "6 hours",
                  features: [
                    "Pre-wedding consultation",
                    "6 hours coverage",
                    "200+ edited photos",
                    "Online gallery",
                    "USB drive"
                  ],
                  isPopular: false
                },
                {
                  id: "premium",
                  name: "Premium", 
                  price: "R12,500",
                  duration: "8 hours",
                  features: [
                    "Engagement session",
                    "8 hours coverage",
                    "400+ edited photos",
                    "Premium gallery",
                    "USB drive",
                    "Print release"
                  ],
                  isPopular: true
                },
                {
                  id: "elite",
                  name: "Elite",
                  price: "R18,500",
                  duration: "Full day",
                  features: [
                    "Engagement session",
                    "Full day coverage",
                    "600+ edited photos",
                    "Luxury gallery",
                    "2 photographers",
                    "Photo album",
                    "Print release"
                  ],
                  isPopular: false
                }
              ],
              gradients: {
                startColor: "hsl(200, 100%, 15%)",
                middleColor: "hsl(190, 70%, 12%)",
                endColor: "hsl(180, 60%, 10%)",
                direction: "to right",
                opacity: 0.8,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            recentWork: {
              title: "Recent Work",
              description: "Browse our latest wedding photography projects",
              images: [
                "/images/gallery/wedding-gallery-1.jpg",
                "/images/gallery/wedding-gallery-2.jpg",
                "/images/gallery/wedding-gallery-3.jpg"
              ],
              gradients: {
                startColor: "hsl(340, 100%, 15%)",
                middleColor: "hsl(320, 70%, 12%)",
                endColor: "hsl(300, 60%, 10%)",
                direction: "to right",
                opacity: 0.7,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seoContent: {
              title: "Professional Wedding Photography in Durban",
              content: {
                section1: {
                  title: "Durban Wedding Photography Specialists",
                  text: "Our Durban wedding photography team specializes in capturing the most precious moments of your special day. With years of experience in wedding photography, we understand the importance of preserving every emotion, every glance, and every celebration that makes your wedding unique."
                },
                section2: {
                  title: "Wedding Photography Packages and Pricing",
                  text: "We offer comprehensive wedding photography packages designed to fit different budgets and requirements. Our wedding photography services include engagement sessions, full wedding day coverage, professional editing, and beautiful wedding albums."
                },
                conclusion: "Book your Durban wedding photographer today and ensure your special day is captured with the artistry and professionalism it deserves. Our wedding photography team is committed to creating timeless images that you'll treasure for a lifetime."
              },
              gradients: {
                startColor: "hsl(220, 13%, 18%)",
                middleColor: "hsl(220, 13%, 15%)",
                endColor: "hsl(220, 13%, 12%)",
                direction: "to right",
                opacity: 1,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seo: {
              title: "Wedding Photography Durban | SlyFox Studios",
              description: "Capture your special day with timeless elegance and emotion. Professional wedding photography services in Durban.",
              keywords: "Durban wedding photographer, wedding photography Durban, South African wedding photographer, bridal photography, wedding ceremony photography"
            }
          },
          portraits: {
            hero: {
              image: "/images/hero/portrait-photography-hero.jpg",
              title: "Portrait Photography",
              subtitle: "Professional headshots and personal portraits",
              ctaText: "Book Session"
            },
            serviceOverview: {
              title: "Professional Portrait Photography",
              description: "Whether you need professional headshots for your career or personal portraits that capture your essence, our portrait sessions are designed to make you look and feel your best.",
              features: [
                "Professional lighting setup",
                "Multiple outfit changes",
                "Variety of backgrounds",
                "Posing guidance",
                "Immediate preview",
                "Professional retouching",
                "Multiple format delivery",
                "Print-ready files"
              ],
              gradients: {
                startColor: "hsl(260, 100%, 15%)",
                middleColor: "hsl(240, 70%, 12%)",
                endColor: "hsl(220, 60%, 10%)",
                direction: "to right",
                opacity: 0.9,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            packages: {
              title: "Portrait Photography Packages",
              description: "Professional portrait packages designed to meet your specific needs and budget.",
              tiers: [
                {
                  id: "basic",
                  name: "Basic",
                  price: "R1,500",
                  duration: "1 hour",
                  features: [
                    "1 hour session",
                    "1 outfit",
                    "10 edited photos",
                    "Online gallery",
                    "Print release"
                  ],
                  isPopular: false
                },
                {
                  id: "professional",
                  name: "Professional",
                  price: "R2,500",
                  duration: "2 hours",
                  features: [
                    "2 hour session",
                    "3 outfits",
                    "25 edited photos",
                    "Multiple backgrounds",
                    "LinkedIn optimization"
                  ],
                  isPopular: true
                },
                {
                  id: "premium",
                  name: "Premium",
                  price: "R3,500",
                  duration: "3 hours",
                  features: [
                    "3 hour session",
                    "Unlimited outfits",
                    "50 edited photos",
                    "Studio & location",
                    "Professional makeup consultation"
                  ],
                  isPopular: false
                }
              ],
              gradients: {
                startColor: "hsl(180, 100%, 15%)",
                middleColor: "hsl(160, 70%, 12%)",
                endColor: "hsl(140, 60%, 10%)",
                direction: "to right",
                opacity: 0.8,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            recentWork: {
              title: "Recent Work",
              description: "Browse our latest portrait photography projects",
              images: [
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1494790108755-2616b612b8c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              ],
              gradients: {
                startColor: "hsl(320, 100%, 15%)",
                middleColor: "hsl(300, 70%, 12%)",
                endColor: "hsl(280, 60%, 10%)",
                direction: "to right",
                opacity: 0.7,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seoContent: {
              title: "Professional Portrait Photography in Durban",
              content: {
                section1: {
                  title: "Durban Portrait Photography Specialists",
                  text: "Our Durban portrait photography team specializes in creating professional headshots and personal portraits that capture your unique personality and professional brand."
                },
                section2: {
                  title: "Portrait Photography Services and Packages",
                  text: "We offer comprehensive portrait photography services including corporate headshots, LinkedIn profiles, personal branding photography, and family portraits. Each session is tailored to your specific needs."
                },
                conclusion: "Book your Durban portrait photographer today and ensure your professional image reflects your best self. Our portrait photography team is committed to creating stunning images that enhance your personal and professional brand."
              },
              gradients: {
                startColor: "hsl(220, 13%, 18%)",
                middleColor: "hsl(220, 13%, 15%)",
                endColor: "hsl(220, 13%, 12%)",
                direction: "to right",
                opacity: 1,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seo: {
              title: "Professional Portrait Photography Durban | SlyFox Studios",
              description: "Professional headshots and personal portraits that tell your story with confidence and style.",
              keywords: "Durban portrait photographer, professional headshots Durban, executive portraits, personal branding photography, corporate headshots South Africa"
            }
          },
          corporate: {
            hero: {
              image: "/images/hero/corporate-photography-hero.jpg",
              title: "Corporate Photography",
              subtitle: "Elevate your business image with professional corporate photography",
              ctaText: "Book Session"
            },
            serviceOverview: {
              title: "Professional Corporate Photography Services",
              description: "Professional corporate photography is essential for building trust and credibility in today's business world. We provide comprehensive corporate photography services including executive portraits, team photos, office environments, and corporate event coverage.",
              features: [
                "Executive portraits",
                "Team photography",
                "Office environment shots",
                "Corporate event coverage",
                "Brand consistency",
                "Quick turnaround",
                "Professional editing",
                "Multiple format delivery"
              ],
              gradients: {
                startColor: "hsl(210, 100%, 15%)",
                middleColor: "hsl(200, 70%, 12%)",
                endColor: "hsl(190, 60%, 10%)",
                direction: "to right",
                opacity: 0.9,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            packages: {
              title: "Corporate Photography Packages",
              description: "Professional corporate photography packages designed for businesses of all sizes.",
              tiers: [
                {
                  id: "executive",
                  name: "Executive",
                  price: "R3,500",
                  duration: "Half day",
                  features: [
                    "5 executive portraits",
                    "Professional lighting",
                    "Multiple poses",
                    "Same-day editing",
                    "LinkedIn ready"
                  ],
                  isPopular: false
                },
                {
                  id: "team",
                  name: "Team",
                  price: "R5,500",
                  duration: "Full day",
                  features: [
                    "Up to 20 team members",
                    "Individual portraits",
                    "Group photos",
                    "Office environment",
                    "Brand guidelines"
                  ],
                  isPopular: true
                },
                {
                  id: "complete",
                  name: "Complete",
                  price: "R8,500",
                  duration: "2 days",
                  features: [
                    "Unlimited team members",
                    "Office photography",
                    "Event coverage",
                    "Environmental portraits",
                    "Full brand package"
                  ],
                  isPopular: false
                }
              ],
              gradients: {
                startColor: "hsl(240, 100%, 15%)",
                middleColor: "hsl(220, 70%, 12%)",
                endColor: "hsl(200, 60%, 10%)",
                direction: "to right",
                opacity: 0.8,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            recentWork: {
              title: "Recent Work",
              description: "Browse our latest corporate photography projects",
              images: [
                "https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              ],
              gradients: {
                startColor: "hsl(280, 100%, 15%)",
                middleColor: "hsl(260, 70%, 12%)",
                endColor: "hsl(240, 60%, 10%)",
                direction: "to right",
                opacity: 0.7,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seoContent: {
              title: "Professional Corporate Photography in Durban",
              content: {
                section1: {
                  title: "Durban Corporate Photography Specialists",
                  text: "Our Durban corporate photography team specializes in creating professional business imagery that enhances your company's brand and credibility."
                },
                section2: {
                  title: "Corporate Photography Services and Packages",
                  text: "We offer comprehensive corporate photography services including executive portraits, team photography, office environments, and corporate event coverage. Each package is designed to meet your business needs."
                },
                conclusion: "Book your Durban corporate photographer today and ensure your business image reflects professionalism and quality. Our corporate photography team is committed to enhancing your brand through powerful visual content."
              },
              gradients: {
                startColor: "hsl(220, 13%, 18%)",
                middleColor: "hsl(220, 13%, 15%)",
                endColor: "hsl(220, 13%, 12%)",
                direction: "to right",
                opacity: 1,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seo: {
              title: "Corporate Photography Services Durban | SlyFox Studios",
              description: "Elevate your business image with professional corporate photography that builds trust and credibility.",
              keywords: "Durban corporate photographer, business photography, executive portraits Durban, corporate headshots, office photography South Africa"
            }
          },
          events: {
            hero: {
              image: "/images/hero/Event-photography-hero.jpg",
              title: "Event Photography",
              subtitle: "Document memorable moments at conferences, parties, and gatherings",
              ctaText: "Book Session"
            },
            serviceOverview: {
              title: "Professional Event Photography",
              description: "From intimate gatherings to large-scale conferences, we capture the energy and emotion of your events. Our unobtrusive approach ensures we document authentic moments while maintaining the natural flow of your event.",
              features: [
                "Conference documentation",
                "Party coverage",
                "Award ceremonies",
                "Networking events",
                "Keynote speakers",
                "Candid interactions",
                "Venue photography",
                "Same-day highlights"
              ],
              gradients: {
                startColor: "hsl(160, 100%, 15%)",
                middleColor: "hsl(140, 70%, 12%)",
                endColor: "hsl(120, 60%, 10%)",
                direction: "to right",
                opacity: 0.9,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            packages: {
              title: "Event Photography Packages",
              description: "Professional event photography packages for all types of gatherings and celebrations.",
              tiers: [
                {
                  id: "basic",
                  name: "Basic",
                  price: "R2,500",
                  duration: "4 hours",
                  features: [
                    "4 hours coverage",
                    "100+ photos",
                    "Online gallery",
                    "Social media ready",
                    "Quick turnaround"
                  ],
                  isPopular: false
                },
                {
                  id: "full",
                  name: "Full",
                  price: "R4,500",
                  duration: "8 hours",
                  features: [
                    "8 hours coverage",
                    "300+ photos",
                    "Multiple photographers",
                    "Live social sharing",
                    "Highlight reel"
                  ],
                  isPopular: true
                },
                {
                  id: "premium",
                  name: "Premium",
                  price: "R6,500",
                  duration: "Full day",
                  features: [
                    "Full day coverage",
                    "500+ photos",
                    "Multi-angle coverage",
                    "Real-time uploads",
                    "Professional editing"
                  ],
                  isPopular: false
                }
              ],
              gradients: {
                startColor: "hsl(120, 100%, 15%)",
                middleColor: "hsl(100, 70%, 12%)",
                endColor: "hsl(80, 60%, 10%)",
                direction: "to right",
                opacity: 0.8,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            recentWork: {
              title: "Recent Work",
              description: "Browse our latest event photography projects",
              images: [
                "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              ],
              gradients: {
                startColor: "hsl(60, 100%, 15%)",
                middleColor: "hsl(40, 70%, 12%)",
                endColor: "hsl(20, 60%, 10%)",
                direction: "to right",
                opacity: 0.7,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seoContent: {
              title: "Professional Event Photography in Durban",
              content: {
                section1: {
                  title: "Durban Event Photography Specialists",
                  text: "Our Durban event photography team specializes in capturing the energy and excitement of corporate events, conferences, parties, and special gatherings."
                },
                section2: {
                  title: "Event Photography Services and Coverage",
                  text: "We offer comprehensive event photography services including conference documentation, corporate events, award ceremonies, and private celebrations. Our unobtrusive approach captures authentic moments."
                },
                conclusion: "Book your Durban event photographer today and ensure your special event is documented professionally. Our event photography team is committed to capturing every important moment and memory."
              },
              gradients: {
                startColor: "hsl(220, 13%, 18%)",
                middleColor: "hsl(220, 13%, 15%)",
                endColor: "hsl(220, 13%, 12%)",
                direction: "to right",
                opacity: 1,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seo: {
              title: "Event Photography Durban | SlyFox Studios",
              description: "Document memorable moments at conferences, parties, and gatherings with professional event photography.",
              keywords: "Durban event photographer, conference photography, corporate event photography, party photography Durban, event documentation South Africa"
            }
          },
          products: {
            hero: {
              image: "/images/hero/product-photography-hero.jpg",
              title: "Product Photography",
              subtitle: "Showcase your products with stunning commercial photography",
              ctaText: "Book Session"
            },
            serviceOverview: {
              title: "Professional Product Photography",
              description: "High-quality product photography is crucial for e-commerce success and brand credibility. We create compelling product images that highlight your products' best features and drive customer engagement across all platforms.",
              features: [
                "E-commerce optimization",
                "White background shots",
                "Lifestyle photography",
                "360° product views",
                "Detail macro shots",
                "Color accuracy",
                "Multiple angles",
                "Batch processing"
              ],
              gradients: {
                startColor: "hsl(30, 100%, 15%)",
                middleColor: "hsl(20, 70%, 12%)",
                endColor: "hsl(10, 60%, 10%)",
                direction: "to right",
                opacity: 0.9,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            packages: {
              title: "Product Photography Packages",
              description: "Professional product photography packages designed for e-commerce and marketing needs.",
              tiers: [
                {
                  id: "basic",
                  name: "Basic",
                  price: "R150",
                  duration: "Per product",
                  features: [
                    "5 angles per product",
                    "White background",
                    "Basic editing",
                    "E-commerce ready",
                    "24h turnaround"
                  ],
                  isPopular: false
                },
                {
                  id: "lifestyle",
                  name: "Lifestyle",
                  price: "R350",
                  duration: "Per product",
                  features: [
                    "10 angles",
                    "Lifestyle shots",
                    "Model usage",
                    "Environmental shots",
                    "Advanced editing"
                  ],
                  isPopular: true
                },
                {
                  id: "premium",
                  name: "Premium",
                  price: "R500",
                  duration: "Per product",
                  features: [
                    "Unlimited angles",
                    "360° photography",
                    "Video clips",
                    "Detail shots",
                    "Complete package"
                  ],
                  isPopular: false
                }
              ],
              gradients: {
                startColor: "hsl(0, 100%, 15%)",
                middleColor: "hsl(340, 70%, 12%)",
                endColor: "hsl(320, 60%, 10%)",
                direction: "to right",
                opacity: 0.8,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            recentWork: {
              title: "Recent Work",
              description: "Browse our latest product photography projects",
              images: [
                "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              ],
              gradients: {
                startColor: "hsl(300, 100%, 15%)",
                middleColor: "hsl(280, 70%, 12%)",
                endColor: "hsl(260, 60%, 10%)",
                direction: "to right",
                opacity: 0.7,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seoContent: {
              title: "Professional Product Photography in Durban",
              content: {
                section1: {
                  title: "Durban Product Photography Specialists",
                  text: "Our Durban product photography team specializes in creating stunning commercial images that showcase your products and drive sales across all platforms."
                },
                section2: {
                  title: "Product Photography Services and Solutions",
                  text: "We offer comprehensive product photography services including e-commerce photography, lifestyle shots, 360° product views, and detailed macro photography. Each image is optimized for your specific needs."
                },
                conclusion: "Book your Durban product photographer today and ensure your products are showcased with professional quality that drives sales. Our product photography team is committed to creating compelling images that convert browsers into buyers."
              },
              gradients: {
                startColor: "hsl(220, 13%, 18%)",
                middleColor: "hsl(220, 13%, 15%)",
                endColor: "hsl(220, 13%, 12%)",
                direction: "to right",
                opacity: 1,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seo: {
              title: "Product Photography Durban | SlyFox Studios",
              description: "Showcase your products with stunning commercial photography that drives sales and engagement.",
              keywords: "Durban product photographer, e-commerce photography, commercial photography, product catalog photography, lifestyle product photography South Africa"
            }
          },
          graduation: {
            hero: {
              image: "/images/hero/graduation-photography-hero.jpg",
              title: "Graduation Photography",
              subtitle: "Celebrate academic achievements with memorable graduation photos",
              ctaText: "Book Session"
            },
            serviceOverview: {
              title: "Professional Graduation Photography",
              description: "Graduation is a once-in-a-lifetime achievement that deserves to be celebrated and remembered. Our graduation photography services capture the pride, joy, and accomplishment of this significant milestone in your life.",
              features: [
                "Ceremony coverage",
                "Individual portraits",
                "Family group shots",
                "Campus photography",
                "Cap and gown shots",
                "Diploma presentations",
                "Celebration moments",
                "Professional editing"
              ],
              gradients: {
                startColor: "hsl(50, 100%, 15%)",
                middleColor: "hsl(40, 70%, 12%)",
                endColor: "hsl(30, 60%, 10%)",
                direction: "to right",
                opacity: 0.9,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            packages: {
              title: "Graduation Photography Packages",
              description: "Professional graduation photography packages to commemorate your academic achievement.",
              tiers: [
                {
                  id: "individual",
                  name: "Individual",
                  price: "R1,200",
                  duration: "1 hour",
                  features: [
                    "Individual portraits",
                    "Campus locations",
                    "10 edited photos",
                    "Digital gallery",
                    "Print package"
                  ],
                  isPopular: false
                },
                {
                  id: "family",
                  name: "Family",
                  price: "R2,200",
                  duration: "2 hours",
                  features: [
                    "Graduate portraits",
                    "Family group shots",
                    "Multiple locations",
                    "25 edited photos",
                    "Premium gallery"
                  ],
                  isPopular: true
                },
                {
                  id: "complete",
                  name: "Complete",
                  price: "R3,200",
                  duration: "Half day",
                  features: [
                    "Ceremony coverage",
                    "Portrait session",
                    "Family photos",
                    "50+ edited photos",
                    "Complete package"
                  ],
                  isPopular: false
                }
              ],
              gradients: {
                startColor: "hsl(40, 100%, 15%)",
                middleColor: "hsl(30, 70%, 12%)",
                endColor: "hsl(20, 60%, 10%)",
                direction: "to right",
                opacity: 0.8,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            recentWork: {
              title: "Recent Work",
              description: "Browse our latest graduation photography projects",
              images: [
                "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
                "https://images.unsplash.com/photo-1622810547313-15e6e0031e3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              ],
              gradients: {
                startColor: "hsl(20, 100%, 15%)",
                middleColor: "hsl(10, 70%, 12%)",
                endColor: "hsl(0, 60%, 10%)",
                direction: "to right",
                opacity: 0.7,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seoContent: {
              title: "Professional Graduation Photography in Durban",
              content: {
                section1: {
                  title: "Durban Graduation Photography Specialists",
                  text: "Our Durban graduation photography team specializes in capturing the pride and joy of graduation day. We understand the importance of this milestone and ensure every precious moment is beautifully documented."
                },
                section2: {
                  title: "Graduation Photography Services and Packages",
                  text: "We offer comprehensive graduation photography services including ceremony coverage, individual portraits, family group photos, and campus photography. Each package is designed to commemorate your achievement."
                },
                conclusion: "Book your Durban graduation photographer today and ensure your academic achievement is celebrated with professional photography. Our graduation photography team is committed to capturing this important milestone for you to treasure forever."
              },
              gradients: {
                startColor: "hsl(220, 13%, 18%)",
                middleColor: "hsl(220, 13%, 15%)",
                endColor: "hsl(220, 13%, 12%)",
                direction: "to right",
                opacity: 1,
                textColors: {
                  primary: "#ffffff",
                  secondary: "#e2e8f0",
                  tertiary: "#94a3b8"
                }
              }
            },
            seo: {
              title: "Graduation Photography Durban | SlyFox Studios",
              description: "Celebrate academic achievements with memorable graduation photos that commemorate this milestone.",
              keywords: "Durban graduation photographer, university graduation photography, graduation ceremony photography, graduation portraits Durban, academic milestone photography"
            }
          }
        },
        videography: {}
      },
      gradients: {
        hero: {
          startColor: "#1e293b",
          middleColor: "#334155", 
          endColor: "#0f172a",
          direction: "135deg"
        },
        testimonials: {
          startColor: "#312e81",
          middleColor: "#1e1b4b",
          endColor: "#1e3a8a",
          direction: "to bottom right"
        },
        portfolio: {
          startColor: "#1e293b",
          middleColor: "#334155",
          endColor: "#0f172a",
          direction: "135deg"
        },
        services: {
          startColor: "#374151",
          middleColor: "#1f2937",
          endColor: "#111827",
          direction: "135deg"
        },
        contact: {
          startColor: "#0f172a",
          middleColor: "#1e293b",
          endColor: "#334155",
          direction: "to bottom"
        }
      }
    };
    
    // Merge default config with any overrides
    const mergedConfig = deepMerge(defaultConfig, configOverrides);
    
    console.log('🔍 GET REQUEST - Serving config with portfolio.featured:', JSON.stringify(mergedConfig?.portfolio?.featured, null, 2));
    
    res.json(mergedConfig);
  } catch (error) {
    console.error('Failed to load site config:', error);
    
    // Fallback to a basic config if import fails
    const fallbackConfig = {
      contact: {
        business: {
          name: "SlyFox Studios",
          tagline: "Professional Photography & Videography",
          phone: "+27 12 345 6789",
          email: "info@slyfox.co.za",
          whatsapp: "+27 12 345 6789",
          address: {
            displayText: "Durban, South Africa"
          }
        },
        methods: [],
        hours: {
          weekdaysDisplay: "Monday - Friday",
          weekdaysTime: "9:00 AM - 6:00 PM",
          saturdayDisplay: "Saturday", 
          saturdayTime: "10:00 AM - 4:00 PM",
          sundayDisplay: "Sunday",
          sundayTime: "By appointment",
          note: "Evening and weekend shoots available by arrangement."
        },
        responseTimes: {
          email: { title: "Email Inquiries", time: "Within 24 hours", description: "Detailed responses to all project inquiries" },
          whatsapp: { title: "WhatsApp Messages", time: "Within 2 hours", description: "Quick questions and availability checks" },
          phone: { title: "Phone Calls", time: "Immediate", description: "Direct line during business hours" }
        },
        serviceAreas: {
          primary: { title: "Primary Area:", area: "Durban Metro (no travel fees)" },
          extended: { title: "Extended Area:", area: "KwaZulu-Natal Province" },
          destination: { title: "Destination:", area: "Anywhere in South Africa & beyond" },
          note: "Travel costs calculated based on distance and duration. Accommodation provided for multi-day shoots."
        },
        emergency: {
          title: "Need Urgent Assistance?",
          subtitle: "For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response.",
          phone: "+27123456789",
          whatsapp: "https://wa.me/27123456789"
        }
      }
    };
    
    // Set same cache headers for fallback
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache'); 
    res.set('Expires', '0');
    res.json(fallbackConfig);
  }
});

// Update site configuration (single field)
router.patch('/api/site-config', async (req, res) => {
  try {
    const { path: configPath, value } = req.body;
    
    if (!configPath || value === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: path and value' 
      });
    }

    // For now, we'll just log the changes and return success
    // In a full implementation, this would update the actual config file or database
    console.log(`Site config update: ${configPath} = `, value);
    
    // Simulate a database update delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.json({ 
      success: true, 
      message: `Updated ${configPath}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update site config:', error);
    res.status(500).json({ 
      error: 'Failed to update site configuration' 
    });
  }
});

// Bulk update site configuration  
router.patch('/api/site-config/bulk', async (req, res) => {
  try {
    const updates = req.body;
    
    console.log('📦 BULK UPDATE REQUEST RECEIVED');
    console.log('Raw request body:', JSON.stringify(updates, null, 2));
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid update data' 
      });
    }

    console.log('📋 BEFORE UPDATE - Current configOverrides:', JSON.stringify(configOverrides, null, 2));

    // Merge updates with existing overrides
    const newOverrides = deepMerge(configOverrides, updates);
    
    console.log('🔄 AFTER MERGE - New overrides:', JSON.stringify(newOverrides, null, 2));
    
    // Save to disk atomically
    await saveConfigOverrides(newOverrides);
    
    // Update in-memory cache after successful disk write
    configOverrides = newOverrides;
    
    console.log('💾 SAVED TO DISK - Final configOverrides:', JSON.stringify(configOverrides?.portfolio?.featured, null, 2));
    
    // Simulate a database update delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    res.json({ 
      success: true, 
      message: 'Bulk update completed',
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to bulk update site config:', error);
    res.status(500).json({ 
      error: 'Failed to bulk update site configuration' 
    });
  }
});

// Utility function for deep merging objects
function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (!target) return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

export default router;