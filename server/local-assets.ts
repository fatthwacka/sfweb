import fs from 'fs/promises';
import path from 'path';

// Direct filename mapping - exactly as used in the pages
export const ASSET_FILES = {
  // Hero images (9 total)
  'hero-main': 'cape-town-wedding-photography-slyfox-studios.jpg',
  'hero-services': 'professional-photography-services-cape-town.jpg', 
  'hero-weddings': 'cape-town-wedding-photographer-portfolio.jpg',
  'hero-portraits': 'portrait-photographer-cape-town-studio.jpg',
  'hero-corporate': 'corporate-photography-cape-town-business.jpg',
  'hero-events': 'event-photographer-cape-town-professional.jpg',
  'hero-graduation': 'graduation-photography-cape-town-ceremony.jpg',
  'hero-products': 'product-photography-cape-town-commercial.jpg',
  'hero-matric': 'matric-dance-photographer-cape-town.jpg',
  
  // Background images (3 total)
  'bg-studio': 'photography-studio-cape-town-texture.jpg',
  'bg-wedding': 'wedding-photography-background-elegant.jpg', 
  'bg-portrait': 'portrait-photography-studio-backdrop.jpg'
} as const;

// Default alt text for all pages
export const DEFAULT_ALT_TEXT = 'professional photography durban';

export interface LocalAsset {
  key: keyof typeof ASSET_FILES;
  filename: string;
  altText: string;
  exists: boolean;
  filePath: string;
}

export class LocalAssetsManager {
  private assetsDir = path.join(process.cwd(), 'public', 'images');

  async getAllAssets(): Promise<LocalAsset[]> {
    const assets: LocalAsset[] = [];
    
    for (const [key, filename] of Object.entries(ASSET_FILES)) {
      const filePath = path.join(this.assetsDir, filename);
      let exists = false;
      
      try {
        await fs.access(filePath);
        exists = true;
      } catch (error) {
        // File doesn't exist
      }
      
      assets.push({
        key: key as keyof typeof ASSET_FILES,
        filename,
        altText: DEFAULT_ALT_TEXT,
        exists,
        filePath: `/images/${filename}`
      });
    }
    
    return assets;
  }

  async uploadAsset(key: keyof typeof ASSET_FILES, fileBuffer: Buffer): Promise<void> {
    const filename = ASSET_FILES[key];
    const filePath = path.join(this.assetsDir, filename);
    
    // Ensure directory exists
    await fs.mkdir(this.assetsDir, { recursive: true });
    
    // Write file (overwrites if exists)
    await fs.writeFile(filePath, fileBuffer);
  }

  async deleteAsset(key: keyof typeof ASSET_FILES): Promise<void> {
    const filename = ASSET_FILES[key];
    const filePath = path.join(this.assetsDir, filename);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }
}