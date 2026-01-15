import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabaseOperations } from "@/lib/supabase-operations";
import { GradientPicker } from "@/components/ui/gradient-picker";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Search,
  FileText,
  Tag,
  Sparkles,
  Image as ImageIcon,
  Save,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  Settings2,
  Upload,
  X,
  Palette,
  MinusCircle,
  PlusCircle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Undo2,
  FolderOpen,
  Loader2,
  AlertCircle
} from "lucide-react";
import type { BlogPost, BlogCategory, BlogTag, InsertBlogPost, FeaturedSection } from "@shared/schema";

interface BlogManagementProps {
  userRole: string;
}

export function BlogManagement({ userRole }: BlogManagementProps) {
  console.log('🔄 BlogManagement component mounting/re-rendering');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState<'posts' | 'categories' | 'editor'>('posts');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  
  // Temp ID for unsaved posts (for gradient management)
  const [tempPostId] = useState(() => `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // New category state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Editor state
  const [editorPost, setEditorPost] = useState<Partial<InsertBlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    publishedAt: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Publish progress modal state
  const [publishProgress, setPublishProgress] = useState({
    isOpen: false,
    step: 'saving', // 'saving' | 'generating' | 'success' | 'error'
    message: '',
    error: null as string | null
  });

  // Slug state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // AI Brief dialog state
  const [aiBriefOpen, setAiBriefOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState('');
  const [contentType, setContentType] = useState<'case-study' | 'news' | 'informational' | 'showcase'>('informational');

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Section enhancement state
  const [processingSection, setProcessingSection] = useState<string | null>(null);
  const [previousContent, setPreviousContent] = useState<{[key: string]: string}>({});
  const [showUndo, setShowUndo] = useState<{[key: string]: boolean}>({});
  const [customPromptOpen, setCustomPromptOpen] = useState<{[key: string]: boolean}>({});

  // Tone options for the dropdown
  const toneOptions = [
    { value: 'humorous', label: 'Humorous' },
    { value: 'creative', label: 'Creative' },
    { value: 'poetic', label: 'Poetic' },
    { value: 'professional', label: 'Professional' },
    { value: 'executive', label: 'Executive' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'informative', label: 'Informative' },
    { value: 'advisory', label: 'Advisory' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'technical', label: 'Technical' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' }
  ];

  // Structured content sections with SEO headings
  interface ContentSection {
    heading: string;
    content: string;
  }
  const [contentSections, setContentSections] = useState<{
    subtitle: string;
    introduction: string;
    mainSections: ContentSection[];
    pullQuote: string;
    conclusion: ContentSection;
  }>({
    subtitle: '',
    introduction: '',
    mainSections: [
      { heading: '', content: '' },
      { heading: '', content: '' },
      { heading: '', content: '' }
    ],
    pullQuote: '',
    conclusion: { heading: '', content: '' }
  });

  // Featured section state
  const [featuredSection, setFeaturedSection] = useState<FeaturedSection>({
    type: 'none',
    config: {}
  });

  // Variable content state
  const [variableContent, setVariableContent] = useState<string>('');

  // Featured section image upload state
  const [isDraggingFeatured, setIsDraggingFeatured] = useState(false);
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);

  // Image upload state
  const [isDragging, setIsDragging] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isDraggingPost1, setIsDraggingPost1] = useState(false);
  const [isDraggingPost2, setIsDraggingPost2] = useState(false);
  const [uploadingPost1, setUploadingPost1] = useState(false);
  const [uploadingPost2, setUploadingPost2] = useState(false);

  // Image browser dialog state
  const [imageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [imageBrowserTarget, setImageBrowserTarget] = useState<'hero' | 'post1' | 'post2' | 'featured' | null>(null);

  // Fetch blog posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ['blog', 'posts'],
    queryFn: supabaseOperations.blog.posts.getAll,
    staleTime: 30 * 1000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ['blog', 'categories'],
    queryFn: supabaseOperations.blog.categories.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch existing blog images for browser dialog
  interface BlogImage {
    name: string;
    url: string;
    createdAt: string;
    size: number;
  }
  // TODO: Convert to Supabase Storage for blog images
  const blogImages: BlogImage[] = [];
  const blogImagesLoading = false;
  const refetchBlogImages = () => {};

  // Handle selecting an existing image from the browser
  const handleSelectExistingImage = (imageUrl: string) => {
    if (imageBrowserTarget === 'hero') {
      setEditorPost(prev => ({ ...prev, coverImage: imageUrl }));
    } else if (imageBrowserTarget === 'post1') {
      setEditorPost(prev => ({ ...prev, postImage1: imageUrl }));
    } else if (imageBrowserTarget === 'post2') {
      setEditorPost(prev => ({ ...prev, postImage2: imageUrl }));
    } else if (imageBrowserTarget === 'featured') {
      setFeaturedSection(prev => ({
        ...prev,
        config: { ...prev.config, imageUrl: imageUrl }
      }));
    }
    setImageBrowserOpen(false);
    setImageBrowserTarget(null);
    toast({
      title: "Image selected",
      description: "Existing image has been applied"
    });
  };

  // Open image browser for a specific target
  const openImageBrowser = (target: 'hero' | 'post1' | 'post2' | 'featured') => {
    setImageBrowserTarget(target);
    setImageBrowserOpen(true);
  };

  // Create/update post mutation
  const savePostMutation = useMutation({
    mutationFn: async (post: Partial<InsertBlogPost>) => {
      console.log('Sending blog post data:', JSON.stringify(post, null, 2));

      if (selectedPost?.id) {
        // Update existing post
        return supabaseOperations.blog.posts.update(selectedPost.id, {
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          cover_image: post.coverImage || null,
          post_image_1: post.postImage1 || null,
          post_image_2: post.postImage2 || null,
          category_id: post.categoryId || null,
          status: post.status,
          published_at: post.publishedAt || null,
          author_id: post.authorId || null,
          seo_title: post.seoTitle || null,
          seo_description: post.seoDescription || null,
          featured_section: post.featuredSection || null,
          variable_content: post.variableContent || null,
        });
      } else {
        // Create new post
        return supabaseOperations.blog.posts.create({
          title: post.title!,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          cover_image: post.coverImage || null,
          post_image_1: post.postImage1 || null,
          post_image_2: post.postImage2 || null,
          category_id: post.categoryId || null,
          status: post.status,
          published_at: post.publishedAt || null,
          author_id: post.authorId || null,
          seo_title: post.seoTitle || null,
          seo_description: post.seoDescription || null,
          featured_section: post.featuredSection || null,
          variable_content: post.variableContent || null,
        });
      }
    },
    onSuccess: (response) => {
      toast({ title: "Success", description: "Blog post saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
      
      // Only clear state if this was creating a NEW post from the "New Post" dialog
      // Don't clear state when editing existing posts
      const wasCreatingNewPost = !selectedPost?.id;
      
      if (wasCreatingNewPost) {
        setNewPostOpen(false);
        // For new posts, we could keep editing or return to list - keep state for now
      }
      
      // Note: Keep selectedPost and editorPost intact for continued editing
      // This allows Save → Publish workflow to work properly
    },
    onError: (error) => {
      console.error('Blog post save error:', error);
      toast({ title: "Error", description: "Failed to save blog post", variant: "destructive" });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: supabaseOperations.blog.posts.delete,
    onSuccess: () => {
      toast({ title: "Success", description: "Blog post deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete blog post", variant: "destructive" });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      console.log('Creating category with data:', { name: categoryName });
      return supabaseOperations.blog.categories.create({ name: categoryName });
    },
    onSuccess: (newCategory) => {
      toast({ title: "Success", description: "Category created successfully" });
      queryClient.invalidateQueries({ queryKey: ['blog', 'categories'] });
      // Set the newly created category as selected
      setEditorPost(prev => ({ ...prev, categoryId: newCategory.id }));
      setNewCategoryName('');
      setIsAddingCategory(false);
    },
    onError: (error) => {
      console.error('Category creation error:', error);
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    }
  });

  // Handle new category creation
  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate(newCategoryName.trim());
    }
  };

  // Handle category selection change
  const handleCategoryChange = (value: string) => {
    if (value === 'add-new') {
      setIsAddingCategory(true);
      setNewCategoryName('');
    } else {
      setEditorPost(prev => ({ ...prev, categoryId: value }));
    }
  };

  // Slug helper functions
  const generateSlug = (text: string): string => {
    // Common stop words to remove for shorter, meaningful slugs
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'your', 'our', 'their', 'his', 'her', 'its', 'my', 'this', 'that',
      'these', 'those', 'what', 'which', 'who', 'whom', 'how', 'why', 'when',
      'where', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
      'there', 'about', 'just', 'only', 'very', 'also', 'well', 'back', 'even',
      'still', 'way', 'take', 'make', 'get', 'got', 'getting', 'tips', 'guide'
    ]);

    const words = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Take first 3-4 meaningful words for a concise slug
    const slugWords = words.slice(0, 4);

    return slugWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const validateSlug = (slug: string): boolean => {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !validateSlug(slug)) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    try {
      const existingPosts = await supabaseOperations.blog.posts.search(slug, 100);

      // Check if any post has this exact slug (excluding current post being edited)
      const slugTaken = existingPosts.some((post: BlogPost) =>
        post.slug === slug && post.id !== selectedPost?.id
      );

      setSlugStatus(slugTaken ? 'taken' : 'available');
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugStatus('idle');
    }
  };

  // Auto-generate slug when title changes (if not manually edited)
  const handleTitleChange = (newTitle: string) => {
    setEditorPost(prev => ({ ...prev, title: newTitle }));

    if (!slugManuallyEdited && newTitle) {
      const newSlug = generateSlug(newTitle);
      setEditorPost(prev => ({ ...prev, slug: newSlug }));
      checkSlugAvailability(newSlug);
    }
  };

  const handleSlugChange = (newSlug: string) => {
    const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setEditorPost(prev => ({ ...prev, slug: cleanSlug }));
    setSlugManuallyEdited(true);
    checkSlugAvailability(cleanSlug);
  };

  // AI Brief dialog handlers
  const openAiBrief = async () => {
    setAiBrief('');
    setShowAdvanced(false);
    setSaveAsDefault(false);
    setAiBriefOpen(true);

    // TODO: Convert AI prompt fetching to Supabase
    setLoadingPrompt(false);
    setDefaultPrompt('');
    setCustomPrompt('');
  };

  // Refetch prompt when content type changes
  const handleContentTypeChange = async (newType: typeof contentType) => {
    setContentType(newType);
    if (showAdvanced) {
      // TODO: Convert AI prompt fetching to Supabase
      setLoadingPrompt(false);
      setDefaultPrompt('');
      setCustomPrompt('');
    }
  };

  // Convert basic markdown to HTML
  const markdownToHtml = (text: string): string => {
    if (!text) return '';

    return text
      // Convert **bold** to <strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Convert ### headings
      .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
      // Convert ## headings
      .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
      // Convert # headings
      .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
      // Convert line breaks to paragraphs (double newline = new paragraph)
      .split(/\n\n+/)
      .map(para => {
        para = para.trim();
        // Don't wrap if already has HTML tags
        if (para.startsWith('<h') || para.startsWith('<p') || para.startsWith('<blockquote')) {
          return para;
        }
        return para ? `<p>${para}</p>` : '';
      })
      .filter(p => p)
      .join('\n\n');
  };

  // Combine content sections into HTML for saving
  const combineContentSections = (): string => {
    const { introduction, mainSections, pullQuote, conclusion } = contentSections;
    if (!introduction && mainSections.length === 0 && !conclusion.content) return '';

    const parts: string[] = [];

    // Introduction as a lead paragraph
    if (introduction) {
      parts.push(`<p class="lead">${introduction}</p>`);
    }

    // Main sections with SEO h2 headings
    // Insert pull quote after section 2 (before section 3)
    mainSections.forEach((section, index) => {
      if (section.heading || section.content) {
        if (section.heading) {
          parts.push(`<h2>${section.heading}</h2>`);
        }
        if (section.content) {
          parts.push(markdownToHtml(section.content));
        }
      }

      // Insert pull quote after section 2 (index 1)
      if (index === 1 && pullQuote) {
        parts.push(`<blockquote class="pull-quote">${pullQuote}</blockquote>`);
      }
    });

    // Conclusion with optional heading
    if (conclusion.heading || conclusion.content) {
      if (conclusion.heading) {
        parts.push(`<h2>${conclusion.heading}</h2>`);
      }
      if (conclusion.content) {
        parts.push(`<p class="conclusion">${conclusion.content}</p>`);
      }
    }

    return parts.join('\n\n');
  };

  // Featured image drag-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadImage(files[0]);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadImage(files[0]);
    }
  };

  // Client-side image compression (same pattern as image-upload-zone.tsx)
  const compressImage = async (file: File, maxWidth: number, quality: number): Promise<File> => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              if (optimizedFile.size < file.size) {
                console.log(`✨ Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(optimizedFile.size / 1024).toFixed(0)}KB`);
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 20MB - will be compressed before upload)
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 20MB", variant: "destructive" });
      return;
    }

    setImageUploading(true);

    try {
      // Compress client-side: hero max 1200px, 82% quality
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 1200, 0.82);
      const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(0);

      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setEditorPost(prev => ({ ...prev, coverImage: data.path }));
      toast({
        title: "Success",
        description: compressionRatio !== '0' ? `Hero image uploaded (${compressionRatio}% smaller)` : "Hero image uploaded"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setEditorPost(prev => ({ ...prev, coverImage: undefined }));
  };

  // Post Image 1 drag-drop handlers
  const handleDragOverPost1 = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPost1(true);
  }, []);

  const handleDragLeavePost1 = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPost1(false);
  }, []);

  const handleDropPost1 = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPost1(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadPostImage1(files[0]);
    }
  }, []);

  const handleFileSelectPost1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadPostImage1(files[0]);
    }
  };

  const uploadPostImage1 = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 20MB", variant: "destructive" });
      return;
    }

    setUploadingPost1(true);

    try {
      // Compress client-side: post images max 1200px, 82% quality (matches hero)
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 1200, 0.82);
      const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(0);

      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setEditorPost(prev => ({ ...prev, postImage1: data.path }));
      toast({
        title: "Success",
        description: compressionRatio !== '0' ? `Post image 1 uploaded (${compressionRatio}% smaller)` : "Post image 1 uploaded"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingPost1(false);
    }
  };

  const removePostImage1 = () => {
    setEditorPost(prev => ({ ...prev, postImage1: undefined }));
  };

  // Post Image 2 drag-drop handlers
  const handleDragOverPost2 = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPost2(true);
  }, []);

  const handleDragLeavePost2 = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPost2(false);
  }, []);

  const handleDropPost2 = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPost2(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadPostImage2(files[0]);
    }
  }, []);

  const handleFileSelectPost2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadPostImage2(files[0]);
    }
  };

  const uploadPostImage2 = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 20MB", variant: "destructive" });
      return;
    }

    setUploadingPost2(true);

    try {
      // Compress client-side: post images max 1200px, 82% quality (matches hero)
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 1200, 0.82);
      const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(0);

      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setEditorPost(prev => ({ ...prev, postImage2: data.path }));
      toast({
        title: "Success",
        description: compressionRatio !== '0' ? `Post image 2 uploaded (${compressionRatio}% smaller)` : "Post image 2 uploaded"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingPost2(false);
    }
  };

  const removePostImage2 = () => {
    setEditorPost(prev => ({ ...prev, postImage2: undefined }));
  };

  // Featured image drag-drop handlers
  const handleDragOverFeatured = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFeatured(true);
  }, []);

  const handleDragLeaveFeatured = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFeatured(false);
  }, []);

  const handleDropFeatured = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFeatured(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await handleFeaturedImageUpload(imageFile);
    }
  }, []);

  const handleFeaturedFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleFeaturedImageUpload(file);
    }
  }, []);

  const handleFeaturedImageUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { // 20MB - compressed before upload
      toast({ title: "Error", description: "Image must be smaller than 20MB", variant: "destructive" });
      return;
    }

    setFeaturedImageUploading(true);

    try {
      // Compress client-side: featured images max 1400px, 82% quality
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 1400, 0.82);
      const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(0);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('location', 'uploads');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      setFeaturedSection(prev => ({
        ...prev,
        config: { ...prev.config, imageUrl: data.path }
      }));
      
      toast({
        title: "Success",
        description: compressionRatio !== '0' ? `Featured image uploaded (${compressionRatio}% smaller)` : "Featured image uploaded"
      });
    } catch (error) {
      console.error('Featured image upload error:', error);
      toast({ title: "Error", description: "Failed to upload featured image", variant: "destructive" });
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  const removeFeaturedImage = () => {
    setFeaturedSection(prev => ({
      ...prev,
      config: { ...prev.config, imageUrl: undefined }
    }));
  };

  // Before-After image upload handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleBeforeAfterImageUpload(file, type);
    }
  };

  const handleImageDrop = async (e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await handleBeforeAfterImageUpload(imageFile, type);
    }
  };

  const handleBeforeAfterImageUpload = async (file: File, type: 'before' | 'after') => {
    if (file.size > 20 * 1024 * 1024) { // 20MB - compressed before upload
      toast({ title: "Error", description: "Image must be smaller than 20MB", variant: "destructive" });
      return;
    }

    try {
      // Compress client-side: featured images max 1400px, 82% quality 
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 1400, 0.82);
      const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(0);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('location', 'uploads');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      setFeaturedSection(prev => ({
        ...prev,
        config: { 
          ...prev.config, 
          [`${type}ImageUrl`]: data.path,
          [`${type}ImageAlt`]: prev.config[`${type}ImageAlt`] || `${type} image`
        }
      }));
      
      toast({
        title: "Success",
        description: compressionRatio !== '0' 
          ? `${type} image uploaded (${compressionRatio}% smaller)` 
          : `${type} image uploaded`
      });
    } catch (error) {
      console.error(`${type} image upload error:`, error);
      toast({ title: "Error", description: `Failed to upload ${type} image`, variant: "destructive" });
    }
  };

  // Content type labels for display
  const contentTypeLabels = {
    'case-study': 'Case Study',
    'news': 'News/Announcement',
    'informational': 'Informational/Tips',
    'showcase': 'Project Showcase'
  };

  const executeAiGeneration = async () => {
    const topicText = editorPost.title?.trim() || aiBrief.trim();

    if (!topicText) {
      toast({ title: "Error", description: "Please enter a topic or title first", variant: "destructive" });
      return;
    }

    setAiBriefOpen(false);
    setIsGenerating(true);

    try {
      const briefText = aiBrief.trim();
      const fullTopic = `${topicText}${briefText ? `. ${briefText}` : ''}`;

      // Call the AI generation API endpoint
      const response = await apiRequest('POST', '/api/ai/generate-full', {
        topic: fullTopic,
        contentType,
        category: categories.find(c => c.id === editorPost.categoryId)?.name,
        customPrompt: showAdvanced && customPrompt !== defaultPrompt ? customPrompt : undefined,
        saveAsDefault: showAdvanced && saveAsDefault
      });

      const data = await response.json();

      // Set title suggestions
      if (data.titles?.length > 0) {
        setEditorPost(prev => ({ ...prev, aiTitleSuggestions: data.titles }));
      }

      // Set content sections (new format with subtitle, mainSections, pullQuote)
      if (data.sections) {
        // Ensure we have exactly 3 main sections
        const mainSections = data.sections.mainSections?.length > 0
          ? data.sections.mainSections
          : [{ heading: '', content: '' }, { heading: '', content: '' }, { heading: '', content: '' }];

        // Pad to 3 sections if needed
        while (mainSections.length < 3) {
          mainSections.push({ heading: '', content: '' });
        }

        setContentSections({
          subtitle: data.sections.subtitle || '',
          introduction: data.sections.introduction || '',
          mainSections: mainSections.slice(0, 3), // Limit to 3 sections
          pullQuote: data.sections.pullQuote || '',
          conclusion: data.sections.conclusion?.content
            ? data.sections.conclusion
            : { heading: '', content: typeof data.sections.conclusion === 'string' ? data.sections.conclusion : '' }
        });
      }

      // Set SEO fields
      if (data.seoTitle) {
        setEditorPost(prev => ({ ...prev, seoTitle: data.seoTitle }));
      }
      if (data.seoDescription) {
        setEditorPost(prev => ({ ...prev, seoDescription: data.seoDescription }));
      }

      // Set excerpt
      if (data.excerpt) {
        setEditorPost(prev => ({ ...prev, excerpt: data.excerpt }));
      }

      toast({
        title: "Success",
        description: saveAsDefault
          ? "AI generated content and saved prompt as default"
          : "AI generated titles, content, SEO, and excerpt"
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ title: "Error", description: "Failed to generate content", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setAiBrief('');
      setSaveAsDefault(false);
    }
  };

  // Section enhancement function
  const enhanceSection = async (
    content: string, 
    action: 'reduce' | 'increase' | 'grammar' | 'rewrite' | 'tone' | 'custom',
    sectionKey: string,
    sectionTitle?: string,
    toneOrCustomPrompt?: string
  ) => {
    if (!content.trim()) {
      toast({ title: "Error", description: "No content to enhance", variant: "destructive" });
      return;
    }

    const enhancementPrompts = {
      reduce: `Make this content shorter by removing unnecessary words and condensing ideas. Cut out filler words, redundant phrases, and keep only the essential message. Aim for 40-50% reduction while preserving the core meaning.`,
      increase: `Keep the existing content exactly as it is, then add one relevant, insightful sentence at the end that provides additional value, context, or supporting detail. Do not modify the original text - only append to it.`,
      grammar: `Correct any spelling, grammar, or punctuation errors. Improve sentence structure for clarity and flow. Do not change the content meaning or length significantly.`,
      rewrite: `REWRITE TASK - WORD COUNT MUST MATCH ORIGINAL. Count the words in the original text and write exactly that many words back. If the original is 6 words or fewer, treat it as a TITLE and rewrite it as a new title with the same number of words. If the original is 7+ words, treat it as BODY TEXT and rewrite it as a new paragraph with the same word count. Do not expand short titles into sentences. Do not compress long paragraphs into titles. Preserve the format type (title stays title, paragraph stays paragraph) while using fresh wording.`,
      tone: `Rewrite this section in a TONE_PLACEHOLDER tone while preserving the core message and information. Adjust the language style, word choice, and sentence structure to match the requested tone.`
    };

    // Store previous content for undo
    setPreviousContent(prev => ({ ...prev, [sectionKey]: content }));
    setProcessingSection(`${sectionKey}-${action}`);

    try {
      let prompt: string;
      const isHeadingField = sectionKey.includes('heading') || sectionKey.includes('title') || sectionKey === 'subtitle';
      
      if (action === 'custom' && toneOrCustomPrompt) {
        prompt = toneOrCustomPrompt;
      } else if (action === 'tone' && toneOrCustomPrompt) {
        prompt = enhancementPrompts.tone.replace('TONE_PLACEHOLDER', toneOrCustomPrompt);
      } else if (action === 'rewrite') {
        // Customize rewrite prompt based on field type
        if (isHeadingField) {
          prompt = `TITLE REWRITE: Rewrite this title/heading using different words while keeping exactly the same number of words. Input has ${content.split(' ').filter(w => w.trim()).length} words, output must have ${content.split(' ').filter(w => w.trim()).length} words. Keep it as a catchy, concise title format - do not expand into sentences or descriptions.`;
        } else {
          prompt = `CONTENT REWRITE: Rewrite this content using different words while keeping exactly the same number of words. Input has ${content.split(' ').filter(w => w.trim()).length} words, output must have ${content.split(' ').filter(w => w.trim()).length} words. Maintain the paragraph/content format.`;
        }
      } else {
        prompt = enhancementPrompts[action as keyof typeof enhancementPrompts];
      }


      // Special handling: only use excerpt type for actual excerpt field
      const isExcerptField = sectionKey === 'excerpt';
      
      const requestBody = { 
        type: 'excerpt',  // Always use excerpt type - it returns simple text
        context: isExcerptField ? content : `${prompt}

Content to enhance:
${content}

Please provide only the enhanced content without any additional text or explanations.`,
        contentType: 'informational'
      };
      
      console.log('🔧 Enhancement request:', { 
        sectionKey, 
        action, 
        originalLength: content.length,
        originalWords: content.split(' ').length,
        requestBody 
      });

      const response = await fetch('/api/ai/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const result = await response.json();
      console.log('API response result:', result);
      
      // Handle different response formats
      let enhancedContent: string | undefined;
      if (result.content) {
        enhancedContent = result.content.trim();
      } else if (result.text) {
        enhancedContent = result.text.trim();
      } else if (result.sections && typeof result.sections === 'object') {
        // If it returns sections format, extract the content from sections
        const sectionsArray = Object.values(result.sections);
        const sectionsContent = sectionsArray
          .map(section => {
            if (typeof section === 'string') return section;
            if (section && typeof section === 'object' && section.content) return section.content;
            if (section && typeof section === 'object' && section.text) return section.text;
            return '';
          })
          .filter(content => content.trim().length > 0)
          .join('\n\n');
        enhancedContent = sectionsContent.trim();
      }
      
      if (!enhancedContent) {
        console.error('No enhanced content found in result:', result);
        throw new Error('No enhanced content received');
      }
      
      console.log('🔧 Enhancement result:', { 
        sectionKey, 
        action,
        originalLength: content.length,
        originalWords: content.split(' ').length,
        enhancedLength: enhancedContent.length,
        enhancedWords: enhancedContent.split(' ').length,
        enhancedContent: enhancedContent.substring(0, 200) + (enhancedContent.length > 200 ? '...' : '')
      });

      // Show undo option
      setShowUndo(prev => ({ ...prev, [sectionKey]: true }));
      
      // Auto-hide undo after 10 seconds
      setTimeout(() => {
        setShowUndo(prev => ({ ...prev, [sectionKey]: false }));
      }, 10000);

      toast({ 
        title: "Success", 
        description: `Section ${action}d successfully`,
        duration: 2000
      });

      return enhancedContent;

    } catch (error) {
      console.error('Enhancement error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to ${action} section`, 
        variant: "destructive" 
      });
      return content; // Return original content on error
    } finally {
      setProcessingSection(null);
    }
  };

  // Undo function
  const undoEnhancement = (sectionKey: string, originalContent: string, updateFunction: (content: string) => void) => {
    updateFunction(originalContent);
    setShowUndo(prev => ({ ...prev, [sectionKey]: false }));
    setPreviousContent(prev => {
      const newPrev = { ...prev };
      delete newPrev[sectionKey];
      return newPrev;
    });
    toast({ title: "Undone", description: "Section restored to previous version" });
  };

  // SectionEnhancementTools component
  const SectionEnhancementTools = ({ 
    content, 
    sectionKey, 
    sectionTitle,
    onUpdate 
  }: {
    content: string;
    sectionKey: string;
    sectionTitle?: string;
    onUpdate: (content: string) => void;
  }) => {
    const [localPromptText, setLocalPromptText] = useState('');
    const hasContent = content.trim().length > 0;
    const isProcessing = processingSection?.startsWith(sectionKey);
    const currentAction = processingSection?.split('-')[1];

    const handleEnhancement = async (action: 'reduce' | 'increase' | 'grammar' | 'rewrite') => {
      try {
        const enhanced = await enhanceSection(content, action, sectionKey, sectionTitle);
        if (enhanced && enhanced !== content) {
          onUpdate(enhanced);
        }
      } catch (error) {
        console.error('Enhancement error:', error);
      }
    };

    const handleToneChange = async (tone: string) => {
      try {
        const enhanced = await enhanceSection(content, 'tone', sectionKey, sectionTitle, tone);
        if (enhanced && enhanced !== content) {
          onUpdate(enhanced);
        }
      } catch (error) {
        console.error('Tone change error:', error);
      }
    };

    const handleCustomPrompt = async () => {
      if (!localPromptText) return;
      
      try {
        const enhanced = await enhanceSection(content, 'custom', sectionKey, sectionTitle, localPromptText);
        if (enhanced && enhanced !== content) {
          onUpdate(enhanced);
        }
        // Close the dialog and clear the text on success
        setCustomPromptOpen({ ...customPromptOpen, [sectionKey]: false });
        setLocalPromptText('');
      } catch (error) {
        console.error('Custom prompt error:', error);
      }
    };

    return (
      <div className="flex items-center gap-1">
        {/* Reduce */}
        <Button
          size="sm"
          variant="ghost"
          disabled={!hasContent || isProcessing}
          onClick={() => handleEnhancement('reduce')}
          className={`w-8 h-8 p-0 ${hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-reduce` ? 'animate-pulse text-amber-400' : ''
          }`}
          title="Reduce the number of words"
        >
          <MinusCircle className="w-3.5 h-3.5" />
        </Button>

        {/* Increase */}
        <Button
          size="sm"
          variant="ghost"
          disabled={!hasContent || isProcessing}
          onClick={() => handleEnhancement('increase')}
          className={`w-8 h-8 p-0 ${hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-increase` ? 'animate-pulse text-amber-400' : ''
          }`}
          title="Increase the number of words"
        >
          <PlusCircle className="w-3.5 h-3.5" />
        </Button>

        {/* Grammar Check */}
        <Button
          size="sm"
          variant="ghost"
          disabled={!hasContent || isProcessing}
          onClick={() => handleEnhancement('grammar')}
          className={`w-8 h-8 p-0 ${hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-grammar` ? 'animate-pulse text-amber-400' : ''
          }`}
          title="Grammar and sentence check"
        >
          <CheckCircle className="w-3.5 h-3.5" />
        </Button>

        {/* Rewrite */}
        <Button
          size="sm"
          variant="ghost"
          disabled={!hasContent || isProcessing}
          onClick={() => handleEnhancement('rewrite')}
          className={`w-8 h-8 p-0 ${hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-rewrite` ? 'animate-pulse text-amber-400' : ''
          }`}
          title="Complete AI rewrite this section"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        {/* Custom Prompt */}
        <Dialog 
          open={customPromptOpen[sectionKey] || false} 
          onOpenChange={(open) => setCustomPromptOpen({ ...customPromptOpen, [sectionKey]: open })}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={!hasContent || isProcessing}
              className={`w-8 h-8 p-0 ${hasContent ? 'text-gray-400 hover:text-white' : 'text-gray-600'} ${
                processingSection === `${sectionKey}-custom` ? 'animate-pulse text-amber-400' : ''
              }`}
              title="Provide a specific prompt for this section"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Custom Enhancement Prompt</DialogTitle>
              <DialogDescription className="text-gray-300">
                Provide specific instructions for how to enhance this section.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="e.g., 'Provide 10 sentences about the importance of professional photography for businesses' or 'Rewrite this in a more technical tone with statistics'"
                value={localPromptText}
                onChange={(e) => setLocalPromptText(e.target.value)}
                className="!bg-gray-900 !text-gray-200 border-gray-600 min-h-[120px]"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCustomPromptOpen({ ...customPromptOpen, [sectionKey]: false });
                  setLocalPromptText('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomPrompt}
                disabled={!localPromptText || processingSection === `${sectionKey}-custom`}
                className="bg-salmon hover:bg-salmon/90"
              >
                {processingSection === `${sectionKey}-custom` ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Prompt'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tone Selector */}
        <Select onValueChange={handleToneChange} disabled={!hasContent || isProcessing}>
          <SelectTrigger className={`w-32 h-8 ${hasContent ? 'text-gray-400' : 'text-gray-600'} ${
            processingSection === `${sectionKey}-tone` ? 'animate-pulse text-amber-400' : ''
          }`}>
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent className="min-w-36">
            {toneOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="px-4 py-2">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Undo Button */}
        {showUndo[sectionKey] && previousContent[sectionKey] && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => undoEnhancement(sectionKey, previousContent[sectionKey], onUpdate)}
            className="w-8 h-8 p-0 text-blue-400 hover:text-blue-300 ml-1"
            title="Undo last change"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Processing Indicator - Small Popup Spinner */}
        {isProcessing && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-xs text-center shadow-xl">
              <div className="relative mb-3">
                {/* Enhanced animated spinner */}
                <div className="w-10 h-10 mx-auto">
                  <div className="absolute inset-0 border-3 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-3 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-1 border-2 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium">
                {currentAction === 'reduce' && 'Reducing...'}
                {currentAction === 'increase' && 'Expanding...'}
                {currentAction === 'grammar' && 'Checking...'}
                {currentAction === 'rewrite' && 'Rewriting...'}
                {currentAction === 'tone' && 'Adjusting tone...'}
                {currentAction === 'custom' && 'Applying custom prompt...'}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category_id === categoryFilter;
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter !== 'all' && post.createdAt) {
      const postDate = new Date(post.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          matchesDate = postDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = postDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          matchesDate = postDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          matchesDate = postDate >= yearAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    console.log('🔧 HANDLE EDIT POST CALLED with post:', post);
    console.log('🔧 Setting activeView to editor');
    console.log('🔧 Setting selectedPost to:', post);
    setActiveView('editor');
    setSelectedPost(post);
    console.log('🔧 Setting editorPost data...');
    setEditorPost({
      id: post.id, // CRITICAL: Include the post ID for UPDATE operations
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      seoTitle: post.seo_title || '',
      seoDescription: post.seo_description || '',
      coverImage: post.cover_image || undefined,
      postImage1: post.post_image_1 || undefined,
      postImage2: post.post_image_2 || undefined,
      status: post.status as 'draft' | 'published' | 'scheduled',
      categoryId: post.category_id || undefined,
      authorId: post.author_id || undefined,  // Preserve original author
      publishedAt: post.published_at 
        ? new Date(post.published_at).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0] // Fallback to today if no date
    });

    // Try to parse existing content into sections (handle h2 headings)
    const content = post.content || '';

    // Extract introduction (first paragraph or lead)
    const leadMatch = content.match(/<p class="lead">([\s\S]*?)<\/p>/);
    let introduction = '';
    let remainingContent = content;

    if (leadMatch) {
      introduction = leadMatch[1].trim();
      remainingContent = content.replace(leadMatch[0], '').trim();
    } else {
      // First paragraph as introduction if no lead class
      const firstPMatch = remainingContent.match(/^<p>([\s\S]*?)<\/p>/);
      if (firstPMatch) {
        introduction = firstPMatch[1].trim();
        remainingContent = remainingContent.replace(firstPMatch[0], '').trim();
      }
    }

    // Extract pull quote if present
    const pullQuoteMatch = content.match(/<blockquote class="pull-quote">([\s\S]*?)<\/blockquote>/);
    let pullQuote = '';
    if (pullQuoteMatch) {
      pullQuote = pullQuoteMatch[1].trim();
      remainingContent = remainingContent.replace(pullQuoteMatch[0], '').trim();
    }

    // Split remaining content by h2 headings to extract sections
    const h2Pattern = /<h2>([\s\S]*?)<\/h2>/g;
    const h2Matches: RegExpExecArray[] = [];
    let h2Match;
    while ((h2Match = h2Pattern.exec(remainingContent)) !== null) {
      h2Matches.push(h2Match);
    }

    const mainSections: ContentSection[] = [];

    h2Matches.forEach((match, idx) => {
      const heading = match[1].trim();
      const headingStart = match.index || 0;
      const headingEnd = headingStart + match[0].length;

      // Find content after this h2 until next h2 or end
      const nextMatch = h2Matches[idx + 1];
      const contentEnd = nextMatch ? nextMatch.index : remainingContent.length;
      const sectionContent = remainingContent.slice(headingEnd, contentEnd).trim();

      // Clean HTML tags from content for editing
      const cleanContent = sectionContent
        .replace(/<p class="conclusion">([\s\S]*?)<\/p>/g, '')  // Remove conclusion if inside
        .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/g, '')  // Remove any blockquotes
        .replace(/<\/?p>/g, '\n\n')
        .replace(/<\/?strong>/g, '**')
        .replace(/<\/?em>/g, '*')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      mainSections.push({ heading, content: cleanContent });
    });

    // If no h2 sections found, put all content in one section
    if (mainSections.length === 0) {
      const bodyContent = remainingContent
        .replace(/<p class="conclusion">([\s\S]*?)<\/p>/g, '')
        .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/g, '')
        .replace(/<\/?p>/g, '\n\n')
        .replace(/<\/?strong>/g, '**')
        .replace(/<\/?em>/g, '*')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (bodyContent) {
        mainSections.push({ heading: '', content: bodyContent });
      }
    }

    // Extract conclusion
    const conclusionMatch = content.match(/<p class="conclusion">([\s\S]*?)<\/p>/);
    let conclusionHeading = '';
    let conclusionContent = '';

    if (conclusionMatch) {
      conclusionContent = conclusionMatch[1].trim();
      // Check if last h2 is the conclusion heading
      if (h2Matches.length > 0 && mainSections.length > 0) {
        const lastSection = mainSections[mainSections.length - 1];
        if (!lastSection.content || lastSection.content.length < 50) {
          conclusionHeading = lastSection.heading;
          mainSections.pop();
        }
      }
    }

    // Pad to 3 sections if needed
    while (mainSections.length < 3) {
      mainSections.push({ heading: '', content: '' });
    }

    // Use excerpt as subtitle (it's often used for this purpose)
    const subtitle = post.excerpt || '';

    setContentSections({
      subtitle,
      introduction,
      mainSections: mainSections.slice(0, 3), // Limit to 3
      pullQuote,
      conclusion: { heading: conclusionHeading, content: conclusionContent }
    });

    // Load featured section if it exists (check both camelCase and snake_case)
    if ((post as any).featured_section || (post as any).featuredSection) {
      setFeaturedSection((post as any).featured_section || (post as any).featuredSection);
    } else {
      setFeaturedSection({ type: 'none', config: {} });
    }

    // Load variable content if it exists
    setVariableContent((post as any).variableContent || '');

    setSlugManuallyEdited(true); // Editing existing post, preserve their slug
    setSlugStatus('idle');
    setActiveView('editor');
  };

  // Handle new post
  const handleNewPost = () => {
    setSelectedPost(null);
    setEditorPost({ 
      title: '', 
      content: '', 
      excerpt: '', 
      status: 'draft', 
      slug: '', 
      coverImage: undefined, 
      postImage1: undefined, 
      postImage2: undefined,
      publishedAt: new Date().toISOString().split('T')[0] // Today's date for new posts
    });
    setContentSections({
      subtitle: '',
      introduction: '',
      mainSections: [
        { heading: '', content: '' },
        { heading: '', content: '' },
        { heading: '', content: '' }
      ],
      pullQuote: '',
      conclusion: { heading: '', content: '' }
    });
    setFeaturedSection({
      type: 'none',
      config: {}
    });
    setVariableContent('');
    setSlugManuallyEdited(false); // New post, auto-generate slug from title
    setSlugStatus('idle');
    setActiveView('editor');
  };

  if (activeView === 'editor') {
    return (
      <div className="space-y-6 relative">
        {/* AI Generation Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 max-w-md text-center shadow-2xl">
              <div className="relative mb-6">
                {/* Animated spinner */}
                <div className="w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI is Creating Your Content</h3>
              <p className="text-gray-400 mb-4">Generating titles, content, SEO, and excerpt...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-cyan-400">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Editor Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {selectedPost ? 'Edit Post' : 'Create New Post'}
            </h2>
            <p className="text-muted-foreground">
              {selectedPost ? 'Update your blog post' : 'Create engaging content with AI assistance'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveView('posts')}
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              Back to Posts
            </Button>
            <Button
              onClick={() => {
                const postData = {
                  ...editorPost,
                  excerpt: contentSections.subtitle || editorPost.excerpt,
                  content: combineContentSections(),
                  featuredSection,
                  variableContent,
                  status: 'draft',
                  authorId: editorPost.authorId || user?.id
                };
                
                // Handle publishedAt date conversion
                if (editorPost.publishedAt) {
                  // Convert YYYY-MM-DD string to ISO string for backend
                  const date = new Date(editorPost.publishedAt + 'T12:00:00.000Z'); // Use noon to avoid timezone issues
                  postData.publishedAt = date.toISOString();
                  console.log('Setting custom publishedAt:', postData.publishedAt);
                } else {
                  console.log('No publishedAt date provided, backend will set automatically');
                }
                
                // Convert empty/undefined optional fields to null so backend clears them
                // Required fields: title, content, authorId, status - keep as-is
                const nullableFields = ['coverImage', 'postImage1', 'postImage2', 'excerpt', 'seoTitle', 'seoDescription', 'categoryId', 'variableContent'];
                nullableFields.forEach(key => {
                  const value = postData[key as keyof typeof postData];
                  if (value === undefined || value === '') {
                    (postData as any)[key] = null;
                  }
                });
                savePostMutation.mutate(postData);
              }}
              disabled={savePostMutation.isPending}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚀 SAVE & PUBLISH CLICKED');
                
                // Open progress modal
                console.log('🔄 Setting publishProgress to open...');
                setPublishProgress({
                  isOpen: true,
                  step: 'saving',
                  message: 'Saving story to database...',
                  error: null
                });

                try {
                  // Step 1: Prepare post data
                  const postData = {
                    ...editorPost,
                    excerpt: contentSections.subtitle || editorPost.excerpt,
                    content: combineContentSections(),
                    featuredSection,
                    variableContent,
                    status: 'published',
                    authorId: editorPost.authorId || user?.id
                  };
                  
                  // Handle publishedAt date conversion
                  if (editorPost.publishedAt) {
                    const date = new Date(editorPost.publishedAt + 'T12:00:00.000Z');
                    postData.publishedAt = date.toISOString();
                  }
                  
                  // Convert empty/undefined optional fields to null
                  const nullableFields = ['coverImage', 'postImage1', 'postImage2', 'excerpt', 'seoTitle', 'seoDescription', 'categoryId', 'variableContent'];
                  nullableFields.forEach(key => {
                    const value = postData[key as keyof typeof postData];
                    if (value === undefined || value === '') {
                      (postData as any)[key] = null;
                    }
                  });
                  
                  // Step 2: Save to database
                  const savedPost = selectedPost?.id
                    ? await supabaseOperations.blog.posts.update(selectedPost.id, {
                        title: postData.title,
                        slug: postData.slug,
                        content: postData.content,
                        excerpt: postData.excerpt || null,
                        cover_image: postData.coverImage || null,
                        post_image_1: postData.postImage1 || null,
                        post_image_2: postData.postImage2 || null,
                        category_id: postData.categoryId || null,
                        status: postData.status,
                        published_at: postData.publishedAt || null,
                        author_id: postData.authorId || null,
                        seo_title: postData.seoTitle || null,
                        seo_description: postData.seoDescription || null,
                        featured_section: postData.featuredSection || null,
                        variable_content: postData.variableContent || null,
                      })
                    : await supabaseOperations.blog.posts.create({
                        title: postData.title,
                        slug: postData.slug,
                        content: postData.content,
                        excerpt: postData.excerpt || null,
                        cover_image: postData.coverImage || null,
                        post_image_1: postData.postImage1 || null,
                        post_image_2: postData.postImage2 || null,
                        category_id: postData.categoryId || null,
                        status: postData.status,
                        published_at: postData.publishedAt || null,
                        author_id: postData.authorId || null,
                        seo_title: postData.seoTitle || null,
                        seo_description: postData.seoDescription || null,
                        featured_section: postData.featuredSection || null,
                        variable_content: postData.variableContent || null,
                      });
                  
                  // Update progress - generating static file
                  setPublishProgress(prev => ({
                    ...prev,
                    step: 'generating',
                    message: 'Creating static SEO file...'
                  }));

                  // Step 3: Generate static file via API endpoint
                  const postId = savedPost?.id || selectedPost?.id;
                  let staticGenerated = false;
                  if (postId) {
                    try {
                      const staticResponse = await fetch(`/api/blog/posts/${postId}/generate-static`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });

                      if (staticResponse.ok) {
                        staticGenerated = true;
                      }
                    } catch (staticError) {
                      // Don't fail the publish - static generation is optional enhancement
                      console.warn('Static generation failed (non-blocking):', staticError);
                    }
                  }

                  // Success - keep modal open until user dismisses it
                  setPublishProgress(prev => ({
                    ...prev,
                    step: 'success',
                    message: staticGenerated
                      ? 'Post published and static file created!'
                      : 'Post published successfully!'
                  }));

                  // Update local state
                  if (!selectedPost?.id && savedPost) {
                    setSelectedPost(savedPost);
                  }
                  
                } catch (error) {
                  console.error('❌ Publish error caught:', error);
                  setPublishProgress(prev => ({
                    ...prev,
                    step: 'error',
                    message: 'Failed to publish post',
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }));
                  
                  // Prevent any error propagation that might cause page refresh
                  return false;
                }
              }}
              disabled={publishProgress.isOpen}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Save & Publish
            </Button>
          </div>
        </div>

        {/* Editor Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title with AI assistance */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Post Title
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter your blog post title or topic..."
                  value={editorPost.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="!bg-white !text-gray-900 border-gray-300"
                />

                {/* AI Title Suggestions */}
                {(editorPost as any).aiTitleSuggestions?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">AI Suggestions:</Label>
                    <div className="space-y-2">
                      {((editorPost as any).aiTitleSuggestions || []).map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                          <span className="flex-1 text-gray-200">{suggestion}</span>
                          <Button
                            size="sm"
                            onClick={() => setEditorPost(prev => ({ ...prev, title: suggestion }))}
                            className="bg-salmon hover:bg-salmon/90 text-white"
                          >
                            Use This
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Editor - Structured Layout */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Article Content
                  </CardTitle>
                  <Button
                    onClick={openAiBrief}
                    disabled={isGenerating}
                    className="relative bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-medium px-5 py-2 shadow-md hover:shadow-lg transition-all duration-200 border border-purple-500/30"
                    title="Generate article content with AI"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-400 animate-pulse drop-shadow-sm" />
                    <span>
                      {isGenerating ? 'Generating...' : 'Generate article with AI'}
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subtitle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-300">
                      Subtitle
                      <span className="text-gray-500 text-xs ml-2">Expands on the title, hooks readers (8-12 words)</span>
                    </Label>
                    <SectionEnhancementTools
                      content={contentSections.subtitle}
                      sectionKey="subtitle"
                      sectionTitle="Subtitle"
                      onUpdate={(content) => setContentSections(prev => ({ ...prev, subtitle: content }))}
                    />
                  </div>
                  <Input
                    placeholder="e.g., Discover the strategy that transformed our client's Instagram presence"
                    value={contentSections.subtitle}
                    onChange={(e) => setContentSections(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                  />
                </div>

                {/* Introduction */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-300">
                      Introduction
                      <span className="text-gray-500 text-xs ml-2">2-3 sentences to hook the reader</span>
                    </Label>
                    <SectionEnhancementTools
                      content={contentSections.introduction}
                      sectionKey="introduction"
                      sectionTitle="Introduction"
                      onUpdate={(content) => setContentSections(prev => ({ ...prev, introduction: content }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Set up the value readers will get from this article..."
                    value={contentSections.introduction}
                    onChange={(e) => setContentSections(prev => ({ ...prev, introduction: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300 resize-none"
                    rows={3}
                  />
                </div>

                {/* Section 1: Pain Point */}
                <div className="border border-orange-500/30 rounded-lg p-4 space-y-3 bg-orange-500/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-orange-400 uppercase tracking-wide">Section 1: Pain Point</span>
                    <span className="text-xs text-gray-500">Target: What frustrates your audience?</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">H2 Heading (SEO)</Label>
                      <SectionEnhancementTools
                        content={contentSections.mainSections[0]?.heading || ''}
                        sectionKey="section1-heading"
                        sectionTitle="Section 1 Heading"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          mainSections: prev.mainSections.map((s, i) =>
                            i === 0 ? { ...s, heading: content } : s
                          )
                        }))}
                      />
                    </div>
                    <Input
                      placeholder="e.g., Why Most Businesses Struggle With Social Media Growth"
                      value={contentSections.mainSections[0]?.heading || ''}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        mainSections: prev.mainSections.map((s, i) =>
                          i === 0 ? { ...s, heading: e.target.value } : s
                        )
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">Content (5-6 sentences)</Label>
                      <SectionEnhancementTools
                        content={contentSections.mainSections[0]?.content || ''}
                        sectionKey="section1-content"
                        sectionTitle="Section 1 Content"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          mainSections: prev.mainSections.map((s, i) =>
                            i === 0 ? { ...s, content: content } : s
                          )
                        }))}
                      />
                    </div>
                    <Textarea
                      placeholder="Address the pain point with specific insights..."
                      value={contentSections.mainSections[0]?.content || ''}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        mainSections: prev.mainSections.map((s, i) =>
                          i === 0 ? { ...s, content: e.target.value } : s
                        )
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300 resize-none"
                      rows={5}
                    />
                  </div>
                </div>

                {/* Section 2: Solution */}
                <div className="border border-cyan-500/30 rounded-lg p-4 space-y-3 bg-cyan-500/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Section 2: Solution</span>
                    <span className="text-xs text-gray-500">Target: How-to or practical answer</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">H2 Heading (SEO)</Label>
                      <SectionEnhancementTools
                        content={contentSections.mainSections[1]?.heading || ''}
                        sectionKey="section2-heading"
                        sectionTitle="Section 2 Heading"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          mainSections: prev.mainSections.map((s, i) =>
                            i === 1 ? { ...s, heading: content } : s
                          )
                        }))}
                      />
                    </div>
                    <Input
                      placeholder="e.g., How to Build an Engaged Following in 90 Days"
                      value={contentSections.mainSections[1]?.heading || ''}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        mainSections: prev.mainSections.map((s, i) =>
                          i === 1 ? { ...s, heading: e.target.value } : s
                        )
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">Content (5-6 sentences)</Label>
                      <SectionEnhancementTools
                        content={contentSections.mainSections[1]?.content || ''}
                        sectionKey="section2-content"
                        sectionTitle="Section 2 Content"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          mainSections: prev.mainSections.map((s, i) =>
                            i === 1 ? { ...s, content } : s
                          )
                        }))}
                      />
                    </div>
                    <Textarea
                      placeholder="Provide actionable steps or solutions..."
                      value={contentSections.mainSections[1]?.content || ''}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        mainSections: prev.mainSections.map((s, i) =>
                          i === 1 ? { ...s, content: e.target.value } : s
                        )
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300 resize-none"
                      rows={5}
                    />
                  </div>
                </div>

                {/* Pull Quote - Visual Break */}
                <div className="border border-salmon/30 rounded-lg p-4 space-y-3 bg-salmon/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-salmon uppercase tracking-wide">Pull Quote</span>
                      <span className="text-xs text-gray-500">Key insight to highlight (10-15 words)</span>
                    </div>
                    <SectionEnhancementTools
                      content={contentSections.pullQuote}
                      sectionKey="pullQuote"
                      sectionTitle="Pull Quote"
                      onUpdate={(content) => setContentSections(prev => ({ ...prev, pullQuote: content }))}
                    />
                  </div>

                  <Textarea
                    placeholder="e.g., The best content doesn't just inform—it transforms how people see their possibilities."
                    value={contentSections.pullQuote}
                    onChange={(e) => setContentSections(prev => ({ ...prev, pullQuote: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300 resize-none italic"
                    rows={2}
                  />
                </div>

                {/* Section 3: Results/Benefits */}
                <div className="border border-green-500/30 rounded-lg p-4 space-y-3 bg-green-500/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-400 uppercase tracking-wide">Section 3: Results</span>
                    <span className="text-xs text-gray-500">Target: Outcomes and transformation</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">H2 Heading (SEO)</Label>
                      <SectionEnhancementTools
                        content={contentSections.mainSections[2]?.heading || ''}
                        sectionKey="section3-heading"
                        sectionTitle="Section 3 Heading"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          mainSections: prev.mainSections.map((s, i) =>
                            i === 2 ? { ...s, heading: content } : s
                          )
                        }))}
                      />
                    </div>
                    <Input
                      placeholder="e.g., The Results You Can Expect Within 30 Days"
                      value={contentSections.mainSections[2]?.heading || ''}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        mainSections: prev.mainSections.map((s, i) =>
                          i === 2 ? { ...s, heading: e.target.value } : s
                        )
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">Content (5-6 sentences)</Label>
                      <SectionEnhancementTools
                        content={contentSections.mainSections[2]?.content || ''}
                        sectionKey="section3-content"
                        sectionTitle="Section 3 Content"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          mainSections: prev.mainSections.map((s, i) =>
                            i === 2 ? { ...s, content } : s
                          )
                        }))}
                      />
                    </div>
                    <Textarea
                      placeholder="Show the transformation or benefits achieved..."
                      value={contentSections.mainSections[2]?.content || ''}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        mainSections: prev.mainSections.map((s, i) =>
                          i === 2 ? { ...s, content: e.target.value } : s
                        )
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300 resize-none"
                      rows={5}
                    />
                  </div>
                </div>

                {/* Conclusion / CTA */}
                <div className="border border-purple-500/30 rounded-lg p-4 space-y-3 bg-purple-500/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">Conclusion</span>
                    <span className="text-xs text-gray-500">Call-to-action (2-3 sentences)</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">H2 Heading</Label>
                      <SectionEnhancementTools
                        content={contentSections.conclusion.heading}
                        sectionKey="conclusion-heading"
                        sectionTitle="Conclusion Heading"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          conclusion: { ...prev.conclusion, heading: content }
                        }))}
                      />
                    </div>
                    <Input
                      placeholder="e.g., Ready to Transform Your Social Media Presence?"
                      value={contentSections.conclusion.heading}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        conclusion: { ...prev.conclusion, heading: e.target.value }
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-400 text-xs">CTA Content</Label>
                      <SectionEnhancementTools
                        content={contentSections.conclusion.content}
                        sectionKey="conclusion-content"
                        sectionTitle="Conclusion Content"
                        onUpdate={(content) => setContentSections(prev => ({
                          ...prev,
                          conclusion: { ...prev.conclusion, content }
                        }))}
                      />
                    </div>
                    <Textarea
                      placeholder="Key takeaway and clear call-to-action..."
                      value={contentSections.conclusion.content}
                      onChange={(e) => setContentSections(prev => ({
                        ...prev,
                        conclusion: { ...prev.conclusion, content: e.target.value }
                      }))}
                      className="!bg-white !text-gray-900 border-gray-300 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 Structure: Pain Point → Solution → Pull Quote → Results → CTA. AI generates SEO-optimized headings targeting search queries.
                </p>
              </CardContent>
            </Card>

            {/* Featured/Variable Section */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Featured Section
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-400">Add a special content section that appears after section 2 of your article</p>

                {/* Section Title (optional) */}
                <div>
                  <Label className="text-gray-300">Section Title (optional)</Label>
                  <Input
                    placeholder="e.g., See the Transformation, Behind the Scenes..."
                    value={featuredSection.title || ''}
                    onChange={(e) => setFeaturedSection(prev => ({
                      ...prev,
                      title: e.target.value || undefined
                    }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                  />
                </div>

                {/* Section Type Selector */}
                <div>
                  <Label className="text-gray-300">Section Type</Label>
                  <Select
                    value={featuredSection.type}
                    onValueChange={(value: any) => setFeaturedSection(prev => ({
                      type: value,
                      config: value === 'none' ? {} : prev.config
                    }))}
                  >
                    <SelectTrigger className="!bg-white !text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="image">📸 Featured Image</SelectItem>
                      <SelectItem value="video">🎥 YouTube Video</SelectItem>
                      <SelectItem value="gallery">🖼️ Image Gallery</SelectItem>
                      <SelectItem value="quote">💬 Pull Quote</SelectItem>
                      <SelectItem value="cta">🎯 Call to Action</SelectItem>
                      <SelectItem value="before-after">⚡ Before/After Slider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Configuration */}
                {featuredSection.type === 'image' && (
                  <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                    {/* Image Preview and Upload - unified dropzone */}
                    <div
                      onDragOver={handleDragOverFeatured}
                      onDragLeave={handleDragLeaveFeatured}
                      onDrop={handleDropFeatured}
                      onClick={() => document.getElementById('featured-image-input')?.click()}
                      className={`relative group border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer overflow-hidden ${
                        isDraggingFeatured
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : featuredSection.config.imageUrl
                            ? 'border-transparent hover:border-cyan-400/50'
                            : 'border-gray-600 hover:border-gray-500'
                      } ${featuredImageUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <input
                        id="featured-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFeaturedFileSelect}
                        className="hidden"
                      />
                      {featuredSection.config.imageUrl ? (
                        <>
                          <img
                            src={featuredSection.config.imageUrl}
                            alt="Featured image preview"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-white mb-2" />
                            <p className="text-sm text-white">Drop to replace</p>
                            <p className="text-xs text-gray-300 mt-1">or click to browse</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFeaturedImage(); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Remove featured image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="p-6">
                          {featuredImageUploading ? (
                            <>
                              <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
                              <p className="text-sm text-gray-300">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-gray-300">
                                {isDraggingFeatured ? 'Drop featured image here' : 'Drag & drop featured image'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                or click to browse (max 20MB)
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Browse Existing / Add New buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openImageBrowser('featured')}
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <FolderOpen className="w-4 h-4 mr-1.5" />
                        Browse
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('featured-image-input')?.click()}
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add New
                      </Button>
                    </div>

                    <div>
                      <Label className="text-gray-300 text-sm">Image URL</Label>
                      <Input
                        placeholder="/uploads/featured-image.jpg"
                        value={featuredSection.config.imageUrl || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, imageUrl: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Alt Text</Label>
                      <Input
                        placeholder="Description of the image"
                        value={featuredSection.config.imageAlt || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, imageAlt: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Caption (optional)</Label>
                      <Input
                        placeholder="Image caption or credit"
                        value={featuredSection.config.imageCaption || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, imageCaption: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Height (% of viewport)</Label>
                      <Input
                        type="number"
                        placeholder="60"
                        min="20"
                        max="100"
                        value={featuredSection.config.height || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, height: parseInt(e.target.value) || undefined }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Video Configuration */}
                {featuredSection.type === 'video' && (
                  <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <Label className="text-gray-300 text-sm">YouTube Video ID</Label>
                      <Input
                        placeholder="dQw4w9WgXcQ"
                        value={featuredSection.config.youtubeId || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, youtubeId: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Just the video ID from the YouTube URL
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Video Title</Label>
                      <Input
                        placeholder="Video title for accessibility"
                        value={featuredSection.config.youtubeTitle || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, youtubeTitle: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Quote Configuration */}
                {featuredSection.type === 'quote' && (
                  <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <Label className="text-gray-300 text-sm">Quote Text</Label>
                      <Textarea
                        placeholder="Inspirational or key quote from the content..."
                        value={featuredSection.config.quoteText || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, quoteText: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Author</Label>
                      <Input
                        placeholder="Author name"
                        value={featuredSection.config.quoteAuthor || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, quoteAuthor: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Role/Title (optional)</Label>
                      <Input
                        placeholder="CEO, Expert, etc."
                        value={featuredSection.config.quoteRole || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, quoteRole: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* CTA Configuration */}
                {featuredSection.type === 'cta' && (
                  <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <Label className="text-gray-300 text-sm">CTA Title</Label>
                      <Input
                        placeholder="Ready to Get Started?"
                        value={featuredSection.config.ctaTitle || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, ctaTitle: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Description</Label>
                      <Textarea
                        placeholder="Brief description or value proposition..."
                        value={featuredSection.config.ctaDescription || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, ctaDescription: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Button Text</Label>
                      <Input
                        placeholder="Contact Us"
                        value={featuredSection.config.ctaButtonText || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, ctaButtonText: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Button Link</Label>
                      <Input
                        placeholder="/contact"
                        value={featuredSection.config.ctaButtonLink || ''}
                        onChange={(e) => setFeaturedSection(prev => ({
                          ...prev,
                          config: { ...prev.config, ctaButtonLink: e.target.value }
                        }))}
                        className="!bg-white !text-gray-900 border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Before-After Configuration */}
                {featuredSection.type === 'before-after' && (
                  <div className="space-y-4 p-3 bg-gray-700/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Before Image Upload - unified dropzone */}
                      <div>
                        <Label className="text-gray-300 text-sm mb-2 block">Before Image</Label>
                        <div
                          className={`relative group border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer overflow-hidden ${
                            featuredSection.config.beforeImageUrl
                              ? 'border-transparent hover:border-cyan-400/50'
                              : 'border-gray-600 hover:border-cyan-400'
                          }`}
                          onDrop={(e) => handleImageDrop(e, 'before')}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => document.getElementById('before-image-input')?.click()}
                        >
                          {featuredSection.config.beforeImageUrl ? (
                            <>
                              <img
                                src={featuredSection.config.beforeImageUrl}
                                alt="Before image preview"
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <p className="text-xs text-white">Drop to replace</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeaturedSection(prev => ({
                                    ...prev,
                                    config: { ...prev.config, beforeImageUrl: '', beforeImageAlt: '' }
                                  }));
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Remove before image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="p-4">
                              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-400">Drop or click</p>
                            </div>
                          )}
                        </div>
                        <input
                          id="before-image-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'before')}
                          className="hidden"
                        />
                      </div>

                      {/* After Image Upload - unified dropzone */}
                      <div>
                        <Label className="text-gray-300 text-sm mb-2 block">After Image</Label>
                        <div
                          className={`relative group border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer overflow-hidden ${
                            featuredSection.config.afterImageUrl
                              ? 'border-transparent hover:border-cyan-400/50'
                              : 'border-gray-600 hover:border-cyan-400'
                          }`}
                          onDrop={(e) => handleImageDrop(e, 'after')}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => document.getElementById('after-image-input')?.click()}
                        >
                          {featuredSection.config.afterImageUrl ? (
                            <>
                              <img
                                src={featuredSection.config.afterImageUrl}
                                alt="After image preview"
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <p className="text-xs text-white">Drop to replace</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeaturedSection(prev => ({
                                    ...prev,
                                    config: { ...prev.config, afterImageUrl: '', afterImageAlt: '' }
                                  }));
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Remove after image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="p-4">
                              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-400">Drop or click</p>
                            </div>
                          )}
                        </div>
                        <input
                          id="after-image-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'after')}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Image Labels */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 text-sm">Before Label</Label>
                        <Input
                          placeholder="Before"
                          value={featuredSection.config.beforeLabel || ''}
                          onChange={(e) => setFeaturedSection(prev => ({
                            ...prev,
                            config: { ...prev.config, beforeLabel: e.target.value }
                          }))}
                          className="!bg-white !text-gray-900 border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">After Label</Label>
                        <Input
                          placeholder="After"
                          value={featuredSection.config.afterLabel || ''}
                          onChange={(e) => setFeaturedSection(prev => ({
                            ...prev,
                            config: { ...prev.config, afterLabel: e.target.value }
                          }))}
                          className="!bg-white !text-gray-900 border-gray-300 text-sm"
                        />
                      </div>
                    </div>

                    {/* Alt Text */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 text-sm">Before Alt Text</Label>
                        <Input
                          placeholder="Before image description"
                          value={featuredSection.config.beforeImageAlt || ''}
                          onChange={(e) => setFeaturedSection(prev => ({
                            ...prev,
                            config: { ...prev.config, beforeImageAlt: e.target.value }
                          }))}
                          className="!bg-white !text-gray-900 border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">After Alt Text</Label>
                        <Input
                          placeholder="After image description"
                          value={featuredSection.config.afterImageAlt || ''}
                          onChange={(e) => setFeaturedSection(prev => ({
                            ...prev,
                            config: { ...prev.config, afterImageAlt: e.target.value }
                          }))}
                          className="!bg-white !text-gray-900 border-gray-300 text-sm"
                        />
                      </div>
                    </div>

                    {/* Slider Settings */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-300 text-sm">Default Slider Position (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="50"
                          value={featuredSection.config.defaultPosition || ''}
                          onChange={(e) => setFeaturedSection(prev => ({
                            ...prev,
                            config: { ...prev.config, defaultPosition: parseInt(e.target.value) || 50 }
                          }))}
                          className="!bg-white !text-gray-900 border-gray-300 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">Starting position of the slider (0-100%)</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="show-labels"
                          checked={featuredSection.config.showLabels || false}
                          onChange={(e) => setFeaturedSection(prev => ({
                            ...prev,
                            config: { ...prev.config, showLabels: e.target.checked }
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="show-labels" className="text-gray-300 text-sm">Show before/after labels</Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variable Content Section */}
                <div className="border-t border-gray-600 pt-4">
                  <div>
                    <Label className="text-gray-300">Variable Content (optional)</Label>
                    <Textarea
                      placeholder="Additional custom HTML or markdown content..."
                      value={variableContent}
                      onChange={(e) => setVariableContent(e.target.value)}
                      className="!bg-white !text-gray-900 border-gray-300 resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Extra content area for custom HTML, markdown, or special formatting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hero Image */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Hero Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mb-3">Main image displayed at top of article</p>
                {/* Unified dropzone - works with or without existing image */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('hero-image-input')?.click()}
                  className={`relative group border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer overflow-hidden ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : editorPost.coverImage
                        ? 'border-transparent hover:border-cyan-400/50'
                        : 'border-gray-600 hover:border-gray-500'
                  } ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    id="hero-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {editorPost.coverImage ? (
                    <>
                      <img
                        src={editorPost.coverImage}
                        alt="Hero image preview"
                        className="w-full h-48 object-cover"
                      />
                      {/* Hover overlay for replacement */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-white mb-2" />
                        <p className="text-sm text-white">Drop to replace</p>
                        <p className="text-xs text-gray-300 mt-1">or click to browse</p>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="p-6">
                      {imageUploading ? (
                        <>
                          <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-300">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-gray-300">
                            {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            or click to browse (max 20MB)
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Browse Existing / Add New buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openImageBrowser('hero')}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <FolderOpen className="w-4 h-4 mr-1.5" />
                    Browse
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('hero-image-input')?.click()}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* BG Colors */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette className="w-5 h-5" />
                  BG Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GradientPicker
                  sectionKey={selectedPost?.id ? `blog-post-${selectedPost.id}` : `blog-post-${tempPostId}`}
                  label="Article Colors"
                  showDirection={true}
                  showTextColors={true}
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Inherits from Stories section by default. Changes auto-save.
                </p>
              </CardContent>
            </Card>

            {/* Post Images */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Post Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-400">Secondary images inserted within article content</p>

                {/* Post Image 1 */}
                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">Image 1 (after Section 1)</Label>
                  <div
                    onDragOver={handleDragOverPost1}
                    onDragLeave={handleDragLeavePost1}
                    onDrop={handleDropPost1}
                    onClick={() => document.getElementById('post-image-1-input')?.click()}
                    className={`relative group border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer overflow-hidden ${
                      isDraggingPost1
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : (editorPost as any).postImage1
                          ? 'border-transparent hover:border-cyan-400/50'
                          : 'border-gray-600 hover:border-gray-500'
                    } ${uploadingPost1 ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      id="post-image-1-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelectPost1}
                      className="hidden"
                    />
                    {(editorPost as any).postImage1 ? (
                      <>
                        <img
                          src={(editorPost as any).postImage1}
                          alt="Post image 1 preview"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                          <Upload className="w-6 h-6 text-white mb-1" />
                          <p className="text-xs text-white">Drop to replace</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removePostImage1(); }}
                          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="p-4">
                        {uploadingPost1 ? (
                          <Clock className="w-6 h-6 text-cyan-400 mx-auto animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-gray-400">Drop or click</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Browse Existing / Add New buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openImageBrowser('post1')}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs py-1"
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      Browse
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('post-image-1-input')?.click()}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs py-1"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add New
                    </Button>
                  </div>
                </div>

                {/* Post Image 2 */}
                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">Image 2 (after Section 2)</Label>
                  <div
                    onDragOver={handleDragOverPost2}
                    onDragLeave={handleDragLeavePost2}
                    onDrop={handleDropPost2}
                    onClick={() => document.getElementById('post-image-2-input')?.click()}
                    className={`relative group border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer overflow-hidden ${
                      isDraggingPost2
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : (editorPost as any).postImage2
                          ? 'border-transparent hover:border-cyan-400/50'
                          : 'border-gray-600 hover:border-gray-500'
                    } ${uploadingPost2 ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      id="post-image-2-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelectPost2}
                      className="hidden"
                    />
                    {(editorPost as any).postImage2 ? (
                      <>
                        <img
                          src={(editorPost as any).postImage2}
                          alt="Post image 2 preview"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                          <Upload className="w-6 h-6 text-white mb-1" />
                          <p className="text-xs text-white">Drop to replace</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removePostImage2(); }}
                          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="p-4">
                        {uploadingPost2 ? (
                          <Clock className="w-6 h-6 text-cyan-400 mx-auto animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-gray-400">Drop or click</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Browse Existing / Add New buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openImageBrowser('post2')}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs py-1"
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      Browse
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('post-image-2-input')?.click()}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs py-1"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add New
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Settings */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="text-white">Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Select
                    value={editorPost.status || 'draft'}
                    onValueChange={(value) => setEditorPost(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger className="!bg-white !text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Published Date */}
                <div>
                  <Label className="text-gray-300">Published Date</Label>
                  <Input
                    type="date"
                    value={editorPost.publishedAt || ''}
                    onChange={(e) => setEditorPost(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {editorPost.status === 'scheduled' ? 'Post will be published on this date' : 'Display date for this post'}
                  </p>
                </div>

                {/* Slug */}
                <div>
                  <Label className="text-gray-300">URL Slug</Label>
                  <div className="space-y-1">
                    <Input
                      placeholder="url-friendly-slug"
                      value={editorPost.slug || ''}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={`!bg-white !text-gray-900 border-gray-300 font-mono text-sm ${
                        slugStatus === 'taken' ? '!border-red-500' :
                        slugStatus === 'available' ? '!border-green-500' : ''
                      }`}
                    />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">/stories/</span>
                      <span className="text-gray-300 font-mono">{editorPost.slug || 'your-slug-here'}</span>
                      {slugStatus === 'checking' && (
                        <span className="text-yellow-400 ml-auto">Checking...</span>
                      )}
                      {slugStatus === 'available' && (
                        <span className="text-green-400 ml-auto">✓ Available</span>
                      )}
                      {slugStatus === 'taken' && (
                        <span className="text-red-400 ml-auto">✗ Already taken</span>
                      )}
                    </div>
                    {!validateSlug(editorPost.slug || '') && editorPost.slug && (
                      <p className="text-red-400 text-xs">
                        Only lowercase letters, numbers, and hyphens allowed
                      </p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-gray-300">Category</Label>
                  {isAddingCategory ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter new category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateCategory();
                            }
                            if (e.key === 'Escape') {
                              setIsAddingCategory(false);
                              setNewCategoryName('');
                            }
                          }}
                          className="!bg-white !text-gray-900 border-gray-300"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {createCategoryMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            '✓'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                          }}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          ✕
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Press Enter to create or Escape to cancel
                      </p>
                    </div>
                  ) : (
                    <Select 
                      value={editorPost.categoryId || ''}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="!bg-white !text-gray-900 border-gray-300">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        {categories.length > 0 && (
                          <div className="border-t border-gray-200 my-1" />
                        )}
                        <SelectItem value="add-new" className="text-blue-600 font-medium">
                          + Add New Category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Author */}
                <div>
                  <Label className="text-gray-300">Author</Label>
                  {(() => {
                    // Get author info - for existing posts, use the post's author, for new posts use current user
                    const isEditingPost = selectedPost?.id;
                    const authorName = isEditingPost ? (selectedPost as any)?.authorName || 'Unknown Author' : (user?.fullName || user?.email || 'Current User');
                    const authorInitial = authorName.charAt(0).toUpperCase();
                    
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border border-gray-300">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {authorInitial}
                        </div>
                        <span className="text-gray-700 text-sm font-medium">
                          {authorName}
                        </span>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedPost?.id 
                      ? 'Original author of this post (preserved when editing)'
                      : 'The logged-in user will be set as the author when the post is saved'
                    }
                  </p>
                </div>

                {/* Excerpt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-300">Excerpt</Label>
                    <SectionEnhancementTools
                      content={editorPost.excerpt || ''}
                      sectionKey="excerpt"
                      sectionTitle="Excerpt"
                      onUpdate={(content) => setEditorPost(prev => ({ ...prev, excerpt: content }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Brief description for search results and social sharing..."
                    value={editorPost.excerpt || ''}
                    onChange={(e) => setEditorPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="admin-gradient-card">
              <CardHeader>
                <CardTitle className="text-white">SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">SEO Title</Label>
                  <Input
                    placeholder="Custom SEO title (max 60 chars)"
                    value={editorPost.seoTitle || ''}
                    onChange={(e) => setEditorPost(prev => ({ ...prev, seoTitle: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                    maxLength={60}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-300">SEO Description</Label>
                    <SectionEnhancementTools
                      content={editorPost.seoDescription || ''}
                      sectionKey="seo-description"
                      sectionTitle="SEO Description"
                      onUpdate={(content) => setEditorPost(prev => ({ ...prev, seoDescription: content }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Custom meta description (max 160 chars)"
                    value={editorPost.seoDescription || ''}
                    onChange={(e) => setEditorPost(prev => ({ ...prev, seoDescription: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                    rows={3}
                    maxLength={160}
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* AI Brief Dialog */}
        <Dialog open={aiBriefOpen} onOpenChange={setAiBriefOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                AI Content Generator
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-sm">
                Generate title suggestions and structured content for your blog post.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">

              {/* Content Type Dropdown */}
              <div>
                <Label className="text-gray-300 mb-2 block">Content Type</Label>
                <Select value={contentType} onValueChange={(value: any) => handleContentTypeChange(value)}>
                  <SelectTrigger className="!bg-white !text-gray-900 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="case-study">
                      <div className="flex items-center gap-2">
                        <span>📋</span> Case Study
                      </div>
                    </SelectItem>
                    <SelectItem value="news">
                      <div className="flex items-center gap-2">
                        <span>📰</span> News / Announcement
                      </div>
                    </SelectItem>
                    <SelectItem value="informational">
                      <div className="flex items-center gap-2">
                        <span>💡</span> Informational / Tips
                      </div>
                    </SelectItem>
                    <SelectItem value="showcase">
                      <div className="flex items-center gap-2">
                        <span>🎯</span> Project Showcase
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topic / Brief */}
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Additional Instructions (optional)
                </Label>
                <Textarea
                  placeholder="how we built an auto-responder for a client that looked up an internal knowledge base and allowed customers to interact in natural language to get the exact product recommendations, resulting in 20% - 30% increase in website conversions"
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  className="!bg-white !text-gray-900 border-gray-300"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editorPost.title?.trim()
                    ? "Enter a title/topic above first, then use AI to generate matching content and title suggestions."
                    : "⚠️ Enter a title/topic above first, then use AI to generate matching content and title suggestions."}
                </p>
              </div>

              {/* Advanced Settings Collapsible */}
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="flex items-center gap-2 text-gray-300 text-sm">
                    <Settings2 className="w-4 h-4" />
                    Advanced Settings
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="p-4 space-y-4 border-t border-gray-600">
                    {loadingPrompt ? (
                      <div className="flex items-center justify-center py-4 text-gray-400">
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Loading prompt...
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label className="text-gray-300 mb-2 block text-sm">
                            System Prompt for {contentTypeLabels[contentType]}
                          </Label>
                          <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="!bg-gray-900 !text-gray-200 border-gray-600 font-mono text-xs"
                            rows={8}
                            placeholder="System prompt for content generation..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Edit this prompt to customize how the AI generates content for this type.
                          </p>
                        </div>

                        {/* Save as Default Checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={saveAsDefault}
                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-800"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white">
                            Save as default prompt for {contentTypeLabels[contentType].toLowerCase()}
                          </span>
                        </label>

                        {customPrompt !== defaultPrompt && (
                          <button
                            type="button"
                            onClick={() => setCustomPrompt(defaultPrompt)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                          >
                            Reset to default prompt
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAiBriefOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeAiGeneration}
                  disabled={isGenerating || (!editorPost.title?.trim() && !aiBrief.trim())}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Browser Dialog */}
        <Dialog open={imageBrowserOpen} onOpenChange={setImageBrowserOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                Browse Existing Images
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-sm">
                Select an image from your previously uploaded blog images
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {blogImagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="ml-3 text-gray-300">Loading images...</span>
                </div>
              ) : blogImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No existing blog images found</p>
                  <p className="text-gray-500 text-sm mt-1">Upload some images first using the "Add New" button</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                  {blogImages.map((image) => (
                    <button
                      key={image.name}
                      onClick={() => handleSelectExistingImage(image.url)}
                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs truncate">{image.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-400">
                {blogImages.length} image{blogImages.length !== 1 ? 's' : ''} available
              </p>
              <Button
                variant="outline"
                onClick={() => setImageBrowserOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Publish Progress Modal - MUST be inside editor view for visibility */}
        {publishProgress.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
              {/* X Close Button - only show on success or error */}
              {(publishProgress.step === 'success' || publishProgress.step === 'error') && (
                <button
                  onClick={() => setPublishProgress(prev => ({ ...prev, isOpen: false }))}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Modal Header with Icon */}
              <div className="flex items-center gap-3 mb-4">
                {publishProgress.step === 'saving' && (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Publishing Story...</h3>
                  </>
                )}
                {publishProgress.step === 'generating' && (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Creating SEO File...</h3>
                  </>
                )}
                {publishProgress.step === 'success' && (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Published Successfully!</h3>
                  </>
                )}
                {publishProgress.step === 'error' && (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Publishing Failed</h3>
                  </>
                )}
              </div>

              {/* Progress Steps - Show during processing */}
              {(publishProgress.step === 'saving' || publishProgress.step === 'generating') && (
                <div className="mb-6 space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${publishProgress.step === 'saving' ? 'text-blue-600' : 'text-green-600'}`}>
                    {publishProgress.step === 'saving' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Saving to database</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${publishProgress.step === 'generating' ? 'text-blue-600' : 'text-gray-400'}`}>
                    {publishProgress.step === 'generating' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span>Creating static SEO file</span>
                  </div>
                </div>
              )}

              {/* Success Content */}
              {publishProgress.step === 'success' && (
                <div className="space-y-4">
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Story saved to database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Static SEO file generated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ready for search engines!</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPublishProgress(prev => ({ ...prev, isOpen: false }));
                        setActiveView('posts');
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Return to Posts
                    </Button>
                    <Button
                      onClick={() => setPublishProgress(prev => ({ ...prev, isOpen: false }))}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Content */}
              {publishProgress.step === 'error' && (
                <div className="space-y-4">
                  <p className="text-gray-700">{publishProgress.message}</p>
                  {publishProgress.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                      {publishProgress.error}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => setPublishProgress(prev => ({ ...prev, isOpen: false }))}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Management</h2>
          <p className="text-muted-foreground">Create and manage blog posts, case studies, and stories</p>
        </div>
        <Button
          onClick={handleNewPost}
          className="bg-salmon hover:bg-salmon/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {/* Search - Reduced width */}
        <div className="w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 !bg-white !text-gray-900 border-gray-300"
            />
          </div>
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-40 !bg-white !text-gray-900 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 !bg-white !text-gray-900 border-gray-300">
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

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
          <SelectTrigger className="w-36 !bg-white !text-gray-900 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCategoryFilter('all');
              setDateFilter('all');
            }}
            className="px-3 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Posts List */}
      <div className="grid gap-4">
        {postsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading posts...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {posts.length === 0 ? "No blog posts yet. Create your first post!" : "No posts match your search."}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="admin-gradient-card hover:bg-gray-700/50 transition-colors cursor-pointer">
              <CardContent className="p-6" onClick={() => {
                console.log('📋 CARD CLICKED - calling handleEditPost with:', post);
                handleEditPost(post);
              }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors">{post.title}</h3>
                      <Badge 
                        variant={post.status === 'published' ? 'default' : 'secondary'}
                        className={`${
                          post.status === 'published' 
                            ? 'bg-green-600 text-white' 
                            : post.status === 'draft'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {post.status}
                      </Badge>
                      {post.aiGenerated && (
                        <Badge variant="outline" className="border-cyan text-cyan">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{post.excerpt}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'No date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.viewCount} views
                      </span>
                      {/* Show category if available */}
                      {post.category_id && categories.find(c => c.id === post.category_id) && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {categories.find(c => c.id === post.category_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('✏️ EDIT BUTTON CLICKED - calling handleEditPost with:', post);
                        handleEditPost(post);
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      title="Edit Post"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletePostMutation.mutate(post.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Publish Progress Modal */}
      {publishProgress.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
            {/* X Close Button - only show on success or error */}
            {(publishProgress.step === 'success' || publishProgress.step === 'error') && (
              <button
                onClick={() => setPublishProgress(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Modal Header with Icon */}
            <div className="flex items-center gap-3 mb-4">
              {publishProgress.step === 'saving' && (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Publishing Story...</h3>
                </>
              )}
              {publishProgress.step === 'generating' && (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Creating SEO File...</h3>
                </>
              )}
              {publishProgress.step === 'success' && (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Published Successfully!</h3>
                </>
              )}
              {publishProgress.step === 'error' && (
                <>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Publishing Failed</h3>
                </>
              )}
            </div>

            {/* Progress Steps - Show during processing */}
            {(publishProgress.step === 'saving' || publishProgress.step === 'generating') && (
              <div className="mb-6 space-y-2">
                <div className={`flex items-center gap-2 text-sm ${publishProgress.step === 'saving' ? 'text-blue-600' : 'text-green-600'}`}>
                  {publishProgress.step === 'saving' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Saving to database</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${publishProgress.step === 'generating' ? 'text-blue-600' : 'text-gray-400'}`}>
                  {publishProgress.step === 'generating' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span>Creating static SEO file</span>
                </div>
              </div>
            )}

            {/* Success Content */}
            {publishProgress.step === 'success' && (
              <div className="space-y-4">
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Story saved to database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Static SEO file generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready for search engines!</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPublishProgress(prev => ({ ...prev, isOpen: false }));
                      setActiveView('posts');
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Return to Posts
                  </Button>
                  <Button
                    onClick={() => setPublishProgress(prev => ({ ...prev, isOpen: false }))}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}

            {/* Error Content */}
            {publishProgress.step === 'error' && (
              <div className="space-y-4">
                <p className="text-gray-700">{publishProgress.message}</p>
                {publishProgress.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                    {publishProgress.error}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setPublishProgress(prev => ({ ...prev, isOpen: false }))}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}