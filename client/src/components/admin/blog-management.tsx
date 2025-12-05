import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  X
} from "lucide-react";
import type { BlogPost, BlogCategory, BlogTag, InsertBlogPost } from "@shared/schema";

interface BlogManagementProps {
  userRole: string;
}

export function BlogManagement({ userRole }: BlogManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState<'posts' | 'categories' | 'editor'>('posts');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all');
  
  // Editor state
  const [editorPost, setEditorPost] = useState<Partial<InsertBlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft'
  });
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Image upload state
  const [isDragging, setIsDragging] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isDraggingPost1, setIsDraggingPost1] = useState(false);
  const [isDraggingPost2, setIsDraggingPost2] = useState(false);
  const [uploadingPost1, setUploadingPost1] = useState(false);
  const [uploadingPost2, setUploadingPost2] = useState(false);

  // Fetch blog posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ['blog', 'posts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/blog/posts');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ['blog', 'categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/blog/categories');
      return response.json();
    }
  });

  // Create/update post mutation
  const savePostMutation = useMutation({
    mutationFn: async (post: Partial<InsertBlogPost>) => {
      const url = selectedPost?.id
        ? `/api/blog/posts/${selectedPost.id}`
        : '/api/blog/posts';

      const method = selectedPost?.id ? 'PUT' : 'POST';

      return apiRequest(method, url, post);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Blog post saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
      setNewPostOpen(false);
      setSelectedPost(null);
      setEditorPost({ title: '', content: '', excerpt: '', status: 'draft', slug: '', coverImage: undefined, postImage1: undefined, postImage2: undefined });
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
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save blog post", variant: "destructive" });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('DELETE', `/api/blog/posts/${postId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Blog post deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete blog post", variant: "destructive" });
    }
  });

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
      const response = await apiRequest('GET', `/api/blog/posts?search=${encodeURIComponent(slug)}&limit=100`);
      const existingPosts = await response.json();

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

    // Fetch default prompt for current content type
    setLoadingPrompt(true);
    try {
      const promptKey = encodeURIComponent(`content:${contentType}`);
      const response = await apiRequest('GET', `/api/ai/prompts/${promptKey}`);
      const data = await response.json();
      setDefaultPrompt(data.promptText || '');
      setCustomPrompt(data.promptText || '');
    } catch (error) {
      console.error('Failed to fetch default prompt:', error);
      setDefaultPrompt('');
      setCustomPrompt('');
    } finally {
      setLoadingPrompt(false);
    }
  };

  // Refetch prompt when content type changes
  const handleContentTypeChange = async (newType: typeof contentType) => {
    setContentType(newType);
    if (showAdvanced) {
      setLoadingPrompt(true);
      try {
        const promptKey = encodeURIComponent(`content:${newType}`);
        const response = await apiRequest('GET', `/api/ai/prompts/${promptKey}`);
        const data = await response.json();
        setDefaultPrompt(data.promptText || '');
        setCustomPrompt(data.promptText || '');
      } catch (error) {
        console.error('Failed to fetch prompt:', error);
      } finally {
        setLoadingPrompt(false);
      }
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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
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

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploadingPost1(true);

    try {
      // Compress client-side: post images max 800px, 80% quality
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 800, 0.80);
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

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploadingPost2(true);

    try {
      // Compress client-side: post images max 800px, 80% quality
      const originalSize = file.size;
      const compressedFile = await compressImage(file, 800, 0.80);
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

      // Use the new generate-full endpoint for parallel generation
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

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setEditorPost({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      coverImage: post.coverImage || undefined,
      postImage1: (post as any).postImage1 || undefined,
      postImage2: (post as any).postImage2 || undefined,
      status: post.status as 'draft' | 'published' | 'scheduled',
      categoryId: post.categoryId || undefined
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

    setSlugManuallyEdited(true); // Editing existing post, preserve their slug
    setSlugStatus('idle');
    setActiveView('editor');
  };

  // Handle new post
  const handleNewPost = () => {
    setSelectedPost(null);
    setEditorPost({ title: '', content: '', excerpt: '', status: 'draft', slug: '', coverImage: undefined, postImage1: undefined, postImage2: undefined });
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
              onClick={() => savePostMutation.mutate({
                ...editorPost,
                excerpt: contentSections.subtitle || editorPost.excerpt, // Map subtitle to excerpt
                content: combineContentSections(),
                status: 'draft'
              })}
              disabled={savePostMutation.isPending}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => savePostMutation.mutate({
                ...editorPost,
                excerpt: contentSections.subtitle || editorPost.excerpt, // Map subtitle to excerpt
                content: combineContentSections(),
                status: 'published'
              })}
              disabled={savePostMutation.isPending}
              className="bg-salmon hover:bg-salmon/90 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Publish
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
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    title="Generate all content with AI"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'AI Generate All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subtitle */}
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    Subtitle
                    <span className="text-gray-500 text-xs ml-2">Expands on the title, hooks readers (8-12 words)</span>
                  </Label>
                  <Input
                    placeholder="e.g., Discover the strategy that transformed our client's Instagram presence"
                    value={contentSections.subtitle}
                    onChange={(e) => setContentSections(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="!bg-white !text-gray-900 border-gray-300"
                  />
                </div>

                {/* Introduction */}
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    Introduction
                    <span className="text-gray-500 text-xs ml-2">2-3 sentences to hook the reader</span>
                  </Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">H2 Heading (SEO)</Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">Content (5-6 sentences)</Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">H2 Heading (SEO)</Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">Content (5-6 sentences)</Label>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-salmon uppercase tracking-wide">Pull Quote</span>
                    <span className="text-xs text-gray-500">Key insight to highlight (10-15 words)</span>
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
                    <Label className="text-gray-400 text-xs mb-1 block">H2 Heading (SEO)</Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">Content (5-6 sentences)</Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">H2 Heading</Label>
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
                    <Label className="text-gray-400 text-xs mb-1 block">CTA Content</Label>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  <Select 
                    value={editorPost.categoryId || ''}
                    onValueChange={(value) => setEditorPost(prev => ({ ...prev, categoryId: value }))}
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
                    </SelectContent>
                  </Select>
                </div>

                {/* Excerpt */}
                <div>
                  <Label className="text-gray-300">Excerpt</Label>
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
                  <Label className="text-gray-300">SEO Description</Label>
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
                {editorPost.coverImage ? (
                  <div className="relative group">
                    <img
                      src={editorPost.coverImage}
                      alt="Hero image preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-400 mt-2 truncate">
                      {editorPost.coverImage}
                    </p>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => document.getElementById('hero-image-input')?.click()}
                  >
                    <input
                      id="hero-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
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
                          or click to browse (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
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
                  {(editorPost as any).postImage1 ? (
                    <div className="relative group">
                      <img
                        src={(editorPost as any).postImage1}
                        alt="Post image 1 preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={removePostImage1}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOverPost1}
                      onDragLeave={handleDragLeavePost1}
                      onDrop={handleDropPost1}
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                        isDraggingPost1
                          ? 'border-orange-400 bg-orange-400/10'
                          : 'border-gray-600 hover:border-gray-500'
                      } ${uploadingPost1 ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => document.getElementById('post-image-1-input')?.click()}
                    >
                      <input
                        id="post-image-1-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelectPost1}
                        className="hidden"
                      />
                      {uploadingPost1 ? (
                        <Clock className="w-6 h-6 text-orange-400 mx-auto animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Drop or click</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Image 2 */}
                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">Image 2 (after Section 2)</Label>
                  {(editorPost as any).postImage2 ? (
                    <div className="relative group">
                      <img
                        src={(editorPost as any).postImage2}
                        alt="Post image 2 preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={removePostImage2}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOverPost2}
                      onDragLeave={handleDragLeavePost2}
                      onDrop={handleDropPost2}
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                        isDraggingPost2
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-gray-600 hover:border-gray-500'
                      } ${uploadingPost2 ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => document.getElementById('post-image-2-input')?.click()}
                    >
                      <input
                        id="post-image-2-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelectPost2}
                        className="hidden"
                      />
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
      <div className="flex gap-4">
        <div className="flex-1">
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
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-48 !bg-white !text-gray-900 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
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
            <Card key={post.id} className="admin-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{post.title}</h3>
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
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPost(post)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletePostMutation.mutate(post.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
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
    </div>
  );
}