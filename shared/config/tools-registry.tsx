/**
 * Mini Tools Hub - Tool Registry
 * Central configuration for all available tools
 */

import React from 'react';
import { ToolDefinition, ToolCategory, TIER_HIERARCHY, AccessTier } from '../types/tools';
import { GeminiIcon, OpenAIIcon } from '../../client/src/components/icons';

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // === VEO VIDEO GENERATOR TEST ===
  {
    slug: 'veo-video-generator',
    name: 'VEO Video Generator',
    description: 'Generate professional AI videos using Google Vertex AI VEO model with advanced prompt enhancement',
    icon: '🎬',
    category: 'ai-powered',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation
  },
  
  // === AI CONTENT CREATION (verified minimum) ===
  {
    slug: 'ai-image-generator',
    name: 'AI Image Generator',
    description: 'Generate professional images using Vertex AI with prompt enhancement and text overlays',
    icon: '🎨',
    category: 'ai-powered',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation
  },
  {
    slug: 'web-page-content-creator',
    name: 'Gemini Post Creator',
    description: 'Transform any webpage into engaging LinkedIn posts using Google Gemini AI',
    icon: <GeminiIcon />,
    category: 'ai-powered',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    customAction: 'n8n-workflow', // Native Gemini implementation
  },
  {
    slug: 'n8n-content-creator',
    name: 'ChatGPT Post Creator',
    description: 'Transform any webpage into engaging LinkedIn posts via ChatGPT and n8n automation',
    icon: <OpenAIIcon />,
    category: 'ai-powered',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    customAction: 'n8n-webhook', // n8n webhook to ChatGPT
  },
  {
    slug: 'article-editor',
    name: 'Article Editor (Airtable)',
    description: 'Legacy article editor using Airtable backend - will be deprecated',
    icon: '✏️',
    category: 'content',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
    customAction: 'full-page', // Open in full page mode
  },
  {
    slug: 'article-editor-supabase',
    name: 'Article Editor (Supabase)',
    description: 'Edit and publish articles using Supabase backend with AI-assisted writing and image management',
    icon: '📝',
    category: 'content',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    customAction: 'full-page', // Open in full page mode
  },
  {
    slug: 'prompt-engine',
    name: 'Prompt Engine',
    description: 'AI-powered prompt enhancement with brand intelligence integration for all content types',
    icon: '🧠',
    category: 'ai-powered',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    // Uses standard page navigation
  },
  {
    slug: 'social-content-generator',
    name: 'Social Content Generator',
    description: 'Platform-optimised social media content with structured sections: Hook, Body, CTA & Hashtags',
    icon: '📱',
    category: 'ai-powered',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation
  },
  {
    slug: 'cloud-storage-browser',
    name: 'Cloud Storage Browser',
    description: 'Browse, view, and manage Google Cloud Storage files with grid view, search, and download features',
    icon: '☁️',
    category: 'file-management',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation
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


  // === CONTENT STUDIO ===
  {
    slug: 'blog-content-studio',
    name: 'Blog Content Studio',
    description: 'Multi-client blog pipeline with AI writing, research inputs, and multi-platform publishing',
    icon: '📰',
    category: 'content',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation
  },

  // === BUSINESS TOOLS (staff only) ===
  {
    slug: 'quote-generator',
    name: 'Quote Generator',
    description: 'Generate professional photography and videography quotes with customisable packages and options',
    icon: '💰',
    category: 'automation',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Full page mode for staff, modal with client view when embedded elsewhere
  },

  // === AUTOMATION (staff only) ===
  {
    slug: 'brand-intelligence-dashboard',
    name: 'Brand Intelligence Dashboard',
    description: 'Manage client brand profiles, AI content generation settings, and analytics',
    icon: '🎯',
    category: 'automation',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: true,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation (same tab)
  },
  {
    slug: 'content-types-admin',
    name: 'Content Types Admin',
    description: 'Manage prompt enhancement guidelines for each content type',
    icon: '⚙️',
    category: 'automation',
    minTier: 'staff',
    requiresAuth: true,
    usesAI: false,
    usesLocalFiles: false,
    limits: {},
    badge: 'new',
    // Uses standard page navigation
  },
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
