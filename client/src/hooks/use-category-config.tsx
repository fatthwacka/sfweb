import { useQuery } from '@tanstack/react-query';
import { CategoryPageConfig, defaultCategoryPageConfig } from '@shared/types/category-config';

interface UseCategoryConfigProps {
  type: 'photography' | 'videography';
  category: string;
}

export function useCategoryConfig({ type, category }: UseCategoryConfigProps) {
  const { data: siteConfig, isLoading } = useQuery({
    queryKey: ['api', 'site-config'],
    queryFn: async () => {
      const response = await fetch('/api/site-config', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to load site configuration: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const categoryConfig: CategoryPageConfig = 
    siteConfig?.categoryPages?.[type]?.[category] || defaultCategoryPageConfig;


  return {
    config: categoryConfig,
    isLoading,
    hasConfig: !!siteConfig?.categoryPages?.[type]?.[category]
  };
}