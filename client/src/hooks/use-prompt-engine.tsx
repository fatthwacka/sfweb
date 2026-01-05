/**
 * usePromptEngine Hook
 * Reusable hook for prompt enhancement across all tools
 */

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface PromptEngineRequest {
  prompt: string;
  contentType?: 'image' | 'video' | 'caption' | 'blog' | 'script';
  brandContext?: {
    clientId: string;
    enabledFeatures: string[];
  };
  artStyle?: string;
  imageStyle?: string;
  targetLength?: number;
}

export interface PromptEngineResult {
  enhancedPrompt: string;
  alternatives: string[];
  brandInfluence: {
    appliedIndustry?: string;
    appliedVisual?: string;
    appliedVoice?: string;
  } | null;
  processingTime: number;
  metadata: {
    originalLength: number;
    enhancedLength: number;
    contentType: string;
    brandApplied: boolean;
  };
}

export function usePromptEngine() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [lastResult, setLastResult] = useState<PromptEngineResult | null>(null);

  const enhancePrompt = async (request: PromptEngineRequest): Promise<PromptEngineResult | null> => {
    if (!request.prompt?.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please provide a prompt to enhance.',
        variant: 'destructive',
      });
      return null;
    }

    setIsEnhancing(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/prompt-engine/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          contentType: request.contentType || 'image',
          brandContext: request.brandContext,
          artStyle: request.artStyle,
          imageStyle: request.imageStyle,
          targetLength: request.targetLength
        })
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const data = await response.json();
      
      const result: PromptEngineResult = {
        enhancedPrompt: data.enhancedPrompt || request.prompt,
        alternatives: data.alternatives || [],
        brandInfluence: data.brandInfluence || null,
        processingTime: data.processingTime || (Date.now() - startTime),
        metadata: data.metadata || {
          originalLength: request.prompt.length,
          enhancedLength: (data.enhancedPrompt || request.prompt).length,
          contentType: request.contentType || 'image',
          brandApplied: !!request.brandContext?.clientId
        }
      };

      setLastResult(result);

      toast({
        title: 'Prompt Enhanced',
        description: `Your ${request.contentType || 'image'} prompt has been optimized with AI${
          request.brandContext?.clientId ? ' and brand intelligence' : ''
        }.`,
      });

      return result;

    } catch (error) {
      console.error('Prompt enhancement error:', error);
      
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. Please try again.',
        variant: 'destructive',
      });

      // Return original prompt as fallback
      const fallbackResult: PromptEngineResult = {
        enhancedPrompt: request.prompt,
        alternatives: [],
        brandInfluence: null,
        processingTime: Date.now() - startTime,
        metadata: {
          originalLength: request.prompt.length,
          enhancedLength: request.prompt.length,
          contentType: request.contentType || 'image',
          brandApplied: false
        }
      };

      setLastResult(fallbackResult);
      return fallbackResult;

    } finally {
      setIsEnhancing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Prompt copied to clipboard.',
    });
  };

  return {
    enhancePrompt,
    isEnhancing,
    lastResult,
    copyToClipboard,
    // Convenience helpers
    hasEnhancement: !!lastResult,
    originalLength: lastResult?.metadata.originalLength || 0,
    enhancedLength: lastResult?.metadata.enhancedLength || 0,
    improvementRatio: lastResult 
      ? Math.round((lastResult.metadata.enhancedLength / lastResult.metadata.originalLength) * 100) / 100
      : 1
  };
}