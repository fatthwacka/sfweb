import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { aiPrompts } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Schema for AI content generation request
const generateContentSchema = z.object({
  type: z.enum(['title', 'excerpt', 'content', 'seo-title', 'seo-description']),
  context: z.string().optional(),
  currentContent: z.string().optional(),
  category: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  contentType: z.enum(['case-study', 'news', 'informational', 'showcase']).optional(),
  customPrompt: z.string().optional() // For advanced users to override the prompt
});

// Schema for full generation (title + content + SEO + excerpt)
const generateFullContentSchema = z.object({
  topic: z.string().min(1),
  contentType: z.enum(['case-study', 'news', 'informational', 'showcase']),
  category: z.string().optional(),
  customPrompt: z.string().optional(),
  saveAsDefault: z.boolean().optional()
});

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

// Business services context
const BUSINESS_CONTEXT = `
SlyFox Studios is a creative agency in South Africa offering diverse services:
- Photography (weddings, portraits, corporate events, products)
- Videography (promotional videos, event coverage, social content)
- Social Media Management (content creation, strategy, brand building)
- AI Automation (workflow optimization, chatbots, business process automation)
- Web Development (custom websites, e-commerce, web applications)
Note: Blog content should focus on the specific topic provided, only referencing the business where directly relevant.
`;

// Content type guidelines
const contentTypeGuidelines: Record<string, string> = {
  'case-study': `
    This is a CASE STUDY format:
    - Tell a story about a specific project or client
    - Include the challenge, solution, and results
    - Use specific details and outcomes
    - Showcase expertise through real examples`,
  'news': `
    This is a NEWS/ANNOUNCEMENT format:
    - Lead with the most important information
    - Keep it timely and relevant
    - Include key details: who, what, when, where, why
    - End with next steps or call-to-action`,
  'informational': `
    This is an INFORMATIONAL/TIPS format:
    - Provide practical, actionable advice
    - Use numbered tips or clear sections
    - Include expert insights and best practices
    - Help readers solve a problem or learn something new`,
  'showcase': `
    This is a PROJECT SHOWCASE format:
    - Highlight the visual/creative aspects
    - Describe the creative process
    - Emphasize unique elements and results
    - Let the work speak for itself with supporting narrative`
};

// Content generation prompts
const prompts = {
  title: (context: string, category?: string, contentType?: string) => `
    Generate 5 engaging blog post titles specifically about "${context}".
    ${category ? `This is for the "${category}" category.` : ''}
    ${contentType && contentTypeGuidelines[contentType] ? `Content style: ${contentType}` : ''}

    IMPORTANT: Titles must be directly about "${context}" - not generic business content.

    Requirements:
    - Each title must clearly relate to "${context}"
    - Professional but engaging tone
    - SEO-friendly (60 characters or less)
    - Match the content type style (${contentType || 'general'})
    - Avoid clickbait and generic phrases

    Return as a JSON array of strings.
  `,

  excerpt: (context: string, content?: string) => `
    Write a compelling excerpt (2-3 sentences, max 160 characters) for a blog post titled "${context}".
    ${content ? `Here's the main content for context:\n${content.substring(0, 500)}...` : ''}

    The excerpt should:
    - Summarize the main value proposition
    - Entice readers to click and read more
    - Use professional but approachable language
    - Be optimized for social media sharing

    Return just the excerpt text, no formatting.
  `,

  content: (context: string, category?: string, contentType?: string) => `
You are an expert content writer creating an insightful, research-backed article. You MUST return ONLY valid JSON matching the schema below.

Topic: "${context}"
${category ? `Category: ${category}` : ''}

CRITICAL REQUIREMENTS:
1. The entire article must be specifically about "${context}"
2. Include SUBSTANCE - specific facts, statistics, examples, or industry insights
3. Each paragraph must add NEW information - never repeat the same point in different words
4. Write like an industry expert sharing genuine knowledge, not a marketer filling space

CONTENT QUALITY STANDARDS:
- Include at least one specific statistic, percentage, or data point per section where relevant
- Mention real-world examples, case studies, or scenarios
- Provide actionable tips or practical advice readers can implement
- Reference industry trends, common mistakes, or expert observations
- Avoid vague statements like "it's important" or "many businesses struggle" without explaining WHY or HOW
- Each sentence should teach the reader something new

Business context: SlyFox Studios is a creative agency in South Africa offering photography, videography, social media management, AI automation, and web development. Only mention this where directly relevant to the topic.

MANDATORY JSON SCHEMA:
{
  "subtitle": "string (8-12 words - a compelling hook that promises specific value)",
  "introduction": "string (2-3 sentences that immediately establish why this topic matters with a specific insight)",
  "sections": [
    {"heading": "string (specific problem H2)", "content": "string (5-6 sentences with concrete examples and data)"},
    {"heading": "string (actionable solution H2)", "content": "string (5-6 sentences with practical steps or methods)"},
    {"heading": "string (measurable outcomes H2)", "content": "string (5-6 sentences with specific benefits or results)"}
  ],
  "pullQuote": "string (10-15 word memorable insight that readers would want to share)",
  "conclusion": {"heading": "string (forward-looking CTA H2)", "content": "string (2-3 sentences)"}
}

STRUCTURE REQUIREMENTS:
- sections MUST be an array with exactly 3 objects
- Each section object MUST have both "heading" and "content" keys
- conclusion MUST be an object with both "heading" and "content" keys
- Keep each section content to 5-6 sentences (50-80 words)

${contentType && contentTypeGuidelines[contentType] ? contentTypeGuidelines[contentType] : ''}

Return ONLY the JSON object. No markdown, no code blocks, no explanation.`,

  'seo-title': (context: string, keywords?: string[]) => `
    Generate an SEO-optimized title (max 60 characters) for a blog post about "${context}".
    ${keywords?.length ? `Include these keywords if relevant: ${keywords.join(', ')}` : ''}

    Requirements:
    - Under 60 characters for Google search results
    - Include primary keyword naturally
    - Compelling for click-through rates

    Return just the title text.
  `,

  'seo-description': (context: string, keywords?: string[]) => `
    Write an SEO meta description (max 160 characters) for a blog post titled "${context}".
    ${keywords?.length ? `Include these keywords: ${keywords.join(', ')}` : ''}

    Requirements:
    - Under 160 characters for search snippets
    - Include target keywords naturally
    - Compelling call-to-action
    - Summarize the value proposition

    Return just the description text.
  `
};

async function callGeminiAPI(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API Error:', errorData);
    
    // Handle specific error cases
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Please wait a few minutes before trying again.`);
    } else if (response.status === 403) {
      throw new Error(`API key invalid or insufficient permissions.`);
    } else if (response.status === 400) {
      throw new Error(`Invalid request. Please check your input and try again.`);
    } else {
      throw new Error(`Gemini API error (${response.status}). Please try again later.`);
    }
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// Generate blog content using Gemini
router.post('/generate-blog-content', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI content generation is not available - API key not configured' 
      });
    }

    const { type, context = '', currentContent, category, keywords, contentType, customPrompt } = generateContentSchema.parse(req.body);

    if (!context.trim()) {
      return res.status(400).json({ error: 'Context is required for content generation' });
    }

    // Get the appropriate prompt
    let prompt: string;

    // Use custom prompt if provided, otherwise use default prompts
    if (customPrompt) {
      console.log('🔧 Using custom prompt:', customPrompt);
      prompt = `${customPrompt}

Content to work with:
${context}

Please provide only the enhanced content without any additional text or explanations.`;
      console.log('🔧 Final prompt:', prompt);
    } else {
      console.log('🔧 Using default prompts for type:', type);
      switch (type) {
        case 'title':
          prompt = prompts.title(context, category, contentType);
          break;
        case 'excerpt':
          // Check if context contains enhancement instructions (rather than just a topic)
          // These keywords indicate the Article Editor is sending a custom enhancement prompt
          const isEnhancementRequest =
            context.includes('Content to enhance:') ||
            context.includes('REWRITE TASK') ||
            context.includes('Make this content') ||
            context.includes('GRAMMAR') ||
            context.includes('SPELLING') ||
            context.includes('CONCISE REWRITE') ||
            context.includes('EXPANSION TASK') ||
            context.includes('TONE ADJUSTMENT') ||
            context.includes('ARTICLE CONTEXT') ||
            context.includes('GENERATE') ||
            context.includes('hashtag') ||
            context.includes('HASHTAG') ||
            context.includes('#Broad #Niche');

          if (isEnhancementRequest) {
            // Use the full context as-is for enhancements
            prompt = context;
            console.log('🔧 Using enhancement context directly');
          } else {
            // Use normal excerpt template for actual excerpts
            prompt = prompts.excerpt(context, currentContent);
          }
          break;
        case 'content':
          prompt = prompts.content(context, category, contentType);
          break;
        case 'seo-title':
          prompt = prompts['seo-title'](context, keywords);
          break;
        case 'seo-description':
          prompt = prompts['seo-description'](context, keywords);
          break;
        default:
          return res.status(400).json({ error: 'Invalid content type' });
      }
    }

    console.log(`🤖 Generating ${type} content for: "${context}"`);

    const aiResponse = await callGeminiAPI(prompt);

    // Strip markdown code blocks if present (```json ... ```)
    const cleanResponse = aiResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Handle different response formats
    let result;

    if (type === 'title') {
      try {
        // Try to parse as JSON array for multiple suggestions
        const suggestions = JSON.parse(cleanResponse);
        if (Array.isArray(suggestions)) {
          result = { suggestions: suggestions.map((s: string) => s.trim()).filter((s: string) => s) };
        } else {
          result = { suggestions: [cleanResponse] };
        }
      } catch {
        // Fallback: split by lines, filter out empty lines and markdown artifacts
        const lines = cleanResponse
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line && !line.startsWith('[') && !line.startsWith(']') && !line.startsWith('```'));
        result = { suggestions: lines.length > 0 ? lines : [cleanResponse] };
      }
    } else if (type === 'content') {
      // Parse structured content with subtitle, introduction, sections array, pullQuote, and conclusion
      try {
        const structured = JSON.parse(cleanResponse);

        // Handle NEW format with subtitle and pullQuote
        if (structured.introduction && structured.sections && Array.isArray(structured.sections)) {
          result = {
            sections: {
              subtitle: structured.subtitle?.trim() || '',
              introduction: structured.introduction.trim(),
              mainSections: structured.sections.map((s: { heading: string; content: string }) => ({
                heading: s.heading?.trim() || '',
                content: s.content?.trim() || ''
              })),
              pullQuote: structured.pullQuote?.trim() || '',
              conclusion: {
                heading: structured.conclusion?.heading?.trim() || 'Ready to Get Started?',
                content: structured.conclusion?.content?.trim() || ''
              }
            }
          };
        }
        // Handle OLD format for backward compatibility: {introduction, body, conclusion}
        else if (structured.introduction && structured.body && structured.conclusion) {
          result = {
            sections: {
              subtitle: '',
              introduction: structured.introduction.trim(),
              mainSections: [{
                heading: '',
                content: structured.body.trim()
              }],
              pullQuote: '',
              conclusion: {
                heading: '',
                content: structured.conclusion.trim()
              }
            }
          };
        } else {
          // Fallback: return as single content block
          result = { content: cleanResponse };
        }
      } catch {
        // Fallback: return as single content block
        result = { content: cleanResponse };
      }
    } else {
      result = { content: cleanResponse };
    }

    console.log(`✅ Generated ${type} content successfully`);
    res.json(result);

  } catch (error) {
    console.error('Error generating AI content:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate content', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate multiple content suggestions for brainstorming
router.post('/brainstorm', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI brainstorming is not available - API key not configured' 
      });
    }

    const { topic, category } = z.object({
      topic: z.string().min(1, 'Topic is required'),
      category: z.string().optional()
    }).parse(req.body);

    const brainstormPrompt = `
      Brainstorm 10 blog post ideas for a professional photography business about "${topic}".
      ${category ? `Focus on the "${category}" category.` : ''}
      
      For each idea, provide:
      - Title (engaging, SEO-friendly)
      - Brief description (1-2 sentences)
      - Target audience
      - Key takeaways
      
      Format as JSON array with objects containing: title, description, audience, takeaways
      
      Focus on content that showcases expertise and attracts potential clients.
    `;

    console.log(`🧠 Brainstorming content ideas for: "${topic}"`);

    const aiResponse = await callGeminiAPI(brainstormPrompt);
    
    try {
      const ideas = JSON.parse(aiResponse.trim());
      res.json({ ideas: Array.isArray(ideas) ? ideas : [ideas] });
    } catch {
      // Fallback: return raw response
      res.json({ ideas: [{ title: topic, description: aiResponse.trim() }] });
    }

  } catch (error) {
    console.error('Error brainstorming content:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }

    res.status(500).json({
      error: 'Failed to brainstorm content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// PROMPTS MANAGEMENT ENDPOINTS
// ============================================

// Get all prompts
router.get('/prompts', async (req, res) => {
  try {
    const prompts = await db.select().from(aiPrompts).where(eq(aiPrompts.isActive, true));
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get specific prompt by key
router.get('/prompts/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [prompt] = await db.select().from(aiPrompts).where(eq(aiPrompts.promptKey, key));

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// Update a prompt (save as default)
router.put('/prompts/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { promptText } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: 'promptText is required' });
    }

    const [updated] = await db
      .update(aiPrompts)
      .set({
        promptText,
        updatedAt: new Date()
      })
      .where(eq(aiPrompts.promptKey, key))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    console.log(`✅ Updated prompt: ${key}`);
    res.json(updated);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// ============================================
// FULL CONTENT GENERATION (Title + Content + SEO + Excerpt)
// ============================================

router.post('/generate-full', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI content generation is not available - API key not configured'
      });
    }

    const { topic, contentType, category, customPrompt, saveAsDefault } = generateFullContentSchema.parse(req.body);

    console.log(`🤖 Full generation for topic: "${topic}" (${contentType})`);

    // Get prompts from database or use custom
    let titlePrompt: string;
    let contentPromptText: string;
    let seoTitlePrompt: string;
    let seoDescPrompt: string;
    let excerptPrompt: string;

    if (customPrompt) {
      // Use custom prompt for content
      contentPromptText = customPrompt;

      // Save as default if requested
      if (saveAsDefault) {
        const promptKey = `content:${contentType}`;
        await db
          .update(aiPrompts)
          .set({ promptText: customPrompt, updatedAt: new Date() })
          .where(eq(aiPrompts.promptKey, promptKey));
        console.log(`✅ Saved custom prompt as default for ${promptKey}`);
      }
    } else {
      // ALWAYS use the code-defined prompt with structured format
      // This ensures we get subtitle, sections array, pullQuote, and conclusion object
      contentPromptText = prompts.content(topic, category, contentType);
    }

    // Use code-defined prompts for consistent structured output
    // Each prompt already includes the topic/context
    titlePrompt = prompts.title(topic, category, contentType);
    seoTitlePrompt = prompts['seo-title'](topic);
    seoDescPrompt = prompts['seo-description'](topic);
    excerptPrompt = prompts.excerpt(topic);

    // Generate all content in parallel (prompts already include context)
    const [titleResponse, contentResponse, seoTitleResponse, seoDescResponse, excerptResponse] = await Promise.all([
      callGeminiAPI(titlePrompt),
      callGeminiAPI(contentPromptText),
      callGeminiAPI(seoTitlePrompt),
      callGeminiAPI(seoDescPrompt),
      callGeminiAPI(excerptPrompt)
    ]);

    // Debug: Log raw responses (first 500 chars)
    console.log('📝 Title response:', titleResponse.substring(0, 500));
    console.log('📝 Content response:', contentResponse.substring(0, 500));

    // Parse responses
    const cleanJson = (text: string) => {
      return text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    };

    // Clean a single title string
    const cleanTitle = (title: string): string => {
      return title
        .replace(/^\d+[\.\)\-]\s*/, '') // Remove numbered prefixes like "1. " or "1) "
        .replace(/^["'\[\]]+|["'\[\]]+$/g, '') // Remove quotes and brackets
        .replace(/^[-–—]\s*/, '') // Remove dash prefixes
        .trim();
    };

    // Parse titles - handle various AI response formats
    let titles: string[] = [];
    try {
      const cleanedTitleResponse = cleanJson(titleResponse);
      const parsed = JSON.parse(cleanedTitleResponse);
      if (Array.isArray(parsed)) {
        titles = parsed.map(t => cleanTitle(String(t))).filter(t => t.length > 0);
      }
    } catch {
      // Fallback: split by newlines and clean each line
      titles = cleanJson(titleResponse)
        .split('\n')
        .map(line => cleanTitle(line))
        .filter(t => t.length > 5); // Filter out very short entries
    }

    // Parse content sections - handle NEW format with subtitle, sections array, and pullQuote
    interface ContentSection {
      heading: string;
      content: string;
    }
    interface ParsedSections {
      subtitle: string;
      introduction: string;
      mainSections: ContentSection[];
      pullQuote: string;
      conclusion: ContentSection;
    }
    let sections: ParsedSections = {
      subtitle: '',
      introduction: '',
      mainSections: [],
      pullQuote: '',
      conclusion: { heading: '', content: '' }
    };

    try {
      const cleanedContent = cleanJson(contentResponse);
      console.log('📦 Cleaned content (first 800 chars):', cleanedContent.substring(0, 800));

      const parsed = JSON.parse(cleanedContent);
      console.log('🔍 Parsed keys:', Object.keys(parsed));
      console.log('🔍 Has sections array:', Array.isArray(parsed.sections));
      console.log('🔍 Sections count:', parsed.sections?.length || 0);

      // Handle NEW format with subtitle and pullQuote
      if (parsed.introduction && parsed.sections && Array.isArray(parsed.sections)) {
        console.log('✅ Using NEW structured format with sections array');
        sections = {
          subtitle: (parsed.subtitle || '').trim(),
          introduction: (parsed.introduction || '').trim(),
          mainSections: parsed.sections.map((s: { heading?: string; content?: string }) => ({
            heading: (s.heading || '').trim(),
            content: (s.content || '').trim()
          })),
          pullQuote: (parsed.pullQuote || '').trim(),
          conclusion: {
            heading: (parsed.conclusion?.heading || 'Ready to Get Started?').trim(),
            content: (parsed.conclusion?.content || '').trim()
          }
        };
        console.log('📝 Parsed subtitle:', sections.subtitle?.substring(0, 50));
        console.log('📝 Parsed mainSections headings:', sections.mainSections.map(s => s.heading?.substring(0, 40)));
        console.log('📝 Parsed pullQuote:', sections.pullQuote?.substring(0, 50));
      }
      // Handle OLD format for backward compatibility: {introduction, body, conclusion}
      else if (parsed.introduction || parsed.body || parsed.conclusion) {
        console.log('⚠️ Using OLD format fallback (body string instead of sections array)');
        sections = {
          subtitle: '',
          introduction: (parsed.introduction || '').trim(),
          mainSections: parsed.body ? [{
            heading: '',
            content: (parsed.body || '').trim()
          }] : [],
          pullQuote: '',
          conclusion: {
            heading: '',
            content: (parsed.conclusion || '').trim()
          }
        };
      }
    } catch (parseError) {
      console.log('Content JSON parse failed, attempting regex extraction');

      // Try to extract sections using regex if JSON parsing fails
      const contentText = cleanJson(contentResponse);

      // Try to find JSON-like structure in the text (using [\s\S] instead of s flag for compatibility)
      const introMatch = contentText.match(/"introduction"\s*:\s*"([^"]+(?:\\.[^"]+)*)"/);
      const sectionsMatch = contentText.match(/"sections"\s*:\s*\[([\s\S]*?)\]/);
      const conclusionMatch = contentText.match(/"conclusion"\s*:\s*\{([^}]+)\}/);

      if (introMatch || sectionsMatch) {
        sections.introduction = (introMatch?.[1] || '').replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

        // Try to parse sections array from regex match
        if (sectionsMatch) {
          try {
            const sectionsArray = JSON.parse(`[${sectionsMatch[1]}]`);
            sections.mainSections = sectionsArray.map((s: { heading?: string; content?: string }) => ({
              heading: (s.heading || '').trim(),
              content: (s.content || '').trim()
            }));
          } catch {
            // Fallback if sections parsing fails
            sections.mainSections = [{
              heading: '',
              content: sectionsMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim()
            }];
          }
        }

        if (conclusionMatch) {
          try {
            const conclusionObj = JSON.parse(`{${conclusionMatch[1]}}`);
            sections.conclusion = {
              heading: (conclusionObj.heading || '').trim(),
              content: (conclusionObj.content || '').trim()
            };
          } catch {
            sections.conclusion = {
              heading: '',
              content: conclusionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim()
            };
          }
        }
      } else {
        // Ultimate fallback: put everything in a single section
        sections.mainSections = [{
          heading: '',
          content: contentText
        }];
      }
    }

    // Clean SEO and excerpt - remove quotes and limit length
    const cleanSeoText = (text: string): string => {
      return cleanJson(text)
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, ' ')
        .replace(/\\"/g, '"')
        .trim();
    };

    const seoTitle = cleanSeoText(seoTitleResponse).substring(0, 60);
    const seoDescription = cleanSeoText(seoDescResponse).substring(0, 155);
    const excerpt = cleanSeoText(excerptResponse).substring(0, 160);

    console.log(`✅ Full generation complete`);

    res.json({
      titles,
      sections,
      seoTitle,
      seoDescription,
      excerpt
    });

  } catch (error) {
    console.error('Error in full generation:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }

    res.status(500).json({
      error: 'Failed to generate content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;