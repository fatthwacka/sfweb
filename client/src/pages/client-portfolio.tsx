import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { GradientBackground } from "@/components/common/gradient-background";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import type { Client, Shoot, Image, Video } from "@shared/schema";

interface ClientPortfolioData {
  client: Client;
  shoots: (Shoot & { images?: Image[]; videos?: Video[] })[];
}

export default function ClientPortfolio() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  // Fetch client and their shoots
  const { data, isLoading, error } = useQuery<ClientPortfolioData>({
    queryKey: [`/api/clients/${params.slug}`],
    enabled: !!params.slug,
  });

  // Fetch public galleries for portfolio display
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['/api/galleries/public'],
    enabled: !!data?.client, // Only fetch once we have client data
  });


  if (isLoading || portfolioLoading) {
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

  const { client } = data;

  // Filter portfolio data to only show items that include this client's shoots
  const filteredPortfolioData = portfolioData ? portfolioData.filter((item: any) => {
    if (item.isGroup) {
      // For groups, check if any shoot in the group belongs to this client
      return item.shoots && item.shoots.some((shoot: any) => shoot.clientId === client.email);
    } else {
      // For individual shoots, check if it belongs to this client
      return item.clientId === client.email;
    }
  }) : [];

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

          {/* Portfolio Grid */}
          {filteredPortfolioData.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-xl">
                No portfolio items available yet. Check back soon!
              </p>
            </div>
          ) : (
            <PortfolioGrid portfolioItems={filteredPortfolioData} />
          )}
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}
