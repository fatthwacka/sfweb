import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";
import { photography as defaultPhotography } from "@/config/site-config";
import { HomepageServicesOverview } from "@/components/sections/homepage-services-overview";
import { HomepageCTA } from "@/components/sections/homepage-cta";
import { Testimonials } from "@/components/sections/testimonials";
import { ContactSection } from "@/components/sections/contact-section";

export default function Home() {
  const config = defaultPhotography;

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* Static SEO content - loads immediately before dynamic content */}
      <h1 className="sr-only">SlyFox Studios - Professional Photography & Videography in Durban, South Africa</h1>

      <Navigation />

      {/* Hero Section */}
      <section className="relative w-full aspect-video overflow-hidden flex items-center justify-center">
        {/* YouTube Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Placeholder cover image */}
          <div
            className="absolute inset-0 bg-cover bg-center z-10"
            style={{
              backgroundImage: `url('https://img.youtube.com/vi/m0bYSSHSvRg/maxresdefault.jpg')`,
            }}
          >
            <div className="absolute inset-0 hero-gradient"></div>
          </div>
          
          {/* YouTube iframe with 16:9 aspect ratio */}
          <div className="absolute inset-0 w-full h-full z-20">
            <iframe
              className="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2"
              src="https://www.youtube.com/embed/m0bYSSHSvRg?autoplay=1&mute=1&loop=1&playlist=m0bYSSHSvRg&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&cc_load_policy=0&start=1"
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
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            {config.hero.title}
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            {config.hero.subtitle}
          </h3>

          {/* Scroll Down Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const servicesElement = document.querySelector('#services');
                if (servicesElement) {
                  const headerOffset = 80; // Account for fixed navigation bar
                  const elementPosition = servicesElement.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className="bg-white p-2 rounded-full hover:scale-105 transform transition-all duration-300 shadow-lg cursor-pointer border-none flex items-center justify-center"
              type="button"
              style={{ width: '40px', height: '40px' }}
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      <HomepageServicesOverview />

      <HomepageCTA />
      <ContactSection />
      <Testimonials />
      <Footer />
    </div>
  );
}
