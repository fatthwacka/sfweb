/**
 * Step 3 — Verify the migration: every media object is reachable at its new public URL with the right
 * size, and no sfweb column still contains a Supabase storage URL.
 *
 *   node scripts/migrate-storage/03-verify.ts [--sample 500] [--concurrency 32] [--skip-http] [--skip-db]
 *
 * Exit code 1 on any failure — use as the cut-over gate.
 */
import {
  db, arg, flag, fmtBytes, mapLimit, readJson, mediaPublicUrl, MANIFEST_PATH, URL_COLUMNS_PATH,
  SUPABASE_STORAGE_PREFIX_RE_SOURCE, type Manifest, type UrlColumn,
} from './lib.ts';

const SAMPLE = Number(arg('sample', '0'));
const CONC = Number(arg('concurrency', '32'));

(async () => {
  let failures = 0;
  if (!flag('skip-http')) {
    const m = readJson<Manifest>(MANIFEST_PATH);
    let media = m.entries.filter(e => e.target === 'media');
    if (SAMPLE && media.length > SAMPLE) media = media.sort(() => Math.random() - 0.5).slice(0, SAMPLE);
    console.log(`HEAD-checking ${media.length} media URLs (concurrency ${CONC})`);
    let ok = 0;
    const bad: string[] = [];
    await mapLimit(media, CONC, async e => {
      const url = mediaPublicUrl(e.bucket, e.key);
      try {
        const r = await fetch(url, { method: 'HEAD' });
        const len = Number(r.headers.get('content-length') || -1);
        if (r.status !== 200) bad.push(`${r.status} ${url}`);
        else if (len !== e.size) bad.push(`size ${len}!=${e.size} ${url}`);
        else ok++;
      } catch (err: any) { bad.push(`${err.message} ${url}`); }
    });
    console.log(`  ok=${ok} bad=${bad.length}`);
    for (const b of bad.slice(0, 30)) console.log('  ' + b);
    if (bad.length > 30) console.log(`  … ${bad.length - 30} more`);
    failures += bad.length;
  }
  if (!flag('skip-db')) {
    const sql = db();
    const cols = readJson<UrlColumn[]>(URL_COLUMNS_PATH);
    let total = 0;
    for (const c of cols) {
      const r = await sql.unsafe(`select count(*)::int as n from "${c.table}" where "${c.column}"::text ~ $1`, [SUPABASE_STORAGE_PREFIX_RE_SOURCE]);
      if (r[0].n) { console.log(`  ${c.table}.${c.column}: ${r[0].n} rows still reference Supabase storage`); total += r[0].n; }
    }
    console.log(`DB check: ${total ? total + ' rows still on Supabase URLs' : 'no Supabase storage URLs remain in sfweb tables'}`);
    failures += total;
    await sql.end();
  }
  console.log(failures ? `\nVERIFY FAILED (${failures} problems)` : '\nVERIFY OK');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
