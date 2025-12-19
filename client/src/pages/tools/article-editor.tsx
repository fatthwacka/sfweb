/**
 * Article Editor Tool
 * Edit and manage Airtable articles with AI-assisted enhancements
 * Secure server-side proxy for Airtable API
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Search,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useToolAccess } from '@/hooks/use-tool-access';
import { AccessModal } from '@/components/tools/access-modal';
import { api } from '@/lib/api';
import type { AccessModalType } from '@shared/types/tools';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AirtableImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface Article {
  id: string;
  fields: {
    Title: string;
    Content: string;
    Category?: string;
    Tags?: string[];
    Status?: 'Draft' | 'Published' | 'Archived';
    Images?: AirtableImage[];
    [key: string]: any;
  };
}

export default function ArticleEditor() {
  const { toast } = useToast();
  const { canAccessTool, getAccessModal } = useToolAccess();
  const [accessModal, setAccessModal] = useState<AccessModalType | null>(null);

  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit form state
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [editedStatus, setEditedStatus] = useState<'Draft' | 'Published' | 'Archived'>('Draft');

  // Check access on mount
  useEffect(() => {
    const tool = { minTier: 'verified' } as any;
    const modal = getAccessModal(tool);
    if (modal) {
      setAccessModal(modal);
    } else {
      loadArticles();
    }
  }, []);

  // Load articles from Airtable via proxy
  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/tools/articles');
      setArticles(response.data.records || []);
      setFilteredArticles(response.data.records || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load articles',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Filter articles based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter((article) => {
        const title = article.fields.Title?.toLowerCase() || '';
        const content = article.fields.Content?.toLowerCase() || '';
        const category = article.fields.Category?.toLowerCase() || '';
        const tags = article.fields.Tags?.join(' ').toLowerCase() || '';
        
        return (
          title.includes(query) ||
          content.includes(query) ||
          category.includes(query) ||
          tags.includes(query)
        );
      });
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  // Select article for editing
  const handleSelectArticle = useCallback((article: Article) => {
    setSelectedArticle(article);
    setEditedTitle(article.fields.Title || '');
    setEditedContent(article.fields.Content || '');
    setEditedCategory(article.fields.Category || '');
    setEditedTags(article.fields.Tags?.join(', ') || '');
    setEditedStatus(article.fields.Status || 'Draft');
    setEditMode(false);
  }, []);

  // Save edited article
  const handleSave = useCallback(async () => {
    if (!selectedArticle) return;

    setIsSaving(true);
    try {
      const updates = {
        Title: editedTitle,
        Content: editedContent,
        Category: editedCategory,
        Tags: editedTags.split(',').map(tag => tag.trim()).filter(Boolean),
        Status: editedStatus,
      };

      const response = await api.patch(`/api/tools/articles/${selectedArticle.id}`, {
        fields: updates,
      });

      // Update local state
      const updatedArticle = response.data;
      setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
      setSelectedArticle(updatedArticle);
      setEditMode(false);

      toast({
        title: 'Article saved',
        description: 'Your changes have been saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to save article',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedArticle, editedTitle, editedContent, editedCategory, editedTags, editedStatus, toast]);

  // Enhance content with AI
  const handleEnhance = useCallback(async () => {
    if (!editedContent.trim()) {
      toast({
        title: 'No content to enhance',
        description: 'Please enter some content first',
        variant: 'destructive',
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await api.post('/api/tools/ai/enhance-content', {
        content: editedContent,
        title: editedTitle,
        operation: 'improve', // Options: improve, expand, summarize
      });

      setEditedContent(response.data.enhancedContent);
      
      toast({
        title: 'Content enhanced',
        description: 'AI has improved your content',
      });
    } catch (error: any) {
      toast({
        title: 'Enhancement failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  }, [editedContent, editedTitle, toast]);

  // Upload image
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedArticle) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('articleId', selectedArticle.id);

    try {
      const response = await api.post('/api/tools/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Image uploaded',
        description: 'Image has been added to the article',
      });

      // Reload article to get updated images
      await loadArticles();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  }, [selectedArticle, toast, loadArticles]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    if (selectedArticle) {
      handleSelectArticle(selectedArticle);
    }
    setEditMode(false);
  }, [selectedArticle, handleSelectArticle]);

  // Render article list
  const renderArticleList = () => (
    <Card>
      <CardHeader>
        <CardTitle>Articles ({filteredArticles.length})</CardTitle>
        <CardDescription>Select an article to edit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => handleSelectArticle(article)}
              className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted ${
                selectedArticle?.id === article.id ? 'bg-muted border-salmon' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{article.fields.Title || 'Untitled'}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {article.fields.Category || 'Uncategorized'}
                  </p>
                </div>
                <Badge
                  variant={
                    article.fields.Status === 'Published'
                      ? 'default'
                      : article.fields.Status === 'Archived'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="ml-2"
                >
                  {article.fields.Status || 'Draft'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render article editor
  const renderEditor = () => {
    if (!selectedArticle) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Select an article to start editing</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Article Editor</CardTitle>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={isSaving}
                    className="bg-salmon hover:bg-salmon-muted text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditMode(true)}
                  size="sm"
                  className="bg-salmon hover:bg-salmon-muted text-white"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              disabled={!editMode}
              placeholder="Enter article title"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                disabled={!editMode}
                placeholder="e.g., Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editedStatus}
                onValueChange={(value) => setEditedStatus(value as any)}
                disabled={!editMode}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              disabled={!editMode}
              placeholder="e.g., tutorial, javascript, react"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              {editMode && (
                <Button
                  onClick={handleEnhance}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                >
                  {isEnhancing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Enhance with AI
                </Button>
              )}
            </div>
            <Textarea
              id="content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={!editMode}
              placeholder="Write your article content here..."
              className="min-h-[300px] font-mono"
            />
          </div>

          {/* Images */}
          {selectedArticle.fields.Images && selectedArticle.fields.Images.length > 0 && (
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedArticle.fields.Images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                      {image.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          {editMode && (
            <div className="space-y-2">
              <Label htmlFor="image-upload">Add Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Main Content */}
      <div className="pt-20 pb-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Header */}
          <div className="mb-8">
            <Link href="/tools">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Article Editor</h1>
                <p className="text-muted-foreground mt-1">
                  Edit and manage articles with AI enhancements
                </p>
              </div>
              
              <Button
                onClick={loadArticles}
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles by title, content, category, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Main Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-salmon" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Article List */}
              <div className="lg:col-span-1">
                {renderArticleList()}
              </div>

              {/* Editor */}
              <div className="lg:col-span-2">
                {renderEditor()}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Access Modal */}
      <AccessModal
        modalType={accessModal}
        onClose={() => setAccessModal(null)}
      />
    </div>
  );
}