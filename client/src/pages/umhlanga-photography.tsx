import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, ChevronDown } from "lucide-react";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";
import { PhotographyNavigation } from "@/components/sections/photography-navigation";

// Hardcoded hero image and gradient settings (based on portraits page settings)
const HERO_IMAGE = "/images/hero/headshot-photography-hero.jpg";
const HERO_HEIGHT = 70; // vh

// Hardcoded gradient settings (based on current portrait page gradients)
const GRADIENTS = {
  recentWork: "linear-gradient(135deg, #676565 0%, #938a8a 50%, #717075 100%)",
  services: "linear-gradient(135deg, #5e5555 0%, #727279 50%, #4e435b 100%)",
  seo: "linear-gradient(135deg, hsl(220, 13%, 18%) 0%, hsl(220, 13%, 15%) 50%, hsl(220, 13%, 12%) 100%)"
};

export default function UmhlangaPhotography() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Umhlanga Photography | Professional Photographer in Umhlanga | SlyFox Studios</title>
      <meta name="description" content="Professional photography services in Umhlanga, Durban. Portrait photography, headshots, family photos and corporate photography at our Umhlanga studio. Book your session today." />
      <meta name="keywords" content="Umhlanga photographer, Umhlanga photography, photographer Umhlanga Durban, portrait photography Umhlanga, headshots Umhlanga, professional photographer Umhlanga, La Lucia photographer" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center"
        style={{ height: `${HERO_HEIGHT}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Professional Photography in Umhlanga by SlyFox Studios"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            Umhlanga Studio Photography
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            Professional photography studio in Umhlanga, Durban
          </h3>

          {/* Scroll Down Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const servicesElement = document.querySelector('#category-services');
                if (servicesElement) {
                  const headerOffset = 80;
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

      {/* Recent Work Section */}
      <section
        className="py-20"
        style={{ background: GRADIENTS.recentWork }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 text-white">
              Recent Studio Photography Work
            </h2>
            <h3 className="text-xl text-gray-200">
              See our latest photography from Umhlanga and surrounds
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase - uses studio classification group */}
          <CategoryFeaturedGrid
            categoryKey="studio"
            imageCount={6}
          />
        </div>
      </section>

      {/* Service Overview Section */}
      <section
        id="category-services"
        className="py-20"
        style={{ background: GRADIENTS.services }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6 text-white">
                Photography Services in Umhlanga
              </h2>
              <h3 className="text-xl mb-8 leading-relaxed text-gray-200">
                Based in La Lucia, our Umhlanga photography studio offers professional portrait, corporate and family photography services for clients across Durban North.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'Portrait photography',
                  'Executive headshots',
                  'Family portraits',
                  'Corporate photography',
                  'Personal branding',
                  'LinkedIn photos',
                  'Studio sessions',
                  'On-location shoots'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-300">
                    <div className="w-2 h-2 bg-gradient-to-r from-salmon to-cyan rounded-full mr-2 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/contact">
                <Button className="btn-salmon">
                  Book Your Session
                  <Camera className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img
                src={HERO_IMAGE}
                alt="Umhlanga Photography Studio"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <PhotographyNavigation />

      {/* SEO Content Section */}
      <section
        className="py-20"
        style={{ background: GRADIENTS.seo }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl mb-6 text-white">
              Professional Photographer in Umhlanga
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4 text-white">
                Photography Studio in Umhlanga
              </h3>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                To get a guaranteed perfect shot, sometimes you need four walls, controlled lighting, and zero chance of rain! Our Umhlanga photography studio is fully equipped for portraits, family shoots, product photography, and creative projects. Clean white, black, or colour backdrops, professional lighting rigs, and enough space for the whole fam.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4 text-white">
                Family Photography Studio Sessions
              </h3>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                Studio family photography gives you comfortable surroundings, and a controlled environment where kids can be kids without bolting into traffic. Newborns to grandparents and every age in between.
              </p>
            </div>

            <div>
              <h3 className="text-2xl mb-4 text-white">
                Book a Professional Photography Studio in Durban
              </h3>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                Looking for a photography studio in Durban for your next shoot? We offer studio sessions for portraits, headshots, family photos, and creative projects. Based in La Lucia with easy access from Durban North, Ballito, Umhlanga and surrounds. Professional setup, relaxed atmosphere, results you'll actually want to print.
              </p>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Your Umhlanga Photography Session
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
