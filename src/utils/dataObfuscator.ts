/**
 * Data Obfuscator — Sensitive Data Protection for AI Requests
 *
 * Detects and replaces common sensitive data patterns (emails, phone numbers,
 * credit cards, SSNs, API keys, JWT tokens, IPs, etc.) with labelled
 * placeholders before messages are sent to AI providers, reducing the risk
 * of accidental data leakage.
 *
 * The returned ObfuscationResult includes a mapping so the caller can
 * optionally restore original values in the AI response.
 */

import { ChatMessage } from './aiChatClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ObfuscationPatternType =
  | 'email'
  | 'phone'
  | 'creditCard'
  | 'ssn'
  | 'apiKey'
  | 'jwt'
  | 'ipAddress'
  | 'urlCredentials'
  | 'awsKey'
  | 'privateKey';

export interface ObfuscationOptions {
  /** Patterns to enable — all enabled by default */
  patterns?: ObfuscationPatternType[];
  /** When true, system messages are also obfuscated (default: false) */
  obfuscateSystemMessages?: boolean;
}

export interface DetectedItem {
  type: ObfuscationPatternType;
  original: string;
  placeholder: string;
}

export interface ObfuscationResult {
  obfuscatedText: string;
  /** Map from placeholder → original value */
  mapping: Map<string, string>;
  detectedItems: DetectedItem[];
}

export interface ObfuscatedMessages {
  messages: ChatMessage[];
  /** Combined mapping across all messages */
  mapping: Map<string, string>;
  /** All detected items across all messages */
  detectedItems: DetectedItem[];
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface PatternDef {
  type: ObfuscationPatternType;
  label: string;
  regex: RegExp;
}

const PATTERN_DEFS: PatternDef[] = [
  {
    type: 'privateKey',
    label: 'PRIVATE_KEY',
    // PEM-encoded private keys (RSA, EC, etc.)
    regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
  },
  {
    type: 'urlCredentials',
    label: 'URL_CRED',
    // URLs containing user:password@ — must run before email so the @ is not misidentified
    regex: /https?:\/\/[^:@\s]+:[^@\s]+@[^\s]+/gi,
  },
  {
    type: 'jwt',
    label: 'JWT',
    // Three base64url segments separated by dots
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  },
  {
    type: 'awsKey',
    label: 'AWS_KEY',
    // AWS access key IDs (AKIA…) and secret access keys (40-char alphanumeric)
    regex: /(?:AKIA|AIPA|AIDA|AROA|ASIA)[A-Z0-9]{16}|(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
  },
  {
    type: 'apiKey',
    label: 'API_KEY',
    // Common bearer tokens / API key patterns: sk-*, Bearer xxx, api_key=xxx, apikey: xxx
    regex: /(?:Bearer\s+|(?:api[-_]?key|access[-_]?token|auth[-_]?token|secret[-_]?key)\s*[:=]\s*)["']?([A-Za-z0-9\-_.~+/]{20,})["']?/gi,
  },
  {
    type: 'creditCard',
    label: 'CARD',
    // 12-19 digit card numbers (Luhn-pattern groups with optional separators)
    regex: /\b(?:\d[ -]?){11,18}\d\b/g,
  },
  {
    type: 'ssn',
    label: 'SSN',
    // US Social Security Numbers
    regex: /\b(?!000|666|9\d\d)\d{3}[-\s](?!00)\d{2}[-\s](?!0000)\d{4}\b/g,
  },
  {
    type: 'email',
    label: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    type: 'phone',
    label: 'PHONE',
    // International and US phone numbers
    regex: /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  {
    type: 'ipAddress',
    label: 'IP',
    // IPv4 addresses (not localhost)
    regex: /\b(?!127\.|0\.|255\.)(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },
];

// ---------------------------------------------------------------------------
// Core obfuscation logic
// ---------------------------------------------------------------------------

/**
 * Obfuscate sensitive data in a single string.
 *
 * Each unique sensitive value gets a stable, numbered placeholder within this
 * call (e.g. the first email found is always `[EMAIL_1]`). The returned
 * mapping can be used to restore placeholders later.
 */
export function obfuscateText(
  text: string,
  options: ObfuscationOptions = {},
): ObfuscationResult {
  const enabledPatterns = options.patterns ?? PATTERN_DEFS.map(p => p.type);
  const mapping = new Map<string, string>();
  const detectedItems: DetectedItem[] = [];

  // Counters per label type
  const counters: Partial<Record<string, number>> = {};

  let result = text;

  for (const def of PATTERN_DEFS) {
    if (!enabledPatterns.includes(def.type)) continue;

    def.regex.lastIndex = 0; // reset stateful regex

    result = result.replace(def.regex, (match) => {
      // Check if we already have a placeholder for this exact value
      for (const [placeholder, original] of mapping.entries()) {
        if (original === match) return placeholder;
      }

      const count = (counters[def.label] ?? 0) + 1;
      counters[def.label] = count;
      const placeholder = `[${def.label}_${count}]`;

      mapping.set(placeholder, match);
      detectedItems.push({ type: def.type, original: match, placeholder });

      return placeholder;
    });
  }

  return { obfuscatedText: result, mapping, detectedItems };
}

/**
 * Restore obfuscated placeholders in a string using the mapping returned by
 * `obfuscateText`.
 */
export function deobfuscateText(
  text: string,
  mapping: Map<string, string>,
): string {
  let result = text;
  for (const [placeholder, original] of mapping.entries()) {
    result = result.split(placeholder).join(original);
  }
  return result;
}

/**
 * Obfuscate sensitive data in an array of chat messages.
 *
 * By default only `user` messages are obfuscated. Pass
 * `obfuscateSystemMessages: true` to include system messages as well.
 *
 * The mapping is cumulative across all messages so the same value always maps
 * to the same placeholder, preventing the AI from noticing duplicates.
 */
export function obfuscateMessages(
  messages: ChatMessage[],
  options: ObfuscationOptions = {},
): ObfuscatedMessages {
  const combinedMapping = new Map<string, string>();
  const allDetectedItems: DetectedItem[] = [];
  const enabledPatterns = options.patterns ?? PATTERN_DEFS.map(p => p.type);
  const obfuscateSystem = options.obfuscateSystemMessages ?? false;

  // Build a shared counter state across messages
  const counters: Partial<Record<string, number>> = {};

  const obfuscatedMessages = messages.map((msg): ChatMessage => {
    if (msg.role === 'system' && !obfuscateSystem) {
      return msg;
    }

    let content = msg.content;

    for (const def of PATTERN_DEFS) {
      if (!enabledPatterns.includes(def.type)) continue;

      def.regex.lastIndex = 0;

      content = content.replace(def.regex, (match) => {
        // Reuse an existing placeholder if this exact value was already seen
        for (const [placeholder, original] of combinedMapping.entries()) {
          if (original === match) return placeholder;
        }

        const count = (counters[def.label] ?? 0) + 1;
        counters[def.label] = count;
        const placeholder = `[${def.label}_${count}]`;

        combinedMapping.set(placeholder, match);
        allDetectedItems.push({ type: def.type, original: match, placeholder });

        return placeholder;
      });
    }

    return { ...msg, content };
  });

  return {
    messages: obfuscatedMessages,
    mapping: combinedMapping,
    detectedItems: allDetectedItems,
  };
}

/**
 * Return a summary of detected sensitive data types (without exposing the
 * actual values) for display in the UI.
 */
export function summarizeDetections(detectedItems: DetectedItem[]): string {
  if (detectedItems.length === 0) return '';

  const counts: Partial<Record<ObfuscationPatternType, number>> = {};
  for (const item of detectedItems) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }

  const labels: Record<ObfuscationPatternType, string> = {
    email: 'email address',
    phone: 'phone number',
    creditCard: 'credit card number',
    ssn: 'SSN',
    apiKey: 'API key/token',
    jwt: 'JWT token',
    ipAddress: 'IP address',
    urlCredentials: 'URL with credentials',
    awsKey: 'AWS key',
    privateKey: 'private key',
  };

  const plurals: Partial<Record<ObfuscationPatternType, string>> = {
    email: 'email addresses',
    phone: 'phone numbers',
    creditCard: 'credit card numbers',
    ssn: 'SSNs',
    apiKey: 'API keys/tokens',
    jwt: 'JWT tokens',
    ipAddress: 'IP addresses',
    urlCredentials: 'URLs with credentials',
    awsKey: 'AWS keys',
    privateKey: 'private keys',
  };

  return Object.entries(counts)
    .map(([type, count]) => {
      const t = type as ObfuscationPatternType;
      const label = count! > 1 ? (plurals[t] ?? `${labels[t]}s`) : labels[t];
      return `${count} ${label}`;
    })
    .join(', ');
}
