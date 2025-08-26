import { useQuery } from '@tanstack/react-query';

interface FrontPageSettings {
  imagePadding?: number;
  borderRadius?: number;
  imageCount?: number;
  layoutStyle?: string;
  borderThickness?: number;
  borderColor?: string;
  borderColorEnd?: string;
  backgroundGradientStart?: string;
  backgroundGradientMiddle?: string;
  backgroundGradientEnd?: string;
  textColor?: string;
  textColorEnd?: string;
}

export const useFrontPageSettings = () => {
  // Fetch site configuration from API
  const { data: siteConfig, isLoading } = useQuery({
    queryKey: ['/api/site-config'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Don't return settings until data is loaded
  if (isLoading || !siteConfig) {
    return null;
  }

  // Extract portfolio settings from site config with fallback defaults
  const settings: FrontPageSettings = {
    imagePadding: 2,
    borderRadius: 8,
    imageCount: 9,
    layoutStyle: 'square',
    borderThickness: 0,
    borderColor: '#ffffff',
    borderColorEnd: '#cccccc',
    backgroundGradientStart: '#1e293b',
    backgroundGradientMiddle: '#334155',
    backgroundGradientEnd: '#0f172a',
    textColor: '#e2e8f0',
    textColorEnd: '#537093',
    ...(siteConfig as any)?.portfolio?.featured
  };

  return settings;
};