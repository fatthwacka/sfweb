/**
 * Step 0 — Inventory Supabase Storage and find every reference to it.
 *
 *   node scripts/migrate-storage/00-inventory.ts [--scope referenced|all] [--json <path>[,<path>]]
 *
 * - Lists every object in MIGRATE_BUCKETS straight from storage.objects (name, size, etag, mime).
 * - Scans every text/varchar/json/jsonb column of the sfweb tables (scripts/db/sfweb-tables.txt) and the
 *   site-config JSON file(s) for Supabase storage URLs, expanding image originals to their
 *   _optimized/_thumbnail siblings.
 * - Writes out/manifest.json (per-object target: media | archive) and out/url-columns.json (which
 *   table/columns must be rewritten in step 2), plus out/referenced-missing.json (dangling references).
 *
 * --scope all  → everything goes to the media bucket; default 'referenced' sends unreferenced objects
 * to the archive bucket.
 */
import path from 'node:path';
import fs from 'node:fs';
import {
  db, arg, flag, fmtBytes, readTableAllowlist, variantKeys, writeJson, REPO_ROOT, OUT_DIR,
  MANIFEST_PATH, URL_COLUMNS_PATH, SUPABASE_BUCKETS, SUPABASE_URL_RE, SUPABASE_STORAGE_PREFIX_RE_SOURCE,
  PROJECT_REF, GCS_MEDIA_BUCKET, GCS_ARCHIVE_BUCKET, MEDIA_PUBLIC_BASE, type Manifest, type ManifestEntry, type UrlColumn,
} from './lib.ts';

const scope = (arg('scope', 'referenced') as 'referenced' | 'all');
const jsonPaths = (arg('json', path.join(REPO_ROOT, 'server', 'data', 'site-config-overrides.json')) || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function decodeKey(k: string) { try { return decodeURIComponent(k); } catch { return k; } }

(async () => {
  const sql = db();
  const refs = new Map<string, number>();            // "bucket/key" -> count
  const addRef = (bucket: string, key: string) => refs.set(`${bucket}/${key}`, (refs.get(`${bucket}/${key}`) || 0) + 1);
  const scanText = (text: string) => {
    let n = 0;
    for (const m of text.matchAll(SUPABASE_URL_RE)) { addRef(m[1], decodeKey(m[2])); n++; }
    return n;
  };

  // 1. storage.objects
  console.log(`Listing storage.objects for buckets: ${SUPABASE_BUCKETS.join(', ')}`);
  const objects = await sql<{ bucket_id: string; name: string; size: string | null; etag: string | null; mimetype: string | null; updated_at: string | null }[]>`
    select bucket_id, name, metadata->>'size' as size, metadata->>'eTag' as etag, metadata->>'mimetype' as mimetype, updated_at::text
    from storage.objects where bucket_id = any(${SUPABASE_BUCKETS}) and name not like '%/' order by bucket_id, name`;
  console.log(`  ${objects.length} objects, ${fmtBytes(objects.reduce((a, o) => a + Number(o.size || 0), 0))}`);

  // 2. DB columns
  const tables = readTableAllowlist();
  const cols = await sql<{ table_name: string; column_name: string; data_type: string; udt_name: string }[]>`
    select table_name, column_name, data_type, udt_name from information_schema.columns
    where table_schema = 'public' and table_name = any(${tables})
      and (data_type in ('text','character varying','json','jsonb','character') or data_type = 'ARRAY')
    order by table_name, ordinal_position`;
  const pkCols = new Set((await sql<{ table_name: string }[]>`
    select table_name from information_schema.columns where table_schema='public' and column_name='id' and table_name = any(${tables})`).map(r => r.table_name));
  const prefixRe = SUPABASE_STORAGE_PREFIX_RE_SOURCE; // used as a POSIX regex in SQL (same syntax subset)
  const urlColumns: UrlColumn[] = [];
  for (const c of cols) {
    const rows = await sql.unsafe(`select ${pkCols.has(c.table_name) ? '"id"::text' : 'null'} as pk, "${c.column_name}"::text as v from "${c.table_name}" where "${c.column_name}"::text ~ $1`, [prefixRe]);
    if (!rows.length) continue;
    let found = 0;
    for (const r of rows) found += scanText(r.v);
    const castType = c.data_type === 'ARRAY' ? `${c.udt_name.replace(/^_/, '')}[]` : c.data_type === 'character varying' || c.data_type === 'character' ? 'text' : c.data_type;
    urlColumns.push({ table: c.table_name, column: c.column_name, dataType: c.data_type, castType, pk: pkCols.has(c.table_name) ? 'id' : null, rows: rows.length });
    console.log(`  ${c.table_name}.${c.column_name}: ${rows.length} rows, ${found} urls`);
  }

  // 3. JSON config files
  for (const p of jsonPaths) {
    if (!fs.existsSync(p)) { console.warn(`  (json not found, skipped) ${p}`); continue; }
    const n = scanText(fs.readFileSync(p, 'utf8'));
    console.log(`  ${path.relative(REPO_ROOT, p)}: ${n} urls`);
  }

  // 4. expand image variants + build manifest
  const byKey = new Map(objects.map(o => [`${o.bucket_id}/${o.name}`, o]));
  for (const k of [...refs.keys()]) {
    const slash = k.indexOf('/');
    const bucket = k.slice(0, slash), key = k.slice(slash + 1);
    for (const v of variantKeys(key)) if (byKey.has(`${bucket}/${v}`) && !refs.has(`${bucket}/${v}`)) refs.set(`${bucket}/${v}`, 0);
  }
  const missing = [...refs.keys()].filter(k => !byKey.has(k));
  const entries: ManifestEntry[] = objects.map(o => {
    const id = `${o.bucket_id}/${o.name}`;
    const referenced = refs.has(id);
    return {
      bucket: o.bucket_id, key: o.name, size: Number(o.size || 0), etag: o.etag, contentType: o.mimetype, lastModified: o.updated_at,
      referenced, refs: refs.get(id) || 0,
      target: referenced || scope === 'all' ? 'media' : 'archive', status: 'pending',
    };
  });
  const manifest: Manifest = { createdAt: new Date().toISOString(), projectRef: PROJECT_REF, mediaBucket: GCS_MEDIA_BUCKET, archiveBucket: GCS_ARCHIVE_BUCKET, mediaPublicBase: MEDIA_PUBLIC_BASE, scope, entries };
  writeJson(MANIFEST_PATH, manifest);
  writeJson(URL_COLUMNS_PATH, urlColumns);
  writeJson(path.join(OUT_DIR, 'referenced-missing.json'), missing);

  // 5. summary
  const sum = (f: (e: ManifestEntry) => boolean) => { const xs = entries.filter(f); return `${xs.length} obj / ${fmtBytes(xs.reduce((a, e) => a + e.size, 0))}`; };
  console.log('\n== Summary ==');
  for (const b of SUPABASE_BUCKETS) console.log(`${b.padEnd(16)} referenced ${sum(e => e.bucket === b && e.referenced).padEnd(22)} unreferenced ${sum(e => e.bucket === b && !e.referenced)}`);
  console.log(`TOTAL            → media bucket ${sum(e => e.target === 'media')} | archive bucket ${sum(e => e.target === 'archive')}`);
  console.log(`URL columns to rewrite: ${urlColumns.length}; dangling references (in DB but not in storage): ${missing.length}`);
  console.log(`\nWrote ${path.relative(REPO_ROOT, MANIFEST_PATH)}, url-columns.json, referenced-missing.json`);
  await sql.end();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
