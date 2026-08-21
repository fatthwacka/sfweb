/**
 * Step 5 — Empty the sfweb Supabase Storage buckets (gallery-images, gallery-videos, preview-images,
 * brand-assets) so the project fits the Free plan. ONLY run after 04-reconcile.ts printed RECONCILE OK.
 * Other buckets (e.g. wh-agency-snapshots) are never touched. Objects are removed via the Storage API in
 * batches; storage.objects is re-counted afterwards.
 *
 *   node scripts/migrate-storage/05-empty-supabase-buckets.ts --yes [--only gallery-images]
 */
import { createClient } from '@supabase/supabase-js';
import { db, arg, flag, fmtBytes, SUPABASE_BUCKETS, SUPABASE_URL } from './lib.ts';

if (!flag('yes')) { console.error('Refusing without --yes (destructive). Run 04-reconcile.ts first.'); process.exit(2); }
const ONLY = arg('only');
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) throw new Error('SUPABASE_SECRET_KEY required');
const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const sql = db();
  const buckets = ONLY ? [ONLY] : SUPABASE_BUCKETS;
  for (const bucket of buckets) {
    const rows = await sql<{ name: string; size: string | null }[]>`select name, metadata->>'size' as size from storage.objects where bucket_id = ${bucket} and name not like '%/' order by name`;
    console.log(`${bucket}: ${rows.length} objects (${fmtBytes(rows.reduce((a, r) => a + Number(r.size || 0), 0))}) — removing`);
    let removed = 0, failed = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200).map(r => r.name);
      const { data, error } = await supabase.storage.from(bucket).remove(batch);
      if (error) { failed += batch.length; console.error(`  batch ${i}: ${error.message}`); continue; }
      removed += data?.length ?? batch.length;
      if ((i / 200) % 10 === 0) process.stdout.write(`  ${Math.min(i + 200, rows.length)}/${rows.length}\r`);
    }
    const left = await sql`select count(*)::int as n from storage.objects where bucket_id = ${bucket}`;
    console.log(`  removed=${removed} failed=${failed} remaining in storage.objects=${left[0].n}`);
  }
  const all = await sql`select bucket_id, count(*)::int as n, coalesce(sum((metadata->>'size')::bigint),0)::bigint as bytes from storage.objects group by 1 order by 1`;
  console.log('\nstorage.objects now:'); for (const r of all) console.log(`  ${r.bucket_id}: ${r.n} objects, ${fmtBytes(Number(r.bytes))}`);
  await sql.end();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
