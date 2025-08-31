import type { Image } from "@shared/schema";

// Classification clumping for unified UX across homepage and category pages
export const CLASSIFICATION_CLUMPING = {
  weddings: ['wedding', 'engagement', 'maternity', 'newborn', 'baby', 'bridal'],
  portraits: ['portrait', 'family', 'individual', 'headshots'],
  corporate: ['corporate', 'business', 'linkedin_headshots'],
  events: ['lifestyle', 'party', 'celebration', 'birthday'],
  products: ['product', 'commercial', 'advertising', 'brand'],
  graduation: ['matric dance', 'graduation', 'academic']
} as const;

export type CategoryKey = keyof typeof CLASSIFICATION_CLUMPING;
export type GranularClassification = typeof CLASSIFICATION_CLUMPING[CategoryKey][number];

// Format classification for display (sentence case with spaces)
export const formatClassification = (classification: string): string => {
  return classification
    .split(/[-_\s]+/) // Split on dashes, underscores, or spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get all images for a category (clumping granular classifications)
export const getImagesByCategory = (categoryKey: CategoryKey, images: Image[]): Image[] => {
  const targetClassifications = CLASSIFICATION_CLUMPING[categoryKey];
  return images.filter(image => 
    targetClassifications.includes(image.classification as GranularClassification)
  );
};

// Shuffle array utility with multiple passes for better randomness
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  
  // Multiple shuffle passes for better randomness
  for (let pass = 0; pass < 3; pass++) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  return shuffled;
};

// Aggressive shuffle that avoids position repetition
export const aggressiveShuffle = <T>(array: T[], previousBatch: T[] = [], targetCount: number): T[] => {
  if (array.length <= targetCount) {
    return shuffleArray(array);
  }
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const shuffled = shuffleArray([...array]);
    const candidate = shuffled.slice(0, targetCount);
    
    // If no previous batch, return the candidate
    if (previousBatch.length === 0) {
      return candidate;
    }
    
    // Check if too many images are in the same positions
    let samePositions = 0;
    for (let i = 0; i < Math.min(candidate.length, previousBatch.length); i++) {
      if (candidate[i]?.id === previousBatch[i]?.id) {
        samePositions++;
      }
    }
    
    // Accept if fewer than 2 images are in same positions (allows some repetition but not too much)
    if (samePositions < 2) {
      return candidate;
    }
    
    attempts++;
  }
  
  // Fallback: return a shuffled batch (better than infinite loop)
  return shuffleArray([...array]).slice(0, targetCount);
};

// Get next batch of exactly targetCount images with aggressive anti-repetition shuffling
export const getNextImageBatch = (
  allImages: Image[], 
  currentPage: number, 
  targetCount: number,
  previousBatch: Image[] = []
): { images: Image[], nextPage: number, hasMore: boolean } => {
  const totalImages = allImages.length;
  
  // If total images < targetCount, return all available (no pagination)
  if (totalImages < targetCount) {
    return {
      images: allImages,
      nextPage: 0,
      hasMore: false
    };
  }
  
  // Calculate batch boundaries
  const startIndex = currentPage * targetCount;
  let batch = allImages.slice(startIndex, startIndex + targetCount);
  
  // If we don't have enough for a full batch, we're in recycling mode
  if (batch.length < targetCount) {
    // When recycling, use aggressive shuffle to avoid position repetition
    batch = aggressiveShuffle([...allImages], previousBatch, targetCount);
  }
  
  // Ensure exactly targetCount images
  const finalBatch = batch.slice(0, targetCount);
  
  // Calculate next page (cycle back to 0 when we reach end)
  const nextPage = startIndex + targetCount >= totalImages ? 0 : currentPage + 1;
  
  return {
    images: finalBatch,
    nextPage,
    hasMore: totalImages >= targetCount // Has pagination if enough total images
  };
};