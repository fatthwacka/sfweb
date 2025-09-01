import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Image, Award, Camera as CameraIcon, Building, GraduationCap, Users } from "lucide-react";
import { CategoryPageSettings } from "./category-page-settings";

const photographyCategories = [
  {
    slug: 'weddings',
    name: 'Weddings',
    icon: Users,
    description: 'Wedding photography settings'
  },
  {
    slug: 'portraits',
    name: 'Portraits',
    icon: Users,
    description: 'Portrait photography settings'
  },
  {
    slug: 'corporate',
    name: 'Corporate',
    icon: Building,
    description: 'Corporate photography settings'
  },
  {
    slug: 'events',
    name: 'Events',
    icon: CameraIcon,
    description: 'Event photography settings'
  },
  {
    slug: 'products',
    name: 'Products',
    icon: Image,
    description: 'Product photography settings'
  },
  {
    slug: 'graduation',
    name: 'Graduation',
    icon: GraduationCap,
    description: 'Graduation photography settings'
  }
];

export function PhotographySettings() {
  const [activeCategory, setActiveCategory] = useState('weddings');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 border border-slate-600">
          {photographyCategories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.slug}
                value={category.slug}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {photographyCategories.map((category) => (
          <TabsContent key={category.slug} value={category.slug}>
            <CategoryPageSettings type="photography" category={category.slug} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}