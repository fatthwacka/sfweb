import { useState, useRef, useCallback, useEffect } from 'react';
import { FeaturedSection } from '@shared/schema';

interface BeforeAfterSliderProps {
  config: FeaturedSection['config'];
  className?: string;
}

export function BeforeAfterSlider({ config, className = '' }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(config.defaultPosition || 50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch events for slider interaction
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global event listeners for drag operations
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  // Handle container click to move slider
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  if (!config.beforeImageUrl || !config.afterImageUrl) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Before and after images not configured</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-lg cursor-pointer select-none bg-gray-100 before-after-container"
        onClick={handleContainerClick}
        style={{ aspectRatio: '16/9' }} // Default aspect ratio, could be configurable
      >
        {/* After image (background) */}
        <img 
          src={config.afterImageUrl}
          alt={config.afterImageAlt || 'After image'}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Before image (clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
          }}
        >
          <img 
            src={config.beforeImageUrl}
            alt={config.beforeImageAlt || 'Before image'}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        
        {/* Slider line with green glow */}
        <div 
          className="absolute top-0 bottom-0 w-1 pointer-events-none before-after-divider"
          style={{ 
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-full h-full bg-green-400 shadow-green-glow"></div>
        </div>
        
        {/* Slider handle */}
        <div 
          className="absolute top-1/2 w-12 h-12 cursor-grab active:cursor-grabbing transform -translate-y-1/2 slider-handle"
          style={{ 
            left: `${sliderPosition}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <div className="w-full h-full bg-white border-4 border-green-400 rounded-full shadow-lg shadow-green-glow flex items-center justify-center">
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-green-400"></div>
              <div className="w-0.5 h-4 bg-green-400"></div>
            </div>
          </div>
        </div>
        
        {/* Labels */}
        {config.showLabels && (
          <>
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
              {config.beforeLabel || 'Before'}
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
              {config.afterLabel || 'After'}
            </div>
          </>
        )}
      </div>
      
      {/* Instructions for mobile */}
      <div className="text-center mt-4 text-gray-400 text-sm md:hidden">
        Tap and drag or touch anywhere to compare
      </div>
      
      {/* Instructions for desktop */}
      <div className="text-center mt-4 text-gray-400 text-sm hidden md:block">
        Click and drag or click anywhere to compare
      </div>
    </div>
  );
}