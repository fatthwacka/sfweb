import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Video, ArrowRight } from "lucide-react";
import { YouTubeHero } from "@/components/common/youtube-hero";
import { GradientBackground } from "@/components/common/gradient-background";

const videographyCategories = [
  {
    name: "Wedding Films",
    slug: "weddings",
    description: "Cinematic wedding films that tell your love story beautifully",
    image: "/images/hero/wedding-videography-hero.jpg",
    features: ["Ceremony filming", "Dressing room shots", "Drone footage", "Reception coverage"]
  },
  {
    name: "Corporate Videos",
    slug: "corporate",
    description: "Professional corporate videos that elevate your company's status",
    image: "/images/hero/corporate-videography-hero.jpg",
    features: ["Company overview", "Training/Team Building", "Interviews", "Adverts & Promo content"]
  },
  {
    name: "Events",
    slug: "events",
    description: "Dynamic event videography capturing every glistening moment",
    image: "/images/hero/events-videography-hero.jpg",
    features: ["Conferences", "Music Festivals", "Birthdays", "Functions"]
  },
  {
    name: "Product Videos",
    slug: "products",
    description: "Compelling product videos that showcase features and benefits",
    image: "/images/hero/product-videography-hero.jpg",
    features: ["Product demonstrations", "Unboxing videos", "Commercial spots", "360° product views"]
  },
  {
    name: "Social Media",
    slug: "social",
    description: "Engaging social media content optimised for all platforms",
    image: "/images/hero/social-media-videography-hero.jpg",
    features: ["Instagram Reels", "TikTok content", "Facebook videos", "YouTube shorts"]
  },
  {
    name: "Animation",
    slug: "animation",
    description: "Creative animation and motion graphics for visual impact",
    image: "/images/hero/animation-videography-hero.jpg",
    features: ["Logo Builds", "Explainer videos", "Character animation", "3D renders"]
  }
];

export default function Videography() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Professional Videography Services Durban | SlyFox Studios</title>
      <meta name="description" content="Expert videography services in Durban including wedding films, corporate videos, events, product videos, social media content, and animation. Cinematic video production in South Africa." />
      <meta name="keywords" content="Durban videographer, wedding videography, corporate video production, event videography, product videos, social media content creation, animation services, video production South Africa" />
      
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
      <GradientBackground section="videography-landing-services" className="py-20">
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
                <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02]">
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
                    
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </GradientBackground>

      {/* Process Section */}
      <GradientBackground section="videography-landing-portfolio" className="py-20">
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
                <div className="inline-block mb-6">
                  <div className="text-6xl font-bold bg-gradient-to-r from-cyan via-purple-400 to-salmon bg-clip-text text-transparent">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl text-gold mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </GradientBackground>

      {/* Call to Action */}
      <GradientBackground section="videography-landing-cta" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-cyan">
            Ready to Create Your Video?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your videography needs and bring your vision to life with cinematic quality.
          </p>
          <div className="flex flex-row gap-4 justify-center">
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
      </GradientBackground>

      <Footer />
    </div>
  );
}
