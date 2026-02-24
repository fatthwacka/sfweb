import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/common/gradient-background";

export function HomepageFinalCTA() {
  return (
    <GradientBackground section="contact" className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl mb-6 text-salmon font-light">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let's discuss your vision and create something extraordinary together.
          </p>
          <Link href="/contact">
            <Button size="lg" className="btn-salmon text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </GradientBackground>
  );
}
