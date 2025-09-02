import { Link } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { GradientBackground } from "@/components/common/gradient-background";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Shield, Download, Share2, Eye, Smartphone, Clock, Star, Lock, Camera, Users, Zap, Heart } from "lucide-react";

// Hardcoded gallery data for demo page
const demoGalleries = [
  {
    slug: "dipsy",
    title: "Dipsy Picnic",
    description: "Outdoor lifestyle session",
    coverImage: "/api/placeholder/400/400"
  },
  {
    slug: "gab",
    title: "Gab's Portrait Session",
    description: "Professional portraits",
    coverImage: "/api/placeholder/400/400"
  },
  {
    slug: "bayanda",
    title: "Bayanda's Session",
    description: "Creative photography",
    coverImage: "/api/placeholder/400/400"
  },
  {
    slug: "products",
    title: "Product Photography",
    description: "Commercial showcase",
    coverImage: "/api/placeholder/400/400"
  },
  {
    slug: "dibetso",
    title: "Dibetso's Session",
    description: "Professional portraits",
    coverImage: "/api/placeholder/400/400"
  },
  {
    slug: "classic-car",
    title: "Classic Car Photography",
    description: "Automotive artistry",
    coverImage: "/api/placeholder/400/400"
  }
];

const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Password-protected galleries ensure your photos stay private until you're ready to share"
  },
  {
    icon: Download,
    title: "Easy Downloads",
    description: "Download individual photos or entire galleries with a single click in high resolution"
  },
  {
    icon: Share2,
    title: "Instant Sharing",
    description: "Share your gallery link with family and friends via email, WhatsApp, or social media"
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Perfect viewing experience on any device - phones, tablets, laptops, or desktops"
  },
  {
    icon: Eye,
    title: "Beautiful Display",
    description: "Professional gallery layouts that showcase your images in stunning quality"
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "Access your galleries 24/7 from anywhere in the world, whenever you need them"
  }
];

const benefits = [
  {
    icon: Camera,
    title: "Professional Quality",
    description: "Every image is professionally edited and optimized for both web viewing and print"
  },
  {
    icon: Users,
    title: "Family Friendly",
    description: "Share with unlimited family members and friends - no restrictions on viewers"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized loading speeds ensure smooth browsing even on slower connections"
  },
  {
    icon: Heart,
    title: "Client Favorites",
    description: "Mark your favorite images for easy reference when ordering prints or albums"
  }
];

export function GalleryDemo() {
  const { config } = useSiteConfig();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Comprehensive Hero Section */}
      <GradientBackground section="services" className="py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Main Title */}
            <div className="text-center mb-12">
              <h1 className="text-salmon text-5xl lg:text-7xl mb-6 font-bold">
                Your Personal <span className="text-cyan">Gallery</span>
              </h1>
              <p className="text-muted-foreground text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed">
                Experience the SlyFox difference with our premium online galleries - 
                where your memories are beautifully presented, securely stored, and easily shared.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((feature, index) => (
                <div key={index} className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/30 transition-all duration-300">
                  <feature.icon className="w-10 h-10 text-salmon mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Ready to see how your photos will look? Explore our demo galleries below.
              </p>
              <div className="inline-flex items-center gap-2 text-cyan">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm font-medium">Over 500+ happy clients trust their memories with us</span>
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Additional Benefits Section */}
      <GradientBackground section="testimonials" className="py-16 border-t border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-3xl lg:text-4xl mb-12 text-cyan">
              Why Choose <span className="text-salmon">Our Galleries?</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-salmon/20 rounded-full flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-salmon" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="text-center bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
              <Lock className="w-12 h-12 text-cyan mx-auto mb-4" />
              <h3 className="text-white font-semibold text-xl mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your galleries are protected with enterprise-grade encryption and secure cloud storage. 
                Only you control who sees your photos, with unique access codes for each gallery.
              </p>
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Demo Galleries Section */}
      <GradientBackground section="portfolio" className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-cyan text-4xl lg:text-5xl mb-6">
              Explore Demo <span className="text-salmon">Galleries</span>
            </h2>
            <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto">
              Click on any gallery below to experience our professional gallery system. 
              See how your photos will be presented to family and friends.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Gallery Grid with Permanent Hover Text */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {demoGalleries.map((gallery) => (
                <Link key={gallery.slug} href={`/gallery/${gallery.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="relative overflow-hidden aspect-square shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
                      <img 
                        src={gallery.coverImage}
                        alt={gallery.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop&crop=faces`;
                        }}
                      />
                      
                      {/* Overlay - Always visible but darker on hover */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>
                      
                      {/* Title Overlay - Always Visible */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {gallery.title}
                        </h3>
                        <p className="text-gray-200 text-sm">
                          {gallery.description}
                        </p>
                        <p className="text-cyan text-xs mt-2 font-medium">
                          Click to View Gallery →
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="text-center mt-20">
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-12 max-w-3xl mx-auto">
              <h3 className="text-3xl text-white mb-4">
                Ready to Create Your <span className="text-salmon">Own Gallery?</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-8">
                Join hundreds of happy clients who trust us with their precious memories. 
                Every session includes a beautiful online gallery at no extra cost.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="btn-salmon px-8 py-3 text-lg">
                    Book Your Session
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="border-2 border-cyan text-cyan hover:bg-cyan hover:text-black px-8 py-3 text-lg">
                    View Packages
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}