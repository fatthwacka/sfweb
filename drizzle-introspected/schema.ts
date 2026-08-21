import { pgTable, index, unique, pgPolicy, uuid, varchar, text, integer, boolean, timestamp, foreignKey, check, jsonb, serial, inet, numeric, date, uniqueIndex, smallint, bigint, primaryKey, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const contentTypes = pgTable("content_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	typeKey: varchar("type_key", { length: 50 }).notNull(),
	label: varchar({ length: 100 }).notNull(),
	description: text(),
	wordLimit: integer("word_limit"),
	characterLimit: integer("character_limit"),
	guidelines: text(),
	systemPrompt: text("system_prompt").notNull(),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_content_types_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_content_types_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	index("idx_content_types_type_key").using("btree", table.typeKey.asc().nullsLast().op("text_ops")),
	unique("content_types_type_key_key").on(table.typeKey),
	pgPolicy("content_types_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`is_admin_or_staff()` }),
	pgPolicy("content_types_write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const videos = pgTable("videos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shootId: uuid("shoot_id").notNull(),
	filename: text().notNull(),
	storagePath: text("storage_path").notNull(),
	thumbnailPath: text("thumbnail_path").notNull(),
	fileSize: integer("file_size").notNull(),
	sequence: integer().default(0).notNull(),
	duration: integer(),
	width: integer(),
	height: integer(),
	downloadCount: integer("download_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	optimizedPath: text("optimized_path"),
	featuredVideo: boolean("featured_video").default(false).notNull(),
	sourceType: text("source_type").default('native').notNull(),
	externalId: text("external_id"),
	externalUrl: text("external_url"),
}, (table) => [
	index("idx_videos_optimized_path").using("btree", table.optimizedPath.asc().nullsLast().op("text_ops")),
	index("idx_videos_shoot_id").using("btree", table.shootId.asc().nullsLast().op("uuid_ops")),
	index("idx_videos_shoot_sequence").using("btree", table.shootId.asc().nullsLast().op("uuid_ops"), table.sequence.asc().nullsLast().op("int4_ops")),
	index("idx_videos_source_type").using("btree", table.sourceType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "videos_shoot_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("videos_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`(is_admin_or_staff() OR (auth.uid() IN ( SELECT c.user_id
   FROM (clients c
     JOIN shoots s ON ((s.client_id = c.email)))
  WHERE (s.id = videos.shoot_id))) OR (EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = videos.shoot_id) AND (shoots.is_private = false)))))` }),
	pgPolicy("videos_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const shoots = pgTable("shoots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: text("client_id").notNull(),
	title: text().notNull(),
	description: text(),
	isPrivate: boolean("is_private").default(false).notNull(),
	bannerImageId: uuid("banner_image_id"),
	seoTags: text("seo_tags"),
	viewCount: integer("view_count").default(0).notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customSlug: text("custom_slug"),
	customTitle: text("custom_title"),
	gallerySettings: jsonb("gallery_settings"),
	location: text(),
	shootDate: text("shoot_date"),
	shootType: text("shoot_type"),
	notes: text(),
	totalInteractions: integer("total_interactions").default(0),
	mediaType: text("media_type").default('photo').notNull(),
	groupName: text("group_name"),
}, (table) => [
	index("idx_shoots_media_type").using("btree", table.mediaType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "shoots_created_by_profiles_id_fk"
		}),
	pgPolicy("shoots_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`(is_admin_or_staff() OR (auth.uid() IN ( SELECT clients.user_id
   FROM clients
  WHERE (clients.email = shoots.client_id))) OR (is_private = false))` }),
	pgPolicy("shoots_write_policy", { as: "permissive", for: "all", to: ["public"] }),
	check("shoots_media_type_check", sql`media_type = ANY (ARRAY['photo'::text, 'video'::text])`),
]);

export const bookings = pgTable("bookings", {
	id: serial().primaryKey().notNull(),
	email: varchar().notNull(),
	phone: varchar(),
	message: text().notNull(),
	serviceType: varchar("service_type").default('general'),
	preferredDate: timestamp("preferred_date", { mode: 'string' }),
	budgetRange: varchar("budget_range"),
	status: varchar().default('pending'),
	inquiryData: text("inquiry_data"),
	clientId: integer("client_id"),
	packageId: integer("package_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("bookings_insert_policy", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("bookings_read_policy", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("bookings_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const analytics = pgTable("analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	shootId: uuid("shoot_id"),
	imageId: uuid("image_id"),
	actionType: text("action_type").notNull(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [images.id],
			name: "analytics_image_id_images_id_fk"
		}),
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "analytics_shoot_id_shoots_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "analytics_user_id_profiles_id_fk"
		}),
]);

export const favorites = pgTable("favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	imageId: uuid("image_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [images.id],
			name: "favorites_image_id_images_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "favorites_user_id_profiles_id_fk"
		}),
]);

export const packages = pgTable("packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric(),
	features: text().array(),
	category: text().notNull(),
	isActive: boolean("is_active").default(true),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("packages_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`((is_active = true) OR is_admin_or_staff())` }),
	pgPolicy("packages_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const shootPreviews = pgTable("shoot_previews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shootId: uuid("shoot_id").notNull(),
	dropboxFolderPath: text("dropbox_folder_path"),
	dropboxShareLink: text("dropbox_share_link"),
	selectionLimit: integer("selection_limit").default(20).notNull(),
	additionalBundle5Price: numeric("additional_bundle_5_price").default('150.00'),
	additionalBundle10Price: numeric("additional_bundle_10_price").default('250.00'),
	unlimitedBundlePrice: numeric("unlimited_bundle_price").default('500.00'),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	submissionCompleted: boolean("submission_completed").default(false),
	submissionCompletedAt: timestamp("submission_completed_at", { withTimezone: true, mode: 'string' }),
	submissionCompletedBy: text("submission_completed_by"),
	editingCompleted: boolean("editing_completed").default(false),
	editingCompletedAt: timestamp("editing_completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "shoot_previews_shoot_id_shoots_id_fk"
		}),
	pgPolicy("Clients can view their own shoot previews", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = shoot_previews.shoot_id) AND (shoots.client_id = (auth.jwt() ->> 'email'::text)))))` }),
	pgPolicy("Super admin and staff can manage shoot previews", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const siteGradients = pgTable("site_gradients", {
	id: serial().primaryKey().notNull(),
	sectionKey: text("section_key").notNull(),
	gradientConfig: jsonb("gradient_config").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("site_gradients_section_key_unique").on(table.sectionKey),
	pgPolicy("site_gradients_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("site_gradients_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const aiSkills = pgTable("ai_skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	skillKey: varchar("skill_key", { length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	stage: varchar({ length: 30 }).notNull(),
	toolContext: varchar("tool_context", { length: 50 }),
	systemPrompt: text("system_prompt").notNull(),
	inputSchema: jsonb("input_schema"),
	outputSchema: jsonb("output_schema"),
	preferredModel: varchar("preferred_model", { length: 20 }).default('gemini'),
	temperature: numeric({ precision: 3, scale:  2 }).default('0.7'),
	maxTokens: integer("max_tokens").default(1000),
	version: integer().default(1),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: varchar("created_by", { length: 100 }),
	notes: text(),
}, (table) => [
	index("idx_ai_skills_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_ai_skills_stage").using("btree", table.stage.asc().nullsLast().op("text_ops")),
	index("idx_ai_skills_tool").using("btree", table.toolContext.asc().nullsLast().op("text_ops")),
	unique("ai_skills_skill_key_key").on(table.skillKey),
	pgPolicy("unrestricted_delete", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("unrestricted_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("unrestricted_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("unrestricted_update", { as: "permissive", for: "update", to: ["public"] }),
]);

export const previewImages = pgTable("preview_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shootId: uuid("shoot_id").notNull(),
	filename: text().notNull(),
	supabaseUrl: text("supabase_url").notNull(),
	supabaseStoragePath: text("supabase_storage_path").notNull(),
	originalDropboxPath: text("original_dropbox_path"),
	fileSize: integer("file_size"),
	contentType: text("content_type").default('image/jpeg').notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	migrationBatchId: uuid("migration_batch_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "preview_images_shoot_id_shoots_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [profiles.id],
			name: "preview_images_uploaded_by_profiles_id_fk"
		}),
	pgPolicy("Clients can view preview images for their shoots", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = preview_images.shoot_id) AND (shoots.client_id = (auth.jwt() ->> 'email'::text)))))` }),
	pgPolicy("Super admin and staff can manage all preview images", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	role: text().default('user').notNull(),
	profileImageUrl: text("profile_image_url"),
	bannerImageUrl: text("banner_image_url"),
	themePreference: text("theme_preference").default('light'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	subscriptionTier: varchar("subscription_tier", { length: 20 }).default('free'),
	subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true, mode: 'string' }),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
	emailVerificationToken: varchar("email_verification_token", { length: 100 }),
	emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("profiles_delete_policy", { as: "permissive", for: "delete", to: ["public"], using: sql`is_super_admin()` }),
	pgPolicy("profiles_insert_policy", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("profiles_read_policy", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("profiles_update_policy", { as: "permissive", for: "update", to: ["public"] }),
]);

export const blogPostTags = pgTable("blog_post_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_blog_post_tags_post").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_post_tags_tag").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "blog_post_tags_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [blogTags.id],
			name: "blog_post_tags_tag_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public can read post tags", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM blog_posts
  WHERE ((blog_posts.id = blog_post_tags.post_id) AND (blog_posts.status = 'published'::text))))` }),
	pgPolicy("Staff can manage post tags", { as: "permissive", for: "all", to: ["public"] }),
]);

export const contentArticles = pgTable("content_articles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	articleNumber: serial("article_number").notNull(),
	headline: text().notNull(),
	hook: text().notNull(),
	content: text().notNull(),
	client: text().notNull(),
	status: text().default('Draft').notNull(),
	sourceUrl: text("source_url"),
	sourceTitle: text("source_title"),
	focusAngle: text("focus_angle"),
	tone: text(),
	wordCount: integer("word_count"),
	imageUrl: text("image_url"),
	imagePlacement: text("image_placement"),
	imageAttribution: text("image_attribution"),
	hashtags: text(),
	notes: text(),
	airtableId: text("airtable_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	blogPostId: uuid("blog_post_id"),
}, (table) => [
	index("idx_content_articles_article_number").using("btree", table.articleNumber.desc().nullsFirst().op("int4_ops")),
	index("idx_content_articles_client").using("btree", table.client.asc().nullsLast().op("text_ops")),
	index("idx_content_articles_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_content_articles_source_title").using("btree", table.sourceTitle.asc().nullsLast().op("text_ops")),
	index("idx_content_articles_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.blogPostId],
			foreignColumns: [blogPosts.id],
			name: "content_articles_blog_post_id_fkey"
		}).onDelete("set null"),
	unique("content_articles_airtable_id_key").on(table.airtableId),
	pgPolicy("Authenticated users can delete articles", { as: "permissive", for: "delete", to: ["public"], using: sql`(auth.role() = 'authenticated'::text)` }),
	pgPolicy("Authenticated users can insert articles", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Authenticated users can update articles", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Authenticated users can view all articles", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Public can view published articles", { as: "permissive", for: "select", to: ["public"] }),
	check("content_articles_status_check", sql`status = ANY (ARRAY['Draft'::text, 'Published'::text, 'Edited'::text, 'Rejected'::text, 'Scheduled'::text])`),
]);

export const localSiteAssets = pgTable("local_site_assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetKey: varchar("asset_key", { length: 100 }).notNull(),
	assetType: varchar("asset_type", { length: 50 }).notNull(),
	filePath: varchar("file_path", { length: 500 }).notNull(),
	altText: varchar("alt_text", { length: 255 }),
	seoKeywords: varchar("seo_keywords", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	updatedBy: uuid("updated_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [profiles.id],
			name: "local_site_assets_updated_by_profiles_id_fk"
		}),
	unique("local_site_assets_asset_key_unique").on(table.assetKey),
	pgPolicy("local_site_assets_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`((is_active = true) OR is_admin_or_staff())` }),
	pgPolicy("local_site_assets_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const aiPrompts = pgTable("ai_prompts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	promptKey: text("prompt_key").notNull(),
	name: text().notNull(),
	description: text(),
	promptText: text("prompt_text").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_prompts_key").using("btree", table.promptKey.asc().nullsLast().op("text_ops")),
	unique("ai_prompts_prompt_key_key").on(table.promptKey),
	pgPolicy("Allow read access", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Allow update access", { as: "permissive", for: "update", to: ["public"] }),
]);

export const visitorDailyStats = pgTable("visitor_daily_stats", {
	date: date().primaryKey().notNull(),
	uniqueVisitors: integer("unique_visitors").default(0),
	totalPageViews: integer("total_page_views").default(0),
	desktopVisitors: integer("desktop_visitors").default(0),
	mobileVisitors: integer("mobile_visitors").default(0),
	tabletVisitors: integer("tablet_visitors").default(0),
	avgSessionMinutes: numeric("avg_session_minutes", { precision: 5, scale:  2 }).default('0'),
	topPages: jsonb("top_pages").default([]),
	topReferrers: jsonb("top_referrers").default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("visitor_daily_stats_staff_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`is_admin_or_staff()` }),
]);

export const siteConfig = pgTable("site_config", {
	id: serial().primaryKey().notNull(),
	key: text().notNull(),
	value: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_site_config_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
	unique("site_config_key_key").on(table.key),
	pgPolicy("site_config_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`is_admin_or_staff()` }),
	pgPolicy("site_config_write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const whAgencyMembers = pgTable("wh_agency_members", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	displayName: text("display_name"),
	role: text().default('client').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "wh_agency_members_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_members_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`wh_agency_is_admin()` }),
	pgPolicy("wh_agency_members_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("wh_agency_members_select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("wh_agency_members_update", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("wh_agency_members_role_check", sql`role = ANY (ARRAY['client'::text, 'staff'::text, 'admin'::text])`),
]);

export const pricingPackages = pgTable("pricing_packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageIdentifier: varchar("page_identifier", { length: 50 }).notNull(),
	pageType: varchar("page_type", { length: 20 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	sectionColors: jsonb("section_colors").default({}),
	tiers: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
	updatedBy: uuid("updated_by"),
}, (table) => [
	index("idx_pricing_packages_identifier").using("btree", table.pageIdentifier.asc().nullsLast().op("text_ops")),
	index("idx_pricing_packages_page_type_category").using("btree", table.pageType.asc().nullsLast().op("text_ops"), table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "pricing_packages_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [profiles.id],
			name: "pricing_packages_updated_by_fkey"
		}),
	unique("pricing_packages_page_identifier_key").on(table.pageIdentifier),
	pgPolicy("Admin write access for pricing packages", { as: "permissive", for: "all", to: ["public"], using: sql`((auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin'::text, 'staff'::text]))`, withCheck: sql`((auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin'::text, 'staff'::text]))`  }),
	pgPolicy("Public read access for pricing packages", { as: "permissive", for: "select", to: ["public"] }),
]);

export const contentClients = pgTable("content_clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	email: text(),
	websiteUrl: text("website_url"),
	industry: text(),
	isActive: boolean("is_active").default(true),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	pipelineConfig: jsonb("pipeline_config").default({"quality":{"notifyOnDraft":true,"minRelevanceScore":0.6,"requireHumanReview":true},"research":{"frequency":"daily","maxItemsPerRun":20,"topicCooldownDays":30,"topicCooldownPosts":5},"production":{"mode":"manual","articlesPerRun":1,"autoPublishStatus":"draft","minSourcesRequired":3,"skipIfInsufficient":true}}),
}, (table) => [
	index("idx_content_clients_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_content_clients_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_content_clients_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	unique("content_clients_slug_key").on(table.slug),
	pgPolicy("content_clients_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
	pgPolicy("content_clients_read_for_editors", { as: "permissive", for: "select", to: ["public"] }),
]);

export const clientOutputDestinations = pgTable("client_output_destinations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	destinationType: text("destination_type").notNull(),
	displayName: text("display_name").notNull(),
	credentialsEncrypted: text("credentials_encrypted"),
	config: jsonb().default({}),
	isActive: boolean("is_active").default(false),
	lastPublishedAt: timestamp("last_published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_client_output_destinations_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "client_output_destinations_client_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Service role full access to output destinations", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("client_output_destinations_staff", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const whAgencyClients = pgTable("wh_agency_clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	logoUrl: text("logo_url"),
	accentColour: text("accent_colour"),
	accountLeadName: text("account_lead_name"),
	accountLeadEmail: text("account_lead_email"),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isShowcase: boolean("is_showcase").default(false).notNull(),
}, (table) => [
	uniqueIndex("wh_agency_clients_one_showcase").using("btree", sql`(true)`).where(sql`is_showcase`),
	unique("wh_agency_clients_slug_key").on(table.slug),
	pgPolicy("wh_agency_clients_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`wh_agency_is_admin()` }),
	pgPolicy("wh_agency_clients_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("wh_agency_clients_select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("wh_agency_clients_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_clients_update", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("wh_agency_clients_slug_check", sql`slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text`),
]);

export const whAgencyReports = pgTable("wh_agency_reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	periodStart: date("period_start").notNull(),
	periodEnd: date("period_end").notNull(),
	title: text().default('Report Card').notNull(),
	overallGrade: text("overall_grade"),
	headline: text(),
	status: text().default('draft').notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	preparedBy: text("prepared_by"),
	compiledOn: date("compiled_on"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	overallGradeLabel: text("overall_grade_label"),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	lockedBy: uuid("locked_by"),
}, (table) => [
	index("wh_agency_reports_client_status_idx").using("btree", table.clientId.asc().nullsLast().op("date_ops"), table.status.asc().nullsLast().op("uuid_ops"), table.periodStart.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [whAgencyClients.id],
			name: "wh_agency_reports_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lockedBy],
			foreignColumns: [users.id],
			name: "wh_agency_reports_locked_by_fkey"
		}).onDelete("set null"),
	unique("wh_agency_reports_unique_period").on(table.clientId, table.periodStart, table.periodEnd),
	pgPolicy("wh_agency_reports_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(wh_agency_is_admin() AND (locked_at IS NULL))` }),
	pgPolicy("wh_agency_reports_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("wh_agency_reports_select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("wh_agency_reports_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_reports_update", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("wh_agency_reports_period_ck", sql`period_end >= period_start`),
	check("wh_agency_reports_status_check", sql`status = ANY (ARRAY['draft'::text, 'published'::text])`),
]);

export const clientInputSources = pgTable("client_input_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	sourceType: text("source_type").notNull(),
	displayName: text("display_name").notNull(),
	config: jsonb().default({}),
	cronSchedule: text("cron_schedule"),
	isActive: boolean("is_active").default(false),
	lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	fetchIntervalMinutes: integer("fetch_interval_minutes").default(1440),
	errorCount: integer("error_count").default(0),
	lastError: text("last_error"),
	priority: integer().default(0),
}, (table) => [
	index("idx_client_input_sources_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "client_input_sources_client_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Service role full access to input sources", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("client_input_sources_staff", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const blogPosts = pgTable("blog_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	excerpt: text(),
	content: text().notNull(),
	coverImage: text("cover_image"),
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),
	status: text().default('draft').notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }),
	viewCount: integer("view_count").default(0).notNull(),
	authorId: uuid("author_id").notNull(),
	categoryId: uuid("category_id"),
	aiGenerated: boolean("ai_generated").default(false).notNull(),
	aiPrompt: text("ai_prompt"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	postImage1: text("post_image_1"),
	postImage2: text("post_image_2"),
	featuredSection: jsonb("featured_section"),
	variableContent: text("variable_content"),
	coverImageAlt: text("cover_image_alt"),
	clientId: uuid("client_id"),
	publishTracking: jsonb("publish_tracking").default({}),
	topicFingerprint: text("topic_fingerprint"),
	topicKeywords: text("topic_keywords").array(),
}, (table) => [
	index("idx_blog_posts_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_posts_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_posts_client_id").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_posts_featured_section_gin").using("gin", table.featuredSection.asc().nullsLast().op("jsonb_ops")).where(sql`(featured_section IS NOT NULL)`),
	index("idx_blog_posts_featured_section_type").using("btree", sql`((featured_section ->> 'type'::text))`).where(sql`(featured_section IS NOT NULL)`),
	index("idx_blog_posts_published_at").using("btree", table.publishedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_blog_posts_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_blog_posts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_blog_posts_title_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_blog_posts_topic_fingerprint").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.topicFingerprint.asc().nullsLast().op("text_ops")).where(sql`(topic_fingerprint IS NOT NULL)`),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "blog_posts_author_id_fkey"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [blogCategories.id],
			name: "blog_posts_category_id_fkey"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "blog_posts_client_id_fkey"
		}).onDelete("set null"),
	unique("blog_posts_slug_key").on(table.slug),
	pgPolicy("Authors can manage their posts", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = author_id)` }),
	pgPolicy("Public can read published posts", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Staff can manage all blog content", { as: "permissive", for: "all", to: ["public"] }),
	check("blog_posts_status_check", sql`status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text])`),
	check("featured_section_type_check", sql`(featured_section IS NULL) OR ((featured_section ->> 'type'::text) = ANY (ARRAY['none'::text, 'image'::text, 'video'::text, 'gallery'::text, 'quote'::text, 'cta'::text, 'before-after'::text]))`),
]);

export const ingestedArticles = pgTable("ingested_articles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	sourceId: uuid("source_id"),
	externalUrl: text("external_url"),
	urlHash: text("url_hash").notNull(),
	title: text().notNull(),
	summary: text(),
	topicFingerprint: text("topic_fingerprint"),
	topicKeywords: text("topic_keywords").array(),
	rawContent: text("raw_content"),
	sourcePublishedAt: timestamp("source_published_at", { withTimezone: true, mode: 'string' }),
	status: text().default('new').notNull(),
	rejectionReason: text("rejection_reason"),
	similarityScore: numeric("similarity_score", { precision: 4, scale:  3 }),
	matchedPostId: uuid("matched_post_id"),
	relevanceScore: numeric("relevance_score", { precision: 4, scale:  3 }),
	freshnessScore: numeric("freshness_score", { precision: 4, scale:  3 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_ingested_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_ingested_status").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_ingested_title_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_ingested_topic").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.topicFingerprint.asc().nullsLast().op("uuid_ops")).where(sql`(topic_fingerprint IS NOT NULL)`),
	uniqueIndex("idx_ingested_url_hash").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.urlHash.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "ingested_articles_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matchedPostId],
			foreignColumns: [blogPosts.id],
			name: "ingested_articles_matched_post_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [clientInputSources.id],
			name: "ingested_articles_source_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Service role full access to ingested articles", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("ingested_articles_staff", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const whAgencyReportKpis = pgTable("wh_agency_report_kpis", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reportId: uuid("report_id").notNull(),
	label: text().notNull(),
	value: numeric(),
	valueSuffix: text("value_suffix"),
	deltaPct: numeric("delta_pct"),
	deltaLabel: text("delta_label"),
	sortOrder: integer("sort_order").default(0).notNull(),
	source: text().default('manual').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isVisible: boolean("is_visible").default(true).notNull(),
	derivedKey: text("derived_key"),
}, (table) => [
	index("wh_agency_report_kpis_report_idx").using("btree", table.reportId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.reportId],
			foreignColumns: [whAgencyReports.id],
			name: "wh_agency_report_kpis_report_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_report_kpis_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(wh_agency_can_read_report(report_id) AND (is_visible OR wh_agency_is_staff()))` }),
	pgPolicy("wh_agency_report_kpis_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_report_kpis_write", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("wh_agency_report_kpis_derived_key_check", sql`(derived_key IS NULL) OR (derived_key = ANY (ARRAY['assets_produced'::text, 'total_clicked'::text, 'total_impressions'::text, 'total_engagement'::text, 'total_reach'::text]))`),
	check("wh_agency_report_kpis_source_check", sql`source = ANY (ARRAY['manual'::text, 'ga4'::text, 'open_thwack'::text, 'adrotate'::text])`),
]);

export const whAgencyReportCards = pgTable("wh_agency_report_cards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reportId: uuid("report_id").notNull(),
	channel: text().notNull(),
	eyebrow: text(),
	title: text().notNull(),
	grade: text(),
	footnote: text(),
	ctaLabel: text("cta_label"),
	width: text().default('standard').notNull(),
	vizType: text("viz_type").default('none').notNull(),
	meterPct: numeric("meter_pct"),
	meterLabel: text("meter_label"),
	meterValue: text("meter_value"),
	sortOrder: integer("sort_order").default(0).notNull(),
	source: text().default('manual').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isVisible: boolean("is_visible").default(true).notNull(),
	sourceUrl: text("source_url"),
	targetValue: numeric("target_value"),
	snapshotPath: text("snapshot_path"),
}, (table) => [
	index("wh_agency_report_cards_report_idx").using("btree", table.reportId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reportId],
			foreignColumns: [whAgencyReports.id],
			name: "wh_agency_report_cards_report_id_fkey"
		}).onDelete("cascade"),
	unique("wh_agency_report_cards_unique_channel").on(table.reportId, table.channel),
	pgPolicy("wh_agency_report_cards_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(wh_agency_can_read_report(report_id) AND (is_visible OR wh_agency_is_staff()))` }),
	pgPolicy("wh_agency_report_cards_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_report_cards_write", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("wh_agency_report_cards_channel_check", sql`channel = ANY (ARRAY['totals'::text, 'reach'::text, 'social'::text, 'videos'::text, 'reels'::text, 'images'::text, 'ads'::text, 'content'::text, 'email'::text, 'web'::text, 'deliverables'::text, 'channels'::text, 'enquiries'::text])`),
	check("wh_agency_report_cards_meter_pct_check", sql`(meter_pct >= (0)::numeric) AND (meter_pct <= (100)::numeric)`),
	check("wh_agency_report_cards_source_check", sql`source = ANY (ARRAY['manual'::text, 'gdrive'::text, 'ga4'::text, 'open_thwack'::text, 'adrotate'::text])`),
	check("wh_agency_report_cards_target_value_check", sql`(target_value IS NULL) OR (target_value > (0)::numeric)`),
	check("wh_agency_report_cards_viz_type_check", sql`viz_type = ANY (ARRAY['none'::text, 'donut'::text, 'bars'::text, 'meter'::text, 'splitbar'::text, 'funnel'::text, 'gauge'::text, 'targetgauge'::text])`),
	check("wh_agency_report_cards_width_check", sql`width = ANY (ARRAY['standard'::text, 'wide'::text])`),
]);

export const whAgencyCardStats = pgTable("wh_agency_card_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cardId: uuid("card_id").notNull(),
	label: text().notNull(),
	value: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	derivedKey: text("derived_key"),
}, (table) => [
	index("wh_agency_card_stats_card_idx").using("btree", table.cardId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cardId],
			foreignColumns: [whAgencyReportCards.id],
			name: "wh_agency_card_stats_card_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_card_stats_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`wh_agency_can_read_card(card_id)` }),
	pgPolicy("wh_agency_card_stats_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_card_stats_write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const whAgencyCardSegments = pgTable("wh_agency_card_segments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cardId: uuid("card_id").notNull(),
	label: text().notNull(),
	value: numeric().notNull(),
	colourToken: text("colour_token").default('cobalt').notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	index("wh_agency_card_segments_card_idx").using("btree", table.cardId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cardId],
			foreignColumns: [whAgencyReportCards.id],
			name: "wh_agency_card_segments_card_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_card_segments_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`wh_agency_can_read_card(card_id)` }),
	pgPolicy("wh_agency_card_segments_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_card_segments_write", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("wh_agency_card_segments_value_check", sql`value >= (0)::numeric`),
]);

export const skillProposalHistory = pgTable("skill_proposal_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	skillKey: varchar("skill_key", { length: 100 }).notNull(),
	proposalHash: text("proposal_hash").notNull(),
	changeSummary: text("change_summary").notNull(),
	changeType: varchar("change_type", { length: 20 }),
	currentText: text("current_text"),
	proposedText: text("proposed_text"),
	issueDescription: text("issue_description"),
	occurrences: integer().default(1),
	confidence: integer(),
	riskLevel: varchar("risk_level", { length: 20 }),
	reasoning: text(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	decisionReason: text("decision_reason"),
	rejectionCount: integer("rejection_count").default(0),
	basedOnFeedbackIds: uuid("based_on_feedback_ids").array(),
	feedbackCount: integer("feedback_count"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_proposal_pending").using("btree", table.status.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`((status)::text = 'pending'::text)`),
	index("idx_proposal_rejected").using("btree", table.skillKey.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")).where(sql`((status)::text = 'rejected'::text)`),
	pgPolicy("unrestricted_delete", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("unrestricted_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("unrestricted_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("unrestricted_update", { as: "permissive", for: "update", to: ["public"] }),
	check("skill_proposal_history_change_type_check", sql`(change_type)::text = ANY ((ARRAY['add'::character varying, 'modify'::character varying, 'remove'::character varying])::text[])`),
	check("skill_proposal_history_confidence_check", sql`(confidence >= 0) AND (confidence <= 100)`),
	check("skill_proposal_history_risk_level_check", sql`(risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])`),
	check("skill_proposal_history_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'modified'::character varying])::text[])`),
]);

export const socialContentHistory = pgTable("social_content_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	platform: varchar({ length: 50 }).notNull(),
	tone: varchar({ length: 50 }).notNull(),
	model: varchar({ length: 50 }).notNull(),
	originalPrompt: text("original_prompt"),
	brandElements: jsonb("brand_elements"),
	hook: text(),
	bodyHeader: text("body_header"),
	body: text(),
	cta: text(),
	hashtags: text(),
	assembledContent: text("assembled_content"),
	quickRating: varchar("quick_rating", { length: 20 }),
	quickRatingScore: smallint("quick_rating_score"),
	quickIssue: varchar("quick_issue", { length: 100 }),
	sectionRatings: jsonb("section_ratings"),
	feedbackTags: text("feedback_tags").array(),
	feedbackComment: text("feedback_comment"),
	processedForEvolution: boolean("processed_for_evolution").default(false),
	autoInjectedToBrand: boolean("auto_injected_to_brand").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	ratedAt: timestamp("rated_at", { withTimezone: true, mode: 'string' }),
	fullPrompt: text("full_prompt"),
	generationTimeMs: integer("generation_time_ms"),
	sectionIssues: jsonb("section_issues"),
	sectionComments: jsonb("section_comments"),
	originalHook: text("original_hook"),
	originalBodyHeader: text("original_body_header"),
	originalBody: text("original_body"),
	originalCta: text("original_cta"),
	originalHashtags: text("original_hashtags"),
	wasModified: boolean("was_modified").default(false),
	isCuratedExample: boolean("is_curated_example").default(false),
	evolutionCycleProcessed: integer("evolution_cycle_processed"),
	ratingIterationCount: integer("rating_iteration_count").default(0),
	highestRatingScore: integer("highest_rating_score"),
}, (table) => [
	index("idx_content_history_client_platform").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.platform.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_content_history_high_rated").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.quickRatingScore.desc().nullsFirst().op("int2_ops")).where(sql`((quick_rating_score >= 8) AND (auto_injected_to_brand = false))`),
	index("idx_content_history_low_rated").using("btree", table.clientId.asc().nullsLast().op("int2_ops"), table.quickRatingScore.asc().nullsLast().op("int2_ops")).where(sql`((quick_rating_score <= 3) AND (auto_injected_to_brand = false))`),
	index("idx_content_history_unprocessed").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.processedForEvolution.asc().nullsLast().op("uuid_ops")).where(sql`((processed_for_evolution = false) AND (quick_rating_score IS NOT NULL))`),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "social_content_history_client_id_fkey"
		}).onDelete("set null"),
	pgPolicy("unrestricted_delete", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("unrestricted_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("unrestricted_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("unrestricted_update", { as: "permissive", for: "update", to: ["public"] }),
	check("social_content_history_quick_rating_check", sql`(quick_rating)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'neutral'::character varying, 'poor'::character varying])::text[])`),
	check("social_content_history_quick_rating_score_check", sql`(quick_rating_score >= 1) AND (quick_rating_score <= 9)`),
]);

export const skillEvolutionLog = pgTable("skill_evolution_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	targetType: text("target_type").notNull(),
	targetKey: text("target_key").notNull(),
	changeType: text("change_type").notNull(),
	previousValue: text("previous_value"),
	newValue: text("new_value"),
	reasoning: text().notNull(),
	confidence: numeric({ precision: 3, scale:  2 }),
	feedbackIds: uuid("feedback_ids").array(),
	feedbackSummary: jsonb("feedback_summary"),
	evolutionCycle: integer("evolution_cycle").notNull(),
	modelUsed: text("model_used"),
	processingTimeMs: integer("processing_time_ms"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	rolledBack: boolean("rolled_back").default(false),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	rolledBackBy: text("rolled_back_by"),
}, (table) => [
	index("idx_evolution_log_cycle").using("btree", table.evolutionCycle.asc().nullsLast().op("int4_ops")),
	index("idx_evolution_log_target").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetKey.asc().nullsLast().op("text_ops")),
	pgPolicy("Allow all for service role", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("skill_evolution_log_staff", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("skill_evolution_log_change_type_check", sql`change_type = ANY (ARRAY['append'::text, 'replace'::text, 'remove'::text, 'rewrite'::text])`),
	check("skill_evolution_log_target_type_check", sql`target_type = ANY (ARRAY['skill'::text, 'brand_positive'::text, 'brand_negative'::text, 'brand_forbidden'::text, 'orchestrator_self'::text])`),
]);

export const topicCooldowns = pgTable("topic_cooldowns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	topicFingerprint: text("topic_fingerprint").notNull(),
	topicLabel: text("topic_label").notNull(),
	lastPublishedAt: timestamp("last_published_at", { withTimezone: true, mode: 'string' }).notNull(),
	blogPostId: uuid("blog_post_id"),
	postSequenceNumber: integer("post_sequence_number").default(0).notNull(),
	cooldownDays: integer("cooldown_days").default(30),
	cooldownPosts: integer("cooldown_posts").default(5),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("idx_cooldown_client_topic").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.topicFingerprint.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.blogPostId],
			foreignColumns: [blogPosts.id],
			name: "topic_cooldowns_blog_post_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "topic_cooldowns_client_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Service role full access to topic cooldowns", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("topic_cooldowns_staff", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const whAgencyCardSeries = pgTable("wh_agency_card_series", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cardId: uuid("card_id").notNull(),
	label: text(),
	value: numeric().notNull(),
	isHighlight: boolean("is_highlight").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	index("wh_agency_card_series_card_idx").using("btree", table.cardId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cardId],
			foreignColumns: [whAgencyReportCards.id],
			name: "wh_agency_card_series_card_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_card_series_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`wh_agency_can_read_card(card_id)` }),
	pgPolicy("wh_agency_card_series_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_card_series_write", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("wh_agency_card_series_value_check", sql`value >= (0)::numeric`),
]);

export const pipelineRuns = pgTable("pipeline_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	runType: text("run_type").default('research').notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	itemsDiscovered: integer("items_discovered").default(0),
	itemsScreenedOut: integer("items_screened_out").default(0),
	itemsApproved: integer("items_approved").default(0),
	articlesGenerated: integer("articles_generated").default(0),
	status: text().default('running').notNull(),
	errorMessage: text("error_message"),
	durationMs: integer("duration_ms"),
	metadata: jsonb().default({}),
}, (table) => [
	index("idx_pipeline_runs_client").using("btree", table.clientId.asc().nullsLast().op("timestamptz_ops"), table.startedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "pipeline_runs_client_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Service role full access to pipeline runs", { as: "permissive", for: "all", to: ["service_role"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("pipeline_runs_staff", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const whAgencyCardItems = pgTable("wh_agency_card_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cardId: uuid("card_id").notNull(),
	title: text(),
	url: text(),
	platform: text(),
	occurredOn: date("occurred_on"),
	detail: text(),
	metrics: jsonb().default({}).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	source: text().default('manual').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	externalId: text("external_id"),
	isDelivered: boolean("is_delivered"),
	snapshotPath: text("snapshot_path"),
	attributes: jsonb().default({}).notNull(),
}, (table) => [
	uniqueIndex("wh_agency_card_items_card_external_idx").using("btree", table.cardId.asc().nullsLast().op("uuid_ops"), table.externalId.asc().nullsLast().op("text_ops")),
	index("wh_agency_card_items_card_idx").using("btree", table.cardId.asc().nullsLast().op("uuid_ops"), table.sortOrder.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.cardId],
			foreignColumns: [whAgencyReportCards.id],
			name: "wh_agency_card_items_card_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_card_items_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`wh_agency_can_read_card(card_id)` }),
	pgPolicy("wh_agency_card_items_select_showcase", { as: "permissive", for: "select", to: ["anon"] }),
	pgPolicy("wh_agency_card_items_write", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("wh_agency_card_items_platform_check", sql`platform = ANY (ARRAY['ig'::text, 'fb'::text, 'li'::text, 'tt'::text, 'yt'::text, 'web'::text, 'email'::text])`),
	check("wh_agency_card_items_source_check", sql`source = ANY (ARRAY['manual'::text, 'gdrive'::text, 'ga4'::text, 'open_thwack'::text, 'adrotate'::text])`),
]);

export const botArmy01 = pgTable("bot_army_01", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	surname: text().notNull(),
	email: text(),
	phone: text(),
	country: text(),
	city: text(),
	gender: text(),
	dateOfBirth: date("date_of_birth"),
	credentials: jsonb().default({}).notNull(),
	platforms: text().array().default([""]),
	images: jsonb().default([]),
	notes: text(),
	comments: text(),
	status: text().default('active').notNull(),
}, (table) => [
	index("idx_bot_army_01_country").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("idx_bot_army_01_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_bot_army_01_platforms").using("gin", table.platforms.asc().nullsLast().op("array_ops")),
	index("idx_bot_army_01_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	pgPolicy("bot_army_01_svc_access", { as: "permissive", for: "all", to: ["bot_army_01_svc"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("bot_army_service_account_full_access", { as: "permissive", for: "all", to: ["public"] }),
	check("bot_army_01_gender_check", sql`gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'unspecified'::text])`),
	check("bot_army_01_status_check", sql`status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending'::text, 'archived'::text])`),
]);

export const clients = pgTable("clients", {
	name: text().notNull(),
	slug: text().notNull(),
	email: text(),
	userId: uuid("user_id"),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	id: serial().primaryKey().notNull(),
	phone: text(),
	address: text(),
	secondaryEmail: text("secondary_email"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "clients_created_by_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "clients_user_id_profiles_id_fk"
		}),
	pgPolicy("clients_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`(is_admin_or_staff() OR (auth.uid() = user_id))` }),
	pgPolicy("clients_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const clientSelections = pgTable("client_selections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shootId: uuid("shoot_id").notNull(),
	clientId: uuid("client_id").notNull(),
	imageFilename: text("image_filename").notNull(),
	dropboxPath: text("dropbox_path"),
	thumbnailUrl: text("thumbnail_url"),
	selectionStatus: text("selection_status").default('none').notNull(),
	isFinalSelection: boolean("is_final_selection").default(false).notNull(),
	selectionOrder: integer("selection_order"),
	selectedAt: timestamp("selected_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	editingComplete: boolean("editing_complete").default(false).notNull(),
	editingCompletedAt: timestamp("editing_completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [profiles.id],
			name: "client_selections_client_id_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "client_selections_shoot_id_shoots_id_fk"
		}),
	pgPolicy("Clients can manage their own selections", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(client_id = ((auth.jwt() ->> 'sub'::text))::uuid)`, withCheck: sql`(client_id = ((auth.jwt() ->> 'sub'::text))::uuid)`  }),
	pgPolicy("Super admin and staff can manage all selections", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const selectionPackages = pgTable("selection_packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shootId: uuid("shoot_id").notNull(),
	clientId: uuid("client_id").notNull(),
	baseLimit: integer("base_limit").default(20).notNull(),
	purchasedAdditional: integer("purchased_additional").default(0).notNull(),
	totalAllowed: integer("total_allowed").generatedAlwaysAs(sql`(base_limit + purchased_additional)`),
	purchaseHistory: jsonb("purchase_history"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [profiles.id],
			name: "selection_packages_client_id_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "selection_packages_shoot_id_shoots_id_fk"
		}),
	pgPolicy("Clients can view their own selection packages", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(client_id = ((auth.jwt() ->> 'sub'::text))::uuid)` }),
	pgPolicy("Super admin and staff can manage all selection packages", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const contentStrategies = pgTable("content_strategies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	brandVersion: integer("brand_version").default(1),
	intent: text(),
	hookType: text("hook_type"),
	emotionalRegister: text("emotional_register"),
	audienceState: text("audience_state"),
	structurePattern: text("structure_pattern"),
	ctaType: text("cta_type"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_content_strategies_client").using("btree", table.clientId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "content_strategies_client_id_fkey"
		}),
	pgPolicy("content_strategies_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
]);

export const contentRuns = pgTable("content_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	strategyId: uuid("strategy_id"),
	brandVersion: integer("brand_version").default(1),
	contentType: text("content_type"),
	platforms: text().array().default([""]),
	modelsUsed: jsonb("models_used").default({}),
	estimatedCost: numeric("estimated_cost", { precision: 10, scale:  4 }).default('0'),
	actualCost: numeric("actual_cost", { precision: 10, scale:  4 }).default('0'),
	status: text().default('pending'),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_content_runs_client_status").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "content_runs_client_id_fkey"
		}),
	foreignKey({
			columns: [table.strategyId],
			foreignColumns: [contentStrategies.id],
			name: "content_runs_strategy_id_fkey"
		}),
	pgPolicy("content_runs_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
]);

export const clientPerformanceMetrics = pgTable("client_performance_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	metricType: text("metric_type").notNull(),
	platform: text(),
	timePeriod: text("time_period"),
	metricData: jsonb("metric_data").default({}).notNull(),
	dataSource: text("data_source").default('manual'),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }).default('1.0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	assetId: uuid("asset_id"),
	brandVersion: integer("brand_version").default(1),
	impressions: integer().default(0),
	reach: integer().default(0),
	likes: integer().default(0),
	comments: integer().default(0),
	shares: integer().default(0),
	saves: integer().default(0),
	watchTimeSeconds: integer("watch_time_seconds").default(0),
	retentionRate: numeric("retention_rate", { precision: 5, scale:  4 }).default('0'),
	clickThroughRate: numeric("click_through_rate", { precision: 5, scale:  4 }).default('0'),
	engagementRate: numeric("engagement_rate", { precision: 5, scale:  4 }).default('0'),
	performanceScore: numeric("performance_score", { precision: 5, scale:  2 }).default('0'),
}, (table) => [
	index("idx_performance_metrics_client").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.metricType.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("idx_performance_metrics_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(expires_at IS NOT NULL)`),
	index("idx_performance_metrics_platform").using("btree", table.platform.asc().nullsLast().op("text_ops"), table.metricType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [contentAssets.id],
			name: "client_performance_metrics_asset_id_fkey"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "client_performance_metrics_client_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("performance_metrics_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
	pgPolicy("performance_metrics_read_for_editors", { as: "permissive", for: "select", to: ["public"] }),
]);

export const contentAssets = pgTable("content_assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	runId: uuid("run_id"),
	assetType: text("asset_type").notNull(),
	platform: text(),
	title: text(),
	scriptJson: jsonb("script_json").default({}),
	captionText: text("caption_text"),
	assetUrl: text("asset_url"),
	thumbnailUrl: text("thumbnail_url"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).default(0),
	durationSeconds: integer("duration_seconds").default(0),
	dimensions: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_content_assets_run").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.assetType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [contentRuns.id],
			name: "content_assets_run_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("content_assets_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
]);

export const brandLearning = pgTable("brand_learning", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	hookType: text("hook_type"),
	contentFormat: text("content_format"),
	emotionalRegister: text("emotional_register"),
	platform: text(),
	biasScore: numeric("bias_score", { precision: 5, scale:  4 }).default('0'),
	confidenceLevel: numeric("confidence_level", { precision: 5, scale:  4 }).default('0'),
	sampleSize: integer("sample_size").default(0),
	lastUpdated: timestamp("last_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_brand_learning_client").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.hookType.asc().nullsLast().op("text_ops"), table.platform.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "brand_learning_client_id_fkey"
		}),
	pgPolicy("brand_learning_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
]);

export const generationLimits = pgTable("generation_limits", {
	clientId: uuid("client_id").primaryKey().notNull(),
	maxCostPerRun: numeric("max_cost_per_run", { precision: 8, scale:  2 }).default('50.00'),
	maxMonthlyCost: numeric("max_monthly_cost", { precision: 10, scale:  2 }).default('500.00'),
	videoEnabled: boolean("video_enabled").default(true),
	voiceEnabled: boolean("voice_enabled").default(false),
	bulkGenerationEnabled: boolean("bulk_generation_enabled").default(false),
	currentMonthSpend: numeric("current_month_spend", { precision: 10, scale:  2 }).default('0.00'),
	lastResetDate: date("last_reset_date").default(sql`CURRENT_DATE`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_generation_limits_cost").using("btree", table.currentMonthSpend.asc().nullsLast().op("numeric_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "generation_limits_client_id_fkey"
		}),
	pgPolicy("generation_limits_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
]);

export const toolAccessTiers = pgTable("tool_access_tiers", {
	id: serial().primaryKey().notNull(),
	toolSlug: varchar("tool_slug", { length: 50 }).notNull(),
	minTier: varchar("min_tier", { length: 20 }).default('anonymous').notNull(),
	isActive: boolean("is_active").default(true),
	usageLimitAnonymous: integer("usage_limit_anonymous"),
	usageLimitVerified: integer("usage_limit_verified"),
	usageLimitPro: integer("usage_limit_pro"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tool_access_tiers_tool_slug_key").on(table.toolSlug),
	pgPolicy("Anyone can read tool access tiers", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Staff can manage tool access tiers", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Tool access tiers are viewable by everyone", { as: "permissive", for: "select", to: ["public"] }),
]);

export const toolUsage = pgTable("tool_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 100 }),
	toolSlug: varchar("tool_slug", { length: 50 }).notNull(),
	action: varchar({ length: 50 }).default('execute'),
	metadata: jsonb(),
	ipAddress: inet("ip_address"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_tool_usage_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_tool_usage_daily").using("btree", table.toolSlug.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_tool_usage_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops"), table.toolSlug.asc().nullsLast().op("text_ops")),
	index("idx_tool_usage_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.toolSlug.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "tool_usage_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Allow tool usage inserts", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("Anonymous users can insert tool usage", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view own tool usage", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can view their own tool usage", { as: "permissive", for: "select", to: ["public"] }),
]);

export const blogMedia = pgTable("blog_media", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	filename: text().notNull(),
	storagePath: text("storage_path").notNull(),
	altText: text("alt_text"),
	caption: text(),
	fileSize: integer("file_size"),
	contentType: text("content_type").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_blog_media_post").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "blog_media_post_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public can read post media", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM blog_posts
  WHERE ((blog_posts.id = blog_media.post_id) AND (blog_posts.status = 'published'::text))))` }),
	pgPolicy("Staff can manage post media", { as: "permissive", for: "all", to: ["public"] }),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tier: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	provider: varchar({ length: 20 }),
	providerSubscriptionId: varchar("provider_subscription_id", { length: 100 }),
	providerCustomerId: varchar("provider_customer_id", { length: 100 }),
	currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: 'string' }),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_subscriptions_user").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "subscriptions_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Staff can view all subscriptions", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'staff'::text])))))` }),
	pgPolicy("Users can view own subscriptions", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can view their own subscriptions", { as: "permissive", for: "select", to: ["public"] }),
]);

export const categoryHeroes = pgTable("category_heroes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageType: text("page_type").notNull(),
	category: text().notNull(),
	imageUrl: text("image_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	heroHeight: integer("hero_height").default(60),
	imageAlign: varchar("image_align", { length: 10 }).default('center'),
}, (table) => [
	unique("category_heroes_page_type_category_key").on(table.pageType, table.category),
	pgPolicy("Anyone can view category heroes", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Super admin and staff can manage category heroes", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("category_heroes_hero_height_check", sql`(hero_height >= 40) AND (hero_height <= 100)`),
	check("category_heroes_image_align_check", sql`(image_align)::text = ANY ((ARRAY['top'::character varying, 'center'::character varying, 'bottom'::character varying])::text[])`),
]);

export const blogCategories = pgTable("blog_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	color: text().default('#6366f1').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("blog_categories_slug_key").on(table.slug),
	pgPolicy("Public can read categories", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
	pgPolicy("Staff can manage categories", { as: "permissive", for: "all", to: ["public"] }),
]);

export const blogTags = pgTable("blog_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("blog_tags_name_key").on(table.name),
	unique("blog_tags_slug_key").on(table.slug),
	pgPolicy("Public can read tags", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Staff can manage tags", { as: "permissive", for: "all", to: ["public"] }),
]);

export const visitorSessions = pgTable("visitor_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: varchar("session_id", { length: 64 }).notNull(),
	userId: uuid("user_id"),
	ipHash: varchar("ip_hash", { length: 64 }),
	userAgent: text("user_agent"),
	currentPage: varchar("current_page", { length: 500 }),
	referrer: varchar({ length: 500 }),
	deviceType: varchar("device_type", { length: 20 }).default('desktop'),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	pageViews: integer("page_views").default(1),
	isBot: boolean("is_bot").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_visitor_sessions_last_activity").using("btree", table.lastActivityAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_visitor_sessions_session_id").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_visitor_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "visitor_sessions_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("visitor_sessions_staff_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`is_admin_or_staff()` }),
]);

export const images = pgTable("images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shootId: uuid("shoot_id").notNull(),
	filename: text().notNull(),
	storagePath: text("storage_path").notNull(),
	originalName: text("original_name"),
	fileSize: integer("file_size"),
	isPrivate: boolean("is_private").default(false).notNull(),
	uploadOrder: integer("upload_order").default(0).notNull(),
	downloadCount: integer("download_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	sequence: integer().default(0).notNull(),
	classification: varchar({ length: 50 }).default('portrait').notNull(),
	featuredImage: boolean("featured_image").default(false).notNull(),
	heartsCount: integer("hearts_count").default(0),
	likesCount: integer("likes_count").default(0),
	dislikesCount: integer("dislikes_count").default(0),
	lastInteractionAt: timestamp("last_interaction_at", { mode: 'string' }),
}, (table) => [
	index("idx_images_interactions").using("btree", table.heartsCount.desc().nullsFirst().op("int4_ops"), table.likesCount.desc().nullsFirst().op("int4_ops"), table.dislikesCount.desc().nullsFirst().op("int4_ops")),
	foreignKey({
			columns: [table.shootId],
			foreignColumns: [shoots.id],
			name: "images_shoot_id_shoots_id_fk"
		}),
	pgPolicy("images_read_policy", { as: "permissive", for: "select", to: ["public"], using: sql`(is_admin_or_staff() OR (auth.uid() IN ( SELECT c.user_id
   FROM (clients c
     JOIN shoots s ON ((s.client_id = c.email)))
  WHERE (s.id = images.shoot_id))) OR ((is_private = false) AND (EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = images.shoot_id) AND (shoots.is_private = false))))))` }),
	pgPolicy("images_write_policy", { as: "permissive", for: "all", to: ["public"] }),
]);

export const platformRules = pgTable("platform_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	platformKey: varchar("platform_key", { length: 20 }).notNull(),
	label: varchar({ length: 50 }).notNull(),
	icon: varchar({ length: 50 }),
	hookLimit: integer("hook_limit"),
	bodyHeaderLimit: integer("body_header_limit"),
	bodyLimit: integer("body_limit"),
	ctaLimit: integer("cta_limit"),
	hashtagCountMin: integer("hashtag_count_min").default(3),
	hashtagCountMax: integer("hashtag_count_max").default(10),
	totalCharacterLimit: integer("total_character_limit"),
	emojiStyle: varchar("emoji_style", { length: 20 }).default('moderate'),
	defaultTone: varchar("default_tone", { length: 50 }),
	guidelines: text(),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_platform_rules_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_platform_rules_key").using("btree", table.platformKey.asc().nullsLast().op("text_ops")),
	unique("platform_rules_platform_key_key").on(table.platformKey),
	pgPolicy("platform_rules_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`is_admin_or_staff()` }),
	pgPolicy("platform_rules_write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const clientBrandProfiles = pgTable("client_brand_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	version: integer().default(1),
	isActive: boolean("is_active").default(true),
	brandDescription: text("brand_description"),
	voiceTone: jsonb("voice_tone").default({}),
	keyMessages: text("key_messages").array().default([""]),
	forbiddenPhrases: text("forbidden_phrases").array().default([""]),
	preferredTerminology: jsonb("preferred_terminology").default({}),
	primaryColor: text("primary_color"),
	secondaryColors: text("secondary_colors").array().default([""]),
	logoUrl: text("logo_url"),
	visualStyleNotes: text("visual_style_notes"),
	contentThemes: text("content_themes").array().default([""]),
	targetAudienceDescription: text("target_audience_description"),
	contentLengthPreferences: jsonb("content_length_preferences").default({}),
	topPerformingContentTypes: text("top_performing_content_types").array().default([""]),
	successfulHooks: text("successful_hooks").array().default([""]),
	contentToAvoid: text("content_to_avoid").array().default([""]),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	notes: text(),
	voiceRules: jsonb("voice_rules").default({}),
	visualRules: jsonb("visual_rules").default({}),
	platformRules: jsonb("platform_rules").default({}),
	approvedExamples: text("approved_examples").array().default([""]),
	negativeExamples: text("negative_examples").array().default([""]),
	colorPersonality: text("color_personality"),
	visualMood: text("visual_mood"),
	targetAudience: text("target_audience"),
	businessNiche: text("business_niche"),
	positiveExamples: text("positive_examples").array(),
	prohibitedTerms: text("prohibited_terms").array(),
	priorityBenefits: text("priority_benefits").array(),
	secondaryBenefits: text("secondary_benefits").array(),
	productsServices: text("products_services"),
	language: text().default('english'),
	region: text().default('global'),
	spelling: text().default('british'),
	contentFocusOptions: text("content_focus_options").array().default([""]),
}, (table) => [
	index("idx_brand_profiles_client").using("btree", table.clientId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_brand_profiles_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_brand_profiles_version").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.version.asc().nullsLast().op("int4_ops")).where(sql`(is_active = true)`),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "client_brand_profiles_client_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("brand_profiles_admin_access", { as: "permissive", for: "all", to: ["public"], using: sql`(COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text]))` }),
	pgPolicy("brand_profiles_read_for_editors", { as: "permissive", for: "select", to: ["public"] }),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar().notNull(),
	password: varchar().notNull(),
	role: varchar().default('client').notNull(),
	profileImage: text("profile_image"),
	bannerImage: text("banner_image"),
	themePreference: varchar("theme_preference").default('dark'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	subscriptionTier: varchar("subscription_tier", { length: 20 }).default('free'),
	subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true, mode: 'string' }),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
	emailVerificationToken: varchar("email_verification_token", { length: 100 }),
	emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true, mode: 'string' }),
});

export const aiPromptOverrides = pgTable("ai_prompt_overrides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	contentType: text("content_type").notNull(),
	promptText: text("prompt_text").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_prompt_overrides_client_type").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.contentType.asc().nullsLast().op("uuid_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_ai_prompt_overrides_unique_active").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.contentType.asc().nullsLast().op("text_ops")).where(sql`(is_active = true)`),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "ai_prompt_overrides_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "ai_prompt_overrides_created_by_fkey"
		}),
	pgPolicy("ai_prompt_overrides_staff", { as: "permissive", for: "all", to: ["authenticated"], using: sql`is_admin_or_staff()`, withCheck: sql`is_admin_or_staff()`  }),
]);

export const clientBrandAssets = pgTable("client_brand_assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	name: text().notNull(),
	description: text(),
	assetType: text("asset_type").default('product').notNull(),
	imageUrl: text("image_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	width: integer(),
	height: integer(),
	fileSizeBytes: integer("file_size_bytes"),
	mimeType: text("mime_type"),
	dominantColours: jsonb("dominant_colours"),
	material: text(),
	similarTo: text("similar_to"),
	usageNotes: text("usage_notes"),
	placementGuidance: text("placement_guidance"),
	scalePreference: text("scale_preference").default('prominent'),
	size: text(),
	flavour: text(),
	tags: text().array(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_client_brand_assets_client").using("btree", table.clientId.asc().nullsLast().op("int4_ops"), table.isActive.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	index("idx_client_brand_assets_type").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.assetType.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contentClients.id],
			name: "client_brand_assets_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "client_brand_assets_created_by_fkey"
		}),
	pgPolicy("client_brand_assets_staff", { as: "permissive", for: "all", to: ["authenticated"], using: sql`is_admin_or_staff()`, withCheck: sql`is_admin_or_staff()`  }),
]);

export const leads = pgTable("leads", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "leads_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	event: text(),
	businessId: text("business_id"),
	name: text(),
	email: text(),
	phone: text(),
	address: text(),
	tier: integer(),
	revenueScore: numeric("revenue_score", { precision: 5, scale:  1 }),
	category: text(),
	city: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_leads_city").using("btree", table.city.asc().nullsLast().op("text_ops")),
	index("idx_leads_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_leads_tier").using("btree", table.tier.asc().nullsLast().op("int4_ops")),
	pgPolicy("bot_army_01_svc_leads_access", { as: "permissive", for: "all", to: ["bot_army_01_svc"], using: sql`true`, withCheck: sql`true`  }),
]);

export const dubailinkRegistrations = pgTable("dubailink_registrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	mobile: text().notNull(),
	city: text().notNull(),
	budget: text().notNull(),
	popiaConsent: boolean("popia_consent").default(false).notNull(),
	marketingConsent: boolean("marketing_consent").default(false).notNull(),
	abVariant: text("ab_variant"),
	ipAddress: text("ip_address"),
	country: text(),
	region: text(),
	cityGeo: text("city_geo"),
	postalCode: text("postal_code"),
	timezone: text(),
	asn: integer(),
	isp: text(),
	colo: text(),
	userAgent: text("user_agent"),
	referrer: text(),
	originUrl: text("origin_url"),
	status: text().default('new').notNull(),
	notes: text(),
	comments: text(),
	datePreference: text("date_preference"),
	arrivalTime: text("arrival_time"),
}, (table) => [
	index("idx_registrations_city").using("btree", table.city.asc().nullsLast().op("text_ops")),
	index("idx_registrations_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_registrations_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_registrations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("dubailink_registrations_ab_variant_check", sql`ab_variant = ANY (ARRAY['a'::text, 'b'::text, 'c'::text])`),
	check("dubailink_registrations_arrival_time_check", sql`arrival_time = ANY (ARRAY['morning'::text, 'afternoon'::text, 'not-sure'::text])`),
	check("dubailink_registrations_budget_check", sql`budget = ANY (ARRAY['500k-1m'::text, '1m-3m'::text, '3m+'::text, 'exploring'::text, '3.5m-5m'::text, '5m-15m'::text, '15m+'::text, 'below-3.5m'::text])`),
	check("dubailink_registrations_city_check", sql`city = ANY (ARRAY['cape-town'::text, 'durban'::text, 'either'::text])`),
	check("dubailink_registrations_date_preference_check", sql`date_preference = ANY (ARRAY['sat-30-may'::text, 'sun-31-may'::text, 'sat-13-jun'::text, 'sun-14-jun'::text, 'mon-15-jun'::text, 'flexible'::text, 'fri-16'::text, 'sat-17'::text, 'thu-22'::text, 'fri-23'::text, 'sat-24'::text, 'fri-22'::text, 'sat-23'::text, 'sun-24'::text, 'fri-29'::text, 'sat-30'::text, 'sun-31'::text])`),
	check("dubailink_registrations_status_check", sql`status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'attended'::text, 'no-show'::text, 'converted'::text, 'lost'::text])`),
]);

export const mondayProjDailySnapshots = pgTable("monday_proj_daily_snapshots", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "monday_proj_daily_snapshots_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	snapshotDate: date("snapshot_date").notNull(),
	personId: text("person_id").notNull(),
	personName: text("person_name").notNull(),
	hoursAllocated: numeric("hours_allocated").default('0').notNull(),
	tasksActive: integer("tasks_active").default(0).notNull(),
	tasksCompleted: integer("tasks_completed").default(0).notNull(),
	utilisation: numeric().default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_monday_proj_snapshots_date").using("btree", table.snapshotDate.desc().nullsFirst().op("date_ops")),
	index("idx_monday_proj_snapshots_person").using("btree", table.personId.asc().nullsLast().op("text_ops"), table.snapshotDate.desc().nullsFirst().op("text_ops")),
	unique("monday_proj_daily_snapshots_snapshot_date_person_id_key").on(table.snapshotDate, table.personId),
	pgPolicy("monday_proj_daily_snapshots_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`monday_proj_is_member()` }),
]);

export const mondayProjAuditLog = pgTable("monday_proj_audit_log", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "monday_proj_audit_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id"),
	userEmail: text("user_email"),
	action: text().notNull(),
	tableName: text("table_name").notNull(),
	recordId: text("record_id").notNull(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_monday_proj_audit_log_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_monday_proj_audit_log_user").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "monday_proj_audit_log_user_id_fkey"
		}),
	pgPolicy("monday_proj_audit_log_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`monday_proj_is_member()` }),
]);

export const mondayProjPersonConfig = pgTable("monday_proj_person_config", {
	personId: text("person_id").primaryKey().notNull(),
	mondayName: text("monday_name").notNull(),
	colour: text().default('#8b949e').notNull(),
	hoursPerDay: numeric("hours_per_day").default('8').notNull(),
	daysPerWeek: numeric("days_per_week").default('5').notNull(),
	salary: numeric().default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("Admins can delete person config", { as: "permissive", for: "delete", to: ["public"], using: sql`monday_proj_is_admin()` }),
	pgPolicy("Admins can insert person config", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can read person config", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can update person config", { as: "permissive", for: "update", to: ["public"] }),
]);

export const mondayProjProjectConfig = pgTable("monday_proj_project_config", {
	projectId: text("project_id").primaryKey().notNull(),
	boardName: text("board_name").notNull(),
	revenue: numeric().default('0').notNull(),
	direct: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("monday_proj_project_config_insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`monday_proj_is_member()`  }),
	pgPolicy("monday_proj_project_config_read", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("monday_proj_project_config_update", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const mondayProjTaskCache = pgTable("monday_proj_task_cache", {
	id: text().default('current').primaryKey().notNull(),
	tasks: jsonb().default([]).notNull(),
	discovery: jsonb().default({}).notNull(),
	taskCount: integer("task_count").default(0).notNull(),
	fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("monday_proj_task_cache_read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`monday_proj_is_member()` }),
]);

export const mondayProjUserProfiles = pgTable("monday_proj_user_profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	displayName: text("display_name"),
	role: text().default('contributor').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "monday_proj_user_profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Admins can insert profiles", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`monday_proj_is_admin()`  }),
	pgPolicy("Admins can read all profiles", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can update all profiles", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can read own profile", { as: "permissive", for: "select", to: ["public"] }),
	check("monday_proj_user_profiles_role_check", sql`role = ANY (ARRAY['superuser'::text, 'admin'::text, 'contributor'::text])`),
]);

export const whAgencyReportEvents = pgTable("wh_agency_report_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reportId: uuid("report_id").notNull(),
	clientId: uuid("client_id").notNull(),
	userId: uuid("user_id").notNull(),
	viewToken: uuid("view_token").notNull(),
	eventType: text("event_type").notNull(),
	dwellMs: integer("dwell_ms"),
	linkUrl: text("link_url"),
	linkLabel: text("link_label"),
	path: text(),
	referrer: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("wh_agency_report_events_client_idx").using("btree", table.clientId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("wh_agency_report_events_report_idx").using("btree", table.reportId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("wh_agency_report_events_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("wh_agency_report_events_view_token_idx").using("btree", table.viewToken.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [whAgencyClients.id],
			name: "wh_agency_report_events_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportId],
			foreignColumns: [whAgencyReports.id],
			name: "wh_agency_report_events_report_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [whAgencyMembers.id],
			name: "wh_agency_report_events_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("wh_agency_report_events_insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((user_id = auth.uid()) AND wh_agency_can_read_report(report_id))`  }),
	pgPolicy("wh_agency_report_events_select", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("wh_agency_report_events_dwell_ms_check", sql`dwell_ms >= 0`),
	check("wh_agency_report_events_event_type_check", sql`event_type = ANY (ARRAY['view'::text, 'dwell'::text, 'link_click'::text])`),
]);

export const whAgencyClientUsers = pgTable("wh_agency_client_users", {
	clientId: uuid("client_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("wh_agency_client_users_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [whAgencyClients.id],
			name: "wh_agency_client_users_client_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wh_agency_client_users_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.clientId, table.userId], name: "wh_agency_client_users_pkey"}),
	pgPolicy("wh_agency_client_users_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((user_id = auth.uid()) OR wh_agency_is_staff())` }),
	pgPolicy("wh_agency_client_users_write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);
export const pendingFeedbackSummary = pgView("pending_feedback_summary", {	clientId: uuid("client_id"),
	platform: varchar({ length: 50 }),
	tone: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	feedbackCount: bigint("feedback_count", { mode: "number" }),
	avgScore: numeric("avg_score"),
	oldestFeedback: timestamp("oldest_feedback", { withTimezone: true, mode: 'string' }),
	newestFeedback: timestamp("newest_feedback", { withTimezone: true, mode: 'string' }),
}).with({"securityInvoker":true}).as(sql`SELECT client_id, platform, tone, count(*) AS feedback_count, avg(quick_rating_score) AS avg_score, min(created_at) AS oldest_feedback, max(created_at) AS newest_feedback FROM social_content_history WHERE processed_for_evolution = false AND quick_rating_score IS NOT NULL GROUP BY client_id, platform, tone`);

export const contentForBrandInjection = pgView("content_for_brand_injection", {	id: uuid(),
	clientId: uuid("client_id"),
	platform: varchar({ length: 50 }),
	tone: varchar({ length: 50 }),
	hook: text(),
	body: text(),
	cta: text(),
	quickRatingScore: smallint("quick_rating_score"),
	injectionType: text("injection_type"),
}).with({"securityInvoker":true}).as(sql`SELECT id, client_id, platform, tone, hook, body, cta, quick_rating_score, CASE WHEN quick_rating_score >= 8 THEN 'positive'::text WHEN quick_rating_score <= 3 THEN 'negative'::text ELSE NULL::text END AS injection_type FROM social_content_history WHERE auto_injected_to_brand = false AND (quick_rating_score >= 8 OR quick_rating_score <= 3)`);

export const vEvolutionPendingFeedback = pgView("v_evolution_pending_feedback", {	id: uuid(),
	platform: varchar({ length: 50 }),
	tone: varchar({ length: 50 }),
	clientId: uuid("client_id"),
	score: smallint(),
	issue: varchar({ length: 100 }),
	feedbackTags: text("feedback_tags"),
	feedbackComment: text("feedback_comment"),
	hook: text(),
	bodyHeader: text("body_header"),
	body: text(),
	cta: text(),
	hashtags: text(),
	originalHook: text("original_hook"),
	originalBody: text("original_body"),
	wasModified: boolean("was_modified"),
	ratingIterationCount: integer("rating_iteration_count"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	ratedAt: timestamp("rated_at", { withTimezone: true, mode: 'string' }),
}).with({"securityInvoker":true}).as(sql`SELECT id, platform, tone, client_id, quick_rating_score AS score, quick_issue AS issue, feedback_tags, feedback_comment, hook, body_header, body, cta, hashtags, original_hook, original_body, was_modified, rating_iteration_count, created_at, rated_at FROM social_content_history h WHERE quick_rating_score IS NOT NULL AND processed_for_evolution = false ORDER BY rated_at DESC`);

export const vEvolutionStats = pgView("v_evolution_stats", {	platform: varchar({ length: 50 }),
	tone: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalRated: bigint("total_rated", { mode: "number" }),
	avgScore: numeric("avg_score"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	poorCount: bigint("poor_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	goodCount: bigint("good_count", { mode: "number" }),
	issues: varchar(),
}).with({"securityInvoker":true}).as(sql`SELECT platform, tone, count(*) AS total_rated, avg(quick_rating_score) AS avg_score, count(*) FILTER (WHERE quick_rating_score <= 3) AS poor_count, count(*) FILTER (WHERE quick_rating_score >= 7) AS good_count, array_agg(DISTINCT quick_issue) FILTER (WHERE quick_issue IS NOT NULL) AS issues FROM social_content_history WHERE quick_rating_score IS NOT NULL GROUP BY platform, tone`);

export const activeVisitors = pgView("active_visitors", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	activeCount: bigint("active_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalSessions: bigint("total_sessions", { mode: "number" }),
}).with({"securityInvoker":true}).as(sql`SELECT count(DISTINCT session_id) AS active_count, count(*) AS total_sessions FROM visitor_sessions WHERE last_activity_at > (now() - '00:05:00'::interval) AND is_bot = false`);