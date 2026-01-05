import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabaseOperations } from '@/lib/supabase-operations';

// Convert camelCase keys to snake_case for Supabase
function convertToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  }
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = convertToSnakeCase(value);
  }
  
  return converted;
}

interface UseAutoSaveOptions {
  shootId: string;
  debounceMs?: number;
  successMessage?: string;
  errorMessage?: string;
}

interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export function useAutoSave({ shootId, debounceMs = 1200, successMessage, errorMessage }: UseAutoSaveOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<any>(null);

  const saveMutation = useMutation({
    mutationFn: (data: any) => supabaseOperations.shoots.update(shootId, data),
    onMutate: () => {
      setSaveStatus({ status: 'saving' });
    },
    onSuccess: () => {
      // OPTIMIZED: Only invalidate the specific shoot query, and delay it slightly
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['shoots', shootId] });
      }, 100);
      // Only invalidate all shoots when really necessary (removed for better performance)
      setSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date()
      });
      
      if (successMessage) {
        toast({
          title: "Saved",
          description: successMessage,
          duration: 2000
        });
      }
      
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
        description: errorMessage || "Failed to save changes. Please try again.",
        variant: "destructive"
      });

      // Auto-retry after 5 seconds
      setTimeout(() => {
        if (pendingDataRef.current) {
          saveMutation.mutate(pendingDataRef.current);
        }
      }, 5000);
    }
  });

  const debouncedSave = useCallback((data: any) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Convert camelCase to snake_case for Supabase
    const snakeCaseData = convertToSnakeCase(data);

    // Store the latest data
    pendingDataRef.current = snakeCaseData;

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        saveMutation.mutate(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, debounceMs);
  }, [saveMutation, debounceMs]);

  const saveImmediately = useCallback((data: any) => {
    // Clear any pending debounced saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Convert camelCase to snake_case for Supabase
    const snakeCaseData = convertToSnakeCase(data);
    
    pendingDataRef.current = snakeCaseData;
    saveMutation.mutate(snakeCaseData);
  }, [saveMutation]);

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
    isSaving: saveMutation.isPending
  };
}