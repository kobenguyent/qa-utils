# GitHub Copilot Instructions for QA Utils

## Project Overview
QA Utils is a comprehensive collection of quality assurance tools and utilities built with React, TypeScript, and Bootstrap. The project emphasizes code quality, testing, and accessibility.

## Development Workflow

### 1. Code Quality Standards

#### Linting Requirements
- **ALWAYS** run linting before committing any changes
- **ALWAYS** fix all linting issues - the project enforces a maximum of 50 warnings
- Use `npm run lint` or `bun run lint` to check for issues
- The project uses ESLint with TypeScript support
- Configuration: `.eslintrc.cjs`
- Linting must pass in CI/CD pipeline

#### Testing Requirements
- **ALWAYS** add tests for new features and components
- **ALWAYS** update existing tests when modifying functionality
- Run tests with `npm test` or `bun test` before committing
- Maintain high test coverage (currently 319+ tests)
- Test files location: `src/test/` and `src/components/__tests__/`
- Use Vitest + React Testing Library for component tests
- Use `vitest --ui` for interactive test debugging

#### Build Requirements
- Verify builds succeed with `npm run build` or `bun run build`
- Build must complete without errors
- Check for large bundle warnings and optimize if needed

### 2. Code Style Guidelines

#### TypeScript
- Use strict TypeScript mode
- Avoid `any` types - use proper type definitions
- Define interfaces for component props and data structures
- Use type inference where appropriate

#### React Components
- Use functional components with hooks
- Follow React best practices for performance (memo, useCallback, useMemo)
- Ensure proper cleanup in useEffect hooks
- Use proper dependency arrays in hooks
- Add proper ARIA labels for accessibility

#### File Organization
- Components: `src/components/`
- Utilities: `src/utils/`
- Tests: Co-located in `__tests__/` directories
- Styles: `src/styles/` and component-specific CSS

### 3. Accessibility Standards
- Ensure keyboard navigation works for all interactive elements
- Add proper ARIA labels and roles
- Maintain minimum touch target sizes (44px on mobile)
- Support screen readers
- Ensure sufficient color contrast in both light and dark themes

### 4. Mobile-First Design
- Always consider mobile view when making UI changes
- Use responsive breakpoints from Bootstrap
- Test on mobile viewport sizes (375px width minimum)
- Ensure touch targets are appropriately sized

### 5. Performance Considerations
- Use code splitting with React.lazy for route components
- Optimize bundle size
- Avoid unnecessary re-renders
- Use proper memoization techniques

### 6. Change Process Checklist

When making ANY code changes:

1. **Before coding:**
   - Understand the existing code structure
   - Check for related tests
   - Review current linting rules

2. **During development:**
   - Write code following TypeScript strict mode
   - Add/update tests for new/modified functionality
   - Ensure accessibility standards are met
   - Consider mobile responsiveness

3. **Before committing:**
   - [ ] Run `npm run lint` - Fix ALL issues (max 50 warnings)
   - [ ] Run `npm test` - Ensure all tests pass
   - [ ] Run `npm run build` - Verify build succeeds
   - [ ] Test manually in browser (both desktop and mobile)
   - [ ] Review changed files for unintended modifications

4. **Testing requirements for new features:**
   - Add unit tests for utility functions
   - Add component tests for React components
   - Test edge cases and error conditions
   - Maintain or improve test coverage

### 7. Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run preview      # Preview production build

# Testing
npm test            # Run all tests
npm run test:ui     # Run tests with UI
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint        # Run ESLint

# Building
npm run build       # Production build
npm run build:github # Build for GitHub Pages
```

### 8. Git Workflow
- Branch naming: `copilot/<feature-name>`
- Commit messages: Use clear, descriptive messages
- Each commit should be atomic and focused
- Use `report_progress` tool to commit changes (for Copilot agents)

### 9. Dependencies
- Package manager: Bun (with npm fallback)
- Framework: React 18 + TypeScript
- UI: Bootstrap 5 + React-Bootstrap
- Build: Vite
- Testing: Vitest + React Testing Library
- Linting: ESLint with TypeScript plugin

### 10. Theme System
- Support both light and dark themes
- Use CSS variables for colors (defined in `src/index.css`)
- Light theme: Default
- Dark theme: `[data-theme="dark"]` selector
- Auto mode: Follows system preference

### 11. Security
- Never commit secrets or API keys
- Validate user inputs
- Use proper sanitization for user-generated content
- Run CodeQL security scans before finalizing changes

### 12. Common Pitfalls to Avoid
- ❌ Don't skip linting - it MUST pass
- ❌ Don't skip tests - always add/update them
- ❌ Don't use `any` type without justification
- ❌ Don't ignore accessibility
- ❌ Don't forget mobile responsiveness
- ❌ Don't introduce breaking changes without tests
- ❌ Don't commit large files or build artifacts

## Priority Order for Changes
1. Security and accessibility issues (highest priority)
2. Bugs and functionality issues
3. Test coverage improvements
4. Performance optimizations
5. Code quality improvements
6. Documentation updates
7. Nice-to-have features (lowest priority)

## Questions or Issues?
- Review existing code patterns in similar components
- Check test files for usage examples
- Refer to project README.md for setup instructions
- Ensure changes align with project architecture
