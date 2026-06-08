# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference (read this first)

### Key File Paths

| Purpose | Path |
|---------|------|
| Prisma schema | `prisma/schema.prisma` |
| Auth store (Zustand) | `src/store/auth-store.ts` |
| Session CRUD + limit checking | `src/lib/session-manager.ts` |
| Login handler (`completeLogin`) | `src/lib/auth-helpers.ts` |
| Route protection (`withAuth`) | `src/lib/api-auth.ts` |
| API client | `src/lib/api-client.ts` |
| Staff login form | `src/components/auth/login-form.tsx` |
| Employee login form | `src/components/auth/employee-login-form.tsx` |
| Device limit dialog | `src/components/auth/device-limit-dialog.tsx` |
| Rate limiter | `src/lib/rate-limiter.ts` |
| Redis connection | `src/lib/redis.ts` |
| UI components (shadcn) | `src/components/ui/` |
| Constants/roles | `src/lib/constants.ts` |
| API routes | `src/app/api/` |
| Logger | `src/lib/logger.ts` / `src/lib/logger-client.ts` |
| BullMQ queue | `src/lib/jobs/hrims-sync-queue.ts` |
| BullMQ worker | `src/lib/jobs/hrims-sync-worker.ts` |
| Suspicious login detector | `src/lib/suspicious-login-detector.ts` |
| Account lockout utils | `src/lib/account-lockout-utils.ts` |
| Password utils | `src/lib/password-utils.ts` |
| Worker startup script | `scripts/start-worker.ts` |
| Redis scripts | `scripts/start-redis.sh` / `scripts/stop-redis.sh` |
| PM2 config | `ecosystem.config.js` |
| Env (production) | `.env.local` |

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Next.js 16 (full-stack, no separate backend) |
| **Frontend** | React 19 + Tailwind CSS 3 + Radix UI / shadcn |
| **Backend** | Next.js API Routes (`src/app/api/`) |
| **Database** | PostgreSQL (`nody`) |
| **ORM** | Prisma 6 (`prisma-client-js`, binary target: `debian-openssl-3.0.x`) |
| **Auth** | Session-based (session token in DB), CSRF double-submit cookie pattern, max 3 concurrent sessions |
| **State Mgmt** | Zustand 4 (persisted to localStorage + auth cookie for middleware) |
| **Forms** | react-hook-form + zod 3 |
| **AI** | Google Genkit (`@genkit-ai/google-genai`, `genkitx-ollama`) |
| **Queue** | BullMQ + ioredis 5 + Redis 7 |
| **File Storage** | MinIO (S3-compatible, localhost:9000) |
| **Email** | nodemailer |
| **Testing** | Vitest 4 (unit) + Playwright (E2E) + k6 (load) |
| **Process Mgmt** | PM2 (4 services: redis, worker, genkit, production) |
| **Linting** | ESLint 8 + Prettier |
| **TypeScript** | 5.x, strict mode |
| **Port** | 9002 (dev + production) |
| **Node** | 20+ (not pinned, no `.nvmrc`) |
| **Docker** | None |
| **Domain (prod)** | `csms.zanajira.go.tz` |

### Roles

ADMIN, HRO, HHRMD, HRMO, DO, CSCS, PO, HRRP, EMPLOYEE (defined in `src/lib/constants.ts`)

### Common Tasks

| Task | Command |
|------|---------|
| Build | `npm run build` (errors/warnings NOT ignored, `ignoreBuildErrors: false`) |
| Type check | `npx tsc --noEmit` |
| Dev server | `npm run dev` (port 9002) |
| Production | `npm start` (port 9002) |
| Unit tests | `npm test` (Vitest) |
| E2E tests | `npm run test:e2e` (Playwright) |
| Load tests | `npm run loadtest` (requires k6) |
| Restart prod | `pm2 restart csms-app` |
| Check logs | `pm2 logs csms-app --lines 20 --nostream` |
| Start Redis | `sudo systemctl restart redis-server` (systemd, port 6379) |
| Start worker | `npm run worker` (BullMQ HRIMS sync worker) |

## Development Commands

### Core

- `npm run dev` - Development server on port 9002
- `npm run build` - Production build
- `npm start` - Production server on port 9002
- `npm run lint` - Next.js linting
- `npm run typecheck` - TypeScript type checking

### AI/Genkit

- `npm run genkit:dev` - Genkit development server
- `npm run genkit:watch` - Genkit with file watching
- `npm run worker` - Start BullMQ HRIMS sync worker

### Testing

- `npm test` - Unit tests with Vitest
- `npm run test:ui` - Unit tests with Vitest UI
- `npm run test:coverage` - Test coverage report
- `npm run test:e2e` - E2E tests with Playwright
- `npm run test:e2e:ui` - E2E tests with Playwright UI
- `npm run loadtest` - Stress load tests (requires k6)
- `npm run loadtest:smoke` - Quick smoke test
- `npm run loadtest:auth` - Authentication load tests
- `npm run loadtest:hr` - HR workflows load tests
- `npm run loadtest:files` - File operations load tests
- `npm run loadtest:all` - All load test scenarios

## Architecture Overview

This is a Next.js 16 full-stack application for a Civil Service Management System (CSMS) used by Zanzibar's government civil service.

### Full-Stack Setup

- **Frontend**: Next.js 16 / React 19 app on port 9002
- **Backend**: Next.js API routes (same application, no separate backend)
- **Database**: PostgreSQL `nody` database with Prisma 6 ORM
- **File Storage**: MinIO (S3-compatible) for documents, certificates, photos, attachments
- **Queue**: BullMQ + Redis 7 for background HRIMS sync jobs
- **Rate Limiting**: Redis-backed (fails open if Redis is unavailable)

### Key Architecture Components

#### Auth System

- Session-based auth with session tokens stored in DB (Session model)
- CSRF protection via double-submit cookie pattern (HMAC-SHA256 signed)
- Max 3 concurrent sessions per user; device limit dialog shown on 4th device
- Account lockout: 5 failed attempts = 30-min lockout, 10+ = admin unlock
- Password policy: temporary passwords with expiry, password history, grace period
- Inactivity timeout: 2 hours (client + server tracking)
- Suspicious login detection (unusual device/IP combinations)

#### Database (Prisma)

- PostgreSQL with entities: User, Employee, Institution
- Request types: Promotions, Confirmations, LWOP, Cadre Changes, Retirements, Service Extensions, Resignations, Terminations, Complaints
- Each request follows a workflow with status tracking and review stages

#### API Structure

- All routes in `src/app/api/` as Next.js route handlers
- Route protection via `withAuth()` higher-order function (role-based access)
- Rate limiting via `withRateLimit()` (tiers: auth=5/min, write=30/min, read=100/min)
- CRUD for all request types, file upload/download, HRIMS sync, reports

#### Frontend Structure

- Dashboard-based UI with role-based access and sidebar navigation
- React Hook Form + Zod for form validation
- Comprehensive form handling for all HR request types
- File upload/download with preview (PDF, images)
- Notification system with bell icon and dropdown
- Audit trail logging throughout

#### State Management

- Zustand with `persist` middleware (localStorage) for auth state
- Auth cookie (`auth-storage`) synced for Next.js middleware route protection
- Singleton API client class with auto token refresh and CSRF header injection

#### UI Framework

- Tailwind CSS 3 with HSL-based design system
- Radix UI primitives via shadcn/ui components in `src/components/ui/`
- Dark mode via `class`-based strategy
- Font: Inter (body + headline), monospace for code

#### Background Jobs

- BullMQ queue (`hrims-sync`) for syncing employee data from HRIMS API
- Worker processes paginated HRIMS data, upserts to PostgreSQL
- Job status tracking via BullMQ (progress, state, failedReason)
- Queue events for monitoring

#### AI Integration

- Google Genkit with Gemini models
- Complaint rewriting functionality
- Ollama support (configurable)

#### Infrastructure

- PM2 manages 4 processes: redis, worker, genkit, production
- Redis runs via systemd (not PM2)
- No Docker used anywhere
- No `.nvmrc` / Node engine pinning
- Deployment path: `/home/latest` (per PM2 config)

## Configuration Notes

- TypeScript: strict mode, target ES2020, module resolution `bundler`
- Path alias: `@/*` maps to `./src/*`, `@test/*` maps to `./test/*`
- Prisma binary targets: `native`, `debian-openssl-3.0.x`
- Image domains: `placehold.co` (remote pattern allowed)
- Build: `ignoreBuildErrors: false` (TypeScript errors fail the build)
- Webpack: bullmq warnings suppressed; handlebars/require.extensions warnings suppressed
- PM2 ecosystem config at `ecosystem.config.js` (cwd: `/home/latest`)

## Load Testing

Comprehensive k6 load testing scenarios in `load-tests/` directory.

### Quick Start

```bash
# Install k6 (macOS)
brew install k6

# Run smoke test
npm run loadtest:smoke

# Run stress test to find breaking point
npm run loadtest

# Run specific scenarios
npm run loadtest:auth        # Authentication tests
npm run loadtest:hr          # HR workflow tests
npm run loadtest:files       # File operations tests
npm run loadtest:all         # All scenarios
```

### Test Scenarios

1. **Authentication**: Login, logout, session management
2. **HR Workflows**: Promotions, confirmations, employee management
3. **File Operations**: Upload, download, metadata
4. **Stress Test**: Combined scenarios with progressive load

### CI/CD Integration

Load tests via GitHub Actions:
- Weekly on Sundays at 2 AM UTC
- On releases
- Manual trigger via GitHub Actions UI

See `.github/workflows/load-test.yml`.

## Project Context

Government HR management system for Zanzibar's civil service, under the Civil Service Commission (TUME YA UTUMISHI SERIKALINI). Handles employee lifecycle management including hiring, promotions, transfers, complaints, and separations across all Zanzibar government institutions.
