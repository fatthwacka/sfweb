import React from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { GradientBackground } from '@/components/common/gradient-background';
import { PortfolioGrid } from '@/components/portfolio/portfolio-grid';
import { Star, Camera, Video } from 'lucide-react';

export function Portfolio() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <GradientBackground section="portfolio" className="pt-20 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-white text-5xl lg:text-6xl mb-6 font-light">
              Our <span className="text-salmon">Portfolio</span>
            </h1>
            <p className="text-muted-foreground text-xl lg:text-2xl max-w-4xl mx-auto mb-8">
              Explore our collection of stunning photography and videography work. 
              Each gallery showcases unique moments, creative vision, and professional excellence.
            </p>
            <div className="inline-flex items-center gap-2 text-cyan">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-sm font-medium">Professional galleries featuring photos and videos</span>
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
          
          {/* Feature Icons */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-white">
              <Camera className="w-6 h-6 text-salmon" />
              <span className="text-sm font-medium">Photography</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Video className="w-6 h-6 text-cyan" />
              <span className="text-sm font-medium">Videography</span>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Portfolio Grid Section */}
      <div className="py-20" style={{ background: 'linear-gradient(to bottom, #64748b 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-white text-4xl lg:text-5xl mb-6">
              Featured <span className="text-cyan">Galleries</span>
            </h2>
            <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto">
              Click on any gallery to experience our professional presentation system. 
              Video galleries feature dynamic previews on hover for an engaging experience.
            </p>
          </div>

          <PortfolioGrid />

          {/* Call to Action */}
          <div className="text-center mt-20">
            <div className="bg-black/40 border border-white/20 rounded-2xl p-12 max-w-3xl mx-auto">
              <h3 className="text-3xl text-white mb-4">
                Ready to Create Your <span className="text-salmon">Own Gallery?</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-8">
                Professional photography and videography services with premium gallery delivery.
                Your memories deserve the finest presentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="bg-salmon hover:bg-salmon/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  Book Your Session
                </a>
                <a 
                  href="/gallery-demo" 
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  View Demo Galleries
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}