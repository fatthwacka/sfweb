/**
 * AIImageGeneratorModal - Modal wrapper for AI Image Generator
 *
 * This component wraps AIImageGeneratorCore in a Dialog for use in:
 * - Article Editor
 * - Any other tool that needs AI image generation in a modal
 *
 * It provides the standard modal interface while delegating all
 * generation logic to the shared AIImageGeneratorCore component.
 *
 * Benefits:
 * - All enhancements to AIImageGeneratorCore automatically available
 * - Consistent image generation experience across the platform
 * - Proper modal behaviour with escape key and click-outside-to-close
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AIImageGeneratorCore, type ImageGenerationResult } from './AIImageGeneratorCore';

export interface AIImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (result: ImageGenerationResult) => void;

  // Context from calling environment (e.g., article editor)
  contextText?: string;        // Article content to analyze for prompt suggestions
  contextTitle?: string;       // Pre-fill title overlay (e.g., article headline)
  contextSubtitle?: string;    // Pre-fill subtitle overlay (e.g., article hook)

  // Optional: pre-select a brand client
  defaultBrandId?: string;

  // Optional: initial prompt text
  initialPrompt?: string;
}

export function AIImageGeneratorModal({
  isOpen,
  onClose,
  onImageGenerated,
  contextText,
  contextTitle,
  contextSubtitle,
  defaultBrandId,
  initialPrompt,
}: AIImageGeneratorModalProps) {

  const handleImageGenerated = (result: ImageGenerationResult) => {
    // Pass result to parent and close modal
    onImageGenerated(result);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl text-salmon">AI Image Generator</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <AIImageGeneratorCore
            initialPrompt={initialPrompt}
            contextText={contextText}
            contextTitle={contextTitle}
            contextSubtitle={contextSubtitle}
            defaultBrandId={defaultBrandId}
            onImageGenerated={handleImageGenerated}
            onCancel={onClose}
            compact={true}
            showSystemPrompt={false}
            showApiPreview={false}
            showBackButton={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export ImageGenerationResult type for convenience
export type { ImageGenerationResult };

export default AIImageGeneratorModal;
