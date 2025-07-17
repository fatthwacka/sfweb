import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface VideoHeroProps {
  videoUrl?: string;
  title: ReactNode;
  subtitle: ReactNode;
  primaryAction?: {
    text: string;
    onClick: () => void;
    variant?: "salmon" | "cyan";
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export function VideoHero({ 
  videoUrl = "https://www.youtube.com/embed/0KMY9L849Hg",
  title, 
  subtitle, 
  primaryAction, 
  secondaryAction,
  className = ""
}: VideoHeroProps) {
  // Convert YouTube URL to embed format with autoplay and loop
  const getEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=${videoId}`;
  };

  return (
    <section className={`relative h-screen overflow-hidden ${className}`}>
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="absolute top-1/2 left-1/2 w-[177.77777778vh] h-[56.25vw] min-h-full min-w-full transform -translate-x-1/2 -translate-y-1/2"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{
            border: 'none',
            pointerEvents: 'none'
          }}
        />
        {/* Light overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-10" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-quicksand font-bold text-white mb-6 leading-tight">
            {title}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  size="lg"
                  className={`px-8 py-4 text-lg font-barlow font-semibold rounded-full transition-all duration-300 transform hover:scale-105 ${
                    primaryAction.variant === "cyan" 
                      ? "bg-cyan text-black hover:bg-cyan-muted" 
                      : "bg-salmon text-black hover:bg-salmon-muted"
                  }`}
                >
                  {primaryAction.text}
                </Button>
              )}
              
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-barlow font-semibold rounded-full border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  {secondaryAction.text}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}