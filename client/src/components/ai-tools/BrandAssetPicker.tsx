/**
 * BrandAssetPicker - Modal for selecting brand assets from the asset library
 * Used in AI Image Generator to quickly fetch pre-uploaded product images
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Package, Loader2, FolderOpen, Building2 } from 'lucide-react';

interface BrandAsset {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  asset_type: string;
  image_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  material?: string;
  similar_to?: string;
  usage_notes?: string;
  placement_guidance?: string;
  scale_preference?: string;
}

interface ContentClient {
  id: string;
  name: string;
  slug: string;
  industry?: string;
}

interface BrandAssetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: BrandAsset, imageDataUrl: string, clientInfo?: { id: string; industry?: string }) => void;
  targetSlotLabel?: string; // e.g., "Product 1" for context
}

export default function BrandAssetPicker({
  isOpen,
  onClose,
  onSelectAsset,
  targetSlotLabel
}: BrandAssetPickerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAssetId, setLoadingAssetId] = useState<string | null>(null);

  // Fetch all content clients
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['content-clients-list'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/brand-intelligence/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: isOpen,
  });

  const clients: ContentClient[] = clientsData?.data?.clients || [];

  // Fetch assets for selected client
  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['brand-assets', selectedClientId],
    queryFn: async () => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${selectedClientId}/assets`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    },
    enabled: isOpen && !!selectedClientId,
  });

  const assets: BrandAsset[] = assetsData?.assets || [];

  // Filter assets by search query
  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.asset_type.toLowerCase().includes(query) ||
      asset.material?.toLowerCase().includes(query) ||
      asset.similar_to?.toLowerCase().includes(query)
    );
  });

  // Handle asset selection - fetch image as data URL and pass to parent with client context
  const handleSelectAsset = useCallback(async (asset: BrandAsset) => {
    setLoadingAssetId(asset.id);

    // Find the selected client to pass industry context
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const clientInfo = selectedClient ? {
      id: selectedClient.id,
      industry: selectedClient.industry,
    } : undefined;

    try {
      // Fetch the image and convert to data URL
      const response = await fetch(asset.image_url);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onSelectAsset(asset, dataUrl, clientInfo);
        setLoadingAssetId(null);
        onClose();
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error fetching asset image:', error);
      setLoadingAssetId(null);
      // Fallback: just pass the URL
      onSelectAsset(asset, asset.image_url, clientInfo);
      onClose();
    }
  }, [onSelectAsset, onClose, clients, selectedClientId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-400" />
              Brand Assets
              {targetSlotLabel && (
                <span className="text-sm text-gray-400 font-normal">
                  → {targetSlotLabel}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Select a pre-uploaded brand asset</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Client Selector */}
          <div className="w-48 border-r border-gray-700 p-3 overflow-y-auto">
            <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Clients</h3>
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            ) : clients.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No clients found</p>
            ) : (
              <div className="space-y-1">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedClientId === client.id
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.name}</span>
                    </div>
                    {client.industry && (
                      <p className="text-[10px] text-gray-500 truncate ml-5">{client.industry}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Asset Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedClientId ? (
              <>
                {/* Search */}
                <div className="p-3 border-b border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Asset Grid */}
                <div className="flex-1 overflow-y-auto p-3">
                  {isLoadingAssets ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{searchQuery ? 'No matching assets' : 'No assets uploaded'}</p>
                      <p className="text-xs mt-1">
                        {searchQuery ? 'Try a different search' : 'Add assets in Brand Intelligence'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleSelectAsset(asset)}
                          disabled={!!loadingAssetId}
                          className="relative group rounded-lg overflow-hidden border-2 border-gray-700 hover:border-amber-500/70 transition-all bg-gray-800 text-left disabled:opacity-50"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={asset.thumbnail_url || asset.image_url}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                            {loadingAssetId === asset.id && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-2 border-t border-gray-700">
                            <p className="text-xs text-white truncate">{asset.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                                {asset.asset_type}
                              </span>
                              {asset.material && (
                                <span className="text-[10px] text-gray-500">{asset.material}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Building2 className="h-12 w-12 mb-3 opacity-50" />
                <p>Select a client to view assets</p>
                <p className="text-xs mt-1">Assets are organised by client</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
