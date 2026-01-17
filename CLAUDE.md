# CLAUDE.md

> Instructions for Claude Code working in this repository.

## Project Overview

Real-time collaborative retro tool. React + TypeScript frontend, Cloudflare Worker + Durable Objects backend, R2 for images.

**Key URLs:**
- Frontend: `http://localhost:5173`
- Worker: `http://localhost:8787`

---

## Environment

This project uses **containerized development**. Everyone gets the same environment.

### Supported Platforms

| Platform | Command/Action |
|----------|----------------|
| VS Code / Cursor | "Reopen in Container" |
| GitHub Codespaces | Click "Code" → "Codespaces" |
| DevPod | `devpod up .` |
| JetBrains | Dev Container support |
| Plain Docker | `docker-compose up -d` then `docker-compose exec dev bash` |
| No Docker | `pnpm install` (Node 20+ required) |

### Container Includes
- Node 20
- pnpm 8
- Git
- Playwright browser dependencies

---

## Critical Rules

### 1. Git Workflow

**NEVER commit directly to `main`.**

```bash
git checkout main
git pull origin main
git checkout -b feat/description   # or fix/, test/, refactor/, docs/, chore/
```

Branch prefixes:
- `feat/` — New features
- `fix/` — Bug fixes
- `test/` — Test additions
- `refactor/` — Code refactoring
- `docs/` — Documentation
- `chore/` — Maintenance

### 2. Before Every Commit

Run all validations and ensure they pass:

```bash
pnpm lint        # Must pass
pnpm typecheck   # Must pass
pnpm test        # Must pass
pnpm build       # Must pass
```

Or run all at once:

```bash
pnpm validate
```

**Do not commit if any check fails.** Fix the issues first.

### 3. Commit Messages

Use conventional commits:

```
feat: add card drag and drop
fix: resolve race condition in room sync
test: add e2e tests for image upload
refactor: extract useRoom hook
docs: update setup instructions
chore: update dependencies
```

### 4. Pull Requests

All changes go through PRs:
1. Push your feature branch
2. Create PR against `main`
3. CI runs automatically
4. All checks must pass before merge

---

## CI Pipeline

CI runs automatically on every PR via `.github/workflows/ci.yml`.

### What CI Checks

| Step | Command | Must Pass |
|------|---------|-----------|
| Lint | `pnpm lint` | ✅ |
| Typecheck | `pnpm typecheck` | ✅ |
| Unit/Integration Tests | `pnpm test` | ✅ |
| Build | `pnpm build` | ✅ |
| E2E Tests | `pnpm test:e2e` | ✅ |

### CI Must Pass

PRs cannot be merged if CI fails. If CI fails:
1. Check the failed step in GitHub Actions
2. Reproduce locally with the same command
3. Fix the issue
4. Push again

### Running CI Locally

Before pushing, simulate CI:

```bash
pnpm validate    # Runs lint, typecheck, test, build
pnpm test:e2e    # Runs Playwright tests
```

---

## Testing Requirements

### Approach: Outside-In

Start with integration/e2e tests, add unit tests for complex logic.

```
1. Write failing E2E or integration test
2. Implement code to make it pass
3. Add unit tests for complex logic
4. Refactor with confidence
```

### Every Feature Must Have Tests

- New feature → Write integration test first
- Complex logic → Add unit tests
- Bug fix → Write test that reproduces bug first
- Modifying existing code without tests → Add tests

### Test Commands

```bash
pnpm test           # Unit + integration tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage report
pnpm test:e2e       # Playwright e2e tests
pnpm test:e2e:ui    # Playwright with UI
```

---

## Self-Validation with MCP Playwright

Use Playwright MCP to verify your own work before committing.

### Workflow

1. Start dev servers: `pnpm dev`
2. Use Playwright MCP to:
   - Navigate to `http://localhost:5173`
   - Interact with the UI
   - Verify the feature works visually
   - Take screenshots if needed
3. Write automated test to capture the behavior
4. Run test to confirm it passes: `pnpm test:e2e`
5. Only then commit

### When to Use MCP Playwright

- Verifying a feature works before writing tests
- Debugging failing e2e tests
- Exploring edge cases
- Understanding current UI state

---

## Code Style

### File Structure

```
src/components/ComponentName/
├── ComponentName.tsx       # Component
├── ComponentName.test.tsx  # Tests
└── index.ts                # Export

src/hooks/
├── useHookName.ts          # Hook
└── useHookName.test.ts     # Tests
```

### TypeScript

- Strict mode enabled (no `any`)
- Explicit return types on functions
- Use `unknown` and narrow, not `any`
- Named exports preferred

### React

- Functional components with hooks
- No class components
- Destructure props
- Use `data-testid` for test selectors

---

## Commands Reference

```bash
# Development
pnpm dev              # Start frontend + worker
pnpm dev:frontend     # Frontend only
pnpm dev:worker       # Worker only

# Validation
pnpm lint             # Check linting
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # Check types
pnpm test             # Run tests
pnpm build            # Build all
pnpm validate         # Run all checks

# Testing
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
pnpm test:e2e         # Playwright
pnpm test:e2e:ui      # Playwright with UI
```

---

## Pre-Commit Hooks

Husky runs automatically on commit/push.

### Pre-Commit
- Lint-staged (format + lint changed files)
- Type check
- Test changed files

### Pre-Push
- Full test suite
- Build verification

If hooks fail, the commit/push is blocked. Fix issues before retrying.

---

## Summary Checklist

### Before Committing
- [ ] Created feature branch (not on main)
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Verified with MCP Playwright (if UI changes)
- [ ] Tests written for new code
- [ ] Commit message follows convention

### Before Creating PR
- [ ] All above checks pass
- [ ] Rebased on latest main
- [ ] PR title follows conventional commit format

### After PR Created
- [ ] CI passes (wait for green checks)
- [ ] Ready for merge