/**
 * Tools Hub - Landing Page
 * Central hub for all mini tools and utilities
 * Compact layout with unified grid
 */

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Wrench, Search } from 'lucide-react';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToolCard } from '@/components/tools/tool-card';
import { AccessModal } from '@/components/tools/access-modal';
import { EnhancedWebPageContentModal } from '@/components/tools/web-page-content-enhanced-modal';
import { ProgressModal } from '@/components/tools/progress-modal';
import { useToolAccess } from '@/hooks/use-tool-access';
import { useToast } from '@/hooks/use-toast';

import {
  TOOLS_REGISTRY,
  getToolPath,
} from '@shared/config/tools-registry.tsx';
import {
  ToolDefinition,
  AccessModalType,
} from '@shared/types/tools';

export default function ToolsHub() {
  const [, setLocation] = useLocation();
  const { canAccessTool, getAccessModal, userTier } = useToolAccess();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<AccessModalType | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [isWebPageModalOpen, setIsWebPageModalOpen] = useState(false);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [createdContentClient, setCreatedContentClient] = useState<string>('');
  const [createdContentSourceTitle, setCreatedContentSourceTitle] = useState<string>('');
  const [activeContentTool, setActiveContentTool] = useState<ToolDefinition | null>(null);
  

  // Filter tools based on search
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS_REGISTRY;

    const query = searchQuery.toLowerCase();
    return TOOLS_REGISTRY.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle tool card click
  const handleToolClick = (tool: ToolDefinition) => {
    const modalType = getAccessModal(tool);

    if (modalType) {
      setSelectedTool(tool);
      setActiveModal(modalType);
    } else if (tool.customAction === 'n8n-workflow') {
      // Handle Gemini post creator
      setActiveContentTool(tool);
      setIsWebPageModalOpen(true);
    } else if (tool.customAction === 'n8n-webhook') {
      // Handle ChatGPT post creator via n8n webhook
      setActiveContentTool(tool);
      setIsWebPageModalOpen(true);
    } else if (tool.customAction === 'full-page') {
      // Open in new tab for full-page tools
      window.open(getToolPath(tool), '_blank');
    } else {
      setLocation(getToolPath(tool));
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setActiveModal(null);
    setSelectedTool(null);
  };


  // Handle enhanced web page content submission
  const handleWebPageContentSubmit = async (request: { url: string; useSiteImages: boolean; scrapingOptions: any }) => {
    try {
      setIsWorkflowRunning(true);
      setIsWebPageModalOpen(false);
      setIsProgressModalOpen(true);
      setIsCompleted(false);
      setHasError(false);
      setProgressPercentage(0);
      setCreatedContentClient('');

      const isN8nWebhook = activeContentTool?.customAction === 'n8n-webhook';
      
      if (isN8nWebhook) {
        // ChatGPT via n8n webhook - Simple 30-second simulation
        setProgressStage('🚀 Triggering ChatGPT workflow via n8n...');
        
        const stages = [
          '🌐 Connecting to webpage...',
          '🔍 Scraping and analyzing content...',
          '📝 Extracting key information...',
          '🎯 Identifying engagement opportunities...',
          '🖼️ Processing images and visuals...',
          '🤖 AI crafting compelling headlines...',
          '✨ Generating punchy content...',
          '🔥 Adding viral hooks...',
          '📊 Optimizing for maximum impact...',
          '🎨 Selecting perfect images...',
          '💾 Saving to content database...',
          '🚀 Finalizing viral articles...'
        ];
        
        const totalDuration = 30000; // 30 seconds
        const stageDuration = totalDuration / stages.length;
        
        let stageIndex = 0;
        setProgressStage(stages[0]);
        setProgressPercentage(0); // Ensure we start at 0%
        
        // Make webhook call and start timer
        const startTime = Date.now();
        
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / totalDuration) * 100, 100);
          setProgressPercentage(Math.round(progress));
          
          const currentStage = Math.min(Math.floor(elapsed / stageDuration), stages.length - 1);
          if (currentStage !== stageIndex && currentStage < stages.length) {
            stageIndex = currentStage;
            setProgressStage(stages[stageIndex]);
          }
        }, 100);
        const response = await fetch('/api/content/n8n-webhook-creator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer staff-token'
          },
          body: JSON.stringify({ url: request.url }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to trigger n8n webhook');
        }

        const result = await response.json();
        console.log('n8n webhook completed:', result);
        
        // Ensure we run for at least 30 seconds
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalDuration - elapsed);
        
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
        
        clearInterval(progressInterval);
        setProgressStage('✅ ChatGPT content creation completed!');
        setProgressPercentage(100);
        
        // Set the created content info
        setCreatedContentClient('ChatGPT via n8n');
        setCreatedContentSourceTitle(`Content from: ${request.url}`);
        
      } else {
        // Gemini tool - Complex native processing (keep existing logic)
        const stages = [
          '🌐 Connecting to webpage...',
          '🔍 Scraping and analyzing content...',
          '📝 Extracting key information...',
          '🎯 Identifying engagement opportunities...',
          '🖼️ Processing images and visuals...',
          '🤖 AI crafting compelling headlines...',
          '✨ Generating punchy content...',
          '🔥 Adding viral hooks...',
          '📊 Optimizing for maximum impact...',
          '🎨 Selecting perfect images...',
          '💾 Saving to content database...',
          '🚀 Finalizing viral articles...'
        ];
        
        const totalStages = stages.length;
        const stageDuration = 2500;
        const totalDuration = totalStages * stageDuration;
        
        let stageIndex = 0;
        setProgressStage(stages[0]);
        
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / totalDuration) * 100, 100);
          setProgressPercentage(Math.round(progress));
          
          const currentStage = Math.min(Math.floor(elapsed / stageDuration), stages.length - 1);
          if (currentStage !== stageIndex && currentStage < stages.length) {
            stageIndex = currentStage;
            setProgressStage(stages[stageIndex]);
          }
        }, 50);

        const response = await fetch('/api/content/web-page-creator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer staff-token'
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to create content');
        }

        const result = await response.json();
        console.log('Gemini content creation completed:', result);
        
        // Extract client name and source title
        if (result.data.articlesForAirtable && result.data.articlesForAirtable.length > 0) {
          const clientName = result.data.articlesForAirtable[0]['Client'] || '';
          const sourceTitle = result.data.articlesForAirtable[0]['Source Title'] || result.metadata.sourceTitle || '';
          setCreatedContentClient(clientName);
          setCreatedContentSourceTitle(sourceTitle);
        }
        
        // Database upload phase (existing Airtable logic)
        clearInterval(progressInterval);
        setProgressStage('💾 Saving articles to content database...');
        setProgressPercentage(95);
        
        if (result.data.articlesForAirtable && result.data.articlesForAirtable.length > 0) {
          try {
            const configResponse = await fetch('/api/airtable/config', {
              headers: { 'Authorization': 'Bearer staff-token' }
            });
            
            if (configResponse.ok) {
              const config = await configResponse.json();
              console.log(`📝 Uploading ${result.data.articlesForAirtable.length} articles to Airtable...`);
              
              let uploadedCount = 0;
              for (const article of result.data.articlesForAirtable) {
                try {
                  const airtableResponse = await fetch(`https://api.airtable.com/v0/${config.airtable.baseId}/${config.airtable.tableId}`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${config.airtable.token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fields: article })
                  });

                  if (airtableResponse.ok) {
                    uploadedCount++;
                    setProgressStage(`💾 Saved ${uploadedCount}/${result.data.articlesForAirtable.length} articles...`);
                  }
                } catch (articleError) {
                  console.error('Error uploading article:', articleError);
                }
              }
              
              setProgressStage(`✅ Content creation completed! (${uploadedCount} articles saved)`);
            } else {
              setProgressStage('✅ Content creation completed (database upload failed)');
            }
          } catch (databaseError) {
            console.error('Database upload failed:', databaseError);
            setProgressStage('✅ Content creation completed (database upload failed)');
          }
        } else {
          setProgressStage('✅ Content creation completed successfully!');
        }
        
        setProgressPercentage(100);
      }
      
      setIsCompleted(true);
      
    } catch (error) {
      console.error('Error creating content:', error);
      setProgressStage('❌ Content creation failed');
      setHasError(true);
      setProgressPercentage(0);
    }
  };

  // Count accessible tools
  const accessibleCount = TOOLS_REGISTRY.filter((t) => canAccessTool(t) && !t.comingSoon).length;
  const totalCount = TOOLS_REGISTRY.filter((t) => !t.comingSoon).length;

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Main Content - No separate hero section */}
      <div
        className="pt-20 pb-16 min-h-screen"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' }}
      >
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-28">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-white text-4xl lg:text-5xl mb-4">
              Tools & Utilities
            </h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Badge variant="outline" className="font-normal text-sm border-white/30 text-gray-400">
                {accessibleCount}/{totalCount} available
              </Badge>
              <Badge variant="outline" className="font-normal text-sm capitalize border-white/30 text-gray-400">
                {userTier}
              </Badge>
            </div>
            {/* Search */}
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11"
              />
            </div>
          </div>

          {/* Unified Tools Grid - Full width */}
          <div>
            {filteredTools.length > 0 ? (
              <div className="tools-grid">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    onClick={() => handleToolClick(tool)}
                    isLoading={isWorkflowRunning && (tool.slug === 'web-page-content-creator' || tool.slug === 'n8n-content-creator')}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No tools found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-salmon hover:text-salmon/80 transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="max-w-3xl mx-auto mt-16">
            <div className="bg-black/40 border border-white/20 rounded-2xl p-8 text-center">
              <h3 className="text-2xl text-white mb-3">
                Need a <span className="text-salmon">Custom Tool?</span>
              </h3>
              <p className="text-muted-foreground mb-6">
                We build bespoke business tools and automations tailored to your workflow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/contact"
                  className="bg-salmon hover:bg-salmon/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Get in Touch
                </a>
                <a
                  href="/web-apps"
                  className="bg-transparent hover:bg-white/10 text-white border border-white/30 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Our Web Apps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Modal */}
      <AccessModal
        modalType={activeModal}
        onClose={handleModalClose}
      />

      {/* Enhanced Web Page Content Creator Modal */}
      <EnhancedWebPageContentModal
        isOpen={isWebPageModalOpen}
        onClose={() => {
          setIsWebPageModalOpen(false);
          setActiveContentTool(null);
        }}
        onSubmit={handleWebPageContentSubmit}
        isLoading={isWorkflowRunning}
        progressStage={progressStage}
      />

      {/* Progress Modal */}
      <ProgressModal
        isOpen={isProgressModalOpen}
        progressStage={progressStage}
        progressPercentage={progressPercentage}
        isCompleted={isCompleted}
        hasError={hasError}
        clientName={createdContentClient}
        sourceTitle={createdContentSourceTitle}
        onClose={() => {
          // Manual close handler
          setIsProgressModalOpen(false);
          setIsWorkflowRunning(false);
          setIsCompleted(false);
          setHasError(false);
          setProgressStage('');
          setProgressPercentage(0);
          setCreatedContentClient('');
          setCreatedContentSourceTitle('');
          setActiveContentTool(null);
        }}
        onViewContent={() => {
          // Close the progress modal first
          setIsProgressModalOpen(false);
          setIsWorkflowRunning(false);
          setIsCompleted(false);
          setProgressStage('');
          setProgressPercentage(0);
          setCreatedContentClient('');
          setCreatedContentSourceTitle('');
          setActiveContentTool(null);
          
          // Navigate to Article Editor sorted by recent (most recent content will be the n8n workflow output)
          const url = `/tools/article-editor?sort=recent`;
          window.open(url, '_blank');
        }}
      />


      <Footer />
    </div>
  );
}
