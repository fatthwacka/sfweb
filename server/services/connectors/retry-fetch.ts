/**
 * Retry-aware fetch wrapper with exponential backoff.
 * Retries on 429 (rate limited), 5xx server errors, and network failures.
 * Respects Retry-After header from WordPress when present.
 */

interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function parseRetryAfter(response: Response): number | null {
  const header = response.headers.get('Retry-After');
  if (!header) return null;

  // Retry-After can be seconds (integer) or an HTTP-date
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) return seconds * 1000;

  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(0, date - Date.now());

  return null;
}

function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(exponential + jitter, config.maxDelayMs);
}

/**
 * Fetch with automatic retry on transient failures.
 * Same signature as native fetch, plus optional retry configuration.
 */
export async function retryFetch(
  url: string | URL,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  const config = { ...DEFAULT_CONFIG, ...retryConfig };

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!isRetryable(response.status) || attempt === config.maxRetries) {
        return response;
      }

      // Determine delay — prefer Retry-After header if present
      const retryAfter = parseRetryAfter(response);
      const delay = retryAfter ?? calculateDelay(attempt, config);

      console.log(
        `[retryFetch] ${response.status} on attempt ${attempt + 1}/${config.maxRetries + 1}, ` +
        `retrying in ${Math.round(delay)}ms: ${typeof url === 'string' ? url : url.toString()}`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      // Network errors (DNS failure, connection refused, timeout, etc.)
      if (attempt === config.maxRetries) {
        throw error;
      }

      const delay = calculateDelay(attempt, config);
      console.log(
        `[retryFetch] Network error on attempt ${attempt + 1}/${config.maxRetries + 1}, ` +
        `retrying in ${Math.round(delay)}ms: ${error instanceof Error ? error.message : 'Unknown'}`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should not reach here, but satisfy TypeScript
  throw new Error('retryFetch: exhausted all retries');
}
