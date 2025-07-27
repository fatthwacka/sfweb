import { useState } from "react";
import { Button } from "@/components/ui/button";

const portfolioItems = [
  {
    id: 1,
    title: "Garden Wedding",
    location: "Cape Town • 2024",
    category: "weddings",
    image: "/images/portfolio/wedding-couple-1.jpg"
  },
  {
    id: 2,
    title: "Executive Portrait",
    location: "Corporate • 2024",
    category: "portraits",
    image: "/images/portfolio/portrait-professional-1.jpg"
  },
  {
    id: 3,
    title: "Tech Conference",
    location: "Event • 2024",
    category: "corporate",
    image: "/images/portfolio/wedding-couple-2.jpg"
  },
  {
    id: 4,
    title: "Beach Wedding",
    location: "Cape Town • 2024",
    category: "weddings",
    image: "/images/portfolio/portrait-professional-2.jpg"
  },
  {
    id: 5,
    title: "Family Session",
    location: "Portrait • 2024",
    category: "portraits",
    image: "/images/portfolio/wedding-couple-3.jpg"
  },
  {
    id: 6,
    title: "Product Shoot",
    location: "Commercial • 2024",
    category: "product",
    image: "/images/portfolio/portrait-professional-3.jpg"
  },
  {
    id: 7,
    title: "Matric Dance",
    location: "School Event • 2024",
    category: "matric-dance",
    image: "/images/portfolio/matric-dance-1.jpg"
  },
  {
    id: 8,
    title: "Corporate Event",
    location: "Conference • 2024",
    category: "event",
    image: "/images/portfolio/corporate-event-1.jpg"
  }
];

const filterOptions = [
  { label: "All Work", value: "all" },
  { label: "Weddings", value: "weddings" },
  { label: "Portraits", value: "portraits" },
  { label: "Corporate", value: "corporate" },
  { label: "Product", value: "product" },
  { label: "Matric Dance", value: "matric-dance" },
  { label: "Event", value: "event" }
];

export function PortfolioShowcase() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems = activeFilter === "all" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900/60 via-background to-grey-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="cyan text-4xl lg:text-5xl mb-6">
            Featured <span>Work</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            A glimpse into our creative journey - showcasing moments that matter, stories that inspire, and memories that last forever.
          </p>

          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filterOptions.map(option => (
              <Button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                variant="outline"
                className={`px-6 py-3 font-barlow font-semibold rounded-full transition-all duration-300 ${
                  activeFilter === option.value
                    ? "border-salmon bg-gradient-to-r from-salmon-dark to-salmon text-white hover:from-salmon hover:to-salmon-muted"
                    : "border-cyan bg-gradient-to-r from-cyan-dark/30 to-cyan-dark/10 text-cyan hover:border-cyan-bright hover:from-cyan/20 hover:to-cyan-bright/10 hover:text-cyan-bright"
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl image-hover-effect">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-80 object-cover"
                />

                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center">
                    <h4 className="text-xl font-quicksand font-bold text-salmon mb-2">{item.title}</h4>
                    <p className="text-gray-200 text-sm">{item.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline"
            className="border-2 border-cyan text-cyan px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-cyan hover:text-black transition-all duration-300 transform hover:scale-105"
          >
            View Full Portfolio
          </Button>
        </div>
      </div>
    </section>
  );
}
