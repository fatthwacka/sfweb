import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UseSimpleSelectionsOptions {
  shootId: string;
  userEmail: string;
}

interface SelectionMap {
  [imageFilename: string]: {
    action: 'favorite' | 'like' | 'dislike' | 'none';
    isFavorite: boolean;
  };
}

export function useSimpleSelections({ shootId, userEmail }: UseSimpleSelectionsOptions) {
  const { toast } = useToast();
  const [selections, setSelections] = useState<SelectionMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set());
  
  // Load initial selections
  useEffect(() => {
    const loadSelections = async () => {
      try {
        const response = await apiRequest('GET', `/api/selections/${shootId}?userEmail=${userEmail}`);
        const data = await response.json();
        
        const selectionMap: SelectionMap = {};
        data.selections.forEach((s: any) => {
          selectionMap[s.imageFilename] = {
            action: s.action,
            isFavorite: s.isFavorite || false
          };
        });
        
        setSelections(selectionMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load selections:', error);
        setIsLoading(false);
      }
    };
    
    loadSelections();
  }, [shootId, userEmail]);
  
  // Update single selection (FAST)
  const updateSelection = useCallback(async (imageFilename: string, action: 'favorite' | 'like' | 'dislike' | 'none') => {
    // Optimistic update - instant UI response
    setSelections(prev => ({
      ...prev,
      [imageFilename]: {
        action: action,
        isFavorite: action === 'favorite'
      }
    }));
    
    // Mark as updating
    setIsUpdating(prev => new Set(prev).add(imageFilename));
    
    try {
      // Simple PUT request - no batching, no complexity
      const response = await apiRequest('PUT', `/api/selections/${shootId}/${encodeURIComponent(imageFilename)}`, {
        action,
        userEmail
      });
      
      if (!response.ok) {
        throw new Error('Failed to save selection');
      }
      
      // Update successful - selection already optimistically updated
      
    } catch (error) {
      // Rollback on error
      console.error('Selection update failed:', error);
      
      setSelections(prev => ({
        ...prev,
        [imageFilename]: {
          action: 'none',
          isFavorite: false
        }
      }));
      
      toast({
        title: 'Save Failed',
        description: 'Could not save your selection. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Remove from updating set
      setIsUpdating(prev => {
        const next = new Set(prev);
        next.delete(imageFilename);
        return next;
      });
    }
  }, [shootId, userEmail, toast]);
  
  // Clear all selections
  const clearAllSelections = useCallback(async () => {
    try {
      // Optimistic clear
      setSelections({});
      
      const response = await apiRequest('DELETE', `/api/selections/${shootId}`, {
        userEmail
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear selections');
      }
      
      toast({
        title: 'Selections Cleared',
        description: 'All selections have been removed.',
      });
      
    } catch (error) {
      console.error('Clear all failed:', error);
      
      // Reload selections on error
      window.location.reload();
    }
  }, [shootId, userEmail, toast]);
  
  // Helper functions
  const getSelection = useCallback((imageFilename: string) => {
    return selections[imageFilename] || { action: 'none', isFavorite: false };
  }, [selections]);
  
  const isSelected = useCallback((imageFilename: string, type: 'favorite' | 'like' | 'dislike') => {
    const selection = selections[imageFilename];
    if (!selection) return false;
    
    if (type === 'favorite') {
      return selection.isFavorite;
    }
    return selection.action === type;
  }, [selections]);
  
  // Count helpers
  const favoriteCount = Object.values(selections).filter(s => s.isFavorite).length;
  const likeCount = Object.values(selections).filter(s => s.action === 'like').length;
  const dislikeCount = Object.values(selections).filter(s => s.action === 'dislike').length;
  
  return {
    // State
    selections,
    isLoading,
    isUpdating: (imageFilename: string) => isUpdating.has(imageFilename),
    
    // Counts
    favoriteCount,
    likeCount,
    dislikeCount,
    
    // Actions
    updateSelection,
    clearAllSelections,
    
    // Helpers
    getSelection,
    isSelected,
  };
}