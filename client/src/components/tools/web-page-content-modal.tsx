/**
 * Web Page Content Creator Modal
 * Styled popup form for n8n workflow integration
 */

import React, { useState } from 'react';
import { X, Globe, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WebPageContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export function WebPageContentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: WebPageContentModalProps) {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Validate URL as user types
  const handleUrlChange = (value: string) => {
    setUrl(value);
    
    // Basic URL validation
    try {
      new URL(value);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(value.length === 0); // Allow empty for reset
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !isValidUrl) return;
    
    onSubmit(url.trim());
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setUrl('');
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
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
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
                Transform any webpage into engaging LinkedIn posts
              </p>
            </div>
          </div>
          
          {/* Close button (disabled while loading) */}
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
            <p className="text-xs text-slate-400">
              Enter the full URL of the webpage you want to analyze and transform
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!url.trim() || !isValidUrl || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold h-12 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Create Content
              </>
            )}
          </Button>
        </form>

        {/* Loading state indicator */}
        {isLoading && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span>AI is analyzing the webpage and creating structured content...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}