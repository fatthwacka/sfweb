/**
 * Article Editor - Supabase Version
 * Full-featured article editor using Supabase backend (migrated from Airtable)
 * Supports AI-assisted writing, image management, and content enhancement
 */

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Upload, ArrowLeft, ArrowRight, Sparkles, Search, MinusCircle, PlusCircle, CheckCircle, RefreshCw, MessageSquare, Undo2, FolderOpen, Cloud } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIImageGeneratorModal, type ImageGenerationResult } from '@/components/ai-tools/AIImageGeneratorModal';
import { UnsplashModal, type UnsplashResult } from '@/components/tools/UnsplashModal';
import { CloudStorageBrowserModal, type CloudStorageResult } from '@/components/tools/CloudStorageBrowserModal';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Types for Supabase article structure
interface SupabaseArticle {
  id: string;
  article_number?: number;
  headline: string;
  hook: string;
  content: string;
  focus_angle?: string;
  image_placement?: string;
  image_url?: string;
  image_attribution?: string;
  status: string;
  client: string;
  source_title?: string;
  source_url?: string;
  tone?: string;
  word_count?: number;
  hashtags?: string;
  notes?: string;
  airtable_id?: string;
  blog_post_id?: string;
  created_at: string;
  updated_at: string;
}

// Legacy field mapping for backward compatibility with UI components
// Maps Supabase snake_case to display-friendly names
const fieldDisplayNames: Record<string, string> = {
  'article_number': 'Article Number',
  'headline': 'Headline',
  'hook': 'Hook',
  'content': 'Content',
  'focus_angle': 'Focus Angle',
  'image_placement': 'Image Placement',
  'image_url': 'Image URL',
  'status': 'Status',
  'client': 'Client',
  'source_title': 'Source Title',
  'source_url': 'Source URL',
  'hashtags': 'Hashtags',
  'notes': 'Notes',
  'created_at': 'Created Date',
};

interface Filters {
  status: string;
  client: string;
  sourceTitle: string;
  sortOrder: string;
}

// Tone options - defined outside component to prevent recreation
const toneOptions = [
  { value: 'humorous', label: 'Humorous' },
  { value: 'poetic', label: 'Poetic' },
  { value: 'professional', label: 'Professional' },
  { value: 'viral', label: 'Viral Attention Grabbing' },
  { value: 'curiosity', label: 'Curiosity Provoking' },
  { value: 'question', label: 'Pose a Question' },
  { value: 'braggy', label: 'Braggy or Showy' }
];

// Props interface for enhancement tools
interface EnhancementToolsProps {
  content: string;
  sectionKey: string;
  sectionTitle?: string;
  onUpdate: (content: string) => void;
  isHashtags?: boolean;
  isReady: boolean;
  processingSection: string | null;
  showUndo: boolean;
  hasPreviousContent: boolean;
  onEnhance: (action: 'reduce' | 'increase' | 'grammar' | 'rewrite') => void;
  onToneChange: (tone: string) => void;
  onCustomPrompt: (prompt: string) => void;
  onUndo: () => void;
}

// Memoized enhancement tools component - prevents flickering by being stable
const SectionEnhancementToolsStable = memo(function SectionEnhancementToolsStable({
  content,
  sectionKey,
  sectionTitle,
  isHashtags = false,
  isReady,
  processingSection,
  showUndo,
  hasPreviousContent,
  onEnhance,
  onToneChange,
  onCustomPrompt,
  onUndo
}: EnhancementToolsProps) {
  const [localPromptText, setLocalPromptText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasContent = content.trim().length > 0;
  const isProcessing = processingSection?.startsWith(sectionKey);

  const handleCustomSubmit = () => {
    if (!localPromptText.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    onCustomPrompt(localPromptText);
    setLocalPromptText('');
  };

  return (
    <div className="flex items-center gap-1">
      {/* Undo Button - Fixed position on LEFT */}
      <div className="w-8 h-8 flex items-center justify-center">
        {isReady && showUndo && hasPreviousContent ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onUndo}
            className="w-8 h-8 p-0 text-blue-400 hover:text-blue-300"
            title="Undo last change"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        ) : null}
      </div>

      {/* Reduce */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isReady || !hasContent || isProcessing}
        onClick={() => onEnhance('reduce')}
        className={`w-8 h-8 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
          processingSection === `${sectionKey}-reduce` ? 'animate-pulse text-amber-400' : ''
        }`}
        title={isHashtags ? "Remove one hashtag" : "Reduce word count by 40-50%"}
      >
        <MinusCircle className="w-3.5 h-3.5" />
      </Button>

      {/* Increase */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isReady || isProcessing}
        onClick={() => onEnhance('increase')}
        className={`w-8 h-8 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
          processingSection === `${sectionKey}-increase` ? 'animate-pulse text-amber-400' : ''
        }`}
        title={isHashtags ? "Add one hashtag" : "Increase word count by 40-50%"}
      >
        <PlusCircle className="w-3.5 h-3.5" />
      </Button>

      {/* Grammar Check - Not for hashtags */}
      {!isHashtags && (
        <Button
          size="sm"
          variant="ghost"
          disabled={!isReady || !hasContent || isProcessing}
          onClick={() => onEnhance('grammar')}
          className={`w-8 h-8 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-grammar` ? 'animate-pulse text-amber-400' : ''
          }`}
          title="Grammar and spelling check"
        >
          <CheckCircle className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Rewrite */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isReady || !hasContent || isProcessing}
        onClick={() => onEnhance('rewrite')}
        className={`w-8 h-8 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
          processingSection === `${sectionKey}-rewrite` ? 'animate-pulse text-amber-400' : ''
        }`}
        title={isHashtags ? "Regenerate 4 categorised hashtags" : "Complete rewrite (±40% word count)"}
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </Button>

      {/* Custom Prompt */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={!isReady || !hasContent || isProcessing}
            className={`w-8 h-8 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
              processingSection === `${sectionKey}-custom` ? 'animate-pulse text-amber-400' : ''
            }`}
            title="Custom prompt for this section"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Custom Enhancement Prompt</DialogTitle>
            <DialogDescription className="text-gray-300">
              Provide specific instructions for how to enhance {sectionTitle || 'this section'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder={isHashtags
                ? "e.g., 'Generate hashtags focused on photography and visual content'"
                : "e.g., 'Make this more engaging with a call to action' or 'Add statistics about the photography industry'"
              }
              value={localPromptText}
              onChange={(e) => setLocalPromptText(e.target.value)}
              className="bg-gray-900 text-gray-200 border-gray-600 min-h-[120px]"
              rows={5}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setLocalPromptText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomSubmit}
              disabled={!localPromptText || processingSection === `${sectionKey}-custom`}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processingSection === `${sectionKey}-custom` ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Prompt'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tone Selector - Not for hashtags */}
      {!isHashtags && (
        <Select onValueChange={onToneChange} disabled={!isReady || !hasContent || isProcessing}>
          <SelectTrigger className={`w-28 h-8 text-xs transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-tone` ? 'animate-pulse text-amber-400' : ''
          }`}>
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent className="min-w-36">
            {toneOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="px-4 py-2">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
});

// Overlay spinner component - also moved outside
const FieldOverlaySpinner = memo(function FieldOverlaySpinner({
  processingSection,
  sectionKey,
  isVisible
}: {
  processingSection: string | null;
  sectionKey: string;
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  const currentAction = processingSection?.split('-')[1];

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
      <div className="text-center">
        <div className="relative mb-3">
          <div className="w-10 h-10 mx-auto">
            <div className="absolute inset-0 border-3 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute inset-1 border-2 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-300 font-medium">
          {currentAction === 'reduce' && 'Reducing...'}
          {currentAction === 'increase' && 'Expanding...'}
          {currentAction === 'grammar' && 'Checking...'}
          {currentAction === 'rewrite' && 'Rewriting...'}
          {currentAction === 'tone' && 'Adjusting tone...'}
          {currentAction === 'custom' && 'Applying...'}
        </p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
});

export default function ArticleEditorSupabase() {
  const [location] = useLocation();

  // State
  const [articles, setArticles] = useState<SupabaseArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentArticle, setCurrentArticle] = useState<SupabaseArticle | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [jumpToNumber, setJumpToNumber] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(true); // Supabase is always ready (no config fetch needed)

  // Dynamic filter options (from ALL articles, not filtered)
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [allArticles, setAllArticles] = useState<SupabaseArticle[]>([]); // Unfiltered articles for option extraction

  // Filters (matching HTML version)
  const [filters, setFilters] = useState<Filters>({
    status: 'All',
    client: 'slyfox',
    sourceTitle: 'All',
    sortOrder: 'Newest First'
  });

  // Compute available source titles based on selected client
  const availableSourceTitles = useMemo((): string[] => {
    if (filters.client === 'All') {
      // Show all source titles when no client filter
      return Array.from(new Set(
        allArticles
          .map(article => article.source_title)
          .filter((title): title is string => !!title && title.trim() !== '')
      )).sort();
    }
    // Filter source titles to only those matching the selected client (case-insensitive)
    return Array.from(new Set(
      allArticles
        .filter(article => article.client?.toLowerCase() === filters.client.toLowerCase())
        .map(article => article.source_title)
        .filter((title): title is string => !!title && title.trim() !== '')
    )).sort();
  }, [allArticles, filters.client]);

  // Parse URL parameters for initial filter state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientParam = urlParams.get('client');
    const statusParam = urlParams.get('status');
    const sourceParam = urlParams.get('source');
    const sortParam = urlParams.get('sort');
    
    if (clientParam || statusParam || sourceParam || sortParam) {
      setFilters(prev => ({
        status: statusParam || prev.status,
        client: clientParam || prev.client,
        sourceTitle: sourceParam || prev.sourceTitle,
        sortOrder: sortParam || prev.sortOrder
      }));
    }
  }, [location]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  // AI Image Generation States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isUnsplashModalOpen, setIsUnsplashModalOpen] = useState(false);
  const [isCloudStorageModalOpen, setIsCloudStorageModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageAttribution, setImageAttribution] = useState<{user: string; username: string; source: 'unsplash' | 'ai' | 'upload' | 'cloud'} | null>(null);

  // Enhancement system state
  const [processingSection, setProcessingSection] = useState<string | null>(null);
  const [previousContent, setPreviousContent] = useState<{[key: string]: string}>({});
  const [showUndo, setShowUndo] = useState<{[key: string]: boolean}>({});
  const [enhancementsReady, setEnhancementsReady] = useState(false);

  // File input ref for upload button
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Supabase and fetch articles on mount
  useEffect(() => {
    initSupabase();
  }, []);

  // Fetch all articles once to populate filter options
  useEffect(() => {
    if (supabaseReady && allArticles.length === 0) {
      fetchAllArticlesForOptions();
    }
  }, [supabaseReady]);

  // Fetch filtered articles when filters change
  useEffect(() => {
    if (supabaseReady) {
      fetchArticles();
    }
  }, [filters, supabaseReady]);

  // Enable enhancement tools after page stabilises (prevents flickering)
  useEffect(() => {
    if (!loading && currentArticle) {
      // Small delay to let React finish rendering before enabling tools
      const timer = setTimeout(() => setEnhancementsReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, currentArticle]);

  // Apply search filtering to ALL articles (not just filtered ones) - search ALL fields
  const filteredArticles = searchQuery.trim() 
    ? allArticles.filter(article => {
        const searchLower = searchQuery.toLowerCase();
        // Search through ALL article fields
        return Object.values(article).some(value => 
          value && typeof value === 'string' && 
          value.toLowerCase().includes(searchLower)
        ) ||
        // Also search article number
        (article.article_number &&
         article.article_number.toString().includes(searchQuery.trim()));
      })
    : articles;

  // Update navigation to use filtered articles
  const displayArticles = filteredArticles;
  const displayCurrentIndex = searchQuery.trim() 
    ? selectedSearchIndex
    : currentIndex;
  const displayCurrentArticle = searchQuery.trim()
    ? (displayArticles.length > selectedSearchIndex ? displayArticles[selectedSearchIndex] : null)
    : currentArticle;

  // Reset search selection when query changes
  useEffect(() => {
    setSelectedSearchIndex(0);
  }, [searchQuery]);

  // Search navigation functions
  const handleSearchPrev = () => {
    if (selectedSearchIndex > 0) {
      setSelectedSearchIndex(selectedSearchIndex - 1);
    }
  };

  const handleSearchNext = () => {
    if (selectedSearchIndex < displayArticles.length - 1) {
      setSelectedSearchIndex(selectedSearchIndex + 1);
    }
  };

  const selectSearchResult = (index: number) => {
    setSelectedSearchIndex(index);
  };

  // Supabase is initialized at module level - no config fetch needed
  const initSupabase = async () => {
    // Verify Supabase connection by doing a simple query
    try {
      const { error } = await supabase.from('content_articles').select('id').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
        setError('Failed to connect to database. Please try again.');
        setSupabaseReady(false);
      } else {
        setSupabaseReady(true);
      }
    } catch (err) {
      console.error('Supabase init error:', err);
      setError('Failed to initialize database connection.');
      setSupabaseReady(false);
    }
  };

  // Fetch all articles (no filters) to populate filter dropdowns
  const fetchAllArticlesForOptions = async () => {
    if (!supabaseReady) return;

    try {
      // Fetch all articles from Supabase - just client and source_title for filter options
      const { data, error } = await supabase
        .from('content_articles')
        .select('id, client, source_title')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch articles for options:', error.message);
        return;
      }

      // Store minimal article data for option extraction
      setAllArticles(data as SupabaseArticle[]);

      // Extract unique clients (case-insensitive deduplication)
      const clientMap = new Map<string, string>();
      data
        .map(article => article.client)
        .filter(client => client && client.trim() !== '')
        .forEach(client => {
          const lowerKey = client.toLowerCase();
          if (!clientMap.has(lowerKey)) {
            clientMap.set(lowerKey, client);
          } else {
            // Prefer capitalized versions
            const existing = clientMap.get(lowerKey)!;
            if (client[0] === client[0].toUpperCase() && existing[0] !== existing[0].toUpperCase()) {
              clientMap.set(lowerKey, client);
            }
          }
        });
      const uniqueClients = Array.from(clientMap.values()).sort();
      setAvailableClients(uniqueClients);

      // Auto-match default client filter to actual case
      const matchedClient = uniqueClients.find(
        c => c.toLowerCase() === filters.client.toLowerCase()
      );
      if (matchedClient && matchedClient !== filters.client) {
        console.log('🔧 Auto-correcting client filter case:', filters.client, '→', matchedClient);
        setFilters(prev => ({ ...prev, client: matchedClient }));
      }

      console.log('Filter options populated:', {
        clients: uniqueClients,
        totalArticles: data.length
      });

    } catch (err: any) {
      console.warn('Failed to load filter options:', err.message);
    }
  };

  // Fetch articles from Supabase with filters
  const fetchArticles = async () => {
    if (!supabaseReady) return;

    try {
      setLoading(true);
      setLoadingProgress(0);
      setError(null);

      // Start progress bar animation (faster for Supabase)
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5; // Faster progress for Supabase
        });
      }, 100);

      console.log('Applied filters:', filters);

      // Build Supabase query with filters
      let query = supabase
        .from('content_articles')
        .select('*');

      // Apply filters
      if (filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }
      if (filters.client !== 'All') {
        query = query.ilike('client', filters.client); // Case-insensitive match
      }
      if (filters.sourceTitle !== 'All') {
        query = query.eq('source_title', filters.sourceTitle);
      }

      // Apply sorting
      const ascending = filters.sortOrder === 'Oldest First';
      query = query.order('article_number', { ascending });

      const { data, error: queryError } = await query;

      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (queryError) {
        throw new Error(`Failed to fetch articles: ${queryError.message}`);
      }

      const formattedArticles = data as SupabaseArticle[];

      if (formattedArticles.length === 0) {
        // Handle empty results (same logic as HTML)
        if (initialLoad) {
          setError('No articles found with default filters. Showing all articles.');
          setFilters({ status: 'All', client: 'All', sourceTitle: 'All', sortOrder: 'Newest First' });            
          setInitialLoad(false);
          return;
        } else {
          setError('No articles found matching current filters. Try adjusting your filter settings.');
          if (articles.length === 0) {
            setArticles([]);
            setCurrentArticle(null);
            setCurrentIndex(0);
          }
        }
      } else {
        setArticles(formattedArticles);
        setCurrentArticle({...formattedArticles[0]});
        setCurrentIndex(0);
        setInitialLoad(false);
      }
    } catch (err: any) {
      setError(`Failed to load articles: ${err.message}`);
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  // Navigation functions (matching HTML logic)
  const goToArticle = (index: number) => {
    if (index >= 0 && index < articles.length) {
      setCurrentIndex(index);
      setCurrentArticle({...articles[index]});
      setIsModified(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToArticle(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < articles.length - 1) {
      goToArticle(currentIndex + 1);
    }
  };

  const handleJumpToArticle = () => {
    const articleNumber = parseInt(jumpToNumber);
    if (!articleNumber || articleNumber < 1) {
      setError('Please enter a valid article number');
      return;
    }

    const targetArticle = articles.find(article => article.article_number === articleNumber);
    if (!targetArticle) {
      setError(`Article ${articleNumber} not found`);
      return;
    }

    const targetIndex = articles.findIndex(article => article.article_number === articleNumber);
    goToArticle(targetIndex);
    setJumpToNumber('');
    setError(null);
  };

  // Field change handler (using snake_case field names)
  const handleFieldChange = (field: string, value: string) => {
    setCurrentArticle(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
    setIsModified(true);

    // Clear attribution when image URL is manually changed
    if (field === 'image_url' && imageAttribution) {
      setImageAttribution(null);
    }
  };

  // Filter change handler
  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };

      // When client changes, reset sourceTitle to 'All' since available sources will change
      if (filterType === 'client') {
        newFilters.sourceTitle = 'All';
      }

      return newFilters;
    });
  };

  // Image upload functionality - uses server proxy to keep API key secure
  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // Use server-side proxy endpoint to keep ImgBB API key secure
    const response = await fetch('/api/upload/imgbb', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${errorText}`);
    }

    const data = await response.json();
    if (!data.success || !data.url) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.url;
  };

  // Image compression function
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const maxDimension = 1920;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', 0.8); // 80% quality
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be less than 20MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      setError(null);
      
      // Compress image if it's large
      let processedFile = file;
      if (file.size > 500 * 1024) { // Compress if > 500KB
        console.log(`Compressing image from ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        processedFile = await compressImage(file);
        console.log(`Compressed to ${(processedFile.size / 1024).toFixed(2)}KB`);
      }
      
      const imageUrl = await uploadImageToImgBB(processedFile);
      handleFieldChange('image_url', imageUrl);
      
      console.log('Image uploaded successfully:', imageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // Save article to Supabase
  const saveArticle = async (status = 'Edited') => {
    if (!currentArticle?.id || !supabaseReady) return;

    try {
      const isPublishing = status === 'Published';
      if (isPublishing) {
        setPublishing(true);
      } else {
        setSaving(true);
      }
      setError(null);

      // Prepare update data - exclude read-only fields
      const updateData: Partial<SupabaseArticle> = {
        headline: currentArticle.headline,
        hook: currentArticle.hook,
        content: currentArticle.content,
        client: currentArticle.client,
        status: status,
        source_url: currentArticle.source_url,
        source_title: currentArticle.source_title,
        focus_angle: currentArticle.focus_angle,
        tone: currentArticle.tone,
        word_count: currentArticle.word_count,
        image_url: currentArticle.image_url,
        image_placement: currentArticle.image_placement,
        image_attribution: currentArticle.image_attribution,
        hashtags: currentArticle.hashtags,
        notes: currentArticle.notes,
        // updated_at is automatically handled by Supabase trigger
      };

      console.log('Saving to Supabase:', { id: currentArticle.id, ...updateData });

      const { data, error: updateError } = await supabase
        .from('content_articles')
        .update(updateData)
        .eq('id', currentArticle.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to save article: ${updateError.message}`);
      }

      console.log('Save successful!', data);

      // Update local state with returned data
      const updatedArticle = data as SupabaseArticle;
      const updatedArticles = articles.map(article =>
        article.id === currentArticle.id ? updatedArticle : article
      );
      setArticles(updatedArticles);
      setCurrentArticle(updatedArticle);
      setIsModified(false);

      // Show success feedback
      if (isPublishing) {
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 2000);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }

    } catch (err: any) {
      console.error('Save failed with error:', err);
      setError(`Failed to ${status === 'Published' ? 'publish' : 'save'} article: ${err.message}`);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  // AI Image Generation Handlers
  const handleOpenAIGenerator = () => {
    setIsAIModalOpen(true);
  };

  const handleCloseAIGenerator = () => {
    setIsAIModalOpen(false);
  };

  const handleOpenUnsplash = () => {
    setIsUnsplashModalOpen(true);
  };

  const handleCloseUnsplash = () => {
    setIsUnsplashModalOpen(false);
  };

  const handleAIImageGenerated = async (result: ImageGenerationResult) => {
    try {
      // The modal now handles URL selection and returns the chosen URL in result.imageUrl
      handleFieldChange('image_url', result.imageUrl);

      if (result.attribution) {
        setImageAttribution(result.attribution);
      } else {
        setImageAttribution(null);
      }

      toast({
        title: 'AI Image Added',
        description: 'AI-generated image has been added to the article. Remember to save your changes.',
      });
    } catch (error: any) {
      console.error('Error handling AI generated image:', error);
      toast({
        title: 'Error',
        description: 'Failed to add AI generated image to article.',
        variant: 'destructive',
      });
    }
  };

  const handleUnsplashSelected = async (result: UnsplashResult) => {
    try {
      // Update the current article with the Unsplash image URL
      handleFieldChange('image_url', result.imageUrl);

      // Store attribution information
      setImageAttribution({
        user: result.attribution.user,
        username: result.attribution.username,
        source: 'unsplash',
      });

      toast({
        title: 'Unsplash Image Added',
        description: 'Unsplash image has been added to the article. Remember to save your changes.',
      });
    } catch (error: any) {
      console.error('Error handling Unsplash image:', error);
      toast({
        title: 'Error',
        description: 'Failed to add Unsplash image to article.',
        variant: 'destructive',
      });
    }
  };

  // Cloud Storage Browser handlers
  const handleOpenCloudStorage = () => {
    setIsCloudStorageModalOpen(true);
  };

  const handleCloseCloudStorage = () => {
    setIsCloudStorageModalOpen(false);
  };

  const handleCloudStorageSelected = (result: CloudStorageResult) => {
    try {
      // Update the current article with the cloud storage image URL
      handleFieldChange('image_url', result.imageUrl);

      // Set attribution for cloud storage
      setImageAttribution({
        user: 'Cloud Storage',
        username: result.filename,
        source: 'cloud',
      });

      toast({
        title: 'Cloud Storage Image Added',
        description: `${result.filename} has been added to the article. Remember to save your changes.`,
      });
    } catch (error: any) {
      console.error('Error handling cloud storage image:', error);
      toast({
        title: 'Error',
        description: 'Failed to add cloud storage image to article.',
        variant: 'destructive',
      });
    }
  };

  // Trigger native file browser for image upload
  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection for cloud upload (compress and upload to Google Cloud Storage)
  const handleCloudUploadFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    try {
      setUploadingImage(true);

      // Compress image in browser before upload (max 2400px, 80% quality)
      const compressedBase64 = await compressImageForUpload(file);

      // Upload to Google Cloud Storage
      const response = await fetch('/api/cloud-storage/upload-user-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer staff-token'
        },
        body: JSON.stringify({
          imageBase64: compressedBase64,
          filename: file.name,
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      // Set the image URL on the article
      handleFieldChange('image_url', result.url);

      // Set attribution
      setImageAttribution({
        user: 'User Upload',
        username: file.name,
        source: 'upload',
      });

      toast({
        title: 'Image Uploaded',
        description: 'Your image has been uploaded to cloud storage and added to the article.',
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image to cloud storage.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Compress image in browser (max 2400px, 80% quality JPG)
  const compressImageForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          // Calculate new dimensions (max 2400px on longest side)
          const maxSize = 2400;
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height / width) * maxSize);
              width = maxSize;
            } else {
              width = Math.round((width / height) * maxSize);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw with white background (for transparency)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPG at 80% quality
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Get article context for AI analysis
  const getArticleContext = () => {
    return {
      headline: displayCurrentArticle?.headline || '',
      hook: displayCurrentArticle?.hook || '',
      content: displayCurrentArticle?.content ? displayCurrentArticle.content.slice(0, 500) : '',
    };
  };

  // Section enhancement function with updated logic per user requirements
  const enhanceSection = async (
    content: string,
    action: 'reduce' | 'increase' | 'grammar' | 'rewrite' | 'tone' | 'custom',
    sectionKey: string,
    sectionTitle?: string,
    toneOrCustomPrompt?: string
  ): Promise<string | undefined> => {
    if (!content.trim() && action !== 'increase') {
      toast({ title: "Error", description: "No content to enhance", variant: "destructive" });
      return;
    }

    // Calculate word count for reference
    const wordCount = content.split(/\s+/).filter(w => w.trim()).length;
    const targetReduceWords = Math.round(wordCount * 0.55); // 40-50% reduction = 50-60% remaining
    const targetIncreaseWords = Math.round(wordCount * 1.45); // 40-50% increase

    // Build article context for AI to understand the full picture
    // Include which field is being edited so AI knows what NOT to repeat
    const otherFields = {
      headline: sectionKey !== 'headline' ? displayCurrentArticle?.headline : null,
      hook: sectionKey !== 'hook' ? displayCurrentArticle?.hook : null,
      content: sectionKey !== 'content' ? displayCurrentArticle?.content?.substring(0, 800) : null,
    };

    const articleContext = `
ARTICLE CONTEXT (for reference - do NOT include this in your response):
- Client/Brand: ${displayCurrentArticle?.client || 'Unknown'}
- Headline: ${otherFields.headline || '[This is the field being edited]'}
- Hook: ${otherFields.hook || '[This is the field being edited]'}
- Content: ${otherFields.content || '[This is the field being edited]'}${(displayCurrentArticle?.content?.length || 0) > 800 && sectionKey !== 'content' ? '...' : ''}

CRITICAL RULES:
1. AVOID REPETITION: Do NOT repeat phrases, ideas, or information already stated in other fields above
2. Each field should add UNIQUE value - if the headline says something, don't repeat it in the hook
3. Your output should COMPLEMENT the other fields, not duplicate them
4. NEVER include hashtags (#) in your response - hashtags are handled in a separate field
---
`;

    const enhancementPrompts = {
      reduce: `${articleContext}
CONCISE REWRITE TASK: Rewrite the ${sectionTitle || 'section'} below to be more concise.
Target approximately ${targetReduceWords} words (currently ${wordCount} words - aim for 40-50% reduction).
DO NOT simply truncate or chop off sentences. Instead:
- Rewrite the entire content with tighter, more economical phrasing
- Preserve ALL key messages and important information
- Use fewer words to convey the same meaning
- If heavily reduced, prioritise the most important points
- Maintain the original tone and style
- Ensure it still fits naturally with the rest of the article

${sectionTitle?.toUpperCase() || 'SECTION'} TO REWRITE:
${content}

Return only the rewritten ${sectionTitle?.toLowerCase() || 'content'}, no explanations.`,

      increase: `${articleContext}
EXPANSION TASK: Keep the existing ${sectionTitle || 'content'} EXACTLY as written, then append new sentences.
Current word count: ${wordCount} words. Target: approximately ${targetIncreaseWords} words (40-50% increase).
DO NOT modify, rephrase, or rewrite the original text in any way.
Simply add new, relevant sentences at the end that:
- Provide additional value, context, or supporting details
- Flow naturally from the existing content
- Maintain the same tone and style
- Are consistent with the overall article theme and message

ORIGINAL ${sectionTitle?.toUpperCase() || 'CONTENT'} (preserve exactly):
${content}

Return the original content followed by your new appended sentences.`,

      grammar: `${articleContext}
Correct any spelling, grammar, or punctuation errors in this ${sectionTitle || 'section'}. Improve sentence structure for clarity and flow. Do not change the content meaning or length significantly.

${sectionTitle?.toUpperCase() || 'CONTENT'} TO CHECK:
${content}

Return only the corrected content.`,

      rewrite: `${articleContext}
COMPLETE REWRITE TASK with STRICT WORD COUNT REQUIREMENT:

⚠️ CRITICAL: The original has ${wordCount} words. Your rewrite MUST be between ${Math.round(wordCount * 0.6)} and ${Math.round(wordCount * 1.4)} words.
This is a HARD REQUIREMENT - not a suggestion. Count your words before responding.

Instructions:
- Rewrite using ENTIRELY fresh phrasing (different words, sentence structures, vocabulary)
- PRESERVE the core message, key information, and overall meaning
- ${wordCount <= 6 ? 'This is a short title/headline - maintain similar brevity and impact' : 'Maintain a similar tone and professional quality'}
- Ensure it fits naturally with the article's headline, hook, and overall theme
- DO NOT add new information or significantly expand the scope
- DO NOT truncate important information to hit word count

ORIGINAL ${sectionTitle?.toUpperCase() || 'CONTENT'} (${wordCount} words):
${content}

TARGET WORD COUNT: ${Math.round(wordCount * 0.6)}-${Math.round(wordCount * 1.4)} words (aim for approximately ${wordCount} words)

Return only the rewritten content, no explanations or word counts.`,

      tone: `${articleContext}
TONE ADJUSTMENT TASK with WORD COUNT REQUIREMENT:

⚠️ WORD COUNT: Original has ${wordCount} words. Your output MUST be between ${Math.round(wordCount * 0.6)} and ${Math.round(wordCount * 1.4)} words.

Instructions:
- Rewrite in a TONE_PLACEHOLDER tone
- Adjust language style, word choice, and sentence structure to match the requested tone
- PRESERVE the core message and key information
- ${wordCount <= 6 ? 'This is a short title/headline - maintain similar brevity' : 'Maintain similar length and depth of content'}
- Ensure it fits naturally with the overall article context

ORIGINAL ${sectionTitle?.toUpperCase() || 'CONTENT'} (${wordCount} words):
${content}

TARGET: Approximately ${wordCount} words (±40% tolerance: ${Math.round(wordCount * 0.6)}-${Math.round(wordCount * 1.4)} words)

Return only the rewritten content in the requested tone.`
    };

    // Store previous content for undo
    setPreviousContent(prev => ({ ...prev, [sectionKey]: content }));
    setProcessingSection(`${sectionKey}-${action}`);

    try {
      let prompt: string;

      if (action === 'custom' && toneOrCustomPrompt) {
        // Use the same articleContext for custom prompts (includes anti-repetition rules)
        prompt = `${articleContext}
USER INSTRUCTION: ${toneOrCustomPrompt}

Current word count: ${wordCount} words. Unless your instruction specifies otherwise, try to maintain similar length (±40%).

${sectionTitle?.toUpperCase() || 'SECTION'} TO ENHANCE:
${content}

Return only the enhanced ${sectionTitle?.toLowerCase() || 'content'}, no explanations.`;
      } else if (action === 'tone' && toneOrCustomPrompt) {
        prompt = enhancementPrompts.tone.replace('TONE_PLACEHOLDER', toneOrCustomPrompt);
      } else {
        prompt = enhancementPrompts[action as keyof typeof enhancementPrompts];
      }

      const requestBody = {
        type: 'excerpt',
        context: prompt,
        contentType: 'informational'
      };

      console.log('🔧 Enhancement request:', {
        sectionKey,
        action,
        originalLength: content.length,
        originalWords: wordCount,
      });

      const response = await fetch('/api/ai/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const result = await response.json();

      let enhancedContent: string | undefined;
      if (result.content) {
        enhancedContent = result.content.trim();
      } else if (result.text) {
        enhancedContent = result.text.trim();
      }

      if (!enhancedContent) {
        throw new Error('No enhanced content received');
      }

      console.log('🔧 Enhancement result:', {
        sectionKey,
        action,
        originalWords: wordCount,
        enhancedWords: enhancedContent.split(/\s+/).filter(w => w.trim()).length,
      });

      // Show undo option
      setShowUndo(prev => ({ ...prev, [sectionKey]: true }));

      // Auto-hide undo after 10 seconds
      setTimeout(() => {
        setShowUndo(prev => ({ ...prev, [sectionKey]: false }));
      }, 10000);

      toast({
        title: "Success",
        description: `${sectionTitle || 'Section'} ${action === 'grammar' ? 'checked' : action + 'd'} successfully`,
        duration: 2000
      });

      return enhancedContent;

    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} section`,
        variant: "destructive"
      });
      return content;
    } finally {
      setProcessingSection(null);
    }
  };

  // Hashtag-specific enhancement function
  const enhanceHashtags = async (
    content: string,
    action: 'reduce' | 'increase' | 'rewrite' | 'custom',
    customPrompt?: string
  ): Promise<string | undefined> => {
    const currentHashtags = content.split(/\s+/).filter(h => h.startsWith('#'));
    const hashtagCount = currentHashtags.length;

    // Track if we're doing full generation (should append client hashtag)
    let isFullGeneration = false;

    setPreviousContent(prev => ({ ...prev, hashtags: content }));
    setProcessingSection(`hashtags-${action}`);

    try {
      let prompt: string;

      if (action === 'custom' && customPrompt) {
        prompt = `${customPrompt}

Current hashtags: ${content}
Article context:
Headline: ${displayCurrentArticle?.headline || ''}
Hook: ${displayCurrentArticle?.hook || ''}

Return only the hashtags separated by spaces.`;
      } else if (action === 'reduce' && hashtagCount > 1) {
        prompt = `Remove exactly ONE hashtag from this list, keeping the ${hashtagCount - 1} most relevant ones.
Current hashtags: ${content}

Return only the remaining hashtags separated by spaces, no explanation.`;
      } else if (action === 'increase') {
        // If hashtags are empty, generate full set like rewrite
        if (!content.trim()) {
          // Treat empty + increase same as rewrite (generate 3 + client)
          isFullGeneration = true;
          prompt = `Generate exactly 3 social media hashtags for this article.

ARTICLE:
Headline: ${displayCurrentArticle?.headline || ''}
Hook: ${displayCurrentArticle?.hook || ''}
Content: ${displayCurrentArticle?.content?.substring(0, 600) || ''}

GENERATE 3 HASHTAGS:
1. BROAD: Popular general hashtag (e.g. #Photography #Marketing #Business #Lifestyle)
2. NICHE: Industry-specific hashtag (e.g. #ProductPhotography #BrandStrategy #ContentMarketing)
3. TRENDING: Creative/viral hashtag (e.g. #BehindTheScenes #ContentIsKing #TransformationTuesday)

FORMAT RULES:
- Start each with # symbol
- CamelCase for multi-word (e.g. #ProductPhotography NOT #Product #Photography)
- Separate with single spaces
- NO explanations, NO numbering, NO sentences
- EXACTLY 3 hashtags

OUTPUT EXACTLY LIKE THIS:
#Broad #Niche #Trending`;
        } else {
          prompt = `Add exactly ONE new relevant hashtag to this list.
Current hashtags: ${content}
Article context:
Headline: ${displayCurrentArticle?.headline || ''}
Hook: ${displayCurrentArticle?.hook || ''}

The new hashtag should be relevant to the article content.
Return all hashtags (existing + new one) separated by spaces, no explanation.`;
        }
      } else if (action === 'rewrite') {
        // We'll generate 3 hashtags from AI and append the client name ourselves
        isFullGeneration = true;
        prompt = `Generate exactly 3 social media hashtags for this article.

ARTICLE:
Headline: ${displayCurrentArticle?.headline || ''}
Hook: ${displayCurrentArticle?.hook || ''}
Content: ${displayCurrentArticle?.content?.substring(0, 600) || ''}

GENERATE 3 HASHTAGS:
1. BROAD: Popular general hashtag (e.g. #Photography #Marketing #Business #Lifestyle)
2. NICHE: Industry-specific hashtag (e.g. #ProductPhotography #BrandStrategy #ContentMarketing)
3. TRENDING: Creative/viral hashtag (e.g. #BehindTheScenes #ContentIsKing #TransformationTuesday)

FORMAT RULES:
- Start each with # symbol
- CamelCase for multi-word (e.g. #ProductPhotography NOT #Product #Photography)
- Separate with single spaces
- NO explanations, NO numbering, NO sentences
- EXACTLY 3 hashtags

OUTPUT EXACTLY LIKE THIS:
#Broad #Niche #Trending`;
      } else {
        return content;
      }

      const requestBody = {
        type: 'excerpt',
        context: prompt,
        contentType: 'informational'
      };

      console.log('🏷️ Sending hashtag request:', { action, hashtagCount, isFullGeneration });

      const response = await fetch('/api/ai/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🏷️ API error:', response.status, errorText);
        throw new Error(`Hashtag enhancement failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('🏷️ Full API response:', result);
      let enhancedContent = (result.content || result.text || '').trim();

      console.log('🏷️ Raw hashtag response:', enhancedContent);

      // Clean up hashtag output - extract only valid hashtags
      // Must start with # and contain letters/numbers (CamelCase supported)
      const hashtagMatches = enhancedContent.match(/#[A-Za-z][A-Za-z0-9_]*/g);

      if (hashtagMatches && hashtagMatches.length > 0) {
        // Filter out very short hashtags (likely errors) and take unique ones
        const uniqueHashtags = Array.from(new Set(hashtagMatches)) as string[];
        let validHashtags = uniqueHashtags.filter(h => h.length >= 3 && h.length <= 50);

        if (validHashtags.length > 0) {
          // For full generation, limit to exactly 3 AI hashtags (we'll add client as 4th)
          if (isFullGeneration && validHashtags.length > 3) {
            console.log('🏷️ Limiting to 3 AI hashtags (was', validHashtags.length, ')');
            validHashtags = validHashtags.slice(0, 3);
          }

          enhancedContent = validHashtags.join(' ');

          // For full generation (rewrite OR increase-from-empty), append client name as hashtag
          console.log('🏷️ Checking client:', {
            action,
            isFullGeneration,
            hasArticle: !!displayCurrentArticle,
            clientField: displayCurrentArticle?.client
          });

          if (isFullGeneration && displayCurrentArticle?.client) {
            // Convert client name to CamelCase hashtag (remove spaces, special chars)
            const clientName = displayCurrentArticle.client.trim();
            console.log('🏷️ Client name for hashtag:', clientName);

            const clientHashtag = '#' + clientName
              .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
              .split(/\s+/) // Split by spaces
              .filter((word: string) => word.length > 0) // Remove empty strings
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
              .join(''); // Join without spaces

            console.log('🏷️ Generated client hashtag:', clientHashtag);

            // Only add if valid and not already present
            if (clientHashtag.length > 1 && !enhancedContent.toLowerCase().includes(clientHashtag.toLowerCase())) {
              enhancedContent = `${enhancedContent} ${clientHashtag}`;
              console.log('🏷️ Appended client hashtag, total now 4');
            }
          } else if (isFullGeneration) {
            // No client available - proceed with just 3 AI hashtags (graceful degradation)
            console.log('🏷️ No client name available - using 3 AI hashtags only');
          }

          console.log('🏷️ Final hashtags:', enhancedContent);
        } else {
          throw new Error('No valid hashtags found in response');
        }
      } else {
        // No valid hashtags found - don't try to create fake ones
        console.error('🏷️ No hashtags found in response:', enhancedContent);
        throw new Error('AI did not return valid hashtags. Please try again.');
      }

      if (!enhancedContent || enhancedContent === '#') {
        throw new Error('No valid hashtags received');
      }

      setShowUndo(prev => ({ ...prev, hashtags: true }));
      setTimeout(() => {
        setShowUndo(prev => ({ ...prev, hashtags: false }));
      }, 10000);

      toast({
        title: "Success",
        description: `Hashtags ${action === 'rewrite' ? 'regenerated' : action + 'd'} successfully`,
        duration: 2000
      });

      return enhancedContent;

    } catch (error) {
      console.error('Hashtag enhancement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage.includes('valid hashtags') ? errorMessage : `Failed to ${action} hashtags`,
        variant: "destructive"
      });
      return content;
    } finally {
      setProcessingSection(null);
    }
  };

  // Undo function
  const undoEnhancement = (sectionKey: string, updateFunction: (content: string) => void) => {
    const originalContent = previousContent[sectionKey];
    if (originalContent !== undefined) {
      updateFunction(originalContent);
      setShowUndo(prev => ({ ...prev, [sectionKey]: false }));
      setPreviousContent(prev => {
        const newPrev = { ...prev };
        delete newPrev[sectionKey];
        return newPrev;
      });
      toast({ title: "Undone", description: "Restored to previous version" });
    }
  };

  // Wrapper component that connects stable component to parent state
  const SectionEnhancementTools = useCallback(({
    content,
    sectionKey,
    sectionTitle,
    onUpdate,
    isHashtags = false
  }: {
    content: string;
    sectionKey: string;
    sectionTitle?: string;
    onUpdate: (content: string) => void;
    isHashtags?: boolean;
  }) => {
    const handleEnhance = async (action: 'reduce' | 'increase' | 'grammar' | 'rewrite') => {
      try {
        let enhanced: string | undefined;
        if (isHashtags) {
          enhanced = await enhanceHashtags(content, action as 'reduce' | 'increase' | 'rewrite');
        } else {
          enhanced = await enhanceSection(content, action, sectionKey, sectionTitle);
        }
        if (enhanced && enhanced !== content) {
          onUpdate(enhanced);
        }
      } catch (error) {
        console.error('Enhancement error:', error);
      }
    };

    const handleToneChange = async (tone: string) => {
      if (isHashtags) return;
      try {
        const enhanced = await enhanceSection(content, 'tone', sectionKey, sectionTitle, tone);
        if (enhanced && enhanced !== content) {
          onUpdate(enhanced);
        }
      } catch (error) {
        console.error('Tone change error:', error);
      }
    };

    const handleCustomPrompt = async (prompt: string) => {
      try {
        let enhanced: string | undefined;
        if (isHashtags) {
          enhanced = await enhanceHashtags(content, 'custom', prompt);
        } else {
          enhanced = await enhanceSection(content, 'custom', sectionKey, sectionTitle, prompt);
        }
        if (enhanced && enhanced !== content) {
          onUpdate(enhanced);
        }
      } catch (error) {
        console.error('Custom prompt error:', error);
      }
    };

    const handleUndo = () => {
      undoEnhancement(sectionKey, onUpdate);
    };

    return (
      <SectionEnhancementToolsStable
        content={content}
        sectionKey={sectionKey}
        sectionTitle={sectionTitle}
        onUpdate={onUpdate}
        isHashtags={isHashtags}
        isReady={enhancementsReady}
        processingSection={processingSection}
        showUndo={showUndo[sectionKey] || false}
        hasPreviousContent={!!previousContent[sectionKey]}
        onEnhance={handleEnhance}
        onToneChange={handleToneChange}
        onCustomPrompt={handleCustomPrompt}
        onUndo={handleUndo}
      />
    );
  }, [enhancementsReady, processingSection, showUndo, previousContent, displayCurrentArticle]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-lg">Loading articles...</span>
              </div>
              <div className="w-80 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-100 ease-out" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <span className="text-gray-400 text-sm">{loadingProgress}%</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state (when no articles and error)
  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm max-w-md w-full mx-4">
              <CardContent className="p-6">
                <Alert className="bg-red-900/50 border-red-600 text-red-200 mb-4">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={fetchArticles}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header with Integrated Filters */}
        <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              {/* Top Row - Title and Navigation */}
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-orange-400">Article Editor</CardTitle>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-300">
                    Article {displayCurrentArticle?.article_number || 'N/A'} | {displayCurrentIndex + 1} of {displayArticles.length}
                    {searchQuery && ` (filtered)`}
                  </span>
                  
                  {/* Jump to article section */}
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-slate-300">Jump to:</Label>
                    <Input
                      type="number"
                      value={jumpToNumber}
                      onChange={(e) => setJumpToNumber(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleJumpToArticle();
                        }
                      }}
                      placeholder="#"
                      className="w-16"
                    />
                    <Button
                      onClick={handleJumpToArticle}
                      size="sm"
                    >
                      Go
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={searchQuery ? handleSearchPrev : handlePrev}
                      disabled={searchQuery ? selectedSearchIndex === 0 : currentIndex === 0}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={searchQuery ? handleSearchNext : handleNext}
                      disabled={searchQuery ? selectedSearchIndex === displayArticles.length - 1 : currentIndex === articles.length - 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Filters and Search */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-600">
                {/* Search Filter */}
                <div className="flex items-center space-x-2 min-w-0">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Search:</Label>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search headlines, content..."
                    className="w-64 min-w-0"
                  />
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery('')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Status:</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Edited">Edited</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Client:</Label>
                  <Select
                    value={filters.client}
                    onValueChange={(value) => handleFilterChange('client', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {availableClients.map(client => (
                        <SelectItem key={client} value={client}>{client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source Title Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Source:</Label>
                  <Select
                    value={filters.sourceTitle}
                    onValueChange={(value) => handleFilterChange('sourceTitle', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {availableSourceTitles.map(title => (
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Sort:</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Newest First">Newest First</SelectItem>
                      <SelectItem value="Oldest First">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search Results List */}
        {searchQuery && displayArticles.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">
                🔍 Search Results ({displayArticles.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {displayArticles.map((article, index) => (
                  <div
                    key={article.id}
                    onClick={() => selectSearchResult(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      index === selectedSearchIndex 
                        ? 'bg-blue-600/30 border border-blue-500' 
                        : 'bg-slate-700/30 hover:bg-slate-600/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-orange-400">
                            #{article.article_number || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {article.client || 'No Client'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            article.status === 'Published' ? 'bg-green-600/20 text-green-300' :
                            article.status === 'Edited' ? 'bg-blue-600/20 text-blue-300' :
                            article.status === 'Draft' ? 'bg-yellow-600/20 text-yellow-300' :
                            'bg-slate-600/20 text-slate-300'
                          }`}>
                            {article.status || 'Unknown'}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-white truncate">
                          {article.headline || 'No Headline'}
                        </h4>
                        <p className="text-xs text-slate-300 truncate mt-1">
                          {article.hook || 'No hook...'}
                        </p>
                      </div>
                      {index === selectedSearchIndex && (
                        <div className="flex items-center text-blue-400 ml-2">
                          <span className="text-xs">Viewing</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty Search Results */}
        {searchQuery && displayArticles.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm mb-6">
            <CardContent className="p-6 text-center">
              <div className="text-slate-400">
                <p>No articles found for "{searchQuery}"</p>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  className="mt-2 text-blue-400 hover:text-blue-300"
                >
                  Clear search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>
              {error}
              <Button 
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="ml-4"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {displayCurrentArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  
                  {/* Headline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="headline" className="text-slate-300">Headline</Label>
                      <SectionEnhancementTools
                        content={displayCurrentArticle.headline || ''}
                        sectionKey="headline"
                        sectionTitle="Headline"
                        onUpdate={(content) => handleFieldChange('headline', content)}
                      />
                    </div>
                    <div className="relative">
                      <Input
                        id="headline"
                        value={displayCurrentArticle.headline || ''}
                        onChange={(e) => handleFieldChange('headline', e.target.value)}
                        placeholder="Enter headline..."
                        disabled={!!searchQuery || processingSection?.startsWith('headline')}
                      />
                      <FieldOverlaySpinner
                        processingSection={processingSection}
                        sectionKey="headline"
                        isVisible={processingSection?.startsWith('headline') || false}
                      />
                    </div>
                  </div>

                  {/* Hook */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hook" className="text-slate-300">Hook</Label>
                      <SectionEnhancementTools
                        content={displayCurrentArticle.hook || ''}
                        sectionKey="hook"
                        sectionTitle="Hook"
                        onUpdate={(content) => handleFieldChange('hook', content)}
                      />
                    </div>
                    <div className="relative">
                      <Textarea
                        id="hook"
                        value={displayCurrentArticle.hook || ''}
                        onChange={(e) => handleFieldChange('hook', e.target.value)}
                        rows={3}
                        placeholder="Enter hook..."
                        disabled={!!searchQuery || processingSection?.startsWith('hook')}
                      />
                      <FieldOverlaySpinner
                        processingSection={processingSection}
                        sectionKey="hook"
                        isVisible={processingSection?.startsWith('hook') || false}
                      />
                    </div>
                  </div>

                  {/* Content - Large */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content" className="text-slate-300">Content</Label>
                      <SectionEnhancementTools
                        content={displayCurrentArticle.content || ''}
                        sectionKey="content"
                        sectionTitle="Content"
                        onUpdate={(content) => handleFieldChange('content', content)}
                      />
                    </div>
                    <div className="relative">
                      <Textarea
                        id="content"
                        value={displayCurrentArticle.content || ''}
                        onChange={(e) => handleFieldChange('content', e.target.value)}
                        rows={18}
                        placeholder="Enter content..."
                        className="text-sm"
                        disabled={!!searchQuery || processingSection?.startsWith('content')}
                      />
                      <FieldOverlaySpinner
                        processingSection={processingSection}
                        sectionKey="content"
                        isVisible={processingSection?.startsWith('content') || false}
                      />
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hashtags" className="text-slate-300">Hashtags</Label>
                      <SectionEnhancementTools
                        content={displayCurrentArticle.hashtags || ''}
                        sectionKey="hashtags"
                        sectionTitle="Hashtags"
                        onUpdate={(content) => handleFieldChange('hashtags', content)}
                        isHashtags={true}
                      />
                    </div>
                    <div className="relative">
                      <Input
                        id="hashtags"
                        value={displayCurrentArticle.hashtags || ''}
                        onChange={(e) => handleFieldChange('hashtags', e.target.value)}
                        placeholder="Enter hashtags..."
                        disabled={!!searchQuery || processingSection?.startsWith('hashtags')}
                      />
                      <FieldOverlaySpinner
                        processingSection={processingSection}
                        sectionKey="hashtags"
                        isVisible={processingSection?.startsWith('hashtags') || false}
                      />
                    </div>
                  </div>

                  {/* Focus Angle */}
                  <div className="space-y-2">
                    <Label htmlFor="focus-angle" className="text-slate-300">Focus Angle</Label>
                    <Input
                      id="focus-angle"
                      value={displayCurrentArticle.focus_angle || ''}
                      onChange={(e) => handleFieldChange('focus_angle', e.target.value)}
                      placeholder="Enter focus angle..."
                      disabled={!!searchQuery}
                    />
                  </div>

                  {/* Image Placement */}
                  <div className="space-y-2">
                    <Label htmlFor="image-placement" className="text-slate-300">Image Placement</Label>
                    <Input
                      id="image-placement"
                      value={displayCurrentArticle.image_placement || ''}
                      onChange={(e) => handleFieldChange('image_placement', e.target.value)}
                      placeholder="Enter image placement..."
                      disabled={!!searchQuery}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons - Moved to left column for better space usage */}
              <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:space-y-0">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant="destructive"
                        disabled={deleting}
                        className="w-full sm:w-auto"
                      >
                        {deleting ? 'DELETING...' : 'DELETE'}
                      </Button>
                      <Button 
                        variant="outline"
                        disabled={rejecting}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                      >
                        {rejecting ? 'REJECTING...' : 'REJECT'}
                      </Button>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant="outline"
                        disabled={!isModified || saving || publishing || !!searchQuery}
                        onClick={() => saveArticle('Edited')}
                        className={`border-orange-500 text-orange-400 hover:bg-orange-500/10 w-full sm:w-auto ${
                          saveSuccess ? 'bg-green-600 text-white border-green-600' : ''
                        }`}
                      >
                        {saving ? 'SAVING...' : saveSuccess ? 'SAVED!' : 'SAVE CHANGES'}
                      </Button>
                      <Button 
                        disabled={!isModified || saving || publishing || !!searchQuery}
                        onClick={() => saveArticle('Published')}
                        className={`bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto ${
                          publishSuccess ? 'bg-green-600' : ''
                        }`}
                      >
                        {publishing ? 'PUBLISHING...' : publishSuccess ? 'PUBLISHED!' : 'PUBLISH'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Post Preview & Image */}
            <div className="space-y-0">
              {/* Post Preview Panel - White container with black text */}
              <div className="bg-white rounded-t-lg p-6 border border-slate-300">
                <div className="space-y-4">
                  {/* Headline Preview */}
                  {displayCurrentArticle.headline && (
                    <h2 className="text-xl font-bold text-black leading-tight">
                      {displayCurrentArticle.headline}
                    </h2>
                  )}

                  {/* Hook Preview */}
                  {displayCurrentArticle.hook && (
                    <p className="text-gray-700 text-base leading-relaxed">
                      {displayCurrentArticle.hook}
                    </p>
                  )}

                  {/* Content Preview - Show more content with preserved formatting */}
                  {displayCurrentArticle.content && (
                    <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        const content = displayCurrentArticle.content;
                        // Show first 500 characters while preserving line breaks
                        const truncatedByLength = content.length > 500;

                        if (truncatedByLength) {
                          // Find the last complete word within 500 characters
                          const truncated = content.substring(0, 500);
                          const lastSpaceIndex = truncated.lastIndexOf(' ');
                          const cleanTruncated = lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
                          return cleanTruncated + '...';
                        } else {
                          return content;
                        }
                      })()}
                    </div>
                  )}

                  {/* Hashtags Preview */}
                  {displayCurrentArticle.hashtags && (
                    <div className="flex flex-wrap gap-1 text-blue-600 text-sm">
                      {displayCurrentArticle.hashtags.split(' ').map((tag, index) => (
                        <span key={index} className="inline-block">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!displayCurrentArticle.headline && !displayCurrentArticle.hook && !displayCurrentArticle.content && (
                    <p className="text-gray-500 italic text-center">
                      Post preview will appear as you type in the fields on the left
                    </p>
                  )}
                </div>
              </div>

              {/* Image Preview - Connected to white area with zero padding */}
              <div className="border-l border-r border-slate-300 bg-slate-700/30">
                {displayCurrentArticle.image_url ? (
                  <img
                    src={displayCurrentArticle.image_url}
                    alt="Article image"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                ) : (
                  <div className="h-40 bg-slate-700/50 flex items-center justify-center">
                    <span className="text-slate-400">No image</span>
                  </div>
                )}
              </div>

              {/* Image Controls - Below the image */}
              <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm rounded-t-none">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-400">Image Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image source buttons: AI Generate, Unsplash, Upload, Cloud Storage */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleOpenAIGenerator}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium border-0"
                      disabled={!displayCurrentArticle || isGeneratingImage}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isGeneratingImage ? 'Generating...' : 'AI Generate'}
                    </Button>
                    <Button
                      onClick={handleOpenUnsplash}
                      className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-medium border-0"
                      disabled={!displayCurrentArticle}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Unsplash
                    </Button>
                    {/* Upload from device - icon button */}
                    <Button
                      onClick={handleTriggerFileUpload}
                      className="px-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white border-0"
                      disabled={!displayCurrentArticle || uploadingImage}
                      title="Upload image"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    {/* Hidden file input for cloud upload button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCloudUploadFileInput}
                    />
                    {/* Cloud Storage Browser - icon button */}
                    <Button
                      onClick={handleOpenCloudStorage}
                      className="px-3 bg-sky-500 hover:bg-sky-400 text-white border-0"
                      disabled={!displayCurrentArticle}
                      title="Browse cloud storage"
                    >
                      <Cloud className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image Upload Area */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 min-h-[120px] flex items-center justify-center ${
                      dragOver 
                        ? 'border-orange-400 bg-orange-400/10' 
                        : 'border-slate-500 bg-slate-700/30'
                    } hover:border-slate-400`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-slate-300">Uploading image...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <div>
                          <label className="cursor-pointer text-orange-400 hover:text-orange-300 font-medium">
                            <span>Click to upload</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileInput}
                            />
                          </label>
                          <span className="text-slate-400"> or drag and drop</span>
                        </div>
                        <p className="text-sm text-slate-400 opacity-75">PNG, JPG, GIF up to 20MB (auto-compressed)</p>
                      </div>
                    )}
                  </div>

                  {/* Image URL Input and Navigation - Moved to bottom */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={displayCurrentArticle.image_url || ''}
                        onChange={(e) => handleFieldChange('image_url', e.target.value)}
                        placeholder="Or paste image URL..."
                        className="flex-1"
                        disabled={!!searchQuery}
                      />
                      <Button variant="outline" size="sm" title="Previous image">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Next image">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Image Attribution Display */}
                    {imageAttribution && imageAttribution.source === 'unsplash' && (
                      <div className="text-xs text-gray-400 bg-slate-800/30 px-3 py-2 rounded border border-slate-600">
                        📷 Photo by{' '}
                        <a
                          href={`https://unsplash.com/@${imageAttribution.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {imageAttribution.user}
                        </a>
                        {' '}on{' '}
                        <a
                          href="https://unsplash.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Unsplash
                        </a>
                      </div>
                    )}
                    
                    {imageAttribution && imageAttribution.source === 'ai' && (
                      <div className="text-xs text-gray-400 bg-slate-800/30 px-3 py-2 rounded border border-slate-600">
                        🤖 Generated by AI using Vertex AI Imagen
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        </div>
      </div>

      {/* AI Image Generator Modal - Uses new modular AIImageGeneratorCore */}
      <AIImageGeneratorModal
        isOpen={isAIModalOpen}
        onClose={handleCloseAIGenerator}
        onImageGenerated={handleAIImageGenerated}
        contextText={getArticleContext().content}
        contextTitle={getArticleContext().headline}
        contextSubtitle={getArticleContext().hook}
      />

      {/* Unsplash Image Search Modal */}
      <UnsplashModal
        isOpen={isUnsplashModalOpen}
        onClose={handleCloseUnsplash}
        onImageSelected={handleUnsplashSelected}
        articleContext={getArticleContext()}
      />

      {/* Cloud Storage Browser Modal */}
      <CloudStorageBrowserModal
        isOpen={isCloudStorageModalOpen}
        onClose={handleCloseCloudStorage}
        onImageSelected={handleCloudStorageSelected}
      />

      <Toaster />
      <Footer />
    </div>
  );
}