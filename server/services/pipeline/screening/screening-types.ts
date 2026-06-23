/**
 * Shared types for all screening layers.
 */

export interface ScreeningResult {
  passed: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}
