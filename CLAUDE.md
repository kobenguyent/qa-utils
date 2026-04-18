# CLAUDE.md — Project Instructions for Claude Code

## Quick Reference

```bash
npm run lint          # ESLint — must pass (0 errors, ≤221 warnings)
npm test              # Vitest — 928+ tests must pass
npm run build         # tsc + vite build — must succeed
npm run dev           # Vite dev server
```

**Always run lint → test → build before committing.**

## Project Overview

QA Utils is a monorepo with 45+ QA tools built as a React SPA with supporting packages:

| Package | Path | Stack |
|---------|------|-------|
| Web App | `/` (root) | React 18 + TypeScript + Bootstrap 5 + Vite |
| API | `api/` | Express + TypeScript |
| CLI | `cli/` | TypeScript + Commander |
| MCP Server | `mcp-server/` | TypeScript, Model Context Protocol |
| Electron | `electron/` | Electron wrapper |
| Docs | `docs/` | VitePress |

## Architecture

### Key Files
- `src/config/navigationConfig.ts` — **Single source of truth** for all routes, nav, and search. Add new tools here.
- `src/App.tsx` — Route definitions and lazy imports
- `src/index.css` — CSS variables for theming (light + dark)
- `src/components/utils/` — 45+ tool components
- `src/utils/` — 53+ utility modules (business logic)

### Patterns
- **Tool components** use `tool-header`, `tool-header-icon`, `tool-header-title`, `tool-card`, `tool-card-header`, `tool-card-body` CSS classes
- **All routes** are lazy-loaded with `React.lazy`
- **Theming** via CSS variables: `var(--text)`, `var(--primary)`, `var(--bg)`, `var(--border-color)`, etc.
- **Tests** co-located in `__tests__/` directories next to source files

## Rules

### Must Do
- Run `npm run lint` — 0 errors required (max 221 warnings)
- Run `npm test` — all tests must pass
- Run `npm run build` — no TypeScript errors
- Add ARIA labels to all interactive elements
- Support both light and dark themes (use CSS variables, never hardcode colors)
- Add tests for new features; update tests when changing UI text/labels
- Use TypeScript strict mode — no implicit `any`

### Must Not
- Don't use explicit `any` without justification
- Don't hardcode colors — use CSS variables
- Don't skip lint/test/build checks
- Don't commit secrets, API keys, or build artifacts
- Don't add tools without a `navigationConfig.ts` entry
- Don't create empty arrow functions (lint error)
- Don't leave unused variables/imports (TypeScript error)

## Adding a New Tool

1. `src/utils/myTool.ts` — business logic
2. `src/components/utils/MyTool.tsx` — React component using tool-card pattern
3. `src/config/navigationConfig.ts` — add NavItem entry
4. `src/App.tsx` — add lazy import + route
5. `src/components/utils/__tests__/MyTool.test.tsx` — tests
6. Verify: `npm run lint && npm test && npm run build`

## Sub-package Commands

```bash
cd api && npm test          # API tests (max 0 lint warnings)
cd cli && npm test          # CLI tests (max 0 lint warnings)
cd mcp-server && npm test   # MCP server tests
```
