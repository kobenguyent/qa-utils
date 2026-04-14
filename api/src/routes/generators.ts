import { Router } from 'express';
import {
  generateUuids, generatePassword, generateNanoId,
  generateLoremIpsum, generateRandomString,
} from '../tools';
import {
  UuidSchema, PasswordSchema, NanoIdSchema,
  LoremSchema, RandomStringSchema,
} from '../schemas';

export const generatorsRouter = Router();

/**
 * @openapi
 * /api/generators/uuid:
 *   post:
 *     tags: [Generators]
 *     summary: Generate UUIDs (v4)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Generated UUIDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuids:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                 count:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
generatorsRouter.post('/uuid', (req, res) => {
  const parsed = UuidSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const uuids = generateUuids(parsed.data.quantity);
  res.json({ uuids, count: uuids.length });
});

/**
 * @openapi
 * /api/generators/password:
 *   post:
 *     tags: [Generators]
 *     summary: Generate a cryptographically secure password
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               length:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 256
 *                 default: 16
 *               uppercase:
 *                 type: boolean
 *                 default: true
 *               lowercase:
 *                 type: boolean
 *                 default: true
 *               numbers:
 *                 type: boolean
 *                 default: true
 *               symbols:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Generated password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 password:
 *                   type: string
 *                   example: "aB3!xK9@"
 *                 length:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
generatorsRouter.post('/password', (req, res) => {
  const parsed = PasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { length, ...options } = parsed.data;
  const password = generatePassword(length, options);
  res.json({ password, length: password.length });
});

/**
 * @openapi
 * /api/generators/nanoid:
 *   post:
 *     tags: [Generators]
 *     summary: Generate NanoID-style IDs
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 128
 *                 default: 21
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 1
 *     responses:
 *       200:
 *         description: Generated NanoIDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ids:
 *                   type: array
 *                   items:
 *                     type: string
 *                 count:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
generatorsRouter.post('/nanoid', (req, res) => {
  const parsed = NanoIdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { size, count } = parsed.data;
  const ids = Array.from({ length: count }, () => generateNanoId(size));
  res.json({ ids, count: ids.length });
});

/**
 * @openapi
 * /api/generators/lorem:
 *   post:
 *     tags: [Generators]
 *     summary: Generate Lorem Ipsum placeholder text
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paragraphs:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 1
 *     responses:
 *       200:
 *         description: Lorem ipsum text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 paragraphs:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
generatorsRouter.post('/lorem', (req, res) => {
  const parsed = LoremSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const text = generateLoremIpsum(parsed.data.paragraphs);
  res.json({ text, paragraphs: parsed.data.paragraphs });
});

/**
 * @openapi
 * /api/generators/random-string:
 *   post:
 *     tags: [Generators]
 *     summary: Generate a cryptographically random alphanumeric string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               length:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1024
 *                 default: 16
 *     responses:
 *       200:
 *         description: Random string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: string
 *                 length:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
generatorsRouter.post('/random-string', (req, res) => {
  const parsed = RandomStringSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const value = generateRandomString(parsed.data.length);
  res.json({ value, length: value.length });
});
