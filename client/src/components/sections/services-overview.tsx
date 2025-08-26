import { Link } from "wouter";
import { ArrowRight, Camera, Video } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";

export function ServicesOverview() {
  const { config, isLoading } = useSiteConfig();
  
  // Get services from config - prioritize new dynamic services format, fallback to old format
  const dynamicServices = config?.home?.servicesOverview?.services || [];
  
  // Fallback services for backward compatibility
  const fallbackServices = [];
  
  if (config?.home?.servicesOverview?.photography) {
    fallbackServices.push({
      id: 'photography',
      title: config.home.servicesOverview.photography.title || 'Photography',
      description: config.home.servicesOverview.photography.description || 'Capture life\'s precious moments with our professional photography services.',
      image: config.home.servicesOverview.photography.image || '/images/services/photography-service-showcase.jpg',
      ctaText: config.home.servicesOverview.photography.ctaText || 'Explore Photography',
      services: config.home.servicesOverview.photography.services || ['Weddings', 'Portraits', 'Corporate'],
      color: 'salmon'
    });
  }
  
  if (config?.home?.servicesOverview?.videography) {
    fallbackServices.push({
      id: 'videography',
      title: config.home.servicesOverview.videography.title || 'Videography',
      description: config.home.servicesOverview.videography.description || 'Bring your stories to life with cinematic videography.',
      image: config.home.servicesOverview.videography.image || '/images/services/videography-service-showcase.jpg',
      ctaText: config.home.servicesOverview.videography.ctaText || 'Explore Videography',
      services: config.home.servicesOverview.videography.services || ['Wedding Films', 'Corporate Videos', 'Events'],
      color: 'cyan'
    });
  }
  
  // Use dynamic services if available, otherwise fallback to old format
  const services = dynamicServices.length > 0 ? dynamicServices : fallbackServices;

  // Get color classes based on service color
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'salmon': return { text: 'text-salmon', icon: 'icon-salmon' };
      case 'cyan': return { text: 'text-cyan', icon: 'icon-cyan' };
      case 'purple': return { text: 'text-purple-400', icon: 'text-purple-400' };
      case 'gold': return { text: 'text-gold', icon: 'text-gold' };
      case 'green': return { text: 'text-green-400', icon: 'text-green-400' };
      default: return { text: 'text-salmon', icon: 'icon-salmon' };
    }
  };

  // Get appropriate icon based on service title or type
  const getServiceIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('video') || lowerTitle.includes('film') || lowerTitle.includes('motion')) {
      return Video;
    }
    return Camera;
  };

  const getServiceLink = (service: any) => {
    const lowerTitle = service.title.toLowerCase();
    if (lowerTitle.includes('video') || lowerTitle.includes('film') || lowerTitle.includes('motion')) {
      return '/videography';
    }
    if (lowerTitle.includes('photo') || lowerTitle.includes('portrait') || lowerTitle.includes('wedding')) {
      return '/photography';
    }
    // Default fallback based on service ID or first service type
    return service.services?.[0] ? `/services/${service.id}` : '/contact';
  };

  return (
    <section id="services" className="pt-4 pb-20 bg-gradient-to-br from-slate-900/40 via-background to-gray-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="mb-12 leading-tight">
            {config?.home?.servicesOverview?.headline || "Capturing Life's Beautiful Moments"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {config?.home?.servicesOverview?.description || "From intimate portraits to grand celebrations, we capture every moment with artistic vision and technical excellence."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const colorClasses = getColorClasses(service.color || 'salmon');
            const ServiceIcon = getServiceIcon(service.title);
            const serviceLink = getServiceLink(service);

            return (
              <div key={service.id} className="bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-xl overflow-hidden shadow-lg hover:shadow-gold/20 transition-all duration-300 h-full">
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={service.image}
                    alt={`${service.title} services`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-2xl text-white mb-4 font-light">{service.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 line-clamp-2">{service.description}</p>
                  
                  <div className="flex items-center justify-start">
                    <Link href={serviceLink}>
                      <button className="service-card-more-btn group">
                        <span className="text-xs text-muted-foreground mr-1">more</span>
                        <ArrowRight className={`w-3 h-3 ${colorClasses.icon} group-hover:translate-x-1 transition-transform duration-300`} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show message if no services are configured */}
        {services.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-xl">No services configured yet. Please add services through the admin panel.</p>
          </div>
        )}
      </div>
    </section>
  );
}
