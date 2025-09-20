import { useQuery } from '@tanstack/react-query';
import { type PricingPackage, type PricingPackageResponse } from '@shared/types/pricing';

export function usePricingPackages(pageIdentifier: string) {
  return useQuery<PricingPackage | null>({
    queryKey: ['pricing-packages', pageIdentifier],
    queryFn: async () => {
      const response = await fetch(`/api/pricing-packages/${pageIdentifier}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pricing packages: ${response.statusText}`);
      }
      const result: PricingPackageResponse = await response.json();

      if (result.error) {
        console.error('Error fetching pricing packages:', result.error);
        return null;
      }

      return result.data;
    },
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

// Helper function to format price display
export function formatPrice(price: string): string {
  // If price already has currency symbol, return as-is
  if (price.startsWith('R') || price.startsWith('$')) {
    return price;
  }
  // Otherwise add R prefix
  return `R${price}`;
}

// Helper function to determine if a tier should be highlighted
export function isTierHighlighted(tier: any, index: number, totalTiers: number): boolean {
  // If explicitly marked as featured
  if (tier.featured) return true;

  // If it's the middle tier in a 3-tier setup (common pattern)
  if (totalTiers === 3 && index === 1) return true;

  return false;
}