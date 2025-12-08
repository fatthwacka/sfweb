import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Video, ArrowRight } from "lucide-react";
import { YouTubeHero } from "@/components/common/youtube-hero";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryNavigation } from "@/components/common/category-navigation";

const videographyCategories = [
  {
    name: "Weddings",
    slug: "weddings",
    image: "/images/hero/wedding-videography-hero.jpg",
    features: ["Ceremonies", "Receptions", "Drone Footage", "Highlights"]  // 49 chars
  },
  {
    name: "Corporate",
    slug: "corporate",
    image: "/images/hero/corporate-videography-hero.jpg",
    features: ["Company Intros", "Adverts", "Conferences", "Interviews"]  // 48 chars
  },
  {
    name: "Events",
    slug: "events",
    image: "/images/hero/events-videography-hero.jpg",
    features: ["Conferences", "Music Festivals", "Birthdays", "Functions"]  // 50 chars
  },
  {
    name: "Product Videos",
    slug: "products",
    image: "/images/hero/product-videography-hero.jpg",
    features: ["Product Adverts", "Lifestyle", "Unboxing", "360° Views"]  // 48 chars
  },
  {
    name: "Social Media",
    slug: "social",
    image: "/images/hero/social-media-videography-hero.jpg",
    features: ["Reels", "TikTok Content", "Facebook Videos", "Shorts"]  // 46 chars
  },
  {
    name: "Animation",
    slug: "animation",
    image: "/images/hero/animation-videography-hero.jpg",
    features: ["Logo Builds", "Explainer Videos", "Motion Graphics", "3D"]  // 48 chars
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
            <h2 className="text-4xl lg:text-5xl mb-6">
              Our <span>Videography Services</span>
            </h2>
            <h3 className="text-xl max-w-3xl mx-auto">
              From intimate wedding films to dynamic corporate content, we create videos that engage, inspire, and deliver results.
            </h3>
          </div>

          {/* Quick Navigation */}
          <CategoryNavigation 
            categories={[
              { name: "Weddings", slug: "weddings", shortName: "Weddings" },
              { name: "Corporate", slug: "corporate", shortName: "Corporate" },
              { name: "Events", slug: "events", shortName: "Events" },
              { name: "Product Videos", slug: "products", shortName: "Products" },
              { name: "Social Media", slug: "social", shortName: "Social" },
              { name: "Animation", slug: "animation", shortName: "Animation" }
            ]}
            basePath="videography"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      <Video className="w-12 h-12" />
                    </div>
                  </div>
                  
                  <div className="p-8 pb-6">
                    <h3 className="text-2xl mb-4">{category.name}</h3>
                    <p className="text-muted-foreground">{category.features.join(", ")}</p>
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
              Our Video <span>Process</span>
            </h2>
            <h3 className="text-xl max-w-3xl mx-auto">
              From concept to delivery, we ensure every video project exceeds expectations.
            </h3>
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
                  <div className="text-6xl font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </GradientBackground>

      {/* Call to Action */}
      <GradientBackground section="videography-landing-cta" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6">
            Ready to Create Your Video?
          </h2>
          <h3 className="text-xl mb-8">
            Let's discuss your videography needs and bring your vision to life with cinematic quality.
          </h3>
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
