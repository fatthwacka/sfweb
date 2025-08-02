import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { IMAGE_CLASSIFICATIONS, type ImageClassification } from '@shared/schema';

const router = Router();

// GET /api/images/featured - Get all featured images
router.get('/', async (req: Request, res: Response) => {
  try {
    const { classification } = req.query;
    
    let featuredImages;
    if (classification && typeof classification === 'string') {
      if (!IMAGE_CLASSIFICATIONS.includes(classification as ImageClassification)) {
        return res.status(400).json({ message: 'Invalid classification' });
      }
      featuredImages = await storage.getFeaturedImagesByClassification(classification as ImageClassification);
    } else {
      featuredImages = await storage.getFeaturedImages();
    }
    
    res.json(featuredImages);
  } catch (error) {
    console.error('Error fetching featured images:', error);
    res.status(500).json({ message: 'Failed to fetch featured images' });
  }
});

// PATCH /api/images/bulk-featured - Bulk update featured status
router.patch('/bulk-featured', async (req: Request, res: Response) => {
  try {
    const { imageIds, featured } = req.body;
    
    if (!Array.isArray(imageIds) || typeof featured !== 'boolean') {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    const updatedImages = await storage.updateImageFeaturedStatus(imageIds, featured);
    
    res.json({ 
      message: `${imageIds.length} images ${featured ? 'added to' : 'removed from'} featured`,
      updatedImages 
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ message: 'Failed to update featured status' });
  }
});

// PATCH /api/images/:id/classification - Update individual image classification
router.patch('/:id/classification', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { classification } = req.body;
    
    if (!IMAGE_CLASSIFICATIONS.includes(classification)) {
      return res.status(400).json({ message: 'Invalid classification' });
    }
    
    const updatedImage = await storage.updateImageClassification(id, classification);
    
    if (!updatedImage) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.json({ 
      message: 'Image classification updated successfully',
      image: updatedImage 
    });
  } catch (error) {
    console.error('Error updating image classification:', error);
    res.status(500).json({ message: 'Failed to update classification' });
  }
});

// PATCH /api/images/bulk-classification - Bulk update image classifications
router.patch('/bulk-classification', async (req: Request, res: Response) => {
  try {
    const { imageIds, classification } = req.body;
    
    if (!Array.isArray(imageIds) || !IMAGE_CLASSIFICATIONS.includes(classification)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    const updatedImages = await storage.bulkUpdateImageClassification(imageIds, classification);
    
    res.json({ 
      message: `${imageIds.length} images updated to ${classification} classification`,
      updatedImages 
    });
  } catch (error) {
    console.error('Error bulk updating classifications:', error);
    res.status(500).json({ message: 'Failed to update classifications' });
  }
});

export default router;