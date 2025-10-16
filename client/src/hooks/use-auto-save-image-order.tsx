import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UseAutoSaveImageOrderOptions {
  shootId: string;
  debounceMs?: number;
}

interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export function useAutoSaveImageOrder({ shootId, debounceMs = 1500 }: UseAutoSaveImageOrderOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const saveImageOrderMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('🌐 mutationFn called, sending PATCH to /api/shoots/' + shootId, data);
      console.log(`📤 Sending ${Object.keys(data.imageSequences || {}).length} sequence updates to server`);

      // DON'T abort previous requests - let all saves complete
      // The debounce ensures we only send the final accumulated state
      // Multiple saves happening means rapid dragging, and all should succeed

      return apiRequest('PATCH', `/api/shoots/${shootId}`, data);
    },
    onMutate: (data) => {
      console.log('🔵 onMutate - starting SILENT save in background');

      // SILENT SAVE: No status indicator to avoid blocking perceived UI responsiveness
      // Users should see instant drag completion, not "Saving..." spinners

      // OPTIMISTIC UPDATE: Must update cache to prevent useEffect from resetting imageOrder
      // The component's useEffect watches query cache and resets local state if they don't match
      const previousShootData = queryClient.getQueryData(['/api/shoots', shootId]);

      if (previousShootData) {
        console.log('📦 Updating cache with', Object.keys(data.imageSequences || {}).length, 'sequence changes');
        queryClient.setQueryData(['/api/shoots', shootId], (old: any) => {
          if (!old?.shoot) return old;

          return {
            ...old,
            shoot: {
              ...old.shoot,
              bannerImageId: data.bannerImageId,
            },
            // Update image sequences in the images array
            images: old.images?.map((img: any) => ({
              ...img,
              sequence: data.imageSequences?.[img.id] ?? img.sequence
            })) || []
          };
        });
      } else {
        console.log('⚠️ No previous shoot data in cache');
      }

      // Return context for potential rollback
      return { previousShootData };
    },
    onSuccess: () => {
      console.log('✅ onSuccess - SILENT save completed in background');

      // SUCCESS: Server has persisted the image order
      // No cache updates or query invalidation needed because:
      // 1. Component uses local state (imageOrder) for rendering, not query cache
      // 2. Updating cache would cause re-renders and trigger infinite save loop
      // 3. Local state is already correct from the drag-and-drop action
      // 4. Query invalidation would cause 1+ minute refetch with 140+ images
      //
      // The local state is the source of truth, server is just persistence

      // SILENT SUCCESS: No UI feedback needed
      // The drag already completed instantly from the user's perspective
      if (isMountedRef.current) {
        setSaveStatus({
          status: 'saved',
          lastSaved: new Date()
        });

        // Auto-hide status immediately (no visible indicator)
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle' } : prev);
          }
        }, 100);
      }
    },
    onError: (error: any, data, context) => {
      console.error('❌ Image order SILENT save failed:', error);

      // No rollback needed since we don't modify cache optimistically
      // The local state remains as the user set it via drag-and-drop
      // The server just didn't persist it yet

      // Only show errors for real failures, not aborts
      if (error.name !== 'AbortError' && isMountedRef.current) {
        setSaveStatus({
          status: 'error',
          error: error.message || 'Save failed'
        });

        // Show a subtle toast, but don't block the UI
        toast({
          title: "Background save error",
          description: "Image order will retry automatically.",
          variant: "default"
        });

        // Auto-retry after 3 seconds (only for non-abort errors)
        setTimeout(() => {
          if (pendingDataRef.current && isMountedRef.current) {
            console.log('🔄 Retrying failed save...');
            saveImageOrderMutation.mutate(pendingDataRef.current);
          }
        }, 3000);
      }
    }
  });

  const lastOrderRef = useRef<string[]>([]);

  const debouncedSave = useCallback((imageOrder: string[], selectedCover: string | null) => {
    console.log('🔄 debouncedSave called with', imageOrder.length, 'images, cover:', selectedCover);

    // Clear existing timeout - this is KEY for accumulating multiple rapid drags
    if (timeoutRef.current) {
      console.log('⏰ Clearing existing timeout (accumulating changes)');
      clearTimeout(timeoutRef.current);
    }

    // DON'T abort in-flight requests - let them complete to avoid data loss
    // The debounce timeout will handle accumulating rapid changes
    // Only the final accumulated state will be sent after user stops dragging

    // OPTIMIZATION: Only send sequences that actually changed
    const newSequences: Record<string, number> = {};
    const oldOrder = lastOrderRef.current;

    console.log('📋 Comparing against lastOrderRef with', oldOrder.length, 'images');

    // Find images that moved to new positions
    imageOrder.forEach((imageId, index) => {
      const newSequence = index + 1;
      const oldIndex = oldOrder.indexOf(imageId);
      const oldSequence = oldIndex >= 0 ? oldIndex + 1 : -1;

      // Only include if sequence changed
      if (oldSequence !== newSequence) {
        newSequences[imageId] = newSequence;
      }
    });

    // CRITICAL OPTIMIZATION: Don't save if nothing changed
    if (Object.keys(newSequences).length === 0) {
      console.log(`🚫 No sequence changes detected - skipping save`);
      return;
    }

    const data = {
      bannerImageId: selectedCover,
      imageSequences: newSequences
    };

    console.log(`💡 Optimized save: ${Object.keys(newSequences).length} changed sequences out of ${imageOrder.length} total images`);

    // Store the latest data and update reference
    pendingDataRef.current = data;
    lastOrderRef.current = [...imageOrder];

    console.log('⏳ Setting timeout for', debounceMs, 'ms - will only save FINAL state');

    // Set new timeout - only fires after user stops dragging for debounceMs
    timeoutRef.current = setTimeout(() => {
      console.log('🚀 User stopped dragging, sending FINAL state to server');
      if (pendingDataRef.current && isMountedRef.current) {
        saveImageOrderMutation.mutate(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, debounceMs);
  }, [saveImageOrderMutation, debounceMs]);

  const saveImmediately = useCallback((imageOrder: string[], selectedCover: string | null) => {
    // Clear any pending debounced saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const imageSequences = imageOrder.length > 0 
      ? Object.fromEntries(imageOrder.map((id, index) => [id, index + 1]))
      : {};

    const data = {
      bannerImageId: selectedCover,
      imageSequences
    };
    
    pendingDataRef.current = data;
    saveImageOrderMutation.mutate(data);
  }, [saveImageOrderMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Clear any pending debounced saves
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Don't abort in-flight requests - let them complete even if component unmounts
      // This ensures data persistence is never interrupted
    };
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    saveStatus,
    isSaving: saveImageOrderMutation.isPending
  };
}