/**
 * AI Image Generator - Dedicated page for AI-powered image generation
 * Uses Google Vertex AI Imagen and Gemini models for professional image creation
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Download, Info, Eye, Brain, CheckSquare, Square, Upload, Package, User, Cat, Palette, X, Image, Mountain } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';

// AI Model configurations - Nano Banana (Gemini) and Imagen families
// Note: Imagen 4.0 does NOT support reference images - text-to-image only
// Nano Banana (Gemini) supports up to 14 reference images natively
const VERTEX_MODELS = [
  {
    value: 'gemini-3-pro-image-preview-4k',
    position: { row: 0, col: 0 },
    label: 'Nano Pro',
    description: 'Best multimodal AI ($0.24)',
    category: 'nano-banana',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    resolutions: ['4K'],
    nativeResolution: '4K',
    nativeResolutionFormat: 'k-scale',
    maxIngredients: 6, // 4 products + model + scene
    supportsReferenceImages: true,
    default: true,
  },
  {
    value: 'imagen-4.0-ultra-generate-001',
    position: { row: 0, col: 1 },
    label: 'Imagen Ultra',
    description: 'Highest quality (~$0.04)',
    category: 'imagen',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
    resolutions: ['2048px', '1536px', '1024px'],
    nativeResolution: '2048px',
    nativeResolutionFormat: 'px',
    maxIngredients: 0, // Imagen 4.0 does NOT support reference images
    supportsReferenceImages: false,
  },
  {
    value: 'gemini-3-pro-image-preview-2k',
    position: { row: 1, col: 0 },
    label: 'Nano Mid',
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
    value: 'coming-soon',
    position: { row: 1, col: 1 },
    label: 'Coming Soon',
    description: 'Future model slot',
    category: 'placeholder',
    aspectRatios: ['1:1'],
    resolutions: ['1024px'],
    nativeResolution: '1024px',
    nativeResolutionFormat: 'px',
    maxIngredients: 0,
    supportsReferenceImages: false,
    disabled: true,
  },
];

// Image Ingredient slot definitions with clear tag labels
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

const getModelConfig = (modelValue: string) => {
  return VERTEX_MODELS.find(m => m.value === modelValue) || VERTEX_MODELS[0];
};

const getDefaultModel = () => {
  return VERTEX_MODELS.find(m => m.default) || VERTEX_MODELS[0];
};

export default function AIImageGenerator() {
  const [, setLocation] = useLocation();

  // Image Ingredients state - supports up to 6 slots
  interface ImageIngredient {
    file: File;
    preview: string;
    base64: string;
    mimeType: string;  // Store separately since File.type is immutable after compression
    description: string;
  }

  const [ingredients, setIngredients] = useState<Record<IngredientSlotId, ImageIngredient | null>>({
    product1: null,
    product2: null,
    product3: null,
    product4: null,
    model: null,
    scene: null,
  });

  // For Imagen models: which of the "selectable" slots (product3, product4, model, scene) are active
  // Default: model and scene are active, product3 and product4 are inactive
  const [imagenActiveSlots, setImagenActiveSlots] = useState<Set<string>>(new Set(['model', 'scene']));

  // File input refs for each slot
  const ingredientRefs = {
    product1: useRef<HTMLInputElement>(null),
    product2: useRef<HTMLInputElement>(null),
    product3: useRef<HTMLInputElement>(null),
    product4: useRef<HTMLInputElement>(null),
    model: useRef<HTMLInputElement>(null),
    scene: useRef<HTMLInputElement>(null),
  };

  // AI Generator state
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(getDefaultModel().value);
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [imageStyle, setImageStyle] = useState('professional');
  const [resolution, setResolution] = useState(getDefaultModel().nativeResolution);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Title/Subtitle state
  const [includeTitle, setIncludeTitle] = useState(false);
  const [includeSubtitle, setIncludeSubtitle] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [titleCase, setTitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [subtitleCase, setSubtitleCase] = useState<'as-typed' | 'sentence' | 'uppercase'>('as-typed');
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingSubtitle, setIsEnhancingSubtitle] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Brand Intelligence state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandToggles, setBrandToggles] = useState<Set<string>>(new Set(['industry', 'visual']));
  const [checkedPriority, setCheckedPriority] = useState<string[]>([]);
  const [checkedSecondary, setCheckedSecondary] = useState<string[]>([]);
  const [brandClients, setBrandClients] = useState([]);
  const [brandProfile, setBrandProfile] = useState(null);

  // Update resolution to native resolution when model changes
  useEffect(() => {
    const modelConfig = getModelConfig(model);
    setResolution(modelConfig.nativeResolution);
  }, [model]);

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
            console.log('🧠 Brand profile loaded:', data);
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

  // ========== Image Ingredients Helper Functions ==========

  // Track which slot is being dragged over for visual feedback
  const [dragOverSlot, setDragOverSlot] = useState<IngredientSlotId | null>(null);

  // Handle drag events for drop zones
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
      const file = files[0];
      await handleIngredientSelect(slotId, file);
    }
  };

  // Check if current model is Imagen (no reference image support)
  const isImagenModel = () => getModelConfig(model).category === 'imagen';

  // Check if current model supports reference images
  const supportsReferenceImages = () => getModelConfig(model).supportsReferenceImages !== false;

  // Check if a slot is active for the current model
  const isSlotActive = (slotId: IngredientSlotId): boolean => {
    const slot = INGREDIENT_SLOTS.find(s => s.id === slotId);
    if (!slot) return false;

    // "always" group slots (product1, product2) are always active
    if (slot.group === 'always') return true;

    // For Nano Banana, all 6 slots are active
    if (!isImagenModel()) return true;

    // For Imagen, only 2 of the 4 "selectable" slots are active
    return imagenActiveSlots.has(slotId);
  };

  // Toggle a selectable slot for Imagen (pick 2 of 4 logic)
  const toggleImagenSlot = (slotId: IngredientSlotId) => {
    const slot = INGREDIENT_SLOTS.find(s => s.id === slotId);
    if (!slot || slot.group !== 'selectable') return;

    const newActive = new Set(imagenActiveSlots);

    if (newActive.has(slotId)) {
      // Already active - don't allow deactivation directly
      // (user must click another inactive slot to swap)
      return;
    }

    // Activating an inactive slot - need to deactivate one of the current active ones
    newActive.add(slotId);

    // Remove the first (oldest) active selectable slot
    const activeArray = Array.from(imagenActiveSlots);
    if (activeArray.length >= 2) {
      newActive.delete(activeArray[0]);
    }

    // Clear any ingredient from the now-deactivated slot
    const deactivatedSlot = activeArray[0] as IngredientSlotId;
    if (ingredients[deactivatedSlot]) {
      setIngredients(prev => ({ ...prev, [deactivatedSlot]: null }));
      toast({
        title: 'Slot Swapped',
        description: `${INGREDIENT_SLOTS.find(s => s.id === deactivatedSlot)?.label} deactivated. Image cleared.`,
      });
    }

    setImagenActiveSlots(newActive);
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

  // Compress and resize image for model/scene slots (reduces payload size significantly)
  const compressImage = (file: File, maxSize: number, quality: number): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
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

        // Convert to JPEG for better compression (model/scene don't need transparency)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];

        resolve({ base64, mimeType: 'image/jpeg' });
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection for a specific slot
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

      // Compress model/scene images to reduce payload (2400px max, 80% quality)
      // Products keep original quality for pixel-accurate reproduction
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
          mimeType,  // Store mimeType separately (may differ from file.type after compression)
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
        description: error instanceof Error ? error.message : 'Could not process image. Please try another.',
        variant: 'destructive',
      });
    }
  };

  // Remove an ingredient from a slot
  const removeIngredient = (slotId: IngredientSlotId) => {
    if (ingredients[slotId]?.preview) {
      URL.revokeObjectURL(ingredients[slotId]!.preview);
    }
    setIngredients(prev => ({ ...prev, [slotId]: null }));

    const ref = ingredientRefs[slotId];
    if (ref.current) {
      ref.current.value = '';
    }
  };

  // Update ingredient description
  const updateIngredientDescription = (slotId: IngredientSlotId, description: string) => {
    setIngredients(prev => {
      if (!prev[slotId]) return prev;
      return {
        ...prev,
        [slotId]: { ...prev[slotId]!, description },
      };
    });
  };

  // Get active ingredient tags for prompt helper
  const getActiveIngredientTags = (): string[] => {
    return INGREDIENT_SLOTS
      .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
      .map(slot => slot.tag);
  };

  // Get slot icon component
  const getSlotIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return Package;
      case 'User': return User;
      case 'Image': return Mountain; // Using Mountain for scene/landscape
      default: return Package;
    }
  };

  // ========== End Image Ingredients Helpers ==========

  // Benefits selection algorithm from handoff document
  const generateBenefitsSelection = (checkedPriority: string[], checkedSecondary: string[]) => {
    const allSelected = [...checkedPriority, ...checkedSecondary];

    if (allSelected.length <= 3) return allSelected;

    // Use 2-3 benefits randomly from user selections
    const shuffled = allSelected.sort(() => Math.random() - 0.5);
    const useCount = Math.min(3, Math.max(2, Math.floor(allSelected.length * 0.6)));
    return shuffled.slice(0, useCount);
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

  // Case toggle functions
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

  // Enhancement functions
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
          articleContext: undefined // No article context in standalone mode
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
          articleContext: undefined // No article context in standalone mode
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

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;

    setIsEnhancingPrompt(true);
    try {
      // Get active ingredient info for context
      const activeIngredients = INGREDIENT_SLOTS
        .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
        .map(slot => ({
          tag: slot.tag,
          type: slot.id.startsWith('product') ? 'product' : slot.id,
          description: ingredients[slot.id]?.description || '',
        }));

      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: prompt,
          artStyle,
          imageStyle,
          // Include title/subtitle if checked
          includeTitle,
          includeSubtitle,
          titleText: includeTitle ? transformTextCase(titleText, titleCase) : '',
          subtitleText: includeSubtitle ? transformTextCase(subtitleText, subtitleCase) : '',
          // Include ingredient tags for auto-injection
          imageIngredients: activeIngredients.length > 0 ? activeIngredients : undefined,
        })
      });

      if (response.ok) {
        const data = await response.json();
        let enhancedPrompt = data.suggestedPrompt || data.enhancedPrompt;

        // If there are active ingredients but no tags in the enhanced prompt, append them
        if (activeIngredients.length > 0) {
          const existingTags = activeIngredients.filter(ing => enhancedPrompt.includes(ing.tag));
          const missingTags = activeIngredients.filter(ing => !enhancedPrompt.includes(ing.tag));

          if (missingTags.length > 0 && missingTags.length === activeIngredients.length) {
            // No tags were included - add a reference section
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

  // Check if any ingredients are uploaded
  const hasIngredients = () => {
    return Object.values(ingredients).some(ing => ing !== null);
  };

  // Get active ingredients for API call
  const getActiveIngredients = () => {
    return INGREDIENT_SLOTS
      .filter(slot => isSlotActive(slot.id) && ingredients[slot.id])
      .map(slot => ({
        slotId: slot.id,
        tag: slot.tag,
        base64: ingredients[slot.id]!.base64,
        mimeType: ingredients[slot.id]!.mimeType,  // Use stored mimeType (correct after compression)
        description: ingredients[slot.id]!.description,
      }));
  };

  const generateImage = async () => {
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
          // Brand intelligence integration from handoff document
          brandIntelligence: selectedBrand ? {
            brandId: selectedBrand,
            activeToggles: Array.from(brandToggles),
            finalBenefits: generateBenefitsSelection(checkedPriority, checkedSecondary),
            brandData: brandProfile?.client
          } : undefined,
          // Image Ingredients - multiple reference images for composition
          imageIngredients: getActiveIngredients().length > 0 ? getActiveIngredients() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImage(data.imageUrl);
        toast({
          title: 'Image Generated',
          description: 'Your AI image has been created successfully.',
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

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/tools')}
                className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
              <h1 className="text-4xl font-bold text-salmon mb-4">AI Image Generator</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Generate professional images using Google Vertex AI with custom prompts, styles, and text overlays
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuration Panel */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-salmon">Configuration</h2>
                    
                    {/* Text Overlays Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <h3 className="text-sm font-semibold text-cyan font-medium">Text Overlays</h3>
                      
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
                            className="px-2"
                            title="Toggle case"
                          >
                            TT
                          </Button>
                          <Button
                            onClick={enhanceTitle}
                            disabled={!includeTitle || !titleText.trim() || isEnhancingTitle}
                            variant="outline"
                            size="sm"
                            className="px-2"
                            title="Enhance title"
                          >
                            {isEnhancingTitle ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {titleText && includeTitle && (
                          <div className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded border">
                            Preview: "{transformTextCase(titleText, titleCase)}"
                          </div>
                        )}
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
                            className="px-2"
                            title="Toggle case"
                          >
                            TT
                          </Button>
                          <Button
                            onClick={enhanceSubtitle}
                            disabled={!includeSubtitle || !subtitleText.trim() || isEnhancingSubtitle}
                            variant="outline"
                            size="sm"
                            className="px-2"
                            title="Enhance subtitle"
                          >
                            {isEnhancingSubtitle ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {subtitleText && includeSubtitle && (
                          <div className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded border">
                            Preview: "{transformTextCase(subtitleText, subtitleCase)}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Ingredients Section - 6 slots for Nano Banana, collapsed for Imagen */}
                    <div className={`p-4 rounded-lg border transition-all ${
                      supportsReferenceImages()
                        ? 'space-y-4 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-600/50'
                        : 'bg-gray-800/50 border-gray-600/50'
                    }`}>
                      {/* Header with model info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm font-semibold ${supportsReferenceImages() ? 'text-purple-300' : 'text-gray-500'}`}>
                            🧪 Image Ingredients
                          </h3>
                          {supportsReferenceImages() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-purple-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2 text-xs">
                                    <p><strong>Nano Banana:</strong> Up to 6 images (4 products + model + scene)</p>
                                    <p>Reference uploaded images using tags like <code className="bg-gray-700 px-1 rounded">[product1]</code> in your prompt.</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          supportsReferenceImages()
                            ? 'bg-purple-500/30 text-purple-300'
                            : 'bg-gray-600/30 text-gray-500'
                        }`}>
                          {supportsReferenceImages() ? 'Nano: 6 slots' : 'Not available'}
                        </span>
                      </div>

                      {/* Collapsed message for Imagen */}
                      {!supportsReferenceImages() && (
                        <p className="text-xs text-gray-500 italic">
                          Imagen Ultra is text-only. Select a Nano model to use reference images.
                        </p>
                      )}

                      {/* Only show slots when model supports reference images */}
                      {supportsReferenceImages() && (
                      <>
                      {/* Product Slots Row (1-4) */}
                      <div className="space-y-2">
                        <Label className="text-xs text-purple-300 font-medium">Products</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {INGREDIENT_SLOTS.filter(slot => slot.id.startsWith('product')).map((slot) => {
                            const SlotIcon = getSlotIcon(slot.icon);
                            const isActive = isSlotActive(slot.id);
                            const ingredient = ingredients[slot.id];
                            const isSelectable = slot.group === 'selectable';

                            return (
                              <div key={slot.id} className="relative">
                                {/* Slot container with drag and drop */}
                                <div
                                  className={`
                                    relative rounded-lg border-2 border-dashed transition-all overflow-hidden
                                    ${!isActive
                                      ? 'border-gray-600/50 bg-gray-800/30 opacity-50'
                                      : dragOverSlot === slot.id
                                        ? 'border-green-400 bg-green-500/30 scale-105'
                                        : ingredient
                                          ? 'border-purple-400 bg-purple-500/20'
                                          : 'border-purple-500/50 hover:border-purple-400/70 hover:bg-purple-900/20 cursor-pointer'
                                    }
                                  `}
                                  onClick={() => {
                                    if (!isActive && isSelectable && isImagenModel()) {
                                      toggleImagenSlot(slot.id);
                                    } else if (isActive && !ingredient) {
                                      ingredientRefs[slot.id].current?.click();
                                    }
                                  }}
                                  onDragOver={(e) => handleDragOver(e, slot.id)}
                                  onDragEnter={(e) => handleDragOver(e, slot.id)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, slot.id)}
                                >
                                  {ingredient ? (
                                    <div className="aspect-square relative">
                                      <img
                                        src={ingredient.preview}
                                        alt={slot.label}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeIngredient(slot.id);
                                        }}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="aspect-square flex flex-col items-center justify-center p-2">
                                      <SlotIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                                      <span className={`text-[10px] ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                                        {!isActive && isImagenModel() ? 'Click to enable' : dragOverSlot === slot.id ? 'Drop here!' : 'Drop image'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Tag label below slot */}
                                <div className={`text-center mt-1 ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                                  <code className="text-[10px] bg-gray-800/50 px-1 rounded">{slot.tag}</code>
                                </div>

                                {/* Hidden file input */}
                                <input
                                  ref={ingredientRefs[slot.id]}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleIngredientSelect(slot.id, e.target.files[0]);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Model & Scene Slots Row */}
                      <div className="space-y-2">
                        <Label className="text-xs text-purple-300 font-medium">Subject & Environment</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {INGREDIENT_SLOTS.filter(slot => slot.id === 'model' || slot.id === 'scene').map((slot) => {
                            const SlotIcon = getSlotIcon(slot.icon);
                            const isActive = isSlotActive(slot.id);
                            const ingredient = ingredients[slot.id];
                            const isSelectable = slot.group === 'selectable';

                            return (
                              <div key={slot.id} className="relative">
                                {/* Slot container with drag and drop */}
                                <div
                                  className={`
                                    relative rounded-lg border-2 border-dashed transition-all overflow-hidden
                                    ${!isActive
                                      ? 'border-gray-600/50 bg-gray-800/30 opacity-50 cursor-pointer'
                                      : dragOverSlot === slot.id
                                        ? 'border-green-400 bg-green-500/30 scale-105'
                                        : ingredient
                                          ? 'border-purple-400 bg-purple-500/20'
                                          : 'border-purple-500/50 hover:border-purple-400/70 hover:bg-purple-900/20 cursor-pointer'
                                    }
                                  `}
                                  onClick={() => {
                                    if (!isActive && isSelectable && isImagenModel()) {
                                      toggleImagenSlot(slot.id);
                                    } else if (isActive && !ingredient) {
                                      ingredientRefs[slot.id].current?.click();
                                    }
                                  }}
                                  onDragOver={(e) => handleDragOver(e, slot.id)}
                                  onDragEnter={(e) => handleDragOver(e, slot.id)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, slot.id)}
                                >
                                  {ingredient ? (
                                    <div className="aspect-video relative">
                                      <img
                                        src={ingredient.preview}
                                        alt={slot.label}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeIngredient(slot.id);
                                        }}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                      {/* Description input for model/scene */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <Input
                                          placeholder={`Describe ${slot.label.toLowerCase()}...`}
                                          value={ingredient.description}
                                          onChange={(e) => updateIngredientDescription(slot.id, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-6 text-xs bg-black/50 border-purple-500/50 text-white placeholder:text-gray-400"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="aspect-video flex flex-col items-center justify-center p-3">
                                      <SlotIcon className={`h-6 w-6 mb-1 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                                      <span className={`text-xs font-medium ${isActive ? 'text-purple-200' : 'text-gray-500'}`}>
                                        {slot.label}
                                      </span>
                                      <span className={`text-[10px] ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
                                        {!isActive && isImagenModel() ? 'Click to enable' : dragOverSlot === slot.id ? 'Drop here!' : 'Drop or click'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Tag label below slot */}
                                <div className={`text-center mt-1 ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                                  <code className="text-xs bg-gray-800/50 px-1.5 py-0.5 rounded">{slot.tag}</code>
                                </div>

                                {/* Hidden file input */}
                                <input
                                  ref={ingredientRefs[slot.id]}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleIngredientSelect(slot.id, e.target.files[0]);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active tags summary */}
                      {hasIngredients() && (
                        <div className="text-xs text-purple-400 bg-purple-900/30 rounded p-2">
                          <strong>Active tags:</strong>{' '}
                          {getActiveIngredientTags().map((tag, i) => (
                            <code key={tag} className="bg-gray-800 px-1 rounded mx-0.5">{tag}</code>
                          ))}
                          <span className="text-purple-500 ml-2">← Use these in your prompt</span>
                        </div>
                      )}

                      </>
                      )}
                    </div>

                    {/* Brand Intelligence Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-cyan font-medium">Brand Intelligence</h3>
                      </div>
                      
                      {/* Brand Selection Dropdown */}
                      <div className="space-y-2">
                        <Label htmlFor="brand-select" className="text-white">Select Client Brand</Label>
                        <Select value={selectedBrand || 'none'} onValueChange={(value) => setSelectedBrand(value === 'none' ? null : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No brand intelligence</SelectItem>
                            {brandClients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}{client.industry ? ` - ${client.industry}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Brand Toggle Grid - Only show when brand is selected */}
                      {selectedBrand && brandProfile && (
                        <div className="space-y-3">
                          {/* Toggle Switches Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'visual', label: 'Visual Style', desc: 'Color personality + mood' },
                              { id: 'industry', label: 'Industry Context', desc: 'Business segment + niche' },
                              { id: 'audience', label: 'Target Audience', desc: 'Customer demographics' },
                              { id: 'benefits', label: 'Smart Benefits', desc: 'Priority + secondary benefits' },
                              { id: 'guidelines', label: 'Content Guidelines', desc: 'Positive examples' },
                              { id: 'compliance', label: 'Compliance Rules', desc: 'Prohibited terms' }
                            ].map((toggle) => (
                              <label
                                key={toggle.id}
                                className={`radio-btn-base ${
                                  brandToggles.has(toggle.id)
                                    ? 'radio-btn-brand-selected'
                                    : 'radio-btn-unselected'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={brandToggles.has(toggle.id)}
                                  onChange={(e) => {
                                    const newToggles = new Set(brandToggles);
                                    if (e.target.checked) {
                                      newToggles.add(toggle.id);
                                    } else {
                                      newToggles.delete(toggle.id);
                                    }
                                    setBrandToggles(newToggles);
                                  }}
                                  className="sr-only"
                                />
                                <div className="space-y-1">
                                  <div className="radio-btn-text">{toggle.label}</div>
                                  <div className="radio-btn-desc">{toggle.desc}</div>
                                </div>
                              </label>
                            ))}
                          </div>

                          {/* Benefits Selection - Only show when benefits toggle is active */}
                          {brandToggles.has('benefits') && brandProfile?.client_brand_profiles?.[0] && (
                            <div className="space-y-2 p-3 bg-gray-800 rounded border">
                              <p className="text-xs font-medium text-cyan">Smart Benefits Selection</p>
                              
                              {/* Priority Benefits */}
                              {brandProfile.client_brand_profiles[0].priority_benefits?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-purple-400 font-medium">Priority Benefits</p>
                                  <div className="flex flex-wrap gap-1">
                                    {brandProfile.client.client_brand_profiles[0].priority_benefits.map((benefit: string) => (
                                      <button
                                        key={benefit}
                                        onClick={() => {
                                          if (checkedPriority.includes(benefit)) {
                                            setCheckedPriority(prev => prev.filter(b => b !== benefit));
                                          } else {
                                            setCheckedPriority(prev => [...prev, benefit]);
                                          }
                                        }}
                                        className={`text-xs px-2 py-1 rounded border ${
                                          checkedPriority.includes(benefit)
                                            ? 'bg-purple-500 text-white border-purple-400'
                                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                                        }`}
                                      >
                                        {checkedPriority.includes(benefit) ? (
                                          <CheckSquare className="h-3 w-3 inline mr-1" />
                                        ) : (
                                          <Square className="h-3 w-3 inline mr-1" />
                                        )}
                                        {benefit}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Secondary Benefits */}
                              {brandProfile.client.client_brand_profiles[0].secondary_benefits?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-blue-400 font-medium">Secondary Benefits</p>
                                  <div className="flex flex-wrap gap-1">
                                    {brandProfile.client.client_brand_profiles[0].secondary_benefits.map((benefit: string) => (
                                      <button
                                        key={benefit}
                                        onClick={() => {
                                          if (checkedSecondary.includes(benefit)) {
                                            setCheckedSecondary(prev => prev.filter(b => b !== benefit));
                                          } else {
                                            setCheckedSecondary(prev => [...prev, benefit]);
                                          }
                                        }}
                                        className={`text-xs px-2 py-1 rounded border ${
                                          checkedSecondary.includes(benefit)
                                            ? 'bg-blue-500 text-white border-blue-400'
                                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                                        }`}
                                      >
                                        {checkedSecondary.includes(benefit) ? (
                                          <CheckSquare className="h-3 w-3 inline mr-1" />
                                        ) : (
                                          <Square className="h-3 w-3 inline mr-1" />
                                        )}
                                        {benefit}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Selection Summary */}
                              {(checkedPriority.length > 0 || checkedSecondary.length > 0) && (
                                <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                                  Selected: {checkedPriority.length + checkedSecondary.length} → AI uses {generateBenefitsSelection(checkedPriority, checkedSecondary).length} randomly
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image Description Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-cyan font-medium">Image Description</h3>
                        <Button
                          onClick={enhancePrompt}
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
                      <Textarea
                        placeholder="Describe the image you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px] resize-y"
                      />
                    </div>

                    {/* AI Model Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-cyan font-medium">AI Model</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p><strong>Nano Banana:</strong> Advanced AI with K-scale resolutions (1K, 2K, 4K)</p>
                                <p><strong>Imagen:</strong> Professional models with px resolutions</p>
                                <p>Top row: Best quality, Bottom row: Budget options</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {/* Model Grid */}
                      <div className="space-y-3">
                        {/* Column Headers */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center text-sm font-semibold text-purple-400 pb-1">Nano Banana</div>
                          <div className="text-center text-sm font-semibold text-blue-400 pb-1">Imagen</div>
                        </div>
                        
                        {/* Model Options */}
                        <div className="grid grid-cols-2 gap-3">
                          {VERTEX_MODELS.map((modelOption) => {
                            if (!modelOption.position) return null;

                            const { col } = modelOption.position;
                            const isDisabled = modelOption.disabled;

                            // Disabled placeholder slot
                            if (isDisabled) {
                              return (
                                <div
                                  key={modelOption.value}
                                  className="radio-btn-base opacity-40 cursor-not-allowed bg-gray-800/50 border-gray-600/50"
                                >
                                  <div className="space-y-1">
                                    <div className="radio-btn-text text-gray-500">{modelOption.label}</div>
                                    <div className="radio-btn-desc text-gray-600">{modelOption.description}</div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <label
                                key={modelOption.value}
                                className={`radio-btn-base ${
                                  model === modelOption.value
                                    ? col === 0
                                      ? 'radio-btn-purple-selected'
                                      : 'radio-btn-blue-selected'
                                    : 'radio-btn-unselected'
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  name="model"
                                  value={modelOption.value}
                                  checked={model === modelOption.value}
                                  onChange={(e) => setModel(e.target.value)}
                                  className="sr-only"
                                />
                                <div className="space-y-1">
                                  <div className="radio-btn-text">{modelOption.label}</div>
                                  <div className="radio-btn-desc">
                                    {modelOption.nativeResolutionFormat === 'k-scale'
                                      ? modelOption.resolutions.join(', ')
                                      : modelOption.resolutions.slice(0, 2).join(', ')
                                    } {modelOption.description.match(/\(\$[\d\.]+\)/)?.[0] || '(~$0.04)'}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Style & Settings Section */}
                    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                      <h3 className="text-sm font-semibold text-cyan font-medium">Style & Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="art-style" className="text-white">Art Style</Label>
                          <Select value={artStyle} onValueChange={setArtStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ART_STYLES.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  <div className="space-y-0.5 text-left">
                                    <div className="font-medium text-sm">{style.label}</div>
                                    <div className="text-xs text-gray-500">{style.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="image-style" className="text-white">Image Style</Label>
                          <Select value={imageStyle} onValueChange={setImageStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_STYLES.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  <div className="space-y-0.5 text-left">
                                    <div className="font-medium text-sm">{style.label}</div>
                                    <div className="text-xs text-gray-500">{style.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resolution" className="text-white">Resolution</Label>
                          <Select value={resolution} onValueChange={setResolution}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getModelConfig(model).resolutions.map((res) => (
                                <SelectItem key={res} value={res}>
                                  {res}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="aspect-ratio" className="text-white">Aspect Ratio</Label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getModelConfig(model).aspectRatios.map((ratio) => (
                                <SelectItem key={ratio} value={ratio}>
                                  {ratio}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={generateImage}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate AI Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Preview Panel */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-salmon">Preview</h2>
                    
                    <div className="bg-gray-100 rounded-lg min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300">
                      {generatedImage ? (
                        <div className="w-full flex items-center justify-center p-4">
                          <img 
                            src={generatedImage} 
                            alt="Generated AI Image" 
                            className="max-w-full max-h-[500px] object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <Sparkles className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                          <p className="text-lg font-medium">Generated image will appear here</p>
                          <p className="text-sm">Enter a description and click "Generate AI Image" to start</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons below preview */}
                    {generatedImage && (
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            window.open(generatedImage, '_blank');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Full Size
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = generatedImage;
                            link.download = `ai-generated-image-${Date.now()}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        </div>

        <Footer />
        <Toaster />
      </div>
    </GradientBackground>
  );
}