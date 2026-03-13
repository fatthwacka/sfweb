import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Calendar, HardDrive, Video as VideoIcon, ArrowRight, Clock } from 'lucide-react';
import type { VideoConflictInfo, VideoConflictResolution } from '@shared/schema';

interface VideoConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: VideoConflictInfo[];
  safeFileCount?: number;
  totalFileCount?: number;
  onResolve: (resolutions: VideoConflictResolution[]) => void;
  onCancel: () => void;
}

interface VideoConflictDecision {
  filename: string;
  action: 'replace' | 'skip' | 'add_new';
  keepPosition: boolean;
  targetVideoId: string;
}

// Helper to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return 'Unknown';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper to format video duration
const formatDuration = (seconds?: number) => {
  if (!seconds) return 'Unknown';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function VideoConflictResolutionDialog({
  safeFileCount = 0,
  totalFileCount = 0,
  open,
  onOpenChange,
  conflicts,
  onResolve,
  onCancel
}: VideoConflictResolutionDialogProps) {
  const [decisions, setDecisions] = useState<Record<string, VideoConflictDecision>>({});

  // Sync decisions when conflicts change
  useEffect(() => {
    const initialDecisions: Record<string, VideoConflictDecision> = {};
    conflicts.forEach(conflict => {
      initialDecisions[conflict.filename] = {
        filename: conflict.filename,
        action: 'replace', // Default to replace
        keepPosition: true, // Default to keeping position
        targetVideoId: conflict.existingVideo.id
      };
    });
    setDecisions(initialDecisions);
  }, [conflicts]);

  const updateDecision = (filename: string, updates: Partial<VideoConflictDecision>) => {
    setDecisions(prev => ({
      ...prev,
      [filename]: { ...prev[filename], ...updates }
    }));
  };

  const handleApplyToAll = (action: 'replace' | 'skip' | 'add_new') => {
    const newDecisions = { ...decisions };
    Object.keys(newDecisions).forEach(filename => {
      newDecisions[filename].action = action;
    });
    setDecisions(newDecisions);
  };

  const handleConfirm = () => {
    const resolutions: VideoConflictResolution[] = Object.values(decisions).map(decision => ({
      filename: decision.filename,
      action: decision.action,
      keepPosition: decision.keepPosition,
      targetVideoId: decision.targetVideoId
    }));
    onResolve(resolutions);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const allSkipped = Object.values(decisions).every(d => d.action === 'skip');
  const hasSafeFiles = safeFileCount > 0;
  const nothingToUpload = allSkipped && !hasSafeFiles;
  const replaceCount = Object.values(decisions).filter(d => d.action === 'replace').length;
  const skipCount = Object.values(decisions).filter(d => d.action === 'skip').length;
  const addNewCount = Object.values(decisions).filter(d => d.action === 'add_new').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-gradient-card max-w-4xl w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-salmon flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Video Filename Conflicts Detected
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {conflicts.length} video file{conflicts.length === 1 ? '' : 's'} match{conflicts.length === 1 ? 'es' : ''} existing videos in this gallery.
            {safeFileCount > 0 && (
              <span className="text-green-400"> {safeFileCount} file{safeFileCount === 1 ? '' : 's'} ha{safeFileCount === 1 ? 's' : 've'} no conflicts and will be uploaded.</span>
            )}
            {' '}Choose how to handle each conflict below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {conflicts.map((conflict, index) => {
              const decision = decisions[conflict.filename] || {
                filename: conflict.filename,
                action: 'replace' as const,
                keepPosition: true,
                targetVideoId: conflict.existingVideo.id
              };
              const existingVideo = conflict.existingVideo;
              
              return (
                <div key={conflict.filename} className="border border-border rounded-lg p-4">
                  {/* File header */}
                  <div className="flex items-center gap-2 mb-4">
                    <VideoIcon className="w-5 h-5 text-salmon" />
                    <span className="font-medium text-foreground">{conflict.filename}</span>
                    <Badge variant="destructive" className="ml-auto">Video Conflict</Badge>
                  </div>

                  {/* Comparison table */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center font-medium text-muted-foreground">
                      Property
                    </div>
                    <div className="text-center font-medium text-muted-foreground">
                      Existing
                    </div>
                    <div className="text-center font-medium text-muted-foreground">
                      New Upload
                    </div>

                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      File Size
                    </div>
                    <div className="text-center">
                      {formatFileSize(existingVideo.size)}
                    </div>
                    <div className="text-center">
                      {formatFileSize(conflict.newFileSize)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </div>
                    <div className="text-center">
                      {formatDuration(existingVideo.duration)}
                    </div>
                    <div className="text-center">
                      {formatDuration(conflict.newDuration)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                    <div className="text-center">
                      {formatDate(existingVideo.createdAt)}
                    </div>
                    <div className="text-center text-green-400">
                      Now
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Position
                    </div>
                    <div className="text-center">
                      #{existingVideo.sequence}
                    </div>
                    <div className="text-center">
                      {decision.action === 'replace' && decision.keepPosition 
                        ? `#${existingVideo.sequence}` 
                        : 'End of gallery'
                      }
                    </div>
                  </div>

                  {/* Action selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Action:</Label>
                    <RadioGroup
                      value={decision.action}
                      onValueChange={(value: 'replace' | 'skip' | 'add_new') => 
                        updateDecision(conflict.filename, { action: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="replace" id={`replace-${index}`} />
                        <Label htmlFor={`replace-${index}`} className="text-sm">
                          <span className="font-medium text-orange-400">Replace</span> existing video
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="skip" id={`skip-${index}`} />
                        <Label htmlFor={`skip-${index}`} className="text-sm">
                          <span className="font-medium text-gray-400">Skip</span> this file
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add_new" id={`add-new-${index}`} />
                        <Label htmlFor={`add-new-${index}`} className="text-sm">
                          <span className="font-medium text-green-400">Add as new</span> video
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Keep position option */}
                    {decision.action === 'replace' && (
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id={`keep-position-${index}`}
                          checked={decision.keepPosition}
                          onCheckedChange={(checked) => 
                            updateDecision(conflict.filename, { keepPosition: !!checked })
                          }
                        />
                        <Label htmlFor={`keep-position-${index}`} className="text-sm text-muted-foreground">
                          Keep existing position #{existingVideo.sequence}
                        </Label>
                      </div>
                    )}
                  </div>

                  {index < conflicts.length - 1 && <Separator className="mt-4" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Quick actions */}
        <div className="flex items-center gap-2 py-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Quick actions:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyToAll('replace')}
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            Replace All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyToAll('skip')}
            className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
          >
            Skip All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyToAll('add_new')}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            Add All as New
          </Button>
        </div>

        {/* Summary and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Summary: {replaceCount} replace, {skipCount} skip, {addNewCount} add new
            {hasSafeFiles && <span className="text-green-400"> + {safeFileCount} safe</span>}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-border hover:border-salmon"
            >
              Cancel Upload
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={nothingToUpload}
              className="bg-salmon text-white hover:bg-salmon-muted"
            >
              {nothingToUpload
                ? 'Nothing to Upload'
                : allSkipped && hasSafeFiles
                ? `Skip Conflicts & Upload ${safeFileCount} File${safeFileCount === 1 ? '' : 's'}`
                : 'Confirm & Upload Videos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}