import React from 'react';

interface DirectImageProps {
  filename: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DirectImage component - loads images directly from /images/ folder
 * No fallback system, no mapping - just direct filename usage
 */
export const DirectImage: React.FC<DirectImageProps> = ({ 
  filename, 
  alt = 'professional photography durban', 
  className, 
  style 
}) => {
  // Add timestamp to force cache invalidation
  const cacheBuster = `?t=${Date.now()}`;
  
  return (
    <img
      src={`/images/${filename}${cacheBuster}`}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
};