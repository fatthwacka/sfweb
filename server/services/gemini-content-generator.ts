/**
 * Enhanced Gemini Content Generator
 * Professional content creation with authoritative tone and smart image integration
 */

import { ExtractedContent } from './web-content-extractor';
import { ImageAssessment, UnsplashImage } from './image-enhancement-service';
import { ExtractedImage } from './web-content-extractor';

export interface GeneratedArticle {
  articleNumber: number;
  headline: string;
  hook: string;
  content: string;
  hashtags: string[];
  focusAngle: string;
  assignedImageUrl: string;
  imagePlacement: string;
  clientName: string;
  tone: string;
  wordCount: number;
  imageAttribution?: string;
}

export interface ContentGenerationResult {
  articles: GeneratedArticle[];
  totalArticles: number;
  sourceUrl: string;
  sourceTitle: string;
  generatedAt: string;
  imageStrategy: string;
}

export class GeminiContentGenerator {
  private geminiApiKey = process.env.GEMINI_API_KEY;

  constructor() {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }
  }

  async generateContent(
    extractedContent: ExtractedContent,
    imageAssessment: ImageAssessment,
    useSiteImages: boolean
  ): Promise<ContentGenerationResult> {
    console.log('Starting enhanced content generation with Gemini');

    // Select images based on assessment
    const selectedImages = this.selectBestImages(imageAssessment, useSiteImages);
    
    // Extract client name from URL
    const clientName = this.extractClientName(extractedContent.url);
    
    // Generate focus angles
    const focusAngles = this.generateFocusAngles(extractedContent);
    
    // Calculate number of articles based on available images and content
    const numArticles = Math.min(
      Math.max(selectedImages.length, 1), 
      Math.min(focusAngles.length, 8)
    );

    console.log(`Generating ${numArticles} articles with ${selectedImages.length} images`);

    // Create enhanced prompt
    const prompt = this.createEnhancedPrompt(
      extractedContent,
      selectedImages,
      focusAngles,
      clientName,
      numArticles
    );

    // Call Gemini API
    const geminiResponse = await this.callGeminiAPI(prompt);
    
    // Parse and validate response
    const articles = this.parseAndValidateResponse(
      geminiResponse,
      selectedImages,
      extractedContent.url,
      clientName
    );

    return {
      articles,
      totalArticles: articles.length,
      sourceUrl: extractedContent.url,
      sourceTitle: extractedContent.title,
      generatedAt: new Date().toISOString(),
      imageStrategy: imageAssessment.recommendations.reasoning
    };
  }

  private selectBestImages(assessment: ImageAssessment, useSiteImages: boolean): Array<ExtractedImage | UnsplashImage> {
    if (!useSiteImages || !assessment.recommendations.useOriginalImages) {
      // Use Unsplash images
      return assessment.fallbackImages.slice(0, 8);
    }

    // Use original images, supplement with Unsplash if needed
    const originalImages = assessment.usableImages.slice(0, 6);
    const supplementImages = assessment.fallbackImages.slice(0, 8 - originalImages.length);
    
    return [...originalImages, ...supplementImages];
  }

  private extractClientName(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const domain = hostname.split('.')[0];
      
      // Clean up common domain patterns
      return domain
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      return 'Professional Business';
    }
  }

  private generateFocusAngles(content: ExtractedContent): string[] {
    // Generate focus angles based on content analysis
    const baseAngles = [
      'Game-changing innovation that disrupts industries',
      'Proven methods that deliver instant results',
      'Hidden opportunities competitors are missing',
      'Simple solutions to complex problems',
      'Emerging trends that create massive value',
      'Cost-cutting strategies that boost profits',
      'Time-saving hacks for busy professionals',
      'Revenue-generating tactics that actually work',
      'Market insights that drive smart decisions',
      'Success stories that inspire action'
    ];

    // If we have headings, try to generate content-specific angles
    if (content.headings.length > 0) {
      const contentAngles = content.headings
        .slice(0, 5)
        .map(heading => `${heading.text} - strategic analysis and implementation`)
        .filter(angle => angle.length < 80);
      
      return [...contentAngles, ...baseAngles].slice(0, 10);
    }

    return baseAngles;
  }

  private createEnhancedPrompt(
    content: ExtractedContent,
    images: Array<ExtractedImage | UnsplashImage>,
    focusAngles: string[],
    clientName: string,
    numArticles: number
  ): string {
    const imageUrls = images.map(img => img.url).join('", "');
    
    return `You are a punchy, engaging LinkedIn content creator for ${clientName}. Write like a successful entrepreneur, not an academic consultant. Create compelling posts that grab attention and drive engagement.

SOURCE CONTENT ANALYSIS:
URL: ${content.url}
Title: ${content.title}
Content: ${content.cleanText.substring(0, 1500)}

AVAILABLE IMAGES (use exact URLs provided):
["${imageUrls}"]

WRITING STYLE - MATCH THIS ENERGY:
✅ GOOD EXAMPLES: "SCHOOL-SAFE SNACKS JUST GOT BETTER", "FITNESS SNACKING DONE RIGHT", "Low-carb fuel to power your day"
❌ AVOID: "Strategic Implementation Excellence", "Comprehensive Business Analysis", "Professional expertise drives..."

CONTENT REQUIREMENTS:
Create ${numArticles} engaging LinkedIn posts. Each must be PUNCHY and ATTENTION-GRABBING:

1. IMMEDIATE IMPACT: Hook readers in first 3 words
2. BENEFIT-FOCUSED: What's in it for the reader?
3. CONVERSATIONAL: Write like you're talking to a friend
4. SPECIFIC: Use concrete details, not abstract concepts
5. EMOTIONAL: Make people feel something (excited, curious, confident)

ARTICLE SPECIFICATIONS:
- Headline: 3-6 words maximum, PUNCHY and benefit-driven (like "BETTER SNACKS ARE HERE" or "PRODUCTIVITY HACK REVEALED")
- Hook: 4-6 words maximum, powerful emotion or benefit (like "Game-changing results in 30 days" or "Stop wasting money on this")
- Content: 80-120 words, 2-3 short paragraphs, conversational tone
- No academic jargon, no "strategic implementation" - write for real people
- End with: "Full details: ${content.url}"
- Use 3-4 hashtags that real people search for

FOCUS ANGLES (select different ones for variety):
${focusAngles.map((angle, i) => `${i + 1}. ${angle}`).join('\n')}

TONE VARIETIES (use different ones):
- Exciting Discovery: "This will blow your mind" energy
- Urgent Warning: "Stop doing this immediately" tone
- Exclusive Insight: "Here's what insiders know" feel
- Challenge Convention: "Everyone's doing it wrong" approach
- Success Story: "Here's how they won big" narrative
- Simple Solution: "It's easier than you think" angle

CLIENT CONTEXT:
Extract business insights relevant to ${clientName} and their industry sector. Position content as coming from someone who understands their market and challenges.

OUTPUT FORMAT (valid JSON only):
{
  "articles": [
    {
      "articleNumber": 1,
      "headline": "GAME CHANGER REVEALED",
      "hook": "This changes everything for businesses",
      "content": "Most companies miss this obvious opportunity. While competitors struggle with old methods, smart businesses are already ahead.\\n\\nThe secret? Simple changes that deliver massive results. No complex strategies needed.\\n\\nFull details: ${content.url}",
      "hashtags": ["#BusinessGrowth", "#Innovation", "#Success", "#GameChanger"],
      "focusAngle": "Game-changing innovation that disrupts industries",
      "assignedImageUrl": "[exact URL from available images]",
      "imagePlacement": "Professional context illustration",
      "clientName": "${clientName}",
      "tone": "Engaging and Direct",
      "wordCount": 95
    }
  ],
  "totalArticles": ${numArticles}
}

CRITICAL REQUIREMENTS:
- Use EXACT image URLs from the provided list
- Never create fictional URLs or modify provided URLs
- Each article must offer genuine business value and insights
- Avoid sales language, promotional tone, or desperate marketing speak
- Write as an industry expert who commands respect and attention
- Ensure content is actionable and strategically relevant

Generate the JSON response now:`;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192, // Increased for longer content
        topK: 40,
        topP: 0.95
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content returned from Gemini API');
    }

    return content;
  }

  private parseAndValidateResponse(
    geminiResponse: string,
    selectedImages: Array<ExtractedImage | UnsplashImage>,
    sourceUrl: string,
    clientName: string
  ): GeneratedArticle[] {
    try {
      // Clean response and extract JSON
      let jsonString = geminiResponse
        .replace(/```json\n?/g, '')
        .replace(/\n?```/g, '')
        .trim();

      // Handle truncated JSON by finding the last complete object
      if (!jsonString.endsWith('}')) {
        console.warn('Detected truncated JSON response, attempting to fix...');
        
        // Find last complete article object
        const lastCompleteIndex = jsonString.lastIndexOf('"}');
        if (lastCompleteIndex > 0) {
          jsonString = jsonString.substring(0, lastCompleteIndex + 2) + ']}';
          console.log('Fixed truncated JSON');
        }
      }

      const parsed = JSON.parse(jsonString);
      
      if (!parsed.articles || !Array.isArray(parsed.articles)) {
        throw new Error('Invalid response format: missing articles array');
      }

      // Validate and enhance each article
      return parsed.articles.map((article: any, index: number) => {
        // Ensure required fields
        const validated: GeneratedArticle = {
          articleNumber: article.articleNumber || index + 1,
          headline: this.validateText(article.headline, 'Professional Insights'),
          hook: this.validateText(article.hook, 'Strategic analysis and industry expertise'),
          content: this.validateContent(article.content),
          hashtags: this.validateHashtags(article.hashtags),
          focusAngle: article.focusAngle || 'Strategic business analysis',
          assignedImageUrl: this.validateImageUrl(article.assignedImageUrl, selectedImages),
          imagePlacement: article.imagePlacement || 'Professional illustration',
          clientName: clientName,
          tone: article.tone || 'Strategic Advisory',
          wordCount: article.wordCount || this.countWords(article.content)
        };

        // Add image attribution for Unsplash images
        const selectedImage = selectedImages.find(img => img.url === validated.assignedImageUrl);
        if (selectedImage && 'authorName' in selectedImage) {
          validated.imageAttribution = `Photo by ${selectedImage.authorName} on Unsplash`;
        }

        return validated;
      });

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', geminiResponse);
      
      // Return fallback article
      return [{
        articleNumber: 1,
        headline: 'Industry Analysis and Strategic Insights',
        hook: 'Professional expertise drives sustainable business transformation',
        content: 'Industry leaders recognise that strategic positioning requires comprehensive analysis and decisive action.\\n\\nEffective implementation combines market intelligence with operational excellence, creating sustainable competitive advantages.\\n\\nOrganisations that prioritise strategic thinking and professional development consistently outperform their competitors.',
        hashtags: ['#StrategicAnalysis', '#BusinessTransformation', '#ProfessionalDevelopment', '#IndustryInsights'],
        focusAngle: 'Strategic business analysis',
        assignedImageUrl: selectedImages[0]?.url || '',
        imagePlacement: 'Professional business context',
        clientName: clientName,
        tone: 'Strategic Advisory',
        wordCount: 150
      }];
    }
  }

  private validateText(text: string, fallback: string): string {
    return (text && typeof text === 'string' && text.trim()) ? text.trim() : fallback;
  }

  private validateContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return 'Smart businesses know this secret. Most competitors are missing out on huge opportunities.\\n\\nThe solution is simpler than you think. Quick changes create massive results.\\n\\nReady to get ahead?';
    }
    
    // Convert escaped newlines to actual newlines for proper formatting
    return content.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');
  }

  private validateHashtags(hashtags: any): string[] {
    if (!Array.isArray(hashtags)) {
      return ['#BusinessGrowth', '#Success', '#Innovation', '#GameChanger'];
    }
    
    const validTags = hashtags
      .filter(tag => typeof tag === 'string' && tag.startsWith('#'))
      .slice(0, 4);
    
    // Ensure we have exactly 4 hashtags
    while (validTags.length < 4) {
      const fallbackTags = ['#BusinessGrowth', '#Success', '#Innovation', '#GameChanger'];
      validTags.push(fallbackTags[validTags.length % fallbackTags.length]);
    }
    
    return validTags.slice(0, 4);
  }

  private validateImageUrl(url: string, availableImages: Array<ExtractedImage | UnsplashImage>): string {
    if (!url || typeof url !== 'string') {
      return availableImages[0]?.url || '';
    }
    
    // Check if URL is in available images
    const foundImage = availableImages.find(img => img.url === url);
    return foundImage ? url : availableImages[0]?.url || '';
  }

  private countWords(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    return text.replace(/\\n/g, ' ').split(/\s+/).filter(word => word.length > 0).length;
  }
}