import { supabase } from './supabase';
import type { Database } from './database.types';

// Helper types
type Client = Database['public']['Tables']['clients']['Row'];
type Shoot = Database['public']['Tables']['shoots']['Row'];
type Image = Database['public']['Tables']['images']['Row'];
type Video = Database['public']['Tables']['videos']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
type BlogCategory = Database['public']['Tables']['blog_categories']['Row'];
type User = Database['public']['Tables']['profiles']['Row'];

// Client Operations
export const clientOperations = {
  getAll: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
    return data || [];
  },

  getById: async (id: string): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch client: ${error.message}`);
    }
    return data;
  },

  getByEmail: async (email: string): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch client: ${error.message}`);
    }
    return data;
  },

  create: async (clientData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    secondaryEmail?: string;
  }): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: clientData.name,
        slug: clientData.name.toLowerCase().replace(/\s+/g, '-'),
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
        secondary_email: clientData.secondaryEmail || null,
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create client: ${error.message}`);
    return data;
  },

  update: async (id: string, updates: Partial<Client>): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update client: ${error.message}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete client: ${error.message}`);
  },

  deleteByEmail: async (email: string): Promise<void> => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('email', email);
    
    if (error) throw new Error(`Failed to delete client: ${error.message}`);
  }
};

// Shoot Operations
export const shootOperations = {
  getAll: async (): Promise<Shoot[]> => {
    const { data, error } = await supabase
      .from('shoots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch shoots: ${error.message}`);
    return data || [];
  },

  getById: async (id: string): Promise<Shoot | null> => {
    const { data, error } = await supabase
      .from('shoots')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch shoot: ${error.message}`);
    }
    return data;
  },

  create: async (shootData: {
    title: string;
    description?: string;
    clientId: string;
    customSlug?: string;
    isPrivate?: boolean;
    groupName?: string;
    mediaType?: string;
  }): Promise<Shoot> => {
    const { data, error } = await supabase
      .from('shoots')
      .insert([{
        title: shootData.title,
        description: shootData.description || null,
        client_id: shootData.clientId,
        custom_slug: shootData.customSlug || null,
        is_private: shootData.isPrivate || false,
        group_name: shootData.groupName || null,
        media_type: shootData.mediaType || 'photo',
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create shoot: ${error.message}`);
    return data;
  },

  update: async (id: string, updates: Partial<{
    title: string;
    description: string | null;
    client_id: string;
    custom_slug: string | null;
    is_private: boolean;
    group_name: string | null;
    banner_image_id: string | null;
    gallery_settings: any;
    imageSequences: Record<string, number>;
    videoSequences: Record<string, number>;
    media_type: string | null;
  }>): Promise<Shoot> => {
    const { data, error } = await supabase
      .from('shoots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update shoot: ${error.message}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('shoots')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete shoot: ${error.message}`);
  }
};

// Image Operations
export const imageOperations = {
  getAll: async (): Promise<Image[]> => {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch images: ${error.message}`);
    return data || [];
  },

  getFeatured: async (): Promise<Image[]> => {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('featured_image', true)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch featured images: ${error.message}`);
    return data || [];
  },

  getByShoot: async (shootId: string): Promise<Image[]> => {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('shoot_id', shootId)  // Use snake_case shoot_id to match database schema
      .order('sequence', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch images for shoot: ${error.message}`);
    
    // Convert snake_case fields to camelCase for TypeScript interface compatibility
    const convertedData = data?.map((image: any) => ({
      ...image,
      shootId: image.shoot_id,
      storagePath: image.storage_path,
      originalName: image.original_name,
      fileSize: image.file_size,
      isPrivate: image.is_private,
      uploadOrder: image.upload_order,
      downloadCount: image.download_count,
      heartsCount: image.hearts_count,
      likesCount: image.likes_count,
      dislikesCount: image.dislikes_count,
      lastInteractionAt: image.last_interaction_at,
      featuredImage: image.featured_image,
      createdAt: image.created_at,
      updatedAt: image.updated_at
    })) || [];
    
    return convertedData;
  },

  updateFeaturedStatus: async (ids: string[], featured: boolean): Promise<void> => {
    const { error } = await supabase
      .from('images')
      .update({ featured_image: featured })
      .in('id', ids);
    
    if (error) throw new Error(`Failed to update featured status: ${error.message}`);
  },

  updateClassification: async (ids: string[], classification: string): Promise<void> => {
    const { error } = await supabase
      .from('images')
      .update({ classification })
      .in('id', ids);
    
    if (error) throw new Error(`Failed to update classification: ${error.message}`);
  },

  updateShootId: async (ids: string[], newShootId: string | null): Promise<void> => {
    const { error } = await supabase
      .from('images')
      .update({ shoot_id: newShootId })
      .in('id', ids);
    
    if (error) throw new Error(`Failed to update image album assignment: ${error.message}`);
  },

  delete: async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from('images')
      .delete()
      .in('id', ids);
    
    if (error) throw new Error(`Failed to delete images: ${error.message}`);
  },

  // Upload images via Express API (hybrid approach)
  upload: async (files: File[], shootId: string): Promise<any> => {
    const formData = new FormData();
    formData.append('shootId', shootId);
    
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  checkConflicts: async (shootId: string, filenames: string[]): Promise<{ conflicts: any[]; safe: string[] }> => {
    // Get existing images for this shoot
    const existingImages = await imageOperations.getByShoot(shootId);
    const existingFilenames = existingImages.map(img => img.filename);
    
    const conflicts: any[] = [];
    const safe: string[] = [];
    
    filenames.forEach(filename => {
      if (existingFilenames.includes(filename)) {
        const existingImage = existingImages.find(img => img.filename === filename);
        conflicts.push({
          filename,
          existingImage: {
            id: existingImage?.id,
            size: existingImage?.fileSize || 0,
            createdAt: existingImage?.createdAt,
            sequence: existingImage?.sequence,
            storagePath: existingImage?.storagePath
          },
          newFileSize: 0 // This will be set by the upload component
        });
      } else {
        safe.push(filename);
      }
    });
    
    return { conflicts, safe };
  },

  uploadSingle: async (file: File, shootId: string): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('shootId', shootId);

    const response = await fetch('/api/images/batch-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
};

// Video Operations
export const videoOperations = {
  getAll: async (): Promise<Video[]> => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
    return data || [];
  },

  getByShoot: async (shootId: string): Promise<Video[]> => {
    console.log(`🎬 supabaseOperations.videos.getByShoot: Starting query for shoot ${shootId}`);
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('shoot_id', shootId)  // Use snake_case shoot_id to match database schema
      .order('sequence', { ascending: true });
    
    console.log(`🎬 supabaseOperations.videos.getByShoot: Query completed`, { data: data?.length, error });
    if (error) {
      console.error(`🎬 supabaseOperations.videos.getByShoot: Error:`, error);
      throw new Error(`Failed to fetch videos for shoot: ${error.message}`);
    }

    // Convert snake_case fields to camelCase for TypeScript interface compatibility
    const convertedData = data?.map((video: any) => ({
      ...video,
      shootId: video.shoot_id,
      storagePath: video.storage_path,
      optimizedPath: video.optimized_path,
      thumbnailPath: video.thumbnail_path,
      fileSize: video.file_size,
      downloadCount: video.download_count,
      featuredVideo: video.featured_video,
      createdAt: video.created_at,
      updatedAt: video.updated_at
    })) || [];
    
    console.log(`🎬 supabaseOperations.videos.getByShoot: Returning ${convertedData.length} videos with camelCase conversion`);
    return convertedData;
  },

  updateFeaturedStatus: async (ids: string[], featured: boolean): Promise<void> => {
    const { error } = await supabase
      .from('videos')
      .update({ featured_video: featured })
      .in('id', ids);
    
    if (error) throw new Error(`Failed to update featured status: ${error.message}`);
  },

  updateClassification: async (ids: string[], classification: string): Promise<void> => {
    const { error } = await supabase
      .from('videos')
      .update({ classification })
      .in('id', ids);
    
    if (error) throw new Error(`Failed to update classification: ${error.message}`);
  },

  delete: async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from('videos')
      .delete()
      .in('id', ids);
    
    if (error) throw new Error(`Failed to delete videos: ${error.message}`);
  },

  // Upload videos via Express API (hybrid approach)
  upload: async (files: File[], shootId: string): Promise<any> => {
    const formData = new FormData();
    formData.append('shootId', shootId);
    
    files.forEach((file) => {
      formData.append('videos', file);
    });

    const response = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  checkConflicts: async (shootId: string, filenames: string[]): Promise<{ conflicts: any[]; safe: string[] }> => {
    // Get existing videos for this shoot
    const existingVideos = await videoOperations.getByShoot(shootId);
    const existingFilenames = existingVideos.map(video => video.filename);
    
    const conflicts: any[] = [];
    const safe: string[] = [];
    
    filenames.forEach(filename => {
      if (existingFilenames.includes(filename)) {
        const existingVideo = existingVideos.find(video => video.filename === filename);
        conflicts.push({
          filename,
          existingVideo: {
            id: existingVideo?.id,
            size: existingVideo?.fileSize || 0,
            createdAt: existingVideo?.createdAt,
            sequence: existingVideo?.sequence,
            storagePath: existingVideo?.storagePath,
            duration: existingVideo?.duration
          }
        });
      } else {
        safe.push(filename);
      }
    });
    
    return { conflicts, safe };
  }
};

// Profile/User Operations
export const profileOperations = {
  getAll: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
    return data || [];
  },

  create: async (profileData: {
    email: string;
    fullName?: string;
    role?: string;
  }): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        email: profileData.email,
        full_name: profileData.fullName || null,
        role: profileData.role || 'user',
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create profile: ${error.message}`);
    return data;
  },

  update: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete profile: ${error.message}`);
  }
};

// Blog Operations
export const blogOperations = {
  // Blog Posts
  posts: {
    getAll: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(`Failed to fetch blog posts: ${error.message}`);
      return data || [];
    },

    getBySlug: async (slug: string): Promise<BlogPost | null> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Failed to fetch blog post: ${error.message}`);
      }
      return data;
    },

    create: async (postData: {
      title: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      cover_image?: string;
      category_id?: string;
      status?: string;
      published_at?: string;
      author_id?: string;
    }): Promise<BlogPost> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([{
          title: postData.title,
          slug: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-'),
          content: postData.content || '',
          excerpt: postData.excerpt || '',
          cover_image: postData.cover_image || null,
          category_id: postData.category_id || null,
          status: postData.status || 'draft',
          published_at: postData.published_at || null,
          author_id: postData.author_id || null,
        }])
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create blog post: ${error.message}`);
      return data;
    },

    update: async (id: string, updates: Partial<BlogPost>): Promise<BlogPost> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update blog post: ${error.message}`);
      return data;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete blog post: ${error.message}`);
    },

    search: async (query: string, limit: number = 100): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .or(`title.ilike.%${query}%,slug.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit);
      
      if (error) throw new Error(`Failed to search blog posts: ${error.message}`);
      return data || [];
    }
  },

  // Blog Categories  
  categories: {
    getAll: async (): Promise<BlogCategory[]> => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw new Error(`Failed to fetch blog categories: ${error.message}`);
      return data || [];
    },

    create: async (categoryData: {
      name: string;
      slug?: string;
      description?: string;
    }): Promise<BlogCategory> => {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert([{
          name: categoryData.name,
          slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: categoryData.description || null,
        }])
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create blog category: ${error.message}`);
      return data;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete blog category: ${error.message}`);
    }
  }
};

// Helper function to get clientId from email
const getClientIdFromEmail = async (email: string): Promise<string> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to find client with email ${email}: ${error?.message || 'Not found'}`);
  }
  
  return data.id;
};

// Client Selection Operations (for preview workflow)
export const clientSelectionOperations = {
  getByShoot: async (shootId: string) => {
    const { data, error } = await supabase
      .from('client_selections')
      .select('*')
      .eq('shoot_id', shootId)  // Use snake_case shoot_id to match database schema
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch client selections: ${error.message}`);
    return data || [];
  },

  getByShootAndUser: async (shootId: string, clientId: string) => {
    const { data, error } = await supabase
      .from('client_selections')
      .select('*')
      .eq('shoot_id', shootId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch client selections: ${error.message}`);
    
    // Convert snake_case fields to camelCase for interface compatibility
    const convertedData = data?.map((selection: any) => ({
      ...selection,
      shootId: selection.shoot_id,
      clientId: selection.client_id,
      imageFilename: selection.image_filename,
      dropboxPath: selection.dropbox_path,
      thumbnailUrl: selection.thumbnail_url,
      selectionStatus: selection.selection_status,
      isFinalSelection: selection.is_final_selection,
      selectionOrder: selection.selection_order,
      selectedAt: selection.selected_at,
      editingComplete: selection.editing_complete,
      editingCompletedAt: selection.editing_completed_at,
      createdAt: selection.created_at,
      updatedAt: selection.updated_at
    })) || [];
    
    return { selections: convertedData };
  },

  updateSelection: async (shootId: string, imageFilename: string, action: string, clientId: string) => {
    // First check if selection exists
    const { data: existing } = await supabase
      .from('client_selections')
      .select('id')
      .eq('shoot_id', shootId)
      .eq('image_filename', imageFilename)
      .eq('client_id', clientId)
      .single();

    if (existing) {
      // Update existing selection
      const { data, error } = await supabase
        .from('client_selections')
        .update({ 
          selection_status: action,
          is_final_selection: action === 'favorite',
          selected_at: action !== 'none' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update selection: ${error.message}`);
      return data;
    } else {
      // Create new selection
      const { data, error } = await supabase
        .from('client_selections')
        .insert([{
          shoot_id: shootId,
          client_id: clientId,
          image_filename: imageFilename,
          selection_status: action,
          is_final_selection: action === 'favorite',
          selected_at: action !== 'none' ? new Date().toISOString() : null
        }])
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create selection: ${error.message}`);
      return data;
    }
  },

  clearAllSelections: async (shootId: string, clientId: string) => {
    const { error } = await supabase
      .from('client_selections')
      .delete()
      .eq('shoot_id', shootId)
      .eq('client_id', clientId);
    
    if (error) throw new Error(`Failed to clear selections: ${error.message}`);
  },

  // Convenience methods that accept email and handle clientId conversion
  getByShootAndEmail: async (shootId: string, userEmail: string) => {
    const clientId = await getClientIdFromEmail(userEmail);
    return clientSelectionOperations.getByShootAndUser(shootId, clientId);
  },

  updateSelectionByEmail: async (shootId: string, imageFilename: string, action: string, userEmail: string) => {
    const clientId = await getClientIdFromEmail(userEmail);
    return clientSelectionOperations.updateSelection(shootId, imageFilename, action, clientId);
  },

  clearAllSelectionsByEmail: async (shootId: string, userEmail: string) => {
    const clientId = await getClientIdFromEmail(userEmail);
    return clientSelectionOperations.clearAllSelections(shootId, clientId);
  },

  updateEditingStatus: async (selectionId: string, editingComplete: boolean) => {
    const { data, error } = await supabase
      .from('client_selections')
      .update({ 
        editing_complete: editingComplete,
        editing_completed_at: editingComplete ? new Date().toISOString() : null 
      })
      .eq('id', selectionId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update editing status: ${error.message}`);
    return data;
  }
};

// Preview Settings Operations (using shoot_previews table)
export const previewSettingsOperations = {
  getByShoot: async (shootId: string) => {
    const { data, error } = await supabase
      .from('shoot_previews')
      .select('*')
      .eq('shoot_id', shootId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch preview settings: ${error.message}`);
    }
    
    // Convert snake_case fields to camelCase for interface compatibility
    if (data) {
      return {
        id: data.id,
        shootId: data.shoot_id,
        dropboxFolderPath: data.dropbox_folder_path,
        dropboxShareLink: data.dropbox_share_link,
        selectionLimit: data.selection_limit,
        additionalBundle5Price: data.additional_bundle_5_price,
        additionalBundle10Price: data.additional_bundle_10_price,
        unlimitedBundlePrice: data.unlimited_bundle_price,
        isActive: data.is_active,
        submissionCompleted: data.submission_completed,
        submissionCompletedAt: data.submission_completed_at,
        submissionCompletedBy: data.submission_completed_by,
        editingCompleted: data.editing_completed,
        editingCompletedAt: data.editing_completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    return null;
  },

  create: async (settingsData: any) => {
    const { data, error } = await supabase
      .from('shoot_previews')
      .insert([{
        shoot_id: settingsData.shootId,
        dropbox_folder_path: settingsData.dropboxFolderPath || null,
        dropbox_share_link: settingsData.dropboxShareLink || null,
        selection_limit: settingsData.selectionLimit || 20,
        additional_bundle_5_price: settingsData.additionalBundle5Price || '150.00',
        additional_bundle_10_price: settingsData.additionalBundle10Price || '250.00',
        unlimited_bundle_price: settingsData.unlimitedBundlePrice || '500.00',
        is_active: settingsData.isActive !== undefined ? settingsData.isActive : true,
        submission_completed: settingsData.submissionCompleted || false,
        submission_completed_at: settingsData.submissionCompletedAt || null,
        submission_completed_by: settingsData.submissionCompletedBy || null,
        editing_completed: settingsData.editingCompleted || false,
        editing_completed_at: settingsData.editingCompletedAt || null
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create preview settings: ${error.message}`);
    return data;
  },

  update: async (id: string, updates: any) => {
    // Convert camelCase updates to snake_case for database
    const dbUpdates: any = {};
    if (updates.shootId !== undefined) dbUpdates.shoot_id = updates.shootId;
    if (updates.dropboxFolderPath !== undefined) dbUpdates.dropbox_folder_path = updates.dropboxFolderPath;
    if (updates.dropboxShareLink !== undefined) dbUpdates.dropbox_share_link = updates.dropboxShareLink;
    if (updates.selectionLimit !== undefined) dbUpdates.selection_limit = updates.selectionLimit;
    if (updates.additionalBundle5Price !== undefined) dbUpdates.additional_bundle_5_price = updates.additionalBundle5Price;
    if (updates.additionalBundle10Price !== undefined) dbUpdates.additional_bundle_10_price = updates.additionalBundle10Price;
    if (updates.unlimitedBundlePrice !== undefined) dbUpdates.unlimited_bundle_price = updates.unlimitedBundlePrice;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.submissionCompleted !== undefined) dbUpdates.submission_completed = updates.submissionCompleted;
    if (updates.submissionCompletedAt !== undefined) dbUpdates.submission_completed_at = updates.submissionCompletedAt;
    if (updates.submissionCompletedBy !== undefined) dbUpdates.submission_completed_by = updates.submissionCompletedBy;
    if (updates.editingCompleted !== undefined) dbUpdates.editing_completed = updates.editingCompleted;
    if (updates.editingCompletedAt !== undefined) dbUpdates.editing_completed_at = updates.editingCompletedAt;
    
    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shoot_previews')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update preview settings: ${error.message}`);
    return data;
  },

  updateByShoot: async (shootId: string, updates: any) => {
    // Convert camelCase updates to snake_case for database
    const dbUpdates: any = {};
    if (updates.dropboxFolderPath !== undefined) dbUpdates.dropbox_folder_path = updates.dropboxFolderPath;
    if (updates.dropboxShareLink !== undefined) dbUpdates.dropbox_share_link = updates.dropboxShareLink;
    if (updates.selectionLimit !== undefined) dbUpdates.selection_limit = updates.selectionLimit;
    if (updates.additionalBundle5Price !== undefined) dbUpdates.additional_bundle_5_price = updates.additionalBundle5Price;
    if (updates.additionalBundle10Price !== undefined) dbUpdates.additional_bundle_10_price = updates.additionalBundle10Price;
    if (updates.unlimitedBundlePrice !== undefined) dbUpdates.unlimited_bundle_price = updates.unlimitedBundlePrice;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.submissionCompleted !== undefined) dbUpdates.submission_completed = updates.submissionCompleted;
    if (updates.submissionCompletedAt !== undefined) dbUpdates.submission_completed_at = updates.submissionCompletedAt;
    if (updates.submissionCompletedBy !== undefined) dbUpdates.submission_completed_by = updates.submissionCompletedBy;
    if (updates.editingCompleted !== undefined) dbUpdates.editing_completed = updates.editingCompleted;
    if (updates.editingCompletedAt !== undefined) dbUpdates.editing_completed_at = updates.editingCompletedAt;
    
    // Handle alternative field names for backward compatibility
    if (updates.submission_completed !== undefined) dbUpdates.submission_completed = updates.submission_completed;
    if (updates.submission_completed_at !== undefined) dbUpdates.submission_completed_at = updates.submission_completed_at;
    if (updates.submission_completed_by !== undefined) dbUpdates.submission_completed_by = updates.submission_completed_by;
    if (updates.editing_completed !== undefined) dbUpdates.editing_completed = updates.editing_completed;
    if (updates.editing_completed_at !== undefined) dbUpdates.editing_completed_at = updates.editing_completed_at;
    
    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shoot_previews')
      .update(dbUpdates)
      .eq('shoot_id', shootId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update preview settings by shoot: ${error.message}`);
    return data;
  }
};

// Preview Images Operations  
export const previewImageOperations = {
  getByShoot: async (shootId: string) => {
    const { data, error } = await supabase
      .from('preview_images')
      .select('*')
      .eq('shoot_id', shootId)  // Use snake_case shoot_id to match database schema
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch preview images: ${error.message}`);
    return { images: data || [] };
  },

  delete: async (shootId: string, filename: string) => {
    const { error } = await supabase
      .from('preview_images')
      .delete()
      .eq('shoot_id', shootId)  // Use snake_case shoot_id to match database schema
      .eq('filename', filename);
    
    if (error) throw new Error(`Failed to delete preview image: ${error.message}`);
  },

  checkConflicts: async (shootId: string, filenames: string[]): Promise<{ duplicates: string[]; safe: string[] }> => {
    // Get existing preview images for this shoot
    const { data: existingImages, error } = await supabase
      .from('preview_images')
      .select('filename')
      .eq('shoot_id', shootId);
    
    if (error) throw new Error(`Failed to fetch existing preview images: ${error.message}`);
    
    const existingFilenames = existingImages?.map(img => img.filename) || [];
    
    const duplicates: string[] = [];
    const safe: string[] = [];
    
    filenames.forEach(filename => {
      if (existingFilenames.includes(filename)) {
        duplicates.push(filename);
      } else {
        safe.push(filename);
      }
    });
    
    return { duplicates, safe };
  }
};

// User Operations (using profiles table)
export const userOperations = {
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return data || [];
  },

  getById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return data;
  },

  getByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return data;
  },

  create: async (userData: {
    id: string;
    email: string;
    full_name: string;
    role?: 'super_admin' | 'staff' | 'client' | 'user';
    subscription_tier?: 'free' | 'pro' | 'enterprise';
  }): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role || 'user',
        subscription_tier: userData.subscription_tier || 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data;
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return data;
  },

  updateRole: async (id: string, role: 'super_admin' | 'staff' | 'client' | 'user'): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user role: ${error.message}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete user: ${error.message}`);
  }
};

// Site Configuration Operations
export const siteConfigOperations = {
  get: async () => {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch site config: ${error.message}`);
    }
    return data;
  },

  updateBulk: async (configData: any) => {
    const { data, error } = await supabase
      .from('site_config')
      .upsert(configData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update site config: ${error.message}`);
    return data;
  }
};

// Portfolio Operations
export const portfolioOperations = {
  getGroups: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('shoots')
      .select('group_name')
      .not('group_name', 'is', null)
      .order('group_name');
    
    if (error) throw new Error(`Failed to fetch portfolio groups: ${error.message}`);
    
    // Extract unique group names
    const uniqueGroups = Array.from(new Set(
      data.map(item => item.group_name).filter(Boolean)
    )) as string[];
    
    return uniqueGroups;
  }
};

// Combined operations helper
export const supabaseOperations = {
  clients: clientOperations,
  shoots: shootOperations,
  images: imageOperations,
  videos: videoOperations,
  profiles: profileOperations,
  blog: blogOperations,
  clientSelections: clientSelectionOperations,
  previewSettings: previewSettingsOperations,
  previewImages: previewImageOperations,
  users: userOperations,
  siteConfig: siteConfigOperations,
  portfolio: portfolioOperations
};