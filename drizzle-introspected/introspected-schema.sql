-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "content_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"word_limit" integer,
	"character_limit" integer,
	"guidelines" text,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "content_types_type_key_key" UNIQUE("type_key")
);
--> statement-breakpoint
ALTER TABLE "content_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoot_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"duration" integer,
	"width" integer,
	"height" integer,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"optimized_path" text,
	"featured_video" boolean DEFAULT false NOT NULL,
	"source_type" text DEFAULT 'native' NOT NULL,
	"external_id" text,
	"external_url" text
);
--> statement-breakpoint
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shoots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"banner_image_id" uuid,
	"seo_tags" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"custom_slug" text,
	"custom_title" text,
	"gallery_settings" jsonb,
	"location" text,
	"shoot_date" text,
	"shoot_type" text,
	"notes" text,
	"total_interactions" integer DEFAULT 0,
	"media_type" text DEFAULT 'photo' NOT NULL,
	"group_name" text,
	CONSTRAINT "shoots_media_type_check" CHECK (media_type = ANY (ARRAY['photo'::text, 'video'::text]))
);
--> statement-breakpoint
ALTER TABLE "shoots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"message" text NOT NULL,
	"service_type" varchar DEFAULT 'general',
	"preferred_date" timestamp,
	"budget_range" varchar,
	"status" varchar DEFAULT 'pending',
	"inquiry_data" text,
	"client_id" integer,
	"package_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"shoot_id" uuid,
	"image_id" uuid,
	"action_type" text NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "analytics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric,
	"features" text[],
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "packages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shoot_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoot_id" uuid NOT NULL,
	"dropbox_folder_path" text,
	"dropbox_share_link" text,
	"selection_limit" integer DEFAULT 20 NOT NULL,
	"additional_bundle_5_price" numeric DEFAULT '150.00',
	"additional_bundle_10_price" numeric DEFAULT '250.00',
	"unlimited_bundle_price" numeric DEFAULT '500.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"submission_completed" boolean DEFAULT false,
	"submission_completed_at" timestamp with time zone,
	"submission_completed_by" text,
	"editing_completed" boolean DEFAULT false,
	"editing_completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "shoot_previews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_gradients" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_key" text NOT NULL,
	"gradient_config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "site_gradients_section_key_unique" UNIQUE("section_key")
);
--> statement-breakpoint
ALTER TABLE "site_gradients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_key" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"stage" varchar(30) NOT NULL,
	"tool_context" varchar(50),
	"system_prompt" text NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"preferred_model" varchar(20) DEFAULT 'gemini',
	"temperature" numeric(3, 2) DEFAULT '0.7',
	"max_tokens" integer DEFAULT 1000,
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" varchar(100),
	"notes" text,
	CONSTRAINT "ai_skills_skill_key_key" UNIQUE("skill_key")
);
--> statement-breakpoint
ALTER TABLE "ai_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "preview_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoot_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"supabase_url" text NOT NULL,
	"supabase_storage_path" text NOT NULL,
	"original_dropbox_path" text,
	"file_size" integer,
	"content_type" text DEFAULT 'image/jpeg' NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"migration_batch_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "preview_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"profile_image_url" text,
	"banner_image_url" text,
	"theme_preference" text DEFAULT 'light',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"subscription_tier" varchar(20) DEFAULT 'free',
	"subscription_expires_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"email_verification_token" varchar(100),
	"email_verification_expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_post_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "blog_post_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_number" serial NOT NULL,
	"headline" text NOT NULL,
	"hook" text NOT NULL,
	"content" text NOT NULL,
	"client" text NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"source_url" text,
	"source_title" text,
	"focus_angle" text,
	"tone" text,
	"word_count" integer,
	"image_url" text,
	"image_placement" text,
	"image_attribution" text,
	"hashtags" text,
	"notes" text,
	"airtable_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"blog_post_id" uuid,
	CONSTRAINT "content_articles_airtable_id_key" UNIQUE("airtable_id"),
	CONSTRAINT "content_articles_status_check" CHECK (status = ANY (ARRAY['Draft'::text, 'Published'::text, 'Edited'::text, 'Rejected'::text, 'Scheduled'::text]))
);
--> statement-breakpoint
ALTER TABLE "content_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "local_site_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_key" varchar(100) NOT NULL,
	"asset_type" varchar(50) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"alt_text" varchar(255),
	"seo_keywords" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "local_site_assets_asset_key_unique" UNIQUE("asset_key")
);
--> statement-breakpoint
ALTER TABLE "local_site_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"prompt_text" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_prompts_prompt_key_key" UNIQUE("prompt_key")
);
--> statement-breakpoint
ALTER TABLE "ai_prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "visitor_daily_stats" (
	"date" date PRIMARY KEY NOT NULL,
	"unique_visitors" integer DEFAULT 0,
	"total_page_views" integer DEFAULT 0,
	"desktop_visitors" integer DEFAULT 0,
	"mobile_visitors" integer DEFAULT 0,
	"tablet_visitors" integer DEFAULT 0,
	"avg_session_minutes" numeric(5, 2) DEFAULT '0',
	"top_pages" jsonb DEFAULT '[]'::jsonb,
	"top_referrers" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "visitor_daily_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "site_config_key_key" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "site_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" text DEFAULT 'client' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wh_agency_members_role_check" CHECK (role = ANY (ARRAY['client'::text, 'staff'::text, 'admin'::text]))
);
--> statement-breakpoint
ALTER TABLE "wh_agency_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pricing_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_identifier" varchar(50) NOT NULL,
	"page_type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"section_colors" jsonb DEFAULT '{}'::jsonb,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "pricing_packages_page_identifier_key" UNIQUE("page_identifier")
);
--> statement-breakpoint
ALTER TABLE "pricing_packages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text,
	"website_url" text,
	"industry" text,
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"pipeline_config" jsonb DEFAULT '{"quality":{"notifyOnDraft":true,"minRelevanceScore":0.6,"requireHumanReview":true},"research":{"frequency":"daily","maxItemsPerRun":20,"topicCooldownDays":30,"topicCooldownPosts":5},"production":{"mode":"manual","articlesPerRun":1,"autoPublishStatus":"draft","minSourcesRequired":3,"skipIfInsufficient":true}}'::jsonb,
	CONSTRAINT "content_clients_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "content_clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_output_destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"destination_type" text NOT NULL,
	"display_name" text NOT NULL,
	"credentials_encrypted" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT false,
	"last_published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "client_output_destinations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"accent_colour" text,
	"account_lead_name" text,
	"account_lead_email" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_showcase" boolean DEFAULT false NOT NULL,
	CONSTRAINT "wh_agency_clients_slug_key" UNIQUE("slug"),
	CONSTRAINT "wh_agency_clients_slug_check" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)
);
--> statement-breakpoint
ALTER TABLE "wh_agency_clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"title" text DEFAULT 'Report Card' NOT NULL,
	"overall_grade" text,
	"headline" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"prepared_by" text,
	"compiled_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"overall_grade_label" text,
	"locked_at" timestamp with time zone,
	"locked_by" uuid,
	CONSTRAINT "wh_agency_reports_unique_period" UNIQUE("client_id","period_start","period_end"),
	CONSTRAINT "wh_agency_reports_period_ck" CHECK (period_end >= period_start),
	CONSTRAINT "wh_agency_reports_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text]))
);
--> statement-breakpoint
ALTER TABLE "wh_agency_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_input_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"display_name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"cron_schedule" text,
	"is_active" boolean DEFAULT false,
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"fetch_interval_minutes" integer DEFAULT 1440,
	"error_count" integer DEFAULT 0,
	"last_error" text,
	"priority" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "client_input_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"seo_title" text,
	"seo_description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"author_id" uuid NOT NULL,
	"category_id" uuid,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"ai_prompt" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"post_image_1" text,
	"post_image_2" text,
	"featured_section" jsonb,
	"variable_content" text,
	"cover_image_alt" text,
	"client_id" uuid,
	"publish_tracking" jsonb DEFAULT '{}'::jsonb,
	"topic_fingerprint" text,
	"topic_keywords" text[],
	CONSTRAINT "blog_posts_slug_key" UNIQUE("slug"),
	CONSTRAINT "blog_posts_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text])),
	CONSTRAINT "featured_section_type_check" CHECK ((featured_section IS NULL) OR ((featured_section ->> 'type'::text) = ANY (ARRAY['none'::text, 'image'::text, 'video'::text, 'gallery'::text, 'quote'::text, 'cta'::text, 'before-after'::text])))
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ingested_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"source_id" uuid,
	"external_url" text,
	"url_hash" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"topic_fingerprint" text,
	"topic_keywords" text[],
	"raw_content" text,
	"source_published_at" timestamp with time zone,
	"status" text DEFAULT 'new' NOT NULL,
	"rejection_reason" text,
	"similarity_score" numeric(4, 3),
	"matched_post_id" uuid,
	"relevance_score" numeric(4, 3),
	"freshness_score" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ingested_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_report_kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" numeric,
	"value_suffix" text,
	"delta_pct" numeric,
	"delta_label" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"derived_key" text,
	CONSTRAINT "wh_agency_report_kpis_derived_key_check" CHECK ((derived_key IS NULL) OR (derived_key = ANY (ARRAY['assets_produced'::text, 'total_clicked'::text, 'total_impressions'::text, 'total_engagement'::text, 'total_reach'::text]))),
	CONSTRAINT "wh_agency_report_kpis_source_check" CHECK (source = ANY (ARRAY['manual'::text, 'ga4'::text, 'open_thwack'::text, 'adrotate'::text]))
);
--> statement-breakpoint
ALTER TABLE "wh_agency_report_kpis" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_report_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"eyebrow" text,
	"title" text NOT NULL,
	"grade" text,
	"footnote" text,
	"cta_label" text,
	"width" text DEFAULT 'standard' NOT NULL,
	"viz_type" text DEFAULT 'none' NOT NULL,
	"meter_pct" numeric,
	"meter_label" text,
	"meter_value" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"source_url" text,
	"target_value" numeric,
	"snapshot_path" text,
	CONSTRAINT "wh_agency_report_cards_unique_channel" UNIQUE("report_id","channel"),
	CONSTRAINT "wh_agency_report_cards_channel_check" CHECK (channel = ANY (ARRAY['totals'::text, 'reach'::text, 'social'::text, 'videos'::text, 'reels'::text, 'images'::text, 'ads'::text, 'content'::text, 'email'::text, 'web'::text, 'deliverables'::text, 'channels'::text, 'enquiries'::text])),
	CONSTRAINT "wh_agency_report_cards_meter_pct_check" CHECK ((meter_pct >= (0)::numeric) AND (meter_pct <= (100)::numeric)),
	CONSTRAINT "wh_agency_report_cards_source_check" CHECK (source = ANY (ARRAY['manual'::text, 'gdrive'::text, 'ga4'::text, 'open_thwack'::text, 'adrotate'::text])),
	CONSTRAINT "wh_agency_report_cards_target_value_check" CHECK ((target_value IS NULL) OR (target_value > (0)::numeric)),
	CONSTRAINT "wh_agency_report_cards_viz_type_check" CHECK (viz_type = ANY (ARRAY['none'::text, 'donut'::text, 'bars'::text, 'meter'::text, 'splitbar'::text, 'funnel'::text, 'gauge'::text, 'targetgauge'::text])),
	CONSTRAINT "wh_agency_report_cards_width_check" CHECK (width = ANY (ARRAY['standard'::text, 'wide'::text]))
);
--> statement-breakpoint
ALTER TABLE "wh_agency_report_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_card_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"derived_key" text
);
--> statement-breakpoint
ALTER TABLE "wh_agency_card_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_card_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" numeric NOT NULL,
	"colour_token" text DEFAULT 'cobalt' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wh_agency_card_segments_value_check" CHECK (value >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "wh_agency_card_segments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "skill_proposal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_key" varchar(100) NOT NULL,
	"proposal_hash" text NOT NULL,
	"change_summary" text NOT NULL,
	"change_type" varchar(20),
	"current_text" text,
	"proposed_text" text,
	"issue_description" text,
	"occurrences" integer DEFAULT 1,
	"confidence" integer,
	"risk_level" varchar(20),
	"reasoning" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"decision_reason" text,
	"rejection_count" integer DEFAULT 0,
	"based_on_feedback_ids" uuid[],
	"feedback_count" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"decided_at" timestamp with time zone,
	CONSTRAINT "skill_proposal_history_change_type_check" CHECK ((change_type)::text = ANY ((ARRAY['add'::character varying, 'modify'::character varying, 'remove'::character varying])::text[])),
	CONSTRAINT "skill_proposal_history_confidence_check" CHECK ((confidence >= 0) AND (confidence <= 100)),
	CONSTRAINT "skill_proposal_history_risk_level_check" CHECK ((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])),
	CONSTRAINT "skill_proposal_history_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'modified'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "skill_proposal_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "social_content_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"platform" varchar(50) NOT NULL,
	"tone" varchar(50) NOT NULL,
	"model" varchar(50) NOT NULL,
	"original_prompt" text,
	"brand_elements" jsonb,
	"hook" text,
	"body_header" text,
	"body" text,
	"cta" text,
	"hashtags" text,
	"assembled_content" text,
	"quick_rating" varchar(20),
	"quick_rating_score" smallint,
	"quick_issue" varchar(100),
	"section_ratings" jsonb,
	"feedback_tags" text[],
	"feedback_comment" text,
	"processed_for_evolution" boolean DEFAULT false,
	"auto_injected_to_brand" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"rated_at" timestamp with time zone,
	"full_prompt" text,
	"generation_time_ms" integer,
	"section_issues" jsonb,
	"section_comments" jsonb,
	"original_hook" text,
	"original_body_header" text,
	"original_body" text,
	"original_cta" text,
	"original_hashtags" text,
	"was_modified" boolean DEFAULT false,
	"is_curated_example" boolean DEFAULT false,
	"evolution_cycle_processed" integer,
	"rating_iteration_count" integer DEFAULT 0,
	"highest_rating_score" integer,
	CONSTRAINT "social_content_history_quick_rating_check" CHECK ((quick_rating)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'neutral'::character varying, 'poor'::character varying])::text[])),
	CONSTRAINT "social_content_history_quick_rating_score_check" CHECK ((quick_rating_score >= 1) AND (quick_rating_score <= 9))
);
--> statement-breakpoint
ALTER TABLE "social_content_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "skill_evolution_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" text NOT NULL,
	"target_key" text NOT NULL,
	"change_type" text NOT NULL,
	"previous_value" text,
	"new_value" text,
	"reasoning" text NOT NULL,
	"confidence" numeric(3, 2),
	"feedback_ids" uuid[],
	"feedback_summary" jsonb,
	"evolution_cycle" integer NOT NULL,
	"model_used" text,
	"processing_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"rolled_back" boolean DEFAULT false,
	"rolled_back_at" timestamp with time zone,
	"rolled_back_by" text,
	CONSTRAINT "skill_evolution_log_change_type_check" CHECK (change_type = ANY (ARRAY['append'::text, 'replace'::text, 'remove'::text, 'rewrite'::text])),
	CONSTRAINT "skill_evolution_log_target_type_check" CHECK (target_type = ANY (ARRAY['skill'::text, 'brand_positive'::text, 'brand_negative'::text, 'brand_forbidden'::text, 'orchestrator_self'::text]))
);
--> statement-breakpoint
ALTER TABLE "skill_evolution_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topic_cooldowns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"topic_fingerprint" text NOT NULL,
	"topic_label" text NOT NULL,
	"last_published_at" timestamp with time zone NOT NULL,
	"blog_post_id" uuid,
	"post_sequence_number" integer DEFAULT 0 NOT NULL,
	"cooldown_days" integer DEFAULT 30,
	"cooldown_posts" integer DEFAULT 5,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "topic_cooldowns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_card_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"label" text,
	"value" numeric NOT NULL,
	"is_highlight" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wh_agency_card_series_value_check" CHECK (value >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "wh_agency_card_series" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"run_type" text DEFAULT 'research' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"items_discovered" integer DEFAULT 0,
	"items_screened_out" integer DEFAULT 0,
	"items_approved" integer DEFAULT 0,
	"articles_generated" integer DEFAULT 0,
	"status" text DEFAULT 'running' NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "pipeline_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_card_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"title" text,
	"url" text,
	"platform" text,
	"occurred_on" date,
	"detail" text,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"external_id" text,
	"is_delivered" boolean,
	"snapshot_path" text,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "wh_agency_card_items_platform_check" CHECK (platform = ANY (ARRAY['ig'::text, 'fb'::text, 'li'::text, 'tt'::text, 'yt'::text, 'web'::text, 'email'::text])),
	CONSTRAINT "wh_agency_card_items_source_check" CHECK (source = ANY (ARRAY['manual'::text, 'gdrive'::text, 'ga4'::text, 'open_thwack'::text, 'adrotate'::text]))
);
--> statement-breakpoint
ALTER TABLE "wh_agency_card_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bot_army_01" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"surname" text NOT NULL,
	"email" text,
	"phone" text,
	"country" text,
	"city" text,
	"gender" text,
	"date_of_birth" date,
	"credentials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"platforms" text[] DEFAULT '{""}',
	"images" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"comments" text,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "bot_army_01_gender_check" CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'unspecified'::text])),
	CONSTRAINT "bot_army_01_status_check" CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending'::text, 'archived'::text]))
);
--> statement-breakpoint
ALTER TABLE "bot_army_01" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clients" (
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text,
	"user_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text,
	"address" text,
	"secondary_email" text
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoot_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"image_filename" text NOT NULL,
	"dropbox_path" text,
	"thumbnail_url" text,
	"selection_status" text DEFAULT 'none' NOT NULL,
	"is_final_selection" boolean DEFAULT false NOT NULL,
	"selection_order" integer,
	"selected_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"editing_complete" boolean DEFAULT false NOT NULL,
	"editing_completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_selections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "selection_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoot_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"base_limit" integer DEFAULT 20 NOT NULL,
	"purchased_additional" integer DEFAULT 0 NOT NULL,
	"total_allowed" integer GENERATED ALWAYS AS ((base_limit + purchased_additional)) STORED,
	"purchase_history" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "selection_packages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"brand_version" integer DEFAULT 1,
	"intent" text,
	"hook_type" text,
	"emotional_register" text,
	"audience_state" text,
	"structure_pattern" text,
	"cta_type" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "content_strategies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"strategy_id" uuid,
	"brand_version" integer DEFAULT 1,
	"content_type" text,
	"platforms" text[] DEFAULT '{""}',
	"models_used" jsonb DEFAULT '{}'::jsonb,
	"estimated_cost" numeric(10, 4) DEFAULT '0',
	"actual_cost" numeric(10, 4) DEFAULT '0',
	"status" text DEFAULT 'pending',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"metric_type" text NOT NULL,
	"platform" text,
	"time_period" text,
	"metric_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_source" text DEFAULT 'manual',
	"confidence_score" numeric(3, 2) DEFAULT '1.0',
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"asset_id" uuid,
	"brand_version" integer DEFAULT 1,
	"impressions" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"watch_time_seconds" integer DEFAULT 0,
	"retention_rate" numeric(5, 4) DEFAULT '0',
	"click_through_rate" numeric(5, 4) DEFAULT '0',
	"engagement_rate" numeric(5, 4) DEFAULT '0',
	"performance_score" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint
ALTER TABLE "client_performance_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid,
	"asset_type" text NOT NULL,
	"platform" text,
	"title" text,
	"script_json" jsonb DEFAULT '{}'::jsonb,
	"caption_text" text,
	"asset_url" text,
	"thumbnail_url" text,
	"file_size_bytes" bigint DEFAULT 0,
	"duration_seconds" integer DEFAULT 0,
	"dimensions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "content_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brand_learning" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"hook_type" text,
	"content_format" text,
	"emotional_register" text,
	"platform" text,
	"bias_score" numeric(5, 4) DEFAULT '0',
	"confidence_level" numeric(5, 4) DEFAULT '0',
	"sample_size" integer DEFAULT 0,
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "brand_learning" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "generation_limits" (
	"client_id" uuid PRIMARY KEY NOT NULL,
	"max_cost_per_run" numeric(8, 2) DEFAULT '50.00',
	"max_monthly_cost" numeric(10, 2) DEFAULT '500.00',
	"video_enabled" boolean DEFAULT true,
	"voice_enabled" boolean DEFAULT false,
	"bulk_generation_enabled" boolean DEFAULT false,
	"current_month_spend" numeric(10, 2) DEFAULT '0.00',
	"last_reset_date" date DEFAULT CURRENT_DATE,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "generation_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_access_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_slug" varchar(50) NOT NULL,
	"min_tier" varchar(20) DEFAULT 'anonymous' NOT NULL,
	"is_active" boolean DEFAULT true,
	"usage_limit_anonymous" integer,
	"usage_limit_verified" integer,
	"usage_limit_pro" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tool_access_tiers_tool_slug_key" UNIQUE("tool_slug")
);
--> statement-breakpoint
ALTER TABLE "tool_access_tiers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(100),
	"tool_slug" varchar(50) NOT NULL,
	"action" varchar(50) DEFAULT 'execute',
	"metadata" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tool_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text,
	"caption" text,
	"file_size" integer,
	"content_type" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "blog_media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"provider" varchar(20),
	"provider_subscription_id" varchar(100),
	"provider_customer_id" varchar(100),
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "category_heroes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_type" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"hero_height" integer DEFAULT 60,
	"image_align" varchar(10) DEFAULT 'center',
	CONSTRAINT "category_heroes_page_type_category_key" UNIQUE("page_type","category"),
	CONSTRAINT "category_heroes_hero_height_check" CHECK ((hero_height >= 40) AND (hero_height <= 100)),
	CONSTRAINT "category_heroes_image_align_check" CHECK ((image_align)::text = ANY ((ARRAY['top'::character varying, 'center'::character varying, 'bottom'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "category_heroes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blog_categories_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blog_tags_name_key" UNIQUE("name"),
	CONSTRAINT "blog_tags_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "visitor_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"user_id" uuid,
	"ip_hash" varchar(64),
	"user_agent" text,
	"current_page" varchar(500),
	"referrer" varchar(500),
	"device_type" varchar(20) DEFAULT 'desktop',
	"country" varchar(100),
	"city" varchar(100),
	"first_seen_at" timestamp with time zone DEFAULT now(),
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"page_views" integer DEFAULT 1,
	"is_bot" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "visitor_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoot_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" text,
	"file_size" integer,
	"is_private" boolean DEFAULT false NOT NULL,
	"upload_order" integer DEFAULT 0 NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"sequence" integer DEFAULT 0 NOT NULL,
	"classification" varchar(50) DEFAULT 'portrait' NOT NULL,
	"featured_image" boolean DEFAULT false NOT NULL,
	"hearts_count" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"dislikes_count" integer DEFAULT 0,
	"last_interaction_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_key" varchar(20) NOT NULL,
	"label" varchar(50) NOT NULL,
	"icon" varchar(50),
	"hook_limit" integer,
	"body_header_limit" integer,
	"body_limit" integer,
	"cta_limit" integer,
	"hashtag_count_min" integer DEFAULT 3,
	"hashtag_count_max" integer DEFAULT 10,
	"total_character_limit" integer,
	"emoji_style" varchar(20) DEFAULT 'moderate',
	"default_tone" varchar(50),
	"guidelines" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "platform_rules_platform_key_key" UNIQUE("platform_key")
);
--> statement-breakpoint
ALTER TABLE "platform_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_brand_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"brand_description" text,
	"voice_tone" jsonb DEFAULT '{}'::jsonb,
	"key_messages" text[] DEFAULT '{""}',
	"forbidden_phrases" text[] DEFAULT '{""}',
	"preferred_terminology" jsonb DEFAULT '{}'::jsonb,
	"primary_color" text,
	"secondary_colors" text[] DEFAULT '{""}',
	"logo_url" text,
	"visual_style_notes" text,
	"content_themes" text[] DEFAULT '{""}',
	"target_audience_description" text,
	"content_length_preferences" jsonb DEFAULT '{}'::jsonb,
	"top_performing_content_types" text[] DEFAULT '{""}',
	"successful_hooks" text[] DEFAULT '{""}',
	"content_to_avoid" text[] DEFAULT '{""}',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	"voice_rules" jsonb DEFAULT '{}'::jsonb,
	"visual_rules" jsonb DEFAULT '{}'::jsonb,
	"platform_rules" jsonb DEFAULT '{}'::jsonb,
	"approved_examples" text[] DEFAULT '{""}',
	"negative_examples" text[] DEFAULT '{""}',
	"color_personality" text,
	"visual_mood" text,
	"target_audience" text,
	"business_niche" text,
	"positive_examples" text[],
	"prohibited_terms" text[],
	"priority_benefits" text[],
	"secondary_benefits" text[],
	"products_services" text,
	"language" text DEFAULT 'english',
	"region" text DEFAULT 'global',
	"spelling" text DEFAULT 'british',
	"content_focus_options" text[] DEFAULT '{""}'
);
--> statement-breakpoint
ALTER TABLE "client_brand_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"role" varchar DEFAULT 'client' NOT NULL,
	"profile_image" text,
	"banner_image" text,
	"theme_preference" varchar DEFAULT 'dark',
	"created_at" timestamp DEFAULT now(),
	"subscription_tier" varchar(20) DEFAULT 'free',
	"subscription_expires_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"email_verification_token" varchar(100),
	"email_verification_expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_prompt_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"content_type" text NOT NULL,
	"prompt_text" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_prompt_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_brand_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"asset_type" text DEFAULT 'product' NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"file_size_bytes" integer,
	"mime_type" text,
	"dominant_colours" jsonb,
	"material" text,
	"similar_to" text,
	"usage_notes" text,
	"placement_guidance" text,
	"scale_preference" text DEFAULT 'prominent',
	"size" text,
	"flavour" text,
	"tags" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "client_brand_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "leads" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event" text,
	"business_id" text,
	"name" text,
	"email" text,
	"phone" text,
	"address" text,
	"tier" integer,
	"revenue_score" numeric(5, 1),
	"category" text,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dubailink_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text NOT NULL,
	"city" text NOT NULL,
	"budget" text NOT NULL,
	"popia_consent" boolean DEFAULT false NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"ab_variant" text,
	"ip_address" text,
	"country" text,
	"region" text,
	"city_geo" text,
	"postal_code" text,
	"timezone" text,
	"asn" integer,
	"isp" text,
	"colo" text,
	"user_agent" text,
	"referrer" text,
	"origin_url" text,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"comments" text,
	"date_preference" text,
	"arrival_time" text,
	CONSTRAINT "dubailink_registrations_ab_variant_check" CHECK (ab_variant = ANY (ARRAY['a'::text, 'b'::text, 'c'::text])),
	CONSTRAINT "dubailink_registrations_arrival_time_check" CHECK (arrival_time = ANY (ARRAY['morning'::text, 'afternoon'::text, 'not-sure'::text])),
	CONSTRAINT "dubailink_registrations_budget_check" CHECK (budget = ANY (ARRAY['500k-1m'::text, '1m-3m'::text, '3m+'::text, 'exploring'::text, '3.5m-5m'::text, '5m-15m'::text, '15m+'::text, 'below-3.5m'::text])),
	CONSTRAINT "dubailink_registrations_city_check" CHECK (city = ANY (ARRAY['cape-town'::text, 'durban'::text, 'either'::text])),
	CONSTRAINT "dubailink_registrations_date_preference_check" CHECK (date_preference = ANY (ARRAY['sat-30-may'::text, 'sun-31-may'::text, 'sat-13-jun'::text, 'sun-14-jun'::text, 'mon-15-jun'::text, 'flexible'::text, 'fri-16'::text, 'sat-17'::text, 'thu-22'::text, 'fri-23'::text, 'sat-24'::text, 'fri-22'::text, 'sat-23'::text, 'sun-24'::text, 'fri-29'::text, 'sat-30'::text, 'sun-31'::text])),
	CONSTRAINT "dubailink_registrations_status_check" CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'attended'::text, 'no-show'::text, 'converted'::text, 'lost'::text]))
);
--> statement-breakpoint
ALTER TABLE "dubailink_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monday_proj_daily_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "monday_proj_daily_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"snapshot_date" date NOT NULL,
	"person_id" text NOT NULL,
	"person_name" text NOT NULL,
	"hours_allocated" numeric DEFAULT '0' NOT NULL,
	"tasks_active" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"utilisation" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monday_proj_daily_snapshots_snapshot_date_person_id_key" UNIQUE("snapshot_date","person_id")
);
--> statement-breakpoint
ALTER TABLE "monday_proj_daily_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monday_proj_audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "monday_proj_audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid,
	"user_email" text,
	"action" text NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monday_proj_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monday_proj_person_config" (
	"person_id" text PRIMARY KEY NOT NULL,
	"monday_name" text NOT NULL,
	"colour" text DEFAULT '#8b949e' NOT NULL,
	"hours_per_day" numeric DEFAULT '8' NOT NULL,
	"days_per_week" numeric DEFAULT '5' NOT NULL,
	"salary" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monday_proj_person_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monday_proj_project_config" (
	"project_id" text PRIMARY KEY NOT NULL,
	"board_name" text NOT NULL,
	"revenue" numeric DEFAULT '0' NOT NULL,
	"direct" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monday_proj_project_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monday_proj_task_cache" (
	"id" text PRIMARY KEY DEFAULT 'current' NOT NULL,
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discovery" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"task_count" integer DEFAULT 0 NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monday_proj_task_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monday_proj_user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" text DEFAULT 'contributor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monday_proj_user_profiles_role_check" CHECK (role = ANY (ARRAY['superuser'::text, 'admin'::text, 'contributor'::text]))
);
--> statement-breakpoint
ALTER TABLE "monday_proj_user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_report_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"view_token" uuid NOT NULL,
	"event_type" text NOT NULL,
	"dwell_ms" integer,
	"link_url" text,
	"link_label" text,
	"path" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wh_agency_report_events_dwell_ms_check" CHECK (dwell_ms >= 0),
	CONSTRAINT "wh_agency_report_events_event_type_check" CHECK (event_type = ANY (ARRAY['view'::text, 'dwell'::text, 'link_click'::text]))
);
--> statement-breakpoint
ALTER TABLE "wh_agency_report_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wh_agency_client_users" (
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wh_agency_client_users_pkey" PRIMARY KEY("client_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "wh_agency_client_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_shoot_id_fkey" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoots" ADD CONSTRAINT "shoots_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoot_previews" ADD CONSTRAINT "shoot_previews_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_images" ADD CONSTRAINT "preview_images_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_images" ADD CONSTRAINT "preview_images_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_site_assets" ADD CONSTRAINT "local_site_assets_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_members" ADD CONSTRAINT "wh_agency_members_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_packages" ADD CONSTRAINT "pricing_packages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_packages" ADD CONSTRAINT "pricing_packages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_output_destinations" ADD CONSTRAINT "client_output_destinations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_reports" ADD CONSTRAINT "wh_agency_reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wh_agency_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_reports" ADD CONSTRAINT "wh_agency_reports_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_input_sources" ADD CONSTRAINT "client_input_sources_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingested_articles" ADD CONSTRAINT "ingested_articles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingested_articles" ADD CONSTRAINT "ingested_articles_matched_post_id_fkey" FOREIGN KEY ("matched_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingested_articles" ADD CONSTRAINT "ingested_articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."client_input_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_report_kpis" ADD CONSTRAINT "wh_agency_report_kpis_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."wh_agency_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_report_cards" ADD CONSTRAINT "wh_agency_report_cards_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."wh_agency_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_card_stats" ADD CONSTRAINT "wh_agency_card_stats_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."wh_agency_report_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_card_segments" ADD CONSTRAINT "wh_agency_card_segments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."wh_agency_report_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_content_history" ADD CONSTRAINT "social_content_history_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_cooldowns" ADD CONSTRAINT "topic_cooldowns_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_cooldowns" ADD CONSTRAINT "topic_cooldowns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_card_series" ADD CONSTRAINT "wh_agency_card_series_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."wh_agency_report_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_card_items" ADD CONSTRAINT "wh_agency_card_items_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."wh_agency_report_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_selections" ADD CONSTRAINT "client_selections_client_id_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_selections" ADD CONSTRAINT "client_selections_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selection_packages" ADD CONSTRAINT "selection_packages_client_id_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selection_packages" ADD CONSTRAINT "selection_packages_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_strategies" ADD CONSTRAINT "content_strategies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_runs" ADD CONSTRAINT "content_runs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_runs" ADD CONSTRAINT "content_runs_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "public"."content_strategies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_performance_metrics" ADD CONSTRAINT "client_performance_metrics_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."content_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_performance_metrics" ADD CONSTRAINT "client_performance_metrics_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."content_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_learning" ADD CONSTRAINT "brand_learning_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_limits" ADD CONSTRAINT "generation_limits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_usage" ADD CONSTRAINT "tool_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_media" ADD CONSTRAINT "blog_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD CONSTRAINT "visitor_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_brand_profiles" ADD CONSTRAINT "client_brand_profiles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_overrides" ADD CONSTRAINT "ai_prompt_overrides_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_overrides" ADD CONSTRAINT "ai_prompt_overrides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_brand_assets" ADD CONSTRAINT "client_brand_assets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."content_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_brand_assets" ADD CONSTRAINT "client_brand_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monday_proj_audit_log" ADD CONSTRAINT "monday_proj_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monday_proj_user_profiles" ADD CONSTRAINT "monday_proj_user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_report_events" ADD CONSTRAINT "wh_agency_report_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wh_agency_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_report_events" ADD CONSTRAINT "wh_agency_report_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."wh_agency_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_report_events" ADD CONSTRAINT "wh_agency_report_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."wh_agency_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_client_users" ADD CONSTRAINT "wh_agency_client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wh_agency_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wh_agency_client_users" ADD CONSTRAINT "wh_agency_client_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_types_active" ON "content_types" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_content_types_sort" ON "content_types" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_content_types_type_key" ON "content_types" USING btree ("type_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_videos_optimized_path" ON "videos" USING btree ("optimized_path" text_ops);--> statement-breakpoint
CREATE INDEX "idx_videos_shoot_id" ON "videos" USING btree ("shoot_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_videos_shoot_sequence" ON "videos" USING btree ("shoot_id" uuid_ops,"sequence" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_videos_source_type" ON "videos" USING btree ("source_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shoots_media_type" ON "shoots" USING btree ("media_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_skills_active" ON "ai_skills" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_skills_stage" ON "ai_skills" USING btree ("stage" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_skills_tool" ON "ai_skills" USING btree ("tool_context" text_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_post_tags_post" ON "blog_post_tags" USING btree ("post_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_post_tags_tag" ON "blog_post_tags" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_content_articles_article_number" ON "content_articles" USING btree ("article_number" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_content_articles_client" ON "content_articles" USING btree ("client" text_ops);--> statement-breakpoint
CREATE INDEX "idx_content_articles_created" ON "content_articles" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_content_articles_source_title" ON "content_articles" USING btree ("source_title" text_ops);--> statement-breakpoint
CREATE INDEX "idx_content_articles_status" ON "content_articles" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_prompts_key" ON "ai_prompts" USING btree ("prompt_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_site_config_key" ON "site_config" USING btree ("key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_pricing_packages_identifier" ON "pricing_packages" USING btree ("page_identifier" text_ops);--> statement-breakpoint
CREATE INDEX "idx_pricing_packages_page_type_category" ON "pricing_packages" USING btree ("page_type" text_ops,"category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_content_clients_active" ON "content_clients" USING btree ("is_active" bool_ops,"created_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_content_clients_created_by" ON "content_clients" USING btree ("created_by" uuid_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_content_clients_slug" ON "content_clients" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_client_output_destinations_client" ON "client_output_destinations" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "wh_agency_clients_one_showcase" ON "wh_agency_clients" USING btree ((true) bool_ops) WHERE is_showcase;--> statement-breakpoint
CREATE INDEX "wh_agency_reports_client_status_idx" ON "wh_agency_reports" USING btree ("client_id" date_ops,"status" uuid_ops,"period_start" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_client_input_sources_client" ON "client_input_sources" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_author" ON "blog_posts" USING btree ("author_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_category" ON "blog_posts" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_client_id" ON "blog_posts" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_featured_section_gin" ON "blog_posts" USING gin ("featured_section" jsonb_ops) WHERE (featured_section IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_featured_section_type" ON "blog_posts" USING btree (((featured_section ->> 'type'::text)) text_ops) WHERE (featured_section IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_published_at" ON "blog_posts" USING btree ("published_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_slug" ON "blog_posts" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status" ON "blog_posts" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_title_trgm" ON "blog_posts" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_posts_topic_fingerprint" ON "blog_posts" USING btree ("client_id" uuid_ops,"topic_fingerprint" text_ops) WHERE (topic_fingerprint IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_ingested_created" ON "ingested_articles" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_ingested_status" ON "ingested_articles" USING btree ("client_id" text_ops,"status" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ingested_title_trgm" ON "ingested_articles" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_ingested_topic" ON "ingested_articles" USING btree ("client_id" text_ops,"topic_fingerprint" uuid_ops) WHERE (topic_fingerprint IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ingested_url_hash" ON "ingested_articles" USING btree ("client_id" text_ops,"url_hash" uuid_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_report_kpis_report_idx" ON "wh_agency_report_kpis" USING btree ("report_id" int4_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_report_cards_report_idx" ON "wh_agency_report_cards" USING btree ("report_id" int4_ops,"sort_order" uuid_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_card_stats_card_idx" ON "wh_agency_card_stats" USING btree ("card_id" int4_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_card_segments_card_idx" ON "wh_agency_card_segments" USING btree ("card_id" int4_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_proposal_pending" ON "skill_proposal_history" USING btree ("status" text_ops,"created_at" timestamptz_ops) WHERE ((status)::text = 'pending'::text);--> statement-breakpoint
CREATE INDEX "idx_proposal_rejected" ON "skill_proposal_history" USING btree ("skill_key" text_ops,"status" text_ops) WHERE ((status)::text = 'rejected'::text);--> statement-breakpoint
CREATE INDEX "idx_content_history_client_platform" ON "social_content_history" USING btree ("client_id" uuid_ops,"platform" timestamptz_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_content_history_high_rated" ON "social_content_history" USING btree ("client_id" uuid_ops,"quick_rating_score" int2_ops) WHERE ((quick_rating_score >= 8) AND (auto_injected_to_brand = false));--> statement-breakpoint
CREATE INDEX "idx_content_history_low_rated" ON "social_content_history" USING btree ("client_id" int2_ops,"quick_rating_score" int2_ops) WHERE ((quick_rating_score <= 3) AND (auto_injected_to_brand = false));--> statement-breakpoint
CREATE INDEX "idx_content_history_unprocessed" ON "social_content_history" USING btree ("client_id" uuid_ops,"processed_for_evolution" uuid_ops) WHERE ((processed_for_evolution = false) AND (quick_rating_score IS NOT NULL));--> statement-breakpoint
CREATE INDEX "idx_evolution_log_cycle" ON "skill_evolution_log" USING btree ("evolution_cycle" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_evolution_log_target" ON "skill_evolution_log" USING btree ("target_type" text_ops,"target_key" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cooldown_client_topic" ON "topic_cooldowns" USING btree ("client_id" text_ops,"topic_fingerprint" text_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_card_series_card_idx" ON "wh_agency_card_series" USING btree ("card_id" int4_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_pipeline_runs_client" ON "pipeline_runs" USING btree ("client_id" timestamptz_ops,"started_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "wh_agency_card_items_card_external_idx" ON "wh_agency_card_items" USING btree ("card_id" uuid_ops,"external_id" text_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_card_items_card_idx" ON "wh_agency_card_items" USING btree ("card_id" uuid_ops,"sort_order" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_bot_army_01_country" ON "bot_army_01" USING btree ("country" text_ops);--> statement-breakpoint
CREATE INDEX "idx_bot_army_01_created_at" ON "bot_army_01" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_bot_army_01_platforms" ON "bot_army_01" USING gin ("platforms" array_ops);--> statement-breakpoint
CREATE INDEX "idx_bot_army_01_status" ON "bot_army_01" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_content_strategies_client" ON "content_strategies" USING btree ("client_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_content_runs_client_status" ON "content_runs" USING btree ("client_id" text_ops,"status" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_client" ON "client_performance_metrics" USING btree ("client_id" text_ops,"metric_type" uuid_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_expires" ON "client_performance_metrics" USING btree ("expires_at" timestamptz_ops) WHERE (expires_at IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_platform" ON "client_performance_metrics" USING btree ("platform" text_ops,"metric_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_content_assets_run" ON "content_assets" USING btree ("run_id" text_ops,"asset_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_brand_learning_client" ON "brand_learning" USING btree ("client_id" text_ops,"hook_type" text_ops,"platform" text_ops);--> statement-breakpoint
CREATE INDEX "idx_generation_limits_cost" ON "generation_limits" USING btree ("current_month_spend" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_tool_usage_created" ON "tool_usage" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_tool_usage_daily" ON "tool_usage" USING btree ("tool_slug" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_tool_usage_session" ON "tool_usage" USING btree ("session_id" text_ops,"tool_slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tool_usage_user" ON "tool_usage" USING btree ("user_id" uuid_ops,"tool_slug" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_media_post" ON "blog_media" USING btree ("post_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_visitor_sessions_last_activity" ON "visitor_sessions" USING btree ("last_activity_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_visitor_sessions_session_id" ON "visitor_sessions" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_visitor_sessions_user_id" ON "visitor_sessions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_images_interactions" ON "images" USING btree ("hearts_count" int4_ops,"likes_count" int4_ops,"dislikes_count" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_platform_rules_active" ON "platform_rules" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_platform_rules_key" ON "platform_rules" USING btree ("platform_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_brand_profiles_client" ON "client_brand_profiles" USING btree ("client_id" bool_ops,"is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_brand_profiles_created_by" ON "client_brand_profiles" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_brand_profiles_version" ON "client_brand_profiles" USING btree ("client_id" uuid_ops,"version" int4_ops) WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX "idx_ai_prompt_overrides_client_type" ON "ai_prompt_overrides" USING btree ("client_id" uuid_ops,"content_type" uuid_ops,"is_active" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_prompt_overrides_unique_active" ON "ai_prompt_overrides" USING btree ("client_id" text_ops,"content_type" text_ops) WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX "idx_client_brand_assets_client" ON "client_brand_assets" USING btree ("client_id" int4_ops,"is_active" int4_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_client_brand_assets_type" ON "client_brand_assets" USING btree ("client_id" text_ops,"asset_type" text_ops,"is_active" text_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_city" ON "leads" USING btree ("city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_email" ON "leads" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_tier" ON "leads" USING btree ("tier" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_city" ON "dubailink_registrations" USING btree ("city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_created_at" ON "dubailink_registrations" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_email" ON "dubailink_registrations" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_status" ON "dubailink_registrations" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_monday_proj_snapshots_date" ON "monday_proj_daily_snapshots" USING btree ("snapshot_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_monday_proj_snapshots_person" ON "monday_proj_daily_snapshots" USING btree ("person_id" text_ops,"snapshot_date" text_ops);--> statement-breakpoint
CREATE INDEX "idx_monday_proj_audit_log_created" ON "monday_proj_audit_log" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_monday_proj_audit_log_user" ON "monday_proj_audit_log" USING btree ("user_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_report_events_client_idx" ON "wh_agency_report_events" USING btree ("client_id" timestamptz_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_report_events_report_idx" ON "wh_agency_report_events" USING btree ("report_id" uuid_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_report_events_user_idx" ON "wh_agency_report_events" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_report_events_view_token_idx" ON "wh_agency_report_events" USING btree ("view_token" uuid_ops);--> statement-breakpoint
CREATE INDEX "wh_agency_client_users_user_id_idx" ON "wh_agency_client_users" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE VIEW "public"."pending_feedback_summary" WITH (security_invoker = true) AS (SELECT client_id, platform, tone, count(*) AS feedback_count, avg(quick_rating_score) AS avg_score, min(created_at) AS oldest_feedback, max(created_at) AS newest_feedback FROM social_content_history WHERE processed_for_evolution = false AND quick_rating_score IS NOT NULL GROUP BY client_id, platform, tone);--> statement-breakpoint
CREATE VIEW "public"."content_for_brand_injection" WITH (security_invoker = true) AS (SELECT id, client_id, platform, tone, hook, body, cta, quick_rating_score, CASE WHEN quick_rating_score >= 8 THEN 'positive'::text WHEN quick_rating_score <= 3 THEN 'negative'::text ELSE NULL::text END AS injection_type FROM social_content_history WHERE auto_injected_to_brand = false AND (quick_rating_score >= 8 OR quick_rating_score <= 3));--> statement-breakpoint
CREATE VIEW "public"."v_evolution_pending_feedback" WITH (security_invoker = true) AS (SELECT id, platform, tone, client_id, quick_rating_score AS score, quick_issue AS issue, feedback_tags, feedback_comment, hook, body_header, body, cta, hashtags, original_hook, original_body, was_modified, rating_iteration_count, created_at, rated_at FROM social_content_history h WHERE quick_rating_score IS NOT NULL AND processed_for_evolution = false ORDER BY rated_at DESC);--> statement-breakpoint
CREATE VIEW "public"."v_evolution_stats" WITH (security_invoker = true) AS (SELECT platform, tone, count(*) AS total_rated, avg(quick_rating_score) AS avg_score, count(*) FILTER (WHERE quick_rating_score <= 3) AS poor_count, count(*) FILTER (WHERE quick_rating_score >= 7) AS good_count, array_agg(DISTINCT quick_issue) FILTER (WHERE quick_issue IS NOT NULL) AS issues FROM social_content_history WHERE quick_rating_score IS NOT NULL GROUP BY platform, tone);--> statement-breakpoint
CREATE VIEW "public"."active_visitors" WITH (security_invoker = true) AS (SELECT count(DISTINCT session_id) AS active_count, count(*) AS total_sessions FROM visitor_sessions WHERE last_activity_at > (now() - '00:05:00'::interval) AND is_bot = false);--> statement-breakpoint
CREATE POLICY "content_types_read" ON "content_types" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "content_types_write" ON "content_types" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "videos_read_policy" ON "videos" AS PERMISSIVE FOR SELECT TO public USING ((is_admin_or_staff() OR (auth.uid() IN ( SELECT c.user_id
   FROM (clients c
     JOIN shoots s ON ((s.client_id = c.email)))
  WHERE (s.id = videos.shoot_id))) OR (EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = videos.shoot_id) AND (shoots.is_private = false))))));--> statement-breakpoint
CREATE POLICY "videos_write_policy" ON "videos" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "shoots_read_policy" ON "shoots" AS PERMISSIVE FOR SELECT TO public USING ((is_admin_or_staff() OR (auth.uid() IN ( SELECT clients.user_id
   FROM clients
  WHERE (clients.email = shoots.client_id))) OR (is_private = false)));--> statement-breakpoint
CREATE POLICY "shoots_write_policy" ON "shoots" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "bookings_insert_policy" ON "bookings" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "bookings_read_policy" ON "bookings" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "bookings_write_policy" ON "bookings" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "packages_read_policy" ON "packages" AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR is_admin_or_staff()));--> statement-breakpoint
CREATE POLICY "packages_write_policy" ON "packages" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Clients can view their own shoot previews" ON "shoot_previews" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = shoot_previews.shoot_id) AND (shoots.client_id = (auth.jwt() ->> 'email'::text))))));--> statement-breakpoint
CREATE POLICY "Super admin and staff can manage shoot previews" ON "shoot_previews" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "site_gradients_read_policy" ON "site_gradients" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "site_gradients_write_policy" ON "site_gradients" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_delete" ON "ai_skills" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "unrestricted_insert" ON "ai_skills" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_select" ON "ai_skills" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_update" ON "ai_skills" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Clients can view preview images for their shoots" ON "preview_images" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = preview_images.shoot_id) AND (shoots.client_id = (auth.jwt() ->> 'email'::text))))));--> statement-breakpoint
CREATE POLICY "Super admin and staff can manage all preview images" ON "preview_images" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "profiles_delete_policy" ON "profiles" AS PERMISSIVE FOR DELETE TO public USING (is_super_admin());--> statement-breakpoint
CREATE POLICY "profiles_insert_policy" ON "profiles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "profiles_read_policy" ON "profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "profiles_update_policy" ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Public can read post tags" ON "blog_post_tags" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM blog_posts
  WHERE ((blog_posts.id = blog_post_tags.post_id) AND (blog_posts.status = 'published'::text)))));--> statement-breakpoint
CREATE POLICY "Staff can manage post tags" ON "blog_post_tags" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Authenticated users can delete articles" ON "content_articles" AS PERMISSIVE FOR DELETE TO public USING ((auth.role() = 'authenticated'::text));--> statement-breakpoint
CREATE POLICY "Authenticated users can insert articles" ON "content_articles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Authenticated users can update articles" ON "content_articles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Authenticated users can view all articles" ON "content_articles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Public can view published articles" ON "content_articles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "local_site_assets_read_policy" ON "local_site_assets" AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR is_admin_or_staff()));--> statement-breakpoint
CREATE POLICY "local_site_assets_write_policy" ON "local_site_assets" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Allow read access" ON "ai_prompts" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow update access" ON "ai_prompts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "visitor_daily_stats_staff_read" ON "visitor_daily_stats" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "site_config_read" ON "site_config" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "site_config_write" ON "site_config" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_members_delete" ON "wh_agency_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (wh_agency_is_admin());--> statement-breakpoint
CREATE POLICY "wh_agency_members_insert" ON "wh_agency_members" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_members_select" ON "wh_agency_members" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_members_update" ON "wh_agency_members" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Admin write access for pricing packages" ON "pricing_packages" AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin'::text, 'staff'::text]))) WITH CHECK (((auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin'::text, 'staff'::text])));--> statement-breakpoint
CREATE POLICY "Public read access for pricing packages" ON "pricing_packages" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "content_clients_admin_access" ON "content_clients" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "content_clients_read_for_editors" ON "content_clients" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Service role full access to output destinations" ON "client_output_destinations" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "client_output_destinations_staff" ON "client_output_destinations" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_clients_delete" ON "wh_agency_clients" AS PERMISSIVE FOR DELETE TO "authenticated" USING (wh_agency_is_admin());--> statement-breakpoint
CREATE POLICY "wh_agency_clients_insert" ON "wh_agency_clients" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_clients_select" ON "wh_agency_clients" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_clients_select_showcase" ON "wh_agency_clients" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_clients_update" ON "wh_agency_clients" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_reports_delete" ON "wh_agency_reports" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((wh_agency_is_admin() AND (locked_at IS NULL)));--> statement-breakpoint
CREATE POLICY "wh_agency_reports_insert" ON "wh_agency_reports" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_reports_select" ON "wh_agency_reports" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_reports_select_showcase" ON "wh_agency_reports" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_reports_update" ON "wh_agency_reports" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Service role full access to input sources" ON "client_input_sources" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "client_input_sources_staff" ON "client_input_sources" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Authors can manage their posts" ON "blog_posts" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = author_id));--> statement-breakpoint
CREATE POLICY "Public can read published posts" ON "blog_posts" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Staff can manage all blog content" ON "blog_posts" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Service role full access to ingested articles" ON "ingested_articles" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ingested_articles_staff" ON "ingested_articles" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_report_kpis_select" ON "wh_agency_report_kpis" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((wh_agency_can_read_report(report_id) AND (is_visible OR wh_agency_is_staff())));--> statement-breakpoint
CREATE POLICY "wh_agency_report_kpis_select_showcase" ON "wh_agency_report_kpis" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_report_kpis_write" ON "wh_agency_report_kpis" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_report_cards_select" ON "wh_agency_report_cards" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((wh_agency_can_read_report(report_id) AND (is_visible OR wh_agency_is_staff())));--> statement-breakpoint
CREATE POLICY "wh_agency_report_cards_select_showcase" ON "wh_agency_report_cards" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_report_cards_write" ON "wh_agency_report_cards" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_card_stats_select" ON "wh_agency_card_stats" AS PERMISSIVE FOR SELECT TO "authenticated" USING (wh_agency_can_read_card(card_id));--> statement-breakpoint
CREATE POLICY "wh_agency_card_stats_select_showcase" ON "wh_agency_card_stats" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_card_stats_write" ON "wh_agency_card_stats" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_card_segments_select" ON "wh_agency_card_segments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (wh_agency_can_read_card(card_id));--> statement-breakpoint
CREATE POLICY "wh_agency_card_segments_select_showcase" ON "wh_agency_card_segments" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_card_segments_write" ON "wh_agency_card_segments" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "unrestricted_delete" ON "skill_proposal_history" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "unrestricted_insert" ON "skill_proposal_history" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_select" ON "skill_proposal_history" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_update" ON "skill_proposal_history" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_delete" ON "social_content_history" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "unrestricted_insert" ON "social_content_history" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_select" ON "social_content_history" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "unrestricted_update" ON "social_content_history" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Allow all for service role" ON "skill_evolution_log" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "skill_evolution_log_staff" ON "skill_evolution_log" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Service role full access to topic cooldowns" ON "topic_cooldowns" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "topic_cooldowns_staff" ON "topic_cooldowns" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_card_series_select" ON "wh_agency_card_series" AS PERMISSIVE FOR SELECT TO "authenticated" USING (wh_agency_can_read_card(card_id));--> statement-breakpoint
CREATE POLICY "wh_agency_card_series_select_showcase" ON "wh_agency_card_series" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_card_series_write" ON "wh_agency_card_series" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Service role full access to pipeline runs" ON "pipeline_runs" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "pipeline_runs_staff" ON "pipeline_runs" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_card_items_select" ON "wh_agency_card_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (wh_agency_can_read_card(card_id));--> statement-breakpoint
CREATE POLICY "wh_agency_card_items_select_showcase" ON "wh_agency_card_items" AS PERMISSIVE FOR SELECT TO "anon";--> statement-breakpoint
CREATE POLICY "wh_agency_card_items_write" ON "wh_agency_card_items" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "bot_army_01_svc_access" ON "bot_army_01" AS PERMISSIVE FOR ALL TO "bot_army_01_svc" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "bot_army_service_account_full_access" ON "bot_army_01" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "clients_read_policy" ON "clients" AS PERMISSIVE FOR SELECT TO public USING ((is_admin_or_staff() OR (auth.uid() = user_id)));--> statement-breakpoint
CREATE POLICY "clients_write_policy" ON "clients" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Clients can manage their own selections" ON "client_selections" AS PERMISSIVE FOR ALL TO "authenticated" USING ((client_id = ((auth.jwt() ->> 'sub'::text))::uuid)) WITH CHECK ((client_id = ((auth.jwt() ->> 'sub'::text))::uuid));--> statement-breakpoint
CREATE POLICY "Super admin and staff can manage all selections" ON "client_selections" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Clients can view their own selection packages" ON "selection_packages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((client_id = ((auth.jwt() ->> 'sub'::text))::uuid));--> statement-breakpoint
CREATE POLICY "Super admin and staff can manage all selection packages" ON "selection_packages" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "content_strategies_admin_access" ON "content_strategies" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "content_runs_admin_access" ON "content_runs" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "performance_metrics_admin_access" ON "client_performance_metrics" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "performance_metrics_read_for_editors" ON "client_performance_metrics" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "content_assets_admin_access" ON "content_assets" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "brand_learning_admin_access" ON "brand_learning" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "generation_limits_admin_access" ON "generation_limits" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "Anyone can read tool access tiers" ON "tool_access_tiers" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Staff can manage tool access tiers" ON "tool_access_tiers" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Tool access tiers are viewable by everyone" ON "tool_access_tiers" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Allow tool usage inserts" ON "tool_usage" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Anonymous users can insert tool usage" ON "tool_usage" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view own tool usage" ON "tool_usage" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own tool usage" ON "tool_usage" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Public can read post media" ON "blog_media" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM blog_posts
  WHERE ((blog_posts.id = blog_media.post_id) AND (blog_posts.status = 'published'::text)))));--> statement-breakpoint
CREATE POLICY "Staff can manage post media" ON "blog_media" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Staff can view all subscriptions" ON "subscriptions" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'staff'::text]))))));--> statement-breakpoint
CREATE POLICY "Users can view own subscriptions" ON "subscriptions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own subscriptions" ON "subscriptions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Anyone can view category heroes" ON "category_heroes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Super admin and staff can manage category heroes" ON "category_heroes" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Public can read categories" ON "blog_categories" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "Staff can manage categories" ON "blog_categories" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Public can read tags" ON "blog_tags" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Staff can manage tags" ON "blog_tags" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "visitor_sessions_staff_read" ON "visitor_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "images_read_policy" ON "images" AS PERMISSIVE FOR SELECT TO public USING ((is_admin_or_staff() OR (auth.uid() IN ( SELECT c.user_id
   FROM (clients c
     JOIN shoots s ON ((s.client_id = c.email)))
  WHERE (s.id = images.shoot_id))) OR ((is_private = false) AND (EXISTS ( SELECT 1
   FROM shoots
  WHERE ((shoots.id = images.shoot_id) AND (shoots.is_private = false)))))));--> statement-breakpoint
CREATE POLICY "images_write_policy" ON "images" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "platform_rules_read" ON "platform_rules" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "platform_rules_write" ON "platform_rules" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "brand_profiles_admin_access" ON "client_brand_profiles" AS PERMISSIVE FOR ALL TO public USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = ANY (ARRAY['admin'::text, 'content_manager'::text])));--> statement-breakpoint
CREATE POLICY "brand_profiles_read_for_editors" ON "client_brand_profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "ai_prompt_overrides_staff" ON "ai_prompt_overrides" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "client_brand_assets_staff" ON "client_brand_assets" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());--> statement-breakpoint
CREATE POLICY "bot_army_01_svc_leads_access" ON "leads" AS PERMISSIVE FOR ALL TO "bot_army_01_svc" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "monday_proj_daily_snapshots_read" ON "monday_proj_daily_snapshots" AS PERMISSIVE FOR SELECT TO "authenticated" USING (monday_proj_is_member());--> statement-breakpoint
CREATE POLICY "monday_proj_audit_log_read" ON "monday_proj_audit_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING (monday_proj_is_member());--> statement-breakpoint
CREATE POLICY "Admins can delete person config" ON "monday_proj_person_config" AS PERMISSIVE FOR DELETE TO public USING (monday_proj_is_admin());--> statement-breakpoint
CREATE POLICY "Admins can insert person config" ON "monday_proj_person_config" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can read person config" ON "monday_proj_person_config" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update person config" ON "monday_proj_person_config" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "monday_proj_project_config_insert" ON "monday_proj_project_config" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (monday_proj_is_member());--> statement-breakpoint
CREATE POLICY "monday_proj_project_config_read" ON "monday_proj_project_config" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "monday_proj_project_config_update" ON "monday_proj_project_config" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "monday_proj_task_cache_read" ON "monday_proj_task_cache" AS PERMISSIVE FOR SELECT TO "authenticated" USING (monday_proj_is_member());--> statement-breakpoint
CREATE POLICY "Admins can insert profiles" ON "monday_proj_user_profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK (monday_proj_is_admin());--> statement-breakpoint
CREATE POLICY "Admins can read all profiles" ON "monday_proj_user_profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update all profiles" ON "monday_proj_user_profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can read own profile" ON "monday_proj_user_profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "wh_agency_report_events_insert" ON "wh_agency_report_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((user_id = auth.uid()) AND wh_agency_can_read_report(report_id)));--> statement-breakpoint
CREATE POLICY "wh_agency_report_events_select" ON "wh_agency_report_events" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "wh_agency_client_users_select" ON "wh_agency_client_users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR wh_agency_is_staff()));--> statement-breakpoint
CREATE POLICY "wh_agency_client_users_write" ON "wh_agency_client_users" AS PERMISSIVE FOR ALL TO "authenticated";
*/