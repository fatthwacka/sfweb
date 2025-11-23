import React, { useState } from 'react';
import { VideoUrl } from '@/lib/video-utils';

interface VideoPortfolioCardProps {
  title: string;
  description: string;
  href: string;
  shootDate?: string;
  coverVideoInfo: {
    id: string;
    storagePath: string;
    optimizedPath?: string;
    thumbnailPath: string;
    duration?: number;
    filename: string;
  };
  coverImageUrl: string; // Fallback thumbnail
  children?: React.ReactNode;
}

export function VideoPortfolioCard({
  title,
  description,
  href,
  shootDate,
  coverVideoInfo,
  coverImageUrl,
  children
}: VideoPortfolioCardProps) {
  const [videoError, setVideoError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  
  return (
    <div 
      className="group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="portfolio-card">
        <div className="portfolio-card-image">
          {/* Video Background - Only show when hovering and no error */}
          {isHovering && !videoError && coverVideoInfo && (
            <video
              src={VideoUrl.forStreaming(coverVideoInfo)}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoError(true)}
              poster={coverVideoInfo.thumbnailPath}
            />
          )}
          
          {/* Thumbnail Image - Always present as fallback/initial state */}
          {!imageError ? (
            <img 
              src={coverImageUrl || coverVideoInfo.thumbnailPath}
              alt={title}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isHovering && !videoError ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-white/50 text-center">
                <div className="text-4xl mb-2">🎬</div>
                <div className="text-xs">Thumbnail Error</div>
              </div>
            </div>
          )}
          
          <div className="portfolio-card-overlay"></div>
        </div>
        
        <div className="portfolio-card-footer">
          <h3 className="portfolio-card-title">
            {title}
          </h3>
          <p className="portfolio-card-subtitle">
            {shootDate ? new Date(shootDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date not available'}
          </p>
          {/* Enhanced metadata badge */}
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              video gallery
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}