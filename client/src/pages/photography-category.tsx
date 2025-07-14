import { useParams } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Camera, Check } from "lucide-react";

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
    name: "Wedding Photography",
    title: "Wedding Photography Cape Town",
    description: "Capture your special day with timeless elegance and emotion. Professional wedding photography services in Cape Town.",
    longDescription: "Your wedding day is one of the most important days of your life, and we're here to ensure every precious moment is captured with artistic vision and emotional depth. Our wedding photography approach combines candid storytelling with stunning portraits, creating a comprehensive visual narrative of your celebration.",
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
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
    packages: [
      {
        name: "Essential Wedding",
        price: "R8,500",
        duration: "6 hours",
        features: ["Pre-wedding consultation", "6 hours coverage", "200+ edited photos", "Online gallery", "USB drive"]
      },
      {
        name: "Premium Wedding",
        price: "R12,500",
        duration: "8 hours",
        features: ["Engagement session", "8 hours coverage", "400+ edited photos", "Premium gallery", "USB drive", "Print release"]
      },
      {
        name: "Elite Wedding",
        price: "R18,500",
        duration: "Full day",
        features: ["Engagement session", "Full day coverage", "600+ edited photos", "Luxury gallery", "2 photographers", "Photo album", "Print release"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Cape Town wedding photographer, wedding photography Cape Town, South African wedding photographer, bridal photography, wedding ceremony photography"
  },
  portraits: {
    name: "Portrait Photography",
    title: "Professional Portrait Photography Cape Town",
    description: "Professional headshots and personal portraits that tell your story with confidence and style.",
    longDescription: "Whether you need professional headshots for your career or personal portraits that capture your essence, our portrait sessions are designed to make you look and feel your best. We specialize in creating images that reflect your personality and professional brand.",
    heroImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
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
    packages: [
      {
        name: "Basic Portrait",
        price: "R1,500",
        duration: "1 hour",
        features: ["1 hour session", "1 outfit", "10 edited photos", "Online gallery", "Print release"]
      },
      {
        name: "Professional Headshots",
        price: "R2,500",
        duration: "2 hours",
        features: ["2 hour session", "3 outfits", "25 edited photos", "Multiple backgrounds", "LinkedIn optimization"]
      },
      {
        name: "Premium Portrait",
        price: "R3,500",
        duration: "3 hours",
        features: ["3 hour session", "Unlimited outfits", "50 edited photos", "Studio & location", "Professional makeup consultation"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1494790108755-2616b612b8c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Cape Town portrait photographer, professional headshots Cape Town, executive portraits, personal branding photography, corporate headshots South Africa"
  },
  corporate: {
    name: "Corporate Photography",
    title: "Corporate Photography Services Cape Town",
    description: "Elevate your business image with professional corporate photography that builds trust and credibility.",
    longDescription: "Professional corporate photography is essential for building trust and credibility in today's business world. We provide comprehensive corporate photography services including executive portraits, team photos, office environments, and corporate event coverage.",
    heroImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
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
    packages: [
      {
        name: "Executive Package",
        price: "R3,500",
        duration: "Half day",
        features: ["5 executive portraits", "Professional lighting", "Multiple poses", "Same-day editing", "LinkedIn ready"]
      },
      {
        name: "Team Package",
        price: "R5,500",
        duration: "Full day",
        features: ["Up to 20 team members", "Individual portraits", "Group photos", "Office environment", "Brand guidelines"]
      },
      {
        name: "Corporate Complete",
        price: "R8,500",
        duration: "2 days",
        features: ["Unlimited team members", "Office photography", "Event coverage", "Environmental portraits", "Full brand package"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Cape Town corporate photographer, business photography, executive portraits Cape Town, corporate headshots, office photography South Africa"
  },
  events: {
    name: "Event Photography",
    title: "Event Photography Cape Town",
    description: "Document memorable moments at conferences, parties, and gatherings with professional event photography.",
    longDescription: "From intimate gatherings to large-scale conferences, we capture the energy and emotion of your events. Our unobtrusive approach ensures we document authentic moments while maintaining the natural flow of your event.",
    heroImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
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
    packages: [
      {
        name: "Basic Event",
        price: "R2,500",
        duration: "4 hours",
        features: ["4 hours coverage", "100+ photos", "Online gallery", "Social media ready", "Quick turnaround"]
      },
      {
        name: "Full Event",
        price: "R4,500",
        duration: "8 hours",
        features: ["8 hours coverage", "300+ photos", "Multiple photographers", "Live social sharing", "Highlight reel"]
      },
      {
        name: "Premium Event",
        price: "R6,500",
        duration: "Full day",
        features: ["Full day coverage", "500+ photos", "Multi-angle coverage", "Real-time uploads", "Professional editing"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Cape Town event photographer, conference photography, corporate event photography, party photography Cape Town, event documentation South Africa"
  },
  products: {
    name: "Product Photography",
    title: "Product Photography Cape Town",
    description: "Showcase your products with stunning commercial photography that drives sales and engagement.",
    longDescription: "High-quality product photography is crucial for e-commerce success and brand credibility. We create compelling product images that highlight your products' best features and drive customer engagement across all platforms.",
    heroImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
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
    packages: [
      {
        name: "Basic Product",
        price: "R150",
        duration: "Per product",
        features: ["5 angles per product", "White background", "Basic editing", "E-commerce ready", "24h turnaround"]
      },
      {
        name: "Lifestyle Product",
        price: "R350",
        duration: "Per product",
        features: ["10 angles", "Lifestyle shots", "Model usage", "Environmental shots", "Advanced editing"]
      },
      {
        name: "Premium Catalog",
        price: "R500",
        duration: "Per product",
        features: ["Unlimited angles", "360° photography", "Video clips", "Detail shots", "Complete package"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Cape Town product photographer, e-commerce photography, commercial photography, product catalog photography, lifestyle product photography South Africa"
  },
  graduation: {
    name: "Graduation Photography",
    title: "Graduation Photography Cape Town",
    description: "Celebrate academic achievements with memorable graduation photos that commemorate this milestone.",
    longDescription: "Graduation is a once-in-a-lifetime achievement that deserves to be celebrated and remembered. Our graduation photography services capture the pride, joy, and accomplishment of this significant milestone in your life.",
    heroImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
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
    packages: [
      {
        name: "Individual Graduate",
        price: "R1,200",
        duration: "1 hour",
        features: ["Individual portraits", "Campus locations", "10 edited photos", "Digital gallery", "Print package"]
      },
      {
        name: "Family Package",
        price: "R2,200",
        duration: "2 hours",
        features: ["Graduate portraits", "Family group shots", "Multiple locations", "25 edited photos", "Premium gallery"]
      },
      {
        name: "Full Graduation",
        price: "R3,200",
        duration: "Half day",
        features: ["Ceremony coverage", "Portrait session", "Family photos", "50+ edited photos", "Complete package"]
      }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1622810547313-15e6e0031e3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ],
    seoKeywords: "Cape Town graduation photographer, university graduation photography, graduation ceremony photography, graduation portraits Cape Town, academic milestone photography"
  }
};

export default function PhotographyCategory() {
  const params = useParams();
  const category = params.category;
  
  if (!category || !categoryData[category]) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-saira font-black mb-4">Category Not Found</h1>
          <Link href="/photography">
            <Button className="bg-gold text-black">Back to Photography</Button>
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
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${data.heroImage}')` }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/photography">
              <Button variant="ghost" className="text-gold hover:text-gold-muted mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Photography
              </Button>
            </Link>
          </div>
          
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl font-saira font-black mb-6">
              {data.name.split(' ')[0]} <span className="text-gold">{data.name.split(' ')[1]}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {data.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
                  Book Session
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-2 border-white text-white px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-white hover:text-black transition-all duration-300"
                onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Gallery
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-saira font-black mb-6">
                Why Choose Our <span className="text-gold">{data.name}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {data.longDescription}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
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
              <div className="absolute -bottom-6 -right-6 bg-gold text-black p-4 rounded-xl">
                <Camera className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              {data.name} <span className="text-gold">Packages</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect package for your needs. All packages include professional editing and digital delivery.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {data.packages.map((pkg, index) => (
              <div 
                key={index}
                className={`bg-charcoal rounded-2xl p-8 border transition-all duration-300 transform hover:-translate-y-2 ${
                  index === 1 ? "border-gold scale-105" : "border-border hover:border-gold"
                }`}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-saira font-bold text-gold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-saira font-black mb-2">{pkg.price}</div>
                  <p className="text-muted-foreground">{pkg.duration}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/contact">
                  <Button 
                    className={`w-full py-3 rounded-full font-barlow font-semibold transition-all duration-300 ${
                      index === 1
                        ? "bg-gold text-black hover:bg-gold-muted"
                        : "bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black"
                    }`}
                  >
                    Choose {pkg.name}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              Recent <span className="text-gold">Work</span>
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
                    <Camera className="w-12 h-12 text-gold" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/contact">
              <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
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
