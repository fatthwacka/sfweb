import { useState, useEffect, memo } from "react";
import { Link, useLocation } from "wouter";
import { AuthButton } from "@/components/ui/auth-button";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
// Logo now served from organized public directory
const logoPath = "/images/logos/slyfox-logo-black.png";

const NavigationComponent = memo(function Navigation() {
  const [location] = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-purple-dark/95 backdrop-blur-sm shadow-lg" : "bg-gray-800/50 backdrop-blur-sm"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 relative">
              <img 
                src={logoPath} 
                alt="SlyFox Studios Logo" 
                className="w-10 h-10 filter brightness-0 invert"
                style={{
                  background: 'linear-gradient(135deg, hsl(16, 100%, 73%) 0%, hsl(180, 100%, 50%) 100%)',
                  WebkitMask: `url(${logoPath}) no-repeat center`,
                  mask: `url(${logoPath}) no-repeat center`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain'
                }}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/photography" className={cn(
              "transition-colors duration-300 font-barlow font-light",
              location.startsWith('/photography') 
                ? "text-orange-200" 
                : "text-blue-100 hover:text-cyan-bright"
            )}>
              Photography
            </Link>
            <Link href="/videography" className={cn(
              "transition-colors duration-300 font-barlow font-light",
              location.startsWith('/videography') 
                ? "text-orange-200" 
                : "text-blue-100 hover:text-cyan-bright"
            )}>
              Videography
            </Link>
            <Link href="/about" className={cn(
              "transition-colors duration-300 font-barlow font-light",
              location === '/about' 
                ? "text-orange-200" 
                : "text-blue-100 hover:text-cyan-bright"
            )}>
              About
            </Link>
            <Link href="/pricing" className={cn(
              "transition-colors duration-300 font-barlow font-light",
              location === '/pricing' 
                ? "text-orange-200" 
                : "text-blue-100 hover:text-cyan-bright"
            )}>
              Pricing
            </Link>
            <Link href="/contact" className={cn(
              "transition-colors duration-300 font-barlow font-light",
              location === '/contact' 
                ? "text-orange-200" 
                : "text-blue-100 hover:text-cyan-bright"
            )}>
              Contact
            </Link>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Auth Button */}
            <AuthButton />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="space-y-4">
              <Link
                href="/photography"
                className="block py-2 text-lg font-quicksand font-light text-slate-200 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Photography
              </Link>
              <Link
                href="/videography"
                className="block py-2 text-lg font-quicksand font-light text-slate-200 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Videography
              </Link>
              <Link
                href="/about"
                className="block py-2 text-lg font-quicksand font-light text-slate-200 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="block py-2 text-lg font-quicksand font-light text-slate-200 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-lg font-quicksand font-light text-slate-200 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/my-gallery"
                className="block py-2 text-lg font-quicksand font-light text-slate-200 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Gallery
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

export { NavigationComponent as Navigation };
