import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Camera, ExternalLink, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryPreview } from '@/components/gallery/gallery-preview';
import { ImageUrl } from '@/lib/image-utils';
import { apiRequest } from '@/lib/queryClient';
import type { Shoot, Image } from '@/shared/schema';

export default function ClientGallery() {
  const { shootId } = useParams();

  // Fetch shoot details with all customization settings
  const { data: shoot, isLoading: shootLoading } = useQuery({
    queryKey: ['gallery', shootId],
    queryFn: async () => {
      if (!shootId) throw new Error('No shoot ID');
      const response = await apiRequest('GET', `/api/gallery/${shootId}`);
      return await response.json() as Shoot;
    },
    enabled: !!shootId
  });

  // Fetch images for the shoot
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['gallery-images', shoot?.id],
    queryFn: async () => {
      if (!shoot?.id) throw new Error('No shoot ID');
      const response = await apiRequest('GET', `/api/shoots/${shoot.id}/images`);
      return await response.json() as Image[];
    },
    enabled: !!shoot?.id
  });

  // Handle sharing
  const shareGallery = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shoot?.customTitle || shoot?.title || 'Photo Gallery',
          text: `Check out this photo gallery: ${shoot?.customTitle || shoot?.title}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Failed to share gallery:', error);
    }
  };

  if (shootLoading || imagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!shoot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Gallery Not Found</h2>
          <p className="text-gray-600">The requested gallery could not be found.</p>
        </div>
      </div>
    );
  }

  // Get cover image for hero section
  const coverImage = images.find(img => img.id === shoot.bannerImageId) || images[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Cover Image */}
      {coverImage && (
        <div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden">
          <img
            src={ImageUrl.forViewing(coverImage.storagePath)}
            alt={shoot.customTitle || shoot.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {shoot.customTitle || shoot.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base mb-6">
                {shoot.shootDate && (
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {new Date(shoot.shootDate).toLocaleDateString()}
                  </div>
                )}
                {shoot.location && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {shoot.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {images.filter(img => !img.isPrivate).length} photos
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={shareGallery}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Gallery
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Content with Custom Settings */}
      <div className="py-8">
        <GalleryPreview 
          shoot={shoot}
          images={images}
          className="w-full"
        />
      </div>

      {/* Gallery Description */}
      {shoot.description && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="prose prose-lg mx-auto text-center">
              <p className="text-gray-700 leading-relaxed">
                {shoot.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}