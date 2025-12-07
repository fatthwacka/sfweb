import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, Check, ChevronDown } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";
import { PricingPackagesDisplay } from "@/components/sections/pricing-packages-display";

export default function PhotographyGraduation() {
  const { config, isLoading } = useSiteConfig();
  
  // Get graduation photography configuration
  const graduationConfig = config?.categoryPages?.photography?.graduation || {
    hero: {
      title: "Professional Graduation Photography",
      subtitle: "Celebrate academic achievements with memorable graduation photos",
      image: "/images/services/graduation-photography.jpg",
      alt: "Professional Graduation Photography by SlyFox Studios"
    },
    serviceOverview: {
      title: "Graduation Photography Services",
      description: "Professional graduation photography in Durban",
      features: ["Graduation ceremonies", "Individual portraits", "Family group shots", "Campus photography"],
      image: "/images/services/graduation-photography.jpg"
    },
    packages: {
      title: "Graduation Photography Packages",
      description: "Choose the perfect package for your graduation"
    },
    recentWork: {
      title: "Recent Graduation Photography",
      description: "See our latest graduation photography work",
      images: ["/images/services/graduation-photography.jpg"]
    },
    seoContent: {
      title: "Professional Graduation Photography in Durban",
      content: {
        section1: {
          title: "Graduation Photography Services",
          text: "Professional graduation photography services in Durban"
        },
        section2: {
          title: "Why Choose SlyFox Studios",
          text: "Professional photographers with years of experience"
        },
        conclusion: "Contact us today to discuss your graduation photography needs"
      }
    },
    seo: {
      title: "Graduation Photography - SlyFox Studios",
      description: "Professional graduation photography in Durban",
      keywords: "graduation, photography, durban"
    }
  };

  if (isLoading || !graduationConfig) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>{graduationConfig.seo.title}</title>
      <meta name="description" content={graduationConfig.seo.description} />
      <meta name="keywords" content={graduationConfig.seo.keywords} />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src={graduationConfig.hero?.image || '/images/services/graduation-photography.jpg'}
            alt={graduationConfig.hero.alt || `Professional Graduation Photography by SlyFox Studios in Durban - graduation ceremony photography with academic regalia`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            {graduationConfig.hero.title}
          </h1>
          <h3 className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            {graduationConfig.hero.subtitle}
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
        section="photography-graduation-recent-work"
        className="py-20"
        categoryType="photography"
        categoryName="graduation"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {graduationConfig.recentWork.title}
            </h2>
            <h3 className="text-xl ">
              {graduationConfig.recentWork.description}
            </h3>
          </div>

          {/* NEW DYNAMIC GRID */}
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
          title={graduationConfig.packages.title || "Graduation Photography Packages"}
          description={graduationConfig.packages.description || "Professional graduation photography solutions"}
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
                {graduationConfig.serviceOverview.title}
              </h2>
              <h3 className="text-xl mb-8 leading-relaxed">
                {graduationConfig.serviceOverview.description}
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mb-8">
                {graduationConfig.serviceOverview.features.map((feature, index) => (
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
                src={graduationConfig.serviceOverview.image || graduationConfig.recentWork.images[0] || '/images/placeholder-gallery.jpg'}
                alt="Graduation Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* SEO Content Section */}
      <GradientBackground
        section="photography-graduation-seo"
        className="py-20"
        categoryType="photography"
        categoryName="graduation"
        categorySectionName="seoContent"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {graduationConfig.seoContent.title}
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                {graduationConfig.seoContent.content.section1.title}
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {graduationConfig.seoContent.content.section1.text}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                {graduationConfig.seoContent.content.section2.title}
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {graduationConfig.seoContent.content.section2.text}
              </p>
            </div>

            <div>
              <p className="text-xl text-muted-foreground">
                {graduationConfig.seoContent.content.conclusion}
              </p>
              
              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Your Graduation Photography Today
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