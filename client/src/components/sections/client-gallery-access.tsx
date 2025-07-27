import { Button } from "@/components/ui/button";
import { List, Download, Share } from "lucide-react";

const features = [
  {
    icon: List,
    title: "Secure Access",
    description: "Private, password-protected galleries accessible only to you and those you invite."
  },
  {
    icon: Download,
    title: "Easy Downloads",
    description: "Download individual photos or entire albums in various resolutions for different uses."
  },
  {
    icon: Share,
    title: "Share Anywhere",
    description: "Share your gallery link on social media, email, or create custom invitations."
  }
];

export function ClientGalleryAccess() {
  return (
    <section className="py-20 bg-gradient-to-br from-cyan-dark/40 via-background to-teal-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="salmon text-4xl lg:text-5xl mb-6">
              Your Private <span>Gallery</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Access your photos anytime, anywhere. Share with family and friends, download high-resolution images, and relive your special moments through our secure client portal.
            </p>

            <div className="space-y-6 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className="bg-cyan rounded-full p-2 mr-4 mt-1">
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-lg mb-2">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-salmon text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-salmon-muted transition-all duration-300 transform hover:scale-105">
                Access My Gallery
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-border text-muted-foreground px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:border-gold hover:text-gold transition-all duration-300"
              >
                Gallery Demo
              </Button>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&h=600" 
              alt="Client gallery interface mockup" 
              className="w-full rounded-2xl shadow-2xl"
            />

            {/* Floating gallery preview */}
            <div className="absolute -bottom-10 -left-10 bg-charcoal rounded-xl p-4 shadow-2xl glass-effect">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <img 
                  src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
                  alt="Gallery thumbnail 1" 
                  className="w-12 h-12 rounded object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
                  alt="Gallery thumbnail 2" 
                  className="w-12 h-12 rounded object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
                  alt="Gallery thumbnail 3" 
                  className="w-12 h-12 rounded object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">Sarah & James Wedding</p>
              <p className="text-xs text-gold">247 photos available</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
