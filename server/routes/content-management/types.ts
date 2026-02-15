// ============================================================================
// CONTENT MANAGEMENT SYSTEM - SHARED TYPES
// TypeScript definitions for all content management API endpoints
// ============================================================================

// Base client information
export interface ContentClient {
  id: string;
  name: string;
  slug: string;
  email?: string;
  website_url?: string;
  industry?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Brand profile with versioning
export interface ClientBrandProfile {
  id: string;
  client_id: string;
  version: number;
  is_active: boolean;
  
  // Brand voice & messaging
  brand_description?: string;
  industry_segment?: string;
  products_services?: string;
  voice_tone?: Record<string, any>;
  voice_rules?: VoiceRules;
  key_messages?: string[];
  forbidden_phrases?: string[];
  preferred_terminology?: Record<string, string>;
  
  // NEW: Fields for prompt enhancer compatibility
  business_niche?: string;
  color_personality?: string;
  visual_mood?: string;
  target_audience?: string;
  priority_benefits?: string[];
  secondary_benefits?: string[];
  positive_examples?: string[];
  prohibited_terms?: string[];
  
  // NEW: Content Guidelines fields
  language?: string;
  region?: string;
  spelling?: string;
  
  // Visual identity
  primary_color?: string;
  secondary_colors?: string[];
  logo_url?: string;
  visual_style_notes?: string;
  visual_rules?: VisualRules;
  
  // Content guidelines
  content_themes?: string[];
  target_audience_description?: string;
  content_length_preferences?: Record<string, string>;
  platform_rules?: PlatformRules;
  
  // Performance intelligence
  top_performing_content_types?: string[];
  successful_hooks?: string[];
  content_to_avoid?: string[];
  approved_examples?: string[];
  negative_examples?: string[];
  
  // Metadata
  created_by?: string;
  created_at: string;
  notes?: string;
}

// Voice rules structure
export interface VoiceRules {
  tone?: string; // 'professional, approachable'
  sentence_length?: 'short' | 'medium' | 'long' | 'varied';
  humor?: 'none' | 'minimal' | 'moderate' | 'frequent';
  profanity?: 'none' | 'mild' | 'moderate';
  formality?: 'casual' | 'professional' | 'formal';
  energy?: 'low' | 'medium' | 'high';
  perspective?: 'first_person' | 'third_person' | 'brand_voice';
  technical_level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

// Visual rules structure
export interface VisualRules {
  primary_color?: string;
  style?: string; // 'modern, clean'
  imagery?: string; // 'professional, high-quality'
  mood?: 'bright' | 'dark' | 'neutral' | 'vibrant';
  composition?: 'minimal' | 'busy' | 'balanced';
  typography?: 'serif' | 'sans-serif' | 'script' | 'display';
  color_palette?: 'monochrome' | 'complementary' | 'analogous' | 'triadic';
}

// Platform-specific rules
export interface PlatformRules {
  instagram?: PlatformRule;
  linkedin?: PlatformRule;
  tiktok?: PlatformRule;
  facebook?: PlatformRule;
  twitter?: PlatformRule;
  youtube?: PlatformRule;
}

export interface PlatformRule {
  hashtags?: number;
  length?: 'short' | 'medium' | 'long';
  tone_adjustment?: string;
  content_format?: string[];
  posting_times?: string[];
  engagement_style?: string;
}

// Generation limits and controls
export interface GenerationLimits {
  client_id: string;
  max_cost_per_run: number;
  max_monthly_cost: number;
  video_enabled: boolean;
  voice_enabled: boolean;
  bulk_generation_enabled: boolean;
  auto_post_enabled: boolean;
  current_month_spend: number;
  total_runs_this_month: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

// Performance metrics tracking
export interface ClientPerformanceMetric {
  id: string;
  client_id: string;
  asset_id?: string;
  brand_version: number;
  metric_type: string;
  platform?: string;
  time_period?: string;
  
  // Social media metrics
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  watch_time_seconds?: number;
  retention_rate?: number;
  click_through_rate?: number;
  engagement_rate?: number;
  performance_score?: number;
  
  // Metadata
  metric_data: Record<string, any>;
  data_source: string;
  confidence_score: number;
  created_at: string;
  expires_at?: string;
}

// Content strategy (AI decisions)
export interface ContentStrategy {
  id: string;
  client_id: string;
  brand_version: number;
  
  // Strategy components
  intent?: string;
  hook_type?: string;
  emotional_register?: string;
  audience_state?: string;
  structure_pattern?: string;
  cta_type?: string;
  
  // Full strategy JSON
  strategy_json: Record<string, any>;
  created_at: string;
}

// Content generation run
export interface ContentRun {
  id: string;
  client_id: string;
  strategy_id?: string;
  brand_version: number;
  
  // Generation details
  content_type: 'video' | 'image' | 'text' | 'multi';
  platforms: string[];
  models_used: Record<string, any>;
  
  // Prompts
  initial_prompt?: string;
  final_prompt?: string;
  
  // Cost tracking
  estimated_cost: number;
  actual_cost: number;
  
  // Status tracking
  status: 'pending' | 'strategy_review' | 'generating' | 'human_review' | 'complete' | 'failed';
  error_message?: string;
  retry_count: number;
  
  // Metadata
  created_by?: string;
  created_at: string;
  completed_at?: string;
}

// Generated content asset
export interface ContentAsset {
  id: string;
  run_id: string;
  
  // Asset details
  asset_type: 'video' | 'image' | 'text' | 'script' | 'caption';
  platform?: string;
  title?: string;
  
  // Content data
  script_json?: Record<string, any>;
  caption_text?: string;
  asset_url?: string;
  thumbnail_url?: string;
  
  // File metadata
  file_size_bytes: number;
  duration_seconds: number;
  dimensions?: Record<string, any>;
  generation_time_seconds: number;
  quality_score?: number;
  
  created_at: string;
}

// Brand learning (AI improvement)
export interface BrandLearning {
  id: string;
  client_id: string;
  hook_type?: string;
  content_format?: string;
  emotional_register?: string;
  platform?: string;
  bias_score: number; // -1 to 1
  confidence_level: number; // 0 to 1
  sample_size: number;
  learned_from: 'performance' | 'manual' | 'feedback';
  last_updated: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES FOR API ENDPOINTS
// ============================================================================

// Create content client request
export interface CreateContentClientRequest {
  name: string;
  email?: string;
  website_url?: string;
  industry?: string;
  brand_description?: string;
}

// Update brand profile request
export interface UpdateBrandProfileRequest {
  brand_description?: string;
  industry_segment?: string;
  products_services?: string;
  // NEW: Fields for prompt enhancer compatibility
  business_niche?: string;
  color_personality?: string;
  visual_mood?: string;
  target_audience?: string;
  priority_benefits?: string[];
  secondary_benefits?: string[];
  positive_examples?: string[];
  prohibited_terms?: string[];
  // NEW: Content Guidelines fields
  language?: string;
  region?: string;
  spelling?: string;
  voice_tone?: Record<string, any>;
  voice_rules?: VoiceRules;
  visual_rules?: VisualRules;
  platform_rules?: PlatformRules;
  key_messages?: string[];
  forbidden_phrases?: string[];
  preferred_terminology?: Record<string, string>;
  primary_color?: string;
  secondary_colors?: string[];
  logo_url?: string;
  visual_style_notes?: string;
  content_themes?: string[];
  target_audience_description?: string;
  content_length_preferences?: Record<string, string>;
  top_performing_content_types?: string[];
  successful_hooks?: string[];
  content_to_avoid?: string[];
  approved_examples?: string[];
  negative_examples?: string[];
  notes?: string;
  content_focus_options?: string[];  // Categories for Social Content Generator pill buttons
}

// API Response wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ContentClientResponse extends ApiResponse<ContentClient> {}
export interface ContentClientsResponse extends ApiResponse<{ clients: ContentClient[] }> {}
export interface BrandProfileResponse extends ApiResponse<{ brandProfile: ClientBrandProfile }> {}
export interface GenerationLimitsResponse extends ApiResponse<{ limits: GenerationLimits }> {}

// Dashboard summary data
export interface BrandIntelligenceDashboardData {
  totalClients: number;
  activeClients: number;
  totalMonthlySpend: number;
  averageEngagementRate: number;
  topPerformingClients: Array<{
    client: ContentClient;
    performanceScore: number;
    monthlySpend: number;
  }>;
  recentActivity: Array<{
    type: 'client_created' | 'profile_updated' | 'content_generated';
    client: ContentClient;
    timestamp: string;
    details: string;
  }>;
}

// Validation schemas (for use with zod or similar)
export interface ValidationSchemas {
  contentClient: {
    name: { required: true; minLength: 2; maxLength: 100 };
    slug: { required: true; pattern: string }; // Pattern: /^[a-z0-9-]+$/
    email: { optional: true; format: 'email' };
    website_url: { optional: true; format: 'url' };
    industry: { optional: true; maxLength: 50 };
  };
  
  brandProfile: {
    brand_description: { optional: true; maxLength: 1000 };
    forbidden_phrases: { optional: true; maxItems: 50 };
    key_messages: { optional: true; maxItems: 20 };
    content_themes: { optional: true; maxItems: 10 };
  };
  
  generationLimits: {
    max_cost_per_run: { required: true; min: 0; max: 1000 };
    max_monthly_cost: { required: true; min: 0; max: 10000 };
  };
}