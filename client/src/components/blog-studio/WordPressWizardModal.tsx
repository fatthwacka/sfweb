/**
 * WordPressWizardModal - Multi-step connection wizard for WordPress destinations.
 * Steps: Site URL → Credentials → Category Mapping → Defaults → Confirm
 */

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Globe, Eye, EyeOff, Loader2, CheckCircle, XCircle,
  ArrowRight, ArrowLeft, RefreshCw, Zap, Settings2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  clientId: string;
  /** If provided, editing an existing destination */
  existingDestination?: {
    id: string;
    display_name: string;
    config: Record<string, any>;
    is_active: boolean;
    has_credentials: boolean;
  } | null;
  /** Start at a specific step (for editing) */
  initialStep?: number;
}

interface RemoteCategory {
  id: number | string;
  name: string;
  slug: string;
  count?: number;
}

interface LocalCategory {
  id: string;
  name: string;
  slug: string;
}

const STEPS = ['Site URL', 'Credentials', 'Categories', 'Defaults', 'Confirm'];

export function WordPressWizardModal({
  open, onClose, onComplete, clientId, existingDestination, initialStep = 0,
}: WizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Site URL
  const [siteUrl, setSiteUrl] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Step 2: Credentials
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; username?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // The destination ID (set after creation or from editing)
  const [destinationId, setDestinationId] = useState<string | null>(null);

  // Step 3: Category Mapping
  const [wpCategories, setWpCategories] = useState<RemoteCategory[]>([]);
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [categoryMapping, setCategoryMapping] = useState<Record<string, number>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Step 4: Defaults
  const [defaultPostStatus, setDefaultPostStatus] = useState<'draft' | 'publish'>('draft');
  const [imageHandling, setImageHandling] = useState<'upload' | 'link-only' | 'skip'>('upload');

  // Step 5: Activate
  const [isActive, setIsActive] = useState(false);

  // Pre-populate when editing
  useEffect(() => {
    if (existingDestination) {
      setDestinationId(existingDestination.id);
      setDisplayName(existingDestination.display_name);
      setSiteUrl(existingDestination.config?.siteUrl || '');
      setCategoryMapping(existingDestination.config?.categoryMapping || {});
      setDefaultPostStatus(existingDestination.config?.defaults?.postStatus || 'draft');
      setImageHandling(existingDestination.config?.defaults?.imageHandling || 'upload');
      setIsActive(existingDestination.is_active);
    }
  }, [existingDestination]);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setTestResult(null);
      if (!existingDestination) {
        setSiteUrl('');
        setDisplayName('');
        setUsername('');
        setAppPassword('');
        setDestinationId(null);
        setCategoryMapping({});
        setDefaultPostStatus('draft');
        setImageHandling('upload');
        setIsActive(false);
      }
    }
  }, [open]);

  // ==========================================================================
  // STEP 2: Save & Test
  // ==========================================================================

  const handleSaveAndTest = async () => {
    if (!siteUrl || !username || !appPassword) {
      toast({ title: 'Error', description: 'Please fill in all credential fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setTestResult(null);

    try {
      let destId = destinationId;

      if (!destId) {
        // Create new destination
        const createRes = await fetch('/api/content-studio/destinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            destination_type: 'wordpress',
            display_name: displayName || `WordPress: ${siteUrl}`,
            config: { siteUrl },
            credentials: { username, appPassword },
            is_active: false,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          toast({ title: 'Error', description: err.message || 'Failed to save destination', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }

        const created = await createRes.json();
        destId = created.id;
        setDestinationId(destId);
      } else {
        // Update existing credentials
        await fetch(`/api/content-studio/destinations/${destId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: displayName || `WordPress: ${siteUrl}`,
            config: { siteUrl },
            credentials: { username, appPassword },
          }),
        });
      }

      // Now test
      setIsTesting(true);
      const testRes = await fetch(`/api/content-studio/destinations/${destId}/test`, { method: 'POST' });
      const testData = await testRes.json();
      setTestResult({
        success: testData.success,
        message: testData.message,
        username: testData.username,
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsSubmitting(false);
      setIsTesting(false);
    }
  };

  // ==========================================================================
  // STEP 3: Category Discovery
  // ==========================================================================

  const fetchCategories = async () => {
    if (!destinationId) return;
    setIsLoadingCategories(true);
    try {
      const [wpRes, localRes] = await Promise.all([
        fetch(`/api/content-studio/destinations/${destinationId}/categories`),
        fetch('/api/blog/categories'),
      ]);

      if (wpRes.ok) {
        const wpData = await wpRes.json();
        setWpCategories(wpData.categories || []);
      }
      if (localRes.ok) {
        const localData = await localRes.json();
        const list = localData.categories || localData || [];
        setLocalCategories(Array.isArray(list) ? list : []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleAutoMap = () => {
    const newMapping: Record<string, number> = {};
    for (const local of localCategories) {
      const match = wpCategories.find(
        wp => wp.slug === local.slug || wp.name.toLowerCase() === local.name.toLowerCase()
      );
      if (match) {
        newMapping[local.slug] = Number(match.id);
      }
    }
    setCategoryMapping(newMapping);
    toast({ title: `Auto-mapped ${Object.keys(newMapping).length} categories` });
  };

  // ==========================================================================
  // STEP 4: Save Config
  // ==========================================================================

  const saveConfig = async () => {
    if (!destinationId) return;
    try {
      await fetch(`/api/content-studio/destinations/${destinationId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryMapping,
          defaults: { postStatus: defaultPostStatus, imageHandling },
          lastDiscoveredAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // ==========================================================================
  // STEP 5: Activate & Complete
  // ==========================================================================

  const handleComplete = async () => {
    if (!destinationId) return;
    setIsSubmitting(true);
    try {
      // Save config
      await saveConfig();

      // Toggle active
      await fetch(`/api/content-studio/destinations/${destinationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      toast({ title: 'WordPress destination configured' });
      onComplete();
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to complete setup', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load categories when entering step 3
  useEffect(() => {
    if (step === 2 && destinationId) {
      fetchCategories();
    }
  }, [step, destinationId]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return siteUrl.length > 0;
      case 1: return !!testResult?.success;
      case 2: return true; // mapping is optional
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const next = async () => {
    if (step === 3) {
      await saveConfig();
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-lg">📘</span>
            {existingDestination ? 'Edit WordPress Connection' : 'Add WordPress Site'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {/* Step 1: Site URL */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">WordPress Site URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">The full URL of the WordPress site (must use HTTPS)</p>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Display Name (optional)</Label>
                <Input
                  placeholder={`WordPress: ${siteUrl || 'example.com'}`}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400">
                  <Globe className="w-3 h-3 inline mr-1" />
                  You'll need a WordPress user with <strong>Editor</strong> role (or higher) and an
                  Application Password. Generate one in WordPress under Users → Profile → Application Passwords.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Credentials */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">WordPress Username</Label>
                <Input
                  placeholder="api-user"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setTestResult(null); }}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Application Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    value={appPassword}
                    onChange={(e) => { setAppPassword(e.target.value); setTestResult(null); }}
                    className="bg-slate-800 border-slate-600 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Application Passwords contain spaces — this is normal</p>
              </div>

              <Button
                onClick={handleSaveAndTest}
                disabled={isSubmitting || isTesting || !username || !appPassword}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting || isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {destinationId ? 'Update & Test Connection' : 'Save & Test Connection'}
              </Button>

              {testResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm ${testResult.success ? 'text-green-300' : 'text-red-300'}`}>
                      {testResult.message}
                    </p>
                    {testResult.username && (
                      <p className="text-xs text-slate-400 mt-0.5">Authenticated as: {testResult.username}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Category Mapping */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">Map local categories to WordPress categories</p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAutoMap}
                    disabled={isLoadingCategories || localCategories.length === 0}
                    className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Zap className="w-3 h-3 mr-1" /> Auto-map
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchCategories}
                    disabled={isLoadingCategories}
                    className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCategories ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {isLoadingCategories ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : localCategories.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No local blog categories found. You can skip this step.
                </p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {localCategories.map((local) => (
                    <div key={local.id} className="flex items-center gap-2 bg-slate-800/50 rounded p-2">
                      <span className="text-xs text-slate-300 w-28 truncate shrink-0" title={local.name}>
                        {local.name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                      <Select
                        value={categoryMapping[local.slug] ? String(categoryMapping[local.slug]) : 'unmapped'}
                        onValueChange={(val) => {
                          setCategoryMapping(prev => {
                            if (val === 'unmapped') {
                              const { [local.slug]: _, ...rest } = prev;
                              return rest;
                            }
                            return { ...prev, [local.slug]: Number(val) };
                          });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unmapped">— Create new on WP —</SelectItem>
                          {wpCategories.map((wp) => (
                            <SelectItem key={String(wp.id)} value={String(wp.id)}>
                              {wp.name} {wp.count !== undefined ? `(${wp.count})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500">
                Unmapped categories will be auto-created on WordPress when publishing.
              </p>
            </div>
          )}

          {/* Step 4: Defaults */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Default Post Status</Label>
                <Select value={defaultPostStatus} onValueChange={(v) => setDefaultPostStatus(v as any)}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft — save for review on WordPress</SelectItem>
                    <SelectItem value="publish">Publish — go live immediately</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Applied when a post's status is ambiguous. Posts explicitly set to "published" in Blog Studio always publish.
                </p>
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Featured Image Handling</Label>
                <Select value={imageHandling} onValueChange={(v) => setImageHandling(v as any)}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Upload to WordPress Media Library</SelectItem>
                    <SelectItem value="link-only">Link only (external URL in content)</SelectItem>
                    <SelectItem value="skip">Skip — don't set featured image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400">
                  <Settings2 className="w-3 h-3 inline mr-1" />
                  Category mappings: <strong>{Object.keys(categoryMapping).length}</strong> mapped.
                  These settings can be changed later from the destination settings panel.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Site</span>
                  <span className="text-white">{siteUrl}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Name</span>
                  <span className="text-white">{displayName || `WordPress: ${siteUrl}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Connection</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Categories Mapped</span>
                  <span className="text-white">{Object.keys(categoryMapping).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Default Status</span>
                  <span className="text-white capitalize">{defaultPostStatus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Image Handling</span>
                  <span className="text-white capitalize">{imageHandling.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div>
                  <p className="text-sm text-white font-medium">Activate Destination</p>
                  <p className="text-xs text-slate-400">Posts will be published here when active</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={step === 0 ? onClose : prev}
            className="text-slate-400 hover:text-white"
          >
            {step === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-1" /> Back</>}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Complete Setup
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
