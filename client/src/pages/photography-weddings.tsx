import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, Check, ChevronDown } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";
import { PricingPackagesDisplay } from "@/components/sections/pricing-packages-display";
import { useCategoryHero } from "@/hooks/use-category-heroes";

// Hardcoded defaults for SEO - crawlers see this immediately
const DEFAULT_HERO_IMAGE = "/images/services/wedding-photography.jpg";

export default function PhotographyWeddings() {
  // Fetch hero image and display settings from Supabase (falls back to defaults)
  const { heroImage, heroHeight, imageAlign } = useCategoryHero('photography', 'weddings');

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Wedding Photography KZN | SlyFox Studios</title>
      <meta name="description" content="Capture your special day with timeless elegance and emotion. Professional wedding photography services in Durban and KZN." />
      <meta name="keywords" content="Durban wedding photographer, KZN wedding photography, wedding photography Durban, bridal photography" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center"
        style={{ height: `${heroHeight}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={heroImage || DEFAULT_HERO_IMAGE}
            alt="Professional Wedding Photography by SlyFox Studios in Durban"
            className="w-full h-full object-cover"
            style={{ objectPosition: imageAlign }}
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            Professional Wedding Photography
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            Capturing your special day with elegance and style
          </h3>

          {/* Scroll Down Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const servicesElement = document.querySelector('#category-services');
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

      {/* Recent Work Section */}
      <GradientBackground
        section="photography-wedding-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="weddings"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Recent Wedding Photography
            </h2>
            <h3 className="text-xl ">
              See our latest wedding photography work
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase */}
          <CategoryFeaturedGrid
            categoryKey="weddings"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground
        section="photography-wedding-packages"
        className="py-20"
      >
        <PricingPackagesDisplay
          pageIdentifier="photography_weddings"
          title="Wedding Photography Packages"
          description="Choose the perfect package for your special day"
          ctaLink="/contact"
          ctaText="Book Now"
        />
      </GradientBackground>

      {/* Photography Navigation Section - Explore Our Photography Services */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-700 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl mb-4 text-white">
              Explore Our Photography Services
            </h2>
            <p className="text-lg text-gray-300">
              Professional photography for every special occasion
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'weddings', title: 'Weddings', subtitle: 'Capturing your special day', image: '/images/services/wedding-photography.jpg' },
              { name: 'portraits', title: 'Portraits', subtitle: 'Headshots & portraits', image: '/images/services/portrait-photography.jpg' },
              { name: 'corporate', title: 'Corporate', subtitle: 'Studio and On-site', image: '/images/services/corporate-photography.jpg' },
              { name: 'events', title: 'Events', subtitle: 'Festivals & Celebrations', image: '/images/services/event-photography.jpg' },
              { name: 'products', title: 'Products', subtitle: 'Brand & Product shots', image: '/images/services/product-photography.jpg' },
              { name: 'graduation', title: 'Graduation', subtitle: 'Graduation & Matric dance', image: '/images/services/graduation-photography.jpg' }
            ].map((categoryItem) => (
              <Link key={categoryItem.name} href={`/photography/${categoryItem.name}`}>
                <div className="group cursor-pointer bg-slate-800/60 rounded-lg overflow-hidden hover:bg-slate-700/60 transition-all duration-300 hover:scale-105">
                  <div className="aspect-square bg-gray-700/50 relative overflow-hidden">
                    <img 
                      src={categoryItem.image} 
                      alt={categoryItem.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-salmon transition-colors">
                      {categoryItem.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-tight">
                      {categoryItem.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Service Overview Section - Professional Photography Services */}
      <GradientBackground
        id="category-services"
        section="photography-wedding-services"
        className="py-20"
        categoryType="photography"
        categoryName="weddings"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Professional Wedding Photography Services
              </h2>
              <h3 className="text-xl mb-8 leading-relaxed">
                From intimate ceremonies to grand celebrations, we capture every meaningful moment of your special day with artistry and discretion.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'Full day coverage',
                  'Second photographer option',
                  'Engagement sessions',
                  'High-resolution digital files',
                  'Online gallery delivery',
                  'Professional editing',
                  'Album design services',
                  'Print packages available'
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
                alt="Wedding Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section - Hardcoded for crawler visibility */}
      <GradientBackground
        section="photography-wedding-seo"
        className="py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Wedding Photography in KZN
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                Your Story, Beautifully Told
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Every wedding has its own rhythm—the nervous laughter before the ceremony, the tears during the vows, the chaos of the dance floor at midnight. Based in Durban, we've spent years learning to anticipate these moments and capture them naturally. Whether you're planning an intimate Umhlanga beach ceremony or a grand celebration in the KZN Midlands, we're there to document it all without getting in the way.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                What We Offer
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Our packages range from half-day coverage for smaller ceremonies to full weekend documentation for destination weddings. Every booking includes professionally edited images delivered in an online gallery, with options for engagement sessions, albums, and prints. We're happy to tailor something specific to your plans.
              </p>
            </div>

            <div>
              <p className="text-xl text-muted-foreground">
                If you're getting married in Durban, the KZN coast, or the Midlands, we'd love to hear about your day. Get in touch and let's talk about how we can help you remember it.
              </p>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Your Wedding Photography
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