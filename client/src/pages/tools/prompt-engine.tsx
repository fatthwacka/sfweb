/**
 * Prompt Engine - Standalone brand-aware prompt enhancement tool
 * Reusable across all content generation tools
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Loader2, Copy, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';

interface ContentType {
  value: string;
  label: string;
  description: string;
  word_limit?: number;
  character_limit?: number;
  supportsBrand: string[];
}

export default function PromptEngine() {
  const [, navigate] = useLocation();
  
  // Core prompt state
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [contentType, setContentType] = useState('image');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  
  // Brand Intelligence state (copied from AI Image Generator)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandToggles, setBrandToggles] = useState<Set<string>>(new Set(['industry', 'visual']));
  const [brandClients, setBrandClients] = useState([]);
  const [brandProfile, setBrandProfile] = useState(null);
  
  // Results state
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [brandInfluence, setBrandInfluence] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState(0);

  // Load content types and brand clients on mount
  useEffect(() => {
    const loadContentTypes = async () => {
      try {
        const response = await fetch('/api/prompt-engine/content-types');
        if (response.ok) {
          const data = await response.json();
          setContentTypes(data.contentTypes || []);
          // Set first content type as default if available
          if (data.contentTypes?.length > 0) {
            setContentType(data.contentTypes[0].value);
          }
        }
      } catch (error) {
        console.error('Error loading content types:', error);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    const loadBrandClients = async () => {
      try {
        const response = await fetch('/api/content-management/brand-intelligence/clients');
        if (response.ok) {
          const data = await response.json();
          setBrandClients(data.data?.clients || []);
        }
      } catch (error) {
        console.error('Error loading brand clients:', error);
      }
    };

    loadContentTypes();
    loadBrandClients();
  }, []);

  // Load brand profile when client changes
  useEffect(() => {
    if (!selectedBrand) {
      setBrandProfile(null);
      return;
    }

    const loadBrandProfile = async () => {
      try {
        const response = await fetch(`/api/content-management/brand-intelligence/clients/${selectedBrand}`);
        if (response.ok) {
          const data = await response.json();
          setBrandProfile(data);
        }
      } catch (error) {
        console.error('Error loading brand profile:', error);
        setBrandProfile(null);
      }
    };

    loadBrandProfile();
  }, [selectedBrand]);

  // Main prompt enhancement function
  const enhancePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt to enhance.',
        variant: 'destructive',
      });
      return;
    }

    setIsEnhancing(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/prompt-engine/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          contentType,
          brandContext: selectedBrand ? {
            clientId: selectedBrand,
            enabledFeatures: Array.from(brandToggles)
          } : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const data = await response.json();
      
      setEnhancedPrompt(data.enhancedPrompt || originalPrompt);
      setAlternatives(data.alternatives || []);
      setBrandInfluence(data.brandInfluence || null);
      setProcessingTime(Date.now() - startTime);

      toast({
        title: 'Prompt Enhanced',
        description: 'Your prompt has been optimized with AI and brand intelligence.',
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Prompt copied to clipboard.',
    });
  };

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Page Header */}
          <div className="mb-8">
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
              <h1 className="text-4xl font-bold text-salmon mb-4">Prompt Engine</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                AI-powered prompt enhancement with brand intelligence integration
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Panel - Input */}
              <div className="space-y-6">
                <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <h2 className="text-xl font-semibold text-salmon">Input</h2>
                  
                  {/* Original Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-white">Original Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={originalPrompt}
                      onChange={(e) => setOriginalPrompt(e.target.value)}
                      placeholder="Enter your prompt to enhance..."
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* Content Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">Content Type</Label>
                    {isLoadingTypes ? (
                      <div className="flex items-center justify-center p-3 bg-gray-800 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan" />
                        <span className="ml-2 text-sm text-gray-400">Loading content types...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {contentTypes.map((type) => (
                          <label
                            key={type.value}
                            className={`radio-btn-base cursor-pointer ${
                              contentType === type.value
                                ? 'radio-btn-brand-selected'
                                : 'radio-btn-unselected'
                            }`}
                          >
                            <input
                              type="radio"
                              name="content-type"
                              value={type.value}
                              checked={contentType === type.value}
                              onChange={(e) => setContentType(e.target.value)}
                              className="sr-only"
                            />
                            <div className="space-y-1">
                              <div className="radio-btn-text">{type.label}</div>
                              <div className="radio-btn-desc">
                                {type.description}
                                {(type.word_limit || type.character_limit) && (
                                  <span className="ml-2 text-cyan font-medium">
                                    {type.word_limit && `${type.word_limit}w`}
                                    {type.word_limit && type.character_limit && ' / '}
                                    {type.character_limit && `${type.character_limit}c`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enhance Button */}
                  <Button
                    onClick={enhancePrompt}
                    disabled={isEnhancing || !originalPrompt.trim()}
                    className="w-full btn-cyan"
                    size="lg"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Enhance Prompt
                      </>
                    )}
                  </Button>
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

                  {/* Brand Feature Toggles */}
                  {selectedBrand && (
                    <div className="space-y-3">
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
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Output */}
              <div className="space-y-6">
                <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-salmon">Enhanced Output</h2>
                    {processingTime > 0 && (
                      <span className="text-xs text-gray-400">{processingTime}ms</span>
                    )}
                  </div>
                  
                  {/* Enhanced Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Enhanced Prompt</Label>
                      {enhancedPrompt && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(enhancedPrompt)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={enhancePrompt}
                            disabled={isEnhancing}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            title="Re-enhance prompt"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Textarea
                      value={enhancedPrompt}
                      readOnly
                      className="min-h-[200px] max-h-[600px] bg-gray-800 text-gray-100 resize-none overflow-y-auto"
                      placeholder="Enhanced prompt will appear here..."
                      style={{
                        height: enhancedPrompt 
                          ? `${Math.min(Math.max(enhancedPrompt.split('\n').length * 24 + 40, 200), 600)}px`
                          : '200px'
                      }}
                    />
                  </div>

                  {/* Brand Influence Report */}
                  {brandInfluence && (
                    <div className="space-y-3 p-4 bg-gray-800 rounded border">
                      <p className="text-sm font-medium text-cyan">Brand Influence Applied</p>
                      <div className="grid gap-2 text-xs" style={{ gridTemplateColumns: 'max-content 1fr' }}>
                        {brandInfluence.appliedBusiness && (
                          <>
                            <div className="text-gray-400 font-medium">Business:</div>
                            <div className="text-gray-200">{brandInfluence.appliedBusiness}</div>
                          </>
                        )}
                        {brandInfluence.appliedIndustry && (
                          <>
                            <div className="text-gray-400 font-medium">Industry:</div>
                            <div className="text-gray-200">{brandInfluence.appliedIndustry}</div>
                          </>
                        )}
                        {brandInfluence.appliedVisual && (
                          <>
                            <div className="text-gray-400 font-medium">Visual:</div>
                            <div className="text-gray-200">{brandInfluence.appliedVisual}</div>
                          </>
                        )}
                        {brandInfluence.appliedVoice && (
                          <>
                            <div className="text-gray-400 font-medium">Voice:</div>
                            <div className="text-gray-200">{brandInfluence.appliedVoice}</div>
                          </>
                        )}
                        {brandInfluence.appliedAudience && (
                          <>
                            <div className="text-gray-400 font-medium">Audience:</div>
                            <div className="text-gray-200">{brandInfluence.appliedAudience}</div>
                          </>
                        )}
                        {brandInfluence.appliedBenefits && (
                          <>
                            <div className="text-gray-400 font-medium">Benefits:</div>
                            <div className="text-gray-200">{brandInfluence.appliedBenefits}</div>
                          </>
                        )}
                        {brandInfluence.appliedGuidelines && (
                          <>
                            <div className="text-gray-400 font-medium">Guidelines:</div>
                            <div className="text-gray-200">{brandInfluence.appliedGuidelines}</div>
                          </>
                        )}
                        {brandInfluence.appliedCompliance && (
                          <>
                            <div className="text-gray-400 font-medium">Compliance:</div>
                            <div className="text-gray-200">{brandInfluence.appliedCompliance}</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {alternatives.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white">Alternative Prompts</Label>
                      <div className="space-y-2">
                        {alternatives.map((alt, index) => (
                          <div key={index} className="relative">
                            <Textarea
                              value={alt}
                              readOnly
                              className="min-h-[100px] max-h-[400px] bg-gray-800 text-gray-100 text-sm resize-none overflow-y-auto"
                              style={{
                                height: alt 
                                  ? `${Math.min(Math.max(alt.split('\n').length * 20 + 30, 100), 400)}px`
                                  : '100px'
                              }}
                            />
                            <Button
                              onClick={() => copyToClipboard(alt)}
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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