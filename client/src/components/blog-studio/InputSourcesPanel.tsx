/**
 * InputSourcesPanel - Manages configured input sources per client.
 * Supports RSS, Google News, Manual URLs with type-specific config forms.
 * Each source has active toggle, frequency picker, and keyword filters.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Database, Plus, Trash2, Rss, Globe, Search, Link2,
  Loader2, X, ChevronDown, ChevronUp, Play, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBlogStudio } from './BlogStudioProvider';

interface InputSource {
  id: string;
  client_id: string;
  source_type: string;
  display_name: string;
  config: Record<string, any>;
  cron_schedule: string | null;
  fetch_interval_minutes: number | null;
  is_active: boolean;
  last_fetched_at: string | null;
  error_count: number;
  last_error: string | null;
}

interface PipelineRun {
  id: string;
  run_type: string;
  started_at: string;
  completed_at: string | null;
  items_discovered: number;
  items_screened_out: number;
  items_approved: number;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
}

const SOURCE_TYPES = [
  { value: 'rss', label: 'RSS Feed', icon: Rss, colour: 'text-orange-400', description: 'Subscribe to any RSS or Atom feed' },
  { value: 'google_news', label: 'Google News', icon: Search, colour: 'text-blue-400', description: 'Search Google News for industry topics' },
  { value: 'manual_url', label: 'Manual URLs', icon: Link2, colour: 'text-green-400', description: 'Add specific article URLs to process' },
  { value: 'competitor_blog', label: 'Competitor Blog', icon: Globe, colour: 'text-purple-400', description: 'Monitor a competitor\'s blog feed' },
];

const INTERVAL_OPTIONS = [
  { value: '60', label: 'Every hour' },
  { value: '240', label: 'Every 4 hours' },
  { value: '480', label: 'Every 8 hours' },
  { value: '1440', label: 'Daily' },
  { value: '10080', label: 'Weekly' },
];

export function InputSourcesPanel() {
  const { toast } = useToast();
  const { clientId, setPipelineState, pipelineState } = useBlogStudio();
  const [sources, setSources] = useState<InputSource[]>([]);
  const [recentRuns, setRecentRuns] = useState<PipelineRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [showRuns, setShowRuns] = useState(false);

  // New source form state
  const [newType, setNewType] = useState('rss');
  const [newName, setNewName] = useState('');
  const [newConfig, setNewConfig] = useState<Record<string, any>>({});
  const [newInterval, setNewInterval] = useState('1440');

  // Fetch sources when client changes
  useEffect(() => {
    if (!clientId) {
      setSources([]);
      setRecentRuns([]);
      return;
    }
    fetchSources();
    fetchRecentRuns();
  }, [clientId]);

  // Update pipeline state when sources change
  useEffect(() => {
    setPipelineState({
      ...pipelineState,
      inputSourcesCount: sources.length,
      activeInputSources: sources.filter(s => s.is_active).length,
    });
  }, [sources]);

  const fetchSources = async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/content-studio/sources/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to fetch input sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentRuns = async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/content-studio/pipeline-runs/${clientId}?limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRecentRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline runs:', error);
    }
  };

  const handleAddSource = async () => {
    if (!clientId || !newName.trim()) return;

    // Validate type-specific required fields
    if (newType === 'rss' && !newConfig.url) {
      toast({ title: 'Error', description: 'RSS feed URL is required', variant: 'destructive' });
      return;
    }
    if (newType === 'google_news' && !newConfig.query) {
      toast({ title: 'Error', description: 'Search query is required', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch('/api/content-studio/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          source_type: newType,
          display_name: newName,
          config: newConfig,
          fetch_interval_minutes: Number(newInterval),
          is_active: false,
        }),
      });

      if (response.ok) {
        toast({ title: 'Source added', description: `${newName} has been configured` });
        setShowAddForm(false);
        resetNewForm();
        fetchSources();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add source', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (sourceId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/content-studio/sources/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (res.ok) {
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, is_active: isActive } : s));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update source', variant: 'destructive' });
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/content-studio/sources/${sourceId}`, { method: 'DELETE' });
      if (response.ok) {
        setSources(prev => prev.filter(s => s.id !== sourceId));
        toast({ title: 'Source removed' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove source', variant: 'destructive' });
    }
  };

  const resetNewForm = () => {
    setNewType('rss');
    setNewName('');
    setNewConfig({});
    setNewInterval('1440');
  };

  const getSourceIcon = (type: string) => {
    const sourceType = SOURCE_TYPES.find(s => s.value === type);
    if (!sourceType) return <Database className="w-4 h-4" />;
    const Icon = sourceType.icon;
    return <Icon className={`w-4 h-4 ${sourceType.colour}`} />;
  };

  const getIntervalLabel = (minutes: number | null) => {
    if (!minutes) return 'Daily';
    const opt = INTERVAL_OPTIONS.find(o => o.value === String(minutes));
    return opt?.label || `${minutes}m`;
  };

  const formatRunTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  if (!clientId) {
    return (
      <Card className="admin-gradient-card">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Database className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Select a client to configure input sources</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="admin-gradient-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Database className="w-4 h-4" />
          Input Sources
          {sources.length > 0 && (
            <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] border-0 px-1.5">
              {sources.filter(s => s.is_active).length}/{sources.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Source Cards */}
            {sources.map((source) => (
              <div key={source.id} className="blog-studio-source-card">
                <div className="flex items-center gap-2">
                  {getSourceIcon(source.source_type)}
                  <span className="text-sm font-medium text-white flex-1 truncate">{source.display_name}</span>
                  <Switch
                    checked={source.is_active}
                    onCheckedChange={(checked) => handleToggleActive(source.id, checked)}
                    className="scale-75"
                  />
                </div>

                {/* Source URL / Query preview */}
                {source.config?.url && (
                  <p className="text-xs text-muted-foreground truncate ml-6 mt-0.5">{source.config.url}</p>
                )}
                {source.config?.query && (
                  <p className="text-xs text-muted-foreground truncate ml-6 mt-0.5">Query: {source.config.query}</p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-2 ml-6 mt-1.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-500">{getIntervalLabel(source.fetch_interval_minutes)}</span>
                  {source.last_fetched_at && (
                    <span className="text-[10px] text-slate-600">· Last: {formatRunTime(source.last_fetched_at)}</span>
                  )}
                  {source.error_count > 0 && (
                    <Badge className="bg-red-500/20 text-red-300 text-[10px] border-0 px-1">{source.error_count} errors</Badge>
                  )}
                  <span className="flex-1" />
                  <button
                    onClick={() => setExpandedSourceId(expandedSourceId === source.id ? null : source.id)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    {expandedSourceId === source.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Expanded details */}
                {expandedSourceId === source.id && (
                  <div className="mt-2 ml-6 p-2 rounded bg-slate-800/40 border border-slate-700/50 space-y-1.5">
                    {source.config?.filterKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-500">Include:</span>
                        {source.config.filterKeywords.map((kw: string, i: number) => (
                          <Badge key={i} className="bg-green-500/20 text-green-300 text-[10px] border-0 px-1">{kw}</Badge>
                        ))}
                      </div>
                    )}
                    {source.config?.excludeKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-500">Exclude:</span>
                        {source.config.excludeKeywords.map((kw: string, i: number) => (
                          <Badge key={i} className="bg-red-500/20 text-red-300 text-[10px] border-0 px-1">{kw}</Badge>
                        ))}
                      </div>
                    )}
                    {source.last_error && (
                      <p className="text-[10px] text-red-400">Last error: {source.last_error}</p>
                    )}
                    <p className="text-[10px] text-slate-600">
                      Type: {SOURCE_TYPES.find(t => t.value === source.source_type)?.label || source.source_type}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Add Source Button */}
            {!showAddForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Source
              </Button>
            )}
          </>
        )}

        {/* ── ADD SOURCE FORM ── */}
        {showAddForm && (
          <div className="blog-studio-add-form">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white">New Input Source</span>
              <button onClick={() => { setShowAddForm(false); resetNewForm(); }} className="text-gray-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {/* Source Type */}
              <Select value={newType} onValueChange={(v) => { setNewType(v); setNewConfig({}); }}>
                <SelectTrigger className="h-7 text-xs !bg-white/5 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-1.5">{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-[10px] text-slate-500">
                {SOURCE_TYPES.find(t => t.value === newType)?.description}
              </p>

              {/* Display Name */}
              <Input
                placeholder="Source name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
              />

              {/* Type-specific config fields */}
              {newType === 'rss' && (
                <>
                  <Input
                    placeholder="RSS feed URL"
                    value={newConfig.url || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, url: e.target.value }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Filter keywords (comma separated, optional)"
                    value={(newConfig.filterKeywords || []).join(', ')}
                    onChange={(e) => setNewConfig(prev => ({
                      ...prev,
                      filterKeywords: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                    }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Exclude keywords (comma separated, optional)"
                    value={(newConfig.excludeKeywords || []).join(', ')}
                    onChange={(e) => setNewConfig(prev => ({
                      ...prev,
                      excludeKeywords: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                    }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                </>
              )}

              {newType === 'google_news' && (
                <>
                  <Input
                    placeholder="Search query (e.g. 'CCTV security trends')"
                    value={newConfig.query || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, query: e.target.value }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={newConfig.language || 'en'}
                      onValueChange={(v) => setNewConfig(prev => ({ ...prev, language: v }))}
                    >
                      <SelectTrigger className="h-7 text-xs !bg-white/5 border-gray-600 text-white flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="af">Afrikaans</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newConfig.region || 'ZA'}
                      onValueChange={(v) => setNewConfig(prev => ({ ...prev, region: v }))}
                    >
                      <SelectTrigger className="h-7 text-xs !bg-white/5 border-gray-600 text-white flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZA">South Africa</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Exclude domains (comma separated, optional)"
                    value={(newConfig.excludeDomains || []).join(', ')}
                    onChange={(e) => setNewConfig(prev => ({
                      ...prev,
                      excludeDomains: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                    }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                </>
              )}

              {newType === 'manual_url' && (
                <textarea
                  placeholder="Paste article URLs (one per line)"
                  value={(newConfig.urls || []).join('\n')}
                  onChange={(e) => setNewConfig(prev => ({
                    ...prev,
                    urls: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean),
                  }))}
                  className="w-full h-20 text-xs bg-white/5 border border-gray-600 rounded-md text-white p-2 resize-none"
                />
              )}

              {newType === 'competitor_blog' && (
                <>
                  <Input
                    placeholder="Competitor blog URL"
                    value={newConfig.url || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, url: e.target.value }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Max articles to fetch (default 10)"
                    type="number"
                    value={newConfig.maxItems || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, maxItems: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-7 text-xs !bg-white/5 border-gray-600 text-white"
                  />
                </>
              )}

              {/* Fetch interval (not for manual URLs) */}
              {newType !== 'manual_url' && (
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-slate-400 shrink-0">Check every</Label>
                  <Select value={newInterval} onValueChange={setNewInterval}>
                    <SelectTrigger className="h-7 text-xs !bg-white/5 border-gray-600 text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                size="sm"
                onClick={handleAddSource}
                disabled={!newName.trim()}
                className="w-full h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Add Source
              </Button>
            </div>
          </div>
        )}

        {/* ── RECENT PIPELINE RUNS ── */}
        {recentRuns.length > 0 && (
          <div className="border-t border-slate-700/50 pt-3">
            <button
              onClick={() => setShowRuns(!showRuns)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
            >
              <Play className="w-3 h-3" />
              <span>Recent Runs ({recentRuns.length})</span>
              {showRuns ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>

            {showRuns && (
              <div className="mt-2 space-y-1.5">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      run.status === 'completed' ? 'bg-green-400' :
                      run.status === 'no_fresh_content' ? 'bg-amber-400' :
                      run.status === 'error' ? 'bg-red-400' :
                      'bg-blue-400 animate-pulse'
                    }`} />
                    <span className="truncate flex-1">
                      {run.run_type === 'research' ? 'Research' : 'Production'}
                      {run.status === 'completed' && ` · ${run.items_discovered} found, ${run.items_approved} approved`}
                      {run.status === 'no_fresh_content' && ' · No fresh topics'}
                      {run.status === 'error' && ` · ${run.error_message?.substring(0, 40)}`}
                    </span>
                    <span className="shrink-0">{formatRunTime(run.started_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
