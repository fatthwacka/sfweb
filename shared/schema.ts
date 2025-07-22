import { pgTable, text, serial, integer, boolean, timestamp, uuid, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // "super_admin", "staff", or "client"
  profileImage: text("profile_image"),
  bannerImage: text("banner_image"),
  themePreference: text("theme_preference").default("dark"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  email: text("email"),
  userId: uuid("user_id"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const shoots = pgTable("shoots", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false).notNull(),
  bannerImageId: uuid("banner_image_id"),
  seoTags: text("seo_tags").array(),
  viewCount: integer("view_count").default(0).notNull(),
  createdBy: uuid("created_by").notNull(),
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
  downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: text("features").array().notNull(),
  category: text("category").notNull(), // "photography" or "videography"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  shootId: uuid("shoot_id").references(() => shoots.id),
  actionType: text("action_type").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).default(sql`now()`),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  imageId: uuid("image_id").references(() => images.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id),
  packageId: integer("package_id").references(() => packages.id),
  status: text("status").default("pending").notNull(),
  inquiryData: text("inquiry_data"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

// Insert schemas
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
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
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
export const updateShootCustomizationSchema = createInsertSchema(shoots).pick({
  bannerImageId: true,
});

// Types
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
