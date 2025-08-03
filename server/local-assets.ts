import fs from 'fs/promises';
import path from 'path';

// Load persisted alt text on startup
async function loadPersistedAltText(): Promise<Record<string, string>> {
  const altTextFile = path.join(process.cwd(), 'alt-text-storage.json');
  try {
    const data = await fs.readFile(altTextFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return defaults
    return {
      'hero-main': 'cape town wedding photographer slyfox studios',
      'hero-services': 'food photography durban', 
      'hero-portraits': 'professional portrait photography durban',
      'hero-weddings': 'professional photography durban',
      'hero-corporate': 'professional photography durban',
      'hero-events': 'professional photography durban',
      'hero-graduation': 'professional photography durban',
      'hero-products': 'professional photography durban',
      'hero-matric': 'professional photography durban',
      'bg-studio': 'professional photography durban',
      'bg-wedding': 'professional photography durban',
      'bg-portrait': 'professional photography durban'
    };
  }
}

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

// Alt text storage - will be initialized from persisted data
let ALT_TEXT_STORAGE: Record<string, string> = {};

export interface LocalAsset {
  key: keyof typeof ASSET_FILES;
  filename: string;
  altText: string;
  exists: boolean;
  filePath: string;
}

export class LocalAssetsManager {
  private assetsDir = path.join(process.cwd(), 'public', 'images');
  private initialized = false;

  private async initialize() {
    if (!this.initialized) {
      ALT_TEXT_STORAGE = await loadPersistedAltText();
      this.initialized = true;
    }
  }

  async getAllAssets(): Promise<LocalAsset[]> {
    await this.initialize(); // Ensure initialization before use
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
    await this.initialize(); // Ensure initialization
    
    // Store alt text in memory with persistent initialization
    ALT_TEXT_STORAGE[key] = altText;
    
    // Write to a JSON file for persistence across server restarts
    const altTextFile = path.join(process.cwd(), 'alt-text-storage.json');
    try {
      await fs.writeFile(altTextFile, JSON.stringify(ALT_TEXT_STORAGE, null, 2));
      console.log(`Alt text persisted: ${key} -> "${altText}"`);
    } catch (error) {
      console.error('Failed to persist alt text:', error);
    }
  }
}