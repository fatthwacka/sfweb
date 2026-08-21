/** Upload one local file to the GCS archive bucket: node scripts/ops/gcs-upload.ts <localPath> <destName> [bucket] */
import 'dotenv/config';
import fs from 'node:fs';
import { Storage } from '@google-cloud/storage';
const [src, dest, bucketName = process.env.GCS_ARCHIVE_BUCKET || 'sfweb-media-archive'] = process.argv.slice(2);
if (!src || !dest) { console.error('usage: gcs-upload.ts <localPath> <destName> [bucket]'); process.exit(2); }
const storage = new Storage({ projectId: process.env.GOOGLE_PROJECT_ID, credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!, private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n') } });
await storage.bucket(bucketName).upload(src, { destination: dest, resumable: fs.statSync(src).size > 8 * 1024 * 1024 });
console.log(`${new Date().toISOString()} uploaded gs://${bucketName}/${dest} (${fs.statSync(src).size} bytes)`);
