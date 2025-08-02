import React, { useState, useEffect } from 'react';

interface SmartImageProps {
  assetKey: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onFallbackUsed?: (assetKey: string) => void;
}

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

  const handleImageError = () => {
    if (!hasError) {
      // First error - try real fallback image from public/images/hero/
      const fallbackImage = ASSET_FALLBACK_MAP[assetKey];
      if (fallbackImage) {
        setImageSrc(fallbackImage);
        setHasError(true);
        
        // Log fallback usage for monitoring
        console.warn(`SmartImage: Using real fallback for ${assetKey}: ${fallbackImage}`);
        if (onFallbackUsed) {
          onFallbackUsed(assetKey);
        }
      } else {
        // No fallback available, show placeholder
        console.error(`SmartImage: No fallback available for ${assetKey}`);
        setIsLoading(false);
        setHasError(true);
      }
    } else {
      // Second error - fallback also failed
      console.error(`SmartImage: Both primary and fallback images failed for ${assetKey}`);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If both images failed, show placeholder
  if (hasError && isLoading === false) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center text-gray-400 text-sm ${className}`}
        style={style}
      >
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 opacity-50">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>Image unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div 
          className={`bg-gray-800 animate-pulse ${className}`}
          style={style}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        style={style}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </>
  );
};

// Asset key constants with SEO-optimized names and descriptions
export const ASSET_KEYS = {
  'hero/cape-town-wedding-photography-slyfox-studios': 'Main Home Page Hero',
  'hero/professional-photography-services-cape-town': 'Photography Services Landing',
  'hero/cape-town-wedding-photographer-portfolio': 'Weddings Portfolio Hero',
  'hero/portrait-photographer-cape-town-studio': 'Portraits Portfolio Hero',
  'hero/corporate-photography-cape-town-business': 'Corporate Photography Hero',
  'hero/event-photographer-cape-town-professional': 'Events Portfolio Hero',
  'hero/graduation-photography-cape-town-ceremony': 'Graduation Photography Hero',
  'hero/product-photography-cape-town-commercial': 'Product Photography Hero',
  'hero/matric-dance-photographer-cape-town': 'Matric Dance Photography Hero',
  'backgrounds/photography-studio-cape-town-texture': 'Main Site Background',
  'backgrounds/wedding-photography-background-elegant': 'Wedding Portfolio Background',
  'backgrounds/portrait-photography-studio-backdrop': 'Portrait Studio Background'
} as const;

// Mapping of asset keys to actual hero image files in public/images/hero/
export const ASSET_FALLBACK_MAP: Record<string, string> = {
  'hero/cape-town-wedding-photography-slyfox-studios': '/images/hero/wedding-photography-hero.webp',
  'hero/professional-photography-services-cape-town': '/images/hero/portrait-photography-hero.jpg',
  'hero/cape-town-wedding-photographer-portfolio': '/images/hero/wedding-photography-hero.webp',
  'hero/portrait-photographer-cape-town-studio': '/images/hero/portrait-photography-hero.jpg',
  'hero/corporate-photography-cape-town-business': '/images/hero/corporate-photography-hero.jpg',
  'hero/event-photographer-cape-town-professional': '/images/hero/Event-photography-hero.jpg',
  'hero/graduation-photography-cape-town-ceremony': '/images/hero/graduation-photography-hero.jpg',
  'hero/product-photography-cape-town-commercial': '/images/hero/product-photography-hero.jpg',
  'hero/matric-dance-photographer-cape-town': '/images/hero/matric-dance-photography-hero.jpg',
  
  // Background fallbacks (using existing backgrounds)
  'backgrounds/photography-studio-cape-town-texture': '/images/backgrounds/photography-category-hero.jpg',
  'backgrounds/wedding-photography-background-elegant': '/images/backgrounds/wedding-hero-background.jpg',
  'backgrounds/portrait-photography-studio-backdrop': '/images/backgrounds/portrait-hero-background.jpg'
};

export type AssetKey = typeof ASSET_KEYS[keyof typeof ASSET_KEYS];