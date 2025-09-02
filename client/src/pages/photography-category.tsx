import { useParams } from "wouter";
import { useEffect } from "react";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { GradientBackground } from "@/components/common/gradient-background";
import { CategoryFeaturedGrid } from "@/components/shared/category-featured-grid";

export default function PhotographyCategory() {
  const params = useParams();
  const category = params.category;
  
  const { config, isLoading } = useSiteConfig();
  
  // Handle hash navigation on page load
  useEffect(() => {
    if (window.location.hash === '#pricing') {
      // Small delay to ensure page is rendered
      setTimeout(() => {
        const element = document.getElementById('pricing');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);
  
  // Get category configuration from unified site config
  const categoryConfig = config?.categoryPages?.photography?.[category || 'weddings'] || {
    hero: {
      image: '/images/hero/wedding-photography-hero.jpg',
      title: `Professional ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Wedding'} Photography`,
      subtitle: 'Capturing your special moments with artistic vision and technical excellence',
      ctaText: 'Book Session'
    },
    serviceOverview: { 
      title: 'Our Photography Services', 
      description: 'Professional photography services tailored to your needs', 
      features: ['Professional Equipment', 'Experienced Photographers', 'High-Quality Results', 'Timely Delivery'] 
    },
    packages: { 
      title: 'Photography Packages', 
      description: 'Choose the perfect package for your needs', 
      tiers: [] 
    },
    recentWork: { 
      title: 'Recent Work', 
      description: 'View our latest photography portfolio', 
      images: [] 
    },
    seoContent: { 
      title: `Professional ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Wedding'} Photography Services`,
      content: { 
        section1: { 
          title: 'Our Photography Expertise', 
          text: 'We specialize in capturing life\'s most precious moments with artistic vision and technical excellence. Our experienced photographers use professional-grade equipment to deliver stunning results that you\'ll treasure forever.' 
        },
        section2: { 
          title: 'Our Photography Process', 
          text: 'From initial consultation to final delivery, we work closely with our clients to understand their vision and exceed their expectations. We believe in creating a comfortable, enjoyable experience while capturing authentic moments.' 
        },
        conclusion: 'Ready to capture your special moments? Contact us today to discuss your photography needs and book your session.'
      }
    },
    seo: { 
      title: `Professional ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Wedding'} Photography | SlyFox Studios`, 
      description: `Professional ${category || 'wedding'} photography services. Capturing your special moments with artistic vision and technical excellence.`, 
      keywords: `${category || 'wedding'} photography, professional photographer, photography services, ${category || 'wedding'} photos` 
    }
  };
  
  
  if (!category) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl mb-4">Category Not Found</h1>
          <p className="text-xl mb-8">The photography category you're looking for doesn't exist.</p>
          <Link href="/photography">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Photography
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
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
      <title>{categoryConfig.seo.title}</title>
      <meta name="description" content={categoryConfig.seo.description} />
      <meta name="keywords" content={categoryConfig.seo.keywords} />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${categoryConfig.hero.image}')` }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-7xl font-light tracking-wide mb-6 text-white">
            {categoryConfig.hero.title}
          </h1>
          <p className="script-tagline mb-8 max-w-3xl mx-auto text-xl text-gray-200">
            {categoryConfig.hero.subtitle}
          </p>
          <Link href='/contact'>
            <Button className="btn-primary px-8 py-3 text-lg">
              {categoryConfig.hero.ctaText}
            </Button>
          </Link>
        </div>
      </section>

      {/* Service Overview Section */}
      <section className="py-20 relative" style={{
        background: categoryConfig.serviceOverview.gradients ? 
          `linear-gradient(${categoryConfig.serviceOverview.gradients.direction}, ${categoryConfig.serviceOverview.gradients.startColor} 0%, ${categoryConfig.serviceOverview.gradients.middleColor} 50%, ${categoryConfig.serviceOverview.gradients.endColor} 100%)` :
          'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)',
        '--services-text-primary': categoryConfig.serviceOverview.gradients?.textColors?.primary || '#ffffff',
        '--services-text-secondary': categoryConfig.serviceOverview.gradients?.textColors?.secondary || '#e2e8f0', 
        '--services-text-tertiary': categoryConfig.serviceOverview.gradients?.textColors?.tertiary || '#94a3b8'
      } as React.CSSProperties} data-gradient-section="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl mb-6">
                {categoryConfig.serviceOverview.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {categoryConfig.serviceOverview.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-8">
                {categoryConfig.serviceOverview.features.map((feature, index) => (
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
                src={categoryConfig.recentWork.images[0] || '/images/placeholder-gallery.jpg'}
                alt={`${categoryConfig.hero.title} example`}
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="pricing" className="py-20 relative scroll-mt-20" style={{
        background: categoryConfig.packages.gradients ? 
          `linear-gradient(${categoryConfig.packages.gradients.direction}, ${categoryConfig.packages.gradients.startColor} 0%, ${categoryConfig.packages.gradients.middleColor} 50%, ${categoryConfig.packages.gradients.endColor} 100%)` :
          'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)',
        '--portfolio-text-primary': categoryConfig.packages.gradients?.textColors?.primary || '#ffffff',
        '--portfolio-text-secondary': categoryConfig.packages.gradients?.textColors?.secondary || '#e2e8f0', 
        '--portfolio-text-tertiary': categoryConfig.packages.gradients?.textColors?.tertiary || '#94a3b8'
      } as React.CSSProperties} data-gradient-section="portfolio">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {categoryConfig.packages.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {categoryConfig.packages.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categoryConfig.packages.tiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02] p-8 ${
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
      </section>

      {/* Recent Work Section */}
      <section className="py-20 relative" style={{
        background: categoryConfig.recentWork.gradients ? 
          `linear-gradient(${categoryConfig.recentWork.gradients.direction}, ${categoryConfig.recentWork.gradients.startColor} 0%, ${categoryConfig.recentWork.gradients.middleColor} 50%, ${categoryConfig.recentWork.gradients.endColor} 100%)` :
          'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)',
        '--testimonials-text-primary': categoryConfig.recentWork.gradients?.textColors?.primary || '#ffffff',
        '--testimonials-text-secondary': categoryConfig.recentWork.gradients?.textColors?.secondary || '#e2e8f0', 
        '--testimonials-text-tertiary': categoryConfig.recentWork.gradients?.textColors?.tertiary || '#94a3b8'
      } as React.CSSProperties} data-gradient-section="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {categoryConfig.recentWork.title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {categoryConfig.recentWork.description}
            </p>
          </div>

          <CategoryFeaturedGrid 
            classification={category || 'wedding'}
            imageCount={6}
          />
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-20 relative" style={{
        background: categoryConfig.seoContent.gradients ? 
          `linear-gradient(${categoryConfig.seoContent.gradients.direction}, ${categoryConfig.seoContent.gradients.startColor} 0%, ${categoryConfig.seoContent.gradients.middleColor} 50%, ${categoryConfig.seoContent.gradients.endColor} 100%)` :
          'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)',
        '--contact-text-primary': categoryConfig.seoContent.gradients?.textColors?.primary || '#ffffff',
        '--contact-text-secondary': categoryConfig.seoContent.gradients?.textColors?.secondary || '#e2e8f0', 
        '--contact-text-tertiary': categoryConfig.seoContent.gradients?.textColors?.tertiary || '#94a3b8'
      } as React.CSSProperties} data-gradient-section="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              {categoryConfig.seoContent.title}
            </h2>
          </div>

          <div className="max-w-none">
            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                {categoryConfig.seoContent.content.section1.title}
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {categoryConfig.seoContent.content.section1.text}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl mb-4">
                {categoryConfig.seoContent.content.section2.title}
              </h3>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {categoryConfig.seoContent.content.section2.text}
              </p>
            </div>

            <div>
              <p className="text-xl text-muted-foreground">
                {categoryConfig.seoContent.content.conclusion}
              </p>
              
              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Book Your Session Today
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