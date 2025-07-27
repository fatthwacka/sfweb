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
    heroImage: "/images/backgrounds/wedding-hero-background.jpg",
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
        name: "Essential",
        price: "R8,500",
        duration: "6 hours",
        features: ["Pre-wedding consultation", "6 hours coverage", "200+ edited photos", "Online gallery", "USB drive"]
      },
      {
        name: "Premium",
        price: "R12,500",
        duration: "8 hours",
        features: ["Engagement session", "8 hours coverage", "400+ edited photos", "Premium gallery", "USB drive", "Print release"]
      },
      {
        name: "Elite",
        price: "R18,500",
        duration: "Full day",
        features: ["Engagement session", "Full day coverage", "600+ edited photos", "Luxury gallery", "2 photographers", "Photo album", "Print release"]
      }
    ],
    gallery: [
      "/images/gallery/wedding-gallery-1.jpg",
      "/images/gallery/wedding-gallery-2.jpg",
      "/images/gallery/wedding-gallery-3.jpg"
    ],
    seoKeywords: "Cape Town wedding photographer, wedding photography Cape Town, South African wedding photographer, bridal photography, wedding ceremony photography"
  },
  portraits: {
    name: "Portrait Photography",
    title: "Professional Portrait Photography Cape Town",
    description: "Professional headshots and personal portraits that tell your story with confidence and style.",
    longDescription: "Whether you need professional headshots for your career or personal portraits that capture your essence, our portrait sessions are designed to make you look and feel your best. We specialize in creating images that reflect your personality and professional brand.",
    heroImage: "/images/backgrounds/portrait-hero-background.jpg",
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
        name: "Basic",
        price: "R1,500",
        duration: "1 hour",
        features: ["1 hour session", "1 outfit", "10 edited photos", "Online gallery", "Print release"]
      },
      {
        name: "Professional",
        price: "R2,500",
        duration: "2 hours",
        features: ["2 hour session", "3 outfits", "25 edited photos", "Multiple backgrounds", "LinkedIn optimization"]
      },
      {
        name: "Premium",
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
        name: "Executive",
        price: "R3,500",
        duration: "Half day",
        features: ["5 executive portraits", "Professional lighting", "Multiple poses", "Same-day editing", "LinkedIn ready"]
      },
      {
        name: "Team",
        price: "R5,500",
        duration: "Full day",
        features: ["Up to 20 team members", "Individual portraits", "Group photos", "Office environment", "Brand guidelines"]
      },
      {
        name: "Complete",
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
        name: "Basic",
        price: "R2,500",
        duration: "4 hours",
        features: ["4 hours coverage", "100+ photos", "Online gallery", "Social media ready", "Quick turnaround"]
      },
      {
        name: "Full",
        price: "R4,500",
        duration: "8 hours",
        features: ["8 hours coverage", "300+ photos", "Multiple photographers", "Live social sharing", "Highlight reel"]
      },
      {
        name: "Premium",
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
        name: "Basic",
        price: "R150",
        duration: "Per product",
        features: ["5 angles per product", "White background", "Basic editing", "E-commerce ready", "24h turnaround"]
      },
      {
        name: "Lifestyle",
        price: "R350",
        duration: "Per product",
        features: ["10 angles", "Lifestyle shots", "Model usage", "Environmental shots", "Advanced editing"]
      },
      {
        name: "Premium",
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
        name: "Individual",
        price: "R1,200",
        duration: "1 hour",
        features: ["Individual portraits", "Campus locations", "10 edited photos", "Digital gallery", "Print package"]
      },
      {
        name: "Family",
        price: "R2,200",
        duration: "2 hours",
        features: ["Graduate portraits", "Family group shots", "Multiple locations", "25 edited photos", "Premium gallery"]
      },
      {
        name: "Complete",
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
          <h1 className="text-4xl mb-4">Category Not Found</h1>
          <Link href="/photography">
            <Button className="btn-salmon">Back to Photography</Button>
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
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${data.heroImage}')` }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl mb-6">
              {data.name.split(' ')[0]} <span className="text-gold">{data.name.split(' ')[1]}</span>
            </h1>
            <p className="script-tagline text-cyan mb-8">
              {data.name === "Wedding Photography" ? "Love stories captured timelessly" :
               data.name === "Portrait Photography" ? "Professional portraits with confidence" :
               data.name === "Corporate Photography" ? "Professional business imagery excellence" :
               data.name === "Event Photography" ? "Memorable moments preserved artistically" :
               data.name === "Product Photography" ? "Products showcased with stunning appeal" :
               data.name === "Graduation Photography" ? "Achievements celebrated through portraits" :
               "Life's precious moments captured"}
            </p>
            <button className="btn-primary">
              Book Session
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-900/30 via-background to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl mb-6 h2-salmon">
                Why Choose Our {data.name}
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
              <div className="absolute -bottom-6 -right-6 bg-gold text-black p-4 rounded-xl">
                <Camera className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900/40 via-background to-cyan-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              {data.name} Packages
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect package for your needs. All packages include professional editing and digital delivery.
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

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gradient-to-br from-emerald-900/25 via-background to-teal-900/20">
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
                    <Camera className="w-12 h-12 text-salmon" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/contact">
              <Button className="btn-salmon">
                Start Your Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO Optimization Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900/40 via-background to-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              {data.name === "Wedding Photography" ? "Professional Wedding Photography" : 
               data.name === "Portrait Photography" ? "Expert Portrait Photography" :
               data.name === "Corporate Photography" ? "Corporate Photography Services" :
               data.name === "Event Photography" ? "Event Photography Specialists" :
               data.name === "Product Photography" ? "Product Photography Excellence" :
               "Professional Photography Services"} in Cape Town
            </h2>
          </div>
          
          <div className="space-y-8 text-lg leading-relaxed">
            <div>
              <h3 className="text-2xl mb-4">
                <span className="text-salmon">
                  {data.name === "Wedding Photography" ? "Cape Town Wedding Photography Specialists" :
                   data.name === "Portrait Photography" ? "Portrait Photography Excellence" :
                   data.name === "Corporate Photography" ? "Corporate Photography Solutions" :
                   data.name === "Event Photography" ? "Event Photography Professionals" :
                   data.name === "Product Photography" ? "E-commerce Product Photography" :
                   "Professional Photography Services"}
                </span>
              </h3>
              <p className="text-muted-foreground">
                {data.name === "Wedding Photography" ? "Our Cape Town wedding photography team specializes in capturing the most precious moments of your special day. With years of experience in wedding photography, we understand the importance of preserving every emotion, every glance, and every celebration that makes your wedding unique. Our wedding photographers combine artistic vision with technical expertise to create stunning wedding albums that tell your love story." :
                 data.name === "Portrait Photography" ? "Professional portrait photography in Cape Town requires skill, creativity, and an understanding of what makes each person unique. Our portrait photographers specialize in capturing authentic expressions and creating compelling headshots that make lasting impressions. From executive headshots to family portraits, we deliver high-quality images that reflect your personality and professional brand." :
                 data.name === "Corporate Photography" ? "Corporate photography services in Cape Town encompass everything from executive headshots to comprehensive business documentation. Our corporate photographers understand the importance of professional imagery in building brand credibility and establishing trust with your audience. We specialize in creating polished, professional photographs that enhance your company's image and support your marketing objectives." :
                 data.name === "Event Photography" ? "Event photography in Cape Town requires quick thinking, adaptability, and the ability to capture spontaneous moments as they unfold. Our event photographers specialize in documenting conferences, corporate events, parties, and special occasions with precision and creativity. We understand the importance of capturing the energy and atmosphere of your event while ensuring every important moment is preserved." :
                 data.name === "Product Photography" ? "Product photography is essential for e-commerce success and brand marketing. Our Cape Town product photographers specialize in creating compelling images that showcase your products in the best possible light. From catalog photography to lifestyle product shots, we understand how to highlight product features and create images that drive sales and enhance your brand presentation." :
                 "Our professional photography services in Cape Town combine technical excellence with creative vision to deliver exceptional results for every client. Whether you need commercial photography, personal portraits, or event documentation, our experienced photographers understand how to capture the essence of your subject and create images that exceed expectations."}
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl mb-4">
                <span className="text-cyan">
                  {data.name === "Wedding Photography" ? "Wedding Photography Packages and Pricing" :
                   data.name === "Portrait Photography" ? "Portrait Session Options" :
                   data.name === "Corporate Photography" ? "Corporate Photography Packages" :
                   data.name === "Event Photography" ? "Event Photography Coverage" :
                   data.name === "Product Photography" ? "Product Photography Solutions" :
                   "Photography Service Options"}
                </span>
              </h3>
              <p className="text-muted-foreground">
                {data.name === "Wedding Photography" ? "We offer comprehensive wedding photography packages designed to fit different budgets and requirements. Our wedding photography services include engagement sessions, full wedding day coverage, professional editing, and beautiful wedding albums. Each package is carefully crafted to ensure you receive exceptional value and stunning photographs that capture the magic of your wedding day." :
                 data.name === "Portrait Photography" ? "Our portrait photography sessions are tailored to meet your specific needs and objectives. Whether you need professional headshots for LinkedIn, family portraits for your home, or personal branding photography for your business, we offer flexible packages that deliver outstanding results. Each portrait session includes professional lighting, expert direction, and thorough post-processing to ensure perfect results." :
                 data.name === "Corporate Photography" ? "Our corporate photography packages are designed to meet the diverse needs of businesses in Cape Town. From individual executive headshots to large team photography sessions, we provide comprehensive solutions that enhance your professional image. Our services include on-location photography, studio sessions, and complete post-production to ensure your corporate imagery meets the highest standards." :
                 data.name === "Event Photography" ? "Event photography coverage options range from brief documentation to comprehensive all-day coverage. Our event photographers work discreetly to capture candid moments while ensuring all important aspects of your event are documented. We provide fast turnaround times and deliver high-resolution images that you can use for marketing, social media, and archival purposes." :
                 data.name === "Product Photography" ? "Our product photography services are designed to meet the needs of e-commerce businesses, catalogs, and marketing campaigns. We offer studio photography, lifestyle product shots, and 360-degree product photography. Each product photography session includes professional lighting, multiple angles, and expert post-processing to ensure your products look their absolute best." :
                 "Our photography services are structured to provide maximum value and exceptional results for every client. We offer flexible packages that can be customized to meet your specific requirements and budget. Each session includes professional equipment, expert guidance, and comprehensive post-processing to ensure you receive outstanding photographs that exceed your expectations."}
              </p>
            </div>
            
            <div>
              <p className="text-muted-foreground">
                {data.name === "Wedding Photography" ? "Book your Cape Town wedding photographer today and ensure your special day is captured with the artistry and professionalism it deserves. Our wedding photography team is committed to creating timeless images that you'll treasure for a lifetime. Contact us to discuss your wedding photography needs and learn more about our packages and availability." :
                 data.name === "Portrait Photography" ? "Ready to book your portrait session? Our Cape Town portrait photographers are here to help you create professional, compelling images that make the right impression. Whether you need corporate headshots or personal portraits, we're committed to delivering exceptional results that exceed your expectations." :
                 data.name === "Corporate Photography" ? "Enhance your business image with professional corporate photography. Our Cape Town team specializes in creating polished, professional photographs that support your brand and marketing objectives. Contact us today to discuss your corporate photography needs and learn how we can help strengthen your professional presence." :
                 data.name === "Event Photography" ? "Don't let your important events go undocumented. Our Cape Town event photographers are ready to capture every significant moment with skill and creativity. From corporate events to private celebrations, we ensure your event is preserved with professional-quality photography that tells the complete story." :
                 data.name === "Product Photography" ? "Transform your product marketing with professional product photography. Our Cape Town studio specializes in creating compelling product images that drive sales and enhance brand presentation. Contact us today to discuss your product photography needs and learn how we can help showcase your products effectively." :
                 "Experience the difference that professional photography makes. Our Cape Town photography team is dedicated to delivering exceptional results that capture the essence of your subject and exceed your expectations. Contact us today to discuss your photography needs and learn more about our services and packages."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
