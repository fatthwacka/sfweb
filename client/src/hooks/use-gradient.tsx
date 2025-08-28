import { useSiteConfig } from '@/hooks/use-site-config';

export interface TextColorsConfig {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface GradientConfig {
  startColor: string;
  middleColor?: string;
  endColor: string;
  accentColor?: string;
  direction: string;
  opacity?: number;
  textColors?: TextColorsConfig;
}

type GradientSection = 'hero' | 'testimonials' | 'portfolio' | 'services' | 'contact' | 'privateGallery';

export function useGradient(section: GradientSection) {
  const { config, updateConfigBulk, isUpdating } = useSiteConfig();
  
  const gradient = config?.gradients?.[section] || {
    startColor: '#1e293b',
    middleColor: '#334155',
    endColor: '#0f172a',
    direction: '135deg',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  };

  const updateGradient = (updates: Partial<GradientConfig>) => {
    updateConfigBulk({
      gradients: {
        [section]: {
          ...gradient,
          ...updates
        }
      }
    });
  };

  const resetGradient = () => {
    updateGradient({
      startColor: '#1e293b',
      middleColor: '#334155',
      endColor: '#0f172a',
      direction: '135deg',
      opacity: 1
    });
  };

  const getGradientCSS = () => {
    const middleColor = gradient.middleColor || gradient.startColor;
    return `linear-gradient(${gradient.direction}, ${gradient.startColor} 0%, ${middleColor} 50%, ${gradient.endColor} 100%)`;
  };

  const getGradientStyle = () => ({
    background: getGradientCSS(),
    opacity: gradient.opacity || 1
  });

  const updateTextColor = (colorType: keyof TextColorsConfig, color: string) => {
    updateGradient({
      textColors: {
        ...gradient.textColors,
        [colorType]: color
      }
    });
  };

  const resetTextColors = () => {
    updateGradient({
      textColors: {
        primary: '#ffffff',
        secondary: '#e2e8f0', 
        tertiary: '#94a3b8'
      }
    });
  };

  return {
    gradient,
    updateGradient,
    updateTextColor,
    resetGradient,
    resetTextColors,
    getGradientCSS,
    getGradientStyle,
    isUpdating
  };
}

export function useAllGradients() {
  const { config, updateConfigBulk, isUpdating } = useSiteConfig();
  
  const gradients = config?.gradients || {};

  const updateAllGradients = (updates: Record<string, Partial<GradientConfig>>) => {
    const mergedGradients = { ...gradients };
    
    Object.entries(updates).forEach(([section, gradientUpdate]) => {
      mergedGradients[section] = {
        ...mergedGradients[section],
        ...gradientUpdate
      };
    });

    updateConfigBulk({ gradients: mergedGradients });
  };

  const resetAllGradients = () => {
    const defaultGradients = {
      hero: { startColor: '#1e293b', middleColor: '#334155', endColor: '#0f172a', direction: '135deg' },
      testimonials: { startColor: '#312e81', middleColor: '#1e1b4b', endColor: '#1e3a8a', direction: 'to bottom right' },
      portfolio: { startColor: '#1e293b', middleColor: '#334155', endColor: '#0f172a', direction: '135deg' },
      services: { startColor: '#374151', middleColor: '#1f2937', endColor: '#111827', direction: '135deg' },
      contact: { startColor: '#0f172a', middleColor: '#1e293b', endColor: '#334155', direction: 'to bottom' }
    };
    
    updateConfigBulk({ gradients: defaultGradients });
  };

  return {
    gradients,
    updateAllGradients,
    resetAllGradients,
    isUpdating
  };
}