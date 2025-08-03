import React from 'react';

interface DirectImageProps {
  filename: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  cacheKey?: string; // Optional cache key to force refresh when changed
}

/**
 * DirectImage component - loads images directly from /images/ folder
 * No fallback system, no mapping - just direct filename usage
 */
export const DirectImage: React.FC<DirectImageProps> = ({ 
  filename, 
  alt = 'professional photography durban', 
  className, 
  style,
  cacheKey
}) => {
  // Only add cache buster if cacheKey is provided (indicating a recent update)
  const src = cacheKey ? `/images/${filename}?v=${cacheKey}` : `/images/${filename}`;
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
};