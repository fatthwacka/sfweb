import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { GradientBackground } from "@/components/common/gradient-background";
import { ImageUrl } from "@/lib/image-utils";
import type { Client, Shoot, Image } from "@shared/schema";

interface ClientPortfolioData {
  client: Client;
  shoots: (Shoot & { images?: Image[] })[];
}

export default function ClientPortfolio() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  // Fetch client and their shoots
  const { data, isLoading, error } = useQuery<ClientPortfolioData>({
    queryKey: [`/api/clients/${params.slug}`],
    enabled: !!params.slug,
  });

  // Get the cover image for a shoot
  const getShootCoverImage = (shoot: Shoot & { images?: Image[] }): string | null => {
    if (!shoot.images || shoot.images.length === 0) {
      return null;
    }

    // Find banner image if set
    if (shoot.bannerImageId) {
      const bannerImage = shoot.images.find(img => img.id === shoot.bannerImageId);
      if (bannerImage) {
        return ImageUrl.forViewing(bannerImage.storagePath);
      }
    }

    // Find first featured image
    const featuredImage = shoot.images.find(img => img.featuredImage);
    if (featuredImage) {
      return ImageUrl.forViewing(featuredImage.storagePath);
    }

    // Use first image by sequence
    const firstImage = shoot.images.sort((a, b) => a.sequence - b.sequence)[0];
    if (firstImage) {
      return ImageUrl.forViewing(firstImage.storagePath);
    }

    return null;
  };

  // Navigate to shoot gallery
  const handleShootClick = (shoot: Shoot) => {
    const slug = shoot.customSlug || shoot.id;
    navigate(`/gallery/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
        <Navigation />
        <GradientBackground section="portfolio" className="py-20 min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-salmon mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading portfolio...</p>
          </div>
        </GradientBackground>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
        <Navigation />
        <GradientBackground section="portfolio" className="py-20 min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-4xl font-bold text-salmon mb-4">Portfolio Not Found</h1>
            <p className="text-muted-foreground mb-8">
              We couldn't find a portfolio with that URL. Please check the link and try again.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-salmon text-white px-6 py-3 rounded-lg hover:bg-salmon-muted transition-colors"
            >
              Return Home
            </button>
          </div>
        </GradientBackground>
        <Footer />
      </div>
    );
  }

  const { client, shoots } = data;

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      <Navigation />

      <GradientBackground section="portfolio" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl mb-4 cyan">
              {client.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your portfolio of professional images captured by SlyFox Studio Group
            </p>
          </div>

          {/* Shoots Grid */}
          {shoots.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-xl">
                No shoots available yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shoots.map((shoot) => {
                const coverImage = getShootCoverImage(shoot);
                const displayTitle = shoot.customTitle || shoot.title;

                return (
                  <div
                    key={shoot.id}
                    onClick={() => handleShootClick(shoot)}
                    className="group cursor-pointer bg-gradient-to-br from-slate-800/60 to-gray-900/80 rounded-xl overflow-hidden shadow-lg hover:shadow-gold/20 transition-all duration-500 transform hover:scale-[1.02]"
                  >
                    {/* Cover Image */}
                    <div className="relative h-64 overflow-hidden">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={displayTitle}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60"></div>

                      {/* Title Overlay at Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl text-white font-light mb-2 line-clamp-2">
                          {displayTitle}
                        </h3>
                        {shoot.shootDate && (
                          <p className="text-sm text-gray-300">
                            {new Date(shoot.shootDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer with Shoot Info */}
                    <div className="p-4">
                      {shoot.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {shoot.description}
                        </p>
                      )}
                      {shoot.shootType && (
                        <div className="mt-2">
                          <span className="inline-block text-xs px-2 py-1 rounded-full bg-salmon/20 text-salmon">
                            {shoot.shootType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}
