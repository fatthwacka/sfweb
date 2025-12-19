/**
 * 404 Not Found Page
 * A properly styled error page matching site design
 */

import { Link } from 'wouter';
import { Home, ArrowLeft, Search, Mail } from 'lucide-react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Main Content */}
      <div
        className="flex-1 flex items-center justify-center pt-20 pb-16"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' }}
      >
        <div className="w-full px-6 text-center">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-[8rem] sm:text-[12rem] lg:text-[16rem] font-bold leading-none text-white/10 select-none">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="relative -mt-20 sm:-mt-28 lg:-mt-36">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl max-w-md mx-auto mb-10">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-salmon hover:bg-salmon/90 text-white px-8 py-6 text-lg"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </div>
          </div>

          {/* Helpful Links */}
          <div className="mt-16 pt-10 border-t border-white/10 max-w-2xl mx-auto">
            <p className="text-gray-500 text-sm mb-6">Perhaps you were looking for:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/photography" className="text-cyan hover:text-cyan/80 transition-colors">
                Photography
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/videography" className="text-cyan hover:text-cyan/80 transition-colors">
                Videography
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/portfolio" className="text-cyan hover:text-cyan/80 transition-colors">
                Portfolio
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/pricing" className="text-cyan hover:text-cyan/80 transition-colors">
                Pricing
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/contact" className="text-cyan hover:text-cyan/80 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
