import { useState } from "react";
import { Button } from "@/components/ui/button";

const portfolioItems = [
  {
    id: 1,
    category: "weddings",
    title: "Garden Wedding",
    location: "Durban • 2024",
    image: "/images/portfolio/wedding-couple-1.jpg"
  },
  {
    id: 2,
    category: "portraits",
    title: "Executive Portrait",
    location: "Corporate • 2024",
    image: "/images/portfolio/portrait-professional-1.jpg"
  },
  {
    id: 3,
    category: "corporate",
    title: "Tech Conference",
    location: "Event • 2024",
    image: "/images/portfolio/wedding-couple-2.jpg"
  },
  {
    id: 4,
    category: "weddings",
    title: "Beach Wedding",
    location: "Durban • 2024",
    image: "/images/portfolio/portrait-professional-2.jpg"
  },
  {
    id: 5,
    category: "portraits",
    title: "Family Session",
    location: "Portrait • 2024",
    image: "/images/portfolio/wedding-couple-3.jpg"
  },
  {
    id: 6,
    category: "corporate",
    title: "Product Shoot",
    location: "Commercial • 2024",
    image: "/images/portfolio/portrait-professional-3.jpg"
  }
];

const filterButtons = [
  { id: "all", label: "All Work" },
  { id: "weddings", label: "Weddings" },
  { id: "portraits", label: "Portraits" },
  { id: "corporate", label: "Corporate" }
];

export function PortfolioShowcase() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems = activeFilter === "all" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
            Featured <span className="text-salmon">Work</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            A glimpse into our creative journey - showcasing moments that matter, stories that inspire, and memories that last forever.
          </p>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filterButtons.map((filter) => (
              <Button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-3 font-barlow font-semibold rounded-full transition-all duration-300 ${
                  activeFilter === filter.id
                    ? "bg-gold text-black hover:bg-gold-muted"
                    : "bg-transparent border border-gray-600 text-gray-300 hover:border-gold hover:text-gold"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group cursor-pointer animate-fade-in">
              <div className="relative overflow-hidden rounded-xl image-hover-effect">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-80 object-cover"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center">
                    <h4 className="text-xl font-saira font-bold text-gold mb-2">{item.title}</h4>
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
            className="border-2 border-gold text-gold px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-300 transform hover:scale-105"
          >
            View Full Portfolio
          </Button>
        </div>
      </div>
    </section>
  );
}
