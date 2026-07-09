# Data Migration Plan: Source (10.0.225.11) → Destination (10.0.225.14)

## What We're Migrating (ONLY)

| What | From Source | Notes |
|---|---|---|
| **Employee data** | 36,295 records | UPSERT by `zanId`, keep 9 extra on destination |
| **EmployeeCertificate** | 26,726 records | Destination has 0 — straight INSERT |
| **Institution data** | 72 records | Already identical on both — SKIP |
| **MinIO (photos + documents)** | 47 GB, 124,524 objects | Destination MinIO is EMPTY — full copy |
| **Users** | 95 records (55 overlap, 40 source-only) | MERGE: keep all destination users, add 40 missing |

## What We're NOT Migrating

| What | Why |
|---|---|
| **All request tables** | Source has ~48 real requests with old statuses; destination has ~24,000 test records. Both are disposable. |
| **AuditLog** | Incompatible schemas. Archive on source if needed. |
| **Notifications** | Transient, not important. |
| **Sessions** | Ephemeral, will be recreated. |

---

## Step-by-Step Execution

### Step 0: Backups (5 min)

```bash
# On SOURCE (10.0.225.11) — as user: nextjs
pg_dump -Fc -U postgres nody > /tmp/nody_source_backup_$(date +%Y%m%d).backup

# On DESTINATION (10.0.225.14) — as user: nextjstest
echo 'Sogea@2020' | sudo -S -u postgres pg_dump -Fc nody > /tmp/nody_dest_backup_$(date +%Y%m%d).backup
```

### Step 1: Copy MinIO Data (1-4 hours — START THIS FIRST)

This is the bottleneck. Start it immediately and work on other steps in parallel.

```bash
# On DESTINATION (10.0.225.14)
# Ensure MinIO is running and accessible
mc alias set source http://10.0.225.11:9000 csmsadmin 'Mamlaka2020MinIO'
mc alias set dest http://localhost:9000 minioadmin minioadmin

# Create buckets
mc mb dest/documents --ignore-existing
mc mb dest/photos --ignore-existing
mc mb dest/certificates --ignore-existing
mc mb dest/attachments --ignore-existing

# Mirror all data (run each in a separate terminal for parallel transfer)
mc mirror source/documents dest/documents --overwrite
# Expected: ~124,524 objects, ~47 GB
# Progress will show as it goes
```

### Step 2: Clear Test Data on Destination (5 min)

Since the destination has test request data we don't need, clean it out:

```sql
-- On DESTINATION database (10.0.225.14)
-- Connect: sudo -u postgres psql -d nody

BEGIN;

-- Clear all request tables (test data)
TRUNCATE "CadreChangeRequest" CASCADE;
TRUNCATE "ConfirmationRequest" CASCADE;
TRUNCATE "Complaint" CASCADE;
TRUNCATE "LwopRequest" CASCADE;
TRUNCATE "PromotionRequest" CASCADE;
TRUNCATE "ResignationRequest" CASCADE;
TRUNCATE "RetirementRequest" CASCADE;
TRUNCATE "SeparationRequest" CASCADE;
TRUNCATE "ServiceExtensionRequest" CASCADE;

-- Clear notifications (transient)
TRUNCATE "Notification" CASCADE;

-- Clear sessions (will be recreated)
TRUNCATE "Session" CASCADE;

-- Clear audit logs (incompatible, not migrating)
TRUNCATE audit_log CASCADE;

-- Clear EmployeeCertificate (will re-import from source)
TRUNCATE "EmployeeCertificate" CASCADE;

COMMIT;
```

### Step 3: Migrate Employee Data (10 min)

Since all 36,295 source employees exist in the destination (same `zanId`s), and the destination has 9 extra employees, we need to UPDATE source data into destination (preserving the 9 destination-only employees).

```bash
# On SOURCE — export employees to CSV
PGPASSWORD=Mamlaka2020 psql -U postgres -d nody -c "
COPY (SELECT 
  id, \"employeeEntityId\", name, gender, \"profileImageUrl\",
  \"dateOfBirth\", \"placeOfBirth\", region, \"countryOfBirth\", \"zanId\",
  \"phoneNumber\", \"contactAddress\", \"zssfNumber\", \"payrollNumber\", cadre,
  \"salaryScale\", ministry, department, \"appointmentType\", \"contractType\",
  \"recentTitleDate\", \"currentReportingOffice\", \"currentWorkplace\",
  \"employmentDate\", \"confirmationDate\", \"retirementDate\", status,
  \"ardhilHaliUrl\", \"confirmationLetterUrl\", \"jobContractUrl\",
  \"birthCertificateUrl\", \"institutionId\", \"dataSource\"
FROM \"Employee\") TO STDOUT WITH CSV HEADER
" > /tmp/source_employees.csv
```

```bash
# Transfer CSV to destination
scp /tmp/source_employees.csv nextjstest@10.0.225.14:/tmp/
```

```sql
-- On DESTINATION database (10.0.225.14)
-- Step 3a: Create temp table matching source Employee schema (without 'email')
CREATE TEMP TABLE source_employee_import (
  id TEXT, "employeeEntityId" TEXT, name TEXT, gender TEXT, "profileImageUrl" TEXT,
  "dateOfBirth" TIMESTAMP, "placeOfBirth" TEXT, region TEXT, "countryOfBirth" TEXT, "zanId" TEXT,
  "phoneNumber" TEXT, "contactAddress" TEXT, "zssfNumber" TEXT, "payrollNumber" TEXT, cadre TEXT,
  "salaryScale" TEXT, ministry TEXT, department TEXT, "appointmentType" TEXT, "contractType" TEXT,
  "recentTitleDate" TIMESTAMP, "currentReportingOffice" TEXT, "currentWorkplace" TEXT,
  "employmentDate" TIMESTAMP, "confirmationDate" TIMESTAMP, "retirementDate" TIMESTAMP, status TEXT,
  "ardhilHaliUrl" TEXT, "confirmationLetterUrl" TEXT, "jobContractUrl" TEXT,
  "birthCertificateUrl" TEXT, "institutionId" TEXT, "dataSource" TEXT
);

-- Step 3b: Import source data
\COPY source_employee_import FROM '/tmp/source_employees.csv' WITH CSV HEADER;

-- Step 3c: UPDATE existing employees with source data
-- (destination has 9 extra employees — we keep those untouched)
UPDATE "Employee" dest
SET
  "employeeEntityId" = src."employeeEntityId",
  name = src.name,
  gender = src.gender,
  "profileImageUrl" = src."profileImageUrl",
  "dateOfBirth" = src."dateOfBirth",
  "placeOfBirth" = src."placeOfBirth",
  region = src.region,
  "countryOfBirth" = src."countryOfBirth",
  "phoneNumber" = src."phoneNumber",
  "contactAddress" = src."contactAddress",
  "zssfNumber" = src."zssfNumber",
  "payrollNumber" = src."payrollNumber",
  cadre = src.cadre,
  "salaryScale" = src."salaryScale",
  ministry = src.ministry,
  department = src.department,
  "appointmentType" = src."appointmentType",
  "contractType" = src."contractType",
  "recentTitleDate" = src."recentTitleDate",
  "currentReportingOffice" = src."currentReportingOffice",
  "currentWorkplace" = src."currentWorkplace",
  "employmentDate" = src."employmentDate",
  "confirmationDate" = src."confirmationDate",
  "retirementDate" = src."retirementDate",
  status = src.status,
  "ardhilHaliUrl" = src."ardhilHaliUrl",
  "confirmationLetterUrl" = src."confirmationLetterUrl",
  "jobContractUrl" = src."jobContractUrl",
  "birthCertificateUrl" = src."birthCertificateUrl",
  "institutionId" = src."institutionId",
  "dataSource" = src."dataSource"
  -- NOTE: "email" column NOT updated — keeps destination value (NULL for most)
FROM source_employee_import src
WHERE dest."zanId" = src."zanId";

-- Step 3d: VERIFY — should be 36,295 updated
SELECT COUNT(*) as updated_employees FROM "Employee"
WHERE "zanId" IN (SELECT "zanId" FROM source_employee_import);

-- Cleanup
DROP TABLE source_employee_import;
```

### Step 4: Migrate EmployeeCertificate (5 min)

Source has 26,726 certificates. Destination has 0 (we just truncated it).

```bash
# On SOURCE — export certificates
PGPASSWORD=Mamlaka2020 psql -U postgres -d nody -c "
COPY (SELECT id, type, name, url, \"employeeId\"
FROM \"EmployeeCertificate\") TO STDOUT WITH CSV HEADER
" > /tmp/source_certificates.csv

# Transfer to destination
scp /tmp/source_certificates.csv nextjstest@10.0.225.14:/tmp/
```

```sql
-- On DESTINATION database
\COPY "EmployeeCertificate" FROM '/tmp/source_certificates.csv' WITH CSV HEADER;

-- Verify
SELECT COUNT(*) FROM "EmployeeCertificate";
-- Should be ~26,726
```

### Step 5: Merge Users (5 min)

Keep all 130 destination users. Add the 40 source-only users that don't exist on destination.

```bash
# On SOURCE — export users not already on destination
PGPASSWORD=Mamlaka2020 psql -U postgres -d nody -c "
COPY (SELECT 
  id, name, username, password, role, active, \"employeeId\", \"institutionId\",
  \"createdAt\", \"updatedAt\", \"phoneNumber\", email,
  \"failedPasswordChangeAttempts\", \"isTemporaryPassword\", \"lastPasswordChange\",
  \"mustChangePassword\", \"passwordChangeLockoutUntil\", \"passwordHistory\",
  \"temporaryPasswordExpiry\", \"gracePeriodStartedAt\", \"lastExpirationWarningLevel\",
  \"passwordExpiresAt\", \"failedLoginAttempts\", \"isManuallyLocked\",
  \"lockedAt\", \"lockedBy\", \"lockoutNotes\", \"loginLockedUntil\",
  \"loginLockoutReason\", \"loginLockoutType\", \"lastActivity\"
FROM \"User\"
WHERE id NOT IN (
  -- These are the 55 overlapping IDs that already exist on destination
  SELECT id FROM unnest(ARRAY[
    'cmd06nn9p0005e67wgvz3pd6c', 'cme56ma17000x2btjnpvgr0kg', 'admin-backend-id',
    'cmd06nnb50007e67wa5491lw5', 'cme57bm9600062bcqtlkj9wcx', 'cmd06nnbd000de67wb6e6ild5',
    'emp_0a6e0a6c39b8a86acfdcbd235139a1eb', 'emp_79a9c51c033c4f171dbce3cdf2d1c6ef',
    'emp_5ab44d5ca1c692673d690bb3c54ddea9', 'emp_2841dbfa9218428a1cc2ff9e0aeceda2',
    'emp_3c6b4c3d3aff1ae6c7ddc5c8721caab6', 'emp_96e39e9d286d62f8e298d06bfb916e2b',
    'emp_ca957505ccd6c2e292721ff6ce1b5d2e', 'emp_42810cc2db9a6970ba72633b5f8cc4b3',
    'emp_03c5503afa51d9bf28e6882a832e7a4d', 'emp_f926754b3b2cbcaae646b6bc74902751',
    'emp_f0ec62e38a2e575932b281b52e599cc4', 'emp_67e6b78601dcb641f877b51915c25655',
    'emp_aaf77b97e5910963a92c08fe5e9b8dae', 'emp_72bbea3f01aff0791b521094855626a0',
    'emp_fb2d0f0fbffd7c01a0c79d0759329676', 'emp_1a99731e4cd72eb4b50a25baef62912b',
    '4c887d1f-a344-447d-a1e6-a86ccad9d1fe', 'd5752aac-6a33-486b-8f69-31ad20f98928',
    '1b7c47e5-d75e-4a8f-a3d6-56a92dcc6e41', '6f121d26-fa44-431e-90c8-f93419d49a50',
    'cmd059ir10002e6d86l802ljc', 'cme57api100042bcqhbkg91r8', 'user_1753046780450',
    'cmd06nnbb000be67wwgil78yv', 'cme57cciu00082bcqnbw9sjm9',
    'cme6sts42000o2bgxfjax08co', 'cmd06nnbq000ne67wwmiwxuo8',
    'cmecjzkmi00032bhu3ts6wi8y', 'cme471pqo00032bidhttxmboj',
    'cmd06nnbl000je67wtl28pk42', 'cmd06nnbn000le67wtg41s3su',
    'cmd06nnbs000pe67woh62ey8r', 'cmd06nnbi000he67wz9doivi6',
    'cmd06nnbg000fe67wdbus4imu'
  ]) AS overlap_id
  WHERE overlap_id = \"User\".id
)
) TO STDOUT WITH CSV HEADER
" > /tmp/source_users_extra.csv
```

> **Note**: Instead of hardcoding 55 IDs, a simpler approach is to export ALL source users and use `ON CONFLICT DO NOTHING` on the destination. This avoids ID mismatches:

```bash
# Simpler approach — export ALL source users
PGPASSWORD=Mamlaka2020 psql -U postgres -d nody -c "
COPY \"User\" TO STDOUT WITH CSV HEADER
" > /tmp/source_users_all.csv

scp /tmp/source_users_all.csv nextjstest@10.0.225.14:/tmp/
```

```sql
-- On DESTINATION database
-- Import with ON CONFLICT to skip existing users (by username or id)
CREATE TEMP TABLE user_import (LIKE "User" INCLUDING ALL);
\COPY user_import FROM '/tmp/source_users_all.csv' WITH CSV HEADER;

-- Insert only users that don't exist on destination (by username — unique key)
INSERT INTO "User" SELECT * FROM user_import
WHERE username NOT IN (SELECT username FROM "User")
ON CONFLICT DO NOTHING;

-- Also catch any remaining by ID
INSERT INTO "User" SELECT * FROM user_import
WHERE id NOT IN (SELECT id FROM "User")
ON CONFLICT DO NOTHING;

-- Verify count — should be 130 (existing) + ~40 (new) ≈ 170
SELECT COUNT(*) FROM "User";

DROP TABLE user_import;
```

### Step 6: Migrate SystemSettings (1 min)

```bash
# On SOURCE — export HRIMS settings
PGPASSWORD=Mamlaka2020 psql -U postgres -d nody -c "
COPY \"SystemSettings\" TO STDOUT WITH CSV HEADER
" > /tmp/source_settings.csv

scp /tmp/source_settings.csv nextjstest@10.0.225.14:/tmp/
```

```sql
-- On DESTINATION database
-- Upsert system settings (keep destination if key conflicts)
CREATE TEMP TABLE settings_import (LIKE "SystemSettings" INCLUDING ALL);
\COPY settings_import FROM '/tmp/source_settings.csv' WITH CSV HEADER;

INSERT INTO "SystemSettings" SELECT * FROM settings_import
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = EXCLUDED."updatedAt";

DROP TABLE settings_import;
```

### Step 7: Verify MinIO Copy Completed (check Step 1)

```bash
# On DESTINATION (10.0.225.14)
mc ls dest/documents --recursive | wc -l   # Should be ~124,524
mc ls dest/documents/employee-photos --recursive | wc -l  # Should be ~17,365
mc ls dest/documents/employee-documents --recursive | wc -l  # Should be ~106,773

# Spot check — download a file and verify it opens
mc cp dest/documents/employee-photos/$(mc ls dest/documents/employee-photos --recursive | head -1 | awk '{print $NF}') /tmp/test_photo.jpg
file /tmp/test_photo.jpg  # Should show: JPEG image data
```

### Step 8: Update Destination Environment (5 min)

```bash
# On DESTINATION — edit /home/nextjstest/csms/.env

# Update MinIO endpoint to local (or keep csmsadmin credentials)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin          # Match destination MinIO config
MINIO_SECRET_KEY=minioadmin           # Match destination MinIO config
MINIO_BUCKET_NAME=documents
MINIO_BUCKET_CERTIFICATES=certificates
MINIO_BUCKET_PHOTOS=photos
MINIO_BUCKET_ATTACHMENTS=attachments
NEXT_PUBLIC_MINIO_ENDPOINT=http://10.0.225.14:9000    # Change to new server IP
MINIO_CONSOLE_URL=http://10.0.225.14:9001              # Change to new server IP

# Update public URLs for production
NEXT_PUBLIC_APP_URL=https://csms.zanajira.go.tz     # Production domain
NEXTAUTH_URL=https://csms.zanajira.go.tz             # Production domain
```

### Step 9: Rebuild and Start (10 min)

```bash
# On DESTINATION
cd /home/nextjstest/csms
npx prisma generate    # Regenerate Prisma client
npm run build          # Build Next.js
pm2 restart all        # Or your process manager

# Verify
curl http://localhost:9002 | head -20
```

### Step 10: Smoke Tests (30 min)

1. **Login** — Try logging in with a known user account
2. **Employee list** — Check employee count matches (36,304)
3. **Employee detail** — View an employee, verify profile photo loads
4. **Document download** — Download an employee document, verify it opens
5. **HRIMS settings** — Check `/dashboard/admin/hrims-settings` shows correct config
6. **Photo page** — Check `/dashboard/admin/get-photo` can fetch new photos from HRIMS
7. **Documents page** — Check `/dashboard/admin/get-documents` works
8. **New request** — Create a test request and verify the HRRP workflow works

---

## Summary

| Step | Time | What |
|---|---|---|
| 0. Backup | 5 min | Dump both databases |
| 1. MinIO copy | **1-4 hrs** | `mc mirror` — START FIRST |
| 2. Clear test data | 5 min | TRUNCATE request tables on destination |
| 3. Migrate employees | 10 min | UPSERT by zanId |
| 4. Migrate certificates | 5 min | INSERT from source |
| 5. Merge users | 5 min | INSERT with ON CONFLICT |
| 6. Migrate settings | 1 min | UPSERT system settings |
| 7. Verify MinIO | 5 min | Check object counts |
| 8. Update .env | 5 min | Point MinIO/URLs to new server |
| 9. Rebuild | 10 min | `prisma generate` + `npm run build` |
| 10. Smoke tests | 30 min | Verify everything works |

**Total active work: ~1 hour** (plus 1-4 hours waiting for MinIO copy)

**Downtime: 0 minutes** if you do the MinIO copy first with `--watch`, then the DB swap during a maintenance window.

---

## Rollback Plan

If anything goes wrong:

1. **Database**: Restore from backup created in Step 0
   ```bash
   # On DESTINATION
   echo 'Sogea@2020' | sudo -S -u postgres pg_restore -d nody /tmp/nody_dest_backup_YYYYMMDD.backup
   ```

2. **MinIO**: The source server is still running — just point `.env` back to source MinIO
   ```
   NEXT_PUBLIC_MINIO_ENDPOINT=http://10.0.225.11:9000
   MINIO_CONSOLE_URL=http://10.0.225.11:9001
   ```

3. **Full revert**: Switch DNS/proxy back to 10.0.225.11

Keep the source server running for at least **7 days** after migration as insurance.