/**
 * Step 4 — Reconcile Supabase storage.objects against what is actually in GCS (media + archive buckets)
 * before emptying the Supabase buckets. Every Supabase object must exist in exactly the expected GCS
 * bucket with the same byte size. Exit 1 on any mismatch.
 *
 *   node scripts/migrate-storage/04-reconcile.ts
 */
import { db, gcs, fmtBytes, SUPABASE_BUCKETS, GCS_MEDIA_BUCKET, GCS_ARCHIVE_BUCKET, gcsObjectName } from './lib.ts';

(async () => {
  const sql = db();
  const objects = await sql<{ bucket_id: string; name: string; size: string | null }[]>`
    select bucket_id, name, metadata->>'size' as size from storage.objects
    where bucket_id = any(${SUPABASE_BUCKETS}) and name not like '%/'`;
  console.log(`Supabase: ${objects.length} objects, ${fmtBytes(objects.reduce((a, o) => a + Number(o.size || 0), 0))}`);
  const storage = gcs();
  const inGcs = new Map<string, { bucket: string; size: number }>();
  for (const b of [GCS_MEDIA_BUCKET, GCS_ARCHIVE_BUCKET]) {
    const [files] = await storage.bucket(b).getFiles({ autoPaginate: true });
    for (const f of files) inGcs.set(f.name, { bucket: b, size: Number(f.metadata.size || 0) });
    console.log(`gs://${b}: ${files.length} objects, ${fmtBytes(files.reduce((a, f) => a + Number(f.metadata.size || 0), 0))}`);
  }
  const missing: string[] = [], sizeMismatch: string[] = [];
  const perBucket: Record<string, { n: number; bytes: number; media: number; archive: number }> = {};
  for (const o of objects) {
    const name = gcsObjectName(o.bucket_id, o.name);
    const g = inGcs.get(name);
    const pb = perBucket[o.bucket_id] ||= { n: 0, bytes: 0, media: 0, archive: 0 };
    pb.n++; pb.bytes += Number(o.size || 0);
    if (!g) { missing.push(name); continue; }
    if (g.size !== Number(o.size || 0)) sizeMismatch.push(`${name} supabase=${o.size} gcs=${g.size}`);
    if (g.bucket === GCS_MEDIA_BUCKET) pb.media++; else pb.archive++;
  }
  for (const [b, v] of Object.entries(perBucket)) console.log(`  ${b.padEnd(16)} ${String(v.n).padStart(5)} obj ${fmtBytes(v.bytes).padStart(10)}  → media ${v.media}, archive ${v.archive}`);
  console.log(`missing in GCS: ${missing.length}; size mismatches: ${sizeMismatch.length}`);
  for (const m of [...missing, ...sizeMismatch].slice(0, 20)) console.log('  ' + m);
  await sql.end();
  const ok = missing.length === 0 && sizeMismatch.length === 0;
  console.log(ok ? '\nRECONCILE OK — every Supabase object is present in GCS with matching size.' : '\nRECONCILE FAILED');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
