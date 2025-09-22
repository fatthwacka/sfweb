import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, ArrowRight, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { photography as defaultPhotography } from "@/config/site-config";
import { CategoryNavigation } from "@/components/common/category-navigation";

// Fallback configuration in case import fails
const fallbackPhotography = {
  hero: {
    title: "Professional Photography",
    subtitle: "Capturing life's beautiful moments",
    backgroundImage: "/images/hero/photography-hero.jpg",
    overlayOpacity: 0.5
  },
  sections: {
    intro: {
      title: "Professional Photography",
      subtitle: "Discover our range of photography services, each tailored to capture the unique essence of your moments."
    },
    callToAction: {
      title: "Ready to Capture Your Story?",
      subtitle: "Let's discuss your photography needs and create something beautiful together.",
      primaryButton: {
        text: "Start Your Project",
        link: "/contact"
      },
      secondaryButton: {
        text: "View Pricing",
        link: "/pricing"
      }
    }
  },
  categories: [
    {
      name: "Weddings & Maternity",
      slug: "weddings",
      description: "Captured with timeless elegance",
      image: "/images/hero/wedding-photography-hero.jpg",
      features: ["Weddings", "Engagements", "Maternity", "Newborn"]
    },
    {
      name: "Portraits & Headshots",
      slug: "portraits", 
      description: "Glossy magazine grade portraits",
      image: "/images/hero/portrait-photography-hero.jpg",
      features: ["Portraits", "Studio", "Headshots", "Family"]
    },
    {
      name: "Products & Brands",
      slug: "products",
      description: "Stunning commercial photography",
      image: "/images/hero/product-photography-hero.jpg", 
      features: ["Product Hero", "Catalog", "Lifestyle", "Ecommerce"]
    },
    {
      name: "Events & Functions",
      slug: "events",
      description: "Capturing memorable moments", 
      image: "/images/hero/Event-photography-hero.jpg",
      features: ["Conferences", "Music Festivals", "Birthdays", "Parties"]
    },
    {
      name: "Corporate & Business", 
      slug: "corporate",
      description: "Elevate your business profile",
      image: "/images/hero/corporate-photography-hero.jpg",
      features: ["Headshots", "Team building", "Offices", "Events"]
    },
    {
      name: "Graduation",
      slug: "graduation",
      description: "Academic graduation photos",
      image: "/images/hero/graduation-photography-hero.jpg", 
      features: ["Matric Dances", "Graduation", "University", "College"]
    }
  ]
};

export default function Photography() {
  // Fetch photography configuration
  const { data: photographyConfig, isLoading, error } = useQuery({
    queryKey: ["/api/site-config/photography"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/site-config/photography");
        return response;
      } catch (error) {
        console.log("No custom photography config found, using defaults");
        return defaultPhotography || fallbackPhotography;
      }
    }
  });

  const config = photographyConfig || defaultPhotography || fallbackPhotography;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Loading...</div>
          <div className="text-muted-foreground">Preparing photography content</div>
        </div>
      </div>
    );
  }

  // Ensure config has required structure
  if (!config || !config.hero || !config.sections || !config.categories) {
    console.error("Invalid photography configuration:", config);
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2 text-red-400">Configuration Error</div>
          <div className="text-muted-foreground">Photography settings are not properly configured</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Professional Photography Services Durban | SlyFox Studios</title>
      <meta
        name="description"
        content="Expert photography services in Durban including weddings, portraits, corporate, events, products, and graduation photography. Professional photographers serving South Africa."
      />
      <meta
        name="keywords"
        content="Durban photographer, wedding photography, corporate photography, portrait photography, event photography, product photography, graduation photography, professional photography South Africa"
      />

      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${config.hero.backgroundImage}')`,
          }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6">
            {config.hero.title}
          </h1>
          <p className="script-tagline mb-8 max-w-3xl mx-auto">
            {config.hero.subtitle}
          </p>

          {/* Scroll Down Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const servicesElement = document.querySelector('#photography-services');
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

      {/* Photography Categories */}
      <section id="photography-services" className="py-20 bg-gradient-to-br from-indigo-900/40 via-background to-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Our <span>Photography Services</span>
            </h2>
            <h3 className="text-xl max-w-3xl mx-auto">
              Discover our range of photography services, each tailored to capture the unique essence of your moments.
            </h3>
          </div>

          {/* Quick Navigation */}
          <CategoryNavigation 
            categories={[
              { name: "Weddings & Maternity", slug: "weddings", shortName: "Weddings" },
              { name: "Portraits & Headshots", slug: "portraits", shortName: "Portraits" },
              { name: "Products & Brands", slug: "products", shortName: "Products" },
              { name: "Events & Functions", slug: "events", shortName: "Events" },
              { name: "Corporate & Business", slug: "corporate", shortName: "Corporate" },
              { name: "Graduation", slug: "graduation", shortName: "Graduation" }
            ]}
            basePath="photography"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Weddings & Maternity",
                slug: "weddings",
                description: "Captured with timeless elegance",
                image: "/images/hero/wedding-photography-hero.jpg",
                features: ["Weddings", "Engagements", "Maternity", "Newborn"]
              },
              {
                name: "Portraits & Headshots",
                slug: "portraits",
                description: "Glossy magazine grade portraits",
                image: "/images/hero/portrait-photography-hero.jpg",
                features: ["Portraits", "Studio", "Headshots", "Family"]
              },
              {
                name: "Products & Brands",
                slug: "products",
                description: "Stunning commercial photography",
                image: "/images/hero/product-photography-hero.jpg",
                features: ["Product Hero", "Catalog", "Lifestyle", "Ecommerce"]
              },
              {
                name: "Events & Functions",
                slug: "events",
                description: "Capturing memorable moments",
                image: "/images/hero/Event-photography-hero.jpg",
                features: ["Conferences", "Music Festivals", "Birthdays", "Parties"]
              },
              {
                name: "Corporate & Business",
                slug: "corporate",
                description: "Elevate your business profile",
                image: "/images/hero/corporate-photography-hero.jpg",
                features: ["Headshots", "Team building", "Offices", "Events"]
              },
              {
                name: "Graduation",
                slug: "graduation",
                description: "Academic graduation photos",
                image: "/images/hero/graduation-photography-hero.jpg",
                features: ["Matric Dances", "Graduation", "University", "College"]
              }
            ].map((category, index) => (
              <Link key={category.slug} href={`/photography/${category.slug}`}>
                <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={category.image}
                      alt={`${category.name} photography services`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  </div>

                  <div className="p-8 pb-6">
                    <h3 className="text-2xl text-gold mb-4">{category.name}</h3>
                    <p className="text-muted-foreground mb-4">
                      {category.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {category.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 bullet-point-accent"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-emerald-900/30 via-background to-cyan-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-salmon">
            {config.sections.callToAction.title}
          </h2>
          <h3 className="text-xl mb-8">
            {config.sections.callToAction.subtitle}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={config.sections.callToAction.primaryButton.link}>
              <Button className="btn-salmon">{config.sections.callToAction.primaryButton.text}</Button>
            </Link>
            <Link href={config.sections.callToAction.secondaryButton.link}>
              <Button className="btn-outline-cyan">{config.sections.callToAction.secondaryButton.text}</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
