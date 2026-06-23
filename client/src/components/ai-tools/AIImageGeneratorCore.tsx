/**
 * AIImageGeneratorCore - Modular AI Image Generation Component
 *
 * This is the SINGLE SOURCE OF TRUTH for all AI image generation functionality.
 * It can be deployed in multiple contexts:
 * - Full page view (ai-image-generator.tsx)
 * - Modal within article editor
 * - Modal within any future tool
 *
 * All enhancements made here automatically propagate to all instances.
 *
 * Features:
 * - 6 Image Ingredient slots with brand asset metadata
 * - Prompt enhancement with fine details, imperfections, realism instructions
 * - System prompt management (localStorage + Supabase)
 * - Enhancement guidelines (with/without assets paths)
 * - Brand Asset Picker integration
 * - Multiple AI model support (Gemini/Imagen)
 * - Text overlays (title/subtitle)
 * - Style controls (art style, image style)
 * - Resolution and aspect ratio configuration
 */

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Sparkles, Loader2, Download, Info, Eye, Brain,
  CheckSquare, Square, Upload, Package, User, Cat, Palette, X,
  Image, Mountain, Code, FileCode, Settings2, ChevronDown, ChevronUp,
  MessageSquare, Cpu, Type, Briefcase, Sliders, FlaskConical,
  Image as ImageIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import BrandAssetPicker from '@/components/ai-tools/BrandAssetPicker';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BrandAssetMetadata {
  assetId: string;
  assetName: string;
  assetType: string;       // product, logo, material, style_reference, background, texture
  material?: string;       // glass, metal, fabric, etc.
  similarTo?: string;      // e.g., "perfume bottle", "skincare jar"
  usageNotes?: string;     // usage guidance from brand settings
  size?: string;           // product size (e.g., "50ml", "100g", "Large")
  flavour?: string;        // product variant/flavour (e.g., "Vanilla", "Original", "Rose Gold")
  clientId?: string;       // for industry context lookup
  clientIndustry?: string; // e.g., "Beauty & Skincare", "Fashion"
}

export interface ImageIngredient {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;  // Store separately since File.type is immutable after compression
  description: string;
  brandAssetMetadata?: BrandAssetMetadata;
}

// Multi-version URL structure for all generated image variants
export interface ImageUrls {
  originalUrl: string;      // Original PNG in ai-images/
  jpgUrl: string;           // JPG full size (no resize) in compressed-images/
  compressedUrl: string;    // JPG 2400px max dimension in compressed-2400/
  thumbnailUrl: string;     // JPG 400px max dimension in thumbnails/
}

export interface ImageGenerationResult {
  imageUrl: string;         // Primary URL (original PNG for backwards compatibility)
  imageUrls?: ImageUrls;    // All 4 versions (optional for backwards compatibility)
  prompt: string;
  metadata: {
    artStyle: string;
    imageStyle: string;
    resolution: string;
    aspectRatio: string;
    model: string;
  };
  attribution?: {
    user: string;
    username: string;
    source: 'ai' | 'unsplash' | 'upload';
  };
}

export interface AIImageGeneratorCoreProps {
  // Context injection (for article editor, etc.)
  initialPrompt?: string;
  contextText?: string;        // Article content to analyze for prompt suggestions
  contextTitle?: string;       // Pre-fill title overlay
  contextSubtitle?: string;    // Pre-fill subtitle overlay
  defaultBrandId?: string;     // Pre-select a brand client

  // Callbacks
  onImageGenerated?: (result: ImageGenerationResult) => void;
  onCancel?: () => void;

  // Mode configuration
  compact?: boolean;           // Reduce padding for modal use
  showSystemPrompt?: boolean;  // Show/hide system prompt panel (default: true in page, false in modal)
  showApiPreview?: boolean;    // Show/hide API preview panel (default: true in page, false in modal)
  showBackButton?: boolean;    // Show/hide back to tools button (default: true in page, false in modal)

  // Modal URL selector props (for article editor modal integration)
  pendingResult?: ImageGenerationResult | null;
  selectedUrlType?: keyof ImageUrls;
  onUrlTypeChange?: (type: keyof ImageUrls) => void;
  onConfirmSelection?: () => void;
  urlOptions?: { key: keyof ImageUrls; label: string; colour: string }[];
  getCompactButtonStyle?: (key: keyof ImageUrls, colour: string) => string;

  // Custom styling
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// AI Model configurations - Nano Banana (Gemini Pro) and Flash Image families
// Ordered premium-to-budget: Nano Pro 4K → Nano Pro 2K → Flash Image 2K → Flash Image 1K
export const VERTEX_MODELS = [
  {
    value: 'gemini-3-pro-image-preview-4k',
    label: 'Nano Pro',
    description: 'Best multimodal AI ($0.24)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['4K'],
    nativeResolution: '4K',
    nativeResolutionFormat: 'k-scale',
    maxIngredients: 6,
    supportsReferenceImages: true,
    default: true,
  },
  {
    value: 'gemini-3-pro-image-preview-2k',
    label: 'Nano Pro',
    description: 'Standard AI ($0.134)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['2K'],
    nativeResolution: '2K',
    nativeResolutionFormat: 'k-scale',
    maxIngredients: 6,
    supportsReferenceImages: true,
  },
  {
    value: 'gemini-3.1-flash-image-preview-2k',
    label: 'Flash Image',
    description: 'Budget Gemini (~$0.10)',
    category: 'flash-image',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
    resolutions: ['2K'],
    nativeResolution: '2K',
    nativeResolutionFormat: 'k-scale',
    maxIngredients: 6,
    supportsReferenceImages: true,
  },
  {
    value: 'gemini-3.1-flash-image-preview-1k',
    label: 'Flash Image',
    description: 'Cheapest option (~$0.07)',
    category: 'flash-image',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
    resolutions: ['1K'],
    nativeResolution: '1K',
    nativeResolutionFormat: 'k-scale',
    maxIngredients: 6,
    supportsReferenceImages: true,
  },
];

// Image Ingredient slot definitions
const INGREDIENT_SLOTS = [
  { id: 'product1', tag: '[product1]', label: 'Product 1', icon: 'Package', group: 'always' },
  { id: 'product2', tag: '[product2]', label: 'Product 2', icon: 'Package', group: 'always' },
  { id: 'product3', tag: '[product3]', label: 'Product 3', icon: 'Package', group: 'selectable' },
  { id: 'product4', tag: '[product4]', label: 'Product 4', icon: 'Package', group: 'selectable' },
  { id: 'model', tag: '[model]', label: 'Model', icon: 'User', group: 'selectable' },
  { id: 'scene', tag: '[scene]', label: 'Scene', icon: 'Image', group: 'selectable' },
] as const;

type IngredientSlotId = typeof INGREDIENT_SLOTS[number]['id'];

const ART_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic', description: 'Realistic photography style' },
  { value: 'illustrated', label: 'Illustrated', description: 'Digital art and illustration' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like dramatic composition' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple design' },
  { value: 'abstract', label: 'Abstract', description: 'Conceptual artistic interpretation' },
  { value: 'vintage', label: 'Vintage', description: 'Retro and classic style' },
];

const IMAGE_STYLES = [
  { value: 'professional', label: 'Professional', description: 'Business and corporate appropriate' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'Natural and authentic feel' },
  { value: 'dramatic', label: 'Dramatic', description: 'High contrast and striking' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean and uncluttered' },
  { value: 'corporate', label: 'Corporate', description: 'Business environment focused' },
  { value: 'creative', label: 'Creative', description: 'Unique and innovative approach' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getModelConfig = (modelValue: string) => {
  return VERTEX_MODELS.find(m => m.value === modelValue) || VERTEX_MODELS[0];
};

export const getDefaultModel = () => {
  return VERTEX_MODELS.find(m => m.default) || VERTEX_MODELS[0];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIImageGeneratorCore({
  initialPrompt = '',
  contextText,
  contextTitle,
  contextSubtitle,
  defaultBrandId,
  onImageGenerated,
  onCancel,
  compact = false,
  showSystemPrompt = true,
  showApiPreview = true,
  showBackButton = true,
  // Modal URL selector props
  pendingResult,
  selectedUrlType: externalSelectedUrlType,
  onUrlTypeChange,
  onConfirmSelection,
  urlOptions: externalUrlOptions,
  getCompactButtonStyle: externalGetCompactButtonStyle,
  className = '',
}: AIImageGeneratorCoreProps) {

  // ========== Image Ingredients State ==========
  const [ingredients, setIngredients] = useState<Record<IngredientSlotId, ImageIngredient | null>>({
    product1: null,
    product2: null,
    product3: null,
    product4: null,
    model: null,
    scene: null,
  });


  // File input refs for each slot
  const ingredientRefs = {
    product1: useRef<HTMLInputElement>(null),
    product2: useRef<HTMLInputElement>(null),
    product3: useRef<HTMLInputElement>(null),
    product4: useRef<HTMLInputElement>(null),
    model: useRef<HTMLInputElement>(null),
    scene: useRef<HTMLInputElement>(null),
  };

  // ========== AI Generator State ==========
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState(getDefaultModel().value);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [imageStyle, setImageStyle] = useState('professional');
  const [resolution, setResolution] = useState(getDefaultModel().nativeResolution);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<ImageUrls | null>(null);
  const [selectedUrlType, setSelectedUrlType] = useState<keyof ImageUrls>('originalUrl');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // ========== Title/Subtitle State ==========
  const [includeTitle, setIncludeTitle] = useState(false);
  const [includeSubtitle, setIncludeSubtitle] = useState(false);
  const [titleText, setTitleText] = useState(contextTitle || '');
  const [subtitleText, setSubtitleText] = useState(contextSubtitle || '');
  const [titleCase, setTitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [subtitleCase, setSubtitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingSubtitle, setIsEnhancingSubtitle] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // ========== Brand Intelligence State ==========
  const [selectedBrand, setSelectedBrand] = useState<string | null>(defaultBrandId || null);
  const [brandToggles, setBrandToggles] = useState<Set<string>>(new Set(['industry', 'visual']));
  const [checkedPriority, setCheckedPriority] = useState<string[]>([]);
  const [checkedSecondary, setCheckedSecondary] = useState<string[]>([]);
  const [brandClients, setBrandClients] = useState<any[]>([]);
  const [brandProfile, setBrandProfile] = useState<any>(null);

  // ========== System Prompt State ==========
  const [systemPrompt, setSystemPrompt] = useState('');
  const [committedPrompt, setCommittedPrompt] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptHasUnsavedChanges, setPromptHasUnsavedChanges] = useState(false);
  const LOCALSTORAGE_KEY = 'ai-image-generator-system-prompt-draft';

  // ========== Enhancement Guidelines State ==========
  const [enhancementNoAssets, setEnhancementNoAssets] = useState('');
  const [committedEnhancementNoAssets, setCommittedEnhancementNoAssets] = useState('');
  const [enhancementWithAssets, setEnhancementWithAssets] = useState('');
  const [committedEnhancementWithAssets, setCommittedEnhancementWithAssets] = useState('');
  const [isLoadingEnhancements, setIsLoadingEnhancements] = useState(true);
  const [isSavingEnhancement, setIsSavingEnhancement] = useState(false);
  const [enhancementHasChanges, setEnhancementHasChanges] = useState(false);
  const [activeEnhancementTab, setActiveEnhancementTab] = useState<'no_assets' | 'with_assets'>('no_assets');
  const ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS = 'ai-image-generator-enhancement-no-assets-draft';
  const ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS = 'ai-image-generator-enhancement-with-assets-draft';

  // ========== API Preview State ==========
  const [apiPreview, setApiPreview] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // ========== Panel Collapse State ==========
  const [panelStates, setPanelStates] = useState({
    imageDescription: true,
    aiModel: false,
    textOverlays: false,
    brandIntelligence: false,
    styleSettings: false,
    enhancementGuidelines: showSystemPrompt,
    imageIngredients: false,
    generatedPreview: false,
    systemPrompt: showSystemPrompt,
    apiPreview: showApiPreview,
  });

  // ========== Drag & Drop State ==========
  const [dragOverSlot, setDragOverSlot] = useState<IngredientSlotId | null>(null);

  // ========== Brand Asset Picker State ==========
  const [showBrandAssetPicker, setShowBrandAssetPicker] = useState(false);
  const [brandAssetTargetSlot, setBrandAssetTargetSlot] = useState<IngredientSlotId | null>(null);

  // ========== Double-Click Prevention ==========
  const lastGenerateClickRef = useRef<number>(0);

  // ========== Panel Toggle ==========
  const togglePanel = (panel: keyof typeof panelStates) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  // ========== EFFECTS ==========

  // Update resolution when model changes
  useEffect(() => {
    const modelConfig = getModelConfig(model);
    setResolution(modelConfig.nativeResolution);
  }, [model]);

  // Initialize with context text if provided (for modal use)
  useEffect(() => {
    if (contextText && !prompt) {
      // Auto-analyze context to suggest a prompt
      analyzeContextForPrompt();
    }
  }, [contextText]);

  // Pre-fill title/subtitle from context
  useEffect(() => {
    if (contextTitle) setTitleText(contextTitle);
    if (contextSubtitle) setSubtitleText(contextSubtitle);
  }, [contextTitle, contextSubtitle]);

  // Load system prompt on mount
  useEffect(() => {
    const loadSystemPrompt = async () => {
      setIsLoadingPrompt(true);
      try {
        const localDraft = localStorage.getItem(LOCALSTORAGE_KEY);
        const response = await fetch('/api/ai-prompt-overrides/image');
        const data = await response.json();

        const committedText = data.prompt_text || '';
        setCommittedPrompt(committedText);

        if (localDraft && localDraft !== committedText) {
          setSystemPrompt(localDraft);
          setPromptHasUnsavedChanges(true);
        } else {
          setSystemPrompt(committedText);
          setPromptHasUnsavedChanges(false);
          if (localDraft) localStorage.removeItem(LOCALSTORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to load system prompt:', error);
        const localDraft = localStorage.getItem(LOCALSTORAGE_KEY);
        if (localDraft) setSystemPrompt(localDraft);
      } finally {
        setIsLoadingPrompt(false);
      }
    };
    loadSystemPrompt();
  }, []);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (isLoadingPrompt || !systemPrompt) return;

    const timeoutId = setTimeout(() => {
      if (systemPrompt !== committedPrompt) {
        localStorage.setItem(LOCALSTORAGE_KEY, systemPrompt);
        setPromptHasUnsavedChanges(true);
      } else {
        localStorage.removeItem(LOCALSTORAGE_KEY);
        setPromptHasUnsavedChanges(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [systemPrompt, committedPrompt, isLoadingPrompt]);

  // Load enhancement guidelines on mount
  useEffect(() => {
    const loadEnhancementGuidelines = async () => {
      setIsLoadingEnhancements(true);
      try {
        const [noAssetsRes, withAssetsRes] = await Promise.all([
          fetch('/api/ai-prompt-overrides/image?component=enhancement_no_assets'),
          fetch('/api/ai-prompt-overrides/image?component=enhancement_with_assets')
        ]);

        const noAssetsData = await noAssetsRes.json();
        const withAssetsData = await withAssetsRes.json();

        const localNoAssets = localStorage.getItem(ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS);
        const localWithAssets = localStorage.getItem(ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS);

        setCommittedEnhancementNoAssets(noAssetsData.prompt_text || '');
        setCommittedEnhancementWithAssets(withAssetsData.prompt_text || '');

        if (localNoAssets && localNoAssets !== noAssetsData.prompt_text) {
          setEnhancementNoAssets(localNoAssets);
          setEnhancementHasChanges(true);
        } else {
          setEnhancementNoAssets(noAssetsData.prompt_text || '');
          if (localNoAssets) localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS);
        }

        if (localWithAssets && localWithAssets !== withAssetsData.prompt_text) {
          setEnhancementWithAssets(localWithAssets);
          setEnhancementHasChanges(true);
        } else {
          setEnhancementWithAssets(withAssetsData.prompt_text || '');
          if (localWithAssets) localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS);
        }
      } catch (error) {
        console.error('Failed to load enhancement guidelines:', error);
      } finally {
        setIsLoadingEnhancements(false);
      }
    };
    loadEnhancementGuidelines();
  }, []);

  // Auto-save enhancement drafts
  useEffect(() => {
    if (isLoadingEnhancements) return;

    const timeoutId = setTimeout(() => {
      const noAssetsChanged = enhancementNoAssets !== committedEnhancementNoAssets;
      const withAssetsChanged = enhancementWithAssets !== committedEnhancementWithAssets;

      if (noAssetsChanged) {
        localStorage.setItem(ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS, enhancementNoAssets);
      } else {
        localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS);
      }

      if (withAssetsChanged) {
        localStorage.setItem(ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS, enhancementWithAssets);
      } else {
        localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS);
      }

      setEnhancementHasChanges(noAssetsChanged || withAssetsChanged);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [enhancementNoAssets, enhancementWithAssets, committedEnhancementNoAssets, committedEnhancementWithAssets, isLoadingEnhancements]);

  // Load brand clients on mount
  useEffect(() => {
    const loadBrandClients = async () => {
      try {
        const response = await fetch('/api/content-management/brand-intelligence/clients');
        if (response.ok) {
          const data = await response.json();
          setBrandClients(data.data?.clients || []);
        }
      } catch (error) {
        console.error('Failed to load brand clients:', error);
      }
    };
    loadBrandClients();
  }, []);

  // Load brand profile when brand is selected
  useEffect(() => {
    if (selectedBrand) {
      const loadBrandProfile = async () => {
        try {
          const response = await fetch(`/api/content-management/brand-intelligence/clients/${selectedBrand}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Brand profile loaded:', data);
            setBrandProfile(data.client || null);
          }
        } catch (error) {
          console.error('Failed to load brand profile:', error);
        }
      };
      loadBrandProfile();
    } else {
      setBrandProfile(null);
    }
  }, [selectedBrand]);

  // ========== HELPER FUNCTIONS ==========

  // Check if current model supports reference images
  const supportsReferenceImages = () => getModelConfig(model).supportsReferenceImages !== false;

  // Check if a slot is active for the current model (all Gemini models support all slots)
  const isSlotActive = (_slotId: IngredientSlotId): boolean => {
    return true;
  };

  // File to base64 converter
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Compress and resize image
  const compressImage = (file: File, maxSize: number, quality: number): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];

        resolve({ base64, mimeType: 'image/jpeg' });
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Text transformation helper
  const transformTextCase = (text: string, caseType: 'as-typed' | 'sentence' | 'uppercase') => {
    switch (caseType) {
      case 'sentence':
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case 'uppercase':
        return text.toUpperCase();
      case 'as-typed':
      default:
        return text;
    }
  };

  // Get slot icon component
  const getSlotIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return Package;
      case 'User': return User;
      case 'Image': return Mountain;
      default: return Package;
    }
  };

  // ========== DRAG & DROP HANDLERS ==========

  const handleDragOver = (e: React.DragEvent, slotId: IngredientSlotId) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSlotActive(slotId) && !ingredients[slotId]) {
      setDragOverSlot(slotId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, slotId: IngredientSlotId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    if (!isSlotActive(slotId)) {
      toast({
        title: 'Slot not active',
        description: 'This slot is not available for the current model.',
        variant: 'destructive',
      });
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleIngredientSelect(slotId, files[0]);
    }
  };

  // ========== INGREDIENT HANDLERS ==========

  const handleIngredientSelect = async (slotId: IngredientSlotId, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PNG, JPEG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 20MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const preview = URL.createObjectURL(file);
      let base64: string;
      let mimeType: string = file.type;

      if (slotId === 'model' || slotId === 'scene') {
        const compressed = await compressImage(file, 2400, 0.8);
        base64 = compressed.base64;
        mimeType = compressed.mimeType;
      } else {
        base64 = await fileToBase64(file);
      }

      setIngredients(prev => ({
        ...prev,
        [slotId]: {
          file,
          preview,
          base64,
          mimeType,
          description: '',
        },
      }));

      const slot = INGREDIENT_SLOTS.find(s => s.id === slotId);
      toast({
        title: `${slot?.label} Added`,
        description: `Use ${slot?.tag} in your prompt to reference this image.`,
      });
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Could not process image.',
        variant: 'destructive',
      });
    }
  };

  const removeIngredient = (slotId: IngredientSlotId) => {
    if (ingredients[slotId]?.preview) {
      URL.revokeObjectURL(ingredients[slotId]!.preview);
    }
    setIngredients(prev => ({ ...prev, [slotId]: null }));

    const ref = ingredientRefs[slotId];
    if (ref.current) ref.current.value = '';
  };

  const updateIngredientDescription = (slotId: IngredientSlotId, description: string) => {
    setIngredients(prev => {
      if (!prev[slotId]) return prev;
      return {
        ...prev,
        [slotId]: { ...prev[slotId]!, description },
      };
    });
  };

  // ========== BRAND ASSET HANDLERS ==========

  const handleBrandAssetSelect = async (asset: any, imageDataUrl: string, clientInfo?: { id: string; industry?: string }) => {
    if (!brandAssetTargetSlot) return;

    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${asset.name}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });

      const preview = URL.createObjectURL(file);
      let base64: string;
      let mimeType: string = file.type;

      if (brandAssetTargetSlot === 'model' || brandAssetTargetSlot === 'scene') {
        const compressed = await compressImage(file, 2400, 0.8);
        base64 = compressed.base64;
        mimeType = compressed.mimeType;
      } else {
        base64 = await fileToBase64(file);
      }

      const slot = INGREDIENT_SLOTS.find(s => s.id === brandAssetTargetSlot);
      setIngredients(prev => ({
        ...prev,
        [brandAssetTargetSlot]: {
          file,
          preview,
          base64,
          mimeType,
          description: asset.similar_to || asset.name || '',
          brandAssetMetadata: {
            assetId: asset.id,
            assetName: asset.name,
            assetType: asset.asset_type || 'product',
            material: asset.material,
            similarTo: asset.similar_to,
            usageNotes: asset.usage_notes,
            size: asset.size,
            flavour: asset.flavour,
            clientId: asset.client_id || clientInfo?.id,
            clientIndustry: clientInfo?.industry,
          },
        },
      }));

      console.log('Brand asset metadata stored:', {
        assetName: asset.name,
        material: asset.material,
        similarTo: asset.similar_to,
        size: asset.size,
        flavour: asset.flavour,
        clientIndustry: clientInfo?.industry,
      });

      toast({
        title: 'Brand Asset Added',
        description: `"${asset.name}" loaded into ${slot?.label}. Use ${slot?.tag} in your prompt.`,
      });
    } catch (error) {
      console.error('Error loading brand asset:', error);
      toast({
        title: 'Failed to load asset',
        description: 'Could not load the brand asset. Please try again.',
        variant: 'destructive',
      });
    }

    setBrandAssetTargetSlot(null);
  };

  const openBrandAssetPicker = (slotId: IngredientSlotId) => {
    setBrandAssetTargetSlot(slotId);
    setShowBrandAssetPicker(true);
  };

  // ========== ACTIVE INGREDIENTS HELPERS ==========

  const hasIngredients = () => {
    return Object.values(ingredients).some(ing => ing !== null);
  };

  const getActiveIngredients = () => {
    return INGREDIENT_SLOTS
      .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
      .map(slot => {
        const ingredient = ingredients[slot.id]!;
        return {
          slotId: slot.id,
          tag: slot.tag,
          base64: ingredient.base64,
          mimeType: ingredient.mimeType,
          description: ingredient.description,
          brandAssetMetadata: ingredient.brandAssetMetadata || undefined,
        };
      });
  };

  const getActiveIngredientTags = (): string[] => {
    return INGREDIENT_SLOTS
      .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
      .map(slot => slot.tag);
  };

  // ========== CONTEXT ANALYSIS (for modal use) ==========

  const analyzeContextForPrompt = async () => {
    if (!contextText) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleContext: {
            headline: contextTitle || '',
            hook: contextSubtitle || '',
            content: contextText.slice(0, 500),
          },
          artStyle,
          imageStyle,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPrompt(result.suggestedPrompt || '');
        setHasAnalyzed(true);
        toast({
          title: 'Context Analyzed',
          description: 'A suggested image prompt has been generated from your content.',
        });
      }
    } catch (error) {
      console.error('Error analyzing context:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ========== SYSTEM PROMPT HANDLERS ==========

  const saveSystemPrompt = async () => {
    setIsSavingPrompt(true);
    try {
      const response = await fetch('/api/ai-prompt-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'image',
          promptText: systemPrompt,
          clientId: selectedBrand || null
        })
      });

      if (response.ok) {
        setCommittedPrompt(systemPrompt);
        setPromptHasUnsavedChanges(false);
        localStorage.removeItem(LOCALSTORAGE_KEY);
        toast({
          title: 'System prompt saved',
          description: 'Your prompt changes have been committed.',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save the system prompt.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const resetPromptToCommitted = () => {
    setSystemPrompt(committedPrompt);
    setPromptHasUnsavedChanges(false);
    localStorage.removeItem(LOCALSTORAGE_KEY);
    toast({
      title: 'Prompt reset',
      description: 'Reverted to last saved version.',
    });
  };

  // ========== ENHANCEMENT GUIDELINE HANDLERS ==========

  const saveEnhancementGuideline = async (component: 'enhancement_no_assets' | 'enhancement_with_assets') => {
    setIsSavingEnhancement(true);
    try {
      const promptText = component === 'enhancement_no_assets' ? enhancementNoAssets : enhancementWithAssets;
      const response = await fetch('/api/ai-prompt-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'image',
          promptComponent: component,
          promptText,
          clientId: selectedBrand || null
        })
      });

      if (response.ok) {
        if (component === 'enhancement_no_assets') {
          setCommittedEnhancementNoAssets(enhancementNoAssets);
          localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS);
        } else {
          setCommittedEnhancementWithAssets(enhancementWithAssets);
          localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS);
        }
        const otherChanged = component === 'enhancement_no_assets'
          ? enhancementWithAssets !== committedEnhancementWithAssets
          : enhancementNoAssets !== committedEnhancementNoAssets;
        setEnhancementHasChanges(otherChanged);

        toast({
          title: 'Enhancement guideline saved',
          description: `${component === 'enhancement_no_assets' ? 'No Assets' : 'With Assets'} guideline committed.`,
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save enhancement:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save the enhancement guideline.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingEnhancement(false);
    }
  };

  const resetEnhancementToCommitted = (component: 'enhancement_no_assets' | 'enhancement_with_assets') => {
    if (component === 'enhancement_no_assets') {
      setEnhancementNoAssets(committedEnhancementNoAssets);
      localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_NO_ASSETS);
    } else {
      setEnhancementWithAssets(committedEnhancementWithAssets);
      localStorage.removeItem(ENHANCEMENT_LOCALSTORAGE_KEY_WITH_ASSETS);
    }
    const otherChanged = component === 'enhancement_no_assets'
      ? enhancementWithAssets !== committedEnhancementWithAssets
      : enhancementNoAssets !== committedEnhancementNoAssets;
    setEnhancementHasChanges(otherChanged);
    toast({
      title: 'Guideline reset',
      description: 'Reverted to last saved version.',
    });
  };

  // ========== CASE TOGGLE FUNCTIONS ==========

  const toggleTitleCase = () => {
    const cases: Array<'as-typed' | 'sentence' | 'uppercase'> = ['as-typed', 'sentence', 'uppercase'];
    const currentIndex = cases.indexOf(titleCase);
    const nextIndex = (currentIndex + 1) % cases.length;
    setTitleCase(cases[nextIndex]);
  };

  const toggleSubtitleCase = () => {
    const cases: Array<'as-typed' | 'sentence' | 'uppercase'> = ['as-typed', 'sentence', 'uppercase'];
    const currentIndex = cases.indexOf(subtitleCase);
    const nextIndex = (currentIndex + 1) % cases.length;
    setSubtitleCase(cases[nextIndex]);
  };

  // ========== ENHANCEMENT FUNCTIONS ==========

  const enhanceTitle = async () => {
    if (!titleText.trim()) return;

    setIsEnhancingTitle(true);
    try {
      const response = await fetch('/api/ai/enhance-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleText,
          artStyle,
          imageStyle,
          articleContext: contextText ? { content: contextText } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTitleText(data.enhancedTitle);
        toast({
          title: 'Title Enhanced',
          description: 'Your title has been optimized for visual impact.',
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance title. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingTitle(false);
    }
  };

  const enhanceSubtitle = async () => {
    if (!subtitleText.trim()) return;

    setIsEnhancingSubtitle(true);
    try {
      const response = await fetch('/api/ai/enhance-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitleText,
          artStyle,
          imageStyle,
          articleContext: contextText ? { content: contextText } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubtitleText(data.enhancedSubtitle);
        toast({
          title: 'Subtitle Enhanced',
          description: 'Your subtitle has been optimized for clarity.',
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance subtitle. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingSubtitle(false);
    }
  };

  /**
   * PROMPT ENHANCEMENT
   * This is where the magic happens - includes instructions for:
   * - Fine details
   * - Imperfections
   * - Realism
   * - Brand asset metadata context
   */
  const enhancePrompt = async () => {
    if (!prompt.trim()) return;

    setIsEnhancingPrompt(true);
    try {
      // Get active ingredient info INCLUDING brand asset metadata
      const activeIngredients = INGREDIENT_SLOTS
        .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
        .map(slot => {
          const ingredient = ingredients[slot.id]!;
          return {
            tag: slot.tag,
            slotId: slot.id,
            type: slot.id.startsWith('product') ? 'product' : slot.id,
            description: ingredient.description || '',
            // Pass full brand asset metadata for intelligent prompt enhancement
            brandAssetMetadata: ingredient.brandAssetMetadata || undefined,
          };
        });

      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: prompt,
          artStyle,
          imageStyle,
          includeTitle,
          includeSubtitle,
          titleText: includeTitle ? transformTextCase(titleText, titleCase) : '',
          subtitleText: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : '',
          // Include ingredient tags for auto-injection
          imageIngredients: activeIngredients.length > 0 ? activeIngredients : undefined,
          // Use the inline system prompt (always use current text, not committed)
          customSystemPrompt: systemPrompt || undefined,
        })
      });

      if (response.ok) {
        const data = await response.json();
        let enhancedPrompt = data.suggestedPrompt || data.enhancedPrompt;

        // If there are active ingredients but no tags in the enhanced prompt, append them
        if (activeIngredients.length > 0) {
          const missingTags = activeIngredients.filter(ing => !enhancedPrompt.includes(ing.tag));

          if (missingTags.length > 0 && missingTags.length === activeIngredients.length) {
            const tagList = activeIngredients.map(ing => {
              const desc = ing.description ? ` (${ing.description})` : '';
              return `${ing.tag}${desc}`;
            }).join(', ');
            enhancedPrompt = `Using reference images: ${tagList}. ${enhancedPrompt}`;
          }
        }

        setPrompt(enhancedPrompt);
        toast({
          title: 'Prompt Enhanced',
          description: activeIngredients.length > 0
            ? `Optimized with ${activeIngredients.length} ingredient tag(s) included.`
            : 'Your image description has been optimized for AI generation.',
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // ========== API PREVIEW ==========

  const buildApiPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const activeIngredients = INGREDIENT_SLOTS
        .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
        .map(slot => ({
          slotId: slot.id,
          tag: slot.tag,
          base64: ingredients[slot.id]!.base64,
          mimeType: ingredients[slot.id]!.mimeType,
          description: ingredients[slot.id]!.description
        }));

      const response = await fetch('/api/ai/preview-image-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          includeTitle,
          includeSubtitle,
          artStyle,
          imageStyle,
          resolution,
          aspectRatio,
          model,
          articleContext: {
            headline: includeTitle ? transformTextCase(titleText, titleCase) : undefined,
            hook: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : undefined
          },
          imageIngredients: activeIngredients.length > 0 ? activeIngredients : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setApiPreview(data);
      } else {
        throw new Error('Failed to build preview');
      }
    } catch (error) {
      console.error('Failed to build API preview:', error);
      toast({
        title: 'Preview failed',
        description: 'Could not build API preview payload.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ========== GENERATE IMAGE ==========

  const generateImage = async () => {
    // Double-click prevention: ignore clicks within 2 seconds of last click
    const now = Date.now();
    if (now - lastGenerateClickRef.current < 2000) return;
    lastGenerateClickRef.current = now;

    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for your image.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          artStyle,
          imageStyle,
          resolution,
          aspectRatio,
          includeTitle,
          includeSubtitle,
          articleContext: includeTitle || includeSubtitle ? {
            headline: includeTitle ? transformTextCase(titleText, titleCase) : undefined,
            hook: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : undefined,
          } : undefined,
          // Image Ingredients - multiple reference images for composition
          imageIngredients: getActiveIngredients().length > 0 ? getActiveIngredients() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImage(data.imageUrl);

        // Store all 4 URL versions if available
        if (data.imageUrls) {
          setGeneratedImageUrls(data.imageUrls);
          setSelectedUrlType('originalUrl'); // Default to original PNG
        }

        // If callback provided, call it with result
        if (onImageGenerated) {
          onImageGenerated({
            imageUrl: data.imageUrl,
            imageUrls: data.imageUrls,
            prompt: prompt.trim(),
            metadata: {
              artStyle,
              imageStyle,
              resolution,
              aspectRatio,
              model,
            },
            attribution: {
              user: 'AI Generated',
              username: 'vertex-ai',
              source: 'ai',
            },
          });
        }

        toast({
          title: 'Image Generated',
          description: data.imageUrls
            ? 'Your AI image is ready in 4 formats: PNG, JPG, 2400px, and thumbnail.'
            : 'Your AI image has been created successfully.',
        });
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ========== DOWNLOAD IMAGE ==========

  const downloadImage = async () => {
    // Use the selected URL version if available, otherwise fall back to generatedImage
    const activeSelectedUrlType = externalSelectedUrlType || selectedUrlType;
    const downloadUrl = generatedImageUrls ? generatedImageUrls[activeSelectedUrlType] : generatedImage;
    if (!downloadUrl) return;

    // Determine file extension based on selected URL type
    const extension = activeSelectedUrlType === 'originalUrl' ? 'png' : 'jpg';
    const sizeLabel = activeSelectedUrlType === 'thumbnailUrl' ? '-thumb' :
                      activeSelectedUrlType === 'compressedUrl' ? '-2400px' :
                      activeSelectedUrlType === 'jpgUrl' ? '-full' : '';

    try {
      const proxyUrl = `/api/download/image?url=${encodeURIComponent(downloadUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ai-generated${sizeLabel}-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: `Downloading ${selectedUrlType === 'originalUrl' ? 'original PNG' :
                       selectedUrlType === 'jpgUrl' ? 'full-size JPG' :
                       selectedUrlType === 'compressedUrl' ? '2400px JPG' : 'thumbnail'}.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download image.',
        variant: 'destructive',
      });
    }
  };

  // ========== RENDER ==========

  const paddingClass = compact ? 'p-4' : 'p-6';

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========== LEFT COLUMN: CONFIGURATION ========== */}
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: compact ? 'calc(90vh - 120px)' : undefined }}>
          <h2 className="text-xl font-semibold text-salmon">Configuration</h2>

          {/* Image Description Section */}
          <div className="bg-gradient-to-br from-[#0c4a4a] via-gray-800 to-gray-900 border border-cyan-500/30 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-cyan-900/30 transition-colors"
              onClick={() => togglePanel('imageDescription')}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-cyan-300">Image Description</h3>
              </div>
              <Button
                onClick={(e) => { e.stopPropagation(); enhancePrompt(); }}
                disabled={!prompt.trim() || isEnhancingPrompt}
                variant="outline"
                size="sm"
                className="px-2"
                title="Enhance prompt with Gemini AI"
              >
                {isEnhancingPrompt ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
              </Button>
            </div>
            {panelStates.imageDescription && (
              <div className="px-4 pb-4">
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-y bg-gray-900/80 border-cyan-500/20"
                />
                {contextText && !hasAnalyzed && (
                  <Button
                    onClick={analyzeContextForPrompt}
                    disabled={isAnalyzing}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-3 w-3 mr-2" />
                        Analyze Content for Prompt
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* AI Model Section */}
          <div className="bg-gradient-to-br from-amber-900/30 via-gray-800 to-gray-900 border border-amber-500/30 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-amber-900/10 transition-colors"
              onClick={() => togglePanel('aiModel')}
            >
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-300">AI Model</h3>
                <span className="text-xs text-gray-500">
                  ({VERTEX_MODELS.find(m => m.value === model)?.label || 'Nano Pro'})
                </span>
              </div>
            </div>
            {panelStates.aiModel && (
              <div className="px-3 pb-3">
                <div className="grid grid-cols-4 gap-2">
                  {VERTEX_MODELS.map((modelOption) => {
                    const isNanoBanana = modelOption.category === 'nano-banana';

                    return (
                      <label
                        key={modelOption.value}
                        className={`cursor-pointer rounded p-2 border text-center transition-colors ${
                          model === modelOption.value
                            ? isNanoBanana
                              ? 'border-purple-500 bg-purple-900/30'
                              : 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="model"
                          value={modelOption.value}
                          checked={model === modelOption.value}
                          onChange={(e) => setModel(e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-xs font-medium">{modelOption.label}</div>
                        <div className="text-[10px] text-gray-400">{modelOption.nativeResolution}</div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Text Overlays Section */}
          <div className="bg-gradient-to-br from-pink-900/30 via-gray-800 to-gray-900 border border-pink-500/30 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-pink-800/20 transition-colors"
              onClick={() => togglePanel('textOverlays')}
            >
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-pink-300">Text Overlays</h3>
                {(includeTitle || includeSubtitle) && (
                  <span className="text-xs text-gray-500">
                    ({includeTitle ? 'Title' : ''}{includeTitle && includeSubtitle ? ' + ' : ''}{includeSubtitle ? 'Subtitle' : ''})
                  </span>
                )}
              </div>
            </div>
            {panelStates.textOverlays && (
              <div className="px-4 pb-4 space-y-3">
                {/* Title Field */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-title-overlay"
                      checked={includeTitle}
                      onChange={(e) => setIncludeTitle(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="include-title-overlay" className="text-sm font-medium text-white">
                      Title Overlay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter title text..."
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      disabled={!includeTitle}
                      className="flex-1"
                    />
                    <Button
                      onClick={toggleTitleCase}
                      disabled={!includeTitle || !titleText.trim()}
                      variant="outline"
                      size="sm"
                      className="px-2 min-w-[60px]"
                    >
                      {titleCase === 'as-typed' ? 'Aa' : titleCase === 'sentence' ? 'Sentence' : 'UPPER'}
                    </Button>
                    <Button
                      onClick={enhanceTitle}
                      disabled={!includeTitle || !titleText.trim() || isEnhancingTitle}
                      variant="outline"
                      size="sm"
                      className="px-2"
                    >
                      {isEnhancingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* Subtitle Field */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-subtitle-overlay"
                      checked={includeSubtitle}
                      onChange={(e) => setIncludeSubtitle(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="include-subtitle-overlay" className="text-sm font-medium text-white">
                      Subtitle Overlay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter subtitle text..."
                      value={subtitleText}
                      onChange={(e) => setSubtitleText(e.target.value)}
                      disabled={!includeSubtitle}
                      className="flex-1"
                    />
                    <Button
                      onClick={toggleSubtitleCase}
                      disabled={!includeSubtitle || !subtitleText.trim()}
                      variant="outline"
                      size="sm"
                      className="px-2 min-w-[60px]"
                    >
                      {subtitleCase === 'as-typed' ? 'Aa' : subtitleCase === 'sentence' ? 'Sentence' : 'UPPER'}
                    </Button>
                    <Button
                      onClick={enhanceSubtitle}
                      disabled={!includeSubtitle || !subtitleText.trim() || isEnhancingSubtitle}
                      variant="outline"
                      size="sm"
                      className="px-2"
                    >
                      {isEnhancingSubtitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Style Settings Section */}
          <div className="bg-gradient-to-br from-green-900/30 via-gray-800 to-gray-900 border border-green-500/30 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-green-800/20 transition-colors"
              onClick={() => togglePanel('styleSettings')}
            >
              <div className="flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-green-400" />
                <h3 className="text-sm font-semibold text-green-300">Style Settings</h3>
                <span className="text-xs text-gray-500">
                  ({artStyle} / {imageStyle})
                </span>
              </div>
            </div>
            {panelStates.styleSettings && (
              <div className="px-4 pb-4 space-y-4">
                {/* Art Style */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Art Style</Label>
                  <Select value={artStyle} onValueChange={setArtStyle}>
                    <SelectTrigger className="w-full bg-gray-900/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ART_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Style */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Image Style</Label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger className="w-full bg-gray-900/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full bg-gray-900/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelConfig(model).aspectRatios.map(ratio => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Image Ingredients Section */}
          {supportsReferenceImages() && (
            <div className="bg-gradient-to-br from-purple-900/30 via-gray-800 to-gray-900 border border-purple-500/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-800/20 transition-colors"
                onClick={() => togglePanel('imageIngredients')}
              >
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-purple-300">Image Ingredients</h3>
                  {hasIngredients() && (
                    <span className="text-xs text-gray-500">
                      ({getActiveIngredients().length} loaded)
                    </span>
                  )}
                </div>
              </div>
              {panelStates.imageIngredients && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {INGREDIENT_SLOTS.map(slot => {
                      const isActive = isSlotActive(slot.id);
                      const ingredient = ingredients[slot.id];
                      const SlotIcon = getSlotIcon(slot.icon);

                      return (
                        <div
                          key={slot.id}
                          className={`relative rounded-lg border-2 border-dashed p-2 transition-all ${
                            !isActive
                              ? 'opacity-40 border-gray-600'
                              : dragOverSlot === slot.id
                              ? 'border-purple-400 bg-purple-900/30'
                              : ingredient
                              ? 'border-purple-500 bg-purple-900/20'
                              : 'border-gray-600 hover:border-purple-500'
                          }`}
                          onDragOver={(e) => handleDragOver(e, slot.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, slot.id)}
                        >
                          {ingredient ? (
                            <div className="relative">
                              <img
                                src={ingredient.preview}
                                alt={slot.label}
                                className="w-full h-20 object-cover rounded"
                              />
                              <button
                                onClick={() => removeIngredient(slot.id)}
                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 hover:bg-red-600"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                              <div className="mt-1 text-[10px] text-center text-purple-300">{slot.tag}</div>
                            </div>
                          ) : (
                            <div
                              className={`flex flex-col items-center justify-center h-20 cursor-pointer ${
                                isActive ? '' : 'cursor-not-allowed'
                              }`}
                              onClick={() => isActive && ingredientRefs[slot.id].current?.click()}
                            >
                              <SlotIcon className="h-6 w-6 text-gray-500 mb-1" />
                              <div className="text-[10px] text-gray-500">{slot.label}</div>
                              <div className="text-[8px] text-gray-600">{slot.tag}</div>
                            </div>
                          )}
                          <input
                            ref={ingredientRefs[slot.id]}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleIngredientSelect(slot.id, e.target.files[0]);
                              }
                            }}
                          />
                          {/* Brand Asset Button */}
                          {isActive && !ingredient && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBrandAssetPicker(slot.id);
                              }}
                              className="absolute bottom-1 right-1 p-1 bg-purple-600 rounded hover:bg-purple-500 transition-colors"
                              title="Load from Brand Assets"
                            >
                              <Briefcase className="h-3 w-3 text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateImage}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          {/* Cancel Button (for modal use) */}
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* ========== RIGHT COLUMN: PREVIEW ========== */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-salmon">Preview</h2>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 min-h-[400px] flex flex-col">
            {generatedImage ? (
              <div className="relative w-full flex-1">
                <img
                  src={generatedImageUrls ? generatedImageUrls[externalSelectedUrlType || selectedUrlType] : generatedImage}
                  alt="Generated"
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    onClick={downloadImage}
                    size="sm"
                    variant="secondary"
                    className="bg-gray-800/80 hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* URL Version Selector - appears when 4 versions are available */}
                {generatedImageUrls && (
                  <div className="mt-4 p-3 bg-gray-800/90 rounded-lg border border-gray-600">
                    <div className="text-xs text-gray-400 mb-2 text-center">Select Image Version</div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setSelectedUrlType('originalUrl');
                          onUrlTypeChange?.('originalUrl');
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                          (externalSelectedUrlType || selectedUrlType) === 'originalUrl'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Original PNG (full quality)"
                      >
                        <ImageIcon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-medium">PNG</span>
                        <span className="text-[8px] opacity-70">Original</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUrlType('jpgUrl');
                          onUrlTypeChange?.('jpgUrl');
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                          (externalSelectedUrlType || selectedUrlType) === 'jpgUrl'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="JPG full size (no resize)"
                      >
                        <ImageIcon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-medium">JPG</span>
                        <span className="text-[8px] opacity-70">Full Size</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUrlType('compressedUrl');
                          onUrlTypeChange?.('compressedUrl');
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                          (externalSelectedUrlType || selectedUrlType) === 'compressedUrl'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Compressed JPG (2400px max)"
                      >
                        <ImageIcon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-medium">2400px</span>
                        <span className="text-[8px] opacity-70">Compressed</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUrlType('thumbnailUrl');
                          onUrlTypeChange?.('thumbnailUrl');
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                          (externalSelectedUrlType || selectedUrlType) === 'thumbnailUrl'
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Thumbnail (400px max)"
                      >
                        <ImageIcon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-medium">Thumb</span>
                        <span className="text-[8px] opacity-70">400px</span>
                      </button>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 text-center truncate">
                      {generatedImageUrls[externalSelectedUrlType || selectedUrlType]}
                    </div>

                    {/* Modal mode: "Use This Image" button */}
                    {onConfirmSelection && (
                      <Button
                        onClick={onConfirmSelection}
                        className="w-full mt-3 bg-salmon hover:bg-salmon/80 text-white font-semibold"
                      >
                        Use This Image
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 flex-1 flex flex-col items-center justify-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Generated image will appear here</p>
              </div>
            )}
          </div>

          {/* System Prompt Panel (conditionally shown) */}
          {showSystemPrompt && (
            <div className="bg-gradient-to-br from-blue-900/30 via-gray-800 to-gray-900 border border-blue-500/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-800/20 transition-colors"
                onClick={() => togglePanel('systemPrompt')}
              >
                <div className="flex items-center space-x-2">
                  <Settings2 className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-blue-300">System Prompt</h3>
                  {promptHasUnsavedChanges && (
                    <span className="text-xs text-amber-400">(unsaved)</span>
                  )}
                </div>
              </div>
              {panelStates.systemPrompt && (
                <div className="px-4 pb-4 space-y-2">
                  <Textarea
                    placeholder="Custom system prompt for AI enhancement..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[120px] resize-y bg-gray-900/80 border-blue-500/20 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={saveSystemPrompt}
                      disabled={!promptHasUnsavedChanges || isSavingPrompt}
                      size="sm"
                      className="flex-1"
                    >
                      {isSavingPrompt ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </Button>
                    <Button
                      onClick={resetPromptToCommitted}
                      disabled={!promptHasUnsavedChanges}
                      size="sm"
                      variant="outline"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Preview Panel (conditionally shown) */}
          {showApiPreview && (
            <div className="bg-gradient-to-br from-slate-900/30 via-gray-800 to-gray-900 border border-slate-500/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/20 transition-colors"
                onClick={() => togglePanel('apiPreview')}
              >
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300">API Preview</h3>
                </div>
                <Button
                  onClick={(e) => { e.stopPropagation(); buildApiPreview(); }}
                  disabled={isLoadingPreview}
                  variant="outline"
                  size="sm"
                  className="px-2"
                >
                  {isLoadingPreview ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              {panelStates.apiPreview && apiPreview && (
                <div className="px-4 pb-4">
                  <pre className="text-[10px] text-gray-400 overflow-auto max-h-[200px] bg-gray-950/50 p-2 rounded">
                    {JSON.stringify(apiPreview, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Brand Asset Picker Modal */}
      <BrandAssetPicker
        isOpen={showBrandAssetPicker}
        onClose={() => {
          setShowBrandAssetPicker(false);
          setBrandAssetTargetSlot(null);
        }}
        onSelectAsset={handleBrandAssetSelect}
        targetSlotLabel={brandAssetTargetSlot ? INGREDIENT_SLOTS.find(s => s.id === brandAssetTargetSlot)?.label : undefined}
      />
    </div>
  );
}

export default AIImageGeneratorCore;
