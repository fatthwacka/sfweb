import { useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { getImagesByCategory } from "@/lib/classification-utils";
import { ImageUrl } from "@/lib/image-utils";
import type { Image } from "@shared/schema";

// Hardcoded defaults for SEO — crawlers see these immediately, config overrides for live viewers
const DEFAULT_HERO_IMAGE = "/images/services/corporate-photography.jpg";
const DEFAULT_HERO_TITLE = "Professional Corporate Photography";
const DEFAULT_HERO_SUBTITLE = "Elevate your business image with professional photography";

export default function PhotographyCorporate() {
  // Hero settings from site-config (falls back to hardcoded SEO defaults)
  const { heroImage, heroHeight, imageAlign, heroTitle, heroSubtitle } = useCategoryHero('photography', 'corporate');

  // Fetch featured images for SEO section
  const { data: featuredImages } = useQuery<Image[]>({
    queryKey: ['/api/images/featured'],
    staleTime: 5 * 60 * 1000,
  });

  // Get a random corporate image for the SEO section
  const seoImage = useMemo(() => {
    if (!featuredImages) return null;
    const categoryImages = getImagesByCategory('corporate', featuredImages);
    if (categoryImages.length === 0) return null;
    return categoryImages[Math.floor(Math.random() * categoryImages.length)];
  }, [featuredImages]);

  return (
    <div data-page="corporate" className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Corporate Photography Durban | SlyFox Studios</title>
      <meta name="description" content="Professional corporate photography in Durban. Executive headshots, team photos, and business imagery at your offices or our Umhlanga studio." />
      <meta name="keywords" content="corporate photography Durban, business headshots KZN, executive portraits Umhlanga, team photography South Africa" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center hero-section-animated"
        style={{ height: `${heroHeight}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={heroImage || DEFAULT_HERO_IMAGE}
            alt="Professional Corporate Photography by SlyFox Studios in Durban"
            className="w-full h-full object-cover"
            style={{ objectPosition: imageAlign }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            {heroTitle || DEFAULT_HERO_TITLE}
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            {heroSubtitle || DEFAULT_HERO_SUBTITLE}
          </h3>

          {/* Scroll Down Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Scroll past the hero to the next section, accounting for nav bar
                const heroSection = document.querySelector('.hero-section-animated');
                if (heroSection) {
                  const headerOffset = 80;
                  const heroBottom = heroSection.getBoundingClientRect().bottom + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: heroBottom, behavior: 'smooth' });
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
        section="photography-corporate-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="corporate"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-2">
              Recent Corporate
            </h2>
            <h3 className="text-xl ">
              See our latest corporate photography work
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase */}
          <CategoryFeaturedGrid
            categoryKey="corporate"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground
        section="photography-corporate-packages"
        className="py-20"
        categoryType="photography"
        categoryName="corporate"
        categorySectionName="packages"
      >
        <PricingPackagesDisplay
          pageIdentifier="photography_corporate"
          title="Corporate Packages"
          description="Professional corporate photography solutions for your business"
          ctaLink="/contact"
          ctaText="Book Now"
        />
      </GradientBackground>

      {/* Service Overview Section - Professional Photography Services */}
      <GradientBackground
        id="category-services"
        section="photography-corporate-services"
        className="py-20"
        categoryType="photography"
        categoryName="corporate"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-2">
                Corporate Photography
              </h2>
              <h3 className="text-xl mb-6 leading-relaxed">
                Professional business imagery that reflects your company's values and professionalism, from executive headshots to full team documentation.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'Executive headshots',
                  'Team photography',
                  'Office environments',
                  'Corporate events',
                  'Annual report imagery',
                  'On-site sessions',
                  'Studio sessions',
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
                alt="Corporate Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section - Hardcoded for crawler visibility */}
      <GradientBackground
        section="photography-corporate-seo"
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Corporate Photography in Durban
              </h2>

              <div className="mb-6">
                <h3 className="text-2xl mb-3">
                  Corporate Photography for Businesses That Mean Business
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  First impressions count, and your website is shaking hands before you ever get the chance. Professional corporate photography builds trust, credibility, and brand recognition – whether it's headquarters photos, headshots for your leadership team or behind-the-scenes content that shows the humans behind the logo.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl mb-3">
                  Professional Headshots & Team Photos
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  LinkedIn profiles, company websites, email signatures – your face is everywhere, so it might as well look good. We shoot professional headshots and team photography in our Umhlanga studio or on-location at your offices. Consistent lighting, clean backgrounds, and a relaxed process that even your camera-shy staff will survive. Serving businesses around Umhlanga and Durban northern suburbs.
                </p>
              </div>

              <div>
                <h3 className="text-2xl mb-3">
                  Team Building & Corporate Event Photography
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Away days, conferences, product launches, team building, and office braais – corporate event photography captures the culture you're building.
                </p>

                <div className="mt-8">
                  <Link href="/contact">
                    <Button className="btn-salmon">
                      Book Your Corporate Session
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
              {seoImage && (
                <img
                  src={ImageUrl.forViewing(seoImage.storagePath)}
                  alt="Corporate Photography in Durban"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </GradientBackground>

      <PhotographyNavigation />

      <Footer />
    </div>
  );
}
