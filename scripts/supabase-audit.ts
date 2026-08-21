/**
 * Supabase usage audit — the migration checklist for the Supabase offboarding.
 *
 *   node scripts/supabase-audit.ts            # writes SUPABASE_AUDIT.md + scripts/migrate-storage/out/supabase-audit.csv
 *   node scripts/supabase-audit.ts --summary  # counts only
 *
 * Scans server/, client/src/, shared/, scripts/ (excluding backups/generated files) and classifies every
 * Supabase call site:
 *   client     createClient(...)                       → should disappear except auth (client/src/lib/supabase.ts, server/supabase-auth.ts)
 *   table      .from('table') with a quoted name       → Drizzle (server) / fetch('/api/..') (client)
 *   storage    .storage.from('bucket') / storage ops   → server/media/media-store.ts (GCS)
 *   url        hard-coded '/storage/v1/object/public/' or '<ref>.supabase.co' strings
 *   auth       .auth.<method>(                         → allowed to remain (Supabase Auth stays)
 *   rpc        .rpc('fn')                              → plain SQL
 *   env        SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / *_ANON_KEY legacy env names
 * Re-run until only 'auth' rows remain.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SCAN_DIRS = ['server', 'client/src', 'shared', 'scripts'];
const SKIP_RE = /(node_modules|\/dist\/|\.backup|backup-|\/out\/|supabase-audit\.ts|migrate-storage\/|\.d\.ts$|database\.types\.ts)/;
const EXT_RE = /\.(ts|tsx|js|mjs|cjs)$/;

type Kind = 'client' | 'table' | 'storage' | 'url' | 'auth' | 'rpc' | 'env';
interface Hit { file: string; line: number; kind: Kind; detail: string; code: string }

const RULES: { kind: Kind; re: RegExp; detail: (m: RegExpExecArray) => string }[] = [
  { kind: 'client', re: /\bcreateClient\s*(<[^>]*>)?\s*\(/g, detail: () => 'createClient' },
  { kind: 'table', re: /\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g, detail: m => m[1] },
  { kind: 'storage', re: /\.storage\s*\.\s*(from|createBucket|listBuckets|getBucket|emptyBucket|deleteBucket)\s*\(\s*(?:['"`]([a-zA-Z0-9_-]+)['"`])?/g, detail: m => m[2] ? `${m[1]}:${m[2]}` : m[1] },
  { kind: 'storage', re: /\.(upload|getPublicUrl|createSignedUrl|createSignedUrls|download|remove|list|move|copy)\(\s*/g, detail: m => m[1] },
  { kind: 'url', re: /\/storage\/v1\/(object|render\/image)\/(public|sign)\//g, detail: m => `/storage/v1/${m[1]}/` },
  { kind: 'url', re: /[a-z]{20}\.supabase\.co/g, detail: m => m[0] },
  { kind: 'auth', re: /\.auth\s*\.\s*(admin\s*\.\s*)?([a-zA-Z]+)\s*\(/g, detail: m => (m[1] ? 'admin.' : '') + m[2] },
  { kind: 'rpc', re: /\.rpc\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g, detail: m => m[1] },
  { kind: 'env', re: /\b(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|VITE_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|SUPABASE_SERVICE_KEY)\b/g, detail: m => m[1] },
];

function* walk(dir: string): Generator<string> {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (SKIP_RE.test(p + (ent.isDirectory() ? '/' : ''))) continue;
    if (ent.isDirectory()) yield* walk(p);
    else if (EXT_RE.test(ent.name)) yield p;
  }
}

const hits: Hit[] = [];
for (const d of SCAN_DIRS) {
  const abs = path.join(ROOT, d);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const src = fs.readFileSync(file, 'utf8');
    const supabaseish = /supabase/i.test(src) || /storage\.googleapis/.test(src) === false && /\.storage\./.test(src);
    const lines = src.split('\n');
    lines.forEach((code, i) => {
      for (const r of RULES) {
        r.re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = r.re.exec(code))) {
          // Storage ops (upload/remove/list/...) are only Supabase when the file talks to supabase storage
          if (r.kind === 'storage' && !m[0].startsWith('.storage') && !/supabase[A-Za-z]*\s*\.\s*storage|\.storage\s*\.from\(/.test(src)) continue;
          // generic .remove(/.list(/.upload( also exist on other objects — keep only lines that mention storage or a bucket var
          if (r.kind === 'storage' && !m[0].startsWith('.storage') && !/storage|bucket/i.test(code)) continue;
          if (r.kind === 'table' && !supabaseish) continue;
          hits.push({ file: path.relative(ROOT, file), line: i + 1, kind: r.kind, detail: r.detail(m), code: code.trim().slice(0, 140) });
        }
      }
    });
  }
}

// Summaries
const byKind = new Map<Kind, number>();
const byFile = new Map<string, Hit[]>();
for (const h of hits) { byKind.set(h.kind, (byKind.get(h.kind) || 0) + 1); (byFile.get(h.file) || byFile.set(h.file, []).get(h.file)!).push(h); }
const tables = new Map<string, number>(); const buckets = new Map<string, number>();
for (const h of hits) {
  if (h.kind === 'table') tables.set(h.detail, (tables.get(h.detail) || 0) + 1);
  if (h.kind === 'storage' && h.detail.includes(':')) buckets.set(h.detail.split(':')[1], (buckets.get(h.detail.split(':')[1]) || 0) + 1);
}
const area = (f: string) => f.startsWith('client/') ? 'client' : f.startsWith('server/') ? 'server' : f.startsWith('shared/') ? 'shared' : 'scripts';
const byArea = new Map<string, Map<Kind, number>>();
for (const h of hits) { const a = area(h.file); if (!byArea.has(a)) byArea.set(a, new Map()); byArea.get(a)!.set(h.kind, (byArea.get(a)!.get(h.kind) || 0) + 1); }

const kinds: Kind[] = ['client', 'table', 'storage', 'url', 'auth', 'rpc', 'env'];
console.log(`Supabase audit: ${hits.length} call sites in ${byFile.size} files`);
console.log('area     ' + kinds.map(k => k.padStart(8)).join(''));
for (const [a, m] of [...byArea.entries()].sort()) console.log(a.padEnd(9) + kinds.map(k => String(m.get(k) || 0).padStart(8)).join(''));
console.log('TOTAL    ' + kinds.map(k => String(byKind.get(k) || 0).padStart(8)).join(''));
if (process.argv.includes('--summary')) process.exit(0);

const md: string[] = [];
md.push('# Supabase usage audit', '', `_Generated ${new Date().toISOString()} by \`node scripts/supabase-audit.ts\`. Re-run until only **auth** rows remain (Supabase Auth stays on the Free plan)._`, '');
md.push('## Totals', '', '| area | ' + kinds.join(' | ') + ' | total |', '|---|' + kinds.map(() => '---:').join('|') + '|---:|');
for (const [a, m] of [...byArea.entries()].sort()) md.push(`| ${a} | ` + kinds.map(k => m.get(k) || 0).join(' | ') + ` | ${[...m.values()].reduce((x, y) => x + y, 0)} |`);
md.push(`| **all** | ` + kinds.map(k => byKind.get(k) || 0).join(' | ') + ` | ${hits.length} |`, '');
md.push('## Tables referenced via supabase-js `.from()`', '', [...tables.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `\`${t}\` (${n})`).join(', '), '');
md.push('## Storage buckets', '', [...buckets.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `\`${t}\` (${n})`).join(', ') || '_none_', '');
md.push('## Files (most hits first)', '');
for (const [f, hs] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const counts = kinds.map(k => [k, hs.filter(h => h.kind === k).length] as const).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(', ');
  md.push(`### ${f} — ${hs.length} (${counts})`, '');
  md.push('| line | kind | detail | code |', '|---:|---|---|---|');
  for (const h of hs) md.push(`| ${h.line} | ${h.kind} | ${h.detail} | \`${h.code.replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`);
  md.push('');
}
fs.writeFileSync(path.join(ROOT, 'SUPABASE_AUDIT.md'), md.join('\n'));
const csvDir = path.join(ROOT, 'scripts', 'migrate-storage', 'out'); fs.mkdirSync(csvDir, { recursive: true });
fs.writeFileSync(path.join(csvDir, 'supabase-audit.csv'), 'file,line,kind,detail,code\n' + hits.map(h => [h.file, h.line, h.kind, h.detail, JSON.stringify(h.code)].join(',')).join('\n') + '\n');
console.log(`\nWrote SUPABASE_AUDIT.md and scripts/migrate-storage/out/supabase-audit.csv`);
