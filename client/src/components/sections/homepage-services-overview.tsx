import { Link } from "wouter";
import { ArrowRight, Cpu, Bot, Cog, Camera } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";

export function HomepageServicesOverview() {
  // Homepage-specific services data
  const services = [
    {
      id: "photography-service",
      title: "Photography",
      description: "Professional photography for portraits, weddings, products and events.",
      image: "/uploads/slyfox-pro-studio-lighting.jpg",
      ctaText: "Explore Photography",
      color: "salmon",
      link: "/photography"
    },
    {
      id: "videography-service",
      title: "Videography",
      description: "Stunning videography for festivals, weddings, products, and corporates.",
      image: "/uploads/wedding-videography-hero_1756052522344.jpg",
      ctaText: "Explore Videography",
      color: "cyan",
      link: "/videography"
    },
    {
      id: "social-media-service",
      title: "Social Media",
      description: "Professional social media content production and channel management.",
      image: "/uploads/mobile-app_1756725379717.jpg",
      ctaText: "Explore Service",
      color: "salmon",
      link: "/social-media"
    },
    {
      id: "web-apps-service",
      title: "Web & Apps",
      description: "Slick Websites, Apps and Ai automations that help your business",
      image: "/uploads/Slyfox-Ai-Automation-and-AppDev-02_1757855053671.jpg",
      ctaText: "Explore Service",
      color: "salmon",
      link: "/web-apps"
    }
  ];

  // Get color classes based on service color
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'salmon': return { text: 'text-salmon', icon: 'icon-salmon' };
      case 'cyan': return { text: 'text-cyan', icon: 'icon-cyan' };
      default: return { text: 'text-salmon', icon: 'icon-salmon' };
    }
  };

  return (
    <GradientBackground section="services" className="pt-12 pb-20" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/uploads/trees-20.png" 
              alt="Analog Intelligence" 
              className="w-16 h-16 opacity-90"
            />
          </div>
          <h1 className="mb-4 leading-tight">
            Analog Intelligence
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-4xl mx-auto">
            We provide professional studio Photography & Videography, and AI business automation tools suited to small and medium sized businesses.
          </p>
          
          {/* New content in stylish cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            <div 
              className="rounded-xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.9) 0%, rgba(40, 20, 40, 0.6) 50%, rgba(10, 10, 15, 0.95) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.3)'
              }}
            >
              <div className="flex justify-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.4), inset 0 0 20px rgba(236, 72, 153, 0.1)'
                  }}
                >
                  <Bot className="w-8 h-8" style={{ color: '#ec4899' }} />
                </div>
              </div>
              <h3 className="text-salmon text-lg font-semibold mb-4">Beyond AI Gimmicks</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Prompt-generated AI images can look impressive on screen, but they fall apart in real-world business use.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                Serious brands need organic, high-resolution professional production that doesn't get deranked by algorithms.
              </p>
            </div>
            
            <div 
              className="rounded-xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.9) 0%, rgba(20, 40, 20, 0.6) 50%, rgba(10, 10, 15, 0.95) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}
            >
              <div className="flex justify-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), inset 0 0 20px rgba(34, 197, 94, 0.1)'
                  }}
                >
                  <Cog className="w-8 h-8" style={{ color: '#22c55e' }} />
                </div>
              </div>
              <h3 className="text-cyan text-lg font-semibold mb-4">Engineered Workflows</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We use our own AI tools alongside professional photo and video production to work faster without losing quality.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                The result is detailed, high-resolution visuals that go far beyond standard AI generation.
              </p>
            </div>
            
            <div 
              className="rounded-xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.9) 0%, rgba(20, 20, 40, 0.6) 50%, rgba(10, 10, 15, 0.95) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <div className="flex justify-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                  }}
                >
                  <Camera className="w-8 h-8" style={{ color: '#3b82f6' }} />
                </div>
              </div>
              <h3 className="text-salmon text-lg font-semibold mb-4">High-End Production</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Premium, billboard-ready visuals built to enterprise-grade quality—at a fraction of the cost.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                We also build custom tools and AI automations that help businesses deploy, manage, and scale their operations.
              </p>
            </div>
          </div>
        </div>

      </div>
    </GradientBackground>
  );
}