import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ImageUrl } from "@/lib/image-utils";
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
  Unlock,
  Crown
} from "lucide-react";
import { useState } from "react";

interface Shoot {
  id: string;
  clientId: string;
  title: string;
  description: string;
  shootDate: string;
  location: string;
  notes: string;
  isPrivate: boolean;
  bannerImageId: string | null;
  seoTags: string;
  viewCount: number;
  createdBy: string;
  customSlug: string;
  customTitle: string;
  gallerySettings: {
    padding: string;
    borderStyle: string;
    layoutStyle: string;
    imageSpacing: string;
    backgroundColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Image {
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  originalName: string;
  sequence: number;
  downloadCount: number;
  createdAt: string;
}

export default function ClientGallery() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [visibleImageCount, setVisibleImageCount] = useState(20);
  const slug = params.slug;

  // Fetch shoot data directly by slug - this is a public gallery for a single shoot
  const { data: shoot, isLoading: shootLoading, error: shootError } = useQuery<Shoot>({
    queryKey: ["/api/galleries", slug],
    enabled: !!slug
  });

  // Fetch shoot images
  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/shoots", shoot?.id, "images"],
    enabled: !!shoot?.id
  });

  if (shootLoading) {
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

  if (shootError || !shoot) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl mb-4">Gallery Not Found</h1>
              <p className="text-muted-foreground mb-8">This gallery doesn't exist or has been removed.</p>
              <Link href="/">
                <Button className="bg-salmon text-white hover:bg-salmon-muted">
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

  // Apply gallery settings from the shoot
  const { gallerySettings } = shoot;
  const coverImage = images.find(img => img.id === shoot.bannerImageId);

  const handleImageSelect = (imageId: string) => {
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
      <title>{shoot.customTitle || shoot.title} | SlyFox Studios</title>
      <meta name="description" content={`View ${shoot.customTitle || shoot.title} gallery by SlyFox Studios. ${shoot.description || 'Professional photography showcasing beautiful moments.'}`} />
      
      <Navigation />
      
      {/* Hero Section with Cover Image */}
      <section 
        className="relative pt-32 pb-20 bg-gradient-to-br from-black via-charcoal to-black"
        style={{
          backgroundColor: gallerySettings.backgroundColor || '#1a1a1a',
          ...(coverImage && {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${ImageUrl.forViewing(coverImage.storagePath)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-salmon hover:text-salmon-muted mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl mb-6 text-white">
              {shoot.customTitle || shoot.title}
            </h1>
            {shoot.description && (
              <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-4">
                {shoot.description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-8 text-sm text-gray-300">
              {shoot.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {shoot.location}
                </div>
              )}
              {shoot.shootDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(shoot.shootDate).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {shoot.viewCount} views
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleShareGallery}
                className="bg-salmon text-white px-8 py-4 rounded-full text-lg hover:bg-salmon-muted transition-all duration-300"
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
              <Camera className="w-8 h-8 text-salmon mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold text-white">{images.length}</div>
              <p className="text-sm text-gray-300">Photos</p>
            </div>
            <div className="text-center">
              <Eye className="w-8 h-8 text-salmon mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold text-white">{shoot.viewCount}</div>
              <p className="text-sm text-gray-300">Views</p>
            </div>
            <div className="text-center">
              <Download className="w-8 h-8 text-salmon mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold text-white">
                {images.reduce((total, img) => total + img.downloadCount, 0)}
              </div>
              <p className="text-sm text-gray-300">Downloads</p>
            </div>
            <div className="text-center">
              <Heart className="w-8 h-8 text-salmon mx-auto mb-2" />
              <div className="text-2xl font-saira font-bold text-white">❤️</div>
              <p className="text-sm text-gray-300">Memories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section 
        className="py-20"
        style={{ backgroundColor: gallerySettings.backgroundColor || '#000000' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                onClick={() => setSelectedImages(new Set())}
                variant="outline"
                size="sm"
                className="border-salmon text-salmon hover:bg-salmon hover:text-white"
              >
                Clear Selection
              </Button>
              <Button 
                onClick={() => setSelectedImages(new Set(images.map(img => img.id)))}
                variant="outline"
                size="sm"
                className="border-salmon text-salmon hover:bg-salmon hover:text-white"
              >
                Select All ({images.length})
              </Button>
            </div>
          </div>

          {imagesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-saira font-bold mb-2 text-white">No Images</h3>
              <p className="text-muted-foreground">Images will appear here once uploaded.</p>
            </div>
          ) : (
            gallerySettings.layoutStyle === 'masonry' ? (
              <div 
                className={`columns-2 md:columns-3 lg:columns-4 space-y-${gallerySettings.imageSpacing === 'tight' ? '1' : gallerySettings.imageSpacing === 'normal' ? '2' : '4'}`}
                style={{ 
                  gap: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                }}
              >
                {images.slice(0, visibleImageCount)
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((image) => (
                    <div
                      key={image.id}
                      className={`
                        relative group overflow-hidden break-inside-avoid 
                        ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full aspect-square'}
                        ${selectedImages.has(image.id) ? 'ring-2 ring-salmon' : ''}
                        cursor-pointer transition-all duration-200
                      `}
                      style={{ 
                        marginBottom: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                      }}
                      onClick={() => handleImageSelect(image.id)}
                    >
                      <img
                        src={ImageUrl.forViewing(image.storagePath)}
                        alt={image.filename}
                        className={`w-full object-cover ${gallerySettings.borderStyle === 'circular' ? 'h-full aspect-square' : 'h-auto'}`}
                        loading="lazy"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:text-salmon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:text-salmon"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Download functionality
                              const link = document.createElement('a');
                              link.href = ImageUrl.forFullSize(image.storagePath);
                              link.download = image.originalName || image.filename;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedImages.has(image.id) && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-salmon rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}

                      {/* Cover Badge */}
                      {shoot.bannerImageId === image.id && (
                        <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                          <Crown className="w-3 h-3 inline mr-1" />
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div 
                className="grid grid-cols-4"
                style={{ 
                  gap: gallerySettings.imageSpacing === 'tight' ? '2px' : gallerySettings.imageSpacing === 'normal' ? '8px' : '16px' 
                }}
              >
                {images.slice(0, visibleImageCount)
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((image) => (
                    <div
                      key={image.id}
                      className={`
                        relative group overflow-hidden aspect-square
                        ${gallerySettings.borderStyle === 'rounded' ? 'rounded-lg' : gallerySettings.borderStyle === 'sharp' ? 'rounded-none' : 'rounded-full'}
                        ${selectedImages.has(image.id) ? 'ring-2 ring-salmon' : ''}
                        cursor-pointer transition-all duration-200
                      `}
                      onClick={() => handleImageSelect(image.id)}
                    >
                      <img
                        src={ImageUrl.forViewing(image.storagePath)}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:text-salmon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:text-salmon"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Download functionality
                              const link = document.createElement('a');
                              link.href = ImageUrl.forFullSize(image.storagePath);
                              link.download = image.originalName || image.filename;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedImages.has(image.id) && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-salmon rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}

                      {/* Cover Badge */}
                      {shoot.bannerImageId === image.id && (
                        <div className="absolute top-2 right-2 bg-salmon text-white px-2 py-1 rounded text-xs font-bold">
                          <Crown className="w-3 h-3 inline mr-1" />
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )
          )}

          {/* Load More Button */}
          {images.length > visibleImageCount && (
            <div className="text-center mt-8">
              <Button 
                onClick={() => setVisibleImageCount(prev => Math.min(prev + 20, images.length))}
                className="bg-salmon text-white hover:bg-salmon-muted"
              >
                Load More ({images.length - visibleImageCount} remaining)
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
