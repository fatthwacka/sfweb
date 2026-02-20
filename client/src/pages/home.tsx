import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";
import { HomepageServicesOverview } from "@/components/sections/homepage-services-overview";
import { AboutApproach } from "@/components/sections/about-approach";
import { HomepageCTA } from "@/components/sections/homepage-cta";
import { HomepageFinalCTA } from "@/components/sections/homepage-final-cta";
import { Testimonials } from "@/components/sections/testimonials";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* Static SEO content - loads immediately before dynamic content */}
      <h1 className="sr-only">SlyFox Studios - Professional Photography & Videography in Durban, South Africa</h1>

      <Navigation />

      {/* Hero Section - Full width, min 40vh on mobile portrait, 16:9 on desktop */}
      <section className="relative w-full min-h-[40vh] md:aspect-video overflow-hidden flex items-center justify-center pt-16">
        {/* YouTube Video Background */}
        <div className="absolute top-16 left-0 right-0 bottom-0 overflow-hidden">
          {/* Placeholder cover image */}
          <div
            className="absolute inset-0 bg-cover bg-center z-10"
            style={{
              backgroundImage: `url('https://img.youtube.com/vi/FksYmP4Pc5g/maxresdefault.jpg')`,
            }}
          >
            <div className="absolute inset-0 hero-gradient"></div>
          </div>

          {/* YouTube iframe - scales to cover full width on mobile */}
          <div className="absolute inset-0 w-full h-full z-20">
            <iframe
              className="absolute top-1/2 left-1/2 w-[177.77vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2"
              src="https://www.youtube.com/embed/FksYmP4Pc5g?autoplay=1&mute=1&loop=1&playlist=FksYmP4Pc5g&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&cc_load_policy=0&start=1"
              title="Hero Video Background"
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

      <HomepageServicesOverview />
      <AboutApproach />

      <HomepageCTA />
      <Testimonials />
      <HomepageFinalCTA />
      <Footer />
    </div>
  );
}
