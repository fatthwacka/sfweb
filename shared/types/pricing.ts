import { z } from 'zod';

// Zod schema for pricing tier
export const pricingTierSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title must be less than 50 characters'),
  price: z.string().min(1, 'Price is required').max(20, 'Price must be less than 20 characters'),
  subtitle: z.string().optional(),
  featured: z.boolean().default(false),
  featured_text: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).max(10, 'Maximum 10 features allowed').default([]),
  accent_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').default('#a855f7')
});

// Zod schema for section colors
export const sectionColorsSchema = z.object({
  preview: z.string().optional(),
  backgroundGradient: z.string().optional(),
  direction: z.string().optional(),
  mainTitle: z.string().optional(),
  subtitle: z.string().optional(),
  allOther: z.string().optional()
});

// Zod schema for pricing package
export const pricingPackageSchema = z.object({
  id: z.string().uuid().optional(),
  page_identifier: z.string(),
  page_type: z.enum(['photography', 'videography']),
  category: z.string(),
  section_colors: sectionColorsSchema.default({}),
  tiers: z.array(pricingTierSchema).max(4, 'Maximum 4 tiers allowed').default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable()
});

// TypeScript types inferred from Zod schemas
export type PricingTier = z.infer<typeof pricingTierSchema>;
export type SectionColors = z.infer<typeof sectionColorsSchema>;
export type PricingPackage = z.infer<typeof pricingPackageSchema>;

// Helper type for API responses
export type PricingPackageResponse = {
  data: PricingPackage | null;
  error: string | null;
};

// Helper type for list responses
export type PricingPackagesListResponse = {
  data: PricingPackage[] | null;
  error: string | null;
};

// Default empty tier template
export const defaultPricingTier: PricingTier = {
  title: '',
  price: '',
  subtitle: '',
  featured: false,
  featured_text: '',
  description: '',
  features: [],
  accent_color: '#a855f7' // Default purple
};

// Helper function to create page identifier
export function createPageIdentifier(pageType: 'photography' | 'videography', category: string): string {
  return `${pageType}_${category.toLowerCase().replace(/\s+/g, '_')}`;
}

// Helper function to parse category from page identifier
export function parsePageIdentifier(identifier: string): { pageType: 'photography' | 'videography', category: string } | null {
  const parts = identifier.split('_');
  if (parts.length < 2) return null;

  const pageType = parts[0] as 'photography' | 'videography';
  const category = parts.slice(1).join('_');

  if (!['photography', 'videography'].includes(pageType)) return null;

  return { pageType, category };
}