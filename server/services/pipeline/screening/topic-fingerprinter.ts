/**
 * Layer 3: Topic Fingerprinting — Uses Gemini to extract a normalised topic phrase.
 * Only runs on articles that have already passed URL dedup and title similarity
 * (saves API calls by screening cheaply first).
 */

import { callGemini } from '../gemini-client';
import type { ScreeningResult } from './screening-types';

const SYSTEM_PROMPT = `You are a topic extraction engine. Given an article title and optional summary, extract the core topic as a 3-8 word lowercase phrase.

Rules:
- Output ONLY the topic phrase, nothing else
- No punctuation, no quotes, no explanation
- Use lowercase only
- Be specific but not overly narrow
- Focus on the subject matter, not the article format

Examples:
- "10 Best CCTV Cameras for Small Business in 2026" → "cctv cameras small business"
- "How AI is Transforming Home Security Systems" → "ai home security systems"
- "The Rise of Biometric Access Control in South Africa" → "biometric access control south africa"
- "Why Your Business Needs a Disaster Recovery Plan" → "business disaster recovery planning"`;

/**
 * Extract a topic fingerprint from an article using Gemini.
 * Returns null on failure (graceful degradation — article proceeds without fingerprint).
 */
export async function extractTopicFingerprint(
  title: string,
  summary?: string,
  rawContent?: string,
): Promise<string | null> {
  try {
    const contentPreview = rawContent ? rawContent.substring(0, 500) : '';
    const userPrompt = [
      `Title: ${title}`,
      summary ? `Summary: ${summary}` : '',
      contentPreview ? `Content preview: ${contentPreview}` : '',
    ].filter(Boolean).join('\n');

    const response = await callGemini(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.1,
      maxTokens: 50,
    });

    // Clean the response: lowercase, remove quotes/punctuation, trim
    const fingerprint = response
      .toLowerCase()
      .replace(/['".,!?;:()[\]{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Validate: should be 3-8 words
    const wordCount = fingerprint.split(' ').length;
    if (wordCount < 2 || wordCount > 12) {
      console.warn(`[topic-fingerprinter] Unusual fingerprint length (${wordCount} words): "${fingerprint}"`);
      // Still return it — better than nothing
    }

    return fingerprint || null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[topic-fingerprinter] Gemini call failed:', msg);
    return null; // Graceful degradation
  }
}

/**
 * Extract topic keywords from the fingerprint (simple split).
 */
export function extractTopicKeywords(fingerprint: string): string[] {
  return fingerprint
    .split(' ')
    .filter(word => word.length > 2) // Skip very short words
    .slice(0, 8);
}

/**
 * Screening wrapper that extracts a fingerprint and attaches it as metadata.
 * Always passes — fingerprinting doesn't reject articles, it enriches them
 * for the cooldown checker (Layer 4) to use.
 */
export async function enrichWithTopicFingerprint(
  title: string,
  summary?: string,
  rawContent?: string,
): Promise<ScreeningResult> {
  const fingerprint = await extractTopicFingerprint(title, summary, rawContent);
  const keywords = fingerprint ? extractTopicKeywords(fingerprint) : [];

  return {
    passed: true, // Fingerprinting never rejects — it enriches
    metadata: {
      topicFingerprint: fingerprint,
      topicKeywords: keywords,
    },
  };
}
