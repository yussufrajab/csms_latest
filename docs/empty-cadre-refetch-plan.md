# Empty Cadre Refetch Plan

## Problem

1,157 employees in the database have an empty `cadre` field (null or empty string), causing "N/A" to appear in the employee list on `/dashboard/profile`. These employees are **not orphans** — they have valid names, genders, institutions, and most other HRIMS data. Only the `cadre` field is missing.

### Root Cause

The HRIMS sync worker (`src/lib/jobs/hrims-sync-worker.ts`) constructs the `cadre` field by joining three fields from the `currentEmployment` object in the HRIMS response:

```typescript
const cadre = currentEmployment
  ? [currentEmployment.titlePrefixName, currentEmployment.titleName, currentEmployment.gradeName]
      .filter(part => part && part.trim())
      .join(' ')
  : null;
```

This means `cadre` ends up empty when:

1. **No current employment history**: If `hrimsData.employmentHistories` is empty/missing for an employee, `currentEmployment` is `null`, so `cadre` is set to `null`.
2. **Empty title fields**: If `titlePrefixName`, `titleName`, and `gradeName` are all null/empty for the current employment, the `.filter()` removes all elements and `.join(' ')` produces `""`.
3. **HRIMS data inconsistency**: Some employees in HRIMS simply don't have cadre/rank information in their employment records.

### Discrepancy Note

There is also a discrepancy between the two sync paths:

| Source | Cadre Logic |
|--------|-------------|
| `hrims-sync-worker.ts` (batch sync) | `titlePrefixName + titleName + gradeName` |
| `fetch-employee/route.ts` (single employee) | `titleName` only |

This means a refetch via the worker produces a richer cadre string (e.g., "Assistant Director Public Administration Grade 4") while a single-employee fetch produces just "Public Administration".

### Affected Fields Breakdown

| Field | Empty Count | Notes |
|-------|-------------|-------|
| cadre | 1,157 | All affected employees |
| department | 192 | Mostly in smaller institutions |
| currentWorkplace | 73 | Concentrated in specific institutions |
| retirementDate | 462 | Normal — many employees haven't retired yet |
| salaryScale | 6 | Rare |
| contractType | 5 | Rare |
| payrollNumber | 3 | Rare |

### Top Affected Institutions

| Institution | Total Employees | Empty Cadre | % Empty |
|-------------|----------------|-------------|---------|
| WIZARA YA AFYA | 6,084 | 447 | 7.3% |
| WIZARA YA ELIMU NA MAFUNZO YA AMALI | 18,488 | 333 | 1.8% |
| Baraza la Manispaa Magharibi B | 168 | 73 | 43.5% |
| WIZARA YA KILIMO | 1,679 | 42 | 2.5% |
| Ofisi ya Mkuu wa Mkoa wa Kaskazini Unguja | 70 | 27 | 38.6% |
| Baraza la Mji Kati Unguja | 67 | 20 | 29.9% |
| 47 other institutions | — | 215 | varies |

53 institutions are affected in total.

## Refetch Strategy

The refetch must target **only the institutions with empty-cadre employees**, not all institutions. The existing `POST /api/hrims/refetch-employees` endpoint clears **all** data fields for **all** employees in an institution, which is too aggressive — it would temporarily blank out 93% of employees in WIZARA YA AFYA just to fix 7.3%.

### Approach: Targeted Refetch via HRIMS Single-Employee API

Instead of using the institution-level refetch (which clears all employees in an institution), we use the **single-employee fetch** endpoint (`POST /api/hrims/fetch-employee`) which:

- Fetches a single employee from HRIMS by `zanId`
- Upserts the data without clearing other fields
- Also fetches their photo and documents
- Preserves all existing data while updating the missing fields

This approach:
- Does **not** blank out employees that already have complete data
- Updates only the specific employees with empty cadre
- Fetches fresh data directly from HRIMS

### Script

The script `scripts/refetch-empty-cadre.sh`:

1. Queries the database for all employees with empty cadre
2. Groups them by institution (for progress tracking)
3. For each employee, calls `POST /api/hrims/fetch-employee` with their `zanId` and institution's `voteNumber`
4. Reports success/failure counts

### Prerequisites

- A valid Admin auth cookie
- The production server must be running on port 9002
- The HRIMS API must be accessible

## Usage

```bash
# Dry run — show what would be refetched without making API calls
./scripts/refetch-empty-cadre.sh --cookie 'YOUR_AUTH_COOKIE' --dry-run

# Refetch all empty-cadre employees
./scripts/refetch-empty-cadre.sh --cookie 'YOUR_AUTH_COOKIE'

# Refetch a specific institution only
./scripts/refetch-empty-cadre.sh --cookie 'YOUR_AUTH_COOKIE' --vote 008

# With longer timeout per employee
./scripts/refetch-empty-cadre.sh --cookie 'YOUR_AUTH_COOKIE' --timeout 30
```

## After Refetch

After running the refetch, verify with:

```sql
-- Count remaining empty cadre employees
SELECT COUNT(*) FROM "Employee" WHERE cadre = '' OR cadre IS NULL;

-- Check specific institution
SELECT COUNT(*) FROM "Employee" e
JOIN "Institution" i ON e."institutionId" = i.id
WHERE (e.cadre = '' OR e.cadre IS NULL)
AND i.name = 'WIZARA YA AFYA';
```

## Alternative: Fix Cadre Mapping in the Sync Worker

If the HRIMS API returns employment history data but the `currentEmployment` detection logic fails, consider fixing `saveEmployeeFromDetailedData()` in `hrims-sync-worker.ts`:

1. **Current logic**: `employmentHistories.find(emp => emp.isCurrent) || employmentHistories[0]`
2. **Potential improvement**: Also check `employmentHistories.find(emp => emp.employmentStatus === 'Active')` as a fallback
3. **Another option**: If HRIMS always returns at least one employment record but `isCurrent` is never set, the fallback to `[0]` may not always pick the right record

This would require investigating the actual HRIMS API response for affected employees to determine why `currentEmployment` is null or has empty title fields.