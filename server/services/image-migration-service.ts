import { createClient } from '@supabase/supabase-js';
import { mediaStore } from '../media/media-store';
import { randomUUID } from 'crypto';
import { dropboxService, type DropboxFile } from './dropbox-service.js';

export class ImageMigrationService {
  private supabase;
  private dropboxService: typeof dropboxService;

  constructor(dropboxAccessToken: string) {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Use the existing dropbox service instance
    this.dropboxService = dropboxService;
  }

  /**
   * Migrates images from Dropbox shared link to Supabase Storage
   * Creates preview images in the dedicated preview_images table
   * Updated with enhanced debugging for split() error
   */
  async migrateDropboxToSupabase(
    shootId: string, 
    sharedLink: string,
    userId: string
  ): Promise<{success: boolean, migratedCount: number, errors: string[], batchId: string}> {
    console.log(`🚀 Starting migration for shoot ${shootId} from Dropbox to Supabase`);
    
    const errors: string[] = [];
    let migratedCount = 0;
    const batchId = randomUUID(); // Group this migration batch

    try {
      // 1. Clear any existing preview images for this shoot
      await this.clearExistingPreviewImages(shootId);

      // 2. Get all files from Dropbox shared link
      console.log('📋 Fetching files from Dropbox shared link...');
      const dropboxFiles = await this.dropboxService.listFilesFromSharedLink(sharedLink);
      console.log(`📁 Found ${dropboxFiles.length} files in Dropbox`);

      if (dropboxFiles.length === 0) {
        return { success: false, migratedCount: 0, errors: ['No files found in Dropbox folder'], batchId };
      }

      // 3. Process each image file
      for (const file of dropboxFiles) {
        try {
          console.log(`📥 Processing: ${file.name}`);
          console.log(`🔍 DEBUG: file.name=${file.name}, file.path_display=${file.path_display}`);
          
          // Ensure file.name exists
          if (!file.name) {
            throw new Error('File name is undefined or empty');
          }
          
          // Download from Dropbox
          const filePath = file.path_display || `/${file.name}`;
          console.log(`📂 Downloading file: ${filePath} from shared link`);
          const imageBuffer = await this.downloadFromDropbox(sharedLink, filePath);
          
          // Upload to Supabase Storage
          const { supabaseUrl, storagePath } = await this.uploadToSupabase(shootId, file.name, imageBuffer);
          
          // Save to dedicated preview images table
          await this.savePreviewImageRecord(
            shootId, 
            file.name, 
            supabaseUrl, 
            storagePath,
            filePath,
            imageBuffer.length,
            userId,
            batchId
          );
          
          migratedCount++;
          console.log(`✅ Migrated: ${file.name}`);
          
        } catch (error) {
          const errorMsg = `Failed to migrate ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const success = migratedCount > 0;
      console.log(`🎯 Migration complete: ${migratedCount}/${dropboxFiles.length} files migrated (batch: ${batchId})`);
      
      return { success, migratedCount, errors, batchId };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown migration error';
      console.error(`💥 Migration failed: ${errorMsg}`);
      return { success: false, migratedCount, errors: [errorMsg], batchId };
    }
  }

  /**
   * Downloads image from Dropbox using API
   */
  private async downloadFromDropbox(sharedLink: string, filePath: string): Promise<Buffer> {
    try {
      // For shared links, use the proper shared link download method
      console.log(`⬇️  Downloading from shared link: ${filePath}`);
      const fileData = await this.dropboxService.downloadFileFromSharedLink(sharedLink, filePath);
      
      if (!fileData) {
        throw new Error(`Failed to download file from Dropbox shared link: ${filePath}`);
      }
      
      return fileData;
      
      // This code path should not be reached now
      throw new Error(`Unexpected code path reached for ${filePath}`);
    } catch (error) {
      console.error(`❌ Download error for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Uploads image buffer to Supabase Storage
   */
  private async uploadToSupabase(shootId: string, fileName: string, imageBuffer: Buffer): Promise<{supabaseUrl: string, storagePath: string}> {
    // Create unique path in Supabase Storage for preview images
    const timestamp = Date.now();
    const storagePath = `previews/${shootId}/${timestamp}-${fileName}`;

    console.log(`⬆️  Uploading to Supabase: ${storagePath}`);

    // Media store (Google Cloud Storage) — same key layout as the old Supabase bucket
    const uploaded = await mediaStore.put('gallery-images', storagePath, imageBuffer, {
      contentType: this.getContentType(fileName),
      upsert: false,
    });
    const publicUrlData = { publicUrl: uploaded.publicUrl };

    console.log(`🔗 Supabase URL: ${publicUrlData.publicUrl}`);
    return { 
      supabaseUrl: publicUrlData.publicUrl,
      storagePath: storagePath
    };
  }

  /**
   * Saves image record to dedicated preview_images table
   */
  private async savePreviewImageRecord(
    shootId: string, 
    filename: string, 
    supabaseUrl: string,
    storagePath: string,
    originalDropboxPath: string,
    fileSize: number,
    userId: string,
    batchId: string
  ): Promise<void> {
    console.log(`🔍 DEBUG: Saving preview image record with userId: ${userId}`);
    const { error } = await this.supabase
      .from('preview_images')
      .insert({
        shoot_id: shootId,
        filename: filename,
        supabase_url: supabaseUrl,
        supabase_storage_path: storagePath,
        original_dropbox_path: originalDropboxPath,
        file_size: fileSize,
        content_type: this.getContentType(filename),
        uploaded_by: userId, // Migration user
        migration_batch_id: batchId,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Database save failed for ${filename}: ${error.message}`);
    }
  }

  /**
   * Clears existing preview images for a shoot before new migration
   */
  private async clearExistingPreviewImages(shootId: string): Promise<void> {
    console.log(`🧹 Clearing existing preview images for shoot ${shootId}`);

    // 1. Get existing preview images to delete from storage
    const { data: existingImages, error: fetchError } = await this.supabase
      .from('preview_images')
      .select('supabase_storage_path')
      .eq('shoot_id', shootId);

    if (fetchError) {
      console.error(`⚠️  Failed to fetch existing preview images: ${fetchError.message}`);
      return; // Continue with migration even if cleanup fails
    }

    // 2. Delete from Supabase Storage
    if (existingImages && existingImages.length > 0) {
      const storagePaths = existingImages.map(img => img.supabase_storage_path);
      
      const storageResult = await mediaStore.removeUrls(storagePaths, 'gallery-images');
      const storageError = storageResult.failed.length
        ? { message: storageResult.failed.map(f => `${f.key}: ${f.error}`).join('; ') }
        : null;

      if (storageError) {
        console.error(`⚠️  Failed to delete existing storage files: ${storageError.message}`);
      } else {
        console.log(`🗑️  Deleted ${storagePaths.length} existing files from storage`);
      }
    }

    // 3. Delete from database
    const { error: dbError } = await this.supabase
      .from('preview_images')
      .delete()
      .eq('shoot_id', shootId);

    if (dbError) {
      console.error(`⚠️  Failed to delete existing preview image records: ${dbError.message}`);
    } else {
      console.log(`🗑️  Cleared existing preview image records`);
    }
  }

  /**
   * Determines content type from file extension
   */
  private getContentType(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'image/jpeg'; // Default fallback for undefined/invalid filenames
    }
    const ext = fileName.toLowerCase().split('.').pop();
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg'; // Default fallback
    }
  }

  /**
   * Cleanup preview images for a shoot (called after final gallery is created)
   */
  async cleanupPreviewImages(shootId: string): Promise<{success: boolean, deletedCount: number}> {
    console.log(`🧹 Cleaning up preview images for shoot ${shootId}`);
    
    try {
      // 1. Get all preview images for this shoot from dedicated table
      const { data: previewImages, error: fetchError } = await this.supabase
        .from('preview_images')
        .select('id, supabase_storage_path, filename')
        .eq('shoot_id', shootId);

      if (fetchError) {
        throw new Error(`Failed to fetch preview images: ${fetchError.message}`);
      }

      if (!previewImages || previewImages.length === 0) {
        console.log('📭 No preview images found to cleanup');
        return { success: true, deletedCount: 0 };
      }

      console.log(`🗂️  Found ${previewImages.length} preview images to delete`);

      // 2. Delete from Supabase Storage
      const storagePaths = previewImages.map(img => img.supabase_storage_path);
      
      const storageResult = await mediaStore.removeUrls(storagePaths, 'gallery-images');
      const storageError = storageResult.failed.length
        ? { message: storageResult.failed.map(f => `${f.key}: ${f.error}`).join('; ') }
        : null;

      if (storageError) {
        console.error(`⚠️  Failed to delete from storage: ${storageError.message}`);
      } else {
        console.log(`🗑️  Deleted ${storagePaths.length} files from storage`);
      }

      // 3. Delete from database
      const { error: dbError } = await this.supabase
        .from('preview_images')
        .delete()
        .eq('shoot_id', shootId);

      if (dbError) {
        throw new Error(`Failed to delete preview images from database: ${dbError.message}`);
      }

      console.log(`✅ Cleanup complete: ${previewImages.length} preview images deleted`);
      return { success: true, deletedCount: previewImages.length };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown cleanup error';
      console.error(`💥 Cleanup failed: ${errorMsg}`);
      return { success: false, deletedCount: 0 };
    }
  }
}