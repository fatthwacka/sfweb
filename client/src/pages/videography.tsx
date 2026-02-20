import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Video } from "lucide-react";
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
      
      {/* Hero Section - Full width, min 40vh on mobile portrait, 16:9 on desktop */}
      <section className="relative w-full min-h-[40vh] md:aspect-video overflow-hidden flex items-center justify-center pt-16">
        {/* YouTube Video Background */}
        <div className="absolute top-16 left-0 right-0 bottom-0 overflow-hidden">
          {/* Placeholder cover image */}
          <div
            className="absolute inset-0 bg-cover bg-center z-10"
            style={{
              backgroundImage: `url('https://img.youtube.com/vi/zeCDM1Ks6PY/maxresdefault.jpg')`,
            }}
          >
            <div className="absolute inset-0 hero-gradient"></div>
          </div>

          {/* YouTube iframe - scales to cover full width on mobile */}
          <div className="absolute inset-0 w-full h-full z-20">
            <iframe
              className="absolute top-1/2 left-1/2 w-[177.77vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2"
              src="https://www.youtube.com/embed/zeCDM1Ks6PY?autoplay=1&mute=1&loop=1&playlist=zeCDM1Ks6PY&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&cc_load_policy=0&start=1"
              title="Videography Hero Video"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                pointerEvents: 'none',
              }}
            />
            <div className="absolute inset-0 hero-gradient z-30"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        </div>
      </section>

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
