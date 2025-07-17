import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const photographyServices = [
  "Weddings", "Portraits", "Corporate", "Events", "Products", "Graduation"
];

const videographyServices = [
  "Wedding Films", "Corporate Videos", "Events", "Product Videos", "Social Media", "Animation"
];

export function ServicesOverview() {
  return (
    <section className="py-20 bg-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-quicksand font-light mb-6">
            Our <span className="text-salmon">Services</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Photography Services */}
          <Link href="/photography">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl image-hover-effect">
                <img 
                  src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&h=600" 
                  alt="Professional photography services" 
                  className="w-full h-96 object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-3xl font-quicksand font-light mb-4 text-salmon">Photography</h3>
                  <p className="text-gray-200 mb-6">
                    Capture life's precious moments with our professional photography services. From weddings to corporate events, we create stunning visual narratives.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-sm">
                      {photographyServices.slice(0, 3).map(service => (
                        <span key={service} className="block text-salmon font-semibold">• {service}</span>
                      ))}
                    </div>
                    <div className="text-sm">
                      {photographyServices.slice(3).map(service => (
                        <span key={service} className="block text-salmon font-semibold">• {service}</span>
                      ))}
                    </div>
                  </div>

                  <div className="text-white font-barlow font-semibold hover:text-gold transition-colors duration-300 flex items-center">
                    Explore Photography
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Videography Services */}
          <Link href="/videography">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl image-hover-effect">
                <img 
                  src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&h=600" 
                  alt="Professional videography services" 
                  className="w-full h-96 object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-3xl font-quicksand font-light mb-4 text-cyan">Videography</h3>
                  <p className="text-gray-200 mb-6">
                    Bring your stories to life with cinematic videography. From wedding films to corporate content, we create compelling visual experiences.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-sm">
                      {videographyServices.slice(0, 3).map(service => (
                        <span key={service} className="block text-cyan font-semibold">• {service}</span>
                      ))}
                    </div>
                    <div className="text-sm">
                      {videographyServices.slice(3).map(service => (
                        <span key={service} className="block text-cyan font-semibold">• {service}</span>
                      ))}
                    </div>
                  </div>

                  <div className="text-white font-barlow font-semibold hover:text-gold transition-colors duration-300 flex items-center">
                    Explore Videography
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
