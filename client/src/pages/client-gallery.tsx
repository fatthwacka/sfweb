import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Heart, 
  Eye, 
  Calendar, 
  MapPin,
  Camera,
  Lock,
  Unlock
} from "lucide-react";
import { useState } from "react";

interface Client {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  userId: number | null;
  createdAt: string;
}

interface Shoot {
  id: number;
  clientId: number;
  title: string;
  description: string;
  shootDate: string;
  location: string;
  notes: string;
  isPrivate: boolean;
  bannerImageId: number | null;
  seoTags: string;
  viewCount: number;
  createdAt: string;
}

interface Image {
  id: number;
  shootId: number;
  filename: string;
  storagePath: string;
  isPrivate: boolean;
  uploadOrder: number;
  downloadCount: number;
  createdAt: string;
}

interface ClientGalleryData {
  client: Client;
  shoots: Shoot[];
}

interface ShootWithImages {
  shoot: Shoot;
  images: Image[];
}

export default function ClientGallery() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedShoot, setSelectedShoot] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const slug = params.slug;

  // Fetch client and shoots data
  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery<ClientGalleryData>({
    queryKey: ["/api/clients", slug],
    enabled: !!slug
  });

  // Fetch shoot images when a shoot is selected
  const { data: shootData, isLoading: shootLoading } = useQuery<ShootWithImages>({
    queryKey: ["/api/shoots", selectedShoot],
    enabled: !!selectedShoot
  });

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (clientError || !clientData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl mb-4">Gallery Not Found</h1>
              <p className="text-muted-foreground mb-8">This client gallery doesn't exist or has been removed.</p>
              <Link href="/">
                <Button className="bg-gold text-black hover:bg-gold-muted">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { client, shoots } = clientData;
  const publicShoots = shoots.filter(shoot => !shoot.isPrivate);
  const isClientOwner = user && client.userId === parseInt(user.id);
  const isStaff = user && user.role === "staff";
  const canViewPrivate = isClientOwner || isStaff;

  const visibleShoots = canViewPrivate ? shoots : publicShoots;

  const handleImageSelect = (imageId: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleDownloadSelected = () => {
    if (selectedImages.size === 0) {
      toast({
        title: "No images selected",
        description: "Please select images to download",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement bulk download functionality
    toast({
      title: "Download started",
      description: `Downloading ${selectedImages.size} images...`
    });
  };

  const handleShareGallery = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied",
        description: "Gallery link copied to clipboard"
      });
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>{client.name} Gallery | SlyFox Studios</title>
      <meta name="description" content={`View ${client.name}'s photo gallery by SlyFox Studios. Professional photography showcasing beautiful moments.`} />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-gold hover:text-gold-muted mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl mb-6">
              {client.name}'s <span className="text-gold">Gallery</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Beautiful moments captured and preserved. Browse, download, and share your memories.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleShareGallery}
                className="bg-gold text-black px-8 py-4 rounded-full text-lg hover:bg-gold-muted transition-all duration-300"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Gallery
              </Button>
              {selectedImages.size > 0 && (
                <Button 
                  onClick={handleDownloadSelected}
                  variant="outline"
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-white hover:text-black transition-all duration-300"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Selected ({selectedImages.size})
                </Button>
              )}
            </div>
          </div>

          {/* Gallery Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Camera className="w-8 h-8 text-gold mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold">{visibleShoots.length}</div>
              <p className="text-sm text-muted-foreground">Photo Albums</p>
            </div>
            <div className="text-center">
              <Eye className="w-8 h-8 text-gold mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold">
                {visibleShoots.reduce((total, shoot) => total + shoot.viewCount, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <div className="text-center">
              <Download className="w-8 h-8 text-gold mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold">
                {shootData?.images.reduce((total, img) => total + img.downloadCount, 0) || 0}
              </div>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
            <div className="text-center">
              <Heart className="w-8 h-8 text-gold mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold">❤️</div>
              <p className="text-sm text-muted-foreground">Memories Made</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shoots Grid */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {visibleShoots.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-saira font-bold mb-2">No Photos Yet</h3>
              <p className="text-muted-foreground">Photos will appear here once they're uploaded.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleShoots.map((shoot) => (
                <div 
                  key={shoot.id}
                  className="bg-black rounded-2xl overflow-hidden shadow-2xl hover:shadow-gold/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                  onClick={() => setSelectedShoot(shoot.id)}
                >
                  {/* Placeholder image - in production, use banner image */}
                  <div className="relative h-64 bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gold/50" />
                    {shoot.isPrivate && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-saira font-bold text-gold mb-2">{shoot.title}</h3>
                    {shoot.description && (
                      <p className="text-muted-foreground text-sm mb-4">{shoot.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {shoot.shootDate && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(shoot.shootDate).toLocaleDateString()}
                        </div>
                      )}
                      {shoot.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {shoot.location}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        {shoot.viewCount} views
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Image Gallery Modal/Section */}
      {selectedShoot && shootData && (
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedShoot(null)}
                  className="text-gold hover:text-gold-muted mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Albums
                </Button>
                <h2 className="text-3xl font-saira font-black">
                  {shootData.shoot.title} <span className="text-gold">Photos</span>
                </h2>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSelectedImages(new Set())}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
                <Button 
                  onClick={() => setSelectedImages(new Set(shootData.images.map(img => img.id)))}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
              </div>
            </div>

            {shootLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : shootData.images.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-saira font-bold mb-2">No Images</h3>
                <p className="text-muted-foreground">Images will appear here once uploaded.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {shootData.images
                  .sort((a, b) => a.uploadOrder - b.uploadOrder)
                  .map((image) => (
                    <div 
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                        selectedImages.has(image.id) ? 'ring-2 ring-gold' : ''
                      }`}
                      onClick={() => handleImageSelect(image.id)}
                    >
                      {/* Placeholder for image - in production, use actual image */}
                      <div className="h-64 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        {image.isPrivate && (
                          <div className="absolute top-2 right-2">
                            <Lock className="w-4 h-4 text-gold" />
                          </div>
                        )}
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-white hover:text-gold">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white hover:text-gold">
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedImages.has(image.id) && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                          <span className="text-black text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
