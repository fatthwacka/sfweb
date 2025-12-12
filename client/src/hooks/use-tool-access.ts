/**
 * useToolAccess Hook
 * Manages tool access control, tier checking, and modal states
 */

import { useAuth } from './use-auth';
import {
  ToolDefinition,
  AccessTier,
  AccessModalType,
  AccessModalContent,
  TIER_HIERARCHY,
  tierMeetsRequirement,
} from '@shared/types/tools';

interface UseToolAccessReturn {
  // Current user's access tier
  userTier: AccessTier;

  // Auth state
  isAuthenticated: boolean;
  isEmailVerified: boolean;

  // Check if user can access a specific tool
  canAccessTool: (tool: ToolDefinition) => boolean;

  // Get the appropriate modal type for a tool (null if user has access)
  getAccessModal: (tool: ToolDefinition) => AccessModalType | null;

  // Get modal content for display
  getModalContent: (modalType: AccessModalType) => AccessModalContent;

  // Check if a tool is locked for the current user
  isToolLocked: (tool: ToolDefinition) => boolean;
}

export function useToolAccess(): UseToolAccessReturn {
  const { user, isLoading } = useAuth();

  /**
   * Determine the user's current access tier
   */
  const getUserTier = (): AccessTier => {
    if (!user) return 'anonymous';

    // Staff and super_admin get full access
    if (user.role === 'super_admin' || user.role === 'staff') {
      return 'staff';
    }

    // Check subscription tier
    if (user.subscriptionTier === 'enterprise') return 'enterprise';
    if (user.subscriptionTier === 'pro') return 'pro';

    // Check email verification for 'verified' tier
    if (user.emailVerifiedAt) return 'verified';

    // Logged in but not verified = still anonymous tier for tool access
    return 'anonymous';
  };

  const userTier = getUserTier();
  const isAuthenticated = !!user;
  const isEmailVerified = !!user?.emailVerifiedAt;

  /**
   * Check if user can access a specific tool
   */
  const canAccessTool = (tool: ToolDefinition): boolean => {
    return tierMeetsRequirement(userTier, tool.minTier);
  };

  /**
   * Check if a tool is locked for the current user
   */
  const isToolLocked = (tool: ToolDefinition): boolean => {
    return !canAccessTool(tool) && !tool.comingSoon;
  };

  /**
   * Get the appropriate modal type when user can't access a tool
   */
  const getAccessModal = (tool: ToolDefinition): AccessModalType | null => {
    // User has access - no modal needed
    if (canAccessTool(tool)) return null;

    // Coming soon tools don't show access modals
    if (tool.comingSoon) return null;

    // Staff-only tools
    if (tool.minTier === 'staff') {
      return 'staff-only';
    }

    // Not logged in at all
    if (!isAuthenticated) {
      return 'login-required';
    }

    // Logged in but email not verified
    if (!isEmailVerified && tool.minTier === 'verified') {
      return 'verify-email';
    }

    // Needs paid subscription (pro or enterprise)
    if (tool.minTier === 'pro' || tool.minTier === 'enterprise') {
      return 'upgrade-required';
    }

    // Default fallback
    return 'login-required';
  };

  /**
   * Get modal content for display
   */
  const getModalContent = (modalType: AccessModalType): AccessModalContent => {
    switch (modalType) {
      case 'login-required':
        return {
          title: 'Sign in to continue',
          description: 'Create a free account to access this tool and save your preferences.',
          primaryAction: { label: 'Sign In', href: '/login' },
          secondaryAction: { label: 'Create Account', href: '/register' },
        };

      case 'verify-email':
        return {
          title: 'Verify your email',
          description: 'Please verify your email address to access this tool. Check your inbox for a verification link.',
          primaryAction: { label: 'Resend Verification', action: 'resend-verification' },
          secondaryAction: { label: 'Maybe Later', action: 'close' },
        };

      case 'upgrade-required':
        return {
          title: 'Upgrade to Pro',
          description: 'This premium tool is available on our Pro plan. Unlock all tools and priority features.',
          primaryAction: { label: 'View Plans', href: '/pricing' },
          secondaryAction: { label: 'Maybe Later', action: 'close' },
        };

      case 'staff-only':
        return {
          title: 'Team Feature',
          description: 'This tool is available exclusively to our team members.',
          primaryAction: { label: 'Learn More', href: '/contact' },
          secondaryAction: { label: 'Close', action: 'close' },
        };

      default:
        return {
          title: 'Access Required',
          description: 'You need additional permissions to access this tool.',
          primaryAction: { label: 'Close', action: 'close' },
          secondaryAction: { label: 'Close', action: 'close' },
        };
    }
  };

  return {
    userTier,
    isAuthenticated,
    isEmailVerified,
    canAccessTool,
    getAccessModal,
    getModalContent,
    isToolLocked,
  };
}
