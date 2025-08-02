import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { storage } from '../storage';
// Asset keys imported locally to avoid client-side dependencies
const ASSET_KEYS = {
  'hero/cape-town-wedding-photography-slyfox-studios': 'Main Home Page Hero',
  'hero/professional-photography-services-cape-town': 'Photography Services Landing',
  'hero/cape-town-wedding-photographer-portfolio': 'Weddings Portfolio Hero',
  'hero/portrait-photographer-cape-town-studio': 'Portraits Portfolio Hero',
  'hero/corporate-photography-cape-town-business': 'Corporate Photography Hero',
  'hero/event-photographer-cape-town-professional': 'Events Portfolio Hero',
  'hero/graduation-photography-cape-town-ceremony': 'Graduation Photography Hero',
  'hero/product-photography-cape-town-commercial': 'Product Photography Hero',
  'hero/matric-dance-photographer-cape-town': 'Matric Dance Photography Hero',
  'backgrounds/photography-studio-cape-town-texture': 'Main Site Background',
  'backgrounds/wedding-photography-background-elegant': 'Wedding Portfolio Background',
  'backgrounds/portrait-photography-studio-backdrop': 'Portrait Studio Background'
} as const;

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
  }
});

// Alt text validation function
const validateAltText = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Remove multiple consecutive hyphens
    .slice(0, 125);               // SEO optimal length
};

// GET /api/local-assets - Get all local site assets
router.get('/', async (req: Request, res: Response) => {
  try {
    const assets = await storage.getLocalSiteAssets();
    res.json(assets);
  } catch (error) {
    console.error('Error fetching local assets:', error);
    res.status(500).json({ message: 'Failed to fetch local assets' });
  }
});

// GET /api/local-assets/:assetKey - Get specific asset by key
router.get('/:assetKey', async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    const asset = await storage.getLocalSiteAssetByKey(assetKey);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Failed to fetch asset' });
  }
});

// POST /api/local-assets/upload - Upload new asset (replaces -ni version)
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    if (!assetKey) {
      return res.status(400).json({ message: 'Asset key is required' });
    }
    
    // Validate asset key is in allowed list
    const validAssetKeys = Object.values(ASSET_KEYS);
    if (!validAssetKeys.includes(assetKey)) {
      return res.status(400).json({ message: 'Invalid asset key' });
    }
    
    // Determine file extension based on mime type
    let extension = '.jpg';
    if (file.mimetype === 'image/png') extension = '.png';
    if (file.mimetype === 'image/webp') extension = '.webp';
    
    // Create the new image file path (-ni version)
    const filePath = path.join(process.cwd(), 'public', 'assets', `${assetKey}-ni${extension}`);
    const fileDir = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(fileDir, { recursive: true });
    
    // Delete existing -ni file if it exists
    try {
      const existingFiles = await fs.readdir(fileDir);
      const existingNiFile = existingFiles.find(f => f.startsWith(`${path.basename(assetKey)}-ni.`));
      if (existingNiFile) {
        await fs.unlink(path.join(fileDir, existingNiFile));
      }
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    // Write the new file
    await fs.writeFile(filePath, file.buffer);
    
    // Update or create asset record in database
    const existingAsset = await storage.getLocalSiteAssetByKey(assetKey);
    const assetType = assetKey.includes('hero') ? 'hero' : assetKey.includes('background') ? 'background' : 'video';
    
    let asset;
    if (existingAsset) {
      asset = await storage.updateLocalSiteAsset(assetKey, {
        filePath: `/assets/${assetKey}-ni${extension}`,
        updatedBy: req.user?.id || 'system', // Replace with actual user ID from auth
      });
    } else {
      asset = await storage.createLocalSiteAsset({
        assetKey,
        assetType,
        filePath: `/assets/${assetKey}-ni${extension}`,
        altText: `${assetKey.replace(/[/-]/g, ' ')} image`,
        isActive: true,
        updatedBy: req.user?.id || 'system', // Replace with actual user ID from auth
      });
    }
    
    res.json({ 
      message: 'Asset uploaded successfully',
      asset,
      filePath: `/assets/${assetKey}-ni${extension}`
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ message: 'Failed to upload asset' });
  }
});

// PATCH /api/local-assets/:assetKey/alt-text - Update alt text
router.patch('/:assetKey/alt-text', async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    const { altText } = req.body;
    
    if (!altText) {
      return res.status(400).json({ message: 'Alt text is required' });
    }
    
    const validatedAltText = validateAltText(altText);
    
    const asset = await storage.updateLocalSiteAsset(assetKey, {
      altText: validatedAltText,
      updatedBy: req.user?.id || 'system', // Replace with actual user ID from auth
    });
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ 
      message: 'Alt text updated successfully',
      asset,
      validatedAltText
    });
  } catch (error) {
    console.error('Error updating alt text:', error);
    res.status(500).json({ message: 'Failed to update alt text' });
  }
});

// DELETE /api/local-assets/:assetKey - Delete asset (admin only)
router.delete('/:assetKey', async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    
    // Delete both -ni and -fb files
    const assetDir = path.join(process.cwd(), 'public', 'assets');
    const extensions = ['.jpg', '.png', '.webp'];
    
    for (const ext of extensions) {
      try {
        await fs.unlink(path.join(assetDir, `${assetKey}-ni${ext}`));
      } catch (error) {
        // File doesn't exist, which is fine
      }
      try {
        await fs.unlink(path.join(assetDir, `${assetKey}-fb${ext}`));
      } catch (error) {
        // File doesn't exist, which is fine
      }
    }
    
    // Delete from database
    const deleted = await storage.deleteLocalSiteAsset(assetKey);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Failed to delete asset' });
  }
});

export default router;