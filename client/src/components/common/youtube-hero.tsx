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
    <section className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] min-h-[400px] max-h-[600px] flex items-center justify-center overflow-hidden">
      {/* YouTube Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${window.location.origin}&disablekb=1&fs=0`}
          title="Background Video"
          allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
          allowFullScreen={false}
          className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-0"
          style={{
            minWidth: '100%',
            minHeight: '100%'
          }}
        />
      </div>
      
      {/* Video Overlay */}
      <div className="video-overlay" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="mb-8">
          {title}
        </h1>
        
        {subtitle && (
          <p className="script-tagline mb-8">
            {subtitle}
          </p>
        )}
        
        <Link href={ctaLink}>
          <button className="btn-elegant">
            {ctaText}
          </button>
        </Link>
      </div>
    </section>
  );
}