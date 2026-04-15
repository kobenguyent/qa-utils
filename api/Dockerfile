# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

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

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="qautils-cli-rest-api" \
      org.opencontainers.image.description="REST API + Swagger UI for QA Utils — 19 utility endpoints for automation testing" \
      org.opencontainers.image.source="https://github.com/kobenguyent/qa-utils" \
      org.opencontainers.image.licenses="MIT"

# Non-root user for security
RUN addgroup -S qautils && adduser -S qautils -G qautils

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder --chown=qautils:qautils /app/dist ./dist
COPY --from=builder --chown=qautils:qautils /app/node_modules ./node_modules
COPY --chown=qautils:qautils package.json ./

USER qautils

ENV NODE_ENV=production \
    PORT=3333

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3333/health || exit 1

CMD ["node", "dist/index.js"]
