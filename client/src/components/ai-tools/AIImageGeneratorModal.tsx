/**
 * AIImageGeneratorModal - Modal wrapper for AI Image Generator
 *
 * This component wraps AIImageGeneratorCore in a Dialog for use in:
 * - Article Editor
 * - Any other tool that needs AI image generation in a modal
 *
 * Flow:
 * 1. User generates image → stays in modal
 * 2. User selects from 4 URL versions (PNG, JPG, 2400px, Thumbnail) via compact buttons
 * 3. User clicks "Use This Image" → modal closes and returns selected URL
 *
 * Benefits:
 * - All enhancements to AIImageGeneratorCore automatically available
 * - Consistent image generation experience across the platform
 * - User can preview and select the optimal image version
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { AIImageGeneratorCore, type ImageGenerationResult, type ImageUrls } from './AIImageGeneratorCore';

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

  // State for holding generated result until user selects a version
  const [pendingResult, setPendingResult] = useState<ImageGenerationResult | null>(null);
  const [selectedUrlType, setSelectedUrlType] = useState<keyof ImageUrls>('compressedUrl'); // Default to web-optimised

  // Called when image is generated - DON'T close modal, store result instead
  const handleImageGenerated = (result: ImageGenerationResult) => {
    console.log('AIImageGeneratorModal: Image generated, storing pending result:', result);
    console.log('AIImageGeneratorModal: imageUrls available:', !!result.imageUrls);
    setPendingResult(result);
    // Modal stays open for user to select URL version
  };

  // Called when user clicks "Use This Image" after selecting a version
  const handleConfirmSelection = () => {
    if (!pendingResult) return;

    // Create modified result with the selected URL as the primary imageUrl
    const selectedUrl = pendingResult.imageUrls
      ? pendingResult.imageUrls[selectedUrlType]
      : pendingResult.imageUrl;

    const finalResult: ImageGenerationResult = {
      ...pendingResult,
      imageUrl: selectedUrl, // Override primary URL with user's selection
    };

    onImageGenerated(finalResult);

    // Clean up and close
    setPendingResult(null);
    setSelectedUrlType('compressedUrl');
    onClose();
  };

  // Called when modal is closed without selection
  const handleClose = () => {
    setPendingResult(null);
    setSelectedUrlType('compressedUrl');
    onClose();
  };

  // Compact URL option buttons for the 4 file sizes
  const urlOptions: { key: keyof ImageUrls; label: string; colour: string }[] = [
    { key: 'originalUrl', label: 'PNG', colour: 'purple' },
    { key: 'jpgUrl', label: 'JPG Full', colour: 'blue' },
    { key: 'compressedUrl', label: '2400px', colour: 'green' },
    { key: 'thumbnailUrl', label: 'Thumb', colour: 'amber' },
  ];

  // Get button style based on selection
  const getCompactButtonStyle = (key: keyof ImageUrls, colour: string) => {
    const isSelected = selectedUrlType === key;
    if (!isSelected) {
      return 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600';
    }
    switch (colour) {
      case 'purple': return 'bg-purple-600 text-white border-purple-400';
      case 'blue': return 'bg-blue-600 text-white border-blue-400';
      case 'green': return 'bg-green-600 text-white border-green-400';
      case 'amber': return 'bg-amber-600 text-white border-amber-400';
      default: return 'bg-gray-600 text-white border-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
            onCancel={handleClose}
            compact={true}
            showSystemPrompt={false}
            showApiPreview={false}
            showBackButton={false}
            // Pass URL selector props to show in the preview panel
            pendingResult={pendingResult}
            selectedUrlType={selectedUrlType}
            onUrlTypeChange={setSelectedUrlType}
            onConfirmSelection={handleConfirmSelection}
            urlOptions={urlOptions}
            getCompactButtonStyle={getCompactButtonStyle}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export ImageGenerationResult type for convenience
export type { ImageGenerationResult };

export default AIImageGeneratorModal;
