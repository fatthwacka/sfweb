import { useSiteConfig } from '@/hooks/use-site-config';

// Fallback defaults per category — used when site-config has no data
const categoryDefaults: Record<string, { image: string; height: number; align: 'top' | 'center' | 'bottom' }> = {
  'photography_weddings': { image: '/images/hero/slyfox-weddings-photography-durban-hero.jpg', height: 83, align: 'bottom' },
  'photography_portraits': { image: '/images/hero/slyfox-portraits-photography-durban-hero.jpg', height: 90, align: 'center' },
  'photography_corporate': { image: '/images/hero/slyfox-corporate-photography-durban-hero.jpg', height: 75, align: 'center' },
  'photography_events': { image: '/images/hero/slyfox-events-photography-durban-hero.jpg', height: 82, align: 'center' },
  'photography_products': { image: '/images/hero/slyfox-products-photography-durban-hero.jpg', height: 82, align: 'center' },
  'photography_graduation': { image: '/images/hero/slyfox-graduation-photography-durban-hero.jpg', height: 86, align: 'top' },
  'videography_weddings': { image: '/images/services/wedding-videography.jpg', height: 60, align: 'center' },
  'videography_corporate': { image: '/images/services/corporate-videography.jpg', height: 60, align: 'center' },
  'videography_events': { image: '/images/services/event-videography.jpg', height: 60, align: 'center' },
};

const DEFAULT_HERO_HEIGHT = 60;

/**
 * Hook for category hero images — reads/writes via local site-config (not Supabase)
 */
export function useCategoryHeroes() {
  const { config, updateConfigBulk, isUpdating } = useSiteConfig();

  const getHeroConfig = (pageType: string, category: string) => {
    return (config as any)?.categoryPages?.[pageType]?.[category]?.hero;
  };

  const getHeroImage = (pageType: string, category: string): string => {
    const heroConfig = getHeroConfig(pageType, category);
    if (heroConfig?.image) return heroConfig.image;
    const key = `${pageType}_${category}`;
    return categoryDefaults[key]?.image || '/images/services/default-hero.jpg';
  };

  const isCustomHero = (pageType: string, category: string): boolean => {
    const heroConfig = getHeroConfig(pageType, category);
    const key = `${pageType}_${category}`;
    const defaultImage = categoryDefaults[key]?.image;
    return !!(heroConfig?.image && heroConfig.image !== defaultImage);
  };

  const getHeroHeight = (pageType: string, category: string): number => {
    const heroConfig = getHeroConfig(pageType, category);
    if (heroConfig?.heroHeight) return heroConfig.heroHeight;
    const key = `${pageType}_${category}`;
    return categoryDefaults[key]?.height || DEFAULT_HERO_HEIGHT;
  };

  const getImageAlign = (pageType: string, category: string): 'top' | 'center' | 'bottom' => {
    const heroConfig = getHeroConfig(pageType, category);
    if (heroConfig?.imageAlign) return heroConfig.imageAlign;
    const key = `${pageType}_${category}`;
    return categoryDefaults[key]?.align || 'center';
  };

  const getHeroTitle = (pageType: string, category: string): string | undefined => {
    return getHeroConfig(pageType, category)?.title;
  };

  const getHeroSubtitle = (pageType: string, category: string): string | undefined => {
    return getHeroConfig(pageType, category)?.subtitle;
  };

  const updateHero = ({ pageType, category, imageUrl }: { pageType: string; category: string; imageUrl: string }) => {
    updateConfigBulk({
      categoryPages: {
        [pageType]: {
          [category]: {
            hero: { image: imageUrl }
          }
        }
      }
    } as any);
  };

  const updateHeroSettings = ({
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
    const updates: any = {};
    if (heroHeight !== undefined) updates.heroHeight = heroHeight;
    if (imageAlign !== undefined) updates.imageAlign = imageAlign;

    updateConfigBulk({
      categoryPages: {
        [pageType]: {
          [category]: {
            hero: updates
          }
        }
      }
    } as any);
  };

  return {
    allHeroes: {},
    isLoading: false,
    error: null,
    getHeroImage,
    isCustomHero,
    getHeroHeight,
    getImageAlign,
    getHeroTitle,
    getHeroSubtitle,
    updateHero,
    updateHeroSettings,
    isUpdating
  };
}

/**
 * Convenience hook for a single category's hero image and settings
 */
export function useCategoryHero(pageType: string, category: string) {
  const { getHeroImage, isCustomHero, getHeroHeight, getImageAlign, getHeroTitle, getHeroSubtitle } = useCategoryHeroes();

  return {
    heroImage: getHeroImage(pageType, category),
    isCustom: isCustomHero(pageType, category),
    heroHeight: getHeroHeight(pageType, category),
    imageAlign: getImageAlign(pageType, category),
    heroTitle: getHeroTitle(pageType, category),
    heroSubtitle: getHeroSubtitle(pageType, category),
    isLoading: false
  };
}
