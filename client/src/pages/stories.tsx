import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Search, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { GradientBackground } from '@/components/common/gradient-background';
import type { BlogPost, BlogCategory } from '@shared/schema';

interface StoriesPageProps {
  params?: { page?: string };
}

const POSTS_PER_PAGE = 12;

export function Stories({ params }: StoriesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const currentPage = parseInt(params?.page || '1');

  // Fetch published blog posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ['stories', 'posts', searchTerm, selectedCategory, currentPage],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        status: 'published',
        limit: POSTS_PER_PAGE.toString(),
        offset: ((currentPage - 1) * POSTS_PER_PAGE).toString()
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }

      const response = await apiRequest('GET', `/api/blog/posts?${queryParams}`);
      return response.json();
    }
  });

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ['stories', 'categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/blog/categories');
      return response.json();
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryInfo = (categoryId?: string | null) => {
    if (!categoryId) return null;
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Main Content Section - Hero, Search, Grid */}
      <GradientBackground section="stories-content" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-12 mt-4">
            <h1 className="mb-4 text-stories-content-primary font-thin">
              Our Stories
            </h1>
            <p className="text-xl text-stories-content-secondary max-w-2xl mx-auto">
              Behind every photograph is a story. Explore our case studies, tips, and the moments that inspire our creative vision.
            </p>
          </div>

          {/* Search/Filter Bar */}
          <div className="stories-search-bar p-4 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search stories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-background/50 border-border">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || selectedCategory !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-cyan/20 text-cyan border-cyan/40">
                    Search: {searchTerm}
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="bg-salmon/20 text-salmon border-salmon/40">
                    {getCategoryInfo(selectedCategory)?.name || selectedCategory}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="text-muted-foreground hover:text-white text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Stories Grid */}
          {postsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="story-card">
                  <div className="story-card-placeholder animate-pulse" />
                  <div className="story-card-content">
                    <div className="space-y-3">
                      <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="story-card max-w-md mx-auto">
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-semibold text-white mb-2">No stories found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedCategory !== 'all'
                    ? "Try adjusting your search criteria or filters."
                    : "We're working on some amazing stories to share with you soon!"
                  }
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="bg-salmon hover:bg-salmon/90 text-white"
                  >
                    View All Stories
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((post) => {
                const category = getCategoryInfo(post.categoryId);

                return (
                  <div
                    key={post.id}
                    className="story-card group"
                    onClick={() => window.location.href = `/stories/${post.slug}`}
                  >
                    {/* Cover Image */}
                    {post.coverImage ? (
                      <div className="story-card-image">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                        />
                      </div>
                    ) : (
                      <div className="story-card-placeholder">
                        <div className="text-4xl">📖</div>
                      </div>
                    )}

                    <div className="story-card-content">
                      {/* Title */}
                      <h3 className="story-card-title">
                        {post.title}
                      </h3>

                      {/* Date */}
                      <p className="story-card-date">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </p>

                      {/* Category Badge */}
                      <div className="flex flex-wrap gap-2">
                        {category && (
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-xs"
                          >
                            {category.name}
                          </Badge>
                        )}
                        {post.aiGenerated && (
                          <Badge variant="outline" className="border-cyan/50 text-cyan text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!postsLoading && posts.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-4">
              {hasPrevPage && (
                <Link href={`/stories?page=${currentPage - 1}`}>
                  <Button variant="outline" className="border-border hover:border-salmon">
                    Previous
                  </Button>
                </Link>
              )}

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const distance = Math.abs(page - currentPage);
                    return distance <= 2 || page === 1 || page === totalPages;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-3 py-2 text-muted-foreground">...</span>
                        )}
                        <Link href={`/stories?page=${page}`}>
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={
                              currentPage === page
                                ? "bg-salmon hover:bg-salmon/90 text-white"
                                : "border-border hover:border-salmon"
                            }
                          >
                            {page}
                          </Button>
                        </Link>
                      </React.Fragment>
                    );
                  })}
              </div>

              {hasNextPage && (
                <Link href={`/stories?page=${currentPage + 1}`}>
                  <Button variant="outline" className="border-border hover:border-salmon">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Results Info */}
          {!postsLoading && posts.length > 0 && (
            <div className="text-center mt-8">
              <p className="text-stories-content-secondary text-sm">
                Showing {(currentPage - 1) * POSTS_PER_PAGE + 1}-{Math.min(currentPage * POSTS_PER_PAGE, posts.length)} of {posts.length} stories
              </p>
            </div>
          )}
        </div>
      </GradientBackground>

      {/* Call to Action */}
      <GradientBackground section="stories-cta" className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-light mb-4 text-stories-cta-primary">
            Ready to Create Your Own <span className="text-gradient">Story?</span>
          </h2>
          <p className="text-stories-cta-secondary text-lg mb-8">
            Every great photograph starts with a vision. Let's bring yours to life with
            professional photography services that capture your most important moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-salmon hover:bg-salmon/90 text-white px-8 py-3 text-lg">
                Start Your Story
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline" className="border-border hover:border-salmon px-8 py-3 text-lg">
                View Our Work
              </Button>
            </Link>
          </div>
        </div>
      </GradientBackground>

      <Footer />
    </div>
  );
}
