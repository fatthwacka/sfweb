import { VideoHero } from "./video-hero";
import { Camera, Video, Award } from "lucide-react";

export function HeroSection() {
  return (
    <>
      <VideoHero
        title={
          <>
            Capturing Life's
            <br />
            <span className="text-salmon font-great-vibes text-6xl sm:text-7xl lg:text-8xl block mt-2">
              Beautiful Moments
            </span>
          </>
        }
        subtitle="Professional photography and videography services in Cape Town. Creating timeless memories through our lens, one frame at a time."
        primaryAction={{
          text: "View Our Work",
          onClick: () => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }),
          variant: "salmon"
        }}
        secondaryAction={{
          text: "Get a Quote",
          onClick: () => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      {/* Service Highlights - Moved below hero */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10">
              <Camera className="w-12 h-12 text-cyan mb-4" />
              <h3 className="text-xl font-quicksand font-bold text-white mb-2">Photography</h3>
              <p className="text-gray-300 text-center">Professional photography for all occasions</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10">
              <Video className="w-12 h-12 text-salmon mb-4" />
              <h3 className="text-xl font-quicksand font-bold text-white mb-2">Videography</h3>
              <p className="text-gray-300 text-center">Cinematic storytelling and event coverage</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10">
              <Award className="w-12 h-12 text-cyan mb-4" />
              <h3 className="text-xl font-quicksand font-bold text-white mb-2">Excellence</h3>
              <p className="text-gray-300 text-center">Award-winning quality and service</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
