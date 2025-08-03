import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { ServicesOverview } from "@/components/sections/services-overview";
import { PortfolioShowcase } from "@/components/sections/portfolio-showcase";
import { ClientGalleryAccess } from "@/components/sections/client-gallery-access";
import { Testimonials } from "@/components/sections/testimonials";
import { ContactSection } from "@/components/sections/contact-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      <Navigation />
      <Hero />
      <ServicesOverview />
      <PortfolioShowcase />
      <ClientGalleryAccess />
      <Testimonials />
      <ContactSection />
      <Footer />
    </div>
  );
}
