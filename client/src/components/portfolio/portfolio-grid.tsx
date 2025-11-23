import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PortfolioCard } from './portfolio-card';

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
  // New fields for bundled cards
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

interface PortfolioGridProps {
  portfolioItems?: Shoot[];
}

export function PortfolioGrid({ portfolioItems: propItems }: PortfolioGridProps = {}) {
  const { data: fetchedItems = [], isLoading, error } = useQuery<Shoot[]>({
    queryKey: ['galleries', 'public'],
    queryFn: async () => {
      const response = await fetch('/api/galleries/public');
      if (!response.ok) {
        throw new Error('Failed to fetch galleries');
      }
      return response.json();
    },
    enabled: !propItems // Only fetch if no items were provided as props
  });

  // Use provided items or fetched items
  const portfolioItems = propItems || fetchedItems;

  if (!propItems && isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '24px' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!propItems && error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load galleries</p>
      </div>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No galleries available</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-center gap-6">
        {portfolioItems.map((item) => (
          <div key={item.id} className="w-full sm:w-80 md:w-96">
            <PortfolioCard shoot={item} />
          </div>
        ))}
      </div>
    </div>
  );
}