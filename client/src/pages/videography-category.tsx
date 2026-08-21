import { useParams } from "wouter";
import { useEffect } from "react";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, Play } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";
import { trackPageView } from "@/lib/analytics";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { useQuery } from "@tanstack/react-query";

interface Shoot {
  id: string;
  title: string;
  description?: string;
  mediaType: 'photo' | 'video';
  customSlug?: string;
  coverImageUrl?: string;
  coverVideoInfo?: {
    id: string;
    storagePath: string;
    optimizedPath?: string;
    thumbnailPath: string;
    duration?: number;
    filename: string;
  };
  isGroup?: boolean;
  groupName?: string;
  shootCount?: number;
  shoots?: Array<{
    id: string;
    title: string;
    mediaType: 'photo' | 'video';
    customSlug?: string;
  }>;
}

// YouTube video IDs for each category hero
const categoryVideoIds: Record<string, string> = {
  weddings: "zeCDM1Ks6PY",
  products: "QRmzNpUQJEY",
  corporate: "mmVc2wQGIRo",
  animation: "-MKtFeO_9pE",
  events: "6CxWjitWk38",
  social: "IzFrJDXjomo"
};

const categoryData: Record<string, {
  name: string;
  title: string;
  description: string;
  longDescription: string;
  heroImage: string;
  features: string[];
  packages: Array<{
    name: string;
    price: string;
    duration: string;
    features: string[];
  }>;
  gallery: string[];
  seoKeywords: string;
}> = {
  weddings: {
    name: "Wedding Videography",
    title: "Wedding Videography Durban",
    description: "Cinematic wedding films that tell your love story with emotion and artistry.",
    longDescription: "Your wedding day deserves to be remembered in motion. Our wedding videography captures the laughter, tears, vows, and celebrations that make your day unique. We create cinematic films that you'll treasure for a lifetime, telling your love story with artistry and emotion.",
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "4K cinema cameras",
      "Professional audio recording",
      "Drone footage",
      "Cinematic style",
      "Full ceremony coverage",
      "Reception highlights",
      "Couple interviews",
      "Color grading"
    ],
    packages: [
      {
        name: "Essential",
        price: "R12,500",
        duration: "6 hours",
        features: ["6 hours filming", "Highlight reel (3-5 min)", "Ceremony footage", "Basic color grading", "Digital delivery"]
      },
      {
        name: "Premium",
        price: "R18,500",
        duration: "8 hours",
        features: ["8 hours filming", "Extended highlight reel", "Full ceremony edit", "Reception highlights", "Drone footage", "Professional audio"]
      },
      {
        name: "Cinematic",
        price: "R25,500",
        duration: "Full day",
        features: ["Full day coverage", "Feature-length film", "Same-day edit", "Multiple camera angles", "Drone cinematography", "Custom soundtrack"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Durban wedding videographer, wedding films Durban, cinematic wedding videography, wedding video production South Africa, bridal videography"
  },
  corporate: {
    name: "Corporate Videography",
    title: "Corporate Video Production Durban",
    description: "Professional corporate videos that enhance your business presence and communication.",
    longDescription: "Effective corporate videos build trust, communicate your message clearly, and enhance your professional image. From company profiles to training videos, we create content that serves your business objectives and engages your audience.",
    heroImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "Company profiles",
      "Training videos",
      "Client testimonials",
      "Product demonstrations",
      "Conference presentations",
      "Team introductions",
      "Brand storytelling",
      "Multi-platform optimization"
    ],
    packages: [
      {
        name: "Basic",
        price: "R8,500",
        duration: "Half day",
        features: ["Half day filming", "2-3 minute video", "Basic editing", "Single location", "Digital delivery"]
      },
      {
        name: "Professional",
        price: "R15,500",
        duration: "Full day",
        features: ["Full day filming", "5-8 minute video", "Multiple locations", "Professional interviews", "Graphics package"]
      },
      {
        name: "Premium",
        price: "R25,500",
        duration: "2 days",
        features: ["Multi-day production", "Multiple videos", "Advanced post-production", "Motion graphics", "Complete brand package"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Durban corporate videographer, corporate video production, business videos Durban, company profile videos, training video production South Africa"
  },
  events: {
    name: "Event Videography",
    title: "Event Video Production Durban",
    description: "Dynamic event videography that captures the energy and atmosphere of your occasions.",
    longDescription: "Every event has its unique energy and important moments. Our event videography services ensure these moments are preserved with professional quality, whether it's a conference, celebration, or corporate gathering.",
    heroImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "Multi-camera coverage",
      "Live streaming capability",
      "Keynote speaker recordings",
      "Audience reactions",
      "Networking moments",
      "Award presentations",
      "Real-time highlights",
      "Same-day delivery"
    ],
    packages: [
      {
        name: "Basic",
        price: "R5,500",
        duration: "4 hours",
        features: ["4 hours coverage", "Single camera", "Highlight reel", "Basic editing", "Digital delivery"]
      },
      {
        name: "Professional",
        price: "R9,500",
        duration: "8 hours",
        features: ["8 hours coverage", "Multi-camera setup", "Live streaming", "Extended highlights", "Professional editing"]
      },
      {
        name: "Premium",
        price: "R15,500",
        duration: "Full day",
        features: ["Full day coverage", "3+ cameras", "Live streaming", "Same-day edit", "Complete documentation"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Durban event videographer, conference videography, event video production, live streaming services, corporate event filming South Africa"
  },
  products: {
    name: "Product Videography",
    title: "Product Video Production Durban",
    description: "Compelling product videos that showcase features, benefits, and drive sales.",
    longDescription: "Product videos are essential for modern marketing, increasing conversion rates and customer engagement. We create compelling product demonstrations, unboxing videos, and commercial content that showcases your products effectively.",
    heroImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "Product demonstrations",
      "Unboxing videos",
      "Feature highlights",
      "Commercial spots",
      "360° product views",
      "Lifestyle integration",
      "E-commerce optimization",
      "Multi-platform formats"
    ],
    packages: [
      {
        name: "Basic",
        price: "R3,500",
        duration: "Half day",
        features: ["Simple product demo", "30-60 second video", "Basic lighting", "Standard editing", "Social media formats"]
      },
      {
        name: "Professional",
        price: "R6,500",
        duration: "Full day",
        features: ["Detailed demonstration", "2-3 minute video", "Professional lighting", "Multiple angles", "Advanced editing"]
      },
      {
        name: "Commercial",
        price: "R12,500",
        duration: "2 days",
        features: ["Multiple videos", "Lifestyle shots", "Commercial quality", "Motion graphics", "Complete campaign"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Durban product videographer, product video production, commercial videography, product demonstration videos, e-commerce video production South Africa"
  },
  social: {
    name: "Social Media Videos",
    title: "Social Media Video Content Durban",
    description: "Engaging social media content optimized for Instagram, TikTok, Facebook, and YouTube.",
    longDescription: "Social media success requires content that stops the scroll and engages viewers. We create platform-specific videos that capture attention, tell your story, and drive engagement across all social media platforms.",
    heroImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "Instagram Reels",
      "TikTok content",
      "Facebook videos",
      "YouTube shorts",
      "Stories content",
      "Platform optimization",
      "Trending formats",
      "Quick turnaround"
    ],
    packages: [
      {
        name: "Starter",
        price: "R2,500",
        duration: "2 hours",
        features: ["5 short videos", "Platform optimization", "Basic editing", "Trending formats", "Same-day delivery"]
      },
      {
        name: "Creator",
        price: "R4,500",
        duration: "Half day",
        features: ["10-15 videos", "Multiple platforms", "Advanced editing", "Graphics package", "Content strategy"]
      },
      {
        name: "Viral",
        price: "R8,500",
        duration: "Full day",
        features: ["20+ videos", "All platforms", "Professional production", "Trend analysis", "Monthly package available"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Durban social media videographer, Instagram Reels production, TikTok video creation, social media content Durban, viral video production South Africa"
  },
  animation: {
    name: "Animation & Motion Graphics",
    title: "Animation Services Durban",
    description: "Creative animation and motion graphics that bring ideas to life with visual impact.",
    longDescription: "Animation and motion graphics add a dynamic element to your visual communication. From logo animations to explainer videos, we create compelling animated content that engages audiences and communicates complex ideas effectively.",
    heroImage: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "Logo animations",
      "Explainer videos",
      "Motion graphics",
      "2D animation",
      "3D animation",
      "Character animation",
      "Infographic videos",
      "Custom illustrations"
    ],
    packages: [
      {
        name: "Basic",
        price: "R4,500",
        duration: "1 week",
        features: ["Simple logo animation", "15-30 seconds", "Basic motion graphics", "2 revisions", "Multiple formats"]
      },
      {
        name: "Professional",
        price: "R8,500",
        duration: "2 weeks",
        features: ["Complex animation", "60-90 seconds", "Professional voiceover", "Advanced graphics", "Unlimited revisions"]
      },
      {
        name: "Complete",
        price: "R15,500",
        duration: "3-4 weeks",
        features: ["Full explainer video", "2-3 minutes", "Custom illustrations", "Professional production", "Complete package"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Durban animation services, motion graphics Durban, explainer video production, logo animation, 2D 3D animation services South Africa"
  }
};

export default function VideographyCategory() {
  const params = useParams();
  const category = params.category;

  // Track page view for dynamic category pages
  useEffect(() => {
    if (category) {
      trackPageView(`/videography/${category}`);
    }
  }, [category]);

  if (!category || !categoryData[category]) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-saira font-black mb-4">Category Not Found</h1>
          <Link href="/videography">
            <Button className="btn-salmon">Back to Videography</Button>
          </Link>
        </div>
      </div>
    );
  }

  const data = categoryData[category];

  // Fetch wedding-related albums for Recent Albums section (only for weddings)
  const { data: recentAlbums = [], isLoading: albumsLoading } = useQuery<Shoot[]>({
    queryKey: ['portfolio', 'cards', 'wedding-related', 'video'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cards?shootTypes=wedding,engagement,maternity,newborn');
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      return response.json();
    },
    enabled: category === "weddings" // Only fetch for weddings category
  });

  return (
    <div data-page={category} className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>{data.title} | SlyFox Studios</title>
      <meta name="description" content={data.description} />
      <meta name="keywords" content={data.seoKeywords} />
      
      <Navigation />
      
      {/* Hero Section - Full width, min 40vh on mobile portrait, 16:9 on desktop */}
      <section className="relative w-full min-h-[40vh] md:aspect-video overflow-hidden flex items-center justify-center pt-16">
        {/* YouTube Video Background */}
        <div className="absolute top-16 left-0 right-0 bottom-0 overflow-hidden">
          {/* Placeholder cover image */}
          <div
            className="absolute inset-0 bg-cover bg-center z-10"
            style={{
              backgroundImage: `url('https://img.youtube.com/vi/${categoryVideoIds[category] || "zeCDM1Ks6PY"}/maxresdefault.jpg')`,
            }}
          />

          {/* YouTube iframe - scales to cover full width on mobile */}
          <div className="absolute inset-0 w-full h-full z-20">
            <iframe
              className="absolute top-1/2 left-1/2 w-[177.77vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2"
              src={`https://www.youtube.com/embed/${categoryVideoIds[category] || "zeCDM1Ks6PY"}?autoplay=1&mute=1&loop=1&playlist=${categoryVideoIds[category] || "zeCDM1Ks6PY"}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&cc_load_policy=0&start=1`}
              title={`${data.name} Hero Video`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        </div>
      </section>

      {/* About Section */}
      <GradientBackground section="videography-category-services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="videography-about-grid gap-16 items-center">
            <div>
              <h2 className="text-4xl mb-6">
                {data.name}
              </h2>
              <h3 className="text-lg mb-8">
                {data.longDescription}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-muted-foreground">
                    <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              {category === "weddings" ? (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src="https://storage.googleapis.com/sfweb-media/gallery-videos/f7ec3a26-de83-4b18-bdc7-57e7b2947380/1770361510170-Keagan___Amber_Wedding.mp4-optimized.mp4"
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${categoryVideoIds[category] || "zeCDM1Ks6PY"}?autoplay=0&mute=1&loop=1&playlist=${categoryVideoIds[category] || "zeCDM1Ks6PY"}&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  title={`${data.name} showcase video`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground section="videography-category-packages" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {data.name} Packages
            </h2>
            <h3 className="text-xl max-w-3xl mx-auto">
              Choose the perfect package for your video needs. All packages include professional editing and digital delivery.
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {data.packages.map((pkg, index) => (
              <div 
                key={index}
                className={index === 1 ? "studio-card-premium" : "studio-card"}
              >
                <div className="studio-card-content">
                  <div className="text-center mb-8">
                    <h3 className="studio-card-title">{pkg.name}</h3>
                    <div className="studio-card-price">{pkg.price}</div>
                    <p className="studio-card-duration">{pkg.duration}</p>
                  </div>

                  <div className="studio-card-features">
                    <ul className="space-y-4">
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="studio-card-feature">
                          <Check className="studio-card-feature-icon" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/contact">
                    <button className={index === 1 ? "studio-card-button-premium" : "studio-card-button"}>
                      Select
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GradientBackground>

      {/* Recent Albums Section - For weddings, show portfolio albums */}
      {category === "weddings" ? (
        <GradientBackground section="videography-wedding-albums" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl mb-2">
                Recent Albums
              </h2>
              <h3 className="text-xl">
                A selection of wedding, engagement, maternity and newborn galleries
              </h3>
            </div>

            {albumsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentAlbums.length > 0 ? (
              <PortfolioGrid portfolioItems={recentAlbums.slice(0, 6)} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No albums available yet</p>
              </div>
            )}

            {recentAlbums.length > 6 && (
              <div className="text-center mt-12">
                <Link href="/portfolio">
                  <Button className="btn-salmon">
                    View All Galleries
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </GradientBackground>
      ) : (
        /* Recent Work Section - For other categories */
        <GradientBackground section="videography-category-recent-work" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl mb-6">
                Sample Work
              </h2>
              <h3 className="text-xl">
                A selection of {data.name.toLowerCase()} videos
              </h3>
            </div>

            {category === "social" ? (
              // Vertical YouTube Shorts grid for social media category
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {["y4uhQUrcutU", "dzBW3zMjpoE", "jXzN-U6Q8FM", "iQHBp4hDNv0"].map((videoId, index) => (
                  <div key={index} className="group">
                    <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-2xl">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&loop=1&playlist=${videoId}&fs=1&cc_load_policy=0&iv_load_policy=3&showinfo=0`}
                        title={`${data.name} Video ${index + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // YouTube video grid for other video categories
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {(() => {
                  const videoIds: Record<string, string[]> = {
                    corporate: ["mmVc2wQGIRo", "-IHPZ3PUqOY", "QRmzNpUQJEY", "cpoh98lomEo", "KeNRQttTOJQ", "bZc_GE1sHEM"],
                    products: ["IzFrJDXjomo", "o1ahvUh3c4c", "x-7BV2TZx44", "cpoh98lomEo"],
                    events: ["2MCHCdn9-uc", "txSF70Y6ZdA", "-MKtFeO_9pE", "d835io7PYSc"],
                    animation: ["-MKtFeO_9pE", "cTEK6fY0oVQ", "2jWAidv1Cak", "-MKtFeO_9pE"]
                  };
                  return (videoIds[category] || []).map((videoId, index) => (
                    <div key={index} className="group">
                      <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&loop=1&playlist=${videoId}&fs=1&cc_load_policy=0&iv_load_policy=3&showinfo=0`}
                          title={`${data.name} Video ${index + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/contact">
                <Button className="btn-cyan">
                  Start Your Project
                </Button>
              </Link>
            </div>
          </div>
        </GradientBackground>
      )}

      <Footer />
    </div>
  );
}
