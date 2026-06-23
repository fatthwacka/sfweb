/**
 * BlogStudioProvider - Context provider for Blog Content Studio
 * Manages client selection, pipeline state, active tab, and shared configuration
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

interface BrandClient {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  slug?: string;
}

interface PipelineState {
  inputSourcesCount: number;
  activeInputSources: number;
  outputDestinationsCount: number;
  activeOutputDestinations: number;
}

export type StudioTab = 'inputs' | 'editor' | 'outputs';

interface BlogStudioContextType {
  // Client selection
  clientId: string | null;
  setClientId: (id: string | null) => void;
  selectedClient: BrandClient | null;
  clients: BrandClient[];
  isLoadingClients: boolean;

  // Pipeline state
  pipelineState: PipelineState;
  setPipelineState: (state: PipelineState) => void;

  // Active tab
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;

  // AI generation trigger (raised from editor, triggered from header)
  triggerAIGeneration: boolean;
  setTriggerAIGeneration: (trigger: boolean) => void;

  // Legacy sidebar compatibility
  showInputPanel: boolean;
  setShowInputPanel: (show: boolean) => void;
  showOutputPanel: boolean;
  setShowOutputPanel: (show: boolean) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const BlogStudioContext = createContext<BlogStudioContextType | null>(null);

const STORAGE_KEY = 'blog-studio-selected-client';

// ============================================================================
// PROVIDER
// ============================================================================

interface BlogStudioProviderProps {
  children: ReactNode;
}

export function BlogStudioProvider({ children }: BlogStudioProviderProps) {
  // Client selection - persist to localStorage
  const [clientId, setClientIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Active tab
  const [activeTab, setActiveTab] = useState<StudioTab>('editor');

  // AI generation trigger
  const [triggerAIGeneration, setTriggerAIGeneration] = useState(false);

  // Pipeline state
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    inputSourcesCount: 0,
    activeInputSources: 0,
    outputDestinationsCount: 0,
    activeOutputDestinations: 0,
  });

  // Fetch clients from brand intelligence
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<BrandClient[]>({
    queryKey: ['blog-studio-clients'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/brand-intelligence/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      const list = data?.data?.clients || data?.clients || data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  // Derive selected client from clientId
  const selectedClient = clients.find(c => c.id === clientId) || null;

  // Persist client selection
  const setClientId = useCallback((id: string | null) => {
    setClientIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Validate persisted client still exists
  useEffect(() => {
    if (clientId && clients.length > 0 && !clients.find(c => c.id === clientId)) {
      setClientId(null);
    }
  }, [clientId, clients, setClientId]);

  // Legacy sidebar compatibility - derived from activeTab
  const showInputPanel = activeTab === 'inputs';
  const showOutputPanel = activeTab === 'outputs';
  const setShowInputPanel = useCallback((show: boolean) => {
    setActiveTab(show ? 'inputs' : 'editor');
  }, []);
  const setShowOutputPanel = useCallback((show: boolean) => {
    setActiveTab(show ? 'outputs' : 'editor');
  }, []);

  return (
    <BlogStudioContext.Provider
      value={{
        clientId,
        setClientId,
        selectedClient,
        clients,
        isLoadingClients,
        pipelineState,
        setPipelineState,
        activeTab,
        setActiveTab,
        triggerAIGeneration,
        setTriggerAIGeneration,
        showInputPanel,
        setShowInputPanel,
        showOutputPanel,
        setShowOutputPanel,
      }}
    >
      {children}
    </BlogStudioContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useBlogStudio(): BlogStudioContextType {
  const context = useContext(BlogStudioContext);
  if (!context) {
    throw new Error('useBlogStudio must be used within a BlogStudioProvider');
  }
  return context;
}
