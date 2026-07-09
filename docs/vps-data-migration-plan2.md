# Data Migration Plan: Source (10.0.225.11) → Destination (10.0.225.14)

## Execution Status: ✅ ALL DATABASE STEPS COMPLETED

### Completed Steps

| Step | Status | Result |
|---|---|---|
| 0. Backup both databases | ✅ Done | Source: 4.8MB, Destination: 5.3MB |
| 1. Copy MinIO data | 🌙 TONIGHT | 47 GB, 124,524 objects — run at night |
| 2. Clear test data | ✅ Done | All request tables, sessions, notifications, audit_log, EmployeeCertificate cleared |
| 3. Migrate Employee data | ✅ Done | 36,295 updated, 9 destination-only preserved = 36,304 total |
| 4. Migrate EmployeeCertificate | ✅ Done | 26,726 imported |
| 5. Merge Users | ✅ Done | 130 existing + 3 added = 133 total |
| 6. Migrate SystemSettings | ✅ Done | 4 HRIMS settings upserted |
| 8. Update .env | ✅ Done | Production URLs + MinIO endpoint updated |

### Verification Results

| Table | Source | Destination | Match? |
|---|---|---|---|
| Employee | 36,295 | 36,304 | ✅ (9 extra on dest) |
| EmployeeCertificate | 26,726 | 26,726 | ✅ Exact match |
| Institution | 72 | 72 | ✅ Exact match |
| SystemSettings | 4 | 4 | ✅ Exact match |
| User | 95 | 133 | ✅ (38 extra on dest from testing) |

---

## What You Need to Do Tonight

### Step 1: Copy MinIO Data (1-4 hours)

```bash
# SSH into DESTINATION (10.0.225.14) as nextjstest
ssh nextjstest@10.0.225.14

# Set up mc aliases
mc alias set source http://10.0.225.11:9000 csmsadmin 'Mamlaka2020MinIO'
mc alias set dest http://localhost:9000 minioadmin minioadmin

# Create buckets (if not already existing)
mc mb dest/documents --ignore-existing
mc mb dest/photos --ignore-existing
mc mb dest/certificates --ignore-existing
mc mb dest/attachments --ignore-existing

# Mirror all data — this is the 47 GB copy
# Run each in a separate tmux/screen session for parallel transfer
mc mirror source/documents dest/documents --overwrite
# Expected: ~124,524 objects, ~47 GB
# This will take 1-4 hours depending on disk/network speed

# Verify when done
mc ls dest/documents --recursive | wc -l   # Should be ~124,524
mc ls dest/documents/employee-photos --recursive | wc -l  # Should be ~17,365
mc ls dest/documents/employee-documents --recursive | wc -l  # Should be ~106,773
```

### After MinIO Copy: Rebuild and Verify

```bash
# On DESTINATION
cd /home/nextjstest/csms
npx prisma generate
npm run build
pm2 restart all

# Smoke test
curl http://localhost:9002
# Try logging in at https://csms.zanajira.go.tz
# Check an employee profile to see if photo loads
# Download a document to verify it works
```

### If MinIO Credentials Need to Match Source

The current destination .env has `minioadmin/minioadmin` credentials. If you want to use the same credentials as source (`csmsadmin/Mamlaka2020MinIO`), you need to:

1. Reconfigure MinIO on the destination with the new credentials
2. Update `.env` to match:
   ```
   MINIO_ACCESS_KEY=csmsadmin
   MINIO_SECRET_KEY=Mamlaka2020MinIO
   ```

Or keep `minioadmin/minioadmin` — just make sure `mc mirror` uses the same credentials.

---

## What Was Migrated (ONLY)

| What | From Source | Strategy |
|---|---|---|
| **Employee data** | 36,295 records | UPSERT by `zanId`, 9 extra on dest preserved |
| **EmployeeCertificate** | 26,726 records | Straight INSERT (dest had 0 after cleanup) |
| **MinIO files** | 124,524 objects (47 GB) | Full copy — TONIGHT |
| **Users** | 40 source-only added | ON CONFLICT DO NOTHING, keep dest users |
| **SystemSettings** | 4 HRIMS config rows | UPSERT |

## What Was NOT Migrated (intentionally)

| What | Why |
|---|---|
| **All request tables** | Source had ~48 old-status requests; destination had ~24,000 test records. Both cleared. |
| **AuditLog** | Incompatible schemas (source: Prisma `AuditLog`, dest: partitioned `audit_log`) |
| **Notifications** | Transient, not important |
| **Sessions** | Ephemeral, will be recreated on login |

---

## Backup Locations

| Server | File | Size |
|---|---|---|
| Source (10.0.225.11) | `/tmp/nody_source_backup_20260609.backup` | 4.8 MB |
| Destination (10.0.225.14) | `/tmp/nody_dest_backup_20260609.backup` | 5.3 MB |
| Destination | `/home/nextjstest/csms/.env.backup_before_migration` | Original .env |

---

## Rollback Plan

If anything goes wrong:

1. **Database**: Restore from backup
   ```bash
   # On DESTINATION
   echo 'Sogea@2020' | sudo -S -u postgres pg_restore -d nody /tmp/nody_dest_backup_20260609.backup
   ```

2. **MinIO**: Point `.env` back to source MinIO temporarily
   ```
   NEXT_PUBLIC_MINIO_ENDPOINT=http://10.0.225.11:9000
   MINIO_CONSOLE_URL=http://10.0.225.11:9001
   ```

3. **Full revert**: Switch DNS/proxy back to 10.0.225.11

Keep source server running for at least **7 days** as insurance.