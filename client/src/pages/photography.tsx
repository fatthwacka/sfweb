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
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Engagement sessions", "Ceremony coverage", "Reception photography", "Bridal portraits"]
  },
  {
    name: "Portraits",
    slug: "portraits",
    description: "Professional headshots and personal portraits that tell your story",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Executive headshots", "Family portraits", "Personal branding", "Studio sessions"]
  },
  {
    name: "Corporate",
    slug: "corporate",
    description: "Elevate your business image with professional corporate photography",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Team headshots", "Office photography", "Corporate events", "Brand documentation"]
  },
  {
    name: "Events",
    slug: "events",
    description: "Documenting memorable moments at conferences, parties, and gatherings",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Conference photography", "Party coverage", "Award ceremonies", "Networking events"]
  },
  {
    name: "Products",
    slug: "products",
    description: "Showcase your products with stunning commercial photography",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["E-commerce photography", "Catalog shoots", "Lifestyle product shots", "360° product views"]
  },
  {
    name: "Graduation",
    slug: "graduation",
    description: "Celebrate academic achievements with memorable graduation photos",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    features: ["Graduation ceremonies", "Individual portraits", "Family group shots", "Campus photography"]
  }
];

export default function Photography() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>Professional Photography Services Cape Town | SlyFox Studios</title>
      <meta name="description" content="Expert photography services in Cape Town including weddings, portraits, corporate, events, products, and graduation photography. Professional photographers serving South Africa." />
      <meta name="keywords" content="Cape Town photographer, wedding photography, corporate photography, portrait photography, event photography, product photography, graduation photography, professional photography South Africa" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <Camera className="w-16 h-16 text-gold" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-righteous mb-6">
              Professional Photography
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              From intimate moments to grand celebrations, our photography services capture the essence of every occasion with artistic vision and technical excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
                View Portfolio
              </Button>
              <Link href="/contact">
                <Button variant="outline" className="border-2 border-gold text-gold px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-300">
                  Get Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Photography Categories */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              Our Photography <span className="text-gold">Specialties</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover our range of photography services, each tailored to capture the unique essence of your moments.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {photographyCategories.map((category, index) => (
              <Link key={category.slug} href={`/photography/${category.slug}`}>
                <div className="group cursor-pointer bg-black rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={category.image}
                      alt={`${category.name} photography services`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-saira font-bold text-gold mb-4">{category.name}</h3>
                    <p className="text-muted-foreground mb-6">{category.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {category.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-gold rounded-full mr-2 flex-shrink-0"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center text-gold font-barlow font-semibold group-hover:translate-x-2 transition-transform duration-300">
                      Learn More
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-saira font-black mb-6">
            Ready to Capture Your <span className="text-gold">Story?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your photography needs and create something beautiful together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
                Start Your Project
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-2 border-white text-white px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-white hover:text-black transition-all duration-300">
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
