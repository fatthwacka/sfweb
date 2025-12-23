import React, { useState, useMemo } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { PortfolioGrid } from '@/components/portfolio/portfolio-grid';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 40;

interface Shoot {
  id: string;
  title: string;
  description?: string;
  mediaType: 'photo' | 'video';
  customSlug?: string;
  coverImageUrl?: string;
  coverVideoInfo?: {
    id: string;
    storagePath: string;
    optimizedPath?: string;
    thumbnailPath: string;
    duration?: number;
    filename: string;
  };
  isGroup?: boolean;
  groupName?: string;
  shootCount?: number;
  shoots?: Array<{
    id: string;
    title: string;
    mediaType: 'photo' | 'video';
    customSlug?: string;
  }>;
}

export function Portfolio() {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: fetchedItems = [], isLoading, error } = useQuery<Shoot[]>({
    queryKey: ['portfolio', 'cards'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cards');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio cards');
      }
      return response.json();
    }
  });

  // Randomize items on each page load using Fisher-Yates shuffle
  const allItems = useMemo(() => {
    if (fetchedItems.length === 0) return [];

    const items = [...fetchedItems]; // Create a copy to avoid mutating original
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [fetchedItems]);

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = allItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Portfolio Grid Section */}
      <div className="pt-20 pb-20" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-white text-4xl lg:text-5xl mb-6">
              Recent Galleries
            </h2>
            <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto">
              Click on any gallery to experience our professional presentation system. 
              Video galleries feature dynamic previews on hover for an engaging experience.
            </p>
          </div>

          {isLoading ? (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '24px' }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">Failed to load galleries</p>
            </div>
          ) : (
            <>
              <PortfolioGrid portfolioItems={currentItems} />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-16 gap-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const distance = Math.abs(page - currentPage);
                        return distance <= 2 || page === 1 || page === totalPages;
                      })
                      .map((page, index, array) => {
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-3 py-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                                currentPage === page
                                  ? 'bg-salmon text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors duration-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Results info */}
              <div className="text-center mt-8">
                <p className="text-gray-400 text-sm">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} galleries
                </p>
              </div>
            </>
          )}

          {/* Call to Action */}
          <div className="text-center mt-20">
            <div className="bg-black/40 border border-white/20 rounded-2xl p-12 max-w-3xl mx-auto">
              <h3 className="text-3xl text-white mb-4">
                Ready to Create Your <span className="text-salmon">Own Gallery?</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-8">
                Professional photography and videography services with premium gallery delivery.
                Your memories deserve the finest presentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="bg-salmon hover:bg-salmon/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  Book Your Session
                </a>
                <a 
                  href="/gallery-demo" 
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  View Demo Galleries
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}