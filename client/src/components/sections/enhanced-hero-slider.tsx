import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: [string, string];
}

interface HeroConfig {
  slides: HeroSlide[];
  autoAdvance: boolean;
  interval: number;
}

export function EnhancedHeroSlider() {
  const { config, isLoading } = useSiteConfig();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get hero configuration with fallbacks
  const heroConfig: HeroConfig = config?.home?.hero || {
    slides: [
      {
        id: "slide-1",
        image: "/images/hero/homepage-main-hero.jpg",
        title: "Capturing Life's Beautiful Moments",
        subtitle: "Professional Photography & Videography",
        cta: "Book Your Session",
        gradient: ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)"]
      }
    ],
    autoAdvance: true,
    interval: 6000
  };

  const { slides, autoAdvance, interval } = heroConfig;
  const totalSlides = slides.length;

  // Simple slide transition
  const transitionToSlide = useCallback((slideIndex: number) => {
    if (isTransitioning || slideIndex === currentSlide) return;
    
    setIsTransitioning(true);
    
    // Simple right-to-left slide transition
    setTimeout(() => {
      setCurrentSlide(slideIndex);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Simple 0.5s transition
    }, 50);
  }, [currentSlide, isTransitioning]);

  // Navigate to next slide
  const nextSlideHandler = useCallback(() => {
    const next = (currentSlide + 1) % totalSlides;
    transitionToSlide(next);
  }, [currentSlide, totalSlides, transitionToSlide]);

  // Navigate to previous slide
  const prevSlideHandler = useCallback(() => {
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    transitionToSlide(prev);
  }, [currentSlide, totalSlides, transitionToSlide]);

  // Auto-advance functionality - force enable with 2500ms interval
  useEffect(() => {
    if (totalSlides <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(nextSlideHandler, 4000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [nextSlideHandler, totalSlides]);

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Clean, simple implementation - no complex effects

  if (isLoading || totalSlides === 0) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-salmon"></div>
      </section>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section 
      ref={containerRef}
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Multiple slides - always slide right-to-left */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          // Calculate position relative to current slide for proper looping
          let position;
          const diff = index - currentSlide;
          
          if (diff === 0) {
            position = 'translate-x-0'; // Current slide - visible
          } else if (diff < 0 || (currentSlide === 0 && index === totalSlides - 1)) {
            position = '-translate-x-full'; // Previous slides - hidden left
          } else {
            position = 'translate-x-full'; // Next slides - waiting right
          }
          
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 ease-in-out ${position}`}
              style={{
                backgroundImage: `url('${slide.image}')`
              }}
            />
          );
        })}
      </div>

      {/* Content Overlay */}
      <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-corinthia text-white leading-tight hero-title-white" style={{ marginBottom: '-0.5rem' }}>
            {currentSlideData.title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white font-quicksand font-light mb-4">
            {currentSlideData.subtitle}
          </p>
          
          {/* CTA Button */}
          <div className="flex justify-center">
            <button 
              onClick={() => {
                const servicesElement = document.getElementById('services');
                if (servicesElement) {
                  const headerOffset = 0;
                  const elementPosition = servicesElement.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className="bg-white p-2 rounded-full hover:scale-105 transform transition-all duration-300 shadow-lg cursor-pointer border-none flex items-center justify-center"
              type="button"
              style={{ width: '40px', height: '40px' }}
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlideHandler}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white/90 transition-all duration-300"
            disabled={isTransitioning}
          >
            <ChevronLeft className="w-6 h-6 drop-shadow-lg" />
          </button>
          
          <button
            onClick={nextSlideHandler}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white/90 transition-all duration-300"
            disabled={isTransitioning}
          >
            <ChevronRight className="w-6 h-6 drop-shadow-lg" />
          </button>
        </>
      )}


      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-30 bg-black/50 text-white text-xs p-2 rounded">
          <div>Slide: {currentSlide + 1}/{totalSlides} | Simple Slider</div>
          <div>Auto-Play: {isPlaying.toString()}</div>
        </div>
      )}
    </section>
  );
}