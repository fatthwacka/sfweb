import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Camera, ExternalLink, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryPreview } from '@/components/gallery/gallery-preview';
import { ImageUrl } from '@/lib/image-utils';
import { apiRequest } from '@/lib/queryClient';
import type { Shoot, Image } from '@/shared/schema';

export default function ClientGallery({ shootId }: { shootId?: string }) {
  const params = useParams();
  const actualShootId = shootId || params.slug;

  // Fetch shoot details with all customization settings
  const { data: shoot, isLoading: shootLoading } = useQuery({
    queryKey: ['gallery', actualShootId],
    queryFn: async () => {
      if (!actualShootId) throw new Error('No shoot ID');
      const response = await apiRequest('GET', `/api/gallery/${actualShootId}`);
      return await response.json() as Shoot;
    },
    enabled: !!actualShootId
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
          <Camera className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!shoot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Gallery Not Found</h2>
          <p className="text-gray-500">The requested gallery could not be found.</p>
        </div>
      </div>
    );
  }

  // Parse gallery settings for styling
  const gallerySettings = (shoot.gallerySettings as any) || {};
  const coverImageUrl = shoot.coverImage ? ImageUrl.forViewing(shoot.coverImage) : null;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Cover Image */}
      <div 
        className="relative h-[70vh] bg-cover bg-center bg-gray-900"
        style={coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : {}}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex items-center justify-center text-white">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {shoot.customTitle || shoot.title}
            </h1>
            {shoot.customDescription && (
              <p className="text-xl md:text-2xl mb-6 max-w-2xl mx-auto">
                {shoot.customDescription}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm opacity-90">
              {shoot.shootDate && (
                <span>{new Date(shoot.shootDate).toLocaleDateString()}</span>
              )}
              {shoot.location && <span>• {shoot.location}</span>}
              <span>• {images.filter(img => !img.isPrivate).length} photos</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shareGallery}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Gallery
          </Button>
        </div>

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Gallery Section with Custom Design */}
      <GalleryPreview 
        images={images} 
        shoot={shoot}
        className="w-full"
      />
    </div>
  );
}