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
  return (
    <img
      src={`/images/${filename}`}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
};