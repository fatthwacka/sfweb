import React, { useState } from 'react';

interface SEOImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

/**
 * SEO-optimized image component with fallback handling
 * - Progressive loading with blur effect
 * - Automatic fallback on error
 * - SEO-friendly with proper alt text
 * - No layout shift (CLS optimization)
 */
export function SEOImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder-elegant.jpg',
  className = '',
  loading = 'lazy',
  priority = false
}: SEOImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    console.warn(`Failed to load image: ${src}, falling back to: ${fallbackSrc}`);
    setImgSrc(fallbackSrc);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blur placeholder while loading */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Main image */}
      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : loading}
        className={`
          w-full h-full object-cover
          ${isLoading && !hasError ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-500 ease-in-out
        `}
        // SEO-friendly attributes
        itemProp="image"
        decoding="async"
      />

      {/* Noscript fallback for SEO */}
      <noscript>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading={loading}
        />
      </noscript>
    </div>
  );
}

/**
 * Hero-specific SEO image with fixed aspect ratio
 */
export function HeroSEOImage(props: Omit<SEOImageProps, 'className'>) {
  return (
    <SEOImage
      {...props}
      className="w-full h-[60vh] md:h-[70vh] lg:h-[80vh]"
      priority={true}
      loading="eager"
    />
  );
}

/**
 * Service section SEO image
 */
export function ServiceSEOImage(props: Omit<SEOImageProps, 'className'>) {
  return (
    <SEOImage
      {...props}
      className="w-full h-full rounded-lg shadow-xl"
    />
  );
}

/**
 * Gallery/Recent work SEO image
 */
export function GallerySEOImage(props: Omit<SEOImageProps, 'className'>) {
  return (
    <SEOImage
      {...props}
      className="w-full aspect-[4/3] rounded-lg hover:scale-105 transition-transform duration-300"
    />
  );
}