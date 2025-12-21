import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/common/gradient-background";

export function HomepageCTA() {
  // Homepage-specific services data
  const services = [
    {
      id: "photography-service",
      title: "Photography",
      description: "Professional photography for portraits, weddings, products and events.",
      image: "/uploads/slyfox-pro-studio-lighting.jpg",
      ctaText: "Explore Photography",
      color: "salmon",
      link: "/photography"
    },
    {
      id: "videography-service",
      title: "Videography",
      description: "Stunning videography for festivals, weddings, products, and corporates.",
      image: "/uploads/wedding-videography-hero_1756052522344.jpg",
      ctaText: "Explore Videography",
      color: "cyan",
      link: "/videography"
    },
    {
      id: "social-media-service",
      title: "Social Media",
      description: "Professional social media content production and channel management.",
      image: "/uploads/mobile-app_1756725379717.jpg",
      ctaText: "Explore Service",
      color: "salmon",
      link: "/social-media"
    },
    {
      id: "web-apps-service",
      title: "Web & Apps",
      description: "Slick Websites, Apps and Ai automations that help your business",
      image: "/uploads/Slyfox-Ai-Automation-and-AppDev-02_1757855053671.jpg",
      ctaText: "Explore Service",
      color: "salmon",
      link: "/web-apps"
    }
  ];

  return (
    <GradientBackground section="contact" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-salmon font-light">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let's discuss your vision and create something extraordinary together.
          </p>
          <Link href="/contact">
            <Button size="lg" className="btn-salmon text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            return (
              <Link key={service.id} href={service.link}>
                <div className="group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-xl overflow-hidden shadow-lg hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02] h-full">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={service.image}
                      alt={`${service.title} services`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-2xl text-white mb-3 font-light">{service.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{service.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </GradientBackground>
  );
}