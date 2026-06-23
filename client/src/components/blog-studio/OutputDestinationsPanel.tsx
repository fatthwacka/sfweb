/**
 * OutputDestinationsPanel - Manages publishing targets per client.
 * Built-in Supabase/Static HTML + external WordPress (and future CMS connectors).
 * Uses WordPressWizardModal for setup and DestinationSettingsPanel for inline config.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Send, Loader2, CheckCircle, XCircle,
  Plus, Trash2, Edit, Settings2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBlogStudio } from './BlogStudioProvider';
import { WordPressWizardModal } from './WordPressWizardModal';
import { DestinationSettingsPanel } from './DestinationSettingsPanel';

interface OutputDestination {
  id: string;
  client_id: string;
  destination_type: string;
  display_name: string;
  config: Record<string, any>;
  is_active: boolean;
  has_credentials: boolean;
  last_published_at: string | null;
}

interface DestinationType {
  value: string;
  label: string;
  icon: string;
  available: boolean;
  description: string;
}

const DESTINATION_TYPES: DestinationType[] = [
  { value: 'supabase_static', label: 'Supabase + Static HTML', icon: '🗃️', available: true, description: 'Internal database with SEO-optimised static files' },
  { value: 'wordpress', label: 'WordPress', icon: '📘', available: true, description: 'Publish via WP REST API with Application Passwords' },
  { value: 'webflow', label: 'Webflow', icon: '🌊', available: false, description: 'Push to Webflow CMS collections' },
  { value: 'wix', label: 'Wix', icon: '🔷', available: false, description: 'Publish to Wix Blog' },
  { value: 'shopify', label: 'Shopify Blog', icon: '🛍️', available: false, description: 'Push to Shopify blog articles' },
  { value: 'ghost', label: 'Ghost', icon: '👻', available: false, description: 'Publish via Ghost Admin API' },
  { value: 'medium', label: 'Medium', icon: '📰', available: false, description: 'Cross-post to Medium' },
];

export function OutputDestinationsPanel() {
  const { toast } = useToast();
  const { clientId, setPipelineState, pipelineState } = useBlogStudio();
  const [destinations, setDestinations] = useState<OutputDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Testing
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<OutputDestination | null>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState(0);

  // Fetch destinations when client changes
  useEffect(() => {
    if (!clientId) {
      setDestinations([]);
      return;
    }
    fetchDestinations();
  }, [clientId]);

  // Update pipeline state
  useEffect(() => {
    const externalActive = destinations.filter(d => d.is_active).length;
    setPipelineState({
      ...pipelineState,
      outputDestinationsCount: destinations.length + 1,
      activeOutputDestinations: externalActive + 1,
    });
  }, [destinations]);

  const fetchDestinations = async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/content-studio/destinations/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setDestinations(data.destinations || []);
      }
    } catch (error) {
      console.error('Failed to fetch destinations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (destinationId: string) => {
    setTestingId(destinationId);
    setTestResult(null);
    try {
      const response = await fetch(`/api/content-studio/destinations/${destinationId}/test`, { method: 'POST' });
      const data = await response.json();
      setTestResult({ id: destinationId, success: data.success, message: data.message });
    } catch (error) {
      setTestResult({ id: destinationId, success: false, message: 'Connection test failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (destinationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/content-studio/destinations/${destinationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (response.ok) {
        setDestinations(prev => prev.map(d => d.id === destinationId ? { ...d, is_active: isActive } : d));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update destination', variant: 'destructive' });
    }
  };

  const handleDeleteDestination = async (destinationId: string) => {
    try {
      const response = await fetch(`/api/content-studio/destinations/${destinationId}`, { method: 'DELETE' });
      if (response.ok) {
        setDestinations(prev => prev.filter(d => d.id !== destinationId));
        toast({ title: 'Destination removed' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove destination', variant: 'destructive' });
    }
  };

  const openWizardForNew = () => {
    setEditingDestination(null);
    setWizardInitialStep(0);
    setWizardOpen(true);
  };

  const openWizardForEdit = (dest: OutputDestination, step = 1) => {
    setEditingDestination(dest);
    setWizardInitialStep(step);
    setWizardOpen(true);
  };

  const handleConfigUpdate = (destId: string, newConfig: Partial<Record<string, any>>) => {
    setDestinations(prev => prev.map(d =>
      d.id === destId ? { ...d, config: { ...d.config, ...newConfig } } : d
    ));
  };

  // Connection health indicator
  const getHealthDot = (dest: OutputDestination) => {
    if (!dest.has_credentials) return 'bg-amber-400';
    if (testResult?.id === dest.id) {
      return testResult.success ? 'bg-green-400' : 'bg-red-400';
    }
    return dest.has_credentials ? 'bg-green-400/60' : 'bg-slate-500';
  };

  if (!clientId) {
    return (
      <Card className="admin-gradient-card h-full">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Send className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Select a client to configure output destinations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="admin-gradient-card h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Send className="w-4 h-4" />
            Output Destinations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Built-in: Supabase + Static HTML (always on) */}
          <div className="blog-studio-destination-card built-in">
            <div className="flex items-center gap-2">
              <span className="text-base">🗃️</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-white">Supabase + Static HTML</span>
                <p className="text-xs text-muted-foreground">Internal database with SEO files</p>
              </div>
              <Badge className="bg-green-500/20 text-green-300 text-xs border-0">Always On</Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* External Destinations */}
              {destinations.map((dest) => (
                <div key={dest.id} className="blog-studio-destination-card">
                  <div className="flex items-center gap-2 mb-1.5">
                    {/* Health indicator */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getHealthDot(dest)}`} />
                    <span className="text-base">
                      {DESTINATION_TYPES.find(t => t.value === dest.destination_type)?.icon || '🔗'}
                    </span>
                    <span className="text-sm font-medium text-white flex-1 truncate">{dest.display_name}</span>
                    <Switch
                      checked={dest.is_active}
                      onCheckedChange={(checked) => handleToggleActive(dest.id, checked)}
                      className="scale-75"
                    />
                  </div>

                  {dest.config?.siteUrl && (
                    <p className="text-xs text-muted-foreground truncate ml-7 mb-1.5">{dest.config.siteUrl}</p>
                  )}

                  <div className="flex items-center gap-1.5 ml-7">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(dest.id)}
                      disabled={testingId === dest.id}
                      className="h-6 text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {testingId === dest.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openWizardForEdit(dest, 1)}
                      className="h-6 text-xs text-gray-400 hover:text-blue-400"
                      title="Edit credentials"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDestination(dest.id)}
                      className="h-6 text-xs text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {testResult?.id === dest.id && (
                      <span className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {testResult.message}
                      </span>
                    )}
                  </div>

                  {dest.last_published_at && (
                    <p className="text-xs text-muted-foreground ml-7 mt-1">
                      Last published: {new Date(dest.last_published_at).toLocaleDateString()}
                    </p>
                  )}

                  {/* Inline settings panel */}
                  <DestinationSettingsPanel
                    destinationId={dest.id}
                    config={dest.config || {}}
                    onConfigUpdate={(newConfig) => handleConfigUpdate(dest.id, newConfig)}
                    onEditMapping={() => openWizardForEdit(dest, 2)}
                  />
                </div>
              ))}
            </>
          )}

          {/* Add WordPress button → opens wizard */}
          <Button
            size="sm"
            variant="outline"
            onClick={openWizardForNew}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add WordPress Site
          </Button>

          {/* Coming Soon CMS Connectors */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Coming Soon</p>
            <div className="space-y-1.5">
              {DESTINATION_TYPES.filter(d => !d.available).map((dest) => (
                <div key={dest.value} className="flex items-center gap-2 opacity-40">
                  <span className="text-sm">{dest.icon}</span>
                  <span className="text-xs text-gray-400">{dest.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WordPress Wizard Modal */}
      <WordPressWizardModal
        open={wizardOpen}
        onClose={() => { setWizardOpen(false); setEditingDestination(null); }}
        onComplete={fetchDestinations}
        clientId={clientId}
        existingDestination={editingDestination}
        initialStep={wizardInitialStep}
      />
    </>
  );
}
