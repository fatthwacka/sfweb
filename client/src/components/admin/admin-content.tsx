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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GalleryEditor } from "./gallery-editor";
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
  Palette
} from "lucide-react";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

interface Shoot {
  id: number;
  clientId: number;
  title: string;
  description: string;
  shootType: string;
  shootDate: string;
  location: string;
  notes: string;
  customSlug: string;
  customTitle: string;
  albumCoverId: number | null;
  isPrivate: boolean;
  bannerImageId: number | null;
  seoTags: string;
  viewCount: number;
  createdAt: string;
}

interface Image {
  id: number;
  shootId: number;
  filename: string;
  storagePath: string;
  isPrivate: boolean;
  uploadOrder: number;
  downloadCount: number;
  createdAt: string;
}

export function AdminContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'shoots' | 'images' | 'galleries'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newShootOpen, setNewShootOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedShoot, setSelectedShoot] = useState<number | null>(null);
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);

  // Fetch data
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"]
  });

  const { data: shoots = [], isLoading: shootsLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"]
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

  const handleCreateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShoots = shoots.filter(shoot =>
    shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shoot.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Tab Navigation */}
      <div className="mt-8 flex space-x-8 border-b border-border">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'shoots', label: 'Shoots', icon: Camera },
          { id: 'images', label: 'Images', icon: FileImage },
          { id: 'galleries', label: 'Gallery Management', icon: Palette }
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
      <section className="py-12 bg-gradient-to-br from-slate-50 via-background to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white border border-salmon/20 shadow-lg">
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
                
                <Card className="bg-white border border-salmon/20 shadow-lg">
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
                
                <Card className="bg-white border border-salmon/20 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileImage className="w-4 h-4 icon-cyan" />
                      Total Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">0</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-salmon/20 shadow-lg">
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
              <Card className="bg-white border border-salmon/20 shadow-lg">
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
                      <DialogContent className="bg-white border border-cyan/20 shadow-lg">
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
                      <DialogContent className="bg-white border border-cyan/20 shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-salmon">Add New Shoot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateShoot} className="space-y-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-salmon">Basic Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="clientId">Client *</Label>
                                <Select name="clientId" required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select client" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clients.map(client => (
                                      <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="shootType">Shoot Type *</Label>
                                <Select name="shootType" required>
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
                                <Input id="shootDate" name="shootDate" type="date" required />
                              </div>
                              <div>
                                <Label htmlFor="location">Location *</Label>
                                <Input 
                                  id="location" 
                                  name="location" 
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

                    <Button className="h-20 flex-col gap-2 bg-white border border-cyan/20 shadow-lg hover:border-salmon text-white">
                      <FileImage className="w-6 h-6 icon-salmon" />
                      <span className="text-sm">Upload Images</span>
                    </Button>

                    <Button className="h-20 flex-col gap-2 bg-white border border-cyan/20 shadow-lg hover:border-salmon text-white">
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
                    <DialogContent className="bg-white border border-cyan/20 shadow-lg max-w-md">
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
                          <Label htmlFor="clientEmail">Email</Label>
                          <Input id="clientEmail" name="email" type="email" />
                        </div>
                        <div>
                          <Label htmlFor="clientPhone">Phone</Label>
                          <Input id="clientPhone" name="phone" />
                        </div>
                        <div>
                          <Label htmlFor="clientAddress">Address</Label>
                          <Input id="clientAddress" name="address" />
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
                    <Card key={client.id} className="bg-white border border-salmon/20 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-salmon">{client.name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 icon-cyan" />
                                {client.email}
                              </div>
                              {client.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 icon-salmon" />
                                  {client.phone}
                                </div>
                              )}
                              {client.address && (
                                <div className="flex items-center gap-2">
                                  <Home className="w-4 h-4 icon-cyan" />
                                  {client.address}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-border hover:border-salmon text-white">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border hover:border-red-500 text-white">
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

          {activeTab === 'shoots' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-saira font-bold text-salmon">Shoots Management</h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search shoots..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={newShootOpen} onOpenChange={setNewShootOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-salmon text-white hover:bg-salmon-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Shoot
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border border-cyan/20 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-salmon">Create New Shoot</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Create a new photography or videography shoot with all necessary details.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateShoot} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-salmon">Basic Information</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="title">Shoot Title *</Label>
                              <Input id="title" name="title" required placeholder="Sarah & Michael's Wedding" />
                            </div>
                            <div>
                              <Label htmlFor="shootType">Shoot Type *</Label>
                              <select id="shootType" name="shootType" required className="w-full px-3 py-2 bg-background border border-border rounded-md">
                                <option value="">Select type...</option>
                                <option value="wedding">Wedding</option>
                                <option value="portrait">Portrait</option>
                                <option value="event">Event</option>
                                <option value="corporate">Corporate</option>
                                <option value="lifestyle">Lifestyle</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Brief description of the shoot..." rows={3} />
                          </div>
                        </div>

                        {/* Location & Date */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-salmon">Location & Date</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="shootDate">Shoot Date *</Label>
                              <Input id="shootDate" name="shootDate" type="date" required />
                            </div>
                            <div>
                              <Label htmlFor="location">Location *</Label>
                              <Input id="location" name="location" required placeholder="Cape Town, South Africa" />
                            </div>
                          </div>
                        </div>

                        {/* SEO & Settings */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-salmon">SEO & Settings</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="customSlug">Custom URL Slug</Label>
                              <Input id="customSlug" name="customSlug" placeholder="sarah-michael-wedding-2024" />
                            </div>
                            <div>
                              <Label htmlFor="seoTags">SEO Tags</Label>
                              <Input id="seoTags" name="seoTags" placeholder="wedding, cape town, photography" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="isPrivate" name="isPrivate" className="rounded" />
                            <Label htmlFor="isPrivate">Make gallery private</Label>
                          </div>
                        </div>

                        <Button type="submit" disabled={createShootMutation.isPending} className="w-full bg-salmon text-white hover:bg-salmon-muted">
                          {createShootMutation.isPending ? 'Creating Shoot...' : 'Create Shoot'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
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
                    <Card key={shoot.id} className="bg-white border border-salmon/20 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-salmon">{shoot.title}</h3>
                              <Badge variant="outline" className="text-xs capitalize">
                                {shoot.shootType}
                              </Badge>
                              {shoot.isPrivate && <Badge variant="outline" className="text-xs bg-red-900/20 text-red-300 border-red-700">Private</Badge>}
                            </div>
                            <p className="text-muted-foreground">{shoot.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 icon-cyan" />
                                {new Date(shoot.shootDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 icon-salmon" />
                                {shoot.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 icon-cyan" />
                                {shoot.viewCount} views
                              </div>
                              <div className="flex items-center gap-1">
                                <Camera className="w-4 h-4 icon-salmon" />
                                Gallery: /{shoot.customSlug}
                              </div>
                            </div>
                            {shoot.seoTags && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Tags:</span>
                                <span className="italic">{shoot.seoTags}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:border-salmon text-white"
                              onClick={() => setEditingShoot(shoot)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border hover:border-red-500 text-white">
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
                <h2 className="text-2xl font-saira font-bold text-salmon">Images Management</h2>
                <Button className="bg-salmon text-white hover:bg-salmon-muted">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>

              <Card className="bg-white border border-salmon/20 shadow-lg">
                <CardContent className="p-8 text-center">
                  <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Images Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first images to get started with gallery management.
                  </p>
                  <Button className="bg-salmon text-white hover:bg-salmon-muted">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Images
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'galleries' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-saira font-bold text-salmon">Gallery Management</h2>
              </div>

              {/* Shoot Selection */}
              <Card className="bg-white border border-salmon/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-salmon">Select Shoot to Manage</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedShoot?.toString() || ""} 
                    onValueChange={(value) => setSelectedShoot(parseInt(value))}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Choose a shoot to manage its gallery" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoots.map(shoot => (
                        <SelectItem key={shoot.id} value={shoot.id.toString()}>
                          {shoot.title} - {new Date(shoot.shootDate).toLocaleDateString()} - {shoot.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Gallery Editor */}
              {selectedShoot && <GalleryEditor shootId={selectedShoot} />}

              {!selectedShoot && (
                <Card className="bg-white border border-salmon/20 shadow-lg">
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
        </div>
      </section>

      {/* Edit Shoot Dialog */}
      <Dialog open={!!editingShoot} onOpenChange={(open) => !open && setEditingShoot(null)}>
        <DialogContent className="bg-white border border-cyan/20 shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <Label htmlFor="edit-clientId">Client *</Label>
                    <Select name="clientId" defaultValue={editingShoot.clientId.toString()} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
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
                      defaultValue={editingShoot.shootDate.split('T')[0]}
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