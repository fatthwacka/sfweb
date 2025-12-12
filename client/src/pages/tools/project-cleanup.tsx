/**
 * Project Cleanup Tool
 * Smart cleanup of junk files and orphaned RAW files
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
  Trash2,
  FileX,
  Image,
  AlertTriangle,
  Shield,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Eye,
  FileCheck,
} from 'lucide-react';
import { ProcessFlow, LoadingOverlay, type ProcessStep } from '@/components/tools/process-flow';

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Types for File System Access API
interface FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

interface FileSystemFileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

// === JUNK FILE PATTERNS ===
const JUNK_FILE_PATTERNS = [
  /^\.DS_Store$/i,
  /^Thumbs\.db$/i,
  /^desktop\.ini$/i,
  /^\.localized$/i,
  /^\._.*$/,  // macOS resource forks
  /^~\$.*$/,  // Office temp files
  /^.*\.tmp$/i,
  /^tmpAEtoAMEProject.*$/i,  // After Effects temp
  /^.*\.bak$/i,
  /^.*~$/,  // Backup files ending in ~
];

const JUNK_FOLDER_PATTERNS = [
  /^\.Spotlight-V100$/,
  /^\.Trashes$/,
  /^\.fseventsd$/,
  /^__MACOSX$/,
  /^\.TemporaryItems$/,
  /^~autorecover$/i,
  /^\.autosave$/i,
  /^\.cache$/i,
  /^node_modules$/,  // Optional but useful
];

// === FILE TYPES ===
const RAW_EXTENSIONS = ['arw', 'cr2', 'cr3', 'nef', 'raf', 'orf', 'rw2', 'dng'];
const EDIT_EXTENSIONS = ['jpg', 'jpeg', 'psd', 'tif', 'tiff', 'png'];
const SIDECAR_EXTENSIONS = ['xmp', 'acr', 'xml'];

// === INTERFACES ===
interface FileInfo {
  handle: FileSystemFileHandle;
  parentHandle: FileSystemDirectoryHandle;
  name: string;
  path: string;
  parentPath: string;
  size: number;
  extension: string;
  baseName: string;  // filename without extension
  cameraBaseName: string;  // extracted camera name (e.g., DSC04173 from DSC04173-green.jpg)
}

interface JunkFile extends FileInfo {
  type: 'file' | 'folder';
  pattern: string;
  selected: boolean;
}

interface OrphanedRAW extends FileInfo {
  category: 'orphan' | 'has-acr' | 'has-xmp' | 'has-edit';
  matchedFiles: FileInfo[];
  matchStrength: 'strong' | 'weak';  // strong = same parent folder
  selected: boolean;
  previewUrl?: string;
}

interface MatchedExport extends FileInfo {
  matchedRAW: string;  // name of the RAW file this export matches
  selected: boolean;
}

type CleanupCategory = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultSelected: boolean;
  items: (JunkFile | OrphanedRAW | MatchedExport)[];
  expanded: boolean;
};

// === HELPER FUNCTIONS ===
const getExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase();
};

const getBaseName = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.substring(0, lastDot);
};

// Extract camera base name (e.g., DSC04173 from DSC04173-green-final.jpg)
const extractCameraBaseName = (filename: string): string => {
  const baseName = getBaseName(filename);
  // Common camera patterns: DSC, IMG, P, _DSC, etc.
  const cameraPatterns = [
    /^(_?DSC\d+)/i,
    /^(_?IMG_?\d+)/i,
    /^(P\d{7,})/i,
    /^([A-Z]{2,4}\d{4,})/i,
  ];

  for (const pattern of cameraPatterns) {
    const match = baseName.match(pattern);
    if (match) return match[1].toUpperCase();
  }

  return baseName.toUpperCase();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Calculate total size of items in a category
const getCategorySize = (items: { size: number; selected: boolean }[]): { total: number; selected: number } => {
  let total = 0;
  let selected = 0;
  for (const item of items) {
    total += item.size;
    if (item.selected) selected += item.size;
  }
  return { total, selected };
};

const isFileSystemAccessSupported = () => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// Try to extract embedded JPEG preview from ARW file
const extractARWPreview = async (file: File): Promise<string | null> => {
  try {
    const buffer = await file.slice(0, 500000).arrayBuffer(); // Read first 500KB
    const data = new Uint8Array(buffer);

    // Look for JPEG markers (FFD8 start, FFD9 end)
    let jpegStart = -1;
    let jpegEnd = -1;

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i] === 0xFF && data[i + 1] === 0xD8 && jpegStart === -1) {
        jpegStart = i;
      }
      if (data[i] === 0xFF && data[i + 1] === 0xD9 && jpegStart !== -1) {
        jpegEnd = i + 2;
        break;
      }
    }

    if (jpegStart !== -1 && jpegEnd !== -1) {
      const jpegData = data.slice(jpegStart, jpegEnd);
      const blob = new Blob([jpegData], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    }

    return null;
  } catch {
    return null;
  }
};

// === PROCESS STEPS ===
const PROCESS_STEPS: ProcessStep[] = [
  { number: 1, title: 'Select Folder' },
  { number: 2, title: 'Scan' },
  { number: 3, title: 'Review' },
  { number: 4, title: 'Clean Up' },
];

// === MAIN COMPONENT ===
export default function ProjectCleanup() {
  const { toast } = useToast();

  // State
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [categories, setCategories] = useState<CleanupCategory[]>([]);
  const [previewFile, setPreviewFile] = useState<OrphanedRAW | null>(null);

  // Settings
  const [includeJunk, setIncludeJunk] = useState(true);
  const [includeOrphanedRAW, setIncludeOrphanedRAW] = useState(true);

  const isSupported = isFileSystemAccessSupported();

  // Calculate current step
  const currentStep = useMemo(() => {
    if (isCompleted) return 5; // Past step 4 = all complete with green ticks
    if (isDeleting) return 4;
    if (categories.length > 0) return 3;
    if (isScanning) return 2;
    if (directoryHandle) return 2;
    return 1;
  }, [directoryHandle, isScanning, categories.length, isDeleting, isCompleted]);

  // Stats
  const stats = useMemo(() => {
    let totalFiles = 0;
    let selectedFiles = 0;
    let totalSize = 0;

    categories.forEach(cat => {
      cat.items.forEach(item => {
        totalFiles++;
        if (item.selected) {
          selectedFiles++;
          totalSize += item.size;
        }
      });
    });

    return { totalFiles, selectedFiles, totalSize: formatFileSize(totalSize) };
  }, [categories]);

  // Select folder
  const handleSelectFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) return;

    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setFolderName(handle.name);
      setCategories([]);
      setIsCompleted(false);

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

  // Recursive scan
  const scanDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string = '',
    allFiles: FileInfo[] = [],
    junkFiles: JunkFile[] = [],
    junkFolders: JunkFile[] = []
  ): Promise<{ allFiles: FileInfo[]; junkFiles: JunkFile[]; junkFolders: JunkFile[] }> => {

    const parentPath = path || dirHandle.name;

    for await (const entry of dirHandle.values()) {
      const currentPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        // Check if it's a junk folder
        const matchedPattern = JUNK_FOLDER_PATTERNS.find(p => p.test(entry.name));
        if (matchedPattern && includeJunk) {
          junkFolders.push({
            handle: entry as unknown as FileSystemFileHandle,
            parentHandle: dirHandle,
            name: entry.name,
            path: currentPath,
            parentPath,
            size: 0,
            extension: '',
            baseName: entry.name,
            cameraBaseName: '',
            type: 'folder',
            pattern: matchedPattern.source,
            selected: true,
          });
        } else {
          // Recurse into non-junk folders
          await scanDirectory(
            entry as FileSystemDirectoryHandle,
            currentPath,
            allFiles,
            junkFiles,
            junkFolders
          );
        }
      } else {
        // It's a file
        const matchedPattern = JUNK_FILE_PATTERNS.find(p => p.test(entry.name));

        if (matchedPattern && includeJunk) {
          try {
            const file = await (entry as FileSystemFileHandle).getFile();
            junkFiles.push({
              handle: entry as FileSystemFileHandle,
              parentHandle: dirHandle,
              name: entry.name,
              path: currentPath,
              parentPath,
              size: file.size,
              extension: getExtension(entry.name),
              baseName: getBaseName(entry.name),
              cameraBaseName: '',
              type: 'file',
              pattern: matchedPattern.source,
              selected: true,
            });
          } catch (e) {
            console.warn(`Could not read file ${entry.name}:`, e);
          }
        } else {
          // Store all non-junk files for RAW analysis
          try {
            const file = await (entry as FileSystemFileHandle).getFile();
            allFiles.push({
              handle: entry as FileSystemFileHandle,
              parentHandle: dirHandle,
              name: entry.name,
              path: currentPath,
              parentPath,
              size: file.size,
              extension: getExtension(entry.name),
              baseName: getBaseName(entry.name),
              cameraBaseName: extractCameraBaseName(entry.name),
            });
          } catch (e) {
            console.warn(`Could not read file ${entry.name}:`, e);
          }
        }
      }

      // Update progress periodically
      if ((allFiles.length + junkFiles.length) % 100 === 0) {
        setScanProgress(`Scanned ${allFiles.length + junkFiles.length} files...`);
      }
    }

    return { allFiles, junkFiles, junkFolders };
  }, [includeJunk]);

  // Analyse orphaned RAWs
  const analyseOrphanedRAWs = useCallback((allFiles: FileInfo[]): OrphanedRAW[] => {
    const rawFiles = allFiles.filter(f => RAW_EXTENSIONS.includes(f.extension));
    const editFiles = allFiles.filter(f => EDIT_EXTENSIONS.includes(f.extension));
    const sidecarFiles = allFiles.filter(f => SIDECAR_EXTENSIONS.includes(f.extension));

    const orphans: OrphanedRAW[] = [];

    for (const raw of rawFiles) {
      const rawBaseName = raw.cameraBaseName;
      const rawParent = raw.parentPath;

      // Find matching sidecars (XMP, ACR)
      const matchingACR = sidecarFiles.filter(f =>
        f.extension === 'acr' &&
        f.cameraBaseName === rawBaseName
      );
      const matchingXMP = sidecarFiles.filter(f =>
        f.extension === 'xmp' &&
        f.cameraBaseName === rawBaseName
      );

      // Find matching edits (JPG, PSD, etc.)
      // Priority: same parent folder first
      const sameParentEdits = editFiles.filter(f =>
        f.parentPath === rawParent &&
        (f.cameraBaseName === rawBaseName || f.baseName.toUpperCase().includes(rawBaseName))
      );

      const otherParentEdits = editFiles.filter(f =>
        f.parentPath !== rawParent &&
        (f.cameraBaseName === rawBaseName || f.baseName.toUpperCase().includes(rawBaseName))
      );

      // Determine category
      let category: OrphanedRAW['category'] = 'orphan';
      let matchedFiles: FileInfo[] = [];
      let matchStrength: OrphanedRAW['matchStrength'] = 'strong';

      if (matchingACR.length > 0) {
        category = 'has-acr';
        matchedFiles = [...matchingACR, ...sameParentEdits];
      } else if (matchingXMP.length > 0) {
        category = 'has-xmp';
        matchedFiles = [...matchingXMP, ...sameParentEdits];
      } else if (sameParentEdits.length > 0) {
        category = 'has-edit';
        matchedFiles = sameParentEdits;
        matchStrength = 'strong';
      } else if (otherParentEdits.length > 0) {
        // Check if any of those edits also exist in the RAW's parent folder
        // If not, it might be a weak match
        category = 'has-edit';
        matchedFiles = otherParentEdits;
        matchStrength = 'weak';
      }
      // If no matches at all, it stays as 'orphan'

      orphans.push({
        ...raw,
        category,
        matchedFiles,
        matchStrength,
        selected: category === 'orphan', // Only orphans selected by default
      });
    }

    return orphans;
  }, []);

  // Main scan handler
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
    setCategories([]);
    setIsCompleted(false);
    setScanProgress('Starting scan...');

    try {
      const { allFiles, junkFiles, junkFolders } = await scanDirectory(directoryHandle);

      setScanProgress('Analysing RAW files...');
      const orphanedRAWs = includeOrphanedRAW ? analyseOrphanedRAWs(allFiles) : [];

      // Build categories
      const newCategories: CleanupCategory[] = [];

      // Junk files category
      if (junkFiles.length > 0) {
        newCategories.push({
          id: 'junk-files',
          title: 'System Junk Files',
          description: '.DS_Store, Thumbs.db, temp files, etc.',
          icon: <FileX className="h-5 w-5" />,
          color: 'text-gray-400',
          defaultSelected: true,
          items: junkFiles,
          expanded: true,
        });
      }

      // Junk folders category
      if (junkFolders.length > 0) {
        newCategories.push({
          id: 'junk-folders',
          title: 'System Junk Folders',
          description: '.Spotlight-V100, .Trashes, __MACOSX, etc.',
          icon: <Trash2 className="h-5 w-5" />,
          color: 'text-orange-400',
          defaultSelected: true,
          items: junkFolders,
          expanded: true,
        });
      }

      // Orphaned RAWs - categorised
      const trueOrphans = orphanedRAWs.filter(r => r.category === 'orphan');
      const acrEdited = orphanedRAWs.filter(r => r.category === 'has-acr');
      const xmpEdited = orphanedRAWs.filter(r => r.category === 'has-xmp');
      const hasEdits = orphanedRAWs.filter(r => r.category === 'has-edit');

      if (trueOrphans.length > 0) {
        newCategories.push({
          id: 'orphan-raw',
          title: `Orphaned RAW Files (${trueOrphans.length})`,
          description: 'No corresponding JPG, PSD, XMP or ACR found - likely unused shots',
          icon: <Trash2 className="h-5 w-5" />,
          color: 'text-red-400',
          defaultSelected: true,
          items: trueOrphans,
          expanded: true,
        });
      }

      if (acrEdited.length > 0) {
        newCategories.push({
          id: 'acr-edited',
          title: `AI Enhanced RAW (${acrEdited.length})`,
          description: 'Has .ACR sidecar - edited with Adobe Camera Raw AI features',
          icon: <Sparkles className="h-5 w-5" />,
          color: 'text-purple-400',
          defaultSelected: false,
          items: acrEdited,
          expanded: false,
        });
      }

      if (xmpEdited.length > 0) {
        newCategories.push({
          id: 'xmp-edited',
          title: `Lightroom Edited RAW (${xmpEdited.length})`,
          description: 'Has .XMP sidecar - Lightroom/Camera Raw settings applied',
          icon: <Settings className="h-5 w-5" />,
          color: 'text-blue-400',
          defaultSelected: false,
          items: xmpEdited,
          expanded: false,
        });
      }

      if (hasEdits.length > 0) {
        const weakMatches = hasEdits.filter(h => h.matchStrength === 'weak').length;
        newCategories.push({
          id: 'has-edits',
          title: `RAW with Exports (${hasEdits.length})`,
          description: `Has matching JPG/PSD files${weakMatches > 0 ? ` (${weakMatches} in different folders)` : ''}`,
          icon: <Image className="h-5 w-5" />,
          color: 'text-green-400',
          defaultSelected: false,
          items: hasEdits,
          expanded: false,
        });
      }

      // Collect all matched exports (JPG/PSD files that match a RAW)
      // This includes exports from has-acr, has-xmp, and has-edit categories
      const allMatchedExports: MatchedExport[] = [];
      const seenExports = new Set<string>(); // Avoid duplicates by path

      for (const raw of [...acrEdited, ...xmpEdited, ...hasEdits]) {
        for (const matched of raw.matchedFiles) {
          // Only include actual edit files (JPG, PSD, etc.), not sidecars
          if (EDIT_EXTENSIONS.includes(matched.extension) && !seenExports.has(matched.path)) {
            seenExports.add(matched.path);
            allMatchedExports.push({
              ...matched,
              matchedRAW: raw.name,
              selected: false, // Unchecked by default - these are preserved
            });
          }
        }
      }

      if (allMatchedExports.length > 0) {
        newCategories.push({
          id: 'matched-exports',
          title: `Matched Exports (${allMatchedExports.length})`,
          description: 'JPG/PSD files that match RAW files - preserved by default',
          icon: <FileCheck className="h-5 w-5" />,
          color: 'text-emerald-400',
          defaultSelected: false,
          items: allMatchedExports,
          expanded: false,
        });
      }

      setCategories(newCategories);

      const totalJunk = junkFiles.length + junkFolders.length;
      const totalRAW = orphanedRAWs.length;

      toast({
        title: 'Scan complete',
        description: `Found ${totalJunk} junk items and analysed ${totalRAW} RAW files`,
      });
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
  }, [directoryHandle, scanDirectory, analyseOrphanedRAWs, includeOrphanedRAW, toast]);

  // Toggle item selection
  const toggleItem = useCallback((categoryId: string, itemIndex: number) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map((item, i) =>
          i === itemIndex ? { ...item, selected: !item.selected } : item
        ),
      };
    }));
  }, []);

  // Toggle category expansion
  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  }, []);

  // Select/deselect all in category
  const selectAllInCategory = useCallback((categoryId: string, selected: boolean) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, selected })),
      };
    }));
  }, []);

  // Load preview for ARW
  const loadPreview = useCallback(async (item: OrphanedRAW) => {
    if (item.previewUrl) {
      setPreviewFile(item);
      return;
    }

    try {
      const file = await item.handle.getFile();
      const previewUrl = await extractARWPreview(file);

      if (previewUrl) {
        // Update the item with preview URL
        setCategories(prev => prev.map(cat => ({
          ...cat,
          items: cat.items.map(i =>
            i === item ? { ...i, previewUrl } as OrphanedRAW : i
          ),
        })));
        setPreviewFile({ ...item, previewUrl });
      } else {
        toast({
          title: 'Preview unavailable',
          description: 'Could not extract preview from this RAW file',
        });
      }
    } catch (error) {
      toast({
        title: 'Preview failed',
        description: 'Error loading file preview',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Delete selected files
  const handleDelete = useCallback(async () => {
    const selectedItems: (JunkFile | OrphanedRAW | MatchedExport)[] = [];
    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.selected) selectedItems.push(item);
      });
    });

    if (selectedItems.length === 0) {
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

    for (const item of selectedItems) {
      try {
        const isFolder = 'type' in item && item.type === 'folder';
        await item.parentHandle.removeEntry(item.name, { recursive: isFolder });
        successCount++;
      } catch (error: any) {
        errors.push(`${item.name}: ${error.message}`);
      }
    }

    setIsDeleting(false);

    if (errors.length > 0) {
      toast({
        title: 'Partial success',
        description: `Deleted ${successCount} items. ${errors.length} errors.`,
        variant: 'destructive',
      });
    } else {
      // Mark as completed for a satisfying finish
      setIsCompleted(true);
      toast({
        title: 'Cleanup complete!',
        description: `Deleted ${successCount} items`,
      });

      // Clear categories to show empty state with completion indicator
      setCategories([]);
    }
  }, [categories, handleScan, toast]);

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="tool-card-gradient border-red-500/50">
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
            <div className="text-6xl mb-4">🧹</div>
            <h1 className="text-white text-4xl lg:text-5xl mb-4">Project Cleanup</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Smart cleanup of system junk and orphaned RAW files.
              Safely removes .DS_Store, temp files, and identifies unused camera RAW files.
            </p>
          </div>

          {/* Process Flow */}
          <ProcessFlow
            steps={PROCESS_STEPS}
            currentStep={currentStep}
            isProcessing={isScanning || isDeleting}
            processingText={isDeleting ? 'Cleaning up files...' : scanProgress}
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
                    Scan for Cleanup
                  </Button>
                </div>

                {folderName && (
                  <div className="text-center text-gray-400 mb-4">
                    Selected: <span className="text-cyan">{folderName}</span>
                  </div>
                )}

                {/* Scan Options */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-6 justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={includeJunk}
                        onCheckedChange={(c) => setIncludeJunk(c === true)}
                      />
                      <span className="text-sm text-gray-400">System junk files</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={includeOrphanedRAW}
                        onCheckedChange={(c) => setIncludeOrphanedRAW(c === true)}
                      />
                      <span className="text-sm text-gray-400">Orphaned RAW analysis</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {categories.length > 0 && (
              <>
                {/* Stats Bar */}
                <Card className="tool-card-gradient border-white/10 mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-400">
                          📊 <span className="text-white">{stats.totalFiles}</span> items found
                        </span>
                        <span className="text-gray-400">
                          ✅ <span className="text-white">{stats.selectedFiles}</span> selected
                        </span>
                        <span className="text-gray-400">
                          💾 <span className="text-cyan">{stats.totalSize}</span> to free
                        </span>
                      </div>

                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={stats.selectedFiles === 0 || isDeleting}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Categories */}
                <div className="space-y-4">
                  {categories.map(category => (
                    <Card key={category.id} className="tool-card-gradient border-white/10 overflow-hidden">
                      <Collapsible open={category.expanded} onOpenChange={() => toggleCategoryExpanded(category.id)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={category.color}>{category.icon}</span>
                                <div>
                                  <CardTitle className="text-white text-base">{category.title}</CardTitle>
                                  <CardDescription className="text-xs">{category.description}</CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Category size */}
                                <span className="text-xs text-cyan">
                                  {formatFileSize(getCategorySize(category.items).selected)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {category.items.filter(i => i.selected).length}/{category.items.length}
                                </Badge>
                                {category.expanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="p-0 border-t border-white/10">
                            {/* Quick actions */}
                            <div className="px-4 py-2 bg-black/20 flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => selectAllInCategory(category.id, true)}
                                className="text-xs h-7"
                              >
                                <CheckSquare className="mr-1 h-3 w-3" />
                                Select All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => selectAllInCategory(category.id, false)}
                                className="text-xs h-7"
                              >
                                <Square className="mr-1 h-3 w-3" />
                                Deselect All
                              </Button>
                            </div>

                            {/* Items list */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                              {category.items.map((item, index) => (
                                <div
                                  key={`${item.path}-${index}`}
                                  className={`flex items-center gap-3 px-4 py-2 hover:bg-white/5 ${
                                    'matchStrength' in item && item.matchStrength === 'weak'
                                      ? 'bg-amber-500/5 border-l-2 border-amber-500'
                                      : ''
                                  }`}
                                >
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleItem(category.id, index)}
                                  />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-white text-sm truncate">{item.name}</span>
                                      {'matchStrength' in item && item.matchStrength === 'weak' && (
                                        <span title="Match in different folder">
                                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{item.path}</div>
                                    {'matchedFiles' in item && item.matchedFiles.length > 0 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Matched: {item.matchedFiles.map(f => f.name).join(', ')}
                                      </div>
                                    )}
                                    {'matchedRAW' in item && (
                                      <div className="text-xs text-emerald-600 mt-1">
                                        From: {item.matchedRAW}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-500">{formatFileSize(item.size)}</span>
                                    {'category' in item && RAW_EXTENSIONS.includes(item.extension) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => loadPreview(item as OrphanedRAW)}
                                        title="Preview"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {directoryHandle && categories.length === 0 && !isScanning && (
              <Card className="tool-card-gradient border-white/10">
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-white text-lg mb-2">Folder is clean!</h3>
                  <p className="text-gray-400 text-sm">
                    No junk files or orphaned RAW files found.
                  </p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Loading Overlays */}
      {isScanning && (
        <LoadingOverlay
          text="Scanning folder..."
          subText={scanProgress}
        />
      )}

      {isDeleting && (
        <LoadingOverlay
          text="Cleaning up..."
          subText={`Deleting ${stats.selectedFiles} items`}
        />
      )}

      {/* Preview Modal */}
      {previewFile && previewFile.previewUrl && (
        <AlertDialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <AlertDialogContent className="tool-card-gradient border-white/10 max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">{previewFile.name}</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {previewFile.path}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <img
                src={previewFile.previewUrl}
                alt={previewFile.name}
                className="w-full h-auto max-h-96 object-contain rounded-lg bg-black/50"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600">Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toggleItem(
                    categories.find(c => c.items.includes(previewFile))?.id || '',
                    categories.find(c => c.items.includes(previewFile))?.items.indexOf(previewFile) || 0
                  );
                  setPreviewFile(null);
                }}
                className={previewFile.selected ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}
              >
                {previewFile.selected ? 'Keep This File' : 'Mark for Deletion'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="tool-card-gradient border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Cleanup</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete {stats.selectedFiles} items?
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
