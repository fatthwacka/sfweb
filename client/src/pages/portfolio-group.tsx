import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { GradientBackground } from '@/components/common/gradient-background';
import { PortfolioCard } from '@/components/portfolio/portfolio-card';
import { PortfolioGrid } from '@/components/portfolio/portfolio-grid';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { trackPageView } from '@/lib/analytics';
import type { Client } from '@shared/schema';

interface PortfolioGroupData {
  groupName: string;
  shoots: Array<{
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
  }>;
  shootCount: number;
}

export function PortfolioGroup() {
  const { groupName, slug } = useParams();

  // Use slug if available (from /portfolio/client-slug or /project/group-name routes)
  // or groupName (from direct /project route)
  const parameterValue = slug || groupName;

  // Track page view for dynamic portfolio/project pages
  useEffect(() => {
    if (parameterValue) {
      const path = slug ? `/portfolio/${slug}` : `/project/${groupName}`;
      trackPageView(path);
    }
  }, [parameterValue, slug, groupName]);

  // Try to fetch as portfolio group first
  const { data: groupData, isLoading: groupLoading, error: groupError } = useQuery<PortfolioGroupData>({
    queryKey: ['portfolio-group', parameterValue],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/groups/${encodeURIComponent(parameterValue || '')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio group');
      }
      return response.json();
    },
    enabled: !!parameterValue,
    retry: false // Don't retry if it fails - we'll try as client instead
  });

  // If group fetch failed, try as client slug
  const { data: clientResponse, isLoading: clientLoading } = useQuery<{client: Client, shoots: any[]}>({
    queryKey: ['client', parameterValue],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${encodeURIComponent(parameterValue || '')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      return response.json();
    },
    enabled: !!parameterValue && !!groupError, // Only try if group fetch failed
    retry: false
  });

  // Fetch client details for navigation button (when we have group data)
  const { data: groupClientData } = useQuery<{client: Client}>({
    queryKey: ['client-by-email', groupData?.shoots?.[0]?.clientId],
    queryFn: async () => {
      const clientEmail = groupData?.shoots?.[0]?.clientId;
      if (!clientEmail) throw new Error('No client email');
      
      // First get all clients to find the one with matching email
      const clientsResponse = await fetch('/api/clients');
      if (!clientsResponse.ok) throw new Error('Failed to fetch clients');
      const clients = await clientsResponse.json();
      const matchingClient = clients.find((c: any) => c.email === clientEmail);
      if (!matchingClient) throw new Error('Client not found');
      return { client: matchingClient };
    },
    enabled: !!groupData?.shoots?.[0]?.clientId,
    retry: false
  });

  // Fetch portfolio data for client filtering (only if we found a client)
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['galleries', 'public'],
    queryFn: async () => {
      const response = await fetch('/api/galleries/public');
      if (!response.ok) {
        throw new Error('Failed to fetch galleries');
      }
      return response.json();
    },
    enabled: !!clientResponse,
  });

  const isLoading = groupLoading || (groupError && clientLoading) || (clientResponse && portfolioLoading);
  const data = groupData;
  const client = clientResponse?.client;
  const error = groupError && !clientResponse;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salmon mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading portfolio...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-red-400">Portfolio not found</p>
              <a 
                href="/portfolio"
                className="inline-flex items-center gap-2 text-cyan hover:text-cyan-bright mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Portfolio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Single Section - Portfolio Content */}
      <div className="py-20" style={{ background: 'linear-gradient(to bottom, #64748b 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
            {/* Show portfolio group content if we have group data */}
            {groupData && (
              <>
                {/* Group Title with breadcrumb navigation */}
                <div className="text-center mb-16">
                  {/* Breadcrumb Navigation */}
                  {groupClientData?.client && (
                    <div className="mb-4">
                      <a 
                        href={`/portfolio/${groupClientData.client.slug}`}
                        className="inline-flex items-center px-4 py-2 bg-gray-300 hover:bg-white text-black rounded-lg transition-all duration-200 text-sm font-thin uppercase tracking-wide"
                        style={{ fontFamily: 'Quicksand, sans-serif' }}
                      >
                        <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {groupClientData.client.name}
                      </a>
                    </div>
                  )}
                  
                  {/* Title */}
                  <div className="mb-6">
                    <h1 className="text-white text-4xl lg:text-5xl font-light capitalize">
                      {groupData.groupName} Galleries
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto capitalize">
                    {groupData.groupName} professional photo and video galleries by SlyFox Studio Group
                  </p>
                </div>
                
                {/* Group Cards Grid */}
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-wrap justify-center gap-6">
                    {groupData.shoots.map((shoot) => (
                      <div key={shoot.id} className="w-full sm:w-80 md:w-96">
                        <PortfolioCard shoot={shoot} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Show client portfolio content if we have client data */}
            {client && portfolioData && (
              <>
                {/* Client Title */}
                <div className="text-center mb-16">
                  <h1 className="text-white text-4xl lg:text-5xl font-light mb-6">
                    {client.name}
                  </h1>
                  <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto">
                    Your portfolio of professional images captured by SlyFox Studio Group
                  </p>
                </div>
                
                {/* Client Cards Grid */}
                <PortfolioGrid 
                  portfolioItems={portfolioData.filter((item: any) => {
                    // Both grouped and ungrouped items have clientId at the top level
                    // Simply check if the item belongs to this client
                    return item.clientId === client.email;
                  })}
                />
              </>
            )}
        </div>
      </div>

      <Footer />
    </div>
  );
}