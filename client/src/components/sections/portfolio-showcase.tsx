import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImageUrl } from "@/lib/image-utils";
import { useFrontPageSettings } from "@/hooks/use-front-page-settings";
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

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to get balanced random selection from all categories
const getBalancedRandomSelection = (images: Image[], count: number = 9): Image[] => {
  if (images.length <= count) return images;
  
  // Group images by classification
  const groups = images.reduce((acc, image) => {
    if (!acc[image.classification]) {
      acc[image.classification] = [];
    }
    acc[image.classification].push(image);
    return acc;
  }, {} as Record<string, Image[]>);
  
  // Get classification types and shuffle them
  const classifications = shuffleArray(Object.keys(groups));
  const result: Image[] = [];
  
  // Take images round-robin from each classification
  let currentIndex = 0;
  while (result.length < count && result.length < images.length) {
    const classification = classifications[currentIndex % classifications.length];
    const groupImages = groups[classification];
    
    if (groupImages && groupImages.length > 0) {
      // Remove and add a random image from this group
      const randomIndex = Math.floor(Math.random() * groupImages.length);
      const selectedImage = groupImages.splice(randomIndex, 1)[0];
      result.push(selectedImage);
    }
    
    currentIndex++;
    
    // If we've gone through all classifications, break to avoid infinite loop
    if (currentIndex >= classifications.length * count) break;
  }
  
  return result;
};

export function PortfolioShowcase() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterOptions, setFilterOptions] = useState([{ label: "All Work", value: "all" }]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get front page settings from admin panel
  const frontPageSettings = useFrontPageSettings();

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

  // Filter and limit featured images based on active filter and settings
  const filteredItems = useMemo(() => {
    if (!featuredImages) return [];
    
    const MAX_DISPLAY_IMAGES = frontPageSettings?.imageCount || 9;
    
    if (activeFilter === "all") {
      // For "all" filter, show balanced random selection from all categories
      return getBalancedRandomSelection(featuredImages, MAX_DISPLAY_IMAGES);
    } else {
      // For specific category filters, show up to configured number of images from that category
      const categoryImages = featuredImages.filter(image => image.classification === activeFilter);
      return categoryImages.length > MAX_DISPLAY_IMAGES 
        ? shuffleArray(categoryImages).slice(0, MAX_DISPLAY_IMAGES)
        : categoryImages;
    }
  }, [featuredImages, activeFilter, frontPageSettings?.imageCount]);

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

  // Get aspect ratio class based on layout style
  const getAspectRatioClass = () => {
    switch (frontPageSettings?.layoutStyle) {
      case 'portrait':
        return 'aspect-[2/3]';
      case 'instagram':
        return 'aspect-[4/5]';
      case 'square':
      default:
        return 'aspect-square';
    }
  };

  // Get grid styles based on settings
  const gridStyles = {
    gap: `${frontPageSettings?.imagePadding || 2}px`,
  };

  const imageStyles = {
    borderRadius: `${frontPageSettings?.borderRadius || 8}px`,
  };

  const getBorderStyles = () => {
    if (!frontPageSettings?.borderThickness) {
      return {};
    }
    
    return {
      background: `linear-gradient(135deg, ${frontPageSettings.borderColor || '#ffffff'} 0%, ${frontPageSettings.borderColorEnd || '#cccccc'} 100%)`,
      padding: `${frontPageSettings.borderThickness}px`,
      borderRadius: `${frontPageSettings.borderRadius || 8}px`,
    };
  };

  // Get section background gradient
  const getSectionBackgroundStyle = () => {
    const start = frontPageSettings?.backgroundGradientStart || '#1e293b';
    const middle = frontPageSettings?.backgroundGradientMiddle || '#334155';
    const end = frontPageSettings?.backgroundGradientEnd || '#0f172a';
    
    return {
      background: `linear-gradient(135deg, ${start} 0%, ${middle} 50%, ${end} 100%)`,
    };
  };

  // Get text color style
  const getTextColorStyle = () => {
    return {
      color: frontPageSettings?.textColor || '#e2e8f0',
    };
  };

  return (
    <section 
      className="py-20" 
      style={getSectionBackgroundStyle()}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="cyan text-4xl lg:text-5xl mb-6">
            Recent <span>Work</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-8" style={getTextColorStyle()}>
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

        {/* Fixed-width responsive container for the grid */}
        <div className="max-w-6xl mx-auto">
          {/* Portfolio Grid - Dynamic layout based on admin settings */}
          <div 
            className="grid grid-cols-2 md:grid-cols-3" 
            style={gridStyles}
          >
            {imagesLoading ? (
              // Loading skeleton - dynamic count based on settings
              Array.from({ length: frontPageSettings?.imageCount || 9 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  {frontPageSettings?.borderThickness ? (
                    <div style={getBorderStyles()}>
                      <div 
                        className={`bg-gray-800/50 ${getAspectRatioClass()}`}
                        style={imageStyles}
                      ></div>
                    </div>
                  ) : (
                    <div 
                      className={`bg-gray-800/50 ${getAspectRatioClass()}`}
                      style={imageStyles}
                    ></div>
                  )}
                </div>
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((image, index) => (
                <div key={image.id} className="group cursor-pointer" onClick={() => openModal(index)}>
                  {frontPageSettings?.borderThickness ? (
                    <div style={getBorderStyles()}>
                      <div 
                        className={`relative overflow-hidden image-hover-effect ${getAspectRatioClass()} shadow-lg hover:shadow-2xl transition-all duration-300`}
                        style={imageStyles}
                      >
                        <img 
                          src={ImageUrl.forViewing(image.storagePath)} 
                          alt={image.filename} 
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="text-left p-4 w-full">
                            <h4 className="text-lg lg:text-xl font-quicksand font-bold text-salmon mb-1">
                              {formatClassificationLabel(image.classification)}
                            </h4>
                            <p className="text-gray-200 text-sm lg:text-base">
                              {image.filename.replace(/\.[^/.]+$/, "")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`relative overflow-hidden image-hover-effect ${getAspectRatioClass()} shadow-lg hover:shadow-2xl transition-all duration-300`}
                      style={imageStyles}
                    >
                      <img 
                        src={ImageUrl.forViewing(image.storagePath)} 
                        alt={image.filename} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="text-left p-4 w-full">
                          <h4 className="text-lg lg:text-xl font-quicksand font-bold text-salmon mb-1">
                            {formatClassificationLabel(image.classification)}
                          </h4>
                          <p className="text-gray-200 text-sm lg:text-base">
                            {image.filename.replace(/\.[^/.]+$/, "")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <p className="text-gray-400 text-xl">
                  {activeFilter === "all" 
                    ? "No featured images available" 
                    : `No featured images in ${formatClassificationLabel(activeFilter)} category`}
                </p>
              </div>
            )}
          </div>
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
                  src={ImageUrl.forModal(currentImage.storagePath)}
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
