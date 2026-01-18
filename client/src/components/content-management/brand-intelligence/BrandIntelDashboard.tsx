import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Users, TrendingUp, DollarSign, Activity, Mail, Globe, Edit, Zap, MoreVertical, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Simple types for initial implementation
interface ContentClient {
  id: string;
  name: string;
  slug: string;
  email?: string;
  website_url?: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentClientsResponse {
  data: {
    clients: ContentClient[];
  };
}

interface BrandIntelligenceDashboardData {
  totalClients: number;
  activeClients: number;
  totalMonthlySpend: number;
  averageEngagementRate: number;
  topPerformingClients: any[];
  recentActivity: any[];
}

interface BrandIntelDashboardProps {
  className?: string;
}

export default function BrandIntelDashboard({ className = '' }: BrandIntelDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditClientForm, setShowEditClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ContentClient | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch all content clients
  const {
    data: clientsData,
    isLoading: clientsLoading,
    error: clientsError
  } = useQuery<ContentClientsResponse>({
    queryKey: ['content-clients'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/brand-intelligence/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch content clients');
      }
      return response.json();
    }
  });

  // Fetch dashboard overview data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
  } = useQuery<BrandIntelligenceDashboardData>({
    queryKey: ['brand-intelligence-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/brand-intelligence/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    }
  });

  const clients = clientsData?.data?.clients || [];
  
  // Create new client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: {
      name: string;
      email?: string;
      website_url?: string;
      industry?: string;
      brand_description?: string;
    }) => {
      const response = await fetch('/api/content-management/brand-intelligence/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-clients'] });
      queryClient.invalidateQueries({ queryKey: ['brand-intelligence-dashboard'] });
      setShowCreateForm(false);
    },
  });

  // Edit client mutation
  const editClientMutation = useMutation({
    mutationFn: async ({ clientId, clientData }: {
      clientId: string;
      clientData: {
        name: string;
        email?: string;
        website_url?: string;
        industry?: string;
      }
    }) => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-clients'] });
      queryClient.invalidateQueries({ queryKey: ['brand-intelligence-dashboard'] });
      setShowEditClientForm(false);
      setEditingClient(null);
    },
  });

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const clientData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      website_url: formData.get('website_url') as string || undefined,
      industry: formData.get('industry') as string || undefined,
      brand_description: formData.get('brand_description') as string || undefined,
    };

    try {
      await createClientMutation.mutateAsync(clientData);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleEditClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClient) return;
    
    const formData = new FormData(event.currentTarget);
    
    const clientData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      website_url: formData.get('website_url') as string || undefined,
      industry: formData.get('industry') as string || undefined,
    };

    try {
      await editClientMutation.mutateAsync({
        clientId: editingClient.id,
        clientData
      });
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-clients'] });
      queryClient.invalidateQueries({ queryKey: ['brand-intelligence-dashboard'] });
      setOpenDropdownId(null);
    },
  });

  // Navigate to separate client control centre page
  const handleClientSelect = (client: ContentClient) => {
    navigate(`/tools/brand-intelligence/client/${client.id}`);
  };

  // Handle client management actions
  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const handleEditClientInfo = (client: ContentClient) => {
    setEditingClient(client);
    setShowEditClientForm(true);
    setOpenDropdownId(null);
  };

  const handleEditBrandProfile = (clientId: string) => {
    navigate(`/tools/brand-intelligence/client/${clientId}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  if (clientsLoading || dashboardLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Loading Brand Intelligence Dashboard...</p>
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold text-salmon mb-2">Error Loading Dashboard</h3>
          <p className="text-xl text-muted-foreground mb-6">Unable to load brand intelligence data. Please try again.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['content-clients'] })}
            variant="destructive"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-32 pb-8">
      {/* Page Header */}
      <div className="mb-8">
        {/* Centred Back to Tools button */}
        <div className="flex justify-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tools')}
            className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-salmon mb-4">Brand Intelligence Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Overview of all clients and content generation activity
          </p>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            disabled={createClientMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {createClientMutation.isPending ? 'Creating...' : 'Add New Client'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">

          {/* Dashboard Metrics */}
          <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <h2 className="text-sm font-semibold text-cyan font-medium">Dashboard Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                <p className="text-sm text-gray-400">Total Clients</p>
                <p className="text-xl font-semibold text-white">{dashboardData?.totalClients || clients.length}</p>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <Activity className="h-6 w-6 mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-400">Active Clients</p>
                <p className="text-xl font-semibold text-white">{dashboardData?.activeClients || clients.filter(c => c.is_active).length}</p>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm text-gray-400">Monthly Spend</p>
                <p className="text-xl font-semibold text-white">${dashboardData?.totalMonthlySpend?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <p className="text-sm text-gray-400">Avg. Engagement</p>
                <p className="text-xl font-semibold text-white">{dashboardData?.averageEngagementRate?.toFixed(1) || '0.0'}%</p>
              </div>
            </div>
          </div>

          {/* Create Client Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-salmon">Add New Content Client</h2>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Client Name *</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Enter client name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="client@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url" className="text-white">Website URL</Label>
                    <Input
                      type="url"
                      id="website_url"
                      name="website_url"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-white">Industry</Label>
                    <Input
                      type="text"
                      id="industry"
                      name="industry"
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand_description" className="text-white">Initial Brand Description</Label>
                    <Textarea
                      id="brand_description"
                      name="brand_description"
                      rows={4}
                      placeholder="Brief description of the brand, values, and positioning..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={createClientMutation.isPending}
                    >
                      {createClientMutation.isPending ? 'Creating Client...' : 'Create Client'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Client Form Modal */}
          {showEditClientForm && editingClient && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-salmon">Edit Client Information</h2>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEditClientForm(false);
                      setEditingClient(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                
                <form onSubmit={handleEditClient} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-white">Client Name *</Label>
                    <Input
                      type="text"
                      id="edit-name"
                      name="name"
                      required
                      defaultValue={editingClient.name}
                      placeholder="Enter client name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-white">Email</Label>
                    <Input
                      type="email"
                      id="edit-email"
                      name="email"
                      defaultValue={editingClient.email || ''}
                      placeholder="client@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-website_url" className="text-white">Website URL</Label>
                    <Input
                      type="url"
                      id="edit-website_url"
                      name="website_url"
                      defaultValue={editingClient.website_url || ''}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-industry" className="text-white">Industry</Label>
                    <Input
                      type="text"
                      id="edit-industry"
                      name="industry"
                      defaultValue={editingClient.industry || ''}
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditClientForm(false);
                        setEditingClient(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={editClientMutation.isPending}
                    >
                      {editClientMutation.isPending ? 'Updating Client...' : 'Update Client'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Clients Grid */}
          <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-cyan font-medium">Content Clients</h2>
              <p className="text-sm text-gray-400">{clients.length} total clients</p>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-salmon mb-2">No content clients yet</h3>
                <p className="text-gray-400 mb-6">Create your first content client to start managing brand intelligence and AI content generation.</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Add First Client
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <div 
                    key={client.id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === client.id ? null : client.id);
                          }}
                          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdownId === client.id && (
                          <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10 min-w-[140px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClientInfo(client);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                            >
                              <Edit className="h-3 w-3" />
                              Edit Client Info
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBrandProfile(client.id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2"
                            >
                              <Settings className="h-3 w-3" />
                              Brand Profile
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                              disabled={deleteClientMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                              {deleteClientMutation.isPending ? 'Deleting...' : 'Delete Client'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge - moved below title */}
                    <div className="mb-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        client.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {client.industry && (
                        <p className="text-sm font-medium text-cyan">{client.industry}</p>
                      )}
                      
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-400">
                          <Mail className="h-3 w-3 mr-2" />
                          {client.email}
                        </div>
                      )}
                      
                      {client.website_url && (
                        <div className="flex items-center text-sm">
                          <Globe className="h-3 w-3 mr-2 text-gray-400" />
                          <a 
                            href={client.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan hover:text-cyan-light"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-400">
                        Created: {new Date(client.created_at).toLocaleDateString()}
                      </p>
                      
                      {/* Brand Profile Info */}
                      {(client as any).client_brand_profiles?.[0] && (
                        <div className="mt-2 p-2 bg-gray-700 rounded border">
                          <p className="text-xs font-medium text-gray-300 mb-1">
                            Brand Profile v{(client as any).client_brand_profiles[0].version}
                          </p>
                          
                          {/* Generation Limits Info */}
                          {(client as any).generation_limits && (
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-400 font-mono">
                                ${(client as any).generation_limits.current_month_spend || 0} / 
                                ${(client as any).generation_limits.max_monthly_cost || 0}
                              </p>
                              <div className="flex gap-1">
                                {(client as any).generation_limits.video_enabled && (
                                  <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">
                                    📹 Video
                                  </span>
                                )}
                                {(client as any).generation_limits.voice_enabled && (
                                  <span className="text-xs px-1 py-0.5 bg-purple-100 text-purple-800 rounded">
                                    🔊 Voice
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientSelect(client);
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Profile
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Generate content for:', client.id);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

          {/* Recent Activity */}
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
              <h2 className="text-sm font-semibold text-cyan font-medium">Recent Activity</h2>
              
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-cyan/20 rounded-full">
                      <span className="text-lg">
                        {activity.type === 'client_created' && '👥'}
                        {activity.type === 'profile_updated' && '✏️'}
                        {activity.type === 'content_generated' && '🎨'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white mb-1">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-400">
                        {activity.client.name} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}