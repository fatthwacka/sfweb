import React from 'react';
import { UnifiedCard } from './unified-card';

interface PortfolioCardProps {
  shoot: {
    id: string;
    title: string;
    description?: string;
    mediaType: 'photo' | 'video';
    customSlug?: string;
    shootDate?: string;
    coverImageUrl?: string;
    coverVideoInfo?: {
      id: string;
      storagePath: string;
      optimizedPath?: string;
      thumbnailPath: string;
      duration?: number;
      filename: string;
    };
    // Group-specific fields
    isGroup?: boolean;
    groupName?: string;
    shootCount?: number;
    shoots?: Array<{
      id: string;
      title: string;
      mediaType: 'photo' | 'video';
      customSlug?: string;
    }>;
  };
}

export function PortfolioCard({ shoot }: PortfolioCardProps) {
  // Simply pass through to the unified card
  return <UnifiedCard shoot={shoot} />;
}