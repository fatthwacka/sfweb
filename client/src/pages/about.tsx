import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, Video, Award, Users, MapPin, Clock } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { GradientBackground } from "@/components/common/gradient-background";

// Icon mapping for dynamic icon names
const iconMap = {
  Users,
  Clock, 
  Camera,
  MapPin,
  Award,
  Video
};

// Default fallbacks
const defaultStats = [
  { number: "500+", label: "Happy Clients", icon: "Users" },
  { number: "5 Years", label: "Experience", icon: "Clock" },
  { number: "1000+", label: "Events Captured", icon: "Camera" },
  { number: "Durban", label: "Based & Proud", icon: "MapPin" }
];

const defaultTeamMembers = [
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

const defaultValues = [
  {
    icon: "Camera",
    title: "Artistic Excellence",
    description: "We approach every project with creative vision and technical precision, ensuring stunning results that exceed expectations."
  },
  {
    icon: "Users",
    title: "Client-Centered",
    description: "Your vision is our priority. We listen, collaborate, and deliver personalized experiences that reflect your unique story."
  },
  {
    icon: "Award",
    title: "Professional Quality",
    description: "From equipment to editing, we maintain the highest professional standards in every aspect of our work."
  },
  {
    icon: "Clock",
    title: "Timely Delivery",
    description: "We respect your deadlines and deliver high-quality work within agreed timeframes, every time."
  }
];

const defaultParagraphs = [
  "SlyFox Studios was born from a passion for visual storytelling and a commitment to capturing the authentic moments that matter most. Founded in Durban, we've grown from a small startup to a trusted name in professional photography and videography.",
  "Our journey began with a simple belief: every moment has a story worth telling. Whether it's the joy of a wedding day, the professionalism of a corporate headshot, or the celebration of a graduation, we approach each project with the same dedication to excellence.",
  "Today, we're proud to serve clients across Durban and beyond, combining artistic vision with technical expertise to create images and videos that stand the test of time."
];

export default function About() {
  const { config } = useSiteConfig();
  
  // Get data from config with fallbacks
  const aboutData = config?.about;
  const stats = aboutData?.hero?.stats || defaultStats;
  const teamMembers = aboutData?.team?.members || defaultTeamMembers;
  const values = aboutData?.values?.items || defaultValues;
  const storyParagraphs = aboutData?.story?.paragraphs || defaultParagraphs;
  
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>About SlyFox Studios - Professional Photography & Videography Durban</title>
      <meta name="description" content="Meet the SlyFox Studios team. Professional photographers and videographers based in Durban, South Africa. Learn about our story, values, and commitment to excellence." />
      <meta name="keywords" content="SlyFox Studios team, Durban photographers, photography studio about, professional videographers, South African photography company" />
      
      <Navigation />
      
      {/* Our Story Section */}
      <GradientBackground section="aboutStory" className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl mb-6 h2-salmon">
                {aboutData?.story?.title || "Our Story"}
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="mt-8">
                <Link href="/contact">
                  <Button className="btn-salmon">
                    Work With Us
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={aboutData?.story?.image || "https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                alt="SlyFox Studios team at work"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Values Section */}
      <GradientBackground section="aboutValues" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              {aboutData?.values?.title || "Our Values"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {aboutData?.values?.description || "These core values guide everything we do, from our initial consultation to the final delivery of your images."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = iconMap[value.icon as keyof typeof iconMap] || Award;
              return (
                <div key={value.id || index} className="text-center p-6 bg-charcoal rounded-2xl hover:bg-salmon/10 transition-colors duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6">
                    <IconComponent className={`w-8 h-8 ${index % 2 === 0 ? 'icon-salmon' : 'icon-cyan'}`} />
                  </div>
                  <h3 className="text-xl font-saira font-bold text-gold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </GradientBackground>

      {/* Team Section */}
      <GradientBackground section="aboutTeam" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-salmon">
              {aboutData?.team?.title || "Meet Our Team"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {aboutData?.team?.description || "The creative minds behind SlyFox Studios, each bringing unique skills and passion to every project."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={member.id || index} className="bg-charcoal/80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-salmon/20 transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative h-80 overflow-hidden">
                  <img 
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-2xl text-salmon mb-2">{member.name}</h3>
                  <p className="text-cyan/80 mb-4">{member.role}</p>
                  <p className="text-muted-foreground mb-6">{member.description}</p>
                  <a 
                    href={`mailto:${member.email}`}
                    className="text-salmon hover:text-salmon-muted transition-colors duration-300"
                  >
                    {member.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GradientBackground>

      {/* Location Section */}
      <GradientBackground section="aboutLocation" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl mb-6 h2-salmon">
                Based in Durban
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  Operating from the beautiful city of Durban, we're perfectly positioned to capture the stunning landscapes, vibrant culture, and dynamic energy that makes South Africa unique.
                </p>
                <p>
                  Our local knowledge and deep connection to the Durban community allows us to suggest the perfect locations for your shoots and understand the cultural nuances that make each project special.
                </p>
                <p>
                  While we're based in Durban, we're always excited to travel for special projects and destination shoots across South Africa and beyond.
                </p>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 icon-salmon mr-4" />
                  <span>Durban, South Africa</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-6 h-6 icon-cyan mr-4" />
                  <span>Monday - Friday: 9AM - 6PM</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/images/backgrounds/tiger-and-model-walking.jpg"
                alt="Durban landscape"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </GradientBackground>


      {/* Call to Action */}
      <GradientBackground section="aboutCta" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-cyan">
            {aboutData?.cta?.title || "Ready to Create Together?"}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {aboutData?.cta?.description || "Let's discuss your vision and create something beautiful that tells your unique story."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="btn-cyan">
                {aboutData?.cta?.buttonText || "Get In Touch"}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button className="btn-outline-salmon">
                View Our Work
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}
