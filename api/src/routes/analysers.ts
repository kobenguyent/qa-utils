import { Router } from 'express';
import { countTextStats, validateEmail, decodeJwt, testRegex, compareTexts } from '../tools';
import { TextStatsSchema, EmailValidateSchema, JwtDecodeSchema, RegexSchema, TextCompareSchema } from '../schemas';

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
 *                 example: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJKYW5lIERvZSJ9.EXAMPLE_SIGNATURE_NOT_REAL"
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

/**
 * @openapi
 * /api/analysers/compare:
 *   post:
 *     tags: [Analysers]
 *     summary: Compare two text inputs and produce a line-by-line diff with similarity scoring
 *     description: |
 *       Accepts two plain-text strings and returns a structured diff with
 *       same / added / removed / modified classification for every line.
 *       Uses an LCS (Longest Common Subsequence) algorithm for optimal alignment
 *       and Levenshtein distance for similarity scoring on near-matches.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text1, text2]
 *             properties:
 *               text1:
 *                 type: string
 *                 description: First text to compare
 *                 example: "line 1\nline 2\nline 3"
 *               text2:
 *                 type: string
 *                 description: Second text to compare
 *                 example: "line 1\nline 2 modified\nline 4"
 *               ignoreWhitespace:
 *                 type: boolean
 *                 default: false
 *                 description: Collapse whitespace before comparing
 *               ignoreCase:
 *                 type: boolean
 *                 default: false
 *                 description: Case-insensitive comparison
 *               ignoreBlankLines:
 *                 type: boolean
 *                 default: false
 *                 description: Skip blank lines
 *               similarityThreshold:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.6
 *                 description: Minimum similarity ratio (0–1) to classify a removed+added pair as "modified" instead of separate entries
 *     responses:
 *       200:
 *         description: Comparison result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 similarity:
 *                   type: integer
 *                   description: Overall similarity percentage (0–100)
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalLines:
 *                       type: integer
 *                     sameLines:
 *                       type: integer
 *                     addedLines:
 *                       type: integer
 *                     removedLines:
 *                       type: integer
 *                     modifiedLines:
 *                       type: integer
 *                     similarityPercentage:
 *                       type: integer
 *                 diffLines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [same, added, removed, modified]
 *                       lineNumber1:
 *                         type: integer
 *                         nullable: true
 *                       lineNumber2:
 *                         type: integer
 *                         nullable: true
 *                       content:
 *                         type: string
 *                       oldContent:
 *                         type: string
 *                         nullable: true
 *                       similarity:
 *                         type: integer
 *                         nullable: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
analysersRouter.post('/compare', (req, res) => {
  const parsed = TextCompareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { text1, text2, ignoreWhitespace, ignoreCase, ignoreBlankLines, similarityThreshold } = parsed.data;
  res.json(compareTexts(text1, text2, { ignoreWhitespace, ignoreCase, ignoreBlankLines, similarityThreshold }));
});
