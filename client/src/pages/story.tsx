import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { trackPageView } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { GradientBackground } from '@/components/common/gradient-background';
import { useAllGradients } from '@/hooks/use-all-gradients';
import {
  Calendar,
  Eye,
  ArrowLeft,
  ArrowUp,
  Share2,
  BookOpen,
  Clock,
  Sparkles,
  Facebook,
  Linkedin,
  Copy,
  User
} from 'lucide-react';

// X (formerly Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { BeforeAfterSlider } from '@/components/common/before-after-slider';
import { createRoot } from 'react-dom/client';
import type { BlogPost, BlogCategory, FeaturedSection } from '@shared/schema';

interface StoryPageParams {
  slug: string;
  [key: string]: string | undefined;
}

export function Story() {
  const { toast } = useToast();
  const [match, params] = useRoute<StoryPageParams>('/stories/:slug');
  const { getGradient, isLoading: gradientsLoading } = useAllGradients();
  const [gradientLoaded, setGradientLoaded] = useState(false);
  
  const slug = params?.slug || '';

  // Track page view for dynamic story pages
  useEffect(() => {
    if (slug) {
      trackPageView(`/stories/${slug}`);
    }
  }, [slug]);

  // Fetch the blog post by slug - must be called even if no slug
  const { data: post, isLoading: postLoading, error } = useQuery<BlogPost>({
    queryKey: ['story', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('No slug provided');
      }
      // First get all posts and find by slug (since we don't have a direct slug endpoint)
      const response = await apiRequest('GET', '/api/blog/posts?status=published&limit=1000');
      const posts = await response.json();
      const post = posts.find((p: BlogPost) => p.slug === slug);

      if (!post) {
        throw new Error('Story not found');
      }

      return post;
    },
    retry: false,
    enabled: !!slug // Only run query if slug exists
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ['story', 'categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/blog/categories');
      return response.json();
    }
  });

  // Fetch related posts
  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['story', 'related', post?.categoryId],
    queryFn: async () => {
      if (!post?.categoryId) return [];

      const response = await apiRequest('GET', `/api/blog/posts?status=published&category=${post.categoryId}&limit=3`);
      const posts = await response.json();
      // Filter out current post
      return posts.filter((p: BlogPost) => p.id !== post.id).slice(0, 2);
    },
    enabled: !!post?.categoryId
  });

  // Get blog-specific gradient or fall back to stories-content (moved here after all hooks)
  const blogGradient = post ? getGradient(`blog-post-${post.id}`) : null;
  const storiesGradient = getGradient('stories-content');
  const effectiveGradient = blogGradient || storiesGradient;
  
  // Determine section key for GradientBackground
  const gradientSection = post?.id ? `blog-post-${post.id}` : 'stories-content';
  
  // Enable smooth fade-in transition once gradients are loaded
  useEffect(() => {
    if (!gradientsLoading && effectiveGradient) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setGradientLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [gradientsLoading, effectiveGradient]);

  // Set document title when post loads - MUST BE BEFORE EARLY RETURNS
  useEffect(() => {
    if (post) {
      document.title = `${post.seoTitle || post.title} | SlyFox Photography Stories`;
    }
  }, [post]);

  // Mount BeforeAfterSlider component into placeholder after content renders
  useEffect(() => {
    console.log('useEffect triggered, post:', post);
    console.log('featuredSection:', post?.featuredSection);
    
    if (post && post.featuredSection?.type === 'before-after') {
      console.log('Looking for before-after-slider element...');
      const sliderElement = document.getElementById('before-after-slider');
      console.log('Found element:', sliderElement);
      
      if (sliderElement && sliderElement.children.length === 0) {
        console.log('Mounting BeforeAfterSlider component...');
        const config = {
          beforeImageUrl: sliderElement.dataset.beforeUrl,
          afterImageUrl: sliderElement.dataset.afterUrl,
          beforeImageAlt: sliderElement.dataset.beforeAlt,
          afterImageAlt: sliderElement.dataset.afterAlt,
          beforeLabel: sliderElement.dataset.beforeLabel,
          afterLabel: sliderElement.dataset.afterLabel,
          defaultPosition: parseInt(sliderElement.dataset.defaultPosition || '50'),
          showLabels: sliderElement.dataset.showLabels === 'true'
        };

        console.log('Config for BeforeAfterSlider:', config);

        const root = createRoot(sliderElement);
        root.render(<BeforeAfterSlider config={config} />);
        
        // Store root reference for cleanup
        (sliderElement as any)._reactRoot = root;
        console.log('BeforeAfterSlider mounted successfully');
      } else if (sliderElement && sliderElement.hasChildNodes()) {
        console.log('Element already has children, skipping mount');
      }
    }

    // Cleanup function
    return () => {
      const sliderElement = document.getElementById('before-after-slider');
      if (sliderElement && (sliderElement as any)._reactRoot) {
        console.log('Cleaning up BeforeAfterSlider...');
        (sliderElement as any)._reactRoot.unmount();
        delete (sliderElement as any)._reactRoot;
      }
    };
  }, [post]);

  // Check for routing errors early
  if (!match || !params?.slug) {
    return <div>Story not found</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center px-4">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-3xl font-bold text-white mb-4">Story Not Found</h1>
          <p className="text-gray-300 mb-8">
            The story you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/stories">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (postLoading || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
        <Navigation />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Loading skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-700 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-1/3" />
              <div className="aspect-video bg-gray-700 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-gray-700 rounded animate-pulse w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const category = categories.find(cat => cat.id === post.categoryId);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const estimateReadTime = (content: string) => {
    const words = content.replace(/<[^>]*>/g, '').split(' ').length;
    return Math.ceil(words / 200); // Average reading speed
  };

  // Convert markdown to HTML (for posts that weren't re-saved with HTML conversion)
  // Also adds IDs to h2 elements for anchor navigation
  // Featured section rendering components
  const renderFeaturedSection = (featuredSection: FeaturedSection): string => {
    if (!featuredSection || featuredSection.type === 'none') return '';

    const { type, title, config } = featuredSection;

    // Render optional title above the featured content
    const titleHtml = title
      ? `<h2 class="text-2xl lg:text-3xl font-semibold text-white text-center mb-8">${title}</h2>`
      : '';

    switch (type) {
      case 'image':
        if (!config.imageUrl) return '';
        const imageHeightStyle = config.height ? ` style="height: ${config.height}vh;"` : '';
        return `
          ${titleHtml}
          <section class="featured-section featured-image-section"${imageHeightStyle}>
            <div class="h-full">
              <figure class="featured-image-container h-full flex flex-col justify-center">
                <img
                  src="${config.imageUrl}"
                  alt="${config.imageAlt || 'Featured image'}"
                  class="w-full ${config.height ? 'h-full object-cover' : 'h-auto'} rounded-lg shadow-lg"
                  loading="lazy"
                />
                ${config.imageCaption ? `<figcaption class="text-center text-gray-300 text-sm mt-4 italic px-4 sm:px-6 lg:px-8">${config.imageCaption}</figcaption>` : ''}
              </figure>
            </div>
          </section>
        `;

      case 'youtube':
        if (!config.youtubeUrl) return '';
        const videoId = extractYouTubeVideoId(config.youtubeUrl);
        if (!videoId) return '';

        const videoHeightStyle = config.height ? ` style="height: ${config.height}vh;"` : '';
        return `
          ${titleHtml}
          <section class="featured-section featured-video-section my-16"${videoHeightStyle}>
            <div class="max-w-6xl mx-auto h-full">
              <div class="featured-video-container ${config.height ? 'h-full' : 'aspect-video'} rounded-lg overflow-hidden shadow-lg flex flex-col justify-center">
                <iframe
                  src="https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0"
                  title="${config.youtubeTitle || 'Featured Video'}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="w-full h-full"
                ></iframe>
              </div>
              ${config.caption ? `<p class="text-center text-gray-300 text-sm mt-4 italic px-4 sm:px-6 lg:px-8">${config.caption}</p>` : ''}
            </div>
          </section>
        `;

      case 'before-after':
        if (!config.beforeImageUrl || !config.afterImageUrl) return '';
        return `
          ${titleHtml}
          <section class="featured-section featured-before-after-section">
            <div id="before-after-slider"
                 data-before-url="${config.beforeImageUrl}"
                 data-after-url="${config.afterImageUrl}"
                 data-before-alt="${config.beforeImageAlt || 'Before image'}"
                 data-after-alt="${config.afterImageAlt || 'After image'}"
                 data-before-label="${config.beforeLabel || 'Before'}"
                 data-after-label="${config.afterLabel || 'After'}"
                 data-default-position="${config.defaultPosition || 50}"
                 data-show-labels="${config.showLabels || false}">
              <!-- React component will be mounted here -->
            </div>
          </section>
        `;

      default:
        return '';
    }
  };

  // Extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const processContent = (content: string): string => {
    if (!content) return '';

    // If content already has HTML tags, check if it still has markdown
    const hasMarkdown = /\*\*[^*]+\*\*/.test(content);

    let processed = content;

    if (hasMarkdown) {
      processed = content
        // Convert **bold** to <strong>
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to <em>
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        // Convert ### headings
        .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
        // Convert ## headings
        .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
        // Convert # headings
        .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
        // Wrap plain text in paragraphs if not already wrapped
        .split(/\n\n+/)
        .map(para => {
          para = para.trim();
          if (!para) return '';
          if (para.startsWith('<')) return para;
          return `<p>${para}</p>`;
        })
        .filter(p => p)
        .join('\n\n');
    }

    // Add IDs to h2 elements for anchor navigation (supports both <h2> and <h2 class="...">)
    let h2Index = 0;
    processed = processed.replace(/<h2([^>]*)>/g, (match, attrs) => {
      const id = `section-${h2Index}`;
      h2Index++;
      // Check if there's already an id attribute
      if (attrs.includes('id=')) {
        return match; // Keep existing id
      }
      // Add id attribute
      return `<h2 id="${id}"${attrs}>`;
    });

    return processed;
  };

  // Process content and split at featured section for proper layout
  const processContentForLayout = (content: string, postImage1?: string, postImage2?: string, featuredSection?: FeaturedSection | null) => {
    const processedContent = processContent(content);

    // If no featured section, return content as single block
    if (!featuredSection || featuredSection.type === 'none') {
      return {
        beforeFeatured: processContentWithImages(processedContent, postImage1, postImage2),
        pullQuoteHtml: null,
        featuredHtml: null,
        afterFeatured: null
      };
    }

    // Find h2 positions and blockquotes for splitting
    const h2Regex = /<h2[^>]*>/g;
    const h2Matches: number[] = [];
    let match;

    while ((match = h2Regex.exec(processedContent)) !== null) {
      h2Matches.push(match.index);
    }

    // Find blockquote/pull-quote before the split point
    const blockquoteRegex = /<blockquote[^>]*>[\s\S]*?<\/blockquote>/g;
    const pullQuoteMatches: Array<{start: number, end: number, html: string}> = [];
    
    while ((match = blockquoteRegex.exec(processedContent)) !== null) {
      pullQuoteMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        html: match[0]
      });
    }

    // Determine split point (after section 2, but before any blockquote near that point)
    let splitPoint;
    if (h2Matches.length >= 3) {
      splitPoint = h2Matches[2]; // After 3rd h2
    } else if (h2Matches.length >= 2) {
      splitPoint = processedContent.length; // At end if only 2 sections
    } else {
      splitPoint = Math.floor(processedContent.length * 0.66); // Fallback
    }

    // Find the last blockquote before the split point
    let extractedPullQuote = null;
    let pullQuoteToRemove = null;
    
    for (let i = pullQuoteMatches.length - 1; i >= 0; i--) {
      const quote = pullQuoteMatches[i];
      if (quote.start < splitPoint) {
        extractedPullQuote = quote.html;
        pullQuoteToRemove = quote;
        // Adjust split point to just before the blockquote
        splitPoint = quote.start;
        break;
      }
    }

    // Split content (removing the extracted pull quote if found)
    let beforeContent = processedContent.slice(0, splitPoint);
    let afterContent = processedContent.slice(pullQuoteToRemove ? pullQuoteToRemove.end : splitPoint);

    // Process each part with images
    const beforeWithImages = processContentWithImages(beforeContent, postImage1, null); // Only first image in first part
    const afterWithImages = processContentWithImages(afterContent, null, postImage2); // Second image in second part

    return {
      beforeFeatured: beforeWithImages,
      pullQuoteHtml: extractedPullQuote,
      featuredHtml: renderFeaturedSection(featuredSection),
      afterFeatured: afterWithImages
    };
  };

  // Process content and insert post images between sections  
  // postImage1: shown inline in body (all screens)
  // postImage2: shown in sidebar on desktop, inline on mobile
  const processContentWithImages = (content: string, postImage1?: string, postImage2?: string, featuredSection?: FeaturedSection | null): string => {
    const processedContent = processContent(content);


    // If no post images and no featured section, return as-is
    if (!postImage1 && !postImage2 && (!featuredSection || featuredSection.type === 'none')) {
      return processedContent;
    }

    // Find all h2 headings to insert images after sections
    const h2Regex = /<h2[^>]*>/g;
    const h2Matches: number[] = [];
    let match;

    while ((match = h2Regex.exec(processedContent)) !== null) {
      h2Matches.push(match.index);
    }


    // If we have h2 headings, insert images after them
    if (h2Matches.length >= 2) {
      let result = processedContent;
      let offset = 0;

      // Insert postImage1 after the first h2's content (before second h2) - ALL screens
      if (postImage1 && h2Matches.length >= 2) {
        const insertPoint = h2Matches[1];
        const imageHtml = `
          <figure class="story-post-image">
            <img src="${postImage1}" alt="Article illustration" loading="lazy" />
          </figure>
        `;
        result = result.slice(0, insertPoint + offset) + imageHtml + result.slice(insertPoint + offset);
        offset += imageHtml.length;
      }

      // Insert postImage2 after the second h2's content - mobile only (desktop shows in sidebar)
      if (postImage2 && h2Matches.length >= 3) {
        const insertPoint = h2Matches[2];
        const imageHtml = `
          <figure class="story-post-image lg:hidden">
            <img src="${postImage2}" alt="Article illustration" loading="lazy" />
          </figure>
        `;
        result = result.slice(0, insertPoint + offset) + imageHtml + result.slice(insertPoint + offset);
        offset += imageHtml.length;
      }

      // Insert featured section after section 2 (after the second h2) - FULL WIDTH
      if (featuredSection && featuredSection.type !== 'none' && 
          (featuredSection.config.position === 'after-section-2' || !featuredSection.config.position)) {
        
        const insertPoint = h2Matches.length >= 3 ? h2Matches[2] : 
                           h2Matches.length >= 2 ? processedContent.length : 
                           Math.floor(processedContent.length * 0.66);
        
        const featuredHtml = renderFeaturedSection(featuredSection);
        
        if (featuredHtml) {
          result = result.slice(0, insertPoint + offset) + featuredHtml + result.slice(insertPoint + offset);
          offset += featuredHtml.length;
        }
      }

      return result;
    }

    // Fallback: if no h2 headings, insert images at rough percentage points
    const contentLength = processedContent.length;

    if (postImage1) {
      const insertPoint = Math.floor(contentLength * 0.33);
      const nearestBreak = processedContent.indexOf('</p>', insertPoint) + 4;
      if (nearestBreak > 4) {
        const imageHtml = `
          <figure class="story-post-image">
            <img src="${postImage1}" alt="Article illustration" loading="lazy" />
          </figure>
        `;
        return processedContent.slice(0, nearestBreak) + imageHtml + processedContent.slice(nearestBreak);
      }
    }

    return processedContent;
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = currentUrl;
    const shareText = `${post.title} - ${post.excerpt || ''}`;

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: "Story link copied to clipboard" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      <Navigation />

      <GradientBackground 
        section={gradientSection} 
        fallbackSection="stories-content"
        className={`min-h-screen transition-opacity duration-700 ${gradientLoaded ? 'opacity-100' : 'opacity-95'}`}>
        {/* Back Navigation */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Link href="/stories">
              <Button
                variant="ghost"
                className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900 mb-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stories
              </Button>
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* AI Generated Badge */}
            {post.aiGenerated && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="border-cyan/50 text-cyan">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl lg:text-5xl font-thin text-stories-content-primary mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Subtitle */}
            {post.excerpt && (
              <p className="text-lg lg:text-xl text-stories-content-secondary mb-6 font-light leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>
        </div>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="aspect-video overflow-hidden rounded-lg">
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Article Content - Split Layout with Featured Section */}
      {(() => {
        const { beforeFeatured, pullQuoteHtml, featuredHtml, afterFeatured } = processContentForLayout(
          post.content, 
          (post as any).postImage1, 
          (post as any).postImage2, 
          post.featuredSection
        );

        return (
          <>
            {/* First Part - Two Column Layout */}
            <div className="px-4 sm:px-6 lg:px-8 pb-8">
              <div className="max-w-6xl mx-auto">
                <div className="story-two-column">
                  {/* Main Content Column */}
                  <div className="story-main-content">
                    <article
                      className="story-article"
                      dangerouslySetInnerHTML={{ __html: beforeFeatured }}
                    />
                  </div>

                  {/* Sidebar Column - Visible on desktop */}
                  <aside className="story-sidebar">
                    {/* [0] Table of Contents - In This Article */}
                    {(() => {
                      const h2Matches = post.content.match(/<h2[^>]*>([^<]+)<\/h2>/g);
                      if (h2Matches && h2Matches.length >= 2) {
                        const headings = h2Matches.map(h => h.replace(/<\/?h2[^>]*>/g, ''));
                        return (
                          <div className="story-sidebar-card">
                            <h3>In This Article</h3>
                            <nav className="space-y-2">
                              {headings.map((heading, idx) => (
                                <a
                                  key={idx}
                                  href={`#section-${idx}`}
                                  className="block text-sm text-gray-400 hover:text-salmon transition-colors py-1 border-l-2 border-gray-700 hover:border-salmon pl-3"
                                >
                                  {heading}
                                </a>
                              ))}
                            </nav>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* [1] Pull Quote - extracted from excerpt */}
                    {post.excerpt && (
                      <div className="story-pull-quote">
                        <div className="story-pull-quote-mark">"</div>
                        <p className="story-pull-quote-text">
                          {post.excerpt.length > 150 ? post.excerpt.slice(0, 150) + '...' : post.excerpt}
                        </p>
                      </div>
                    )}

                    {/* [2] Post Image 2 (3rd image) in Sidebar */}
                    {(post as any).postImage2 && (
                      <div className="story-sidebar-card p-0 overflow-hidden rounded-xl">
                        <img
                          src={(post as any).postImage2}
                          alt="Related visual"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Article Details */}
                    <div className="story-sidebar-card">
                      <h3>Article Details</h3>
                      <div className="space-y-3 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-salmon" />
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                        {(post as any).authorName && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-400" />
                            <span>{(post as any).authorName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyan" />
                          <span>{estimateReadTime(post.content)} min read</span>
                        </div>
                        {category && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" style={{ color: category.color }} />
                            <span>{category.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Related Stories in Sidebar */}
                    {relatedPosts.length > 0 && (
                      <div className="story-sidebar-card">
                        <h3>Related Stories</h3>
                        <div className="space-y-4">
                          {relatedPosts.slice(0, 2).map((relatedPost) => (
                            <Link key={relatedPost.id} href={`/stories/${relatedPost.slug}`}>
                              <div className="group cursor-pointer">
                                {relatedPost.coverImage && (
                                  <div className="h-24 rounded-lg overflow-hidden mb-2">
                                    <img
                                      src={relatedPost.coverImage}
                                      alt={relatedPost.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                )}
                                <h4 className="text-sm font-medium text-gray-300 group-hover:text-salmon transition-colors line-clamp-2">
                                  {relatedPost.title}
                                </h4>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </div>

            {/* Full Width Section - Pull Quote + Featured Content */}
            {(pullQuoteHtml || featuredHtml) && (
              <div className="my-16">
                {/* Pull Quote - Full Width Styled */}
                {pullQuoteHtml && (
                  <div className="max-w-6xl mx-auto mb-8">
                    <div className="story-full-width-pull-quote">
                      <div 
                        className="story-full-width-pull-quote-content"
                        dangerouslySetInnerHTML={{ __html: pullQuoteHtml.replace(/<\/?blockquote[^>]*>/g, '') }} 
                      />
                    </div>
                  </div>
                )}
                
                {/* Featured Section */}
                {featuredHtml && (
                  <div className="px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                      <div dangerouslySetInnerHTML={{ __html: featuredHtml }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Second Part - Two Column Layout (if there's content after featured section) */}
            {afterFeatured && (
              <div className="px-4 sm:px-6 lg:px-8 pb-8">
                <div className="max-w-6xl mx-auto">
                  <div className="story-two-column">
                    {/* Main Content Column */}
                    <div className="story-main-content">
                      <article
                        className="story-article"
                        dangerouslySetInnerHTML={{ __html: afterFeatured }}
                      />

                      {/* 3rd Image at bottom of article - full width like image 2 */}
                      {(post as any).postImage2 && (
                        <figure className="story-post-image mt-12">
                          <img
                            src={(post as any).postImage2}
                            alt="Article conclusion visual"
                            loading="lazy"
                          />
                        </figure>
                      )}

                      {/* Back to Top Arrow */}
                      <div className="flex justify-center mt-12 mb-4">
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="group flex flex-col items-center gap-2 text-gray-400 hover:text-salmon transition-colors"
                          aria-label="Back to top"
                        >
                          <div className="p-3 rounded-full border border-gray-600 group-hover:border-salmon group-hover:bg-salmon/10 transition-all">
                            <ArrowUp className="w-5 h-5" />
                          </div>
                          <span className="text-sm">Back to top</span>
                        </button>
                      </div>
                    </div>

                    {/* Second Part Sidebar - Useful Widgets */}
                    <aside className="story-sidebar">
                      {/* [0] Table of Contents - In This Article (Repeat) */}
                      {(() => {
                        const h2Matches = post.content.match(/<h2[^>]*>([^<]+)<\/h2>/g);
                        if (h2Matches && h2Matches.length >= 2) {
                          const headings = h2Matches.map(h => h.replace(/<\/?h2[^>]*>/g, ''));
                          return (
                            <div className="story-sidebar-card">
                              <h3>In This Article</h3>
                              <nav className="space-y-2">
                                {headings.map((heading, idx) => (
                                  <a
                                    key={idx}
                                    href={`#section-${idx}`}
                                    className="block text-sm text-gray-400 hover:text-salmon transition-colors py-1 border-l-2 border-gray-700 hover:border-salmon pl-3"
                                  >
                                    {heading}
                                  </a>
                                ))}
                              </nav>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* [1] Post Image 1 in Second Sidebar */}
                      {(post as any).postImage1 && (
                        <div className="story-sidebar-card p-0 overflow-hidden rounded-xl">
                          <img
                            src={(post as any).postImage1}
                            alt="Featured visual"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      {/* [2] Share Card (Repeat) */}
                      <div className="story-sidebar-card">
                        <h3>Share This Story</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('facebook')}
                            className="border-gray-600 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-500"
                          >
                            <Facebook className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('twitter')}
                            className="border-gray-600 text-gray-300 hover:bg-sky-500 hover:text-white hover:border-sky-400"
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('linkedin')}
                            className="border-gray-600 text-gray-300 hover:bg-blue-700 hover:text-white hover:border-blue-600"
                          >
                            <Linkedin className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('copy')}
                            className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Related Stories - Mobile only (desktop shows in sidebar) */}
      {relatedPosts.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 pb-16 lg:hidden">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-thin text-white mb-8 text-center">
              Related Stories
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => {
                const relatedCategory = categories.find(cat => cat.id === relatedPost.categoryId);

                return (
                  <div key={relatedPost.id} className="story-card group">
                    {/* Cover Image */}
                    {relatedPost.coverImage ? (
                      <div className="story-card-image">
                        <img
                          src={relatedPost.coverImage}
                          alt={relatedPost.title}
                        />
                      </div>
                    ) : (
                      <div className="story-card-placeholder">
                        <div className="text-4xl">📖</div>
                      </div>
                    )}

                    <div className="story-card-content">
                      {/* Category Badge */}
                      {relatedCategory && (
                        <Badge
                          variant="outline"
                          className="mb-3 border-border text-muted-foreground text-xs"
                        >
                          {relatedCategory.name}
                        </Badge>
                      )}

                      {/* Title */}
                      <h3 className="story-card-title">
                        {relatedPost.title}
                      </h3>

                      {/* Excerpt */}
                      {relatedPost.excerpt && (
                        <p className="story-card-date line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}

                      {/* Read More Link */}
                      <Link href={`/stories/${relatedPost.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between text-salmon hover:text-white hover:bg-salmon/20 transition-all mt-4"
                        >
                          Read Story
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="service-card-gradient border-t border-border py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-thin text-white mb-4">
            Loved This Story?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Discover more behind-the-scenes insights, photography tips, and client stories
            that showcase the art and craft of professional photography.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/stories">
              <Button className="bg-salmon hover:bg-salmon/90 text-white px-8 py-3 text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                More Stories
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-border hover:border-salmon px-8 py-3 text-lg"
              >
                Start Your Project
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}
