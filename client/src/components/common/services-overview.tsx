import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ServicesOverview() {
  return (
    <section className="py-20 bg-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
            Our <span className="text-gold">Services</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Photography Services */}
          <Link href="/photography">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl image-hover-effect">
                <img 
                  src="/images/services/photography-service-showcase.jpg" 
                  alt="Professional photography services" 
                  className="w-full h-96 object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-3xl font-saira font-bold mb-4 text-gold">Photography</h3>
                  <p className="text-gray-200 mb-6">
                    Capture life's precious moments with our professional photography services. From weddings to corporate events, we create stunning visual narratives.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-sm">
                      <span className="block text-gold font-semibold">• Weddings</span>
                      <span className="block text-gold font-semibold">• Portraits</span>
                      <span className="block text-gold font-semibold">• Corporate</span>
                    </div>
                    <div className="text-sm">
                      <span className="block text-gold font-semibold">• Events</span>
                      <span className="block text-gold font-semibold">• Products</span>
                      <span className="block text-gold font-semibold">• Graduation</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-white font-barlow font-semibold hover:text-gold transition-colors duration-300">
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
                  src="/images/services/photography-service-showcase.jpg" 
                  alt="Professional videography services" 
                  className="w-full h-96 object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-3xl font-saira font-bold mb-4 text-gold">Videography</h3>
                  <p className="text-gray-200 mb-6">
                    Bring your stories to life with cinematic videography. From wedding films to corporate content, we create compelling visual experiences.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-sm">
                      <span className="block text-gold font-semibold">• Wedding Films</span>
                      <span className="block text-gold font-semibold">• Corporate Videos</span>
                      <span className="block text-gold font-semibold">• Events</span>
                    </div>
                    <div className="text-sm">
                      <span className="block text-gold font-semibold">• Product Videos</span>
                      <span className="block text-gold font-semibold">• Social Media</span>
                      <span className="block text-gold font-semibold">• Animation</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-white font-barlow font-semibold hover:text-gold transition-colors duration-300">
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
