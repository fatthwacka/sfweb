/**
 * Quote Generator Modal - Clean Apple-style design
 */

import { X, Calculator } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { QuoteGeneratorCore } from '@/pages/tools/quote-generator';

interface QuoteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteGeneratorModal({ isOpen, onClose }: QuoteGeneratorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10 p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-salmon/20 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-salmon" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Quote Calculator</h2>
                <p className="text-xs text-muted-foreground">Build your custom package</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <QuoteGeneratorCore />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuoteGeneratorModal;
