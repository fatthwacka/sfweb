/**
 * PipelineSettingsPanel - Per-client pipeline configuration.
 * Controls research schedule, production mode, and quality gates.
 * Settings persist to content_clients.pipeline_config jsonb.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings2, ChevronDown, ChevronUp, Clock, Zap, Shield,
  Loader2, Save, RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBlogStudio } from './BlogStudioProvider';
import type { PipelineConfig } from '../../../../shared/schema';

const DEFAULT_CONFIG: PipelineConfig = {
  research: {
    frequency: 'daily',
    maxItemsPerRun: 20,
    topicCooldownDays: 30,
    topicCooldownPosts: 5,
  },
  production: {
    mode: 'manual',
    articlesPerRun: 1,
    autoPublishStatus: 'draft',
    minSourcesRequired: 3,
    skipIfInsufficient: true,
  },
  quality: {
    minRelevanceScore: 0.6,
    requireHumanReview: true,
    notifyOnDraft: true,
  },
};

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Every hour' },
  { value: '4h', label: 'Every 4 hours' },
  { value: '8h', label: 'Every 8 hours' },
  { value: 'daily', label: 'Once daily' },
  { value: 'weekly', label: 'Once weekly' },
];

const ACTIVE_HOURS_OPTIONS = [
  { value: 'all', label: 'All day (24h)' },
  { value: '8-17', label: '8am – 5pm' },
  { value: '6-22', label: '6am – 10pm' },
  { value: '9-18', label: '9am – 6pm' },
];

const ACTIVE_DAYS_OPTIONS = [
  { value: 'all', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays only' },
  { value: 'weekends', label: 'Weekends only' },
];

export function PipelineSettingsPanel() {
  const { toast } = useToast();
  const { clientId } = useBlogStudio();
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Active hours/days as simple string values for the dropdowns
  const [activeHoursValue, setActiveHoursValue] = useState('all');
  const [activeDaysValue, setActiveDaysValue] = useState('all');

  // Load config when client changes
  useEffect(() => {
    if (!clientId) return;
    loadConfig();
  }, [clientId]);

  const loadConfig = async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/content-studio/pipeline-config/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({ ...DEFAULT_CONFIG, ...data.config });
          // Derive active hours/days from config
          const hours = data.config.research?.activeHours;
          if (hours) {
            setActiveHoursValue(`${hours.start}-${hours.end}`);
          } else {
            setActiveHoursValue('all');
          }
          const days = data.config.research?.activeDays;
          if (days && days.length === 5) {
            setActiveDaysValue('weekdays');
          } else if (days && days.length === 2) {
            setActiveDaysValue('weekends');
          } else {
            setActiveDaysValue('all');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load pipeline config:', error);
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  };

  const saveConfig = async () => {
    if (!clientId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content-studio/pipeline-config/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        toast({ title: 'Pipeline settings saved' });
        setIsDirty(false);
      } else {
        toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateResearch = useCallback((field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      research: { ...prev.research, [field]: value },
    }));
    setIsDirty(true);
  }, []);

  const updateProduction = useCallback((field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      production: { ...prev.production, [field]: value },
    }));
    setIsDirty(true);
  }, []);

  const updateQuality = useCallback((field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      quality: { ...prev.quality, [field]: value },
    }));
    setIsDirty(true);
  }, []);

  const handleActiveHoursChange = (value: string) => {
    setActiveHoursValue(value);
    if (value === 'all') {
      updateResearch('activeHours', undefined);
    } else {
      const [start, end] = value.split('-').map(Number);
      updateResearch('activeHours', { start, end });
    }
  };

  const handleActiveDaysChange = (value: string) => {
    setActiveDaysValue(value);
    if (value === 'all') {
      updateResearch('activeDays', undefined);
    } else if (value === 'weekdays') {
      updateResearch('activeDays', [1, 2, 3, 4, 5]);
    } else if (value === 'weekends') {
      updateResearch('activeDays', [0, 6]);
    }
  };

  if (!clientId) return null;

  const showScheduleDetails = config.research.frequency !== 'daily' && config.research.frequency !== 'weekly';

  return (
    <Card className="admin-gradient-card">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Pipeline Settings
          {isDirty && (
            <Badge className="bg-amber-500/20 text-amber-300 text-[10px] border-0 px-1.5">
              Unsaved
            </Badge>
          )}
          <span className="flex-1" />
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* ── RESEARCH SCHEDULE ── */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-300">
                  <Clock className="w-3.5 h-3.5" />
                  Research Schedule
                </div>

                <div className="space-y-2 pl-5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Frequency</Label>
                    <Select
                      value={config.research.frequency}
                      onValueChange={(v) => updateResearch('frequency', v)}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {showScheduleDetails && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-slate-400">Active hours</Label>
                        <Select value={activeHoursValue} onValueChange={handleActiveHoursChange}>
                          <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVE_HOURS_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-slate-400">Active days</Label>
                        <Select value={activeDaysValue} onValueChange={handleActiveDaysChange}>
                          <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVE_DAYS_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Max articles/run</Label>
                    <Select
                      value={String(config.research.maxItemsPerRun)}
                      onValueChange={(v) => updateResearch('maxItemsPerRun', Number(v))}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 30, 50].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Topic cooldown (days)</Label>
                    <Select
                      value={String(config.research.topicCooldownDays)}
                      onValueChange={(v) => updateResearch('topicCooldownDays', Number(v))}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[7, 14, 21, 30, 60, 90].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} days</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Topic cooldown (posts)</Label>
                    <Select
                      value={String(config.research.topicCooldownPosts)}
                      onValueChange={(v) => updateResearch('topicCooldownPosts', Number(v))}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 8, 10, 15, 20].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} posts</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── PRODUCTION MODE ── */}
              <div className="space-y-2.5 border-t border-slate-700/50 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-orange-300">
                  <Zap className="w-3.5 h-3.5" />
                  Production Mode
                </div>

                <div className="space-y-2 pl-5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Mode</Label>
                    <Select
                      value={config.production.mode}
                      onValueChange={(v) => updateProduction('mode', v)}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="autopilot">Auto-pilot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.production.mode !== 'manual' && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-slate-400">Produce article</Label>
                        <Select
                          value={config.production.schedule || 'weekly-mon'}
                          onValueChange={(v) => updateProduction('schedule', v)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily-9">Daily at 9am</SelectItem>
                            <SelectItem value="weekly-mon">Weekly (Monday)</SelectItem>
                            <SelectItem value="weekly-wed">Weekly (Wednesday)</SelectItem>
                            <SelectItem value="weekly-fri">Weekly (Friday)</SelectItem>
                            <SelectItem value="fortnightly">Fortnightly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-slate-400">Articles per run</Label>
                        <Select
                          value={String(config.production.articlesPerRun)}
                          onValueChange={(v) => updateProduction('articlesPerRun', Number(v))}
                        >
                          <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 5].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-slate-400">Min sources required</Label>
                        <Select
                          value={String(config.production.minSourcesRequired)}
                          onValueChange={(v) => updateProduction('minSourcesRequired', Number(v))}
                        >
                          <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 5, 8, 10].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {config.production.mode === 'autopilot' && (
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-slate-400">Auto-publish as</Label>
                      <Select
                        value={config.production.autoPublishStatus}
                        onValueChange={(v) => updateProduction('autoPublishStatus', v)}
                      >
                        <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft (review first)</SelectItem>
                          <SelectItem value="published">Published (go live)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {config.production.mode !== 'manual' && (
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-slate-400">Skip if insufficient</Label>
                      <Switch
                        checked={config.production.skipIfInsufficient}
                        onCheckedChange={(v) => updateProduction('skipIfInsufficient', v)}
                        className="scale-75"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── QUALITY GATES ── */}
              <div className="space-y-2.5 border-t border-slate-700/50 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-300">
                  <Shield className="w-3.5 h-3.5" />
                  Quality Gates
                </div>

                <div className="space-y-2 pl-5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Min relevance score</Label>
                    <Select
                      value={String(config.quality.minRelevanceScore)}
                      onValueChange={(v) => updateQuality('minRelevanceScore', Number(v))}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(n => (
                          <SelectItem key={n} value={String(n)}>{(n * 100).toFixed(0)}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Require human review</Label>
                    <Switch
                      checked={config.quality.requireHumanReview}
                      onCheckedChange={(v) => updateQuality('requireHumanReview', v)}
                      className="scale-75"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Notify on new draft</Label>
                    <Switch
                      checked={config.quality.notifyOnDraft}
                      onCheckedChange={(v) => updateQuality('notifyOnDraft', v)}
                      className="scale-75"
                    />
                  </div>
                </div>
              </div>

              {/* ── SAVE / RESET ── */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                <Button
                  size="sm"
                  onClick={saveConfig}
                  disabled={!isDirty || isSaving}
                  className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                  Save Settings
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadConfig}
                  disabled={!isDirty}
                  className="h-7 text-xs text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
