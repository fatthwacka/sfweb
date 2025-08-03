import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Video, ArrowRight } from "lucide-react";
import { YouTubeHero } from "@/components/common/youtube-hero";

const videographyCategories = [
  {
    name: "Wedding Films",
    slug: "weddings",
    description: "Cinematic wedding films that tell your love story beautifully",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Ceremony filming", "Reception highlights", "Couple interviews", "Same-day edits"]
  },
  {
    name: "Corporate Videos",
    slug: "corporate",
    description: "Professional corporate videos that enhance your business presence",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Company profiles", "Training videos", "Testimonials", "Promotional content"]
  },
  {
    name: "Events",
    slug: "events",
    description: "Dynamic event videography capturing every important moment",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Conference coverage", "Live streaming", "Highlight reels", "Multi-camera setup"]
  },
  {
    name: "Product Videos",
    slug: "products",
    description: "Compelling product videos that showcase features and benefits",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Product demonstrations", "Unboxing videos", "Commercial spots", "360° product views"]
  },
  {
    name: "Social Media",
    slug: "social",
    description: "Engaging social media content optimized for all platforms",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Instagram Reels", "TikTok content", "Facebook videos", "YouTube shorts"]
  },
  {
    name: "Animation",
    slug: "animation",
    description: "Creative animation and motion graphics for various applications",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Logo animations", "Explainer videos", "Motion graphics", "2D/3D animation"]
  }
];

export default function Videography() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Professional Videography Services Cape Town | SlyFox Studios</title>
      <meta name="description" content="Expert videography services in Cape Town including wedding films, corporate videos, events, product videos, social media content, and animation. Cinematic video production in South Africa." />
      <meta name="keywords" content="Cape Town videographer, wedding videography, corporate video production, event videography, product videos, social media content creation, animation services, video production South Africa" />
      
      <Navigation />
      
      {/* Hero Section with YouTube Background */}
      <YouTubeHero
        videoId="0KMY9L849Hg"
        title="Videography"
        subtitle="Motion that tells your story"
        ctaText="Start Project"
        ctaLink="/contact"
      />

      {/* Videography Categories */}
      <section className="py-20 bg-gradient-to-br from-slate-900/40 via-background to-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="cyan text-4xl lg:text-5xl mb-6">
              Our <span>Videography Services</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From intimate wedding films to dynamic corporate content, we create videos that engage, inspire, and deliver results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {videographyCategories.map((category, index) => (
              <Link key={category.slug} href={`/videography/${category.slug}`}>
                <div className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={category.image}
                      alt={`${category.name} videography services`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Video className="w-12 h-12 icon-salmon" />
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl text-gold mb-4">{category.name}</h3>
                    <p className="text-muted-foreground mb-6">{category.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {category.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-salmon rounded-full mr-2 flex-shrink-0"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center text-cyan group-hover:translate-x-2 transition-transform duration-300">
                      Learn More
                      <ArrowRight className="w-5 h-5 ml-2 icon-salmon" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900/30 via-background to-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Our Video <span className="text-gold">Process</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From concept to delivery, we ensure every video project exceeds expectations.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Consultation",
                description: "We discuss your vision, goals, and requirements to create the perfect video strategy."
              },
              {
                step: "02", 
                title: "Pre-Production",
                description: "Planning, scripting, storyboarding, and scheduling to ensure smooth production."
              },
              {
                step: "03",
                title: "Production", 
                description: "Professional filming with cinema-quality equipment and experienced crew."
              },
              {
                step: "04",
                title: "Post-Production",
                description: "Expert editing, color grading, audio mixing, and final delivery in your preferred format."
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold text-black rounded-full text-xl mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl text-gold mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-amber-900/25 via-background to-orange-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-cyan">
            Ready to Create Your Video?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your videography needs and bring your vision to life with cinematic quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="btn-cyan">
                Start Your Project
              </Button>
            </Link>
            <Link href="/pricing">
              <Button className="btn-outline-salmon">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
