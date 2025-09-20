import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Play, Camera, Building, Users, Package, Smartphone, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientPicker } from "@/components/ui/gradient-picker";

const videographyLandingSections = [
  {
    key: 'videography-landing-services',
    name: 'Services Section',
    description: 'Colors for the videography services overview'
  },
  {
    key: 'videography-landing-portfolio',
    name: 'Process Section',
    description: 'Colors for the video production process'
  },
  {
    key: 'videography-landing-cta',
    name: 'Call to Action',
    description: 'Colors for the CTA section'
  }
];

const videographyCategorySections = [
  {
    key: 'videography-category-services',
    name: 'Services Section',
    description: 'Colors for category service overview (shared by all categories)'
  },
  {
    key: 'videography-category-packages',
    name: 'Packages Section',
    description: 'Colors for pricing packages (shared by all categories)'
  },
  {
    key: 'videography-category-recent-work',
    name: 'Recent Work',
    description: 'Colors for gallery/showreel section (shared by all categories)'
  }
];

const videographyCategories = [
  'weddings', 'corporate', 'events', 'products', 'social', 'animation'
];

export function VideographySettings() {
  const [activeTab, setActiveTab] = useState('landing');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Videography Color Management</h2>
          <p className="text-slate-300 text-sm">
            Manage gradient colors for videography pages. Landing page has unique colors, 
            while all 6 category pages share unified colors for professional consistency.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-600 mb-6">
            <TabsTrigger
              value="landing"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
            >
              <Video className="w-4 h-4" />
              Landing Page
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
            >
              <Play className="w-4 h-4" />
              Category Pages
            </TabsTrigger>
          </TabsList>

          {/* Landing Page Tab */}
          <TabsContent value="landing" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Landing Page Colors (/videography)
                </CardTitle>
                <CardDescription>
                  Manage gradient colors for the main videography landing page sections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {videographyLandingSections.map((section) => (
                  <div key={section.key} className="gallery-slider-container">
                    <GradientPicker
                      sectionKey={section.key}
                      title={section.name}
                      showDirection={true}
                      showTextColors={true}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Pages Tab */}
          <TabsContent value="categories" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Category Pages Colors (Unified)
                </CardTitle>
                <CardDescription>
                  Manage shared gradient colors used by all videography category pages. 
                  Changes here affect all 6 categories: {videographyCategories.join(', ')}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {videographyCategorySections.map((section) => (
                  <div key={section.key} className="gallery-slider-container">
                    <GradientPicker
                      sectionKey={section.key}
                      title={section.name}
                      showDirection={true}
                      showTextColors={true}
                    />
                  </div>
                ))}

                {/* Category Preview */}
                <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                  <h4 className="text-sm font-medium text-white mb-3">
                    Category Pages Using These Colors:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {videographyCategories.map((category) => (
                      <div key={category} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        /videography/{category}
                      </div>
                    ))}
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