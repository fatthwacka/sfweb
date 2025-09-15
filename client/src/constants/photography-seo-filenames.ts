/**
 * Fixed SEO-optimized filenames for photography category pages
 * These filenames never change - incoming uploads are renamed to match
 */
export const PHOTOGRAPHY_SEO_FILENAMES = {
  wedding: {
    hero: "professional-wedding-photography-durban-kzn-hero.jpg",
    service: "wedding-photography-services-packages-durban.jpg",
    recentWork: [
      "wedding-gallery-bride-groom-portraits-1.jpg",
      "wedding-ceremony-photography-durban-2.jpg",
      "wedding-reception-celebration-photos-3.jpg"
    ]
  },
  portrait: {
    hero: "portrait-photography-studio-headshots-durban-hero.jpg",
    service: "professional-portrait-photography-services-kzn.jpg",
    recentWork: [
      "portrait-gallery-professional-headshots-1.jpg",
      "portrait-photography-personal-branding-2.jpg",
      "portrait-studio-creative-photography-3.jpg"
    ]
  },
  corporate: {
    hero: "corporate-headshots-business-photography-durban-hero.jpg",
    service: "corporate-photography-team-executive-portraits.jpg",
    recentWork: [
      "corporate-gallery-executive-portraits-1.jpg",
      "corporate-team-photography-office-2.jpg",
      "corporate-event-conference-photography-3.jpg"
    ]
  },
  event: {
    hero: "event-photography-conferences-parties-durban-hero.jpg",
    service: "event-photography-coverage-services-kzn.jpg",
    recentWork: [
      "event-gallery-conference-photography-1.jpg",
      "event-party-celebration-photos-2.jpg",
      "event-corporate-function-coverage-3.jpg"
    ]
  },
  product: {
    hero: "product-photography-ecommerce-commercial-durban-hero.jpg",
    service: "product-photography-catalog-lifestyle-services.jpg",
    recentWork: [
      "product-gallery-ecommerce-photography-1.jpg",
      "product-lifestyle-commercial-photos-2.jpg",
      "product-catalog-studio-photography-3.jpg"
    ]
  },
  graduation: {
    hero: "graduation-photography-ceremony-portraits-durban-hero.jpg",
    service: "graduation-photography-academic-celebration-services.jpg",
    recentWork: [
      "graduation-gallery-ceremony-portraits-1.jpg",
      "graduation-campus-photography-students-2.jpg",
      "graduation-celebration-family-photos-3.jpg"
    ]
  }
} as const;

// Helper function to get the full path for an image
export function getPhotographyImagePath(
  category: keyof typeof PHOTOGRAPHY_SEO_FILENAMES,
  section: 'hero' | 'service',
  includeTimestamp = false
): string {
  const filename = PHOTOGRAPHY_SEO_FILENAMES[category][section];
  const basePath = `/images/photography/${section}/${filename}`;

  // Add cache-busting timestamp if requested (for admin updates)
  return includeTimestamp ? `${basePath}?v=${Date.now()}` : basePath;
}

// Helper function to get recent work images
export function getRecentWorkImages(
  category: keyof typeof PHOTOGRAPHY_SEO_FILENAMES,
  includeTimestamp = false
): string[] {
  const images = PHOTOGRAPHY_SEO_FILENAMES[category].recentWork;
  const basePath = '/images/photography/recent-work/';

  return images.map(filename => {
    const fullPath = `${basePath}${filename}`;
    return includeTimestamp ? `${fullPath}?v=${Date.now()}` : fullPath;
  });
}

// SEO-optimized alt text for each category
export const PHOTOGRAPHY_ALT_TEXTS = {
  wedding: {
    hero: "Professional Wedding Photography in Durban KZN - Elegant bridal portraits and ceremony coverage",
    service: "Wedding Photography Services and Packages - Full day coverage in Durban and KwaZulu-Natal",
  },
  portrait: {
    hero: "Portrait Photography Studio in Durban - Professional headshots and personal branding",
    service: "Professional Portrait Photography Services - Studio and on-location sessions in KZN",
  },
  corporate: {
    hero: "Corporate Business Photography Durban - Executive headshots and team portraits",
    service: "Corporate Photography Services - Professional business imagery for companies in KZN",
  },
  event: {
    hero: "Event Photography in Durban - Conference, party and celebration coverage",
    service: "Event Photography Services - Professional coverage for corporate and private events",
  },
  product: {
    hero: "Product Photography Studio Durban - E-commerce and commercial photography",
    service: "Product Photography Services - Catalog, lifestyle and marketing imagery",
  },
  graduation: {
    hero: "Graduation Photography in Durban - Academic ceremony and portrait sessions",
    service: "Graduation Photography Services - Capture your academic achievement in KZN",
  }
} as const;