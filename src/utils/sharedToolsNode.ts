/**
 * Shared Node.js Tool Implementations
 *
 * Node.js-specific implementations of QA utility functions that rely on
 * Node.js built-ins (crypto, Buffer). These are shared between the CLI,
 * REST API, and MCP server.
 *
 * Platform-agnostic functions live in sharedTools.ts and are re-exported
 * here for convenience.
 */

import { createHash, randomUUID, randomInt } from 'node:crypto';

import {
  NANO_ALPHABET,
  decodeJwt as sharedDecodeJwt,
} from './sharedTools.js';

import type { PasswordOptions, HashAlgorithm, JwtDecodeResult } from './sharedTools.js';

// ---------------------------------------------------------------------------
// Re-export all platform-agnostic tools and types
// ---------------------------------------------------------------------------

export type {
  TextStats,
  EmailValidationResult,
  JsonFormatResult,
  TimestampResult,
  SqlOperation,
  ColorResult,
  SimpleColorResult,
  RGBColor,
  HSLColor,
  JwtDecodeResult,
  PasswordOptions,
  HashAlgorithm,
  ParsedUrl,
  UrlParseResult,
  RegexMatch,
  RegexTestResult,
  BaseConversionResult,
  CaseType,
  // JSON Prompt Builder
  MessageRole,
  PromptProviderFormat,
  PromptMessage,
  JsonPromptTemplate,
  BuildJsonPromptResult,
  ParseJsonPromptResult,
  ValidatePromptResult,
  // Text Comparison
  TextComparisonOptions,
  TextDiffLine,
  TextComparisonStats,
  TextComparisonResult,
} from './sharedTools.js';

export {
  generateLoremIpsum,
  countTextStats,
  validateEmail,
  formatJson,
  convertTimestamp,
  generateSql,
  SQL_OPERATIONS,
  convertSimpleColor,
  convertCase,
  CASE_TYPES,
  sanitizeHtml,
  urlEncode,
  urlDecode,
  parseUrl,
  testRegex,
  convertBase,
  NANO_ALPHABET,
  HASH_ALGORITHMS,
  convertMarkdownToConfluence,
  // JSON Prompt Builder
  extractTemplateVariables,
  renderPromptTemplate,
  validatePromptTemplate,
  buildJsonPrompt,
  parseJsonPrompt,
  // Text Comparison
  compareTexts,
} from './sharedTools.js';

// ---------------------------------------------------------------------------
// UUID
// ---------------------------------------------------------------------------

/**
 * Generate one or more v4 UUIDs.
 * @param quantity Number of UUIDs to generate (capped at 100).
 */
export function generateUuids(quantity = 1): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < Math.min(Math.max(1, quantity), 100); i++) {
    uuids.push(randomUUID());
  }
  return uuids;
}

// ---------------------------------------------------------------------------
// Base64
// ---------------------------------------------------------------------------

/** Encode a UTF-8 string to Base64. */
export function base64Encode(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

/** Decode a Base64 string to UTF-8. Throws if the input is invalid. */
export function base64Decode(value: string): string {
  if (value === '') return '';
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value.trim())) {
    throw new Error('Invalid Base64 string');
  }
  return Buffer.from(value.trim(), 'base64').toString('utf-8');
}

// ---------------------------------------------------------------------------
// Password generation
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random password.
 * @param length   Desired length (1–256, default 16).
 * @param options  Character classes to include.
 */
export function generatePassword(
  length = 16,
  options: PasswordOptions = {},
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
    charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  const safeLength = Math.max(1, Math.min(length, 256));
  let password = '';
  for (let i = 0; i < safeLength; i++) {
    password += charset[randomInt(charset.length)];
  }
  return password;
}

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

/**
 * Generate a hex-encoded hash of a string.
 * @param value     Input text to hash.
 * @param algorithm Hash algorithm (default: sha256).
 */
export function generateHash(
  value: string,
  algorithm: HashAlgorithm = 'sha256',
): string {
  return createHash(algorithm).update(value, 'utf-8').digest('hex');
}

// ---------------------------------------------------------------------------
// Random string
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random alphanumeric string.
 * @param length Desired length (1–1024, default 16).
 */
export function generateRandomString(length = 16): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const safeLength = Math.max(1, Math.min(length, 1024));
  let result = '';
  for (let i = 0; i < safeLength; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

// ---------------------------------------------------------------------------
// NanoID
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random NanoID-style identifier.
 * @param size Length of the ID (1–128, default 21).
 */
export function generateNanoId(size = 21): string {
  const safeSize = Math.max(1, Math.min(size, 128));
  let id = '';
  for (let i = 0; i < safeSize; i++) {
    id += NANO_ALPHABET[randomInt(NANO_ALPHABET.length)];
  }
  return id;
}

// ---------------------------------------------------------------------------
// JWT decoding (Node.js — uses Buffer for base64url)
// ---------------------------------------------------------------------------

/**
 * Decode a JWT token without verifying its signature (Node.js version).
 *
 * WARNING: This does NOT verify the token signature. Do not use decoded
 * contents to make security decisions in production code.
 */
export function decodeJwt(token: string): JwtDecodeResult {
  return sharedDecodeJwt(token.trim(), (str: string) => {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(padded, 'base64').toString('utf-8');
  });
}
