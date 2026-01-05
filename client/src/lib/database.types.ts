export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      images: {
        Row: {
          id: string
          filename: string
          storage_path: string
          shoot_id: string
          upload_order: number
          sequence: number
          featured_image: boolean
          classification: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filename: string
          storage_path: string
          shoot_id: string
          upload_order?: number
          sequence?: number
          featured_image?: boolean
          classification?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filename?: string
          storage_path?: string
          shoot_id?: string
          upload_order?: number
          sequence?: number
          featured_image?: boolean
          classification?: string
          created_at?: string
          updated_at?: string
        }
      }
      shoots: {
        Row: {
          id: string
          title: string
          description: string | null
          client_id: string
          custom_slug: string | null
          banner_image_id: string | null
          is_private: boolean
          group_name: string | null
          view_count: number
          media_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          clientId: string
          customSlug?: string | null
          bannerImageId?: string | null
          isPrivate?: boolean
          groupName?: string | null
          viewCount?: number
          media_type?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          clientId?: string
          customSlug?: string | null
          bannerImageId?: string | null
          isPrivate?: boolean
          groupName?: string | null
          viewCount?: number
          media_type?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      site_gradients: {
        Row: {
          id: string
          sectionKey: string
          color1: string
          color2: string | null
          color3: string | null
          textColor: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          sectionKey: string
          color1: string
          color2?: string | null
          color3?: string | null
          textColor?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          sectionKey?: string
          color1?: string
          color2?: string | null
          color3?: string | null
          textColor?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: Json
          excerpt: string | null
          status: string
          category_id: string | null
          author_id: string | null
          featured_image: string | null
          post_image_1: string | null
          post_image_2: string | null
          featured_section: Json | null
          variable_content: string | null
          cover_image: string | null
          cover_image_alt: string | null
          meta_title: string | null
          meta_description: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: Json
          excerpt?: string | null
          status?: string
          category_id?: string | null
          author_id?: string | null
          featured_image?: string | null
          post_image_1?: string | null
          post_image_2?: string | null
          featured_section?: Json | null
          variable_content?: string | null
          cover_image?: string | null
          cover_image_alt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: Json
          excerpt?: string | null
          status?: string
          category_id?: string | null
          author_id?: string | null
          featured_image?: string | null
          post_image_1?: string | null
          post_image_2?: string | null
          featured_section?: Json | null
          variable_content?: string | null
          cover_image?: string | null
          cover_image_alt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          slug: string
          email: string | null
          phone: string | null
          address: string | null
          secondary_email: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          email?: string | null
          phone?: string | null
          address?: string | null
          secondary_email?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          secondary_email?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          filename: string
          storage_path: string
          shoot_id: string
          upload_order: number
          sequence: number
          featured_video: boolean
          classification: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filename: string
          storage_path: string
          shoot_id: string
          upload_order?: number
          sequence?: number
          featured_video?: boolean
          classification?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filename?: string
          storage_path?: string
          shoot_id?: string
          upload_order?: number
          sequence?: number
          featured_video?: boolean
          classification?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          profile_image_url: string | null
          banner_image_url: string | null
          theme_preference: string | null
          subscription_tier: string | null
          subscription_expires_at: string | null
          email_verified_at: string | null
          email_verification_token: string | null
          email_verification_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: string
          profile_image_url?: string | null
          banner_image_url?: string | null
          theme_preference?: string | null
          subscription_tier?: string | null
          subscription_expires_at?: string | null
          email_verified_at?: string | null
          email_verification_token?: string | null
          email_verification_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          profile_image_url?: string | null
          banner_image_url?: string | null
          theme_preference?: string | null
          subscription_tier?: string | null
          subscription_expires_at?: string | null
          email_verified_at?: string | null
          email_verification_token?: string | null
          email_verification_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}