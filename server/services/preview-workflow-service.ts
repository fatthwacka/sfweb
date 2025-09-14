/**
 * ROBUST PREVIEW WORKFLOW SERVICE
 * 
 * Centralized, atomic management of the 4-state preview workflow:
 * 1. Default (salmon) - Normal gallery viewing
 * 2. Preview (cyan) - Client image selection available  
 * 3. Editing (yellow) - Photographer editing in progress
 * 4. Complete (green) - Final images ready
 * 
 * Key Design Principles:
 * - Atomic operations with database transactions
 * - Idempotent state changes (safe to call multiple times)
 * - Centralized validation and error handling
 * - Audit trail for all state changes
 * - UUID-based referential integrity
 */

import { db } from '../db';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { shootPreviews, previewImages, shoots, type InsertShootPreview, type ShootPreview } from '@shared/schema';

export type WorkflowState = 'default' | 'preview' | 'editing' | 'complete';

export interface WorkflowStateInfo {
  state: WorkflowState;
  canTransition: boolean;
  reason?: string;
  metadata?: {
    previewImageCount?: number;
    selectionCount?: number;
    lastTransition?: Date;
  };
}

export class PreviewWorkflowService {
  
  /**
   * ATOMIC: Initialize preview workflow for a shoot
   * - Creates shoot_previews record if it doesn't exist
   * - Validates shoot exists
   * - Returns current state
   */
  async initializePreviewWorkflow(shootId: string): Promise<WorkflowStateInfo> {
    return await db.transaction(async (tx) => {
      // 1. Validate shoot exists
      const shoot = await tx.select().from(shoots).where(eq(shoots.id, shootId)).limit(1);
      if (!shoot[0]) {
        throw new Error(`Shoot ${shootId} not found`);
      }

      // 2. Check if preview workflow already exists
      const existing = await tx.select().from(shootPreviews).where(eq(shootPreviews.shootId, shootId)).limit(1);
      
      if (existing[0]) {
        // Workflow already exists, return current state
        return await this.getWorkflowState(shootId);
      }

      // 3. Create initial preview workflow record
      const previewSettingsData: InsertShootPreview = {
        shootId,
        dropboxFolderPath: null,
        dropboxShareLink: null,
        selectionLimit: 20,
        additionalBundle5Price: '150.00',
        additionalBundle10Price: '250.00',
        unlimitedBundlePrice: '500.00',
        isActive: true,
        submissionCompleted: false,
        editingCompleted: false
      };

      await tx.insert(shootPreviews).values(previewSettingsData);
      
      console.log(`🎯 Preview workflow initialized for shoot ${shootId}`);
      
      return {
        state: 'preview',
        canTransition: true,
        metadata: {
          previewImageCount: 0,
          lastTransition: new Date()
        }
      };
    });
  }

  /**
   * Get current workflow state for a shoot
   */
  async getWorkflowState(shootId: string): Promise<WorkflowStateInfo> {
    const settings = await db.select().from(shootPreviews).where(eq(shootPreviews.shootId, shootId)).limit(1);
    
    if (!settings[0] || !settings[0].isActive) {
      return { state: 'default', canTransition: true };
    }

    const setting = settings[0];
    
    if (setting.editingCompleted) {
      return { 
        state: 'complete', 
        canTransition: false,
        metadata: { lastTransition: setting.editingCompletedAt || undefined }
      };
    }
    
    if (setting.submissionCompleted) {
      return { 
        state: 'editing', 
        canTransition: false,
        reason: 'Waiting for photographer to complete editing',
        metadata: { lastTransition: setting.submissionCompletedAt || undefined }
      };
    }
    
    // Get preview image count for metadata
    const imageCount = await db.select({ count: previewImages.id }).from(previewImages).where(eq(previewImages.shootId, shootId));
    
    return { 
      state: 'preview', 
      canTransition: true,
      metadata: { 
        previewImageCount: imageCount.length,
        lastTransition: setting.updatedAt || undefined
      }
    };
  }

  /**
   * ATOMIC: Transition to submission completed (preview -> editing)
   */
  async markSubmissionCompleted(shootId: string, submittedBy: string): Promise<WorkflowStateInfo> {
    return await db.transaction(async (tx) => {
      const current = await this.getWorkflowState(shootId);
      
      if (current.state !== 'preview') {
        throw new Error(`Cannot mark submission completed from state: ${current.state}`);
      }

      await tx.update(shootPreviews)
        .set({
          submissionCompleted: true,
          submissionCompletedAt: new Date(),
          submissionCompletedBy: submittedBy,
          updatedAt: new Date()
        })
        .where(eq(shootPreviews.shootId, shootId));

      console.log(`🎯 Workflow transition: ${shootId} -> editing state`);
      
      return {
        state: 'editing',
        canTransition: false,
        reason: 'Client selection submitted, editing in progress'
      };
    });
  }

  /**
   * ATOMIC: Transition to editing completed (editing -> complete)
   */
  async markEditingCompleted(shootId: string): Promise<WorkflowStateInfo> {
    return await db.transaction(async (tx) => {
      const current = await this.getWorkflowState(shootId);
      
      if (current.state !== 'editing') {
        throw new Error(`Cannot mark editing completed from state: ${current.state}`);
      }

      await tx.update(shootPreviews)
        .set({
          editingCompleted: true,
          editingCompletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(shootPreviews.shootId, shootId));

      console.log(`🎯 Workflow transition: ${shootId} -> complete state`);
      
      return {
        state: 'complete',
        canTransition: false,
        reason: 'Final images ready for download'
      };
    });
  }

  /**
   * ATOMIC: Reset workflow (for cleanup/debugging)
   */
  async resetWorkflow(shootId: string): Promise<WorkflowStateInfo> {
    return await db.transaction(async (tx) => {
      await tx.delete(shootPreviews).where(eq(shootPreviews.shootId, shootId));
      
      console.log(`🔄 Workflow reset for shoot ${shootId}`);
      
      return { state: 'default', canTransition: true };
    });
  }

  /**
   * Validate state transition is allowed
   */
  isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
    const validTransitions: Record<WorkflowState, WorkflowState[]> = {
      'default': ['preview'],
      'preview': ['editing', 'default'], // Can go back to default via reset
      'editing': ['complete', 'preview'], // Can go back via reset
      'complete': ['default'] // Can reset after completion
    };
    
    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Get workflow states for multiple shoots (useful for client portal)
   */
  async getMultipleWorkflowStates(shootIds: string[]): Promise<Record<string, WorkflowStateInfo>> {
    const results: Record<string, WorkflowStateInfo> = {};
    
    // Get all preview settings for the shoots
    const settings = await db.select()
      .from(shootPreviews)
      .where(inArray(shootPreviews.shootId, shootIds));
    
    // Process each shoot
    for (const shootId of shootIds) {
      const setting = settings.find(s => s.shootId === shootId);
      
      if (!setting || !setting.isActive) {
        results[shootId] = { state: 'default', canTransition: true };
        continue;
      }
      
      if (setting.editingCompleted) {
        results[shootId] = { 
          state: 'complete', 
          canTransition: false,
          metadata: { lastTransition: setting.editingCompletedAt || undefined }
        };
      } else if (setting.submissionCompleted) {
        results[shootId] = { 
          state: 'editing', 
          canTransition: false,
          reason: 'Waiting for photographer to complete editing',
          metadata: { lastTransition: setting.submissionCompletedAt || undefined }
        };
      } else {
        results[shootId] = { 
          state: 'preview', 
          canTransition: true,
          metadata: { lastTransition: setting.updatedAt || undefined }
        };
      }
    }
    
    return results;
  }

  /**
   * Get state-specific UI configuration
   */
  getStateConfig(state: WorkflowState) {
    const configs = {
      'default': {
        color: 'salmon',
        buttonText: 'View Gallery',
        action: 'gallery',
        locked: false
      },
      'preview': {
        color: 'cyan', 
        buttonText: 'Select Images',
        action: 'image-picker',
        locked: false
      },
      'editing': {
        color: 'yellow',
        buttonText: 'View Gallery (Processing)',
        action: 'gallery',
        locked: true
      },
      'complete': {
        color: 'green',
        buttonText: 'View Gallery (Ready)', 
        action: 'gallery',
        locked: false
      }
    };
    
    return configs[state];
  }
}

// Singleton instance
export const previewWorkflowService = new PreviewWorkflowService();