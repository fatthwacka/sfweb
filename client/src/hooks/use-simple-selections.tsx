import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabaseOperations } from '@/lib/supabase-operations';

// CONVERTED TO SUPABASE: Direct client selections operations using client_selections table
// Previous Express API patterns replaced with clientSelectionOperations for better performance

interface UseSimpleSelectionsOptions {
  shootId: string;
  clientId: string; // Using clientId UUID instead of email for Supabase compatibility
}

// Backward compatibility interface for components still using userEmail
interface UseSimpleSelectionsEmailOptions {
  shootId: string;
  userEmail: string;
}

interface SelectionMap {
  [imageFilename: string]: {
    action: 'favorite' | 'like' | 'dislike' | 'none';
    isFavorite: boolean;
  };
}

export function useSimpleSelections({ shootId, clientId }: UseSimpleSelectionsOptions) {
  const { toast } = useToast();
  const [selections, setSelections] = useState<SelectionMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set());
  
  // Load initial selections
  useEffect(() => {
    const loadSelections = async () => {
      try {
        const data = await supabaseOperations.clientSelections.getByShootAndUser(shootId, clientId);
        
        const selectionMap: SelectionMap = {};
        data.selections.forEach((s: any) => {
          selectionMap[s.imageFilename] = {
            action: s.selectionStatus,
            isFavorite: s.isFinalSelection || false
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
  }, [shootId, clientId]);
  
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
      // Direct Supabase operation - no batching, no complexity
      await supabaseOperations.clientSelections.updateSelection(shootId, imageFilename, action, clientId);
      
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
  }, [shootId, clientId, toast]);
  
  // Clear all selections
  const clearAllSelections = useCallback(async () => {
    try {
      // Optimistic clear
      setSelections({});
      
      await supabaseOperations.clientSelections.clearAllSelections(shootId, clientId);
      
      toast({
        title: 'Selections Cleared',
        description: 'All selections have been removed.',
      });
      
    } catch (error) {
      console.error('Clear all failed:', error);
      
      // Reload selections on error
      window.location.reload();
    }
  }, [shootId, clientId, toast]);
  
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

// Backward compatibility hook that accepts userEmail and converts to clientId
export function useSimpleSelectionsWithEmail({ shootId, userEmail }: UseSimpleSelectionsEmailOptions) {
  const { toast } = useToast();
  const [selections, setSelections] = useState<SelectionMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set());
  
  // Calculate overall progress
  const favoriteCount = Object.values(selections).filter(s => s.isFavorite).length;
  const likeCount = Object.values(selections).filter(s => s.action === 'like').length;
  const dislikeCount = Object.values(selections).filter(s => s.action === 'dislike').length;

  // Load initial selections using email
  useEffect(() => {
    const loadSelections = async () => {
      try {
        const data = await supabaseOperations.clientSelections.getByShootAndEmail(shootId, userEmail);
        
        const selectionMap: SelectionMap = {};
        data.selections.forEach((s: any) => {
          selectionMap[s.imageFilename] = {
            action: s.selectionStatus,
            isFavorite: s.isFinalSelection || false
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
  
  // Update single selection using email
  const updateSelection = useCallback(async (imageFilename: string, action: 'favorite' | 'like' | 'dislike' | 'none') => {
    // Optimistic update
    setSelections(prev => ({
      ...prev,
      [imageFilename]: {
        action: action,
        isFavorite: action === 'favorite'
      }
    }));
    
    setIsUpdating(prev => new Set(prev).add(imageFilename));
    
    try {
      await supabaseOperations.clientSelections.updateSelectionByEmail(shootId, imageFilename, action, userEmail);
    } catch (error) {
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
      setIsUpdating(prev => {
        const next = new Set(prev);
        next.delete(imageFilename);
        return next;
      });
    }
  }, [shootId, userEmail, toast]);
  
  // Clear all selections using email
  const clearAllSelections = useCallback(async () => {
    try {
      setSelections({});
      
      await supabaseOperations.clientSelections.clearAllSelectionsByEmail(shootId, userEmail);
      
      toast({
        title: 'Selections Cleared',
        description: 'All selections have been removed.',
      });
    } catch (error) {
      console.error('Clear all failed:', error);
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