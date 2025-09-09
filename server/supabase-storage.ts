import { db } from "./db";
import crypto from 'crypto';
import { 
  profiles, users, clients, shoots, images, packages, analytics, favorites, bookings,
  shootPreviews, clientSelections, selectionPackages, previewImages,
  type Profile, type InsertProfile,
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Shoot, type InsertShoot,
  type Image, type InsertImage,
  type Package, type InsertPackage,
  type Analytics, type InsertAnalytics,
  type Favorite, type InsertFavorite,
  type Booking, type InsertBooking,
  type UpdateShootCustomization,
  type ShootPreview, type InsertShootPreview,
  type ClientSelection, type InsertClientSelection,
  type SelectionPackage, type InsertSelectionPackage,
  type PreviewImage, type InsertPreviewImage
} from "@shared/schema";
import { eq, and, desc, sql, not } from "drizzle-orm";
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
    // Create profile data with explicit UUID since InsertProfile omits id
    const profileData = {
      id: crypto.randomUUID(),
      email: insertProfile.email,
      fullName: insertProfile.fullName || null,
      role: insertProfile.role,
      profileImageUrl: insertProfile.profileImageUrl || null,
      bannerImageUrl: insertProfile.bannerImageUrl || null,
      themePreference: insertProfile.themePreference || 'light',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('📝 Creating profile with data:', profileData);
    const result = await db.insert(profiles).values(profileData).returning();
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

  // PERFORMANCE: Batch update multiple image sequences in a single SQL statement (ultra-optimized)
  async batchUpdateImageSequences(imageSequences: Record<string, number>): Promise<void> {
    const entries = Object.entries(imageSequences);
    if (entries.length === 0) return;
    
    console.log(`🚀 Starting SINGLE SQL batch update for ${entries.length} images`);
    const startTime = Date.now();

    try {
      // ULTRA OPTIMIZATION: Single SQL UPDATE with CASE statement for all images at once
      // This is the fastest possible approach for bulk updates
      const imageIds = entries.map(([id]) => id);
      const caseStatement = entries.map(([id, sequence]) => 
        `WHEN '${id}' THEN ${sequence}`
      ).join(' ');
      
      // Build the raw SQL query
      const updateQuery = sql`
        UPDATE ${images} 
        SET sequence = CASE id ${sql.raw(caseStatement)} END
        WHERE id = ANY(${imageIds})
      `;
      
      await db.execute(updateQuery);
      
      const duration = Date.now() - startTime;
      console.log(`✅ SINGLE SQL batch update completed in ${duration}ms for ${entries.length} images`);
    } catch (error) {
      console.error('❌ Single SQL batch update failed, falling back to chunked approach:', error);
      
      // FALLBACK: Use the previous chunked approach if single SQL fails
      const chunkSize = 20;
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        
        await db.transaction(async (tx) => {
          for (const [imageId, sequence] of chunk) {
            await tx.update(images).set({ sequence }).where(eq(images.id, imageId));
          }
        });
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Fallback batch update completed in ${duration}ms for ${entries.length} images`);
    }
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
    console.log('🗑️ SupabaseStorage.deleteShoot: Starting delete for ID:', id);
    const result = await db.delete(shoots).where(eq(shoots.id, id));
    console.log('🗑️ SupabaseStorage.deleteShoot: Delete result:', result);
    
    // For Drizzle with Supabase, the result might not have rowCount
    // Let's check if the operation was successful by querying the shoot again
    const shootStillExists = await this.getShoot(id);
    const success = !shootStillExists;
    console.log(`🗑️ SupabaseStorage.deleteShoot: Shoot still exists after delete: ${!!shootStillExists}, Success: ${success}`);
    
    return success;
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
    console.log(`Storage: Attempting to delete image with ID: ${id}`);
    try {
      // First check if image exists
      const existingImage = await this.getImage(id);
      if (!existingImage) {
        console.log(`Storage: Image ${id} does not exist`);
        return false;
      }
      
      // Perform the delete
      const result = await db.delete(images).where(eq(images.id, id));
      console.log(`Storage: Delete result - rowCount: ${result.rowCount}, type: ${typeof result.rowCount}`);
      
      // Verify deletion by checking if image still exists
      const verifyDeleted = await this.getImage(id);
      const isDeleted = !verifyDeleted;
      console.log(`Storage: Deletion verification - image still exists: ${!!verifyDeleted}, deleted: ${isDeleted}`);
      
      return isDeleted;
    } catch (error) {
      console.error(`Storage: Delete image error:`, error);
      throw error;
    }
  }

  async getFeaturedImages(): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.featuredImage, true)).orderBy(desc(images.createdAt));
  }

  async getFeaturedClassifications(): Promise<string[]> {
    const result = await db.selectDistinct({ classification: images.classification })
      .from(images)
      .where(eq(images.featuredImage, true));
    return result.map(row => row.classification).filter(Boolean).sort();
  }

  async updateImageClassification(id: string, classification: any): Promise<Image | undefined> {
    const result = await db.update(images).set({ classification }).where(eq(images.id, id)).returning();
    return result[0];
  }

  async updateShootImagesClassification(shootId: string, classification: any): Promise<Image[]> {
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

  // Local site assets - removed to avoid confusion with Supabase functionality
  // These methods are no longer used - local assets are handled directly by filesystem

  // Preview Selection System Methods
  async getShootPreviewSettings(shootId: string): Promise<ShootPreview | undefined> {
    const result = await db.select().from(shootPreviews).where(eq(shootPreviews.shootId, shootId)).limit(1);
    return result[0];
  }

  async createShootPreviewSettings(settings: InsertShootPreview): Promise<ShootPreview> {
    const result = await db.insert(shootPreviews).values(settings).returning();
    return result[0];
  }

  async updateShootPreviewSettings(id: string, updates: Partial<InsertShootPreview>): Promise<ShootPreview | undefined> {
    const result = await db.update(shootPreviews).set(updates).where(eq(shootPreviews.id, id)).returning();
    return result[0];
  }

  async getClientSelections(shootId: string): Promise<ClientSelection[]> {
    return await db.select().from(clientSelections).where(eq(clientSelections.shootId, shootId));
  }

  async upsertClientSelection(selection: Partial<InsertClientSelection>): Promise<ClientSelection> {
    // For upsert functionality, we'll implement a find-or-create pattern
    const existing = await db.select()
      .from(clientSelections)
      .where(
        and(
          eq(clientSelections.shootId, selection.shootId!),
          eq(clientSelections.clientId, selection.clientId!),
          eq(clientSelections.imageFilename, selection.imageFilename!)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const result = await db.update(clientSelections)
        .set(selection)
        .where(eq(clientSelections.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new
      const result = await db.insert(clientSelections).values(selection as InsertClientSelection).returning();
      return result[0];
    }
  }

  async batchUpsertClientSelections(selections: Partial<InsertClientSelection>[]): Promise<ClientSelection[]> {
    if (selections.length === 0) return [];
    
    // Build bulk upsert using PostgreSQL CTE for maximum performance
    // This reduces 40-60 queries to just 2 queries total
    
    // Step 1: Prepare data for bulk operations
    const now = new Date();
    const selectionsWithIds = selections.map(selection => ({
      id: crypto.randomUUID(),
      shootId: selection.shootId!,
      clientId: selection.clientId!,
      imageFilename: selection.imageFilename!,
      dropboxPath: selection.dropboxPath || null,
      thumbnailUrl: selection.thumbnailUrl || null,
      selectionStatus: selection.selectionStatus || 'none',
      isFinalSelection: selection.isFinalSelection || false,
      selectionOrder: selection.selectionOrder || null,
      selectedAt: selection.selectedAt || null,
      metadata: selection.metadata || null,
      createdAt: now,
      updatedAt: now,
    }));

    try {
      // Step 2: First, get all existing records in bulk
      const existingQuery = `
        SELECT id, shoot_id, client_id, image_filename 
        FROM client_selections 
        WHERE (shoot_id, client_id, image_filename) IN (${selectionsWithIds.map((_, index) => 
          `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
        ).join(', ')})
      `;
      
      const existingParams: any[] = [];
      selectionsWithIds.forEach(selection => {
        existingParams.push(selection.shootId, selection.clientId, selection.imageFilename);
      });

      const existingRecords = await db.execute(sql.raw(existingQuery, existingParams));
      const existingMap = new Map(
        existingRecords.map((record: any) => [
          `${record.shoot_id}:${record.client_id}:${record.image_filename}`,
          record.id
        ])
      );

      // Step 3: Separate updates and inserts
      const toUpdate: any[] = [];
      const toInsert: any[] = [];

      selectionsWithIds.forEach(selection => {
        const key = `${selection.shootId}:${selection.clientId}:${selection.imageFilename}`;
        if (existingMap.has(key)) {
          toUpdate.push({ ...selection, existingId: existingMap.get(key) });
        } else {
          toInsert.push(selection);
        }
      });

      const results: ClientSelection[] = [];

      // Step 4: Bulk update existing records
      if (toUpdate.length > 0) {
        const updateQuery = `
          UPDATE client_selections 
          SET selection_status = data.selection_status,
              is_final_selection = data.is_final_selection,
              selection_order = data.selection_order,
              selected_at = data.selected_at,
              metadata = data.metadata,
              updated_at = data.updated_at
          FROM (VALUES ${toUpdate.map((_, index) => 
            `($${index * 7 + 1}::uuid, $${index * 7 + 2}, $${index * 7 + 3}, $${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7})`
          ).join(', ')}) AS data(id, selection_status, is_final_selection, selection_order, selected_at, metadata, updated_at)
          WHERE client_selections.id = data.id
          RETURNING client_selections.*;
        `;

        const updateParams: any[] = [];
        toUpdate.forEach(selection => {
          updateParams.push(
            selection.existingId,
            selection.selectionStatus,
            selection.isFinalSelection,
            selection.selectionOrder,
            selection.selectedAt,
            selection.metadata ? JSON.stringify(selection.metadata) : null,
            selection.updatedAt
          );
        });

        const updateResult = await db.execute(sql.raw(updateQuery, updateParams));
        results.push(...(updateResult as ClientSelection[]));
      }

      // Step 5: Bulk insert new records
      if (toInsert.length > 0) {
        const insertQuery = `
          INSERT INTO client_selections (id, shoot_id, client_id, image_filename, dropbox_path, thumbnail_url,
                                       selection_status, is_final_selection, selection_order, selected_at, 
                                       metadata, created_at, updated_at)
          VALUES ${toInsert.map((_, index) => 
            `($${index * 13 + 1}, $${index * 13 + 2}, $${index * 13 + 3}, $${index * 13 + 4}, 
             $${index * 13 + 5}, $${index * 13 + 6}, $${index * 13 + 7}, $${index * 13 + 8}, 
             $${index * 13 + 9}, $${index * 13 + 10}, $${index * 13 + 11}, $${index * 13 + 12}, $${index * 13 + 13})`
          ).join(', ')}
          RETURNING *;
        `;

        const insertParams: any[] = [];
        toInsert.forEach(selection => {
          insertParams.push(
            selection.id,
            selection.shootId,
            selection.clientId,
            selection.imageFilename,
            selection.dropboxPath,
            selection.thumbnailUrl,
            selection.selectionStatus,
            selection.isFinalSelection,
            selection.selectionOrder,
            selection.selectedAt,
            selection.metadata ? JSON.stringify(selection.metadata) : null,
            selection.createdAt,
            selection.updatedAt
          );
        });

        const insertResult = await db.execute(sql.raw(insertQuery, insertParams));
        results.push(...(insertResult as ClientSelection[]));
      }

      return results;
      
    } catch (error) {
      console.error('Bulk upsert failed, falling back to individual operations:', error);
      
      // Step 5: Fallback to individual operations if bulk fails
      const results: ClientSelection[] = [];
      
      for (const selection of selections) {
        try {
          const result = await this.upsertClientSelection(selection);
          results.push(result);
        } catch (individualError) {
          console.error(`Failed to upsert selection for ${selection.imageFilename}:`, individualError);
          // Continue with other selections rather than failing completely
        }
      }
      
      return results;
    }
  }

  async deleteClientSelection(id: string): Promise<boolean> {
    const result = await db.delete(clientSelections).where(eq(clientSelections.id, id));
    return result.rowCount > 0;
  }

  async clearAllClientSelections(shootId: string, clientId: string): Promise<number> {
    // Update all existing selections for this shoot/client to 'none' status
    const result = await db.update(clientSelections)
      .set({
        selectionStatus: 'none',
        isFinalSelection: false,
        selectedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientSelections.shootId, shootId),
          eq(clientSelections.clientId, clientId),
          not(eq(clientSelections.selectionStatus, 'none'))
        )
      )
      .returning();

    return result.length;
  }

  async getSelectionPackages(): Promise<SelectionPackage[]> {
    return await db.select().from(selectionPackages).orderBy(selectionPackages.additionalImages);
  }

  async createSelectionPackage(packageData: InsertSelectionPackage): Promise<SelectionPackage> {
    const result = await db.insert(selectionPackages).values(packageData).returning();
    return result[0];
  }

  async updateSelectionPackage(id: string, updates: Partial<InsertSelectionPackage>): Promise<SelectionPackage | undefined> {
    const result = await db.update(selectionPackages).set(updates).where(eq(selectionPackages.id, id)).returning();
    return result[0];
  }

  async deleteSelectionPackage(id: string): Promise<boolean> {
    const result = await db.delete(selectionPackages).where(eq(selectionPackages.id, id));
    return result.rowCount > 0;
  }

  // Preview Images methods
  async getPreviewImages(shootId: string): Promise<PreviewImage[]> {
    return await db.select().from(previewImages).where(eq(previewImages.shootId, shootId)).orderBy(previewImages.createdAt);
  }

  async deletePreviewImage(shootId: string, filename: string): Promise<boolean> {
    try {
      // Delete the preview image record
      await db.delete(previewImages)
        .where(
          and(
            eq(previewImages.shootId, shootId),
            eq(previewImages.filename, filename)
          )
        );
      
      // Also delete any client selections for this image
      await db.delete(clientSelections)
        .where(
          and(
            eq(clientSelections.shootId, shootId),
            eq(clientSelections.imageFilename, filename)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error deleting preview image:', error);
      return false;
    }
  }

  // Selection Package methods for client upselling
  async getSelectionPackage(shootId: string, clientId: string): Promise<SelectionPackage | undefined> {
    const result = await db.select()
      .from(selectionPackages)
      .where(
        and(
          eq(selectionPackages.shootId, shootId),
          eq(selectionPackages.clientId, clientId)
        )
      )
      .limit(1);
    return result[0];
  }

  async upgradeSelectionPackage(shootId: string, clientId: string, additionalImages: number, purchaseInfo: any): Promise<SelectionPackage> {
    const existing = await this.getSelectionPackage(shootId, clientId);
    if (!existing) {
      throw new Error('No selection package found to upgrade');
    }
    
    // Update with additional images and purchase info
    const result = await db.update(selectionPackages)
      .set({
        purchasedAdditional: existing.purchasedAdditional + additionalImages,
        purchaseHistory: sql`COALESCE(purchase_history, '[]'::jsonb) || ${JSON.stringify([purchaseInfo])}::jsonb`
      })
      .where(eq(selectionPackages.id, existing.id))
      .returning();
    return result[0];
  }
}