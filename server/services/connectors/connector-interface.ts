/**
 * CMS Connector Interface
 * Shared contract for all external CMS publishing connectors
 */

export interface ConnectorConfig {
  siteUrl: string;
  credentials: Record<string, string>;
  [key: string]: any;
}

export interface BlogPostData {
  title: string;
  slug: string;
  content: string;       // HTML content
  excerpt?: string;
  coverImageUrl?: string; // URL to featured image
  status: 'draft' | 'publish';
  categories?: string[];  // Category names
  tags?: string[];        // Tag names
  seoTitle?: string;
  seoDescription?: string;
}

export interface PublishResult {
  success: boolean;
  url?: string;          // URL of the published post on the external site
  externalId?: string;   // ID of the post on the external system
  message: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  siteName?: string;     // Name of the connected site
  username?: string;     // Authenticated user display name
}

// ============================================================================
// TAXONOMY DISCOVERY TYPES
// ============================================================================

export interface RemoteCategory {
  id: number | string;
  name: string;
  slug: string;
  count?: number;
  parent?: number | string;
}

export interface RemoteTag {
  id: number | string;
  name: string;
  slug: string;
  count?: number;
}

// ============================================================================
// CONNECTOR CONTRACT
// ============================================================================

export interface CMSConnector {
  /** Test if credentials are valid and the site is reachable */
  testConnection(config: ConnectorConfig): Promise<ConnectionTestResult>;

  /** Publish a new post to the external CMS */
  publishPost(config: ConnectorConfig, post: BlogPostData): Promise<PublishResult>;

  /** Update an existing post on the external CMS */
  updatePost(config: ConnectorConfig, externalId: string, post: BlogPostData): Promise<PublishResult>;

  /** Discover available categories on the remote CMS */
  discoverCategories?(config: ConnectorConfig): Promise<RemoteCategory[]>;

  /** Discover available tags on the remote CMS */
  discoverTags?(config: ConnectorConfig): Promise<RemoteTag[]>;

  /** Find or create a category by name/slug on the remote CMS */
  getOrCreateCategory?(config: ConnectorConfig, name: string, slug: string): Promise<RemoteCategory>;

  /** Find or create a tag by name/slug on the remote CMS */
  getOrCreateTag?(config: ConnectorConfig, name: string, slug: string): Promise<RemoteTag>;
}
