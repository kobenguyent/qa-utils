# qautils-cli-rest-api

> A REST API wrapper around [QA Utils](https://github.com/kobenguyent/qa-utils) — exposes all 19 utility tools as HTTP endpoints with a built-in **Swagger UI** and an **OpenAPI 3.0 spec** ready for your automation stack.

Inspired by [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api).

---

## Quick Start

### Docker (recommended)

```bash
docker run -d \
  --name qautils-cli-rest-api \
  -p 3333:3333 \
  ghcr.io/kobenguyent/qautils-cli-rest-api:latest
```

Then open:
- **Swagger UI:** http://localhost:3333/api-docs
- **OpenAPI JSON:** http://localhost:3333/openapi.json

---

### Docker Compose

```bash
# from the repo root
docker-compose up -d
```

Or create your own `docker-compose.yml`:

```yaml
services:
  qautils-cli-rest-api:
    image: ghcr.io/kobenguyent/qautils-cli-rest-api:latest
    container_name: qautils-cli-rest-api
    restart: unless-stopped
    ports:
      - "3333:3333"
```

---

### Local (Node.js ≥ 20)

```bash
cd api
npm install
npm run dev      # dev server with hot-reload
npm run build && npm start   # production
```

---

## Endpoints

| Group | Endpoints |
|---|---|
| **Generators** | `POST /api/generators/uuid` · `/password` · `/nanoid` · `/lorem` · `/random-string` |
| **Converters** | `POST /api/converters/base64/encode` · `/decode` · `/url/encode` · `/decode` · `/parse` · `/hash` · `/color` · `/timestamp` · `/base` · `/case` |
| **Analysers** | `POST /api/analysers/text-stats` · `/email` · `/jwt` · `/regex` |
| **Formatters** | `POST /api/formatters/json` · `/html-sanitize` · `/sql` |
| **Health** | `GET /health` · `GET /openapi.json` |

Full interactive docs at `/api-docs` once running.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3333` | Port the server listens on |
| `NODE_ENV` | `production` | Node environment |

---

## Use in Automation Tests

### Import into Postman
1. Copy `http://localhost:3333/openapi.json`
2. Postman → **Import** → paste URL

### Generate a TypeScript client (Playwright / Vitest)
```bash
npx openapi-typescript http://localhost:3333/openapi.json -o src/api-types.ts
```

### Export spec to file
```bash
npm run export:spec   # writes api/openapi.json
```

---

## Example: curl

```bash
# Generate 3 UUIDs
curl -s -X POST http://localhost:3333/api/generators/uuid \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}' | jq .

# Hash a string with SHA256
curl -s -X POST http://localhost:3333/api/converters/hash \
  -H "Content-Type: application/json" \
  -d '{"value": "hello world", "algorithm": "sha256"}' | jq .

# Validate an email
curl -s -X POST http://localhost:3333/api/analysers/email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}' | jq .

# Generate a SELECT statement
curl -s -X POST http://localhost:3333/api/formatters/sql \
  -H "Content-Type: application/json" \
  -d '{"operation":"SELECT","tableName":"users","whereClause":"id=1","limit":10}' | jq .
```

---

## License

MIT
