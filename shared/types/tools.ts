/**
 * Mini Tools Hub - Shared Types
 * Used by both client and server for type safety
 */

// Access tier hierarchy (lowest to highest)
export type AccessTier = 'anonymous' | 'verified' | 'pro' | 'enterprise' | 'staff';

// Tool categories for organisation
export type ToolCategory = 'file-management' | 'content' | 'automation' | 'ai-powered';

// Badge types for visual indicators
export type ToolBadge = 'new' | 'beta' | 'popular' | 'pro';

// Tool definition - the complete specification for a tool
export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;

  // Access control
  minTier: AccessTier;
  requiresAuth: boolean;

  // Feature flags
  usesAI: boolean;
  usesLocalFiles: boolean;

  // Usage limits per tier (null = unlimited, undefined = use default)
  limits: {
    anonymous?: number | null;
    verified?: number | null;
    pro?: number | null;
    enterprise?: number | null;
    staff?: null; // Always unlimited
  };

  // UI customisation
  comingSoon?: boolean;
  badge?: ToolBadge;
  thumbnailUrl?: string;

  // Route path (defaults to /tools/{slug})
  customPath?: string;
  
  // Custom action type for special integrations
  customAction?: 'n8n-workflow' | 'popup-form';
}

// Modal types for access control popups
export type AccessModalType =
  | 'login-required'
  | 'verify-email'
  | 'upgrade-required'
  | 'staff-only';

// Modal content configuration
export interface AccessModalContent {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href?: string;
    action?: 'close' | 'resend-verification';
  };
  secondaryAction: {
    label: string;
    href?: string;
    action?: 'close';
  };
}

// User access information
export interface UserToolAccess {
  tier: AccessTier;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  subscriptionExpiresAt?: Date | null;
}

// Tool usage tracking
export interface ToolUsage {
  toolSlug: string;
  usedToday: number;
  limit: number | null;
  remainingToday: number | null;
  resetsAt: Date;
}

// API response for tool access check
export interface ToolAccessCheckResponse {
  hasAccess: boolean;
  userTier: AccessTier;
  requiredTier: AccessTier;
  usageToday: number;
  usageLimit: number | null;
  modalType?: AccessModalType;
}

// Tier hierarchy for comparisons
export const TIER_HIERARCHY: AccessTier[] = [
  'anonymous',
  'verified',
  'pro',
  'enterprise',
  'staff'
];

// Helper to check if user tier meets required tier
export function tierMeetsRequirement(userTier: AccessTier, requiredTier: AccessTier): boolean {
  const userIndex = TIER_HIERARCHY.indexOf(userTier);
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

// Category display names
export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  'file-management': 'File Management',
  'content': 'Content Tools',
  'automation': 'Automation',
  'ai-powered': 'AI-Powered',
};

// Tier display names
export const TIER_LABELS: Record<AccessTier, string> = {
  'anonymous': 'No login required',
  'verified': 'Free account',
  'pro': 'Pro plan',
  'enterprise': 'Enterprise plan',
  'staff': 'Team only',
};
