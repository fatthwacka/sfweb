import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";

// Helper function to format classification for display
const formatClassificationLabel = (classification: string) => {
  return classification
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to create filter value from classification
const createFilterValue = (classification: string) => {
  return classification.toLowerCase().replace(/\s+/g, '-');
};

export function PortfolioShowcase() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterOptions, setFilterOptions] = useState([{ label: "All Work", value: "all" }]);

  // Fetch featured images from Supabase
  const { data: featuredImages, isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ['/api/images/featured'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch available classifications for filter buttons
  const { data: classifications, isLoading: classificationsLoading } = useQuery<string[]>({
    queryKey: ['/api/images/featured/classifications'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update filter options when classifications are loaded
  useEffect(() => {
    if (classifications && classifications.length > 0) {
      const options = [
        { label: "All Work", value: "all" },
        ...classifications.map(classification => ({
          label: formatClassificationLabel(classification),
          value: classification
        }))
      ];
      setFilterOptions(options);
    }
  }, [classifications]);

  // Filter featured images based on active filter
  const filteredItems = !featuredImages ? [] : 
    activeFilter === "all" 
      ? featuredImages 
      : featuredImages.filter(image => image.classification === activeFilter);

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
          {imagesLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800/50 h-80 rounded-xl"></div>
              </div>
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map(image => (
              <div key={image.id} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl image-hover-effect">
                  <img 
                    src={image.storagePath} 
                    alt={image.filename} 
                    className="w-full h-80 object-cover"
                  />

                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center">
                      <h4 className="text-xl font-quicksand font-bold text-salmon mb-2">
                        {formatClassificationLabel(image.classification)}
                      </h4>
                      <p className="text-gray-200 text-sm">
                        {image.filename.replace(/\.[^/.]+$/, "")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">
                {activeFilter === "all" 
                  ? "No featured images available" 
                  : `No featured images in ${formatClassificationLabel(activeFilter)} category`}
              </p>
            </div>
          )}
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
