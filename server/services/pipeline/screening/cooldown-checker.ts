/**
 * Layer 4: Cooldown Checker — Dual cooldown (days + post count).
 * A topic must satisfy BOTH thresholds before it can resurface:
 *   1. Minimum days since last publication
 *   2. Minimum posts published since the topic was last covered
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScreeningResult } from './screening-types';

interface CooldownConfig {
  topicCooldownDays: number;  // e.g. 30
  topicCooldownPosts: number; // e.g. 5
}

/**
 * Check if a topic has cooled down enough to be used again.
 * Requires the topic fingerprint from Layer 3.
 */
export async function checkTopicCooldown(
  supabase: SupabaseClient,
  clientId: string,
  topicFingerprint: string | null,
  config: CooldownConfig,
): Promise<ScreeningResult> {
  // If no fingerprint was extracted, skip cooldown check (can't match without one)
  if (!topicFingerprint) {
    return { passed: true, metadata: { reason: 'No fingerprint — cooldown skipped' } };
  }

  try {
    // Look up the cooldown record for this topic
    const { data: cooldown, error } = await supabase
      .from('topic_cooldowns')
      .select('*')
      .eq('client_id', clientId)
      .eq('topic_fingerprint', topicFingerprint)
      .maybeSingle();

    if (error) {
      console.warn('[cooldown-checker] Query error:', error.message);
      return { passed: true, metadata: { error: error.message } };
    }

    // No cooldown record = topic is fresh
    if (!cooldown) {
      return { passed: true, metadata: { reason: 'Topic never published' } };
    }

    // Check 1: Days cooldown
    const lastPublished = new Date(cooldown.last_published_at);
    const daysSince = (Date.now() - lastPublished.getTime()) / (1000 * 60 * 60 * 24);
    const daysThreshold = cooldown.cooldown_days || config.topicCooldownDays;

    if (daysSince < daysThreshold) {
      return {
        passed: false,
        reason: `Topic on cooldown: ${Math.floor(daysSince)} days since last use (minimum ${daysThreshold})`,
        metadata: {
          daysSinceLastPublished: Math.floor(daysSince),
          cooldownDays: daysThreshold,
          lastPublishedAt: cooldown.last_published_at,
        },
      };
    }

    // Check 2: Posts cooldown — count published posts since the cooldown record's sequence number
    const postsThreshold = cooldown.cooldown_posts || config.topicCooldownPosts;
    const { count, error: countError } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'published')
      .gt('created_at', cooldown.last_published_at);

    if (countError) {
      console.warn('[cooldown-checker] Post count error:', countError.message);
      // Fail open on error
      return { passed: true, metadata: { error: countError.message } };
    }

    const postsSince = count || 0;
    if (postsSince < postsThreshold) {
      return {
        passed: false,
        reason: `Topic on cooldown: ${postsSince} posts since last use (minimum ${postsThreshold})`,
        metadata: {
          postsSinceLastPublished: postsSince,
          cooldownPosts: postsThreshold,
          lastPublishedAt: cooldown.last_published_at,
        },
      };
    }

    // Both thresholds cleared
    return {
      passed: true,
      metadata: {
        daysSinceLastPublished: Math.floor(daysSince),
        postsSinceLastPublished: postsSince,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[cooldown-checker] Error:', msg);
    return { passed: true, metadata: { error: msg } };
  }
}
