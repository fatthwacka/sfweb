/**
 * WordPress Connector
 * Publishes blog posts to WordPress sites via the WP REST API.
 * Uses Application Passwords for authentication (built into WordPress 5.6+).
 *
 * Features:
 *  - Retry with exponential backoff on transient failures
 *  - Category/tag discovery and get-or-create
 *  - Featured image upload on both create and update
 *  - Yoast SEO meta field support
 */

import { retryFetch } from './retry-fetch';
import type {
  CMSConnector,
  ConnectorConfig,
  BlogPostData,
  PublishResult,
  ConnectionTestResult,
  RemoteCategory,
  RemoteTag,
} from './connector-interface';

export class WordPressConnector implements CMSConnector {

  // ============================================================================
  // AUTH & URL HELPERS
  // ============================================================================

  private getAuthHeader(config: ConnectorConfig): string {
    const { username, appPassword } = config.credentials;
    // Strip spaces from application password (WP displays them as "xxxx xxxx xxxx xxxx xxxx xxxx")
    const cleanPassword = (appPassword || '').replace(/\s+/g, '');
    console.log(`[wp-connector] Building auth: username="${username}" appPassword length=${cleanPassword.length} (raw=${appPassword?.length || 0})`);
    const token = Buffer.from(`${username}:${cleanPassword}`).toString('base64');
    return `Basic ${token}`;
  }

  private normaliseUrl(siteUrl: string): string {
    let url = siteUrl.trim().replace(/\/+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }

  /**
   * Authenticated fetch that handles redirects without losing the Authorization header.
   * Node.js fetch strips auth headers on redirects (per Fetch spec) — this follows
   * redirects manually and re-attaches the header on each hop.
   */
  private async authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const maxRedirects = 5;
    let currentUrl = url;

    for (let i = 0; i <= maxRedirects; i++) {
      const response = await retryFetch(currentUrl, {
        ...options,
        redirect: 'manual',
      });

      // 3xx redirect — follow it with headers intact
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        console.log(`[wp-connector] Following redirect (${response.status}) → ${currentUrl}`);
        continue;
      }

      return response;
    }

    throw new Error(`Too many redirects following ${url}`);
  }

  // ============================================================================
  // CONNECTION TESTING
  // ============================================================================

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);

    try {
      const requestUrl = `${baseUrl}/wp-json/wp/v2/users/me`;
      console.log(`[wp-connector] Testing connection to: ${requestUrl}`);
      const response = await this.authFetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[wp-connector] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[wp-connector] Error body (first 300): ${errorText.substring(0, 300)}`);
        if (response.status === 401) {
          return { success: false, message: 'Authentication failed. Check your username and application password.' };
        }
        if (response.status === 404) {
          return { success: false, message: 'WP REST API not found. Ensure the site has REST API enabled.' };
        }
        return { success: false, message: `Connection failed (${response.status}): ${errorText.substring(0, 200)}` };
      }

      const userData = await response.json();
      return {
        success: true,
        message: 'Connected successfully',
        siteName: baseUrl,
        username: userData.name || userData.slug,
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, message: 'Cannot reach the site. Check the URL and ensure it is accessible.' };
      }
      return { success: false, message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // ============================================================================
  // PUBLISHING
  // ============================================================================

  async publishPost(config: ConnectorConfig, post: BlogPostData): Promise<PublishResult> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);

    try {
      // Upload featured image if provided
      let featuredMediaId: number | undefined;
      if (post.coverImageUrl) {
        featuredMediaId = await this.uploadFeaturedImage(baseUrl, authHeader, post.coverImageUrl, post.title);
      }

      // Resolve categories if provided
      const categoryIds = await this.resolveCategories(config, post.categories);
      const tagIds = await this.resolveTags(config, post.tags);

      // Build the post payload
      const wpPost: Record<string, any> = {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        status: post.status === 'publish' ? 'publish' : 'draft',
      };

      if (featuredMediaId) {
        wpPost.featured_media = featuredMediaId;
      }
      if (categoryIds.length > 0) {
        wpPost.categories = categoryIds;
      }
      if (tagIds.length > 0) {
        wpPost.tags = tagIds;
      }

      // Set SEO meta via Yoast if available
      if (post.seoTitle || post.seoDescription) {
        wpPost.meta = {};
        if (post.seoTitle) wpPost.meta._yoast_wpseo_title = post.seoTitle;
        if (post.seoDescription) wpPost.meta._yoast_wpseo_metadesc = post.seoDescription;
      }

      const response = await this.authFetch(`${baseUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wpPost),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return {
          success: false,
          message: `Failed to publish: ${errorData.message || response.statusText}`,
        };
      }

      const createdPost = await response.json();
      return {
        success: true,
        url: createdPost.link,
        externalId: String(createdPost.id),
        message: `Published to WordPress: ${createdPost.link}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Publish error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ============================================================================
  // UPDATING
  // ============================================================================

  async updatePost(config: ConnectorConfig, externalId: string, post: BlogPostData): Promise<PublishResult> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);

    try {
      // Upload new featured image if provided
      let featuredMediaId: number | undefined;
      if (post.coverImageUrl) {
        featuredMediaId = await this.uploadFeaturedImage(baseUrl, authHeader, post.coverImageUrl, post.title);
      }

      // Resolve categories and tags
      const categoryIds = await this.resolveCategories(config, post.categories);
      const tagIds = await this.resolveTags(config, post.tags);

      const wpPost: Record<string, any> = {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        status: post.status === 'publish' ? 'publish' : 'draft',
      };

      if (featuredMediaId) {
        wpPost.featured_media = featuredMediaId;
      }
      if (categoryIds.length > 0) {
        wpPost.categories = categoryIds;
      }
      if (tagIds.length > 0) {
        wpPost.tags = tagIds;
      }

      // Update SEO meta
      if (post.seoTitle || post.seoDescription) {
        wpPost.meta = {};
        if (post.seoTitle) wpPost.meta._yoast_wpseo_title = post.seoTitle;
        if (post.seoDescription) wpPost.meta._yoast_wpseo_metadesc = post.seoDescription;
      }

      const response = await this.authFetch(`${baseUrl}/wp-json/wp/v2/posts/${externalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wpPost),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return {
          success: false,
          message: `Failed to update: ${errorData.message || response.statusText}`,
        };
      }

      const updatedPost = await response.json();
      return {
        success: true,
        url: updatedPost.link,
        externalId: String(updatedPost.id),
        message: `Updated on WordPress: ${updatedPost.link}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ============================================================================
  // CATEGORY / TAG DISCOVERY
  // ============================================================================

  /**
   * Fetch all categories from the WordPress site (paginated).
   */
  async discoverCategories(config: ConnectorConfig): Promise<RemoteCategory[]> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);
    const categories: RemoteCategory[] = [];

    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await this.authFetch(
        `${baseUrl}/wp-json/wp/v2/categories?per_page=100&page=${page}&orderby=name`,
        { headers: { 'Authorization': authHeader } }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch WP categories page ${page}: ${response.status}`);
        break;
      }

      totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);

      const data = await response.json();
      for (const cat of data) {
        categories.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count,
          parent: cat.parent || undefined,
        });
      }

      page++;
    }

    return categories;
  }

  /**
   * Fetch all tags from the WordPress site (paginated).
   */
  async discoverTags(config: ConnectorConfig): Promise<RemoteTag[]> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);
    const tags: RemoteTag[] = [];

    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await this.authFetch(
        `${baseUrl}/wp-json/wp/v2/tags?per_page=100&page=${page}&orderby=name`,
        { headers: { 'Authorization': authHeader } }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch WP tags page ${page}: ${response.status}`);
        break;
      }

      totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);

      const data = await response.json();
      for (const tag of data) {
        tags.push({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count,
        });
      }

      page++;
    }

    return tags;
  }

  /**
   * Find a category by slug, or create it if it doesn't exist.
   * Handles the term_exists race condition gracefully.
   */
  async getOrCreateCategory(config: ConnectorConfig, name: string, slug: string): Promise<RemoteCategory> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);

    // Try to find existing by slug
    const searchResponse = await this.authFetch(
      `${baseUrl}/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}`,
      { headers: { 'Authorization': authHeader } }
    );

    if (searchResponse.ok) {
      const existing = await searchResponse.json();
      if (existing.length > 0) {
        return { id: existing[0].id, name: existing[0].name, slug: existing[0].slug };
      }
    }

    // Create new category
    const createResponse = await this.authFetch(`${baseUrl}/wp-json/wp/v2/categories`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug }),
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      return { id: created.id, name: created.name, slug: created.slug };
    }

    // Handle term_exists race condition (400 status)
    if (createResponse.status === 400) {
      const refetch = await this.authFetch(
        `${baseUrl}/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}`,
        { headers: { 'Authorization': authHeader } }
      );
      if (refetch.ok) {
        const refetched = await refetch.json();
        if (refetched.length > 0) {
          return { id: refetched[0].id, name: refetched[0].name, slug: refetched[0].slug };
        }
      }
    }

    throw new Error(`Failed to get or create WordPress category: ${name}`);
  }

  /**
   * Find a tag by slug, or create it if it doesn't exist.
   */
  async getOrCreateTag(config: ConnectorConfig, name: string, slug: string): Promise<RemoteTag> {
    const baseUrl = this.normaliseUrl(config.siteUrl);
    const authHeader = this.getAuthHeader(config);

    // Try to find existing by slug
    const searchResponse = await this.authFetch(
      `${baseUrl}/wp-json/wp/v2/tags?slug=${encodeURIComponent(slug)}`,
      { headers: { 'Authorization': authHeader } }
    );

    if (searchResponse.ok) {
      const existing = await searchResponse.json();
      if (existing.length > 0) {
        return { id: existing[0].id, name: existing[0].name, slug: existing[0].slug };
      }
    }

    // Create new tag
    const createResponse = await this.authFetch(`${baseUrl}/wp-json/wp/v2/tags`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug }),
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      return { id: created.id, name: created.name, slug: created.slug };
    }

    // Handle term_exists race condition
    if (createResponse.status === 400) {
      const refetch = await this.authFetch(
        `${baseUrl}/wp-json/wp/v2/tags?slug=${encodeURIComponent(slug)}`,
        { headers: { 'Authorization': authHeader } }
      );
      if (refetch.ok) {
        const refetched = await refetch.json();
        if (refetched.length > 0) {
          return { id: refetched[0].id, name: refetched[0].name, slug: refetched[0].slug };
        }
      }
    }

    throw new Error(`Failed to get or create WordPress tag: ${name}`);
  }

  // ============================================================================
  // PRIVATE HELPERS — TAXONOMY RESOLUTION
  // ============================================================================

  /**
   * Resolve category names to WordPress category IDs.
   * Uses categoryMapping from config if available, falls back to get-or-create.
   */
  private async resolveCategories(config: ConnectorConfig, categoryNames?: string[]): Promise<number[]> {
    if (!categoryNames || categoryNames.length === 0) return [];

    const mapping: Record<string, number> = config.categoryMapping || {};
    const ids: number[] = [];

    for (const name of categoryNames) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (mapping[slug]) {
        ids.push(mapping[slug]);
      } else {
        try {
          const cat = await this.getOrCreateCategory(config, name, slug);
          ids.push(Number(cat.id));
        } catch (err) {
          console.warn(`Could not resolve category "${name}":`, err);
        }
      }
    }

    return ids;
  }

  /**
   * Resolve tag names to WordPress tag IDs.
   */
  private async resolveTags(config: ConnectorConfig, tagNames?: string[]): Promise<number[]> {
    if (!tagNames || tagNames.length === 0) return [];

    const mapping: Record<string, number> = config.tagMapping || {};
    const ids: number[] = [];

    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (mapping[slug]) {
        ids.push(mapping[slug]);
      } else {
        try {
          const tag = await this.getOrCreateTag(config, name, slug);
          ids.push(Number(tag.id));
        } catch (err) {
          console.warn(`Could not resolve tag "${name}":`, err);
        }
      }
    }

    return ids;
  }

  // ============================================================================
  // PRIVATE HELPERS — MEDIA
  // ============================================================================

  /**
   * Upload a featured image to the WordPress media library.
   * Downloads the image from the provided URL, then uploads to WP.
   */
  private async uploadFeaturedImage(
    baseUrl: string,
    authHeader: string,
    imageUrl: string,
    postTitle: string
  ): Promise<number | undefined> {
    try {
      const imageResponse = await retryFetch(imageUrl);
      if (!imageResponse.ok) {
        console.warn(`Failed to download featured image: ${imageUrl}`);
        return undefined;
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const filename = `${postTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)}-featured.${extension}`;

      const uploadResponse = await this.authFetch(`${baseUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        console.warn(`Failed to upload featured image to WordPress: ${uploadResponse.status}`);
        return undefined;
      }

      const mediaData = await uploadResponse.json();
      return mediaData.id;
    } catch (error) {
      console.warn('Featured image upload to WordPress failed:', error);
      return undefined;
    }
  }
}

// Singleton instance
export const wordpressConnector = new WordPressConnector();
