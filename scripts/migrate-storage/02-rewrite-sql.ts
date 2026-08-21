/**
 * Step 2 — Rewrite Supabase storage URLs in the database (and site-config JSON) to the new media base.
 *
 *   node scripts/migrate-storage/02-rewrite-sql.ts            # generate out/rewrite.sql + out/rollback.sql only
 *   node scripts/migrate-storage/02-rewrite-sql.ts --apply    # also apply rewrite.sql in ONE transaction
 *   node scripts/migrate-storage/02-rewrite-sql.ts --json server/data/site-config-overrides.json --apply
 *
 * Every old value is copied to public._media_url_backup(tbl, col, pk, old_value, new_value) before the
 * UPDATE, and rollback.sql restores from it. Re-runnable (only rows still matching the Supabase prefix
 * are touched) — so it can be rerun later with a different MEDIA_PUBLIC_BASE (custom domain).
 * Refuses to apply unless 01-copy reports every 'media' object done (override with --force).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  db, arg, flag, readJson, MANIFEST_PATH, URL_COLUMNS_PATH, OUT_DIR, REPO_ROOT,
  SUPABASE_STORAGE_PREFIX_RE_SOURCE, MEDIA_PUBLIC_BASE, type Manifest, type UrlColumn,
} from './lib.ts';

const APPLY = flag('apply');
const FORCE = flag('force');
const jsonPaths = (arg('json', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

(async () => {
  const cols = readJson<UrlColumn[]>(URL_COLUMNS_PATH);
  const pattern = SUPABASE_STORAGE_PREFIX_RE_SOURCE;   // POSIX ERE compatible
  const replacement = `${MEDIA_PUBLIC_BASE}/`;
  const stmts: string[] = [];
  const rollback: string[] = [];
  stmts.push(`CREATE TABLE IF NOT EXISTS public._media_url_backup (
  id bigserial PRIMARY KEY, tbl text NOT NULL, col text NOT NULL, pk text, old_value text, new_value text,
  media_base text, rewritten_at timestamptz NOT NULL DEFAULT now());`);
  for (const c of cols) {
    const t = `"${c.table}"`, col = `"${c.column}"`;
    const expr = `regexp_replace(${col}::text, ${q(pattern)}, ${q(replacement)}, 'g')`;
    const where = `${col}::text ~ ${q(pattern)}`;
    stmts.push(`INSERT INTO public._media_url_backup (tbl, col, pk, old_value, new_value, media_base)
  SELECT ${q(c.table)}, ${q(c.column)}, ${c.pk ? `"${c.pk}"::text` : 'NULL'}, ${col}::text, ${expr}, ${q(MEDIA_PUBLIC_BASE)} FROM ${t} WHERE ${where};`);
    stmts.push(`UPDATE ${t} SET ${col} = (${expr})::${c.castType} WHERE ${where};`);
    rollback.push(c.pk
      ? `UPDATE ${t} x SET ${col} = b.old_value::${c.castType} FROM public._media_url_backup b WHERE b.tbl = ${q(c.table)} AND b.col = ${q(c.column)} AND b.media_base = ${q(MEDIA_PUBLIC_BASE)} AND x."${c.pk}"::text = b.pk;`
      : `UPDATE ${t} x SET ${col} = b.old_value::${c.castType} FROM public._media_url_backup b WHERE b.tbl = ${q(c.table)} AND b.col = ${q(c.column)} AND b.media_base = ${q(MEDIA_PUBLIC_BASE)} AND x.${col}::text = b.new_value;`);
  }
  const header = `-- generated ${new Date().toISOString()} by scripts/migrate-storage/02-rewrite-sql.ts\n-- pattern: ${pattern}\n-- replacement: ${replacement}\n`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'rewrite.sql'), `${header}BEGIN;\n${stmts.join('\n')}\nCOMMIT;\n`);
  fs.writeFileSync(path.join(OUT_DIR, 'rollback.sql'), `${header}BEGIN;\n${rollback.join('\n')}\nCOMMIT;\n`);
  console.log(`Generated out/rewrite.sql (${cols.length} columns) and out/rollback.sql`);

  // JSON files (site-config-overrides.json lives on the config volume in prod — pass its path)
  for (const p of jsonPaths) {
    const abs = path.isAbsolute(p) ? p : path.join(REPO_ROOT, p);
    if (!fs.existsSync(abs)) { console.warn(`json not found: ${abs}`); continue; }
    const src = fs.readFileSync(abs, 'utf8');
    const out = src.replace(new RegExp(pattern, 'g'), replacement);
    const n = (src.match(new RegExp(pattern, 'g')) || []).length;
    if (!APPLY) { console.log(`[json] ${p}: ${n} URL(s) would be rewritten`); continue; }
    if (n) { fs.copyFileSync(abs, `${abs}.bak-${Date.now()}`); fs.writeFileSync(abs, out); }
    console.log(`[json] ${p}: ${n} URL(s) rewritten${n ? ' (backup written alongside)' : ''}`);
  }

  if (!APPLY) { console.log('Dry run — re-run with --apply to execute rewrite.sql in a single transaction.'); return; }
  if (!FORCE) {
    const m = readJson<Manifest>(MANIFEST_PATH);
    const notDone = m.entries.filter(e => e.target === 'media' && e.status !== 'done').length;
    if (notDone) { console.error(`Refusing to apply: ${notDone} media objects not yet copied (01-copy). Use --force to override.`); process.exit(1); }
  }
  const sql = db();
  await sql.begin(async tx => { for (const s of stmts) await tx.unsafe(s); });
  const left = await sql.unsafe(`select count(*)::int as n from public._media_url_backup where media_base = $1`, [MEDIA_PUBLIC_BASE]);
  console.log(`Applied. ${left[0].n} values backed up in public._media_url_backup for base ${MEDIA_PUBLIC_BASE}. Run 03-verify.ts next.`);
  await sql.end();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
