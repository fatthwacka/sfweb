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
          <div className="max-w-6xl mx-auto">
            {/* Main Title */}
            <div className="text-center mb-12">
              <h1 className="text-salmon text-5xl lg:text-7xl mb-6">
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