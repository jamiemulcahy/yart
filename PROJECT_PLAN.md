# Retro Tool — Project Plan

## Overview

A real-time collaborative retro tool. No accounts—just shareable room URLs.

Anyone with the view link sees live updates. Only the creator (with admin token) can modify.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Frontend (GitHub Pages)                                                     │
│       │                                                                      │
│       │ WebSocket + HTTP                                                     │
│       ▼                                                                      │
│  Cloudflare Worker (Router)                                                  │
│       │                                                                      │
│       ├──→ Durable Object (one per room)                                    │
│       │         ├── WebSocket connections (real-time)                       │
│       │         ├── Room state (SQLite)                                     │
│       │         ├── Permission checks (admin token)                         │
│       │         └── Broadcast updates                                       │
│       │                                                                      │
│       └──→ R2 Bucket (images)                                               │
│                                                                              │
│  100% Cloudflare. 100% Free Tier.                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind |
| **Real-time** | Durable Objects + WebSockets + Hibernation API |
| **Room State** | Durable Object SQLite |
| **Backend** | Cloudflare Worker (router) |
| **Image Storage** | Cloudflare R2 |
| **Deployment** | Cloudflare GitHub Integration + GitHub Actions |
| **Testing** | Vitest + React Testing Library + Playwright |
| **Code Quality** | ESLint + Prettier + Husky |
| **Package Manager** | pnpm (workspaces) |
| **Dev Environment** | Dev Containers / Docker Compose |

---

## Permission Model

No user accounts. Uses **secret admin token** approach:

| Role | Has | Can Do |
|------|-----|--------|
| **Admin** | Room URL + Admin Token | View, Add, Edit, Delete, Upload, Settings |
| **Viewer** | Room URL only | View only, Real-time updates |

### Flow

1. Creator makes a room → Gets `roomId` + `adminToken`
2. Creator shares **view URL** publicly
3. Creator keeps **admin URL** private
4. Admin token is hashed before storage

---

## Misuse Prevention

| Protection | Implementation |
|------------|----------------|
| **Rate Limiting** | 60 messages/minute per connection |
| **Room Limits** | 200 cards max, 100 connections max |
| **Content Limits** | 1000 char text, 5 MB images |
| **Inactive Cleanup** | Rooms deleted after 30 days inactive |
| **Token Security** | Admin tokens hashed (SHA-256) |

---

## Project Structure

```
yart/
├── .devcontainer/
│   ├── devcontainer.json
│   └── Dockerfile
├── docker-compose.yml
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Board/
│   │   │   │   ├── Card/
│   │   │   │   ├── Lane/
│   │   │   │   └── ui/
│   │   │   ├── hooks/
│   │   │   │   └── useRoom.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   └── websocket.ts
│   │   │   └── App.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── worker/
│       ├── src/
│       │   ├── index.ts          # Router
│       │   └── room.ts           # Durable Object
│       ├── wrangler.toml
│       └── package.json
├── e2e/
│   ├── tests/
│   └── playwright.config.ts
├── .github/workflows/
│   ├── ci.yml
│   └── deploy-frontend.yml
├── .husky/
├── CLAUDE.md
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Containerized Development

Any developer can pick up and run immediately.

### Supported Platforms

| Platform | Method |
|----------|--------|
| VS Code / Cursor | "Reopen in Container" |
| GitHub Codespaces | Click "Code" → "Codespaces" |
| DevPod | `devpod up .` |
| JetBrains | Dev Container support |
| Plain Docker | `docker-compose up -d` |
| No Docker | `pnpm install` (Node 20+) |

### `.devcontainer/devcontainer.json`

```json
{
  "name": "YART Dev",
  "build": { "dockerfile": "Dockerfile" },
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers-contrib/features/pnpm:2": { "version": "8" }
  },
  "forwardPorts": [5173, 8787],
  "postCreateCommand": "pnpm install && pnpm exec playwright install chromium"
}
```

### `.devcontainer/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
```

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  dev:
    build:
      context: .
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - .:/workspace:cached
      - node_modules:/workspace/node_modules
    ports:
      - "5173:5173"
      - "8787:8787"
    command: sleep infinity
    working_dir: /workspace

volumes:
  node_modules:
```

---

## Key Implementation Files

### `wrangler.toml`

```toml
name = "yart-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "ROOM"
class_name = "RoomObject"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["RoomObject"]

[[r2_buckets]]
binding = "IMAGES_BUCKET"
```

### Worker Router (`apps/worker/src/index.ts`)

Routes requests to Durable Objects and R2:
- `POST /api/rooms` → Create room
- `WS /api/rooms/:id/ws` → WebSocket connection
- `POST /api/rooms/:id/upload` → Image upload (admin only)
- `GET /images/:key` → Serve images from R2

### Durable Object (`apps/worker/src/room.ts`)

Handles per-room logic:
- WebSocket connections with hibernation
- SQLite storage (room_meta, cards, lanes)
- Permission checks (admin token verification)
- Rate limiting (60 msg/min)
- Broadcast updates to all viewers
- Cleanup alarm (30 days inactive)

---

## CI/CD Pipeline

### `.github/workflows/ci.yml` (PR Checks)

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

### `.github/workflows/deploy-frontend.yml` (Deploy on merge)

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @roadmap/frontend build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: apps/frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

---

## Infrastructure Setup (One-Time)

1. **Cloudflare:** Create account → Workers & Pages → Connect GitHub repo
2. **R2:** Auto-creates on first deploy (binding in wrangler.toml)
3. **GitHub Pages:** Settings → Pages → Source: GitHub Actions
4. **Branch Protection:** Require PR + status checks for `main`

---

## Free Tier Capacity

| Resource | Free Limit | Effective Capacity |
|----------|------------|-------------------|
| **DO Requests** | 100K/day | ~2M WebSocket msgs/day (20:1 ratio) |
| **DO Storage** | 5 GB | Thousands of rooms |
| **R2 Storage** | 10 GB | Thousands of images |
| **Workers** | 100K/day | HTTP API calls |

---

## Development Workflow

### Commands

```bash
pnpm dev              # Start frontend + worker
pnpm lint             # Check linting
pnpm typecheck        # Check types
pnpm test             # Unit tests
pnpm test:e2e         # Playwright tests
pnpm build            # Build all
pnpm validate         # All checks
```

### Git Workflow

1. Create feature branch: `git checkout -b feat/feature-name`
2. Make changes, run `pnpm validate`
3. Commit with conventional message: `feat: add card drag`
4. Push and create PR
5. CI runs automatically
6. Merge when checks pass

---

## Phases

### Phase 1: Foundation
- [ ] Initialize repo with pnpm workspaces
- [ ] Create dev container + docker-compose
- [ ] Set up TypeScript, ESLint, Prettier
- [ ] Configure Husky hooks
- [ ] Create CI/CD workflows
- [ ] Create CLAUDE.md

### Phase 2: Worker + Durable Object
- [ ] Create Worker router
- [ ] Create RoomObject Durable Object
- [ ] Implement WebSocket + SQLite
- [ ] Implement permissions + rate limiting
- [ ] Add R2 image upload
- [ ] Write Worker tests

### Phase 3: Frontend
- [ ] Set up Vite + React + Tailwind
- [ ] Create WebSocket hook
- [ ] Build Board, Lane, Card components
- [ ] Implement admin/viewer modes
- [ ] Write component tests

### Phase 4: Integration + Polish
- [ ] Connect frontend to Worker
- [ ] E2E tests
- [ ] Drag and drop
- [ ] Error handling
- [ ] Deploy

---

## Files to Create (In Order)

1. `.devcontainer/devcontainer.json`
2. `.devcontainer/Dockerfile`
3. `docker-compose.yml`
4. `package.json` (root)
5. `pnpm-workspace.yaml`
6. `tsconfig.base.json`
7. `.eslintrc.cjs`
8. `.prettierrc`
9. `.gitignore`
10. `.husky/pre-commit`
11. `.husky/pre-push`
12. `.github/workflows/ci.yml`
13. `.github/workflows/deploy-frontend.yml`
14. `CLAUDE.md`
15. `README.md`
16. `apps/worker/` scaffolding
17. `apps/frontend/` scaffolding
18. `e2e/` scaffolding
