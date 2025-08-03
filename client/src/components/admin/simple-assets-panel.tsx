import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Edit, Check, X } from 'lucide-react';
import { DirectImage } from '@/components/shared/direct-image';
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
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
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
      setUploadingAsset(key);
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
      setUploadingAsset(null);
      // Refresh the assets data to show new image immediately
      queryClient.invalidateQueries({ queryKey: ['/api/simple-assets'] });
      queryClient.refetchQueries({ queryKey: ['/api/simple-assets'] });
      
      toast({
        title: 'Upload Successful',
        description: `${ASSET_LABELS[key]} has been updated.`,
        className: 'success-message',
      });
    },
    onError: (error, { key }) => {
      setUploadingAsset(null);
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${ASSET_LABELS[key]}.`,
        className: 'error-message',
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
        className: 'success-message',
      });
    },
    onError: (error, key) => {
      toast({
        title: 'Delete Failed',
        description: `Failed to delete ${ASSET_LABELS[key]}.`,
        className: 'error-message',
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
        className: 'error-message',
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

  // Alt text update mutation
  const altTextMutation = useMutation({
    mutationFn: async ({ key, altText }: { key: string; altText: string }) => {
      const response = await fetch(`/api/simple-assets/${key}/alt-text`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ altText }),
      });
      
      if (!response.ok) {
        throw new Error('Alt text update failed');
      }
      
      return response.json();
    },
    onSuccess: (data, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simple-assets'] });
      toast({
        title: 'Alt Text Updated',
        description: `${ASSET_LABELS[key]} alt text has been updated.`,
        className: 'success-message',
      });
      setEditingAlt(null);
    },
    onError: (error, { key }) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update alt text for ${ASSET_LABELS[key]}.`,
        className: 'error-message',
      });
    },
  });

  const saveAltText = () => {
    if (editingAlt && altTextValue.trim()) {
      altTextMutation.mutate({ key: editingAlt, altText: altTextValue.trim() });
    } else {
      setEditingAlt(null);
    }
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
            <Card key={i} className="border border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-purple-900/50 animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-video bg-slate-700/50 rounded mb-4"></div>
                <div className="h-4 bg-slate-600/50 rounded mb-2"></div>
                <div className="h-8 bg-slate-600/50 rounded"></div>
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
              className={`border transition-all duration-200 bg-gradient-to-br from-slate-900/90 to-purple-900/50 backdrop-blur-sm ${
                draggedOver === asset.key 
                  ? 'border-purple-400 shadow-lg shadow-purple-500/25 scale-[1.02]' 
                  : 'border-purple-500/30 hover:border-purple-400/50 hover:shadow-md hover:shadow-purple-500/10'
              }`}
              onDragOver={(e) => handleDragOver(e, asset.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, asset.key)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">
                  {ASSET_LABELS[asset.key]}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Image Preview with Upload Preloader */}
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-800/50 border border-purple-500/30 relative">
                  {uploadingAsset === asset.key && (
                    <div className="absolute inset-0 upload-preloader flex items-center justify-center z-10">
                      <div className="text-center text-purple-200">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Uploading...</p>
                      </div>
                    </div>
                  )}
                  {asset.exists ? (
                    <DirectImage
                      filename={asset.filename}
                      alt={asset.altText}
                      className="w-full h-full object-cover"
                      key={`${asset.key}-${Date.now()}`}
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

                {/* Alt Text with Upload Button */}
                {editingAlt === asset.key ? (
                  <div className="flex space-x-2">
                    <Input
                      value={altTextValue}
                      onChange={(e) => {
                        // Clean input: remove special chars and limit to 100 chars
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 100);
                        setAltTextValue(cleaned);
                      }}
                      className="flex-1 bg-gray-800 border-purple-300 text-sm"
                      placeholder="Alt text description (max 100 chars)"
                      maxLength={100}
                    />
                    <Button size="sm" onClick={saveAltText} className="bg-purple-600 hover:bg-purple-700">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditingAlt}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-300 flex-1 truncate">{asset.altText}</span>
                    <div className="flex space-x-1">
                      <Label htmlFor={`upload-${asset.key}`}>
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={uploadMutation.isPending || uploadingAsset === asset.key}
                          onClick={() => document.getElementById(`upload-${asset.key}`)?.click()}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <input
                          id={`upload-${asset.key}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileInput(asset.key, e.target.files?.[0] || null)}
                        />
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingAlt(asset)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
              className={`border transition-all duration-200 bg-gradient-to-br from-slate-900/90 to-purple-900/50 backdrop-blur-sm ${
                draggedOver === asset.key 
                  ? 'border-purple-400 shadow-lg shadow-purple-500/25 scale-[1.02]' 
                  : 'border-purple-500/30 hover:border-purple-400/50 hover:shadow-md hover:shadow-purple-500/10'
              }`}
              onDragOver={(e) => handleDragOver(e, asset.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, asset.key)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">
                  {ASSET_LABELS[asset.key]}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Image Preview with Upload Preloader */}
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-800/50 border border-purple-500/30 relative">
                  {uploadingAsset === asset.key && (
                    <div className="absolute inset-0 upload-preloader flex items-center justify-center z-10">
                      <div className="text-center text-purple-200">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Uploading...</p>
                      </div>
                    </div>
                  )}
                  {asset.exists ? (
                    <DirectImage
                      filename={asset.filename}
                      alt={asset.altText}
                      className="w-full h-full object-cover"
                      key={`${asset.key}-${Date.now()}`}
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

                {/* Upload Button for Background Assets (no alt text editing) */}
                <div className="flex justify-center">
                  <Label htmlFor={`upload-bg-${asset.key}`}>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={uploadMutation.isPending || uploadingAsset === asset.key}
                      onClick={() => document.getElementById(`upload-bg-${asset.key}`)?.click()}
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