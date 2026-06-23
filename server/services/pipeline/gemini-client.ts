/**
 * Gemini Client — Thin wrapper for pipeline-specific Gemini 2.0-flash calls.
 * Used for topic fingerprinting, summary generation, and relevance scoring.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const MIN_REQUEST_INTERVAL_MS = 1000;

let lastRequestTime = 0;

interface GeminiOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call Gemini 2.0-flash with a system prompt and user prompt.
 * Returns the generated text string.
 * Enforces 1-second minimum between calls.
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  opts: GeminiOptions = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required for pipeline Gemini calls');
  }

  // Rate limiting
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxTokens ?? 256,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error (${response.status}): ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned no text content');
  }

  return text.trim();
}
