import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Download, Share2 } from "lucide-react";

export function ClientGalleryAccess() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              Your Private <span className="text-gold">Gallery</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Access your photos anytime, anywhere. Share with family and friends, download high-resolution images, and relive your special moments through our secure client portal.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start">
                <div className="bg-gold rounded-full p-2 mr-4 mt-1">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h4 className="font-saira font-bold text-lg mb-2">Secure Access</h4>
                  <p className="text-gray-400">Private, password-protected galleries accessible only to you and those you invite.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gold rounded-full p-2 mr-4 mt-1">
                  <Download className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h4 className="font-saira font-bold text-lg mb-2">Easy Downloads</h4>
                  <p className="text-gray-400">Download individual photos or entire albums in various resolutions for different uses.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gold rounded-full p-2 mr-4 mt-1">
                  <Share2 className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h4 className="font-saira font-bold text-lg mb-2">Share Anywhere</h4>
                  <p className="text-gray-400">Share your gallery link on social media, email, or create custom invitations.</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300 transform hover:scale-[1.02]">
                Access My Gallery
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:border-gold hover:text-gold transition-all duration-300"
              >
                Gallery Demo
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="/images/gallery/wedding-gallery-1.jpg" 
              alt="Client gallery interface mockup" 
              className="w-full rounded-2xl shadow-2xl"
            />
            
            {/* Floating gallery preview */}
            <Card className="absolute -bottom-10 -left-10 bg-charcoal border border-gray-700 p-4 shadow-2xl glass-effect">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <img 
                  src="/images/gallery/wedding-gallery-2.jpg" 
                  alt="Gallery thumbnail 1" 
                  className="w-12 h-12 rounded object-cover"
                />
                <img 
                  src="/images/gallery/wedding-gallery-3.jpg" 
                  alt="Gallery thumbnail 2" 
                  className="w-12 h-12 rounded object-cover"
                />
                <img 
                  src="/images/gallery/wedding-gallery-4.jpg" 
                  alt="Gallery thumbnail 3" 
                  className="w-12 h-12 rounded object-cover"
                />
              </div>
              <p className="text-xs text-gray-400">Sarah & James Wedding</p>
              <p className="text-xs text-gold">247 photos available</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
