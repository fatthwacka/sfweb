import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface DebouncedSaveOptions {
  delay?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

export const useDebouncedApiSave = (options: DebouncedSaveOptions = {}) => {
  const { delay = 500, onSaveStart, onSaveSuccess, onSaveError } = options;
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<any>(null);

  const debouncedSave = useCallback(async (data: any) => {
    // Store the latest data to save
    pendingSaveRef.current = data;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(async () => {
      const dataToSave = pendingSaveRef.current;
      if (!dataToSave) return;

      try {
        setIsSaving(true);
        setSaveError(null);
        onSaveStart?.();

        // Save to site configuration API
        const response = await fetch('/api/site-config/bulk', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            portfolio: {
              featured: dataToSave
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to save settings: ${response.status}`);
        }

        // Invalidate React Query cache so current browser session updates
        await queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });

        onSaveSuccess?.();
      } catch (error: any) {
        console.error('Failed to save settings:', error);
        setSaveError(error.message || 'Failed to save settings');
        onSaveError?.(error);
      } finally {
        setIsSaving(false);
        pendingSaveRef.current = null;
      }
    }, delay);
  }, [delay, queryClient, onSaveStart, onSaveSuccess, onSaveError]);

  // Force save immediately (useful for explicit save buttons)
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (pendingSaveRef.current) {
      await debouncedSave(pendingSaveRef.current);
    }
  }, [debouncedSave]);

  // Cancel any pending saves
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingSaveRef.current = null;
    setIsSaving(false);
  }, []);

  return {
    debouncedSave,
    forceSave,
    cancelSave,
    isSaving,
    saveError
  };
};