import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, ArrowRight } from "lucide-react";

const photographyCategories = [
  {
    name: "Weddings",
    slug: "weddings",
    description: "Capturing your special day with timeless elegance and emotion",
    image: "/images/portfolio/wedding-couple-1.jpg",
    features: ["Engagement sessions", "Ceremony coverage", "Reception photography", "Bridal portraits"]
  },
  {
    name: "Portraits",
    slug: "portraits",
    description: "Professional headshots and personal portraits that tell your story",
    image: "/images/portfolio/portrait-professional-1.jpg",
    features: ["Executive headshots", "Family portraits", "Personal branding", "Studio sessions"]
  },
  {
    name: "Corporate",
    slug: "corporate",
    description: "Elevate your business image with professional corporate photography",
    image: "/images/portfolio/wedding-couple-2.jpg",
    features: ["Team headshots", "Office photography", "Corporate events", "Brand documentation"]
  },
  {
    name: "Events",
    slug: "events",
    description: "Documenting memorable moments at conferences, parties, and gatherings",
    image: "/images/portfolio/portrait-professional-2.jpg",
    features: ["Conference photography", "Party coverage", "Award ceremonies", "Networking events"]
  },
  {
    name: "Products",
    slug: "products",
    description: "Showcase your products with stunning commercial photography",
    image: "/images/portfolio/wedding-couple-3.jpg",
    features: ["E-commerce photography", "Catalog shoots", "Lifestyle product shots", "360° product views"]
  },
  {
    name: "Graduation",
    slug: "graduation",
    description: "Celebrate academic achievements with memorable graduation photos",
    image: "/images/portfolio/portrait-professional-3.jpg",
    features: ["Graduation ceremonies", "Individual portraits", "Family group shots", "Campus photography"]
  }
];

export default function Photography() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Professional Photography Services Cape Town | SlyFox Studios</title>
      <meta name="description" content="Expert photography services in Cape Town including weddings, portraits, corporate, events, products, and graduation photography. Professional photographers serving South Africa." />
      <meta name="keywords" content="Cape Town photographer, wedding photography, corporate photography, portrait photography, event photography, product photography, graduation photography, professional photography South Africa" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/hero/photography-hero.jpg')` }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-6xl mb-6">
            Professional Photography
          </h1>
          <p className="script-tagline text-cyan mb-8 max-w-3xl mx-auto">
            Capturing life's beautiful moments
          </p>
          <button className="btn-primary">
            View Portfolio
          </button>
        </div>
      </section>

      {/* Photography Categories */}
      <section className="py-20 bg-gradient-to-br from-indigo-900/40 via-background to-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Our Photography <span className="text-gold">Specialties</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover our range of photography services, each tailored to capture the unique essence of your moments.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {photographyCategories.map((category, index) => (
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
                  
                  <div className="p-8">
                    <h3 className="text-2xl text-gold mb-4">{category.name}</h3>
                    <p className="text-muted-foreground mb-6">{category.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {category.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-gold rounded-full mr-2 flex-shrink-0"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center text-gold group-hover:translate-x-2 transition-transform duration-300">
                      Learn More
                      <ArrowRight className="w-5 h-5 ml-2 icon-cyan" />
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
            Ready to Capture Your Story?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your photography needs and create something beautiful together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="btn-salmon">
                Start Your Project
              </Button>
            </Link>
            <Link href="/pricing">
              <Button className="btn-outline-cyan">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
