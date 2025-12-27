/**
 * ToolCard Component
 * Clean card design with large icon, title/description, and icon-based badges
 */

import { Lock, Sparkles, Clock, HardDrive, UserCheck, Crown, Users, Globe, FolderOpen, Wrench, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ToolDefinition, ToolCategory, CATEGORY_LABELS } from '@shared/types/tools';
import { useToolAccess } from '@/hooks/use-tool-access';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: () => void;
  isLoading?: boolean;
}

// Category icons for the indicator
const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  'file-management': FolderOpen,
  'content': Wrench,
  'automation': Zap,
  'ai-powered': Sparkles,
};

// Gradient backgrounds by category
const CATEGORY_GRADIENTS: Record<string, string> = {
  'file-management': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'ai-powered': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'content': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'automation': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
};

export function ToolCard({ tool, onClick, isLoading = false }: ToolCardProps) {
  const { canAccessTool, isToolLocked } = useToolAccess();

  const hasAccess = canAccessTool(tool);
  const isLocked = isToolLocked(tool);
  const isComingSoon = tool.comingSoon;

  // Get category icon
  const CategoryIcon = CATEGORY_ICONS[tool.category];

  // Badge styling based on type
  const getBadgeClasses = (badge: string) => {
    switch (badge) {
      case 'new':
        return 'bg-cyan text-white border-0';
      case 'popular':
        return 'bg-white/90 text-gray-900 border-0';
      case 'beta':
        return 'bg-amber-500/90 text-white border-0';
      case 'pro':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        'tool-card group',
        isLocked && 'is-locked',
        isComingSoon && 'is-coming-soon',
        isLoading && 'is-loading'
      )}
      onClick={isComingSoon || isLoading ? undefined : onClick}
    >
      {/* Icon Header Section */}
      <div
        className="tool-card-header"
        style={{ background: CATEGORY_GRADIENTS[tool.category] }}
      >
        {/* Large centered icon */}
        <div className="tool-card-icon-large">
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          ) : (
            tool.icon
          )}
        </div>

        {/* Top-right badges */}
        <div className="tool-card-status-badges">
          {isLocked && (
            <div className="tool-card-status-badge" title="Login required">
              <Lock className="h-3.5 w-3.5" />
            </div>
          )}
          {tool.usesAI && (
            <div className="tool-card-status-badge bg-amber-500/90" title="AI-powered">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          )}
          {isComingSoon && (
            <div className="tool-card-status-badge bg-gray-500/90" title="Coming soon">
              <Clock className="h-3.5 w-3.5" />
            </div>
          )}
          {tool.badge && (
            <Badge className={cn('text-xs ml-1', getBadgeClasses(tool.badge))}>
              {tool.badge.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="tool-card-content">
        {/* Title */}
        <h3 className="tool-card-title">{tool.name}</h3>

        {/* Description - more space now */}
        <p className="tool-card-description">{tool.description}</p>

        {/* Icon-based feature indicators */}
        <div className="tool-card-indicators">
          {/* Category icon */}
          <div className="tool-card-indicator text-white/60" title={CATEGORY_LABELS[tool.category]}>
            <CategoryIcon className="h-4 w-4" />
          </div>

          {/* Local files */}
          {tool.usesLocalFiles && (
            <div className="tool-card-indicator" title="Works with local files">
              <HardDrive className="h-4 w-4" />
            </div>
          )}

          {/* Access tier icons */}
          {tool.minTier === 'anonymous' && (
            <div className="tool-card-indicator text-green-500" title="No login required">
              <Globe className="h-4 w-4" />
            </div>
          )}
          {tool.minTier === 'verified' && (
            <div className="tool-card-indicator text-cyan" title="Free account required">
              <UserCheck className="h-4 w-4" />
            </div>
          )}
          {(tool.minTier === 'pro' || tool.minTier === 'enterprise') && (
            <div className="tool-card-indicator text-amber-500" title="Pro plan required">
              <Crown className="h-4 w-4" />
            </div>
          )}
          {tool.minTier === 'staff' && (
            <div className="tool-card-indicator text-purple-500" title="Team only">
              <Users className="h-4 w-4" />
            </div>
          )}

          {/* Coming soon text badge - this one stays as text */}
          {isComingSoon && (
            <span className="text-xs text-gray-500 ml-auto">Coming Soon</span>
          )}
        </div>
      </div>
    </div>
  );
}
