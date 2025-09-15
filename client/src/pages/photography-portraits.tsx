import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, Check, ChevronDown } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";

export default function PhotographyPortraits() {
  const { config, isLoading } = useSiteConfig();
  
  // Get portrait photography configuration
  const portraitConfig = config?.categoryPages?.photography?.portraits;
  
  if (isLoading || !portraitConfig) {
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
      <title>{portraitConfig.seo.title}</title>
      <meta name="description" content={portraitConfig.seo.description} />
      <meta name="keywords" content={portraitConfig.seo.keywords} />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src={portraitConfig.hero.image}
            alt={portraitConfig.hero.alt || `Professional Portrait Photography by SlyFox Studios in Durban - studio portrait session with professional lighting`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6">
            {portraitConfig.hero.title}
          </h1>
          <p className="script-tagline mb-8 max-w-3xl mx-auto">
            {portraitConfig.hero.subtitle}
          </p>

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

      {/* Service Overview Section */}
      <GradientBackground
        id="category-services"
        section="services"
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="serviceOverview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                {portraitConfig.serviceOverview.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {portraitConfig.serviceOverview.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-8">
                {portraitConfig.serviceOverview.features.map((feature, index) => (
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
                src={portraitConfig.serviceOverview.image || portraitConfig.recentWork.images[0] || '/images/placeholder-gallery.jpg'}
                alt="Portrait Photography example"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Packages Section */}
      <GradientBackground 
        section="portfolio" 
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="packages"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {portraitConfig.packages.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {portraitConfig.packages.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-6">
            {portraitConfig.packages.tiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`relative group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-2xl shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02] p-8 ${
                  tier.isPopular
                    ? 'border-2 border-salmon'
                    : 'border border-border'
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-salmon to-cyan text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl mb-4">
                    {tier.name}
                  </h3>
                  <div className="text-4xl font-bold mb-2 text-gradient">{tier.price}</div>
                  <p className="text-muted-foreground">{tier.duration}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-gradient-to-r from-salmon to-cyan rounded-full mr-2 flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/contact" className="block">
                  <Button 
                    className={`w-full ${tier.isPopular ? 'btn-salmon' : 'btn-outline-cyan'}`}
                  >
                    Book Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </GradientBackground>

      {/* Recent Work Section */}
      <GradientBackground 
        section="testimonials" 
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="recentWork"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {portraitConfig.recentWork.title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {portraitConfig.recentWork.description}
            </p>
          </div>

          {/* OLD STATIC GRID - COMMENTED OUT
          {portraitConfig.recentWork.images.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {portraitConfig.recentWork.images.map((image, index) => (
                <div key={index} className="group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={image}
                      alt={`Portrait photography sample ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Gallery images will be displayed here</p>
            </div>
          )}
          */}

          {/* NEW DYNAMIC GRID */}
          <CategoryFeaturedGrid 
            categoryKey="portraits"
            imageCount={6}
          />
        </div>
      </GradientBackground>

      {/* SEO Content Section */}
      <GradientBackground 
        section="contact" 
        className="py-20"
        categoryType="photography"
        categoryName="portraits"
        categorySectionName="seoContent"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {portraitConfig.seoContent.title}
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                {portraitConfig.seoContent.content.section1.title}
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {portraitConfig.seoContent.content.section1.text}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                {portraitConfig.seoContent.content.section2.title}
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {portraitConfig.seoContent.content.section2.text}
              </p>
            </div>

            <div>
              <p className="text-xl text-muted-foreground">
                {portraitConfig.seoContent.content.conclusion}
              </p>
              
              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Your Portrait Session Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Photography Navigation Section */}
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

      <Footer />
    </div>
  );
}