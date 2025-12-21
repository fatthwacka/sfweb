import { Link } from "wouter";

// Photography categories data - shared across all photography pages
// Order: Portraits, Weddings, Products, Graduation, Events, Corporate
const PHOTOGRAPHY_CATEGORIES = [
  { 
    name: 'portraits', 
    title: 'Portraits', 
    subtitle: 'Headshots & portraits', 
    image: '/images/services/portrait-photography.jpg' 
  },
  { 
    name: 'weddings', 
    title: 'Weddings', 
    subtitle: 'Capturing your special day', 
    image: '/images/services/wedding-photography.jpg' 
  },
  { 
    name: 'products', 
    title: 'Products', 
    subtitle: 'Brand & Product shots', 
    image: '/images/services/product-photography.jpg' 
  },
  { 
    name: 'graduation', 
    title: 'Graduation', 
    subtitle: 'Graduation & Matric dance', 
    image: '/images/services/graduation-photography.jpg' 
  },
  { 
    name: 'events', 
    title: 'Events', 
    subtitle: 'Festivals & Celebrations', 
    image: '/images/services/event-photography.jpg' 
  },
  { 
    name: 'corporate', 
    title: 'Corporate', 
    subtitle: 'Studio and On-site', 
    image: '/images/services/corporate-photography.jpg' 
  }
];

interface PhotographyNavigationProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Reusable photography navigation section used across all photography pages
 * Shows all photography categories in a responsive grid
 */
export function PhotographyNavigation({ 
  title = "Explore Our Photography Services",
  subtitle = "Professional photography for every special occasion",
  className = "py-16 bg-gradient-to-br from-slate-900 via-slate-700 to-gray-800"
}: PhotographyNavigationProps) {
  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl mb-4 text-white">
            {title}
          </h2>
          <p className="text-lg text-gray-300">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PHOTOGRAPHY_CATEGORIES.map((categoryItem) => (
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
  );
}

// Export the categories data for use elsewhere if needed
export { PHOTOGRAPHY_CATEGORIES };