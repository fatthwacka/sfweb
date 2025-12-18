/**
 * Project Cleanup Tool
 * Smart cleanup of junk files and orphaned RAW files
 * Uses File System Access API (Chrome/Edge/Opera 86+)
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  Folder,
  ImageIcon,
  CheckCircle2,
  Minus,
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

// Custom IndeterminateCheckbox component
const IndeterminateCheckbox = React.forwardRef<
  HTMLButtonElement,
  {
    checked: boolean;
    indeterminate?: boolean;
    onCheckedChange: (checked: boolean) => void;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
  }
>(({ checked, indeterminate, onCheckedChange, onClick, className }, ref) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  React.useEffect(() => {
    if (buttonRef.current) {
      (buttonRef.current as any).indeterminate = indeterminate;
    }
  }, [indeterminate]);
  
  React.useImperativeHandle(ref, () => buttonRef.current!, []);
  
  const displayChecked = checked || (indeterminate ?? false);
  
  return (
    <div className="relative inline-flex">
      <Checkbox
        ref={buttonRef}
        checked={displayChecked}
        onCheckedChange={onCheckedChange}
        onClick={onClick}
        className={`${className} ${indeterminate && !checked ? 'data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600' : ''}`}
      />
      {indeterminate && !checked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Minus className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
  );
});

IndeterminateCheckbox.displayName = 'IndeterminateCheckbox';

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
  matchStrength: 'strong' | 'moderate' | 'weak';  // strong = same folder, moderate = adjacent folder, weak = distant folder
  selected: boolean;
  previewUrl?: string;
}

interface PreviewableFile {
  handle: FileSystemFileHandle;
  name: string;
  path: string;
  size: number;
  extension: string;
  previewUrl?: string;
  selected: boolean;
}

interface MatchedExport extends FileInfo {
  matchedRAW: string;  // name of the RAW file this export matches
  selected: boolean;
  previewUrl?: string;
}

interface FolderGroup {
  folderPath: string;
  folderName: string;  // Just the folder name, not full path
  items: (JunkFile | OrphanedRAW | MatchedExport)[];
  expanded: boolean;
  totalSize: number;
  allSelected: boolean;
  someSelected: boolean;
}

interface SubCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultSelected: boolean;
  items: (JunkFile | OrphanedRAW | MatchedExport)[];
  folderGroups?: FolderGroup[];  // Grouped by folder
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
  subCategories?: SubCategory[];  // Optional sub-categories for nested control
  folderGroups?: FolderGroup[];  // Direct folder grouping for categories without subcategories
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

// Group files by their parent folder
const groupFilesByFolder = (items: (JunkFile | OrphanedRAW | MatchedExport)[]): FolderGroup[] => {
  const folderMap = new Map<string, (JunkFile | OrphanedRAW | MatchedExport)[]>();
  
  // Group items by parentPath
  for (const item of items) {
    const folderPath = item.parentPath;
    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, []);
    }
    folderMap.get(folderPath)!.push(item);
  }
  
  // Convert to FolderGroup array and sort by path
  const folderGroups: FolderGroup[] = Array.from(folderMap.entries())
    .map(([path, items]) => {
      const totalSize = items.reduce((sum, item) => sum + item.size, 0);
      const selectedCount = items.filter(item => item.selected).length;
      
      // Extract folder name from path
      const pathParts = path.split('/');
      const folderName = pathParts[pathParts.length - 1] || path;
      
      return {
        folderPath: path,
        folderName,
        items,
        expanded: false,
        totalSize,
        allSelected: selectedCount === items.length && items.length > 0,
        someSelected: selectedCount > 0 && selectedCount < items.length,
      };
    })
    .sort((a, b) => a.folderPath.localeCompare(b.folderPath));
  
  return folderGroups;
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

// Enhanced flexible filename matching for RAW-to-edit associations
const isFlexibleMatch = (rawBaseName: string, editBaseName: string): boolean => {
  const rawName = getBaseName(rawBaseName).toUpperCase();
  const editName = editBaseName.toUpperCase();
  
  // Extract camera ID from RAW filename using multiple patterns
  const cameraPatterns = [
    /(_?DSC\d+)/gi,
    /(_?IMG_?\d+)/gi,
    /(P\d{7,})/gi,
    /([A-Z]{2,4}\d{4,})/gi,
  ];
  
  // Find all potential camera IDs in the RAW filename
  const rawCameraIds: string[] = [];
  for (const pattern of cameraPatterns) {
    const matches = rawName.matchAll(pattern);
    for (const match of matches) {
      rawCameraIds.push(match[1]);
    }
  }
  
  // If no camera patterns found, use the full basename
  if (rawCameraIds.length === 0) {
    rawCameraIds.push(rawName);
  }
  
  // Check if any camera ID appears in the edit filename
  // Look for camera ID as separate word (bounded by non-alphanumeric chars)
  for (const cameraId of rawCameraIds) {
    // Create regex that matches camera ID as whole word, allowing for separators
    const wordBoundaryRegex = new RegExp(`(^|[^A-Z0-9])${cameraId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Z0-9]|$)`, 'i');
    if (wordBoundaryRegex.test(editName)) {
      return true;
    }
  }
  
  // Fallback: check if RAW basename is contained anywhere in edit basename
  return editName.includes(rawName);
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

// Create preview URL for JPG files
const createJPGPreview = async (file: File): Promise<string> => {
  return URL.createObjectURL(file);
};

// Check if file type supports preview
const supportsPreview = (filename: string): boolean => {
  const extension = getExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'arw', 'cr2', 'cr3', 'nef', 'raf', 'orf', 'rw2', 'dng'].includes(extension);
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
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  // Enhanced function to find truly orphaned JPGs (JPGs without corresponding RAW or PSD files)
  const findOrphanedJPGs = useCallback((allFiles: FileInfo[], rawFiles: OrphanedRAW[]) => {
    const jpgFiles = allFiles.filter(f => ['jpg', 'jpeg'].includes(f.extension.toLowerCase()));
    const psdFiles = allFiles.filter(f => f.extension.toLowerCase() === 'psd');
    const allMatchedJPGs = new Set<string>();
    
    // Collect all JPG files that are matched to RAW files
    for (const raw of rawFiles) {
      for (const matched of raw.matchedFiles) {
        if (['jpg', 'jpeg'].includes(matched.extension.toLowerCase())) {
          allMatchedJPGs.add(matched.path);
        }
      }
    }
    
    // Now check remaining JPGs against PSD files using flexible matching
    const orphanedJPGs = jpgFiles.filter(jpg => {
      // Already matched to a RAW? Not orphaned
      if (allMatchedJPGs.has(jpg.path)) {
        return false;
      }
      
      // Check if this JPG matches any PSD file (even across folders)
      const jpgBaseName = jpg.cameraBaseName || jpg.baseName;
      const jpgParent = jpg.parentPath;
      
      // Look for matching PSD files
      const hasMatchingPSD = psdFiles.some(psd => {
        const psdBaseName = psd.cameraBaseName || psd.baseName;
        
        // First priority: exact camera name match
        if (jpgBaseName && psdBaseName && jpgBaseName === psdBaseName) {
          return true;
        }
        
        // Second priority: flexible name matching
        if (isFlexibleMatch(jpg.baseName, psd.baseName)) {
          return true;
        }
        
        // Third priority: check if PSD name contains JPG base name
        if (psd.baseName.toUpperCase().includes(jpgBaseName.toUpperCase())) {
          return true;
        }
        
        // Fourth priority: check for common editing suffixes
        const suffixes = ['-edit', '-edited', '_edit', '_edited', '-final', '_final', '-export', '_export'];
        for (const suffix of suffixes) {
          if (psd.baseName.toUpperCase() === (jpgBaseName + suffix).toUpperCase() ||
              jpgBaseName.toUpperCase() === (psd.baseName.replace(/[-_](edit|edited|final|export)$/i, '')).toUpperCase()) {
            return true;
          }
        }
        
        return false;
      });
      
      // If JPG has a matching PSD, it's not orphaned
      return !hasMatchingPSD;
    });
    
    return orphanedJPGs.map(jpg => ({
      ...jpg,
      selected: false, // Don't delete orphaned JPGs by default - they might be important
    }));
  }, []);

  // Helper function to create sub-categories based on JPG association
  const createSubCategories = useCallback((rawFiles: OrphanedRAW[], categoryId: string) => {
    const withJPG: OrphanedRAW[] = [];
    const withoutJPG: OrphanedRAW[] = [];
    
    for (const raw of rawFiles) {
      const hasJPG = raw.matchedFiles.some(file => 
        ['jpg', 'jpeg'].includes(file.extension.toLowerCase())
      );
      
      if (hasJPG) {
        withJPG.push(raw);
      } else {
        withoutJPG.push(raw);
      }
    }
    
    const subCategories: SubCategory[] = [];
    
    // Create overall sub-categories first (these will be at the top)
    if (withJPG.length > 0) {
      subCategories.push({
        id: `${categoryId}-with-jpg`,
        title: `With associated JPG (${withJPG.length} files)`,
        description: 'Already exported to JPG - safe to delete',
        icon: <FileCheck className="h-4 w-4" />,
        color: 'text-green-400',
        defaultSelected: true, // Safe to delete by default
        items: withJPG,
        folderGroups: groupFilesByFolder(withJPG), // Add folder grouping
      });
    }
    
    if (withoutJPG.length > 0) {
      subCategories.push({
        id: `${categoryId}-without-jpg`,
        title: `Without associated JPG (${withoutJPG.length} files)`,
        description: 'Not yet exported - review before deleting',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-amber-400',
        defaultSelected: false, // Preserve by default
        items: withoutJPG,
        folderGroups: groupFilesByFolder(withoutJPG), // Add folder grouping
      });
    }
    
    // Then create per-folder breakdown for more granular control
    // Only show folder breakdown if there are multiple folders
    const folderGroups = groupFilesByFolder(rawFiles);
    if (folderGroups.length > 1) {
      for (const folder of folderGroups) {
        const folderWithJPG = folder.items.filter(item => {
          const raw = item as OrphanedRAW;
          return raw.matchedFiles.some(file => 
            ['jpg', 'jpeg'].includes(file.extension.toLowerCase())
          );
        });
        
        const folderWithoutJPG = folder.items.filter(item => {
          const raw = item as OrphanedRAW;
          return !raw.matchedFiles.some(file => 
            ['jpg', 'jpeg'].includes(file.extension.toLowerCase())
          );
        });
        
        // Create a combined folder entry with both counts
        if (folderWithJPG.length > 0 || folderWithoutJPG.length > 0) {
          subCategories.push({
            id: `${categoryId}-folder-${folder.folderPath}`,
            title: folder.folderName,
            description: `✅ ${folderWithJPG.length} with JPG | ⚠️ ${folderWithoutJPG.length} without JPG`,
            icon: <Folder className="h-4 w-4" />,
            color: 'text-purple-400',
            defaultSelected: false,
            items: folder.items,
          });
        }
      }
    }
    
    return subCategories;
  }, []);

  // Create subcategories for export files (JPG, PSD) by grouping them by folder
  const createExportSubCategories = useCallback((exportFiles: (MatchedExport | OrphanedJPG)[], categoryId: string) => {
    const folderGroups = groupFilesByFolder(exportFiles);
    const subCategories: SubCategory[] = [];
    
    // Create a subcategory for each folder
    for (const folder of folderGroups) {
      subCategories.push({
        id: `${categoryId}-folder-${folder.folderPath}`,
        title: folder.folderName,
        description: `${folder.items.length} files in this folder`,
        icon: <Folder className="h-4 w-4" />,
        color: 'text-purple-400',
        defaultSelected: false,
        items: folder.items,
      });
    }
    
    return subCategories;
  }, []);

  // Enhanced analysis of orphaned RAWs with improved cross-folder matching
  const analyseOrphanedRAWs = useCallback((allFiles: FileInfo[]): OrphanedRAW[] => {
    const rawFiles = allFiles.filter(f => RAW_EXTENSIONS.includes(f.extension));
    const editFiles = allFiles.filter(f => EDIT_EXTENSIONS.includes(f.extension));
    const sidecarFiles = allFiles.filter(f => SIDECAR_EXTENSIONS.includes(f.extension));

    const orphans: OrphanedRAW[] = [];

    for (const raw of rawFiles) {
      const rawBaseName = raw.cameraBaseName;
      const rawParent = raw.parentPath;

      // Find matching sidecars (XMP, ACR) - search across ALL folders
      const matchingACR = sidecarFiles.filter(f =>
        f.extension === 'acr' &&
        (f.cameraBaseName === rawBaseName || 
         isFlexibleMatch(raw.baseName, f.baseName))
      );
      const matchingXMP = sidecarFiles.filter(f =>
        f.extension === 'xmp' &&
        (f.cameraBaseName === rawBaseName || 
         isFlexibleMatch(raw.baseName, f.baseName))
      );

      // Enhanced matching for edits - more aggressive cross-folder search
      const allMatchingEdits = editFiles.filter(f => {
        const editBaseName = f.cameraBaseName || f.baseName;
        
        // 1. Exact camera name match (strongest)
        if (rawBaseName && editBaseName && rawBaseName === editBaseName) {
          return true;
        }
        
        // 2. Flexible pattern matching
        if (isFlexibleMatch(raw.baseName, f.baseName)) {
          return true;
        }
        
        // 3. Edit contains raw base name
        if (f.baseName.toUpperCase().includes(rawBaseName.toUpperCase())) {
          return true;
        }
        
        // 4. Check for common Lightroom/Photoshop export patterns
        // e.g., DSC1234 → DSC1234-Edit, DSC1234_edited, DSC1234-2, etc.
        const patterns = [
          new RegExp(`^${rawBaseName}[-_]?(edit|edited|final|export|[0-9]+)`, 'i'),
          new RegExp(`^${rawBaseName}$`, 'i'), // Exact match
        ];
        
        return patterns.some(pattern => pattern.test(editBaseName));
      });

      // Separate matches by folder location
      const sameParentEdits = allMatchingEdits.filter(f => f.parentPath === rawParent);
      const adjacentFolderEdits = allMatchingEdits.filter(f => {
        // Consider edits in parent or sibling folders as "adjacent"
        const rawParentParts = rawParent.split('/');
        const editParentParts = f.parentPath.split('/');
        
        // Same depth (sibling folders)
        if (rawParentParts.length === editParentParts.length) {
          // Check if they share the same parent folder
          const rawGrandparent = rawParentParts.slice(0, -1).join('/');
          const editGrandparent = editParentParts.slice(0, -1).join('/');
          return rawGrandparent === editGrandparent && f.parentPath !== rawParent;
        }
        
        // One level up or down
        return Math.abs(rawParentParts.length - editParentParts.length) === 1;
      });
      const distantFolderEdits = allMatchingEdits.filter(f => 
        f.parentPath !== rawParent && 
        !adjacentFolderEdits.includes(f)
      );

      // Determine category with enhanced logic
      let category: OrphanedRAW['category'] = 'orphan';
      let matchedFiles: FileInfo[] = [];
      let matchStrength: OrphanedRAW['matchStrength'] | undefined;

      if (matchingACR.length > 0) {
        category = 'has-acr';
        // Include ALL matching edits when there's an ACR file
        matchedFiles = [...matchingACR, ...allMatchingEdits];
        // Determine match strength based on edit file locations
        if (sameParentEdits.length > 0) {
          matchStrength = 'strong';
        } else if (adjacentFolderEdits.length > 0) {
          matchStrength = 'moderate';
        } else if (distantFolderEdits.length > 0) {
          matchStrength = 'weak';
        }
      } else if (matchingXMP.length > 0) {
        category = 'has-xmp';
        // Include ALL matching edits when there's an XMP file
        matchedFiles = [...matchingXMP, ...allMatchingEdits];
        // Determine match strength based on edit file locations
        if (sameParentEdits.length > 0) {
          matchStrength = 'strong';
        } else if (adjacentFolderEdits.length > 0) {
          matchStrength = 'moderate';
        } else if (distantFolderEdits.length > 0) {
          matchStrength = 'weak';
        }
      } else if (sameParentEdits.length > 0) {
        category = 'has-edit';
        matchedFiles = [...sameParentEdits, ...adjacentFolderEdits];
        matchStrength = 'strong';
      } else if (adjacentFolderEdits.length > 0) {
        category = 'has-edit';
        matchedFiles = adjacentFolderEdits;
        matchStrength = 'moderate';
      } else if (distantFolderEdits.length > 0) {
        category = 'has-edit';
        matchedFiles = distantFolderEdits;
        matchStrength = 'weak';
      }
      // If no matches at all, it stays as 'orphan' with no matchStrength

      orphans.push({
        ...raw,
        category,
        matchedFiles,
        matchStrength: matchStrength || (category === 'orphan' ? 'weak' : 'strong'), // Only set for items with matches
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
          expanded: false,
          folderGroups: groupFilesByFolder(junkFiles),
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
          expanded: false,
          folderGroups: groupFilesByFolder(junkFolders),
        });
      }

      // Orphaned RAWs - categorised
      const trueOrphans = orphanedRAWs.filter(r => r.category === 'orphan');
      const acrEdited = orphanedRAWs.filter(r => r.category === 'has-acr');
      const xmpEdited = orphanedRAWs.filter(r => r.category === 'has-xmp');
      const hasEdits = orphanedRAWs.filter(r => r.category === 'has-edit');

      if (trueOrphans.length > 0) {
        const subCategories = createSubCategories(trueOrphans, 'orphan-raw');
        newCategories.push({
          id: 'orphan-raw',
          title: `Orphaned RAW Files (${trueOrphans.length})`,
          description: 'No corresponding JPG, PSD, XMP or ACR found - likely unused shots',
          icon: <Trash2 className="h-5 w-5" />,
          color: 'text-red-400',
          defaultSelected: true,
          items: trueOrphans,
          expanded: false,
          folderGroups: groupFilesByFolder(trueOrphans),
          subCategories,
        });
      }

      if (acrEdited.length > 0) {
        const subCategories = createSubCategories(acrEdited, 'acr-edited');
        newCategories.push({
          id: 'acr-edited',
          title: `AI Enhanced RAW (${acrEdited.length})`,
          description: 'Has .ACR sidecar - edited with Adobe Camera Raw AI features',
          icon: <Sparkles className="h-5 w-5" />,
          color: 'text-purple-400',
          defaultSelected: false,
          items: acrEdited,
          expanded: false,
          folderGroups: groupFilesByFolder(acrEdited),
          subCategories,
        });
      }

      if (xmpEdited.length > 0) {
        const subCategories = createSubCategories(xmpEdited, 'xmp-edited');
        newCategories.push({
          id: 'xmp-edited',
          title: `Lightroom Edited RAW (${xmpEdited.length})`,
          description: 'Has .XMP sidecar - Lightroom/Camera Raw settings applied',
          icon: <Settings className="h-5 w-5" />,
          color: 'text-blue-400',
          defaultSelected: false,
          items: xmpEdited,
          expanded: false,
          folderGroups: groupFilesByFolder(xmpEdited),
          subCategories,
        });
      }

      if (hasEdits.length > 0) {
        const strongMatches = hasEdits.filter(h => h.matchStrength === 'strong').length;
        const moderateMatches = hasEdits.filter(h => h.matchStrength === 'moderate').length;
        const weakMatches = hasEdits.filter(h => h.matchStrength === 'weak').length;
        
        // Build description with match strength breakdown
        let matchDescription = 'Has matching JPG/PSD files';
        const matchTypes: string[] = [];
        if (strongMatches > 0) matchTypes.push(`${strongMatches} same folder`);
        if (moderateMatches > 0) matchTypes.push(`${moderateMatches} adjacent folder`);
        if (weakMatches > 0) matchTypes.push(`${weakMatches} distant folder`);
        if (matchTypes.length > 0) {
          matchDescription += ` (${matchTypes.join(', ')})`;
        }
        
        const subCategories = createSubCategories(hasEdits, 'has-edits');
        newCategories.push({
          id: 'has-edits',
          title: `RAW with Exports (${hasEdits.length})`,
          description: matchDescription,
          icon: <Image className="h-5 w-5" />,
          color: 'text-green-400',
          defaultSelected: false,
          items: hasEdits,
          expanded: false,
          folderGroups: groupFilesByFolder(hasEdits),
          subCategories,
        });
      }

      // Collect all matched exports (JPG/PSD files that match a RAW)
      // Split into separate JPG and PSD categories
      const matchedJPGs: MatchedExport[] = [];
      const matchedPSDs: MatchedExport[] = [];
      const seenExports = new Set<string>(); // Avoid duplicates by path

      for (const raw of [...acrEdited, ...xmpEdited, ...hasEdits]) {
        for (const matched of raw.matchedFiles) {
          // Only include actual edit files (JPG, PSD, etc.), not sidecars
          if (EDIT_EXTENSIONS.includes(matched.extension) && !seenExports.has(matched.path)) {
            seenExports.add(matched.path);
            const exportFile = {
              ...matched,
              matchedRAW: raw.name,
              selected: false, // Unchecked by default - these are preserved
            };

            // Split by file type
            if (['jpg', 'jpeg'].includes(matched.extension.toLowerCase())) {
              matchedJPGs.push(exportFile);
            } else if (matched.extension.toLowerCase() === 'psd') {
              matchedPSDs.push(exportFile);
            }
          }
        }
      }

      // Add JPG exports category
      if (matchedJPGs.length > 0) {
        const subCategories = createExportSubCategories(matchedJPGs, 'matched-jpg-exports');
        newCategories.push({
          id: 'matched-jpg-exports',
          title: `JPG Exports (${matchedJPGs.length})`,
          description: 'JPG files that match RAW files - preserved by default',
          icon: <FileCheck className="h-5 w-5" />,
          color: 'text-emerald-400',
          defaultSelected: false,
          items: matchedJPGs,
          expanded: false,
          folderGroups: groupFilesByFolder(matchedJPGs),
          subCategories,
        });
      }

      // Add PSD exports category
      if (matchedPSDs.length > 0) {
        const subCategories = createExportSubCategories(matchedPSDs, 'matched-psd-exports');
        newCategories.push({
          id: 'matched-psd-exports',
          title: `PSD Exports (${matchedPSDs.length})`,
          description: 'PSD files that match RAW files - preserved by default',
          icon: <FileCheck className="h-5 w-5" />,
          color: 'text-blue-400',
          defaultSelected: false,
          items: matchedPSDs,
          expanded: false,
          folderGroups: groupFilesByFolder(matchedPSDs),
          subCategories,
        });
      }

      // Find and add truly orphaned JPGs (JPGs without corresponding RAW or PSD files)
      const orphanedJPGs = findOrphanedJPGs(allFiles, orphanedRAWs);
      if (orphanedJPGs.length > 0) {
        const subCategories = createExportSubCategories(orphanedJPGs, 'orphaned-jpgs');
        newCategories.push({
          id: 'orphaned-jpgs',
          title: `Orphaned JPG Files (${orphanedJPGs.length})`,
          description: 'JPG files with no corresponding RAW or PSD files - standalone exports or downloads',
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-amber-400',
          defaultSelected: false, // Don't delete by default - might be important
          items: orphanedJPGs,
          expanded: false,
          folderGroups: groupFilesByFolder(orphanedJPGs),
          subCategories,
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
  
  // Toggle sub-category visibility in Quick Selection
  const toggleSubCategoryExpanded = useCallback((categoryId: string) => {
    setExpandedSubCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
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

  // Reveal file in Finder/File Explorer
  const revealInFinder = useCallback(async (filePath: string) => {
    try {
      // Copy file path to clipboard for user convenience
      await navigator.clipboard.writeText(filePath);
      toast({
        title: 'File path copied',
        description: `Path copied to clipboard: ${filePath}`,
      });
    } catch (error) {
      console.error('Error copying path:', error);
      toast({
        title: 'File location',
        description: filePath,
      });
    }
  }, [toast]);

  // Load preview for any supported file type
  const loadPreview = useCallback(async (item: JunkFile | OrphanedRAW | MatchedExport) => {
    // Check if already has preview URL
    if ('previewUrl' in item && item.previewUrl) {
      setPreviewFile({
        handle: item.handle,
        name: item.name,
        path: item.path,
        size: item.size,
        extension: item.extension,
        previewUrl: item.previewUrl,
        selected: item.selected,
      });
      return;
    }

    // Check if file supports preview
    if (!supportsPreview(item.name)) {
      toast({
        title: 'Preview not supported',
        description: `Cannot preview .${item.extension} files`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const file = await item.handle.getFile();
      let previewUrl: string | null = null;

      const extension = item.extension.toLowerCase();

      // Handle different file types
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
        previewUrl = await createJPGPreview(file);
      } else if (['arw', 'cr2', 'cr3', 'nef', 'raf', 'orf', 'rw2', 'dng'].includes(extension)) {
        previewUrl = await extractARWPreview(file);
      }

      if (previewUrl) {
        // Update the item with preview URL
        setCategories(prev => prev.map(cat => ({
          ...cat,
          items: cat.items.map(i =>
            i.path === item.path ? { ...i, previewUrl } : i
          ),
        })));
        
        setPreviewFile({
          handle: item.handle,
          name: item.name,
          path: item.path,
          size: item.size,
          extension: item.extension,
          previewUrl,
          selected: item.selected,
        });
      } else {
        toast({
          title: 'Preview unavailable',
          description: extension.toUpperCase() === 'ARW' 
            ? 'Could not extract embedded preview from this RAW file'
            : 'Could not load preview for this file',
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

        </div>
      </div>

      {/* Main Content */}
      <div className="py-8" style={{ background: 'linear-gradient(to bottom, #475569 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            {/* Controls */}
            <Card className="tool-card-gradient border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 justify-center mb-4">
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
                    Scan
                  </Button>
                </div>

                {folderName && (
                  <div className="text-center text-gray-400 mb-3">
                    Selected: <span className="text-cyan">{folderName}</span>
                  </div>
                )}

                {/* Process Flow - Always Visible */}
                <div className="mt-3">
                  <ProcessFlow
                    steps={PROCESS_STEPS}
                    currentStep={currentStep}
                    isProcessing={isScanning || isDeleting}
                    processingText={isDeleting ? 'Cleaning up files...' : scanProgress}
                  />
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

                {/* Smart Summary Section */}
                <Card className="overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-lg font-bold">Quick Selection</h3>
                      <div className="text-white font-bold text-lg text-right" style={{ marginRight: '60px' }}>
                        {(() => {
                          const selectedTotal = categories.reduce((sum, cat) => sum + getCategorySize(cat.items).selected, 0);
                          const overallTotal = categories.reduce((sum, cat) => sum + getCategorySize(cat.items).total, 0);
                          return `${formatFileSize(selectedTotal)} / ${formatFileSize(overallTotal)}`;
                        })()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {categories.map(category => {
                        const sizes = getCategorySize(category.items);
                        const allSelected = category.items.every(item => item.selected);
                        const someSelected = category.items.some(item => item.selected);
                        
                        const getDescription = (categoryId: string) => {
                          switch (categoryId) {
                            case 'junk-files':
                              return 'Delete junk files like .DS_Store and cache files';
                            case 'junk-folders':
                              return 'Delete system junk folders and temporary directories';
                            case 'orphan-raw':
                              return 'Raw images never opened in Lightroom nor Photoshop';
                            case 'acr-edited':
                              return 'Raw images with Lightroom AI enhancements';
                            case 'xmp-edited':
                              return 'Raw images with Lightroom settings';
                            case 'has-edits':
                              return 'Raw images that have associated PSDs and/or JPGs';
                            case 'matched-exports':
                              return 'Your finished JPG and PSD photos';
                            case 'matched-jpg-exports':
                              return 'Associated JPG exports';
                            case 'matched-psd-exports':
                              return 'Associated PSD files';
                            case 'orphaned-jpgs':
                              return 'Orphaned JPG files (no matching RAW)';
                            default:
                              return category.description;
                          }
                        };

                        const hasSubCategories = category.subCategories && category.subCategories.length > 0;
                        const hasFolderGroups = category.folderGroups && category.folderGroups.length > 1; // Only show if more than 1 folder
                        const isExpanded = expandedSubCategories.has(category.id);
                        const isFoldersExpanded = expandedFolders.has(category.id);
                        
                        return (
                          <div key={category.id} className="space-y-2">
                            {/* Main category row */}
                            <div className="grid grid-cols-12 items-center bg-white/10 rounded p-2 gap-2">
                              {/* Left: Checkbox + Title (6 columns) */}
                              <div className="col-span-6 flex items-center gap-3">
                                <IndeterminateCheckbox
                                  checked={allSelected}
                                  indeterminate={someSelected && !allSelected}
                                  onCheckedChange={(checked) => {
                                    selectAllInCategory(category.id, checked === true);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                                />
                                {hasSubCategories && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSubCategoryExpanded(category.id)}
                                    className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                                  >
                                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  </Button>
                                )}
                                <span className="text-white text-sm">
                                  {getDescription(category.id)}
                                </span>
                              </div>
                              
                              {/* Center: File Count (3 columns) */}
                              <div className="col-span-3 text-left">
                                <span className="text-xs text-cyan font-medium bg-purple-500/20 px-2 py-1 rounded">
                                  {category.items.filter(item => item.selected).length} / {category.items.length} files
                                </span>
                              </div>
                              
                              {/* Right: Size + Chevron (3 columns) */}
                              <div className="col-span-3 flex items-center justify-end gap-2">
                                <span className="text-xs text-white font-mono bg-white/20 px-2 py-1 rounded">
                                  {formatFileSize(sizes.selected)} / {formatFileSize(sizes.total)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent container click
                                    const element = document.getElementById(`category-${category.id}`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      if (!category.expanded) {
                                        toggleCategoryExpanded(category.id);
                                      }
                                    }
                                  }}
                                  className="text-purple-200 hover:text-white hover:bg-white/20 h-6 px-2"
                                  title="Inspect details"
                                >
                                  <Search className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Folder groups if they exist and are expanded */}
                            {hasFolderGroups && isFoldersExpanded && category.folderGroups!.map(folder => {
                              const folderAllSelected = folder.items.every(item => item.selected);
                              const folderSomeSelected = folder.items.some(item => item.selected);
                              const folderSizes = {
                                selected: folder.items.filter(item => item.selected).reduce((sum, item) => sum + item.size, 0),
                                total: folder.totalSize
                              };
                              
                              return (
                                <div 
                                  key={folder.folderPath} 
                                  className="grid grid-cols-12 items-center bg-black/10 rounded p-2 gap-2 ml-6 cursor-pointer hover:bg-black/20 transition-colors border-l-2 border-purple-500/30"
                                  onClick={() => {
                                    // Toggle all items in this folder
                                    const newSelected = !folderAllSelected;
                                    setCategories(prev => prev.map(cat => {
                                      if (cat.id !== category.id) return cat;
                                      return {
                                        ...cat,
                                        items: cat.items.map(item => {
                                          const isInFolder = item.parentPath === folder.folderPath;
                                          return isInFolder ? { ...item, selected: newSelected } : item;
                                        })
                                      };
                                    }));
                                  }}
                                >
                                  {/* Left: Checkbox + Folder name (6 columns) */}
                                  <div className="col-span-6 flex items-center gap-3">
                                    <IndeterminateCheckbox
                                      checked={folderAllSelected}
                                      indeterminate={folderSomeSelected && !folderAllSelected}
                                      onCheckedChange={(checked) => {
                                        // Update all items in this folder
                                        setCategories(prev => prev.map(cat => {
                                          if (cat.id !== category.id) return cat;
                                          return {
                                            ...cat,
                                            items: cat.items.map(item => {
                                              const isInFolder = item.parentPath === folder.folderPath;
                                              return isInFolder ? { ...item, selected: checked === true } : item;
                                            })
                                          };
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                                    />
                                    <Folder className="h-3 w-3 text-purple-300" />
                                    <div className="flex-1">
                                      <span className="text-gray-300 text-xs font-medium">{folder.folderName}</span>
                                      <span className="text-gray-500 text-xs ml-2">({folder.folderPath})</span>
                                    </div>
                                  </div>
                                  
                                  {/* Center: File Count (3 columns) */}
                                  <div className="col-span-3 text-left">
                                    <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                                      {folder.items.filter(item => item.selected).length} / {folder.items.length} files
                                    </span>
                                  </div>
                                  
                                  {/* Right: Size (3 columns) */}
                                  <div className="col-span-3 text-right">
                                    <span className="text-xs text-gray-300 font-mono">
                                      {formatFileSize(folderSizes.selected)} / {formatFileSize(folderSizes.total)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Sub-categories if they exist and are expanded */}
                            {hasSubCategories && isExpanded && category.subCategories!.map(subCategory => {
                              // Find actual selected state from the main category items
                              const subCategoryItemPaths = new Set(subCategory.items.map(item => item.path));
                              const actualSubCategoryItems = category.items.filter(item => subCategoryItemPaths.has(item.path));
                              
                              const subAllSelected = actualSubCategoryItems.every(item => item.selected);
                              const subSomeSelected = actualSubCategoryItems.some(item => item.selected);
                              const subSizes = {
                                selected: actualSubCategoryItems.filter(item => item.selected).reduce((sum, item) => sum + item.size, 0),
                                total: actualSubCategoryItems.reduce((sum, item) => sum + item.size, 0)
                              };
                              
                              // Check if this is an overall category (with/without JPG) or a folder-specific one
                              const isOverallCategory = subCategory.id.endsWith('-with-jpg') || subCategory.id.endsWith('-without-jpg');
                              const isFolderCategory = subCategory.title.startsWith('📁');
                              
                              return (
                                <div 
                                  key={subCategory.id} 
                                  className={`grid grid-cols-12 items-center rounded p-2 gap-2 cursor-pointer hover:bg-black/30 transition-colors ${
                                    isOverallCategory 
                                      ? 'bg-black/20 border-l-2 border-white/20 ml-6' 
                                      : 'bg-black/10 border-l-2 border-purple-500/30 ml-10'
                                  }`}
                                  onClick={() => {
                                    // Toggle all items in this sub-category
                                    const newSelected = !subAllSelected;
                                    setCategories(prev => prev.map(cat => {
                                      if (cat.id !== category.id) return cat;
                                      return {
                                        ...cat,
                                        items: cat.items.map(item => {
                                          const isInSubCategory = subCategory.items.some(subItem => subItem.path === item.path);
                                          return isInSubCategory ? { ...item, selected: newSelected } : item;
                                        })
                                      };
                                    }));
                                  }}
                                >
                                  {/* Left: Checkbox + Title (6 columns) */}
                                  <div className="col-span-6 flex items-center gap-3">
                                    <IndeterminateCheckbox
                                      checked={subAllSelected}
                                      indeterminate={subSomeSelected && !subAllSelected}
                                      onCheckedChange={(checked) => {
                                        // Update all items in this sub-category
                                        setCategories(prev => prev.map(cat => {
                                          if (cat.id !== category.id) return cat;
                                          return {
                                            ...cat,
                                            items: cat.items.map(item => {
                                              const isInSubCategory = subCategory.items.some(subItem => subItem.path === item.path);
                                              return isInSubCategory ? { ...item, selected: checked === true } : item;
                                            })
                                          };
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                                    />
                                    <span className={subCategory.color}>{subCategory.icon}</span>
                                    <span className="text-white text-xs">
                                      {subCategory.title}
                                    </span>
                                  </div>
                                  
                                  {/* Center: File Count (3 columns) */}
                                  <div className="col-span-3 text-left">
                                    <span className="text-xs text-cyan font-medium bg-purple-500/20 px-2 py-1 rounded">
                                      {actualSubCategoryItems.filter(item => item.selected).length} / {actualSubCategoryItems.length} files
                                    </span>
                                  </div>
                                  
                                  {/* Right: Size + Magnifying Glass (3 columns) */}
                                  <div className="col-span-3 flex items-center justify-end gap-2">
                                    <span className="text-xs text-white font-mono bg-white/20 px-2 py-1 rounded">
                                      {formatFileSize(subSizes.selected)} / {formatFileSize(subSizes.total)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const element = document.getElementById(`category-${category.id}`);
                                        if (element) {
                                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                          if (!category.expanded) {
                                            toggleCategoryExpanded(category.id);
                                          }
                                        }
                                      }}
                                      className="text-purple-200 hover:text-white hover:bg-white/20 h-6 px-2"
                                      title="Inspect details"
                                    >
                                      <Search className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Detailed Categories */}
                <div className="space-y-4">
                  {categories.map(category => {
                    const allSelected = category.items.every(item => item.selected);
                    const someSelected = category.items.some(item => item.selected);
                    
                    return (
                    <Card key={category.id} id={`category-${category.id}`} className="tool-card-gradient border-white/10 overflow-hidden">
                      <Collapsible open={category.expanded} onOpenChange={() => toggleCategoryExpanded(category.id)}>
                        <CardHeader className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IndeterminateCheckbox
                                checked={allSelected}
                                indeterminate={someSelected && !allSelected}
                                onCheckedChange={(checked) => {
                                  selectAllInCategory(category.id, checked === true);
                                }}
                                className="data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                              />
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                  <span className={category.color}>{category.icon}</span>
                                  <div>
                                    <CardTitle className="text-white text-base">{category.title}</CardTitle>
                                    <CardDescription className="text-xs">{category.description}</CardDescription>
                                  </div>
                                  {category.expanded ? (
                                    <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                                  )}
                                </div>
                              </CollapsibleTrigger>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Category size - selected / total */}
                              <span className="text-xs text-cyan font-mono">
                                {(() => {
                                  const sizes = getCategorySize(category.items);
                                  return `${formatFileSize(sizes.selected)} / ${formatFileSize(sizes.total)}`;
                                })()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {category.items.filter(i => i.selected).length}/{category.items.length}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CollapsibleContent>
                          <CardContent className="p-0 border-t border-white/10">
                            {/* Show sub-categories if they exist */}
                            {category.subCategories && category.subCategories.length > 0 ? (
                              <div className="space-y-4 p-4">
                                {category.subCategories.map(subCategory => {
                                  const isSubCategoryExpanded = expandedSubCategories.has(subCategory.id);
                                  
                                  return (
                                    <div key={subCategory.id} className="bg-black/30 rounded-lg overflow-hidden">
                                      {/* Sub-category header */}
                                      <div className="flex items-center justify-between px-4 py-3 bg-black/20">
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={() => {
                                              setExpandedSubCategories(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(subCategory.id)) {
                                                  newSet.delete(subCategory.id);
                                                } else {
                                                  newSet.add(subCategory.id);
                                                }
                                                return newSet;
                                              });
                                            }}
                                            className="h-4 w-4 p-0 text-gray-400 hover:text-white transition-colors"
                                          >
                                            {isSubCategoryExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          </button>
                                          <IndeterminateCheckbox
                                          checked={(() => {
                                            const subCategoryPaths = new Set(subCategory.items.map(item => item.path));
                                            const actualSubItems = category.items.filter(item => subCategoryPaths.has(item.path));
                                            return actualSubItems.every(item => item.selected);
                                          })()}
                                          indeterminate={(() => {
                                            const subCategoryPaths = new Set(subCategory.items.map(item => item.path));
                                            const actualSubItems = category.items.filter(item => subCategoryPaths.has(item.path));
                                            return actualSubItems.some(item => item.selected) && !actualSubItems.every(item => item.selected);
                                          })()}
                                          onCheckedChange={(checked) => {
                                            // Update all items in this sub-category
                                            setCategories(prev => prev.map(cat => {
                                              if (cat.id !== category.id) return cat;
                                              return {
                                                ...cat,
                                                items: cat.items.map(item => {
                                                  const isInSubCategory = subCategory.items.some(subItem => subItem.path === item.path);
                                                  return isInSubCategory ? { ...item, selected: checked === true } : item;
                                                })
                                              };
                                            }));
                                          }}
                                          className="data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                                        />
                                        <span className={subCategory.color}>{subCategory.icon}</span>
                                        <div>
                                          <div className="text-white text-sm font-medium">{subCategory.title}</div>
                                          <div className="text-xs text-gray-400">{subCategory.description}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-cyan font-mono">
                                          {(() => {
                                            const subCategoryPaths = new Set(subCategory.items.map(item => item.path));
                                            const actualSubItems = category.items.filter(item => subCategoryPaths.has(item.path));
                                            const totalSize = actualSubItems.reduce((sum, item) => sum + item.size, 0);
                                            const selectedSize = actualSubItems
                                              .filter(item => item.selected)
                                              .reduce((sum, item) => sum + item.size, 0);
                                            return `${formatFileSize(selectedSize)} / ${formatFileSize(totalSize)}`;
                                          })()}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {(() => {
                                            const subCategoryPaths = new Set(subCategory.items.map(item => item.path));
                                            const actualSubItems = category.items.filter(item => subCategoryPaths.has(item.path));
                                            return `${actualSubItems.filter(i => i.selected).length}/${actualSubItems.length}`;
                                          })()}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    {/* Sub-category items - only show when expanded */}
                                    {isSubCategoryExpanded && (
                                      <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                                      {subCategory.items.map((item, index) => {
                                        const itemIndex = category.items.findIndex(catItem => catItem.path === item.path);
                                        const actualItem = category.items[itemIndex];
                                        return (
                                          <div
                                            key={`${item.path}-${index}`}
                                            className={`flex items-center gap-3 px-6 py-2 hover:bg-white/5 ${
                                              'matchStrength' in item && item.matchStrength === 'weak'
                                                ? 'bg-amber-500/5 border-l-2 border-amber-500'
                                                : ''
                                            }`}
                                          >
                                            <Checkbox
                                              checked={actualItem ? actualItem.selected : false}
                                              onCheckedChange={() => toggleItem(category.id, itemIndex)}
                                            />
                                            <div className="flex-1 text-xs">
                                              <div className="text-white font-mono">{item.name}</div>
                                              <div className="text-gray-400">{formatFileSize(item.size)} • {item.path}</div>
                                            </div>
                                            <div className="flex gap-1">
                                              {supportsPreview(item.name) ? (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0 flex-shrink-0"
                                                  onClick={() => loadPreview(item)}
                                                  title="Preview image"
                                                >
                                                  <ImageIcon className="h-3 w-3" />
                                                </Button>
                                              ) : (
                                                <div className="h-6 w-6" />
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 flex-shrink-0"
                                                onClick={() => revealInFinder(item.path)}
                                                title="Copy file path"
                                              >
                                                <Folder className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      </div>
                                    )}
                                  </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <>
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

                                {/* Items list - now grouped by folder */}
                                <div className="max-h-80 overflow-y-auto">
                                  {category.folderGroups && category.folderGroups.length > 1 ? (
                                    // Show folder groups if there are multiple folders
                                    category.folderGroups.map(folder => {
                                      const isFolderExpanded = expandedFolders.has(`${category.id}-${folder.folderPath}`);
                                      const folderAllSelected = folder.items.every(item => item.selected);
                                      const folderSomeSelected = folder.items.some(item => item.selected);
                                      
                                      return (
                                        <div key={folder.folderPath} className="border-b border-white/5">
                                          {/* Folder header */}
                                          <div className="flex items-center gap-3 px-4 py-2 bg-black/10">
                                            <div
                                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => {
                                                setExpandedFolders(prev => {
                                                  const newSet = new Set(prev);
                                                  const key = `${category.id}-${folder.folderPath}`;
                                                  if (newSet.has(key)) {
                                                    newSet.delete(key);
                                                  } else {
                                                    newSet.add(key);
                                                  }
                                                  return newSet;
                                                });
                                              }}
                                            >
                                              {isFolderExpanded ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                                            </div>
                                            <IndeterminateCheckbox
                                              checked={folderAllSelected}
                                              indeterminate={folderSomeSelected && !folderAllSelected}
                                              onCheckedChange={(checked) => {
                                                console.log('Folder checkbox clicked:', folder.folderName, checked);
                                                // Update all items in this folder
                                                setCategories(prev => prev.map(cat => {
                                                  if (cat.id !== category.id) return cat;
                                                  return {
                                                    ...cat,
                                                    items: cat.items.map(item => {
                                                      const isInFolder = item.parentPath === folder.folderPath;
                                                      return isInFolder ? { ...item, selected: checked === true } : item;
                                                    })
                                                  };
                                                }));
                                              }}
                                              className="data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                                            />
                                            <Folder className="h-4 w-4 text-purple-400" />
                                            <div className="flex-1">
                                              <span className="text-white text-sm font-medium">{folder.folderName}</span>
                                              <span className="text-gray-500 text-xs ml-2">({folder.items.length} files)</span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">
                                              {formatFileSize(folder.totalSize)}
                                            </span>
                                          </div>
                                          
                                          {/* Folder contents when expanded */}
                                          {isFolderExpanded && (
                                            <div className="divide-y divide-white/5 ml-8">
                                              {folder.items.map((item, index) => {
                                                const itemIndex = category.items.findIndex(catItem => catItem.path === item.path);
                                                return (
                                                  <div
                                                    key={`${item.path}-${index}`}
                                                    className="flex items-center gap-3 px-4 py-2"
                                                  >
                                                    <Checkbox
                                                      checked={item.selected}
                                                      onCheckedChange={() => toggleItem(category.id, itemIndex)}
                                                      className="flex-shrink-0"
                                                    />

                                                    <div className="flex-1 min-w-0 hover:bg-white/5 rounded px-2 py-1 -mx-2 -my-1">
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-white text-sm truncate">{item.name}</span>
                                      {'matchedFiles' in item && item.matchedFiles && item.matchedFiles.length > 0 && 'matchStrength' in item && (
                                        <>
                                          {item.matchStrength === 'strong' && (
                                            <Badge variant="outline" className="text-green-500 border-green-500 px-1 py-0 text-[10px]">
                                              Same Folder
                                            </Badge>
                                          )}
                                          {item.matchStrength === 'moderate' && (
                                            <Badge variant="outline" className="text-blue-500 border-blue-500 px-1 py-0 text-[10px]">
                                              Adjacent
                                            </Badge>
                                          )}
                                          {item.matchStrength === 'weak' && (
                                            <Badge variant="outline" className="text-amber-500 border-amber-500 px-1 py-0 text-[10px]">
                                              Distant
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{item.path}</div>
                                    {'matchedFiles' in item && item.matchedFiles.length > 0 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        <details className="cursor-pointer">
                                          <summary className="hover:text-gray-400">
                                            Matched {item.matchedFiles.length} file{item.matchedFiles.length !== 1 ? 's' : ''}: {item.matchedFiles.slice(0, 2).map(f => f.name).join(', ')}{item.matchedFiles.length > 2 ? '...' : ''}
                                          </summary>
                                          <div className="mt-1 ml-2 space-y-0.5">
                                            {item.matchedFiles.map((f, idx) => (
                                              <div key={idx} className="text-xs">
                                                <span className="text-gray-400">{f.extension.toUpperCase()}:</span> {f.name}
                                                {f.parentPath !== item.parentPath && (
                                                  <span className="text-gray-500 ml-1">({f.parentPath})</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </details>
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
                                    <div className="flex gap-1">
                                      {supportsPreview(item.name) ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => loadPreview(item)}
                                          title="Preview image"
                                        >
                                          <ImageIcon className="h-3 w-3" />
                                        </Button>
                                      ) : (
                                        <div className="h-6 w-6" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => revealInFinder(item.path)}
                                        title="Copy file path"
                                      >
                                        <Folder className="h-3 w-3" />
                                      </Button>
                                    </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    // Show items directly if there's only one folder or no folder groups
                                    <div className="divide-y divide-white/5">
                                      {category.items.map((item, index) => (
                                        <div
                                          key={`${item.path}-${index}`}
                                          className="flex items-center gap-3 px-4 py-2"
                                        >
                                          <Checkbox
                                            checked={item.selected}
                                            onCheckedChange={() => toggleItem(category.id, index)}
                                            className="flex-shrink-0"
                                          />

                                          <div className="flex-1 min-w-0 hover:bg-white/5 rounded px-2 py-1 -mx-2 -my-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-white text-sm truncate">{item.name}</span>
                                              {'matchedFiles' in item && item.matchedFiles && item.matchedFiles.length > 0 && 'matchStrength' in item && (
                                                <>
                                                  {item.matchStrength === 'strong' && (
                                                    <Badge variant="outline" className="text-green-500 border-green-500 px-1 py-0 text-[10px]">
                                                      Same Folder
                                                    </Badge>
                                                  )}
                                                  {item.matchStrength === 'moderate' && (
                                                    <Badge variant="outline" className="text-blue-500 border-blue-500 px-1 py-0 text-[10px]">
                                                      Adjacent
                                                    </Badge>
                                                  )}
                                                  {item.matchStrength === 'weak' && (
                                                    <Badge variant="outline" className="text-amber-500 border-amber-500 px-1 py-0 text-[10px]">
                                                      Distant
                                                    </Badge>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{item.path}</div>
                                            {'matchedFiles' in item && item.matchedFiles.length > 0 && (
                                              <div className="text-xs text-gray-600 mt-1">
                                                <details className="cursor-pointer">
                                                  <summary className="hover:text-gray-400">
                                                    Matched {item.matchedFiles.length} file{item.matchedFiles.length !== 1 ? 's' : ''}: {item.matchedFiles.slice(0, 2).map(f => f.name).join(', ')}{item.matchedFiles.length > 2 ? '...' : ''}
                                                  </summary>
                                                  <div className="mt-1 ml-2 space-y-0.5">
                                                    {item.matchedFiles.map((f, idx) => (
                                                      <div key={idx} className="text-xs">
                                                        <span className="text-gray-400">{f.extension.toUpperCase()}:</span> {f.name}
                                                        {f.parentPath !== item.parentPath && (
                                                          <span className="text-gray-500 ml-1">({f.parentPath})</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </details>
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
                                            <div className="flex gap-1">
                                              {supportsPreview(item.name) ? (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0"
                                                  onClick={() => loadPreview(item)}
                                                  title="Preview image"
                                                >
                                                  <ImageIcon className="h-3 w-3" />
                                                </Button>
                                              ) : (
                                                <div className="h-6 w-6" />
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => revealInFinder(item.path)}
                                                title="Copy file path"
                                              >
                                                <Folder className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty state - only show after scan is completed */}
            {directoryHandle && categories.length === 0 && !isScanning && isCompleted && (
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
                  // Find the category and item index by path
                  const categoryWithItem = categories.find(c => 
                    c.items.some(item => item.path === previewFile.path)
                  );
                  const itemIndex = categoryWithItem?.items.findIndex(item => item.path === previewFile.path) ?? -1;
                  
                  if (categoryWithItem && itemIndex !== -1) {
                    toggleItem(categoryWithItem.id, itemIndex);
                  }
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
