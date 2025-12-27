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

import {
  TOOLS_REGISTRY,
  getToolPath,
} from '@shared/config/tools-registry';
import {
  ToolDefinition,
  AccessModalType,
} from '@shared/types/tools';

export default function ToolsHub() {
  const [, setLocation] = useLocation();
  const { canAccessTool, getAccessModal, userTier } = useToolAccess();

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
      // Handle web page content creator specifically
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
      
      // Progress stage cycling
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
      let stageIndex = 0;
      setProgressStage(stages[0]);
      setProgressPercentage(Math.round((stageIndex + 1) / totalStages * 100));
      
      // Cycle through stages every 2-4 seconds
      const progressInterval = setInterval(() => {
        stageIndex = (stageIndex + 1) % stages.length;
        setProgressStage(stages[stageIndex]);
        setProgressPercentage(Math.round((stageIndex + 1) / totalStages * 100));
      }, Math.random() * 2000 + 2000); // 2-4 second intervals

      // Call enhanced native API
      const response = await fetch('/api/content/web-page-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create content');
      }

      const result = await response.json();
      console.log('Enhanced content creation completed:', result);
      
      // Extract client name for filtering
      if (result.data.articlesForAirtable && result.data.articlesForAirtable.length > 0) {
        const clientName = result.data.articlesForAirtable[0]['Client'] || '';
        setCreatedContentClient(clientName);
      }
      
      // Update progress for database upload phase
      clearInterval(progressInterval);
      setProgressStage('💾 Saving articles to content database...');
      setProgressPercentage(95);
      
      // Save articles to Airtable using client-side approach (like Article Editor)
      if (result.data.articlesForAirtable && result.data.articlesForAirtable.length > 0) {
        try {
          // Get Airtable config (using same endpoint as Article Editor)
          const configResponse = await fetch('/api/airtable/config', {
            headers: {
              'Authorization': 'Bearer staff-token' // Same as Article Editor
            }
          });
          
          if (!configResponse.ok) {
            throw new Error('Could not get Airtable configuration');
          }
          
          const config = await configResponse.json();
          console.log(`📝 Uploading ${result.data.articlesForAirtable.length} articles to Airtable...`);
          
          // Upload each article to Airtable
          let uploadedCount = 0;
          for (const article of result.data.articlesForAirtable) {
            try {
              const airtableResponse = await fetch(`https://api.airtable.com/v0/${config.airtable.baseId}/${config.airtable.tableId}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${config.airtable.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  fields: article
                })
              });

              if (airtableResponse.ok) {
                uploadedCount++;
                setProgressStage(`💾 Saved ${uploadedCount}/${result.data.articlesForAirtable.length} articles...`);
              } else {
                console.error('Failed to upload article:', await airtableResponse.text());
              }
            } catch (articleError: any) {
              console.error('Error uploading individual article:', articleError);
            }
          }
          
          console.log(`✅ Successfully uploaded ${uploadedCount}/${result.data.articlesForAirtable.length} articles to database`);
          setProgressStage(`✅ Content creation and database upload completed! (${uploadedCount} articles saved)`);
          setProgressPercentage(100);
          
        } catch (databaseError: any) {
          console.error('Database upload failed:', databaseError);
          setProgressStage('✅ Content creation completed (database upload failed)');
          setProgressPercentage(100);
        }
      } else {
        setProgressStage('✅ Content creation completed successfully!');
        setProgressPercentage(100);
      }
      
      setIsCompleted(true);
      
      // Auto-hide success modal after 5 seconds (longer to read the result)
      setTimeout(() => {
        setIsWorkflowRunning(false);
        setIsProgressModalOpen(false);
        setIsCompleted(false);
        setProgressStage('');
      }, 5000);
      
    } catch (error) {
      console.error('Error creating enhanced content:', error);
      if (typeof progressInterval !== 'undefined') {
        clearInterval(progressInterval);
      }
      setProgressStage('❌ Content creation failed');
      setHasError(true);
      setProgressPercentage(0);
      
      // No auto-dismiss - user manually closes
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
                    isLoading={isWorkflowRunning && tool.slug === 'web-page-content-creator'}
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
        onClose={() => setIsWebPageModalOpen(false)}
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
          
          // Navigate to Article Editor with client AND source title filters
          const params = new URLSearchParams();
          if (createdContentClient) {
            params.append('client', createdContentClient);
          }
          if (createdContentSourceTitle) {
            params.append('source', createdContentSourceTitle);
          }
          const queryString = params.toString();
          const url = `/tools/article-editor${queryString ? '?' + queryString : ''}`;
          window.open(url, '_blank');
        }}
      />

      <Footer />
    </div>
  );
}
