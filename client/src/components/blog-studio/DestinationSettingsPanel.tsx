/**
 * DestinationSettingsPanel - Collapsible settings for a single output destination.
 * Shows defaults, category mapping summary, and refresh controls.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, RefreshCw, Settings2, Image, Tag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DestinationConfig {
  siteUrl?: string;
  defaults?: {
    postStatus?: 'draft' | 'publish';
    imageHandling?: 'upload' | 'link-only' | 'skip';
  };
  categoryMapping?: Record<string, number>;
  tagMapping?: Record<string, number>;
  lastDiscoveredAt?: string;
}

interface Props {
  destinationId: string;
  config: DestinationConfig;
  onConfigUpdate: (newConfig: Partial<DestinationConfig>) => void;
  onEditMapping: () => void;
}

export function DestinationSettingsPanel({ destinationId, config, onConfigUpdate, onEditMapping }: Props) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const defaults = config.defaults || {};
  const mappingCount = Object.keys(config.categoryMapping || {}).length;

  const handleDefaultChange = async (field: string, value: string) => {
    const newDefaults = { ...defaults, [field]: value };
    try {
      await fetch(`/api/content-studio/destinations/${destinationId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaults: newDefaults }),
      });
      onConfigUpdate({ defaults: newDefaults });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save setting', variant: 'destructive' });
    }
  };

  const handleRefreshCategories = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/content-studio/destinations/${destinationId}/categories`);
      if (res.ok) {
        const data = await res.json();
        const count = data.categories?.length || 0;
        // Update lastDiscoveredAt
        await fetch(`/api/content-studio/destinations/${destinationId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastDiscoveredAt: new Date().toISOString() }),
        });
        toast({ title: `Discovered ${count} categories from WordPress` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to refresh categories', variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors ml-7"
      >
        <Settings2 className="w-3 h-3" />
        <span>Settings</span>
        <ChevronDown className="w-3 h-3" />
        {mappingCount > 0 && (
          <Badge className="bg-blue-500/20 text-blue-300 text-[10px] border-0 px-1.5 py-0 ml-1">
            {mappingCount} mapped
          </Badge>
        )}
      </button>
    );
  }

  return (
    <div className="ml-7 mt-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">Destination Settings</span>
        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>

      {/* Post Status Default */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">Default status</span>
        <Select
          value={defaults.postStatus || 'draft'}
          onValueChange={(v) => handleDefaultChange('postStatus', v)}
        >
          <SelectTrigger className="h-6 text-xs bg-slate-800 border-slate-600 text-white w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="publish">Publish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Handling */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Image className="w-3 h-3" /> Images
        </span>
        <Select
          value={defaults.imageHandling || 'upload'}
          onValueChange={(v) => handleDefaultChange('imageHandling', v)}
        >
          <SelectTrigger className="h-6 text-xs bg-slate-800 border-slate-600 text-white w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upload">Upload</SelectItem>
            <SelectItem value="link-only">Link only</SelectItem>
            <SelectItem value="skip">Skip</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Mapping */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Categories
        </span>
        <div className="flex items-center gap-1">
          <Badge className="bg-slate-700 text-slate-300 text-[10px] border-0">
            {mappingCount} mapped
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEditMapping}
            className="h-5 px-1.5 text-[10px] text-blue-400 hover:text-blue-300"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Refresh & Timestamps */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefreshCategories}
          disabled={isRefreshing}
          className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-slate-300"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh categories
        </Button>
        {config.lastDiscoveredAt && (
          <span className="text-[10px] text-slate-600">
            {new Date(config.lastDiscoveredAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
