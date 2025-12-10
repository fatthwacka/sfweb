import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Download, Camera, Video } from "lucide-react";

const additionalServices = [
  {
    icon: Camera,
    title: "Additional Hours",
    price: "R750/hour",
    description: "Extend your coverage beyond the package duration"
  },
  {
    icon: Video,
    title: "Videography Add-on",
    price: "From R3,500",
    description: "Add professional videography to any photography package"
  },
  {
    icon: Download,
    title: "Rush Delivery",
    price: "R1,500",
    description: "Get your edited photos within 48 hours"
  }
];


export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Photography & Videography Pricing Durban | SlyFox Studios</title>
      <meta name="description" content="Transparent pricing for professional photography and videography services in Durban. Wedding, corporate, portrait, and event packages available. Download our detailed price guide." />
      <meta name="keywords" content="Durban photography prices, wedding photography cost, corporate photography rates, videography pricing, photography packages South Africa" />
      
      <Navigation />
      

      {/* Service Categories */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-900/40 via-background to-indigo-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              Our Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional creative services across photography, videography, social media, and web development.
            </p>
          </div>

          <div className="pricing-cards-grid gap-6">
            {/* Photography */}
            <div className="studio-card-orange">
              <Camera className="w-12 h-12 mx-auto mb-4 text-orange-400" />
              <div className="text-center mb-8">
                <h3 className="studio-card-title-orange">Photography</h3>
                <div className="studio-card-price">R1,500</div>
                <p className="studio-card-duration">packages from R1,500</p>
              </div>

              <Link href="/photography">
                <button className="studio-card-button-orange">
                  Learn More
                </button>
              </Link>
            </div>

            {/* Videography */}
            <div className="studio-card-cyan relative">
              <Video className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
              <div className="text-center mb-8">
                <h3 className="studio-card-title-cyan">Videography</h3>
                <div className="studio-card-price">R3,500</div>
                <p className="studio-card-duration">packages from R3,500</p>
              </div>

              <Link href="/videography">
                <button className="studio-card-button-cyan">
                  Learn More
                </button>
              </Link>
            </div>

            {/* Social Media */}
            <div className="studio-card-pink">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="text-center mb-8">
                <h3 className="studio-card-title-pink">Social Media</h3>
                <div className="studio-card-price">R3,500</div>
                <p className="studio-card-duration">packages from R3,500</p>
              </div>

              <Link href="/social-media">
                <button className="studio-card-button-pink">
                  Learn More
                </button>
              </Link>
            </div>

            {/* Web & Apps */}
            <div className="studio-card-green relative">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div className="text-center mb-8">
                <h3 className="studio-card-title-green">Web & Apps</h3>
                <div className="studio-card-price">R3,500</div>
                <p className="studio-card-duration">packages from R3,500</p>
              </div>

              <Link href="/web-apps">
                <button className="studio-card-button-green">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-gradient-to-br from-emerald-900/35 via-background to-cyan-900/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-salmon">
              Additional Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enhance your package with these additional services and options.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {additionalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="bg-charcoal/80 rounded-2xl p-8 text-center hover:bg-gold/10 transition-colors duration-300">
                  <Icon className={`w-12 h-12 mx-auto mb-6 ${index % 2 === 0 ? 'icon-salmon' : 'icon-cyan'}`} />
                  <h3 className="text-xl text-gold mb-2">{service.title}</h3>
                  <div className="text-2xl mb-4">{service.price}</div>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-violet-900/35 via-background to-indigo-900/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-salmon">
            Ready to Book Your Session?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Contact us for a personalized quote or to discuss custom packages that fit your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="btn-salmon">
                Get Custom Quote
              </Button>
            </Link>
            <Button className="btn-outline-cyan">
              <Download className="w-5 h-5 mr-2 icon-cyan" />
              Download Full Price Guide
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
