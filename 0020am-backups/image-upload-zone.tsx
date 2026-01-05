import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DuplicateFilesDialog } from '../ui/duplicate-files-dialog';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FolderOpen,
  Image as ImageIcon,
  Pause,
  Play,
  RotateCcw,
  FileX
} from 'lucide-react';

interface FileUploadInfo {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  url?: string;
}

interface ImageUploadZoneProps {
  shootId: string;
  onUploadComplete?: () => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  enableOptimization?: boolean;
  maxImageWidth?: number; // for optimization
  jpegQuality?: number; // 0-1 for optimization
}

export function ImageUploadZone({ 
  shootId, 
  onUploadComplete,
  maxFileSize = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  enableOptimization = true,
  maxImageWidth = 1920,
  jpegQuality = 0.85
}: ImageUploadZoneProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileUploadInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateFilenames, setDuplicateFilenames] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<FileUploadInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadQueueRef = useRef<FileUploadInfo[]>([]);

  // Calculate overall progress
  const totalProgress = files.length > 0 
    ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length)
    : 0;

  const completedCount = files.filter(f => f.status === 'completed').length;
  const failedCount = files.filter(f => f.status === 'failed').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, [files, shootId]);

  // Optimize image before upload
  const optimizeImage = async (file: File): Promise<File> => {
    if (!enableOptimization) return file;
    
    // Skip optimization for non-JPEG/PNG files
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = document.createElement('img');
        
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxImageWidth) {
            height = (height * maxImageWidth) / width;
            width = maxImageWidth;
          }
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Return original if canvas fails
            return;
          }
          
          // Draw and resize image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file); // Return original if conversion fails
                return;
              }
              
              // Create new file from blob
              const optimizedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              
              // Only use optimized if it's smaller
              if (optimizedFile.size < file.size) {
                console.log(`✨ Optimized ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            jpegQuality
          );
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Check for duplicate filenames on the server
  const checkForDuplicates = async (filenames: string[]): Promise<string[]> => {
    try {
      const response = await apiRequest(
        'POST',
        `/api/preview-images/${shootId}/check-duplicates`,
        { filenames }
      );
      const data = await response.json();
      return data.duplicates || [];
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      // If duplicate check fails, continue without checking
      return [];
    }
  };

  // Process and validate files
  const processFiles = async (newFiles: File[]) => {
    const validFiles: FileUploadInfo[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        errors.push(`${file.name}: Invalid format (only JPG, PNG, WebP allowed)`);
        return;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max ${maxFileSize}MB)`);
        return;
      }

      // Check for duplicates in current queue
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        errors.push(`${file.name}: Already in queue`);
        return;
      }

      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        progress: 0
      });
    });

    if (errors.length > 0) {
      toast({
        title: 'Some files were skipped',
        description: errors.join('\n'),
        variant: 'destructive'
      });
    }

    if (validFiles.length > 0) {
      // Check for server-side duplicates
      const filenames = validFiles.map(f => f.file.name);
      const duplicates = await checkForDuplicates(filenames);
      
      if (duplicates.length > 0) {
        // Show duplicate confirmation dialog
        setPendingFiles(validFiles);
        setDuplicateFilenames(duplicates);
        setDuplicateDialogOpen(true);
      } else {
        // No duplicates, add files directly
        addValidFilesToQueue(validFiles);
      }
    }
  };

  // Add validated files to the upload queue
  const addValidFilesToQueue = (validFiles: FileUploadInfo[]) => {
    setFiles(prev => [...prev, ...validFiles]);
    toast({
      title: 'Files added',
      description: `${validFiles.length} files ready for upload`
    });
  };

  // Handle duplicate file overwrite confirmation
  const handleOverwriteFiles = () => {
    addValidFilesToQueue(pendingFiles);
    setPendingFiles([]);
    setDuplicateFilenames([]);
  };

  // Handle duplicate file cancellation
  const handleCancelDuplicates = () => {
    setPendingFiles([]);
    setDuplicateFilenames([]);
    toast({
      title: 'Upload cancelled',
      description: `${duplicateFilenames.length} duplicate files were not added`,
      variant: 'default'
    });
  };

  // Upload a single file
  const uploadFile = async (fileInfo: FileUploadInfo): Promise<void> => {
    try {
      // Optimize image before upload
      const fileToUpload = await optimizeImage(fileInfo.file);
      
      const formData = new FormData();
      formData.append('image', fileToUpload);
      formData.append('shootId', shootId);

      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // Simple progress simulation since fetch doesn't support upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileInfo.id && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + 10, 90);
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      // Use fetch API with proper proxy support
      const response = await fetch('/api/images/batch-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Update file status to completed
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'completed', progress: 100, url: data.url } 
          : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'failed', error: error instanceof Error ? error.message : 'Upload failed' } 
          : f
      ));
      throw error;
    }
  };

  // Process upload queue (10 at a time)
  const processUploadQueue = async () => {
    setIsUploading(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    const chunks = [];
    
    // Split into chunks of 10
    for (let i = 0; i < pendingFiles.length; i += 10) {
      chunks.push(pendingFiles.slice(i, i + 10));
    }

    // Process each chunk
    for (const chunk of chunks) {
      if (isPaused) {
        break;
      }

      // Upload chunk in parallel
      try {
        await Promise.all(
          chunk.map(fileInfo => uploadFile(fileInfo))
        );
      } catch (error) {
        // Continue with next chunk even if some files fail
        console.error('Chunk upload error:', error);
      }
    }

    setIsUploading(false);
    
    if (completedCount === files.length && onUploadComplete) {
      onUploadComplete();
      toast({
        title: 'Upload complete!',
        description: `Successfully uploaded ${completedCount} images`
      });
    }
  };

  // Start upload
  const handleStartUpload = () => {
    if (files.length === 0) return;
    setIsPaused(false);
    processUploadQueue();
  };

  // Pause upload
  const handlePauseUpload = () => {
    setIsPaused(true);
  };

  // Resume upload
  const handleResumeUpload = () => {
    setIsPaused(false);
    processUploadQueue();
  };

  // Retry failed uploads
  const handleRetryFailed = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'failed' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
    processUploadQueue();
  };

  // Remove a file
  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all files
  const handleClearAll = () => {
    if (isUploading) {
      handlePauseUpload();
    }
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        className={`border border-dashed transition-all bg-gradient-to-br from-purple-900/30 to-slate-800/40 ${
          isDragging 
            ? 'border-salmon bg-salmon/10' 
            : 'border-purple-400/30 hover:border-purple-300/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-5 text-center">
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragging ? 'text-salmon' : 'text-purple-300/70'
          }`} />
          
          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? 'Drop files here' : 'Drag & drop images here'}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse (JPG, PNG, WebP - max {maxFileSize}MB each)
          </p>
          
          {enableOptimization && (
            <p className="text-xs text-muted-foreground">
              ✨ Images will be automatically optimized (max {maxImageWidth}px width, {Math.round(jpegQuality * 100)}% quality)
            </p>
          )}
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFormats.join(',')}
            className="hidden"
            onChange={async (e) => {
              const selectedFiles = Array.from(e.target.files || []);
              await processFiles(selectedFiles);
              e.target.value = ''; // Reset input
            }}
          />
        </div>
      </Card>

      {/* Upload Progress & Stats */}
      {files.length > 0 && (
        <Card className="p-4">
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">
                <ImageIcon className="w-3 h-3 mr-1" />
                {files.length} files
              </Badge>
              
              {completedCount > 0 && (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {completedCount} completed
                </Badge>
              )}
              
              {pendingCount > 0 && (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1" />
                  {pendingCount} pending
                </Badge>
              )}
              
              {failedCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {failedCount} failed
                </Badge>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {!isUploading && pendingCount > 0 && (
                <Button
                  onClick={handleStartUpload}
                  className="bg-salmon text-white hover:bg-salmon-muted"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Start Upload
                </Button>
              )}
              
              {isUploading && !isPaused && (
                <Button
                  onClick={handlePauseUpload}
                  variant="outline"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {isUploading && isPaused && (
                <Button
                  onClick={handleResumeUpload}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              
              {failedCount > 0 && !isUploading && (
                <Button
                  onClick={handleRetryFailed}
                  variant="outline"
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Failed
                </Button>
              )}
              
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <FileX className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* File List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {files.map(fileInfo => (
                <div
                  key={fileInfo.id}
                  className={`flex items-center gap-3 p-2 rounded border ${
                    fileInfo.status === 'completed' 
                      ? 'bg-green-900/20 border-green-500/30'
                      : fileInfo.status === 'failed'
                      ? 'bg-red-900/20 border-red-500/30'
                      : fileInfo.status === 'uploading'
                      ? 'bg-blue-900/20 border-blue-500/30'
                      : 'bg-purple-900/20 border-purple-500/30'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{fileInfo.file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  {fileInfo.status === 'uploading' && (
                    <div className="w-24">
                      <Progress value={fileInfo.progress} className="h-1" />
                    </div>
                  )}
                  
                  {fileInfo.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  
                  {fileInfo.status === 'failed' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  
                  {fileInfo.status === 'pending' && (
                    <Badge variant="secondary" className="text-xs">
                      Waiting
                    </Badge>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFile(fileInfo.id)}
                    className="p-1 h-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Duplicate Files Dialog */}
      <DuplicateFilesDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        onOverwrite={handleOverwriteFiles}
        onCancel={handleCancelDuplicates}
        duplicateFilenames={duplicateFilenames}
      />
    </div>
  );
}