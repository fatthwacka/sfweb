import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDefaultGradient } from '@shared/constants/gradient-defaults';

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
}

/**
 * Custom hook for managing gradient configurations from Supabase
 * Provides defaults from constants and allows real-time updates
 */
export function useGradientConfig(sectionKey: string) {
  const queryClient = useQueryClient();

  // Fetch gradient configuration from database
  const { data: override, isLoading, error } = useQuery({
    queryKey: ['gradient', sectionKey],
    queryFn: async (): Promise<GradientConfig | null> => {
      try {
        const response = await fetch(`/api/gradients/${sectionKey}`, {
          credentials: 'include'
        });

        if (response.status === 404) {
          // No custom config exists, return null to use defaults
          return null;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch gradient config: ${response.status}`);
        }

        const data = await response.json();
        return data.gradientConfig;
      } catch (error) {
        console.warn(`Failed to load gradient config for ${sectionKey}:`, error);
        return null; // Fallback to defaults on error
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get the final configuration (defaults merged with overrides)
  const defaultConfig = getDefaultGradient(sectionKey);
  const config: GradientConfig = override ? { ...defaultConfig, ...override } : defaultConfig;

  // Mutation to update gradient configuration
  const updateGradient = useMutation({
    mutationFn: async (newConfig: Partial<GradientConfig>) => {
      const updatedConfig = { ...config, ...newConfig };

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

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the gradient config
      queryClient.invalidateQueries(['gradient', sectionKey]);
    },
    onError: (error) => {
      console.error(`Failed to update gradient config for ${sectionKey}:`, error);
    }
  });

  // Helper to update specific color
  const updateColor = (colorKey: keyof GradientConfig, value: string) => {
    if (colorKey === 'textColors') return; // Handle text colors separately
    updateGradient.mutate({ [colorKey]: value });
  };

  // Helper to update text color
  const updateTextColor = (textColorKey: 'primary' | 'secondary' | 'tertiary', value: string) => {
    const newTextColors = {
      ...config.textColors,
      [textColorKey]: value
    };
    updateGradient.mutate({ textColors: newTextColors });
  };

  // Helper to reset to defaults
  const resetToDefaults = () => {
    updateGradient.mutate(defaultConfig);
  };

  return {
    config,
    isLoading,
    error,
    updateGradient: updateGradient.mutate,
    updateColor,
    updateTextColor,
    resetToDefaults,
    isUpdating: updateGradient.isPending,
    hasCustomConfig: !!override,
    defaultConfig
  };
}