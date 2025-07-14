import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  users, clients, shoots, images, packages, analytics, favorites, bookings,
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Shoot, type InsertShoot,
  type Image, type InsertImage,
  type Package, type InsertPackage,
  type Analytics, type InsertAnalytics,
  type Favorite, type InsertFavorite,
  type Booking, type InsertBooking
} from "@shared/schema";
import type { IStorage } from "./storage";

export class PostgreSQLStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async getClientBySlug(slug: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
    return result[0];
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
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

  // Shoots
  async getShoot(id: number): Promise<Shoot | undefined> {
    const result = await db.select().from(shoots).where(eq(shoots.id, id)).limit(1);
    return result[0];
  }

  async getShootsByClient(clientId: number): Promise<Shoot[]> {
    return db.select().from(shoots).where(eq(shoots.clientId, clientId)).orderBy(desc(shoots.shootDate));
  }

  async getPublicShoots(): Promise<Shoot[]> {
    return db.select().from(shoots).where(eq(shoots.isPrivate, false)).orderBy(desc(shoots.shootDate));
  }

  async createShoot(shoot: InsertShoot): Promise<Shoot> {
    const result = await db.insert(shoots).values(shoot).returning();
    return result[0];
  }

  async updateShoot(id: number, updates: Partial<InsertShoot>): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(updates).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  async deleteShoot(id: number): Promise<boolean> {
    const result = await db.delete(shoots).where(eq(shoots.id, id));
    return result.rowCount > 0;
  }

  // Images
  async getImage(id: number): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
    return result[0];
  }

  async getImagesByShoot(shootId: number): Promise<Image[]> {
    return db.select().from(images).where(eq(images.shootId, shootId)).orderBy(images.uploadOrder);
  }

  async createImage(image: InsertImage): Promise<Image> {
    const result = await db.insert(images).values(image).returning();
    return result[0];
  }

  async updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const result = await db.update(images).set(updates).where(eq(images.id, id)).returning();
    return result[0];
  }

  async deleteImage(id: number): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return result.rowCount > 0;
  }

  // Packages
  async getPackages(): Promise<Package[]> {
    return db.select().from(packages).orderBy(packages.price);
  }

  async getPackagesByCategory(category: string): Promise<Package[]> {
    return db.select().from(packages).where(eq(packages.category, category)).orderBy(packages.price);
  }

  async createPackage(pkg: InsertPackage): Promise<Package> {
    const result = await db.insert(packages).values(pkg).returning();
    return result[0];
  }

  // Analytics
  async createAnalytics(analytics: InsertAnalytics): Promise<Analytics> {
    const result = await db.insert(analytics).values(analytics).returning();
    return result[0];
  }

  async getAnalyticsByUser(userId: number): Promise<Analytics[]> {
    return db.select().from(analytics).where(eq(analytics.userId, userId)).orderBy(desc(analytics.timestamp));
  }

  // Favorites
  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const result = await db.insert(favorites).values(favorite).returning();
    return result[0];
  }

  async deleteFavorite(userId: number, imageId: number): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(eq(favorites.userId, userId) && eq(favorites.imageId, imageId));
    return result.rowCount > 0;
  }

  // Bookings
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return result[0];
  }
}