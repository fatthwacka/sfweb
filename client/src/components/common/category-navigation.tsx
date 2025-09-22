import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface CategoryOption {
  name: string;
  slug: string;
  shortName: string; // First word only for button labels
}

interface CategoryNavigationProps {
  categories: CategoryOption[];
  basePath: string; // 'photography' or 'videography'
}

export function CategoryNavigation({ categories, basePath }: CategoryNavigationProps) {
  return (
    <div className="mb-12">
      {/* Mobile and tablet horizontal scroll container */}
      <div className="xl:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 pb-2 justify-center" style={{ width: 'max-content', margin: '0 auto' }}>
          {categories.map(category => (
            <Link key={category.slug} href={`/${basePath}/${category.slug}`}>
              <Button
                variant="outline"
                className="px-4 py-2 font-barlow font-semibold rounded-full transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0 border-gray-500 bg-gradient-to-r from-gray-700/30 to-gray-600/10 text-gray-300 hover:border-gray-400 hover:from-gray-600/20 hover:to-gray-500/10 hover:text-gray-200"
              >
                {category.shortName}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Large desktop flex container (no wrap needed at this size) */}
      <div className="hidden xl:flex justify-center gap-4">
        {categories.map(category => (
          <Link key={category.slug} href={`/${basePath}/${category.slug}`}>
            <Button
              variant="outline"
              className="px-6 py-3 font-barlow font-semibold rounded-full transition-all duration-300 border-gray-500 bg-gradient-to-r from-gray-700/30 to-gray-600/10 text-gray-300 hover:border-gray-400 hover:from-gray-600/20 hover:to-gray-500/10 hover:text-gray-200"
            >
              {category.shortName}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}