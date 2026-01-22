/**
 * AI Image Generator - Full Page Tool
 *
 * This page wraps the AIImageGeneratorCore component with full page layout.
 * All generation logic is delegated to the shared core component, ensuring
 * any enhancements are automatically available here and in modal deployments.
 *
 * Features inherited from AIImageGeneratorCore:
 * - 6 Image Ingredient slots with brand asset metadata
 * - Prompt enhancement with fine details, imperfections, realism instructions
 * - System prompt management (localStorage + Supabase)
 * - Enhancement guidelines (with/without assets paths)
 * - Brand Asset Picker integration
 * - Multiple AI model support (Gemini/Imagen)
 * - Text overlays (title/subtitle)
 * - Style controls (art style, image style)
 * - Resolution and aspect ratio configuration
 */

import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';
import { AIImageGeneratorCore, type ImageGenerationResult } from '@/components/ai-tools/AIImageGeneratorCore';
import { toast } from '@/hooks/use-toast';

export default function AIImageGenerator() {
  const [, setLocation] = useLocation();

  const handleImageGenerated = (result: ImageGenerationResult) => {
    // In full page mode, just show a toast - the image is already displayed in preview
    toast({
      title: 'Image Generated Successfully',
      description: 'Your AI image is ready. You can download it from the preview panel.',
    });
  };

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />

        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/tools')}
                className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
              <h1 className="text-4xl font-bold text-salmon mb-4">AI Image Generator</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Generate professional images using Google Vertex AI with custom prompts, styles, and text overlays
              </p>
            </div>
          </div>

          {/* Main Content - AIImageGeneratorCore with full features */}
          <div className="max-w-7xl mx-auto">
            <AIImageGeneratorCore
              onImageGenerated={handleImageGenerated}
              showSystemPrompt={true}
              showApiPreview={true}
              showBackButton={false}
              compact={false}
            />
          </div>
        </div>

        <Footer />
        <Toaster />
      </div>
    </GradientBackground>
  );
}
