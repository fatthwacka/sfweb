/**
 * Step 1 — Stream every object from Supabase Storage (public URL) into GCS.
 *
 *   node scripts/migrate-storage/01-copy.ts [--dry-run] [--concurrency 12] [--only gallery-videos]
 *                                              [--target media|archive] [--limit N] [--retry-failed]
 *
 * Idempotent/resumable: objects already present in GCS with the same size are marked done and skipped;
 * progress is persisted to out/manifest.json every 50 objects; failures go to out/failed.json and can be
 * retried by re-running (optionally with --retry-failed to reset their status first).
 * Safe to run while the site is live — Supabase objects are only read.
 */
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  gcs, arg, flag, fmtBytes, mapLimit, readJson, writeJson, supabasePublicUrl, gcsObjectName,
  MANIFEST_PATH, OUT_DIR, MEDIA_CACHE_CONTROL, type Manifest, type ManifestEntry,
} from './lib.ts';

const DRY = flag('dry-run');
const CONC = Number(arg('concurrency', '12'));
const ONLY = arg('only');
const TARGET = arg('target');
const LIMIT = Number(arg('limit', '0'));
const MAX_ATTEMPTS = 5;

(async () => {
  const manifest = readJson<Manifest>(MANIFEST_PATH);
  if (flag('retry-failed')) for (const e of manifest.entries) if (e.status === 'failed') { e.status = 'pending'; e.error = undefined; }
  const storage = gcs();
  const buckets = { media: storage.bucket(manifest.mediaBucket), archive: storage.bucket(manifest.archiveBucket) };

  // Pre-list existing GCS objects so re-runs skip quickly.
  const existing = new Map<string, number>();
  for (const [t, b] of Object.entries(buckets)) {
    const [files] = await b.getFiles({ autoPaginate: true });
    for (const f of files) existing.set(`${t}:${f.name}`, Number(f.metadata.size || 0));
    console.log(`gs://${b.name}: ${files.length} objects already present`);
  }

  let todo = manifest.entries.filter(e => e.target !== 'skip' && e.status !== 'done');
  if (ONLY) todo = todo.filter(e => e.bucket === ONLY);
  if (TARGET) todo = todo.filter(e => e.target === TARGET);
  if (LIMIT) todo = todo.slice(0, LIMIT);
  const totalBytes = todo.reduce((a, e) => a + e.size, 0);
  console.log(`${todo.length} objects to copy (${fmtBytes(totalBytes)}), concurrency ${CONC}${DRY ? ' [DRY RUN]' : ''}`);

  let done = 0, bytes = 0, failed = 0, skipped = 0, sinceSave = 0;
  const started = Date.now();
  const save = () => { writeJson(MANIFEST_PATH, manifest); sinceSave = 0; };
  const progress = () => {
    const secs = (Date.now() - started) / 1000;
    console.log(`  ${done + skipped + failed}/${todo.length} done=${done} skipped=${skipped} failed=${failed} ${fmtBytes(bytes)} @ ${fmtBytes(bytes / Math.max(secs, 1))}/s`);
  };

  const copyOne = async (e: ManifestEntry) => {
    const bucket = buckets[e.target as 'media' | 'archive'];
    const name = gcsObjectName(e.bucket, e.key);
    e.gcsBucket = bucket.name; e.gcsName = name;
    const have = existing.get(`${e.target}:${name}`);
    if (have !== undefined && have === e.size) { e.status = 'done'; skipped++; return; }
    if (DRY) { skipped++; return; }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      e.attempts = attempt;
      try {
        const res = await fetch(supabasePublicUrl(e.bucket, e.key));
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} from Supabase`);
        const len = Number(res.headers.get('content-length') || e.size);
        const file = bucket.file(name);
        await pipeline(
          Readable.fromWeb(res.body as any),
          file.createWriteStream({
            resumable: e.size > 8 * 1024 * 1024,
            metadata: { contentType: e.contentType || res.headers.get('content-type') || 'application/octet-stream', cacheControl: MEDIA_CACHE_CONTROL, metadata: { source: `supabase:${e.bucket}/${e.key}`, etag: e.etag || '' } },
          }),
        );
        const [meta] = await file.getMetadata();
        const got = Number(meta.size || 0);
        if (got !== e.size && got !== len) throw new Error(`size mismatch: gcs=${got} expected=${e.size}`);
        e.status = 'done'; e.error = undefined; bytes += got; done++;
        return;
      } catch (err: any) {
        e.error = String(err?.message || err);
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
    e.status = 'failed'; failed++;
    console.warn(`  FAILED ${e.bucket}/${e.key}: ${e.error}`);
  };

  await mapLimit(todo, CONC, async (e, i) => {
    await copyOne(e);
    if (++sinceSave >= 50) { save(); progress(); }
  });
  save(); progress();
  writeJson(path.join(OUT_DIR, 'failed.json'), manifest.entries.filter(e => e.status === 'failed'));
  console.log(`\n${failed ? 'Some objects failed — re-run to retry (see out/failed.json).' : 'All objects copied.'}`);
  if (failed) process.exit(1);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
