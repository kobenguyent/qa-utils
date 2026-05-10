import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'node:path';

import { generatorsRouter } from './routes/generators';
import { convertersRouter } from './routes/converters';
import { analysersRouter } from './routes/analysers';
import { formattersRouter } from './routes/formatters';
import { agentsRouter } from './routes/agents';
import { graphqlRouter } from './routes/graphql';

// ── Swagger / OpenAPI spec ────────────────────────────────────────────────────

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'QA Utils API',
      version: '1.0.0',
      description:
        'REST API for QA Utils — exposes all tool functions as HTTP endpoints. ' +
        'Use the Swagger UI below to explore and test every endpoint interactively, ' +
        'or import the OpenAPI spec into your automation framework.',
      contact: {
        name: 'KobeT',
        url: 'https://github.com/kobenguyent/qa-utils',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      { url: 'http://localhost:3333', description: 'Local development' },
    ],
    tags: [
      { name: 'Generators', description: 'Generate UUIDs, passwords, NanoIDs, lorem ipsum, random strings' },
      { name: 'Converters', description: 'Base64, URL, hash, color, timestamp, base and case converters' },
      { name: 'Analysers', description: 'Text stats, email validation, JWT decoding, regex testing' },
      { name: 'Formatters', description: 'JSON formatting, HTML sanitization, SQL generation' },
      { name: 'Agents', description: 'Autonomous AI agent — run multi-step tasks with built-in tools' },
      { name: 'GraphQL', description: 'Proxy GraphQL queries, mutations and introspection to any endpoint' },
      { name: 'Health', description: 'Service health check' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Request body failed schema validation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Validation failed' },
                  details: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  },
  // Scan route files for @openapi JSDoc comments
  apis: [path.join(__dirname, 'routes/*.js'), path.join(__dirname, 'routes/*.ts'), __filename],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ── App factory ───────────────────────────────────────────────────────────────

export function createApp() {
  const app = express();

  // ── Security headers (helmet) ───────────────────────────────────────────────
  app.use(
    helmet({
      // Relax CSP for Swagger UI which loads external resources
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3333', 'http://localhost:5173', 'http://localhost:4173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    }),
  );

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '300', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  app.use(express.json({ limit: '1mb' }));

  // ── Swagger UI ──────────────────────────────────────────────────────────────
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'QA Utils API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );

  // ── OpenAPI JSON spec (for import into Postman / Playwright / etc.) ─────────
  /**
   * @openapi
   * /openapi.json:
   *   get:
   *     tags: [Health]
   *     summary: Raw OpenAPI 3.0 spec (JSON)
   *     responses:
   *       200:
   *         description: OpenAPI spec
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.get('/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ── Health ──────────────────────────────────────────────────────────────────
  /**
   * @openapi
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Service health check
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 version:
   *                   type: string
   *                   example: "1.0.0"
   *                 uptime:
   *                   type: number
   */
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() });
  });

  // ── API routes ──────────────────────────────────────────────────────────────
  app.use('/api/generators', generatorsRouter);
  app.use('/api/converters', convertersRouter);
  app.use('/api/analysers', analysersRouter);
  app.use('/api/formatters', formattersRouter);
  app.use('/api/agents', agentsRouter);
  app.use('/api/graphql', graphqlRouter);

  // ── 404 handler ─────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
