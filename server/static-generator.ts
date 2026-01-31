import fs from 'fs/promises';
import path from 'path';
import { supabaseAdmin } from './supabase-auth';

interface StaticPageData {
  title: string;
  description: string;
  canonicalUrl: string;
  html: string;
  structuredData: any;
  lastModified: string;
}

interface BlogPostForSSR {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

/**
 * Static Blog Post Generator
 * Generates SEO-optimized static HTML files for published blog posts
 */
export class StaticBlogGenerator {
  private readonly publicDir = path.join(process.cwd(), 'client', 'public');
  private readonly storiesDir = path.join(this.publicDir, 'stories');

  constructor() {
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist() {
    try {
      await fs.mkdir(this.storiesDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create stories directory:', error);
    }
  }

  /**
   * Generate static HTML file for a published blog post
   */
  async generateStaticPost(postId: string): Promise<boolean> {
    try {
      console.log(`Generating static file for post ID: ${postId}`);

      // Fetch blog post with author and category information using direct Supabase
      const { data: postData, error: postError } = await supabaseAdmin
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content,
          cover_image,
          seo_title,
          seo_description,
          published_at,
          created_at,
          status,
          category_id,
          author_id
        `)
        .eq('id', postId)
        .single();

      if (postError || !postData) {
        console.error(`Blog post not found: ${postId}`, postError);
        return false;
      }

      if (postData.status !== 'published') {
        console.error(`Blog post not published: ${postId} (status: ${postData.status})`);
        return false;
      }

      // Fetch author name if author_id exists
      let authorName: string | null = null;
      if (postData.author_id) {
        const { data: authorData } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', postData.author_id)
          .single();
        authorName = authorData?.full_name || null;
      }

      // Fetch category info if category_id exists
      let categoryName: string | null = null;
      let categoryColor: string | null = null;
      if (postData.category_id) {
        const { data: categoryData } = await supabaseAdmin
          .from('blog_categories')
          .select('name, color')
          .eq('id', postData.category_id)
          .single();
        categoryName = categoryData?.name || null;
        categoryColor = categoryData?.color || null;
      }

      // Map to internal interface (snake_case to camelCase)
      const post: BlogPostForSSR = {
        id: postData.id,
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content: postData.content,
        coverImage: postData.cover_image,
        seoTitle: postData.seo_title,
        seoDescription: postData.seo_description,
        publishedAt: postData.published_at,
        createdAt: postData.created_at,
        authorName,
        categoryId: postData.category_id,
        categoryName,
        categoryColor
      };

      // Generate static page data
      const pageData = this.generatePageData(post as BlogPostForSSR);
      
      // Write static HTML file
      const fileName = `${post.slug}.html`;
      const filePath = path.join(this.storiesDir, fileName);
      
      await fs.writeFile(filePath, pageData.html, 'utf8');
      console.log(`Static file generated: ${filePath}`);

      // Update sitemap
      await this.updateSitemap();

      return true;
    } catch (error) {
      console.error('Error generating static post:', error);
      return false;
    }
  }

  /**
   * Remove static file for unpublished post
   */
  async removeStaticPost(slug: string): Promise<boolean> {
    try {
      const filePath = path.join(this.storiesDir, `${slug}.html`);
      
      try {
        await fs.unlink(filePath);
        console.log(`Static file removed: ${filePath}`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log(`Static file already removed: ${filePath}`);
        } else {
          throw error;
        }
      }

      // Update sitemap
      await this.updateSitemap();

      return true;
    } catch (error) {
      console.error('Error removing static post:', error);
      return false;
    }
  }

  /**
   * Generate complete page HTML with SEO meta tags and structured data
   */
  private generatePageData(post: BlogPostForSSR): StaticPageData {
    const siteUrl = process.env.SITE_URL || 'https://slyfox.co.za';
    const canonicalUrl = `${siteUrl}/stories/${post.slug}`;
    
    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt || 'Professional photography and creative insights from SlyFox Studios.';
    
    // Clean content for meta description (remove HTML tags, limit length)
    const cleanDescription = description
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 160);

    const publishedDate = post.publishedAt || post.createdAt;
    const lastModified = new Date().toISOString();

    // Generate structured data (Article schema)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": cleanDescription,
      "url": canonicalUrl,
      "datePublished": publishedDate,
      "dateModified": lastModified,
      "author": {
        "@type": "Person",
        "name": post.authorName || "SlyFox Studios Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "SlyFox Studios",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/uploads/slyfox-logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      }
    };

    // Add cover image to structured data if available
    if (post.coverImage) {
      structuredData.image = {
        "@type": "ImageObject",
        "url": post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`
      };
    }

    // Generate complete HTML page
    const html = this.generateHTML({
      title,
      description: cleanDescription,
      canonicalUrl,
      structuredData,
      post
    });

    return {
      title,
      description: cleanDescription,
      canonicalUrl,
      html,
      structuredData,
      lastModified
    };
  }

  /**
   * Generate complete HTML document with SEO optimization
   */
  private generateHTML({ title, description, canonicalUrl, structuredData, post }: {
    title: string;
    description: string;
    canonicalUrl: string;
    structuredData: any;
    post: BlogPostForSSR;
  }): string {
    const siteUrl = process.env.SITE_URL || 'https://slyfox.co.za';
    const ogImage = post.coverImage 
      ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
      : `${siteUrl}/uploads/slyfox-og-default.jpg`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#1f2937" />
  
  <!-- Primary Meta Tags -->
  <title>${title} | SlyFox Studios</title>
  <meta name="title" content="${title} | SlyFox Studios" />
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonicalUrl}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:site_name" content="SlyFox Studios" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${canonicalUrl}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${description}" />
  <meta property="twitter:image" content="${ogImage}" />
  
  <!-- Article Meta -->
  <meta property="article:published_time" content="${post.publishedAt || post.createdAt}" />
  <meta property="article:author" content="${post.authorName || 'SlyFox Studios'}" />
  <meta property="article:section" content="${post.categoryName || 'Photography'}" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <!-- Preconnect for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9V7CGDQZPN"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-9V7CGDQZPN');
  </script>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root">
    <!-- SEO-friendly content preview for crawlers -->
    <article itemscope itemtype="https://schema.org/Article" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui, sans-serif; line-height: 1.6; color: #333;">
      <header style="margin-bottom: 2rem;">
        <h1 itemprop="headline" style="font-size: 2.5rem; margin-bottom: 0.5rem; color: #1f2937;">${post.title}</h1>
        ${post.excerpt ? `<p itemprop="description" style="font-size: 1.1rem; color: #6b7280; margin-bottom: 1rem;">${post.excerpt}</p>` : ''}
        <div style="font-size: 0.9rem; color: #9ca3af; margin-bottom: 1rem;">
          <time itemprop="datePublished" datetime="${post.publishedAt || post.createdAt}">
            ${new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </time>
          ${post.authorName ? `<span> • By <span itemprop="author">${post.authorName}</span></span>` : ''}
          ${post.categoryName ? `<span> • <span itemprop="articleSection">${post.categoryName}</span></span>` : ''}
        </div>
      </header>
      
      ${post.coverImage ? `
        <figure style="margin: 2rem 0;">
          <img itemprop="image" src="${post.coverImage}" alt="${post.title}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
        </figure>
      ` : ''}
      
      <div itemprop="articleBody" style="margin-top: 2rem;">
        ${this.sanitizeContentForStatic(post.content)}
      </div>
      
      <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
        <p style="text-align: center; color: #6b7280;">
          <a href="${canonicalUrl}" style="color: #2563eb; text-decoration: none;">
            View full interactive article at SlyFox Studios
          </a>
        </p>
      </footer>
    </article>
    
    <!-- Fallback message for JavaScript-disabled browsers -->
    <noscript>
      <div style="background: #fef3c7; padding: 1rem; margin: 2rem; border-radius: 8px; text-align: center;">
        <p><strong>For the best experience, please enable JavaScript.</strong></p>
        <p>This page contains interactive content that requires JavaScript to function properly.</p>
      </div>
    </noscript>
  </div>
  
  <!-- SPA will mount here and take over for interactive users -->
</body>
</html>`;
  }

  /**
   * Sanitize content for static display (remove React components, clean HTML)
   */
  private sanitizeContentForStatic(content: string): string {
    if (!content) return '';

    return content
      // Remove potentially unsafe HTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      
      // Convert common markdown patterns if still present
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Ensure paragraphs are properly wrapped
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

  /**
   * Update sitemap.xml with current published posts
   */
  private async updateSitemap(): Promise<void> {
    try {
      // Get all published blog posts using direct Supabase
      const { data: publishedPosts, error } = await supabaseAdmin
        .from('blog_posts')
        .select('slug, published_at, updated_at')
        .eq('status', 'published');

      if (error) {
        console.error('Error fetching published posts for sitemap:', error);
        return;
      }

      const siteUrl = process.env.SITE_URL || 'https://slyfox.co.za';

      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/photography</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/stories</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Blog posts -->
${(publishedPosts || []).map(post => `  <url>
    <loc>${siteUrl}/stories/${post.slug}</loc>
    <lastmod>${(post.updated_at || post.published_at || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

      const sitemapPath = path.join(this.publicDir, 'sitemap.xml');
      await fs.writeFile(sitemapPath, sitemapContent, 'utf8');
      
      console.log(`Sitemap updated: ${sitemapPath} (${publishedPosts.length} blog posts)`);
    } catch (error) {
      console.error('Error updating sitemap:', error);
    }
  }

  /**
   * Generate all static files for published posts (for initial setup or full rebuild)
   */
  async generateAllPublishedPosts(): Promise<number> {
    try {
      const { data: publishedPosts, error } = await supabaseAdmin
        .from('blog_posts')
        .select('id')
        .eq('status', 'published');

      if (error || !publishedPosts) {
        console.error('Error fetching published posts:', error);
        return 0;
      }

      let successCount = 0;
      for (const post of publishedPosts) {
        const success = await this.generateStaticPost(post.id);
        if (success) successCount++;
      }

      console.log(`Generated ${successCount}/${publishedPosts.length} static blog posts`);
      return successCount;
    } catch (error) {
      console.error('Error generating all published posts:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const staticBlogGenerator = new StaticBlogGenerator();