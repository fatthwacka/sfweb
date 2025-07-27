import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  UserPlus,
  Mail,
  Eye,
  Search,
  Users,
  Camera
} from "lucide-react";

interface Shoot {
  id: string;
  title: string;
  clientId: string;
  shootType: string;
  shootDate: string;
  location: string;
  createdAt: string;
}

interface CreateClientUserData {
  email: string;
  fullName: string;
  password: string;
  associatedShoots: string[];
}

export function ClientRegistration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShoots, setSelectedShoots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: ""
  });

  // Fetch all shoots to show for association
  const { data: shoots = [], isLoading: shootsLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"],
  });

  // Create client user mutation
  const createClientUserMutation = useMutation({
    mutationFn: (data: CreateClientUserData) => apiRequest("POST", "/api/client/register", data),
    onSuccess: () => {
      toast({
        title: "Client Account Created",
        description: "Client can now log in and access their galleries."
      });
      setNewClientOpen(false);
      setFormData({ email: "", fullName: "", password: "" });
      setSelectedShoots([]);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client account.",
        variant: "destructive"
      });
    }
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedShoots.length === 0) {
      toast({
        title: "No Shoots Selected",
        description: "Please select at least one shoot to associate with this client.",
        variant: "destructive"
      });
      return;
    }
    
    createClientUserMutation.mutate({
      ...formData,
      associatedShoots: selectedShoots
    });
  };

  const handleShootToggle = (shootId: string) => {
    setSelectedShoots(prev => 
      prev.includes(shootId) 
        ? prev.filter(id => id !== shootId)
        : [...prev, shootId]
    );
  };

  const filteredShoots = shoots.filter(shoot =>
    shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shoot.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shoot.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getShootTypeColor = (type: string) => {
    const colors = {
      'wedding': 'bg-pink-500',
      'portrait': 'bg-blue-500',
      'commercial': 'bg-green-500',
      'event': 'bg-purple-500',
      'lifestyle': 'bg-cyan-500',
      'other': 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-saira font-bold text-salmon">Client Registration</h2>
        <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
          <DialogTrigger asChild>
            <Button className="bg-salmon text-white hover:bg-salmon-muted">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Client Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-salmon">Create Client Account</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a login account for a client and associate them with their shoots.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateClient} className="space-y-6">
              {/* Client Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-salmon">Client Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientEmail">Email Address *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientFullName">Full Name *</Label>
                    <Input
                      id="clientFullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientPassword">Temporary Password *</Label>
                  <Input
                    id="clientPassword"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a temporary password"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Client can change this password after first login
                  </p>
                </div>
              </div>

              {/* Shoot Association */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-salmon">Associate Shoots</h3>
                  <div className="text-sm text-muted-foreground">
                    {selectedShoots.length} selected
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search shoots..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-md p-3">
                  {shootsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading shoots...</div>
                  ) : filteredShoots.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No shoots found matching your search.
                    </div>
                  ) : (
                    filteredShoots.map(shoot => (
                      <div 
                        key={shoot.id} 
                        className="flex items-center space-x-3 p-3 border border-border rounded-md hover:border-salmon transition-colors"
                      >
                        <Checkbox
                          id={`shoot-${shoot.id}`}
                          checked={selectedShoots.includes(shoot.id)}
                          onCheckedChange={() => handleShootToggle(shoot.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <label 
                              htmlFor={`shoot-${shoot.id}`}
                              className="font-medium text-salmon cursor-pointer"
                            >
                              {shoot.title}
                            </label>
                            <Badge className={`${getShootTypeColor(shoot.shootType)} text-white text-xs`}>
                              {shoot.shootType}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(shoot.shootDate)} • {shoot.location}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Current client: {shoot.clientId}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-salmon text-white hover:bg-salmon-muted"
                disabled={createClientUserMutation.isPending || selectedShoots.length === 0}
              >
                {createClientUserMutation.isPending ? "Creating Account..." : "Create Client Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instructions Card */}
      <Card className="admin-gradient-card">
        <CardHeader>
          <CardTitle className="text-xl font-saira font-bold text-salmon flex items-center gap-2">
            <Users className="w-5 h-5" />
            Client Registration System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-salmon text-white flex items-center justify-center font-bold text-xs">1</div>
              <div>
                <p className="font-medium text-foreground">Create Client Accounts</p>
                <p>Create login accounts for clients who need access to their private galleries.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan text-black flex items-center justify-center font-bold text-xs">2</div>
              <div>
                <p className="font-medium text-foreground">Associate Shoots</p>
                <p>Link existing shoots to the client account by updating the shoot's client email field.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">3</div>
              <div>
                <p className="font-medium text-foreground">Client Access</p>
                <p>Clients can log in at <code className="bg-background px-1 rounded">/login</code> and view their galleries at <code className="bg-background px-1 rounded">/client-portal</code>.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> When you create a client account, the system will automatically update 
              the selected shoots to use the client's email address for access control.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}