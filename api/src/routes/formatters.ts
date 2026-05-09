import { Router } from 'express';
import { formatJson, sanitizeHtml, generateSql, convertMarkdownToConfluence } from '../tools';
import { JsonFormatSchema, HtmlSanitizeSchema, SqlGenerateSchema, MarkdownToConfluenceSchema } from '../schemas';

export const formattersRouter = Router();

/**
 * @openapi
 * /api/formatters/json:
 *   post:
 *     tags: [Formatters]
 *     summary: Parse and pretty-print JSON
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
 *                 example: '{"name":"Alice","age":30}'
 *               indent:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 8
 *                 default: 2
 *     responses:
 *       200:
 *         description: Formatted JSON result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formatted:
 *                   type: string
 *                 valid:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   nullable: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
formattersRouter.post('/json', (req, res) => {
  const parsed = JsonFormatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json(formatJson(parsed.data.input, parsed.data.indent));
});

/**
 * @openapi
 * /api/formatters/html-sanitize:
 *   post:
 *     tags: [Formatters]
 *     summary: Strip script tags and inline event handlers from HTML
 *     description: |
 *       Removes `<script>` blocks and `on*` event attributes from HTML.
 *       **Note:** For production sanitization use a dedicated library like DOMPurify.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [html]
 *             properties:
 *               html:
 *                 type: string
 *                 example: '<p onclick="alert(1)">Hello</p><script>alert(2)</script>'
 *     responses:
 *       200:
 *         description: Sanitized HTML
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sanitized:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
formattersRouter.post('/html-sanitize', (req, res) => {
  const parsed = HtmlSanitizeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json({ sanitized: sanitizeHtml(parsed.data.html) });
});

/**
 * @openapi
 * /api/formatters/sql:
 *   post:
 *     tags: [Formatters]
 *     summary: Generate a SQL statement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [operation, tableName]
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [SELECT, INSERT, UPDATE, DELETE, CREATE_TABLE]
 *                 example: SELECT
 *               tableName:
 *                 type: string
 *                 example: users
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["id", "name", "email"]
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["1", "Alice", "alice@example.com"]
 *               whereClause:
 *                 type: string
 *                 example: "id = 1"
 *               orderBy:
 *                 type: string
 *                 example: "name ASC"
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *     responses:
 *       200:
 *         description: Generated SQL statement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sql:
 *                   type: string
 *                   example: "SELECT id, name, email FROM users WHERE id = 1 ORDER BY name ASC LIMIT 10;"
 *                 operation:
 *                   type: string
 *                 tableName:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
formattersRouter.post('/sql', (req, res) => {
  const parsed = SqlGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const { operation, tableName, ...rest } = parsed.data;
  res.json({
    sql: generateSql({ operation, tableName, ...rest }),
    operation,
    tableName,
  });
});

/**
 * @openapi
 * /api/formatters/markdown-to-confluence:
 *   post:
 *     tags: [Formatters]
 *     summary: Convert Markdown to Confluence Wiki markup
 *     description: |
 *       Converts a Markdown document to Confluence Wiki markup syntax.
 *       Supports headings, bold, italic, strikethrough, inline code,
 *       fenced code blocks, tables, ordered and unordered lists,
 *       links, images, blockquotes, and horizontal rules.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [markdown]
 *             properties:
 *               markdown:
 *                 type: string
 *                 example: "# Hello\n\nSome **bold** and _italic_ text.\n\n- Item 1\n- Item 2"
 *     responses:
 *       200:
 *         description: Converted Confluence Wiki markup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 confluence:
 *                   type: string
 *                   description: Confluence Wiki markup output
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
formattersRouter.post('/markdown-to-confluence', (req, res) => {
  const parsed = MarkdownToConfluenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  res.json({ confluence: convertMarkdownToConfluence(parsed.data.markdown) });
});
