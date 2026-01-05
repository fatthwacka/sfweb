import React from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { GradientBackground } from '@/components/common/gradient-background';
import ClientControlCentre from '@/components/content-management/client-control-centre/ClientControlCentre';

interface ClientControlCentrePageProps {
  params: {
    clientId: string;
  };
}

export default function ClientControlCentrePage({ params }: ClientControlCentrePageProps) {
  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />
        <ClientControlCentre clientId={params.clientId} />
        <Footer />
      </div>
    </GradientBackground>
  );
}