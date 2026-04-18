# GitHub Copilot Instructions for QA Utils

## Project Overview
QA Utils is a comprehensive collection of 45+ quality assurance tools and utilities built as a monorepo with multiple packages:
- **Web App** (root): React 18 + TypeScript + Bootstrap 5 + Vite — the main SPA
- **API** (`api/`): Express REST API server with OpenAPI spec
- **CLI** (`cli/`): Command-line interface for QA tools
- **MCP Server** (`mcp-server/`): Model Context Protocol server for AI integrations
- **Electron** (`electron/`): Desktop app wrapper
- **Docs** (`docs/`): VitePress documentation site

The project emphasizes code quality, testing, accessibility, and a polished UX with light/dark theme support.

## Architecture

### Web App Structure
```
src/
├── components/
│   ├── utils/          # 45+ tool components (one per tool)
│   ├── __tests__/      # Component tests
│   ├── hints/          # AI hint components
│   ├── istqb/          # ISTQB learning tools
│   └── terms/          # Glossary/terms tools
├── config/
│   └── navigationConfig.ts   # Single source of truth for all routes/nav
├── contexts/           # React contexts (Theme, etc.)
├── styles/             # Global styles, CSS variables, glassmorphism
├── utils/              # 53+ utility modules (business logic)
└── test/               # Test setup
```

### Key Architectural Patterns
- **Navigation config as single source of truth**: `src/config/navigationConfig.ts` drives routes, search index, and header nav. To add a new tool, add ONE entry here.
- **Tool component pattern**: Each tool has a component in `src/components/utils/` and business logic in `src/utils/`. Components use a consistent `tool-header`, `tool-card`, `tool-card-header`, `tool-card-body` CSS class structure.
- **Lazy loading**: All tool components are lazy-loaded via `React.lazy` in `App.tsx`.
- **Theme system**: CSS variables in `src/index.css` with `[data-theme="dark"]` selector. Uses `ThemeContext` for runtime switching.

## Development Workflow

### 1. Code Quality Standards

#### Linting Requirements
- **ALWAYS** run `npm run lint` before committing — it MUST pass (0 errors, max 221 warnings)
- ESLint with TypeScript support (config: `.eslintrc.cjs`)
- Linting runs in CI — PRs will fail if lint doesn't pass

#### Testing Requirements
- **ALWAYS** add tests for new features and update tests when modifying existing ones
- Run `npm test` before committing — currently 928+ tests across 71 test files
- Test files: co-located in `__tests__/` directories next to source
- Stack: Vitest + React Testing Library + jsdom
- Config: `vitest.config.ts` (main), `vitest.react.config.ts`, `vitest.simple.config.ts`

#### Build Requirements
- `npm run build` must succeed (runs `tsc && vite build`)
- TypeScript strict mode — no type errors allowed
- Watch for unused variables/imports — `tsc` treats these as errors

### 2. Code Style Guidelines

#### TypeScript
- Strict mode enabled — no implicit `any`
- Avoid explicit `any` — use proper type definitions or `unknown`
- Define interfaces for component props and data structures
- Use type inference where appropriate

#### React Components
- Functional components with hooks only
- Performance: use `React.memo`, `useCallback`, `useMemo` where beneficial
- Proper cleanup in `useEffect` hooks with correct dependency arrays
- ARIA labels required on all interactive elements
- Follow the existing tool-header/tool-card pattern for new tools

#### CSS / Styling
- Use CSS variables from `src/index.css` (e.g., `var(--text)`, `var(--primary)`, `var(--border-color)`)
- Support both light and dark themes — never hardcode colors
- Mobile-first responsive design using Bootstrap breakpoints
- Glassmorphism effects via `src/styles/glassmorphism.css`
- Tool components use `tool-header`, `tool-header-icon`, `tool-header-title`, `tool-card` classes

### 3. Accessibility Standards
- Keyboard navigation for all interactive elements
- ARIA labels and roles on buttons, inputs, modals
- Minimum 44px touch targets on mobile
- Screen reader support
- Sufficient color contrast in both themes

### 4. Adding a New Tool

1. Create utility module: `src/utils/myNewTool.ts`
2. Create component: `src/components/utils/MyNewTool.tsx`
3. Add navigation entry in `src/config/navigationConfig.ts` — search and nav update automatically
4. Add lazy import in `src/App.tsx`
5. Add route in `src/App.tsx`
6. Add tests in `src/components/utils/__tests__/MyNewTool.test.tsx`
7. Run lint, test, build

### 5. Common Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run preview          # Preview production build
npm run electron:dev     # Start Electron dev mode

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Interactive Vitest UI
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint (must pass: 0 errors, ≤221 warnings)

# Building
npm run build            # Production build (tsc + vite)
npm run build:github     # Build for GitHub Pages
npm run electron:build   # Build Electron app

# Documentation
npm run docs:dev         # VitePress dev server
npm run docs:build       # Build docs

# Sub-packages (run from their directories)
cd api && npm test       # API tests
cd cli && npm test       # CLI tests
cd mcp-server && npm test # MCP server tests
```

### 6. Git Workflow
- Branch naming: `copilot/<feature-name>` or `feature/<name>`
- Commit messages: clear, descriptive, atomic
- CI checks: lint, test, build, coverage, CodeQL security scan, Netlify deploy preview

### 7. Dependencies
- Package manager: Bun (preferred) or npm
- Framework: React 18 + TypeScript 5
- UI: Bootstrap 5 + React-Bootstrap
- Build: Vite
- Testing: Vitest + React Testing Library
- Linting: ESLint with `@typescript-eslint`
- Docs: VitePress

### 8. Theme System
- Light theme: default
- Dark theme: `[data-theme="dark"]` selector
- Auto mode: follows system `prefers-color-scheme`
- CSS variables defined in `src/index.css`
- Use `ThemeContext` for programmatic access

### 9. Before Committing Checklist
- [ ] `npm run lint` — 0 errors (max 221 warnings)
- [ ] `npm test` — all 928+ tests pass
- [ ] `npm run build` — no TypeScript errors, build succeeds
- [ ] Accessibility: ARIA labels, keyboard nav, contrast
- [ ] Mobile: responsive at 375px minimum width
- [ ] Both themes: verify light and dark modes

### 10. Common Pitfalls
- ❌ Don't skip lint/test/build — CI will catch it
- ❌ Don't use `any` without justification
- ❌ Don't hardcode colors — use CSS variables
- ❌ Don't forget ARIA labels on new interactive elements
- ❌ Don't forget to update tests when changing component text/labels
- ❌ Don't add tools without a `navigationConfig.ts` entry
- ❌ Don't commit secrets, API keys, or build artifacts

### 11. Priority Order
1. Security and accessibility (highest)
2. Bug fixes
3. Test coverage
4. Performance
5. Code quality
6. Documentation
7. New features (lowest)
