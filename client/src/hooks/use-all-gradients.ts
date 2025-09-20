import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDefaultGradient } from '@shared/constants/gradient-defaults';
import { useRef, useCallback, useState } from 'react';

interface GradientConfig {
  startColor: string;
  middleColor: string;
  endColor: string;
  direction: string;
  opacity?: number;
  textColors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  // Extended portfolio settings (for portfolio section only)
  portfolioSettings?: {
    imageCount?: number;
    borderThickness?: number;
    borderRadius?: number;
    borderColor?: string;
    borderColorEnd?: string;
    imagePadding?: number;
    layoutStyle?: string;
    backgroundGradientStart?: string;
    backgroundGradientMiddle?: string;
    backgroundGradientEnd?: string;
    textColor?: string;
    textColorPrimary?: string;
    textColorSecondary?: string;
    textColorTertiary?: string;
  };
}

type AllGradientsResponse = Record<string, GradientConfig>;

/**
 * UNIFIED GRADIENT HOOK - Replaces dual hook system for optimal performance
 * Features: Bulk fetching + Individual updates + Aggressive caching + Defaults fallback
 */
export function useAllGradients() {
  const queryClient = useQueryClient();
  const [isPortfolioSaving, setIsPortfolioSaving] = useState(false);
  const portfolioDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AGGRESSIVE CACHING: 15min stale time, 30min cache retention, no window focus refetch
  const { data: allGradients, isLoading, error } = useQuery({
    queryKey: ['gradients', 'all'],
    queryFn: async (): Promise<AllGradientsResponse> => {
      try {
        const response = await fetch('/api/gradients', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch gradients: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.warn('Failed to load gradients:', error);
        return {}; // Return empty object on error
      }
    },
    staleTime: 0, // Always fetch fresh data on mount (since we need browser refresh anyway)
    cacheTime: 5 * 60 * 1000, // 5 minutes retention (just for same-session navigation)
    refetchOnWindowFocus: true, // Refetch when tab regains focus
    refetchOnReconnect: true, // Refetch on reconnect
  });

  // UNIFIED UPDATE MUTATION - Replaces individual useGradientConfig calls
  const updateGradient = useMutation({
    mutationFn: async ({ sectionKey, gradientConfig }: { sectionKey: string, gradientConfig: Partial<GradientConfig> }) => {
      // Get current config with defaults fallback - ensure we have the latest cache data
      const currentGradients = queryClient.getQueryData(['gradients', 'all']) as AllGradientsResponse || {};
      const currentConfig = currentGradients[sectionKey] || getDefaultGradient(sectionKey);
      const updatedConfig = { ...currentConfig, ...gradientConfig };


      const response = await fetch(`/api/gradients/${sectionKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          sectionKey,
          gradientConfig: updatedConfig
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update gradient config: ${response.status}`);
      }

      const result = response.json();

      return result;
    },
    onMutate: async ({ sectionKey, gradientConfig }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['gradients', 'all']);

      // Snapshot the previous value
      const previousGradients = queryClient.getQueryData(['gradients', 'all']) as AllGradientsResponse;

      // Optimistically update the cache
      if (previousGradients) {
        const currentConfig = previousGradients[sectionKey] || getDefaultGradient(sectionKey);
        const optimisticConfig = { ...currentConfig, ...gradientConfig };
        
        queryClient.setQueryData(['gradients', 'all'], {
          ...previousGradients,
          [sectionKey]: optimisticConfig
        });
      }

      return { previousGradients };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousGradients) {
        queryClient.setQueryData(['gradients', 'all'], context.previousGradients);
      }
      console.error(`Failed to update gradient config for ${variables.sectionKey}:`, error);
    },
    onSettled: () => {
      // Simple invalidation - let React Query handle the rest efficiently
      queryClient.invalidateQueries(['gradients', 'all']);
      setIsPortfolioSaving(false);
    }
  });

  // Helper to get specific gradient by section key with defaults fallback
  // CRITICAL: This function now depends on allGradients state, making it reactive
  const getGradient = (sectionKey: string): GradientConfig => {
    // Always read from current allGradients to ensure reactivity
    const stored = allGradients?.[sectionKey];
    
    
    if (stored) return stored;
    
    // Fallback to defaults if not in cache
    return getDefaultGradient(sectionKey);
  };

  // Helper functions for backward compatibility
  const updateColor = (sectionKey: string, colorKey: keyof GradientConfig, value: string) => {
    if (colorKey === 'textColors') return; // Handle text colors separately
    updateGradient.mutate({ sectionKey, gradientConfig: { [colorKey]: value } });
  };

  const updateTextColor = (sectionKey: string, textColorKey: 'primary' | 'secondary' | 'tertiary', value: string) => {
    const currentGradient = getGradient(sectionKey);
    const newTextColors = {
      ...currentGradient.textColors,
      [textColorKey]: value
    };
    updateGradient.mutate({ sectionKey, gradientConfig: { textColors: newTextColors } });
  };

  // Batch update function for better performance
  const updateGradientBatch = (sectionKey: string, gradientConfig: Partial<GradientConfig>) => {
    updateGradient.mutate({ sectionKey, gradientConfig });
  };

  // Helper to check if any gradients are loaded
  const hasGradients = !!(allGradients && Object.keys(allGradients).length > 0);

  // Portfolio-specific helper functions
  const getPortfolioSettings = () => {
    const portfolioGradient = getGradient('portfolio');
    return portfolioGradient.portfolioSettings || {};
  };

  const updatePortfolioSettings = useCallback((settings: Partial<GradientConfig['portfolioSettings']>) => {
    // Clear existing timeout
    if (portfolioDebounceTimeoutRef.current) {
      clearTimeout(portfolioDebounceTimeoutRef.current);
    }

    // Set saving state after 1500ms delay
    portfolioDebounceTimeoutRef.current = setTimeout(() => {
      setIsPortfolioSaving(true);
    }, 1500);

    // Set another timeout for actual save after 2000ms total
    setTimeout(() => {
      const currentGradient = getGradient('portfolio');
      const currentPortfolioSettings = currentGradient.portfolioSettings || {};
      const updatedPortfolioSettings = { ...currentPortfolioSettings, ...settings };
      
      updateGradient.mutate({ 
        sectionKey: 'portfolio', 
        gradientConfig: { 
          portfolioSettings: updatedPortfolioSettings 
        } 
      });
    }, 2000);
  }, [updateGradient, getGradient]);

  return {
    // Data access - REACTIVE: These values change when React Query updates
    allGradients: allGradients || {},
    isLoading,
    error,
    getGradient, // This function closure will re-create when allGradients changes
    hasGradients,
    
    // Update functions
    updateGradient: updateGradientBatch,
    updateColor: (sectionKey: string, colorKey: keyof GradientConfig, value: string) => 
      updateColor(sectionKey, colorKey, value),
    updateTextColor: (sectionKey: string, textColorKey: 'primary' | 'secondary' | 'tertiary', value: string) => 
      updateTextColor(sectionKey, textColorKey, value),
    
    // Status
    isUpdating: updateGradient.isPending || isPortfolioSaving,
    
    // Portfolio-specific functions
    getPortfolioSettings,
    updatePortfolioSettings
  };
}