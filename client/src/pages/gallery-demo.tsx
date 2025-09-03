import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { GradientBackground } from "@/components/common/gradient-background";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Shield, Download, Share2, Eye, HardDrive, Clock, Star, Lock } from "lucide-react";
import { ImageUrl } from "@/lib/image-utils";

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
    icon: HardDrive,
    title: "Safe & Backed Up",
    description: "Your photos are securely stored in the cloud - never worry about losing memories if devices fail"
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

// Define the type for gallery data
interface GalleryData {
  slug: string;
  title: string;
  description: string;
  coverImage?: string;
}

export function GalleryDemo() {
  const { config } = useSiteConfig();
  
  // Helper function to fetch gallery with images
  const fetchGalleryWithImages = async (slug: string) => {
    const galleryResponse = await fetch(`/api/gallery/${slug}`);
    if (!galleryResponse.ok) throw new Error('Failed to fetch gallery');
    const gallery = await galleryResponse.json();
    
    // Fetch images for the gallery
    const imagesResponse = await fetch(`/api/shoots/${gallery.id}/images`);
    if (!imagesResponse.ok) return { ...gallery, coverImage: null };
    const images = await imagesResponse.json();
    
    // Find the banner image or use the first image
    const bannerImage = gallery.bannerImageId 
      ? images.find((img: any) => img.id === gallery.bannerImageId)
      : images[0];
    
    return {
      ...gallery,
      coverImage: bannerImage?.storagePath || null
    };
  };

  // Fetch gallery data for each demo gallery
  const dipsyQuery = useQuery({
    queryKey: ['gallery-with-images', 'dipsy'],
    queryFn: () => fetchGalleryWithImages('dipsy')
  });

  const gabQuery = useQuery({
    queryKey: ['gallery-with-images', 'gab'],
    queryFn: () => fetchGalleryWithImages('gab')
  });

  const bayandaQuery = useQuery({
    queryKey: ['gallery-with-images', 'bayanda'],
    queryFn: () => fetchGalleryWithImages('bayanda')
  });

  const productsQuery = useQuery({
    queryKey: ['gallery-with-images', 'products'],
    queryFn: () => fetchGalleryWithImages('products')
  });

  const dibetsoQuery = useQuery({
    queryKey: ['gallery-with-images', 'dibetso'],
    queryFn: () => fetchGalleryWithImages('dibetso')
  });

  const classicCarQuery = useQuery({
    queryKey: ['gallery-with-images', 'classic-car'],
    queryFn: () => fetchGalleryWithImages('classic-car')
  });

  // Build gallery data with real cover images
  const galleries: GalleryData[] = [
    {
      slug: "dipsy",
      title: "Dipsy Picnic",
      description: "Outdoor lifestyle session",
      coverImage: dipsyQuery.data?.coverImage ? ImageUrl.forViewing(dipsyQuery.data.coverImage) : undefined
    },
    {
      slug: "gab",
      title: "Gab's Portrait Session",
      description: "Professional portraits",
      coverImage: gabQuery.data?.coverImage ? ImageUrl.forViewing(gabQuery.data.coverImage) : undefined
    },
    {
      slug: "bayanda",
      title: "Bayanda's Session",
      description: "Creative photography",
      coverImage: bayandaQuery.data?.coverImage ? ImageUrl.forViewing(bayandaQuery.data.coverImage) : undefined
    },
    {
      slug: "products",
      title: "Product Photography",
      description: "Commercial showcase",
      coverImage: productsQuery.data?.coverImage ? ImageUrl.forViewing(productsQuery.data.coverImage) : undefined
    },
    {
      slug: "dibetso",
      title: "Dibetso's Session",
      description: "Professional portraits",
      coverImage: dibetsoQuery.data?.coverImage ? ImageUrl.forViewing(dibetsoQuery.data.coverImage) : undefined
    },
    {
      slug: "classic-car",
      title: "Classic Car Photography",
      description: "Automotive artistry",
      coverImage: classicCarQuery.data?.coverImage ? ImageUrl.forViewing(classicCarQuery.data.coverImage) : undefined
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Comprehensive Hero Section */}
      <GradientBackground section="services" className="py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Title */}
            <div className="text-center mb-12">
              <h1 className="text-white text-5xl lg:text-7xl mb-4">
                Your Personal Gallery
              </h1>
              <p className="text-muted-foreground text-xl mb-8">
                Where your memories become masterpieces that last forever
              </p>
              
              {/* Enhanced Introduction with Icons and Headers - Split into two containers */}
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-8">
                {/* Left Container - Aligns with feature cards */}
                <div className="w-full lg:w-1/2">
                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    {/* Image at the top */}
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img 
                        src="/uploads/slyfox-pro-studio-lighting.jpg" 
                        alt="Professional Studio Setup" 
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    
                    <div className="space-y-8">
                      {/* Transformation Section */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <Star className="w-6 h-6 text-salmon" />
                          <h3 className="text-white text-xl font-semibold">Elevate Your Image</h3>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed text-left">
                          Transform your photography session into a stunning online gallery that elevates your personal brand or 
                          preserves precious memories forever.
                        </p>
                      </div>

                      {/* Purpose Section */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <Eye className="w-6 h-6 text-cyan" />
                          <h3 className="text-white text-xl font-semibold">Showcase Your Brand</h3>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed text-left">
                          Whether you're showcasing your professional portfolio, products and brands, sharing special moments with loved ones, 
                          or building your visual legacy, our premium galleries make you look absolutely breathtaking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Container - Aligns with demo image */}
                <div className="w-full lg:w-1/2">
                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    {/* Image at the top */}
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img 
                        src="/uploads/Lavender-3-bars-stacked-with-lather_1756326067465.jpg" 
                        alt="Product Photography" 
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    
                    <div className="space-y-8">
                      {/* Features Section */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <Lock className="w-6 h-6 text-salmon" />
                          <h3 className="text-white text-xl font-semibold">Customise Your Gallery</h3>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed text-left">
                          Adjust your gallery to get it looking just perfect with complete control over layout and sequencing. 
                          Choose your preferred style and arrangement to create a gallery that truly represents your vision.
                        </p>
                      </div>

                      {/* Automatic Backups Section */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <HardDrive className="w-6 h-6 text-cyan" />
                          <h3 className="text-white text-xl font-semibold">Automatic Backups</h3>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed text-left">
                          Your images are automatically backed up with enterprise-grade security, ensuring your memories 
                          are never lost. Access them anytime, anywhere - your precious moments are safe forever.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof - Full width below */}
              <div className="text-center mb-12">
                <p className="text-cyan text-lg font-medium">
                  Join hundreds of clients whose galleries have become their most treasured digital possessions.
                </p>
              </div>
            </div>

            {/* Features and Gallery Preview Container */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Feature Cards Container - 50% width on large screens */}
              <div className="w-full lg:w-1/2">
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 lg:p-5 hover:bg-black/30 transition-all duration-300">
                      <feature.icon className="w-8 h-8 lg:w-10 lg:h-10 text-salmon mb-3" />
                      <h3 className="text-white font-semibold text-base lg:text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery Preview Image - Hidden on mobile, visible on tablet and up */}
              <div className="hidden md:block w-full lg:w-1/2">
                <div className="relative">
                  {/* Gallery Frame Container */}
                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-3 lg:p-4">
                    {/* Gallery Title Bar */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">Gallery Preview</span>
                    </div>
                    
                    {/* Main Gallery Image - Adjusted for longer aspect ratio */}
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src="/images/hero/demo-gallery-studio.jpg" 
                        alt="Gallery Preview" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Preview Label */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-cyan/20 backdrop-blur-sm px-4 py-1 rounded-full border border-cyan/30">
                    <span className="text-cyan text-xs font-medium">Your Gallery Could Look Like This</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
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

      {/* Demo Galleries Section - Custom gradient styling */}
      <div className="py-20" style={{ background: 'linear-gradient(to bottom, #475569 0%, #1e293b 50%, #020617 100%)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-white text-4xl lg:text-5xl mb-6">
              Explore Demo Galleries
            </h2>
            <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto">
              Click on any gallery below to experience our professional gallery system. 
              See how your photos will be presented to family and friends.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Gallery Grid with Permanent Hover Text */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {galleries.map((gallery) => (
                <Link key={gallery.slug} href={`/gallery/${gallery.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="relative overflow-hidden aspect-square shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
                      {gallery.coverImage ? (
                        <img 
                          src={gallery.coverImage}
                          alt={gallery.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500">Loading...</span>
                        </div>
                      )}
                      
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
            <div className="bg-black/40 border border-white/20 rounded-2xl p-12 max-w-3xl mx-auto">
              <h3 className="text-3xl text-white mb-4">
                Ready to Create Your <span className="text-salmon">Own Gallery?</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-8">
                Join hundreds of happy clients who trust us with their precious memories. 
                Every session includes a beautiful online gallery at no extra cost.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <button className="btn-salmon px-8 py-3 text-lg">
                    Book Your Session
                  </button>
                </Link>
                <Link href="/photography">
                  <button className="btn-cyan px-8 py-3 text-lg">
                    View Packages
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}