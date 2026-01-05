import React from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { GradientBackground } from '@/components/common/gradient-background';
import BrandIntelDashboard from '@/components/content-management/brand-intelligence/BrandIntelDashboard';

export default function BrandIntelligenceDashboardPage() {
  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />
        <BrandIntelDashboard />
        <Footer />
      </div>
    </GradientBackground>
  );
}