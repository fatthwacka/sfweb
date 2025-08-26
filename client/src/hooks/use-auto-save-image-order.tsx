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

export function useAutoSaveImageOrder({ shootId, debounceMs = 300 }: UseAutoSaveImageOrderOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveImageOrderMutation = useMutation({
    mutationFn: (data: any) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      return apiRequest('PATCH', `/api/shoots/${shootId}`, data, {
        signal: abortControllerRef.current.signal
      });
    },
    onMutate: (data) => {
      setSaveStatus({ status: 'saving' });
      
      // OPTIMISTIC UPDATE: Immediately update the cache with new data
      // This makes the UI respond instantly while the server processes the request
      const previousShootData = queryClient.getQueryData(['/api/shoots', shootId]);
      
      if (previousShootData) {
        queryClient.setQueryData(['/api/shoots', shootId], (old: any) => {
          if (!old?.shoot) return old;
          
          return {
            ...old,
            shoot: {
              ...old.shoot,
              bannerImageId: data.bannerImageId,
              // Update image sequences if provided
              ...(data.imageSequences && {
                images: old.images?.map((img: any) => ({
                  ...img,
                  sequence: data.imageSequences[img.id] || img.sequence
                }))
              })
            }
          };
        });
      }
      
      // Return context for potential rollback
      return { previousShootData };
    },
    onSuccess: () => {
      // OPTIMIZED: Only invalidate the specific shoot query, not all shoots
      // This reduces the query load dramatically
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/shoots', shootId] });
      }, 100);
      
      setSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date()
      });
      
      // Auto-hide "saved" status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle' } : prev);
      }, 2000);
    },
    onError: (error: any, data, context) => {
      console.error('Image order auto-save failed:', error);
      
      // ROLLBACK: Restore previous data if the request failed
      if (context?.previousShootData) {
        queryClient.setQueryData(['/api/shoots', shootId], context.previousShootData);
      }
      
      setSaveStatus({ 
        status: 'error', 
        error: error.message || 'Save failed'
      });
      
      // Only show toast if it's not an abort error (user triggered)
      if (error.name !== 'AbortError') {
        toast({
          title: "Save Error",
          description: "Failed to save image order. Please try again.",
          variant: "destructive"
        });

        // Auto-retry after 5 seconds (only for non-abort errors)
        setTimeout(() => {
          if (pendingDataRef.current) {
            saveImageOrderMutation.mutate(pendingDataRef.current);
          }
        }, 5000);
      }
    }
  });

  const lastOrderRef = useRef<string[]>([]);

  const debouncedSave = useCallback((imageOrder: string[], selectedCover: string | null) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // OPTIMIZATION: Only send sequences that actually changed
    const newSequences: Record<string, number> = {};
    const oldOrder = lastOrderRef.current;
    
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

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
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

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    saveStatus,
    isSaving: saveImageOrderMutation.isPending
  };
}