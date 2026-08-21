/**
 * media-store — the single place the server talks to object storage for gallery images, gallery
 * videos, preview images and brand assets.
 *
 * Backend: Google Cloud Storage bucket GCS_MEDIA_BUCKET (default `sfweb-media`, public-read, uniform
 * access). Objects are stored as `<legacy-supabase-bucket>/<key>` so the key layout from the Supabase
 * era (`gallery-images/shoots/<shootId>/<file>`, `gallery-videos/<shootId>/<file>`, …) is unchanged and
 * the client-side `_optimized` / `_thumbnail` suffix logic (client/src/lib/image-utils.ts) keeps working.
 *
 * Public URL: `${MEDIA_PUBLIC_BASE}/<bucket>/<key>` where MEDIA_PUBLIC_BASE defaults to
 * `https://storage.googleapis.com/<GCS_MEDIA_BUCKET>`. DB rows store the absolute public URL (as before).
 *
 * `parseMediaUrl()` understands BOTH the new URLs and legacy `https://<ref>.supabase.co/storage/v1/...`
 * URLs, so delete / download / metadata code works for rows that have not been rewritten yet.
 *
 * Credentials: the same service-account env vars used by the Vertex/Veo services
 * (GOOGLE_PROJECT_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY).
 */
import { Storage, type Bucket, type File } from '@google-cloud/storage';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';

export type MediaBucket = 'gallery-images' | 'gallery-videos' | 'preview-images' | 'brand-assets' | (string & {});

export const GCS_MEDIA_BUCKET = process.env.GCS_MEDIA_BUCKET || 'sfweb-media';
export const MEDIA_PUBLIC_BASE = (process.env.MEDIA_PUBLIC_BASE || `https://storage.googleapis.com/${GCS_MEDIA_BUCKET}`).replace(/\/$/, '');
export const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const RESUMABLE_THRESHOLD = 8 * 1024 * 1024;

const LEGACY_SUPABASE_RE = /^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/(?:object|render\/image)\/(?:public|sign)\/([a-z0-9][a-z0-9._-]*)\/([^?#]+)/i;
const GCS_RE = new RegExp(`^https?://storage\\.googleapis\\.com/${GCS_MEDIA_BUCKET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([a-z0-9][a-z0-9._-]*)/([^?#]+)`, 'i');
const BASE_RE = new RegExp(`^${MEDIA_PUBLIC_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([a-z0-9][a-z0-9._-]*)/([^?#]+)`, 'i');

export interface MediaObjectInfo {
  bucket: MediaBucket;
  key: string;          // full key within the bucket, e.g. shoots/<id>/file.jpg
  name: string;         // basename
  size: number;
  contentType: string | null;
  updatedAt: string | null;
  publicUrl: string;
}

export interface PutOptions {
  contentType?: string;
  cacheControl?: string;
  /** false (default) refuses to overwrite an existing object — mirrors Supabase `upsert: false`. */
  upsert?: boolean;
  metadata?: Record<string, string>;
}

let _storage: Storage | null = null;
function storage(): Storage {
  if (_storage) return _storage;
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!projectId || !client_email || !private_key) {
    throw new Error('media-store: GOOGLE_PROJECT_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY are required');
  }
  _storage = new Storage({ projectId, credentials: { client_email, private_key } });
  return _storage;
}
function bucket(): Bucket { return storage().bucket(GCS_MEDIA_BUCKET); }

export function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}
function decodeKey(key: string): string {
  try { return decodeURIComponent(key); } catch { return key; }
}
export function objectName(b: MediaBucket, key: string): string {
  return `${b}/${key.replace(/^\/+/, '')}`;
}
function file(b: MediaBucket, key: string): File { return bucket().file(objectName(b, key)); }

/** Absolute public URL for an object. */
export function publicUrl(b: MediaBucket, key: string): string {
  return `${MEDIA_PUBLIC_BASE}/${b}/${encodeKey(key.replace(/^\/+/, ''))}`;
}

/** True for URLs served by this store (new or legacy Supabase form). */
export function isManagedMediaUrl(url: string | null | undefined): boolean {
  return !!url && (BASE_RE.test(url) || GCS_RE.test(url) || LEGACY_SUPABASE_RE.test(url));
}

/**
 * Resolve a stored value to { bucket, key }. Accepts new public URLs, legacy Supabase URLs, and bare
 * keys when `defaultBucket` is given (e.g. preview_images.supabase_storage_path). Returns null otherwise.
 */
export function parseMediaUrl(value: string | null | undefined, defaultBucket?: MediaBucket): { bucket: MediaBucket; key: string } | null {
  if (!value) return null;
  const m = BASE_RE.exec(value) || GCS_RE.exec(value) || LEGACY_SUPABASE_RE.exec(value);
  if (m) return { bucket: m[1], key: decodeKey(m[2]) };
  if (defaultBucket && !/^https?:\/\//i.test(value)) return { bucket: defaultBucket, key: value.replace(/^\/+/, '') };
  return null;
}

/** Keys of the three stored versions of a gallery image (original, _optimized, _thumbnail). */
export function imageVariantKeys(originalKey: string): string[] {
  const opt = originalKey.replace(/\.([^./]+)$/, '_optimized.$1');
  const thumb = originalKey.replace(/\.([^./]+)$/, '_thumbnail.$1');
  return opt === originalKey ? [originalKey] : [originalKey, opt, thumb];
}
/** URL of a stored image variant (mirrors client/src/lib/image-utils.ts getVersionedImageUrl). */
export function imageVariantUrl(originalUrl: string, version: 'original' | 'optimized' | 'thumbnail'): string {
  if (version === 'original' || !isManagedMediaUrl(originalUrl)) return originalUrl;
  return originalUrl.replace(/\.([^./?#]+)(?=$|[?#])/, `_${version}.$1`);
}

/** Upload a Buffer, a local file path, or a Readable. Returns the public URL. */
export async function put(b: MediaBucket, key: string, data: Buffer | string | Readable, opts: PutOptions = {}): Promise<{ publicUrl: string; bucket: MediaBucket; key: string; size: number }> {
  const f = file(b, key);
  const metadata = { contentType: opts.contentType || 'application/octet-stream', cacheControl: opts.cacheControl || MEDIA_CACHE_CONTROL, metadata: opts.metadata };
  const precondition = opts.upsert ? undefined : { ifGenerationMatch: 0 };
  let size = 0;
  try {
    if (Buffer.isBuffer(data)) {
      size = data.length;
      await f.save(data, { resumable: size > RESUMABLE_THRESHOLD, metadata, preconditionOpts: precondition, validation: 'crc32c' } as any);
    } else if (typeof data === 'string') {
      size = fs.statSync(data).size;
      await bucket().upload(data, { destination: objectName(b, key), resumable: size > RESUMABLE_THRESHOLD, metadata, preconditionOpts: precondition, validation: 'crc32c' } as any);
    } else {
      await pipeline(data, f.createWriteStream({ resumable: true, metadata, preconditionOpts: precondition } as any));
      const [meta] = await f.getMetadata();
      size = Number(meta.size || 0);
    }
  } catch (err: any) {
    if (err?.code === 412) throw new Error(`media-store: object already exists: ${objectName(b, key)}`);
    throw err;
  }
  return { publicUrl: publicUrl(b, key), bucket: b, key, size };
}

/** Delete objects; missing objects are not an error. */
export async function remove(b: MediaBucket, keys: string[]): Promise<{ removed: string[]; missing: string[]; failed: { key: string; error: string }[] }> {
  const removed: string[] = [], missing: string[] = [], failed: { key: string; error: string }[] = [];
  await Promise.all(keys.filter(Boolean).map(async key => {
    try {
      await file(b, key).delete({ ignoreNotFound: false });
      removed.push(key);
    } catch (err: any) {
      if (err?.code === 404) missing.push(key);
      else failed.push({ key, error: String(err?.message || err) });
    }
  }));
  return { removed, missing, failed };
}

/** Delete by stored URL(s) (new or legacy). Convenience for delete paths that only hold URLs. */
export async function removeUrls(urls: (string | null | undefined)[], defaultBucket?: MediaBucket) {
  const byBucket = new Map<string, string[]>();
  for (const u of urls) {
    const p = parseMediaUrl(u, defaultBucket);
    if (p) (byBucket.get(p.bucket) || byBucket.set(p.bucket, []).get(p.bucket)!).push(p.key);
  }
  const results = await Promise.all(Array.from(byBucket.entries()).map(([bk, keys]) => remove(bk, keys)));
  return {
    removed: results.flatMap(r => r.removed),
    missing: results.flatMap(r => r.missing),
    failed: results.flatMap(r => r.failed),
  };
}

/** List objects under a prefix (non-recursive like Supabase `list()` when `delimiter` is true). */
export async function list(b: MediaBucket, prefix = '', opts: { recursive?: boolean; limit?: number } = {}): Promise<MediaObjectInfo[]> {
  const fullPrefix = objectName(b, prefix ? prefix.replace(/\/?$/, '/') : '');
  const [files] = await bucket().getFiles({ prefix: fullPrefix, delimiter: opts.recursive ? undefined : '/', autoPaginate: !opts.limit, maxResults: opts.limit } as any);
  return files
    .filter(f => !f.name.endsWith('/'))
    .map(f => {
      const key = f.name.slice(b.length + 1);
      return {
        bucket: b, key, name: key.split('/').pop() || key,
        size: Number(f.metadata.size || 0),
        contentType: (f.metadata.contentType as string) || null,
        updatedAt: (f.metadata.updated as string) || null,
        publicUrl: publicUrl(b, key),
      };
    });
}

export async function getMetadata(b: MediaBucket, key: string): Promise<MediaObjectInfo | null> {
  try {
    const [meta] = await file(b, key).getMetadata();
    return {
      bucket: b, key, name: key.split('/').pop() || key,
      size: Number(meta.size || 0), contentType: (meta.contentType as string) || null,
      updatedAt: (meta.updated as string) || null, publicUrl: publicUrl(b, key),
    };
  } catch (err: any) {
    if (err?.code === 404) return null;
    throw err;
  }
}

export async function exists(b: MediaBucket, key: string): Promise<boolean> {
  const [ok] = await file(b, key).exists();
  return ok;
}

export async function download(b: MediaBucket, key: string): Promise<Buffer> {
  const [buf] = await file(b, key).download();
  return buf;
}

export function downloadStream(b: MediaBucket, key: string): Readable {
  return file(b, key).createReadStream();
}

/** Download by stored URL (new or legacy). */
export async function downloadUrl(url: string, defaultBucket?: MediaBucket): Promise<Buffer | null> {
  const p = parseMediaUrl(url, defaultBucket);
  return p ? download(p.bucket, p.key) : null;
}

export const mediaStore = { put, remove, removeUrls, list, getMetadata, exists, download, downloadStream, downloadUrl, publicUrl, parseMediaUrl, isManagedMediaUrl, imageVariantKeys, imageVariantUrl, encodeKey, objectName };
export default mediaStore;
