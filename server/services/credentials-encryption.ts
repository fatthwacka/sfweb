/**
 * Credentials Encryption Service
 * AES-256-CBC encryption for storing CMS connector credentials securely
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.CONTENT_STUDIO_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CONTENT_STUDIO_ENCRYPTION_KEY environment variable is required for credential encryption');
  }
  // Derive a 32-byte key from the environment variable using scrypt
  return scryptSync(key, 'content-studio-salt', 32);
}

/**
 * Encrypt a JSON-serialisable object
 * Returns a string in the format: iv:encrypted (both hex-encoded)
 */
export function encryptCredentials(data: Record<string, any>): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a previously encrypted string back to a JSON object
 * Expects input in the format: iv:encrypted (both hex-encoded)
 */
export function decryptCredentials(encryptedString: string): Record<string, any> {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex] = encryptedString.split(':');

  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted credentials format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Check if the encryption key is configured
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.CONTENT_STUDIO_ENCRYPTION_KEY;
}
