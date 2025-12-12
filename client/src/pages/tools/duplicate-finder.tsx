/**
 * Duplicate Finder Tool
 * Find and remove duplicate files with smart matching
 * Uses File System Access API (Chrome/Edge/Opera 86+)
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import {
  FolderOpen,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  ArrowLeft,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Filter,
  Image,
  Video,
  FileAudio,
  File
} from 'lucide-react';
import { ProcessFlow, LoadingOverlay, type ProcessStep } from '@/components/tools/process-flow';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types for File System Access API
interface FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string): Promise<void>;
}

interface FileSystemFileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  close(): Promise<void>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

// Extend Window interface
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

// File info interface
interface FileInfo {
  handle: FileSystemFileHandle;
  parentHandle: FileSystemDirectoryHandle;
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  type: string;
  file: File;
  recommended?: boolean;
  selected?: boolean;
}

// Duplicate group interface
type MatchType = 'identical' | 'exact' | 'fuzzy';

interface DuplicateGroup {
  type: MatchType;
  files: FileInfo[];
}

// Check if File System Access API is supported
const isFileSystemAccessSupported = () => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// Utility functions
const getNameWithoutExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.substring(0, lastDot);
};

const getExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Check if match should be ignored
const shouldIgnoreMatch = (file1: FileInfo, file2: FileInfo): boolean => {
  const ext1 = getExtension(file1.name);
  const ext2 = getExtension(file2.name);

  // Skip ARW duplicates unless identical file size
  if (ext1 === 'arw' && ext2 === 'arw') {
    return file1.size !== file2.size;
  }

  // Ignore PSD and JPG matches
  if ((ext1 === 'psd' && ext2 === 'jpg') || (ext1 === 'jpg' && ext2 === 'psd')) {
    return true;
  }

  // Ignore ARW and XMP matches
  if ((ext1 === 'arw' && ext2 === 'xmp') || (ext1 === 'xmp' && ext2 === 'arw')) {
    return true;
  }

  return false;
};

// Make deletion recommendation
const makeRecommendation = (file: FileInfo, groupFiles: FileInfo[], matchType: MatchType): boolean => {
  const ext = getExtension(file.name);

  // MP3 vs WAV - prefer MP3
  const hasMP3 = groupFiles.some(f => getExtension(f.name) === 'mp3');
  const hasWAV = groupFiles.some(f => getExtension(f.name) === 'wav');
  if (hasMP3 && hasWAV && ext === 'wav') return true;

  // MP4 vs MOV - prefer MP4
  const hasMP4 = groupFiles.some(f => getExtension(f.name) === 'mp4');
  const hasMOV = groupFiles.some(f => getExtension(f.name) === 'mov');
  if (hasMP4 && hasMOV && ext === 'mov') return true;

  // For identical filenames, mark the one with longest path
  if (matchType === 'identical') {
    const maxPathLength = Math.max(...groupFiles.map(f => f.path.length));
    if (file.path.length === maxPathLength && groupFiles.filter(f => f.path.length === maxPathLength).length === 1) {
      return true;
    }
  }

  // Prefer larger files
  const maxSize = Math.max(...groupFiles.map(f => f.size));
  if (matchType !== 'identical' && file.size < maxSize * 0.8) return true;

  return false;
};

// Get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = getExtension(filename);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'arw', 'raw', 'cr2', 'nef'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'];

  if (imageExts.includes(ext)) return <Image className="h-8 w-8 text-green-400" />;
  if (videoExts.includes(ext)) return <Video className="h-8 w-8 text-purple-400" />;
  if (audioExts.includes(ext)) return <FileAudio className="h-8 w-8 text-blue-400" />;
  return <File className="h-8 w-8 text-gray-400" />;
};

// Process flow steps for this tool (4 steps, compact)
const PROCESS_STEPS: ProcessStep[] = [
  { number: 1, title: 'Select Folder' },
  { number: 2, title: 'Scan' },
  { number: 3, title: 'Review' },
  { number: 4, title: 'Clean Up' },
];

export default function DuplicateFinder() {
  const { toast } = useToast();

  // State
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | MatchType>('all');
  const [fuzzyLength, setFuzzyLength] = useState(10);
  const [skipLargeFiles, setSkipLargeFiles] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');

  // Calculate current step based on state (4 steps)
  const currentStep = useMemo(() => {
    if (duplicateGroups.length > 0) return 3; // Review step
    if (isScanning) return 2; // Scanning
    if (directoryHandle) return 2; // Ready to scan
    return 1; // Select folder
  }, [directoryHandle, isScanning, duplicateGroups.length]);

  // Check browser support
  const isSupported = isFileSystemAccessSupported();

  // Select folder
  const handleSelectFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) return;

    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setFolderName(handle.name);
      setDuplicateGroups([]);

      toast({
        title: 'Folder selected',
        description: `Selected: ${handle.name}`,
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: 'Error selecting folder',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  // Recursive scan for all files
  const scanDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string = ''
  ): Promise<FileInfo[]> => {
    const files: FileInfo[] = [];
    const maxFileSize = 100 * 1024 * 1024; // 100MB

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        try {
          const file = await (entry as FileSystemFileHandle).getFile();

          // Skip large files if option enabled
          if (skipLargeFiles && file.size > maxFileSize) {
            continue;
          }

          files.push({
            handle: entry as FileSystemFileHandle,
            parentHandle: dirHandle,
            name: entry.name,
            path,
            size: file.size,
            lastModified: new Date(file.lastModified),
            type: file.type,
            file,
            selected: false,
          });

          // Update progress
          if (files.length % 50 === 0) {
            setScanProgress(`Scanned ${files.length} files...`);
          }
        } catch (error) {
          console.warn(`Error reading file ${entry.name}:`, error);
        }
      } else if (entry.kind === 'directory') {
        const subPath = path ? `${path}/${entry.name}` : entry.name;
        const subFiles = await scanDirectory(entry as FileSystemDirectoryHandle, subPath);
        files.push(...subFiles);
      }
    }

    return files;
  }, [skipLargeFiles]);

  // Find duplicates
  const findDuplicates = useCallback((allFiles: FileInfo[]): DuplicateGroup[] => {
    const groups = new Map<string, DuplicateGroup>();

    for (let i = 0; i < allFiles.length; i++) {
      for (let j = i + 1; j < allFiles.length; j++) {
        const file1 = allFiles[i];
        const file2 = allFiles[j];

        // Check exclusion rules
        if (shouldIgnoreMatch(file1, file2)) continue;

        let matchType: MatchType | null = null;

        // Identical filename
        if (file1.name === file2.name) {
          matchType = 'identical';
        } else {
          const name1 = getNameWithoutExtension(file1.name);
          const name2 = getNameWithoutExtension(file2.name);
          const ext1 = getExtension(file1.name);
          const ext2 = getExtension(file2.name);

          // Exact name, different extension
          if (name1 === name2 && ext1 !== ext2) {
            matchType = 'exact';
          }
          // Fuzzy prefix match
          else {
            const prefix1 = file1.name.substring(0, fuzzyLength).toLowerCase();
            const prefix2 = file2.name.substring(0, fuzzyLength).toLowerCase();

            if (prefix1 === prefix2 && file1.name !== file2.name) {
              matchType = 'fuzzy';
            }
          }
        }

        if (matchType) {
          const groupKey = matchType === 'identical'
            ? `identical_${file1.name}`
            : matchType === 'exact'
            ? getNameWithoutExtension(file1.name)
            : `${file1.name.substring(0, fuzzyLength)}_fuzzy`;

          if (!groups.has(groupKey)) {
            groups.set(groupKey, { type: matchType, files: [] });
          }

          const group = groups.get(groupKey)!;
          if (!group.files.some(f => f.name === file1.name && f.path === file1.path)) {
            group.files.push({ ...file1 });
          }
          if (!group.files.some(f => f.name === file2.name && f.path === file2.path)) {
            group.files.push({ ...file2 });
          }
        }
      }
    }

    // Filter groups with more than 1 file and add recommendations
    const result = Array.from(groups.values())
      .filter(group => group.files.length > 1)
      .map(group => ({
        ...group,
        files: group.files.map(file => ({
          ...file,
          recommended: makeRecommendation(file, group.files, group.type),
          selected: makeRecommendation(file, group.files, group.type),
        })),
      }));

    return result;
  }, [fuzzyLength]);

  // Scan for duplicates
  const handleScan = useCallback(async () => {
    if (!directoryHandle) {
      toast({
        title: 'No folder selected',
        description: 'Please select a folder first',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setDuplicateGroups([]);
    setScanProgress('Starting scan...');

    try {
      const allFiles = await scanDirectory(directoryHandle);
      setScanProgress(`Analysing ${allFiles.length} files for duplicates...`);

      const groups = findDuplicates(allFiles);
      setDuplicateGroups(groups);

      if (groups.length === 0) {
        toast({
          title: 'No duplicates found',
          description: 'No duplicate files detected in this folder',
        });
      } else {
        const totalFiles = groups.reduce((sum, g) => sum + g.files.length, 0);
        toast({
          title: 'Scan complete',
          description: `Found ${groups.length} duplicate group${groups.length !== 1 ? 's' : ''} with ${totalFiles} files`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Scan failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, [directoryHandle, scanDirectory, findDuplicates, toast]);

  // Toggle file selection
  const toggleFileSelection = useCallback((groupIndex: number, fileIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, gi) => {
      if (gi !== groupIndex) return group;
      return {
        ...group,
        files: group.files.map((file, fi) => {
          if (fi !== fileIndex) return file;
          return { ...file, selected: !file.selected };
        }),
      };
    }));
  }, []);

  // Quick select functions
  const quickSelectLeft = useCallback((groupIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, gi) => {
      if (gi !== groupIndex) return group;
      return {
        ...group,
        files: group.files.map((file, fi) => ({
          ...file,
          selected: fi === 0,
        })),
      };
    }));
  }, []);

  const quickSelectRight = useCallback((groupIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, gi) => {
      if (gi !== groupIndex) return group;
      return {
        ...group,
        files: group.files.map((file, fi) => ({
          ...file,
          selected: fi === group.files.length - 1,
        })),
      };
    }));
  }, []);

  const quickSelectNone = useCallback((groupIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, gi) => {
      if (gi !== groupIndex) return group;
      return {
        ...group,
        files: group.files.map(file => ({ ...file, selected: false })),
      };
    }));
  }, []);

  const quickSelectAll = useCallback((groupIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, gi) => {
      if (gi !== groupIndex) return group;
      return {
        ...group,
        files: group.files.map(file => ({ ...file, selected: true })),
      };
    }));
  }, []);

  // Bulk selection
  const selectAllRecommended = useCallback(() => {
    setDuplicateGroups(prev => prev.map(group => ({
      ...group,
      files: group.files.map(file => ({ ...file, selected: file.recommended })),
    })));
  }, []);

  const selectAll = useCallback(() => {
    setDuplicateGroups(prev => prev.map(group => ({
      ...group,
      files: group.files.map(file => ({ ...file, selected: true })),
    })));
  }, []);

  const deselectAll = useCallback(() => {
    setDuplicateGroups(prev => prev.map(group => ({
      ...group,
      files: group.files.map(file => ({ ...file, selected: false })),
    })));
  }, []);

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (filter === 'all') return duplicateGroups;
    return duplicateGroups.filter(g => g.type === filter);
  }, [duplicateGroups, filter]);

  // Stats
  const stats = useMemo(() => {
    const selectedFiles = duplicateGroups.flatMap(g => g.files).filter(f => f.selected);
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    return {
      groupCount: filteredGroups.length,
      selectedCount: selectedFiles.length,
      totalSize: formatFileSize(totalSize),
    };
  }, [duplicateGroups, filteredGroups]);

  // Delete selected files
  const handleDelete = useCallback(async () => {
    const selectedFiles = duplicateGroups.flatMap(g => g.files).filter(f => f.selected);

    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to delete',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(false);
    setIsDeleting(true);

    let successCount = 0;
    const errors: string[] = [];

    for (const file of selectedFiles) {
      try {
        await file.parentHandle.removeEntry(file.name);
        successCount++;
      } catch (error: any) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    setIsDeleting(false);

    if (errors.length > 0) {
      toast({
        title: 'Partial success',
        description: `Deleted ${successCount} files. ${errors.length} error${errors.length !== 1 ? 's' : ''} occurred.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: `Deleted ${successCount} file${successCount !== 1 ? 's' : ''}`,
      });
    }

    // Refresh scan
    handleScan();
  }, [duplicateGroups, handleScan, toast]);

  // Match type badge
  const getMatchBadge = (type: MatchType) => {
    switch (type) {
      case 'identical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">IDENTICAL</Badge>;
      case 'exact':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">EXACT MATCH</Badge>;
      case 'fuzzy':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">FUZZY MATCH</Badge>;
    }
  };

  // Browser not supported view
  if (!isSupported) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-slate-900 border-red-500/50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <CardTitle className="text-white text-2xl">Browser Not Supported</CardTitle>
                  <CardDescription className="text-gray-400">
                    This tool requires the File System Access API
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-gray-300">
                  <p className="mb-4">Please use one of these browsers:</p>
                  <ul className="space-y-2 mb-6">
                    <li>Chrome 86+</li>
                    <li>Edge 86+</li>
                    <li>Opera 72+</li>
                  </ul>
                  <Link href="/tools">
                    <Button variant="outline" className="mt-6">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Tools
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Header */}
      <div className="pt-20 pb-8" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/tools">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tools
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-white text-4xl lg:text-5xl mb-4">Duplicate Finder</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Find and remove duplicate files using smart matching algorithms.
              Detects identical filenames, exact matches with different extensions, and fuzzy matches.
            </p>
          </div>

          {/* Process Flow Guide */}
          <ProcessFlow
            steps={PROCESS_STEPS}
            currentStep={currentStep}
            isProcessing={isScanning}
            processingText={scanProgress}
            className="max-w-5xl mx-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8" style={{ background: 'linear-gradient(to bottom, #475569 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            {/* Controls */}
            <Card className="tool-card-gradient border-white/10 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 justify-center mb-6">
                  <Button
                    onClick={handleSelectFolder}
                    className="bg-salmon hover:bg-salmon/90"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Select Folder
                  </Button>

                  <Button
                    onClick={handleScan}
                    disabled={!directoryHandle || isScanning}
                    variant="secondary"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Find Duplicates
                  </Button>
                </div>

                {folderName && (
                  <div className="text-center text-gray-400">
                    Selected: <span className="text-cyan">{folderName}</span>
                  </div>
                )}

                {/* Settings */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-6 justify-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Fuzzy match length:</label>
                      <div className="w-32">
                        <Slider
                          value={[fuzzyLength]}
                          onValueChange={([v]) => setFuzzyLength(v)}
                          min={5}
                          max={30}
                          step={1}
                        />
                      </div>
                      <span className="text-cyan text-sm w-8">{fuzzyLength}</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={skipLargeFiles}
                        onCheckedChange={(c) => setSkipLargeFiles(c === true)}
                      />
                      <span className="text-sm text-gray-400">Skip files &gt; 100MB</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {duplicateGroups.length > 0 && (
              <>
                {/* Stats Bar */}
                <Card className="bg-slate-800/50 border-white/10 mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-400">
                          📊 <span className="text-white">{stats.groupCount}</span> groups
                        </span>
                        <span className="text-gray-400">
                          ✅ <span className="text-white">{stats.selectedCount}</span> selected
                        </span>
                        <span className="text-gray-400">
                          💾 <span className="text-cyan">{stats.totalSize}</span> to delete
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                          <SelectTrigger className="w-40 h-8 bg-slate-900 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Matches</SelectItem>
                            <SelectItem value="identical">Identical</SelectItem>
                            <SelectItem value="exact">Exact Match</SelectItem>
                            <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Controls */}
                <Card className="bg-slate-800/50 border-white/10 mb-6">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={selectAllRecommended}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Select Recommended
                      </Button>
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        <Check className="mr-2 h-4 w-4" />
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll}>
                        <Square className="mr-2 h-4 w-4" />
                        Deselect All
                      </Button>
                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={stats.selectedCount === 0 || isDeleting}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Duplicate Groups */}
                <div className="space-y-4">
                  {filteredGroups.map((group, groupIndex) => (
                    <Card key={groupIndex} className="bg-slate-900 border-white/10 overflow-hidden">
                      <CardHeader className="border-b border-white/10 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getMatchBadge(group.type)}
                            <span className="text-gray-400 text-sm">
                              {group.files.length} files
                            </span>
                          </div>

                          {/* Quick Select */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => quickSelectLeft(groupIndex)}
                              title="Select left"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => quickSelectRight(groupIndex)}
                              title="Select right"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => quickSelectNone(groupIndex)}
                              title="Deselect all"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => quickSelectAll(groupIndex)}
                              title="Select all"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                          {group.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className={`p-4 ${file.recommended ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={file.selected}
                                  onCheckedChange={() => toggleFileSelection(groupIndex, fileIndex)}
                                  className="mt-1"
                                />

                                <div className="flex-shrink-0">
                                  {getFileIcon(file.name)}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white truncate mb-1">
                                    {file.name}
                                  </div>
                                  <div className="text-sm text-gray-400 space-y-0.5">
                                    <div className="text-cyan font-medium">{formatFileSize(file.size)}</div>
                                    <div>Modified: {file.lastModified.toLocaleDateString()}</div>
                                    <div className="text-gray-500 truncate">
                                      {file.path || 'Root folder'}
                                    </div>
                                  </div>
                                  {file.recommended && (
                                    <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/50 text-xs">
                                      Recommended to delete
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {directoryHandle && duplicateGroups.length === 0 && !isScanning && (
              <Card className="bg-slate-900 border-white/10">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-white text-lg mb-2">No duplicates found</h3>
                  <p className="text-gray-400 text-sm">
                    No duplicate files detected in this folder.
                  </p>
                </CardContent>
              </Card>
            )}


          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isScanning && (
        <LoadingOverlay
          text="Scanning for duplicates..."
          subText={scanProgress}
        />
      )}

      {/* Deleting Overlay */}
      {isDeleting && (
        <LoadingOverlay
          text="Deleting files..."
          subText={`Removing ${stats.selectedCount} files`}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete {stats.selectedCount} file{stats.selectedCount !== 1 ? 's' : ''}?
              <br /><br />
              This will free up <strong className="text-cyan">{stats.totalSize}</strong> of space.
              <br /><br />
              <span className="text-red-400">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
