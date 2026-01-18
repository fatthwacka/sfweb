import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Trash2, Image, Package, Palette, Layers, Grid3X3, Plus, Loader2, AlertCircle } from 'lucide-react';

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Target compressed size: ~2MB for efficient storage
const TARGET_COMPRESSED_SIZE = 2 * 1024 * 1024;

// Compression quality settings
const COMPRESSION_QUALITY = 0.85;
const MAX_DIMENSION = 2048; // Max width/height for compressed images

/**
 * Compress an image file to JPG format with quality reduction
 * Returns base64 data URL and dimensions
 */
async function compressImage(file: File): Promise<{
  base64: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with white background (for transparency handling)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPG with compression
      const base64 = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);

      // Calculate compressed size (base64 is ~33% larger than binary)
      const compressedSize = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);

      resolve({
        base64,
        width,
        height,
        originalSize: file.size,
        compressedSize,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

interface BrandAsset {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  asset_type: 'product' | 'logo' | 'material' | 'style_reference' | 'background' | 'texture';
  image_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  file_size_bytes?: number;
  mime_type?: string;
  dominant_colours?: string[];
  material?: string;
  similar_to?: string;
  usage_notes?: string;
  placement_guidance?: string;
  scale_preference?: string;
  preferred_angle?: string;
  lighting_notes?: string;
  tags?: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface BrandAssetsEditorProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ASSET_TYPES = [
  { value: 'product', label: 'Product', icon: Package },
  { value: 'logo', label: 'Logo', icon: Image },
  { value: 'material', label: 'Material', icon: Layers },
  { value: 'style_reference', label: 'Style Ref', icon: Palette },
  { value: 'background', label: 'Background', icon: Grid3X3 },
  { value: 'texture', label: 'Texture', icon: Layers },
];

const MATERIALS = [
  'glass', 'metal', 'fabric', 'wood', 'plastic', 'ceramic', 'leather',
  'paper', 'stone', 'liquid', 'gel', 'powder', 'other'
];

export default function BrandAssetsEditor({ clientId, isOpen, onClose }: BrandAssetsEditorProps) {
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch assets
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['brand-assets', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}/assets`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    },
    enabled: isOpen,
  });

  const assets = assetsData?.assets || [];

  // Upload mutation - sends compressed base64 to backend
  const uploadMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      base64: string;
      width: number;
      height: number;
      originalSize: number;
      compressedSize: number;
      assetType: string;
    }) => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}/assets/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload asset');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-assets', clientId] });
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadError(null);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadError(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (asset: Partial<BrandAsset> & { id: string }) => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (!response.ok) throw new Error('Failed to update asset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-assets', clientId] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}/assets/${assetId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete asset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-assets', clientId] });
      setSelectedAsset(null);
    },
  });

  // Process and upload file with compression
  const processAndUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, GIF, or BMP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('Reading image...');
    setUploadError(null);

    try {
      // Compress the image
      setUploadProgress(30);
      setUploadStatus('Compressing image...');

      const compressed = await compressImage(file);

      setUploadProgress(60);
      setUploadStatus('Uploading to storage...');

      // Extract name without extension
      const name = file.name.replace(/\.[^/.]+$/, '');

      // Upload via API
      uploadMutation.mutate({
        name,
        base64: compressed.base64,
        width: compressed.width,
        height: compressed.height,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        assetType: 'product',
      });

      setUploadProgress(90);
      setUploadStatus('Finalising...');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to process image');
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  }, [uploadMutation]);

  // Handle file upload from input
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUpload(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [processAndUpload]);

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndUpload(file);
  }, [processAndUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Update asset field
  const updateAssetField = (field: keyof BrandAsset, value: any) => {
    if (!selectedAsset) return;
    const updated = { ...selectedAsset, [field]: value };
    setSelectedAsset(updated);
  };

  // Save current asset
  const saveAsset = () => {
    if (!selectedAsset) return;
    updateMutation.mutate(selectedAsset);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Brand Assets</h2>
            <p className="text-sm text-gray-400">Upload and manage product images, logos, and style references</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Asset Grid */}
          <div className="w-1/2 border-r border-gray-700 p-4 overflow-y-auto">
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${
                isUploading
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : uploadError
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-gray-600 hover:border-cyan-500/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !isUploading && document.getElementById('asset-upload')?.click()}
            >
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                  <p className="text-sm text-cyan-400">{uploadStatus || 'Processing...'}</p>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : uploadError ? (
                <div className="space-y-2">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
                  <p className="text-sm text-red-400">{uploadError}</p>
                  <p className="text-xs text-gray-500">Click to try again</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Drop image here or click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, BMP up to 20MB • Auto-compressed to JPG</p>
                </>
              )}
              <input
                id="asset-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Asset Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No assets uploaded yet</p>
                <p className="text-sm mt-1">Upload your first brand asset above</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {assets.map((asset: BrandAsset) => (
                  <div
                    key={asset.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedAsset?.id === asset.id
                        ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <img
                      src={asset.thumbnail_url || asset.image_url}
                      alt={asset.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs text-white truncate">{asset.name}</p>
                        <p className="text-xs text-gray-400">{asset.asset_type}</p>
                      </div>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-gray-300">
                      {asset.asset_type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Asset Details */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedAsset ? (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={selectedAsset.image_url}
                    alt={selectedAsset.name}
                    className="w-full max-h-48 object-contain"
                  />
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedAsset.name}
                      onChange={(e) => updateAssetField('name', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={selectedAsset.asset_type}
                        onChange={(e) => updateAssetField('asset_type', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                      >
                        {ASSET_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Material</label>
                      <select
                        value={selectedAsset.material || ''}
                        onChange={(e) => updateAssetField('material', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select...</option>
                        {MATERIALS.map((m) => (
                          <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Similar To (describe the object)</label>
                    <input
                      type="text"
                      value={selectedAsset.similar_to || ''}
                      onChange={(e) => updateAssetField('similar_to', e.target.value)}
                      placeholder="e.g., perfume bottle, skincare jar, wine glass"
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Usage Notes</label>
                    <textarea
                      value={selectedAsset.usage_notes || ''}
                      onChange={(e) => updateAssetField('usage_notes', e.target.value)}
                      placeholder="e.g., Use as hero product, works well with marble surfaces"
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 resize-none"
                    />
                  </div>

                  {/* Dimensions display */}
                  {(selectedAsset.width || selectedAsset.height) && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{selectedAsset.width} x {selectedAsset.height}px</span>
                      {selectedAsset.file_size_bytes && (
                        <span>{(selectedAsset.file_size_bytes / 1024).toFixed(0)}KB</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={saveAsset}
                    disabled={updateMutation.isPending}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this asset?')) {
                        deleteMutation.mutate(selectedAsset.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Image className="h-12 w-12 mb-3 opacity-50" />
                <p>Select an asset to edit</p>
                <p className="text-sm mt-1">or upload a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
