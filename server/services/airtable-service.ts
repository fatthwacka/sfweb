/**
 * Airtable Integration Service
 * Saves generated articles to Airtable for social media management
 * Uses connection pooling pattern similar to our robust Supabase implementation
 */

import { GeneratedArticle } from './gemini-content-generator';
import { Agent } from 'undici';

export interface AirtableRecord {
  'Headline': string;
  'Hook': string;
  'Client': string;
  'Content': string;
  'Focus Angle': string;
  'Tone': string;
  'Word Count': number;
  'Image URL': string;
  'Image Placement': string;
  'Status': string;
  'Generated Date': string;
  'Source URL': string;
  'Source Title': string;
  'Hashtags': string;
  'Notes'?: string;
}

export interface AirtableResponse {
  records: Array<{
    id: string;
    fields: AirtableRecord;
    createdTime: string;
  }>;
}

// Robust connection pattern with fallback - more resilient than pure singleton
class AirtableConnectionManager {
  private static instance: AirtableConnectionManager;
  private agent: Agent | null = null;
  private baseUrl: string;
  private headers: Record<string, string>;
  private lastResetTime: number = 0;
  private readonly RESET_INTERVAL = 120000; // Reset connections every 2 minutes (more conservative)

  private constructor() {
    // Validate environment variables at startup
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;

    if (!token || !baseId || !tableId) {
      throw new Error('Airtable credentials not configured. Check AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_ID');
    }

    this.baseUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    this.initializeAgent();
    console.log('✅ Airtable connection manager initialized with robust agent');
  }

  private initializeAgent() {
    // Close existing agent if it exists
    if (this.agent) {
      this.agent.destroy();
    }

    // Create ultra-conservative agent optimized for complex payload reliability
    this.agent = new Agent({
      keepAliveTimeout: 10000,   // Longer timeout for complex operations
      keepAliveMaxTimeout: 30000, // Allow more time for large payloads
      connections: 2,            // Minimal connections to prevent overload
      pipelining: 0,             // Disable pipelining for maximum reliability
      headersTimeout: 30000,     // Longer header timeout for Docker networking
      bodyTimeout: 60000,        // Longer body timeout for complex content
      connect: {
        timeout: 15000           // Conservative connection timeout
      }
    });

    this.lastResetTime = Date.now();
    console.log('🔄 Conservative Airtable agent initialized for complex operations');
  }

  static getInstance(): AirtableConnectionManager {
    if (!AirtableConnectionManager.instance) {
      AirtableConnectionManager.instance = new AirtableConnectionManager();
    }
    return AirtableConnectionManager.instance;
  }

  getConnectionConfig() {
    // Reset agent periodically to prevent stale connections
    const now = Date.now();
    if (now - this.lastResetTime > this.RESET_INTERVAL) {
      console.log('🔄 Resetting Airtable agent for fresh connections');
      this.initializeAgent();
    }

    return {
      agent: this.agent,
      baseUrl: this.baseUrl,
      headers: this.headers,
      useFallback: false, // Track if we should fallback to no-agent
    };
  }

  // Fallback method for when agent fails
  getFallbackConfig() {
    return {
      agent: null,
      baseUrl: this.baseUrl,
      headers: this.headers,
      useFallback: true,
    };
  }
}

export class AirtableService {
  private connectionManager: AirtableConnectionManager;

  constructor() {
    // Use singleton connection manager (like our Supabase pattern)
    this.connectionManager = AirtableConnectionManager.getInstance();
  }

  async saveArticles(
    articles: GeneratedArticle[],
    sourceUrl: string,
    sourceTitle: string
  ): Promise<AirtableResponse> {
    console.log(`Saving ${articles.length} articles to Airtable with proper rate limiting`);

    // Prepare records for Airtable (matching exact n8n workflow mapping)
    const records = articles.map((article, index) => ({
      fields: {
        'Headline': article.headline,
        'Hook': article.hook,
        'Client': article.clientName,
        'Content': article.content,
        'Focus Angle': article.focusAngle,
        'Tone': article.tone,
        'Word Count': article.wordCount,
        'Image URL': article.assignedImageUrl || '',
        'Image Placement': article.imagePlacement || 'Professional context illustration',
        'Status': 'Draft',
        'Generated Date': new Date().toISOString().split('T')[0],
        'Source URL': sourceUrl,
        'Source Title': sourceTitle,
        'Hashtags': article.hashtags ? article.hashtags.join(' ') : ''
      }
    }));

    // Airtable allows max 10 records per batch
    const batches = this.chunkArray(records, 10);
    const allResponses: any[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      try {
        console.log(`📦 Processing batch ${batchNumber}/${batches.length} (${batch.length} records)`);
        
        const response = await this.createRecordsWithThrottling(batch);
        allResponses.push(...response.records);
        console.log(`✅ Batch ${batchNumber} saved successfully`);
        
        // CRITICAL: Rate limiting compliance (5 requests per second = 200ms minimum delay)
        // Add 300ms delay between batches to ensure we never exceed limits
        if (i < batches.length - 1) {
          console.log(`⏱️ Waiting 300ms before next batch (rate limit compliance)`);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
      } catch (error) {
        console.error(`❌ Failed to save batch ${batchNumber} to Airtable:`, error);
        throw error;
      }
    }

    console.log(`🎉 Successfully saved all ${allResponses.length} articles to Airtable`);
    return {
      records: allResponses
    };
  }

  private async createRecordsWithThrottling(records: any[]): Promise<AirtableResponse> {
    const requestBody = {
      records,
      typecast: true // Allow Airtable to handle type conversions
    };

    // Use exponential backoff retry pattern for robust connection handling
    return await this.executeWithExponentialBackoff(requestBody);
  }

  private async createRecords(records: any[]): Promise<AirtableResponse> {
    // Legacy method kept for backward compatibility
    return await this.createRecordsWithThrottling(records);
  }

  private async executeWithExponentialBackoff(requestBody: any): Promise<AirtableResponse> {
    const maxAttempts = 4; // Increased for robustness
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Airtable request attempt ${attempt}/${maxAttempts}`);
        
        // First try persistent connection, then fallback to direct
        const useAgent = attempt <= 2;
        const response = await this.attemptWithConnection(requestBody, useAgent, attempt);
        
        console.log(`✅ Airtable request successful on attempt ${attempt}`);
        return response;
        
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error (429)
        if (error.message.includes('429')) {
          console.warn(`⚠️ Rate limit hit, waiting 30 seconds as per Airtable requirements`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }
        
        // Check if it's a timeout error
        const isTimeoutError = error.code === 'ETIMEDOUT' || 
                              error.message.includes('timeout') || 
                              error.message.includes('ETIMEDOUT');
        
        if (isTimeoutError && attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.warn(`⏱️ Timeout error on attempt ${attempt}, retrying in ${delay}ms`);
          console.warn(`Error details:`, {
            message: error.message,
            code: error.code,
            name: error.name
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If not a timeout/rate limit error, or last attempt, throw immediately
        if (!isTimeoutError || attempt === maxAttempts) {
          console.error(`❌ Non-recoverable error or final attempt failed:`, {
            message: error.message,
            code: error.code,
            attempt: attempt
          });
          break;
        }
      }
    }

    throw lastError;
  }

  private async attemptWithConnection(requestBody: any, useAgent: boolean, attempt: number = 1): Promise<AirtableResponse> {
    const config = useAgent 
      ? this.connectionManager.getConnectionConfig()
      : this.connectionManager.getFallbackConfig();
    
    const maxAttempts = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Airtable ${useAgent ? 'persistent' : 'direct'} connection attempt ${attempt}/${maxAttempts}`);
        console.log(`Saving to: ${config.baseUrl}`);
        console.log(`Records: ${requestBody.records.length}`);
        
        const fetchOptions: any = {
          method: 'POST',
          headers: {
            ...config.headers,
            'User-Agent': 'SlyFox-ContentGenerator/1.0' // Identify our requests
          },
          body: JSON.stringify(requestBody),
          // Add explicit timeouts for Docker networking
          signal: AbortSignal.timeout(useAgent ? 45000 : 30000), // Longer timeout for agent connections
        };

        // Only add dispatcher if using agent
        if (useAgent && config.agent) {
          fetchOptions.dispatcher = config.agent;
        }

        console.log(`📡 Making ${useAgent ? 'persistent' : 'direct'} request to Airtable (${requestBody.records.length} records)`);
        const response = await fetch(config.baseUrl, fetchOptions);
        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Airtable API error:`, errorData);
          throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
        }

        const result = await response.json();
        console.log(`✅ Airtable ${useAgent ? 'persistent' : 'direct'} save successful, saved ${result.records?.length || 0} records`);
        return result;

      } catch (error: any) {
        lastError = error;
        console.error(`❌ ${useAgent ? 'Persistent' : 'Direct'} attempt ${attempt} failed:`, {
          message: error.message,
          name: error.name,
          code: error.code || 'No code',
          cause: error.cause?.message || error.cause?.code || 'No cause details'
        });
        
        if (attempt < maxAttempts) {
          const delay = 2000 * attempt; // 2s, 4s
          console.log(`Retrying ${useAgent ? 'persistent' : 'direct'} connection in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private formatLinkedInPost(article: GeneratedArticle): string {
    // Format the complete LinkedIn post
    let post = `${article.hook}\n\n${article.content}`;
    
    // Add hashtags
    if (article.hashtags && article.hashtags.length > 0) {
      post += `\n\n${article.hashtags.join(' ')}`;
    }

    return post;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Test connection to Airtable using persistent connection
  async testConnection(): Promise<boolean> {
    try {
      const { agent, baseUrl, headers } = this.connectionManager.getConnectionConfig();
      const testUrl = `${baseUrl}?maxRecords=1`;
      
      console.log('Testing Airtable persistent connection...');
      console.log('URL:', testUrl);
      console.log('Using persistent connection agent');
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        dispatcher: agent, // Use persistent connection pool
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Airtable persistent connection test successful, records:', data.records?.length || 0);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Airtable persistent connection test failed:', response.status, response.statusText);
        console.error('❌ Error body:', errorText);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Airtable persistent connection test error:', {
        message: error.message,
        name: error.name,
        cause: error.cause?.message || 'No cause details'
      });
      return false;
    }
  }

  // Get existing records using persistent connection (for debugging/verification)
  async getRecords(limit: number = 10): Promise<AirtableResponse> {
    const { agent, baseUrl, headers } = this.connectionManager.getConnectionConfig();
    const url = `${baseUrl}?maxRecords=${limit}&sort%5B0%5D%5Bfield%5D=Generated%20Date&sort%5B0%5D%5Bdirection%5D=desc`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': headers.Authorization, // Only need auth header for GET
      },
      dispatcher: agent, // Use persistent connection pool
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  }
}