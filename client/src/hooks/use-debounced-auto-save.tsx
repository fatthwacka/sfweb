import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabaseOperations } from '@/lib/supabase-operations';

interface UseAutoSaveOptions {
  shootId: string;
  debounceMs?: number;
}

interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export function useAutoSaveGallerySettings({ shootId, debounceMs = 1000 }: UseAutoSaveOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingSettingsRef = useRef<any>(null);

  const saveAppearanceMutation = useMutation({
    mutationFn: (data: any) => supabaseOperations.shoots.update(shootId, data),
    onMutate: () => {
      setSaveStatus({ status: 'saving' });
    },
    onSuccess: () => {
      // OPTIMIZED: Only invalidate the specific shoot query, and delay it slightly
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['shoots', shootId] });
      }, 100);
      // Removed invalidation of all shoots query for better performance
      setSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date()
      });
      
      // Auto-hide "saved" status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle' } : prev);
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Auto-save failed:', error);
      setSaveStatus({ 
        status: 'error', 
        error: error.message || 'Save failed'
      });
      
      toast({
        title: "Save Error",
        description: "Failed to save gallery settings. Please try again.",
        variant: "destructive"
      });

      // Auto-retry after 5 seconds
      setTimeout(() => {
        if (pendingSettingsRef.current) {
          saveAppearanceMutation.mutate(pendingSettingsRef.current);
        }
      }, 5000);
    }
  });

  const debouncedSave = useCallback((gallerySettings: any) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Convert camelCase to snake_case for Supabase
    const snakeCaseData = { gallery_settings: gallerySettings };
    
    // Store the latest settings
    pendingSettingsRef.current = snakeCaseData;

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (pendingSettingsRef.current) {
        saveAppearanceMutation.mutate(pendingSettingsRef.current);
        pendingSettingsRef.current = null;
      }
    }, debounceMs);
  }, [saveAppearanceMutation, debounceMs]);

  const saveImmediately = useCallback((gallerySettings: any) => {
    // Clear any pending debounced saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Convert camelCase to snake_case for Supabase
    const snakeCaseData = { gallery_settings: gallerySettings };
    pendingSettingsRef.current = snakeCaseData;
    saveAppearanceMutation.mutate(snakeCaseData);
  }, [saveAppearanceMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    saveStatus,
    isSaving: saveAppearanceMutation.isPending
  };
}