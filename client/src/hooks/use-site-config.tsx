import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteConfig } from '@/config/site-config';
import type { SiteConfigInterface, DeepPartial } from '@/config/types';

/**
 * Custom hook for managing site configuration
 * 
 * Provides real-time access to site config with optimistic updates
 * and automatic cache invalidation across all components.
 */
export function useSiteConfig() {
  const queryClient = useQueryClient();

  // Fetch current site configuration
  const { 
    data: config, 
    isLoading, 
    error 
  } = useQuery<SiteConfigInterface>({
    queryKey: ['siteConfig'],
    queryFn: async () => {
      console.log('🔄 Fetching site config from API...');
      try {
        const response = await fetch('/api/site-config');
        console.log('📡 Site config API response:', response.status);
        if (!response.ok) {
          // If API fails, use local config as fallback
          console.warn('Site config API unavailable, using local config');
          return siteConfig;
        }
        const data = await response.json();
        console.log('✅ Site config loaded:', data.contact?.business?.name);
        return data;
      } catch (error) {
        console.warn('Site config fetch failed, using local config:', error);
        return siteConfig;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - reduced for testing
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Update site configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ path, value }: { path: string; value: any }) => {
      const response = await fetch('/api/site-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update site configuration');
      }
      
      return response.json();
    },
    onSuccess: (data, { path, value }) => {
      // Update the cache optimistically
      queryClient.setQueryData(['siteConfig'], (oldData: SiteConfigInterface | undefined) => {
        if (!oldData) return siteConfig;
        
        const newData = { ...oldData };
        setNestedValue(newData, path, value);
        return newData;
      });
      
      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
    },
    onError: (error) => {
      console.error('Failed to update site config:', error);
      // Revert optimistic update by refetching
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
    }
  });

  // Bulk update configuration
  const updateConfigBulkMutation = useMutation({
    mutationFn: async (updates: DeepPartial<SiteConfigInterface>) => {
      const response = await fetch('/api/site-config/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to bulk update site configuration');
      }
      
      return response.json();
    },
    onSuccess: (data, updates) => {
      // Update cache with bulk changes
      queryClient.setQueryData(['siteConfig'], (oldData: SiteConfigInterface | undefined) => {
        if (!oldData) return siteConfig;
        return deepMerge(oldData, updates);
      });
      
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
    }
  });

  // Convenience methods
  const updateConfig = (path: string, value: any) => {
    updateConfigMutation.mutate({ path, value });
  };

  const updateConfigBulk = (updates: DeepPartial<SiteConfigInterface>) => {
    updateConfigBulkMutation.mutate(updates);
  };

  const resetConfig = () => {
    queryClient.setQueryData(['siteConfig'], siteConfig);
    queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
  };

  return {
    config: config || siteConfig, // Use API config if available, fallback to static
    isLoading,
    error,
    updateConfig,
    updateConfigBulk, 
    resetConfig,
    isUpdating: updateConfigMutation.isPending || updateConfigBulkMutation.isPending,
    updateError: updateConfigMutation.error || updateConfigBulkMutation.error
  };
}

/**
 * Hook for accessing specific sections of site config
 * Optimized for components that only need part of the configuration
 */
export function useSiteConfigSection<T extends keyof SiteConfigInterface>(
  section: T
): {
  data: SiteConfigInterface[T];
  isLoading: boolean;
  error: any;
  updateSection: (updates: Partial<SiteConfigInterface[T]>) => void;
} {
  const { config, isLoading, error, updateConfigBulk, isUpdating } = useSiteConfig();
  
  const updateSection = (updates: Partial<SiteConfigInterface[T]>) => {
    updateConfigBulk({ [section]: updates } as DeepPartial<SiteConfigInterface>);
  };

  return {
    data: config?.[section] || siteConfig[section],
    isLoading: isLoading || isUpdating,
    error,
    updateSection
  };
}

// Utility functions
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Hook for theme-related configuration
 * Provides quick access to colors, typography, and spacing
 */
export function useSiteTheme() {
  const { data: theme, updateSection, isLoading } = useSiteConfigSection('theme');
  
  return {
    theme,
    isLoading,
    updateTheme: updateSection,
    colors: theme?.colors,
    typography: theme?.typography,
    spacing: theme?.spacing
  };
}

/**
 * Hook for hero configurations across all pages
 */
export function useSiteHeroes() {
  const { data: heroes, updateSection, isLoading } = useSiteConfigSection('heroes');
  
  return {
    heroes,
    isLoading,
    updateHeroes: updateSection,
    getHero: (page: keyof typeof heroes) => heroes?.[page]
  };
}