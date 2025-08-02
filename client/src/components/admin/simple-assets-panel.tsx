import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Edit, Check, X } from 'lucide-react';
// img removed - using direct img tags with filePath
import { useToast } from '@/hooks/use-toast';

interface LocalAsset {
  key: string;
  filename: string;
  altText: string;
  exists: boolean;
  filePath: string;
}

const ASSET_LABELS: Record<string, string> = {
  'hero-main': 'Main Home Page Hero',
  'hero-services': 'Photography Services Landing',
  'hero-weddings': 'Weddings Portfolio Hero',
  'hero-portraits': 'Portraits Portfolio Hero',
  'hero-corporate': 'Corporate Photography Hero',
  'hero-events': 'Events Portfolio Hero',
  'hero-graduation': 'Graduation Photography Hero',
  'hero-products': 'Product Photography Hero',
  'hero-matric': 'Matric Dance Photography Hero',
  'bg-studio': 'Main Site Background',
  'bg-wedding': 'Wedding Portfolio Background',
  'bg-portrait': 'Portrait Studio Background'
};

export function SimpleAssetsPanel() {
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altTextValue, setAltTextValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all assets
  const { data: assets = [], isLoading } = useQuery<LocalAsset[]>({
    queryKey: ['/api/simple-assets'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ key, file }: { key: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/simple-assets/${key}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simple-assets'] });
      toast({
        title: 'Upload Successful',
        description: `${ASSET_LABELS[key]} has been updated.`,
      });
    },
    onError: (error, { key }) => {
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${ASSET_LABELS[key]}.`,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/simple-assets/${key}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      return response.json();
    },
    onSuccess: (data, key) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simple-assets'] });
      toast({
        title: 'Asset Deleted',
        description: `${ASSET_LABELS[key]} has been removed.`,
      });
    },
    onError: (error, key) => {
      toast({
        title: 'Delete Failed',
        description: `Failed to delete ${ASSET_LABELS[key]}.`,
        variant: 'destructive',
      });
    },
  });

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDraggedOver(key);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDraggedOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      uploadMutation.mutate({ key, file: imageFile });
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please drop an image file.',
        variant: 'destructive',
      });
    }
  };

  const handleFileInput = (key: string, file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      uploadMutation.mutate({ key, file });
    }
  };

  const startEditingAlt = (asset: LocalAsset) => {
    setEditingAlt(asset.key);
    setAltTextValue(asset.altText);
  };

  const saveAltText = () => {
    // For now, just close the editor since alt text is embedded in pages
    // In the future, this could update a separate alt text storage system
    setEditingAlt(null);
    toast({
      title: 'Alt Text Note',
      description: 'Alt text is embedded in page code. Update manually in components.',
    });
  };

  const cancelEditingAlt = () => {
    setEditingAlt(null);
    setAltTextValue('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Site Assets (Loading...)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="border-purple-200 animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-video bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const heroAssets = assets.filter(asset => asset.key.startsWith('hero-'));
  const backgroundAssets = assets.filter(asset => asset.key.startsWith('bg-'));

  return (
    <div className="space-y-8">
      {/* Hero Images Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Hero Images ({heroAssets.length} Total)
          </h2>
        </div>
        
        <p className="text-gray-400 mb-6">
          Primary images displayed on key pages across the photography website. Direct filename replacement system.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {heroAssets.map((asset) => (
            <Card 
              key={asset.key}
              className={`border-2 transition-all duration-200 ${
                draggedOver === asset.key 
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-purple-200 hover:border-purple-300'
              }`}
              onDragOver={(e) => handleDragOver(e, asset.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, asset.key)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">
                  {ASSET_LABELS[asset.key]}
                </CardTitle>
                <p className="text-sm text-gray-400">
                  {asset.exists ? 'Custom image active' : 'Using default image'}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Image Preview */}
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 border border-purple-300">
                  {asset.exists ? (
                    <img
                      src={asset.filePath}
                      alt={asset.altText}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No image uploaded</p>
                        <p className="text-xs text-gray-500">{asset.filename}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                  <Label className="text-white">Alt Text</Label>
                  {editingAlt === asset.key ? (
                    <div className="flex space-x-2">
                      <Input
                        value={altTextValue}
                        onChange={(e) => setAltTextValue(e.target.value)}
                        className="flex-1 bg-gray-800 border-purple-300"
                        placeholder="Alt text description"
                      />
                      <Button size="sm" onClick={saveAltText} className="bg-purple-600 hover:bg-purple-700">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditingAlt}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 flex-1">{asset.altText}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingAlt(asset)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Label htmlFor={`upload-${asset.key}`} className="flex-1">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={uploadMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      id={`upload-${asset.key}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInput(asset.key, e.target.files?.[0] || null)}
                    />
                  </Label>
                  
                  {asset.exists && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(asset.key)}
                      disabled={deleteMutation.isPending}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Background Images Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Background Images ({backgroundAssets.length} Total)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {backgroundAssets.map((asset) => (
            <Card 
              key={asset.key}
              className={`border-2 transition-all duration-200 ${
                draggedOver === asset.key 
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-purple-200 hover:border-purple-300'
              }`}
              onDragOver={(e) => handleDragOver(e, asset.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, asset.key)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">
                  {ASSET_LABELS[asset.key]}
                </CardTitle>
                <p className="text-sm text-gray-400">
                  {asset.exists ? 'Custom image active' : 'Using default image'}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Image Preview */}
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 border border-purple-300">
                  {asset.exists ? (
                    <img
                      src={asset.filePath}
                      alt={asset.altText}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No image uploaded</p>
                        <p className="text-xs text-gray-500">{asset.filename}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Label htmlFor={`upload-bg-${asset.key}`} className="flex-1">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={uploadMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      id={`upload-bg-${asset.key}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInput(asset.key, e.target.files?.[0] || null)}
                    />
                  </Label>
                  
                  {asset.exists && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(asset.key)}
                      disabled={deleteMutation.isPending}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}