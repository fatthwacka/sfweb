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
const DEFAULT_HERO_IMAGE = "/images/services/portrait-photography.jpg";
const DEFAULT_HERO_TITLE = "Professional Portrait Photography";
const DEFAULT_HERO_SUBTITLE = "Headshots and personal portraits that tell your story";

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

export default function PhotographyPortraits() {
  // Hero settings from site-config (falls back to hardcoded SEO defaults)
  const { heroImage, heroHeight, imageAlign, heroTitle, heroSubtitle } = useCategoryHero('photography', 'portraits');

  // Fetch portrait-related albums (portrait, model, fashion, studio, headshot)
  const { data: recentAlbums = [], isLoading: albumsLoading } = useQuery<Shoot[]>({
    queryKey: ['portfolio', 'cards', 'portrait-related'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cards?shootTypes=portrait,model,fashion,studio,headshot');
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

  // Get a random portrait image for the SEO section
  const seoImage = useMemo(() => {
    if (!featuredImages) return null;
    const categoryImages = getImagesByCategory('portraits', featuredImages);
    if (categoryImages.length === 0) return null;
    return categoryImages[Math.floor(Math.random() * categoryImages.length)];
  }, [featuredImages]);

  return (
    <div data-page="portraits" className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Portrait Photography Durban | SlyFox Studios</title>
      <meta name="description" content="Professional portrait photography in Durban. Executive headshots, personal branding, and family portraits at our Umhlanga studio." />
      <meta name="keywords" content="portrait photography Durban, headshots Umhlanga, professional portraits KZN, personal branding photographer" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center hero-section-animated"
        style={{ height: `${heroHeight}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={heroImage || DEFAULT_HERO_IMAGE}
            alt="Professional Portrait Photography by SlyFox Studios in Durban"
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
        section="photography-portrait-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-2">
              Recent Portraits
            </h2>
            <h3 className="text-xl ">
              See our latest portrait photography work
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase */}
          <CategoryFeaturedGrid
            categoryKey="portraits"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground
        section="photography-portrait-packages"
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="packages"
      >
        <PricingPackagesDisplay
          pageIdentifier="photography_portraits"
          title="Portrait Packages"
          description="Professional portrait photography solutions for every need"
          ctaLink="/contact"
          ctaText="Book Now"
        />
      </GradientBackground>

      {/* Recent Albums Section */}
      <GradientBackground
        section="photography-portrait-albums"
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="recentAlbums"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-2">
              Recent Albums
            </h2>
            <h3 className="text-xl">
              A selection of portrait, model, fashion and headshot galleries
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
        section="photography-portrait-services"
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-2">
                Portrait Photography
              </h2>
              <h3 className="text-xl mb-6 leading-relaxed">
                From executive headshots to family portraits, we create images that capture personality and professionalism in equal measure.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'Executive headshots',
                  'Personal branding',
                  'Family portraits',
                  'Studio sessions',
                  'On-location shoots',
                  'LinkedIn profiles',
                  'Actor portfolios',
                  'Professional retouching'
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
                alt="Portrait Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section - Hardcoded for crawler visibility */}
      <GradientBackground
        section="photography-portrait-seo"
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Portrait Photography in Durban
              </h2>

              <div className="mb-6">
                <h3 className="text-2xl mb-3">
                  Portrait Photographer in Durban
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Whether you need a professional headshot, an updated profile picture, or a creative personal portrait, SlyFox delivers natural, relaxed imagery that actually looks like you. Based in Umhlanga, we shoot studio portraits and on-location sessions across Durban and KwaZulu-Natal. No stiff poses, no awkward smiles – just you at your best.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl mb-3">
                  Professional Headshots for LinkedIn & Business
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Your headshot does the talking on LinkedIn profiles, company websites, and portfolio pages. A professional profile photo builds authority, credibility, and makes your profile more memorable. Studio sessions can include multiple setups and outfit changes if needed, and give you enough quality shots to allow you to cycle through them and keep looking fresh for the next 2 years.
                </p>
              </div>

              <div>
                <h3 className="text-2xl mb-3">
                  Studio Portrait Sessions in Umhlanga
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Controlled lighting, clean backdrops, and a photographer who knows how to get the best out of your look. Our Umhlanga photography studio is set up for individual portraits, corporate headshots, and personal branding shoots.
                </p>

                <div className="mt-8">
                  <Link href="/contact">
                    <Button className="btn-salmon">
                      Book Your Portrait Session
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
              {seoImage && (
                <img
                  src={ImageUrl.forViewing(seoImage.storagePath)}
                  alt="Portrait Photography in Durban"
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
