/**
 * Social Content Generator - Platform-aware content generation with brand intelligence
 * Generates structured social media content: Hook, Body Header, Body, CTA, Hashtags
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  ArrowLeft, Sparkles, Loader2, Copy, RefreshCw, ChevronDown, ChevronUp,
  MinusCircle, PlusCircle, CheckCircle, MessageSquare, Undo2, Settings,
  Play, Save, Code, Database
} from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';
import { FeedbackPanel } from '@/components/social-content/FeedbackPanel';

// ============================================================================
// TYPES
// ============================================================================

interface PlatformRule {
  id: string;
  platform_key: string;
  label: string;
  icon: string;
  hook_limit: number;
  body_header_limit: number;
  body_limit: number;
  cta_limit: number;
  hashtag_count_min: number;
  hashtag_count_max: number;
  total_character_limit: number;
  emoji_style: string;
  default_tone: string;
  guidelines: string;
}

interface BrandClient {
  id: string;
  name: string;
  industry?: string;
}

interface FlatBrandContext {
  client_name: string;
  client_website?: string;
  spelling: 'british' | 'american' | 'canadian' | 'australian';
  industry_segment: string;
  business_niche: string;
  products_services: string;
  content_focus_options: string[];
  positive_examples: string[];
  negative_examples: string[];
  forbidden_phrases: string[];
  key_messages: string[];
  voice_tone: string;
  voice_humor: string;
  voice_sentence_length: string;
  visual_style: string;
  color_personality: string;
  visual_mood: string;
  target_audience: string;
  priority_benefits: string[];
  secondary_benefits: string[];
}

interface SectionContent {
  hook: string;
  bodyHeader: string;
  body: string;
  cta: string;
  hashtags: string;
}

interface SectionPrevious {
  hook: string | null;
  bodyHeader: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string | null;
}

interface AISkill {
  id: string;
  skill_key: string;
  name: string;
  description: string;
  stage: string;
  system_prompt: string;
  input_schema: Record<string, boolean>;
  temperature: number;
  max_tokens: number;
}

interface AIModelOption {
  key: string;
  name: string;
  displayName: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  avgLatencyMs: number;
  available: boolean;
  costPer100: string;
}

// ============================================================================
// TONE OPTIONS
// ============================================================================

const toneOptions = [
  { value: 'clickbait', label: 'Click Bait' },
  { value: 'viral', label: 'Viral Hook' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'educational', label: 'Educational' },
  { value: 'vulnerable', label: 'Vulnerable' },
];

// ============================================================================
// CONTENT TYPE OPTIONS
// ============================================================================

const contentTypeOptions = [
  { value: 'behind_scenes', label: 'Behind the Scenes', icon: '🎬', description: 'Show the human side, process, and authenticity' },
  { value: 'promo_offer', label: 'Promo/Offer', icon: '🎁', description: 'Special deals, discounts, and limited-time offers' },
  { value: 'advert', label: 'Advert', icon: '📢', description: 'Direct product or service promotion' },
  { value: 'statistic', label: 'Statistic', icon: '📊', description: 'Data-driven content with compelling numbers' },
  { value: 'problem_solution', label: 'Problem/Solution', icon: '💡', description: 'Address pain points and offer solutions' },
  { value: 'backstory', label: 'Back Story', icon: '📖', description: 'Origin stories, founder journeys, brand history' },
  { value: 'curiosity', label: 'Curiosity', icon: '🔍', description: 'Intrigue-driven content that sparks questions' },
  { value: 'proud_announcement', label: 'Proud Announcement', icon: '🏆', description: 'Achievements, milestones, and celebrations' },
  { value: 'project_excerpt', label: 'Project Excerpt', icon: '🎨', description: 'Portfolio piece, case study snippet, work sample' },
  { value: 'latest_news', label: 'Latest News', icon: '📰', description: 'Industry updates, company news, current events' },
  { value: 'tip_hack', label: 'Tip/Hack', icon: '⚡', description: 'Quick actionable advice and life hacks' },
  { value: 'testimonial', label: 'Testimonial', icon: '💬', description: 'Customer stories, reviews, and social proof' },
];

// ============================================================================
// SECTION ENHANCEMENT TOOLS COMPONENT
// ============================================================================

interface EnhancementToolsProps {
  content: string;
  sectionKey: string;
  sectionTitle: string;
  isHashtags?: boolean;
  isReady: boolean;
  processingSection: string | null;
  previousContent: string | null;
  onEnhance: (action: 'reduce' | 'increase' | 'grammar' | 'rewrite') => void;
  onToneChange: (tone: string) => void;
  onCustomPrompt: (prompt: string) => void;
  onUndo: () => void;
}

const SectionEnhancementTools = memo(function SectionEnhancementTools({
  content,
  sectionKey,
  sectionTitle,
  isHashtags = false,
  isReady,
  processingSection,
  previousContent,
  onEnhance,
  onToneChange,
  onCustomPrompt,
  onUndo
}: EnhancementToolsProps) {
  const [localPromptText, setLocalPromptText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasContent = content.trim().length > 0;
  const isProcessing = processingSection?.startsWith(sectionKey);
  const showUndo = previousContent !== null;

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
    <div className="flex items-center gap-0.5">
      {/* Undo Button - Fixed position on LEFT */}
      <div className="w-7 h-7 flex items-center justify-center">
        {isReady && showUndo ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onUndo}
            className="w-7 h-7 p-0 text-blue-400 hover:text-blue-300"
            title="Undo last change"
          >
            <Undo2 className="w-3 h-3" />
          </Button>
        ) : null}
      </div>

      {/* Reduce */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isReady || !hasContent || isProcessing}
        onClick={() => onEnhance('reduce')}
        className={`w-7 h-7 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
          processingSection === `${sectionKey}-reduce` ? 'animate-pulse text-amber-400' : ''
        }`}
        title={isHashtags ? "Remove one hashtag" : "Reduce word count"}
      >
        <MinusCircle className="w-3 h-3" />
      </Button>

      {/* Increase */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isReady || isProcessing}
        onClick={() => onEnhance('increase')}
        className={`w-7 h-7 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
          processingSection === `${sectionKey}-increase` ? 'animate-pulse text-amber-400' : ''
        }`}
        title={isHashtags ? "Add one hashtag" : "Expand content"}
      >
        <PlusCircle className="w-3 h-3" />
      </Button>

      {/* Grammar Check - Not for hashtags */}
      {!isHashtags && (
        <Button
          size="sm"
          variant="ghost"
          disabled={!isReady || !hasContent || isProcessing}
          onClick={() => onEnhance('grammar')}
          className={`w-7 h-7 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-grammar` ? 'animate-pulse text-amber-400' : ''
          }`}
          title="Grammar and spelling check"
        >
          <CheckCircle className="w-3 h-3" />
        </Button>
      )}

      {/* Rewrite */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isReady || !hasContent || isProcessing}
        onClick={() => onEnhance('rewrite')}
        className={`w-7 h-7 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
          processingSection === `${sectionKey}-rewrite` ? 'animate-pulse text-amber-400' : ''
        }`}
        title="Complete rewrite"
      >
        <RefreshCw className="w-3 h-3" />
      </Button>

      {/* Custom Prompt */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={!isReady || !hasContent || isProcessing}
            className={`w-7 h-7 p-0 transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
              processingSection === `${sectionKey}-custom` ? 'animate-pulse text-amber-400' : ''
            }`}
            title="Custom prompt"
          >
            <MessageSquare className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Custom Enhancement</DialogTitle>
            <DialogDescription className="text-gray-300">
              Provide specific instructions for {sectionTitle}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder={isHashtags
                ? "e.g., 'Add trending hashtags for fitness content'"
                : "e.g., 'Make it more urgent with a time-limited offer'"
              }
              value={localPromptText}
              onChange={(e) => setLocalPromptText(e.target.value)}
              className="bg-gray-900 text-gray-200 border-gray-600 min-h-[120px]"
              rows={5}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setLocalPromptText(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCustomSubmit}
              disabled={!localPromptText || isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tone Selector - Not for hashtags */}
      {!isHashtags && (
        <Select onValueChange={onToneChange} disabled={!isReady || !hasContent || isProcessing}>
          <SelectTrigger className={`w-24 h-7 text-xs transition-colors ${!isReady ? 'text-gray-700' : hasContent ? 'text-gray-400' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-tone` ? 'animate-pulse text-amber-400' : ''
          }`}>
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent className="min-w-32">
            {toneOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="px-3 py-1.5 text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
});

// ============================================================================
// CHARACTER COUNT INDICATOR
// ============================================================================

interface CharacterCountProps {
  current: number;
  limit: number;
}

function CharacterCount({ current, limit }: CharacterCountProps) {
  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isOver = percentage >= 100;

  return (
    <span className={`text-xs font-mono ${
      isOver ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-500'
    }`}>
      {current}/{limit}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SocialContentGenerator() {
  const [, navigate] = useLocation();

  // Platform & Brand State
  const [platforms, setPlatforms] = useState<PlatformRule[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [brandClients, setBrandClients] = useState<BrandClient[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandContext, setBrandContext] = useState<FlatBrandContext | null>(null);
  const [globalTone, setGlobalTone] = useState<string>('professional');
  const [selectedContentType, setSelectedContentType] = useState<string>('behind_scenes');
  const [selectedContentFocus, setSelectedContentFocus] = useState<string | null>(null);

  // Two-Stage Generation State
  const [generationStage, setGenerationStage] = useState<'idle' | 'preparing' | 'ready' | 'generating'>('idle');
  const [preparedSkillOutputs, setPreparedSkillOutputs] = useState<{
    contentType: string | null;
    platform: string | null;
    tone: string | null;
    brand: string | null;
  }>({ contentType: null, platform: null, tone: null, brand: null });

  // AI Model State
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini');
  const [lastGenerationMeta, setLastGenerationMeta] = useState<{ model: string; latencyMs: number; promptLength: number } | null>(null);

  // Content History State (for feedback tracking)
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Content State
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [sections, setSections] = useState<SectionContent>({
    hook: '',
    bodyHeader: '',
    body: '',
    cta: '',
    hashtags: ''
  });
  const [previousSections, setPreviousSections] = useState<SectionPrevious>({
    hook: null,
    bodyHeader: null,
    body: null,
    cta: null,
    hashtags: null
  });

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingSection, setProcessingSection] = useState<string | null>(null);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [showBrandData, setShowBrandData] = useState(true);  // Dev: default expanded
  const [showPlatformData, setShowPlatformData] = useState(true);  // Dev: default expanded
  const [showToneData, setShowToneData] = useState(true);  // Dev: default expanded
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);

  // Brand element toggles (which elements to include in generation)
  // Defaults: core brand context ON, few-shot examples OFF (they can overshadow hook formulas)
  const [brandElements, setBrandElements] = useState({
    industry: true,
    products: true,
    voice: true,
    audience: true,
    benefits: true,
    positiveExamples: false,  // OFF by default - can overshadow skill hook formulas
    negativeExamples: false,  // OFF by default
    forbidden: false,         // OFF by default
    spelling: true,
  });

  // Skills State - separate per section to avoid collision
  const [skills, setSkills] = useState<AISkill[]>([]);
  const [editingBrandSkill, setEditingBrandSkill] = useState<AISkill | null>(null);
  const [editingPlatformSkill, setEditingPlatformSkill] = useState<AISkill | null>(null);
  const [editingToneSkill, setEditingToneSkill] = useState<AISkill | null>(null);
  const [editingEnhancerSkill, setEditingEnhancerSkill] = useState<AISkill | null>(null);
  // Brand test output (only brand skill can be tested in isolation)
  const [brandTestOutput, setBrandTestOutput] = useState<string>('');
  const [testingSkillKey, setTestingSkillKey] = useState<string | null>(null);
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  // Expand tab state (input vs skill) - Dev: default to skill tab
  const [brandExpandTab, setBrandExpandTab] = useState<'input' | 'skill'>('skill');
  const [platformExpandTab, setPlatformExpandTab] = useState<'input' | 'skill'>('skill');
  const [toneExpandTab, setToneExpandTab] = useState<'input' | 'skill'>('skill');
  const [showEnhancerData, setShowEnhancerData] = useState(true);  // Dev: default expanded
  const [enhancerExpandTab, setEnhancerExpandTab] = useState<'input' | 'skill'>('skill');

  // Final Prompt Preview state
  const [showFinalPrompt, setShowFinalPrompt] = useState(true);  // Dev: default expanded

  // Get current platform rules
  const currentPlatform = platforms.find(p => p.platform_key === selectedPlatform);

  // Get skill by key helper
  const getSkill = (key: string) => skills.find(s => s.skill_key === key);

  // Can generate: must have brand selected OR a prompt entered
  const canGenerate = selectedBrand !== null || originalPrompt.trim().length > 0;

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const response = await fetch('/api/social-content/platforms');
        if (response.ok) {
          const data = await response.json();
          setPlatforms(data.platforms || []);
          if (data.platforms?.length > 0 && !selectedPlatform) {
            setSelectedPlatform(data.platforms[0].platform_key);
          }
        }
      } catch (error) {
        console.error('Error loading platforms:', error);
      } finally {
        setIsLoadingPlatforms(false);
      }
    };

    const loadBrandClients = async () => {
      try {
        const response = await fetch('/api/content-management/brand-intelligence/clients');
        if (response.ok) {
          const data = await response.json();
          const clients = data.data?.clients || [];
          setBrandClients(clients);

          // Auto-select SlyFox Studios as default brand
          const slyfox = clients.find((c: BrandClient) =>
            c.name.toLowerCase().includes('slyfox')
          );
          if (slyfox && !selectedBrand) {
            setSelectedBrand(slyfox.id);
          }
        }
      } catch (error) {
        console.error('Error loading brand clients:', error);
      }
    };

    const loadSkills = async () => {
      try {
        const response = await fetch('/api/social-content/skills');
        if (response.ok) {
          const data = await response.json();
          setSkills(data.skills || []);
        }
      } catch (error) {
        console.error('Error loading skills:', error);
      }
    };

    const loadModels = async () => {
      try {
        const response = await fetch('/api/social-content/models');
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);
          if (data.defaultModel) {
            setSelectedModel(data.defaultModel);
          }
        }
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadPlatforms();
    loadBrandClients();
    loadSkills();
    loadModels();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setBrandContext(null);
      setSelectedContentFocus(null);  // Reset content focus when brand is cleared
      return;
    }

    const loadBrandContext = async () => {
      try {
        const response = await fetch(`/api/social-content/brand-context/${selectedBrand}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🎯 Brand context loaded:', {
            name: data.context?.client_name,
            content_focus_options: data.context?.content_focus_options,
            hasOptions: data.context?.content_focus_options?.length > 0
          });
          setBrandContext(data.context);
          setSelectedContentFocus(null);  // Reset content focus when brand changes
        }
      } catch (error) {
        console.error('Error loading brand context:', error);
        setBrandContext(null);
        setSelectedContentFocus(null);
      }
    };

    loadBrandContext();
  }, [selectedBrand]);

  // Auto-load brand skill when skills load or brand changes
  useEffect(() => {
    if (skills.length > 0) {
      const brandSkill = skills.find(s => s.skill_key === 'brand_intel_summary');
      if (brandSkill) {
        setEditingBrandSkill({ ...brandSkill });
      }
    }
  }, [skills, selectedBrand]);

  // Auto-load platform skill when skills load or platform changes
  useEffect(() => {
    if (skills.length > 0 && selectedPlatform) {
      const platformSkill = skills.find(s => s.skill_key === `platform_${selectedPlatform}`);
      if (platformSkill) {
        setEditingPlatformSkill({ ...platformSkill });
      } else {
        setEditingPlatformSkill(null);
      }
    }
  }, [skills, selectedPlatform]);

  // Auto-load tone skill when skills load or tone changes
  useEffect(() => {
    if (skills.length > 0 && globalTone) {
      const toneSkill = skills.find(s => s.skill_key === `tone_${globalTone}`);
      if (toneSkill) {
        setEditingToneSkill({ ...toneSkill });
      } else {
        setEditingToneSkill(null);
      }
    }
  }, [skills, globalTone]);

  // Auto-load enhancer skill when skills load
  useEffect(() => {
    if (skills.length > 0) {
      const enhancerSkill = skills.find(s => s.skill_key === 'content_enhancer');
      if (enhancerSkill) {
        setEditingEnhancerSkill({ ...enhancerSkill });
      }
    }
  }, [skills]);

  // ============================================================================
  // TWO-STAGE SKILL PREPARATION
  // ============================================================================

  /**
   * Prepare Skills - Shows raw skill prompts with variables substituted
   * This is "Preview Mode" - no AI calls, just shows what will be sent to the model
   */
  const prepareSkills = async () => {
    setGenerationStage('preparing');
    setPreparedSkillOutputs({ contentType: null, platform: null, tone: null, brand: null });

    try {
      const outputs: typeof preparedSkillOutputs = { contentType: null, platform: null, tone: null, brand: null };
      let skillCount = 0;

      // Helper to substitute template variables
      const substituteVars = (template: string, vars: Record<string, string | number | undefined>) => {
        let result = template;
        Object.entries(vars).forEach(([key, value]) => {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
        });
        return result;
      };

      // Content Type skill - substitute user_prompt
      const contentTypeSkill = skills.find(s => s.skill_key === `content_type_${selectedContentType}`);
      if (contentTypeSkill) {
        outputs.contentType = substituteVars(contentTypeSkill.system_prompt, {
          user_prompt: originalPrompt || '(creative mode - no specific topic)'
        });
        skillCount++;
      }

      // Platform skill - substitute platform limits from currentPlatform
      if (editingPlatformSkill && currentPlatform) {
        outputs.platform = substituteVars(editingPlatformSkill.system_prompt, {
          hook_limit: currentPlatform.hook_limit,
          body_limit: currentPlatform.body_limit,
          cta_limit: currentPlatform.cta_limit,
          emoji_style: currentPlatform.emoji_style,
          hashtag_count_min: currentPlatform.hashtag_count_min,
          hashtag_count_max: currentPlatform.hashtag_count_max
        });
        skillCount++;
      }

      // Tone skill - no substitutions needed (it's applied to content during generation)
      if (editingToneSkill) {
        outputs.tone = editingToneSkill.system_prompt;
        skillCount++;
      }

      // Brand context - build a summary string (not from skill, but from actual brand data)
      if (brandContext) {
        const brandLines: string[] = [];
        brandLines.push(`CLIENT: ${brandContext.client_name}`);
        if (brandContext.industry_segment) brandLines.push(`INDUSTRY: ${brandContext.industry_segment}`);
        if (brandContext.products_services) brandLines.push(`PRODUCTS: ${brandContext.products_services}`);
        if (brandContext.voice_tone) brandLines.push(`VOICE: ${brandContext.voice_tone}`);
        if (brandContext.target_audience) brandLines.push(`AUDIENCE: ${brandContext.target_audience}`);
        if (brandContext.priority_benefits?.length) brandLines.push(`BENEFITS: ${brandContext.priority_benefits.slice(0, 3).join(', ')}`);
        if (brandContext.forbidden_phrases?.length) brandLines.push(`FORBIDDEN: ${brandContext.forbidden_phrases.join(', ')}`);
        brandLines.push(`SPELLING: ${brandContext.spelling || 'british'} English`);

        outputs.brand = brandLines.join('\n');
        skillCount++;
      }

      setPreparedSkillOutputs(outputs);
      setGenerationStage('ready');

      toast({
        title: 'Skills Prepared',
        description: `${skillCount} skill${skillCount !== 1 ? 's' : ''} ready for review. Edit if needed, then Generate.`
      });
    } catch (error) {
      console.error('Skill preparation error:', error);
      toast({ title: 'Preparation Failed', description: 'Could not prepare skills.', variant: 'destructive' });
      setGenerationStage('idle');
    }
  };

  // ============================================================================
  // CONTENT GENERATION
  // ============================================================================

  const generateAllSections = async () => {
    setIsGenerating(true);
    setGenerationStage('generating');
    setLastGenerationMeta(null);
    setCurrentContentId(null);  // Reset content ID for new generation
    setFeedbackSubmitted(false);  // Reset feedback state

    try {
      const response = await fetch('/api/social-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt || '',  // Allow empty prompt
          platform: selectedPlatform,
          tone: globalTone,
          contentType: selectedContentType,  // NEW: Include content type
          contentFocus: selectedContentFocus,  // NEW: Include content focus
          brandClientId: selectedBrand,
          model: selectedModel,  // Pass selected AI model
          brandElements,  // Pass which brand elements to include
          preparedSkillOutputs: generationStage === 'ready' ? preparedSkillOutputs : null  // Pass pre-computed skill outputs if available
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();

      const generatedSections = {
        hook: data.hook || '',
        bodyHeader: data.bodyHeader || '',
        body: data.body || '',
        cta: data.cta || '',
        hashtags: data.hashtags || ''
      };

      setSections(generatedSections);

      // Capture generation metadata
      if (data.metadata) {
        setLastGenerationMeta(data.metadata);
      }

      setPreviousSections({ hook: null, bodyHeader: null, body: null, cta: null, hashtags: null });

      // Save to content history for feedback tracking
      try {
        const historyResponse = await fetch('/api/social-content/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: selectedBrand,
            platform: selectedPlatform,
            tone: globalTone,
            model: selectedModel,
            originalPrompt: originalPrompt || null,
            brandElements: brandElements,
            hook: generatedSections.hook,
            bodyHeader: generatedSections.bodyHeader,
            body: generatedSections.body,
            cta: generatedSections.cta,
            hashtags: generatedSections.hashtags,
            fullPrompt: constructedPrompt,
            generationTimeMs: data.metadata?.latencyMs || null
          })
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setCurrentContentId(historyData.contentId);  // Backend returns contentId, not id
          console.log('Content saved to history with ID:', historyData.contentId);
        }
      } catch (historyError) {
        console.error('Failed to save content history:', historyError);
        // Non-blocking - generation succeeded, history save is optional
      }

      toast({
        title: 'Content Generated',
        description: data.metadata
          ? `Generated with ${data.metadata.model} in ${(data.metadata.latencyMs / 1000).toFixed(1)}s`
          : 'All sections have been generated.'
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({ title: 'Generation Failed', description: 'Could not generate content. Please try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setGenerationStage('idle');
      setPreparedSkillOutputs({ contentType: null, platform: null, tone: null, brand: null });
    }
  };

  // ============================================================================
  // SECTION ENHANCEMENT
  // ============================================================================

  const enhanceSection = useCallback(async (
    sectionKey: keyof SectionContent,
    action: 'reduce' | 'increase' | 'grammar' | 'rewrite' | 'tone' | 'custom',
    options?: { tone?: string; customPrompt?: string }
  ) => {
    const content = sections[sectionKey];
    if (!content && action !== 'increase') return;

    setProcessingSection(`${sectionKey}-${action}`);
    setPreviousSections(prev => ({ ...prev, [sectionKey]: content }));

    try {
      const response = await fetch('/api/social-content/enhance-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          content,
          action,
          tone: options?.tone,
          customPrompt: options?.customPrompt,
          platform: selectedPlatform,
          brandClientId: selectedBrand,
          spelling: brandContext?.spelling || 'british'
        })
      });

      if (!response.ok) throw new Error('Enhancement failed');

      const data = await response.json();
      setSections(prev => ({ ...prev, [sectionKey]: data.enhanced }));
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({ title: 'Enhancement Failed', description: 'Could not enhance content.', variant: 'destructive' });
      setPreviousSections(prev => ({ ...prev, [sectionKey]: null }));
    } finally {
      setProcessingSection(null);
    }
  }, [sections, selectedPlatform, selectedBrand, brandContext]);

  const handleUndo = useCallback((sectionKey: keyof SectionContent) => {
    const previous = previousSections[sectionKey];
    if (previous !== null) {
      setSections(prev => ({ ...prev, [sectionKey]: previous }));
      setPreviousSections(prev => ({ ...prev, [sectionKey]: null }));
    }
  }, [previousSections]);

  // ============================================================================
  // SKILL MANAGEMENT
  // ============================================================================

  /**
   * Test Brand skill - only brand skill works in isolation (summarises brand data)
   * Platform, Tone, and Enhancer skills need full context so their Test buttons were removed
   */
  const testBrandSkill = async (skillKey: string, systemPrompt: string, inputData: Record<string, any>, temperature: number = 0.7) => {
    setTestingSkillKey(skillKey);
    setBrandTestOutput('');

    try {
      const response = await fetch('/api/social-content/skills/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillKey,
          systemPrompt,
          inputData,
          temperature
        })
      });

      // Handle rate limiting
      if (response.status === 429) {
        const data = await response.json();
        toast({
          title: 'Rate Limited',
          description: data.message || `Please wait ${data.retryAfter || 3} seconds before testing again`,
          variant: 'destructive'
        });
        return;
      }

      if (!response.ok) throw new Error('Test failed');

      const data = await response.json();
      setBrandTestOutput(data.output || 'No output');
      toast({ title: 'Brand Brief Generated', description: 'Check the output below.' });
    } catch (error) {
      console.error('Brand skill test error:', error);
      toast({ title: 'Test Failed', description: 'Could not generate brand brief.', variant: 'destructive' });
    } finally {
      setTestingSkillKey(null);
    }
  };

  const saveSkill = async (skill: AISkill, section: 'brand' | 'platform' | 'tone' | 'enhancer') => {
    setIsSavingSkill(true);

    try {
      const response = await fetch(`/api/social-content/skills/${skill.skill_key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: skill.system_prompt,
          name: skill.name,
          description: skill.description,
          temperature: skill.temperature,
          max_tokens: skill.max_tokens
        })
      });

      if (!response.ok) throw new Error('Save failed');

      // Update local skills state
      setSkills(prev => prev.map(s => s.skill_key === skill.skill_key ? skill : s));

      // Update the appropriate editing skill state
      if (section === 'brand') setEditingBrandSkill(skill);
      else if (section === 'platform') setEditingPlatformSkill(skill);
      else if (section === 'tone') setEditingToneSkill(skill);
      else if (section === 'enhancer') setEditingEnhancerSkill(skill);

      toast({ title: 'Skill Saved', description: 'Changes persisted to database.' });
    } catch (error) {
      console.error('Skill save error:', error);
      toast({ title: 'Save Failed', description: 'Could not save skill.', variant: 'destructive' });
    } finally {
      setIsSavingSkill(false);
    }
  };

  // Section-specific prompt updaters
  const updateBrandSkillPrompt = (newPrompt: string) => {
    if (editingBrandSkill) {
      setEditingBrandSkill({ ...editingBrandSkill, system_prompt: newPrompt });
    }
  };

  const updatePlatformSkillPrompt = (newPrompt: string) => {
    if (editingPlatformSkill) {
      setEditingPlatformSkill({ ...editingPlatformSkill, system_prompt: newPrompt });
    }
  };

  const updateToneSkillPrompt = (newPrompt: string) => {
    if (editingToneSkill) {
      setEditingToneSkill({ ...editingToneSkill, system_prompt: newPrompt });
    }
  };

  const updateEnhancerSkillPrompt = (newPrompt: string) => {
    if (editingEnhancerSkill) {
      setEditingEnhancerSkill({ ...editingEnhancerSkill, system_prompt: newPrompt });
    }
  };

  // ============================================================================
  // FINAL PROMPT PREVIEW - Built live on client (no API call needed)
  // ============================================================================

  const { constructedPrompt, skillsUsed } = useMemo(() => {
    // Get skill prompts - use prepared outputs if available, otherwise use editing state
    const enhancerSkill = editingEnhancerSkill?.system_prompt || '';
    const platformSkill = preparedSkillOutputs.platform || editingPlatformSkill?.system_prompt || '';
    const toneSkill = preparedSkillOutputs.tone || editingToneSkill?.system_prompt || '';
    const contentTypeSkill = preparedSkillOutputs.contentType || '';

    // Get content type info
    const contentTypeInfo = contentTypeOptions.find(t => t.value === selectedContentType);

    // Track which skills are being used
    const usedSkills: string[] = [];
    if (enhancerSkill) usedSkills.push('content_enhancer');
    if (contentTypeSkill || selectedContentType) usedSkills.push(`content_type_${selectedContentType}`);
    if (platformSkill) usedSkills.push(`platform_${selectedPlatform}`);
    if (toneSkill) usedSkills.push(`tone_${globalTone}`);

    // Build the prompt (mirrors backend buildGenerationSystemPromptWithSkills)
    let prompt = `You are an expert social media content writer. Generate engaging social media content.

=== MASTER INSTRUCTIONS ===
${enhancerSkill || 'Generate compelling, engaging content that fits the platform and tone.'}

=== CONTENT TYPE: ${contentTypeInfo?.label?.toUpperCase() || 'GENERAL'} ===
${contentTypeSkill || contentTypeInfo?.description || 'Create content appropriate for the selected type.'}

=== PLATFORM: ${selectedPlatform?.toUpperCase() || 'SOCIAL MEDIA'} ===
${platformSkill || 'Follow platform best practices.'}

=== TONE: ${globalTone?.toUpperCase() || 'PROFESSIONAL'} ===
${toneSkill || `Write in a ${globalTone || 'professional'} voice.`}

`;

    // Add brand context if available (filtered by user-selected elements)
    if (brandContext) {
      const brandLines: string[] = [];
      brandLines.push(`- Client: ${brandContext.client_name || 'Unknown'}`);

      if (brandElements.spelling) {
        brandLines.push(`- Spelling: Use ${brandContext.spelling} English`);
      }
      if (brandElements.industry && brandContext.industry_segment) {
        brandLines.push(`- Industry: ${brandContext.industry_segment}`);
      }
      if (brandElements.products && brandContext.products_services) {
        brandLines.push(`- Products/Services: ${brandContext.products_services}`);
      }
      if (brandElements.voice && brandContext.voice_tone) {
        brandLines.push(`- Voice: ${brandContext.voice_tone}`);
      }
      if (brandElements.audience && brandContext.target_audience) {
        brandLines.push(`- Target Audience: ${brandContext.target_audience}`);
      }
      if (brandElements.benefits && brandContext.priority_benefits?.length) {
        brandLines.push(`- Key Benefits: ${brandContext.priority_benefits.slice(0, 3).join(', ')}`);
      }

      if (brandLines.length > 1) {  // More than just client name
        prompt += `=== BRAND CONTEXT ===
${brandLines.join('\n')}

`;
      }

      // Add positive examples if enabled (few-shot learning)
      if (brandElements.positiveExamples && brandContext.positive_examples?.length) {
        prompt += `GOOD CONTENT EXAMPLES (match this style):
${brandContext.positive_examples.slice(0, 3).map((ex: string, i: number) => `${i + 1}. "${ex}"`).join('\n')}

`;
      }

      // Add negative examples if enabled
      if (brandElements.negativeExamples && brandContext.negative_examples?.length) {
        prompt += `BAD CONTENT EXAMPLES (avoid this style):
${brandContext.negative_examples.slice(0, 2).map((ex: string, i: number) => `${i + 1}. "${ex}"`).join('\n')}

`;
      }

      // Add forbidden phrases if enabled
      if (brandElements.forbidden && brandContext.forbidden_phrases?.length) {
        prompt += `FORBIDDEN PHRASES (never use these):
${brandContext.forbidden_phrases.join(', ')}

`;
      }
    }

    // Add user prompt section
    prompt += `=== USER REQUEST ===
${originalPrompt ? `Topic/Idea: "${originalPrompt}"` : 'Generate an engaging post that fits the platform, tone, and brand. Pick a relevant topic, seasonal angle, tip, or evergreen theme.'}

=== OUTPUT FORMAT ===
Return ONLY valid JSON with these exact keys (no markdown, no explanation, no extra text):
{
  "hook": "Attention-grabbing opening line that stops the scroll",
  "bodyHeader": "Brief subheading or transition phrase",
  "body": "Main content - the value/story/information",
  "cta": "Clear, compelling call to action",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3..."
}`;

    return { constructedPrompt: prompt, skillsUsed: usedSkills };
  }, [editingEnhancerSkill, editingPlatformSkill, editingToneSkill, brandContext, brandElements, originalPrompt, selectedPlatform, globalTone, selectedContentType, preparedSkillOutputs]);

  // ============================================================================
  // FINAL ASSEMBLY
  // ============================================================================

  const assembledContent = [
    sections.hook,
    sections.bodyHeader,
    sections.body,
    sections.cta,
    '',
    sections.hashtags
  ].filter(s => s.trim()).join('\n\n');

  // Calculate true character count (sum of individual sections, not including formatting line breaks)
  const totalCharacters = [
    sections.hook,
    sections.bodyHeader,
    sections.body,
    sections.cta,
    sections.hashtags
  ].reduce((sum, s) => sum + (s?.trim()?.length || 0), 0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(assembledContent);
    toast({ title: 'Copied', description: 'Content copied to clipboard.' });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />

        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tools')}
                className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-salmon mb-2">Social Content Generator</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Platform-optimised social media content with brand intelligence
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ================================================================ */}
              {/* LEFT COLUMN - Controls */}
              {/* ================================================================ */}
              <div className="space-y-4">

                {/* Prompt & Generate - NOW AT TOP */}
                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <Label className="text-sm font-medium text-white mb-2 block">Prompt</Label>
                  <Textarea
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="Describe what you want to post about... (optional - leave blank for AI to get creative)"
                    className="min-h-[80px] mb-3"
                  />

                  {/* Content Type Selector */}
                  <div className="mb-3">
                    <Label className="text-xs text-gray-400 mb-2 block">Content Type</Label>
                    <div className="pill-btn-group flex-wrap">
                      {contentTypeOptions.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setSelectedContentType(type.value)}
                          className={`pill-btn pill-btn-icon ${selectedContentType === type.value ? 'pill-btn-active' : ''}`}
                          title={type.description}
                        >
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model Selector */}
                  <div className="mb-3">
                    <Label className="text-xs text-gray-400 mb-2 block">AI Model</Label>
                    <div className="pill-btn-group">
                      {availableModels.map((model) => {
                        const isSelected = selectedModel === model.key;
                        const isAvailable = model.available;
                        return (
                          <button
                            key={model.key}
                            onClick={() => isAvailable && setSelectedModel(model.key)}
                            disabled={!isAvailable}
                            className={`pill-btn ${isSelected ? 'pill-btn-active' : ''} ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title={!isAvailable ? 'API key not configured' : model.displayName}
                          >
                            {model.key === 'gemini' ? '🔮 Gemini' : model.key === 'openai' ? '🤖 GPT-4o' : '🧠 Claude'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Two-Stage Generate Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={prepareSkills}
                      disabled={generationStage === 'preparing' || !canGenerate}
                      className={`flex-1 ${generationStage === 'ready' ? 'bg-green-700 hover:bg-green-600' : 'bg-amber-600 hover:bg-amber-500'}`}
                      title={!canGenerate ? 'Select a brand or enter a prompt' : 'Prepare skills for review'}
                    >
                      {generationStage === 'preparing' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Preparing...
                        </>
                      ) : generationStage === 'ready' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Skills Ready
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Prepare Skills
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={generateAllSections}
                      disabled={isGenerating || !canGenerate}
                      className="flex-1 btn-cyan"
                      title={!canGenerate ? 'Select a brand or enter a prompt' : 'Generate final content'}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Last Generation Meta */}
                  {lastGenerationMeta && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-gray-500">
                      <span>Last: {lastGenerationMeta.model}</span>
                      <span>•</span>
                      <span>{(lastGenerationMeta.latencyMs / 1000).toFixed(1)}s</span>
                      <span>•</span>
                      <span>{lastGenerationMeta.promptLength.toLocaleString()} chars</span>
                    </div>
                  )}

                  {/* Expandable Enhancer Skill */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <button
                      onClick={() => setShowEnhancerData(!showEnhancerData)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                    >
                      {showEnhancerData ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showEnhancerData ? 'Hide' : 'Show'} enhancer skill
                    </button>

                    {showEnhancerData && (
                      <div className="mt-2">
                        {/* Tab Switcher */}
                        <div className="flex gap-1 mb-2">
                          <button
                            onClick={() => setEnhancerExpandTab('input')}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                              enhancerExpandTab === 'input' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <Database className="h-2.5 w-2.5" />
                            Input
                          </button>
                          <button
                            onClick={() => setEnhancerExpandTab('skill')}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                              enhancerExpandTab === 'skill' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <Code className="h-2.5 w-2.5" />
                            Skill
                          </button>
                        </div>

                        {/* Input Tab Content - Shows what will be passed to enhancer */}
                        {enhancerExpandTab === 'input' && (
                          <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                            <div><span className="text-gray-500">User Prompt:</span> <span className="text-gray-300">{originalPrompt || '(empty - AI will create)'}</span></div>
                            <div><span className="text-gray-500">Platform:</span> <span className="text-gray-300">{currentPlatform?.label || selectedPlatform}</span></div>
                            <div><span className="text-gray-500">Tone:</span> <span className="text-gray-300">{globalTone}</span></div>
                            <div><span className="text-gray-500">Brand:</span> <span className="text-gray-300">{brandContext?.client_name || 'None'}</span></div>
                          </div>
                        )}

                        {/* Skill Tab Content - Editable enhancer prompt */}
                        {enhancerExpandTab === 'skill' && (
                          <div className="space-y-2">
                            {editingEnhancerSkill ? (
                              <>
                                <textarea
                                  value={editingEnhancerSkill.system_prompt}
                                  onChange={(e) => updateEnhancerSkillPrompt(e.target.value)}
                                  className="w-full h-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y"
                                  placeholder="Enhancer skill prompt..."
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => saveSkill(editingEnhancerSkill, 'enhancer')}
                                    disabled={isSavingSkill}
                                    className="h-6 px-2 text-[10px] bg-green-700 hover:bg-green-600"
                                  >
                                    {isSavingSkill ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="p-2 bg-gray-800 rounded text-xs text-gray-500 italic">
                                No skill found for content_enhancer. Run the SQL to seed skills.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand Selector - Pill Buttons */}
                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">Brand</h3>
                    {selectedBrand && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBrandPickerOpen(true)}
                        className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Elements
                      </Button>
                    )}
                  </div>

                  <div className="pill-btn-group">
                    <button
                      onClick={() => setSelectedBrand(null)}
                      className={`pill-btn ${selectedBrand === null ? 'pill-btn-active' : ''}`}
                    >
                      None
                    </button>
                    {brandClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedBrand(client.id)}
                        className={`pill-btn ${selectedBrand === client.id ? 'pill-btn-active' : ''}`}
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>

                  {/* Content Focus Selector - Only show if brand has content_focus_options */}
                  {brandContext?.content_focus_options && brandContext.content_focus_options.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <Label className="text-xs text-gray-400 mb-2 block">Content Focus</Label>
                      <div className="pill-btn-group flex-wrap">
                        <button
                          onClick={() => setSelectedContentFocus(null)}
                          className={`pill-btn ${selectedContentFocus === null ? 'pill-btn-active' : ''}`}
                        >
                          All
                        </button>
                        {brandContext.content_focus_options.map((focus) => (
                          <button
                            key={focus}
                            onClick={() => setSelectedContentFocus(focus)}
                            className={`pill-btn ${selectedContentFocus === focus ? 'pill-btn-active' : ''}`}
                          >
                            {focus}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expandable Brand Data Preview */}
                  {brandContext && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <button
                        onClick={() => setShowBrandData(!showBrandData)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                      >
                        {showBrandData ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showBrandData ? 'Hide' : 'Show'} context
                      </button>

                      {showBrandData && (
                        <div className="mt-2">
                          {/* Tab Switcher */}
                          <div className="flex gap-1 mb-2">
                            <button
                              onClick={() => setBrandExpandTab('input')}
                              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                                brandExpandTab === 'input' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <Database className="h-2.5 w-2.5" />
                              Input
                            </button>
                            <button
                              onClick={() => {
                                setBrandExpandTab('skill');
                              }}
                              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                                brandExpandTab === 'skill' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <Code className="h-2.5 w-2.5" />
                              Skill
                            </button>
                          </div>

                          {/* Input Tab Content */}
                          {brandExpandTab === 'input' && (
                            <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                              {brandElements.industry && brandContext.industry_segment && (
                                <div><span className="text-gray-500">Industry:</span> <span className="text-gray-300">{brandContext.industry_segment}</span></div>
                              )}
                              {brandElements.products && brandContext.products_services && (
                                <div><span className="text-gray-500">Products:</span> <span className="text-gray-300">{brandContext.products_services.substring(0, 80)}...</span></div>
                              )}
                              {brandElements.voice && brandContext.voice_tone && (
                                <div><span className="text-gray-500">Voice:</span> <span className="text-gray-300">{brandContext.voice_tone}</span></div>
                              )}
                              {brandElements.audience && brandContext.target_audience && (
                                <div><span className="text-gray-500">Audience:</span> <span className="text-gray-300">{brandContext.target_audience.substring(0, 60)}...</span></div>
                              )}
                              {brandElements.spelling && (
                                <div><span className="text-gray-500">Spelling:</span> <span className="text-gray-300">{brandContext.spelling}</span></div>
                              )}
                            </div>
                          )}

                          {/* Skill Tab Content */}
                          {brandExpandTab === 'skill' && (
                            <div className="space-y-2">
                              {editingBrandSkill ? (
                                <>
                                  <textarea
                                    value={editingBrandSkill.system_prompt}
                                    onChange={(e) => updateBrandSkillPrompt(e.target.value)}
                                    className="w-full h-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y"
                                    placeholder="Skill prompt template..."
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => testBrandSkill(editingBrandSkill.skill_key, editingBrandSkill.system_prompt, {
                                        industry_segment: brandContext.industry_segment,
                                        products_services: brandContext.products_services,
                                        voice_tone: brandContext.voice_tone,
                                        target_audience: brandContext.target_audience,
                                        priority_benefits: brandContext.priority_benefits?.join(', '),
                                        forbidden_phrases: brandContext.forbidden_phrases?.join(', '),
                                        spelling: brandContext.spelling
                                      }, editingBrandSkill.temperature)}
                                      disabled={testingSkillKey?.startsWith('brand_')}
                                      className="h-6 px-2 text-[10px]"
                                    >
                                      {testingSkillKey?.startsWith('brand_') ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
                                      <span className="ml-1">Test</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => saveSkill(editingBrandSkill, 'brand')}
                                      disabled={isSavingSkill}
                                      className="h-6 px-2 text-[10px] bg-green-700 hover:bg-green-600"
                                    >
                                      {isSavingSkill ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                                      <span className="ml-1">Save</span>
                                    </Button>
                                  </div>
                                  {brandTestOutput && (
                                    <div className="p-2 bg-gray-900 border border-green-800/50 rounded text-[10px] text-green-300 max-h-32 overflow-y-auto">
                                      <div className="text-gray-500 mb-1">Output:</div>
                                      {brandTestOutput}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="p-2 bg-gray-800 rounded text-xs text-gray-500 italic">
                                  No skill found for brand_intel_summary. Run the SQL to seed skills.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Platform Selector */}
                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Platform</h3>

                  {isLoadingPlatforms ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="pill-btn-group">
                      {platforms.map((platform) => (
                        <button
                          key={platform.platform_key}
                          onClick={() => setSelectedPlatform(platform.platform_key)}
                          className={`pill-btn pill-btn-icon ${selectedPlatform === platform.platform_key ? 'pill-btn-active' : ''}`}
                        >
                          <span>{platform.icon}</span>
                          <span>{platform.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Expandable Platform Rules Preview */}
                  {currentPlatform && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <button
                        onClick={() => setShowPlatformData(!showPlatformData)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                      >
                        {showPlatformData ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showPlatformData ? 'Hide' : 'Show'} context
                      </button>

                      {showPlatformData && (
                        <div className="mt-2">
                          {/* Tab Switcher */}
                          <div className="flex gap-1 mb-2">
                            <button
                              onClick={() => setPlatformExpandTab('input')}
                              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                                platformExpandTab === 'input' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <Database className="h-2.5 w-2.5" />
                              Input
                            </button>
                            <button
                              onClick={() => setPlatformExpandTab('skill')}
                              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                                platformExpandTab === 'skill' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <Code className="h-2.5 w-2.5" />
                              Skill
                            </button>
                          </div>

                          {/* Input Tab Content - Platform Rules */}
                          {platformExpandTab === 'input' && (
                            <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                              <div><span className="text-gray-500">Hook:</span> <span className="text-gray-300">{currentPlatform.hook_limit} chars</span></div>
                              <div><span className="text-gray-500">Body:</span> <span className="text-gray-300">{currentPlatform.body_limit} chars</span></div>
                              <div><span className="text-gray-500">CTA:</span> <span className="text-gray-300">{currentPlatform.cta_limit} chars</span></div>
                              <div><span className="text-gray-500">Hashtags:</span> <span className="text-gray-300">{currentPlatform.hashtag_count_min}-{currentPlatform.hashtag_count_max}</span></div>
                              <div><span className="text-gray-500">Emojis:</span> <span className="text-gray-300">{currentPlatform.emoji_style}</span></div>
                              <div><span className="text-gray-500">Total:</span> <span className="text-gray-300">{currentPlatform.total_character_limit} chars</span></div>
                              {currentPlatform.guidelines && (
                                <div className="pt-1 border-t border-gray-700 mt-1">
                                  <span className="text-gray-400">{currentPlatform.guidelines}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Skill Tab Content - Platform Skill */}
                          {platformExpandTab === 'skill' && (
                            <div className="space-y-2">
                              {editingPlatformSkill ? (
                                <>
                                  <textarea
                                    value={editingPlatformSkill.system_prompt}
                                    onChange={(e) => updatePlatformSkillPrompt(e.target.value)}
                                    className="w-full h-64 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y"
                                    placeholder="Platform skill prompt..."
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => saveSkill(editingPlatformSkill, 'platform')}
                                      disabled={isSavingSkill}
                                      className="h-6 px-2 text-[10px] bg-green-700 hover:bg-green-600"
                                    >
                                      {isSavingSkill ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                                      <span className="ml-1">Save</span>
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="p-2 bg-gray-800 rounded text-xs text-gray-500 italic">
                                  No skill found for platform_{selectedPlatform}. Run the SQL to seed skills.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tone Selector - Pill Buttons */}
                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Tone</h3>
                  <div className="pill-btn-group">
                    {toneOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setGlobalTone(option.value)}
                        className={`pill-btn ${globalTone === option.value ? 'pill-btn-active' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Expandable Tone Description & Skill */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <button
                      onClick={() => setShowToneData(!showToneData)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                    >
                      {showToneData ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showToneData ? 'Hide' : 'Show'} details
                    </button>

                    {showToneData && (
                      <div className="mt-2">
                        {/* Tab Switcher */}
                        <div className="flex gap-1 mb-2">
                          <button
                            onClick={() => setToneExpandTab('input')}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                              toneExpandTab === 'input' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <Database className="h-2.5 w-2.5" />
                            Description
                          </button>
                          <button
                            onClick={() => setToneExpandTab('skill')}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                              toneExpandTab === 'skill' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <Code className="h-2.5 w-2.5" />
                            Skill
                          </button>
                        </div>

                        {/* Description Tab Content */}
                        {toneExpandTab === 'input' && (
                          <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                            {globalTone === 'clickbait' && 'Attention-grabbing headlines that create curiosity and urgency. Uses power words and emotional triggers.'}
                            {globalTone === 'viral' && 'Designed for maximum shareability. Relatable, surprising, or emotionally resonant content that spreads organically.'}
                            {globalTone === 'humorous' && 'Light-hearted and witty. Uses wordplay, self-deprecation, or observational comedy to entertain.'}
                            {globalTone === 'professional' && 'Business-appropriate and polished. Clear, direct language with industry terminology and confident tone.'}
                            {globalTone === 'casual' && 'Conversational and approachable. Uses contractions, informal phrasing, and relatable language.'}
                            {globalTone === 'friendly' && 'Warm and welcoming. Builds connection through empathy, positivity, and inclusive language.'}
                            {globalTone === 'educational' && 'Informative and clear. Breaks down complex topics into digestible insights with practical takeaways.'}
                            {globalTone === 'vulnerable' && 'Authentic and personal. Shares struggles, lessons learned, and genuine experiences to build trust.'}
                          </div>
                        )}

                        {/* Skill Tab Content */}
                        {toneExpandTab === 'skill' && (
                          <div className="space-y-2">
                            {editingToneSkill ? (
                              <>
                                <textarea
                                  value={editingToneSkill.system_prompt}
                                  onChange={(e) => updateToneSkillPrompt(e.target.value)}
                                  className="w-full h-48 p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y"
                                  placeholder="Tone skill prompt..."
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => saveSkill(editingToneSkill, 'tone')}
                                    disabled={isSavingSkill}
                                    className="h-6 px-2 text-[10px] bg-green-700 hover:bg-green-600"
                                  >
                                    {isSavingSkill ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="p-2 bg-gray-800 rounded text-xs text-gray-500 italic">
                                No skill found for tone_{globalTone}. Run the SQL to seed skills.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ================================================================ */}
                {/* PREPARED SKILL OUTPUTS - Shows after "Prepare Skills" clicked */}
                {/* ================================================================ */}
                {(generationStage === 'ready' || generationStage === 'preparing') && (
                  <div className="p-4 bg-gray-800 border border-amber-600/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-medium text-amber-400">Prepared Skill Outputs</h3>
                      {generationStage === 'preparing' && (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Content Type Output */}
                      {preparedSkillOutputs.contentType && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-gray-400 font-medium">
                            📝 Content Type ({contentTypeOptions.find(t => t.value === selectedContentType)?.label})
                          </div>
                          <textarea
                            value={preparedSkillOutputs.contentType}
                            onChange={(e) => setPreparedSkillOutputs(prev => ({ ...prev, contentType: e.target.value }))}
                            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y min-h-[60px]"
                          />
                        </div>
                      )}

                      {/* Platform Output */}
                      {preparedSkillOutputs.platform && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-gray-400 font-medium">
                            📱 Platform ({currentPlatform?.label})
                          </div>
                          <textarea
                            value={preparedSkillOutputs.platform}
                            onChange={(e) => setPreparedSkillOutputs(prev => ({ ...prev, platform: e.target.value }))}
                            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y min-h-[60px]"
                          />
                        </div>
                      )}

                      {/* Tone Output */}
                      {preparedSkillOutputs.tone && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-gray-400 font-medium">
                            🎭 Tone ({globalTone})
                          </div>
                          <textarea
                            value={preparedSkillOutputs.tone}
                            onChange={(e) => setPreparedSkillOutputs(prev => ({ ...prev, tone: e.target.value }))}
                            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y min-h-[60px]"
                          />
                        </div>
                      )}

                      {/* Brand Output */}
                      {preparedSkillOutputs.brand && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-gray-400 font-medium">
                            🏢 Brand ({brandContext?.client_name})
                          </div>
                          <textarea
                            value={preparedSkillOutputs.brand}
                            onChange={(e) => setPreparedSkillOutputs(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono resize-y min-h-[60px]"
                          />
                        </div>
                      )}

                      {generationStage === 'ready' && (
                        <div className="pt-2 text-[10px] text-amber-400 italic">
                          ✓ Review and edit the outputs above, then click "Generate" to create your final content.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                {/* FINAL PROMPT PREVIEW - Shows exactly what gets sent to Gemini */}
                {/* ================================================================ */}
                <div className="p-4 bg-gray-800 border border-cyan-800/50 rounded-lg">
                  <button
                    onClick={() => setShowFinalPrompt(!showFinalPrompt)}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-medium text-cyan-400">Final Constructed Prompt</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {skillsUsed.length > 0 && (
                        <span className="text-[10px] text-gray-500">
                          {skillsUsed.length} skills loaded
                        </span>
                      )}
                      {showFinalPrompt ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {showFinalPrompt && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                          This is the exact prompt sent to Gemini (updates live)
                        </span>
                        <span className="text-[10px] text-green-500">● Live</span>
                      </div>

                      <div className="relative">
                        <pre className="p-3 bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                          {constructedPrompt}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(constructedPrompt);
                              toast({ title: 'Copied', description: 'Prompt copied to clipboard.' });
                            }}
                            className="h-6 px-2 text-[10px] hover:bg-gray-700"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {skillsUsed.map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 text-[9px] rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 text-[10px] text-gray-500">
                          {constructedPrompt.length.toLocaleString()} characters
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ================================================================ */}
              {/* RIGHT COLUMN - Output Sections (Ultra Compact) */}
              {/* ================================================================ */}
              <div className="space-y-3">
                {/* Content Sections Container */}
                <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg space-y-2">

                  {/* Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-400 font-medium">Hook</Label>
                        {currentPlatform && <CharacterCount current={sections.hook.length} limit={currentPlatform.hook_limit} />}
                      </div>
                      <SectionEnhancementTools
                        content={sections.hook}
                        sectionKey="hook"
                        sectionTitle="Hook"
                        isReady={!isGenerating}
                        processingSection={processingSection}
                        previousContent={previousSections.hook}
                        onEnhance={(action) => enhanceSection('hook', action)}
                        onToneChange={(tone) => enhanceSection('hook', 'tone', { tone })}
                        onCustomPrompt={(prompt) => enhanceSection('hook', 'custom', { customPrompt: prompt })}
                        onUndo={() => handleUndo('hook')}
                      />
                    </div>
                    <Textarea
                      value={sections.hook}
                      onChange={(e) => setSections(prev => ({ ...prev, hook: e.target.value }))}
                      placeholder="Attention-grabbing opening..."
                      className="min-h-[44px] bg-gray-800 text-sm py-2"
                    />
                  </div>

                  {/* Body Header */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-400 font-medium">Header</Label>
                        {currentPlatform && <CharacterCount current={sections.bodyHeader.length} limit={currentPlatform.body_header_limit} />}
                      </div>
                      <SectionEnhancementTools
                        content={sections.bodyHeader}
                        sectionKey="bodyHeader"
                        sectionTitle="Body Header"
                        isReady={!isGenerating}
                        processingSection={processingSection}
                        previousContent={previousSections.bodyHeader}
                        onEnhance={(action) => enhanceSection('bodyHeader', action)}
                        onToneChange={(tone) => enhanceSection('bodyHeader', 'tone', { tone })}
                        onCustomPrompt={(prompt) => enhanceSection('bodyHeader', 'custom', { customPrompt: prompt })}
                        onUndo={() => handleUndo('bodyHeader')}
                      />
                    </div>
                    <Textarea
                      value={sections.bodyHeader}
                      onChange={(e) => setSections(prev => ({ ...prev, bodyHeader: e.target.value }))}
                      placeholder="Subheading or transition..."
                      className="min-h-[36px] bg-gray-800 text-sm py-2"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-400 font-medium">Body</Label>
                        {currentPlatform && <CharacterCount current={sections.body.length} limit={currentPlatform.body_limit} />}
                      </div>
                      <SectionEnhancementTools
                        content={sections.body}
                        sectionKey="body"
                        sectionTitle="Body"
                        isReady={!isGenerating}
                        processingSection={processingSection}
                        previousContent={previousSections.body}
                        onEnhance={(action) => enhanceSection('body', action)}
                        onToneChange={(tone) => enhanceSection('body', 'tone', { tone })}
                        onCustomPrompt={(prompt) => enhanceSection('body', 'custom', { customPrompt: prompt })}
                        onUndo={() => handleUndo('body')}
                      />
                    </div>
                    <Textarea
                      value={sections.body}
                      onChange={(e) => setSections(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Main content..."
                      className="min-h-[70px] bg-gray-800 text-sm py-2"
                    />
                  </div>

                  {/* CTA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-400 font-medium">CTA</Label>
                        {currentPlatform && <CharacterCount current={sections.cta.length} limit={currentPlatform.cta_limit} />}
                      </div>
                      <SectionEnhancementTools
                        content={sections.cta}
                        sectionKey="cta"
                        sectionTitle="Call to Action"
                        isReady={!isGenerating}
                        processingSection={processingSection}
                        previousContent={previousSections.cta}
                        onEnhance={(action) => enhanceSection('cta', action)}
                        onToneChange={(tone) => enhanceSection('cta', 'tone', { tone })}
                        onCustomPrompt={(prompt) => enhanceSection('cta', 'custom', { customPrompt: prompt })}
                        onUndo={() => handleUndo('cta')}
                      />
                    </div>
                    <Textarea
                      value={sections.cta}
                      onChange={(e) => setSections(prev => ({ ...prev, cta: e.target.value }))}
                      placeholder="What action should they take..."
                      className="min-h-[36px] bg-gray-800 text-sm py-2"
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-400 font-medium">Hashtags</Label>
                        {currentPlatform && (
                          <span className="text-[10px] text-gray-500">
                            {currentPlatform.hashtag_count_min}-{currentPlatform.hashtag_count_max}
                          </span>
                        )}
                      </div>
                      <SectionEnhancementTools
                        content={sections.hashtags}
                        sectionKey="hashtags"
                        sectionTitle="Hashtags"
                        isHashtags={true}
                        isReady={!isGenerating}
                        processingSection={processingSection}
                        previousContent={previousSections.hashtags}
                        onEnhance={(action) => enhanceSection('hashtags', action)}
                        onToneChange={() => {}}
                        onCustomPrompt={(prompt) => enhanceSection('hashtags', 'custom', { customPrompt: prompt })}
                        onUndo={() => handleUndo('hashtags')}
                      />
                    </div>
                    <Textarea
                      value={sections.hashtags}
                      onChange={(e) => setSections(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#hashtag1 #hashtag2"
                      className="min-h-[36px] bg-gray-800 text-sm py-2"
                    />
                  </div>
                </div>

                {/* Final Post - Separate Container */}
                <div className="p-3 bg-gray-800 border-2 border-orange-600/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-orange-400 font-medium">Final Post</Label>
                      {currentPlatform && (
                        <CharacterCount current={totalCharacters} limit={currentPlatform.total_character_limit} />
                      )}
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      disabled={!assembledContent.trim()}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-900/30"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-2 bg-gray-900 rounded min-h-[80px] whitespace-pre-wrap text-gray-200 text-sm">
                    {assembledContent || <span className="text-gray-600 italic">Generated content will appear here...</span>}
                  </div>

                </div>

                {/* Feedback Panel - Dedicated section below Final Post */}
                <FeedbackPanel
                  contentId={currentContentId}
                  sections={sections}
                  onFeedbackSubmit={() => {
                    setFeedbackSubmitted(true);
                    console.log('Feedback submitted for:', currentContentId);
                  }}
                  disabled={feedbackSubmitted || isGenerating}
                />
              </div>
            </div>
          </div>
        </div>

        <Footer />
        <Toaster />

        {/* Brand Element Cherry-Picker Modal */}
        <Dialog open={brandPickerOpen} onOpenChange={setBrandPickerOpen}>
          <DialogContent className="sm:max-w-[450px] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Brand Elements</DialogTitle>
              <DialogDescription className="text-gray-400">
                Select which brand data to include in generation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              {[
                { key: 'industry', label: 'Industry & Niche', value: brandContext?.industry_segment },
                { key: 'products', label: 'Products & Services', value: brandContext?.products_services },
                { key: 'voice', label: 'Voice & Tone', value: brandContext?.voice_tone },
                { key: 'audience', label: 'Target Audience', value: brandContext?.target_audience },
                { key: 'benefits', label: 'Key Benefits', value: brandContext?.priority_benefits?.join(', ') },
                { key: 'positiveExamples', label: 'Good Examples (few-shot)', value: brandContext?.positive_examples?.length ? `${brandContext.positive_examples.length} examples to emulate` : null },
                { key: 'negativeExamples', label: 'Bad Examples (avoid)', value: brandContext?.negative_examples?.length ? `${brandContext.negative_examples.length} examples to avoid` : null },
                { key: 'forbidden', label: 'Forbidden Phrases', value: brandContext?.forbidden_phrases?.length ? `${brandContext.forbidden_phrases.length} phrases` : null },
                { key: 'spelling', label: 'Spelling Preference', value: brandContext?.spelling },
              ].map(({ key, label, value }) => (
                <label
                  key={key}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    brandElements[key as keyof typeof brandElements] ? 'bg-gray-700' : 'bg-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={brandElements[key as keyof typeof brandElements]}
                      onChange={(e) => setBrandElements(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-gray-300 focus:ring-gray-500"
                    />
                    <div>
                      <div className="text-sm text-white">{label}</div>
                      {value && (
                        <div className="text-xs text-gray-500 truncate max-w-[250px]">{value}</div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-700">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBrandElements({
                    industry: true, products: true, voice: true, audience: true,
                    benefits: true, positiveExamples: false, negativeExamples: false, forbidden: false, spelling: true
                  })}
                  className="text-xs text-gray-400"
                >
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBrandElements({
                    industry: true, products: true, voice: true, audience: true,
                    benefits: true, positiveExamples: true, negativeExamples: true, forbidden: true, spelling: true
                  })}
                  className="text-xs text-gray-400"
                >
                  All
                </Button>
              </div>
              <Button onClick={() => setBrandPickerOpen(false)} size="sm">Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GradientBackground>
  );
}
