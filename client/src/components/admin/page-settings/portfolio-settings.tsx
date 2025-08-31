import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FrontPageSettingsCard } from '../front-page-settings';
import { useSiteConfig } from '@/hooks/use-site-config';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft } from "lucide-react";

interface PortfolioSettingsProps {
  onBack?: () => void;
}

export const PortfolioSettings: React.FC<PortfolioSettingsProps> = ({ onBack }) => {
  // Get current settings from the site configuration API
  const { config, updateConfigBulk } = useSiteConfig();
  const portfolioSettings = config?.portfolio?.featured;
  const queryClient = useQueryClient();
  
  // Local state for managing changes  
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use unified site config mutation
  const handleSave = (settings: any) => {
    console.log('Making API request to save:', settings);
    updateConfigBulk({
      portfolio: {
        featured: settings
      }
    });
  };
  
  // Update local state ONLY once on initial load - never overwrite user changes  
  React.useEffect(() => {
    if (portfolioSettings && !hasInitialized) {
      setCurrentSettings(portfolioSettings);
      setHasInitialized(true);
    }
  }, [portfolioSettings, hasInitialized]);

  const handleSettingsChange = (newSettings: any) => {
    setCurrentSettings(newSettings);
  };
  
  const handleSaveWithSettings = (settingsToSave?: any) => {
    const finalSettings = settingsToSave || currentSettings;
    console.log('Attempting to save settings:', finalSettings);
    handleSave(finalSettings);
  };

  // Show loading state while data is being fetched
  if (!portfolioSettings || !currentSettings) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                🎨 Portfolio Management
              </h2>
              <p className="text-gray-300">Loading portfolio configuration...</p>
            </div>
            {onBack && (
              <Button 
                variant="outline" 
                onClick={onBack}
                className="text-gray-400 hover:text-white border-gray-600 hover:border-gray-400 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Site Management
              </Button>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600">
            <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                  <div className="h-8 bg-slate-700 rounded"></div>
                  <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              🎨 Portfolio Management
            </h2>
            <p className="text-gray-300">
              Configure how your featured portfolio section appears on the homepage.
              Adjust layout, styling, and display options to showcase your best work.
            </p>
          </div>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="text-gray-400 hover:text-white border-gray-600 hover:border-gray-400 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Site Management
            </Button>
          )}
        </div>
      </div>

      {/* Portfolio Settings Panel */}
      <FrontPageSettingsCard 
        settings={currentSettings}
        onSettingsChange={handleSettingsChange}
        onSave={handleSaveWithSettings}
        isSaving={false}
      />
    </div>
  );
};
