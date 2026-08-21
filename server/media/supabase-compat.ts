/**
 * Transitional shim used while server/routes.ts still mixes supabase-js table queries with storage calls.
 *
 * `createHybridClient()` returns an object whose `.from()` / `.auth` / `.rpc()` delegate to a real
 * supabase-js service-role client (tables + auth still live in Supabase until Phase 2), while `.storage`
 * is implemented on top of server/media/media-store.ts (Google Cloud Storage) using the same
 * `{ data, error }` result shapes the routes already expect:
 *
 *   supabase.storage.from(bucket).upload(path, bufferOrFilePath, { contentType, upsert })
 *   supabase.storage.from(bucket).getPublicUrl(path)      → { data: { publicUrl } }
 *   supabase.storage.from(bucket).remove(paths)
 *   supabase.storage.from(bucket).list(prefix, { search, limit, sortBy })
 *   supabase.storage.from(bucket).download(path)          → { data: Blob, error }
 *
 * Phase 2a replaces every `.from('table')` with Drizzle, after which this file is deleted and routes
 * import media-store directly.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as media from './media-store';

type StorageError = { message: string; statusCode?: string; error?: string; details?: string } | null;

export function storageBucketShim(bucket: media.MediaBucket) {
  return {
    async upload(path: string, body: Buffer | string, opts: { contentType?: string; cacheControl?: string; upsert?: boolean } = {}) {
      try {
        const r = await media.put(bucket, path, body, { contentType: opts.contentType, upsert: opts.upsert, cacheControl: opts.cacheControl && /max-age/.test(opts.cacheControl) ? opts.cacheControl : undefined });
        return { data: { path: r.key, fullPath: media.objectName(bucket, r.key), id: media.objectName(bucket, r.key) }, error: null as StorageError };
      } catch (err: any) {
        return { data: null, error: { message: String(err?.message || err) } as StorageError };
      }
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: media.publicUrl(bucket, path) } };
    },
    async remove(paths: string[]) {
      try {
        const r = await media.remove(bucket, paths);
        if (r.failed.length) return { data: r.removed.map(name => ({ name })), error: { message: r.failed.map(f => `${f.key}: ${f.error}`).join('; ') } as StorageError };
        return { data: r.removed.map(name => ({ name })), error: null as StorageError };
      } catch (err: any) {
        return { data: null, error: { message: String(err?.message || err) } as StorageError };
      }
    },
    async list(prefix = '', opts: { limit?: number; offset?: number; search?: string; sortBy?: { column?: string; order?: string } } = {}) {
      try {
        let items = await media.list(bucket, prefix, { recursive: false });
        if (opts.search) items = items.filter(i => i.name.includes(opts.search!));
        if (opts.sortBy?.column === 'created_at' || opts.sortBy?.column === 'updated_at') {
          items.sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''));
          if (opts.sortBy.order === 'desc') items.reverse();
        } else items.sort((a, b) => a.name.localeCompare(b.name));
        if (opts.offset) items = items.slice(opts.offset);
        if (opts.limit) items = items.slice(0, opts.limit);
        return {
          data: items.map(i => ({ name: i.name, id: media.objectName(bucket, i.key), updated_at: i.updatedAt, created_at: i.updatedAt, last_accessed_at: null, metadata: { size: i.size, mimetype: i.contentType, contentLength: i.size } })),
          error: null as StorageError,
        };
      } catch (err: any) {
        return { data: null, error: { message: String(err?.message || err) } as StorageError };
      }
    },
    async download(path: string) {
      try {
        const buf = await media.download(bucket, path);
        return { data: new Blob([buf]), error: null as StorageError };
      } catch (err: any) {
        return { data: null, error: { message: String(err?.message || err), statusCode: err?.code === 404 ? '404' : undefined } as StorageError };
      }
    },
  };
}

export const storageShim = { from: (bucket: media.MediaBucket) => storageBucketShim(bucket) };

export type HybridClient = Omit<SupabaseClient, 'storage'> & { storage: typeof storageShim };

let _real: SupabaseClient | null = null;
function realClient(): SupabaseClient {
  if (_real) return _real;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('supabase-compat: VITE_SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  _real = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _real;
}

/** Service-role supabase-js client for tables/auth, with `.storage` redirected to Google Cloud Storage. */
export function createHybridClient(): HybridClient {
  const real = realClient();
  return new Proxy(real as any, {
    get(target, prop, receiver) {
      if (prop === 'storage') return storageShim;
      const v = Reflect.get(target, prop, receiver);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  }) as HybridClient;
}
