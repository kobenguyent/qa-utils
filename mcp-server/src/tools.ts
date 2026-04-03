/**
 * MCP Server Tool Implementations
 *
 * Re-exports shared platform-agnostic utilities from src/utils/sharedTools
 * and provides Node.js-specific implementations for tools that require
 * platform APIs (crypto, Buffer, etc.).
 */

import { createHash, randomUUID, randomInt } from 'node:crypto';

// Re-export shared (platform-agnostic) tools
export {
  generateLoremIpsum,
  countTextStats as countCharacters,
  validateEmail,
  formatJson,
  convertTimestamp,
  generateSql,
  convertSimpleColor as convertColor,
  sanitizeHtml,
} from '../../src/utils/sharedTools.js';

export type { SqlOperation } from '../../src/utils/sharedTools.js';

import { decodeJwt as sharedDecodeJwt } from '../../src/utils/sharedTools.js';

// ---------------------------------------------------------------------------
// Node.js-specific implementations
// ---------------------------------------------------------------------------

/**
 * Generate one or more UUIDs.
 */
export function generateUuids(quantity: number = 1): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < Math.min(quantity, 100); i++) {
    uuids.push(randomUUID());
  }
  return uuids;
}

/**
 * Encode a string to Base64.
 */
export function base64Encode(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

/**
 * Decode a Base64 string.
 */
export function base64Decode(value: string): string {
  return Buffer.from(value, 'base64').toString('utf-8');
}

/**
 * Generate a secure random password.
 */
export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  const safeLength = Math.max(1, Math.min(length, 256));
  let password = '';
  for (let i = 0; i < safeLength; i++) {
    password += charset[randomInt(charset.length)];
  }
  return password;
}

/**
 * Generate a hash of the given value.
 */
export function generateHash(
  value: string,
  algorithm: 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'md5' = 'sha256'
): string {
  return createHash(algorithm).update(value).digest('hex');
}

/**
 * Generate a random string of given length.
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const safeLength = Math.max(1, Math.min(length, 1024));
  let result = '';
  for (let i = 0; i < safeLength; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

/**
 * Decode a JWT token (Node.js version using Buffer for base64url).
 */
export function decodeJwt(token: string) {
  return sharedDecodeJwt(token, (str: string) => {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(padded, 'base64').toString('utf-8');
  });
}
