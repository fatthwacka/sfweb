/**
 * Smart Organiser Tool
 * AI-powered file organisation with intelligent folder suggestions
 * Uses File System Access API (Chrome/Edge/Opera 86+)
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import {
  FolderOpen,
  FolderInput,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  ArrowLeft,
  Loader2,
  FileText,
  ArrowDown,
  Sparkles,
  FolderTree,
  Check
} from 'lucide-react';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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

// Types for File System Access API
interface FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
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

// File to organise interface
interface FileToOrganise {
  handle: FileSystemFileHandle;
  parentHandle: FileSystemDirectoryHandle;
  name: string;
  path: string;
  fullPath: string;
  targetPath: string;
  category: string;
  needsNewFolder: boolean;
  leaveInPlace: boolean;
  selected: boolean;
}

// Folder info interface
interface FolderInfo {
  handle: FileSystemDirectoryHandle;
  path: string;
  parentHandle: FileSystemDirectoryHandle;
}

// Check if File System Access API is supported
const isFileSystemAccessSupported = () => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// Media file extensions
const MEDIA_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'flv', 'wmv', 'jpg', 'jpeg', 'psd', 'png', 'gif', 'webp'];

// Generic camera patterns to skip
const CAMERA_PATTERNS = [
  /^img[_-]?\d+$/i,
  /^dsc[_-]?\d+$/i,
  /^p\d{7,}$/i,
  /^\d{8,}$/,
  /^[a-z]{3}\d{4,}$/i,
  /^screenshot.*/i,
  /^untitled.*/i,
  /^copy.*/i,
  /^image.*/i,
];

// Check if filename is generic camera file
const isGenericFile = (filename: string): boolean => {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '').toLowerCase();
  return CAMERA_PATTERNS.some(pattern => pattern.test(nameWithoutExt));
};

// Check if filename is descriptive
const isDescriptive = (filename: string): boolean => {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '').toLowerCase();
  const words = nameWithoutExt.split(/[-_\s]+/).filter(word => word.length > 2);
  return words.length >= 2 || nameWithoutExt.length > 10 || /[a-z]{4,}/.test(nameWithoutExt);
};

// Extract keywords from filename
const extractKeywords = (filename: string): string[] => {
  return filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(word => word.length > 2);
};

// Pluralisation helpers
const SIMILAR_WORDS: [string, string][] = [
  ['peach', 'peaches'], ['berry', 'berries'], ['strawberry', 'strawberries'],
  ['raspberry', 'raspberries'], ['cherry', 'cherries'], ['apple', 'apples'],
  ['banana', 'bananas'], ['orange', 'oranges'], ['grape', 'grapes'],
  ['cookie', 'cookies'], ['cake', 'cakes'], ['dessert', 'desserts'],
  ['background', 'backgrounds'], ['texture', 'textures'], ['kitchen', 'kitchens'],
];

const areSimilarWords = (word1: string, word2: string): boolean => {
  for (const [singular, plural] of SIMILAR_WORDS) {
    if ((word1 === singular && word2 === plural) || (word1 === plural && word2 === singular)) {
      return true;
    }
  }
  // Check containment for longer words
  if (word1.length > 3 && word2.length > 3) {
    return word1.includes(word2) || word2.includes(word1);
  }
  return false;
};

export default function SmartOrganiser() {
  const { toast } = useToast();

  // State
  const [sourceHandle, setSourceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [targetHandle, setTargetHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [folderStructure, setFolderStructure] = useState<Map<string, FolderInfo>>(new Map());
  const [files, setFiles] = useState<FileToOrganise[]>([]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isOrganising, setIsOrganising] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [progress, setProgress] = useState<string>('');

  // Check browser support
  const isSupported = isFileSystemAccessSupported();

  // Select source folder
  const handleSelectSource = useCallback(async () => {
    if (!window.showDirectoryPicker) return;

    try {
      const handle = await window.showDirectoryPicker();
      setSourceHandle(handle);
      setSourceName(handle.name);
      setFiles([]);

      toast({
        title: 'Source folder selected',
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

  // Select target folder
  const handleSelectTarget = useCallback(async () => {
    if (!window.showDirectoryPicker) return;

    try {
      const handle = await window.showDirectoryPicker();
      setTargetHandle(handle);
      setTargetName(handle.name);

      toast({
        title: 'Target folder selected',
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

  // Scan directory structure
  const scanDirectoryStructure = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string = ''
  ): Promise<Map<string, FolderInfo>> => {
    const structure = new Map<string, FolderInfo>();

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        const fullPath = path ? `${path}/${entry.name}` : entry.name;
        structure.set(fullPath.toLowerCase(), {
          handle: entry as FileSystemDirectoryHandle,
          path: fullPath,
          parentHandle: dirHandle,
        });

        // Recursively scan subdirectories
        const subStructure = await scanDirectoryStructure(entry as FileSystemDirectoryHandle, fullPath);
        subStructure.forEach((value, key) => structure.set(key, value));
      }
    }

    return structure;
  }, []);

  // Find media files in source
  const findMediaFiles = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string = ''
  ): Promise<Array<{ handle: FileSystemFileHandle; parentHandle: FileSystemDirectoryHandle; name: string; path: string; fullPath: string }>> => {
    const mediaFiles: Array<{ handle: FileSystemFileHandle; parentHandle: FileSystemDirectoryHandle; name: string; path: string; fullPath: string }> = [];

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop()?.toLowerCase() || '';
        if (MEDIA_EXTENSIONS.includes(ext)) {
          // Filter out generic camera files
          if (!isGenericFile(entry.name) && isDescriptive(entry.name)) {
            mediaFiles.push({
              handle: entry as FileSystemFileHandle,
              parentHandle: dirHandle,
              name: entry.name,
              path,
              fullPath: path ? `${path}/${entry.name}` : entry.name,
            });
          }
        }

        // Update progress
        if (mediaFiles.length % 50 === 0) {
          setProgress(`Found ${mediaFiles.length} media files...`);
        }
      } else if (entry.kind === 'directory') {
        const subPath = path ? `${path}/${entry.name}` : entry.name;
        const subFiles = await findMediaFiles(entry as FileSystemDirectoryHandle, subPath);
        mediaFiles.push(...subFiles);
      }
    }

    return mediaFiles;
  }, []);

  // Find best matching folder for a file
  const findBestFolder = useCallback((
    keywords: string[],
    structure: Map<string, FolderInfo>,
    currentPath: string
  ): { path: string; category: string; needsNewFolder: boolean } | null => {
    let bestMatch: { path: string; score: number } | null = null;

    for (const [folderPathLower, folderInfo] of structure) {
      // Skip current location
      if (currentPath && folderInfo.path === currentPath) continue;

      const folderName = folderInfo.path.split('/').pop()?.toLowerCase() || '';
      let score = 0;

      for (const keyword of keywords) {
        // Exact match
        if (folderName === keyword || areSimilarWords(keyword, folderName)) {
          score += 25;
        }
        // Partial match for longer words
        else if (keyword.length >= 6 && (folderName.includes(keyword) || keyword.includes(folderName))) {
          score += 5;
        }
      }

      if (score >= 15 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { path: folderInfo.path, score };
      }
    }

    if (bestMatch) {
      return {
        path: bestMatch.path,
        category: bestMatch.path.split('/')[0] || 'MISC',
        needsNewFolder: false,
      };
    }

    // Try to find MISC or general folder
    const miscFolder = Array.from(structure.values()).find(f =>
      f.path.toLowerCase().includes('misc') || f.path.toLowerCase().includes('general')
    );

    if (miscFolder) {
      return {
        path: miscFolder.path,
        category: miscFolder.path.split('/')[0] || 'MISC',
        needsNewFolder: false,
      };
    }

    // Fallback to first top-level folder
    const topLevel = Array.from(structure.values()).find(f => f.path.split('/').length === 1);
    if (topLevel) {
      return {
        path: topLevel.path,
        category: topLevel.path,
        needsNewFolder: false,
      };
    }

    // Create MISC folder
    return {
      path: 'MISC',
      category: 'MISC',
      needsNewFolder: true,
    };
  }, []);

  // Check if file is in a good location
  const isFileInGoodLocation = useCallback((keywords: string[], currentPath: string): boolean => {
    if (!currentPath) return false;

    const pathParts = currentPath.toLowerCase().split('/');
    let score = 0;

    for (const keyword of keywords) {
      for (const part of pathParts) {
        if (part === keyword || areSimilarWords(keyword, part)) {
          score += 10;
        }
        if (part.includes(keyword) && keyword.length > 3) {
          score += 5;
        }
      }
    }

    return score >= 10;
  }, []);

  // Analyse files
  const handleAnalyse = useCallback(async () => {
    if (!sourceHandle || !targetHandle) {
      toast({
        title: 'Folders not selected',
        description: 'Please select both source and target folders',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalysing(true);
    setFiles([]);
    setProgress('Scanning target folder structure...');

    try {
      // Build folder structure
      const structure = await scanDirectoryStructure(targetHandle);
      setFolderStructure(structure);
      setProgress(`Found ${structure.size} folders. Scanning source files...`);

      // Find media files
      const mediaFiles = await findMediaFiles(sourceHandle);

      if (mediaFiles.length === 0) {
        toast({
          title: 'No media files found',
          description: 'No descriptive media files found in source folder',
        });
        setIsAnalysing(false);
        setProgress('');
        return;
      }

      setProgress(`Analysing ${mediaFiles.length} files...`);

      // Categorise files
      const categorised: FileToOrganise[] = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const keywords = extractKeywords(file.name);

        // Check if already in good location
        if (isFileInGoodLocation(keywords, file.path)) {
          categorised.push({
            ...file,
            targetPath: file.path,
            category: 'CURRENT',
            needsNewFolder: false,
            leaveInPlace: true,
            selected: false,
          });
        } else {
          // Find best folder
          const match = findBestFolder(keywords, structure, file.path);
          categorised.push({
            ...file,
            targetPath: match?.path || 'MISC',
            category: match?.category || 'MISC',
            needsNewFolder: match?.needsNewFolder || false,
            leaveInPlace: false,
            selected: true,
          });
        }

        if (i % 10 === 0) {
          setProgress(`Analysed ${i + 1}/${mediaFiles.length} files...`);
        }
      }

      setFiles(categorised);
      setProgress('');

      const toMove = categorised.filter(f => !f.leaveInPlace).length;
      toast({
        title: 'Analysis complete',
        description: `Found ${toMove} files to organise, ${categorised.length - toMove} already in good locations`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalysing(false);
    }
  }, [sourceHandle, targetHandle, scanDirectoryStructure, findMediaFiles, findBestFolder, isFileInGoodLocation, toast]);

  // Toggle file selection
  const toggleFile = useCallback((index: number) => {
    setFiles(prev => prev.map((file, i) =>
      i === index && !file.leaveInPlace ? { ...file, selected: !file.selected } : file
    ));
  }, []);

  // Bulk selection
  const selectAll = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, selected: !file.leaveInPlace })));
  }, []);

  const deselectAll = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, selected: false })));
  }, []);

  // Stats
  const stats = useMemo(() => {
    const movable = files.filter(f => !f.leaveInPlace);
    const selected = files.filter(f => f.selected);
    const inPlace = files.filter(f => f.leaveInPlace);
    return {
      total: files.length,
      movable: movable.length,
      selected: selected.length,
      inPlace: inPlace.length,
    };
  }, [files]);

  // Ensure folder exists
  const ensureFolderExists = useCallback(async (
    targetPath: string,
    rootHandle: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle> => {
    const pathParts = targetPath.split('/');
    let currentHandle = rootHandle;

    for (const part of pathParts) {
      try {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
        } else {
          throw error;
        }
      }
    }

    return currentHandle;
  }, []);

  // Organise files
  const handleOrganise = useCallback(async () => {
    const selectedFiles = files.filter(f => f.selected);

    if (selectedFiles.length === 0 || !targetHandle) {
      toast({
        title: 'No files selected',
        description: 'Please select files to organise',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(false);
    setIsOrganising(true);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setProgress(`Organising ${i + 1}/${selectedFiles.length}: ${file.name}`);

      try {
        // Ensure target folder exists
        const folderHandle = await ensureFolderExists(file.targetPath, targetHandle);

        // Check if file exists in target
        try {
          await folderHandle.getFileHandle(file.name);
          throw new Error('File already exists in target');
        } catch (e: any) {
          if (e.name !== 'NotFoundError') throw e;
        }

        // Create new file
        const newFileHandle = await folderHandle.getFileHandle(file.name, { create: true });

        // Copy content
        const originalFile = await file.handle.getFile();
        const writable = await newFileHandle.createWritable();
        await writable.write(originalFile);
        await writable.close();

        // Verify
        const verifyFile = await newFileHandle.getFile();
        if (verifyFile.size !== originalFile.size) {
          throw new Error('File copy verification failed');
        }

        // Remove original
        await file.parentHandle.removeEntry(file.name);

        successCount++;
      } catch (error: any) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    setIsOrganising(false);
    setProgress('');

    if (errors.length > 0) {
      toast({
        title: 'Partial success',
        description: `Organised ${successCount} files. ${errors.length} error${errors.length !== 1 ? 's' : ''} occurred.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: `Organised ${successCount} file${successCount !== 1 ? 's' : ''}`,
      });
    }

    // Refresh analysis
    handleAnalyse();
  }, [files, targetHandle, ensureFolderExists, handleAnalyse, toast]);

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

          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-white text-4xl lg:text-5xl mb-4">Smart Organiser</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Intelligently categorise media files into logical folder structures.
              Analyses filenames to find the best matching destination folders.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8" style={{ background: 'linear-gradient(to bottom, #475569 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            {/* AI Note */}
            <Card className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-500/30 mb-6">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-medium mb-1">
                  <Sparkles className="h-4 w-4" />
                  Intelligent Organisation
                </div>
                <p className="text-gray-300 text-sm">
                  Uses keyword analysis to categorise media files (videos, images, PSDs) into logical folders.
                  Automatically filters out generic camera files (IMG_1234.jpg, etc.)
                </p>
              </CardContent>
            </Card>

            {/* Folder Selection */}
            <Card className="bg-slate-900 border-white/10 mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Source Folder */}
                  <div className="text-center">
                    <h3 className="text-white text-sm font-medium mb-3">Source Folder</h3>
                    <Button
                      onClick={handleSelectSource}
                      className="bg-salmon hover:bg-salmon/90 w-full"
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Select Source
                    </Button>
                    {sourceName && (
                      <p className="mt-2 text-sm text-cyan truncate">{sourceName}</p>
                    )}
                  </div>

                  {/* Target Folder */}
                  <div className="text-center">
                    <h3 className="text-white text-sm font-medium mb-3">Assets Root Folder</h3>
                    <Button
                      onClick={handleSelectTarget}
                      variant="secondary"
                      className="w-full"
                    >
                      <FolderInput className="mr-2 h-4 w-4" />
                      Select Target
                    </Button>
                    {targetName && (
                      <p className="mt-2 text-sm text-cyan truncate">{targetName}</p>
                    )}
                  </div>
                </div>

                {/* Analyse Button */}
                <div className="text-center">
                  <Button
                    onClick={handleAnalyse}
                    disabled={!sourceHandle || !targetHandle || isAnalysing}
                    variant="outline"
                    size="lg"
                  >
                    {isAnalysing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    {isAnalysing ? 'Analysing...' : 'Analyse & Categorise'}
                  </Button>
                </div>

                {progress && (
                  <div className="mt-4 text-center text-gray-400 text-sm">
                    {progress}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Folder Structure Preview */}
            {folderStructure.size > 0 && (
              <Card className="bg-slate-800/50 border-white/10 mb-6">
                <CardHeader className="py-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <FolderTree className="h-4 w-4" />
                    Existing Folder Structure ({folderStructure.size} folders)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-32 overflow-y-auto p-4 text-sm font-mono text-gray-400">
                    {Array.from(folderStructure.keys()).sort().slice(0, 20).map(path => {
                      const depth = path.split('/').length - 1;
                      const name = path.split('/').pop();
                      return (
                        <div key={path} style={{ paddingLeft: `${depth * 12}px` }}>
                          📁 {name}
                        </div>
                      );
                    })}
                    {folderStructure.size > 20 && (
                      <div className="text-gray-500 mt-2">...and {folderStructure.size - 20} more</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {files.length > 0 && (
              <>
                {/* Stats Bar */}
                <Card className="bg-slate-800/50 border-white/10 mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                          📊 <span className="text-white">{stats.total}</span> files analysed
                        </span>
                        <span className="text-gray-400">
                          ✅ <span className="text-white">{stats.selected}</span> selected to move
                        </span>
                        <span className="text-gray-400">
                          🏠 <span className="text-green-400">{stats.inPlace}</span> already organised
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Controls */}
                <Card className="bg-slate-800/50 border-white/10 mb-6">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll}>
                        <Square className="mr-2 h-4 w-4" />
                        Deselect All
                      </Button>
                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={stats.selected === 0 || isOrganising}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        {isOrganising ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Organise Selected
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* File List */}
                <Card className="bg-slate-900 border-white/10">
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                      {files.map((file, index) => (
                        <div
                          key={`${file.path}/${file.name}`}
                          className={`p-4 ${file.leaveInPlace ? 'bg-green-500/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={file.selected}
                              onCheckedChange={() => toggleFile(index)}
                              disabled={file.leaveInPlace}
                              className="mt-1"
                            />

                            <div className="flex-1 min-w-0 font-mono text-sm">
                              <div className="text-gray-400 truncate mb-1">
                                {file.fullPath}
                              </div>

                              {file.leaveInPlace ? (
                                <div className="flex items-center gap-2 text-green-400">
                                  <Check className="h-4 w-4" />
                                  <span>Already in correct location</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-gray-500 my-1">
                                    <ArrowDown className="h-4 w-4" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-cyan truncate">
                                      {file.targetPath}/{file.name}
                                    </span>
                                    {file.needsNewFolder && (
                                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-xs">
                                        NEW FOLDER
                                      </Badge>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Empty state */}
            {sourceHandle && targetHandle && files.length === 0 && !isAnalysing && (
              <Card className="bg-slate-900 border-white/10">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-white text-lg mb-2">No media files found</h3>
                  <p className="text-gray-400 text-sm">
                    No descriptive media files found in source folder.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            {(!sourceHandle || !targetHandle) && (
              <Card className="bg-slate-800/50 border-white/5">
                <CardContent className="p-6">
                  <h3 className="text-white font-medium mb-3">How it works</h3>
                  <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                    <li>Select a <strong>source folder</strong> containing media files to organise</li>
                    <li>Select a <strong>target assets folder</strong> with your existing folder structure</li>
                    <li>The tool analyses filenames and matches them to existing folders</li>
                    <li>Review suggestions and organise with one click</li>
                  </ol>
                  <div className="mt-4 text-sm text-gray-500">
                    <strong>Supported files:</strong> MP4, MOV, AVI, MKV, JPG, PNG, PSD, GIF, WebP
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Organisation</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to organise {stats.selected} file{stats.selected !== 1 ? 's' : ''}?
              <br /><br />
              Files will be moved to their suggested folders and removed from the source location.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOrganise}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Yes, Organise Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
