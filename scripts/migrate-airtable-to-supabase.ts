/**
 * Airtable to Supabase Migration Script
 *
 * Migrates all articles from Airtable to the new content_articles table in Supabase.
 *
 * Run with: npx tsx scripts/migrate-airtable-to-supabase.ts
 *
 * Prerequisites:
 * - AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID in .env
 * - SUPABASE_SECRET_KEY, VITE_SUPABASE_URL in .env
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// Validate environment
if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
  console.error('❌ Missing Airtable credentials in .env');
  console.error('   Required: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Airtable field mapping to Supabase columns
interface AirtableRecord {
  id: string;
  fields: {
    'Headline'?: string;
    'Hook'?: string;
    'Content'?: string;
    'Client'?: string;
    'Status'?: string;
    'Source URL'?: string;
    'Source Title'?: string;
    'Focus Angle'?: string;
    'Tone'?: string;
    'Word Count'?: number;
    'Image URL'?: string;
    'Image Placement'?: string;
    'Hashtags'?: string;
    'Notes'?: string;
    'Article Number'?: number;
    'Generated Date'?: string;
  };
  createdTime: string;
}

interface SupabaseArticle {
  headline: string;
  hook: string;
  content: string;
  client: string;
  status: string;
  source_url: string | null;
  source_title: string | null;
  focus_angle: string | null;
  tone: string | null;
  word_count: number | null;
  image_url: string | null;
  image_placement: string | null;
  hashtags: string | null;
  notes: string | null;
  airtable_id: string;
  created_at: string;
}

// Fetch all records from Airtable with pagination
async function fetchAllAirtableRecords(): Promise<AirtableRecord[]> {
  console.log('📥 Fetching records from Airtable...');

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  let pageCount = 0;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set('pageSize', '100');
    if (offset) {
      url.searchParams.set('offset', offset);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
    pageCount++;

    console.log(`   Page ${pageCount}: fetched ${data.records.length} records (total: ${allRecords.length})`);

    // Rate limiting - Airtable allows 5 requests per second
    if (offset) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } while (offset);

  console.log(`✅ Fetched ${allRecords.length} total records from Airtable`);
  return allRecords;
}

// Transform Airtable record to Supabase format
function transformRecord(record: AirtableRecord): SupabaseArticle | null {
  const fields = record.fields;

  // Skip records without required fields
  if (!fields['Headline'] || !fields['Hook'] || !fields['Content']) {
    console.log(`   ⚠️ Skipping record ${record.id} - missing required fields`);
    return null;
  }

  // Map status values (ensure valid enum)
  let status = fields['Status'] || 'Draft';
  const validStatuses = ['Draft', 'Published', 'Edited', 'Rejected', 'Scheduled'];
  if (!validStatuses.includes(status)) {
    console.log(`   ⚠️ Invalid status "${status}" for record ${record.id}, defaulting to Draft`);
    status = 'Draft';
  }

  return {
    headline: fields['Headline'],
    hook: fields['Hook'],
    content: fields['Content'],
    client: fields['Client'] || 'Unknown',
    status: status,
    source_url: fields['Source URL'] || null,
    source_title: fields['Source Title'] || null,
    focus_angle: fields['Focus Angle'] || null,
    tone: fields['Tone'] || null,
    word_count: fields['Word Count'] || null,
    image_url: fields['Image URL'] || null,
    image_placement: fields['Image Placement'] || null,
    hashtags: fields['Hashtags'] || null,
    notes: fields['Notes'] || null,
    airtable_id: record.id,
    created_at: fields['Generated Date']
      ? new Date(fields['Generated Date']).toISOString()
      : record.createdTime
  };
}

// Insert records into Supabase in batches
async function insertIntoSupabase(articles: SupabaseArticle[]): Promise<{ inserted: number; errors: number }> {
  console.log(`\n📤 Inserting ${articles.length} records into Supabase...`);

  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(articles.length / BATCH_SIZE);

    console.log(`   Batch ${batchNumber}/${totalBatches}: inserting ${batch.length} records...`);

    const { data, error } = await supabase
      .from('content_articles')
      .upsert(batch, {
        onConflict: 'airtable_id',
        ignoreDuplicates: false
      })
      .select('id');

    if (error) {
      console.error(`   ❌ Batch ${batchNumber} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += data?.length || batch.length;
      console.log(`   ✅ Batch ${batchNumber} complete`);
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { inserted, errors };
}

// Main migration function
async function migrate() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AIRTABLE → SUPABASE MIGRATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Airtable Base: ${AIRTABLE_BASE_ID}`);
  console.log(`  Airtable Table: ${AIRTABLE_TABLE_ID}`);
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check if table exists and is empty
    const { count, error: countError } = await supabase
      .from('content_articles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Cannot access content_articles table:', countError.message);
      console.error('   Make sure you ran the table creation SQL first!');
      process.exit(1);
    }

    console.log(`📊 Current Supabase content_articles count: ${count || 0}`);

    if (count && count > 0) {
      console.log('\n⚠️  WARNING: Table already has data!');
      console.log('   This migration will UPSERT records (update existing, insert new).');
      console.log('   Records are matched by airtable_id field.\n');
    }

    // Step 2: Fetch from Airtable
    const airtableRecords = await fetchAllAirtableRecords();

    if (airtableRecords.length === 0) {
      console.log('⚠️ No records found in Airtable. Nothing to migrate.');
      process.exit(0);
    }

    // Step 3: Transform records
    console.log('\n🔄 Transforming records...');
    const transformedArticles: SupabaseArticle[] = [];
    let skipped = 0;

    for (const record of airtableRecords) {
      const transformed = transformRecord(record);
      if (transformed) {
        transformedArticles.push(transformed);
      } else {
        skipped++;
      }
    }

    console.log(`✅ Transformed ${transformedArticles.length} records (${skipped} skipped)`);

    // Step 4: Insert into Supabase
    const { inserted, errors } = await insertIntoSupabase(transformedArticles);

    // Step 5: Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  📥 Fetched from Airtable: ${airtableRecords.length}`);
    console.log(`  🔄 Transformed: ${transformedArticles.length}`);
    console.log(`  ⏭️  Skipped (missing data): ${skipped}`);
    console.log(`  ✅ Inserted/Updated: ${inserted}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Verify final count
    const { count: finalCount } = await supabase
      .from('content_articles')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Final Supabase content_articles count: ${finalCount}`);

    if (errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
