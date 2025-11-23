import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BasicInfoSection, 
  AdvancedSettingsSection, 
  AddImagesSection, 
  GalleryAppearanceSection 
} from './gallery-sections';
import { PreviewSettingsCard } from './preview-settings-card';
import { GalleryRenderer } from '@/components/gallery/gallery-renderer';
import { 
  Eye, 
  Settings, 
  Upload, 
  Palette, 
  Camera,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { ImageUrl } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import type { ConflictResolution } from '@shared/schema';

interface GalleryManagementTabsProps {
  // Gallery data
  images: any[];
  clients: any[];
  editableShoot: any;
  setEditableShoot: (fn: (prev: any) => any) => void;
  gallerySettings: any;
  setGallerySettings: (fn: (prev: any) => any) => void;
  selectedCover: string | null;
  setSelectedCover: (id: string | null) => void;
  imageOrder: string[];
  
  // Event handlers
  onUploadImages: (files: File[], resolutions?: ConflictResolution[]) => void;
  onSaveAppearance: () => void;
  onViewFullRes: (storagePath: string) => void;
  onDownloadImage: (storagePath: string, filename: string) => void;
  onRemoveImage: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onReplaceImage: (imageId: string) => void;
  
  // Gallery interaction
  draggedImage: string | null;
  onDragStart: (e: React.DragEvent, imageId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetImageId: string) => void;
  onImageClick: (imageId: string) => void;
  replacingImages: Set<string>;
  isDragReorderingEnabled: boolean;
  visibleImageCount: number;
  dragStartTime: number;
  onMouseDown: () => void;
  
  // Other props
  shootId: string;
  clientReassignDialogOpen: boolean;
  setClientReassignDialogOpen: (open: boolean) => void;
  isUploading: boolean;
  saveAppearanceMutation: any;
  toast: any;
  
  // Additional props for preview functionality
  shoot?: any;
  loadMoreImages?: () => void;
}

export function GalleryManagementTabs({
  images,
  clients,
  editableShoot,
  setEditableShoot,
  gallerySettings,
  setGallerySettings,
  selectedCover,
  setSelectedCover,
  imageOrder,
  onUploadImages,
  onSaveAppearance,
  onViewFullRes,
  onDownloadImage,
  onRemoveImage,
  onDeleteImage,
  onReplaceImage,
  draggedImage,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onImageClick,
  replacingImages,
  isDragReorderingEnabled,
  visibleImageCount,
  dragStartTime,
  onMouseDown,
  shootId,
  clientReassignDialogOpen,
  setClientReassignDialogOpen,
  isUploading,
  saveAppearanceMutation,
  toast,
  shoot,
  loadMoreImages
}: GalleryManagementTabsProps) {
  const [activeTab, setActiveTab] = useState('preview');

  const getOrderedImages = () => images.slice(0, visibleImageCount);

  return (
    <Card className="admin-gradient-card">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-salmon/20">
            <TabsTrigger 
              value="preview" 
              className="flex items-center gap-2 data-[state=active]:bg-salmon data-[state=active]:text-white"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="basic" 
              className="flex items-center gap-2 data-[state=active]:bg-salmon data-[state=active]:text-white"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="flex items-center gap-2 data-[state=active]:bg-salmon data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="flex items-center gap-2 data-[state=active]:bg-salmon data-[state=active]:text-white"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="flex items-center gap-2 data-[state=active]:bg-salmon data-[state=active]:text-white"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            <PreviewSettingsCard shootId={shootId} />
          </TabsContent>

          <TabsContent value="basic" className="mt-0">
            <BasicInfoSection
              editableShoot={editableShoot}
              setEditableShoot={setEditableShoot}
              clients={clients}
              clientReassignDialogOpen={clientReassignDialogOpen}
              setClientReassignDialogOpen={setClientReassignDialogOpen}
              shootId={shootId}
              toast={toast}
              images={images}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <AdvancedSettingsSection
              editableShoot={editableShoot}
              setEditableShoot={setEditableShoot}
              shootId={shootId}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <AddImagesSection
              onUpload={onUploadImages}
              isUploading={isUploading}
              toast={toast}
              shootId={shootId}
              mediaType={shoot?.mediaType || 'photo'}
            />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <GalleryAppearanceSection
              gallerySettings={gallerySettings}
              setGallerySettings={setGallerySettings}
              selectedCover={selectedCover}
              setSelectedCover={setSelectedCover}
              imageOrder={imageOrder}
              shootId={shootId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}