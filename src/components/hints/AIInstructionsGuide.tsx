import { useState } from 'react';
import { Container, Nav, Badge } from 'react-bootstrap';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  heading: string;
  body: string;
}

interface AIProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  file: string;
  fileAlt?: string;
  badgeLabel: string;
  sections: Section[];
  template: string;
  tips: string[];
  antiPatterns: string[];
}

// ─── Templates ────────────────────────────────────────────────────────────────

const CLAUDE_TEMPLATE = `# Project: [Your Project Name]

## Overview
[1–2 sentences describing what this project does and its primary purpose.]

## Tech Stack
- Language: [e.g. TypeScript 5, Python 3.12]
- Framework: [e.g. React 18, FastAPI]
- Test runner: [e.g. Vitest, pytest]
- Package manager: [e.g. bun, pnpm, uv]

## Repository Layout
\`\`\`
src/
  components/   # React components
  utils/        # Pure helper functions
  test/         # Test setup & fixtures
\`\`\`

## Development Commands
\`\`\`bash
bun dev          # Start dev server
bun test         # Run all tests
bun run lint     # Lint & type-check
bun run build    # Production build
\`\`\`

## Code Style
- Use functional React components with hooks only
- Strict TypeScript — no \`any\` without justification
- Prefer named exports over default exports
- All new utilities must have unit tests

## Testing Conventions
- Co-locate tests in \`__tests__/\` next to source
- Use Vitest + React Testing Library
- Coverage threshold: 80 % lines

## Git Workflow
- Branch: \`feat/<short-slug>\` | \`fix/<short-slug>\`
- Commit format: Conventional Commits (feat/fix/chore/docs)
- PRs require passing CI before merge

## Important Notes
- Never commit secrets or API keys
- Keep bundle size < 500 kB (check with \`bun run build\`)
- Run \`bun run lint\` before every commit — max 55 warnings
`;

const CHATGPT_TEMPLATE = `## Role & Persona
You are a senior [role] specialising in [domain]. You prioritise clean, maintainable code and clear explanations.

## Project Context
- **Project**: [name and purpose]
- **Stack**: [languages, frameworks, tools]
- **Team size**: [solo / small / large]
- **Maturity**: [greenfield / legacy / production]

## Response Format
- Default to concise answers; expand only when I ask "explain in detail"
- Code blocks must include the language identifier (\`\`\`ts, \`\`\`python …)
- When suggesting file edits, show only the changed section with \`// … existing code …\` markers
- If multiple approaches exist, list them as numbered options before implementing

## Code Conventions
- Language: [e.g. TypeScript strict mode]
- Style: [e.g. Prettier defaults, 2-space indent]
- Imports: [e.g. absolute from src/, group stdlib → third-party → local]
- Tests: [e.g. Vitest + Testing Library, 80 % coverage minimum]
- Error handling: [e.g. never swallow errors; always log + rethrow]

## Constraints
- Do NOT suggest deprecated APIs
- Do NOT rewrite working code without being asked
- Do NOT add dependencies without explaining why
- Ask before changing the public API of any module

## Output Preferences
- Prefer plain English for commit messages (not emojis)
- Summarise changes at the top of long responses
- Always include a "Gotchas / caveats" section when relevant
`;

const GEMINI_TEMPLATE = `You are an expert [role] embedded in a [domain] project. Follow these guidelines in every response.

### Identity
- **Name**: [optional persona name]
- **Expertise**: [primary skill areas]
- **Tone**: Professional, direct, and collaborative

### Project Context
Project: [name] — [one-line description]
Stack: [languages, frameworks, key libraries]
Environment: [Node 20 / Python 3.12 / etc.]
Repo layout:
  src/          Application source
  tests/        Test suites
  docs/         Documentation

### Behaviour Rules
1. Always validate assumptions before writing code.
2. Prefer composition over inheritance.
3. Write self-documenting code; add comments only for non-obvious logic.
4. Include error handling in every example.
5. Suggest the simplest solution that meets requirements; avoid over-engineering.

### Response Structure
- **Short answers** (<5 lines): Answer directly.
- **Code tasks**: Provide working, runnable code with a brief explanation below.
- **Architecture questions**: Use bullet-point reasoning, then a diagram if helpful.
- **Debugging**: State your hypothesis → show the fix → explain root cause.

### Code Standards
- Language: [TypeScript / Python / etc.]
- Linting: [ESLint / Ruff / etc.]
- Formatting: [Prettier / Black / etc.]
- Tests: [framework, coverage target]

### Limitations to Respect
- Stay within the existing architecture unless asked to refactor.
- Do not introduce new third-party dependencies without listing alternatives.
- Flag breaking changes explicitly with ⚠️.
`;

const COPILOT_TEMPLATE = `# GitHub Copilot Instructions

## Project Overview
[Project name] is a [brief description]. It is built with [primary stack] and targets [user / environment].

## Development Workflow

### Before Coding
- Understand the existing code structure and patterns
- Check for related tests before changing any module
- Review current linting rules

### During Development
- Follow TypeScript strict mode — avoid \`any\`
- Add / update tests for every change
- Ensure accessibility: ARIA labels, keyboard navigation, contrast
- Consider mobile responsiveness (min 375 px viewport)

### Before Committing
- [ ] \`npm run lint\` — fix ALL issues
- [ ] \`npm test\` — all tests pass
- [ ] \`npm run build\` — no build errors
- [ ] Manual browser test (desktop + mobile)

## Code Style

### TypeScript
- Strict mode enabled
- Prefer \`interface\` for object shapes, \`type\` for unions / intersections
- Use inference where the type is obvious; annotate function signatures

### React
- Functional components with hooks only
- Memoise expensive computations with \`useMemo\` / \`useCallback\`
- Always clean up side-effects in \`useEffect\` return
- Prop types via \`interface [Name]Props\`

### File Organisation
\`\`\`
src/
  components/         # React components
    __tests__/        # Component tests (co-located)
  utils/              # Pure helper functions
  contexts/           # React contexts
  config/             # App-wide configuration
\`\`\`

## Testing
- Framework: Vitest + React Testing Library
- Location: \`__tests__/\` directories next to source
- Coverage target: 80 % lines / branches
- Always test: happy path, edge cases, error states

## Common Commands
\`\`\`bash
npm run dev          # Start dev server
npm test             # Run all tests
npm run lint         # Lint with ESLint
npm run build        # Production build
\`\`\`

## Priority Order
1. Security & accessibility (highest)
2. Bugs & broken functionality
3. Test coverage improvements
4. Performance
5. Code quality / DX
6. Documentation
7. Nice-to-have features (lowest)

## Anti-Patterns to Avoid
- ❌ Skip linting
- ❌ Use \`any\` without justification
- ❌ Ignore accessibility requirements
- ❌ Forget mobile responsiveness
- ❌ Commit secrets or build artefacts
`;

const CURSOR_TEMPLATE = `# Cursor Rules

## Project
[Project name] — [brief description]
Stack: [TypeScript / Python / etc.], [framework], [test runner]

## Code Style
- [Language] strict mode; no \`any\`
- 2-space indent, single quotes, trailing commas (ES5)
- Named exports preferred
- Files: \`kebab-case.ts\` | Components: \`PascalCase.tsx\`

## Architecture Principles
- Small, single-responsibility functions (< 40 lines)
- Pure functions for business logic; side-effects in dedicated layers
- Co-locate tests with source (\`__tests__/\` sibling directory)
- Prefer composition over inheritance

## AI Behaviour
- Show diffs, not full rewrites, when changing existing code
- Ask before adding new dependencies
- Flag breaking changes with ⚠️ BREAKING
- Provide type signatures for every new function
- If multiple solutions exist, list trade-offs before implementing

## Testing Requirements
- Every utility function needs a unit test
- Every component needs an integration test
- Test file mirrors source: \`utils/foo.ts\` → \`utils/__tests__/foo.test.ts\`
- Mock external services; never make real network calls in tests

## Git
- Branch: \`feat/<slug>\` | \`fix/<slug>\` | \`chore/<slug>\`
- Commits: Conventional Commits
- Never commit secrets, lock-files, or build output (other than intentional)
`;

const WINDSURF_TEMPLATE = `# Windsurf / Cascade Rules

## Role
You are an expert [role] working on [project name], a [description].

## Tech Stack
- Runtime: [Node 20 / Python 3.12 / etc.]
- Framework: [Next.js / FastAPI / etc.]
- Language: [TypeScript 5.4 strict / Python 3.12 w/ mypy]
- Tests: [Vitest / pytest]
- Linting: [ESLint / Ruff]

## Project Structure
\`\`\`
src/
  app/           # Routes / pages
  components/    # UI components
  lib/           # Shared utilities
  types/         # TypeScript type definitions
\`\`\`

## Coding Standards
- Strict types — no implicit \`any\`
- Prefer functional patterns; avoid classes for stateless logic
- Error handling: never silently swallow errors
- Async: prefer \`async/await\` over raw Promises
- Imports: stdlib → third-party → internal (separated by blank line)

## Cascade Behaviour
- Read existing code before suggesting changes
- Make minimal diffs — only change what is necessary
- State assumptions explicitly before writing code
- After a refactor, confirm tests still pass conceptually
- Prefer simple over clever; favour readability

## Security
- Sanitise all user inputs before processing
- Never log sensitive data (tokens, passwords, PII)
- Environment variables for all secrets
- Validate and type-check external API responses

## Performance
- Lazy-load heavy modules
- Paginate large data sets
- Debounce user input handlers (> 300 ms)
- Memoize pure functions that are called in render cycles
`;

// ─── Provider Data ─────────────────────────────────────────────────────────────

const PROVIDERS: AIProvider[] = [
  {
    id: 'claude',
    name: 'Claude',
    icon: '🟠',
    color: '#e8631a',
    tagline: 'Anthropic · CLAUDE.md',
    file: 'CLAUDE.md',
    fileAlt: 'CLAUDE.local.md (gitignored overrides)',
    badgeLabel: 'Anthropic',
    template: CLAUDE_TEMPLATE,
    sections: [
      { heading: 'File Location', body: 'Place `CLAUDE.md` at the repo root. Subdirectory `CLAUDE.md` files are also read when Claude navigates into that folder. Use `CLAUDE.local.md` for personal overrides (add to `.gitignore`).' },
      { heading: 'What to Include', body: '**Project overview** (1–2 lines), **tech stack**, **repo structure**, **common commands** (`build`, `test`, `lint`), **code conventions**, **testing strategy**, and any **gotchas** (e.g. env vars needed locally).' },
      { heading: 'What to Omit', body: 'Avoid repeating content from comments or READMEs Claude can already read. Keep it to high-signal, persistent context — not a full tutorial.' },
      { heading: 'Markdown Features', body: 'Claude supports full GitHub-flavoured Markdown. Use `# H1` for sections, fenced code blocks with language tags, and `- [ ]` checklists for workflow requirements.' },
      { heading: 'Size Guidance', body: 'Aim for under 200 lines. Every token is consumed from the context window at the start of each conversation — brevity is performance.' },
    ],
    tips: [
      'Use `## Development Commands` so Claude can suggest correct scripts without guessing.',
      'Mention linting strictness (e.g. "max 55 warnings") so Claude auto-fixes before suggesting commits.',
      'Add a `## Important Notes` section for non-obvious pitfalls (env vars, external service mocks, etc.).',
      'Use `CLAUDE.local.md` for secrets-adjacent config (never commit secrets themselves).',
      'Keep sections short — Claude infers well from compact, precise context.',
    ],
    antiPatterns: [
      'Listing every file — Claude reads the repo itself.',
      'Duplicating the README verbatim.',
      'Highly conversational prose — use bullet points and headers.',
      'Putting secrets or API keys anywhere in CLAUDE.md.',
      'Forgetting to update it when the stack changes.',
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '🟢',
    color: '#10a37f',
    tagline: 'OpenAI · Custom Instructions / System Prompt',
    file: 'chatgpt-instructions.md',
    fileAlt: 'Paste into "Custom instructions" in ChatGPT settings',
    badgeLabel: 'OpenAI',
    template: CHATGPT_TEMPLATE,
    sections: [
      { heading: 'Delivery Methods', body: '**Custom Instructions** (account-level, always prepended), **System prompt** (API / GPT Builder), or a **project-level system message** in the Assistants API. For IDEs, place this in your AI plugin\'s system prompt field.' },
      { heading: 'Structure Best Practices', body: 'Use `## Section` headers for scanability. Order: Role → Context → Format → Constraints. GPT-4o processes Markdown well — use it for lists and emphasis.' },
      { heading: 'Token Budget', body: 'Custom Instructions are limited to ~1 500 characters each field. For API system prompts there is no hard limit, but keep under 1 000 tokens to leave room for conversation history.' },
      { heading: 'Response Format Control', body: 'Explicitly describe your desired output: length, code style, whether to show alternatives, how to handle uncertainty. GPT follows explicit format instructions reliably.' },
      { heading: 'Persona & Tone', body: 'Define a concrete role ("senior TypeScript engineer") rather than a vague one ("helpful assistant"). Specificity improves response quality significantly.' },
    ],
    tips: [
      'State "ask clarifying questions before writing code" to reduce incorrect assumptions.',
      'Include "show only the diff, not the full file" to save context window space.',
      'Add "never use deprecated APIs" — ChatGPT sometimes suggests old syntax.',
      'Specify your target runtime / browser support to avoid incompatible suggestions.',
      'Use "Constraints" section for hard rules ChatGPT must follow without exception.',
    ],
    antiPatterns: [
      'Writing a novel — Custom Instructions have a character limit.',
      'Vague roles like "you are helpful" instead of a concrete persona.',
      'Forgetting to specify the output format — leads to inconsistent responses.',
      'Repeating constraints ChatGPT already follows by default.',
      'Using Custom Instructions for project-specific context — use a System prompt instead.',
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '🔵',
    color: '#4285f4',
    tagline: 'Google · System Instructions',
    file: 'gemini-context.md',
    fileAlt: 'Paste into "System instructions" in AI Studio / Gemini API',
    badgeLabel: 'Google',
    template: GEMINI_TEMPLATE,
    sections: [
      { heading: 'Delivery Methods', body: '**AI Studio** "System instructions" field, **Gemini API** `system_instruction` parameter, or **Vertex AI** system prompt. For IDEs (e.g. Android Studio Gemini), use the plugin\'s context file.' },
      { heading: 'Markdown Support', body: 'Gemini 1.5+ parses Markdown in system instructions. Use `###` headings, numbered lists for sequential rules, and fenced code blocks for examples.' },
      { heading: 'Context Window', body: 'Gemini 1.5 Pro supports up to 1 M tokens — you can include large context files. However, concise instructions are processed more reliably than verbose ones.' },
      { heading: 'Grounding & Safety', body: 'Gemini applies Google\'s safety filters. Avoid instructions that conflict with safety policies. Use `safetySettings` in the API for fine-grained control.' },
      { heading: 'Structured Output', body: 'Combine system instructions with `responseMimeType: "application/json"` and a JSON schema to get reliable structured output — great for CI/CD integrations.' },
    ],
    tips: [
      'Explicitly state the response structure for each query type (short / code / architecture).',
      'Use numbered rules — Gemini follows ordered lists more consistently than prose.',
      'Include example input → output pairs in the system instruction for complex tasks.',
      'Use "Flag breaking changes with ⚠️" to catch risky suggestions immediately.',
      'For code tasks, state the exact runtime version (e.g. "Node 20 LTS") to avoid version drift.',
    ],
    antiPatterns: [
      'Conflicting rules — Gemini may apply the last one seen.',
      'Over-relying on Gemini\'s world knowledge for project-specific conventions.',
      'Forgetting to set `responseMimeType` when you need structured JSON output.',
      'Leaving out error handling expectations — Gemini may silently omit it.',
      'Using vague tone descriptors ("be creative") without concrete examples.',
    ],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    icon: '⚫',
    color: '#6e40c9',
    tagline: 'GitHub · .github/copilot-instructions.md',
    file: '.github/copilot-instructions.md',
    badgeLabel: 'GitHub',
    template: COPILOT_TEMPLATE,
    sections: [
      { heading: 'File Location', body: 'Create `.github/copilot-instructions.md` in the repository root. This is automatically picked up by GitHub Copilot Chat in VS Code, JetBrains, and github.com.' },
      { heading: 'Scope', body: 'Instructions apply to the entire repository. They are prepended to every Copilot Chat request automatically — no manual action needed.' },
      { heading: 'Content Focus', body: 'Include: project overview, stack, code conventions, testing requirements, workflow checklist, and common anti-patterns. Skip generic programming advice Copilot already knows.' },
      { heading: 'Markdown Features', body: 'Full GitHub-flavoured Markdown is supported: `##` sections, fenced code, `- [ ]` checklists, and `> blockquotes` for callouts. Tables work for comparison rules.' },
      { heading: 'Size Guidance', body: 'Keep under 2 000 tokens (~1 500 words). Copilot includes this in every conversation context window — large files reduce the space available for your actual code.' },
    ],
    tips: [
      'List the max lint-warning threshold so Copilot auto-fixes before suggesting commits.',
      'Include the exact test command and coverage target — Copilot will generate compliant tests.',
      'Add a "Priority Order" section so Copilot weighs security fixes above feature niceties.',
      'Use `- ❌ Anti-pattern` bullets for hard constraints — easy for Copilot to pattern-match.',
      'Keep a "Common Commands" code block so Copilot suggests the right scripts, not generic npm/yarn.',
    ],
    antiPatterns: [
      'Adding secrets or env values — the file is committed to the repo.',
      'Duplicating your entire README — Copilot reads the repo directly.',
      'Overly long prose — bullet points and headers perform better.',
      'Omitting the test framework — Copilot defaults to Jest even if you use Vitest.',
      'Not updating when the stack changes — stale instructions cause incorrect suggestions.',
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '🟣',
    color: '#a855f7',
    tagline: 'Cursor · .cursor/rules/*.mdc',
    file: '.cursor/rules/project.mdc',
    fileAlt: 'Legacy: .cursorrules (repo root)',
    badgeLabel: 'Cursor',
    template: CURSOR_TEMPLATE,
    sections: [
      { heading: 'File Location', body: 'Modern Cursor uses `.cursor/rules/` directory with `.mdc` files. Each file can have a different scope. Legacy `.cursorrules` (repo root) still works but is deprecated.' },
      { heading: 'Rule Scopes', body: '`.mdc` files support a frontmatter `globs` field to limit rules to specific file patterns (e.g. `globs: "**/*.test.ts"` for test-only rules). Omit `globs` for repo-wide rules.' },
      { heading: 'MDC Format', body: 'Files use MDC (Markdown Components). Add frontmatter: `---\\ndescription: "Project rules"\\nglobs: "src/**/*.ts"\\n---` followed by Markdown content.' },
      { heading: 'Rule Types', body: '**Always** (always included), **Auto** (AI decides relevance), **Manual** (`@ruleName` to invoke), **Agent** (agentic tasks only). Set via the Cursor Rules UI.' },
      { heading: 'Composer vs Chat', body: 'Rules apply to both Composer and Chat. For Composer (agentic mode), add explicit "verify tests pass" and "make minimal diffs" instructions to prevent runaway rewrites.' },
    ],
    tips: [
      'Split rules into multiple `.mdc` files by concern (style, testing, git, security).',
      'Use `globs` to apply stricter rules only to test files or config files.',
      'Add "show diffs not rewrites" to prevent Cursor rewriting entire files unnecessarily.',
      'Include type signature requirements — Cursor often omits return types without prompting.',
      'Reference specific ESLint rule names if you want Cursor to avoid triggering them.',
    ],
    antiPatterns: [
      'One massive `.cursorrules` file — split into scoped `.mdc` files instead.',
      'Conflicting rules across files — Cursor merges them and may produce inconsistent output.',
      'No `globs` on test-specific rules — they\'ll apply everywhere and cause confusion.',
      'Omitting "ask before adding dependencies" — Cursor can silently install packages.',
      'Not specifying the diff format — Cursor may return full file rewrites by default.',
    ],
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    icon: '🩵',
    color: '#0ea5e9',
    tagline: 'Codeium · .windsurfrules',
    file: '.windsurfrules',
    fileAlt: 'Also supports per-workspace rules in Windsurf settings',
    badgeLabel: 'Codeium',
    template: WINDSURF_TEMPLATE,
    sections: [
      { heading: 'File Location', body: 'Place `.windsurfrules` at the repository root. Windsurf\'s Cascade agent reads it automatically for every session in that workspace.' },
      { heading: 'Cascade Agent Context', body: 'Windsurf\'s Cascade is a true agentic system — it reads, edits, and runs code. Your rules should include instructions on how aggressively to act (e.g. "make minimal diffs", "confirm before deleting files").' },
      { heading: 'Markdown Support', body: 'Standard Markdown is supported. Use `##` sections, bullet lists, and code blocks. Cascade parses them reliably.' },
      { heading: 'Global vs Workspace Rules', body: 'Windsurf supports global rules (via Settings → Rules) for cross-project preferences, and workspace `.windsurfrules` for project-specific context. Both are applied.' },
      { heading: 'Size Guidance', body: 'Keep under 1 000 tokens. Cascade already reads your repo structure and open files — avoid duplicating what it can infer.' },
    ],
    tips: [
      'Add "state assumptions before writing code" — Cascade acts fast and can go off-track.',
      'Include security rules explicitly — Cascade can modify config files and environment setups.',
      'Specify "prefer simple over clever" to prevent over-engineered solutions in agentic edits.',
      'List forbidden patterns (e.g. "never use `eval`") since Cascade edits without asking.',
      'Add performance guidelines — Cascade may cache or memoize incorrectly without context.',
    ],
    antiPatterns: [
      'Not including "minimal diffs" instruction — Cascade rewrites aggressively by default.',
      'Missing security rules — Cascade can edit sensitive config files.',
      'Omitting the project structure — Cascade navigates better with layout context.',
      'Vague role description — "helpful AI" is worse than "senior backend engineer".',
      'Forgetting to list external service mocks — Cascade may attempt real API calls in tests.',
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const TipsList = ({ items, variant }: { items: string[]; variant: 'tip' | 'anti' }) => {
  const isAnti = variant === 'anti';
  return (
    <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.45rem 0.6rem',
          borderRadius: '8px',
          marginBottom: '0.35rem',
          background: isAnti ? 'rgba(248,113,113,0.07)' : 'rgba(52,211,153,0.07)',
          border: `1px solid ${isAnti ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)'}`,
          fontSize: '0.84rem',
          lineHeight: 1.5,
        }}>
          <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>{isAnti ? '❌' : '✅'}</span>
          <span style={{ color: 'var(--text)' }}>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const SectionCard = ({ heading, body }: Section) => (
  <div style={{
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    marginBottom: '0.6rem',
  }}>
    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{heading}</div>
    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}
      dangerouslySetInnerHTML={{ __html: body.replace(/`([^`]+)`/g, '<code style="background:var(--code-bg);padding:0.1em 0.35em;border-radius:4px;font-size:0.9em;color:var(--primary)">$1</code>') }}
    />
  </div>
);
const CopyTemplateButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ms-auto"
      style={{
        fontSize: '0.72rem',
        padding: '0.18rem 0.6rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        background: copied ? 'rgba(52,211,153,0.15)' : 'var(--bg-secondary)',
        color: copied ? '#34d399' : 'var(--muted)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  );
};
// ─── Main Component ───────────────────────────────────────────────────────────

export const AIInstructionsGuide = () => {
  const [active, setActive] = useState('claude');
  const provider = PROVIDERS.find(p => p.id === active) ?? PROVIDERS[0];

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🤖</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">AI Instructions Guide</h1>
          <p className="tool-header-desc">
            Markdown structure, templates, and best practices for every major AI coding assistant.
          </p>
        </div>
        <Badge bg="primary" pill style={{ flexShrink: 0, fontSize: '0.75rem' }}>
          {PROVIDERS.length} providers
        </Badge>
      </div>

      {/* Provider tabs */}
      <div className="tool-card mb-4">
        <div className="tool-card-body" style={{ paddingBottom: '0.25rem' }}>
          <Nav variant="pills" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
            {PROVIDERS.map(p => (
              <Nav.Item key={p.id}>
                <Nav.Link
                  active={active === p.id}
                  onClick={() => setActive(p.id)}
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    border: active === p.id ? `1px solid ${p.color}` : '1px solid var(--border-color)',
                    background: active === p.id ? `${p.color}18` : 'transparent',
                    color: active === p.id ? p.color : 'var(--muted)',
                    fontWeight: active === p.id ? 700 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.icon} {p.name}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      </div>

      {/* Provider hero */}
      <div className="tool-card mb-4" style={{ borderTop: `3px solid ${provider.color}` }}>
        <div className="tool-card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2rem' }}>{provider.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{provider.name}</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{provider.tagline}</span>
            </div>
            <Badge style={{ marginLeft: 'auto', background: provider.color, fontSize: '0.7rem' }}>
              {provider.badgeLabel}
            </Badge>
          </div>
          <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <code style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--code-bg)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '0.3rem 0.7rem', fontSize: '0.82rem', color: provider.color,
            }}>
              📄 {provider.file}
            </code>
            {provider.fileAlt && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {provider.fileAlt}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'start' }}>
        {/* Left column: guide + tips */}
        <div>
          {/* Sections */}
          <div className="tool-card mb-4">
            <div className="tool-card-header">📋 Guide</div>
            <div className="tool-card-body">
              {provider.sections.map(s => (
                <SectionCard key={s.heading} {...s} />
              ))}
            </div>
          </div>

          {/* Best practices */}
          <div className="tool-card mb-4">
            <div className="tool-card-header">✅ Best Practices</div>
            <div className="tool-card-body">
              <TipsList items={provider.tips} variant="tip" />
            </div>
          </div>

          {/* Anti-patterns */}
          <div className="tool-card">
            <div className="tool-card-header">❌ Anti-Patterns</div>
            <div className="tool-card-body">
              <TipsList items={provider.antiPatterns} variant="anti" />
            </div>
          </div>
        </div>

        {/* Right column: template */}
        <div className="tool-card" style={{ position: 'sticky', top: '1rem' }}>
          <div className="tool-card-header">
            📝 Template
            <CopyTemplateButton text={provider.template} />
          </div>
          <div className="tool-card-body" style={{ padding: 0 }}>
            <pre style={{
              margin: 0,
              padding: '1rem',
              background: 'var(--code-bg)',
              borderRadius: '0 0 var(--radius-md) var(--radius-md)',
              fontSize: '0.76rem',
              lineHeight: 1.65,
              color: 'var(--text)',
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '70vh',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {provider.template}
            </pre>
          </div>
        </div>
      </div>
    </Container>
  );
};
