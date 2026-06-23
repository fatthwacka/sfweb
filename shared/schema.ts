import { pgTable, text, serial, integer, boolean, timestamp, uuid, decimal, varchar, smallint, jsonb, inet } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main user profiles table (this is what we'll use for our app users)
// Role hierarchy: super_admin > staff > client > user
// - super_admin: Full admin access
// - staff: Team members with admin panel access
// - client: Photography customers (linked to shoots, albums)
// - user: Generic signups (tools, newsletter, etc.)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull().default("user"), // "super_admin", "staff", "client", or "user"
  profileImageUrl: text("profile_image_url"),
  bannerImageUrl: text("banner_image_url"),
  themePreference: text("theme_preference").default("light"),
  // Subscription fields for tools hub
  subscriptionTier: text("subscription_tier").default("free"), // "free", "pro", "enterprise"
  subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Keep users table for compatibility but we'll use profiles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  password: varchar("password").notNull(),
  role: varchar("role").notNull().default("client"),
  profileImage: text("profile_image"),
  bannerImage: text("banner_image"),
  themePreference: varchar("theme_preference").default("dark"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(), // Using integer to match Supabase
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  secondaryEmail: text("secondary_email"),
  userId: uuid("user_id").references(() => profiles.id),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});


export const shoots = pgTable("shoots", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: text("client_id").notNull(), // Stores client email for email-based matching
  title: text("title").notNull(),
  location: text("location"),
  shootDate: text("shoot_date"), // Using text to store date as YYYY-MM-DD format
  shootType: text("shoot_type"),
  description: text("description"),
  notes: text("notes"),
  isPrivate: boolean("is_private").default(false).notNull(),
  bannerImageId: uuid("banner_image_id"),
  seoTags: text("seo_tags"),
  viewCount: integer("view_count").default(0).notNull(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  customSlug: text("custom_slug"),
  customTitle: text("custom_title"),
  gallerySettings: jsonb("gallery_settings"),
  mediaType: text("media_type").default("photo").notNull(), // 'photo' or 'video'
  groupName: text("group_name"), // For bundling related shoots (e.g., "POCAS Bubble Tea Party Kit")
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  shootId: uuid("shoot_id").references(() => shoots.id).notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  originalName: text("original_name"),
  fileSize: integer("file_size"),
  isPrivate: boolean("is_private").default(false).notNull(),
  uploadOrder: integer("upload_order").default(0).notNull(),
  sequence: integer("sequence").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  heartsCount: integer("hearts_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  dislikesCount: integer("dislikes_count").default(0).notNull(),
  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }),
  classification: varchar("classification", { length: 50 }).default("portrait").notNull(),
  featuredImage: boolean("featured_image").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  shootId: uuid("shoot_id").references(() => shoots.id).notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(), // Original full-resolution video (empty string for YouTube)
  optimizedPath: text("optimized_path"), // Web-optimized 1080p version for streaming
  thumbnailPath: text("thumbnail_path").notNull(), // 1200px JPEG thumbnail (or YouTube auto-thumbnail URL)
  fileSize: integer("file_size").notNull(), // 0 for YouTube videos
  sequence: integer("sequence").default(0).notNull(),
  duration: integer("duration"), // video duration in seconds
  width: integer("width"), // video resolution width
  height: integer("height"), // video resolution height
  downloadCount: integer("download_count").default(0).notNull(),
  featuredVideo: boolean("featured_video").default(false).notNull(),
  // YouTube integration fields
  sourceType: text("source_type").default("native").notNull(), // 'native' | 'youtube'
  externalId: text("external_id"), // YouTube video ID (e.g., 'dQw4w9WgXcQ')
  externalUrl: text("external_url"), // Full YouTube URL for reference
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price"),
  features: text("features").array(),
  category: text("category").notNull(),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id),
  shootId: uuid("shoot_id").references(() => shoots.id),
  imageId: uuid("image_id").references(() => images.id),
  actionType: text("action_type").notNull(),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  imageId: uuid("image_id").references(() => images.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  message: text("message").notNull(),
  serviceType: varchar("service_type").default("general"),
  preferredDate: timestamp("preferred_date"),
  budgetRange: varchar("budget_range"),
  status: varchar("status").default("pending"),
  inquiryData: text("inquiry_data"),
  clientId: integer("client_id"),
  packageId: integer("package_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Local site assets management table
export const localSiteAssets = pgTable("local_site_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  assetKey: varchar("asset_key", { length: 100 }).notNull().unique(), // 'hero-main', 'bg-contact', etc
  assetType: varchar("asset_type", { length: 50 }).notNull(), // 'hero', 'background', 'video'
  filePath: varchar("file_path", { length: 500 }).notNull(), // '/assets/hero/durban-photography-studio-hero'
  altText: varchar("alt_text", { length: 255 }),
  seoKeywords: varchar("seo_keywords", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  updatedBy: uuid("updated_by").notNull().references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  // Make fields properly nullable to match frontend
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  secondaryEmail: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
});

export const insertShootSchema = createInsertSchema(shoots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
}).extend({
  // Ensure clientId accepts email strings
  clientId: z.string(),
  // CreatedBy is required - ensure it's included
  createdBy: z.string().uuid(),
  // Media type for photos or videos
  mediaType: z.enum(['photo', 'video']).optional().default('photo'),
  // Make optional fields properly optional
  customSlug: z.string().optional(),
  customTitle: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoTags: z.string().optional(), // Change from array to string
  seoKeywords: z.array(z.string()).optional(),
  gallerySettings: z.any().optional(),
  isPrivate: z.boolean().optional(),
  bannerImageId: z.string().nullable().optional(),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertLocalSiteAssetSchema = createInsertSchema(localSiteAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Gallery customization schema for updating shoot settings
export const updateShootCustomizationSchema = z.object({
  customSlug: z.string().optional(),
  bannerImageId: z.string().nullable().optional(),
  customTitle: z.string().optional(),
  gallerySettings: z.any().optional(),
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type UpdateShootCustomization = z.infer<typeof updateShootCustomizationSchema>;

export type Shoot = typeof shoots.$inferSelect;
export type InsertShoot = z.infer<typeof insertShootSchema>;

export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type LocalSiteAsset = typeof localSiteAssets.$inferSelect;
export type InsertLocalSiteAsset = z.infer<typeof insertLocalSiteAssetSchema>;

// Classification constants
export const SHOOT_TYPES = [
  'birthday',
  'commercial',
  'corporate', 
  'engagement',
  'event',
  'family',
  'graduation',
  'lifestyle',
  'maternity',
  'matric dance',
  'newborn',
  'portrait',
  'product',
  'studio',
  'wedding'
] as const;

export const IMAGE_CLASSIFICATIONS = SHOOT_TYPES;

export const ASSET_TYPES = [
  'hero',
  'background',
  'video'
] as const;

export type ImageClassification = typeof IMAGE_CLASSIFICATIONS[number];
export type AssetType = typeof ASSET_TYPES[number];

// Gallery management schemas
export const updateImageSequenceSchema = z.object({
  imageId: z.number(),
  newSequence: z.number(),
});

export const updateAlbumCoverSchema = z.object({
  shootId: z.number(),
  imageId: z.number(),
});

export const updateShootDetailsSchema = z.object({
  shootId: z.number(),
  customTitle: z.string().optional(),
  customSlug: z.string().optional(),
});

export type UpdateImageSequence = z.infer<typeof updateImageSequenceSchema>;
export type UpdateAlbumCover = z.infer<typeof updateAlbumCoverSchema>;
export type UpdateShootDetails = z.infer<typeof updateShootDetailsSchema>;

// Preview Selection System Tables
export const shootPreviews = pgTable("shoot_previews", {
  id: uuid("id").defaultRandom().primaryKey(),
  shootId: uuid("shoot_id").references(() => shoots.id).notNull(),
  dropboxFolderPath: text("dropbox_folder_path"), // e.g., "/Client Shoots/Smith Wedding/Previews"
  dropboxShareLink: text("dropbox_share_link"), // Optional: if using shared link method
  selectionLimit: integer("selection_limit").default(20).notNull(),
  additionalBundle5Price: decimal("additional_bundle_5_price").default("150.00"),
  additionalBundle10Price: decimal("additional_bundle_10_price").default("250.00"),
  unlimitedBundlePrice: decimal("unlimited_bundle_price").default("500.00"),
  isActive: boolean("is_active").default(true).notNull(),
  submissionCompleted: boolean("submission_completed").default(false),
  submissionCompletedAt: timestamp("submission_completed_at", { withTimezone: true }),
  submissionCompletedBy: text("submission_completed_by"),
  editingCompleted: boolean("editing_completed").default(false),
  editingCompletedAt: timestamp("editing_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const clientSelections = pgTable("client_selections", {
  id: uuid("id").defaultRandom().primaryKey(),
  shootId: uuid("shoot_id").references(() => shoots.id).notNull(),
  clientId: uuid("client_id").references(() => profiles.id).notNull(),
  imageFilename: text("image_filename").notNull(), // e.g., "DSC_0234.jpg"
  dropboxPath: text("dropbox_path"), // Full path in Dropbox
  thumbnailUrl: text("thumbnail_url"), // Cached thumbnail URL
  selectionStatus: text("selection_status").default("none").notNull(), // 'favorite', 'like', 'dislike', 'none'
  isFinalSelection: boolean("is_final_selection").default(false).notNull(),
  selectionOrder: integer("selection_order"), // For final 20 images ordering
  selectedAt: timestamp("selected_at", { withTimezone: true }),
  editingComplete: boolean("editing_complete").default(false).notNull(), // Photographer editing status
  editingCompletedAt: timestamp("editing_completed_at", { withTimezone: true }), // When editing was completed
  metadata: jsonb("metadata"), // Store any extra info like dimensions, file size, etc.
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const selectionPackages = pgTable("selection_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  shootId: uuid("shoot_id").references(() => shoots.id).notNull(),
  clientId: uuid("client_id").references(() => profiles.id).notNull(),
  baseLimit: integer("base_limit").default(20).notNull(),
  purchasedAdditional: integer("purchased_additional").default(0).notNull(),
  totalAllowed: integer("total_allowed").generatedAlwaysAs(sql`base_limit + purchased_additional`),
  purchaseHistory: jsonb("purchase_history"), // Array of purchase events
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Dedicated table for preview images migrated from Dropbox - completely separate from main images
export const previewImages = pgTable("preview_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  shootId: uuid("shoot_id").references(() => shoots.id).notNull(),
  filename: text("filename").notNull(), // Original Dropbox filename
  supabaseUrl: text("supabase_url").notNull(), // Public URL in Supabase Storage
  supabaseStoragePath: text("supabase_storage_path").notNull(), // Storage key: previews/shootId/filename
  originalDropboxPath: text("original_dropbox_path"), // Original path in Dropbox for reference
  fileSize: integer("file_size"),
  contentType: text("content_type").default("image/jpeg").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id).notNull(),
  migrationBatchId: uuid("migration_batch_id"), // Group images from same migration run
  metadata: jsonb("metadata"), // Store any extra Dropbox metadata
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// Site gradients configuration table for dynamic color management
export const siteGradients = pgTable("site_gradients", {
  id: serial("id").primaryKey(),
  sectionKey: text("section_key").notNull().unique(), // e.g., 'privateGallery', 'services', 'testimonials'
  gradientConfig: jsonb("gradient_config").notNull(), // Stores full gradient configuration
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Blog system tables
// Featured Section type for blog posts
export interface FeaturedSection {
  type: 'none' | 'image' | 'video' | 'gallery' | 'quote' | 'cta' | 'before-after';
  title?: string; // Optional heading displayed above the featured content
  config: {
    // Image config
    imageUrl?: string;
    imageAlt?: string;
    imageCaption?: string;
    height?: number; // viewport height percentage
    
    // Video config
    youtubeId?: string;
    youtubeTitle?: string;
    videoHeight?: number;
    
    // Gallery config
    galleryImages?: Array<{ url: string; alt?: string; caption?: string }>;
    galleryColumns?: number;
    
    // Quote config
    quoteText?: string;
    quoteAuthor?: string;
    quoteRole?: string;
    
    // CTA config
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
    ctaStyle?: 'default' | 'gradient' | 'bordered';
    
    // Before-After config
    beforeImageUrl?: string;
    afterImageUrl?: string;
    beforeImageAlt?: string;
    afterImageAlt?: string;
    beforeLabel?: string; // "Before", "Original", "Raw"
    afterLabel?: string;  // "After", "Edited", "Retouched"
    defaultPosition?: number; // 0-100, default slider position
    showLabels?: boolean; // show before/after text labels
  };
}

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(), // Rich text/HTML content
  coverImage: text("cover_image"), // URL to hero image at top of article
  postImage1: text("post_image_1"), // URL to first in-article image (after section 1)
  postImage2: text("post_image_2"), // URL to second in-article image (after section 2)
  
  // Featured and Variable content sections
  featuredSection: jsonb("featured_section").$type<FeaturedSection>(), // Featured content section
  variableContent: text("variable_content"), // Additional variable content area
  
  seoTitle: text("seo_title"), // Custom SEO title (max 60 chars)
  seoDescription: text("seo_description"), // Custom meta description (max 160 chars)
  status: text("status").default("draft").notNull(), // 'draft', 'published', 'scheduled'
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  viewCount: integer("view_count").default(0).notNull(),
  authorId: uuid("author_id").references(() => profiles.id).notNull(),
  categoryId: uuid("category_id").references(() => blogCategories.id),
  aiGenerated: boolean("ai_generated").default(false).notNull(), // Track AI-assisted content
  aiPrompt: text("ai_prompt"), // Store original prompt for reference
  clientId: uuid("client_id"), // Content Studio: client ownership for multi-tenant separation
  publishTracking: jsonb("publish_tracking").default({}), // Maps destination_id -> external_id for update tracking
  topicFingerprint: text("topic_fingerprint"), // Short normalised topic phrase for dedup
  topicKeywords: text("topic_keywords").array(), // Key phrases for similarity matching
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6366f1").notNull(), // Hex color for category badge
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const blogTags = pgTable("blog_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const blogPostTags = pgTable("blog_post_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => blogPosts.id, { onDelete: "cascade" }).notNull(),
  tagId: uuid("tag_id").references(() => blogTags.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const blogMedia = pgTable("blog_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => blogPosts.id, { onDelete: "cascade" }).notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(), // Path in storage system
  altText: text("alt_text"),
  caption: text("caption"),
  fileSize: integer("file_size"),
  contentType: text("content_type").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// AI Prompts table for customizable AI generation
export const aiPrompts = pgTable("ai_prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptKey: text("prompt_key").notNull().unique(), // e.g., 'title', 'content:case-study'
  name: text("name").notNull(),
  description: text("description"),
  promptText: text("prompt_text").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Content Studio: Output destinations per client
export const clientOutputDestinations = pgTable("client_output_destinations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull(),
  destinationType: text("destination_type").notNull(), // 'supabase_static', 'wordpress', 'webflow', etc.
  displayName: text("display_name").notNull(),
  credentialsEncrypted: text("credentials_encrypted"), // AES-256-CBC encrypted JSON
  config: jsonb("config").default({}),
  isActive: boolean("is_active").default(false),
  lastPublishedAt: timestamp("last_published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Content Studio: Input sources per client (for Research Agent)
export const clientInputSources = pgTable("client_input_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull(),
  sourceType: text("source_type").notNull(), // 'rss', 'google_news', 'manual_url', 'competitor_blog'
  displayName: text("display_name").notNull(),
  config: jsonb("config").default({}),
  cronSchedule: text("cron_schedule"),
  fetchIntervalMinutes: integer("fetch_interval_minutes").default(1440),
  isActive: boolean("is_active").default(false),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

// Content Studio: Ingested articles — raw content holding tank
export const ingestedArticles = pgTable("ingested_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull(),
  sourceId: uuid("source_id"),
  externalUrl: text("external_url"),
  urlHash: text("url_hash").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  topicFingerprint: text("topic_fingerprint"),
  topicKeywords: text("topic_keywords").array(),
  rawContent: text("raw_content"),
  sourcePublishedAt: timestamp("source_published_at", { withTimezone: true }),
  status: text("status").default("new").notNull(), // 'new', 'screened', 'approved', 'rejected', 'used', 'expired'
  rejectionReason: text("rejection_reason"),
  similarityScore: text("similarity_score"), // numeric stored as text for Drizzle compatibility
  matchedPostId: uuid("matched_post_id"),
  relevanceScore: text("relevance_score"),
  freshnessScore: text("freshness_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// Content Studio: Topic cooldowns — temporal dedup registry
export const topicCooldowns = pgTable("topic_cooldowns", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull(),
  topicFingerprint: text("topic_fingerprint").notNull(),
  topicLabel: text("topic_label").notNull(),
  lastPublishedAt: timestamp("last_published_at", { withTimezone: true }).notNull(),
  blogPostId: uuid("blog_post_id"),
  postSequenceNumber: integer("post_sequence_number").default(0).notNull(),
  cooldownDays: integer("cooldown_days").default(30),
  cooldownPosts: integer("cooldown_posts").default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// Content Studio: Pipeline runs — execution log
export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull(),
  runType: text("run_type").default("research").notNull(), // 'research', 'production'
  startedAt: timestamp("started_at", { withTimezone: true }).default(sql`now()`).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  itemsDiscovered: integer("items_discovered").default(0),
  itemsScreenedOut: integer("items_screened_out").default(0),
  itemsApproved: integer("items_approved").default(0),
  articlesGenerated: integer("articles_generated").default(0),
  status: text("status").default("running").notNull(), // 'running', 'completed', 'no_fresh_content', 'error'
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  metadata: jsonb("metadata").default({}),
});

// Insert schemas for new tables
export const insertShootPreviewSchema = createInsertSchema(shootPreviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSelectionSchema = createInsertSchema(clientSelections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteGradientSchema = createInsertSchema(siteGradients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSelectionPackageSchema = createInsertSchema(selectionPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalAllowed: true,
});

export const insertPreviewImageSchema = createInsertSchema(previewImages).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  publishedAt: true, // Remove publishedAt from schema validation - handle in backend
}).extend({
  slug: z.string().optional(), // Make slug optional - backend will auto-generate if not provided
  status: z.enum(['draft', 'published', 'scheduled']).optional().default('draft'),
  // Allow null for optional fields so they can be cleared
  coverImage: z.string().nullable().optional(),
  postImage1: z.string().nullable().optional(),
  postImage2: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  variableContent: z.string().nullable().optional(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
}).extend({
  slug: z.string().optional(), // Make slug optional - backend will auto-generate if not provided
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertBlogPostTagSchema = createInsertSchema(blogPostTags).omit({
  id: true,
  createdAt: true,
});

export const insertBlogMediaSchema = createInsertSchema(blogMedia).omit({
  id: true,
  createdAt: true,
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



// Types for new tables
export type ShootPreview = typeof shootPreviews.$inferSelect;
export type InsertShootPreview = z.infer<typeof insertShootPreviewSchema>;

export type ClientSelection = typeof clientSelections.$inferSelect;
export type InsertClientSelection = z.infer<typeof insertClientSelectionSchema>;

export type SelectionPackage = typeof selectionPackages.$inferSelect;
export type InsertSelectionPackage = z.infer<typeof insertSelectionPackageSchema>;

export type PreviewImage = typeof previewImages.$inferSelect;
export type InsertPreviewImage = z.infer<typeof insertPreviewImageSchema>;

// Blog types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;

export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type InsertBlogPostTag = z.infer<typeof insertBlogPostTagSchema>;

export type BlogMedia = typeof blogMedia.$inferSelect;
export type InsertBlogMedia = z.infer<typeof insertBlogMediaSchema>;

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;

// Blog constants
export const BLOG_POST_STATUS = ['draft', 'published', 'scheduled'] as const;
export type BlogPostStatus = typeof BLOG_POST_STATUS[number];

export const BLOG_CATEGORIES = [
  'thought-leadership',
  'industry-insights',
  'how-to-guides',
  'case-studies',
  'pain-points',
  'tips-best-practices',
  'news-updates',
  'inspirational',
  'behind-the-scenes',
  'faqs-myths',
] as const;
export type BlogCategoryType = typeof BLOG_CATEGORIES[number];

// Content Studio types
export type ClientOutputDestination = typeof clientOutputDestinations.$inferSelect;
export type ClientInputSource = typeof clientInputSources.$inferSelect;
export type IngestedArticle = typeof ingestedArticles.$inferSelect;
export type TopicCooldown = typeof topicCooldowns.$inferSelect;
export type PipelineRun = typeof pipelineRuns.$inferSelect;

// Pipeline configuration (stored as jsonb on content_clients)
export interface PipelineConfig {
  research: {
    frequency: 'hourly' | '4h' | '8h' | 'daily' | 'weekly';
    activeHours?: { start: number; end: number };
    activeDays?: number[];
    maxItemsPerRun: number;
    topicCooldownDays: number;
    topicCooldownPosts: number;
  };
  production: {
    mode: 'manual' | 'scheduled' | 'autopilot';
    schedule?: string;
    articlesPerRun: number;
    autoPublishStatus: 'draft' | 'published';
    minSourcesRequired: number;
    skipIfInsufficient: boolean;
  };
  quality: {
    minRelevanceScore: number;
    requireHumanReview: boolean;
    notifyOnDraft: boolean;
  };
}

// Input source type-specific config interfaces
export interface RssSourceConfig {
  url: string;
  maxItems?: number;
  filterKeywords?: string[];
  excludeKeywords?: string[];
}

export interface GoogleNewsSourceConfig {
  query: string;
  language?: string;
  region?: string;
  excludeDomains?: string[];
}

export interface ManualUrlSourceConfig {
  urls: string[];
}

export interface CompetitorBlogSourceConfig {
  url: string;
  selector?: string;
  maxItems?: number;
}

// Selection status constants
export const SELECTION_STATUS = ['none', 'favorite', 'like', 'dislike'] as const;
export type SelectionStatus = typeof SELECTION_STATUS[number];

export type UpdateShootDetails = z.infer<typeof updateShootDetailsSchema>;

// Filename conflict resolution types
export interface ConflictInfo {
  filename: string;
  existingImage: {
    id: string;
    size: number;
    createdAt: string;
    sequence: number;
    storagePath: string;
  };
  newFileSize: number;
}

export interface ConflictResolution {
  filename: string;
  action: 'replace' | 'skip' | 'add_new';
  keepPosition?: boolean; // Maintain sequence number
  targetImageId?: string; // ID of image to replace
}

// Video conflict resolution types (mirrors image system)
export interface VideoConflictInfo {
  filename: string;
  existingVideo: {
    id: string;
    size: number;
    createdAt: string;
    sequence: number;
    storagePath: string;
    duration?: number;
  };
  newFileSize: number;
  newDuration?: number;
}

export interface VideoConflictResolution {
  filename: string;
  action: 'replace' | 'skip' | 'add_new';
  keepPosition?: boolean; // Maintain sequence number
  targetVideoId?: string; // ID of video to replace
}

export interface ConflictCheckRequest {
  shootId: string;
  filenames: string[];
}

export interface ConflictCheckResponse {
  conflicts: ConflictInfo[];
  safe: string[]; // Filenames with no conflicts
}

export interface VideoConflictCheckRequest {
  shootId: string;
  filenames: string[];
}

export interface VideoConflictCheckResponse {
  conflicts: VideoConflictInfo[];
  safe: string[]; // Filenames with no conflicts
}
