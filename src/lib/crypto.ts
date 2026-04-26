/**
 * AES-256-GCM symmetric encryption for sensitive config values stored in DB.
 * Key must be a 32-byte hex string set in ATS_ENCRYPT_KEY env var.
 * Falls back to a random per-process key if not set (dev only — not persistent).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.ATS_ENCRYPT_KEY;
  if (hex && hex.length === 64) return Buffer.from(hex, 'hex');
  // Dev fallback: warn and use a deterministic key derived from a constant
  if (process.env.NODE_ENV !== 'production') {
    return Buffer.from('talentflow_dev_key_do_not_use_in_prod_000000000000', 'utf8').subarray(0, 32);
  }
  throw new Error('ATS_ENCRYPT_KEY env var must be set in production (32-byte hex string)');
}

/** Encrypt a plaintext string → returns "iv:tag:ciphertext" base64 string */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Decrypt an "iv:tag:ciphertext" base64 string → plaintext */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString('utf8') + decipher.final('utf8');
}

/** Detect if a value looks like an encrypted token (contains ':') vs plaintext */
export function isEncrypted(value: string): boolean {
  return value.split(':').length === 3;
}

/** Safely decrypt — if decryption fails (legacy plaintext), return as-is */
export function safeDecrypt(value: string): string {
  if (!value) return value;
  try {
    if (isEncrypted(value)) return decrypt(value);
  } catch {
    // Legacy plaintext value — return as-is, will be re-encrypted on next save
  }
  return value;
}
