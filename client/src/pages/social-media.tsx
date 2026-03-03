import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Smartphone, TrendingUp, Users, Video, Camera, Hash } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";

export default function SocialMedia() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      <Navigation />
      
      {/* Hero Section */}
      <GradientBackground section="social-media-hero" className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/images/hero/social-media-engine-03.jpg" 
            alt="Social Media Marketing"
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-black/70 border border-cyan rounded-2xl p-8 md:p-12">
            <h1 className="mb-6 text-social-media-hero-primary">
              Social Media Excellence
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white max-w-3xl mx-auto">
              Elevate your brand with stunning visuals and strategic content
            </p>
            <div className="flex justify-center">
              <Link href="/contact">
                <Button size="lg" className="btn-salmon">
                  Start Your Campaign
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Services Overview */}
      <GradientBackground section="social-media-services" className="py-20 relative overflow-hidden" id="services">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 text-social-media-services-primary">
              Complete Social Media Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From content creation to strategy, we handle every aspect of your social media presence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
              <Camera className="w-12 h-12 text-cyan mb-4" />
              <h3 className="mb-3 text-social-media-services-primary">Content Creation</h3>
              <p className="text-muted-foreground mb-4">
                Professional photography and videography tailored for social media platforms
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Instagram-ready photos</li>
                <li>• TikTok & Reels videos</li>
                <li>• Story content</li>
                <li>• Product shoots</li>
              </ul>
            </div>

            {/* Service Card 2 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
              <TrendingUp className="w-12 h-12 text-salmon mb-4" />
              <h3 className="mb-3 text-social-media-services-primary">Business Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Data-driven strategies to grow your audience and increase engagement
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Content calendars</li>
                <li>• Hashtag research</li>
                <li>• Competitor analysis</li>
                <li>• Growth strategies</li>
              </ul>
            </div>

            {/* Service Card 3 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
              <Users className="w-12 h-12 text-cyan mb-4" />
              <h3 className="mb-3 text-social-media-services-primary">Inbox Management</h3>
              <p className="text-muted-foreground mb-4">
                AI-assisted inbox management across all social media platforms with intelligent solutions
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AI-powered responses</li>
                <li>• Company knowledge base</li>
                <li>• Multi-platform management</li>
                <li>• Intelligent routing</li>
              </ul>
            </div>

            {/* Service Card 4 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
              <Video className="w-12 h-12 text-salmon mb-4" />
              <h3 className="mb-3 text-social-media-services-primary">Video Production</h3>
              <p className="text-muted-foreground mb-4">
                Engaging video content optimized for maximum reach and impact
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Short-form videos</li>
                <li>• Live streaming</li>
                <li>• Motion graphics</li>
                <li>• Video editing</li>
              </ul>
            </div>

            {/* Service Card 5 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-cyan/50 transition-all service-card-gradient">
              <Smartphone className="w-12 h-12 text-cyan mb-4" />
              <h3 className="mb-3 text-social-media-services-primary">AI Automation</h3>
              <p className="text-muted-foreground mb-4">
                Automated content creation and scheduling powered by artificial intelligence
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Content generation</li>
                <li>• Blog and post creation</li>
                <li>• Image scheduling</li>
                <li>• Calendar automation</li>
              </ul>
            </div>

            {/* Service Card 6 */}
            <div className="rounded-lg p-8 border border-white/10 hover:border-salmon/50 transition-all service-card-gradient">
              <Hash className="w-12 h-12 text-salmon mb-4" />
              <h3 className="mb-3 text-social-media-services-primary">Advert Campaigns</h3>
              <p className="text-muted-foreground mb-4">
                Targeted advertising campaigns across Meta Suite and TikTok platforms
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Meta Suite targeting</li>
                <li>• TikTok advertising</li>
                <li>• Audience optimization</li>
                <li>• Campaign analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Why Choose Us */}
      <GradientBackground section="social-media-why-choose-us" className="py-20 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 text-social-media-why-choose-us-primary">
              Slyfox Social Media Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We combine creative excellence with data-driven strategies to deliver results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="mb-4 text-social-media-why-choose-us-primary">Creative Excellence</h3>
              <p className="text-muted-foreground mb-6">
                Our team of photographers, videographers, and designers create stunning content that stops the scroll. 
                We understand the visual language of social media and craft content that resonates with your audience.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-cyan mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Professional equipment and editing software</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-cyan mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Trend-aware content creation</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-cyan mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Brand-consistent visual identity</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-social-media-why-choose-us-primary">Strategic Approach</h3>
              <p className="text-muted-foreground mb-6">
                We don't just create beautiful content – we create content with purpose. Our strategies are backed by 
                analytics, market research, and a deep understanding of social media algorithms.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-salmon mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Data-driven decision making</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-salmon mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Monthly performance reports</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-salmon mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Continuous optimization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* CTA Section */}
      <GradientBackground section="social-media-cta" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl mb-6 text-social-media-cta-primary">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's create content that connects, engages, and converts your audience
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="btn-salmon">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-cyan text-cyan hover:bg-cyan/10">
                View Packages
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}