import { Link } from "wouter";

const photographyServices = [
  { name: "Weddings", href: "/photography/weddings" },
  { name: "Portraits", href: "/photography/portraits" },
  { name: "Corporate", href: "/photography/corporate" },
  { name: "Events", href: "/photography/events" },
  { name: "Products", href: "/photography/products" },
  { name: "Graduation", href: "/photography/graduation" },
  { name: "Gallery Demo", href: "/gallery-demo" },
];

const videographyServices = [
  { name: "Wedding Films", href: "/videography/weddings" },
  { name: "Corporate Videos", href: "/videography/corporate" },
  { name: "Events", href: "/videography/events" },
  { name: "Product Videos", href: "/videography/products" },
  { name: "Social Media", href: "/videography/social" },
  { name: "Animation", href: "/videography/animation" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
  { name: "Client Login", href: "/dashboard" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-3xl text-salmon mb-4">
              SlyFox <span className="text-white">Studios</span>
            </div>
            <p className="text-muted-foreground mb-6">
              Capturing life's beautiful moments through the lens of creativity
              and passion in Durban, South Africa.
            </p>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/slyfoxstudiogroup/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-salmon hover:text-salmon transition-colors duration-300"
                aria-label="Follow us on Instagram"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://www.facebook.com/slyfoxstudiogroup"
                target="_blank"
                rel="noopener noreferrer"
                className="social-cyan hover:text-cyan transition-colors duration-300"
                aria-label="Follow us on Facebook"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@slyfoxstudiogroup"
                target="_blank"
                rel="noopener noreferrer"
                className="social-salmon hover:text-salmon transition-colors duration-300"
                aria-label="Follow us on TikTok"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Container */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Photography Services */}
            <div>
              <h4 className="text-lg text-salmon mb-6">Photography</h4>
              <ul className="space-y-3">
                {photographyServices.map((service) => (
                  <li key={service.href}>
                    <Link
                      href={service.href}
                      className="text-muted-foreground hover:text-white transition-colors duration-300"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Videography Services */}
            <div>
              <h4 className="text-lg text-cyan mb-6">Videography</h4>
              <ul className="space-y-3">
                {videographyServices.map((service) => (
                  <li key={service.href}>
                    <Link
                      href={service.href}
                      className="text-muted-foreground hover:text-white transition-colors duration-300"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-lg text-salmon mb-6">Company</h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-white transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              © 2025 SlyFox Studios. All rights reserved. | Designed and
              developed by Slyfox Studio Group.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/sitemap.xml"
                className="text-muted-foreground hover:text-white text-sm transition-colors duration-300"
              >
                Sitemap
              </Link>
              <Link
                href="/robots.txt"
                className="text-muted-foreground hover:text-white text-sm transition-colors duration-300"
              >
                Robots
              </Link>
              <a
                href="mailto:info@slyfox.co.za"
                className="text-muted-foreground hover:text-white text-sm transition-colors duration-300"
              >
                info@slyfox.co.za
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
