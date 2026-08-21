/**
 * Shared helpers for the Supabase Storage → Google Cloud Storage migration.
 *
 * Scripts (run in order):
 *   00-inventory.ts   enumerate storage.objects + find every DB/JSON reference → out/manifest.json
 *   01-copy.ts        stream objects Supabase → GCS (referenced → media bucket, rest → archive bucket)
 *   02-rewrite-sql.ts generate + apply URL rewrite SQL (with backup table + rollback.sql)
 *   03-verify.ts      HEAD every new URL and confirm no Supabase storage URLs remain in the DB
 *
 * Run with:  node scripts/migrate-storage/<script>.ts [flags]   (Node ≥22.18 strips types natively; inside the
 *            app container `npx tsx …` also works — local node_modules/esbuild is Linux-built so tsx fails on the Mac)
 * Env (from .env): DATABASE_URL, VITE_SUPABASE_URL, GOOGLE_PROJECT_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL,
 *   GOOGLE_PRIVATE_KEY, optional GCS_MEDIA_BUCKET, GCS_ARCHIVE_BUCKET, MEDIA_PUBLIC_BASE, MIGRATE_BUCKETS,
 *   DATABASE_SSL=false to disable TLS (local Postgres).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { Storage } from '@google-cloud/storage';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const OUT_DIR = path.join(__dirname, 'out');
export const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');
export const URL_COLUMNS_PATH = path.join(OUT_DIR, 'url-columns.json');
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is required');
export const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];
export const SUPABASE_HOST = new URL(SUPABASE_URL).hostname;

export const SUPABASE_BUCKETS = (process.env.MIGRATE_BUCKETS || 'gallery-images,gallery-videos,preview-images,brand-assets')
  .split(',').map(s => s.trim()).filter(Boolean);

export const GCS_MEDIA_BUCKET = process.env.GCS_MEDIA_BUCKET || 'sfweb-media';
export const GCS_ARCHIVE_BUCKET = process.env.GCS_ARCHIVE_BUCKET || 'sfweb-media-archive';
export const MEDIA_PUBLIC_BASE = (process.env.MEDIA_PUBLIC_BASE || `https://storage.googleapis.com/${GCS_MEDIA_BUCKET}`).replace(/\/$/, '');
export const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** Prefix shared by every Supabase storage URL form we have seen in data/code. */
export const SUPABASE_STORAGE_PREFIX_RE_SOURCE = `https://${PROJECT_REF.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.supabase\\.co/storage/v1/(?:object|render/image)/(?:public|sign)/`;
/** Full URL matcher with bucket + key capture groups (key is URL-encoded as stored). */
export const SUPABASE_URL_RE = new RegExp(
  SUPABASE_STORAGE_PREFIX_RE_SOURCE + `([a-z0-9][a-z0-9._-]*)/([^\\s"'<>)\\]\\\\?]+)`,
  'g',
);

export interface ManifestEntry {
  bucket: string;            // Supabase bucket id
  key: string;               // object name (decoded)
  size: number;              // bytes, from storage.objects metadata
  etag: string | null;
  contentType: string | null;
  lastModified: string | null;
  referenced: boolean;       // referenced by a DB column / site-config JSON (incl. derived _optimized/_thumbnail)
  refs: number;              // number of referencing values found
  target: 'media' | 'archive' | 'skip';
  status: 'pending' | 'done' | 'failed';
  attempts?: number;
  error?: string;
  gcsBucket?: string;
  gcsName?: string;
}

export interface Manifest {
  createdAt: string;
  projectRef: string;
  mediaBucket: string;
  archiveBucket: string;
  mediaPublicBase: string;
  scope: 'referenced' | 'all';
  entries: ManifestEntry[];
}

export interface UrlColumn {
  table: string;
  column: string;
  dataType: string;      // information_schema.columns.data_type
  castType: string;      // SQL type to cast back to after regexp_replace on ::text
  pk: string | null;     // 'id' when present, else null
  rows: number;          // rows containing at least one Supabase storage URL
}

export function readJson<T>(p: string, fallback?: T): T {
  if (!fs.existsSync(p)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing ${p} — run the previous step first`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}
export function writeJson(p: string, data: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, p);
}

export function encodeKey(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}
export function supabasePublicUrl(bucket: string, key: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeKey(key)}`;
}
export function gcsObjectName(bucket: string, key: string) {
  return `${bucket}/${key}`;
}
export function mediaPublicUrl(bucket: string, key: string) {
  return `${MEDIA_PUBLIC_BASE}/${bucket}/${encodeKey(key)}`;
}

/** Postgres client (postgres-js). Works against the Supabase pooler or a local container. */
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const sslOff = process.env.DATABASE_SSL === 'false' || /localhost|127\.0\.0\.1|@postgres:/.test(url);
  return postgres(url, { ssl: sslOff ? false : 'require', prepare: false, max: 4, idle_timeout: 20 });
}

/** GCS client using the same service-account env vars the Vertex/Veo services use. */
export function gcs() {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!projectId || !client_email || !private_key) throw new Error('GOOGLE_PROJECT_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY are required');
  return new Storage({ projectId, credentials: { client_email, private_key } });
}

export function readTableAllowlist(): string[] {
  const p = path.join(REPO_ROOT, 'scripts', 'db', 'sfweb-tables.txt');
  return fs.readFileSync(p, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}

export function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : 'true';
}
export function flag(name: string) { return process.argv.includes(`--${name}`); }

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const u = ['KB', 'MB', 'GB', 'TB']; let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(n < 10 ? 2 : 1)} ${u[i]}`;
}

/** Derive the sibling variant keys the app expects next to an original image key. */
export function variantKeys(key: string): string[] {
  const m = key.match(/^(.*)\.([^./]+)$/);
  if (!m) return [];
  const [, base, ext] = m;
  if (/_(optimized|thumbnail)$/.test(base)) return [];
  return [`${base}_optimized.${ext}`, `${base}_thumbnail.${ext}`];
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
