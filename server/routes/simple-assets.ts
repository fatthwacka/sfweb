import { Router, Request, Response } from 'express';
import multer from 'multer';
import { LocalAssetsManager, ASSET_FILES } from '../local-assets';

const router = Router();
const assetsManager = new LocalAssetsManager();

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

// GET /api/simple-assets - Get all local assets
router.get('/', async (req: Request, res: Response) => {
  try {
    const assets = await assetsManager.getAllAssets();
    res.json(assets);
  } catch (error) {
    console.error('Error fetching local assets:', error);
    res.status(500).json({ message: 'Failed to fetch local assets' });
  }
});

// POST /api/simple-assets/:key - Upload asset by key
router.post('/:key', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (!(key in ASSET_FILES)) {
      return res.status(400).json({ message: 'Invalid asset key' });
    }

    console.log(`🔄 Uploading asset: ${key} -> ${ASSET_FILES[key as keyof typeof ASSET_FILES]}`);

    await assetsManager.uploadAsset(key as keyof typeof ASSET_FILES, file.buffer);

    console.log(`✅ Asset ${key} uploaded successfully`);

    res.json({
      success: true,
      message: `Asset ${key} uploaded successfully`,
      filename: ASSET_FILES[key as keyof typeof ASSET_FILES]
    });

  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ message: 'Failed to upload asset' });
  }
});

// PATCH /api/simple-assets/:key/alt-text - Update alt text for asset
router.patch('/:key/alt-text', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { altText } = req.body;

    if (!(key in ASSET_FILES)) {
      return res.status(400).json({ message: 'Invalid asset key' });
    }

    if (!altText || typeof altText !== 'string') {
      return res.status(400).json({ message: 'Alt text is required and must be a string' });
    }

    // Clean alt text: remove special characters and limit length
    const cleanedAltText = altText.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 100);

    console.log(`🔄 Updating alt text for: ${key} -> "${cleanedAltText}"`);

    await assetsManager.updateAltText(key as keyof typeof ASSET_FILES, cleanedAltText);

    console.log(`✅ Alt text for ${key} updated successfully`);

    res.json({
      success: true,
      message: `Alt text for ${key} updated successfully`,
      altText: cleanedAltText
    });

  } catch (error) {
    console.error('Error updating alt text:', error);
    res.status(500).json({ message: 'Failed to update alt text' });
  }
});

// DELETE /api/simple-assets/:key - Delete asset by key
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (!(key in ASSET_FILES)) {
      return res.status(400).json({ message: 'Invalid asset key' });
    }

    console.log(`🗑️ Deleting asset: ${key}`);

    await assetsManager.deleteAsset(key as keyof typeof ASSET_FILES);

    console.log(`✅ Asset ${key} deleted successfully`);

    res.json({
      success: true,
      message: `Asset ${key} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Failed to delete asset' });
  }
});

export default router;