/**
 * Enhanced Web Page Content Creator Modal
 * Improved form with advanced scraping options and image controls
 */

import React, { useState } from 'react';
import { X, Globe, Loader2, ExternalLink, ChevronDown, ChevronUp, Image, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

interface ScrapingOptions {
  includeMetaData: boolean;
  extractHeadings: boolean;
  maxContentLength: number;
  imageQualityThreshold: 'low' | 'medium' | 'high';
  enableJavaScript: boolean;
  includeSchemaData: boolean;
}

interface WebPageContentRequest {
  url: string;
  useSiteImages: boolean;
  spellingPreference: 'british' | 'american';
  scrapingOptions: ScrapingOptions;
}

interface EnhancedWebPageContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: WebPageContentRequest) => void;
  isLoading?: boolean;
  progressStage?: string;
}

const DEFAULT_SCRAPING_OPTIONS: ScrapingOptions = {
  includeMetaData: true,
  extractHeadings: true,
  maxContentLength: 10000,
  imageQualityThreshold: 'medium',
  enableJavaScript: false,
  includeSchemaData: true,
};

export function EnhancedWebPageContentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  progressStage = ''
}: EnhancedWebPageContentModalProps) {
  const [url, setUrl] = useState('');
  const [useSiteImages, setUseSiteImages] = useState(true);
  const [spellingPreference, setSpellingPreference] = useState<'british' | 'american'>('british');
  const [scrapingOptions, setScrapingOptions] = useState<ScrapingOptions>(DEFAULT_SCRAPING_OPTIONS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Validate URL as user types
  const handleUrlChange = (value: string) => {
    setUrl(value);
    
    try {
      new URL(value);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(value.length === 0);
    }
  };

  // Update scraping options
  const updateScrapingOption = <K extends keyof ScrapingOptions>(
    key: K,
    value: ScrapingOptions[K]
  ) => {
    setScrapingOptions(prev => ({ ...prev, [key]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !isValidUrl) return;
    
    onSubmit({
      url: url.trim(),
      useSiteImages,
      spellingPreference,
      scrapingOptions
    });
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setUrl('');
      setUseSiteImages(true);
      setSpellingPreference('british');
      setScrapingOptions(DEFAULT_SCRAPING_OPTIONS);
      setShowAdvanced(false);
      setIsValidUrl(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              <Globe className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                LinkedIn Post Creator
              </h3>
              <p className="text-sm text-slate-400">
                Transform any webpage into professional LinkedIn articles
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="webpage-url" className="text-white font-medium">
              Webpage URL
            </Label>
            <div className="relative">
              <Input
                id="webpage-url"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isLoading}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 pr-10"
                required
              />
              {url && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidUrl ? (
                    <ExternalLink className="h-4 w-4 text-green-400" />
                  ) : (
                    <X className="h-4 w-4 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Image Options */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Image Handling</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="use-site-images"
                checked={useSiteImages}
                onCheckedChange={(checked) => setUseSiteImages(!!checked)}
                disabled={isLoading}
              />
              <Label 
                htmlFor="use-site-images" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300 cursor-pointer"
              >
                Use images from the website
              </Label>
            </div>
            
            {!useSiteImages && (
              <p className="text-xs text-slate-400 ml-6">
                Will use high-quality stock images from Unsplash instead
              </p>
            )}
            
            {useSiteImages && (
              <p className="text-xs text-slate-400 ml-6">
                Will analyse site images for quality and fallback to Unsplash if needed
              </p>
            )}
          </div>

          {/* Spelling Preference */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Spelling Preference</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="british-spelling"
                  name="spelling"
                  checked={spellingPreference === 'british'}
                  onChange={() => setSpellingPreference('british')}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500"
                />
                <Label 
                  htmlFor="british-spelling" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300 cursor-pointer"
                >
                  British English (colour, honour, realise)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="american-spelling"
                  name="spelling"
                  checked={spellingPreference === 'american'}
                  onChange={() => setSpellingPreference('american')}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500"
                />
                <Label 
                  htmlFor="american-spelling" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300 cursor-pointer"
                >
                  American English (color, honor, realize)
                </Label>
              </div>
            </div>
            
            <p className="text-xs text-slate-400">
              Content will be generated using {spellingPreference === 'british' ? 'British' : 'American'} spelling conventions
            </p>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 w-full justify-between p-3 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Scraping Options
                </div>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              {/* Content Options */}
              <div className="space-y-3">
                <Label className="text-white text-sm font-medium">Content Extraction</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-metadata"
                    checked={scrapingOptions.includeMetaData}
                    onCheckedChange={(checked) => updateScrapingOption('includeMetaData', !!checked)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="include-metadata" className="text-xs text-slate-300 cursor-pointer">
                    Extract meta data and SEO information
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="extract-headings"
                    checked={scrapingOptions.extractHeadings}
                    onCheckedChange={(checked) => updateScrapingOption('extractHeadings', !!checked)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="extract-headings" className="text-xs text-slate-300 cursor-pointer">
                    Extract and analyse heading structure
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-schema"
                    checked={scrapingOptions.includeSchemaData}
                    onCheckedChange={(checked) => updateScrapingOption('includeSchemaData', !!checked)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="include-schema" className="text-xs text-slate-300 cursor-pointer">
                    Include structured data (Schema.org)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="enable-javascript"
                    checked={scrapingOptions.enableJavaScript}
                    onCheckedChange={(checked) => updateScrapingOption('enableJavaScript', !!checked)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="enable-javascript" className="text-xs text-slate-300 cursor-pointer">
                    Enable JavaScript rendering (slower but more complete)
                  </Label>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Content Limits */}
              <div className="space-y-3">
                <Label className="text-white text-sm font-medium">Content Limits</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="max-content" className="text-xs text-slate-300">
                    Maximum content length: {scrapingOptions.maxContentLength.toLocaleString()} characters
                  </Label>
                  <input
                    id="max-content"
                    type="range"
                    min={5000}
                    max={25000}
                    step={1000}
                    value={scrapingOptions.maxContentLength}
                    onChange={(e) => updateScrapingOption('maxContentLength', parseInt(e.target.value))}
                    disabled={isLoading}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>5K</span>
                    <span>15K</span>
                    <span>25K</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Image Quality */}
              <div className="space-y-3">
                <Label className="text-white text-sm font-medium">Image Quality Threshold</Label>
                
                <Select 
                  value={scrapingOptions.imageQualityThreshold} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => updateScrapingOption('imageQualityThreshold', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="low" className="text-slate-300">Low - Accept smaller images (300x300+)</SelectItem>
                    <SelectItem value="medium" className="text-slate-300">Medium - Standard quality (600x600+)</SelectItem>
                    <SelectItem value="high" className="text-slate-300">High - Premium quality (1200x1200+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!url.trim() || !isValidUrl || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold h-12 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Articles...
              </>
            ) : (
              <>
                <Image className="h-4 w-4 mr-2" />
                Create Professional Content
              </>
            )}
          </Button>
        </form>

      </div>
    </div>
  );
}