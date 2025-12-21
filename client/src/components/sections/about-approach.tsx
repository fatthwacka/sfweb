import { GradientBackground } from "@/components/common/gradient-background";

export function AboutApproach() {
  return (
    <GradientBackground section="portfolio" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-light text-salmon mb-6 leading-tight">
                Our Approach
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/50 rounded-lg p-6 border border-slate-700/40">
                  <h3 className="text-cyan text-lg font-semibold mb-3">Emotive Power</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We combine the emotive power of professional photography and video production with the precision and efficiency of modern AI automation.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/50 rounded-lg p-6 border border-slate-700/40">
                  <h3 className="text-salmon text-lg font-semibold mb-3">Complete Solutions</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We don't just capture your story through the lens of our studio, we build web apps, AI automations and intelligent tools, that ensures your business runs as beautifully as it looks.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Image Side */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-xl">
              <img
                src="/uploads/slyfox-pro-studio-lighting.jpg"
                alt="Professional studio setup with advanced lighting and equipment"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
            
            {/* Floating accent element */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-salmon/20 to-cyan/20 rounded-full backdrop-blur-sm border border-white/10"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-cyan/20 to-salmon/20 rounded-full backdrop-blur-sm border border-white/10"></div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}