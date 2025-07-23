import { pgTable, text, serial, integer, boolean, timestamp, uuid, decimal, varchar, smallint, jsonb, inet } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main user profiles table (this is what we'll use for our app users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull().default("client"), // "super_admin", "staff", or "client"
  profileImageUrl: text("profile_image_url"),
  bannerImageUrl: text("banner_image_url"),
  themePreference: text("theme_preference").default("light"),
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
  userId: uuid("user_id").references(() => profiles.id),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const shoots = pgTable("shoots", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: text("client_id").notNull(), // Stores client email for email-based matching
  title: text("title").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false).notNull(),
  bannerImageId: uuid("banner_image_id"),
  seoTags: text("seo_tags").array(),
  viewCount: integer("view_count").default(0).notNull(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  customSlug: text("custom_slug"),
  customTitle: text("custom_title"),
  gallerySettings: jsonb("gallery_settings"),
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
});

export const insertShootSchema = createInsertSchema(shoots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  createdBy: true,
});

export const insertImageSchema = createInsertSchema(images).omit({
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

// Gallery customization schema for updating shoot settings
export const updateShootCustomizationSchema = z.object({
  customSlug: z.string().optional(),
  bannerImageId: z.string().optional(),
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

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

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
