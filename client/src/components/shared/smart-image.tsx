import React, { useState, useEffect } from 'react';

interface SmartImageProps {
  assetKey: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onFallbackUsed?: (assetKey: string) => void;
}

// Asset fallback mapping
const ASSET_FALLBACK_MAP: Record<string, string> = {
  'hero/cape-town-wedding-photography-slyfox-studios': '/images/hero/cape-town-wedding-photography-slyfox-studios.jpg',
  'hero/professional-photography-services-cape-town': '/images/hero/professional-photography-services-cape-town.jpg',
  'hero/cape-town-wedding-photographer-portfolio': '/images/hero/cape-town-wedding-photographer-portfolio.jpg',
  'hero/portrait-photographer-cape-town-studio': '/images/hero/portrait-photographer-cape-town-studio.jpg',
  'hero/corporate-photography-cape-town-business': '/images/hero/corporate-photography-cape-town-business.jpg',
  'hero/event-photographer-cape-town-professional': '/images/hero/event-photographer-cape-town-professional.jpg',
  'hero/graduation-photography-cape-town-ceremony': '/images/hero/graduation-photography-cape-town-ceremony.jpg',
  'hero/product-photography-cape-town-commercial': '/images/hero/product-photography-cape-town-commercial.jpg',
  'hero/matric-dance-photographer-cape-town': '/images/hero/matric-dance-photographer-cape-town.jpg',
  'backgrounds/photography-studio-cape-town-texture': '/images/backgrounds/photography-studio-cape-town-texture.jpg',
  'backgrounds/wedding-photography-background-elegant': '/images/backgrounds/wedding-photography-background-elegant.jpg',
  'backgrounds/portrait-photography-studio-backdrop': '/images/backgrounds/portrait-photography-studio-backdrop.jpg'
};

/**
 * SmartImage component with automatic fallback system
 * Attempts to load the '-ni' (new image) version first,
 * falls back to '-fb' (fallback) version if loading fails
 */
export const SmartImage: React.FC<SmartImageProps> = ({ 
  assetKey, 
  alt, 
  className, 
  style,
  onFallbackUsed 
}) => {
  const [imageSrc, setImageSrc] = useState(`/assets/${assetKey}-ni.jpg`);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when assetKey changes
  useEffect(() => {
    setImageSrc(`/assets/${assetKey}-ni.jpg`);
    setHasError(false);
    setIsLoading(true);
  }, [assetKey]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    if (!hasError) {
      // First error - try fallback image from public/images/
      const fallbackImage = ASSET_FALLBACK_MAP[assetKey];
      if (fallbackImage) {
        setImageSrc(fallbackImage);
        setHasError(true);
        
        if (onFallbackUsed) {
          onFallbackUsed(assetKey);
        }
      } else {
        // No fallback available
        setIsLoading(false);
        setHasError(true);
      }
    } else {
      // Second error - fallback also failed
      setIsLoading(false);
    }
  };

  if (hasError && !ASSET_FALLBACK_MAP[assetKey]) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`} style={style}>
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
    />
  );
};