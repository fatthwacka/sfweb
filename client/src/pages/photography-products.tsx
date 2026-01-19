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

// Hardcoded defaults for SEO - crawlers see this immediately
const DEFAULT_HERO_IMAGE = "/images/services/product-photography.jpg";

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

export default function PhotographyProducts() {
  // Fetch hero image and display settings from Supabase (falls back to defaults)
  const { heroImage, heroHeight, imageAlign } = useCategoryHero('photography', 'products');

  // Fetch product-related albums (product, brand, commercial)
  const { data: recentAlbums = [], isLoading: albumsLoading } = useQuery<Shoot[]>({
    queryKey: ['portfolio', 'cards', 'product-related'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cards?shootTypes=product,brand,commercial');
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      return response.json();
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags - Hardcoded for crawler visibility */}
      <title>Product Photography South Africa | SlyFox Studios</title>
      <meta name="description" content="Professional product photography for e-commerce, catalogues, and marketing. Ship your products to our studio—we work with brands across South Africa and internationally." />
      <meta name="keywords" content="product photography South Africa, e-commerce photography, commercial photography Durban, catalogue photography" />

      <Navigation />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden flex items-center justify-center hero-section-animated"
        style={{ height: `${heroHeight}vh` }}
      >
        <div className="absolute inset-0">
          <img
            src={heroImage || DEFAULT_HERO_IMAGE}
            alt="Professional Product Photography by SlyFox Studios"
            className="w-full h-full object-cover"
            style={{ objectPosition: imageAlign }}
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            Products
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            Make your Brand Radiate
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
        section="photography-product-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="products"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Recent Product Photography
            </h2>
            <h3 className="text-xl ">
              See our latest product photography work
            </h3>
          </div>

          {/* Dynamic Featured Grid from Supabase */}
          <CategoryFeaturedGrid
            categoryKey="products"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground
        section="photography-product-packages"
        className="py-20"
        categoryType="photography"
        categoryName="products"
        categorySectionName="packages"
      >
        <PricingPackagesDisplay
          pageIdentifier="photography_products"
          title="Product Photography Packages"
          description="Professional product photography solutions for your brand"
          ctaLink="/contact"
          ctaText="Book Now"
        />
      </GradientBackground>

      {/* Recent Albums Section */}
      <GradientBackground
        section="photography-product-albums"
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Recent Albums
            </h2>
            <h3 className="text-xl text-muted-foreground">
              A selection of product, brand and commercial galleries
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

      <PhotographyNavigation />

      {/* Service Overview Section - Professional Photography Services */}
      <GradientBackground
        id="category-services"
        section="photography-product-services"
        className="py-20"
        categoryType="photography"
        categoryName="products"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                Product Photography Services
              </h2>
              <h3 className="text-xl mb-8 leading-relaxed">
                From clean white-background e-commerce shots to lifestyle imagery that tells your brand's story, we create images that convert browsers into buyers.
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  'E-commerce photography',
                  'Lifestyle product shots',
                  'Catalogue shoots',
                  '360° product views',
                  'White background',
                  'Creative styling',
                  'Bulk product shoots',
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
                alt="Product Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section - Hardcoded for crawler visibility */}
      <GradientBackground
        section="photography-product-seo"
        className="py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Professional Product Photography
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4 h3-white">
                Product Photography That Sells
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Your product deserves more than a smartphone snap against a bedsheet. Professional product photography is the difference between a scroll-past and a sale. SlyFox delivers clean, consistent imagery for ecommerce listings, catalogues, and marketing campaigns – whether you're shipping from Cape Town, London, or Los Angeles. Send us your products, we'll send back images that convert.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4 h3-white">
                Ecommerce Photography for Online Stores That Convert
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Brand photography tells your story without saying a word. From lifestyle shoots that capture your product in context to crisp white-background images for Amazon, Takealot, or your own online store, we handle everything from ecommerce product photography, packshot photography, and creative commercial shoots – all under one roof in our Umhlanga studio.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4 h3-white">
                Packshot & Catalogue Photography
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Ship your products to our Durban studio, brief us on the look you're after, and we'll handle the rest. Flat lays, 360-degree spins, lifestyle compositions, ghost mannequin apparel shots, and glossy magazine-ready advertising images – whatever your catalogue or print campaign needs.
              </p>
            </div>

            <div>
              <h3 className="text-2xl mb-4 h3-white">
                Flexible for Any Product Type
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Jewellery, cosmetics, food, electronics, clothing—we've photographed it all. Our studio is equipped for everything from tiny detailed items to large ornaments and pieces. Need consistent imagery across hundreds of SKUs for your online store? We've developed efficient workflows that maintain quality at scale.
              </p>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Get a Product Photography Quote
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
