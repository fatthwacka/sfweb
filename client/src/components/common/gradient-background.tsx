import React, { useEffect, useState } from 'react';
import { useSiteConfig } from '@/hooks/use-site-config';
import { useAllGradients } from '@/hooks/use-all-gradients';
// Removed deprecated useFrontPageSettings import

interface GradientBackgroundProps {
  section: 'hero' | 'testimonials' | 'portfolio' | 'services' | 'contact' | 'privateGallery';
  children: React.ReactNode;
  className?: string;
  fallbackGradient?: string;
  id?: string;
  // New props for category pages
  categoryType?: 'photography' | 'videography';
  categoryName?: string;
  categorySectionName?: 'serviceOverview' | 'packages' | 'recentWork' | 'seoContent';
}

export function GradientBackground({
  section,
  children,
  className = '',
  fallbackGradient = 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)',
  id,
  categoryType,
  categoryName,
  categorySectionName
}: GradientBackgroundProps) {
  const { config } = useSiteConfig();
  const [loaded, setLoaded] = useState(false);

  // Construct the correct gradient key for category pages
  let gradientKey = section;
  if (categoryType && categoryName && categorySectionName === 'packages' && section === 'portfolio') {
    // For pricing sections on category pages, use specific key format
    gradientKey = `pricing-${categoryType}_${categoryName}`;
  }

  // Use bulk gradient system for optimal performance
  const {
    allGradients,  // SUBSCRIBE TO THE ACTUAL DATA to trigger re-renders
    getGradient,
    isLoading: isGradientLoading
  } = useAllGradients();

  // Get gradient config from bulk API (unified system)
  // The new getGradient always returns a config (with defaults), so no null check needed
  let gradientConfig = getGradient(gradientKey);

  // Legacy fallback only if gradient system is not loaded
  if (isGradientLoading && categoryType && categoryName && categorySectionName) {
    gradientConfig = config?.categoryPages?.[categoryType]?.[categoryName]?.[categorySectionName]?.gradients || gradientConfig;
  }

  // No loading state - always render immediately with smooth transitions
  // Eliminates brownish overlay completely while providing smooth fade-in

  // Use unified gradient system for all sections
  let gradientStyle;
  let textColors;

  if (section === 'portfolio') {
    if (gradientConfig) {
      // Use new gradient system
      gradientStyle = `linear-gradient(${gradientConfig.direction}, ${gradientConfig.startColor} 0%, ${gradientConfig.middleColor || gradientConfig.startColor} 50%, ${gradientConfig.endColor} 100%)`;
      textColors = gradientConfig.textColors;
    } else if (config?.portfolio?.featured) {
      // Fall back to portfolio featured configuration
      const portfolioConfig = config.portfolio.featured;
      const start = portfolioConfig.backgroundGradientStart || '#1e293b';
      const middle = portfolioConfig.backgroundGradientMiddle || '#334155';
      const end = portfolioConfig.backgroundGradientEnd || '#0f172a';
      gradientStyle = `linear-gradient(135deg, ${start} 0%, ${middle} 50%, ${end} 100%)`;
      textColors = {
        primary: portfolioConfig.textColorPrimary,
        secondary: portfolioConfig.textColorSecondary,
        tertiary: portfolioConfig.textColorTertiary
      };
    } else {
      gradientStyle = fallbackGradient;
    }
  } else {
    // Use new gradient system for all sections
    gradientStyle = gradientConfig
      ? `linear-gradient(${gradientConfig.direction}, ${gradientConfig.startColor} 0%, ${gradientConfig.middleColor || gradientConfig.startColor} 50%, ${gradientConfig.endColor} 100%)`
      : fallbackGradient;

    // Get text colors from gradient config
    textColors = gradientConfig?.textColors;
  }

  // Helper function to resolve CSS variables to actual hex values
  const resolveColor = (color: string, fallback: string) => {
    if (!color) return fallback;
    if (color.startsWith('var(--color-primary)')) return 'hsl(16, 100%, 73%)'; // salmon
    if (color.startsWith('var(--color-secondary)')) return 'hsl(180, 100%, 50%)'; // cyan
    if (color.startsWith('var(--color-salmon)')) return 'hsl(16, 100%, 73%)'; // salmon
    if (color.startsWith('var(--color-cyan)')) return 'hsl(180, 100%, 50%)'; // cyan
    return color;
  };

  const backgroundStyle = {
    background: gradientStyle,
    // Apply section-specific text color CSS variables - resolve CSS variables to actual colors
    [`--${section}-text-primary`]: resolveColor(textColors?.primary, '#ffffff'),
    [`--${section}-text-secondary`]: resolveColor(textColors?.secondary, '#e2e8f0'),
    [`--${section}-text-tertiary`]: resolveColor(textColors?.tertiary, '#94a3b8')
  } as React.CSSProperties;

  // Mark as loaded after gradient data is available
  useEffect(() => {
    if (!isGradientLoading) {
      // Small delay to ensure smooth fade-in
      const timer = setTimeout(() => setLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isGradientLoading]);

  return (
    <div 
      id={id}
      className={`relative ${className} transition-all duration-[800ms] ease-out`}
      style={backgroundStyle}
      data-gradient-section={section}
      data-loaded={loaded}
    >
      {children}
    </div>
  );
}