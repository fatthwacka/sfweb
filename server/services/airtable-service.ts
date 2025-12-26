/**
 * Airtable Integration Service
 * Saves generated articles to Airtable for social media management
 */

import { GeneratedArticle } from './gemini-content-generator';

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

export class AirtableService {
  private airtableToken = process.env.AIRTABLE_TOKEN;
  private airtableBaseId = process.env.AIRTABLE_BASE_ID;
  private airtableTableId = process.env.AIRTABLE_TABLE_ID;
  private baseUrl: string;

  constructor() {
    if (!this.airtableToken || !this.airtableBaseId || !this.airtableTableId) {
      throw new Error('Airtable credentials not configured. Check AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_ID');
    }
    this.baseUrl = `https://api.airtable.com/v0/${this.airtableBaseId}/${this.airtableTableId}`;
  }

  async saveArticles(
    articles: GeneratedArticle[],
    sourceUrl: string,
    sourceTitle: string
  ): Promise<AirtableResponse> {
    console.log(`Saving ${articles.length} articles to Airtable`);

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

    for (const batch of batches) {
      try {
        const response = await this.createRecords(batch);
        allResponses.push(...response.records);
        console.log(`✅ Saved batch of ${batch.length} articles to Airtable`);
      } catch (error) {
        console.error(`❌ Failed to save batch to Airtable:`, error);
        throw error;
      }
    }

    return {
      records: allResponses
    };
  }

  private async createRecords(records: any[]): Promise<AirtableResponse> {
    const requestBody = {
      records,
      typecast: true // Allow Airtable to handle type conversions
    };

    // Retry logic for network timeouts
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Airtable save attempt ${attempt}/${maxRetries}`);
        console.log(`Saving to URL: ${this.baseUrl}`);
        console.log(`Records to save:`, records.length);
        
        // Removed AbortController which was causing connection issues
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.airtableToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
        }

        const result = await response.json();
        console.log(`✅ Airtable save successful on attempt ${attempt}, saved ${result.records?.length || 0} records`);
        return result;

      } catch (error: any) {
        lastError = error;
        console.log(`❌ Airtable attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
          console.log(`Retrying in ${delay}ms...`);
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

  // Test connection to Airtable
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Airtable connection...');
      console.log('URL:', `${this.baseUrl}?maxRecords=1`);
      console.log('Token:', this.airtableToken ? `${this.airtableToken.substring(0, 20)}...` : 'MISSING');
      
      // Simplified test without AbortController to isolate the issue
      const response = await fetch(`${this.baseUrl}?maxRecords=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.airtableToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Airtable connection test successful, records:', data.records?.length || 0);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Airtable connection test failed:', response.status, response.statusText);
        console.error('❌ Error body:', errorText);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Airtable connection test error:', error.message);
      console.error('❌ Error name:', error.name);
      if (error.cause) {
        console.error('❌ Error cause:', error.cause);
      }
      return false;
    }
  }

  // Get existing records (for debugging/verification)
  async getRecords(limit: number = 10): Promise<AirtableResponse> {
    const response = await fetch(`${this.baseUrl}?maxRecords=${limit}&sort%5B0%5D%5Bfield%5D=Created%20Date&sort%5B0%5D%5Bdirection%5D=desc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.airtableToken}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  }
}