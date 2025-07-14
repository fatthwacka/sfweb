import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, Video, Award, Users, MapPin, Clock } from "lucide-react";

const stats = [
  { number: "500+", label: "Happy Clients", icon: Users },
  { number: "5 Years", label: "Experience", icon: Clock },
  { number: "1000+", label: "Events Captured", icon: Camera },
  { number: "Cape Town", label: "Based & Proud", icon: MapPin }
];

const teamMembers = [
  {
    name: "Dax Tucker",
    role: "Founder & Lead Photographer",
    email: "dax@slyfox.co.za",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    description: "With over 5 years of experience, Dax brings artistic vision and technical expertise to every project."
  },
  {
    name: "Eben",
    role: "Senior Videographer", 
    email: "eben@slyfox.co.za",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    description: "Eben specializes in cinematic videography and brings stories to life through compelling visual narratives."
  },
  {
    name: "Kyle",
    role: "Creative Director",
    email: "kyle@slyfox.co.za", 
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    description: "Kyle oversees creative direction and ensures every project meets our high standards of excellence."
  }
];

const values = [
  {
    icon: Camera,
    title: "Artistic Excellence",
    description: "We approach every project with creative vision and technical precision, ensuring stunning results that exceed expectations."
  },
  {
    icon: Users,
    title: "Client-Centered",
    description: "Your vision is our priority. We listen, collaborate, and deliver personalized experiences that reflect your unique story."
  },
  {
    icon: Award,
    title: "Professional Quality",
    description: "From equipment to editing, we maintain the highest professional standards in every aspect of our work."
  },
  {
    icon: Clock,
    title: "Timely Delivery",
    description: "We respect your deadlines and deliver high-quality work within agreed timeframes, every time."
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>About SlyFox Studios - Professional Photography & Videography Cape Town</title>
      <meta name="description" content="Meet the SlyFox Studios team. Professional photographers and videographers based in Cape Town, South Africa. Learn about our story, values, and commitment to excellence." />
      <meta name="keywords" content="SlyFox Studios team, Cape Town photographers, photography studio about, professional videographers, South African photography company" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-saira font-black mb-6">
              About <span className="text-gold">SlyFox Studios</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Founded in the heart of Cape Town, we're more than just a photography business—we're storytellers, memory makers, and artists passionate about capturing life's most precious moments.
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="w-8 h-8 text-gold mx-auto mb-4" />
                  <div className="text-3xl font-saira font-bold text-gold mb-2">{stat.number}</div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-saira font-black mb-6">
                Our <span className="text-gold">Story</span>
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  SlyFox Studios was born from a passion for visual storytelling and a commitment to capturing the authentic moments that matter most. Founded in Cape Town, we've grown from a small startup to a trusted name in professional photography and videography.
                </p>
                <p>
                  Our journey began with a simple belief: every moment has a story worth telling. Whether it's the joy of a wedding day, the professionalism of a corporate headshot, or the celebration of a graduation, we approach each project with the same dedication to excellence.
                </p>
                <p>
                  Today, we're proud to serve clients across Cape Town and beyond, combining artistic vision with technical expertise to create images and videos that stand the test of time.
                </p>
              </div>
              
              <div className="mt-8">
                <Link href="/contact">
                  <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
                    Work With Us
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="SlyFox Studios team at work"
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-gold text-black p-4 rounded-xl">
                <Camera className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              Our <span className="text-gold">Values</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These core values guide everything we do, from our initial consultation to the final delivery of your images.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="text-center p-6 bg-charcoal rounded-2xl hover:bg-gold/10 transition-colors duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold text-black rounded-full mb-6">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-saira font-bold text-gold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              Meet Our <span className="text-gold">Team</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The creative minds behind SlyFox Studios, each bringing unique skills and passion to every project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-black rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative h-80 overflow-hidden">
                  <img 
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-2xl font-saira font-bold text-gold mb-2">{member.name}</h3>
                  <p className="text-gold/80 font-barlow font-semibold mb-4">{member.role}</p>
                  <p className="text-muted-foreground mb-6">{member.description}</p>
                  <a 
                    href={`mailto:${member.email}`}
                    className="text-gold hover:text-gold-muted transition-colors duration-300 font-barlow font-semibold"
                  >
                    {member.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-saira font-black mb-6">
                Based in <span className="text-gold">Cape Town</span>
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  Operating from the beautiful city of Cape Town, we're perfectly positioned to capture the stunning landscapes, vibrant culture, and dynamic energy that makes South Africa unique.
                </p>
                <p>
                  Our local knowledge and deep connection to the Cape Town community allows us to suggest the perfect locations for your shoots and understand the cultural nuances that make each project special.
                </p>
                <p>
                  While we're based in Cape Town, we're always excited to travel for special projects and destination shoots across South Africa and beyond.
                </p>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-gold mr-4" />
                  <span>Cape Town, South Africa</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-gold mr-4" />
                  <span>Monday - Friday: 9AM - 6PM</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Cape Town landscape"
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-gold text-black p-4 rounded-xl">
                <MapPin className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-saira font-black mb-6">
            Ready to Create <span className="text-gold">Together?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your vision and create something beautiful that tells your unique story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
                Get In Touch
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-2 border-white text-white px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-white hover:text-black transition-all duration-300">
                View Our Work
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
