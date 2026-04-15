import { Router } from 'express';
import {
  base64Encode, base64Decode, urlEncode, urlDecode, parseUrl,
  generateHash, convertColor, convertTimestamp, convertBase, convertCase,
} from '../tools';
import {
  Base64EncodeSchema, Base64DecodeSchema,
  UrlEncodeSchema, UrlDecodeSchema, UrlParseSchema,
  HashSchema, ColorSchema, TimestampSchema,
  BaseConvertSchema, CaseConvertSchema,
} from '../schemas';

export const convertersRouter = Router();

/**
 * @openapi
 * /api/converters/base64/encode:
 *   post:
 *     tags: [Converters]
 *     summary: Encode a string to Base64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 example: "Hello, World!"
 *     responses:
 *       200:
 *         description: Base64 encoded result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 encoded:
 *                   type: string
 *                   example: "SGVsbG8sIFdvcmxkIQ=="
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
convertersRouter.post('/base64/encode', (req, res) => {
  const parsed = Base64EncodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json({ encoded: base64Encode(parsed.data.value) });
});

/**
 * @openapi
 * /api/converters/base64/decode:
 *   post:
 *     tags: [Converters]
 *     summary: Decode a Base64 string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 example: "SGVsbG8sIFdvcmxkIQ=="
 *     responses:
 *       200:
 *         description: Decoded string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 decoded:
 *                   type: string
 *                   example: "Hello, World!"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       422:
 *         description: Invalid Base64 input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
convertersRouter.post('/base64/decode', (req, res) => {
  const parsed = Base64DecodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  try {
    res.json({ decoded: base64Decode(parsed.data.value) });
  } catch (e) {
    res.status(422).json({ error: e instanceof Error ? e.message : 'Invalid Base64' });
  }
});

/**
 * @openapi
 * /api/converters/url/encode:
 *   post:
 *     tags: [Converters]
 *     summary: Percent-encode a URL string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "hello world & more"
 *     responses:
 *       200:
 *         description: URL-encoded result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 encoded:
 *                   type: string
 *                   example: "hello%20world%20%26%20more"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
convertersRouter.post('/url/encode', (req, res) => {
  const parsed = UrlEncodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json({ encoded: urlEncode(parsed.data.text) });
});

/**
 * @openapi
 * /api/converters/url/decode:
 *   post:
 *     tags: [Converters]
 *     summary: Decode a percent-encoded URL string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "hello%20world%20%26%20more"
 *     responses:
 *       200:
 *         description: Decoded result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 decoded:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       422:
 *         description: Invalid percent-encoded string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
convertersRouter.post('/url/decode', (req, res) => {
  const parsed = UrlDecodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  try {
    res.json({ decoded: urlDecode(parsed.data.text) });
  } catch (e) {
    res.status(422).json({ error: e instanceof Error ? e.message : 'Invalid encoded string' });
  }
});

/**
 * @openapi
 * /api/converters/url/parse:
 *   post:
 *     tags: [Converters]
 *     summary: Parse a URL into its components
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://example.com/path?foo=bar&baz=1#section"
 *     responses:
 *       200:
 *         description: Parsed URL components
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protocol:
 *                   type: string
 *                 host:
 *                   type: string
 *                 hostname:
 *                   type: string
 *                 port:
 *                   type: string
 *                 pathname:
 *                   type: string
 *                 search:
 *                   type: string
 *                 hash:
 *                   type: string
 *                 params:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       422:
 *         description: Invalid URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
convertersRouter.post('/url/parse', (req, res) => {
  const parsed = UrlParseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const result = parseUrl(parsed.data.url);
  if (!result.parsed) {
    res.status(422).json({ error: result.error ?? 'Invalid URL' });
    return;
  }
  res.json(result.parsed);
});

/**
 * @openapi
 * /api/converters/hash:
 *   post:
 *     tags: [Converters]
 *     summary: Generate a hash of a string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 example: "hello world"
 *               algorithm:
 *                 type: string
 *                 enum: [md5, sha1, sha256, sha384, sha512]
 *                 default: sha256
 *     responses:
 *       200:
 *         description: Hash result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                 algorithm:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
convertersRouter.post('/hash', (req, res) => {
  const parsed = HashSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { value, algorithm } = parsed.data;
  res.json({ hash: generateHash(value, algorithm), algorithm });
});

/**
 * @openapi
 * /api/converters/color:
 *   post:
 *     tags: [Converters]
 *     summary: Convert a color between HEX, RGB, and HSL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [input]
 *             properties:
 *               input:
 *                 type: string
 *                 example: "#FF5733"
 *                 description: "Accepts: #RRGGBB, #RGB, rgb(r, g, b)"
 *     responses:
 *       200:
 *         description: Color in all formats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hex:
 *                   type: string
 *                 rgb:
 *                   type: object
 *                   properties:
 *                     r: { type: integer }
 *                     g: { type: integer }
 *                     b: { type: integer }
 *                 hsl:
 *                   type: object
 *                   properties:
 *                     h: { type: integer }
 *                     s: { type: integer }
 *                     l: { type: integer }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       422:
 *         description: Unsupported color format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
convertersRouter.post('/color', (req, res) => {
  const parsed = ColorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const result = convertColor(parsed.data.input);
  if (result.error) {
    res.status(422).json({ error: result.error });
    return;
  }
  res.json({ hex: result.hex, rgb: result.rgb, hsl: result.hsl });
});

/**
 * @openapi
 * /api/converters/timestamp:
 *   post:
 *     tags: [Converters]
 *     summary: Convert a Unix timestamp or ISO string to multiple formats
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 description: "Unix timestamp (seconds or ms) or ISO 8601 string. Omit for current time."
 *                 example: 1700000000
 *     responses:
 *       200:
 *         description: Timestamp in multiple formats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: integer
 *                   description: Unix timestamp in seconds
 *                 iso:
 *                   type: string
 *                   format: date-time
 *                 utc:
 *                   type: string
 *                 local:
 *                   type: string
 */
convertersRouter.post('/timestamp', (req, res) => {
  const parsed = TimestampSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json(convertTimestamp(parsed.data.value));
});

/**
 * @openapi
 * /api/converters/base:
 *   post:
 *     tags: [Converters]
 *     summary: Convert a number between bases (2–36)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 example: "255"
 *               from:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 36
 *                 default: 10
 *               to:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 36
 *                 default: 16
 *     responses:
 *       200:
 *         description: Base conversion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: "FF"
 *                 decimal:
 *                   type: integer
 *                 from:
 *                   type: integer
 *                 to:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       422:
 *         description: Invalid number for given base
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
convertersRouter.post('/base', (req, res) => {
  const parsed = BaseConvertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { value, from, to } = parsed.data;
  const result = convertBase(value, from, to);
  if (result.error) {
    res.status(422).json({ error: result.error });
    return;
  }
  res.json({ result: result.result, decimal: result.decimal, from, to });
});

/**
 * @openapi
 * /api/converters/case:
 *   post:
 *     tags: [Converters]
 *     summary: Convert text to a different case style
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, to]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "hello world example"
 *               to:
 *                 type: string
 *                 enum: [upper, lower, title, camel, pascal, snake, kebab, constant]
 *                 example: camelCase
 *     responses:
 *       200:
 *         description: Converted text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: "helloWorldExample"
 *                 style:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
convertersRouter.post('/case', (req, res) => {
  const parsed = CaseConvertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { text, to } = parsed.data;
  res.json({ result: convertCase(text, to), style: to });
});
