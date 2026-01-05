// ============================================================================
// CONTENT MANAGEMENT SYSTEM - CLIENT-SIDE TYPES
// TypeScript definitions for content management components and API responses
// ============================================================================

// Re-export server types for client-side use
export type {
  ContentClient,
  ClientBrandProfile,
  VoiceRules,
  VisualRules,
  PlatformRules,
  PlatformRule,
  GenerationLimits,
  ClientPerformanceMetric,
  ContentStrategy,
  ContentRun,
  ContentAsset,
  BrandLearning,
  CreateContentClientRequest,
  UpdateBrandProfileRequest,
  ApiResponse,
  ContentClientResponse,
  ContentClientsResponse,
  BrandProfileResponse,
  GenerationLimitsResponse,
  BrandIntelligenceDashboardData,
  ValidationSchemas
} from '../../../server/routes/content-management/types.js';

// Client-specific UI types
export interface ContentManagementUIState {
  selectedClientId?: string;
  activeView: 'dashboard' | 'client-detail' | 'brand-profile' | 'ai-generation';
  showCreateForm: boolean;
  showEditForm: boolean;
  isLoading: boolean;
  error?: string;
}

export interface BrandProfileFormData extends Omit<UpdateBrandProfileRequest, 'voice_rules' | 'visual_rules' | 'platform_rules'> {
  // Flattened form fields for easier form handling
  voice_tone_professional?: boolean;
  voice_tone_casual?: boolean;
  voice_tone_technical?: boolean;
  voice_sentence_length?: 'short' | 'medium' | 'long' | 'varied';
  voice_humor?: 'none' | 'minimal' | 'moderate' | 'frequent';
  voice_profanity?: 'none' | 'mild' | 'moderate';
  voice_formality?: 'casual' | 'professional' | 'formal';
  voice_energy?: 'low' | 'medium' | 'high';
  voice_perspective?: 'first_person' | 'third_person' | 'brand_voice';
  voice_technical_level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  
  visual_style?: string;
  visual_imagery?: string;
  visual_mood?: 'bright' | 'dark' | 'neutral' | 'vibrant';
  visual_composition?: 'minimal' | 'busy' | 'balanced';
  visual_typography?: 'serif' | 'sans-serif' | 'script' | 'display';
  visual_color_palette?: 'monochrome' | 'complementary' | 'analogous' | 'triadic';
  
  // Platform-specific settings (simplified for forms)
  instagram_hashtags?: number;
  instagram_length?: 'short' | 'medium' | 'long';
  linkedin_hashtags?: number;
  linkedin_length?: 'short' | 'medium' | 'long';
}

export interface ContentGenerationRequest {
  clientId: string;
  contentType: 'video' | 'image' | 'text' | 'multi';
  platforms: string[];
  prompt?: string;
  customStrategy?: Partial<ContentStrategy>;
  generateMultiple?: boolean;
  reviewRequired?: boolean;
}

export interface ContentGenerationResponse {
  success: boolean;
  runId?: string;
  estimatedCost?: number;
  estimatedTime?: number;
  error?: string;
  message?: string;
}

// Form validation types
export interface FormValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
}

// Dashboard card component props
export interface ContentClientCardProps {
  client: ContentClient;
  isSelected?: boolean;
  onSelect?: (client: ContentClient) => void;
  onEdit?: (client: ContentClient) => void;
  onGenerateContent?: (client: ContentClient) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface BrandProfileCardProps {
  profile: ClientBrandProfile;
  client: ContentClient;
  onEdit?: () => void;
  onViewHistory?: () => void;
  showVersionInfo?: boolean;
}

export interface GenerationLimitsCardProps {
  limits: GenerationLimits;
  client: ContentClient;
  onEdit?: () => void;
  showUsageBar?: boolean;
}

// Modal and form component props
export interface ClientCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client: ContentClient) => void;
  initialData?: Partial<CreateContentClientRequest>;
}

export interface BrandProfileEditorProps {
  clientId: string;
  profile?: ClientBrandProfile;
  onSave?: (profile: ClientBrandProfile) => void;
  onCancel?: () => void;
  isCreating?: boolean;
  showAdvancedOptions?: boolean;
}

// Query hooks return types
export interface UseContentClientsResult {
  clients: ContentClient[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseClientBrandProfileResult {
  profile: ClientBrandProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (data: UpdateBrandProfileRequest) => Promise<void>;
  isUpdating: boolean;
}

export interface UseDashboardDataResult {
  data: BrandIntelligenceDashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Content generation workflow types
export interface AIGenerationWorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  component?: React.ComponentType<any>;
}

export interface AIGenerationWorkflowState {
  currentStep: number;
  steps: AIGenerationWorkflowStep[];
  canGoBack: boolean;
  canGoNext: boolean;
  isGenerating: boolean;
  results?: ContentAsset[];
}

// Permission and role types for UI
export interface ContentManagementPermissions {
  canViewDashboard: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canManageBrandProfiles: boolean;
  canGenerateContent: boolean;
  canManageGenerationLimits: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

// Navigation and routing types
export type ContentManagementRoute = 
  | '/content-management'
  | '/content-management/dashboard' 
  | '/content-management/clients'
  | `/content-management/clients/${string}`
  | `/content-management/clients/${string}/brand-profile`
  | `/content-management/clients/${string}/generate`
  | '/content-management/analytics';

export interface ContentManagementNavItem {
  route: ContentManagementRoute;
  label: string;
  icon: string;
  description: string;
  permissions: (keyof ContentManagementPermissions)[];
}

// Component styling and theme types
export interface ContentManagementTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  borderRadius: string;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Analytics and metrics display types
export interface MetricDisplayConfig {
  label: string;
  value: string | number;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export interface DashboardMetrics {
  totalClients: MetricDisplayConfig;
  activeClients: MetricDisplayConfig;
  monthlySpend: MetricDisplayConfig;
  averageEngagement: MetricDisplayConfig;
  totalGenerations: MetricDisplayConfig;
  successRate: MetricDisplayConfig;
}

// Export utility types
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeMetrics: boolean;
  includeBrandProfiles: boolean;
  includeGenerationHistory: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}