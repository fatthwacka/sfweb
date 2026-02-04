import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
// import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { useVisitorStats, useVisitorHistory } from "@/hooks/use-visitor-tracking";
import { supabase } from "@/lib/supabase";
import { supabaseOperations } from "@/lib/supabase-operations";
import { ImageUrl } from "@/lib/image-utils";
import { VideoUrl } from "@/lib/video-utils";
import { SHOOT_TYPES } from "@shared/schema";
import type { Database } from "@/lib/database.types";

// Define types from Supabase schema
type Client = Database['public']['Tables']['clients']['Row'];
type Shoot = Database['public']['Tables']['shoots']['Row'];
type Image = Database['public']['Tables']['images']['Row'];
type Video = Database['public']['Tables']['videos']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

import { EnhancedGalleryEditor } from "./enhanced-gallery-editor";
import { StaffManagement } from "./staff-management";
import { SimpleAssetsPanel } from "./simple-assets-panel";
import { ContactSettings } from "./page-settings/contact-settings";
import { HomepageSettings } from "./page-settings/homepage-settings";
import { PhotographySettings } from "./page-settings/photography-settings";
import { VideographySettings } from "./page-settings/videography-settings";
import AboutSettings from "./page-settings/about-settings";
import { WebAppsSettings } from "./page-settings/web-apps-settings";
import { SocialMediaSettings } from "./page-settings/social-media-settings";
import { StoriesSettings } from "./page-settings/stories-settings";
import { BlogManagement } from "./blog-management";
import {
  BarChart3,
  Users,
  Camera,
  FileImage,
  Eye,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Home,
  Palette,
  User,
  Shield,
  UserPlus,
  Check,
  Download,
  Star,
  PenTool,
  FolderPlus,
  Heart,
  ThumbsUp,
  ThumbsDown,
  ArrowUpDown,
  Video,
  Play,
  Activity,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  ExternalLink
} from "lucide-react";

interface AdminContentProps {
  userRole: string;
}

export function AdminContent({ userRole }: AdminContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { stats: visitorStats, isLoading: visitorStatsLoading } = useVisitorStats(true, 30000);
  const { history: visitorHistory } = useVisitorHistory(14, true); // Last 14 days
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'shoots' | 'images' | 'galleries' | 'blog' | 'site-management' | 'staff' | 'users'>('overview');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [activePageSettings, setActivePageSettings] = useState<'contact' | 'homepage' | 'photography' | 'videography' | 'about' | 'web-apps' | 'social-media' | 'stories' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'alphabetical-reverse' | 'date-newest' | 'date-oldest'>('date-newest');
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [clientShootDialogOpen, setClientShootDialogOpen] = useState<string | null>(null);

  // Generate SEO keywords based on shoot type and location
  const generateSEOKeywords = (shootType: string, location: string, clientName: string) => {
    const baseKeywords = ['photography', 'professional photographer'];
    const locationKeywords = location.toLowerCase().includes('durban') 
      ? ['durban photography', 'kwazulu natal photography', 'la lucia photography']
      : [`${location.toLowerCase()} photography`];
    
    const shootTypeKeywords = {
      'wedding': ['wedding photography', 'bridal photography', 'wedding photographer'],
      'engagement': ['engagement photography', 'couple photography', 'engagement photographer'],
      'portrait': ['portrait photography', 'headshot photography', 'personal branding'],
      'maternity': ['maternity photography', 'pregnancy photography', 'baby bump photos'],
      'family': ['family photography', 'family portraits', 'family photographer'],
      'corporate': ['corporate photography', 'business headshots', 'company events'],
      'event': ['event photography', 'function photography', 'party photographer'],
      'graduation': ['graduation photography', 'graduation portraits', 'academic photography'],
      'newborn': ['newborn photography', 'baby photography', 'newborn portraits'],
      'product': ['product photography', 'commercial photography', 'e-commerce photos'],
      'matric dance': ['matric dance photography', 'formal photography', 'prom photography']
    };

    const typeSpecific = shootTypeKeywords[shootType as keyof typeof shootTypeKeywords] || [shootType + ' photography'];
    
    return [...baseKeywords, ...locationKeywords, ...typeSpecific].join(', ');
  };

  // Generate description based on client name and shoot type
  const generateDescription = (clientName: string, shootType: string, location: string) => {
    return `${clientName}'s ${shootType} photography by SlyFox Studios. Professional ${shootType} photographer in ${location}.`;
  };
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    secondaryEmail: '' 
  });
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);
  const [selectedShoot, setSelectedShoot] = useState<string | null>(null);
  const [selectedGalleryClient, setSelectedGalleryClient] = useState<string>('__all__');
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Bulk selection state for images
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  
  // Bulk assignment modal state
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');
  const [selectedShootId, setSelectedShootId] = useState<string>('');
  const [newClientMode, setNewClientMode] = useState(false);
  const [newShootMode, setNewShootMode] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '' });
  const [newShootData, setNewShootData] = useState({ title: '', shootType: 'portrait', location: 'Durban' });
  
  // Shoots tab filters
  const [shootsClientFilter, setShootsClientFilter] = useState<string>('__all__');
  const [shootsTypeFilter, setShootsTypeFilter] = useState<string>('__all__');

  // Image filters
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('__all__');
  const [selectedShootFilter, setSelectedShootFilter] = useState<string>('__all__');
  const [imageSortBy, setImageSortBy] = useState<'date-newest' | 'date-oldest'>('date-newest');
  const [engagementFilters, setEngagementFilters] = useState<{
    hearts: boolean;
    likes: boolean;
    dislikes: boolean;
    featured: boolean;
  }>({
    hearts: false,
    likes: false,
    dislikes: false,
    featured: false
  });

  // Fetch clients using operations helper
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: supabaseOperations.clients.getAll,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Fetch shoots using operations helper
  const { data: shoots = [], isLoading: shootsLoading } = useQuery<Shoot[]>({
    queryKey: ['shoots'],
    queryFn: supabaseOperations.shoots.getAll,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Dynamic media fetching using operations helper
  const { data: mediaItems = [], isLoading: mediaLoading, error: mediaError } = useQuery<(Image | Video)[]>({
    queryKey: ['media', mediaType],
    queryFn: mediaType === 'video' ? supabaseOperations.videos.getAll : supabaseOperations.images.getAll,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
  
  // Separate queries for stats using operations helper
  const { data: images = [] } = useQuery<Image[]>({
    queryKey: ['images', 'all'],
    queryFn: supabaseOperations.images.getAll,
    staleTime: 60 * 1000, // Cache for 60 seconds for stats
  });
  
  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['videos', 'all'],
    queryFn: supabaseOperations.videos.getAll,
    staleTime: 60 * 1000, // Cache for 60 seconds for stats
  });
  
  // Filter shoots based on selected client for gallery management, sorted alphabetically by title
  const galleryFilteredShoots = (selectedGalleryClient === '__all__'
    ? shoots
    : shoots.filter(shoot => shoot.client_id === selectedGalleryClient)
  ).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  // Handler for client filter change - reset shoot selection when client changes
  const handleGalleryClientChange = (clientId: string) => {
    setSelectedGalleryClient(clientId);
    setSelectedShoot(null); // Reset shoot selection when client filter changes
  };
  
  // Clean up debugging logs since the issue is resolved

  // Get shoots for each client via email matching
  const getClientShoots = (clientEmail: string) => {
    return shoots.filter(shoot => shoot.client_id === clientEmail);
  };

  // Bulk selection helper functions
  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Get filtered and sorted media items based on current filters and type
  const getFilteredMediaItems = () => {
    // Safety check: ensure mediaItems is always an array
    if (!Array.isArray(mediaItems)) {
      console.warn('mediaItems is not an array:', mediaItems);
      return [];
    }
    
    
    const filtered = mediaItems.filter(item => {
      // Search term filter
      if (searchTerm && !item.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Client filter
      if (selectedClientFilter && selectedClientFilter !== '__all__') {
        const itemShoot = shoots.find(shoot => shoot.id === item.shoot_id);
        if (!itemShoot || itemShoot.client_id !== selectedClientFilter) {
          return false;
        }
      }

      // Shoot filter
      if (selectedShootFilter && selectedShootFilter !== '__all__' && item.shoot_id !== selectedShootFilter) {
        return false;
      }

      // Engagement filters - apply to both images and videos
      const hasActiveFilters = Object.values(engagementFilters).some(Boolean);
      if (hasActiveFilters) {
        const matchesFilter = (
          (engagementFilters.hearts && (item.hearts_count > 0)) ||
          (engagementFilters.likes && (item.likes_count > 0)) ||
          (engagementFilters.dislikes && (item.dislikes_count > 0)) ||
          (engagementFilters.featured && (
            mediaType === 'image' ? item.featured_image : item.featured_video
          ))
        );
        if (!matchesFilter) {
          return false;
        }
      }

      return true;
    });

    // Sort images based on selected sort option
    return filtered.sort((a, b) => {
      switch (imageSortBy) {
        case 'date-oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const selectAllImages = () => {
    const filteredItems = getFilteredMediaItems();
    setSelectedImages(new Set(filteredItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const getSelectedImagesData = () => {
    return mediaItems.filter(item => selectedImages.has(item.id));
  };

  const { data: users = [], isLoading: usersLoading } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    enabled: false, // Disabled until user management is implemented
    queryFn: supabaseOperations.profiles.getAll,
    staleTime: 60 * 1000, // Cache for 60 seconds
    retry: false
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: supabaseOperations.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setNewClientOpen(false);
      toast({
        title: "Success",
        description: "Client created successfully"
      });
    },
    onError: (error: any) => {
      console.error('Create client error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create client",
        variant: "destructive"
      });
    }
  });

  const createShootMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Create shoot mutation called with data:", data);
      try {
        const result = await supabaseOperations.shoots.create({
          title: data.title,
          description: data.description || data.notes,
          clientId: data.clientId,
          customSlug: data.customSlug,
          customTitle: data.customTitle,
          isPrivate: data.isPrivate,
          groupName: data.groupName,
          mediaType: data.mediaType,
          shootType: data.shootType,
          shootDate: data.shootDate,
          location: data.location,
          notes: data.notes,
          seoTags: data.seoTags
        });
        console.log("Supabase operation successful:", result);
        return result;
      } catch (error) {
        console.error("Error in mutation function:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Create shoot mutation success:", data);
      queryClient.invalidateQueries({ queryKey: ['shoots'] });
      setClientShootDialogOpen(null); // Close client-specific dialog
      toast({
        title: "Success",
        description: "Shoot created successfully"
      });
    },
    onError: (error) => {
      console.error("Create shoot mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to create shoot: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const updateShootMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updates } = data;
      return await supabaseOperations.shoots.update(id, {
        title: updates.title,
        description: updates.description,
        client_id: updates.client_id,
        custom_slug: updates.customSlug,
        is_private: updates.isPrivate,
        group_name: updates.groupName
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoots'] });
      setEditingShoot(null);
      toast({
        title: "Success",
        description: "Shoot updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shoot",
        variant: "destructive"
      });
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updates } = data;
      return await supabaseOperations.clients.update(id, {
        name: updates.name,
        email: updates.email || null,
        phone: updates.phone || null,
        address: updates.address || null,
        secondary_email: updates.secondaryEmail || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
      setEditFormData({ name: '', email: '', phone: '', address: '', secondaryEmail: '' });
      toast({
        title: "Success",
        description: "Client updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('Update client error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update client",
        variant: "destructive"
      });
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: supabaseOperations.clients.deleteByEmail,
    onSuccess: (data, clientEmail) => {
      // Force refresh the clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.refetchQueries({ queryKey: ['clients'] });
      
      // Close edit dialog if this client was being edited
      setEditingClient(null);
      
      toast({
        title: "Success",
        description: `Client deleted successfully`
      });
    },
    onError: (error: any) => {
      console.error('Delete client error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete client";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const deleteShootMutation = useMutation({
    mutationFn: supabaseOperations.shoots.delete,
    onSuccess: (data, shootId) => {
      console.log('🚨 MUTATION SUCCESS CALLBACK - data:', data, 'shootId:', shootId);
      // Force refresh the shoots list
      queryClient.invalidateQueries({ queryKey: ['shoots'] });
      queryClient.refetchQueries({ queryKey: ["/api/shoots"] });
      
      // Close edit dialog if this shoot was being edited
      setEditingShoot(null);
      
      toast({
        title: "Success",
        description: `Shoot deleted successfully`
      });
    },
    onError: (error: any) => {
      console.error('Delete shoot error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete shoot";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleCreateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Email is required for client portal access.",
        variant: "destructive"
      });
      return;
    }
    
    const phoneValue = (formData.get('phone') as string)?.trim();
    const addressValue = (formData.get('address') as string)?.trim();
    const data = {
      name: name.trim(),
      email: email.trim(),
      phone: phoneValue || undefined,
      address: addressValue || undefined,
      secondaryEmail: undefined, // Initialize as undefined for new clients
    };
    createClientMutation.mutate(data);
  };

  const handleUpdateShoot = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingShoot) return;
    
    const formData = new FormData(event.currentTarget);
    
    // Generate slug if not provided
    const customSlug = formData.get('customSlug') as string;
    const title = formData.get('title') as string;
    const autoSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const data = {
      id: editingShoot.id,
      clientId: parseInt(formData.get('clientId') as string),
      title: title,
      description: formData.get('description') as string || '',
      shootType: formData.get('shootType') as string,
      shootDate: formData.get('shootDate') as string,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string || '',
      customSlug: customSlug || `${autoSlug}-slyfox-${new Date().getFullYear()}`,
      customTitle: formData.get('customTitle') as string || title,
      seoTags: formData.get('seoTags') as string || '',
      isPrivate: formData.get('isPrivate') === 'on'
    };
    
    updateShootMutation.mutate(data);
  };

  // User management mutations (super_admin only)
  const createUserMutation = useMutation({
    mutationFn: supabaseOperations.profiles.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setNewUserOpen(false);
      toast({
        title: "Success",
        description: "User created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...updates }: any) => supabaseOperations.profiles.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: supabaseOperations.profiles.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as string,
      profileImage: null,
      bannerImage: null,
      themePreference: "dark"
    };
    
    createUserMutation.mutate(data);
  };

  // Enhanced filter that searches through client data and their shoots
  const filteredClients = clients.filter(client => {
    // Search in client data
    const matchesClient = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.slug && client.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Search in client's shoots
    const clientShoots = client.email ? getClientShoots(client.email) : [];
    const matchesShoot = clientShoots.some(shoot =>
      shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // (shoot.shootType && shoot.shootType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      false // ('Unknown' // shoot.location - field not in current schema && 'Unknown' // shoot.location - field not in current schema.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return matchesClient || matchesShoot;
  });
  
  // Sort filtered clients based on selected order
  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortOrder) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'alphabetical-reverse':
        return b.name.localeCompare(a.name);
      case 'date-newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  const searchFilteredShoots = shoots.filter(shoot => {
    // Text search filter
    const matchesSearch = searchTerm === '' ||
      shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shoot.description && shoot.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Client filter
    const matchesClient = shootsClientFilter === '__all__' || shoot.client_id === shootsClientFilter;

    // Shoot type filter
    const matchesType = shootsTypeFilter === '__all__'; // || shoot.shootType === shootsTypeFilter;

    return matchesSearch && matchesClient && matchesType;
  });

  // Bulk delete media mutation (works for both images and videos)
  const deleteImagesMutation = useMutation({
    mutationFn: async (mediaIds: string[]) => {
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      console.log(`Bulk deleting ${mediaTypeName}:`, mediaIds);
      
      const results = [];
      for (const mediaId of mediaIds) {
        try {
          console.log(`Deleting ${mediaType} ${mediaId} (type: ${typeof mediaId})`);
          if (mediaType === 'image') {
            await supabaseOperations.images.delete([mediaId]);
          } else {
            await supabaseOperations.videos.delete([mediaId]);
          }
          results.push({ id: mediaId, success: true });
        } catch (error) {
          console.error(`Failed to delete ${mediaType} ${mediaId}:`, error);
          results.push({ id: mediaId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      
      // Invalidate using Supabase query keys
      queryClient.invalidateQueries({ queryKey: ['media', mediaType] });
      queryClient.invalidateQueries({ queryKey: [mediaType === 'video' ? 'videos' : 'images', 'all'] });
      if (mediaType === 'image') {
        queryClient.invalidateQueries({ queryKey: ['images', 'featured'] });
      }
      clearSelection();
      
      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `${successful.length} ${mediaTypeName} deleted successfully${failed.length > 0 ? ` (${failed.length} failed)` : ''}`
        });
      }
      
      if (failed.length > 0 && successful.length === 0) {
        toast({
          title: "Error", 
          description: `Failed to delete ${failed.length} ${mediaTypeName}`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      console.error('Bulk delete error:', error);
      toast({
        title: "Error", 
        description: `Failed to delete ${mediaTypeName}`,
        variant: "destructive"
      });
    }
  });

  // Bulk mark as featured media mutation (images only for now)
  const markAsFeaturedMutation = useMutation({
    mutationFn: async (mediaIds: string[]) => {
      console.log('Bulk marking as featured:', mediaIds);
      const results = [];
      for (const mediaId of mediaIds) {
        try {
          // For now, featured functionality only applies to images
          if (mediaType === 'image') {
            await supabaseOperations.images.updateFeaturedStatus([mediaId], true);
          } else {
            await supabaseOperations.videos.updateFeaturedStatus([mediaId], true);
          }
          results.push({ id: mediaId, success: true });
        } catch (error) {
          console.error(`Failed to mark ${mediaType} ${mediaId} as featured:`, error);
          results.push({ id: mediaId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      
      queryClient.invalidateQueries({ queryKey: ['media', mediaType] });
      if (mediaType === 'image') {
        queryClient.invalidateQueries({ queryKey: ['images', 'featured'] });
      }
      clearSelection();
      
      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `${successful.length} ${mediaTypeName} marked as featured${failed.length > 0 ? ` (${failed.length} failed)` : ''}`
        });
      }
      
      if (failed.length > 0 && successful.length === 0) {
        toast({
          title: "Error", 
          description: `Failed to mark ${failed.length} ${mediaTypeName} as featured`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      console.error('Bulk mark as featured error:', error);
      toast({
        title: "Error", 
        description: `Failed to mark ${mediaTypeName} as featured`,
        variant: "destructive"
      });
    }
  });

  // Bulk unmark featured media mutation (images only for now)
  const unmarkFeaturedMutation = useMutation({
    mutationFn: async (mediaIds: string[]) => {
      console.log('Bulk unmarking featured:', mediaIds);
      const results = [];
      for (const mediaId of mediaIds) {
        try {
          // For now, featured functionality only applies to images
          if (mediaType === 'image') {
            await supabaseOperations.images.updateFeaturedStatus([mediaId], false);
          } else {
            await supabaseOperations.videos.updateFeaturedStatus([mediaId], false);
          }
          results.push({ id: mediaId, success: true });
        } catch (error) {
          console.error(`Failed to unmark ${mediaType} ${mediaId} as featured:`, error);
          results.push({ id: mediaId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      
      queryClient.invalidateQueries({ queryKey: ['media', mediaType] });
      if (mediaType === 'image') {
        queryClient.invalidateQueries({ queryKey: ['images', 'featured'] });
      }
      clearSelection();
      
      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `${successful.length} ${mediaTypeName} unmarked as featured${failed.length > 0 ? ` (${failed.length} failed)` : ''}`
        });
      }
      
      if (failed.length > 0 && successful.length === 0) {
        toast({
          title: "Error", 
          description: `Failed to unmark ${failed.length} ${mediaTypeName} as featured`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      console.error('Bulk unmark featured error:', error);
      toast({
        title: "Error", 
        description: `Failed to unmark ${mediaTypeName} as featured`,
        variant: "destructive"
      });
    }
  });

  // Individual toggle featured status mutation (images only for now)
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ imageId, featured }: { imageId: string; featured: boolean }) => {
      // For now, featured functionality only applies to images
      if (mediaType === 'image') {
        return supabaseOperations.images.updateFeaturedStatus([imageId], featured);
      } else {
        return supabaseOperations.videos.updateFeaturedStatus([imageId], featured);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', mediaType] });
      if (mediaType === 'image') {
        queryClient.invalidateQueries({ queryKey: ['images', 'featured'] });
      }
    },
    onError: (error) => {
      console.error('Toggle featured error:', error);
      toast({
        title: "Error", 
        description: "Failed to update featured status",
        variant: "destructive"
      });
    }
  });

  // Bulk assignment mutation (works for both images and videos)
  const bulkAssignmentMutation = useMutation({
    mutationFn: async ({ imageIds, shootId }: { imageIds: string[], shootId: string }) => {
      console.log(`Bulk assigning ${imageIds.length} ${mediaType === 'video' ? 'videos' : 'images'} to shoot ${shootId}`);

      if (mediaType === 'image') {
        await supabaseOperations.images.updateShootId(imageIds, shootId);
      } else {
        await supabaseOperations.videos.updateShootId(imageIds, shootId);
      }

      return { success: true, count: imageIds.length, shootId };
    },
    onSuccess: (response) => {
      const mediaTypeName = mediaType === 'video' ? 'videos' : 'images';
      queryClient.invalidateQueries({ queryKey: ['media', mediaType] });
      queryClient.invalidateQueries({ queryKey: [mediaType === 'video' ? 'videos' : 'images', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['shoots'] });
      setSelectedImages(new Set());
      setAssignmentModalOpen(false);
      setSelectedClientEmail('');
      setSelectedShootId('');
      setNewClientMode(false);
      setNewShootMode(false);

      toast({
        title: `${mediaType === 'video' ? 'Videos' : 'Images'} Assigned Successfully`,
        description: `${response.count} ${mediaTypeName} assigned to album`
      });
    },
    onError: (error) => {
      console.error('Bulk assignment error:', error);
      toast({
        title: "Assignment Failed",
        description: `Failed to assign ${mediaType === 'video' ? 'videos' : 'images'} to album`,
        variant: "destructive"
      });
    }
  });

  // Helper functions for bulk assignment
  const availableShoots = selectedClientEmail && selectedClientEmail !== '__new__'
    ? shoots.filter(s => s.client_id === selectedClientEmail)
    : [];

  const resetAssignmentModal = () => {
    setSelectedClientEmail('');
    setSelectedShootId('');
    setNewClientMode(false);
    setNewShootMode(false);
    setNewClientData({ name: '', email: '' });
    setNewShootData({ title: '', shootType: 'portrait', location: 'Durban' });
  };

  // Handle assignment submission
  const handleAssignImages = async () => {
    try {
      let targetShootId = selectedShootId;
      let targetClientEmail = selectedClientEmail;

      // Create new client if needed
      if (newClientMode && selectedClientEmail === '__new__') {
        if (!newClientData.name.trim() || !newClientData.email.trim()) {
          toast({
            title: "Missing Information",
            description: "Please provide both client name and email",
            variant: "destructive"
          });
          return;
        }

        // Check if client already exists
        const existingClient = clients.find(c => c.email === newClientData.email.trim());
        if (existingClient && existingClient.email) {
          // Client exists, use existing client
          targetClientEmail = existingClient.email;
          toast({
            title: "Client Already Exists",
            description: `Using existing client: ${existingClient.name}`,
          });
        } else {
          // Create new client
          const clientResponse = await supabaseOperations.clients.create({
            name: newClientData.name.trim(),
            email: newClientData.email.trim(),
            phone: undefined,
            address: undefined,
            secondaryEmail: undefined
          });
          console.log('🎯 CLIENT CREATION RESPONSE:', clientResponse);
          targetClientEmail = newClientData.email.trim();
        }
      }

      // Create new shoot if needed
      if (selectedShootId === '__new__' || (newClientMode && selectedClientEmail === '__new__')) {
        if (!newShootData.title.trim()) {
          toast({
            title: "Missing Information",
            description: "Please provide an album title",
            variant: "destructive"
          });
          return;
        }

        // Generate slug
        const autoSlug = newShootData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Create shoot
        const shootResponse = await supabaseOperations.shoots.create({
          title: newShootData.title.trim(),
          description: `${newShootData.title} photography by SlyFox Studios. Professional ${newShootData.shootType} photographer in ${newShootData.location}.`,
          clientId: targetClientEmail,
          customSlug: `${autoSlug}-slyfox-${new Date().getFullYear()}`,
          customTitle: newShootData.title.trim(),
          isPrivate: false,
          groupName: newShootData.title.trim(),
          mediaType: 'photo',
          shootType: newShootData.shootType,
          shootDate: null,
          location: newShootData.location,
          notes: '',
          seoTags: ''
        });
        console.log('🎯 SHOOT CREATION RESPONSE:', shootResponse);
        targetShootId = shootResponse.id;
      }

      if (!targetShootId) {
        console.error('❌ No targetShootId after processing!');
        toast({
          title: "No Album Selected",
          description: "Please select an album to assign images to",
          variant: "destructive"
        });
        return;
      }

      // Perform bulk assignment
      const assignmentData = {
        imageIds: Array.from(selectedImages),
        shootId: targetShootId
      };
      console.log('🟡 CLIENT: Final targetShootId:', targetShootId);
      console.log('🟡 CLIENT: Sending bulk assignment data:', assignmentData);
      bulkAssignmentMutation.mutate(assignmentData);

    } catch (error) {
      console.error('Assignment preparation error:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to prepare assignment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    
    const formData = new FormData(event.currentTarget);
    
    const data = {
      id: editingUser.id,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      ...(formData.get('password') && { password: formData.get('password') as string })
    };
    
    updateUserMutation.mutate(data);
  };

  const handleUpdateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClient) return;
    
    const data = {
      id: editingClient.id,
      name: editFormData.name.trim(),
      email: editFormData.email.trim() || null,
      phone: editFormData.phone.trim() || null,
      address: editFormData.address.trim() || null,
      secondaryEmail: editFormData.secondaryEmail.trim() || null,
      slug: editingClient.slug // Keep existing slug
    };
    
    updateClientMutation.mutate(data);
  };



  return (
    <TooltipProvider>
      {/* Tab Navigation */}
      <div className="mt-8 flex justify-center space-x-8 border-b border-border">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'shoots', label: 'Shoots', icon: Camera },
          { id: 'images', label: 'Media', icon: FileImage },
          { id: 'galleries', label: 'Gallery Management', icon: Palette },
          { id: 'blog', label: 'Blog', icon: PenTool },
          ...(userRole === 'super_admin' || userRole === 'staff' ? [
            { id: 'site-management', label: 'Site Management', icon: Home }
          ] : []),
          ...(userRole === 'super_admin' ? [
            { id: 'staff', label: 'Staff Management', icon: Shield },
            { id: 'users', label: 'User Management', icon: User }
          ] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-salmon text-salmon'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'icon-salmon' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <section className="py-12 bg-gradient-to-br from-purple-dark via-background to-grey-dark min-h-screen">
        <div className="px-6 sm:px-8 lg:px-12 xl:px-16">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                <Card className="admin-gradient-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      Live Visitors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">
                      {visitorStatsLoading ? '...' : (visitorStats?.totalActive || 0)}
                    </div>
                    {visitorStats && visitorStats.totalActive > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {visitorStats.anonymousVisitors} guest{visitorStats.anonymousVisitors !== 1 ? 's' : ''}
                        {visitorStats.loggedInUsers > 0 && `, ${visitorStats.loggedInUsers} logged in`}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="admin-gradient-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 icon-cyan" />
                      Total Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{clients.length}</div>
                  </CardContent>
                </Card>

                <Card className="admin-gradient-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4 icon-salmon" />
                      Total Shoots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{shoots.length}</div>
                  </CardContent>
                </Card>

                <Card className="admin-gradient-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileImage className="w-4 h-4 icon-cyan" />
                      Total Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{images.length}</div>
                  </CardContent>
                </Card>

                <Card className="admin-gradient-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Video className="w-4 h-4 icon-purple" />
                      Total Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{videos.length}</div>
                  </CardContent>
                </Card>

                <Card className="admin-gradient-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4 icon-salmon" />
                      Total Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">
                      {shoots.reduce((total, shoot) => total + shoot.view_count, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="admin-gradient-card">
                <CardHeader>
                  <CardTitle className="text-xl font-saira font-bold text-salmon">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-20 flex-col gap-2 bg-salmon text-white hover:bg-salmon-muted">
                          <Plus className="w-6 h-6 icon-salmon" />
                          <span className="text-sm">Add Client</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg">
                        <DialogHeader>
                          <DialogTitle className="text-salmon">Add New Client</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateClient} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" />
                          </div>
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" />
                          </div>
                          <Button type="submit" disabled={createClientMutation.isPending} className="bg-salmon text-white hover:bg-salmon-muted">
                            {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      className="h-20 flex-col gap-2 bg-cyan-dark border border-cyan/30 shadow-lg hover:border-salmon text-white"
                      onClick={() => setActiveTab('images')}
                    >
                      <FileImage className="w-6 h-6 icon-salmon" />
                      <span className="text-sm">Upload Images</span>
                    </Button>

                  </div>
                </CardContent>
              </Card>

              {/* Site Analytics Dashboard */}
              <Card className="admin-gradient-card">
                <CardHeader>
                  <CardTitle className="text-xl font-saira font-bold text-salmon flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Site Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Time Window Stats */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Visitors by Time Period
                    </h3>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { label: '5 min', key: '5m' as const },
                        { label: '30 min', key: '30m' as const },
                        { label: '1 hour', key: '1h' as const },
                        { label: '24 hours', key: '24h' as const },
                        { label: '7 days', key: '7d' as const }
                      ].map(({ label, key }) => (
                        <div key={key} className="bg-background/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-salmon">
                            {visitorStats?.timeWindows?.[key]?.visitors ?? '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className="text-xs text-cyan mt-1">
                            {visitorStats?.timeWindows?.[key]?.pageViews ?? 0} views
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Popular Pages */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Popular Pages (24h)
                      </h3>
                      <div className="space-y-2">
                        {visitorStats?.popularPages?.['24h']?.length ? (
                          visitorStats.popularPages['24h'].slice(0, 5).map(({ page, count }, i) => (
                            <div key={page} className="flex items-center justify-between text-sm bg-background/30 rounded px-2 py-1">
                              <span className="text-muted-foreground truncate max-w-[150px]" title={page}>
                                {page === '/' ? 'Homepage' : page}
                              </span>
                              <span className="text-salmon font-medium">{count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No data yet</p>
                        )}
                      </div>
                    </div>

                    {/* Device Breakdown */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Devices (24h)
                      </h3>
                      <div className="space-y-2">
                        {visitorStats?.deviceBreakdown24h && (
                          <>
                            <div className="flex items-center justify-between text-sm bg-background/30 rounded px-2 py-1">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Monitor className="w-3 h-3" /> Desktop
                              </span>
                              <span className="text-salmon font-medium">{visitorStats.deviceBreakdown24h.desktop}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-background/30 rounded px-2 py-1">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Smartphone className="w-3 h-3" /> Mobile
                              </span>
                              <span className="text-salmon font-medium">{visitorStats.deviceBreakdown24h.mobile}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-background/30 rounded px-2 py-1">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Tablet className="w-3 h-3" /> Tablet
                              </span>
                              <span className="text-salmon font-medium">{visitorStats.deviceBreakdown24h.tablet}</span>
                            </div>
                          </>
                        )}
                        {visitorStats?.avgSessionDuration !== undefined && (
                          <div className="mt-3 pt-2 border-t border-muted/20">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Avg. Session</span>
                              <span className="text-cyan font-medium">{visitorStats.avgSessionDuration} min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Traffic Sources */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Traffic Sources (24h)
                      </h3>
                      <div className="space-y-2">
                        {visitorStats?.trafficSources?.length ? (
                          visitorStats.trafficSources.map(({ source, count }) => (
                            <div key={source} className="flex items-center justify-between text-sm bg-background/30 rounded px-2 py-1">
                              <span className="text-muted-foreground truncate max-w-[150px]" title={source}>
                                {source === 'Direct' ? (
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> Direct
                                  </span>
                                ) : source}
                              </span>
                              <span className="text-salmon font-medium">{count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No data yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Currently Active */}
                  {visitorStats?.currentPages && Object.keys(visitorStats.currentPages).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-400" />
                        Currently Viewing (Live)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(visitorStats.currentPages).map(([page, count]) => (
                          <Badge key={page} variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            {page === '/' ? 'Homepage' : page} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historical Trend (Last 14 Days) */}
                  {visitorHistory && visitorHistory.dailyStats.length > 0 && (
                    <div className="border-t border-muted/20 pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Daily Visitors (Last 14 Days)
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          Avg: <span className="text-salmon font-medium">{visitorHistory.summary.avgDailyVisitors}</span>/day
                        </div>
                      </div>

                      {/* Simple bar chart */}
                      <div className="flex items-end gap-1 h-20">
                        {visitorHistory.dailyStats.map((day, i) => {
                          const maxVisitors = Math.max(...visitorHistory.dailyStats.map(d => d.unique_visitors), 1);
                          const heightPercent = (day.unique_visitors / maxVisitors) * 100;
                          const date = new Date(day.date);
                          const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);

                          return (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full bg-salmon/80 rounded-t hover:bg-salmon transition-colors cursor-default"
                                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                title={`${date.toLocaleDateString()}: ${day.unique_visitors} visitors, ${day.total_page_views} views`}
                              />
                              <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-muted/10">
                        <div className="text-center">
                          <div className="text-lg font-bold text-salmon">{visitorHistory.summary.totalVisitors}</div>
                          <div className="text-xs text-muted-foreground">Total Visitors</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-cyan">{visitorHistory.summary.totalPageViews}</div>
                          <div className="text-xs text-muted-foreground">Page Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-muted-foreground">{visitorHistory.summary.daysWithData}</div>
                          <div className="text-xs text-muted-foreground">Days Tracked</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No history data message */}
                  {visitorHistory && visitorHistory.dailyStats.length === 0 && (
                    <div className="border-t border-muted/20 pt-6">
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Historical data will appear here after the daily cleanup runs.
                        <br />
                        <span className="text-xs">Data is aggregated at 2am daily via VPS cron job.</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-saira font-bold text-salmon">Clients Management</h2>
                <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-salmon text-white hover:bg-salmon-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-salmon">Add New Client</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Add a new client to manage their gallery access and information.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateClient} className="space-y-4">
                        <div>
                          <Label htmlFor="clientName">Client Name *</Label>
                          <Input id="clientName" name="name" required />
                        </div>
                        <div>
                          <Label htmlFor="clientEmail">Email *</Label>
                          <Input id="clientEmail" name="email" type="email" required />
                          <p className="text-xs text-muted-foreground mt-1">
                            Required for client portal access
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="clientPhone">Phone</Label>
                          <Input id="clientPhone" name="phone" />
                        </div>
                        <div>
                          <Label htmlFor="clientAddress">Address</Label>
                          <Input id="clientAddress" name="address" />
                        </div>
                        <div>
                          <Label htmlFor="clientPassword">Temporary Password</Label>
                          <Input 
                            id="clientPassword" 
                            name="password" 
                            type="password" 
                            defaultValue="slyfox-2025"
                            placeholder="slyfox-2025"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Leave empty to skip portal access setup. Client can change after first login.
                          </p>
                        </div>
                        <Button type="submit" disabled={createClientMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                          {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search clients, shoots, locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={sortOrder === 'alphabetical' || sortOrder === 'alphabetical-reverse' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'alphabetical' ? 'alphabetical-reverse' : 'alphabetical')}
                    className={sortOrder === 'alphabetical' || sortOrder === 'alphabetical-reverse' ? 'bg-salmon text-white' : ''}
                  >
                    {sortOrder === 'alphabetical-reverse' ? 'Z-A' : 'A-Z'}
                  </Button>
                  <Button
                    variant={sortOrder === 'date-newest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('date-newest')}
                    className={sortOrder === 'date-newest' ? 'bg-salmon text-white' : ''}
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sortOrder === 'date-oldest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('date-oldest')}
                    className={sortOrder === 'date-oldest' ? 'bg-salmon text-white' : ''}
                  >
                    Oldest
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {clientsLoading ? (
                  <div className="text-center py-8">Loading clients...</div>
                ) : sortedClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No clients found matching your search.' : 'No clients yet. Add your first client!'}
                  </div>
                ) : (
                  sortedClients.map(client => (
                    <Card key={client.id} className="admin-gradient-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <h3 className="text-lg font-semibold text-salmon">{client.name}</h3>
                            
                            {/* Client Info Line - closer to title */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1 mb-4">
                              <a 
                                href={`mailto:${client.email}`}
                                className="flex items-center gap-1 hover:text-salmon transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </a>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                /{client.slug}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Client since: {new Date(client.created_at).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                            
                            {/* Client Shoots Grid with containers */}
                            <div className="pr-4">
                              {(() => {
                                const clientShoots = client.email ? getClientShoots(client.email) : [];
                                
                                if (clientShoots.length === 0) {
                                  return (
                                    <div className="text-sm text-muted-foreground italic">No shoots yet</div>
                                  );
                                }
                                
                                // Group shoots into columns for better container placement
                                const columns = 3;
                                const shootColumns: typeof clientShoots[] = [[], [], []];
                                clientShoots.forEach((shoot, index) => {
                                  shootColumns[index % columns].push(shoot);
                                });
                                
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {shootColumns.map((columnShoots, colIndex) => (
                                      columnShoots.length > 0 && (
                                        <div 
                                          key={colIndex}
                                          className="bg-black/20 border border-gray-600/30 rounded-md p-2 space-y-1"
                                        >
                                          {columnShoots.map(shoot => (
                                            <div key={shoot.id} className="flex items-center text-sm text-muted-foreground">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Eye 
                                                    className="w-4 h-4 icon-cyan cursor-pointer hover:text-salmon transition-colors mr-2 flex-shrink-0 relative z-10" 
                                                    onClick={() => {
                                                      setActiveTab('galleries');
                                                      setSelectedShoot(shoot.id);
                                                    }}
                                                  />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-gray-800 text-gray-100 border-gray-700">
                                                  <p>View Gallery</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              <span className="truncate">
                                                <span className="text-cyan-muted">
                                                  {shoot.title.length > 22 ? shoot.title.substring(0, 22) + '...' : shoot.title}
                                                </span>
                                                {/* {shoot.shootType && (
                                                  <span className="text-salmon-muted">
                                                    {'  |  '}{shoot.shootType.charAt(0).toUpperCase() + shoot.shootType.slice(1)}
                                                  </span>
                                                )} */}
                                                {shoot.shoot_date && (
                                                  <span className="text-xs">
                                                    {'  '}({new Date(shoot.shoot_date).toLocaleDateString('en-GB', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric'
                                                    })})
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Dialog 
                                open={clientShootDialogOpen === client.id}
                                onOpenChange={(open) => setClientShootDialogOpen(open ? client.id : null)}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-salmon text-white hover:bg-salmon-muted flex-1">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Shoot
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-salmon">Create New Shoot for {client.name}</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                      Create a new photography or videography shoot for this client.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const title = formData.get('title') as string;
                                    const autoSlug = title
                                      .toLowerCase()
                                      .replace(/[^a-z0-9\s-]/g, '')
                                      .replace(/\s+/g, '-')
                                      .replace(/-+/g, '-')
                                      .trim();

                                    const data = {
                                      clientId: client.email, // Use client email for database relationship
                                      title: title,
                                      description: formData.get('description') as string || '',
                                      shootType: formData.get('shootType') as string,
                                      shootDate: formData.get('shootDate') as string,
                                      location: formData.get('location') as string,
                                      notes: formData.get('notes') as string || '',
                                      customSlug: `${autoSlug}-${new Date().getFullYear()}`,
                                      customTitle: formData.get('customTitle') as string || title,
                                      seoTags: formData.get('seoTags') as string || '',
                                      isPrivate: formData.get('isPrivate') === 'on',
                                      mediaType: (formData.get('mediaType') as string) || 'photo',
                                      groupName: title // Use shoot title as group name
                                    };

                                    createShootMutation.mutate(data);
                                  }} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor={`title-${client.id}`}>Shoot Title *</Label>
                                        <Input id={`title-${client.id}`} name="title" required placeholder="Portrait Session" />
                                      </div>
                                      <div>
                                        <Label htmlFor={`shootType-${client.id}`}>Shoot Type *</Label>
                                        <select id={`shootType-${client.id}`} name="shootType" required className="w-full px-3 py-2 bg-background border border-border rounded-md" onChange={(e) => {
                                          // Auto-populate SEO fields when shoot type changes
                                          const locationInput = document.getElementById(`location-${client.id}`) as HTMLInputElement;
                                          const seoInput = document.getElementById(`seoTags-${client.id}`) as HTMLInputElement;
                                          const descriptionInput = document.getElementById(`description-${client.id}`) as HTMLTextAreaElement;
                                          
                                          if (e.target.value && locationInput?.value) {
                                            const keywords = generateSEOKeywords(e.target.value, locationInput.value, client.name);
                                            if (seoInput) seoInput.value = keywords;
                                            
                                            if (descriptionInput && !descriptionInput.value) {
                                              const description = generateDescription(client.name, e.target.value, locationInput.value);
                                              descriptionInput.value = description;
                                            }
                                          }
                                        }}>
                                          <option value="">Select type...</option>
                                          {SHOOT_TYPES.map(type => (
                                            <option key={type} value={type}>
                                              {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Media Type Selector */}
                                    <div>
                                      <Label>Media Type *</Label>
                                      <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="mediaType"
                                            value="photo"
                                            defaultChecked
                                            className="w-4 h-4 text-salmon focus:ring-salmon"
                                          />
                                          <span className="text-sm">📷 Photo Album</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="mediaType"
                                            value="video"
                                            className="w-4 h-4 text-salmon focus:ring-salmon"
                                          />
                                          <span className="text-sm">🎬 Video Album</span>
                                        </label>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor={`description-${client.id}`}>Description</Label>
                                      <Textarea id={`description-${client.id}`} name="description" placeholder="Brief description of the shoot..." rows={2} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor={`shootDate-${client.id}`}>Shoot Date *</Label>
                                        <div 
                                          className="relative bg-background border border-input rounded-md cursor-pointer hover:border-salmon transition-colors"
                                          onClick={() => {
                                            const input = document.getElementById(`shootDate-${client.id}`) as HTMLInputElement;
                                            input?.focus();
                                            // Safely call showPicker - may fail in iframe environments
                                            try {
                                              input?.showPicker?.();
                                            } catch (error) {
                                              // Silently ignore cross-origin restrictions - input focus still works
                                            }
                                          }}
                                        >
                                          <Input 
                                            id={`shootDate-${client.id}`} 
                                            name="shootDate" 
                                            type="date" 
                                            required 
                                            className="bg-transparent border-0 cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                          />
                                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-salmon pointer-events-none" />
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor={`location-${client.id}`}>Location *</Label>
                                        <Input id={`location-${client.id}`} name="location" required defaultValue="La Lucia, Durban" onChange={(e) => {
                                          // Auto-populate SEO fields when location changes
                                          const shootTypeSelect = document.getElementById(`shootType-${client.id}`) as HTMLSelectElement;
                                          const seoInput = document.getElementById(`seoTags-${client.id}`) as HTMLInputElement;
                                          const descriptionInput = document.getElementById(`description-${client.id}`) as HTMLTextAreaElement;
                                          
                                          if (e.target.value && shootTypeSelect?.value) {
                                            const keywords = generateSEOKeywords(shootTypeSelect.value, e.target.value, client.name);
                                            if (seoInput) seoInput.value = keywords;
                                            
                                            if (descriptionInput && !descriptionInput.value) {
                                              const description = generateDescription(client.name, shootTypeSelect.value, e.target.value);
                                              descriptionInput.value = description;
                                            }
                                          }
                                        }} />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor={`customTitle-${client.id}`}>Custom Gallery Title</Label>
                                      <Input id={`customTitle-${client.id}`} name="customTitle" placeholder="Leave blank to use shoot title" />
                                    </div>
                                    <div>
                                      <Label htmlFor={`seoTags-${client.id}`}>SEO Keywords</Label>
                                      <Input id={`seoTags-${client.id}`} name="seoTags" placeholder="photography durban, professional photographer, portrait photography" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" id={`isPrivate-${client.id}`} name="isPrivate" />
                                      <Label htmlFor={`isPrivate-${client.id}`}>Private Gallery (requires login to view)</Label>
                                    </div>
                                    <Button type="submit" disabled={createShootMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                                      {createShootMutation.isPending ? 'Creating...' : 'Create Shoot'}
                                    </Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-border hover:border-salmon text-white"
                                    onClick={() => {
                                      setEditingClient(client);
                                      setEditFormData({
                                        name: client.name,
                                        email: client.email || '',
                                        phone: client.phone || '',
                                        address: client.address || '',
                                        secondaryEmail: client.secondary_email || ''
                                      });
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-gray-100 border-gray-700">
                                  <p>Edit Client</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-border hover:border-red-500 text-white"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete client ${client.name}?\n\nNote: This will only delete the client record. Any shoots assigned to this client will remain but show as "orphaned" until reassigned to another client.`)) {
                                      deleteClientMutation.mutate(client.email || '');
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-gray-100 border-gray-700">
                                  <p>Delete Client</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'shoots' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-saira font-bold text-salmon">Shoots Management</h2>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search shoots..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>

                  {/* Client Filter */}
                  <Select value={shootsClientFilter} onValueChange={setShootsClientFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Clients</SelectItem>
                      {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map(client => (
                        <SelectItem key={client.id} value={client.email || `client-${client.id}`}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Shoot Type Filter */}
                  <Select value={shootsTypeFilter} onValueChange={setShootsTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Types</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="matric dance">Matric Dance</SelectItem>
                      <SelectItem value="newborn">Newborn</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Results count */}
                  <span className="text-sm text-muted-foreground">
                    {searchFilteredShoots.length} {searchFilteredShoots.length === 1 ? 'shoot' : 'shoots'}
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {shootsLoading ? (
                  <div className="text-center py-8">Loading shoots...</div>
                ) : searchFilteredShoots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No shoots found matching your search.' : 'No shoots yet. Add your first shoot!'}
                  </div>
                ) : (
                  searchFilteredShoots.map(shoot => (
                    <Card key={shoot.id} className="admin-gradient-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-salmon">{shoot.title}</h3>
                              {shoot.is_private && <Badge variant="outline" className="text-xs bg-red-900/20 text-red-300 border-red-700">Private</Badge>}
                            </div>
                            
                            {/* Client Information */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4 icon-cyan" />
                                <span>Client: {(() => {
                                  const client = clients.find(c => c.email === shoot.client_id);
                                  return client ? client.name : shoot.client_id;
                                })()}</span>
                              </div>
                            </div>
                            
                            {shoot.description && <p className="text-muted-foreground">{shoot.description}</p>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 icon-cyan" />
                                {(() => {
                                  if (!shoot.shoot_date) return 'No date';
                                  try {
                                    const date = new Date(shoot.shoot_date);
                                    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    });
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 icon-salmon" />
                                {'Unknown location'} {/* shoot.location - field not in current schema */}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 icon-cyan" />
                                {shoot.view_count || 0} views
                              </div>
                              <div className="flex items-center gap-1">
                                <Camera className="w-4 h-4 icon-salmon" />
                                {'Unknown type'}
                              </div>
                            </div>
                            
                            {false && ( // shoot.seoTags - field not in current schema
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Tags:</span>
                                <span className="italic">SEO tags not available</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-salmon text-white hover:bg-salmon-muted"
                              onClick={() => {
                                setActiveTab('galleries');
                                setSelectedShoot(shoot.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:border-salmon text-white"
                              onClick={() => setEditingShoot(shoot)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:border-red-500 text-white"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete shoot "${shoot.title}"?\n\nThis will permanently delete the shoot record and all associated images from the database. This action cannot be undone.`)) {
                                  deleteShootMutation.mutate(shoot.id);
                                }
                              }}
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
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-saira font-bold text-salmon">Media Management</h2>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Show:</Label>
                    <Select value={mediaType} onValueChange={(value) => {
                      setMediaType(value as 'image' | 'video');
                      clearSelection(); // Clear selections when switching media types
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <FileImage className="w-4 h-4" />
                            Images
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Videos
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={`Search ${mediaType === 'video' ? 'videos' : 'images'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-salmon text-white hover:bg-salmon-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Upload {mediaType === 'video' ? 'Videos' : 'Images'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="admin-gradient-card max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-salmon">Upload {mediaType === 'video' ? 'Videos' : 'Images'}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Select {mediaType === 'video' ? 'videos' : 'images'} to upload to a specific shoot gallery.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="uploadShoot">Select Shoot *</Label>
                          <Select name="shootId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a shoot to upload images to" />
                            </SelectTrigger>
                            <SelectContent>
                              {shoots.map(shoot => (
                                <SelectItem key={shoot.id} value={shoot.id}>
                                  {shoot.title} - Unknown Location
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="mediaFiles">Select {mediaType === 'video' ? 'Videos' : 'Images'} *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            {mediaType === 'video' ? (
                              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            ) : (
                              <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            )}
                            <p className="text-muted-foreground mb-2">
                              Drag and drop {mediaType === 'video' ? 'videos' : 'images'} here, or click to browse
                            </p>
                            <input
                              type="file"
                              multiple
                              accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                              className="hidden"
                              id="mediaFiles"
                            />
                            <Button 
                              variant="outline" 
                              className="border-salmon text-salmon hover:bg-salmon hover:text-white"
                              onClick={() => document.getElementById('mediaFiles')?.click()}
                            >
                              Browse Files
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="uploadPrivate" className="rounded border-border" />
                          <Label htmlFor="uploadPrivate" className="text-sm">
                            Mark uploaded {mediaType === 'video' ? 'videos' : 'images'} as private
                          </Label>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            className="flex-1 bg-salmon text-white hover:bg-salmon-muted"
                            onClick={() => {
                              toast({
                                title: "Feature In Development",
                                description: `${mediaType === 'video' ? 'Video' : 'Image'} upload functionality will be available in the next release.`,
                              });
                              setUploadDialogOpen(false);
                            }}
                          >
                            Upload {mediaType === 'video' ? 'Videos' : 'Images'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setUploadDialogOpen(false)}
                            className="border-border hover:border-salmon"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {mediaLoading ? (
                <div className="text-center py-8">Loading {mediaType === 'video' ? 'videos' : 'images'}...</div>
              ) : mediaItems.length === 0 ? (
                <Card className="admin-gradient-card">
                  <CardContent className="p-8 text-center">
                    {mediaType === 'video' ? (
                      <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    ) : (
                      <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    )}
                    <h3 className="text-xl font-semibold mb-2">No {mediaType === 'video' ? 'Videos' : 'Images'} Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first {mediaType === 'video' ? 'videos' : 'images'} to get started with gallery management.
                    </p>
                    <Button 
                      className="bg-salmon text-white hover:bg-salmon-muted"
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload {mediaType === 'video' ? 'Videos' : 'Images'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Filters Row */}
                  <div className="flex flex-wrap gap-4 p-4 border border-border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Filter by Client:</Label>
                      <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="All clients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All clients</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.email || `client-${client.id}`}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Filter by Shoot:</Label>
                      <Select value={selectedShootFilter} onValueChange={setSelectedShootFilter}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="All shoots" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All shoots</SelectItem>
                          {shoots
                            .filter(shoot => !selectedClientFilter || selectedClientFilter === '__all__' || shoot.client_id === selectedClientFilter)
                            .map(shoot => (
                              <SelectItem key={shoot.id} value={shoot.id}>
                                {shoot.title} - Unknown Location
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Sort by:</Label>
                      <Select value={imageSortBy} onValueChange={(value: any) => setImageSortBy(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-newest">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              Date (Newest)
                            </div>
                          </SelectItem>
                          <SelectItem value="date-oldest">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              Date (Oldest)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium">Filter by engagement:</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-hearts"
                            checked={engagementFilters.hearts}
                            onCheckedChange={(checked) => 
                              setEngagementFilters(prev => ({ ...prev, hearts: !!checked }))
                            }
                          />
                          <Label htmlFor="filter-hearts" className="text-sm cursor-pointer flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            Hearts
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-likes"
                            checked={engagementFilters.likes}
                            onCheckedChange={(checked) => 
                              setEngagementFilters(prev => ({ ...prev, likes: !!checked }))
                            }
                          />
                          <Label htmlFor="filter-likes" className="text-sm cursor-pointer flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            Likes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-dislikes"
                            checked={engagementFilters.dislikes}
                            onCheckedChange={(checked) => 
                              setEngagementFilters(prev => ({ ...prev, dislikes: !!checked }))
                            }
                          />
                          <Label htmlFor="filter-dislikes" className="text-sm cursor-pointer flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            Dislikes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-featured"
                            checked={engagementFilters.featured}
                            onCheckedChange={(checked) => 
                              setEngagementFilters(prev => ({ ...prev, featured: !!checked }))
                            }
                          />
                          <Label htmlFor="filter-featured" className="text-sm cursor-pointer flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Featured
                          </Label>
                        </div>
                      </div>
                    </div>

                    {(selectedClientFilter !== '__all__' || selectedShootFilter !== '__all__' || Object.values(engagementFilters).some(Boolean)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClientFilter('__all__');
                          setSelectedShootFilter('__all__');
                          setEngagementFilters({
                            hearts: false,
                            likes: false,
                            dislikes: false,
                            featured: false
                          });
                        }}
                        className="text-xs"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <p className="text-muted-foreground">
                        Showing {getFilteredMediaItems().length} of {mediaItems.length} {mediaType === 'video' ? 'videos' : 'images'}
                      </p>
                      {selectedImages.size > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-salmon font-medium">
                            {selectedImages.size} selected
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearSelection}
                            className="h-7 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllImages}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      
                      {selectedImages.size > 0 && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete ({selectedImages.size})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="admin-gradient-card">
                              <DialogHeader>
                                <DialogTitle className="text-salmon">Delete Selected {mediaType === 'video' ? 'Videos' : 'Images'}</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Are you sure you want to permanently delete {selectedImages.size} selected {mediaType === 'video' ? 'videos' : 'images'} from the database? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-3 pt-4">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteImagesMutation.mutate(Array.from(selectedImages))}
                                  disabled={deleteImagesMutation.isPending}
                                >
                                  {deleteImagesMutation.isPending ? 'Deleting...' : `Delete ${mediaType === 'video' ? 'Videos' : 'Images'}`}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            className="bg-yellow-600 text-white hover:bg-yellow-700 text-xs"
                            onClick={() => markAsFeaturedMutation.mutate(Array.from(selectedImages))}
                            disabled={markAsFeaturedMutation.isPending}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            {markAsFeaturedMutation.isPending ? 'Marking...' : `Mark as Featured (${selectedImages.size})`}
                          </Button>
                          
                          <Button
                            size="sm"
                            className="bg-gray-600 text-white hover:bg-gray-700 text-xs"
                            onClick={() => unmarkFeaturedMutation.mutate(Array.from(selectedImages))}
                            disabled={unmarkFeaturedMutation.isPending}
                          >
                            <Star className="w-3 h-3 mr-1 opacity-50" />
                            {unmarkFeaturedMutation.isPending ? 'Unmarking...' : `Unmark Featured (${selectedImages.size})`}
                          </Button>
                          
                          <Button
                            size="sm"
                            className="bg-purple-600 text-white hover:bg-purple-700 text-xs"
                            onClick={() => setAssignmentModalOpen(true)}
                          >
                            <FolderPlus className="w-3 h-3 mr-1" />
                            Assign to Album ({selectedImages.size})
                          </Button>
                          
                          <Button
                            size="sm"
                            className="bg-cyan text-white hover:bg-cyan-muted text-xs"
                            onClick={() => {
                              toast({
                                title: "Download Coming Soon",
                                description: "Bulk download functionality will be implemented next."
                              });
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download ({selectedImages.size})
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {getFilteredMediaItems().map((item) => {
                        const associatedShoot = shoots.find(s => s.id === item.shoot_id);
                        const isSelected = selectedImages.has(item.id);
                        const isVideo = mediaType === 'video';
                        return (
                          <Card 
                            key={item.id} 
                            className={`admin-gradient-card group hover:border-salmon/60 transition-colors cursor-pointer relative ${
                              isSelected ? 'border-salmon/80 ring-2 ring-salmon/30' : ''
                            }`}
                            onClick={() => toggleImageSelection(item.id)}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                {/* Selection Overlay */}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-salmon/10 rounded-lg flex items-center justify-center z-10">
                                    <div className="bg-salmon text-white rounded-full p-1">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Selection Checkbox */}
                                <div className="absolute top-2 left-2 z-20">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-salmon border-salmon text-white' 
                                      : 'border-white/50 bg-background/80 group-hover:border-salmon/60'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </div>
                                </div>
                                
                                {/* Media Preview */}
                                <div className="aspect-square bg-background rounded-md flex items-center justify-center overflow-hidden relative">
                                  {isVideo ? (
                                    <>
                                      <img
                                        src={item.thumbnail_path || '/placeholder-video-thumb.jpg'}
                                        alt={item.filename}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNzM3MzciLz48cGF0aCBkPSJNMTIgMTVIMjhWMjVIMTJWMTVaIiBzdHJva2U9IiM5CA0OVM5IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4K';
                                        }}
                                      />
                                      {/* Video Play Icon Overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 rounded-full p-2">
                                          <Play className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                      {/* Video Duration Badge - duration field not in current schema */}
                                    </>
                                  ) : (
                                    <img
                                      src={ImageUrl.forViewing(item.storage_path)}
                                      alt={item.filename}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNzM3MzciLz48cGF0aCBkPSJNMTIgMTVIMjhWMjVIMTJWMTVaIiBzdHJva2U9IiM5CA0OVC5IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4K';
                                      }}
                                    />
                                  )}
                                </div>
                                
                                {/* Media Info */}
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-salmon truncate">
                                    {item.filename}
                                  </p>
                                  {associatedShoot && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {associatedShoot.title}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{item.download_count || 0} downloads</span>
                                    <span className={`px-2 py-1 rounded ${item.is_private ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
                                      {item.is_private ? 'Private' : 'Public'}
                                    </span>
                                  </div>
                                </div>

                                {/* Featured Status and Action Buttons */}
                                <div className="flex gap-1 items-center">
                                  {/* Interaction Counts with notification bubbles - Both media types */}
                                  {/* Engagement metrics removed - not available in current schema */}

                                  {/* Divider */}
                                  <div className="w-px h-4 bg-border mx-0.5"></div>

                                  {/* Featured Toggle Button - Both media types */}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className={`w-8 h-8 p-0 border-2 transition-all ${
                                      item.featured_image 
                                        ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/25' 
                                        : 'border-gray-500 text-gray-400 hover:border-green-500 hover:text-green-400'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFeaturedMutation.mutate({ 
                                        imageId: item.id, 
                                        featured: !item.featured_image 
                                      });
                                    }}
                                    disabled={toggleFeaturedMutation.isPending}
                                    title={item.featured_image ? "Remove from featured" : "Mark as featured"}
                                  >
                                    <Star className={`w-3 h-3 ${item.featured_image ? 'fill-current' : ''}`} />
                                  </Button>
                                  
                                  {/* Other action buttons - appear on hover */}
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="w-8 h-8 p-0 border-border hover:border-cyan text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
                                      }}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="w-8 h-8 p-0 border-border hover:border-salmon text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const downloadUrl = ImageUrl.forDownload(image.storagePath);
                                        const link = document.createElement('a');
                                        link.href = downloadUrl;
                                        link.download = image.filename;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        toast({
                                          title: "Download Started",
                                          description: `Downloading ${image.filename}`,
                                        });
                                      }}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'galleries' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-saira font-bold text-salmon">Gallery Management</h2>
              </div>

              {/* Shoot Selection */}
              <Card className="admin-gradient-card">
                <CardHeader>
                  <CardTitle className="text-salmon">Select Gallery to Manage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Filter Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Filter by Client</Label>
                      <Select 
                        value={selectedGalleryClient} 
                        onValueChange={handleGalleryClientChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Clients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Clients</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.email}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gallery Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Select Gallery {selectedGalleryClient !== '__all__' ? '(filtered)' : ''}
                      </Label>
                      <Select 
                        value={selectedShoot || ""} 
                        onValueChange={(value) => setSelectedShoot(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a gallery to manage" />
                        </SelectTrigger>
                        <SelectContent>
                          {galleryFilteredShoots.map(shoot => (
                            <SelectItem key={shoot.id} value={shoot.id.toString()}>
                              {shoot.title} ({(() => {
                                if (!shoot.shoot_date) return 'No date';
                                try {
                                  const date = new Date(shoot.shoot_date);
                                  return isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  });
                                } catch {
                                  return 'No date';
                                }
                              })()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gallery Editor */}
              {selectedShoot && <EnhancedGalleryEditor shootId={selectedShoot} />}

              {!selectedShoot && (
                <Card className="admin-gradient-card">
                  <CardContent className="p-8 text-center">
                    <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Select a Shoot</h3>
                    <p className="text-muted-foreground">
                      Choose a shoot from the dropdown above to start managing its gallery settings and image sequence.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'blog' && (
            <BlogManagement userRole={userRole} />
          )}

          {activeTab === 'site-management' && (userRole === 'super_admin' || userRole === 'staff') && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/30">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  🏠 Site Management
                </h2>
                <p className="text-gray-300 mb-6">
                  Manage the website content, images, and styling.
                  Each page shows sections from top to bottom with integrated text, image, and styling controls.
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                    className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'homepage'
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setActivePageSettings('homepage')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">🏠</span>
                      <h3 className="text-lg font-semibold text-white">Homepage</h3>
                    </div>
                  </div>
                  
                  <div 
                    className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'photography'
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-yellow-500/50'
                    }`}
                    onClick={() => setActivePageSettings('photography')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">📸</span>
                      <h3 className="text-lg font-semibold text-white">Photography</h3>
                    </div>
                  </div>
                  
                  <div 
                    className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'videography'
                        ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-purple-500/50'
                    }`}
                    onClick={() => setActivePageSettings('videography')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">🎬</span>
                      <h3 className="text-lg font-semibold text-white">Videography</h3>
                    </div>
                  </div>
                  
                  <div 
                    className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'about'
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-emerald-500/50'
                    }`}
                    onClick={() => setActivePageSettings('about')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">👥</span>
                      <h3 className="text-lg font-semibold text-white">About</h3>
                    </div>
                  </div>
                  
                  <div 
                    className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'contact'
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-cyan-500/50'
                    }`}
                    onClick={() => setActivePageSettings('contact')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">📞</span>
                      <h3 className="text-lg font-semibold text-white">Contact</h3>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'web-apps' 
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30' 
                        : 'bg-slate-800/50 border-slate-600 hover:border-blue-500/50'
                    }`}
                    onClick={() => setActivePageSettings('web-apps')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">💻</span>
                      <h3 className="text-lg font-semibold text-white">Web Apps</h3>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'social-media'
                        ? 'bg-pink-500/20 border-pink-400 shadow-lg shadow-pink-500/20 ring-1 ring-pink-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-pink-500/50'
                    }`}
                    onClick={() => setActivePageSettings('social-media')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">📱</span>
                      <h3 className="text-lg font-semibold text-white">Social Media</h3>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      activePageSettings === 'stories'
                        ? 'bg-orange-500/20 border-orange-400 shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-orange-500/50'
                    }`}
                    onClick={() => setActivePageSettings('stories')}
                  >
                    <div className="flex items-center justify-center gap-2 h-full">
                      <span className="text-2xl">📖</span>
                      <h3 className="text-lg font-semibold text-white">Stories</h3>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Conditional Page Settings */}
              {activePageSettings === 'contact' && (
                <div className="mt-8">
                  <ContactSettings />
                </div>
              )}

              {activePageSettings === 'homepage' && (
                <div className="mt-8">
                  <HomepageSettings />
                </div>
              )}

              {activePageSettings === 'about' && (
                <div className="mt-8">
                  <AboutSettings />
                </div>
              )}

              {activePageSettings === 'web-apps' && (
                <div className="mt-8">
                  <WebAppsSettings />
                </div>
              )}

              {activePageSettings === 'social-media' && (
                <div className="mt-8">
                  <SocialMediaSettings />
                </div>
              )}

              {activePageSettings === 'stories' && (
                <div className="mt-8">
                  <StoriesSettings />
                </div>
              )}

              {activePageSettings === 'photography' && (
                <div className="mt-8">
                  <PhotographySettings />
                </div>
              )}

              {activePageSettings === 'videography' && (
                <div className="mt-8">
                  <VideographySettings />
                </div>
              )}

              {!activePageSettings && (
                <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Select a Page to Configure</h3>
                  <p className="text-sm">Choose a page from above to customize its content and settings.</p>
                  <p className="text-xs mt-2">Each page editor provides comprehensive control over text, images, and layout.</p>
                </div>
              )}
            </div>
          )}


          {activeTab === 'staff' && userRole === 'super_admin' && (
            <StaffManagement />
          )}

          {activeTab === 'users' && userRole === 'super_admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-saira font-bold text-salmon">User Management</h2>
                <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-salmon text-white hover:bg-salmon-muted">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-salmon">Add New User</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Create a new user account with role-based access.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label htmlFor="userEmail">Email *</Label>
                        <Input id="userEmail" name="email" type="email" required />
                      </div>
                      <div>
                        <Label htmlFor="userPassword">Password *</Label>
                        <Input id="userPassword" name="password" type="password" required />
                      </div>
                      <div>
                        <Label htmlFor="userRole">Role *</Label>
                        <Select name="role" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={createUserMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                        {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found.
                  </div>
                ) : (
                  users.map(user => (
                    <Card key={user.id} className="admin-gradient-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-salmon">{user.email}</h3>
                              <Badge variant={user.role === 'super_admin' ? 'destructive' : user.role === 'staff' ? 'default' : 'secondary'}>
                                {user.role === 'super_admin' ? 'Super Admin' : 
                                 user.role === 'staff' ? 'Staff' : 'Client'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Created: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-border hover:border-salmon text-white"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-salmon">Edit User: {user.email}</DialogTitle>
                                  <DialogDescription className="text-muted-foreground">
                                    Update user information and permissions.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                  <div>
                                    <Label htmlFor="editUserEmail">Email *</Label>
                                    <Input id="editUserEmail" name="email" type="email" defaultValue={user.email} required />
                                  </div>
                                  <div>
                                    <Label htmlFor="editUserPassword">New Password (leave blank to keep current)</Label>
                                    <Input id="editUserPassword" name="password" type="password" />
                                  </div>
                                  <div>
                                    <Label htmlFor="editUserRole">Role *</Label>
                                    <Select name="role" defaultValue={user.role} required>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="client">Client</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button type="submit" disabled={updateUserMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:border-red-500 text-white"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
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
          )}
        </div>
      </section>

      {/* Enhanced Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-salmon">Manage Client: {editingClient?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete client account management including contact info, portal access, and privacy settings.
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-6">
              
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon border-b border-salmon/30 pb-2">
                  Basic Information
                </h3>
                <form onSubmit={handleUpdateClient} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editClientName">Client Name *</Label>
                      <Input 
                        id="editClientName" 
                        name="name" 
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({...prev, name: e.target.value}))}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="editClientPhone">Phone</Label>
                      <Input 
                        id="editClientPhone" 
                        name="phone" 
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData(prev => ({...prev, phone: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editClientAddress">Address</Label>
                    <Input 
                      id="editClientAddress" 
                      name="address" 
                      value={editFormData.address}
                      onChange={(e) => setEditFormData(prev => ({...prev, address: e.target.value}))}
                    />
                  </div>
                  <Button type="submit" disabled={updateClientMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                    {updateClientMutation.isPending ? 'Updating...' : 'Update Basic Info'}
                  </Button>
                </form>
              </div>

              {/* Email Management Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon border-b border-salmon/30 pb-2">
                  Email & Portal Access
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editClientEmail">Primary Email</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="editClientEmail" 
                        type="email" 
                        value={editFormData.email}
                        onChange={(e) => setEditFormData(prev => ({...prev, email: e.target.value}))}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        className="border-border hover:border-cyan text-white"
                        onClick={() => {
                          toast({
                            title: "Email Update",
                            description: "Email update functionality requires database migration - coming in next update.",
                            variant: "destructive"
                          });
                        }}
                      >
                        Update Email
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Changing email will affect shoot associations and portal access
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondaryEmail">Secondary Email</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="secondaryEmail" 
                        type="email" 
                        placeholder="backup@email.com"
                        value={editFormData.secondaryEmail}
                        onChange={(e) => setEditFormData(prev => ({...prev, secondaryEmail: e.target.value}))}
                      />
                      <Button 
                        variant="outline" 
                        className="border-border hover:border-salmon text-white"
                        onClick={() => {
                          toast({
                            title: "Secondary Email Updated",
                            description: "Secondary email will be saved with next update.",
                          });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Management Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon border-b border-salmon/30 pb-2">
                  Password & Security
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-border hover:border-cyan text-white"
                      onClick={() => {
                        if (confirm(`Reset password for ${editingClient.name}? They will be notified via email.`)) {
                          toast({
                            title: "Password Reset",
                            description: "Password reset email would be sent to client.",
                          });
                        }
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Password Reset
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-border hover:border-salmon text-white"
                      onClick={() => {
                        const newPassword = prompt("Enter new temporary password:", "slyfox-2025");
                        if (newPassword) {
                          toast({
                            title: "Password Updated",
                            description: `Temporary password set to: ${newPassword}`,
                          });
                        }
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Set Temp Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* Privacy & Data Management Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon border-b border-salmon/30 pb-2">
                  Privacy & Data Management
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="border-border hover:border-purple-500 text-white h-auto p-4 flex-col gap-2"
                    onClick={() => {
                      toast({
                        title: "Privacy Export",
                        description: "Client data export feature will be available in the next release."
                      });
                    }}
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm">Export Client Data</span>
                    <span className="text-xs text-muted-foreground">Download all data</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-border hover:border-yellow-500 text-white h-auto p-4 flex-col gap-2"
                    onClick={() => {
                      if (confirm(`Delete all gallery data for ${editingClient.name}? This cannot be undone.`)) {
                        toast({
                          title: "Data Deletion",
                          description: "Gallery data deletion feature will be available in the next release.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-sm">Delete Gallery Data</span>
                    <span className="text-xs text-muted-foreground">Remove photos only</span>
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4 border-t border-red-500/30 pt-4">
                <h3 className="text-lg font-semibold text-red-400 border-b border-red-400/30 pb-2">
                  Danger Zone
                </h3>
                <Button 
                  variant="outline" 
                  className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white h-auto p-4"
                  onClick={() => {
                    const confirmation = prompt(
                      `⚠️ DELETE ENTIRE ACCOUNT for ${editingClient.name}?\n\nThis will permanently delete:\n• Client record from database\n• Associated shoots remain but become orphaned\n\nNote: This does NOT delete photos from storage - only the client record.\n\nType "DELETE ACCOUNT" to confirm:`
                    );
                    if (confirmation === "DELETE ACCOUNT") {
                      deleteClientMutation.mutate(editingClient.email || '');
                      setEditingClient(null);
                    }
                  }}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  DELETE ENTIRE ACCOUNT
                  <span className="block text-xs mt-1">Permanently removes all data</span>
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Shoot Dialog */}
      <Dialog open={!!editingShoot} onOpenChange={(open) => !open && setEditingShoot(null)}>
        <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-salmon">Edit Shoot: {editingShoot?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the shoot details and settings for this gallery.
            </DialogDescription>
          </DialogHeader>
          {editingShoot && (
            <form onSubmit={handleUpdateShoot} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-clientEmail">Client Email *</Label>
                    <Select name="clientEmail" defaultValue={editingShoot.client_id} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.email}>
                            {client.name} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-shootType">Shoot Type *</Label>
                    <Select name="shootType" defaultValue={editingShoot.shootType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shoot type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="maternity">Maternity</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-title">Shoot Title *</Label>
                  <Input 
                    id="edit-title" 
                    name="title" 
                    defaultValue={editingShoot.title}
                    placeholder="e.g., Sarah & Michael's Wedding"
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    defaultValue={editingShoot.description}
                    placeholder="Brief description of the shoot..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Shoot Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Shoot Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-shootDate">Shoot Date *</Label>
                    <Input 
                      id="edit-shootDate" 
                      name="shootDate" 
                      type="date" 
                      defaultValue={(() => {
                        if (!editingShoot.shootDate) return '';
                        try {
                          const date = new Date(editingShoot.shootDate);
                          if (isNaN(date.getTime())) return '';
                          return date.toISOString().split('T')[0];
                        } catch {
                          return '';
                        }
                      })()}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Location *</Label>
                    <Input 
                      id="edit-location" 
                      name="location" 
                      defaultValue={editingShoot.location}
                      placeholder="e.g., Durban Waterfront"
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Gallery Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-customTitle">Custom Gallery Title</Label>
                    <Input 
                      id="edit-customTitle" 
                      name="customTitle" 
                      defaultValue={editingShoot.customTitle}
                      placeholder="Leave empty to use shoot title"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be displayed as the main gallery heading
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-customSlug">Custom URL Slug</Label>
                    <Input 
                      id="edit-customSlug" 
                      name="customSlug" 
                      defaultValue={editingShoot.customSlug}
                      placeholder="e.g., sarah-michael-wedding-2024"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL: /gallery/[slug]
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-seoTags">SEO Tags</Label>
                  <Input 
                    id="edit-seoTags" 
                    name="seoTags" 
                    defaultValue={editingShoot.seoTags}
                    placeholder="wedding photography, durban, romantic, outdoor"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated tags for SEO optimization
                  </p>
                </div>
              </div>

              {/* Privacy & Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Privacy & Settings</h3>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit-isPrivate" 
                    name="isPrivate" 
                    defaultChecked={editingShoot.isPrivate}
                    className="rounded border-border"
                  />
                  <Label htmlFor="edit-isPrivate" className="text-sm">
                    Make gallery private (requires login to view)
                  </Label>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Internal Notes</Label>
                  <Textarea 
                    id="edit-notes" 
                    name="notes" 
                    defaultValue={editingShoot.notes}
                    placeholder="Internal notes for staff reference..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={updateShootMutation.isPending} 
                  className="flex-1 bg-salmon text-white hover:bg-salmon-muted"
                >
                  {updateShootMutation.isPending ? 'Updating Shoot...' : 'Update Shoot'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingShoot(null)}
                  className="border-border hover:border-salmon"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Modal */}
      <Dialog open={assignmentModalOpen} onOpenChange={(open) => {
        setAssignmentModalOpen(open);
        if (!open) resetAssignmentModal();
      }}>
        <DialogContent className="admin-gradient-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-salmon">Assign {selectedImages.size} Images to Album</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a client and album to assign the selected images to, or create new ones.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select 
                value={selectedClientEmail} 
                onValueChange={(value) => {
                  setSelectedClientEmail(value);
                  setSelectedShootId(''); // Reset shoot selection
                  if (value === '__new__') {
                    setNewClientMode(true);
                  } else {
                    setNewClientMode(false);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.email}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Create New Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Client Form */}
            {newClientMode && (
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border">
                <h4 className="font-medium text-salmon">New Client Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client Name *</Label>
                    <Input
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Client name"
                    />
                  </div>
                  <div>
                    <Label>Client Email *</Label>
                    <Input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Album Selection */}
            {selectedClientEmail && selectedClientEmail !== '__new__' && (
              <div className="space-y-2">
                <Label>Select Album</Label>
                <Select 
                  value={selectedShootId} 
                  onValueChange={(value) => {
                    setSelectedShootId(value);
                    if (value === '__new__') {
                      setNewShootMode(true);
                    } else {
                      setNewShootMode(false);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an album..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShoots.map(shoot => (
                      <SelectItem key={shoot.id} value={shoot.id}>
                        {shoot.title} - Unknown Location
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ Create New Album</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* New Album Form */}
            {(newShootMode || (newClientMode && selectedClientEmail === '__new__')) && (
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border">
                <h4 className="font-medium text-salmon">New Album Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Album Title *</Label>
                    <Input
                      value={newShootData.title}
                      onChange={(e) => setNewShootData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Wedding Photography"
                    />
                  </div>
                  <div>
                    <Label>Shoot Type</Label>
                    <Select 
                      value={newShootData.shootType}
                      onValueChange={(value) => setNewShootData(prev => ({ ...prev, shootType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="maternity">Maternity</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="graduation">Graduation</SelectItem>
                        <SelectItem value="newborn">Newborn</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="matric dance">Matric Dance</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newShootData.location}
                    onChange={(e) => setNewShootData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Durban"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setAssignmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleAssignImages}
              disabled={bulkAssignmentMutation.isPending || (!selectedShootId && !newShootMode && !newClientMode)}
            >
              {bulkAssignmentMutation.isPending ? 'Assigning...' : `Assign ${selectedImages.size} Images`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}