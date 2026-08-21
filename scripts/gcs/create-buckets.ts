/**
 * Create (or verify) the GCS buckets used by the Supabase offboarding.
 *
 *   node scripts/gcs/create-buckets.ts [--location africa-south1] [--dry-run]
 *
 * - GCS_MEDIA_BUCKET   (default sfweb-media)          Standard class, uniform bucket-level access,
 *                                                      public read (allUsers: objectViewer), CORS GET/HEAD *,
 *                                                      soft delete 7 days.
 * - GCS_ARCHIVE_BUCKET (default sfweb-media-archive)  Archive class, private (unreferenced/orphan objects).
 *
 * Uses the same service-account env vars as the Vertex/Veo services. The service account needs
 * storage.buckets.create on the project (roles/storage.admin) — if creation fails with 403, create the
 * buckets in the Cloud Console with these settings and re-run to verify/apply IAM + CORS.
 */
import 'dotenv/config';
import { Storage } from '@google-cloud/storage';

const MEDIA = process.env.GCS_MEDIA_BUCKET || 'sfweb-media';
const ARCHIVE = process.env.GCS_ARCHIVE_BUCKET || 'sfweb-media-archive';
const argLoc = process.argv.indexOf('--location');
const LOCATION = argLoc !== -1 ? process.argv[argLoc + 1] : (process.env.GCS_MEDIA_LOCATION || 'africa-south1');
const DRY = process.argv.includes('--dry-run');

const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
});

async function ensureBucket(name: string, opts: { storageClass: 'STANDARD' | 'ARCHIVE'; publicRead: boolean }) {
  const bucket = storage.bucket(name);
  const [exists] = await bucket.exists();
  if (!exists) {
    console.log(`${DRY ? '[dry-run] would create' : 'creating'} gs://${name} (${opts.storageClass}, ${LOCATION})`);
    if (!DRY) {
      await storage.createBucket(name, {
        location: LOCATION,
        storageClass: opts.storageClass,
        iamConfiguration: { uniformBucketLevelAccess: { enabled: true }, publicAccessPrevention: opts.publicRead ? 'inherited' : 'enforced' },
        softDeletePolicy: { retentionDurationSeconds: 7 * 24 * 3600 },
      } as any);
    }
  } else {
    const [meta] = await bucket.getMetadata();
    console.log(`exists gs://${name} location=${meta.location} class=${meta.storageClass} ubla=${meta.iamConfiguration?.uniformBucketLevelAccess?.enabled}`);
    if (meta.storageClass !== opts.storageClass) console.warn(`  ! storageClass is ${meta.storageClass}, expected ${opts.storageClass}`);
  }
  if (DRY) return;
  if (opts.publicRead) {
    const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
    const has = policy.bindings.some(b => b.role === 'roles/storage.objectViewer' && b.members.includes('allUsers'));
    if (!has) {
      policy.bindings.push({ role: 'roles/storage.objectViewer', members: ['allUsers'] });
      await bucket.iam.setPolicy(policy);
      console.log(`  granted allUsers roles/storage.objectViewer on gs://${name}`);
    } else console.log('  public read already granted');
    await bucket.setCorsConfiguration([{ origin: ['*'], method: ['GET', 'HEAD'], responseHeader: ['Content-Type', 'Range', 'Content-Length', 'Content-Range'], maxAgeSeconds: 3600 }]);
    console.log('  CORS set (GET/HEAD from any origin)');
  }
  // Probe write access so 01-copy does not fail mid-run.
  const probe = bucket.file('_probe/write-test.txt');
  await probe.save('ok', { contentType: 'text/plain', resumable: false });
  await probe.delete();
  console.log('  write probe OK');
}

(async () => {
  await ensureBucket(MEDIA, { storageClass: 'STANDARD', publicRead: true });
  await ensureBucket(ARCHIVE, { storageClass: 'ARCHIVE', publicRead: false });
  console.log(`\nMEDIA_PUBLIC_BASE=https://storage.googleapis.com/${MEDIA}`);
})().catch(e => { console.error('FAILED:', e.message || e); process.exit(1); });
