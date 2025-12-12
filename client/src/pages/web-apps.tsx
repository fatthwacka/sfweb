import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowRight, Globe, Smartphone, Code, Palette, Zap, Shield, Wrench, FolderOpen, Sparkles, FileText, Search, Package } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";

export default function WebApps() {
  const [, setLocation] = useLocation();

  // Tool card data with navigation
  const tools = [
    {
      name: 'File Renamer',
      description: 'Batch rename files with smart pattern matching',
      icon: FolderOpen,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      path: '/tools/file-renamer',
    },
    {
      name: 'Duplicate Finder',
      description: 'Find and remove duplicate files intelligently',
      icon: Search,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      path: '/tools/duplicate-finder',
    },
    {
      name: 'Smart Organiser',
      description: 'AI-powered file organisation and categorisation',
      icon: Sparkles,
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
      path: '/tools/smart-organiser',
    },
    {
      name: 'Bulk Mover',
      description: 'Move and consolidate files with conflict resolution',
      icon: Package,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      path: '/tools/bulk-mover',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      <Navigation />
      
      {/* Hero Section */}
      <GradientBackground section="web-apps-hero" className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/images/hero/Slyfox-Ai-Automation-and-AppDev-02.jpg" 
            alt="Web & App Development"
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6 text-web-apps-hero-primary">
            Web & App Development
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white max-w-3xl mx-auto">
            Crafting digital experiences that captivate users and drive business growth
          </p>
          <div className="flex justify-center">
            <Link href="/contact">
              <Button size="lg" className="btn-cyan">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>

      {/* Services Overview */}
      <GradientBackground section="web-apps-services" className="py-20 relative overflow-hidden" id="services">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 text-web-apps-services-primary">
              Full-Stack Digital Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From concept to deployment, we build digital products that make an impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
              <Globe className="w-12 h-12 text-salmon mb-4" />
              <h3 className="mb-3 text-web-apps-services-primary">Web Development</h3>
              <p className="text-muted-foreground mb-4">
                Modern, responsive websites that deliver exceptional user experiences
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Corporate websites</li>
                <li>• E-commerce platforms</li>
                <li>• Portfolio sites</li>
                <li>• Landing pages</li>
              </ul>
            </div>

            {/* Service Card 2 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
              <Smartphone className="w-12 h-12 text-cyan mb-4" />
              <h3 className="mb-3 text-web-apps-services-primary">Mobile Apps</h3>
              <p className="text-muted-foreground mb-4">
                Native and cross-platform apps that users love to engage with
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• iOS development</li>
                <li>• Android development</li>
                <li>• Cross-platform apps</li>
                <li>• Progressive web apps</li>
              </ul>
            </div>

            {/* Service Card 3 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
              <Code className="w-12 h-12 text-salmon mb-4" />
              <h3 className="mb-3 text-web-apps-services-primary">Custom Software</h3>
              <p className="text-muted-foreground mb-4">
                Tailored solutions to solve your unique business challenges
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Business automation</li>
                <li>• API development</li>
                <li>• Database design</li>
                <li>• System integration</li>
              </ul>
            </div>

            {/* Service Card 4 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
              <Palette className="w-12 h-12 text-cyan mb-4" />
              <h3 className="mb-3 text-web-apps-services-primary">UI/UX Design</h3>
              <p className="text-muted-foreground mb-4">
                Beautiful, intuitive designs that delight users at every touchpoint
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• User research</li>
                <li>• Wireframing</li>
                <li>• Prototyping</li>
                <li>• Design systems</li>
              </ul>
            </div>

            {/* Service Card 5 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
              <Zap className="w-12 h-12 text-salmon mb-4" />
              <h3 className="mb-3 text-web-apps-services-primary">Performance</h3>
              <p className="text-muted-foreground mb-4">
                Lightning-fast applications optimized for speed and efficiency
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Speed optimization</li>
                <li>• SEO enhancement</li>
                <li>• Cloud deployment</li>
                <li>• Scalability planning</li>
              </ul>
            </div>

            {/* Service Card 6 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
              <Shield className="w-12 h-12 text-cyan mb-4" />
              <h3 className="mb-3 text-web-apps-services-primary">Maintenance</h3>
              <p className="text-muted-foreground mb-4">
                Ongoing support to keep your digital assets secure and up-to-date
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Security updates</li>
                <li>• Bug fixes</li>
                <li>• Feature updates</li>
                <li>• 24/7 monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 text-web-apps-hero-primary">
              Modern Technology Stack
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We use cutting-edge technologies to build robust, scalable solutions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="rounded-lg p-6 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
                <h3 className="text-web-apps-hero-primary">Frontend</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  React, Vue, Angular, Next.js
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="rounded-lg p-6 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
                <h3 className="text-web-apps-hero-primary">Backend</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Node.js, Python, PHP, .NET, Java
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="rounded-lg p-6 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
                <h3 className="text-web-apps-hero-primary">Mobile</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  React Native, Flutter, Swift, Kotlin
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="rounded-lg p-6 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
                <h3 className="text-web-apps-hero-primary">Cloud</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  AWS, Google Cloud, Azure, Vercel
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tools Section */}
      <GradientBackground section="web-apps-process" className="py-20 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-salmon/20 mb-6">
              <Wrench className="w-8 h-8 text-salmon" />
            </div>
            <h2 className="text-4xl lg:text-5xl mb-6 text-web-apps-process-primary">
              Free Productivity Tools
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We've built a collection of free utilities to help streamline your workflow.
              No signup required for most tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {tools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.path}
                  onClick={() => setLocation(tool.path)}
                  className={`rounded-xl p-6 border border-white/10 ${index % 2 === 0 ? 'hover:border-salmon/50' : 'hover:border-cyan/50'} transition-all service-card-gradient text-center cursor-pointer group`}
                >
                  <div className={`w-12 h-12 ${tool.iconBg} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <h3 className="text-white font-medium mb-2">{tool.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {tool.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/tools">
              <Button size="lg" className="btn-salmon">
                Explore All Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>


      {/* CTA Section */}
      <GradientBackground section="web-apps-cta" className="py-20 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl mb-6 text-web-apps-cta-primary">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's discuss your project and bring your vision to life
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="btn-cyan">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-salmon text-salmon hover:bg-salmon/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}