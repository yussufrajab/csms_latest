# CSMS (Civil Service Management System) — Application Documentation

## Overview

**CSMS** is a comprehensive government HR management system for Zanzibar's civil service. It handles employee lifecycle management including hiring, promotions, transfers, separations, complaints, and retirements. The system is a full-stack Next.js application with a PostgreSQL database.

---

## Technologies Used

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.0.7 | React framework with App Router |
| React | 19.2.1 | UI component library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.4 | Utility-first CSS framework |
| Radix UI (shadcn/ui) | — | Accessible UI primitives |
| React Hook Form | 7.54.2 | Form state management |
| Zod | 3.25.76 | Schema validation |
| Zustand | 4.5.4 | State management |
| Lucide React | 0.475 | Icon library |
| react-markdown | 10.1.0 | Markdown rendering |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown |
| jspdf | 2.5.1 | PDF generation |
| recharts | — | Charts (dashboard) |
| date-fns | 3.6.0 | Date utilities |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 16.0.7 | REST API (no separate backend) |
| Prisma | 6.19.1 | ORM / database client |
| PostgreSQL | — | Database |
| bcryptjs | 2.4.3 | Password hashing |
| MinIO | 8.0.5 | Object storage (documents, photos) |
| BullMQ | 5.66.4 | Background job queue |
| Redis (ioredis) | 5.8.2 | Queue backend / caching |
| Nodemailer | 8.0.10 | Email sending |
| Pino | 10.3.1 | Logging |
| Zod | 3.25.76 | API validation |

### AI / Genkit
| Technology | Version | Purpose |
|-----------|---------|---------|
| Google Genkit | 1.33.0 | AI integration |
| Google Gemini API | — | AI model provider |
| Ollama | — | Local AI model (alternative) |

### Storage / Infrastructure
| Technology | Purpose |
|-----------|---------|
| PostgreSQL (nody) | Primary database |
| MinIO (S3-compatible) | Document/file storage |
| Redis | Queue backend, caching |
| PM2 | Process manager (production) |
| ClamAV | Malware scanning for uploads |

### Development & Testing
| Technology | Purpose |
|-----------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| k6 | Load testing |
| Husky + lint-staged | Pre-commit hooks |
| ESLint + Prettier | Code quality |
| MSW (Mock Service Worker) | API mocking for tests |

---

## Database Configuration

| Property | Value |
|----------|-------|
| **Database Name** | `nody` |
| **Provider** | PostgreSQL |
| **ORM** | Prisma (`@prisma/client`) |
| **Schema File** | `prisma/schema.prisma` |
| **Connection** | `postgresql://postgres:postgres@localhost:5432/nody?schema=public` |
| **Prisma Binary Targets** | `native`, `debian-openssl-3.0.x` |

---

## Project Structure

```
csms/
├── prisma/                      # Database schema & migrations
│   └── schema.prisma
├── scripts/                     # Utility scripts
│   ├── seed-requests.ts         # Seed requests across institutions
│   ├── seed-hrrp-users.ts       # Seed HRRP users
│   ├── start-all.sh             # Start all PM2 services
│   └── ...
├── src/
│   ├── ai/                      # Genkit AI integration
│   │   ├── genkit.ts
│   │   └── dev.ts
│   ├── app/
│   │   ├── api/                 # API routes (full REST API)
│   │   │   ├── admin/           # Admin operations
│   │   │   ├── auth/            # Login, logout, sessions
│   │   │   ├── cadre-change/    # Cadre change requests
│   │   │   ├── complaints/      # Grievances
│   │   │   ├── confirmations/   # Post-probation confirmation
│   │   │   ├── dashboard/       # Metrics/KPIs
│   │   │   ├── employees/       # Employee CRUD
│   │   │   ├── files/           # File upload/download
│   │   │   ├── hrims/           # HRIMS integration
│   │   │   ├── institutions/    # Institution management
│   │   │   ├── lwop/            # Leave Without Pay
│   │   │   ├── promotions/      # Promotion requests
│   │   │   ├── reports/         # Reporting
│   │   │   ├── resignation/     # Resignation requests
│   │   │   ├── retirement/      # Retirement requests
│   │   │   ├── service-extension/ # Service extensions
│   │   │   ├── termination/     # Terminations
│   │   │   ├── users/           # User management
│   │   │   └── ...
│   │   ├── (auth)/              # Auth pages (login, employee-login)
│   │   └── dashboard/           # All dashboard pages
│   │       ├── admin/           # Admin panel
│   │       ├── cadre-change/
│   │       ├── complaints/
│   │       ├── confirmation/
│   │       ├── dismissal/
│   │       ├── lwop/
│   │       ├── promotion/
│   │       ├── resignation/
│   │       ├── retirement/
│   │       ├── service-extension/
│   │       ├── termination/
│   │       ├── track-status/
│   │       └── ...
│   ├── components/              # Shared UI components
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── employee/
│   │   ├── layout/
│   │   ├── shared/
│   │   └── ui/                  # shadcn/ui primitives
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Business logic & utilities
│   │   ├── api-client.ts        # Frontend API client
│   │   ├── api-auth.ts          # Backend auth wrapper
│   │   ├── auth-helpers.ts      # Login completion logic
│   │   ├── constants.ts         # Roles, institutions, seed data
│   │   ├── route-permissions.ts # Role-based route access
│   │   ├── rate-limiter.ts      # API rate limiting
│   │   ├── password-utils.ts    # Password hashing/validation
│   │   ├── minio.ts             # MinIO storage client
│   │   ├── session-manager.ts   # Session CRUD
│   │   └── ...
│   └── store/                   # Zustand stores
├── load-tests/                  # k6 load testing scripts
├── e2e/                         # Playwright E2E tests
├── docs/                        # Documentation
├── public/                      # Static assets
├── .env                         # Environment variables
├── ecosystem.config.js          # PM2 configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json
```

---

## User Roles

| Role Code | Full Name | Category | Description |
|-----------|-----------|----------|-------------|
| **Admin** | Administrator | CSC Only | System administration, user management, full access |
| **CSCS** | Civil Service Commission Secretary | CSC Internal | Commission-level oversight, final approvals |
| **HHRMD** | Head of HR Management Department | CSC Internal | Commission-level HR management, reviews approvals |
| **HRMO** | Human Resource Management Officer | CSC Internal | Commission-level HR processing |
| **DO** | Disciplinary Officer | CSC Internal | Handles disciplinary actions, terminations, dismissals |
| **PO** | Planning Officer | CSC Internal | Reports and analytics (read-only) |
| **HRRP** | Human Resource Responsible Personnel | CSC Internal | First-level approval, verifies and forwards requests to Commission |
| **HRO** | Human Resource Officer | Institution-based | Submits requests for employees in their institution |
| **EMPLOYEE** | Employee | Institution-based | Civil servant, can submit complaints and track status |

> **CSC** = Tume ya Utumishi Serikali (Civil Service Commission)
> **CSC Internal Roles** (HHRMD, HRMO, DO, PO, CSCS, HRRP) + Admin must belong to CSC only.
> **Institution-based Roles** (HRO, EMPLOYEE) can belong to any institution (including CSC).

---

## Login Methods

### 1. Standard Login (Username/Email + Password)
- **Endpoint:** `POST /api/auth/login`
- **Fields:** `username` (or email), `password`
- **Flow:**
  1. Validate credentials against database
  2. Check account lockout status (failed attempts, manual lock, security lock)
  3. Verify password with bcrypt
  4. Check password expiration (temporary password expiry, grace period)
  5. Create session (max 3 concurrent sessions)
  6. Set `auth-storage` cookie (Zustand state serialized)
  7. Set CSRF token cookie
  8. Log audit trail entry
  9. Detect suspicious login (new IP/location notification)

### 2. Employee Login (ZAN ID + ZSSF + Payroll)
- **Endpoint:** `POST /api/auth/employee-login`
- **Fields:** `zanId`, `zssfNumber`, `payrollNumber`
- **Flow:**
  1. Match employee record by all three fields
  2. If no user account exists → **auto-provision** (JIT) with default password = ZAN ID
  3. Account created as `EMPLOYEE` role with `mustChangePassword: true`
  4. Same session/cookie flow as standard login

### 3. Logout
- **Endpoint:** `POST /api/auth/logout`
- Clears session, removes auth cookies

---

## Role Permissions Matrix

### Frontend Route Access

| Route | Admin | CSCS | HHRMD | HRMO | DO | PO | HRRP | HRO | EMPLOYEE |
|-------|:-----:|:----:|:-----:|:----:|:--:|:--:|:----:|:---:|:--------:|
| `/dashboard` (home) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/dashboard/admin/*` | ✓ | — | — | — | — | — | — | — | — |
| `/dashboard/promotion` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/confirmation` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/cadre-change` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/retirement` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/resignation` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/service-extension` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/lwop` | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| `/dashboard/termination` | — | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | — |
| `/dashboard/dismissal` | — | ✓ | ✓ | — | ✓ | — | — | ✓ | — |
| `/dashboard/complaints` | — | ✓ | ✓ | — | ✓ | — | — | — | ✓ |
| `/dashboard/urgent-actions` | — | ✓ | — | — | — | — | ✓ | ✓ | — |
| `/dashboard/track-status` | — | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `/dashboard/reports` | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/dashboard/institutions` | — | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — |
| `/dashboard/profile` | — | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |

### API Route Protection (via `withAuth`)

| API Endpoint | Allowed Roles | Description |
|-------------|:------------:|-------------|
| `POST /api/users/bulk` | Admin | Bulk user creation |
| `POST /api/users` | Admin | Create single user |
| Various request type APIs | Varies by type | CRUD operations for each request type |
| Employee APIs | HRO, HRRP, CSC, etc. | Employee CRUD operations |

### Workflow Summary

1. **HRO** creates/submits requests for employees in their institution
2. **HRRP** at CSC does first-level review/approval and forwards to Commission
3. **HHRMD/HRMO** at Commission reviews and processes approvals
4. **CSCS** provides commission-level final sign-off
5. **DO** handles disciplinary routes (termination, dismissal)
6. **PO** has read-only access to reports
7. **EMPLOYEE** can submit complaints and track request status
8. **Admin** has full system access for user/institution management

---

## User Credentials (Seed Data)

All seed users have password: `password123`

### Commission Users (TUME YA UTUMISHI SERIKALINI)

| Username | Name | Role | Institution |
|----------|------|------|-------------|
| `akassim` | Amina Kassim | Admin | TUME YA UTUMISHI SERIKALINI |
| `zhaji` | Zaituni Haji | CSCS | TUME YA UTUMISHI SERIKALINI |
| `skhamis` | Safia Khamis | HHRMD | TUME YA UTUMISHI SERIKALINI |
| `fiddi` | Fauzia Iddi | HRMO | TUME YA UTUMISHI SERIKALINI |
| `mussi` | Maimuna Ussi | DO | TUME YA UTUMISHI SERIKALINI |
| `mishak` | Mwanakombo Is-hak | PO | TUME YA UTUMISHI SERIKALINI |
| `khamadi` | Khamis Hamadi | HRRP | TUME YA UTUMISHI SERIKALINI |
| `hro_commission` | HRO (Tume) | HRO | TUME YA UTUMISHI SERIKALINI |

### Institution HROs

| Username | Name | Role | Institution |
|----------|------|------|-------------|
| `kmnyonge` | Khamis Mnyonge | HRO | OFISI YA RAIS, FEDHA NA MIPANGO |
| `ahmedm` | Ahmed Mohammed | HRO | WIZARA YA ELIMU NA MAFUNZO YA AMALI |
| `mariamj` | Mariam Juma | HRO | WIZARA YA AFYA |

### Employee Users

| Username | Name | Role | Institution | Employee ID |
|----------|------|------|-------------|-------------|
| `alijuma` | Ali Juma Ali | EMPLOYEE | OFISI YA RAIS, FEDHA NA MIPANGO | emp1 |
| `khadijanassor` | Khadija Nassor | EMPLOYEE | WIZARA YA ELIMU NA MAFUNZO YA AMALI | emp8 |
| `yussufmakame` | Yussuf Makame | EMPLOYEE | WIZARA YA ELIMU NA MAFUNZO YA AMALI | emp9 |

---

## Database Schema Overview

### Models (14 tables)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Institution** | Government institutions/ministries | id, name, email, phoneNumber, voteNumber, tinNumber, manualEntryEnabled |
| **Employee** | Civil servant master records | id, name, zanId (unique), zssfNumber, payrollNumber, cadre, status, institutionId |
| **User** | System users | id, username (unique), password (hashed), role, active, employeeId (optional), institutionId |
| **PromotionRequest** | Promotion workflow | employeeId, proposedCadre, promotionType, status, reviewStage |
| **ConfirmationRequest** | Post-probation confirmation | employeeId, status, reviewStage |
| **CadreChangeRequest** | Cadre/classification changes | employeeId, originalCadre, newCadre, reason, status |
| **LwopRequest** | Leave Without Pay | employeeId, startDate, endDate, duration, reason, status |
| **RetirementRequest** | Retirements (normal/early/medical) | employeeId, retirementType, proposedDate, status |
| **ResignationRequest** | Resignations | employeeId, effectiveDate, reason, status |
| **SeparationRequest** | Terminations/Dismissals | employeeId, type, reason, status |
| **ServiceExtensionRequest** | Service extensions past retirement | employeeId, currentRetirementDate, requestedExtensionPeriod, status |
| **Complaint** | Grievances | complaintType, subject, details, complainantId, status |
| **EmployeeCertificate** | Educational certificates | employeeId, type, name, url |
| **Notification** | User notifications | userId, message, link, isRead |
| **Session** | User login sessions | userId, sessionToken, ipAddress, expiresAt |
| **SystemSettings** | Key-value config | key (unique), value |

### Common Request Workflow Pattern

All 8 request types share:
- `status` (String) — e.g., Pending HRRP Review, Pending DO Review, Pending Commission Review, Approved, Rejected
- `reviewStage` (String) — initial, hrrp_review, commission_review, completed
- `submittedById` → User (HRO who submitted)
- `reviewedById` → User (CSC officer who reviewed) — optional
- `hrrpReviewedById` → User (HRRP who first reviewed) — optional
- `documents` (String[]) — URLs to supporting documents
- `commissionLetterKey` — Commission decision letter reference — optional

### Entity Relationships

```
Institution (1) ----< (N) Employee
Institution (1) ----< (N) User
Employee   (1) ----< (N) EmployeeCertificate
Employee   (1) ----> (0..1) User  (via employeeId)
Employee   (1) ----< (N) [All 8 Request types]
User       (1) ----< (N) Notification
User       (1) ----< (N) Session
User       (1) ----< (N) Complaint  (as complainant)
User       (1) ----< (N) Complaint  (as reviewer)
User       (1) ----< (N) [All 8 Request types]  (as submitter/reviewer/hrrpReviewer)
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/nody?schema=public` |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | — |
| `OLLAMA_API_KEY` | Ollama API key for local AI | — |
| `MINIO_ENDPOINT` | MinIO server hostname | `localhost` |
| `MINIO_PORT` | MinIO server port | `9000` |
| `MINIO_USE_SSL` | Whether to use SSL for MinIO | `false` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET_NAME` | Default bucket for documents | `documents` |
| `MINIO_BUCKET_CERTIFICATES` | Bucket for certificates | `certificates` |
| `MINIO_BUCKET_PHOTOS` | Bucket for employee photos | `photos` |
| `MINIO_BUCKET_ATTACHMENTS` | Bucket for attachments | `attachments` |
| `NEXT_PUBLIC_MINIO_ENDPOINT` | Public MinIO endpoint URL | `http://102.207.206.28:9000` |
| `MINIO_CONSOLE_URL` | MinIO web console URL | `http://102.207.206.28:9001` |
| `NEXT_PUBLIC_API_URL` | Public API base URL | `http://localhost:9002/api` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL (Next.js app) | `http://localhost:9002` |
| `NEXT_PUBLIC_APP_URL` | Application public URL | `https://test.zanajira.go.tz` |
| `NEXTAUTH_URL` | NextAuth URL | `https://test.zanajira.go.tz` |
| `HRIMS_API_URL` | HRIMS integration API URL | `https://hrims-api.zanzibar.go.tz` |
| `HRIMS_API_KEY` | HRIMS API key | — |
| `HRIMS_MOCK_MODE` | Run HRIMS in mock mode | `true` |
| `CLAMAV_ENABLED` | Enable ClamAV malware scanning | `false` |
| `CLAMAV_HOST` | ClamAV daemon host | `localhost` |
| `CLAMAV_PORT` | ClamAV daemon port | `3310` |
| `CSRF_SECRET` | Secret key for CSRF token signing | — |
| `REDIS_HOST` | Redis host (BullMQ) | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/email + password |
| POST | `/api/auth/employee-login` | Employee login with ZAN ID + ZSSF + Payroll |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/session` | Get current session data |
| GET | `/api/auth/sessions` | List all user sessions |
| POST | `/api/auth/sessions/force-logout` | Force logout other sessions |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/password-status` | Get password expiration status |
| GET | `/api/auth/account-lockout-status` | Get lockout status |
| GET | `/api/auth/refresh-user-data` | Refresh cached user data |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create single user |
| GET | `/api/users/[id]` | Get user by ID |
| PUT | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |
| POST | `/api/users/bulk` | Bulk create users (parsed from .md) |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees (with filters) |
| POST | `/api/employees/bulk-upload` | Bulk upload employees |
| POST | `/api/employees/manual-entry` | Manual employee entry |
| GET | `/api/employees/search` | Search employees |
| GET | `/api/employees/email` | Send employee email |
| GET | `/api/employees/validate` | Validate employee data |
| GET | `/api/employees/[id]/documents` | Get employee documents |
| GET | `/api/employees/[id]/certificates` | Get employee certificates |
| GET | `/api/employees/[id]/fetch-documents` | Fetch employee documents |
| GET | `/api/employees/[id]/fetch-photo` | Fetch employee photo |
| GET | `/api/external/employees` | External employee lookup |

### Institutions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/institutions` | List all institutions |
| GET | `/api/institutions/[id]` | Get institution by ID |
| PUT | `/api/institutions/[id]` | Update institution |
| GET | `/api/institutions/[id]/manual-entry-permission` | Get manual entry permission |

### Request Types (All follow this pattern)

| Method | Endpoint(s) | Description |
|--------|-------------|-------------|
| GET | `/api/[type]` | List all requests of type |
| POST | `/api/[type]` | Create new request |
| GET | `/api/[type]/[id]` | Get request by ID |
| PUT | `/api/[type]/[id]` | Update request (e.g., status change) |

Types: `promotions`, `confirmations`, `cadre-change`, `lwop`, `retirement`, `resignation`, `termination`, `service-extension`

Additional request endpoints:
- `GET /api/confirmation-requests` — All confirmation requests
- `GET /api/retirement-requests` — All retirement requests
- `GET /api/lwop-requests` — All LWOP requests
- `GET /api/service-extension-requests` — All service extension requests
- `POST /api/requests/track` — Track request status by ZAN ID

### Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | List complaints |
| POST | `/api/complaints` | Create complaint |
| GET | `/api/complaints/[id]` | Get complaint by ID |
| PUT | `/api/complaints/[id]` | Update complaint (status, review) |

### Reports & Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/metrics` | Dashboard KPIs and metrics |
| GET | `/api/reports` | Various report endpoints |

### File Storage (MinIO)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload a file |
| GET | `/api/files/download/[...objectKey]` | Download a file |
| GET | `/api/files/preview/[...objectKey]` | Preview a file |
| GET | `/api/files/exists/[...objectKey]` | Check if file exists |
| GET | `/api/files/employee-documents/[filename]` | Get employee document |
| GET | `/api/files/employee-photos/[filename]` | Get employee photo |

### HRIMS Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hrims/bulk-fetch` | Bulk fetch employees from HRIMS |
| GET | `/api/hrims/fetch-employee` | Fetch single employee |
| GET | `/api/hrims/fetch-by-institution` | Fetch employees by institution |
| GET | `/api/hrims/fetch-documents-by-institution` | Fetch documents by institution |
| GET | `/api/hrims/fetch-photos-by-institution` | Fetch photos by institution |
| GET | `/api/hrims/search-employee` | Search employees in HRIMS |
| POST | `/api/hrims/sync-employee` | Sync single employee |
| POST | `/api/hrims/sync-certificates` | Sync employee certificates |
| POST | `/api/hrims/sync-documents` | Sync employee documents |
| GET | `/api/hrims/sync-status/[jobId]` | Check sync job status |
| GET | `/api/hrims/job-status/[jobId]` | Check job status |
| GET | `/api/hrims/test` | Test HRIMS connection |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/lock-account` | Lock a user account |
| POST | `/api/admin/unlock-account` | Unlock a user account |
| POST | `/api/admin/reset-password` | Reset a user's password |
| POST | `/api/admin/trigger-password-check` | Trigger password check |
| GET | `/api/admin/hrims-settings` | Get HRIMS settings |
| PUT | `/api/admin/hrims-settings` | Update HRIMS settings |
| POST | `/api/admin/cleanup-sessions` | Cleanup expired sessions |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit/log` | Log an audit event |
| GET | `/api/audit/logs` | Query audit logs |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List user notifications |

---

## Workflow Stages (Common Pattern)

All request types follow a multi-stage workflow:

```
HRO Submits
    → Pending HRRP Review (HRRP at CSC reviews)
        → Pending Commission Review (HHRMD/HRMO reviews)
            → Approved / Rejected
```

Special cases:
- **Dismissal**: HRO → HRRP → DO/HHRMD → CSCS
- **Termination**: HRO → HRRP → DO/HHRMD → CSCS
- **Complaints**: EMPLOYEE submits → DO/HHRMD handle → Resolution

---

## Deployment

### Production (via PM2)

```bash
# Build the application
npm run build

# Start with PM2
pm2 start npm --name "csms-app" -- start

# Or restart after updates
pm2 restart csms-app

# The app runs on port 9002
# PM2 process list is saved with: pm2 save
```

### Development

```bash
npm run dev    # Starts on port 9002 with hot-reload
```

### PM2 Services

The ecosystem.config.js (`/home/nextjstest/csms/ecosystem.config.js`) manages:
- **redis** — Redis server (port 6379)
- **worker** — BullMQ background worker
- **genkit** — Genkit AI service
- **production** — Next.js production server (port 9002)

---

## Key Features

- **Role-based access control** — 9 distinct roles with granular frontend route and API permissions
- **Multi-stage workflow** — All HR requests go through HRRP → Commission review pipeline
- **Session management** — Max 3 concurrent sessions per user, suspicious login detection
- **Password policy** — Temporary password on first login, expiration, complexity rules, history
- **Account lockout** — Progressive lockout (standard: 30min, security: admin unlock)
- **File storage** — MinIO (S3-compatible) for documents, photos, certificates
- **HRIMS integration** — Fetch/sync employee data from external HR system
- **Bulk operations** — .md file upload for bulk user creation, .md export
- **AI integration** — Google Genkit for complaint rewriting assistance
- **Audit trail** — Comprehensive login attempts, actions, and system events logging
- **CSRF protection** — Signed tokens on state-changing requests
- **Rate limiting** — Per-endpoint rate limiting for auth and write operations
