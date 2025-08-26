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
            street: "Cape Town, South Africa",
            city: "Cape Town",
            province: "Western Cape",
            postal: "8001",
            country: "South Africa",
            displayText: "Cape Town, South Africa"
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
            details: ["Cape Town, South Africa", "By appointment only"],
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
            area: "Cape Town Metro (no travel fees)",
            description: "Cape Town Metro"
          },
          extended: {
            title: "Extended Area:",
            area: "Western Cape Province", 
            description: "Western Cape Province"
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
            displayText: "Cape Town, South Africa"
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
          primary: { title: "Primary Area:", area: "Cape Town Metro (no travel fees)" },
          extended: { title: "Extended Area:", area: "Western Cape Province" },
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