import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientPicker } from "@/components/ui/gradient-picker";

const storiesSections = [
  {
    key: 'stories-content',
    name: 'Main Content',
    description: 'Hero, search, cards grid, and story detail pages'
  },
  {
    key: 'stories-cta',
    name: 'Call to Action',
    description: 'Bottom CTA section with links'
  }
];

export function StoriesSettings() {
  const [activeTab, setActiveTab] = useState('sections');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-900/30 to-amber-800/20 border border-orange-700/30 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Stories Color Management</h2>
          <p className="text-slate-300 text-sm">
            Manage gradient colors and visual styling for the Stories blog pages.
            Control background gradients and text colors for the listing and detail pages.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-600 mb-6">
            <TabsTrigger
              value="sections"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Page Sections
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
            >
              <FileText className="w-4 h-4" />
              Page Info
            </TabsTrigger>
          </TabsList>

          {/* Page Sections Tab */}
          <TabsContent value="sections" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Stories Page Sections (/stories)
                </CardTitle>
                <CardDescription>
                  Manage gradient colors and text styling for the stories listing and detail pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {storiesSections.map((section) => (
                  <div key={section.key} className="gallery-slider-container">
                    <GradientPicker
                      sectionKey={section.key}
                      title={section.name}
                      showDirection={true}
                      showTextColors={true}
                    />
                  </div>
                ))}

                {/* Section Preview */}
                <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                  <h4 className="text-sm font-medium text-white mb-3">
                    Page Sections Using These Colors:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {storiesSections.map((section) => (
                      <div key={section.key} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        {section.name}: {section.description}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page Information Tab */}
          <TabsContent value="info" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Stories Page Information
                </CardTitle>
                <CardDescription>
                  Static page information and current configuration status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">Page Details</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div><strong>Listing URL:</strong> /stories</div>
                      <div><strong>Detail URL:</strong> /stories/:slug</div>
                      <div><strong>Type:</strong> Dynamic Blog Pages</div>
                      <div><strong>Sections:</strong> {storiesSections.length} gradient-controlled areas</div>
                      <div><strong>Content Management:</strong> Supabase + AI Generation</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">Gradient System Status</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Real-time gradient system enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Text color controls active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Supabase optimization enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>~700ms save performance</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
                  <h4 className="text-sm font-medium text-white mb-2">Features</h4>
                  <div className="text-sm text-slate-300 space-y-1">
                    <div>• AI-powered content generation with Gemini Flash</div>
                    <div>• Dynamic blog posts stored in Supabase</div>
                    <div>• Category filtering and search functionality</div>
                    <div>• Individual story pages with full content rendering</div>
                    <div>• Gradient styling applies to both listing and detail pages</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
