import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Camera, Video, Award, Users, MapPin, Clock } from "lucide-react";
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

// Hardcoded data from site-config-overrides.json
const heroStats = [
  { id: "stat-1", number: "500+", label: "Happy Clients", icon: "Users" },
  { id: "stat-2", number: "5 Years", label: "Experience", icon: "Clock" },
  { id: "stat-3", number: "1000+", label: "Events Captured", icon: "Camera" },
  { id: "stat-4", number: "Durban", label: "Based & Proud", icon: "MapPin" }
];

const teamMembers = [
  {
    id: "team-2",
    name: "Eben Mpongo",
    role: "Senior Photographer",
    email: "eben@slyfox.co.za",
    image: "/uploads/Eben-headshot2_1757419225166.jpg",
    description: "Eben excels at glossy magazine grade photographs, capturing the subjects perfectly, and editing them magical mastery. Whether he's behind the camera or the editing computer, beautiful creations are in progress."
  },
  {
    id: "team-1",
    name: "Dax Tucker",
    role: "Chief Kick Starter",
    email: "dax@slyfox.co.za",
    image: "/uploads/Dax-headshot_1757419137320.jpg",
    description: "Operating with officially half a brain and a world of varied career experiences, Dax brings a background in engineering, software, design, and nightlife. Results are sure to quirky and hazardous."
  },
  {
    id: "team-1756657853204",
    name: "Rainier Potgieter",
    role: "Chief Technical Officer",
    email: "rain@slyfox.co.za",
    image: "/uploads/rain_1756657920900.jpeg",
    description: "Rain has 0s and 1s coursing through his veins and pushes the boundaries of what's possible and what shouldn't be attempted without risk of having satellites start falling out the sky, all before breakfast on a Monday morning."
  },
  {
    id: "team-1756658266555",
    name: "Jarid Norman",
    role: "Sculpture & Master 3D Artist",
    email: "jarid@slyfox.co.za",
    image: "/uploads/jarid-norman_1756658590927.jpg",
    description: "Jarid Norman, a name synonymous with amazing Hollywood grade special FX, costumes, and 3D models, Jarid is as nifty with chainsaw as he is with doing the make up to look like an actor has been chainsawed."
  },
  {
    id: "team-1757419766627",
    name: "Miss T",
    role: "Content Creator",
    email: "missT@slyfox.co.za",
    image: "/uploads/missT-profile-pic_1757421913855.jpg",
    description: "Miss T assists shoots, social media content productions, and scene setups."
  },
  {
    id: "team-1756666622457",
    name: "Kyle Wiesner",
    role: "Content Producer",
    email: "kyle@slyfox.co.za",
    image: "/uploads/Kyle-headshot_1757419428307.jpg",
    description: "Kyle oversees creative content production with a focus on food photography and social media ad creation, arresting hooks and scroll-stopping visuals, and some cunning ai enhancements, visual FX and editing skills."
  },
  {
    id: "team-1757419632616",
    name: "Jona Mpongo",
    role: "Content Creator",
    email: "jona@slyfox.co.za",
    image: "/uploads/Jona-profile-pic_1757419759010.jpg",
    description: "Jona oversees creative content creation with a focus on Ai enhancements, social media reels, fast-paced Tiktok videos, with bad boy music productions and sound tracks, and plenty of gangster attitude."
  },
  {
    id: "team-1757421465533",
    name: "Tarryn Mercier",
    role: "Stylist",
    email: "tarryn@slyfox.co.za",
    image: "/uploads/Taz-profile-pic_1757421907023.jpg",
    description: "Tarryn assists with shoots, social media content productions, and hair styling as well as food recipes and food art."
  }
];

const companyValues = [
  {
    id: "value-1",
    icon: "Camera",
    title: "Artistic Excellence",
    description: "We approach every project with creative vision and technical precision, ensuring stunning results that exceed expectations."
  },
  {
    id: "value-2",
    icon: "Users",
    title: "Client-Centered",
    description: "Your vision is our priority. We listen, collaborate, and deliver personalized experiences that reflect your unique story."
  },
  {
    id: "value-3",
    icon: "Award",
    title: "Professional Quality",
    description: "From equipment to editing, we maintain the highest professional standards in every aspect of our work."
  },
  {
    id: "value-4",
    icon: "Clock",
    title: "Timely Delivery",
    description: "We respect your deadlines and deliver high-quality work within agreed timeframes, every time."
  }
];

const storyParagraphs = [
  "SlyFox Studios was born from a passion for visual storytelling and a commitment to capturing the authentic moments that matter most. Founded in Durban, we've grown from a small startup to a trusted name in professional photography and videography.",
  "Our journey began with a simple belief: every moment has a story worth telling. Whether it's the joy of a wedding day, the professionalism of a corporate headshot, or the celebration of a graduation, we approach each project with the same dedication to excellence.",
  "Today, we're proud to serve clients across Durban and beyond, combining artistic vision with technical expertise to create images and videos that stand the test of time."
];

export default function About() {
  // Hardcoded data - no more config dependency
  
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
                Our Story
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
                src="/uploads/food-photography-hero_1756060136335.jpg"
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
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These core values guide everything we do, from our initial consultation to the final delivery of your images.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => {
              const IconComponent = iconMap[value.icon as keyof typeof iconMap] || Award;
              return (
                <div key={value.id} className="text-center p-6 bg-charcoal rounded-2xl hover:bg-salmon/10 transition-colors duration-300">
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
              Meet Our Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The creative minds behind SlyFox Studios, each bringing unique skills and passion to every project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="bg-charcoal/80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-salmon/20 transition-all duration-300 transform hover:-translate-y-2">
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
            Ready to Create Together?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your vision and create something beautiful that tells your unique story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="btn-cyan">
                Get In Touch
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
