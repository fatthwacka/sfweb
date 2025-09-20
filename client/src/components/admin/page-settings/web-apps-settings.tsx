import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Code, Smartphone, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientPicker } from "@/components/ui/gradient-picker";

const webAppsSections = [
  {
    key: 'web-apps-hero',
    name: 'Hero Section',
    description: 'Main header and introduction area'
  },
  {
    key: 'web-apps-services',
    name: 'Services Section',
    description: 'Web application services overview'
  },
  {
    key: 'web-apps-process',
    name: 'Process Section',
    description: 'Development process and workflow'
  },
  {
    key: 'web-apps-cta',
    name: 'Call to Action',
    description: 'Contact and engagement section'
  }
];

export function WebAppsSettings() {
  const [activeTab, setActiveTab] = useState('sections');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-800/20 border border-blue-700/30 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Web Applications Color Management</h2>
          <p className="text-slate-300 text-sm">
            Manage gradient colors and visual styling for the web applications category page.
            Control background gradients and text colors for all page sections.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-600 mb-6">
            <TabsTrigger
              value="sections"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
            >
              <Code className="w-4 h-4" />
              Page Sections
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
            >
              <Globe className="w-4 h-4" />
              Page Info
            </TabsTrigger>
          </TabsList>

          {/* Page Sections Tab */}
          <TabsContent value="sections" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Web Applications Page Sections (/videography/web-apps)
                </CardTitle>
                <CardDescription>
                  Manage gradient colors and text styling for all sections on the web applications category page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {webAppsSections.map((section) => (
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
                    {webAppsSections.map((section) => (
                      <div key={section.key} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
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
                  <Globe className="w-5 h-5" />
                  Web Applications Page Information
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
                      <div><strong>URL:</strong> /videography/web-apps</div>
                      <div><strong>Type:</strong> Static Category Page</div>
                      <div><strong>Sections:</strong> {webAppsSections.length} gradient-controlled areas</div>
                      <div><strong>Content Management:</strong> Hardcoded (optimized performance)</div>
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

                <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-sm font-medium text-white mb-2">Usage Instructions</h4>
                  <div className="text-sm text-slate-300 space-y-1">
                    <div>• Adjust gradient colors using the color pickers above</div>
                    <div>• Text colors automatically update page sections</div>
                    <div>• Changes save automatically with real-time preview</div>
                    <div>• All changes are persistent across deployments</div>
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