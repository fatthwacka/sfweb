import { useParams } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Video, Check, Play } from "lucide-react";
import { YouTubeHero } from "@/components/common/youtube-hero";

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
    title: "Wedding Videography Cape Town",
    description: "Cinematic wedding films that tell your love story with emotion and artistry.",
    longDescription: "Your wedding day deserves to be remembered in motion. Our wedding videography captures the laughter, tears, vows, and celebrations that make your day unique. We create cinematic films that you'll treasure for a lifetime, telling your love story with artistry and emotion.",
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    features: [
      "4K cinema cameras",
      "Professional audio recording",
      "Drone footage",
      "Same-day highlight reel",
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
    seoKeywords: "Cape Town wedding videographer, wedding films Cape Town, cinematic wedding videography, wedding video production South Africa, bridal videography"
  },
  corporate: {
    name: "Corporate Videography",
    title: "Corporate Video Production Cape Town",
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
    seoKeywords: "Cape Town corporate videographer, corporate video production, business videos Cape Town, company profile videos, training video production South Africa"
  },
  events: {
    name: "Event Videography",
    title: "Event Video Production Cape Town",
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
    seoKeywords: "Cape Town event videographer, conference videography, event video production, live streaming services, corporate event filming South Africa"
  },
  products: {
    name: "Product Videography",
    title: "Product Video Production Cape Town",
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
    seoKeywords: "Cape Town product videographer, product video production, commercial videography, product demonstration videos, e-commerce video production South Africa"
  },
  social: {
    name: "Social Media Videos",
    title: "Social Media Video Content Cape Town",
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
    seoKeywords: "Cape Town social media videographer, Instagram Reels production, TikTok video creation, social media content Cape Town, viral video production South Africa"
  },
  animation: {
    name: "Animation & Motion Graphics",
    title: "Animation Services Cape Town",
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
    seoKeywords: "Cape Town animation services, motion graphics Cape Town, explainer video production, logo animation, 2D 3D animation services South Africa"
  }
};

export default function VideographyCategory() {
  const params = useParams();
  const category = params.category;
  
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>{data.title} | SlyFox Studios</title>
      <meta name="description" content={data.description} />
      <meta name="keywords" content={data.seoKeywords} />
      
      <Navigation />
      
      {/* Hero Section with YouTube Background */}
      <YouTubeHero
        videoId="0KMY9L849Hg"
        title={data.name}
        subtitle={data.name === "Corporate Videography" ? "Professional excellence in frames" : 
                 data.name === "Wedding Videography" ? "Love stories in motion" :
                 data.name === "Event Videography" ? "Moments preserved forever" :
                 data.name === "Product Videography" ? "Cinematic product showcase" :
                 data.name === "Social Media Videos" ? "Content that captivates" :
                 data.name === "Animation & Motion Graphics" ? "Ideas through animation" :
                 "Creative storytelling through film"}
        ctaText="Start Project"
        ctaLink="/contact"
      />

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-violet-900/30 via-background to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl mb-6">
                <span className="text-salmon">{data.name}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {data.longDescription}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-cyan mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={data.gallery[0]}
                alt={`${data.name} example`}
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                <Play className="w-16 h-16 text-gold" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-gold text-black p-4 rounded-xl">
                <Video className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-gradient-to-br from-amber-900/30 via-background to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              {data.name} Packages
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect package for your video needs. All packages include professional editing and digital delivery.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
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
      </section>

      {/* Showreel Section */}
      <section id="showreel" className="py-20 bg-gradient-to-br from-rose-900/25 via-background to-pink-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-salmon">
              Recent Work
            </h2>
            <p className="text-xl text-muted-foreground">
              Browse our latest {data.name.toLowerCase()} projects
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.gallery.map((image, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl image-hover-effect">
                  <img 
                    src={image}
                    alt={`${data.name} example ${index + 1}`}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-gold" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/contact">
              <Button className="btn-cyan">
                Start Your Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
