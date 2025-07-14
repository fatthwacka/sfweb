import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { ServicesOverview } from "@/components/sections/services-overview";
import { PortfolioShowcase } from "@/components/sections/portfolio-showcase";
import { PricingSection } from "@/components/sections/pricing-section";
import { ClientGalleryAccess } from "@/components/sections/client-gallery-access";
import { AboutSection } from "@/components/sections/about-section";
import { Testimonials } from "@/components/sections/testimonials";
import { ContactSection } from "@/components/sections/contact-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Hero />
      <ServicesOverview />
      <PortfolioShowcase />
      <PricingSection />
      <ClientGalleryAccess />
      <AboutSection />
      <Testimonials />
      <ContactSection />
      <Footer />
    </div>
  );
}
