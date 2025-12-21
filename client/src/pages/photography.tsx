import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { EnhancedHeroSlider } from "@/components/sections/enhanced-hero-slider";
import { PortfolioShowcase } from "@/components/sections/portfolio-showcase";
import { ClientGalleryAccess } from "@/components/sections/client-gallery-access";
import { PhotographyNavigation } from "@/components/sections/photography-navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { photography as defaultPhotography } from "@/config/site-config";

// Fallback configuration in case import fails
const fallbackPhotography = {
  sections: {
    callToAction: {
      title: "Ready to Capture Your Story?",
      subtitle: "Let's discuss your photography needs and create something beautiful together.",
      primaryButton: {
        text: "Start Your Project",
        link: "/contact"
      },
      secondaryButton: {
        text: "View Pricing",
        link: "/pricing"
      }
    }
  }
};

export default function Photography() {
  const config = defaultPhotography || fallbackPhotography;
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* Static SEO content - loads immediately before dynamic content */}
      <h1 className="sr-only">SlyFox Studios - Professional Photography & Videography in Durban, South Africa</h1>

      <Navigation />
      <EnhancedHeroSlider />
      <PhotographyNavigation />
      <PortfolioShowcase />
      <ClientGalleryAccess />
      
      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-emerald-900/30 via-background to-cyan-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-salmon">
            {config.sections.callToAction.title}
          </h2>
          <h3 className="text-xl mb-8">
            {config.sections.callToAction.subtitle}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={config.sections.callToAction.primaryButton.link}>
              <Button className="btn-salmon">{config.sections.callToAction.primaryButton.text}</Button>
            </Link>
            <Link href={config.sections.callToAction.secondaryButton.link}>
              <Button className="btn-outline-cyan">{config.sections.callToAction.secondaryButton.text}</Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
