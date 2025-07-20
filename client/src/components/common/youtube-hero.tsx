import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface YouTubeHeroProps {
  videoId: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function YouTubeHero({ videoId, title, subtitle, ctaText = "Get Started", ctaLink = "/contact" }: YouTubeHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center video-container">
      {/* YouTube Video Background */}
      <div className="video-background">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${window.location.origin}&disablekb=1&fs=0`}
          title="Background Video"
          allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
          allowFullScreen={false}
          className="w-full h-full scale-150 border-0"
          style={{ 
            minWidth: '177.77vh', // 16:9 aspect ratio
            minHeight: '56.25vw',
            border: 'none',
            pointerEvents: 'none'
          }}
        />
      </div>
      
      {/* Video Overlay */}
      <div className="video-overlay" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-7xl mb-8">
          {title}
        </h1>
        
        {subtitle && (
          <p className="script-tagline text-cyan mb-8">
            {subtitle}
          </p>
        )}
        
        <Link href={ctaLink}>
          <button className="btn-salmon">
            {ctaText}
          </button>
        </Link>
      </div>
    </section>
  );
}