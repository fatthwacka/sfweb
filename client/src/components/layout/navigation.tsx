import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AuthButton } from "@/components/ui/auth-button";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import logoPath from "@assets/Head-only-black_1752749907547.png";

const photographyCategories = [
  { name: "Weddings", slug: "weddings" },
  { name: "Portraits", slug: "portraits" },
  { name: "Corporate", slug: "corporate" },
  { name: "Events", slug: "events" },
  { name: "Products", slug: "products" },
  { name: "Graduation", slug: "graduation" }
];

const videographyCategories = [
  { name: "Wedding Films", slug: "weddings" },
  { name: "Corporate Videos", slug: "corporate" },
  { name: "Events", slug: "events" },
  { name: "Product Videos", slug: "products" },
  { name: "Social Media", slug: "social" },
  { name: "Animation", slug: "animation" }
];

export function Navigation() {
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
      isScrolled ? "bg-purple-dark/95 backdrop-blur-sm shadow-lg" : "glass-effect"
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
            {/* Photography Dropdown */}
            <div className="relative group">
              <Link href="/photography" className="text-cyan-muted hover:text-cyan transition-colors duration-300 flex items-center">
                Photography
                <ChevronDown className="w-4 h-4 ml-1" />
              </Link>
              <div className="absolute top-full left-0 w-64 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-2 overflow-hidden" 
                   style={{background: 'linear-gradient(135deg, rgba(64, 64, 64, 0.9) 0%, rgba(96, 96, 96, 0.9) 50%, rgba(78, 205, 196, 0.2) 100%)', 
                          border: '1px solid rgba(78, 205, 196, 0.4)'}}>
                <div className="p-2">
                  {photographyCategories.map(category => (
                    <Link
                      key={category.slug}
                      href={`/photography/${category.slug}`}
                      className="block px-4 py-2 rounded transition-all duration-300 text-cyan-muted hover:text-salmon hover:bg-gradient-to-r hover:from-salmon/20 hover:to-cyan/20"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Videography Dropdown */}
            <div className="relative group">
              <Link href="/videography" className="text-cyan-muted hover:text-cyan transition-colors duration-300 flex items-center">
                Videography
                <ChevronDown className="w-4 h-4 ml-1" />
              </Link>
              <div className="absolute top-full left-0 w-64 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-2 overflow-hidden"
                   style={{background: 'linear-gradient(135deg, rgba(64, 64, 64, 0.9) 0%, rgba(96, 96, 96, 0.9) 50%, rgba(255, 107, 107, 0.2) 100%)', 
                          border: '1px solid rgba(255, 107, 107, 0.4)'}}>
                <div className="p-2">
                  {videographyCategories.map(category => (
                    <Link
                      key={category.slug}
                      href={`/videography/${category.slug}`}
                      className="block px-4 py-2 rounded transition-all duration-300 text-cyan-muted hover:text-salmon hover:bg-gradient-to-r hover:from-cyan/20 hover:to-salmon/20"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/about" className="text-cyan-muted hover:text-cyan transition-colors duration-300">
              About
            </Link>
            <Link href="/pricing" className="text-cyan-muted hover:text-cyan transition-colors duration-300">
              Pricing
            </Link>
            <Link href="/contact" className="text-cyan-muted hover:text-cyan transition-colors duration-300">
              Contact
            </Link>
            <Link href="/my-gallery" className="text-cyan-muted hover:text-cyan transition-colors duration-300">
              My Gallery
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
                className="block py-2 text-lg font-barlow font-medium hover:text-gold transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Photography
              </Link>
              <Link
                href="/videography"
                className="block py-2 text-lg font-barlow font-medium hover:text-gold transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Videography
              </Link>
              <Link
                href="/about"
                className="block py-2 text-lg font-barlow font-medium hover:text-gold transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="block py-2 text-lg font-barlow font-medium hover:text-gold transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-lg font-barlow font-medium hover:text-gold transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/my-gallery"
                className="block py-2 text-lg font-barlow font-medium hover:text-gold transition-colors"
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
}
