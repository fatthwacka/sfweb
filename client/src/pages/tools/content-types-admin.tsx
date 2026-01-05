/**
 * Content Types Admin Dashboard
 * Simple management interface for content type definitions
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { GradientBackground } from '@/components/common/gradient-background';

interface ContentType {
  id: string;
  type_key: string;
  label: string;
  description: string;
  word_limit: number | null;
  character_limit: number | null;
  guidelines: string;
  system_prompt: string;
  is_active: boolean;
  sort_order: number;
}

export default function ContentTypesAdmin() {
  const [, navigate] = useLocation();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);

  // Load content types
  useEffect(() => {
    loadContentTypes();
  }, []);

  const loadContentTypes = async () => {
    try {
      const response = await fetch('/api/content-types/admin/all');
      if (response.ok) {
        const data = await response.json();
        setContentTypes(data.contentTypes || []);
      } else {
        throw new Error('Failed to load content types');
      }
    } catch (error) {
      console.error('Error loading content types:', error);
      toast({
        title: 'Load Error',
        description: 'Failed to load content types.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveContentType = async (contentType: ContentType) => {
    setIsSaving(true);
    try {
      const isNew = !contentType.id;
      const url = isNew ? '/api/content-types' : `/api/content-types/${contentType.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentType)
      });

      if (response.ok) {
        await loadContentTypes();
        setEditingType(null);
        toast({
          title: 'Saved',
          description: `Content type ${isNew ? 'created' : 'updated'} successfully.`,
        });
      } else {
        throw new Error('Failed to save content type');
      }
    } catch (error) {
      console.error('Error saving content type:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save content type.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const createContentType = async () => {
    const newType: Partial<ContentType> = {
      type_key: '',
      label: '',
      description: '',
      word_limit: null,
      character_limit: null,
      guidelines: '',
      system_prompt: '',
      is_active: true,
      sort_order: Math.max(...contentTypes.map(t => t.sort_order), 0) + 1
    };
    
    setEditingType(newType as ContentType);
  };

  if (isLoading) {
    return (
      <GradientBackground section="portfolio">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-salmon" />
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground section="portfolio">
      <div className="min-h-screen">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-32 pb-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
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
              <h1 className="text-4xl font-bold text-salmon mb-4">Content Types Admin</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                Manage prompt enhancement guidelines for each content type
              </p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Add New Button */}
            <div className="mb-6 flex justify-end">
              <Button onClick={createContentType} className="btn-cyan">
                <Plus className="h-4 w-4 mr-2" />
                Add Content Type
              </Button>
            </div>

            {/* Content Types Grid */}
            <div className="grid gap-6">
              {contentTypes.map((contentType) => (
                <div 
                  key={contentType.id} 
                  className="p-6 bg-gray-700 border border-gray-600 rounded-lg"
                >
                  {editingType?.id === contentType.id ? (
                    <ContentTypeEditor 
                      contentType={editingType}
                      onChange={setEditingType}
                      onSave={() => saveContentType(editingType)}
                      onCancel={() => setEditingType(null)}
                      isSaving={isSaving}
                    />
                  ) : (
                    <ContentTypeDisplay 
                      contentType={contentType}
                      onEdit={() => setEditingType(contentType)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* New Content Type Editor */}
            {editingType && !editingType.id && (
              <div className="mt-6 p-6 bg-gray-700 border border-gray-600 rounded-lg">
                <h3 className="text-lg font-semibold text-salmon mb-4">New Content Type</h3>
                <ContentTypeEditor 
                  contentType={editingType}
                  onChange={setEditingType}
                  onSave={() => saveContentType(editingType)}
                  onCancel={() => setEditingType(null)}
                  isSaving={isSaving}
                  isNew={true}
                />
              </div>
            )}
          </div>
        </div>

        <Footer />
        <Toaster />
      </div>
    </GradientBackground>
  );
}

interface ContentTypeDisplayProps {
  contentType: ContentType;
  onEdit: () => void;
}

function ContentTypeDisplay({ contentType, onEdit }: ContentTypeDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-salmon">{contentType.label}</h3>
          <p className="text-sm text-gray-400">Key: {contentType.type_key}</p>
        </div>
        <Button onClick={onEdit} variant="outline" size="sm">
          Edit
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-300">{contentType.description}</p>
          <div className="mt-2 text-xs text-gray-400">
            {contentType.word_limit && `Word limit: ${contentType.word_limit}`}
            {contentType.character_limit && `Character limit: ${contentType.character_limit}`}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium">Guidelines:</p>
          <p className="text-sm text-gray-300 line-clamp-2">{contentType.guidelines}</p>
        </div>
      </div>
    </div>
  );
}

interface ContentTypeEditorProps {
  contentType: ContentType;
  onChange: (contentType: ContentType) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isNew?: boolean;
}

function ContentTypeEditor({ contentType, onChange, onSave, onCancel, isSaving, isNew }: ContentTypeEditorProps) {
  const updateField = (field: keyof ContentType, value: any) => {
    onChange({ ...contentType, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Type Key</Label>
          <Input
            value={contentType.type_key}
            onChange={(e) => updateField('type_key', e.target.value)}
            placeholder="e.g., image"
            disabled={!isNew}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">Label</Label>
          <Input
            value={contentType.label}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="e.g., Image Generation"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Description</Label>
        <Input
          value={contentType.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of this content type"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Word Limit</Label>
          <Input
            type="number"
            value={contentType.word_limit || ''}
            onChange={(e) => updateField('word_limit', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Optional word limit"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">Character Limit</Label>
          <Input
            type="number"
            value={contentType.character_limit || ''}
            onChange={(e) => updateField('character_limit', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Optional character limit"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Guidelines</Label>
        <Textarea
          value={contentType.guidelines || ''}
          onChange={(e) => updateField('guidelines', e.target.value)}
          placeholder="Guidelines for this content type..."
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">System Prompt</Label>
        <Textarea
          value={contentType.system_prompt || ''}
          onChange={(e) => updateField('system_prompt', e.target.value)}
          placeholder="System prompt for AI enhancement..."
          className="min-h-[120px]"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="outline" disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={onSave} className="btn-cyan" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}