import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, ChevronDown } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";
import { PricingPackagesDisplay } from "@/components/sections/pricing-packages-display";
import { useCategoryHero } from "@/hooks/use-category-heroes";

// Hardcoded defaults for SEO - crawlers see this immediately
const DEFAULT_HERO_IMAGE = "/images/services/graduation-photography.jpg";

export default function PhotographyGraduation() {
  // Fetch hero image and display settings from Supabase (falls back to defaults)
  const { heroImage, heroHeight, imageAlign } = useCategoryHero('photography', 'graduation');

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Graduation Photography Durban | SlyFox Studios</title>
      <meta name="description" content="Professional graduation photography in Durban. UKZN, DUT, and matric dance photography at our Umhlanga studio or on campus." />
      <meta name="keywords" content="graduation photography Durban, UKZN graduation photographer, DUT graduation photos, matric dance photography KZN" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center hero-section-animated"
        style={{ height: `${heroHeight}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={heroImage || DEFAULT_HERO_IMAGE}
            alt="Professional Graduation Photography by SlyFox Studios in Durban"
            className="w-full h-full object-cover"
            style={{ objectPosition: imageAlign }}
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            Professional Graduation Photography
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            Celebrate academic achievements with memorable graduation photos
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
        section="photography-graduation-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="graduation"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Recent Graduation Photography
            </h2>
            <h3 className="text-xl ">
              See our latest graduation photography work
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase */}
          <CategoryFeaturedGrid
            categoryKey="graduation"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground
        section="photography-graduation-packages"
        className="py-20"
        categoryType="photography"
        categoryName="graduation"
        categorySectionName="packages"
      >
        <PricingPackagesDisplay
          pageIdentifier="photography_graduation"
          title="Graduation Photography Packages"
          description="Professional graduation photography to commemorate your achievement"
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
        section="photography-graduation-services"
        className="py-20"
        categoryType="photography"
        categoryName="graduation"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Graduation Photography Services
              </h2>
              <h3 className="text-xl mb-8 leading-relaxed">
                Commemorate years of hard work with professional graduation portraits that capture this milestone moment in your life.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'University graduations',
                  'Matric dance photography',
                  'Individual portraits',
                  'Family group shots',
                  'Campus photography',
                  'Studio sessions',
                  'Cap and gown portraits',
                  'Quick turnaround'
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
                alt="Graduation Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section - Hardcoded for crawler visibility */}
      <GradientBackground
        section="photography-graduation-seo"
        className="py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Graduation Photography in Durban
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                Graduation Photography in Durban
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                You've put in the work, now it's time to look the part. Graduation photography captures the feeling of exuberance, along with the cap, the gown, and the look of someone who's entering a whole new life chapter. We do professional graduation shoots for matric, university, and college students across Durban and Umhlanga – in our studio or on location at your campus.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                Matric Dance Photography
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Your matric dance happens once. The dress, the suit, the entrance, and that feeling – matric dance photography freezes the moment before the night gets blurry. Studio sessions beforehand or hotel, event, or location coverage on the night.
              </p>
            </div>

            <div>
              <h3 className="text-2xl mb-4">
                University & College Graduation Portraits
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Whether you're crossing the stage at UKZN, DUT, or anywhere else in KZN, a proper graduation portrait is worth having. Professional photography, great compositions, and image quality that'll make your art lecturer drool.
              </p>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Your Graduation Session
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
