export function AboutSection() {
  return (
    <section className="py-20 bg-charcoal">
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
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              About <span className="text-gold">SlyFox Studios</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-6">
              Founded in the heart of Cape Town, SlyFox Studios is more than just a photography business—we're storytellers, memory makers, and artists passionate about capturing life's most precious moments.
            </p>
            
            <p className="text-lg text-gray-400 mb-8">
              Our team combines technical expertise with creative vision to deliver stunning visual narratives that stand the test of time. Whether it's your wedding day, a corporate milestone, or a personal portrait session, we approach every project with the same dedication to excellence.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-3xl font-saira font-bold text-gold mb-2">500+</div>
                <p className="text-gray-400">Happy Clients</p>
              </div>
              <div>
                <div className="text-3xl font-saira font-bold text-gold mb-2">5 Years</div>
                <p className="text-gray-400">Experience</p>
              </div>
              <div>
                <div className="text-3xl font-saira font-bold text-gold mb-2">1000+</div>
                <p className="text-gray-400">Events Captured</p>
              </div>
              <div>
                <div className="text-3xl font-saira font-bold text-gold mb-2">Cape Town</div>
                <p className="text-gray-400">Based & Proud</p>
              </div>
            </div>
            
            <button className="bg-transparent border-2 border-gold text-gold px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-300 transform hover:scale-105">
              Meet Our Team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
