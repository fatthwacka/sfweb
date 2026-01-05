import express from 'express';
import brandIntelligenceRouter from './brand-intelligence.js';

const router = express.Router();

// Mount all content management routes
router.use('/brand-intelligence', brandIntelligenceRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'content-management',
    timestamp: new Date().toISOString()
  });
});

export default router;