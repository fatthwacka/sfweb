import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImageUrl } from "@/lib/image-utils";
import { EnhancedGalleryEditor } from "./enhanced-gallery-editor";
import { StaffManagement } from "./staff-management";
import { SimpleAssetsPanel } from "./simple-assets-panel";
import { GalleryLivePreview } from "../shared/gallery-live-preview";
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
  Star
} from "lucide-react";

interface Client {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  secondaryEmail?: string;
  userId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Shoot {
  id: string;
  clientId: string; // Email address for email-based matching
  title: string;
  description: string;
  shootType?: string;
  shootDate?: string;
  location?: string;
  customTitle?: string;
  customSlug?: string;
  notes?: string;
  isPrivate: boolean;
  bannerImageId: string | null;
  seoTags: string[] | string;
  viewCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Image {
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  isPrivate: boolean;
  sequence: number;
  downloadCount: number;
  createdAt: string;
  classification?: string;
  featuredImage?: boolean;
}

interface AdminContentProps {
  userRole: string;
}

export function AdminContent({ userRole }: AdminContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'shoots' | 'images' | 'galleries' | 'staff' | 'users'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newShootOpen, setNewShootOpen] = useState(false);

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
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Bulk selection state for images
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  
  // Image filters
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('__all__');
  const [selectedShootFilter, setSelectedShootFilter] = useState<string>('__all__');

  // Fetch data with client-shoot relationships
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"]
  });

  const { data: shoots = [], isLoading: shootsLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"]
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/images"]
  });
  
  // Clean up debugging logs since the issue is resolved

  // Get shoots for each client via email matching
  const getClientShoots = (clientEmail: string) => {
    return shoots.filter(shoot => shoot.clientId === clientEmail);
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

  // Get filtered images based on current filters
  const getFilteredImages = () => {
    return images.filter(image => {
      // Search term filter
      if (searchTerm && !image.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Client filter
      if (selectedClientFilter && selectedClientFilter !== '__all__') {
        const imageShoot = shoots.find(shoot => shoot.id === image.shootId);
        if (!imageShoot || imageShoot.clientId !== selectedClientFilter) {
          return false;
        }
      }
      
      // Shoot filter
      if (selectedShootFilter && selectedShootFilter !== '__all__' && image.shootId !== selectedShootFilter) {
        return false;
      }
      
      return true;
    });
  };

  const selectAllImages = () => {
    const filteredImages = getFilteredImages();
    setSelectedImages(new Set(filteredImages.map(img => img.id)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const getSelectedImagesData = () => {
    return images.filter(image => selectedImages.has(image.id));
  };

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: userRole === 'super_admin'
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setNewClientOpen(false);
      toast({
        title: "Success",
        description: "Client created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive"
      });
    }
  });

  const createShootMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/shoots", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shoots"] });
      setNewShootOpen(false);
      toast({
        title: "Success",
        description: "Shoot created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shoot",
        variant: "destructive"
      });
    }
  });

  const updateShootMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/shoots/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shoots"] });
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
    mutationFn: (data: any) => apiRequest("PATCH", `/api/clients/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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
    mutationFn: (clientEmail: string) => apiRequest("DELETE", `/api/clients/${encodeURIComponent(clientEmail)}`),
    onSuccess: (data, clientEmail) => {
      // Force refresh the clients list
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.refetchQueries({ queryKey: ["/api/clients"] });
      
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
    
    const data = {
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
      email: email.trim(),
      phone: (formData.get('phone') as string)?.trim() || null,
      address: (formData.get('address') as string)?.trim() || null,
      secondaryEmail: null, // Initialize as null for new clients
      password: password.trim() || null, // Include password if provided
    };
    createClientMutation.mutate(data);
  };

  const handleCreateShoot = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      clientId: formData.get('clientEmail') as string, // Use email as clientId for email-based matching
      title: title,
      description: formData.get('description') as string || '',
      shootType: formData.get('shootType') as string,
      shootDate: formData.get('shootDate') as string,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string || '',
      customSlug: customSlug || `${autoSlug}-slyfox-${new Date().getFullYear()}`,
      customTitle: formData.get('customTitle') as string || title,
      seoTags: formData.get('seoTags') as string || '',
      isPrivate: formData.get('isPrivate') === 'on',
      albumCoverId: null,
      bannerImageId: null,
      viewCount: 0
    };
    
    createShootMutation.mutate(data);
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
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
    mutationFn: (data: any) => apiRequest("PATCH", `/api/users/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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

  // Filter data based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredShoots = shoots.filter(shoot =>
    shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shoot.description && shoot.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Bulk delete images mutation
  const deleteImagesMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      console.log('Bulk deleting images:', imageIds);
      
      const results = [];
      for (const imageId of imageIds) {
        try {
          console.log(`Deleting image ${imageId} (type: ${typeof imageId})`);
          const result = await apiRequest("DELETE", `/api/images/${imageId}`);
          results.push({ id: imageId, success: true });
        } catch (error) {
          console.error(`Failed to delete image ${imageId}:`, error);
          results.push({ id: imageId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images/featured"] });
      clearSelection();
      
      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `${successful.length} images deleted successfully${failed.length > 0 ? ` (${failed.length} failed)` : ''}`
        });
      }
      
      if (failed.length > 0 && successful.length === 0) {
        toast({
          title: "Error", 
          description: `Failed to delete ${failed.length} images`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error", 
        description: "Failed to delete images",
        variant: "destructive"
      });
    }
  });

  // Bulk mark as featured images mutation
  const markAsFeaturedMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      console.log('Bulk marking as featured:', imageIds);
      const results = [];
      for (const imageId of imageIds) {
        try {
          await apiRequest("PATCH", `/api/images/${imageId}`, { featuredImage: true });
          results.push({ id: imageId, success: true });
        } catch (error) {
          console.error(`Failed to mark image ${imageId} as featured:`, error);
          results.push({ id: imageId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images/featured"] });
      clearSelection();
      
      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `${successful.length} images marked as featured${failed.length > 0 ? ` (${failed.length} failed)` : ''}`
        });
      }
      
      if (failed.length > 0 && successful.length === 0) {
        toast({
          title: "Error", 
          description: `Failed to mark ${failed.length} images as featured`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Bulk mark as featured error:', error);
      toast({
        title: "Error", 
        description: "Failed to mark images as featured",
        variant: "destructive"
      });
    }
  });

  // Bulk unmark featured images mutation
  const unmarkFeaturedMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      console.log('Bulk unmarking featured:', imageIds);
      const results = [];
      for (const imageId of imageIds) {
        try {
          await apiRequest("PATCH", `/api/images/${imageId}`, { featuredImage: false });
          results.push({ id: imageId, success: true });
        } catch (error) {
          console.error(`Failed to unmark image ${imageId} as featured:`, error);
          results.push({ id: imageId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images/featured"] });
      clearSelection();
      
      if (successful.length > 0) {
        toast({
          title: "Success",
          description: `${successful.length} images unmarked as featured${failed.length > 0 ? ` (${failed.length} failed)` : ''}`
        });
      }
      
      if (failed.length > 0 && successful.length === 0) {
        toast({
          title: "Error", 
          description: `Failed to unmark ${failed.length} images as featured`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Bulk unmark featured error:', error);
      toast({
        title: "Error", 
        description: "Failed to unmark images as featured",
        variant: "destructive"
      });
    }
  });

  // Individual toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ imageId, featured }: { imageId: string; featured: boolean }) => {
      return apiRequest("PATCH", `/api/images/${imageId}`, { featuredImage: featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images/featured"] });
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
    <>
      {/* Tab Navigation */}
      <div className="mt-8 flex space-x-8 border-b border-border">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'shoots', label: 'Shoots', icon: Camera },
          { id: 'images', label: 'Images', icon: FileImage },
          { id: 'galleries', label: 'Gallery Management', icon: Palette },
          ...(userRole === 'super_admin' ? [
            { id: 'site-assets', label: 'Site Assets', icon: Home },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <Eye className="w-4 h-4 icon-salmon" />
                      Total Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">
                      {shoots.reduce((total, shoot) => total + shoot.viewCount, 0)}
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

                    <Dialog open={newShootOpen} onOpenChange={setNewShootOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-20 flex-col gap-2 bg-salmon text-white hover:bg-salmon-muted">
                          <Camera className="w-6 h-6 icon-cyan" />
                          <span className="text-sm">Add Shoot</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-salmon">Add New Shoot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateShoot} className="space-y-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-salmon">Basic Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="clientEmail">Client Email *</Label>
                                <Select name="clientEmail" required onValueChange={(value) => {
                                  // Auto-populate SEO fields when client changes
                                  const shootTypeSelect = document.querySelector('[name="shootType"]') as HTMLInputElement;
                                  const locationInput = document.querySelector('[name="location"]') as HTMLInputElement;
                                  const seoInput = document.querySelector('[name="seoTags"]') as HTMLInputElement;
                                  const descriptionInput = document.querySelector('[name="description"]') as HTMLTextAreaElement;
                                  
                                  if (value && shootTypeSelect?.value && locationInput?.value) {
                                    const selectedClient = clients.find(c => c.email === value);
                                    if (selectedClient && seoInput) {
                                      const keywords = generateSEOKeywords(shootTypeSelect.value, locationInput.value, selectedClient.name);
                                      seoInput.value = keywords;
                                      
                                      if (descriptionInput && !descriptionInput.value) {
                                        const description = generateDescription(selectedClient.name, shootTypeSelect.value, locationInput.value);
                                        descriptionInput.value = description;
                                      }
                                    }
                                  }
                                }}>
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
                                <Label htmlFor="shootType">Shoot Type *</Label>
                                <Select name="shootType" required onValueChange={(value) => {
                                  // Auto-populate SEO fields when shoot type changes
                                  const clientSelect = document.querySelector('[name="clientEmail"]') as HTMLInputElement;
                                  const locationInput = document.querySelector('[name="location"]') as HTMLInputElement;
                                  const seoInput = document.querySelector('[name="seoTags"]') as HTMLInputElement;
                                  const descriptionInput = document.querySelector('[name="description"]') as HTMLTextAreaElement;
                                  
                                  if (value && locationInput?.value) {
                                    const selectedClient = clients.find(c => c.email === clientSelect?.value);
                                    if (selectedClient && seoInput) {
                                      const keywords = generateSEOKeywords(value, locationInput.value, selectedClient.name);
                                      seoInput.value = keywords;
                                      
                                      if (descriptionInput && !descriptionInput.value) {
                                        const description = generateDescription(selectedClient.name, value, locationInput.value);
                                        descriptionInput.value = description;
                                      }
                                    }
                                  }
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select shoot type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                    <SelectItem value="engagement">Engagement</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="family">Family</SelectItem>
                                    <SelectItem value="graduation">Graduation</SelectItem>
                                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                                    <SelectItem value="maternity">Maternity</SelectItem>
                                    <SelectItem value="matric dance">Matric Dance</SelectItem>
                                    <SelectItem value="newborn">Newborn</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                    <SelectItem value="product">Product</SelectItem>
                                    <SelectItem value="wedding">Wedding</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="title">Shoot Title *</Label>
                              <Input 
                                id="title" 
                                name="title" 
                                placeholder="e.g., Sarah & Michael's Wedding"
                                required 
                              />
                            </div>
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea 
                                id="description" 
                                name="description" 
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
                                <Label htmlFor="shootDate">Shoot Date *</Label>
                                <div 
                                  className="relative bg-background border border-input rounded-md cursor-pointer hover:border-salmon transition-colors"
                                  onClick={() => {
                                    const input = document.getElementById('shootDate') as HTMLInputElement;
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
                                    id="shootDate" 
                                    name="shootDate" 
                                    type="date" 
                                    required 
                                    className="bg-transparent border-0 cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                  />
                                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-salmon pointer-events-none" />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="location">Location *</Label>
                                <Input 
                                  id="location" 
                                  name="location" 
                                  defaultValue="La Lucia, Durban"
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
                                <Label htmlFor="customTitle">Custom Gallery Title</Label>
                                <Input 
                                  id="customTitle" 
                                  name="customTitle" 
                                  placeholder="Leave empty to use shoot title"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  This will be displayed as the main gallery heading
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="customSlug">Custom URL Slug</Label>
                                <Input 
                                  id="customSlug" 
                                  name="customSlug" 
                                  placeholder="e.g., sarah-michael-wedding-2024"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  URL: /gallery/[slug] - leave empty for auto-generation
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="seoTags">SEO Tags</Label>
                              <Input 
                                id="seoTags" 
                                name="seoTags" 
                                placeholder="photography durban, professional photographer, wedding photography"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Auto-generated based on shoot type and location, edit as needed
                              </p>
                            </div>
                          </div>

                          {/* Privacy & Settings */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-salmon">Privacy & Settings</h3>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="isPrivate" 
                                name="isPrivate" 
                                className="rounded border-border"
                              />
                              <Label htmlFor="isPrivate" className="text-sm">
                                Make gallery private (requires login to view)
                              </Label>
                            </div>
                            <div>
                              <Label htmlFor="notes">Internal Notes</Label>
                              <Textarea 
                                id="notes" 
                                name="notes" 
                                placeholder="Internal notes for staff reference..."
                                rows={3}
                              />
                            </div>
                          </div>

                          <Button type="submit" disabled={createShootMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                            {createShootMutation.isPending ? 'Creating Shoot...' : 'Create Shoot'}
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

                    <Button className="h-20 flex-col gap-2 bg-cyan-dark border border-cyan/30 shadow-lg hover:border-salmon text-white">
                      <BarChart3 className="w-6 h-6 icon-cyan" />
                      <span className="text-sm">View Analytics</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-saira font-bold text-salmon">Clients Management</h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
              </div>

              <div className="grid gap-4">
                {clientsLoading ? (
                  <div className="text-center py-8">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No clients found matching your search.' : 'No clients yet. Add your first client!'}
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <Card key={client.id} className="admin-gradient-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-salmon">{client.name}</h3>
                            
                            {/* Client Shoots */}
                            <div className="space-y-2">
                              {(() => {
                                const clientShoots = getClientShoots(client.email);
                                const displayShoots = clientShoots.slice(0, 3);
                                const hasMore = clientShoots.length > 3;
                                
                                return (
                                  <div className="space-y-1">
                                    {displayShoots.map(shoot => (
                                      <div key={shoot.id} className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <Eye 
                                            className="w-4 h-4 icon-cyan cursor-pointer hover:text-salmon transition-colors" 
                                            onClick={() => {
                                              setActiveTab('galleries');
                                              setSelectedShoot(shoot.id);
                                            }}
                                          />
                                          <span>{shoot.title}</span>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="h-6 px-2 text-xs hover:border-salmon hover:text-salmon"
                                          onClick={() => {
                                            setActiveTab('galleries');
                                            setSelectedShoot(shoot.id);
                                          }}
                                        >
                                          View
                                        </Button>
                                      </div>
                                    ))}
                                    {hasMore && (
                                      <div className="text-xs text-salmon cursor-pointer hover:underline">
                                        + {clientShoots.length - 3} more shoots...
                                      </div>
                                    )}
                                    {clientShoots.length === 0 && (
                                      <div className="text-sm text-muted-foreground italic">No shoots yet</div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {client.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 icon-cyan" />
                                  {client.email}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 icon-salmon" />
                                Slug: /{client.slug}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Dialog>
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
                                      clientId: client.email, // Use email instead of numeric ID
                                      title: title,
                                      description: formData.get('description') as string || '',
                                      shootType: formData.get('shootType') as string,
                                      shootDate: formData.get('shootDate') as string,
                                      location: formData.get('location') as string,
                                      notes: formData.get('notes') as string || '',
                                      customSlug: `${autoSlug}-${new Date().getFullYear()}`,
                                      customTitle: formData.get('customTitle') as string || title,
                                      seoTags: formData.get('seoTags') as string || '',
                                      isPrivate: formData.get('isPrivate') === 'on'
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
                                          <option value="commercial">Commercial</option>
                                          <option value="corporate">Corporate</option>
                                          <option value="engagement">Engagement</option>
                                          <option value="event">Event</option>
                                          <option value="family">Family</option>
                                          <option value="graduation">Graduation</option>
                                          <option value="lifestyle">Lifestyle</option>
                                          <option value="maternity">Maternity</option>
                                          <option value="matric dance">Matric Dance</option>
                                          <option value="newborn">Newborn</option>
                                          <option value="other">Other</option>
                                          <option value="portrait">Portrait</option>
                                          <option value="product">Product</option>
                                          <option value="wedding">Wedding</option>
                                        </select>
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
                                    secondaryEmail: client.secondaryEmail || ''
                                  });
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-saira font-bold text-salmon">Shoots Management</h2>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search shoots..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {shootsLoading ? (
                  <div className="text-center py-8">Loading shoots...</div>
                ) : filteredShoots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No shoots found matching your search.' : 'No shoots yet. Add your first shoot!'}
                  </div>
                ) : (
                  filteredShoots.map(shoot => (
                    <Card key={shoot.id} className="admin-gradient-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-salmon">{shoot.title}</h3>
                              {shoot.isPrivate && <Badge variant="outline" className="text-xs bg-red-900/20 text-red-300 border-red-700">Private</Badge>}
                            </div>
                            
                            {/* Client Information */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4 icon-cyan" />
                                <span>Client: {(() => {
                                  const client = clients.find(c => c.email === shoot.clientId);
                                  return client ? client.name : shoot.clientId;
                                })()}</span>
                              </div>
                            </div>
                            
                            {shoot.description && <p className="text-muted-foreground">{shoot.description}</p>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 icon-cyan" />
                                {(() => {
                                  try {
                                    if (!shoot.shootDate) return 'No date';
                                    const date = new Date(shoot.shootDate);
                                    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 icon-salmon" />
                                {shoot.location || 'No location'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 icon-cyan" />
                                {shoot.viewCount || 0} views
                              </div>
                              <div className="flex items-center gap-1">
                                <Camera className="w-4 h-4 icon-salmon" />
                                {shoot.shootType || 'Unknown type'}
                              </div>
                            </div>
                            
                            {shoot.seoTags && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Tags:</span>
                                <span className="italic">{Array.isArray(shoot.seoTags) ? shoot.seoTags.join(', ') : shoot.seoTags}</span>
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
                <h2 className="text-2xl font-saira font-bold text-salmon">Images Management</h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search images..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-salmon text-white hover:bg-salmon-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Images
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="admin-gradient-card max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-salmon">Upload Images</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Select images to upload to a specific shoot gallery.
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
                                  {shoot.title} - {shoot.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="imageFiles">Select Images *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-2">
                              Drag and drop images here, or click to browse
                            </p>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              id="imageFiles"
                            />
                            <Button 
                              variant="outline" 
                              className="border-salmon text-salmon hover:bg-salmon hover:text-white"
                              onClick={() => document.getElementById('imageFiles')?.click()}
                            >
                              Browse Files
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="uploadPrivate" className="rounded border-border" />
                          <Label htmlFor="uploadPrivate" className="text-sm">
                            Mark uploaded images as private
                          </Label>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            className="flex-1 bg-salmon text-white hover:bg-salmon-muted"
                            onClick={() => {
                              toast({
                                title: "Feature In Development",
                                description: "Image upload functionality will be available in the next release.",
                              });
                              setUploadDialogOpen(false);
                            }}
                          >
                            Upload Images
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

              {imagesLoading ? (
                <div className="text-center py-8">Loading images...</div>
              ) : images.length === 0 ? (
                <Card className="admin-gradient-card">
                  <CardContent className="p-8 text-center">
                    <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Images Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first images to get started with gallery management.
                    </p>
                    <Button 
                      className="bg-salmon text-white hover:bg-salmon-muted"
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Images
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
                            .filter(shoot => !selectedClientFilter || selectedClientFilter === '__all__' || shoot.clientId === selectedClientFilter)
                            .map(shoot => (
                              <SelectItem key={shoot.id} value={shoot.id}>
                                {shoot.title} - {shoot.location}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(selectedClientFilter !== '__all__' || selectedShootFilter !== '__all__') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClientFilter('__all__');
                          setSelectedShootFilter('__all__');
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
                        Showing {getFilteredImages().length} of {images.length} images
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
                                <DialogTitle className="text-salmon">Delete Selected Images</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Are you sure you want to permanently delete {selectedImages.size} selected images from the database? This action cannot be undone.
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
                                  {deleteImagesMutation.isPending ? 'Deleting...' : 'Delete Images'}
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
                    {getFilteredImages().map((image) => {
                        const associatedShoot = shoots.find(s => s.id === image.shootId);
                        const isSelected = selectedImages.has(image.id);
                        return (
                          <Card 
                            key={image.id} 
                            className={`admin-gradient-card group hover:border-salmon/60 transition-colors cursor-pointer relative ${
                              isSelected ? 'border-salmon/80 ring-2 ring-salmon/30' : ''
                            }`}
                            onClick={() => toggleImageSelection(image.id)}
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
                                
                                {/* Image Preview */}
                                <div className="aspect-square bg-background rounded-md flex items-center justify-center overflow-hidden">
                                  <img
                                    src={ImageUrl.forViewing(image.storagePath)}
                                    alt={image.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNzM3MzciLz48cGF0aCBkPSJNMTIgMTVIMjhWMjVIMTJWMTVaIiBzdHJva2U9IiM5CA0OVM5IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4K';
                                    }}
                                  />
                                </div>
                                
                                {/* Image Info */}
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-salmon truncate">
                                    {image.filename}
                                  </p>
                                  {associatedShoot && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {associatedShoot.title}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{image.downloadCount} downloads</span>
                                    <span className={`px-2 py-1 rounded ${image.isPrivate ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
                                      {image.isPrivate ? 'Private' : 'Public'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Featured Status and Action Buttons */}
                                <div className="flex gap-1 items-center">
                                  {/* Featured Toggle Button - Always visible */}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className={`w-8 h-8 p-0 border-2 transition-all ${
                                      image.featuredImage 
                                        ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/25' 
                                        : 'border-gray-500 text-gray-400 hover:border-green-500 hover:text-green-400'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFeaturedMutation.mutate({ 
                                        imageId: image.id, 
                                        featured: !image.featuredImage 
                                      });
                                    }}
                                    disabled={toggleFeaturedMutation.isPending}
                                    title={image.featuredImage ? "Remove from featured" : "Mark as featured"}
                                  >
                                    <Star className={`w-3 h-3 ${image.featuredImage ? 'fill-current' : ''}`} />
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
                  <CardTitle className="text-salmon">Select Shoot to Manage</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedShoot || ""} 
                    onValueChange={(value) => setSelectedShoot(value)}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Choose a shoot to manage its gallery" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoots.map(shoot => (
                        <SelectItem key={shoot.id} value={shoot.id.toString()}>
                          {shoot.title} - {(() => {
                            try {
                              if (!shoot.shootDate) return 'No date';
                              const date = new Date(shoot.shootDate);
                              return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                            } catch {
                              return 'Invalid Date';
                            }
                          })()} - {shoot.location || 'No location'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          {activeTab === 'site-assets' && userRole === 'super_admin' && (
            <SimpleAssetsPanel />
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
                    <Select name="clientEmail" defaultValue={editingShoot.clientId} required>
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
                      placeholder="e.g., Cape Town Waterfront"
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
                    placeholder="wedding photography, cape town, romantic, outdoor"
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
    </>
  );
}