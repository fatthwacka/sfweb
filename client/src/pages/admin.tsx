import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Users, 
  Camera, 
  FileImage, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff,
  Calendar,
  MapPin,
  Search,
  Filter,
  BarChart3,
  Shield,
  Settings,
  Download,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  Image as ImageIcon,
  Palette,
  Link as LinkIcon
} from "lucide-react";
import { useState } from "react";
import { GalleryEditor } from "@/components/admin/gallery-editor";

interface Client {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  userId: number | null;
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

interface GalleryImage {
  id: number;
  shootId: number;
  filename: string;
  storagePath: string;
  thumbnailPath: string | null;
  sequence: number;
  downloadCount: number;
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

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'shoots' | 'images' | 'galleries'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newShootOpen, setNewShootOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedShoot, setSelectedShoot] = useState<number | null>(null);
  const [gallerySettingsOpen, setGallerySettingsOpen] = useState(false);

  // Check if user is staff
  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-4xl font-saira font-black mb-6">Access Denied</h1>
            <p className="text-xl text-muted-foreground mb-8">
              You need staff privileges to access the admin panel.
            </p>
            <Link href="/dashboard">
              <Button className="bg-gold text-black hover:bg-gold-muted">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    const data = {
      clientId: parseInt(formData.get('clientId') as string),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      shootDate: formData.get('shootDate') as string,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string,
      isPrivate: formData.get('isPrivate') === 'on',
    };
    createShootMutation.mutate(data);
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
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>Admin Panel | SlyFox Studios</title>
      <meta name="description" content="SlyFox Studios admin panel for managing clients, shoots, and images." />
      
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-8 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12 icon-salmon" />
              <div>
                <h1 className="text-3xl font-saira font-black">
                  Admin <span className="text-gold">Panel</span>
                </h1>
                <p className="text-muted-foreground">Manage clients, shoots, and content</p>
              </div>
            </div>
            
            <Link href="/dashboard">
              <Button variant="outline" className="border-border hover:border-gold">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
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
                      ? 'border-gold text-gold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'icon-salmon' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-charcoal min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-black border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 icon-cyan" />
                      Total Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gold">{clients.length}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4 icon-salmon" />
                      Total Shoots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gold">{shoots.length}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileImage className="w-4 h-4 icon-cyan" />
                      Total Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gold">0</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4 icon-salmon" />
                      Total Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gold">
                      {shoots.reduce((total, shoot) => total + shoot.viewCount, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-black border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-saira font-bold text-gold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-20 flex-col gap-2 bg-gold text-black hover:bg-gold-muted">
                          <Plus className="w-6 h-6 icon-salmon" />
                          <span className="text-sm">Add Client</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Client</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateClient} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Client Name</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" />
                          </div>
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full bg-gold text-black hover:bg-gold-muted"
                            disabled={createClientMutation.isPending}
                          >
                            {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={newShootOpen} onOpenChange={setNewShootOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-20 flex-col gap-2 border-border hover:border-gold hover:text-gold">
                          <Camera className="w-6 h-6 icon-cyan" />
                          <span className="text-sm">Add Shoot</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Shoot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateShoot} className="space-y-4">
                          <div>
                            <Label htmlFor="clientId">Client</Label>
                            <select 
                              id="clientId" 
                              name="clientId" 
                              required
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            >
                              <option value="">Select a client</option>
                              {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                  {client.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="title">Shoot Title</Label>
                            <Input id="title" name="title" required />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" />
                          </div>
                          <div>
                            <Label htmlFor="shootDate">Shoot Date</Label>
                            <Input id="shootDate" name="shootDate" type="date" />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="isPrivate" name="isPrivate" />
                            <Label htmlFor="isPrivate">Private Shoot</Label>
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full bg-gold text-black hover:bg-gold-muted"
                            disabled={createShootMutation.isPending}
                          >
                            {createShootMutation.isPending ? 'Creating...' : 'Create Shoot'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="h-20 flex-col gap-2 border-border hover:border-gold hover:text-gold">
                      <Upload className="w-6 h-6 icon-salmon" />
                      <span className="text-sm">Upload Images</span>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col gap-2 border-border hover:border-gold hover:text-gold">
                      <Download className="w-6 h-6 icon-cyan" />
                      <span className="text-sm">Export Data</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-saira font-black">
                  Manage <span className="text-gold">Clients</span>
                </h2>
                <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gold text-black hover:bg-gold-muted">
                      <Plus className="w-4 h-4 mr-2 icon-salmon" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClient} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Client Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gold text-black hover:bg-gold-muted"
                        disabled={createClientMutation.isPending}
                      >
                        {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Clients List */}
              <div className="grid gap-4">
                {clientsLoading ? (
                  <div className="text-center py-8">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 icon-salmon mx-auto mb-4" />
                    <h3 className="text-xl font-saira font-bold mb-2">No Clients Found</h3>
                    <p className="text-muted-foreground">Add your first client to get started.</p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <Card key={client.id} className="bg-black border-border hover:border-gold transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-saira font-bold text-gold">{client.name}</h3>
                            <p className="text-sm text-muted-foreground">Slug: /clients/{client.slug}</p>
                            {client.email && (
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            )}
                            {client.phone && (
                              <p className="text-sm text-muted-foreground">{client.phone}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/clients/${client.slug}`}>
                              <Button size="sm" variant="outline" className="border-border hover:border-gold">
                                <Eye className="w-4 h-4 icon-cyan" />
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" className="border-border hover:border-gold">
                              <Edit className="w-4 h-4 icon-salmon" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                              <Trash2 className="w-4 h-4 icon-salmon" />
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
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-saira font-black">
                  Manage <span className="text-gold">Shoots</span>
                </h2>
                <Dialog open={newShootOpen} onOpenChange={setNewShootOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gold text-black hover:bg-gold-muted">
                      <Plus className="w-4 h-4 mr-2 icon-cyan" />
                      Add Shoot
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Shoot</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateShoot} className="space-y-4">
                      <div>
                        <Label htmlFor="clientId">Client</Label>
                        <select 
                          id="clientId" 
                          name="clientId" 
                          required
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        >
                          <option value="">Select a client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="title">Shoot Title</Label>
                        <Input id="title" name="title" required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" />
                      </div>
                      <div>
                        <Label htmlFor="shootDate">Shoot Date</Label>
                        <Input id="shootDate" name="shootDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="isPrivate" name="isPrivate" />
                        <Label htmlFor="isPrivate">Private Shoot</Label>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gold text-black hover:bg-gold-muted"
                        disabled={createShootMutation.isPending}
                      >
                        {createShootMutation.isPending ? 'Creating...' : 'Create Shoot'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search shoots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Shoots List */}
              <div className="grid md:grid-cols-2 gap-6">
                {shootsLoading ? (
                  <div className="col-span-2 text-center py-8">Loading shoots...</div>
                ) : filteredShoots.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-saira font-bold mb-2">No Shoots Found</h3>
                    <p className="text-muted-foreground">Create your first shoot to get started.</p>
                  </div>
                ) : (
                  filteredShoots.map((shoot) => {
                    const client = clients.find(c => c.id === shoot.clientId);
                    return (
                      <Card key={shoot.id} className="bg-black border-border hover:border-gold transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg font-saira font-bold text-gold">
                                {shoot.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Client: {client?.name || 'Unknown'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {shoot.isPrivate ? (
                                <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Private
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Public
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {shoot.description && (
                              <p className="text-sm text-muted-foreground">{shoot.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm">
                              {shoot.shootDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 icon-salmon" />
                                  {new Date(shoot.shootDate).toLocaleDateString()}
                                </div>
                              )}
                              {shoot.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 icon-cyan" />
                                  {shoot.location}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <Eye className="w-4 h-4 icon-salmon" />
                              <span>{shoot.viewCount} views</span>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" className="flex-1 bg-gold text-black hover:bg-gold-muted">
                                <Upload className="w-4 h-4 mr-2 icon-cyan" />
                                Upload Images
                              </Button>
                              <Button size="sm" variant="outline" className="border-border hover:border-gold">
                                <Edit className="w-4 h-4 icon-salmon" />
                              </Button>
                              <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                <Trash2 className="w-4 h-4 icon-salmon" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-saira font-black">
                  Manage <span className="text-gold">Images</span>
                </h2>
                <Button className="bg-gold text-black hover:bg-gold-muted">
                  <Upload className="w-4 h-4 mr-2 icon-salmon" />
                  Bulk Upload
                </Button>
              </div>

              <div className="text-center py-16">
                <FileImage className="w-16 h-16 icon-cyan mx-auto mb-4" />
                <h3 className="text-xl font-saira font-bold mb-2">Image Management</h3>
                <p className="text-muted-foreground">Upload and organize images for your shoots.</p>
              </div>
            </div>
          )}

          {/* Gallery Management Tab */}
          {activeTab === 'galleries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-saira font-black">
                  Gallery <span className="text-gold">Management</span>
                </h2>
                <Button 
                  className="bg-gold text-black hover:bg-gold-muted"
                  onClick={() => setGallerySettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2 icon-salmon" />
                  Gallery Settings
                </Button>
              </div>

              {/* Shoot Selection */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredShoots.map((shoot) => (
                  <Card 
                    key={shoot.id} 
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedShoot === shoot.id ? 'ring-2 ring-gold bg-charcoal' : 'bg-charcoal/80'
                    }`}
                    onClick={() => setSelectedShoot(shoot.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-gold">{shoot.title}</CardTitle>
                        <Badge variant="outline" className="border-gold text-gold">
                          {shoot.shootType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 icon-salmon" />
                          {shoot.shootDate ? new Date(shoot.shootDate).toLocaleDateString() : 'No date'}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 icon-cyan" />
                          {shoot.location || 'No location'}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 icon-salmon" />
                            <span>{shoot.viewCount} views</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-border hover:border-gold">
                              <ExternalLink className="w-4 h-4 icon-cyan" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:border-gold"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(`/gallery/${shoot.customSlug}`);
                                toast({ title: "Gallery URL copied to clipboard!" });
                              }}
                            >
                              <Copy className="w-4 h-4 icon-salmon" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedShoot && (
                <GalleryEditor shootId={selectedShoot} />
              )}

              {!selectedShoot && (
                <div className="text-center py-16">
                  <Palette className="w-16 h-16 icon-cyan mx-auto mb-4" />
                  <h3 className="text-xl font-saira font-bold mb-2">Select a Gallery</h3>
                  <p className="text-muted-foreground">Choose a shoot above to manage its gallery settings and image sequence.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
