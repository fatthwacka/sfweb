import fs from 'fs/promises';
import path from 'path';

// Direct filename mapping - exactly as used in the pages
export const ASSET_FILES = {
  // Hero images (9 total) - all in /images/hero/ folder
  'hero-main': 'hero/homepage-main-hero.jpg',
  'hero-services': 'hero/photography-hero.jpg', 
  'hero-weddings': 'hero/wedding-photography-hero.jpg',
  'hero-portraits': 'hero/portrait-photography-hero.jpg',
  'hero-corporate': 'hero/corporate-photography-hero.jpg',
  'hero-events': 'hero/Event-photography-hero.jpg',
  'hero-graduation': 'hero/graduation-photography-hero.jpg',
  'hero-products': 'hero/product-photography-hero.jpg',
  'hero-matric': 'hero/matric-dance-photography-hero.jpg',
  
  // Background images (3 total) - need to identify actual usage
  'bg-studio': 'backgrounds/photography-studio-cape-town-texture.jpg',
  'bg-wedding': 'backgrounds/wedding-photography-background-elegant.jpg', 
  'bg-portrait': 'backgrounds/portrait-photography-studio-backdrop.jpg'
} as const;

// Default alt text for all pages
export const DEFAULT_ALT_TEXT = 'professional photography durban';

// Alt text storage - maps asset keys to custom alt text
const ALT_TEXT_STORAGE: Record<string, string> = {};

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
        altText: ALT_TEXT_STORAGE[key] || DEFAULT_ALT_TEXT,
        exists,
        filePath: `/images/${filename}`
      });
    }
    
    return assets;
  }

  async uploadAsset(key: keyof typeof ASSET_FILES, fileBuffer: Buffer): Promise<void> {
    const filename = ASSET_FILES[key];
    const filePath = path.join(this.assetsDir, filename);
    
    // Ensure the full directory path exists (including subdirectories)
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    
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

  async updateAltText(key: keyof typeof ASSET_FILES, altText: string): Promise<void> {
    // Store alt text in memory (could be persisted to file/database later)
    ALT_TEXT_STORAGE[key] = altText;
    
    // For now, just store in memory. In the future, this could:
    // 1. Update a JSON file with alt text mappings
    // 2. Update database records
    // 3. Directly modify the page component files
    console.log(`Alt text stored: ${key} -> "${altText}"`);
  }
}