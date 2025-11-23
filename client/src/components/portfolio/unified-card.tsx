import React, { useState } from 'react';
import { Link } from 'wouter';
import { VideoUrl } from '@/lib/video-utils';

interface UnifiedCardProps {
  shoot: {
    id: string;
    title: string;
    description?: string;
    mediaType: 'photo' | 'video';
    customSlug?: string;
    shootDate?: string;
    coverImageUrl?: string;
    coverVideoInfo?: {
      id: string;
      storagePath: string;
      optimizedPath?: string;
      thumbnailPath: string;
      duration?: number;
      filename: string;
    };
    // Group-specific fields
    isGroup?: boolean;
    groupName?: string;
    shootCount?: number;
    shoots?: Array<{
      id: string;
      title: string;
      mediaType: 'photo' | 'video';
      customSlug?: string;
    }>;
  };
}

export function UnifiedCard({ shoot }: UnifiedCardProps) {
  const [videoError, setVideoError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Determine the URL based on whether it's a group or individual shoot
  const getCardUrl = () => {
    if (shoot.isGroup) {
      const groupSlug = shoot.groupName?.toLowerCase().replace(/\s+/g, '-') || '';
      return `/project/${groupSlug}`;
    }
    return `/gallery/${shoot.customSlug || shoot.id}`;
  };

  // Get the display title (use group name for groups)
  const getDisplayTitle = () => {
    return shoot.isGroup && shoot.groupName ? shoot.groupName : shoot.title;
  };

  // Format the date consistently
  const getDisplayDate = () => {
    if (shoot.shootDate) {
      return new Date(shoot.shootDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    return 'Portfolio Gallery';
  };

  // Get the thumbnail URL - ALWAYS prioritize photo covers over video thumbnails
  const getThumbnailUrl = () => {
    // For individual albums: always use photo cover if available
    if (!shoot.isGroup && shoot.coverImageUrl) {
      return shoot.coverImageUrl;
    }
    
    // For groups: prioritize photo gallery covers (this should already be handled by backend)
    if (shoot.isGroup && shoot.coverImageUrl) {
      return shoot.coverImageUrl;
    }
    
    // Only use video thumbnail if no photo cover is available
    return shoot.coverVideoInfo ? shoot.coverVideoInfo.thumbnailPath : null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const displayTitle = getDisplayTitle();
  const displayDate = getDisplayDate();
  const hasVideo = shoot.mediaType === 'video' && shoot.coverVideoInfo;

  return (
    <Link href={getCardUrl()}>
      <div 
        className="group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="portfolio-card">
          <div className="portfolio-card-image">
            {/* Video preview on hover for video galleries */}
            {isHovering && hasVideo && !videoError && (
              <video
                src={VideoUrl.forStreaming(shoot.coverVideoInfo!)}
                className="absolute inset-0 w-full h-full object-cover z-10"
                autoPlay
                muted
                loop
                playsInline
                onError={() => setVideoError(true)}
              />
            )}
            
            {/* Main thumbnail image */}
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl}
                alt={displayTitle}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <span className="text-gray-500 text-center p-4">
                  {displayTitle}
                </span>
              </div>
            )}
            
            {/* Hover overlay */}
            <div className="portfolio-card-overlay"></div>
          </div>
          
          {/* Card footer with metadata */}
          <div className="portfolio-card-footer">
            <h3 className="portfolio-card-title">
              {displayTitle}
            </h3>
            <p className="portfolio-card-subtitle">
              {displayDate}
            </p>
            
            {/* Metadata badges */}
            <div className="flex gap-2 mt-2">
              {/* Media type badge - only show for individual shoots, not groups */}
              {!shoot.isGroup && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                  {shoot.mediaType === 'video' ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                      </svg>
                      video gallery
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      photo gallery
                    </>
                  )}
                </span>
              )}
              
              {/* Gallery count badges for groups */}
              {shoot.isGroup && shoot.shoots && (() => {
                const photoCount = shoot.shoots.filter(s => s.mediaType === 'photo').length;
                const videoCount = shoot.shoots.filter(s => s.mediaType === 'video').length;
                
                return (
                  <>
                    {photoCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        {photoCount} image {photoCount === 1 ? 'gallery' : 'galleries'}
                      </span>
                    )}
                    {videoCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                        {videoCount} video {videoCount === 1 ? 'gallery' : 'galleries'}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}