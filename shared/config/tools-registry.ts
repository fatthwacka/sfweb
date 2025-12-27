/**
 * Mini Tools Hub - Tool Registry
 * Central configuration for all available tools
 */

import { ToolDefinition, ToolCategory, TIER_HIERARCHY, AccessTier } from '../types/tools';

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // === AI CONTENT CREATION (verified minimum) ===
  {
    slug: 'web-page-content-creator',
    name: 'Web Page Content Creator',
    description: 'Transform any webpage into structured, professional content using AI analysis',
    icon: '🌐',
    category: 'ai-powered',
    minTier: 'verified',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: { verified: 10, pro: 100, enterprise: null },
    badge: 'new',
    customAction: 'n8n-workflow', // Special flag for n8n workflow integration
  },
  {
    slug: 'article-editor',
    name: 'Article Editor',
    description: 'Edit and publish articles with AI-assisted writing and image management',
    icon: '✏️',
    category: 'content',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
    customAction: 'full-page', // Open in full page mode
  },

  // === FILE MANAGEMENT (mostly anonymous) ===
  {
    slug: 'file-renamer',
    name: 'File Renamer',
    description: 'Strip timestamps, batch rename, and clean up filenames with smart pattern matching',
    icon: '🗂️',
    category: 'file-management',
    minTier: 'anonymous',
    requiresAuth: false,
    usesAI: false,
    usesLocalFiles: true,
    limits: { anonymous: 100, verified: 500, pro: null },
    badge: 'popular',
  },
  {
    slug: 'bulk-mover',
    name: 'Bulk Mover',
    description: 'Rename and consolidate files to target folders with conflict resolution',
    icon: '📦',
    category: 'file-management',
    minTier: 'anonymous',
    requiresAuth: false,
    usesAI: false,
    usesLocalFiles: true,
    limits: { anonymous: 100, verified: 500, pro: null },
  },
  {
    slug: 'duplicate-finder',
    name: 'Duplicate Finder',
    description: 'Find and remove duplicate files using smart hash-based matching',
    icon: '🔍',
    category: 'file-management',
    minTier: 'anonymous',
    requiresAuth: false,
    usesAI: false,
    usesLocalFiles: true,
    limits: { anonymous: 50, verified: 200, pro: null },
  },
  {
    slug: 'project-cleanup',
    name: 'Project Cleanup',
    description: 'Smart cleanup of system junk files and orphaned RAW files with preview',
    icon: '🧹',
    category: 'file-management',
    minTier: 'anonymous',
    requiresAuth: false,
    usesAI: false,
    usesLocalFiles: true,
    limits: { anonymous: 100, verified: 500, pro: null },
    badge: 'new',
  },

  // === AI-POWERED (verified minimum) ===
  {
    slug: 'smart-organiser',
    name: 'Smart Organiser',
    description: 'AI-powered file categorisation with intelligent folder suggestions',
    icon: '🤖',
    category: 'ai-powered',
    minTier: 'verified',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: true,
    limits: { verified: 50, pro: 500, enterprise: null },
    badge: 'new',
  },
  {
    slug: 'ai-duplicate-matcher',
    name: 'AI Duplicate Matcher',
    description: 'Semantic duplicate detection using AI to find similar files by content',
    icon: '🧠',
    category: 'ai-powered',
    minTier: 'verified',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: true,
    limits: { verified: 30, pro: 300, enterprise: null },
  },


  // === AUTOMATION (staff only) ===
  {
    slug: 'n8n-gallery-email',
    name: 'Send Gallery Email',
    description: 'Trigger automated client gallery delivery workflow',
    icon: '📧',
    category: 'automation',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
  },
  {
    slug: 'n8n-social-post',
    name: 'Social Media Post',
    description: 'Schedule and publish content to social media platforms',
    icon: '📱',
    category: 'automation',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
  },
  {
    slug: 'n8n-backup',
    name: 'Database Backup',
    description: 'Trigger manual database backup to secure storage',
    icon: '💾',
    category: 'automation',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
  },

  // === COMING SOON (teasers for future features) ===
  {
    slug: 'batch-image-processor',
    name: 'Batch Image Processor',
    description: 'Resize, watermark, and optimise images in bulk with presets',
    icon: '🖼️',
    category: 'file-management',
    minTier: 'pro',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: true,
    limits: { pro: 500, enterprise: null },
    comingSoon: true,
    badge: 'pro',
  },
  {
    slug: 'api-access',
    name: 'API Access',
    description: 'Programmatic REST API access to all tools for automation',
    icon: '⚡',
    category: 'automation',
    minTier: 'enterprise',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: { enterprise: null },
    comingSoon: true,
    badge: 'pro',
  },
];

// === HELPER FUNCTIONS ===

/**
 * Get a tool by its slug
 */
export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find(t => t.slug === slug);
}

/**
 * Get all tools in a specific category
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS_REGISTRY.filter(t => t.category === category);
}

/**
 * Get all tools accessible by a given tier
 */
export function getAccessibleTools(userTier: AccessTier): ToolDefinition[] {
  const userTierIndex = TIER_HIERARCHY.indexOf(userTier);

  return TOOLS_REGISTRY.filter(tool => {
    const toolTierIndex = TIER_HIERARCHY.indexOf(tool.minTier);
    return toolTierIndex <= userTierIndex;
  });
}

/**
 * Get all active (not coming soon) tools
 */
export function getActiveTools(): ToolDefinition[] {
  return TOOLS_REGISTRY.filter(t => !t.comingSoon);
}

/**
 * Get tools grouped by category
 */
export function getToolsGroupedByCategory(): Record<ToolCategory, ToolDefinition[]> {
  return TOOLS_REGISTRY.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, ToolDefinition[]>);
}

/**
 * Get the route path for a tool
 */
export function getToolPath(tool: ToolDefinition): string {
  return tool.customPath || `/tools/${tool.slug}`;
}
