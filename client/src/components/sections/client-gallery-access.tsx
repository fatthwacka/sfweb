import { Button } from "@/components/ui/button";
import { List, Download, Share, Shield, Download as DownloadIcon, Share2 } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";
import { useSiteConfig } from "@/hooks/use-site-config";

const iconMap: Record<string, any> = {
  'secure-access': Shield,
  'easy-downloads': DownloadIcon,
  'share-anywhere': Share2
};

export function ClientGalleryAccess() {
  const { config } = useSiteConfig();
  const privateGalleryConfig = config?.home?.privateGallery;

  // Fallback data if config is not loaded
  const headline = privateGalleryConfig?.headline || "Your Private Gallery";
  const description = privateGalleryConfig?.description || "Access your photos anytime, anywhere. Share with family and friends, download high-resolution images, and relive your special moments through our secure client portal.";
  
  const features = privateGalleryConfig?.features || [
    {
      id: "secure-access",
      title: "Secure Access",
      description: "Private password-protected galleries accessible only to you and those you share access with."
    },
    {
      id: "easy-downloads", 
      title: "Easy Downloads",
      description: "Download individual photos or entire albums in various resolutions for different uses."
    },
    {
      id: "share-anywhere",
      title: "Share Anywhere",
      description: "Share your gallery link via social media, email, or embed custom invitations."
    }
  ];

  const primaryButton = privateGalleryConfig?.buttons?.primary || { text: "Access My Gallery", action: "/client-gallery" };
  const secondaryButton = privateGalleryConfig?.buttons?.secondary || { text: "Gallery Demo", action: "/gallery/demo" };
  const mainImage = privateGalleryConfig?.image || "/images/gallery/wedding-gallery-1.jpg";

  return (
    <GradientBackground section="privateGallery" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl mb-6">
              {headline.split(' ').map((word, index) => 
                index === headline.split(' ').length - 1 ? 
                  <span key={index}>{word}</span> : 
                  `${word} `
              )}
            </h2>
            <p className="text-xl mb-8">
              {description}
            </p>

            <div className="space-y-6 mb-8">
              {features.map((feature, index) => {
                const Icon = iconMap[feature.id] || Shield;
                return (
                  <div key={feature.id} className="flex items-start">
                    <div className="bg-cyan rounded-full p-2 mr-4 mt-1">
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-lg mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-salmon text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-salmon-muted transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = primaryButton.action}
              >
                {primaryButton.text}
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-border text-muted-foreground px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:border-gold hover:text-gold transition-all duration-300"
                onClick={() => window.location.href = secondaryButton.action}
              >
                {secondaryButton.text}
              </Button>
            </div>
          </div>

          <div className="relative">
            <img 
              src={`${mainImage}?t=${Date.now()}`} 
              alt="Client gallery interface mockup" 
              className="w-full rounded-2xl shadow-2xl"
              onError={() => console.log('Image failed to load:', mainImage)}
            />
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
