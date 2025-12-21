import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, ChevronDown } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";
import { PricingPackagesDisplay } from "@/components/sections/pricing-packages-display";
import { PhotographyNavigation } from "@/components/sections/photography-navigation";
import { useCategoryHero } from "@/hooks/use-category-heroes";

// Hardcoded defaults for SEO - crawlers see this immediately
const DEFAULT_HERO_IMAGE = "/images/services/event-photography.jpg";

export default function PhotographyEvents() {
  // Fetch hero image and display settings from Supabase (falls back to defaults)
  const { heroImage, heroHeight, imageAlign } = useCategoryHero('photography', 'events');

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Event Photography Durban | SlyFox Studios</title>
      <meta name="description" content="Professional event photography in Durban and KZN. Conferences, parties, award ceremonies, and corporate functions captured with style." />
      <meta name="keywords" content="event photography Durban, conference photographer KZN, party photography Umhlanga, corporate event photographer" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center hero-section-animated"
        style={{ height: `${heroHeight}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={heroImage || DEFAULT_HERO_IMAGE}
            alt="Professional Event Photography by SlyFox Studios in Durban"
            className="w-full h-full object-cover"
            style={{ objectPosition: imageAlign }}
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            Professional Event Photography
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            Documenting memorable moments at conferences, parties, and gatherings
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
      <GradientBackground
        section="photography-event-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="events"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Recent Event Photography
            </h2>
            <h3 className="text-xl ">
              See our latest event photography work
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase */}
          <CategoryFeaturedGrid
            categoryKey="events"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground
        section="photography-event-packages"
        className="py-20"
        categoryType="photography"
        categoryName="events"
        categorySectionName="packages"
      >
        <PricingPackagesDisplay
          pageIdentifier="photography_events"
          title="Event Photography Packages"
          description="Professional event photography solutions for any occasion"
          ctaLink="/contact"
          ctaText="Book Now"
        />
      </GradientBackground>

      <PhotographyNavigation />

      {/* Service Overview Section - Professional Photography Services */}
      <GradientBackground
        id="category-services"
        section="photography-event-services"
        className="py-20"
        categoryType="photography"
        categoryName="events"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Event Photography Services
              </h2>
              <h3 className="text-xl mb-8 leading-relaxed">
                From intimate gatherings to large-scale corporate functions, we capture the energy and key moments of your event without getting in the way.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'Conference photography',
                  'Award ceremonies',
                  'Party coverage',
                  'Networking events',
                  'Product launches',
                  'Gala dinners',
                  'Same-day highlights',
                  'Full event documentation'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-gradient-to-r from-salmon to-cyan rounded-full mr-2 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/contact">
                <Button className="btn-salmon">
                  Get Started Today
                  <Camera className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img
                src={heroImage || DEFAULT_HERO_IMAGE}
                alt="Event Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section - Hardcoded for crawler visibility */}
      <GradientBackground
        section="photography-event-seo"
        className="py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Event Photography in Durban
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                Event Photography That Captures the Moment
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Whether it's a milestone birthday, a corporate gala, or a festival crowd losing their minds to the headline act, event photography is about being in the right place at the right time – every time. We cover events across Durban, Umhlanga, and KZN, delivering striking images that make the event and the guests look equally glamorous.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                Birthday & Party Photography
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                From intimate studio birthday shoots to roving coverage at your private celebration, we capture the cake smash, the candid laughs, and everything in between. Whether you're planning a kids' party, a 21st, or a "I stopped counting" affair, professional party photography means you get to actually enjoy your event instead of worrying about how it's going to look.
              </p>
            </div>

            <div>
              <h3 className="text-2xl mb-4">
                Festival & Corporate Event Photographers
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Music festivals, product launches, awards evenings, year-end functions – large-scale events need a photographer who can read a room and work a crowd. We deliver fast turnaround imagery for social media, press releases, and internal comms. Based in Umhlanga, available throughout KwaZulu-Natal and beyond.
              </p>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Event Photography
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}
