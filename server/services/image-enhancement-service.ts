/**
 * Image Enhancement Service
 * Handles image quality assessment and Unsplash fallbacks
 */

import { ExtractedImage } from './web-content-extractor';

export interface UnsplashImage {
  id: string;
  url: string;
  downloadUrl: string;
  alt: string;
  description?: string;
  width: number;
  height: number;
  authorName: string;
  authorUrl: string;
  unsplashUrl: string;
}

export interface ImageAssessment {
  originalImages: ExtractedImage[];
  usableImages: ExtractedImage[];
  fallbackImages: UnsplashImage[];
  recommendations: {
    useOriginalImages: boolean;
    primaryImage: ExtractedImage | UnsplashImage;
    alternativeImages: Array<ExtractedImage | UnsplashImage>;
    reasoning: string;
  };
}

export class ImageEnhancementService {
  private unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
  
  constructor() {
    if (!this.unsplashApiKey) {
      console.warn('UNSPLASH_ACCESS_KEY not configured. Fallback images will not be available.');
    }
  }

  async assessAndEnhanceImages(
    extractedImages: ExtractedImage[],
    contentContext: string,
    websiteUrl: string
  ): Promise<ImageAssessment> {
    console.log(`Assessing ${extractedImages.length} extracted images`);

    // Filter usable images based on quality scores
    const usableImages = extractedImages.filter(img => 
      img.isUsable && img.qualityScore >= 60
    );

    let fallbackImages: UnsplashImage[] = [];
    let useOriginalImages = true;
    
    // Determine if we need fallback images
    if (usableImages.length === 0 || this.averageQuality(usableImages) < 70) {
      console.log('Original images insufficient, seeking Unsplash alternatives');
      
      if (this.unsplashApiKey) {
        try {
          fallbackImages = await this.searchUnsplashImages(contentContext, websiteUrl);
          useOriginalImages = false;
        } catch (error) {
          console.error('Failed to fetch Unsplash images:', error);
          // Fall back to original images even if low quality
          useOriginalImages = true;
        }
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      usableImages,
      fallbackImages,
      useOriginalImages,
      contentContext
    );

    return {
      originalImages: extractedImages,
      usableImages,
      fallbackImages,
      recommendations
    };
  }

  private averageQuality(images: ExtractedImage[]): number {
    if (images.length === 0) return 0;
    return images.reduce((sum, img) => sum + img.qualityScore, 0) / images.length;
  }

  private async searchUnsplashImages(
    contentContext: string,
    websiteUrl: string
  ): Promise<UnsplashImage[]> {
    if (!this.unsplashApiKey) {
      throw new Error('Unsplash API key not configured');
    }

    // Generate search terms from content context
    const searchTerms = this.generateSearchTerms(contentContext, websiteUrl);
    
    const images: UnsplashImage[] = [];
    
    // Try multiple search terms to get diverse results
    for (const term of searchTerms.slice(0, 3)) {
      try {
        const termImages = await this.fetchUnsplashByTerm(term);
        images.push(...termImages);
        
        if (images.length >= 10) break; // Enough images
      } catch (error) {
        console.warn(`Failed to search Unsplash for term "${term}":`, error);
      }
    }

    // Remove duplicates and return top 8
    const uniqueImages = images.filter((img, index, array) => 
      array.findIndex(i => i.id === img.id) === index
    );

    return uniqueImages.slice(0, 8);
  }

  private generateSearchTerms(contentContext: string, websiteUrl: string): string[] {
    const terms: string[] = [];
    
    // Extract domain-based terms
    try {
      const domain = new URL(websiteUrl).hostname.replace('www.', '');
      const domainTerms = domain.split('.')[0];
      
      // Industry-specific terms based on common domains
      const industryMap: Record<string, string[]> = {
        'tech': ['technology', 'innovation', 'digital', 'software'],
        'health': ['healthcare', 'medical', 'wellness', 'medicine'],
        'finance': ['business', 'finance', 'investment', 'economy'],
        'education': ['education', 'learning', 'academic', 'knowledge'],
        'food': ['culinary', 'food', 'restaurant', 'cooking'],
        'travel': ['travel', 'destination', 'adventure', 'journey'],
        'fitness': ['fitness', 'health', 'exercise', 'wellness'],
        'fashion': ['fashion', 'style', 'clothing', 'design'],
        'photography': ['photography', 'camera', 'visual', 'artistic'],
        'consulting': ['business', 'professional', 'strategy', 'corporate']
      };
      
      // Check for industry keywords in domain
      for (const [key, keywords] of Object.entries(industryMap)) {
        if (domainTerms.includes(key) || websiteUrl.includes(key)) {
          terms.push(...keywords);
          break;
        }
      }
    } catch {
      // If URL parsing fails, continue with content-based terms
    }

    // Extract key terms from content
    const contentWords = contentContext
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !this.isStopWord(word));

    // Add most frequent content terms
    const wordFreq = contentWords.reduce((freq: Record<string, number>, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {});

    const topContentTerms = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    terms.push(...topContentTerms);

    // Add generic business terms as fallbacks
    if (terms.length < 5) {
      terms.push('business', 'professional', 'modern', 'abstract', 'technology');
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'that', 'with', 'have', 'this', 'will', 'from', 'they', 'know',
      'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when',
      'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over',
      'such', 'take', 'than', 'them', 'well', 'were'
    ];
    return stopWords.includes(word);
  }

  private async fetchUnsplashByTerm(searchTerm: string): Promise<UnsplashImage[]> {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', searchTerm);
    url.searchParams.set('per_page', '8');
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('content_filter', 'high');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${this.unsplashApiKey}`,
        'Accept-Version': 'v1'
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results?.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      downloadUrl: photo.links.download_location,
      alt: photo.alt_description || photo.description || `Professional ${searchTerm} image`,
      description: photo.description,
      width: photo.width,
      height: photo.height,
      authorName: photo.user.name,
      authorUrl: photo.user.links.html,
      unsplashUrl: photo.links.html
    })) || [];
  }

  private generateRecommendations(
    usableImages: ExtractedImage[],
    fallbackImages: UnsplashImage[],
    useOriginalImages: boolean,
    contentContext: string
  ) {
    let primaryImage: ExtractedImage | UnsplashImage;
    let alternativeImages: Array<ExtractedImage | UnsplashImage> = [];
    let reasoning = '';

    if (useOriginalImages && usableImages.length > 0) {
      // Use original images
      primaryImage = usableImages[0]; // Highest quality score
      alternativeImages = usableImages.slice(1, 5);
      
      reasoning = `Using original website images (${usableImages.length} high-quality images found). ` +
                 `Primary image has quality score of ${primaryImage.qualityScore}/100.`;
      
      if (usableImages.length < 3) {
        reasoning += ` Consider supplementing with stock images for variety.`;
      }
    } else {
      // Use fallback images
      if (fallbackImages.length > 0) {
        primaryImage = fallbackImages[0];
        alternativeImages = fallbackImages.slice(1, 5);
        
        reasoning = `Using professional stock images from Unsplash. ` +
                   `Original images were insufficient (${usableImages.length} usable, ` +
                   `average quality: ${Math.round(this.averageQuality(usableImages))}/100).`;
      } else {
        // Fallback to any available image
        primaryImage = usableImages[0] || fallbackImages[0];
        alternativeImages = [...usableImages.slice(1), ...fallbackImages.slice(1)].slice(0, 4);
        
        reasoning = `Limited image options available. Using best available image with quality enhancements recommended.`;
      }
    }

    return {
      useOriginalImages,
      primaryImage,
      alternativeImages,
      reasoning
    };
  }

  // Helper method to trigger Unsplash download (for attribution)
  async triggerUnsplashDownload(downloadUrl: string): Promise<void> {
    if (!this.unsplashApiKey) return;

    try {
      await fetch(downloadUrl, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashApiKey}`
        }
      });
    } catch (error) {
      console.warn('Failed to trigger Unsplash download:', error);
    }
  }
}