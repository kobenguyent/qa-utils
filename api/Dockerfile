# ── Global build args ────────────────────────────────────────────────────────
ARG NODE_IMAGE=node:20-alpine
ARG APP_PORT=3333

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm i --include=dev

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Prune dev deps
RUN npm prune --omit=dev

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runtime

LABEL org.opencontainers.image.title="qautils-cli-rest-api" \
      org.opencontainers.image.description="REST API + Swagger UI for QA Utils — 19 utility endpoints for automation testing" \
      org.opencontainers.image.source="https://github.com/kobenguyent/qa-utils" \
      org.opencontainers.image.licenses="MIT"

# Re-declare ARG so it's available in this stage
ARG APP_PORT=3333

# Non-root user for security
RUN addgroup -S qautils && adduser -S qautils -G qautils

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder --chown=qautils:qautils /app/dist ./dist
COPY --from=builder --chown=qautils:qautils /app/node_modules ./node_modules
COPY --chown=qautils:qautils package.json ./

USER qautils

ENV NODE_ENV=production \
    PORT=${APP_PORT}

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${APP_PORT}/health || exit 1

CMD ["node", "dist/index.js"]
