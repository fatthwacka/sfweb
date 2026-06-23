/**
 * Blog Content Studio - Multi-client blog pipeline with AI writing and multi-platform publishing
 * Tabbed interface: Input Sources | Blog Editor | Output Destinations
 */

import { ArrowLeft, Edit3, Sparkles, Settings2, Database } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/common/gradient-background';
import { BlogStudioProvider, useBlogStudio } from '@/components/blog-studio/BlogStudioProvider';
import { BlogStudioEditor } from '@/components/blog-studio/BlogStudioEditor';
import { InputSourcesPanel } from '@/components/blog-studio/InputSourcesPanel';
import { OutputDestinationsPanel } from '@/components/blog-studio/OutputDestinationsPanel';
import { PipelineSettingsPanel } from '@/components/blog-studio/PipelineSettingsPanel';
import '@/styles/blog-studio.css';

import type { StudioTab } from '@/components/blog-studio/BlogStudioProvider';

// ============================================================================
// INNER LAYOUT (needs context)
// ============================================================================

function BlogContentStudioLayout() {
  const [, navigate] = useLocation();
  const {
    clientId,
    activeTab,
    setActiveTab,
    triggerAIGeneration,
    setTriggerAIGeneration,
  } = useBlogStudio();

  const tabs: { key: StudioTab; label: string; icon: typeof Edit3 }[] = [
    {
      key: 'inputs',
      label: 'Configure Input',
      icon: Settings2,
    },
    {
      key: 'editor',
      label: 'Editor',
      icon: Edit3,
    },
    {
      key: 'outputs',
      label: 'Configure Output',
      icon: Database,
    },
  ];

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />

        <div className="container mx-auto px-4 pt-28 pb-8">
          {/* Top Row - Centred: Back + Title */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tools')}
              className="bg-white/10 text-white/80 font-light hover:bg-white/20 hover:text-white border border-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tools
            </Button>
            <h1 className="text-2xl font-bold text-white">Blog Content Studio</h1>
          </div>

          {/* Unified Task Bar */}
          <div className="blog-studio-taskbar">
            {/* Tab buttons */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`blog-studio-tab ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-slate-500/40 hidden sm:block" />

            {/* Generate with AI button */}
            <Button
              onClick={() => {
                if (activeTab !== 'editor') setActiveTab('editor');
                setTriggerAIGeneration(true);
              }}
              className="blog-studio-ai-btn shrink-0"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-yellow-400 animate-pulse" />
              <span className="hidden sm:inline">Generate with AI</span>
              <span className="sm:hidden">AI</span>
            </Button>
          </div>

          {/* Tab Content */}
          <div className="blog-studio-content">
            {activeTab === 'inputs' && (
              <div className="blog-studio-tab-panel space-y-4">
                <PipelineSettingsPanel />
                <InputSourcesPanel />
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="blog-studio-tab-panel">
                <BlogStudioEditor clientId={clientId} />
              </div>
            )}

            {activeTab === 'outputs' && (
              <div className="blog-studio-tab-panel">
                <OutputDestinationsPanel />
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </GradientBackground>
  );
}

// ============================================================================
// PAGE EXPORT (wraps with provider)
// ============================================================================

export default function BlogContentStudio() {
  return (
    <BlogStudioProvider>
      <BlogContentStudioLayout />
    </BlogStudioProvider>
  );
}
