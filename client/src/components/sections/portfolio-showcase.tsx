import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImageUrl } from "@/lib/image-utils";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [columnCount, setColumnCount] = useState(6);
  const [imageHeights, setImageHeights] = useState<{ [key: string]: number }>({});
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Modal navigation functions
  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  const currentImage = filteredItems[currentImageIndex];

  // Calculate responsive column count
  const updateColumnCount = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1400) setColumnCount(6);       // 1400px+ = 6 columns
    else if (width >= 1024) setColumnCount(5);  // 1024px+ = 5 columns
    else if (width >= 768) setColumnCount(4);   // 768px+ = 4 columns
    else if (width >= 640) setColumnCount(3);   // 640px+ = 3 columns
    else setColumnCount(2);                     // < 640px = 2 columns
  }, []);

  // Handle window resize
  useEffect(() => {
    updateColumnCount();
    const handleResize = () => updateColumnCount();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateColumnCount]);

  // Calculate masonry layout
  const getMasonryStyle = useCallback((index: number) => {
    if (!gridRef.current || filteredItems.length === 0) return {};
    
    const gap = 8; // 8px gap
    const containerWidth = gridRef.current.clientWidth;
    const columnWidth = (containerWidth - (gap * (columnCount - 1))) / columnCount;
    
    const columnIndex = index % columnCount;
    const rowIndex = Math.floor(index / columnCount);
    
    // Calculate heights of previous items in the same column
    let columnHeight = 0;
    for (let i = columnIndex; i < index; i += columnCount) {
      const imageId = filteredItems[i]?.id;
      if (imageId && imageHeights[imageId]) {
        columnHeight += imageHeights[imageId] + gap;
      }
    }
    
    return {
      position: 'absolute' as const,
      left: columnIndex * (columnWidth + gap),
      top: columnHeight,
      width: columnWidth,
    };
  }, [columnCount, filteredItems, imageHeights]);

  // Handle image load to calculate height
  const handleImageLoad = useCallback((imageId: string, naturalWidth: number, naturalHeight: number) => {
    if (!gridRef.current) return;
    
    const containerWidth = gridRef.current.clientWidth;
    const gap = 8;
    const columnWidth = (containerWidth - (gap * (columnCount - 1))) / columnCount;
    const aspectRatio = naturalHeight / naturalWidth;
    const calculatedHeight = columnWidth * aspectRatio;
    
    setImageHeights(prev => ({
      ...prev,
      [imageId]: calculatedHeight
    }));
  }, [columnCount]);

  // Calculate total container height for masonry
  const getTotalHeight = useCallback(() => {
    if (filteredItems.length === 0 || Object.keys(imageHeights).length === 0) return 0;
    
    const gap = 8;
    const columnHeights = Array(columnCount).fill(0);
    
    filteredItems.forEach((image, index) => {
      const columnIndex = index % columnCount;
      const height = imageHeights[image.id] || 0;
      columnHeights[columnIndex] += height + gap;
    });
    
    return Math.max(...columnHeights) - gap; // Remove last gap
  }, [filteredItems, imageHeights, columnCount]);

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900/60 via-background to-grey-800/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
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

        {/* Portfolio Grid - Full Width Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
          {imagesLoading ? (
            // Loading skeleton - responsive count
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800/50 h-64 lg:h-80 rounded-xl"></div>
              </div>
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map((image, index) => (
              <div key={image.id} className="group cursor-pointer" onClick={() => openModal(index)}>
                <div className="relative overflow-hidden rounded-xl image-hover-effect">
                  <img 
                    src={ImageUrl.forViewing(image.storagePath)} 
                    alt={image.filename} 
                    className="w-full h-64 lg:h-80 object-cover"
                    loading="lazy"
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

      {/* Image Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogTitle className="sr-only">
          {currentImage ? `Viewing ${formatClassificationLabel(currentImage.classification)} - ${currentImage.filename}` : 'Image Gallery'}
        </DialogTitle>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 border-none bg-black/95" aria-describedby="image-modal-description">
          <div className="relative h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Previous Button */}
            {filteredItems.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={prevImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Next Button */}
            {filteredItems.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Image Display */}
            {currentImage && (
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <img
                  src={ImageUrl.forFullSize(currentImage.storagePath)}
                  alt={currentImage.filename}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Image Info Overlay */}
                <div id="image-modal-description" className="absolute bottom-8 left-8 right-8 bg-black/70 text-white p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-salmon mb-2">
                    {formatClassificationLabel(currentImage.classification)}
                  </h3>
                  <p className="text-gray-300">
                    {currentImage.filename.replace(/\.[^/.]+$/, "")}
                  </p>
                  {filteredItems.length > 1 && (
                    <p className="text-sm text-gray-400 mt-2">
                      {currentImageIndex + 1} of {filteredItems.length}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
