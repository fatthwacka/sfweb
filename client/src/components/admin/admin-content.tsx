import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
                      <DialogContent className="bg-charcoal border-border">
                        <DialogHeader>
                          <DialogTitle className="text-gold">Add New Client</DialogTitle>
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
                          <Button type="submit" disabled={createClientMutation.isPending} className="bg-gold text-black hover:bg-gold-muted">
                            {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={newShootOpen} onOpenChange={setNewShootOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-20 flex-col gap-2 bg-gold text-black hover:bg-gold-muted">
                          <Camera className="w-6 h-6 icon-cyan" />
                          <span className="text-sm">Add Shoot</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-charcoal border-border max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-gold">Add New Shoot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateShoot} className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="clientId">Client</Label>
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
                              <Label htmlFor="title">Title</Label>
                              <Input id="title" name="title" required />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="shootDate">Shoot Date</Label>
                              <Input id="shootDate" name="shootDate" type="date" required />
                            </div>
                            <div>
                              <Label htmlFor="location">Location</Label>
                              <Input id="location" name="location" required />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" />
                          </div>
                          <Button type="submit" disabled={createShootMutation.isPending} className="bg-gold text-black hover:bg-gold-muted">
                            {createShootMutation.isPending ? 'Creating...' : 'Create Shoot'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button className="h-20 flex-col gap-2 bg-charcoal border-border hover:border-gold">
                      <FileImage className="w-6 h-6 icon-salmon" />
                      <span className="text-sm">Upload Images</span>
                    </Button>

                    <Button className="h-20 flex-col gap-2 bg-charcoal border-border hover:border-gold">
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
                <h2 className="text-2xl font-saira font-bold text-gold">Clients Management</h2>
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
                      <Button className="bg-gold text-black hover:bg-gold-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Client
                      </Button>
                    </DialogTrigger>
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
                    <Card key={client.id} className="bg-black border-border">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gold">{client.name}</h3>
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
                            <Button size="sm" variant="outline" className="border-border hover:border-gold">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border hover:border-red-500">
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
                <h2 className="text-2xl font-saira font-bold text-gold">Shoots Management</h2>
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
                      <Button className="bg-gold text-black hover:bg-gold-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Shoot
                      </Button>
                    </DialogTrigger>
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
                    <Card key={shoot.id} className="bg-black border-border">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gold">{shoot.title}</h3>
                              {shoot.isPrivate && <Badge variant="outline" className="text-xs">Private</Badge>}
                            </div>
                            <p className="text-muted-foreground">{shoot.description}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground">
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
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-border hover:border-gold">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border hover:border-red-500">
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
                <h2 className="text-2xl font-saira font-bold text-gold">Images Management</h2>
                <Button className="bg-gold text-black hover:bg-gold-muted">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>

              <Card className="bg-black border-border">
                <CardContent className="p-8 text-center">
                  <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Images Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first images to get started with gallery management.
                  </p>
                  <Button className="bg-gold text-black hover:bg-gold-muted">
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
                <h2 className="text-2xl font-saira font-bold text-gold">Gallery Management</h2>
              </div>

              {/* Shoot Selection */}
              <Card className="bg-black border-border">
                <CardHeader>
                  <CardTitle className="text-gold">Select Shoot to Manage</CardTitle>
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
                <Card className="bg-black border-border">
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
    </>
  );
}