/**
 * UnsplashModal - Dedicated Unsplash Image Search Modal
 *
 * A stripped-down, focused component for searching and selecting images from Unsplash.
 * Separated from the AI generation functionality for cleaner architecture.
 *
 * Features:
 * - AI-powered search term generation from article context
 * - Orientation and quality selection
 * - Pagination support ("Load More")
 * - Proper attribution display
 */

import { useState, useEffect } from 'react';
import { Search, Loader2, Download, ChevronDown, Sparkles } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

export interface UnsplashResult {
  imageUrl: string;
  searchTerm: string;
  attribution: {
    user: string;
    username: string;
    source: 'unsplash';
  };
}

export interface UnsplashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (result: UnsplashResult) => void;

  // Optional: article context for AI-powered search term generation
  articleContext?: {
    headline?: string;
    hook?: string;
    content?: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const UNSPLASH_QUALITY_OPTIONS = [
  { value: 'thumb', label: 'Thumbnail (200px)', description: 'Small preview' },
  { value: 'small', label: 'Small (400px)', description: 'Web optimized' },
  { value: 'regular', label: 'Regular (1080px)', description: 'Standard quality' },
  { value: 'full', label: 'Full (2000px+)', description: 'High resolution' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function UnsplashModal({
  isOpen,
  onClose,
  onImageSelected,
  articleContext,
}: UnsplashModalProps) {
  const { toast } = useToast();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingTerm, setIsGeneratingTerm] = useState(false);

  // Results state
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Options state
  const [orientation, setOrientation] = useState('squarish');
  const [quality, setQuality] = useState('regular');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setImages([]);
      setSelectedImage(null);
      setPage(1);
      setHasMore(true);
      setOrientation('squarish');
      setQuality('regular');
    }
  }, [isOpen]);

  // Generate search term from article context using AI
  const generateSearchTerm = async () => {
    if (!articleContext) return;

    setIsGeneratingTerm(true);
    try {
      const response = await fetch('/api/ai/generate-unsplash-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleContext,
          artStyle: 'photorealistic',
          imageStyle: 'professional',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate search term');

      const result = await response.json();
      setSearchTerm(result.searchTerm);

      // Automatically search with the generated term
      await searchUnsplash(result.searchTerm, false);
    } catch (error) {
      console.error('Error generating search term:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate search term. Try entering one manually.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingTerm(false);
    }
  };

  // Search Unsplash for images
  const searchUnsplash = async (term?: string, loadMore = false) => {
    const searchQuery = term || searchTerm;

    if (!searchQuery.trim()) {
      toast({
        title: 'Missing Search Term',
        description: 'Please enter a search term for Unsplash images.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);

    let pageToFetch = 1;
    if (loadMore) {
      pageToFetch = page + 1;
    } else {
      setImages([]);
      setHasMore(true);
    }

    try {
      const response = await fetch('/api/unsplash/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          page: pageToFetch,
          per_page: 6,
          orientation,
        }),
      });

      if (!response.ok) throw new Error('Failed to search Unsplash');

      const result = await response.json();
      const newImages = result.results || [];

      if (loadMore) {
        setImages(prev => {
          const newUniqueImages = newImages.filter((newImg: UnsplashImage) =>
            !prev.some(existingImg => existingImg.id === newImg.id)
          );
          return [...prev, ...newUniqueImages];
        });
        setPage(pageToFetch);
      } else {
        setImages(newImages);
        setPage(1);
      }

      setHasMore(newImages.length === 6);

      if (newImages.length > 0) {
        toast({
          title: loadMore ? 'More Images Loaded!' : 'Images Found!',
          description: loadMore
            ? `Loaded ${newImages.length} more images from Unsplash.`
            : `Found ${newImages.length} images from Unsplash.`,
        });
      } else if (!loadMore) {
        toast({
          title: 'No Images Found',
          description: 'Try a different search term or be more specific.',
          variant: 'destructive',
        });
      } else {
        setHasMore(false);
        toast({
          title: 'No More Images',
          description: 'All available images for this search have been loaded.',
        });
      }
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not search Unsplash. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Select an image
  const selectImage = (image: UnsplashImage) => {
    setSelectedImage(image);
  };

  // Use the selected image
  const useSelectedImage = () => {
    if (!selectedImage) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image from the search results.',
        variant: 'destructive',
      });
      return;
    }

    const imageUrl = selectedImage.urls[quality as keyof typeof selectedImage.urls] || selectedImage.urls.regular;

    const result: UnsplashResult = {
      imageUrl,
      searchTerm,
      attribution: {
        user: selectedImage.user.name,
        username: selectedImage.user.username,
        source: 'unsplash',
      },
    };

    onImageSelected(result);
    onClose();

    toast({
      title: 'Image Added',
      description: 'Unsplash image has been added to your article.',
    });
  };

  // Download selected image
  const downloadImage = async () => {
    if (!selectedImage) return;

    const imageUrl = selectedImage.urls[quality as keyof typeof selectedImage.urls] || selectedImage.urls.regular;

    try {
      const proxyUrl = `/api/download/image?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `unsplash-${selectedImage.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: 'Your image download has begun.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download image.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl" style={{ color: 'var(--cyan)' }}>
            Unsplash Image Search
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
            {/* Configuration Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--cyan)' }}>
                Search Settings
              </h3>

              {/* Search Section */}
              <div className="space-y-2">
                <Label htmlFor="search-term">Search Term</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-term"
                    placeholder="Enter search keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                  />
                  {articleContext && (
                    <Button
                      onClick={generateSearchTerm}
                      disabled={isGeneratingTerm}
                      variant="outline"
                      size="sm"
                      title="Generate search term from article content"
                    >
                      {isGeneratingTerm ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Orientation Selection */}
              <div className="space-y-2">
                <Label htmlFor="orientation">Image Orientation</Label>
                <Select value={orientation} onValueChange={setOrientation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="squarish">Any (Square-ish)</SelectItem>
                    <SelectItem value="landscape">Landscape (Wide)</SelectItem>
                    <SelectItem value="portrait">Portrait (Tall)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Selection */}
              <div className="space-y-2">
                <Label htmlFor="quality">Image Quality</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {UNSPLASH_QUALITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => searchUnsplash()}
                disabled={isSearching || !searchTerm.trim()}
                className="w-full font-bold border-2 shadow-lg"
                style={{
                  backgroundColor: 'var(--cyan)',
                  color: '#000000',
                  borderColor: 'var(--cyan)',
                }}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {isSearching ? 'Searching...' : 'Search Unsplash'}
              </Button>

              {/* Selected Image Preview */}
              {selectedImage && (
                <div className="space-y-2">
                  <Label>Selected Image Preview</Label>
                  <div className="relative">
                    <div
                      className="w-full h-64 rounded-lg overflow-hidden border-2"
                      style={{ borderColor: 'var(--cyan)' }}
                    >
                      <img
                        src={selectedImage.urls.small}
                        alt={selectedImage.alt_description || 'Selected image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 p-2 rounded bg-gray-800/50 text-xs text-gray-300">
                      <p className="font-medium">Photo by {selectedImage.user.name}</p>
                      {selectedImage.alt_description && (
                        <p className="mt-1 opacity-75">{selectedImage.alt_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="space-y-4 flex flex-col">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--cyan)' }}>
                Search Results
              </h3>

              <div className="flex-1 overflow-y-auto max-h-[500px]">
                {images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          onClick={() => selectImage(image)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage?.id === image.id
                              ? 'border-cyan-500 ring-2 ring-cyan-200'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image.urls.small}
                            alt={image.alt_description || 'Unsplash image'}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-2 bg-white">
                            <p className="text-xs text-gray-600 truncate">
                              by {image.user.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <Button
                        onClick={() => searchUnsplash(undefined, true)}
                        disabled={isSearching}
                        variant="outline"
                        className="w-full"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        Load More Images
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-center text-gray-500">
                    <div>
                      <Search className="h-12 w-12 mx-auto mb-2 text-cyan-300" />
                      <p>Search results will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedImage && (
                <div className="space-y-2 border-t pt-4">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3">
                    <p className="text-sm text-gray-700">
                      Selected: <strong>{selectedImage.alt_description || 'Untitled'}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Photo by {selectedImage.user.name} on Unsplash
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={useSelectedImage}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      Use This Image
                    </Button>
                    <Button
                      onClick={downloadImage}
                      variant="outline"
                      className="border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UnsplashModal;
