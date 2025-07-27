import { Button } from "@/components/ui/button";

const stats = [
  { number: "500+", label: "Happy Clients" },
  { number: "5 Years", label: "Experience" },
  { number: "1000+", label: "Events Captured" },
  { number: "Cape Town", label: "Based & Proud" }
];

export function AboutSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-900/40 via-background to-violet-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <img 
              src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&h=700" 
              alt="SlyFox Studios team at work" 
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="cyan text-4xl lg:text-5xl mb-6">
              About <span>SlyFox Studios</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-6">
              Founded in the heart of Cape Town, SlyFox Studios is more than just a photography business—we're storytellers, memory makers, and artists passionate about capturing life's most precious moments.
            </p>

            <p className="text-lg text-muted-foreground mb-8">
              Our team combines technical expertise with creative vision to deliver stunning visual narratives that stand the test of time. Whether it's your wedding day, a corporate milestone, or a personal portrait session, we approach every project with the same dedication to excellence.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl text-salmon mb-2">{stat.number}</div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <Button 
              variant="outline"
              className="border-2 border-gold text-gold px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-300 transform hover:scale-105"
            >
              Meet Our Team
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
