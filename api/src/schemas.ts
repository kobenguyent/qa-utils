import { z } from 'zod';

// ── Generators ────────────────────────────────────────────────────────────────

export const UuidSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

export const PasswordSchema = z.object({
  length: z.coerce.number().int().min(1).max(256).default(16),
  uppercase: z.coerce.boolean().default(true),
  lowercase: z.coerce.boolean().default(true),
  numbers: z.coerce.boolean().default(true),
  symbols: z.coerce.boolean().default(true),
});

export const NanoIdSchema = z.object({
  size: z.coerce.number().int().min(1).max(128).default(21),
  count: z.coerce.number().int().min(1).max(100).default(1),
});

export const LoremSchema = z.object({
  paragraphs: z.coerce.number().int().min(1).max(20).default(1),
});

export const RandomStringSchema = z.object({
  length: z.coerce.number().int().min(1).max(1024).default(16),
});

// ── Encoders / Decoders ───────────────────────────────────────────────────────

export const Base64EncodeSchema = z.object({
  value: z.string().min(1, 'value is required'),
});

export const Base64DecodeSchema = z.object({
  value: z.string().min(1, 'value is required'),
});

export const UrlEncodeSchema = z.object({
  text: z.string().min(1, 'text is required'),
});

export const UrlDecodeSchema = z.object({
  text: z.string().min(1, 'text is required'),
});

export const UrlParseSchema = z.object({
  url: z.string().min(1, 'url is required'),
});

// ── Converters ────────────────────────────────────────────────────────────────

export const HashSchema = z.object({
  value: z.string().min(1, 'value is required'),
  algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha384', 'sha512']).default('sha256'),
});

export const ColorSchema = z.object({
  input: z.string().min(1, 'input is required'),
});

export const TimestampSchema = z.object({
  value: z.union([z.string(), z.number()]).optional(),
});

export const BaseConvertSchema = z.object({
  value: z.string().min(1, 'value is required'),
  from: z.coerce.number().int().min(2).max(36).default(10),
  to: z.coerce.number().int().min(2).max(36).default(16),
});

export const CaseConvertSchema = z.object({
  text: z.string().min(1, 'text is required'),
  to: z.enum(['upper', 'lower', 'title', 'camel', 'pascal', 'snake', 'kebab', 'constant']),
});

// ── Analysers ─────────────────────────────────────────────────────────────────

export const TextStatsSchema = z.object({
  value: z.string(),
});

export const EmailValidateSchema = z.object({
  email: z.string().min(1, 'email is required'),
});

export const JwtDecodeSchema = z.object({
  token: z.string().min(1, 'token is required'),
});

export const RegexSchema = z.object({
  pattern: z.string().min(1, 'pattern is required'),
  text: z.string(),
  flags: z.string().default('gi'),
});

// ── Formatters ────────────────────────────────────────────────────────────────

export const JsonFormatSchema = z.object({
  input: z.string().min(1, 'input is required'),
  indent: z.coerce.number().int().min(0).max(8).default(2),
});

export const HtmlSanitizeSchema = z.object({
  html: z.string().min(1, 'html is required'),
});

// ── Data ──────────────────────────────────────────────────────────────────────

export const SqlGenerateSchema = z.object({
  operation: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE_TABLE']),
  tableName: z.string().min(1, 'tableName is required'),
  columns: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  whereClause: z.string().optional(),
  orderBy: z.string().optional(),
  limit: z.coerce.number().int().min(1).optional(),
});
