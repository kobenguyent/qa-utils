import { Router } from 'express';
import { countTextStats, validateEmail, decodeJwt, testRegex } from '../tools';
import { TextStatsSchema, EmailValidateSchema, JwtDecodeSchema, RegexSchema } from '../schemas';

export const analysersRouter = Router();

/**
 * @openapi
 * /api/analysers/text-stats:
 *   post:
 *     tags: [Analysers]
 *     summary: Count characters, words, sentences, lines and paragraphs
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
 *                 example: "Hello world. How are you?\nI am fine."
 *     responses:
 *       200:
 *         description: Text statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 characters:
 *                   type: integer
 *                 charactersNoSpaces:
 *                   type: integer
 *                 words:
 *                   type: integer
 *                 sentences:
 *                   type: integer
 *                 lines:
 *                   type: integer
 *                 paragraphs:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
analysersRouter.post('/text-stats', (req, res) => {
  const parsed = TextStatsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json(countTextStats(parsed.data.value));
});

/**
 * @openapi
 * /api/analysers/email:
 *   post:
 *     tags: [Analysers]
 *     summary: Validate an email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                   nullable: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
analysersRouter.post('/email', (req, res) => {
  const parsed = EmailValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json(validateEmail(parsed.data.email));
});

/**
 * @openapi
 * /api/analysers/jwt:
 *   post:
 *     tags: [Analysers]
 *     summary: Decode a JWT token (without signature verification)
 *     description: |
 *       Decodes the header and payload of a JWT token.
 *       **WARNING:** This does NOT verify the signature. Do not use decoded
 *       claims to make security decisions in production code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *     responses:
 *       200:
 *         description: Decoded JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 header:
 *                   type: object
 *                   nullable: true
 *                 payload:
 *                   type: object
 *                   nullable: true
 *                 signature:
 *                   type: string
 *                   nullable: true
 *                 expired:
 *                   type: boolean
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
analysersRouter.post('/jwt', (req, res) => {
  const parsed = JwtDecodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json(decodeJwt(parsed.data.token));
});

/**
 * @openapi
 * /api/analysers/regex:
 *   post:
 *     tags: [Analysers]
 *     summary: Test a regular expression against text
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pattern, text]
 *             properties:
 *               pattern:
 *                 type: string
 *                 example: "\\d+"
 *               text:
 *                 type: string
 *                 example: "Order 123 and item 456"
 *               flags:
 *                 type: string
 *                 default: "gi"
 *                 example: "gi"
 *     responses:
 *       200:
 *         description: Regex test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       match:
 *                         type: string
 *                       groups:
 *                         type: array
 *                         items:
 *                           type: string
 *                           nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
analysersRouter.post('/regex', (req, res) => {
  const parsed = RegexSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { pattern, text, flags } = parsed.data;
  res.json(testRegex(pattern, flags, text));
});
