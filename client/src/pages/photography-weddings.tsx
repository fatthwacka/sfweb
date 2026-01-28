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
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { useQuery } from "@tanstack/react-query";
import { getImagesByCategory } from "@/lib/classification-utils";
import { ImageUrl } from "@/lib/image-utils";
import type { Image } from "@shared/schema";

// Hardcoded defaults for SEO — crawlers see these immediately, config overrides for live viewers
const DEFAULT_HERO_IMAGE = "/images/hero/slyfox-wedding-photography-durban-kzn-hero.jpg";
const DEFAULT_HERO_TITLE = "Professional Wedding Photography";
const DEFAULT_HERO_SUBTITLE = "Capturing your special day with elegance and style";

interface Shoot {
  id: string;
  title: string;
  description?: string;
  mediaType: 'photo' | 'video';
  customSlug?: string;
  coverImageUrl?: string;
  coverVideoInfo?: {
    id: string;
    storagePath: string;
    optimizedPath?: string;
    thumbnailPath: string;
    duration?: number;
    filename: string;
  };
  isGroup?: boolean;
  groupName?: string;
  shootCount?: number;
  shoots?: Array<{
    id: string;
    title: string;
    mediaType: 'photo' | 'video';
    customSlug?: string;
  }>;
}

export default function PhotographyWeddings() {
  // Hero settings from site-config (falls back to hardcoded SEO defaults)
  const { heroImage, heroHeight, imageAlign, heroTitle, heroSubtitle } = useCategoryHero('photography', 'weddings');

  // Fetch wedding-related albums (wedding, engagement, maternity, newborn)
  const { data: recentAlbums = [], isLoading: albumsLoading } = useQuery<Shoot[]>({
    queryKey: ['portfolio', 'cards', 'wedding-related'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cards?shootTypes=wedding,engagement,maternity,newborn');
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      return response.json();
    }
  });

  // Fetch featured images for SEO section
  const { data: featuredImages } = useQuery<Image[]>({
    queryKey: ['/api/images/featured'],
    staleTime: 5 * 60 * 1000,
  });

  // Get a random wedding image for the SEO section
  const seoImage = useMemo(() => {
    if (!featuredImages) return null;
    const categoryImages = getImagesByCategory('weddings', featuredImages);
    if (categoryImages.length === 0) return null;
    return categoryImages[Math.floor(Math.random() * categoryImages.length)];
  }, [featuredImages]);

  return (
    <div data-page="weddings" className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Wedding Photography KZN | SlyFox Studios</title>
      <meta name="description" content="Capture your special day with timeless elegance and emotion. Professional wedding photography services in Durban and KZN." />
      <meta name="keywords" content="Durban wedding photographer, KZN wedding photography, wedding photography Durban, bridal photography" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center hero-section-animated"
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
        section="photography-wedding-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="weddings"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-2">
              Recent Weddings
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
          title="Wedding Packages"
          description="Choose the perfect package for your special day"
          ctaLink="/contact"
          ctaText="Book Now"
        />
      </GradientBackground>

      {/* Recent Albums Section */}
      <GradientBackground
        section="photography-wedding-albums"
        className="py-20"
        categoryType="photography"
        categoryName="weddings"
        categorySectionName="recentAlbums"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-2">
              Recent Albums
            </h2>
            <h3 className="text-xl">
              A selection of wedding, engagement, maternity and newborn galleries
            </h3>
          </div>

          {albumsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-square bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentAlbums.length > 0 ? (
            <PortfolioGrid portfolioItems={recentAlbums.slice(0, 6)} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No albums available yet</p>
            </div>
          )}

          {recentAlbums.length > 6 && (
            <div className="text-center mt-12">
              <Link href="/portfolio">
                <Button className="btn-salmon">
                  View All Galleries
                </Button>
              </Link>
            </div>
          )}
        </div>
      </GradientBackground>

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
              <h2 className="text-4xl lg:text-5xl mb-2">
                Wedding Photography
              </h2>
              <h3 className="text-xl mb-6 leading-relaxed">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Wedding Photography in KZN
              </h2>

              <div className="mb-6">
                <h3 className="text-2xl mb-3">
                  Wedding Photography That Tells Your Story
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Your wedding is just one day. The photos live forever. We capture the laughs, the tears, and every special moment that makes your day unique. From intimate elopements to full-scale celebrations, we provide professional wedding photography across Durban, Umhlanga, and KwaZulu-Natal.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl mb-3">
                  Engagement & Couples Photography
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Engagement shoots are a chance to get comfortable in front of the camera, test your chemistry with your photographer, and walk away with images worth framing. Whether it's a beach sunset, an urban backdrop, or a studio session, we'll capture the two of you at your most natural.
                </p>
              </div>

              <div>
                <h3 className="text-2xl mb-3">
                  Maternity & Newborn Photography
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  From bump to baby, these are the moments that slip by faster than you'd believe. Maternity photography captures the anticipation, newborn photography freezes those tiny fingers and milk-drunk expressions before they're gone. Studio sessions in Umhlanga or lifestyle shoots in your home.
                </p>

                <div className="mt-8">
                  <Link href="/contact">
                    <Button className="btn-salmon">
                      Book Your Wedding Photography
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
              {seoImage && (
                <img
                  src={ImageUrl.forViewing(seoImage.storagePath)}
                  alt="Wedding Photography in KZN"
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