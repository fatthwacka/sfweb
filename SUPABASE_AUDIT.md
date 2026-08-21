# Supabase usage audit

_Generated 2026-08-21T13:45:27.930Z by `node scripts/supabase-audit.ts`. Re-run until only **auth** rows remain (Supabase Auth stays on the Free plan)._

## Totals

| area | client | table | storage | url | auth | rpc | env | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| client | 2 | 74 | 0 | 1 | 7 | 0 | 0 | 84 |
| scripts | 8 | 11 | 7 | 2 | 0 | 0 | 12 | 40 |
| server | 27 | 156 | 27 | 0 | 9 | 1 | 4 | 224 |
| **all** | 37 | 241 | 34 | 3 | 16 | 1 | 16 | 348 |

## Tables referenced via supabase-js `.from()`

`profiles` (20), `blog_posts` (15), `content_clients` (13), `preview_images` (12), `client_brand_profiles` (11), `client_output_destinations` (11), `social_content_history` (11), `videos` (11), `ai_skills` (9), `images` (9), `content_articles` (9), `ai_prompt_overrides` (8), `client_input_sources` (8), `content_types` (8), `shoots` (8), `category_heroes` (7), `skill_evolution_log` (7), `clients` (7), `client_selections` (7), `pricing_packages` (6), `client_brand_assets` (6), `visitor_sessions` (6), `generation_limits` (4), `site_gradients` (4), `platform_rules` (4), `blog_categories` (4), `shoot_previews` (4), `pipeline_runs` (3), `visitor_daily_stats` (3), `ingested_articles` (2), `site_config` (2), `table` (1), `topic_cooldowns` (1)

## Storage buckets

`gallery-images` (1), `preview-images` (1)

## Files (most hits first)

### client/src/lib/supabase-operations.ts — 67 (table 65, auth 2)

| line | kind | detail | code |
|---:|---|---|---|
| 18 | table | clients | `.from('clients')` |
| 28 | table | clients | `.from('clients')` |
| 42 | table | clients | `.from('clients')` |
| 62 | auth | getUser | `const { data: { user }, error: authError } = await supabase.auth.getUser();` |
| 69 | table | clients | `.from('clients')` |
| 88 | table | clients | `.from('clients')` |
| 100 | table | clients | `.from('clients')` |
| 109 | table | clients | `.from('clients')` |
| 121 | table | shoots | `.from('shoots')` |
| 131 | table | shoots | `.from('shoots')` |
| 159 | auth | getUser | `const { data: { user }, error: authError } = await supabase.auth.getUser();` |
| 182 | table | shoots | `.from('shoots')` |
| 250 | table | shoots | `.from('shoots')` |
| 262 | table | shoots | `.from('shoots')` |
| 274 | table | images | `.from('images')` |
| 284 | table | images | `.from('images')` |
| 298 | table | images | `.from('images')` |
| 308 | table | images | `.from('images')` |
| 339 | table | images | `.from('images')` |
| 348 | table | images | `.from('images')` |
| 357 | table | images | `.from('images')` |
| 366 | table | images | `.from('images')` |
| 446 | table | videos | `.from('videos')` |
| 457 | table | videos | `.from('videos')` |
| 492 | table | videos | `.from('videos')` |
| 522 | table | videos | `.from('videos')` |
| 531 | table | videos | `.from('videos')` |
| 540 | table | videos | `.from('videos')` |
| 549 | table | videos | `.from('videos')` |
| 619 | table | profiles | `.from('profiles')` |
| 633 | table | profiles | `.from('profiles')` |
| 648 | table | profiles | `.from('profiles')` |
| 660 | table | profiles | `.from('profiles')` |
| 674 | table | blog_posts | `.from('blog_posts')` |
| 684 | table | blog_posts | `.from('blog_posts')` |
| 714 | table | blog_posts | `.from('blog_posts')` |
| 760 | table | blog_posts | `.from('blog_posts')` |
| 772 | table | blog_posts | `.from('blog_posts')` |
| 781 | table | blog_posts | `.from('blog_posts')` |
| 795 | table | blog_categories | `.from('blog_categories')` |
| 809 | table | blog_categories | `.from('blog_categories')` |
| 824 | table | blog_categories | `.from('blog_categories')` |
| 836 | table | profiles | `.from('profiles')` |
| 852 | table | client_selections | `.from('client_selections')` |
| 863 | table | client_selections | `.from('client_selections')` |
| 895 | table | client_selections | `.from('client_selections')` |
| 905 | table | client_selections | `.from('client_selections')` |
| 921 | table | client_selections | `.from('client_selections')` |
| 940 | table | client_selections | `.from('client_selections')` |
| 966 | table | client_selections | `.from('client_selections')` |
| 986 | table | shoot_previews | `.from('shoot_previews')` |
| 1023 | table | shoot_previews | `.from('shoot_previews')` |
| 1067 | table | shoot_previews | `.from('shoot_previews')` |
| 1104 | table | shoot_previews | `.from('shoot_previews')` |
| 1119 | table | preview_images | `.from('preview_images')` |
| 1130 | table | preview_images | `.from('preview_images')` |
| 1141 | table | preview_images | `.from('preview_images')` |
| 1168 | table | profiles | `.from('profiles')` |
| 1178 | table | profiles | `.from('profiles')` |
| 1192 | table | profiles | `.from('profiles')` |
| 1212 | table | profiles | `.from('profiles')` |
| 1231 | table | profiles | `.from('profiles')` |
| 1243 | table | profiles | `.from('profiles')` |
| 1255 | table | profiles | `.from('profiles')` |
| 1267 | table | site_config | `.from('site_config')` |
| 1280 | table | site_config | `.from('site_config')` |
| 1294 | table | shoots | `.from('shoots')` |

### server/routes/social-content.ts — 38 (client 1, table 37)

| line | kind | detail | code |
|---:|---|---|---|
| 39 | client | createClient | `const getSupabase = () => createClient(` |
| 218 | table | platform_rules | `.from('platform_rules')` |
| 287 | table | ai_skills | `.from('ai_skills')` |
| 297 | table | platform_rules | `.from('platform_rules')` |
| 403 | table | ai_skills | `.from('ai_skills')` |
| 408 | table | platform_rules | `.from('platform_rules')` |
| 538 | table | platform_rules | `.from('platform_rules')` |
| 612 | table | ai_skills | `.from('ai_skills')` |
| 636 | table | ai_skills | `.from('ai_skills')` |
| 661 | table | ai_skills | `.from('ai_skills')` |
| 1068 | table | social_content_history | `.from('social_content_history')` |
| 1146 | table | social_content_history | `.from('social_content_history')` |
| 1236 | table | social_content_history | `.from('social_content_history')` |
| 1249 | table | social_content_history | `.from('social_content_history')` |
| 1285 | table | social_content_history | `.from('social_content_history')` |
| 1325 | table | social_content_history | `.from('social_content_history')` |
| 1354 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 1395 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 1401 | table | social_content_history | `.from('social_content_history')` |
| 1429 | table | social_content_history | `.from('social_content_history')` |
| 1559 | table | social_content_history | `.from('social_content_history')` |
| 1566 | table | skill_evolution_log | `.from('skill_evolution_log')` |
| 1574 | table | skill_evolution_log | `.from('skill_evolution_log')` |
| 1607 | table | social_content_history | `.from('social_content_history')` |
| 1628 | table | ai_skills | `.from('ai_skills')` |
| 1641 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 1653 | table | skill_evolution_log | `.from('skill_evolution_log')` |
| 1731 | table | social_content_history | `.from('social_content_history')` |
| 1911 | table | ai_skills | `.from('ai_skills')` |
| 1941 | table | ai_skills | `.from('ai_skills')` |
| 1959 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 2001 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 2016 | table | skill_evolution_log | `.from('skill_evolution_log')` |
| 2056 | table | skill_evolution_log | `.from('skill_evolution_log')` |
| 2093 | table | skill_evolution_log | `.from('skill_evolution_log')` |
| 2109 | table | ai_skills | `.from('ai_skills')` |
| 2125 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 2133 | table | skill_evolution_log | `.from('skill_evolution_log')` |

### server/routes.ts — 33 (client 2, table 16, storage 14, auth 1)

| line | kind | detail | code |
|---:|---|---|---|
| 98 | client | createClient | `const supabase = createClient(` |
| 103 | auth | signInWithPassword | `const { data, error } = await supabase.auth.signInWithPassword({` |
| 114 | table | profiles | `.from('profiles')` |
| 596 | table | shoots | `.from('shoots')` |
| 633 | table | images | `.from('images')` |
| 639 | table | videos | `.from('videos')` |
| 708 | storage | download | `.download(storagePath);` |
| 836 | client | createClient | `const client = await storage.createClient(clientData);` |
| 990 | table | shoots | `.from('shoots')` |
| 1532 | storage | remove | `.remove([previewImage.supabaseStoragePath]);` |
| 1799 | storage | list | `.list(storagePath.split('/').slice(0, -1).join('/'), {` |
| 1883 | storage | list | `.list(storagePath.split('/').slice(0, -1).join('/'), {` |
| 2017 | storage | upload | `.upload(storagePath, task.buffer, {` |
| 2030 | storage | getPublicUrl | `.getPublicUrl(storagePath);` |
| 2230 | storage | remove | `.remove([existingImage.supabaseStoragePath]);` |
| 2261 | storage | upload | `.upload(storagePath, file.buffer, {` |
| 2277 | storage | getPublicUrl | `.getPublicUrl(storagePath);` |
| 3291 | table | profiles | `.from('profiles')` |
| 3480 | storage | upload | `.upload(storagePath, file.buffer, {` |
| 3493 | storage | getPublicUrl | `.getPublicUrl(storagePath);` |
| 3596 | storage | upload | `.upload(storagePath, file.buffer, {` |
| 3609 | storage | getPublicUrl | `.getPublicUrl(storagePath);` |
| 3613 | table | category_heroes | `.from('category_heroes')` |
| 5176 | table | visitor_sessions | `.from('visitor_sessions')` |
| 5184 | table | visitor_sessions | `.from('visitor_sessions')` |
| 5194 | table | visitor_sessions | `.from('visitor_sessions')` |
| 5230 | table | visitor_sessions | `.from('visitor_sessions')` |
| 5371 | table | visitor_daily_stats | `.from('visitor_daily_stats')` |
| 5384 | table | visitor_sessions | `.from('visitor_sessions')` |
| 5441 | table | visitor_daily_stats | `.from('visitor_daily_stats')` |
| 5467 | table | visitor_sessions | `.from('visitor_sessions')` |
| 5499 | table | visitor_daily_stats | `.from('visitor_daily_stats')` |
| 7713 | storage | upload | `await bucket.upload(tempThumbnailPath, {` |

### server/routes/content-management/brand-intelligence.ts — 22 (table 22)

| line | kind | detail | code |
|---:|---|---|---|
| 31 | table | content_clients | `.from('content_clients')` |
| 46 | table | generation_limits | `.from('generation_limits')` |
| 96 | table | content_clients | `.from('content_clients')` |
| 135 | table | content_clients | `.from('content_clients')` |
| 184 | table | content_clients | `.from('content_clients')` |
| 203 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 229 | table | content_clients | `await supabase.from('content_clients').delete().eq('id', client.id);` |
| 235 | table | generation_limits | `.from('generation_limits')` |
| 267 | table | content_clients | `.from('content_clients')` |
| 298 | table | content_clients | `.from('content_clients')` |
| 421 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 434 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 447 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 476 | table | client_brand_profiles | `.from('client_brand_profiles')` |
| 503 | table | generation_limits | `.from('generation_limits')` |
| 527 | table | generation_limits | `.from('generation_limits')` |
| 563 | table | client_brand_assets | `.from('client_brand_assets')` |
| 605 | table | client_brand_assets | `.from('client_brand_assets')` |
| 701 | table | client_brand_assets | `.from('client_brand_assets')` |
| 757 | table | client_brand_assets | `.from('client_brand_assets')` |
| 796 | table | client_brand_assets | `.from('client_brand_assets')` |
| 822 | table | client_brand_assets | `.from('client_brand_assets')` |

### server/media/supabase-compat.ts — 17 (client 1, table 1, storage 13, env 2)

| line | kind | detail | code |
|---:|---|---|---|
| 9 | storage | from | `*   supabase.storage.from(bucket).upload(path, bufferOrFilePath, { contentType, upsert })` |
| 9 | storage | upload | `*   supabase.storage.from(bucket).upload(path, bufferOrFilePath, { contentType, upsert })` |
| 10 | storage | from | `*   supabase.storage.from(bucket).getPublicUrl(path)      → { data: { publicUrl } }` |
| 10 | storage | getPublicUrl | `*   supabase.storage.from(bucket).getPublicUrl(path)      → { data: { publicUrl } }` |
| 11 | storage | from | `*   supabase.storage.from(bucket).remove(paths)` |
| 11 | storage | remove | `*   supabase.storage.from(bucket).remove(paths)` |
| 12 | storage | from | `*   supabase.storage.from(bucket).list(prefix, { search, limit, sortBy })` |
| 12 | storage | list | `*   supabase.storage.from(bucket).list(prefix, { search, limit, sortBy })` |
| 13 | storage | from | `*   supabase.storage.from(bucket).download(path)          → { data: Blob, error }` |
| 13 | storage | download | `*   supabase.storage.from(bucket).download(path)          → { data: Blob, error }` |
| 15 | table | table | `* Phase 2a replaces every '.from('table')' with Drizzle, after which this file is deleted and routes` |
| 38 | storage | remove | `const r = await media.remove(bucket, paths);` |
| 47 | storage | list | `let items = await media.list(bucket, prefix, { recursive: false });` |
| 65 | storage | download | `const buf = await media.download(bucket, path);` |
| 81 | env | SUPABASE_URL | `const url = process.env.VITE_SUPABASE_URL \|\| process.env.SUPABASE_URL;` |
| 82 | env | SUPABASE_SERVICE_ROLE_KEY | `const key = process.env.SUPABASE_SECRET_KEY \|\| process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 84 | client | createClient | `_real = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });` |

### server/routes/content-studio/output-destinations.ts — 14 (client 1, table 13)

| line | kind | detail | code |
|---:|---|---|---|
| 17 | client | createClient | `return createClient(` |
| 30 | table | client_output_destinations | `.from('client_output_destinations')` |
| 72 | table | client_output_destinations | `.from('client_output_destinations')` |
| 119 | table | client_output_destinations | `.from('client_output_destinations')` |
| 145 | table | client_output_destinations | `.from('client_output_destinations')` |
| 166 | table | client_output_destinations | `.from('client_output_destinations')` |
| 208 | table | client_output_destinations | `.from('client_output_destinations')` |
| 245 | table | client_output_destinations | `.from('client_output_destinations')` |
| 283 | table | client_output_destinations | `.from('client_output_destinations')` |
| 299 | table | client_output_destinations | `.from('client_output_destinations')` |
| 327 | table | blog_posts | `.from('blog_posts')` |
| 377 | table | client_output_destinations | `.from('client_output_destinations')` |
| 457 | table | client_output_destinations | `.from('client_output_destinations')` |
| 485 | table | blog_posts | `.from('blog_posts')` |

### server/routes/ai-prompt-overrides.ts — 9 (client 1, table 8)

| line | kind | detail | code |
|---:|---|---|---|
| 13 | client | createClient | `const supabase = createClient(` |
| 152 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 168 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 232 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 250 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 265 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 294 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 357 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |
| 373 | table | ai_prompt_overrides | `.from('ai_prompt_overrides')` |

### server/routes/content-studio/input-sources.ts — 8 (client 1, table 7)

| line | kind | detail | code |
|---:|---|---|---|
| 12 | client | createClient | `return createClient(` |
| 25 | table | client_input_sources | `.from('client_input_sources')` |
| 51 | table | client_input_sources | `.from('client_input_sources')` |
| 89 | table | client_input_sources | `.from('client_input_sources')` |
| 111 | table | client_input_sources | `.from('client_input_sources')` |
| 135 | table | content_clients | `.from('content_clients')` |
| 162 | table | content_clients | `.from('content_clients')` |
| 189 | table | pipeline_runs | `.from('pipeline_runs')` |

### server/services/pipeline/pipeline-executor.ts — 8 (client 1, table 7)

| line | kind | detail | code |
|---:|---|---|---|
| 117 | client | createClient | `this.supabase = createClient(` |
| 136 | table | pipeline_runs | `.from('pipeline_runs')` |
| 179 | table | client_input_sources | `.from('client_input_sources')` |
| 195 | table | client_input_sources | `.from('client_input_sources')` |
| 272 | table | content_clients | `.from('content_clients')` |
| 287 | table | client_input_sources | `.from('client_input_sources')` |
| 403 | table | ingested_articles | `.from('ingested_articles')` |
| 448 | table | pipeline_runs | `.from('pipeline_runs')` |

### scripts/migrate-airtable-to-supabase.ts — 8 (client 1, table 3, env 4)

| line | kind | detail | code |
|---:|---|---|---|
| 23 | env | SUPABASE_URL | `const SUPABASE_URL = process.env.VITE_SUPABASE_URL;` |
| 33 | env | SUPABASE_URL | `if (!SUPABASE_URL \|\| !SUPABASE_SECRET_KEY) {` |
| 40 | client | createClient | `const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);` |
| 40 | env | SUPABASE_URL | `const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);` |
| 185 | table | content_articles | `.from('content_articles')` |
| 214 | env | SUPABASE_URL | `console.log('  Supabase URL: ${SUPABASE_URL}');` |
| 220 | table | content_articles | `.from('content_articles')` |
| 277 | table | content_articles | `.from('content_articles')` |

### server/routes/category-heroes.ts — 7 (client 1, table 6)

| line | kind | detail | code |
|---:|---|---|---|
| 11 | client | createClient | `return createClient(` |
| 26 | table | category_heroes | `.from('category_heroes')` |
| 66 | table | category_heroes | `.from('category_heroes')` |
| 124 | table | category_heroes | `.from('category_heroes')` |
| 143 | table | category_heroes | `.from('category_heroes')` |
| 168 | table | category_heroes | `.from('category_heroes')` |
| 209 | table | category_heroes | `.from('category_heroes')` |

### server/routes/content-types.ts — 7 (client 1, table 6)

| line | kind | detail | code |
|---:|---|---|---|
| 13 | client | createClient | `const supabase = createClient(` |
| 23 | table | content_types | `.from('content_types')` |
| 52 | table | content_types | `.from('content_types')` |
| 80 | table | content_types | `.from('content_types')` |
| 126 | table | content_types | `.from('content_types')` |
| 185 | table | content_types | `.from('content_types')` |
| 215 | table | content_types | `.from('content_types')` |

### client/src/pages/tools/article-editor-supabase.tsx — 7 (client 1, table 6)

| line | kind | detail | code |
|---:|---|---|---|
| 14 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseAnonKey);` |
| 547 | table | content_articles | `const { error } = await supabase.from('content_articles').select('id').limit(1);` |
| 569 | table | content_articles | `.from('content_articles')` |
| 644 | table | content_articles | `.from('content_articles')` |
| 942 | table | content_articles | `.from('content_articles')` |
| 2062 | table | content_articles | `.from('content_articles')` |
| 2097 | table | content_articles | `.from('content_articles')` |

### server/pricing-packages-api.ts — 6 (table 6)

| line | kind | detail | code |
|---:|---|---|---|
| 14 | table | pricing_packages | `.from('pricing_packages')` |
| 44 | table | pricing_packages | `.from('pricing_packages')` |
| 99 | table | pricing_packages | `.from('pricing_packages')` |
| 143 | table | pricing_packages | `.from('pricing_packages')` |
| 180 | table | pricing_packages | `.from('pricing_packages')` |
| 205 | table | pricing_packages | `.from('pricing_packages')` |

### server/services/image-migration-service.ts — 6 (client 1, table 5)

| line | kind | detail | code |
|---:|---|---|---|
| 15 | client | createClient | `this.supabase = createClient(` |
| 168 | table | preview_images | `.from('preview_images')` |
| 195 | table | preview_images | `.from('preview_images')` |
| 222 | table | preview_images | `.from('preview_images')` |
| 266 | table | preview_images | `.from('preview_images')` |
| 297 | table | preview_images | `.from('preview_images')` |

### server/static-generator.ts — 6 (table 6)

| line | kind | detail | code |
|---:|---|---|---|
| 60 | table | blog_posts | `.from('blog_posts')` |
| 94 | table | profiles | `.from('profiles')` |
| 106 | table | blog_categories | `.from('blog_categories')` |
| 136 | table | content_clients | `.from('content_clients')` |
| 429 | table | blog_posts | `.from('blog_posts')` |
| 498 | table | blog_posts | `.from('blog_posts')` |

### scripts/create-gallery-images-bucket.js — 6 (client 1, storage 2, url 1, env 2)

| line | kind | detail | code |
|---:|---|---|---|
| 12 | env | SUPABASE_SERVICE_ROLE_KEY | `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 16 | env | SUPABASE_SERVICE_ROLE_KEY | `console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');` |
| 20 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` |
| 27 | storage | listBuckets | `const { data: buckets, error: listError } = await supabase.storage.listBuckets();` |
| 56 | storage | createBucket:gallery-images | `const { data, error } = await supabase.storage.createBucket('gallery-images', {` |
| 68 | url | /storage/v1/object/ | `console.log('📍 Bucket will be accessible at:', '${supabaseUrl}/storage/v1/object/public/gallery-images/');` |

### server/routes/gradients.ts — 5 (client 1, table 4)

| line | kind | detail | code |
|---:|---|---|---|
| 11 | client | createClient | `return createClient(` |
| 27 | table | site_gradients | `.from('site_gradients')` |
| 70 | table | site_gradients | `.from('site_gradients')` |
| 109 | table | site_gradients | `.from('site_gradients')` |
| 133 | table | site_gradients | `.from('site_gradients')` |

### client/src/hooks/use-auth.tsx — 5 (auth 5)

| line | kind | detail | code |
|---:|---|---|---|
| 42 | auth | getSession | `const { data: { session }, error } = await supabase.auth.getSession();` |
| 108 | auth | onAuthStateChange | `const { data: { subscription } } = supabase.auth.onAuthStateChange(` |
| 179 | auth | signInWithPassword | `const { data, error } = await supabase.auth.signInWithPassword({` |
| 209 | auth | signUp | `const { data, error } = await supabase.auth.signUp({` |
| 244 | auth | signOut | `const { error } = await supabase.auth.signOut();` |

### scripts/check-preview-images.js — 5 (client 1, table 1, storage 2, env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 12 | env | SUPABASE_SERVICE_ROLE_KEY | `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 19 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` |
| 27 | table | preview_images | `.from('preview_images')` |
| 67 | storage | list | `.list(img.supabase_storage_path?.split('/').slice(0, -1).join('/'), {` |
| 82 | storage | getPublicUrl | `.getPublicUrl(img.supabase_storage_path);` |

### scripts/test-migration.js — 5 (client 1, table 3, env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 12 | env | SUPABASE_SERVICE_ROLE_KEY | `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 20 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` |
| 28 | table | profiles | `.from('profiles')` |
| 41 | table | profiles | `.from('profiles')` |
| 97 | table | preview_images | `.from('preview_images')` |

### server/routes/youtube.ts — 4 (client 1, table 3)

| line | kind | detail | code |
|---:|---|---|---|
| 13 | client | createClient | `return createClient(` |
| 155 | table | videos | `.from('videos')` |
| 168 | table | videos | `.from('videos')` |
| 225 | table | videos | `.from('videos')` |

### server/services/brand-context-loader.ts — 4 (client 2, table 2)

| line | kind | detail | code |
|---:|---|---|---|
| 83 | client | createClient | `const supabase = createClient(` |
| 96 | table | content_clients | `.from('content_clients')` |
| 188 | client | createClient | `const supabase = createClient(` |
| 200 | table | content_clients | `.from('content_clients')` |

### server/supabase-auth.ts — 4 (client 1, table 1, auth 2)

| line | kind | detail | code |
|---:|---|---|---|
| 10 | client | createClient | `export const supabaseAdmin = createClient(` |
| 34 | auth | admin.listUsers | `const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();` |
| 42 | auth | admin.createUser | `const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({` |
| 67 | table | profiles | `.from('profiles')` |

### scripts/cleanup-invalid-preview-images.js — 4 (client 1, table 2, env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 11 | env | SUPABASE_SERVICE_ROLE_KEY | `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 18 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` |
| 26 | table | preview_images | `.from('preview_images')` |
| 81 | table | preview_images | `.from('preview_images')` |

### scripts/create-preview-bucket.js — 4 (client 1, storage 2, env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 12 | env | SUPABASE_SERVICE_ROLE_KEY | `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 19 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` |
| 26 | storage | listBuckets | `const { data: buckets, error: listError } = await supabase.storage.listBuckets();` |
| 39 | storage | createBucket:preview-images | `const { data, error } = await supabase.storage.createBucket('preview-images', {` |

### scripts/create-system-user.js — 4 (client 1, table 2, env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 11 | env | SUPABASE_SERVICE_ROLE_KEY | `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;` |
| 18 | client | createClient | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` |
| 26 | table | profiles | `.from('profiles')` |
| 43 | table | profiles | `.from('profiles')` |

### scripts/migrate-images-to-preprocessed.ts — 4 (client 1, storage 1, url 1, env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 44 | client | createClient | `const supabase = createClient(` |
| 46 | env | SUPABASE_SERVICE_ROLE_KEY | `process.env.SUPABASE_SERVICE_ROLE_KEY!` |
| 72 | url | /storage/v1/object/ | `const urlParts = image.storagePath.split('/storage/v1/object/public/gallery-images/');` |
| 84 | storage | list | `.list(storagePath.split('/').slice(0, -1).join('/'), {` |

### server/services/content-types-service.ts — 3 (client 1, table 2)

| line | kind | detail | code |
|---:|---|---|---|
| 23 | client | createClient | `private supabase = createClient(` |
| 45 | table | content_types | `.from('content_types')` |
| 72 | table | content_types | `.from('content_types')` |

### server/simple-test-data.ts — 3 (client 3)

| line | kind | detail | code |
|---:|---|---|---|
| 12 | client | createClient | `const client1 = await storage.createClient({` |
| 20 | client | createClient | `const client2 = await storage.createClient({` |
| 28 | client | createClient | `const client3 = await storage.createClient({` |

### server/test-supabase-auth.ts — 3 (client 1, auth 2)

| line | kind | detail | code |
|---:|---|---|---|
| 19 | client | createClient | `const supabase = createClient(supabaseUrl, serviceKey, {` |
| 29 | auth | admin.createUser | `const { data, error } = await supabase.auth.admin.createUser({` |
| 42 | auth | admin.deleteUser | `await supabase.auth.admin.deleteUser(data.user.id);` |

### server/routes/content-studio/pipeline.ts — 2 (client 1, table 1)

| line | kind | detail | code |
|---:|---|---|---|
| 14 | client | createClient | `return createClient(` |
| 55 | table | client_input_sources | `.from('client_input_sources')` |

### server/services/pipeline/screening/cooldown-checker.ts — 2 (table 2)

| line | kind | detail | code |
|---:|---|---|---|
| 34 | table | topic_cooldowns | `.from('topic_cooldowns')` |
| 70 | table | blog_posts | `.from('blog_posts')` |

### server/services/vertex-ai-image-generator.ts — 2 (auth 2)

| line | kind | detail | code |
|---:|---|---|---|
| 324 | auth | getClient | `const authClient = await this.auth.getClient();` |
| 413 | auth | getClient | `const authClient = await this.auth.getClient();` |

### server/services/vertex-ai-veo-generator.ts — 2 (auth 2)

| line | kind | detail | code |
|---:|---|---|---|
| 225 | auth | getClient | `const authClient = await this.auth.getClient();` |
| 453 | auth | getClient | `const authClient = await this.auth.getClient();` |

### server/storage.ts — 2 (client 2)

| line | kind | detail | code |
|---:|---|---|---|
| 42 | client | createClient | `createClient(client: InsertClient): Promise<Client>;` |
| 693 | client | createClient | `async createClient(insertClient: InsertClient): Promise<Client> {` |

### client/src/pages/story.tsx — 2 (table 2)

| line | kind | detail | code |
|---:|---|---|---|
| 72 | table | blog_posts | `.from('blog_posts')` |
| 104 | table | blog_posts | `.from('blog_posts')` |

### server/index.ts — 1 (env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 109 | env | SUPABASE_URL | `console.log("SUPABASE_URL configured:", !!process.env.VITE_SUPABASE_URL);` |

### server/pg-storage.ts — 1 (client 1)

| line | kind | detail | code |
|---:|---|---|---|
| 53 | client | createClient | `async createClient(client: InsertClient): Promise<Client> {` |

### server/populate-realistic-data.ts — 1 (client 1)

| line | kind | detail | code |
|---:|---|---|---|
| 80 | client | createClient | `const client = await storage.createClient(clientData);` |

### server/prod-index.ts — 1 (env 1)

| line | kind | detail | code |
|---:|---|---|---|
| 110 | env | SUPABASE_URL | `console.log("SUPABASE_URL configured:", !!process.env.VITE_SUPABASE_URL);` |

### server/services/pipeline/screening/title-similarity.ts — 1 (rpc 1)

| line | kind | detail | code |
|---:|---|---|---|
| 25 | rpc | check_title_similarity | `const { data, error } = await supabase.rpc('check_title_similarity', {` |

### server/services/pipeline/screening/url-dedup.ts — 1 (table 1)

| line | kind | detail | code |
|---:|---|---|---|
| 66 | table | ingested_articles | `.from('ingested_articles')` |

### server/supabase-storage.ts — 1 (client 1)

| line | kind | detail | code |
|---:|---|---|---|
| 121 | client | createClient | `async createClient(insertClient: InsertClient): Promise<Client> {` |

### client/src/lib/image-utils.ts — 1 (url 1)

| line | kind | detail | code |
|---:|---|---|---|
| 33 | url | /storage/v1/object/ | `const LEGACY_SUPABASE_PREFIX = '/storage/v1/object/public/';` |

### client/src/lib/supabase.ts — 1 (client 1)

| line | kind | detail | code |
|---:|---|---|---|
| 9 | client | createClient | `export const supabase = createClient<Database>(` |

### client/src/pages/stories.tsx — 1 (table 1)

| line | kind | detail | code |
|---:|---|---|---|
| 34 | table | blog_posts | `.from('blog_posts')` |
