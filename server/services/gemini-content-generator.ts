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

export interface ContentAnalysis {
  industry: string;
  businessModel: string;
  keyTopics: ContentTopic[];
  targetAudience: string;
  competitiveAdvantages: string[];
  industryTrends: string[];
  recommendedPosts: number;
  contentOpportunities: ContentOpportunity[];
}

export interface ContentTopic {
  name: string;
  category: string; // 'technology', 'benefit', 'service', 'feature', 'process'
  importance: number; // 1-5 scale
  postPotential: number; // How many posts this topic can support
  angles: string[]; // Different ways to approach this topic
}

export interface ContentOpportunity {
  topic: string;
  angle: string;
  postType: 'news' | 'insight' | 'benefit' | 'comparison' | 'story' | 'tip';
  priority: number; // 1-5 scale
}

export interface PostPlan {
  postNumber: number;
  topic: string;
  angle: string;
  postType: string;
  focusPoints: string[]; // 1-2 key points to cover
  toneStrategy: string;
  industryConnection: string;
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
    useSiteImages: boolean,
    spellingPreference: 'british' | 'american' = 'british'
  ): Promise<ContentGenerationResult> {
    console.log('Starting intelligent content strategy analysis with Gemini');

    // Step 1: Analyze content for industry, topics, and opportunities
    const contentAnalysis = await this.analyzeContentStrategy(extractedContent);
    console.log(`Industry: ${contentAnalysis.industry}, ${contentAnalysis.keyTopics.length} topics identified, ${contentAnalysis.recommendedPosts} posts recommended`);

    // Step 2: Select images based on assessment
    const selectedImages = this.selectBestImages(imageAssessment, useSiteImages);
    
    // Step 3: Extract client name from URL
    const clientName = this.extractClientName(extractedContent.url);
    
    // Step 4: Generate strategic post plan based on analysis
    const postPlan = this.generateStrategicPostPlan(contentAnalysis, selectedImages.length);
    console.log(`Strategic plan: ${postPlan.length} posts planned across ${contentAnalysis.keyTopics.length} topics`);

    // Step 5: Create enhanced prompt with industry intelligence
    const prompt = await this.createIntelligentPrompt(
      extractedContent,
      selectedImages,
      contentAnalysis,
      postPlan,
      clientName,
      spellingPreference
    );

    // Step 6: Call Gemini API with enhanced prompt
    const geminiResponse = await this.callGeminiAPI(prompt);
    
    // Step 7: Parse and validate response
    const articles = this.parseAndValidateResponse(
      geminiResponse,
      selectedImages,
      extractedContent.url,
      clientName,
      contentAnalysis
    );

    return {
      articles,
      totalArticles: articles.length,
      sourceUrl: extractedContent.url,
      sourceTitle: extractedContent.title,
      generatedAt: new Date().toISOString(),
      imageStrategy: `${contentAnalysis.industry} strategy: ${articles.length} posts across ${contentAnalysis.keyTopics.length} topics`
    };
  }

  private selectBestImages(assessment: ImageAssessment, useSiteImages: boolean): Array<ExtractedImage | UnsplashImage> {
    console.log(`🖼️ Image Selection Debug:`);
    console.log(`- useSiteImages: ${useSiteImages}`);
    console.log(`- assessment.recommendations.useOriginalImages: ${assessment.recommendations.useOriginalImages}`);
    console.log(`- usableImages count: ${assessment.usableImages.length}`);
    console.log(`- fallbackImages count: ${assessment.fallbackImages.length}`);
    
    if (!useSiteImages || !assessment.recommendations.useOriginalImages) {
      // Use Unsplash images
      const unsplashImages = assessment.fallbackImages.slice(0, 8);
      console.log(`- Using Unsplash images: ${unsplashImages.length} images`);
      console.log(`- First Unsplash URL: ${unsplashImages[0]?.url || 'none'}`);
      return unsplashImages;
    }

    // Use original images, supplement with Unsplash if needed
    const originalImages = assessment.usableImages.slice(0, 6);
    const supplementImages = assessment.fallbackImages.slice(0, 8 - originalImages.length);
    console.log(`- Using mix: ${originalImages.length} original + ${supplementImages.length} Unsplash`);
    
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

  private async analyzeContentStrategy(content: ExtractedContent): Promise<ContentAnalysis> {
    console.log('Analyzing content for strategic opportunities...');
    
    const analysisPrompt = `Analyze this webpage content for intelligent content marketing strategy:

URL: ${content.url}
Title: ${content.title}
Content: ${content.cleanText.substring(0, 2000)}
Headings: ${content.headings.map(h => h.text).join(', ')}

As an expert content strategist, analyze this content and identify:

1. INDUSTRY CLASSIFICATION: What industry/sector is this business in?
2. BUSINESS MODEL: What type of business is this (service, product, consultancy, etc.)?
3. KEY TOPICS: Extract all major topics, features, benefits, technologies, or services mentioned
4. TARGET AUDIENCE: Who would be interested in this content?
5. COMPETITIVE ADVANTAGES: What makes this business unique or valuable?
6. CONTENT OPPORTUNITIES: Based on the topics found, how many strategic posts can be created?

STRATEGIC THINKING:
- If security company mentions 7 technologies → 10-14 posts (2 per tech, some combined)
- If health food mentions 5 benefits → 7-10 posts (1-2 per benefit, industry insights)
- If consulting mentions 3 services → 6-9 posts (2-3 per service, case studies)

Respond in JSON format:
{
  "industry": "Security Technology",
  "businessModel": "service provider",
  "keyTopics": [
    {
      "name": "Biometric Access Control",
      "category": "technology",
      "importance": 5,
      "postPotential": 2,
      "angles": ["security benefits", "ROI analysis", "implementation tips"]
    }
  ],
  "targetAudience": "Facility managers and security directors",
  "competitiveAdvantages": ["30 years experience", "custom solutions"],
  "industryTrends": ["Zero-trust security", "Remote monitoring"],
  "recommendedPosts": 12,
  "contentOpportunities": [
    {
      "topic": "Biometric Access Control",
      "angle": "ROI and cost savings",
      "postType": "insight",
      "priority": 5
    }
  ]
}`;

    try {
      const response = await this.callGeminiAPI(analysisPrompt);
      const analysis = JSON.parse(this.cleanJsonResponse(response));
      
      // Validate and ensure we have reasonable numbers
      analysis.recommendedPosts = Math.min(Math.max(analysis.recommendedPosts, 6), 15);
      
      return analysis;
    } catch (error) {
      console.error('Content analysis failed, using fallback:', error);
      
      // Fallback analysis based on content length and headings
      const topics = content.headings.slice(0, 6).map((h, i) => ({
        name: h.text,
        category: 'feature',
        importance: 3,
        postPotential: 2,
        angles: ['benefits', 'implementation']
      }));
      
      return {
        industry: 'Business Services',
        businessModel: 'service provider',
        keyTopics: topics,
        targetAudience: 'Business professionals',
        competitiveAdvantages: ['Professional expertise'],
        industryTrends: ['Digital transformation'],
        recommendedPosts: Math.max(topics.length * 2, 6),
        contentOpportunities: topics.map(t => ({
          topic: t.name,
          angle: 'strategic benefits',
          postType: 'insight' as const,
          priority: 3
        }))
      };
    }
  }

  private generateStrategicPostPlan(analysis: ContentAnalysis, availableImages: number): PostPlan[] {
    const plans: PostPlan[] = [];
    let postNumber = 1;
    
    // Create posts for each key topic, following the 1-2 posts per topic rule
    for (const topic of analysis.keyTopics) {
      // Number of posts for this topic (1-2, based on importance)
      const postsForTopic = topic.importance >= 4 ? 2 : 1;
      
      for (let i = 0; i < postsForTopic; i++) {
        const angle = topic.angles[i] || topic.angles[0] || 'strategic benefits';
        const postType = this.selectPostType(topic.category, i);
        
        plans.push({
          postNumber,
          topic: topic.name,
          angle,
          postType,
          focusPoints: this.generateFocusPoints(topic, angle),
          toneStrategy: this.selectToneStrategy(postType),
          industryConnection: this.createIndustryConnection(analysis.industry, topic.name)
        });
        
        postNumber++;
      }
    }
    
    // Generate 2-3 viral articles for comprehensive testing
    const maxPosts = Math.min(plans.length, 3); // Max 3 posts for better testing
    const minPosts = 2; // Always create at least 2 posts for variety
    
    const finalPostCount = Math.max(Math.min(maxPosts, 3), Math.min(minPosts, plans.length));
    console.log(`🔥 VIRAL MODE: Generating ${finalPostCount} punchy articles (${plans.length} opportunities available, ${availableImages} images available)`);
    
    return plans.slice(0, finalPostCount);
  }

  private selectPostType(category: string, index: number): string {
    const postTypes = {
      'technology': ['insight', 'benefit'],
      'benefit': ['story', 'tip'],
      'service': ['comparison', 'news'],
      'feature': ['insight', 'benefit'],
      'process': ['tip', 'story']
    };
    
    const types = postTypes[category] || ['insight', 'benefit'];
    return types[index] || types[0];
  }

  private generateFocusPoints(topic: ContentTopic, angle: string): string[] {
    // Generate 1-2 focused points for each post
    const basePoints = [
      `${topic.name} core advantage`,
      `Implementation strategy for ${topic.name}`,
      `ROI and business impact of ${topic.name}`,
      `Industry best practices for ${topic.name}`,
      `Common mistakes to avoid with ${topic.name}`
    ];
    
    return basePoints.slice(0, 2);
  }

  private selectToneStrategy(postType: string): string {
    const strategies = {
      'news': 'Breaking industry insight',
      'insight': 'Expert analysis and advice',
      'benefit': 'Value-focused and results-driven',
      'comparison': 'Analytical and objective',
      'story': 'Engaging narrative with lessons',
      'tip': 'Actionable and practical'
    };
    
    return strategies[postType] || 'Professional and engaging';
  }

  private createIndustryConnection(industry: string, topic: string): string {
    return `Connect ${topic} to current ${industry} market trends and challenges`;
  }

  private async createIntelligentPrompt(
    content: ExtractedContent,
    images: Array<ExtractedImage | UnsplashImage>,
    analysis: ContentAnalysis,
    postPlan: PostPlan[],
    clientName: string,
    spellingPreference: 'british' | 'american' = 'british'
  ): Promise<string> {
    const imageUrls = images.map(img => img.url).join('", "');
    
    // Get industry trends for this industry (simplified for now, can be enhanced)
    const industryInsights = this.generateIndustryInsights(analysis.industry);
    
    // Dynamic spelling instructions based on user preference
    const spellingInstructions = spellingPreference === 'american' 
      ? 'SPELLING: Use American English spelling throughout (color, honor, realize, center, analyze, optimize, personalize, utilize)'
      : 'SPELLING: Use British English spelling throughout (colour, honour, realise, centre, analyse, optimise, personalise, utilise, revitalise)';
    
    console.log(`🔤 Spelling Preference: ${spellingPreference} - Instructions: ${spellingInstructions}`);
    
    return `You are an expert content strategist for ${clientName}, a ${analysis.businessModel} in the ${analysis.industry} sector. Create strategic LinkedIn posts that position them as industry leaders.

🔤 ${spellingInstructions}
⚠️ CRITICAL: Follow the spelling preference above exactly - this is mandatory for all content generation.

🎯 STRATEGIC CONTENT ANALYSIS:
Industry: ${analysis.industry}
Business Model: ${analysis.businessModel}
Target Audience: ${analysis.targetAudience}
Key Topics Identified: ${analysis.keyTopics.map(t => t.name).join(', ')}
Competitive Advantages: ${analysis.competitiveAdvantages.join(', ')}

📊 INDUSTRY INTELLIGENCE:
Current ${analysis.industry} trends: ${industryInsights.join(', ')}
Market opportunity: Position ${clientName} ahead of competitors using these insights

🎯 COHERENT CONTENT STRATEGY:
Create EXACTLY 3 posts that maintain PERFECT coherence between headline, image, and content:

POST 1: EDUCATIONAL/INFORMATIONAL
- Must relate directly to the main topic from the webpage
- Include 2-3 specific, interesting facts about the topic
- Educational tone with surprising insights
- Example: If topic is "ginger" → facts about ginger's properties, history, benefits

POST 2: SALES/PRODUCT BENEFITS  
- Connect the topic directly to ${clientName}'s products/services
- Show clear product application and benefits
- Include specific value proposition and differentiation
- Example: How ${clientName} uses this ingredient/approach in their products

POST 3: USE CASE/WILDCARD
- Real-world application or customer story related to the topic
- Can be testimonial-style, case study, or practical implementation
- Shows the topic/product in action
- Example: How customers use this ingredient or see results

📝 COHERENCE REQUIREMENTS - CRITICAL:
1. HEADLINE MATCH: Content must deliver exactly what the headline promises
2. IMAGE ALIGNMENT: Content must reference and relate to the assigned image
3. TOPIC CONSISTENCY: All content must center around the same core topic
4. SPECIFIC FACTS: Include concrete, interesting details about the topic
5. BRAND INTEGRATION: Show clear connection to ${clientName}'s offerings

✅ VIRAL WRITING EXAMPLES:
"SHOCKING COST EXPOSED", "SECRET HACK REVEALED", "INDUSTRY STUNNED", "GAME-CHANGER DISCOVERED"
❌ AVOID: Generic business speak, academic language, boring corporate content

📋 VIRAL ARTICLE SPECIFICATIONS:
- Headline: 2-4 words maximum, shocking/intriguing and benefit-driven
- Hook: 3-5 words maximum, creates urgency or curiosity gap
- Content: 60-90 words split into 3 short, punchy paragraphs (use \\n\\n between paragraphs), focus on ONE shocking insight
- Include surprising industry fact that grabs attention
- Structure: First paragraph (20-30 words) → \\n\\n → Second paragraph (20-30 words) → \\n\\n → Third paragraph (20-30 words) → \\n\\n → "Read more: ${content.url}" → \\n\\n → hashtags
- Hashtags: EXACTLY 4 hashtags in this order: 1) Brand hashtag (#${clientName.replace(/\s+/g, '').toLowerCase()}), 2) Specific topic hashtag, 3) Industry/segment hashtag, 4) Wildcard/trending hashtag

🖼️ AVAILABLE IMAGES (use exact URLs - copy these EXACTLY for assignedImageUrl):
${images.map((img, i) => `${i + 1}. ${img.url}`).join('\n')}

⚠️ CRITICAL: For each article, use a different image URL from the list above. Copy the full URL exactly as shown.

🎯 COHERENT CONTENT EXAMPLES:
For "GINGER UNLOCKED" with ginger image:

POST 1 (Educational): "GINGER UNLOCKED" + "Ancient secret revealed" + "Ginger contains gingerol compounds that are 40x more potent than vitamin E for inflammation reduction. Studies show just 1g daily reduces muscle pain by 25%. Traditional Chinese medicine has used ginger for 2,500 years."

POST 2 (Sales): "GINGER POWER" + "Maximum potency guaranteed" + "Naturalelixir's ginger extract delivers 95% gingerol concentration - the highest available. Our cold-extraction process preserves all active compounds. Unlike cheap alternatives, each capsule provides therapeutic-grade potency."

POST 3 (Use Case): "GINGER SUCCESS" + "Real customer transformation" + "Sarah, 42, replaced her daily painkillers with Naturalelixir's ginger blend. Three weeks later: morning stiffness gone, energy restored. Now she hikes weekends pain-free."

OUTPUT FORMAT (valid JSON only):
{
  "articles": [
    {
      "articleNumber": 1,
      "headline": "GINGER UNLOCKED",
      "hook": "Ancient secret revealed",
      "content": "Ginger contains gingerol compounds 40x more potent than vitamin E for inflammation.\\n\\nStudies prove 1g daily reduces muscle pain by 25%. Traditional medicine used this for 2,500 years.\\n\\nNature's most powerful anti-inflammatory finally gets scientific validation.\\n\\nRead more: ${content.url}",
      "hashtags": ["#${clientName.replace(/\s+/g, '').toLowerCase()}", "#GingerBenefits", "#NaturalHealth", "#AntiInflammatory"],
      "focusAngle": "Educational facts about ginger",
      "assignedImageUrl": "${images[0]?.url || ''}",
      "imagePlacement": "Fresh ginger root",
      "clientName": "${clientName}",
      "tone": "Educational and engaging",
      "wordCount": 75
    },
    {
      "articleNumber": 2,
      "headline": "GINGER POWER",
      "hook": "Maximum potency guaranteed",
      "content": "${clientName}'s ginger extract delivers 95% gingerol concentration - the highest available.\\n\\nOur cold-extraction preserves all active compounds. Unlike cheap alternatives, guaranteed therapeutic potency.\\n\\nEvery batch tested for maximum bioavailability and effectiveness.\\n\\nRead more: ${content.url}",
      "hashtags": ["#${clientName.replace(/\s+/g, '').toLowerCase()}", "#GingerExtract", "#PremiumQuality", "#TherapeuticGrade"],
      "focusAngle": "Product benefits and quality",
      "assignedImageUrl": "${images[0]?.url || ''}",
      "imagePlacement": "Premium ginger supplement",
      "clientName": "${clientName}",
      "tone": "Confident and sales-focused",
      "wordCount": 75
    },
    {
      "articleNumber": 3,
      "headline": "GINGER SUCCESS", 
      "hook": "Real transformation story",
      "content": "Sarah, 42, replaced daily painkillers with ${clientName}'s ginger blend.\\n\\nThree weeks later: morning stiffness gone, energy restored. Now she hikes weekends pain-free.\\n\\nJoin 10,000+ customers who chose natural healing over side effects.\\n\\nRead more: ${content.url}",
      "hashtags": ["#${clientName.replace(/\s+/g, '').toLowerCase()}", "#CustomerSuccess", "#NaturalHealing", "#PainFree"],
      "focusAngle": "Customer success story",
      "assignedImageUrl": "${images[0]?.url || ''}",
      "imagePlacement": "Happy customer using ginger",
      "clientName": "${clientName}",
      "tone": "Inspirational and testimonial",
      "wordCount": 75
    }
  ],
  "totalArticles": 3
}

🚨 CRITICAL REQUIREMENTS:
- Follow the EXACT post plan above - one post per topic/angle
- Each post focuses on ONE specific topic, not multiple
- Include current ${analysis.industry} insights for credibility  
- Use EXACT image URLs from the provided list
- Make each post sound fresh and different from their existing content
- Position ${clientName} as the expert solution for that specific topic

Generate ${postPlan.length} strategic posts now:`;
  }

  private generateIndustryInsights(industry: string): string[] {
    // Industry-specific insights (can be enhanced with real API calls later)
    const insights = {
      'Security Technology': ['Zero-trust architecture adoption', 'AI-powered threat detection', 'Cloud-based access control'],
      'Health Food': ['Plant-based protein surge', 'Sugar reduction mandates', 'Functional ingredients trend'],
      'Business Services': ['Digital transformation acceleration', 'Remote work optimization', 'AI automation adoption'],
      'Manufacturing': ['Industry 4.0 implementation', 'Supply chain resilience', 'Sustainable production'],
      'Finance': ['Open banking expansion', 'Regulatory compliance updates', 'Fintech integration'],
      'Healthcare': ['Telehealth normalization', 'Data privacy regulations', 'Patient experience focus'],
      'Technology': ['AI integration demands', 'Cybersecurity imperatives', 'Cloud-first strategies']
    };

    return insights[industry] || ['Digital transformation', 'Market efficiency gains', 'Competitive differentiation'];
  }

  private cleanJsonResponse(response: string): string {
    return response
      .replace(/```json\n?/g, '')
      .replace(/\n?```/g, '')
      .trim();
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
    clientName: string,
    analysis: ContentAnalysis
  ): GeneratedArticle[] {
    try {
      // Clean response and extract JSON
      let jsonString = this.cleanJsonResponse(geminiResponse);

      // Handle truncated JSON by finding the last complete article
      if (!jsonString.endsWith('}')) {
        console.warn('Detected truncated JSON response, attempting to recover...');
        
        // Find the last complete article block by looking for the pattern
        // Look for "},\n    {\n      \"articleNumber\":" to find article boundaries
        const articlePattern = /},\s*{\s*"articleNumber":\s*\d+/g;
        const matches: RegExpExecArray[] = [];
        let match: RegExpExecArray | null;
        while ((match = articlePattern.exec(jsonString)) !== null) {
          matches.push(match);
        }
        
        if (matches.length > 0) {
          // Find the last complete article boundary
          const lastCompleteArticle = matches[matches.length - 1];
          const cutoffPoint = lastCompleteArticle.index! + 1; // Just after the }
          
          // Truncate to last complete article and close the JSON properly
          jsonString = jsonString.substring(0, cutoffPoint) + '\n  ],\n  "totalArticles": ' + (matches.length + 1) + '\n}';
          console.log(`Recovered ${matches.length + 1} articles from truncated response`);
        } else {
          // Fallback: look for any complete JSON structure
          const lastCompleteIndex = jsonString.lastIndexOf('"}');
          if (lastCompleteIndex > 0) {
            jsonString = jsonString.substring(0, lastCompleteIndex + 2) + '],"totalArticles": 1}';
            console.log('Used fallback recovery for single article');
          }
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
          hashtags: this.validateHashtags(article.hashtags, clientName, article.focusAngle || 'Strategic business analysis', analysis.industry),
          focusAngle: article.focusAngle || 'Strategic business analysis',
          assignedImageUrl: this.validateImageUrl(article.assignedImageUrl, selectedImages, index),
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
        assignedImageUrl: this.validateImageUrl('', selectedImages, 0),
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

  private validateHashtags(hashtags: any, clientName: string, focusAngle: string, industry: string): string[] {
    if (!Array.isArray(hashtags) || hashtags.length !== 4) {
      return this.generateFallbackHashtags(clientName, focusAngle, industry);
    }
    
    const validTags = hashtags
      .filter(tag => typeof tag === 'string' && tag.startsWith('#'))
      .slice(0, 4);
    
    // If we don't have exactly 4 valid hashtags, generate fallback
    if (validTags.length !== 4) {
      return this.generateFallbackHashtags(clientName, focusAngle, industry);
    }
    
    return validTags;
  }
  
  private generateFallbackHashtags(clientName: string, focusAngle: string, industry: string): string[] {
    // 1. Brand hashtag (client name without spaces)
    const brandTag = `#${clientName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // 2. Specific topic hashtag (based on focus angle)
    const topicTag = this.createTopicHashtag(focusAngle);
    
    // 3. Industry/segment hashtag
    const industryTag = this.createIndustryHashtag(industry);
    
    // 4. Wildcard/trending hashtag
    const wildcardTags = ['#GameChanger', '#Innovation', '#Success', '#Breakthrough', '#Strategy', '#Excellence'];
    const wildcardTag = wildcardTags[Math.floor(Math.random() * wildcardTags.length)];
    
    return [brandTag, topicTag, industryTag, wildcardTag];
  }
  
  private createTopicHashtag(focusAngle: string): string {
    // Extract key words from focus angle and create a hashtag
    const cleanAngle = focusAngle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanAngle.split(/\s+/).filter(word => word.length > 2);
    
    if (words.length >= 2) {
      // Combine first two meaningful words
      return `#${words[0]}${words[1]}`.replace(/[^a-zA-Z0-9#]/g, '');
    } else if (words.length === 1) {
      return `#${words[0]}Solutions`;
    } else {
      return '#StrategicSolutions';
    }
  }
  
  private createIndustryHashtag(industry: string): string {
    const industryMap = {
      'Security Technology': '#SecurityIndustry',
      'Health Food': '#HealthIndustry', 
      'Business Services': '#BusinessServices',
      'Manufacturing': '#Manufacturing',
      'Finance': '#FinanceIndustry',
      'Healthcare': '#Healthcare',
      'Technology': '#TechIndustry'
    };
    
    return industryMap[industry] || '#BusinessIndustry';
  }

  private validateImageUrl(url: string, availableImages: Array<ExtractedImage | UnsplashImage>, articleIndex: number = 0): string {
    if (!availableImages || availableImages.length === 0) {
      return '';
    }
    
    // If URL is provided and valid, use it
    if (url && typeof url === 'string') {
      const foundImage = availableImages.find(img => img.url === url);
      if (foundImage) {
        return url;
      }
    }
    
    // Cycle through available images based on article index
    // This ensures even distribution when we have more posts than images
    const imageIndex = articleIndex % availableImages.length;
    return availableImages[imageIndex]?.url || '';
  }

  private countWords(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    return text.replace(/\\n/g, ' ').split(/\s+/).filter(word => word.length > 0).length;
  }
}