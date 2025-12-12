/**
 * Bulk Mover Tool
 * Rename files AND move them to a target folder
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
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  FileText,
  MoveRight
} from 'lucide-react';
import { ProcessFlow, LoadingOverlay, type ProcessStep } from '@/components/tools/process-flow';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

// File to move interface
interface FileToMove {
  handle: FileSystemFileHandle;
  parentHandle: FileSystemDirectoryHandle;
  original: string;
  newName: string;
  path: string;
  selected: boolean;
}

// Check if File System Access API is supported
const isFileSystemAccessSupported = () => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// UTC timestamp pattern: file-2024-01-15-10-30-00-utc.jpg → file.jpg
const UTC_PATTERN = /^(.+)-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-utc(\..+)$/i;

// Process flow steps for this tool
const PROCESS_STEPS: ProcessStep[] = [
  { number: 1, title: 'Source', description: 'Select source folder' },
  { number: 2, title: 'Target', description: 'Select destination' },
  { number: 3, title: 'Scan', description: 'Find matching files' },
  { number: 4, title: 'Review', description: 'Select files to move' },
  { number: 5, title: 'Move', description: 'Transfer files' },
];

export default function BulkMover() {
  const { toast } = useToast();

  // State
  const [sourceHandle, setSourceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [targetHandle, setTargetHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [files, setFiles] = useState<FileToMove[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');

  // Calculate current step based on state
  const currentStep = useMemo(() => {
    if (files.length > 0) return 4; // Review step
    if (isScanning) return 3; // Scanning
    if (sourceHandle && targetHandle) return 3; // Ready to scan
    if (sourceHandle) return 2; // Need target
    return 1; // Select source
  }, [sourceHandle, targetHandle, isScanning, files.length]);

  // Check browser support
  const isSupported = isFileSystemAccessSupported();

  // Select source folder
  const handleSelectSource = useCallback(async () => {
    if (!window.showDirectoryPicker) return;

    try {
      const handle = await window.showDirectoryPicker();
      setSourceHandle(handle);
      setSourceName(handle.name);
      setFiles([]); // Clear previous results

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

  // Recursive scan for matching files
  const scanDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string = ''
  ): Promise<FileToMove[]> => {
    const found: FileToMove[] = [];

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const filename = entry.name;
        const match = filename.match(UTC_PATTERN);

        if (match) {
          const newName = match[1] + match[2];
          found.push({
            handle: entry as FileSystemFileHandle,
            parentHandle: dirHandle,
            original: filename,
            newName,
            path,
            selected: true,
          });
        }
      } else if (entry.kind === 'directory') {
        const subPath = path ? `${path}/${entry.name}` : entry.name;
        const subFiles = await scanDirectory(entry as FileSystemDirectoryHandle, subPath);
        found.push(...subFiles);
      }
    }

    return found;
  }, []);

  // Scan for files
  const handleScan = useCallback(async () => {
    if (!sourceHandle) {
      toast({
        title: 'No source folder selected',
        description: 'Please select a source folder first',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setFiles([]);

    try {
      const foundFiles = await scanDirectory(sourceHandle);
      setFiles(foundFiles);

      if (foundFiles.length === 0) {
        toast({
          title: 'No matching files',
          description: 'No files found with UTC timestamp pattern (-YYYY-MM-DD-HH-MM-SS-utc)',
        });
      } else {
        toast({
          title: 'Scan complete',
          description: `Found ${foundFiles.length} file${foundFiles.length !== 1 ? 's' : ''} to move`,
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
    }
  }, [sourceHandle, scanDirectory, toast]);

  // Toggle file selection
  const toggleFile = useCallback((index: number) => {
    setFiles(prev => prev.map((file, i) =>
      i === index ? { ...file, selected: !file.selected } : file
    ));
  }, []);

  // Select/deselect all
  const selectAll = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, selected: false })));
  }, []);

  // Count selected files
  const selectedCount = files.filter(f => f.selected).length;

  // Move files
  const handleMove = useCallback(async () => {
    const selectedFiles = files.filter(f => f.selected);

    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to move',
        variant: 'destructive',
      });
      return;
    }

    if (!targetHandle) {
      toast({
        title: 'No target folder selected',
        description: 'Please select a target folder first',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(false);
    setIsMoving(true);

    let successCount = 0;
    const errors: string[] = [];

    for (const file of selectedFiles) {
      try {
        // Create new file with new name in target directory
        const newFileHandle = await targetHandle.getFileHandle(file.newName, { create: true });

        // Copy content
        const originalFile = await file.handle.getFile();
        const writable = await newFileHandle.createWritable();
        await writable.write(originalFile);
        await writable.close();

        // Verify the copy
        const verifyHandle = await targetHandle.getFileHandle(file.newName);
        const verifyFile = await verifyHandle.getFile();
        if (verifyFile.size !== originalFile.size) {
          throw new Error('File copy verification failed - size mismatch');
        }

        // Remove original file from source directory
        await file.parentHandle.removeEntry(file.original);

        successCount++;
      } catch (error: any) {
        errors.push(`${file.original}: ${error.message}`);
      }
    }

    setIsMoving(false);

    if (errors.length > 0) {
      toast({
        title: 'Partial success',
        description: `Moved ${successCount} files. ${errors.length} error${errors.length !== 1 ? 's' : ''} occurred.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: `Moved and renamed ${successCount} file${successCount !== 1 ? 's' : ''}`,
      });
    }

    // Refresh the list
    if (sourceHandle) {
      const foundFiles = await scanDirectory(sourceHandle);
      setFiles(foundFiles);
    }
  }, [files, sourceHandle, targetHandle, scanDirectory, toast]);

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
                  <p className="text-sm text-gray-500">
                    Firefox and Safari don't support this API yet.
                  </p>
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
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-white text-4xl lg:text-5xl mb-4">Bulk Mover</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Rename files AND move them to a target folder. Consolidate scattered files
              from nested directories into one location.
            </p>
          </div>

          {/* Process Flow Guide */}
          <ProcessFlow
            steps={PROCESS_STEPS}
            currentStep={currentStep}
            isProcessing={isScanning}
            processingText={scanProgress}
            className="max-w-4xl mx-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8" style={{ background: 'linear-gradient(to bottom, #475569 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">

            {/* Folder Selection */}
            <Card className="bg-slate-900 border-white/10 mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                    <h3 className="text-white text-sm font-medium mb-3">Target Folder</h3>
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

                {/* Scan Button */}
                <div className="mt-6 text-center">
                  <Button
                    onClick={handleScan}
                    disabled={!sourceHandle || isScanning}
                    variant="outline"
                    size="lg"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Scan for Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <Card className="bg-slate-900 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-white">
                        {files.length} File{files.length !== 1 ? 's' : ''} Found
                      </CardTitle>
                      <CardDescription>
                        {selectedCount} selected for moving
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                        disabled={selectedCount === 0 || !targetHandle || isMoving}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        <MoveRight className="mr-2 h-4 w-4" />
                        Move Selected
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                    {files.map((file, index) => (
                      <div
                        key={`${file.path}/${file.original}`}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                      >
                        <Checkbox
                          checked={file.selected}
                          onCheckedChange={() => toggleFile(index)}
                          className="border-gray-500"
                        />

                        <div className="flex-1 min-w-0 font-mono text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-400 truncate">
                              {file.path ? `${file.path}/` : ''}{file.original}
                            </span>
                            <ArrowRight className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-cyan font-medium truncate">
                              {targetName ? `${targetName}/` : ''}{file.newName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state after scan */}
            {sourceHandle && files.length === 0 && !isScanning && (
              <Card className="bg-slate-900 border-white/10">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-white text-lg mb-2">No matching files found</h3>
                  <p className="text-gray-400 text-sm">
                    No files match the UTC timestamp pattern in this folder.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            {!sourceHandle && (
              <Card className="bg-slate-800/50 border-white/5">
                <CardContent className="p-6">
                  <h3 className="text-white font-medium mb-2">How it works</h3>
                  <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                    <li>Select a <strong>source folder</strong> containing files to move</li>
                    <li>Select a <strong>target folder</strong> where files will be consolidated</li>
                    <li>Scan to find files with UTC timestamps in their names</li>
                    <li>Files are moved to the target folder with cleaned names</li>
                  </ol>
                  <div className="mt-4 p-3 bg-black/20 rounded text-sm">
                    <span className="text-gray-400">Example:</span>
                    <code className="ml-2 text-cyan">photos/2024/image-2024-01-15-10-30-00-utc.jpg</code>
                    <span className="text-green-500 mx-2">→</span>
                    <code className="text-cyan">target/image.jpg</code>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isScanning && (
        <LoadingOverlay
          text="Scanning for files..."
          subText={scanProgress}
        />
      )}

      {/* Moving Overlay */}
      {isMoving && (
        <LoadingOverlay
          text="Moving files..."
          subText={`Transferring ${selectedCount} files to ${targetName}`}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Move</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to move {selectedCount} file{selectedCount !== 1 ? 's' : ''} to <strong className="text-cyan">{targetName}</strong>?
              <br /><br />
              Files will be renamed and the originals will be deleted from the source location.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMove}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Yes, Move Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
