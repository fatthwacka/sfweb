import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Trash2, Image, Package, Palette, Layers, Grid3X3, Loader2, AlertCircle, Check, Search } from 'lucide-react';

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
  size?: string;  // Product size: '50ml', 'palm-sized', etc.
  flavour?: string;  // Product variant/flavour: 'Orange', 'Vanilla', etc.
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'size-asc' | 'size-desc'>('newest');
  const [filterType, setFilterType] = useState<string>('all');

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

  // Filter and sort assets
  const filteredAndSortedAssets = React.useMemo(() => {
    let result = [...assets];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((asset: BrandAsset) => asset.asset_type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((asset: BrandAsset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.asset_type.toLowerCase().includes(query) ||
        asset.similar_to?.toLowerCase().includes(query) ||
        asset.usage_notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a: BrandAsset, b: BrandAsset) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'a-z':
          return a.name.localeCompare(b.name);
        case 'z-a':
          return b.name.localeCompare(a.name);
        case 'size-asc':
          return (a.file_size_bytes || 0) - (b.file_size_bytes || 0);
        case 'size-desc':
          return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [assets, searchQuery, sortBy, filterType]);

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

  // Track the last saved version to detect actual changes
  const lastSavedAssetRef = useRef<string>('');
  const currentAssetIdRef = useRef<string | null>(null);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (asset: Partial<BrandAsset> & { id: string }) => {
      console.log('[Autosave] Sending PUT request for asset:', asset.id);
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (!response.ok) throw new Error('Failed to update asset');
      return response.json();
    },
    onMutate: () => {
      console.log('[Autosave] onMutate - setting status to saving');
      setAutoSaveStatus('saving');
    },
    onSuccess: (_data, asset) => {
      console.log('[Autosave] onSuccess - save complete');
      queryClient.invalidateQueries({ queryKey: ['brand-assets', clientId] });
      // Update the lastSaved ref so we don't re-trigger autosave
      lastSavedAssetRef.current = JSON.stringify(asset);
      setAutoSaveStatus('saved');
      // Clear saved indicator after 3 seconds
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
      savedIndicatorTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    },
    onError: (error) => {
      console.error('[Autosave] onError:', error);
      setAutoSaveStatus('idle');
    },
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // When selecting a new asset, store its initial state
  useEffect(() => {
    if (selectedAsset && selectedAsset.id !== currentAssetIdRef.current) {
      currentAssetIdRef.current = selectedAsset.id;
      lastSavedAssetRef.current = JSON.stringify(selectedAsset);
      setAutoSaveStatus('idle');
    }
  }, [selectedAsset?.id]);

  // Autosave effect - triggers 2000ms after selectedAsset is edited
  useEffect(() => {
    // Skip if no asset selected
    if (!selectedAsset) return;

    // Compare current state to last saved state
    const currentState = JSON.stringify(selectedAsset);
    if (currentState === lastSavedAssetRef.current) {
      return; // No changes
    }

    // Asset was edited - trigger autosave with debounce
    console.log('[Autosave] Change detected, will save in 500ms');
    setAutoSaveStatus('pending');

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      console.log('[Autosave] Triggering save for:', selectedAsset.name);
      updateMutation.mutate(selectedAsset);
    }, 500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedAsset, updateMutation]);

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
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndUpload(file);
  }, [processAndUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  // Update asset field
  const updateAssetField = (field: keyof BrandAsset, value: any) => {
    if (!selectedAsset) return;
    const updated = { ...selectedAsset, [field]: value };
    setSelectedAsset(updated);
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
            {/* Search, Filter & Sort Bar */}
            <div className="flex gap-2 mb-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded pl-7 pr-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                {ASSET_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="a-z">A → Z</option>
                <option value="z-a">Z → A</option>
                <option value="size-desc">Size ↓</option>
                <option value="size-asc">Size ↑</option>
              </select>
            </div>

            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-all duration-200 ${
                isUploading
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : uploadError
                  ? 'border-red-500/50 bg-red-500/5'
                  : isDragOver
                  ? 'border-cyan-400 bg-cyan-500/20 scale-[1.02] shadow-lg shadow-cyan-500/20'
                  : 'border-gray-600 hover:border-cyan-500/50 hover:bg-gray-800/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
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
              ) : isDragOver ? (
                <>
                  <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm text-cyan-400 font-medium">Drop to upload</p>
                  <p className="text-xs text-cyan-500/70 mt-1">Release to start uploading</p>
                </>
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
            ) : filteredAndSortedAssets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No assets match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredAndSortedAssets.map((asset: BrandAsset) => (
                  <div
                    key={asset.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all bg-slate-800/80 ${
                      selectedAsset?.id === asset.id
                        ? 'border-orange-500 ring-2 ring-orange-500/30'
                        : 'border-slate-700/50 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <img
                      src={asset.thumbnail_url || asset.image_url}
                      alt={asset.name}
                      className="w-full aspect-square object-contain p-1"
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Size</label>
                      <input
                        type="text"
                        value={selectedAsset.size || ''}
                        onChange={(e) => updateAssetField('size', e.target.value)}
                        placeholder="e.g., 1.7oz, 50ml, small"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Flavour / Variant</label>
                      <input
                        type="text"
                        value={selectedAsset.flavour || ''}
                        onChange={(e) => updateAssetField('flavour', e.target.value)}
                        placeholder="e.g., Strawberry, Original"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                      />
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
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  {/* Autosave status indicator */}
                  <div className="flex items-center gap-2 text-sm min-h-[24px]">
                    {autoSaveStatus === 'pending' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                        <span className="text-amber-400">Saving... please wait</span>
                      </>
                    )}
                    {autoSaveStatus === 'saving' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        <span className="text-cyan-400">Saving...</span>
                      </>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <>
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">All changes saved</span>
                      </>
                    )}
                    {autoSaveStatus === 'idle' && (
                      <span className="text-gray-500 text-xs">Auto-save enabled</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this asset?')) {
                        deleteMutation.mutate(selectedAsset.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
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
