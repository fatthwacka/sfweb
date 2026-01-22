/**
 * Cloud Storage Browser - Browse and manage Google Cloud Storage files
 * Features:
 * - 4 folder tabs: Thumbnails (default), Full Res JPG, Full Res PNG, Videos
 * - Multi-select with checkbox UI
 * - Process Selected: converts PNG → JPG full-res + thumbnail
 * - Fast browsing via thumbnails, modal shows JPG full-res
 * - Download HD button for original PNG
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Download, Trash2, Eye, Search, Grid, List, SortAsc, SortDesc, FileImage, Film, Folder, ExternalLink, Check, ImagePlus, Loader2, X } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';

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
type FolderType = 'thumbnails/' | 'jpg-images/' | 'ai-images/' | 'ai-videos/';

// Video Thumbnail Component with optimized loading
function VideoThumbnail({ file }: { file: CloudFile }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        const thumbnailResponse = await fetch(`/api/cloud-storage/thumbnail/${file.bucket}/${file.path}`);

        if (thumbnailResponse.ok) {
          setThumbnailUrl(thumbnailResponse.url);
        } else {
          throw new Error('Thumbnail generation failed');
        }
      } catch (err) {
        console.error('Failed to load video thumbnail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadThumbnail();
  }, [file.bucket, file.path]);

  if (loading) {
    return (
      <div className="w-full h-full bg-black/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-salmon border-r-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Generating thumbnail...</span>
        </div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div className="w-full h-full bg-black/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Film className="w-12 h-12 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Video File</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <img
        src={thumbnailUrl}
        alt={`Thumbnail for ${file.name}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute top-2 right-2 pointer-events-none">
        <div className="bg-black/70 rounded-full p-1">
          <Film className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function CloudStorageBrowser() {
  const [, navigate] = useLocation();

  // State
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [folderPrefix, setFolderPrefix] = useState<FolderType>('thumbnails/'); // Default to thumbnails for fast loading
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [globalStats, setGlobalStats] = useState<FileStats | null>(null);
  const [folderStats, setFolderStats] = useState<Record<string, FolderStats>>({});

  // Multi-select state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  // Load files when folder prefix changes
  useEffect(() => {
    loadFiles();
    setSelectedFiles(new Set()); // Clear selection when changing folders
  }, [folderPrefix]);

  // Filter and sort files
  useEffect(() => {
    let filtered = files;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
      );
    }

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
  }, [files, searchQuery, sortBy, sortOrder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const url = folderPrefix
        ? `/api/cloud-storage/files?prefix=${encodeURIComponent(folderPrefix)}`
        : '/api/cloud-storage/files';
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer staff-token' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files);
      setStats(data.stats);
      if (data.globalStats) setGlobalStats(data.globalStats);
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

  // Get the corresponding file URL from another folder
  const getCorrespondingUrl = (file: CloudFile, targetFolder: string): string => {
    const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const bucket = file.bucket;

    if (targetFolder === 'jpg-images/') {
      return `https://storage.googleapis.com/${bucket}/jpg-images/${baseName}.jpg`;
    } else if (targetFolder === 'ai-images/') {
      // PNG files might have same name or .png extension
      return `https://storage.googleapis.com/${bucket}/ai-images/${baseName}.png`;
    }
    return file.publicUrl;
  };

  // Toggle file selection
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  // Select/deselect all visible files
  const toggleSelectAll = () => {
    if (selectedFiles.size === paginatedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(paginatedFiles.map(f => f.path)));
    }
  };

  // Process selected images (PNG → JPG full-res + thumbnail)
  const processSelectedImages = async () => {
    const selectedFilesList = files.filter(f => selectedFiles.has(f.path) && f.type === 'image');

    if (selectedFilesList.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select PNG images to process',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: selectedFilesList.length });

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < selectedFilesList.length; i++) {
      const file = selectedFilesList[i];
      setProcessingProgress({ current: i + 1, total: selectedFilesList.length });

      // Skip non-PNG files
      if (!file.name.toLowerCase().endsWith('.png')) {
        skippedCount++;
        continue;
      }

      try {
        // Load the original PNG image
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          // Use proxy to avoid CORS issues
          img.src = `/api/cloud-storage/download?bucket=${encodeURIComponent(file.bucket)}&path=${encodeURIComponent(file.path)}&filename=${encodeURIComponent(file.name)}`;
        });

        // Create full-res JPG (same dimensions, converted to JPG)
        const fullResCanvas = document.createElement('canvas');
        fullResCanvas.width = img.naturalWidth;
        fullResCanvas.height = img.naturalHeight;
        const fullResCtx = fullResCanvas.getContext('2d');
        if (!fullResCtx) throw new Error('Failed to get canvas context');

        // White background for transparency
        fullResCtx.fillStyle = '#FFFFFF';
        fullResCtx.fillRect(0, 0, fullResCanvas.width, fullResCanvas.height);
        fullResCtx.drawImage(img, 0, 0);

        const jpgFullResBase64 = fullResCanvas.toDataURL('image/jpeg', 0.92);

        // Create thumbnail (max 400px, maintain aspect ratio)
        const maxThumbSize = 400;
        let thumbWidth = img.naturalWidth;
        let thumbHeight = img.naturalHeight;

        if (thumbWidth > maxThumbSize || thumbHeight > maxThumbSize) {
          if (thumbWidth > thumbHeight) {
            thumbHeight = Math.round((thumbHeight / thumbWidth) * maxThumbSize);
            thumbWidth = maxThumbSize;
          } else {
            thumbWidth = Math.round((thumbWidth / thumbHeight) * maxThumbSize);
            thumbHeight = maxThumbSize;
          }
        }

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (!thumbCtx) throw new Error('Failed to get thumbnail canvas context');

        thumbCtx.fillStyle = '#FFFFFF';
        thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
        thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        const thumbnailBase64 = thumbCanvas.toDataURL('image/jpeg', 0.85);

        // Upload both versions
        const response = await fetch('/api/cloud-storage/upload-processed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer staff-token'
          },
          body: JSON.stringify({
            originalPath: file.path,
            jpgFullResBase64,
            thumbnailBase64,
            filename: file.name
          })
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log(`✅ Processed ${file.name}:`, result);
        successCount++;

      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        errorCount++;
      }
    }

    setIsProcessing(false);
    setSelectedFiles(new Set());

    // Show summary toast
    let message = `Processed ${successCount} image(s)`;
    if (skippedCount > 0) message += `, skipped ${skippedCount} non-PNG`;
    if (errorCount > 0) message += `, ${errorCount} failed`;

    toast({
      title: 'Processing Complete',
      description: message,
      variant: errorCount > 0 ? 'destructive' : 'default'
    });

    // Refresh file list
    await loadFiles();
  };

  // Delete selected files
  const deleteSelectedFiles = async () => {
    const selectedFilesList = files.filter(f => selectedFiles.has(f.path));

    if (selectedFilesList.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedFilesList.length} file(s)?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFilesList) {
      try {
        const response = await fetch('/api/cloud-storage/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer staff-token'
          },
          body: JSON.stringify({
            bucket: file.bucket,
            filePath: file.path
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setSelectedFiles(new Set());
    await loadFiles();

    toast({
      title: 'Delete Complete',
      description: `Deleted ${successCount} file(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default'
    });
  };

  const handleDownload = (file: CloudFile) => {
    const downloadUrl = `/api/cloud-storage/download?bucket=${encodeURIComponent(file.bucket)}&path=${encodeURIComponent(file.path)}&filename=${encodeURIComponent(file.name)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Download Started', description: `Downloading ${file.name}` });
  };

  // Download original PNG (for modal)
  const handleDownloadOriginalPng = (file: CloudFile) => {
    // Derive the PNG filename from current file
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const pngFilename = `${baseName}.png`;
    const pngPath = `ai-images/${pngFilename}`;

    const downloadUrl = `/api/cloud-storage/download?bucket=${encodeURIComponent(file.bucket)}&path=${encodeURIComponent(pngPath)}&filename=${encodeURIComponent(pngFilename)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = pngFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Download Started', description: `Downloading original PNG: ${pngFilename}` });
  };

  const handleOpenFullRes = (file: CloudFile) => {
    window.open(file.publicUrl, '_blank');
  };

  const handleDelete = async (file: CloudFile) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      const response = await fetch('/api/cloud-storage/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer staff-token'
        },
        body: JSON.stringify({ bucket: file.bucket, filePath: file.path })
      });

      if (!response.ok) throw new Error(`Failed to delete: ${response.status}`);

      setFiles(prev => prev.filter(f => f.path !== file.path));
      toast({ title: 'File Deleted', description: `${file.name} has been deleted` });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: 'Delete Failed', description: 'Failed to delete file', variant: 'destructive' });
    }
  };

  const handlePreview = (file: CloudFile) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

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

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  // Check if we're on the PNG folder (where processing is allowed)
  const canProcess = folderPrefix === 'ai-images/';
  const hasSelection = selectedFiles.size > 0;

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />

        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Page Header */}
          <div className="mb-8">
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
              <h1 className="text-4xl md:text-5xl font-bold text-salmon mb-4">
                ☁️ Cloud Storage Browser
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Browse AI-generated images and videos with fast thumbnail loading
              </p>
            </div>
          </div>

          {/* Global Stats Cards */}
          {(globalStats || stats) && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-cyan-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-cyan-300">{globalStats?.totalFiles || stats?.totalFiles || 0}</div>
                <div className="text-sm text-gray-300">Total Files</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-green-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-green-300">{formatFileSize(globalStats?.totalSize || stats?.totalSize || 0)}</div>
                <div className="text-sm text-gray-300">Total Size</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-purple-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-purple-300">{globalStats?.images || stats?.images || 0}</div>
                <div className="text-sm text-gray-300">Images</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-orange-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-orange-300">{globalStats?.videos || stats?.videos || 0}</div>
                <div className="text-sm text-gray-300">Videos</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-yellow-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-yellow-300">{globalStats?.other || stats?.other || 0}</div>
                <div className="text-sm text-gray-300">Other</div>
              </div>
            </div>
          )}

          {/* Unified Controls Bar */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-white/20 rounded-xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              {/* Top Row: Folder Selector */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* 4-Tab Folder Selector */}
                <div className="flex flex-wrap bg-gray-900/60 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setFolderPrefix('thumbnails/')}
                    className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === 'thumbnails/'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🖼️ Thumbnails ({folderStats['thumbnails/']?.count || 0})
                  </button>
                  <button
                    onClick={() => setFolderPrefix('jpg-images/')}
                    className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === 'jpg-images/'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📷 Full Res JPG ({folderStats['jpg-images/']?.count || 0})
                  </button>
                  <button
                    onClick={() => setFolderPrefix('ai-images/')}
                    className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === 'ai-images/'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🎨 Full Res PNG ({folderStats['ai-images/']?.count || 0})
                  </button>
                  <button
                    onClick={() => setFolderPrefix('ai-videos/')}
                    className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === 'ai-videos/'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🎬 Videos ({folderStats['ai-videos/']?.count || 0})
                  </button>
                </div>

                {/* Current Folder Stats */}
                <div className="flex items-center gap-3 bg-gray-900/40 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Folder:</span>
                    <span className="text-sm font-medium text-cyan-300">{stats?.totalFiles || 0} files</span>
                  </div>
                  <div className="w-px h-4 bg-gray-600" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-300">{formatFileSize(stats?.totalSize || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Search & Sort */}
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 bg-gray-900/60 border-gray-600/40 text-white placeholder-gray-400 focus:bg-gray-900/80"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                    <SelectTrigger className="w-28 h-9 bg-gray-900/60 border-gray-600/40 text-white focus:bg-gray-900/80">
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
                    className="h-9 w-9 bg-gray-900/60 border-gray-600/40 text-white hover:bg-gray-900/80"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="h-9 w-9 bg-gray-900/60 border-gray-600/40 text-white hover:bg-gray-900/80"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Bulk Actions Bar - appears when files are selected */}
          {hasSelection && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-salmon" />
                <span className="font-medium">{selectedFiles.size} selected</span>
              </div>

              <div className="w-px h-6 bg-white/20" />

              {/* Process button - only enabled on PNG folder */}
              <Button
                size="sm"
                onClick={processSelectedImages}
                disabled={!canProcess || isProcessing}
                className={`h-9 ${canProcess ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}
                title={canProcess ? 'Convert PNG to JPG + Thumbnail' : 'Switch to Full Res PNG folder to process'}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {processingProgress.current}/{processingProgress.total}
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Process
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={deleteSelectedFiles}
                disabled={isProcessing}
                className="h-9"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedFiles(new Set())}
                className="h-9 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-salmon border-r-transparent rounded-full animate-spin" />
                <span className="text-lg">Loading cloud storage files...</span>
              </div>
            </div>
          )}

          {/* Files Grid/List */}
          {!loading && (
            <>
              {/* Select All button */}
              {paginatedFiles.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="bg-gray-900/60 border-gray-600/40 text-white hover:bg-gray-900/80"
                  >
                    {selectedFiles.size === paginatedFiles.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {canProcess && (
                    <span className="text-sm text-gray-400">
                      Select PNG images to process into JPG + thumbnails
                    </span>
                  )}
                </div>
              )}

              {paginatedFiles.length > 0 ? (
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  : "space-y-2"
                }>
                  {paginatedFiles.map((file) => {
                    const isSelected = selectedFiles.has(file.path);

                    return (
                      <div
                        key={file.path}
                        className={`${viewMode === 'grid'
                          ? "bg-white/5 border rounded-xl overflow-hidden transition-all duration-200"
                          : "bg-white/5 border rounded-xl p-4 transition-all duration-200"
                        } ${isSelected
                          ? 'border-salmon/60 ring-2 ring-salmon/30'
                          : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            {/* Grid View */}
                            <div className="aspect-square relative group">
                              {/* Selection Checkbox - top right */}
                              <div
                                className="absolute top-2 left-2 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFileSelection(file.path);
                                }}
                              >
                                <div className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-salmon border-salmon'
                                    : 'bg-black/50 border-white/40 hover:border-white/70'
                                }`}>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                              </div>

                              {/* Clickable thumbnail area - opens modal */}
                              <div
                                className="w-full h-full cursor-pointer"
                                onClick={() => handlePreview(file)}
                              >
                                {file.type === 'image' ? (
                                  <img
                                    src={file.publicUrl}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : file.type === 'video' ? (
                                  <VideoThumbnail file={file} />
                                ) : (
                                  <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                    <Folder className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              {/* Subtle Overlay */}
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                              {/* Bottom Action Bar */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                                  className="bg-white/90 hover:bg-white text-gray-800 h-7 w-7 p-0"
                                  title="Preview"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => { e.stopPropagation(); handleOpenFullRes(file); }}
                                  className="bg-white/90 hover:bg-white text-gray-800 h-7 w-7 p-0"
                                  title="View Full Resolution"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                  className="bg-white/90 hover:bg-white text-gray-800 h-7 w-7 p-0"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                  className="bg-red-500 hover:bg-red-600 text-white h-7 w-7 p-0"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="p-3">
                              <div className="flex items-center gap-1 mb-1">
                                {getFileIcon(file)}
                                <Badge variant="secondary" className="text-xs">
                                  {file.type}
                                </Badge>
                              </div>
                              <h3 className="text-sm font-medium text-white truncate mb-1">
                                {file.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* List View */}
                            <div className="flex items-center justify-between">
                              {/* Checkbox */}
                              <div
                                className="mr-3 cursor-pointer"
                                onClick={() => toggleFileSelection(file.path)}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-salmon border-salmon'
                                    : 'bg-transparent border-white/40 hover:border-white/70'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getFileIcon(file)}
                                <div className="min-w-0 flex-1">
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

                              <div className="flex gap-2 ml-4">
                                <Button size="icon" variant="ghost" onClick={() => handlePreview(file)} className="h-8 w-8 text-muted-foreground hover:text-white">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDownload(file)} className="h-8 w-8 text-muted-foreground hover:text-white">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(file)} className="h-8 w-8 text-muted-foreground hover:text-red-400">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery
                      ? 'No files found matching your search'
                      : 'No files found in this folder'
                    }
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-black/40 border-white/20 text-white hover:bg-white/10"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (page > totalPages) return null;

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page
                            ? "bg-salmon hover:bg-salmon/90"
                            : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-black/40 border-white/20 text-white hover:bg-white/10"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Preview Modal - Shows JPG full-res when viewing thumbnail, with Download HD (PNG) option */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] overflow-hidden bg-black/95 border-white/20 p-0 flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedFile?.name}</DialogTitle>
            </DialogHeader>

            {selectedFile && (
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
                {selectedFile.type === 'image' ? (
                  <img
                    // When viewing from thumbnails folder, load the JPG full-res version
                    src={folderPrefix === 'thumbnails/'
                      ? getCorrespondingUrl(selectedFile, 'jpg-images/')
                      : selectedFile.publicUrl
                    }
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : selectedFile.type === 'video' ? (
                  <video
                    src={selectedFile.publicUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-full rounded-lg"
                  />
                ) : (
                  <div className="bg-black/40 rounded-lg p-12 text-center">
                    <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Preview not available for this file type</p>
                  </div>
                )}

                {/* Bottom action bar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  {/* Download current format */}
                  <Button
                    size="sm"
                    onClick={() => handleDownload(selectedFile)}
                    className="bg-salmon hover:bg-salmon/90 h-9 rounded-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </Button>

                  {/* Download HD (PNG) - only show when not already on PNG folder */}
                  {selectedFile.type === 'image' && folderPrefix !== 'ai-images/' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadOriginalPng(selectedFile)}
                      className="bg-green-600/80 border-green-500/50 text-white hover:bg-green-600 h-9 rounded-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download HD (PNG)
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenFullRes(selectedFile)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 rounded-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Tab
                  </Button>

                  <div className="w-px h-6 bg-white/20 mx-1" />

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedFile);
                      setPreviewOpen(false);
                    }}
                    className="h-9 w-9 p-0 rounded-full"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* File info - top left */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
                  <div className="text-white font-medium truncate max-w-[300px]">{selectedFile.name}</div>
                  <div className="text-muted-foreground text-xs">{formatFileSize(selectedFile.size)}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
      <Toaster />
    </GradientBackground>
  );
}
