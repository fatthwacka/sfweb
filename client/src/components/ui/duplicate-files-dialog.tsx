import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DuplicateFilesDialogProps {
  open: boolean;
  onClose: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
  duplicateFilenames: string[];
}

export function DuplicateFilesDialog({
  open,
  onClose,
  onOverwrite,
  onCancel,
  duplicateFilenames
}: DuplicateFilesDialogProps) {
  const handleOverwrite = () => {
    onOverwrite();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-5 h-5" />
            Duplicate Files Detected
          </DialogTitle>
          <DialogDescription>
            The following files already exist in this preview album. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* List of duplicate filenames */}
          <div className="max-h-40 overflow-y-auto space-y-2">
            {duplicateFilenames.map((filename, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded bg-yellow-900/20 border border-yellow-500/30">
                <FileX className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium truncate">{filename}</span>
                <Badge variant="secondary" className="text-xs">
                  Exists
                </Badge>
              </div>
            ))}
          </div>

          {/* Information */}
          <div className="p-3 rounded bg-blue-900/20 border border-blue-500/30">
            <p className="text-sm text-blue-200">
              <strong>Note:</strong> Overwriting will replace the existing files with the new ones you're uploading. 
              This action cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <FileX className="w-4 h-4 mr-2" />
            Cancel Upload
          </Button>
          <Button
            onClick={handleOverwrite}
            className="bg-yellow-600 text-white hover:bg-yellow-700"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Overwrite Files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}