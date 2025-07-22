import { db } from "./db";
import { 
  users, clients, shoots, images, packages, bookings, analytics,
  type User, type Client, type Shoot, type Image, type Package, type Booking, type Analytics,
  type InsertUser, type InsertClient, type InsertShoot, type InsertImage, 
  type InsertPackage, type InsertBooking, type InsertAnalytics,
  type UpdateImageSequence, type UpdateAlbumCover, type UpdateShootDetails, type UpdateShootCustomization
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async getClientBySlug(slug: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
    return result[0];
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Generate slug from name
    const slug = insertClient.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const result = await db.insert(clients).values({
      ...insertClient,
      slug
    }).returning();
    return result[0];
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  // Shoot methods
  async getShoot(id: number): Promise<Shoot | undefined> {
    const result = await db.select().from(shoots).where(eq(shoots.id, id)).limit(1);
    return result[0];
  }

  async getShootsByClient(clientId: number): Promise<Shoot[]> {
    return await db.select().from(shoots).where(eq(shoots.clientId, clientId)).orderBy(desc(shoots.createdAt));
  }

  async getPublicShoots(): Promise<Shoot[]> {
    return await db.select().from(shoots).where(eq(shoots.isPrivate, false)).orderBy(desc(shoots.createdAt));
  }

  async createShoot(insertShoot: InsertShoot): Promise<Shoot> {
    const result = await db.insert(shoots).values({
      ...insertShoot,
      isPrivate: insertShoot.isPrivate ?? false,
      viewCount: 0
    }).returning();
    return result[0];
  }

  async updateShoot(id: number, updates: Partial<InsertShoot>): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(updates).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  async updateShootCustomization(id: number, data: UpdateShootCustomization): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(data).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  async deleteShoot(id: number): Promise<boolean> {
    const result = await db.delete(shoots).where(eq(shoots.id, id));
    return result.rowCount > 0;
  }

  // Image methods
  async getImage(id: number): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
    return result[0];
  }

  async getImagesByShoot(shootId: number): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.shootId, shootId)).orderBy(images.sequence);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const result = await db.insert(images).values({
      ...insertImage,
      isPrivate: insertImage.isPrivate ?? false,
      downloadCount: 0
    }).returning();
    return result[0];
  }

  async updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const result = await db.update(images).set(updates).where(eq(images.id, id)).returning();
    return result[0];
  }

  async updateImageSequence(data: UpdateImageSequence): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        for (const item of data.updates) {
          await tx.update(images)
            .set({ sequence: item.sequence })
            .where(eq(images.id, item.id));
        }
      });
      return true;
    } catch (error) {
      console.error("Error updating image sequences:", error);
      return false;
    }
  }

  async updateAlbumCover(data: UpdateAlbumCover): Promise<Shoot | undefined> {
    const result = await db.update(shoots)
      .set({ albumCoverId: data.imageId })
      .where(eq(shoots.id, data.shootId))
      .returning();
    return result[0];
  }

  async deleteImage(id: number): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return result.rowCount > 0;
  }

  // Package methods
  async getPackage(id: number): Promise<Package | undefined> {
    const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
    return result[0];
  }

  async getPackages(): Promise<Package[]> {
    return await db.select().from(packages).orderBy(packages.order, packages.name);
  }

  async getPackagesByCategory(category: string): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.category, category)).orderBy(packages.order, packages.name);
  }

  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const result = await db.insert(packages).values(insertPackage).returning();
    return result[0];
  }

  async updatePackage(id: number, updates: Partial<InsertPackage>): Promise<Package | undefined> {
    const result = await db.update(packages).set(updates).where(eq(packages.id, id)).returning();
    return result[0];
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db.delete(packages).where(eq(packages.id, id));
    return result.rowCount > 0;
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(insertBooking).returning();
    return result[0];
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  async deleteBooking(id: number): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount > 0;
  }

  // Analytics methods
  async getAnalytics(id: number): Promise<Analytics | undefined> {
    const result = await db.select().from(analytics).where(eq(analytics.id, id)).limit(1);
    return result[0];
  }

  async getAnalyticsByShoot(shootId: number): Promise<Analytics[]> {
    return await db.select().from(analytics).where(eq(analytics.shootId, shootId)).orderBy(desc(analytics.timestamp));
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const result = await db.insert(analytics).values(insertAnalytics).returning();
    return result[0];
  }

  async deleteAnalytics(id: number): Promise<boolean> {
    const result = await db.delete(analytics).where(eq(analytics.id, id));
    return result.rowCount > 0;
  }
}