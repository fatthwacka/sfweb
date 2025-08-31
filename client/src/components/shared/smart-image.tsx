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
  'hero/durban-wedding-photography-slyfox-studios': '/images/hero/durban-wedding-photography-slyfox-studios.jpg',
  'hero/professional-photography-services-durban': '/images/hero/professional-photography-services-durban.jpg',
  'hero/durban-wedding-photographer-portfolio': '/images/hero/durban-wedding-photographer-portfolio.jpg',
  'hero/portrait-photographer-durban-studio': '/images/hero/portrait-photographer-durban-studio.jpg',
  'hero/corporate-photography-durban-business': '/images/hero/corporate-photography-durban-business.jpg',
  'hero/event-photographer-durban-professional': '/images/hero/event-photographer-durban-professional.jpg',
  'hero/graduation-photography-durban-ceremony': '/images/hero/graduation-photography-durban-ceremony.jpg',
  'hero/product-photography-durban-commercial': '/images/hero/product-photography-durban-commercial.jpg',
  'hero/matric-dance-photographer-durban': '/images/hero/matric-dance-photographer-durban.jpg',
  'backgrounds/photography-studio-durban-texture': '/images/backgrounds/photography-studio-durban-texture.jpg',
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