/**
 * Cloud Storage Browser - Browse and manage Google Cloud Storage files
 * Features: Grid view, search, sorting, pagination, download, and delete operations
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Trash2, Eye, Search, Grid, List, Filter, SortAsc, SortDesc, Calendar, FileImage, Film, Folder } from 'lucide-react';
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

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

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
        
        // Request optimized thumbnail generation
        const thumbnailResponse = await fetch(`/api/cloud-storage/thumbnail/${file.bucket}/${file.path}`);
        
        if (thumbnailResponse.ok) {
          // If response is successful, it should redirect to the thumbnail URL
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
      {/* Video play indicator overlay */}
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
  const [typeFilter, setTypeFilter] = useState<string>('image'); // Default to images for fast loading
  const [bucketFilter, setBucketFilter] = useState<string>('all');
  const [folderPrefix, setFolderPrefix] = useState<string>('ai-images/'); // Default to AI generated images folder
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [stats, setStats] = useState<FileStats | null>(null);

  // Load files from Google Cloud Storage when folder prefix changes
  useEffect(() => {
    loadFiles();
  }, [folderPrefix]);

  // Filter and sort files
  useEffect(() => {
    let filtered = files;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => file.type === typeFilter);
    }

    // Bucket filter
    if (bucketFilter !== 'all') {
      filtered = filtered.filter(file => file.bucket === bucketFilter);
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
    setCurrentPage(1); // Reset to first page when filtering
  }, [files, searchQuery, typeFilter, bucketFilter, sortBy, sortOrder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const url = folderPrefix
        ? `/api/cloud-storage/files?prefix=${encodeURIComponent(folderPrefix)}`
        : '/api/cloud-storage/files';
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer staff-token'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files);
      setStats(data.stats);
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

  const handleDownload = async (file: CloudFile) => {
    try {
      const response = await fetch(file.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${file.name}`
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (file: CloudFile) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

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

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
      }

      // Remove from local state
      setFiles(prev => prev.filter(f => f.path !== file.path));
      
      toast({
        title: 'File Deleted',
        description: `${file.name} has been deleted`
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file',
        variant: 'destructive'
      });
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (file: CloudFile) => {
    switch (file.type) {
      case 'image':
        return <FileImage className="w-4 h-4" />;
      case 'video':
        return <Film className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };



  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  // Get unique buckets for filter
  const uniqueBuckets = Array.from(new Set(files.map(f => f.bucket)));

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
                Browse, view, and manage Google Cloud Storage files with advanced grid view, search, and download capabilities
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-cyan-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-cyan-300">{stats.totalFiles}</div>
                <div className="text-sm text-gray-300">Total Files</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-green-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-green-300">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-gray-300">Total Size</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-purple-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-purple-300">{stats.images}</div>
                <div className="text-sm text-gray-300">Images</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-orange-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-orange-300">{stats.videos}</div>
                <div className="text-sm text-gray-300">Videos</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-yellow-400/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-yellow-300">{stats.other}</div>
                <div className="text-sm text-gray-300">Other</div>
              </div>
            </div>
          )}

          {/* Unified Controls Bar */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/80 border border-white/20 rounded-xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              {/* Top Row: Folder & Media Type Selectors */}
              <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
                {/* Folder Selector */}
                <div className="flex bg-gray-900/60 rounded-lg p-1">
                  <button
                    onClick={() => setFolderPrefix('ai-images/')}
                    className={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === 'ai-images/'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🖼️ Full Res Images
                  </button>
                  <button
                    onClick={() => setFolderPrefix('compressed-images/')}
                    className={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                      folderPrefix === 'compressed-images/'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📦 Compressed Images
                  </button>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px h-8 bg-gray-600" />

                {/* Media Type Selector */}
                <div className="flex bg-gray-900/60 rounded-lg p-1">
                  <button
                    onClick={() => setTypeFilter('image')}
                    className={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                      typeFilter === 'image'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📸 Images ({stats?.images || 0})
                  </button>
                  <button
                    onClick={() => setTypeFilter('video')}
                    className={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                      typeFilter === 'video'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🎬 Videos ({stats?.videos || 0})
                  </button>
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                      typeFilter === 'all'
                        ? 'bg-salmon text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📁 All ({stats?.totalFiles || 0})
                  </button>
                </div>
              </div>

              {/* Bottom Row: Search & Sort/Filter */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
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

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={bucketFilter} onValueChange={setBucketFilter}>
                    <SelectTrigger className="w-36 h-9 bg-gray-900/60 border-gray-600/40 text-white focus:bg-gray-900/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Buckets</SelectItem>
                      {uniqueBuckets.map(bucket => (
                        <SelectItem key={bucket} value={bucket}>{bucket}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
              {paginatedFiles.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" 
                  : "space-y-2"
                }>
                  {paginatedFiles.map((file) => (
                    <div
                      key={file.path}
                      className={viewMode === 'grid' 
                        ? "bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all duration-200"
                        : "bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/30 transition-all duration-200"
                      }
                    >
                      {viewMode === 'grid' ? (
                        <>
                          {/* Grid View */}
                          <div className="aspect-square relative group">
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
                            
                            {/* Subtle Overlay */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            
                            {/* Bottom Action Bar */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handlePreview(file)}
                                className="bg-white/90 hover:bg-white text-gray-800 h-7 w-7 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(file)}
                                className="bg-white/90 hover:bg-white text-gray-800 h-7 w-7 p-0"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(file)}
                                className="bg-red-500 hover:bg-red-600 text-white h-7 w-7 p-0"
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
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(file)}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-medium text-white truncate">
                                  {file.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} • {formatDate(file.lastModified)} • {file.bucket}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {file.type}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlePreview(file)}
                                className="h-8 w-8 text-muted-foreground hover:text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDownload(file)}
                                className="h-8 w-8 text-muted-foreground hover:text-white"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(file)}
                                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery || typeFilter !== 'all' || bucketFilter !== 'all' 
                      ? 'No files found matching your filters' 
                      : 'No files found in cloud storage'
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

        {/* Preview Modal */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-black/90 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                {selectedFile && getFileIcon(selectedFile)}
                {selectedFile?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedFile && (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="flex justify-center">
                  {selectedFile.type === 'image' ? (
                    <img
                      src={selectedFile.publicUrl}
                      alt={selectedFile.name}
                      className="max-w-full max-h-96 object-contain rounded-lg"
                    />
                  ) : selectedFile.type === 'video' ? (
                    <video
                      src={selectedFile.publicUrl}
                      controls
                      className="max-w-full max-h-96 rounded-lg"
                    />
                  ) : (
                    <div className="bg-black/40 rounded-lg p-12 text-center">
                      <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Preview not available for this file type</p>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <span className="ml-2 text-white">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 text-white">{selectedFile.mimeType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="ml-2 text-white">{formatDate(selectedFile.lastModified)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bucket:</span>
                    <span className="ml-2 text-white">{selectedFile.bucket}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => handleDownload(selectedFile)}
                    className="bg-salmon hover:bg-salmon/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedFile);
                      setPreviewOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedFile.publicUrl, '_blank')}
                    className="bg-black/40 border-white/20 text-white hover:bg-white/10"
                  >
                    Open in New Tab
                  </Button>
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