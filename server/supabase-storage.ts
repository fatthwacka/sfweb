import { db } from "./db";
import crypto from 'crypto';
import {
  profiles, users, clients, shoots, images, videos, packages, analytics, favorites, bookings,
  shootPreviews, clientSelections, selectionPackages, previewImages,
  type Profile, type InsertProfile,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Shoot, type InsertShoot,
  type Image, type InsertImage,
  type Video, type InsertVideo,
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
import { eq, and, desc, sql, not, isNotNull, asc, inArray } from "drizzle-orm";
import type { IStorage } from "./storage";
import { mediaStore } from "./media/media-store";

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

  // OPTIMIZED: Query directly by groupName instead of fetching all public shoots
  async getPublicShootsByGroupName(groupName: string): Promise<Shoot[]> {
    return await db.select().from(shoots)
      .where(and(
        eq(shoots.isPrivate, false),
        sql`LOWER(${shoots.groupName}) = LOWER(${groupName})`
      ))
      .orderBy(desc(shoots.createdAt));
  }

  // Filter public shoots by shootType (e.g., wedding, engagement, maternity, newborn)
  async getPublicShootsByTypes(shootTypes: string[]): Promise<Shoot[]> {
    if (shootTypes.length === 0) {
      return [];
    }
    // Build case-insensitive filter for shootTypes
    const lowerTypes = shootTypes.map(t => t.toLowerCase());
    return await db.select().from(shoots)
      .where(and(
        eq(shoots.isPrivate, false),
        sql`LOWER(${shoots.shootType}) IN (${sql.join(lowerTypes.map(t => sql`${t}`), sql`, `)})`
      ))
      .orderBy(desc(shoots.createdAt));
  }

  // OPTIMIZED: Get shoots with banner image data in a single query (JOIN)
  async getPublicShootsWithBannerByGroupName(groupName: string): Promise<(Shoot & { bannerImage?: { id: string; storagePath: string } })[]> {
    const result = await db
      .select({
        shoot: shoots,
        bannerImageId: images.id,
        bannerImagePath: images.storagePath,
      })
      .from(shoots)
      .leftJoin(images, eq(shoots.bannerImageId, images.id))
      .where(and(
        eq(shoots.isPrivate, false),
        sql`LOWER(${shoots.groupName}) = LOWER(${groupName})`
      ))
      .orderBy(desc(shoots.createdAt));

    return result.map(row => ({
      ...row.shoot,
      bannerImage: row.bannerImageId ? {
        id: row.bannerImageId,
        storagePath: row.bannerImagePath!
      } : undefined
    }));
  }

  async getAllShoots(): Promise<Shoot[]> {
    return await db.select().from(shoots).orderBy(desc(shoots.createdAt));
  }

  async getPortfolioGroups(): Promise<string[]> {
    const result = await db
      .selectDistinct({ groupName: shoots.groupName })
      .from(shoots)
      .where(isNotNull(shoots.groupName))
      .orderBy(asc(shoots.groupName));
    
    return result.map(row => row.groupName).filter((name): name is string => name !== null);
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

  // OPTIMIZED: Batch fetch multiple images by ID in a single query
  async getImagesByIds(ids: string[]): Promise<Map<string, Image>> {
    if (ids.length === 0) return new Map();
    const result = await db.select().from(images).where(inArray(images.id, ids));
    const imageMap = new Map<string, Image>();
    for (const img of result) {
      imageMap.set(img.id, img);
    }
    return imageMap;
  }

  async getImagesByShoot(shootId: string): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.shootId, shootId)).orderBy(images.uploadOrder);
  }
  
  // Optimized batch method to get images for multiple shoots at once
  async getImagesForShoots(shootIds: string[]): Promise<Map<string, Image[]>> {
    if (shootIds.length === 0) {
      return new Map();
    }
    
    const allImages = await db.select().from(images)
      .where(inArray(images.shootId, shootIds))
      .orderBy(images.shootId, images.uploadOrder); // Order by shootId first, then uploadOrder
    
    // Group images by shootId
    const imagesByShoot = new Map<string, Image[]>();
    for (const shootId of shootIds) {
      imagesByShoot.set(shootId, []);
    }
    
    for (const image of allImages) {
      const shootImages = imagesByShoot.get(image.shootId);
      if (shootImages) {
        shootImages.push(image);
      } else {
        console.warn(`[BATCH_WARNING] Image ${image.id} belongs to shoot ${image.shootId} not in requested shoots`);
      }
    }
    
    // Validation: Check that all shoots got their images
    let totalExpected = 0;
    let totalFound = 0;
    for (const shootId of shootIds) {
      const images = imagesByShoot.get(shootId);
      totalFound += images?.length || 0;
      // We don't know expected count, but we can validate each shoot has images
    }
    
    console.log(`[BATCH_INFO] Retrieved ${totalFound} images for ${shootIds.length} shoots`);

    return imagesByShoot;
  }

  // Optimised method: fetch only the first/featured image per shoot (for portfolio cards)
  async getCoverImagesForShoots(shootIds: string[]): Promise<Map<string, Image | null>> {
    if (shootIds.length === 0) {
      return new Map();
    }

    // Fetch all images for these shoots in a single query
    const allImages = await db.select().from(images)
      .where(inArray(images.shootId, shootIds))
      .orderBy(images.shootId, images.uploadOrder);

    // Initialise map with null for all shoots
    const coverMap = new Map<string, Image | null>();
    for (const shootId of shootIds) {
      coverMap.set(shootId, null);
    }

    // Select first/featured image per shoot (featured takes priority)
    for (const image of allImages) {
      const existing = coverMap.get(image.shootId);
      if (!existing) {
        // First image for this shoot
        coverMap.set(image.shootId, image);
      } else if (image.featuredImage && !existing.featuredImage) {
        // Replace with featured image if current isn't featured
        coverMap.set(image.shootId, image);
      }
    }

    console.log(`[BATCH_INFO] Retrieved cover images for ${shootIds.length} shoots`);

    return coverMap;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const result = await db.insert(images).values(insertImage).returning();
    return result[0];
  }

  async updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined> {
    // Use Drizzle's built-in timestamp update
    const result = await db.update(images)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(images.id, id))
      .returning();
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

      // Build the raw SQL query with proper array casting for PostgreSQL ANY()
      const updateQuery = sql`
        UPDATE ${images}
        SET sequence = CASE id ${sql.raw(caseStatement)} END
        WHERE id = ANY(ARRAY[${sql.join(imageIds.map(id => sql`${id}`), sql`, `)}]::uuid[])
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
      const image = await this.getImage(id);
      if (!image) {
        console.log(`❌ deleteImage: Image ${id} not found in database`);
        return false;
      }

      // Delete from database first
      await db.delete(images).where(eq(images.id, id));

      // Then delete all 3 stored versions (original, _optimized, _thumbnail) from the media store.
      // parseMediaUrl understands both new (GCS) and legacy Supabase URLs.
      const ref = mediaStore.parseMediaUrl(image.storagePath, 'gallery-images');
      if (ref) {
        const versions = mediaStore.imageVariantKeys(ref.key);
        const result = await mediaStore.remove(ref.bucket, versions);
        if (result.failed.length) {
          console.error(`❌ deleteImage: storage deletion failed for ${id}:`, result.failed);
        } else {
          console.log(`🗂️ deleteImage: removed ${result.removed.length} object(s) for ${id}${result.missing.length ? ` (${result.missing.length} already missing)` : ''}`);
        }
      } else {
        console.log(`⚠️ deleteImage: database row deleted but storage path not recognised: ${image.storagePath}`);
      }
      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }

  // Video methods (mirror image methods)
  async getVideo(id: string): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    return result[0];
  }

  async getVideosByShoot(shootId: string): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.shootId, shootId)).orderBy(videos.sequence);
  }
  
  // Optimized batch method to get videos for multiple shoots at once
  async getVideosForShoots(shootIds: string[]): Promise<Map<string, Video[]>> {
    if (shootIds.length === 0) {
      return new Map();
    }

    const allVideos = await db.select().from(videos)
      .where(inArray(videos.shootId, shootIds))
      .orderBy(videos.sequence);

    // Group videos by shootId
    const videosByShoot = new Map<string, Video[]>();
    for (const shootId of shootIds) {
      videosByShoot.set(shootId, []);
    }

    for (const video of allVideos) {
      const shootVideos = videosByShoot.get(video.shootId);
      if (shootVideos) {
        shootVideos.push(video);
      }
    }

    return videosByShoot;
  }

  // OPTIMIZED: Get just the cover video (featured or first) for multiple shoots - for card displays
  async getCoverVideosForShoots(shootIds: string[]): Promise<Map<string, Video | null>> {
    if (shootIds.length === 0) {
      return new Map();
    }

    // Fetch only featured videos first
    const featuredVideos = await db.select().from(videos)
      .where(and(
        inArray(videos.shootId, shootIds),
        eq(videos.featuredVideo, true)
      ));

    // For shoots without featured video, get first video by sequence
    const shootsWithFeatured = new Set(featuredVideos.map(v => v.shootId));
    const shootsNeedingFirst = shootIds.filter(id => !shootsWithFeatured.has(id));

    let firstVideos: Video[] = [];
    if (shootsNeedingFirst.length > 0) {
      // Get first video for each shoot
      const allFirstVideos = await db.select().from(videos)
        .where(inArray(videos.shootId, shootsNeedingFirst))
        .orderBy(videos.shootId, videos.sequence);

      // Deduplicate to keep only first per shoot
      const seen = new Set<string>();
      firstVideos = allFirstVideos.filter(v => {
        if (seen.has(v.shootId)) return false;
        seen.add(v.shootId);
        return true;
      });
    }

    // Build result map
    const result = new Map<string, Video | null>();
    for (const shootId of shootIds) {
      result.set(shootId, null);
    }
    for (const video of featuredVideos) {
      result.set(video.shootId, video);
    }
    for (const video of firstVideos) {
      if (!result.get(video.shootId)) {
        result.set(video.shootId, video);
      }
    }

    return result;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values(insertVideo).returning();
    return result[0];
  }

  async updateVideo(id: string, updates: Partial<InsertVideo>): Promise<Video | undefined> {
    const result = await db.update(videos)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(videos.id, id))
      .returning();
    return result[0];
  }

  async updateVideoSequence(videoId: string, sequence: number): Promise<void> {
    await db.update(videos).set({ sequence }).where(eq(videos.id, videoId));
  }

  // PERFORMANCE: Batch update multiple video sequences in a single SQL statement (ultra-optimized)
  async batchUpdateVideoSequences(videoSequences: Record<string, number>): Promise<void> {
    const entries = Object.entries(videoSequences);
    if (entries.length === 0) return;

    console.log(`🚀 Starting SINGLE SQL batch update for ${entries.length} videos`);
    const startTime = Date.now();

    try {
      // ULTRA OPTIMIZATION: Single SQL UPDATE with CASE statement for all videos at once
      const videoIds = entries.map(([id]) => id);
      const caseStatement = entries.map(([id, sequence]) =>
        `WHEN '${id}' THEN ${sequence}`
      ).join(' ');

      // Build the raw SQL query with proper array casting for PostgreSQL ANY()
      const updateQuery = sql`
        UPDATE ${videos}
        SET sequence = CASE id ${sql.raw(caseStatement)} END
        WHERE id = ANY(ARRAY[${sql.join(videoIds.map(id => sql`${id}`), sql`, `)}]::uuid[])
      `;

      await db.execute(updateQuery);

      const duration = Date.now() - startTime;
      console.log(`✅ SINGLE SQL batch update completed in ${duration}ms for ${entries.length} videos`);
    } catch (error) {
      console.error('❌ Single SQL batch update failed, falling back to chunked approach:', error);

      // FALLBACK: Use the previous chunked approach if single SQL fails
      const chunkSize = 20;
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);

        await db.transaction(async (tx) => {
          for (const [videoId, sequence] of chunk) {
            await tx.update(videos).set({ sequence }).where(eq(videos.id, videoId));
          }
        });
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Fallback batch update completed in ${duration}ms for ${entries.length} videos`);
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const video = await this.getVideo(id);
      if (!video) {
        return false;
      }

      // Delete from database first
      await db.delete(videos).where(eq(videos.id, id));

      // Then remove original / optimized / thumbnail objects (YouTube rows have no stored objects).
      const result = await mediaStore.removeUrls([video.storagePath, video.optimizedPath, video.thumbnailPath], 'gallery-videos');
      if (result.failed.length) {
        console.error(`❌ deleteVideo: storage deletion failed for ${id}:`, result.failed);
      } else {
        console.log(`🗂️ deleteVideo: removed ${result.removed.length} object(s) for ${id}${result.missing.length ? ` (${result.missing.length} already missing)` : ''}`);
      }
      return true;
    } catch (error) {
      console.error('Delete video error:', error);
      return false;
    }
  }

  // Featured Videos Management methods
  async getFeaturedVideos(): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.featuredVideo, true));
  }

  async updateVideoFeaturedStatus(videoIds: string[], featured: boolean): Promise<Video[]> {
    if (videoIds.length === 0) return [];
    
    const result = await db.update(videos)
      .set({ featuredVideo: featured, updatedAt: sql`now()` })
      .where(sql`${videos.id} = ANY(ARRAY[${sql.join(videoIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`)
      .returning();
    
    return result;
  }

  async setShootCoverVideo(shootId: string, videoId: string): Promise<Video | undefined> {
    // First, remove featured status from all videos in this shoot
    await db.update(videos)
      .set({ featuredVideo: false, updatedAt: sql`now()` })
      .where(eq(videos.shootId, shootId));
    
    // Then set the selected video as featured
    const result = await db.update(videos)
      .set({ featuredVideo: true, updatedAt: sql`now()` })
      .where(and(eq(videos.id, videoId), eq(videos.shootId, shootId)))
      .returning();
    
    return result[0];
  }

  async getVideosByShoot(shootId: string): Promise<Video[]> {
    return await db.select().from(videos)
      .where(eq(videos.shootId, shootId))
      .orderBy(videos.sequence);
  }

  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
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
    console.log(`🔍 SupabaseStorage.getShoot(${id}) raw result:`, JSON.stringify(result[0], null, 2));
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
    console.log(`🔄 SupabaseStorage.updateShoot(${id}) updates:`, JSON.stringify(updates, null, 2));
    const result = await db.update(shoots).set(updates).where(eq(shoots.id, id)).returning();
    console.log(`📥 SupabaseStorage.updateShoot(${id}) result:`, JSON.stringify(result[0], null, 2));
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
    // Use Drizzle's built-in timestamp update
    const result = await db.update(images)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(images.id, id))
      .returning();
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

  async updateClientSelectionEditingStatus(selectionId: string, editingComplete: boolean, editingCompletedAt: Date | null): Promise<ClientSelection | undefined> {
    const result = await db.update(clientSelections)
      .set({
        editingComplete,
        editingCompletedAt,
        updatedAt: new Date(),
      })
      .where(eq(clientSelections.id, selectionId))
      .returning();
    
    return result[0];
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