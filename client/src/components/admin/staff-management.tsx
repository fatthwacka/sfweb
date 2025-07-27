import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Shield,
  Crown,
  User
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  fullName?: string;
  role: "super_admin" | "staff" | "client";
  profileImageUrl?: string;
  bannerImageUrl?: string;
  themePreference: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateStaffData {
  email: string;
  fullName: string;
  role: "staff" | "super_admin";
  password: string;
}

interface UpdateStaffData {
  fullName?: string;
  role?: "staff" | "super_admin";
  themePreference?: string;
}

export function StaffManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [newStaffOpen, setNewStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "staff" as "staff" | "super_admin",
    password: ""
  });

  // Fetch all staff members (super_admin and staff roles only)
  const { data: staffMembers, isLoading: staffLoading } = useQuery<Profile[]>({
    queryKey: ["/api/staff"],
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffData) => apiRequest("POST", "/api/staff", data),
    onSuccess: () => {
      toast({
        title: "Staff Member Added",
        description: "New staff member has been successfully created."
      });
      setNewStaffOpen(false);
      setFormData({ email: "", fullName: "", role: "staff", password: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member.",
        variant: "destructive"
      });
    }
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffData }) => 
      apiRequest("PATCH", `/api/staff/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Staff Member Updated",
        description: "Staff member details have been successfully updated."
      });
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member.",
        variant: "destructive"
      });
    }
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      toast({
        title: "Staff Member Removed",
        description: "Staff member has been successfully removed."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member.",
        variant: "destructive"
      });
    }
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate(formData);
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    updateStaffMutation.mutate({
      id: editingStaff.id,
      data: {
        fullName: formData.fullName,
        role: formData.role,
      }
    });
  };

  const handleDeleteStaff = (staff: Profile) => {
    if (staff.role === "super_admin") {
      toast({
        title: "Cannot Delete Super Admin",
        description: "Super admin accounts cannot be deleted for security reasons.",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Are you sure you want to remove ${staff.fullName || staff.email}? This action cannot be undone.`)) {
      deleteStaffMutation.mutate(staff.id);
    }
  };

  const filteredStaffMembers = staffMembers?.filter(staff =>
    (staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     staff.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="w-4 h-4 text-salmon" />;
      case "staff":
        return <Shield className="w-4 h-4 text-cyan" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-salmon text-white">Super Admin</Badge>;
      case "staff":
        return <Badge className="bg-cyan text-black">Staff</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-saira font-bold text-salmon">Staff Management</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={newStaffOpen} onOpenChange={setNewStaffOpen}>
            <DialogTrigger asChild>
              <Button className="bg-salmon text-white hover:bg-salmon-muted">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-md">
              <DialogHeader>
                <DialogTitle className="text-salmon">Add New Staff Member</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new staff account with appropriate permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@slyfox.co.za"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: "staff" | "super_admin") => 
                    setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter temporary password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-salmon text-white hover:bg-salmon-muted"
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending ? "Creating..." : "Add Staff Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Staff Members Grid */}
      <div className="grid gap-4">
        {staffLoading ? (
          <div className="text-center py-8">Loading staff members...</div>
        ) : filteredStaffMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No staff members found matching your search.' : 'No staff members found.'}
          </div>
        ) : (
          filteredStaffMembers.map(staff => (
            <Card key={staff.id} className="admin-gradient-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(staff.role)}
                      <h3 className="text-lg font-semibold text-salmon">
                        {staff.fullName || staff.email}
                      </h3>
                      {getRoleBadge(staff.role)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 icon-cyan" />
                        {staff.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(staff.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-border hover:border-salmon text-white"
                      onClick={() => {
                        setEditingStaff(staff);
                        setFormData({
                          email: staff.email,
                          fullName: staff.fullName || "",
                          role: staff.role as "staff" | "super_admin",
                          password: ""
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {staff.role !== "super_admin" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-border hover:border-red-500 text-white"
                        onClick={() => handleDeleteStaff(staff)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
        <DialogContent className="bg-cyan-dark border border-cyan/30 shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-salmon">Edit Staff Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update staff member details and permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div>
              <Label htmlFor="editEmail">Email Address</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select value={formData.role} onValueChange={(value: "staff" | "super_admin") => 
                setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-salmon text-white hover:bg-salmon-muted"
              disabled={updateStaffMutation.isPending}
            >
              {updateStaffMutation.isPending ? "Updating..." : "Update Staff Member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}