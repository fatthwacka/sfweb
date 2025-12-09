import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CategoryHero {
  id: string;
  pageType: string;
  category: string;
  imageUrl: string;
  heroHeight: number; // 40-100 (percentage)
  imageAlign: 'top' | 'center' | 'bottom'; // CSS object-position
  createdAt: string;
  updatedAt: string;
}

// Default settings
const DEFAULT_HERO_HEIGHT = 60; // vh percentage (was 60vh in CSS)
const DEFAULT_IMAGE_ALIGN = 'center';

type AllHeroesResponse = Record<string, CategoryHero>;

// Default hero images - hardcoded for SEO visibility
const defaultHeroImages: Record<string, string> = {
  // Photography
  'photography_weddings': '/images/services/wedding-photography.jpg',
  'photography_portraits': '/images/services/portrait-photography.jpg',
  'photography_corporate': '/images/services/corporate-photography.jpg',
  'photography_events': '/images/services/event-photography.jpg',
  'photography_products': '/images/services/product-photography.jpg',
  'photography_graduation': '/images/services/graduation-photography.jpg',
  // Videography (add as needed)
  'videography_weddings': '/images/services/wedding-videography.jpg',
  'videography_corporate': '/images/services/corporate-videography.jpg',
  'videography_events': '/images/services/event-videography.jpg',
};

/**
 * Hook for fetching all category hero images from Supabase
 * Falls back to hardcoded defaults for SEO visibility
 */
export function useCategoryHeroes() {
  const queryClient = useQueryClient();

  const { data: allHeroes, isLoading, error } = useQuery({
    queryKey: ['category-heroes', 'all'],
    queryFn: async (): Promise<AllHeroesResponse> => {
      try {
        const response = await fetch('/api/category-heroes', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch category heroes: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.warn('Failed to load category heroes:', error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  /**
   * Get hero image URL for a specific category
   * Returns Supabase URL if available, otherwise falls back to hardcoded default
   */
  const getHeroImage = (pageType: string, category: string): string => {
    const key = `${pageType}_${category}`;

    // Check Supabase data first
    const hero = allHeroes?.[key];
    if (hero?.imageUrl) {
      return hero.imageUrl;
    }

    // Fall back to hardcoded default
    return defaultHeroImages[key] || '/images/services/default-hero.jpg';
  };

  /**
   * Check if a hero image is from Supabase or using default
   */
  const isCustomHero = (pageType: string, category: string): boolean => {
    const key = `${pageType}_${category}`;
    return !!(allHeroes?.[key]?.imageUrl);
  };

  /**
   * Get hero height setting (40-100 vh percentage)
   */
  const getHeroHeight = (pageType: string, category: string): number => {
    const key = `${pageType}_${category}`;
    return allHeroes?.[key]?.heroHeight || DEFAULT_HERO_HEIGHT;
  };

  /**
   * Get image alignment setting (top, center, bottom)
   */
  const getImageAlign = (pageType: string, category: string): 'top' | 'center' | 'bottom' => {
    const key = `${pageType}_${category}`;
    return allHeroes?.[key]?.imageAlign || DEFAULT_IMAGE_ALIGN;
  };

  // Mutation for updating hero image URL (called after upload)
  const updateHero = useMutation({
    mutationFn: async ({ pageType, category, imageUrl }: { pageType: string; category: string; imageUrl: string }) => {
      const response = await fetch(`/api/category-heroes/${pageType}/${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to update hero image');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-heroes', 'all'] });
    }
  });

  // Mutation for updating hero display settings (height & alignment)
  const updateHeroSettings = useMutation({
    mutationFn: async ({
      pageType,
      category,
      heroHeight,
      imageAlign
    }: {
      pageType: string;
      category: string;
      heroHeight?: number;
      imageAlign?: 'top' | 'center' | 'bottom';
    }) => {
      const response = await fetch(`/api/category-heroes/${pageType}/${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ heroHeight, imageAlign })
      });

      if (!response.ok) {
        throw new Error('Failed to update hero settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-heroes', 'all'] });
    }
  });

  return {
    allHeroes: allHeroes || {},
    isLoading,
    error,
    getHeroImage,
    isCustomHero,
    getHeroHeight,
    getImageAlign,
    updateHero: updateHero.mutate,
    updateHeroSettings: updateHeroSettings.mutate,
    isUpdating: updateHero.isPending || updateHeroSettings.isPending
  };
}

/**
 * Convenience hook for a single category's hero image and settings
 */
export function useCategoryHero(pageType: string, category: string) {
  const { getHeroImage, isCustomHero, getHeroHeight, getImageAlign, isLoading } = useCategoryHeroes();

  return {
    heroImage: getHeroImage(pageType, category),
    isCustom: isCustomHero(pageType, category),
    heroHeight: getHeroHeight(pageType, category),
    imageAlign: getImageAlign(pageType, category),
    isLoading
  };
}
