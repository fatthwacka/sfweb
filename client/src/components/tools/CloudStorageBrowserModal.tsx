/**
 * CloudStorageBrowserModal - Modal wrapper for Cloud Storage Browser in picker mode
 *
 * This component wraps the CloudStorageBrowserCore in a Dialog for use in:
 * - Article Editor
 * - Any other tool that needs to select images from Google Cloud Storage
 *
 * Flow:
 * 1. User browses folders (thumbnails, compressed, etc.)
 * 2. User clicks an image to select it
 * 3. User clicks "Use This Image" → modal closes and returns selected URL
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Grid, List, SortAsc, SortDesc, FileImage, Film, Folder, Check, Loader2, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

interface CloudFile {
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'other';
  mimeType: string;
  lastModified: string;
  publicUrl: string;
  bucket: string;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  images: number;
  videos: number;
  other: number;
}

interface FolderStats {
  count: number;
  size: number;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';
type FolderType = 'thumbnails/' | 'compressed-images/' | 'compressed-2400/' | 'ai-images/' | 'ai-videos/' | 'uploaded-images/';

export interface CloudStorageResult {
  imageUrl: string;
  filename: string;
  folder: string;
  size: number;
}

export interface CloudStorageBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (result: CloudStorageResult) => void;

  // Optional: restrict to specific folders
  allowedFolders?: FolderType[];

  // Optional: filter by file type
  fileTypeFilter?: 'image' | 'video' | 'all';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getFileIcon = (file: CloudFile) => {
  switch (file.type) {
    case 'image': return <FileImage className="w-4 h-4" />;
    case 'video': return <Film className="w-4 h-4" />;
    default: return <Folder className="w-4 h-4" />;
  }
};

// Get the corresponding full-res URL from thumbnail
const getFullResUrl = (file: CloudFile, targetFolder: string): string => {
  const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
  const bucket = file.bucket;

  if (targetFolder === 'compressed-images/') {
    return `https://storage.googleapis.com/${bucket}/compressed-images/${baseName}.jpg`;
  } else if (targetFolder === 'compressed-2400/') {
    return `https://storage.googleapis.com/${bucket}/compressed-2400/${baseName}.jpg`;
  } else if (targetFolder === 'ai-images/') {
    return `https://storage.googleapis.com/${bucket}/ai-images/${baseName}.png`;
  }
  return file.publicUrl;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CloudStorageBrowserModal({
  isOpen,
  onClose,
  onImageSelected,
  allowedFolders,
  fileTypeFilter = 'image',
}: CloudStorageBrowserModalProps) {
  // State
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [folderPrefix, setFolderPrefix] = useState<FolderType>('thumbnails/');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [folderStats, setFolderStats] = useState<Record<string, FolderStats>>({});

  // Available folders (respect allowedFolders if provided)
  const allFolders: { key: FolderType; label: string; emoji: string }[] = [
    { key: 'thumbnails/', label: 'Thumbnails', emoji: '🖼️' },
    { key: 'compressed-images/', label: 'Full Res JPG', emoji: '📷' },
    { key: 'compressed-2400/', label: '2400px JPG', emoji: '📐' },
    { key: 'ai-images/', label: 'Full Res PNG', emoji: '🎨' },
    { key: 'uploaded-images/', label: 'Uploads', emoji: '📤' },
    { key: 'ai-videos/', label: 'Videos', emoji: '🎬' },
  ];
  const availableFolders = allowedFolders
    ? allFolders.filter(f => allowedFolders.includes(f.key))
    : allFolders;

  // Load files when folder changes or modal opens
  useEffect(() => {
    if (isOpen) {
      loadFiles();
      setSelectedFile(null);
    }
  }, [folderPrefix, isOpen]);

  // Filter and sort files
  useEffect(() => {
    let filtered = [...files];

    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(f => f.type === fileTypeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFiles(filtered);
    setCurrentPage(1);
  }, [files, searchQuery, sortBy, sortOrder, fileTypeFilter]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const url = `/api/cloud-storage/files?prefix=${encodeURIComponent(folderPrefix)}`;
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer staff-token' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files);
      setStats(data.stats);
      if (data.folderStats) setFolderStats(data.folderStats);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cloud storage files',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file: CloudFile) => {
    setSelectedFile(file);
  };

  const handleConfirmSelection = () => {
    if (!selectedFile) return;

    // When selecting from thumbnails, return the 2400px compressed version for web use
    const imageUrl = folderPrefix === 'thumbnails/'
      ? getFullResUrl(selectedFile, 'compressed-2400/')
      : selectedFile.publicUrl;

    onImageSelected({
      imageUrl,
      filename: selectedFile.name,
      folder: folderPrefix,
      size: selectedFile.size,
    });

    // Clean up and close
    setSelectedFile(null);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSearchQuery('');
    onClose();
  };

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-700">
        <DialogHeader className="px-6 py-4 border-b border-slate-700 shrink-0">
          <DialogTitle className="text-xl text-salmon">☁️ Cloud Storage Browser</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
          {/* Controls Bar */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex flex-col gap-3">
              {/* Folder Tabs */}
              <div className="flex flex-wrap bg-slate-900/60 rounded-lg p-1 gap-1">
                {availableFolders.map((folder) => (
                  <button
                    key={folder.key}
                    onClick={() => {
                      setFolderPrefix(folder.key);
                      setSelectedFile(null);
                    }}
                    className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === folder.key
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {folder.emoji} {folder.label} ({folderStats[folder.key]?.count || 0})
                  </button>
                ))}
              </div>

              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 bg-slate-900/60 border-slate-600/40 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                    <SelectTrigger className="w-28 h-9 bg-slate-900/60 border-slate-600/40 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-9 w-9 bg-slate-900/60 border-slate-600/40 text-white hover:bg-slate-800"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="h-9 w-9 bg-slate-900/60 border-slate-600/40 text-white hover:bg-slate-800"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-salmon" />
                  <span>Loading files...</span>
                </div>
              </div>
            ) : paginatedFiles.length > 0 ? (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "space-y-2"
              }>
                {paginatedFiles.map((file) => {
                  const isSelected = selectedFile?.path === file.path;

                  return (
                    <div
                      key={file.path}
                      onClick={() => handleSelectFile(file)}
                      className={`cursor-pointer transition-all duration-200 ${
                        viewMode === 'grid'
                          ? "bg-white/5 border rounded-xl overflow-hidden"
                          : "bg-white/5 border rounded-xl p-3"
                      } ${isSelected
                        ? 'border-salmon ring-2 ring-salmon/30'
                        : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="aspect-square relative group">
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 z-10">
                                <div className="w-6 h-6 rounded-full bg-salmon flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}

                            {file.type === 'image' ? (
                              <img
                                src={file.publicUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : file.type === 'video' ? (
                              <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                <Film className="w-12 h-12 text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                <Folder className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="p-2">
                            <h3 className="text-xs font-medium text-white truncate">
                              {file.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-salmon flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">
                              {file.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {file.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No files found matching your search' : 'No files in this folder'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-slate-800 border-slate-600 text-white"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-slate-800 border-slate-600 text-white"
              >
                Next
              </Button>
            </div>
          )}

          {/* Selection Actions */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-slate-800/80 border border-salmon/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20">
                  {selectedFile.type === 'image' ? (
                    <img
                      src={selectedFile.publicUrl}
                      alt={selectedFile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[300px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  className="bg-salmon hover:bg-salmon/90 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use This Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CloudStorageBrowserModal;
