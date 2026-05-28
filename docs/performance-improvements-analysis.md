# Performance Improvements Analysis

**Date:** 2026-05-28
**Codebase:** Civil Service Management System (Next.js 16, React 19, Prisma 6, PostgreSQL)

---

## Executive Summary

This analysis covers 94 API routes (46,310 lines), 63 components (19,552 lines), and 18 dashboard pages (72,326 lines). The codebase has solid fundamentals (Prisma singleton, rate limiting, audit logging, CDN-friendly caching on some routes) but has accumulated significant technical debt in three areas: **monolithic page components**, **unbounded database queries**, and **missing Next.js performance features**.

---

## Priority 1: Critical (High Impact, Immediate Fix)

### 1.1 Unbounded Database Queries Fetching Entire Tables

**Impact:** Every request to these endpoints fetches all rows from the table into memory. Response times and memory usage grow linearly with data volume.

**Affected endpoints:**

| File | Queries | Tables |
|------|---------|--------|
| `src/app/api/requests/track/route.ts` | 8 sequential | All 8 request tables |
| `src/app/api/reports/route.ts` | 1-8 parallel | All 8 request tables + complaints |
| `src/app/api/institutions/route.ts` | 1 | institution |
| `src/app/api/users/route.ts` | 1 | user |
| `src/app/api/notifications/route.ts` | 1 | notification |

**Fix for `requests/track/route.ts` (worst offender):**

The endpoint fetches all rows from 8 tables sequentially, then paginates in memory:

```typescript
// Current (lines 57-78, repeated 8 times sequentially):
const promotionRequests = await db.promotionRequest.findMany({
  where: whereClause,
  include: { Employee: { include: { Institution: true } }, ... },
}).catch(() => []);

// Fix: Add database-level pagination and parallelize:
const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
const skip = parseInt(request.nextUrl.searchParams.get('skip') || '0');

const [
  promotions, confirmations, lwops, cadreChanges,
  retirements, resignations, serviceExtensions, terminations
] = await Promise.allSettled([
  db.promotionRequest.findMany({ where: whereClause, take: limit, skip, include: { ... } }),
  db.confirmationRequest.findMany({ where: whereClause, take: limit, skip, include: { ... } }),
  // ... remaining 6 queries
]);
```

**Expected improvement:** 80-95% reduction in query time for large datasets, eliminates memory-based pagination.

**Fix for `reports/route.ts`:**

Add `take`/`skip` to all `findMany` calls in the switch statement (lines 794-1049) and the `reportType=all` path (lines 1068-1261). For report exports, consider streaming or paginated CSV generation instead of loading all rows.

**Fix for `institutions/route.ts`, `users/route.ts`, `notifications/route.ts`:**

Add pagination (`take`/`skip`) to these endpoints. Institutions and users are unlikely to exceed thousands of rows soon, but notifications will grow unboundedly.

---

### 1.2 Sequential Queries in Track Requests Endpoint

**Impact:** 8 database queries run one after another instead of in parallel. Each query waits for the previous one to complete.

**File:** `src/app/api/requests/track/route.ts` (lines 57-314)

**Fix:** Wrap all 8 queries in `Promise.allSettled` (as done correctly in `dashboard/metrics/route.ts`). This reduces total query time from `sum(times)` to `max(times)`.

**Expected improvement:** ~4-8x faster response time for the track endpoint.

---

### 1.3 Missing Database Indexes

**Impact:** Full table scans on frequently filtered columns.

**File:** `prisma/schema.prisma`

**Missing indexes to add:**

```prisma
model User {
  // Add:
  @@index([role])
  @@index([institutionId])
}

model Notification {
  // Add:
  @@index([userId])
  @@index([createdAt])
  @@index([read])
}
```

**Expected improvement:** Orders of magnitude faster for filtered queries on these columns, especially as user and notification tables grow.

---

### 1.4 No Database Connection Pool Configuration

**Impact:** Prisma uses default pool size `(num_physical_cpus * 2) + 1`. Under concurrent load with endpoints opening 8-19 parallel queries, connection exhaustion is likely.

**File:** `prisma/schema.prisma` (line 6-9) and `src/lib/db.ts` (line 5-9)

**Fix:** Add explicit pool configuration:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

// Add to DATABASE_URL or as a separate env var:
// DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=10
```

Alternatively, configure in `src/lib/db.ts`:

```typescript
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Consider using Prisma Accelerate or pgBouncer for production
  });
};
```

**Expected improvement:** Prevents connection pool exhaustion under load. Consider pgBouncer in front of PostgreSQL for production.

---

## Priority 2: High (Significant Impact, Planned Work)

### 2.1 Massive Monolithic Dashboard Pages

**Impact:** 16 dashboard pages total 26,637 lines with zero code splitting. The largest single file is `complaints/page.tsx` at 3,022 lines. Every page is eagerly loaded as a client component, meaning the entire JS bundle for all dashboard pages is sent to the client.

**Affected files (all over 1,600 lines):**

| File | Lines |
|------|-------|
| `src/app/dashboard/complaints/page.tsx` | 3,022 |
| `src/app/dashboard/retirement/page.tsx` | 2,718 |
| `src/app/dashboard/promotion/page.tsx` | 2,711 |
| `src/app/dashboard/termination/page.tsx` | 2,429 |
| `src/app/dashboard/service-extension/page.tsx` | 2,306 |
| `src/app/dashboard/cadre-change/page.tsx` | 2,284 |
| `src/app/dashboard/resignation/page.tsx` | 2,142 |
| `src/app/dashboard/lwop/page.tsx` | 2,099 |
| `src/app/dashboard/confirmation/page.tsx` | 1,996 |
| `src/app/dashboard/profile/page.tsx` | 1,624 |

**Fix (phased approach):**

1. **Extract reusable components:** Each page shares the same pattern — table, filters, pagination, status badges, action buttons. Extract these into shared components (e.g., `<RequestTable>`, `<RequestFilters>`, `<StatusBadge>`, `<Pagination>`).

2. **Add `loading.tsx` files:** Create loading skeletons for each dashboard route. Next.js will automatically show these during navigation.

3. **Add `error.tsx` files:** Create error boundaries for each dashboard route.

4. **Use `next/dynamic` for code splitting:**

```typescript
// Instead of:
import ComplaintsPage from './page';

// Use:
const ComplaintsPage = dynamic(() => import('./page'), {
  loading: () => <DashboardSkeleton />,
});
```

**Expected improvement:** 50-70% reduction in initial JS bundle size, faster page transitions, better perceived performance.

---

### 2.2 All Pages Are Client Components (No Server-Side Rendering)

**Impact:** 95 files use `'use client'`. All data fetching happens in `useEffect` after the JS bundle loads and hydrates. Users see blank screens or spinners while waiting.

**Fix (incremental):**

1. Move data fetching to Server Components where possible. Dashboard pages that fetch data can use async Server Components:

```typescript
// app/dashboard/promotion/page.tsx (Server Component)
export default async function PromotionPage({ searchParams }) {
  const page = parseInt(searchParams.page || '1');
  const data = await getPromotionRequests({ page, limit: 10 });
  return <PromotionClientView initialData={data} />;
}
```

2. Use `React.cache()` to deduplicate Prisma calls during a single request:

```typescript
// src/lib/data.ts
import { cache } from 'react';

export const getPromotionRequests = cache(async (params: QueryParams) => {
  return db.promotionRequest.findMany({ ... });
});
```

**Expected improvement:** Faster Time-to-First-Byte (TTFB), better SEO, reduced client-side JavaScript execution.

---

### 2.3 No `next/dynamic` Code Splitting

**Impact:** All components are statically imported. Heavy components like file upload (507 lines), sidebar (763 lines), and dashboard pages are included in the initial bundle even when not needed.

**Fix:** Apply `next/dynamic` to:
- All dashboard sub-pages (loaded per-route)
- File upload components (only needed on specific pages)
- PDF/Excel generation libraries (`jspdf`, `xlsx`)
- The sidebar (can be lazy-loaded after initial render)

```typescript
const FileUpload = dynamic(() => import('@/components/ui/file-upload'), {
  ssr: false, // File upload needs browser APIs
  loading: () => <div className="h-32 animate-pulse bg-muted rounded-lg" />,
});
```

**Expected improvement:** 30-50% smaller initial JS bundle.

---

### 2.4 Redundant 3-Effect Fetch Pattern in Dashboard Pages

**Impact:** 9 dashboard sub-pages use three separate `useEffect` hooks for data fetching, causing redundant API calls when filters or pagination change.

**Pattern found in:** `promotion/page.tsx`, `confirmation/page.tsx`, `retirement/page.tsx`, `termination/page.tsx`, `lwop/page.tsx`, `resignation/page.tsx`, `cadre-change/page.tsx`, `service-extension/page.tsx`, `complaints/page.tsx`

```typescript
// Current anti-pattern (3 separate effects):
useEffect(() => { fetchRequests(); }, [fetchRequests]);
useEffect(() => { if (currentPage > 1) fetchRequests(false, currentPage); }, [currentPage]);
useEffect(() => { setCurrentPage(1); fetchRequests(false, 1); }, [statusFilter]);

// Fix: Single effect with combined dependencies:
useEffect(() => {
  fetchRequests();
}, [currentPage, statusFilter]); // fetchRequests reads both values internally
```

**Expected improvement:** Eliminates duplicate API calls on filter/page changes.

---

## Priority 3: Medium (Notable Impact, Schedule When Possible)

### 3.1 Google Fonts via CSS Link Instead of `next/font`

**Impact:** External Google Fonts requests add network latency and can cause layout shift.

**File:** `src/app/layout.tsx` (lines 19-28)

**Fix:**

```typescript
// Remove the <link> tags and use:
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Expected improvement:** Zero layout shift from fonts, no external requests, fonts self-hosted at build time.

---

### 3.2 Raw `<img>` Tags Instead of `next/image`

**Impact:** No automatic image optimization, lazy loading, or size hints.

**Files:**
- `src/components/layout/sidebar.tsx` (line 106) — Zanzibar logo
- `src/components/ui/file-preview-modal.tsx` (line 189) — file previews

**Fix:**

```typescript
// For static images:
<Image src="/zanzibar-logo.png" alt="Logo" width={48} height={48} priority />

// For dynamic previews:
<Image src={previewUrl} alt="Preview" width={800} height={600} unoptimized />
```

**Expected improvement:** Automatic lazy loading, smaller image payloads, better Core Web Vitals (LCP).

---

### 3.3 No `loading.tsx` or `error.tsx` Files

**Impact:** No loading states during navigation, no error recovery on failures. Users see blank screens.

**Fix:** Add `loading.tsx` and `error.tsx` to each dashboard route group:

```typescript
// src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}

// src/app/dashboard/error.tsx
'use client';
export default function DashboardError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

### 3.4 No `React.memo` Usage

**Impact:** Components re-render unnecessarily when parent state changes.

**Fix:** Wrap pure presentational components with `React.memo`:

```typescript
// Components that would benefit:
export default React.memo(StatusBadge);
export default React.memo(RequestTableRow);
export default React.memo(StatCard);
```

---

### 3.5 Two Separate Redis Clients

**Impact:** Two ioredis connections per server instance — one for rate limiting, one for BullMQ. Different configurations may cause inconsistent behavior.

**Files:** `src/lib/rate-limiter.ts` (lines 33-40), `src/lib/redis.ts` (lines 25-49)

**Fix:** Consolidate to a single Redis connection factory. The rate limiter can use the same connection as BullMQ if `maxRetriesPerRequest` is set to `null` (required for BullMQ). Alternatively, use a dedicated connection for each with explicit naming.

---

### 3.6 No Request Deduplication for Prisma Calls

**Impact:** Concurrent identical requests result in duplicate database queries. Next.js's built-in `fetch` deduplication does not apply to direct Prisma calls.

**Fix:** Wrap data-fetching functions with `React.cache()` for Server Components:

```typescript
// src/lib/queries.ts
import { cache } from 'react';

export const getEmployeeById = cache(async (id: string) => {
  return db.employee.findUnique({ where: { id } });
});
```

---

### 3.7 Middleware Parses Zustand Cookie JSON on Every Request

**Impact:** `JSON.parse` on the full Zustand state object runs on every dashboard request.

**File:** `src/middleware.ts` (lines 241-266)

**Fix:** Consider using a lightweight signed cookie (e.g., `iron-session` or a JWT in an httpOnly cookie) instead of parsing the full Zustand state. This also improves security (httpOnly cookies are not accessible to JavaScript).

---

## Priority 4: Low (Nice to Have, Long-Term)

### 4.1 No ISR (Incremental Static Regeneration)

**Impact:** Dashboard pages that change infrequently (e.g., institution list, user list) are rendered dynamically on every request.

**Fix:** For pages with slowly-changing data, use ISR:

```typescript
// app/dashboard/institutions/page.tsx
export const revalidate = 3600; // Revalidate every hour
```

### 4.2 No `generateStaticParams`

**Impact:** No static generation for known routes.

**Fix:** Pre-generate static pages for known employee IDs or institution IDs if the set is bounded.

### 4.3 Reports Route Is 1,330 Lines

**Impact:** Single monolithic file handling all report types with a large switch statement.

**File:** `src/app/api/reports/route.ts`

**Fix:** Split into separate route handlers per report type, or extract report generation logic into dedicated service files.

### 4.4 No Bundle Analysis in CI

**Impact:** Bundle size regressions are not caught automatically.

**Fix:** Add `ANALYZE=true npm run build` to CI pipeline and track bundle size over time.

### 4.5 No `compression` Config in next.config.ts

**Impact:** Responses are not compressed at the application level (though reverse proxies typically handle this).

**Fix:** If not behind a CDN/reverse proxy that compresses, enable `compression: true` in `next.config.ts`.

---

## Summary: Quick Wins (1-2 Days of Work)

These changes deliver the most impact for the least effort:

1. **Add `take`/`skip` to `requests/track/route.ts` and parallelize the 8 queries** — prevents full table scans on every track request
2. **Add missing database indexes** (User.role, User.institutionId, Notification.userId, Notification.createdAt) — speeds up filtered queries
3. **Add `loading.tsx` to each dashboard route** — immediate UX improvement
4. **Switch Google Fonts to `next/font/google`** — one file change, eliminates external font requests
5. **Add `next/dynamic` for dashboard sub-pages** — reduces initial bundle size by 30-50%
6. **Fix the 3-effect fetch pattern** in 9 dashboard pages — eliminates redundant API calls

---

## Metrics to Track

- **Bundle size:** Run `ANALYZE=true npm run build` to establish baseline
- **API response times:** Add pino-based request duration logging
- **Database query performance:** Enable Prisma query logging in development (`log: ['query']`)
- **Core Web Vitals:** Monitor LCP, FID, CLS in production
- **Connection pool usage:** Monitor PostgreSQL `active_connections` metric
