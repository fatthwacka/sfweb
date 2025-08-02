import fs from 'fs/promises';
import path from 'path';

// Direct filename mapping - exactly as used in the pages
export const ASSET_FILES = {
  // Hero images (9 total) - matching actual files in public/images/hero/
  'hero-main': 'homepage-main-hero.jpg',
  'hero-services': 'photography-hero.jpg', 
  'hero-weddings': 'wedding-photography-hero.webp',
  'hero-portraits': 'portrait-photography-hero.jpg',
  'hero-corporate': 'corporate-photography-hero.jpg',
  'hero-events': 'Event-photography-hero.jpg',
  'hero-graduation': 'graduation-photography-hero.jpg',
  'hero-products': 'product-photography-hero.jpg',
  'hero-matric': 'matric-dance-photography-hero.jpg',
  
  // Background images (3 total) - in backgrounds folder
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
  private heroDir = path.join(process.cwd(), 'public', 'images', 'hero');
  private backgroundsDir = path.join(process.cwd(), 'public', 'images', 'backgrounds');

  async getAllAssets(): Promise<LocalAsset[]> {
    const assets: LocalAsset[] = [];
    
    for (const [key, filename] of Object.entries(ASSET_FILES)) {
      // Determine directory based on asset type
      const isHero = key.startsWith('hero-');
      const directory = isHero ? this.heroDir : this.backgroundsDir;
      const webPath = isHero ? `/images/hero/${filename}` : `/images/backgrounds/${filename}`;
      
      const filePath = path.join(directory, filename);
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
        filePath: webPath
      });
    }
    
    return assets;
  }

  async uploadAsset(key: keyof typeof ASSET_FILES, fileBuffer: Buffer): Promise<void> {
    const filename = ASSET_FILES[key];
    const isHero = key.startsWith('hero-');
    const directory = isHero ? this.heroDir : this.backgroundsDir;
    const filePath = path.join(directory, filename);
    
    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });
    
    // Write file (overwrites if exists)
    await fs.writeFile(filePath, fileBuffer);
  }

  async deleteAsset(key: keyof typeof ASSET_FILES): Promise<void> {
    const filename = ASSET_FILES[key];
    const isHero = key.startsWith('hero-');
    const directory = isHero ? this.heroDir : this.backgroundsDir;
    const filePath = path.join(directory, filename);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }
}