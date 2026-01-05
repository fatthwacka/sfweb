import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Component imports
import ClientHeader from './components/ClientHeader';
import ClientMetrics from './components/ClientMetrics';
import BrandIntelligencePanel from './components/BrandIntelligencePanel';
import ContentGenerationPanel from './components/ContentGenerationPanel';
import UsageLimitsPanel from './components/UsageLimitsPanel';

interface ContentClient {
  id: string;
  name: string;
  slug: string;
  email?: string;
  website_url?: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientControlCentreProps {
  clientId: string;
}

export default function ClientControlCentre({ clientId }: ClientControlCentreProps) {
  const [, navigate] = useLocation();

  // Fetch client data
  const { data: clientData, isLoading, error } = useQuery({
    queryKey: ['content-client', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client data');
      }
      return response.json();
    }
  });

  const client = clientData?.client as ContentClient;

  const handleBackToDashboard = () => {
    navigate('/tools/brand-intelligence-dashboard');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Loading Client Control Centre...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold text-salmon mb-2">Client Not Found</h3>
          <p className="text-xl text-muted-foreground mb-6">
            The requested client could not be found or you may not have permission to access it.
          </p>
          <button 
            onClick={handleBackToDashboard}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-32 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Client Header */}
          <ClientHeader client={client} onBack={handleBackToDashboard} />

          {/* Client-Specific Metrics */}
          <ClientMetrics client={client} />

          {/* Brand Intelligence Panel */}
          <BrandIntelligencePanel client={client} />

          {/* Content Generation Panel */}
          <ContentGenerationPanel client={client} />

          {/* Usage & Limits Panel */}
          <UsageLimitsPanel client={client} />
        </div>
      </div>
    </div>
  );
}