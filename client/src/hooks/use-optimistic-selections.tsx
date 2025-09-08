import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface OptimisticState {
  [imageId: string]: {
    status: 'none' | 'favorite' | 'like' | 'dislike';
    isPending: boolean;
    retryCount: number;
    startTime: number;
  };
}

interface UseOptimisticSelectionsOptions {
  shootId: string;
  maxRetries?: number;
  debounceMs?: number;
  onError?: (imageId: string, error: any) => void;
}

export function useOptimisticSelections({
  shootId,
  maxRetries = 3,
  debounceMs = 300,
  onError,
}: UseOptimisticSelectionsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Enhanced mutation with network awareness
  const updateMutation = useMutation({
    mutationFn: async ({ 
      imageId, 
      status, 
      filename 
    }: { 
      imageId: string; 
      status: 'none' | 'favorite' | 'like' | 'dislike';
      filename: string;
    }) => {
      return apiRequest(`/api/client-selections/${shootId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageFilename: filename,
          selectionStatus: status,
          isFinalSelection: status === 'favorite',
        }),
      });
    },
  });

  const debouncedApiCall = useCallback((
    imageId: string, 
    status: 'none' | 'favorite' | 'like' | 'dislike',
    filename: string
  ) => {
    // Clear existing timeout
    if (timeoutRefs.current[imageId]) {
      clearTimeout(timeoutRefs.current[imageId]);
    }

    // Set new timeout
    timeoutRefs.current[imageId] = setTimeout(async () => {
      try {
        await updateMutation.mutateAsync({ imageId, status, filename });
        
        // Success: Remove from optimistic state
        setOptimisticState(prev => {
          const next = { ...prev };
          delete next[imageId];
          return next;
        });
        
        // Invalidate queries to sync with server
        queryClient.invalidateQueries({ queryKey: ['client-selections', shootId] });
        
      } catch (error) {
        const currentState = optimisticState[imageId];
        const retryCount = currentState?.retryCount || 0;
        
        if (retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          
          setOptimisticState(prev => ({
            ...prev,
            [imageId]: {
              ...prev[imageId],
              retryCount: retryCount + 1,
              isPending: true,
            }
          }));
          
          retryTimeouts.current[imageId] = setTimeout(() => {
            debouncedApiCall(imageId, status, filename);
          }, delay);
          
        } else {
          // Max retries exceeded
          setOptimisticState(prev => {
            const next = { ...prev };
            delete next[imageId];
            return next;
          });
          
          toast({
            title: 'Save Failed',
            description: 'Could not save selection. Please try again.',
            variant: 'destructive',
          });
          
          onError?.(imageId, error);
        }
      }
    }, debounceMs);
  }, [
    updateMutation, 
    shootId, 
    maxRetries, 
    debounceMs, 
    toast, 
    onError, 
    queryClient,
    optimisticState
  ]);

  // Enhanced update function with better timing awareness
  const updateSelection = useCallback((
    imageId: string,
    status: 'none' | 'favorite' | 'like' | 'dislike',
    filename: string
  ) => {
    // 1. Immediate optimistic update (always instant)
    setOptimisticState(prev => ({
      ...prev,
      [imageId]: {
        status,
        isPending: true,
        retryCount: 0,
        startTime: Date.now(),
      }
    }));

    // 2. Trigger debounced API call
    debouncedApiCall(imageId, status, filename);
  }, [debouncedApiCall]);

  // Enhanced pending check with timeout awareness
  const isPending = useCallback((imageId: string) => {
    const state = optimisticState[imageId];
    if (!state) return false;

    // If operation has been pending for more than 10 seconds, something's wrong
    const elapsed = Date.now() - state.startTime;
    if (elapsed > 10000) {
      // Clean up stale pending state
      setOptimisticState(prev => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
      return false;
    }

    return state.isPending;
  }, [optimisticState]);

  const getSelectionStatus = useCallback((
    imageId: string, 
    serverStatus: 'none' | 'favorite' | 'like' | 'dislike'
  ) => {
    const optimistic = optimisticState[imageId];
    return optimistic ? optimistic.status : serverStatus;
  }, [optimisticState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      Object.values(retryTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  return {
    updateSelection,
    getSelectionStatus,
    isPending,
    pendingCount: Object.keys(optimisticState).length,
  };
}