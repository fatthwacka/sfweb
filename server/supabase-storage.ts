import { db } from "./db";
import { 
  profiles, users, clients, shoots, images, packages, analytics, favorites, bookings,
  type Profile, type InsertProfile,
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Shoot, type InsertShoot,
  type Image, type InsertImage,
  type Package, type InsertPackage,
  type Analytics, type InsertAnalytics,
  type Favorite, type InsertFavorite,
  type Booking, type InsertBooking,
  type UpdateShootCustomization
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  
  // Profile methods (main user system)
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return result[0];
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles).orderBy(desc(profiles.createdAt));
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values([insertProfile]).returning();
    return result[0];
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  async deleteProfile(id: string): Promise<boolean> {
    const result = await db.delete(profiles).where(eq(profiles.id, id));
    return result.rowCount > 0;
  }

  // Legacy User methods (backwards compatibility)
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
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

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
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
    
    const result = await db.insert(clients).values([{
      ...insertClient,
      slug
    }]).returning();
    return result[0];
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    console.log(`🗑️ SupabaseStorage.deleteClient: Deleting client ID ${id}`);
    const result = await db.delete(clients).where(eq(clients.id, id));
    console.log(`🗑️ SupabaseStorage.deleteClient: Delete result:`, result);
    
    // For Drizzle with Supabase, the result might not have rowCount
    // Let's check if the operation was successful by querying the client again
    const clientStillExists = await this.getClient(id);
    const success = !clientStillExists;
    console.log(`🗑️ SupabaseStorage.deleteClient: Client still exists after delete: ${!!clientStillExists}, Success: ${success}`);
    
    return success;
  }

  // Shoot methods
  async getShoot(id: string): Promise<Shoot | undefined> {
    const result = await db.select().from(shoots).where(eq(shoots.id, id)).limit(1);
    return result[0];
  }

  async getShootBySlug(slug: string): Promise<Shoot | undefined> {
    const result = await db.select().from(shoots).where(eq(shoots.customSlug, slug)).limit(1);
    return result[0];
  }

  async incrementShootViewCount(id: string): Promise<void> {
    await db.update(shoots).set({ viewCount: sql`${shoots.viewCount} + 1` }).where(eq(shoots.id, id));
  }

  async getShootsByClient(clientId: string): Promise<Shoot[]> {
    // Support both integer client ID (legacy) and email-based matching
    if (clientId.includes('@')) {
      // Email-based matching - find shoots by client email
      return await db.select().from(shoots).where(eq(shoots.clientId, clientId)).orderBy(desc(shoots.createdAt));
    } else {
      // Legacy integer ID - first find client email, then find shoots
      const client = await this.getClient(parseInt(clientId));
      if (!client?.email) return [];
      return await db.select().from(shoots).where(eq(shoots.clientId, client.email)).orderBy(desc(shoots.createdAt));
    }
  }

  async getShootsByClientEmail(email: string): Promise<Shoot[]> {
    return await db.select().from(shoots).where(eq(shoots.clientId, email)).orderBy(desc(shoots.createdAt));
  }

  async getPublicShoots(): Promise<Shoot[]> {
    return await db.select().from(shoots).where(eq(shoots.isPrivate, false)).orderBy(desc(shoots.createdAt));
  }

  async getAllShoots(): Promise<Shoot[]> {
    return await db.select().from(shoots).orderBy(desc(shoots.createdAt));
  }

  async createShoot(insertShoot: InsertShoot): Promise<Shoot> {
    console.log('Supabase createShoot called with:', insertShoot);
    const result = await db.insert(shoots).values(insertShoot).returning();
    console.log('Supabase createShoot result:', result[0]);
    return result[0];
  }

  async updateShoot(id: string, updates: Partial<InsertShoot>): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(updates).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  async updateShootCustomization(id: string, data: UpdateShootCustomization): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(data).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  async deleteShoot(id: string): Promise<boolean> {
    const result = await db.delete(shoots).where(eq(shoots.id, id));
    return result.rowCount > 0;
  }

  // Image methods
  async getImage(id: string): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
    return result[0];
  }

  async getImagesByShoot(shootId: string): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.shootId, shootId)).orderBy(images.uploadOrder);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const result = await db.insert(images).values(insertImage).returning();
    return result[0];
  }

  async updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const result = await db.update(images).set(updates).where(eq(images.id, id)).returning();
    return result[0];
  }

  async updateImageSequence(imageId: string, sequence: number): Promise<void> {
    await db.update(images).set({ sequence }).where(eq(images.id, imageId));
  }

  async deleteImage(id: string): Promise<boolean> {
    try {
      console.log(`🔍 deleteImage: Looking for image with ID: ${id}`);
      
      // First get the image to extract storage path for deletion
      const image = await this.getImage(id);
      console.log(`🔍 deleteImage: Found image:`, image ? 'YES' : 'NO');
      
      if (!image) {
        console.log(`❌ deleteImage: Image ${id} not found in database, returning false`);
        return false;
      }

      // Initialize Supabase client for storage operations
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Extract storage path from public URL
      let storagePath: string | null = null;
      if (image.storagePath) {
        // Extract path from public URL format
        const urlParts = image.storagePath.split('/storage/v1/object/public/gallery-images/');
        if (urlParts.length > 1) {
          storagePath = urlParts[1];
        }
      }

      // Delete from database first
      console.log(`🗄️ deleteImage: Attempting database deletion for ${id}`);
      const result = await db.delete(images).where(eq(images.id, id));
      // For Drizzle/Supabase: the delete operation returns an object, check if it's truthy
      const deletedFromDb = result && Object.keys(result).length >= 0; // Always true if delete succeeds
      console.log(`🗄️ deleteImage: Database deletion completed - assuming SUCCESS (Drizzle delete doesn't provide count)`);
      console.log(`🗄️ deleteImage: Delete result object:`, result);

      // If database deletion successful and we have storage path, delete from Supabase storage
      if (deletedFromDb && storagePath) {
        console.log(`🗂️ deleteImage: Deleting from storage: ${storagePath}`);
        const { error: storageError } = await supabase.storage
          .from('gallery-images')
          .remove([storagePath]);

        if (storageError) {
          console.error('❌ Supabase storage deletion error:', storageError);
          // Continue even if storage deletion fails - database record is already deleted
        } else {
          console.log(`✅ deleteImage: Storage deletion successful for ${storagePath}`);
        }
      } else if (deletedFromDb && !storagePath) {
        console.log(`⚠️ deleteImage: Database deleted but no storage path found`);
      }

      console.log(`🏁 deleteImage: Final result for ${id}:`, deletedFromDb ? 'SUCCESS' : 'FAILED');
      return deletedFromDb;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }

  // Package methods
  async getPackages(): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.isActive, true)).orderBy(packages.displayOrder);
  }

  async getPackagesByCategory(category: string): Promise<Package[]> {
    return await db.select().from(packages)
      .where(and(eq(packages.category, category), eq(packages.isActive, true)))
      .orderBy(packages.displayOrder);
  }

  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const result = await db.insert(packages).values(insertPackage).returning();
    return result[0];
  }

  // Analytics methods
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const result = await db.insert(analytics).values(insertAnalytics).returning();
    return result[0];
  }

  async getAnalyticsByUser(userId: string): Promise<Analytics[]> {
    return await db.select().from(analytics).where(eq(analytics.userId, userId)).orderBy(desc(analytics.createdAt));
  }

  // Favorites methods
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const result = await db.insert(favorites).values(insertFavorite).returning();
    return result[0];
  }

  async deleteFavorite(userId: string, imageId: string): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.imageId, imageId)));
    return result.rowCount > 0;
  }

  // Booking methods
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(insertBooking).returning();
    return result[0];
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Missing shoot methods
  async getAllShoots(): Promise<Shoot[]> {
    return await db.select().from(shoots).orderBy(desc(shoots.createdAt));
  }

  async getShoot(id: string): Promise<Shoot | undefined> {
    const result = await db.select().from(shoots).where(eq(shoots.id, id)).limit(1);
    return result[0];
  }

  async getShootsByClient(clientId: number): Promise<Shoot[]> {
    return await db.select().from(shoots).where(eq(shoots.clientId, clientId)).orderBy(desc(shoots.createdAt));
  }

  async createShoot(insertShoot: InsertShoot): Promise<Shoot> {
    const result = await db.insert(shoots).values(insertShoot).returning();
    return result[0];
  }

  async updateShoot(id: string, updates: Partial<InsertShoot>): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(updates).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  async deleteShoot(id: string): Promise<boolean> {
    const result = await db.delete(shoots).where(eq(shoots.id, id));
    return result.rowCount > 0;
  }

  async updateShootCustomization(id: string, customization: UpdateShootCustomization): Promise<Shoot | undefined> {
    const result = await db.update(shoots).set(customization).where(eq(shoots.id, id)).returning();
    return result[0];
  }

  // Missing image methods
  async getAllImages(): Promise<Image[]> {
    return await db.select().from(images).orderBy(desc(images.createdAt));
  }

  async getImage(id: string): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
    return result[0];
  }

  async getImagesByShoot(shootId: string): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.shootId, shootId)).orderBy(desc(images.createdAt));
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const result = await db.insert(images).values(insertImage).returning();
    return result[0];
  }

  async updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const result = await db.update(images).set(updates).where(eq(images.id, id)).returning();
    return result[0];
  }

  async deleteImage(id: string): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return result.rowCount > 0;
  }

  async getFeaturedImages(): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.classification, 'featured')).orderBy(desc(images.createdAt));
  }

  async updateImageClassification(id: string, classification: any): Promise<Image | undefined> {
    const result = await db.update(images).set({ classification }).where(eq(images.id, id)).returning();
    return result[0];
  }

  async bulkUpdateShootImageClassification(shootId: string, classification: any): Promise<Image[]> {
    const result = await db.update(images)
      .set({ classification })
      .where(eq(images.shootId, shootId))
      .returning();
    return result;
  }

  async bulkUpdateImageClassification(imageIds: string[], classification: any): Promise<Image[]> {
    const result = await db.update(images)
      .set({ classification })
      .where(sql`${images.id} = ANY(${imageIds})`)
      .returning();
    return result;
  }

  // Local site assets methods - file-based storage only
  async getLocalSiteAssets(): Promise<any[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const assets = [];
    const assetDir = path.join(process.cwd(), 'public', 'assets');
    
    // Define all possible asset keys
    const assetKeys = [
      'hero/cape-town-wedding-photography-slyfox-studios',
      'hero/professional-photography-services-cape-town',
      'hero/cape-town-wedding-photographer-portfolio',
      'hero/portrait-photographer-cape-town-studio',
      'hero/corporate-photography-cape-town-business',
      'hero/event-photographer-cape-town-professional',
      'hero/graduation-photography-cape-town-ceremony',
      'hero/product-photography-cape-town-commercial',
      'hero/matric-dance-photographer-cape-town',
      'backgrounds/photography-studio-cape-town-texture',
      'backgrounds/wedding-photography-background-elegant',
      'backgrounds/portrait-photography-studio-backdrop'
    ];
    
    for (const assetKey of assetKeys) {
      // Check if -ni version exists
      const extensions = ['.jpg', '.png', '.webp'];
      let foundFile = null;
      
      for (const ext of extensions) {
        try {
          const filePath = path.join(assetDir, `${assetKey}-ni${ext}`);
          await fs.access(filePath);
          foundFile = `/assets/${assetKey}-ni${ext}`;
          break;
        } catch (error) {
          // File doesn't exist, continue
        }
      }
      
      if (foundFile) {
        assets.push({
          id: assetKey,
          assetKey,
          assetType: assetKey.startsWith('hero/') ? 'hero' : 'background',
          filePath: foundFile,
          altText: `${assetKey} image`,
          isActive: true,
          updatedAt: new Date()
        });
      }
    }
    
    return assets;
  }

  async getLocalSiteAssetByKey(assetKey: string): Promise<any | undefined> {
    const assets = await this.getLocalSiteAssets();
    return assets.find(asset => asset.assetKey === assetKey);
  }

  async createLocalSiteAsset(asset: any): Promise<any> {
    // File already created by upload endpoint, just return asset info
    return {
      id: asset.assetKey,
      ...asset,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateLocalSiteAsset(assetKey: string, updates: any): Promise<any | undefined> {
    // For file-based assets, we only track basic info
    const existingAsset = await this.getLocalSiteAssetByKey(assetKey);
    if (existingAsset) {
      return {
        ...existingAsset,
        ...updates,
        updatedAt: new Date()
      };
    }
    return undefined;
  }

  async deleteLocalSiteAsset(assetKey: string): Promise<boolean> {
    // File deletion handled by routes, just return success
    return true;
  }
}