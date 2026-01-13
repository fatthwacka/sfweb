/**
 * Prompt Engine API Routes
 * Handles brand-aware prompt enhancement for multiple content types
 */

import { Router } from 'express';
import { PromptEngineService } from '../services/prompt-engine-service';

const router = Router();
const promptService = new PromptEngineService();

// Main prompt enhancement endpoint
router.post('/enhance', async (req, res) => {
  try {
    const {
      prompt,
      contentType = 'image',
      brandContext,
      artStyle,
      imageStyle,
      targetLength,
      startingFrameImage  // For video: base64 image to provide visual context
    } = req.body;

    // Validate required fields
    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    console.log(`🧠 Enhancing ${contentType} prompt with brand context:`, {
      promptLength: prompt.length,
      brandEnabled: !!brandContext?.clientId,
      features: brandContext?.enabledFeatures || [],
      hasStartingFrame: !!startingFrameImage
    });

    const startTime = Date.now();
    const result = await promptService.enhancePrompt({
      prompt,
      contentType,
      brandContext,
      artStyle,
      imageStyle,
      targetLength,
      startingFrameImage  // Pass through to service for multimodal Gemini call
    });

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      enhancedPrompt: result.enhancedPrompt,
      alternatives: result.alternatives,
      brandInfluence: result.brandInfluence,
      processingTime,
      metadata: {
        originalLength: prompt.length,
        enhancedLength: result.enhancedPrompt.length,
        contentType,
        brandApplied: !!brandContext?.clientId
      }
    });

  } catch (error) {
    console.error('❌ Prompt enhancement error:', error);
    
    // Always return a working result - never break parent tools
    res.status(200).json({
      success: false,
      enhancedPrompt: req.body.prompt || '', // Fallback to original
      alternatives: [],
      brandInfluence: null,
      processingTime: 0,
      error: 'Enhancement failed, returned original prompt'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'prompt-engine',
    timestamp: new Date().toISOString()
  });
});

// Get available content types
router.get('/content-types', async (req, res) => {
  try {
    const contentTypes = await promptService.getAvailableContentTypes();
    
    // Transform to include brand support info
    const transformedTypes = contentTypes.map(type => ({
      value: type.type_key,
      label: type.label,
      description: type.description,
      word_limit: type.word_limit,
      character_limit: type.character_limit,
      supportsBrand: ['industry', 'visual', 'voice', 'audience', 'benefits', 'guidelines', 'compliance'] // All features supported
    }));

    res.json({
      success: true,
      contentTypes: transformedTypes
    });
  } catch (error) {
    console.error('❌ Content types fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content types'
    });
  }
});

export default router;