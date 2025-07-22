import { pgTable, text, serial, integer, boolean, timestamp, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // "staff" or "client"
  profileImage: text("profile_image"),
  bannerImage: text("banner_image"),
  themePreference: text("theme_preference").default("dark"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shoots = pgTable("shoots", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  shootType: text("shoot_type").notNull(), // Wedding, Portrait, Corporate, etc.
  shootDate: timestamp("shoot_date"),
  location: text("location"),
  notes: text("notes"),
  isPrivate: boolean("is_private").default(false).notNull(),
  customSlug: text("custom_slug").notNull().unique(),
  customTitle: text("custom_title"),
  albumCoverId: integer("album_cover_id"),
  seoTags: text("seo_tags"),
  viewCount: integer("view_count").default(0).notNull(),
  // Gallery customization settings
  backgroundColor: text("background_color").default("white").notNull(), // "white", "black", "dark-grey"
  layoutType: text("layout_type").default("masonry").notNull(), // "masonry", "square"
  borderRadius: integer("border_radius").default(8).notNull(), // 0-30
  imagePadding: integer("image_padding").default(4).notNull(), // 1-30 pixels
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  shootId: integer("shoot_id").references(() => shoots.id).notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  isPrivate: boolean("is_private").default(false).notNull(),
  sequence: integer("sequence").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  shootId: integer("shoot_id").references(() => shoots.id),
  actionType: text("action_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  imageId: integer("image_id").references(() => images.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  packageId: integer("package_id").references(() => packages.id),
  status: text("status").default("pending").notNull(),
  inquiryData: text("inquiry_data"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  slug: true,
});

export const insertShootSchema = createInsertSchema(shoots).omit({
  id: true,
  createdAt: true,
  viewCount: true,
}).extend({
  shootDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
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
  albumCoverId: true,
  backgroundColor: true,
  layoutType: true,
  borderRadius: true,
  imagePadding: true,
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
