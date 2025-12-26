/**
 * Enhanced Web Content Extractor Service
 * Improved scraping with quality assessment and AI-powered analysis
 */

import { load } from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ScrapingOptions {
  includeMetaData: boolean;
  extractHeadings: boolean;
  maxContentLength: number;
  imageQualityThreshold: 'low' | 'medium' | 'high';
  enableJavaScript: boolean;
  includeSchemaData: boolean;
}

export interface ExtractedImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  qualityScore: number;
  context?: string;
  isUsable: boolean;
  rejectionReason?: string;
}

export interface ExtractedContent {
  url: string;
  title: string;
  content: string;
  cleanText: string;
  headings: Array<{ level: number; text: string }>;
  images: ExtractedImage[];
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: string;
    schemaData?: any;
  };
  stats: {
    contentLength: number;
    imageCount: number;
    usableImageCount: number;
    qualityScore: number;
  };
}

export class WebContentExtractor {
  private qualityThresholds = {
    low: { minWidth: 300, minHeight: 300, minFileSize: 10000 },
    medium: { minWidth: 600, minHeight: 600, minFileSize: 50000 },
    high: { minWidth: 1200, minHeight: 1200, minFileSize: 100000 }
  };

  private skipPatterns = [
    'logo', 'icon', 'avatar', 'button', 'arrow', 'social', 'badge', 'pixel',
    'spinner', 'loader', 'loading', 'preloader', 'placeholder', 'spacer',
    'tiny', 'micro', 'mini', 'tracking', 'analytics', 'advertisement',
    'thumb', 'thumbnail', 'profile', 'header', 'footer', 'nav', 'sidebar'
  ];

  async extractContent(url: string, options: ScrapingOptions): Promise<ExtractedContent> {
    try {
      console.log(`Starting enhanced content extraction for: ${url}`);
      
      // Fetch the webpage
      const html = await this.fetchPageContent(url, options);
      
      // Parse with Cheerio
      const $ = load(html);
      
      // Use Mozilla Readability for better content extraction
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      
      // Extract title
      const title = this.extractTitle($, article?.title);
      
      // Extract and clean content
      const { content, cleanText } = this.extractAndCleanContent($, article, options);
      
      // Extract headings
      const headings = options.extractHeadings ? this.extractHeadings($) : [];
      
      // Extract metadata
      const metadata = options.includeMetaData ? this.extractMetadata($, options) : {};
      
      // Extract and analyse images
      const images = await this.extractAndAnalyseImages($, url, options);
      
      // Calculate quality scores
      const stats = this.calculateStats(content, images);
      
      const result: ExtractedContent = {
        url,
        title,
        content,
        cleanText,
        headings,
        images,
        metadata,
        stats
      };
      
      console.log(`Content extraction completed. Found ${images.length} images, ${stats.usableImageCount} usable`);
      return result;
      
    } catch (error) {
      console.error('Content extraction failed:', error);
      throw new Error(`Failed to extract content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchPageContent(url: string, options: ScrapingOptions): Promise<string> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const response = await fetch(url, {
      headers,
      timeout: 30000,
      follow: 10
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    if (html.length < 100) {
      throw new Error('Page content too short or empty');
    }

    return html;
  }

  private extractTitle($: any, readabilityTitle?: string): string {
    // Priority: Readability title > <title> tag > <h1> tag > fallback
    if (readabilityTitle?.trim()) {
      return readabilityTitle.trim();
    }

    const titleTag = $('title').text().trim();
    if (titleTag) {
      return titleTag.replace(/\s+/g, ' ');
    }

    const h1 = $('h1').first().text().trim();
    if (h1) {
      return h1;
    }

    return 'Untitled Page';
  }

  private extractAndCleanContent($: any, article: any, options: ScrapingOptions): { content: string; cleanText: string } {
    let content = '';
    let cleanText = '';

    if (article?.content) {
      // Use Readability's cleaned content
      content = article.content;
      cleanText = article.textContent || '';
    } else {
      // Fallback to manual content extraction
      $('script, style, nav, footer, header, aside, .advertisement, .ad, .sidebar').remove();
      
      const contentSelectors = [
        'main', 'article', '[role="main"]', '.main-content', '.content',
        '.post-content', '.entry-content', '.article-content', '#content'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().length > 500) {
          content = element.html() || '';
          cleanText = element.text() || '';
          break;
        }
      }

      // If no main content found, use body
      if (!content) {
        $('body').find('script, style, nav, footer, header, aside').remove();
        content = $('body').html() || '';
        cleanText = $('body').text() || '';
      }
    }

    // Clean and limit content
    cleanText = cleanText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:-]/g, ' ')
      .trim();

    if (cleanText.length > options.maxContentLength) {
      cleanText = cleanText.substring(0, options.maxContentLength) + '...';
    }

    return { content, cleanText };
  }

  private extractHeadings($: any): Array<{ level: number; text: string }> {
    const headings: Array<{ level: number; text: string }> = [];
    
    for (let level = 1; level <= 6; level++) {
      $(`h${level}`).each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 3 && text.length < 200) {
          headings.push({ level, text });
        }
      });
    }

    return headings;
  }

  private extractMetadata($: any, options: ScrapingOptions): any {
    const metadata: any = {};

    // Meta description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content');
    if (description) metadata.description = description.trim();

    // Keywords
    const keywords = $('meta[name="keywords"]').attr('content');
    if (keywords) {
      metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    }

    // Author
    const author = $('meta[name="author"]').attr('content') ||
                  $('meta[property="article:author"]').attr('content');
    if (author) metadata.author = author.trim();

    // Published date
    const publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                         $('meta[name="date"]').attr('content') ||
                         $('time[datetime]').attr('datetime');
    if (publishedDate) metadata.publishedDate = publishedDate;

    // Schema.org data
    if (options.includeSchemaData) {
      const schemaScripts = $('script[type="application/ld+json"]');
      const schemaData: any[] = [];
      
      schemaScripts.each((_, element) => {
        try {
          const json = JSON.parse($(element).html() || '');
          schemaData.push(json);
        } catch {
          // Ignore invalid JSON
        }
      });
      
      if (schemaData.length > 0) {
        metadata.schemaData = schemaData;
      }
    }

    return metadata;
  }

  private async extractAndAnalyseImages($: any, baseUrl: string, options: ScrapingOptions): Promise<ExtractedImage[]> {
    const images: ExtractedImage[] = [];
    const threshold = this.qualityThresholds[options.imageQualityThreshold];
    
    $('img').each((_, element) => {
      const $img = $(element);
      let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy');
      
      if (!src) return;

      // Convert relative URLs to absolute
      try {
        if (!src.startsWith('http')) {
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const base = new URL(baseUrl);
            src = base.origin + src;
          } else {
            const base = new URL(baseUrl);
            src = new URL(src, base.href).href;
          }
        }
      } catch {
        return; // Skip invalid URLs
      }

      // Skip data URIs and SVGs
      if (src.startsWith('data:') || src.toLowerCase().includes('.svg')) {
        return;
      }

      // Check for skip patterns
      const srcLower = src.toLowerCase();
      const alt = ($img.attr('alt') || '').toLowerCase();
      
      if (this.skipPatterns.some(pattern => 
        srcLower.includes(pattern) || alt.includes(pattern)
      )) {
        images.push({
          url: src,
          alt: $img.attr('alt') || '',
          qualityScore: 0,
          isUsable: false,
          rejectionReason: 'Matched skip pattern'
        });
        return;
      }

      // Extract dimensions from HTML attributes
      const width = parseInt($img.attr('width') || '0') || undefined;
      const height = parseInt($img.attr('height') || '0') || undefined;

      // Extract context (surrounding text)
      const context = $img.closest('figure, div, section').find('figcaption, .caption, .description').text().trim();

      // Initial quality assessment
      let qualityScore = 50; // Base score
      let isUsable = true;
      let rejectionReason = '';

      // Check dimensions against threshold
      if (width && height) {
        if (width < threshold.minWidth || height < threshold.minHeight) {
          qualityScore = 20;
          isUsable = false;
          rejectionReason = 'Dimensions too small';
        } else {
          qualityScore += 30; // Good dimensions
        }

        // Check aspect ratio
        const aspectRatio = Math.max(width, height) / Math.min(width, height);
        if (aspectRatio > 5) {
          qualityScore -= 20; // Penalise extreme aspect ratios
        }
      }

      // Check URL for dimension hints
      const urlDimensionMatch = src.match(/[-_](\d{2,4})x(\d{2,4})(?:\.|$)/);
      if (urlDimensionMatch) {
        const urlWidth = parseInt(urlDimensionMatch[1]);
        const urlHeight = parseInt(urlDimensionMatch[2]);
        
        if (urlWidth < threshold.minWidth || urlHeight < threshold.minHeight) {
          qualityScore = 15;
          isUsable = false;
          rejectionReason = 'URL dimensions too small';
        }
      }

      // Bonus for good file extensions
      if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)) {
        qualityScore += 10;
      }

      // Bonus for image directory paths
      if (/\/(images?|photos?|media|uploads?|assets|gallery)\//i.test(src)) {
        qualityScore += 15;
      }

      // Extract file format
      const formatMatch = src.match(/\.(\w+)(\?|$)/);
      const format = formatMatch ? formatMatch[1].toLowerCase() : 'unknown';

      images.push({
        url: src,
        alt: $img.attr('alt') || '',
        width,
        height,
        format,
        qualityScore: Math.min(qualityScore, 100),
        context: context || undefined,
        isUsable,
        rejectionReason: rejectionReason || undefined
      });
    });

    // Sort by quality score (highest first)
    return images
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 15); // Limit to top 15 images
  }

  private calculateStats(content: string, images: ExtractedImage[]) {
    const usableImages = images.filter(img => img.isUsable);
    const avgImageQuality = images.length > 0 
      ? images.reduce((sum, img) => sum + img.qualityScore, 0) / images.length 
      : 0;

    return {
      contentLength: content.length,
      imageCount: images.length,
      usableImageCount: usableImages.length,
      qualityScore: Math.round(avgImageQuality)
    };
  }
}