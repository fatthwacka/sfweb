import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Globe, Smartphone, Code, Palette, Zap, Shield } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";

export default function WebApps() {
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

      {/* Process Section */}
      <GradientBackground section="web-apps-process" className="py-20 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 text-web-apps-process-primary">
              Our Development Process
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A structured approach to deliver projects on time and within budget
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-salmon/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-salmon">1</span>
              </div>
              <h3 className="mb-2 text-web-apps-process-primary">Discovery</h3>
              <p className="text-muted-foreground text-sm">
                Understanding your needs and defining project scope
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan">2</span>
              </div>
              <h3 className="mb-2 text-web-apps-process-primary">Design</h3>
              <p className="text-muted-foreground text-sm">
                Creating wireframes and visual designs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-salmon/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-salmon">3</span>
              </div>
              <h3 className="mb-2 text-web-apps-process-primary">Development</h3>
              <p className="text-muted-foreground text-sm">
                Building your solution with clean, maintainable code
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan">4</span>
              </div>
              <h3 className="mb-2 text-web-apps-process-primary">Testing</h3>
              <p className="text-muted-foreground text-sm">
                Rigorous quality assurance and user testing
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-salmon/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-salmon">5</span>
              </div>
              <h3 className="mb-2 text-web-apps-process-primary">Launch</h3>
              <p className="text-muted-foreground text-sm">
                Deployment and ongoing support
              </p>
            </div>
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