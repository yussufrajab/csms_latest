# CSMS Logging System - Complete Operations Guide

> This document provides comprehensive instructions for operating, examining, analyzing, and maintaining the CSMS logging infrastructure. For architectural context and implementation details, see [csms-logging-plan.md](../superpowers/csms-logging-plan.md).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Log Types and Locations](#2-log-types-and-locations)
3. [Examining Logs](#3-examining-logs)
4. [Analyzing Logs](#4-analyzing-logs)
5. [Log Rotation](#5-log-rotation)
6. [Archive Operations](#6-archive-operations)
7. [Partition Management](#7-partition-management)
8. [Cron Job Configuration](#8-cron-job-configuration)
9. [Wazuh Integration](#9-wazuh-integration)
10. [Troubleshooting](#10-troubleshooting)
11. [Retention Policy](#11-retention-policy)

---

## 1. Architecture Overview

The CSMS logging system is built on a tiered architecture that separates operational observability from business audit requirements:

```
CSMS Next.js Application
│
├── Structured File Logs (/var/log/csms/)
│   ├── app/          → Application events, debug output
│   ├── error.log    → Errors and stack traces only
│   ├── workers/     → Background job processing
│   └── archive/     → Compressed audit archives
│
├── PostgreSQL Audit (audit schema)
│   └── audit.audit_log_YYYY_MM partitions → Authoritative business records
│
└── Wazuh Agent → OpenSearch Dashboard
```

### Core Principles

- **PostgreSQL** holds the authoritative audit trail for all business events
- **File logs** provide application observability and debugging
- **Wazuh** aggregates logs for centralized monitoring and alerting
- **Never store** business records in file logs — use PostgreSQL

---

## 2. Log Types and Locations

### 2.1 Application Logs

| Property | Value |
|----------|-------|
| Location | `/var/log/csms/app/app.log` |
| Format | Structured JSON (Pino) |
| Content | General operational events, debug info |
| Rotation | Daily, 30 days retained |

### 2.2 Error Logs

| Property | Value |
|----------|-------|
| Location | `/var/log/csms/app/error.log` |
| Format | Structured JSON (Pino) |
| Content | Errors, warnings, stack traces |
| Level | `error` and above only |

### 2.3 Worker Logs

| Property | Value |
|----------|-------|
| Location | `/var/log/csms/workers/queue-worker.log` |
| Format | Structured JSON (Syslog-compatible) |
| Content | Background job processing, cron tasks |

### 2.4 Audit Trail (PostgreSQL)

| Property | Value |
|----------|-------|
| Schema | `audit` |
| Table Pattern | `audit.audit_log_YYYY_MM` |
| Format | Relational (partitioned by month) |
| Content | Authoritative business records |

### 2.5 Audit Archives

| Property | Value |
|----------|-------|
| Location | `/var/log/csms/archive/audit/YYYY/` |
| Format | Compressed JSON (`.json.gz`) |
| Content | Monthly audit exports |
| Checksum | SHA-256 (`.gz.sha256`) |

---

## 3. Examining Logs

### 3.1 Viewing Live Logs (Development)

For real-time log viewing with human-readable formatting:

```bash
# View app logs in real-time (requires pino-pretty)
tail -f /var/log/csms/app/app.log | npx pino-pretty

# View error logs only
tail -f /var/log/csms/app/error.log | npx pino-pretty

# View worker logs
tail -f /var/log/csms/workers/queue-worker.log | npx pino-pretty
```

### 3.2 Viewing Logs in Production (SSH)

In production, logs are written as raw JSON. Use these methods:

```bash
# View last 100 lines (raw JSON)
tail -n 100 /var/log/csms/app/app.log

# Pretty-print a single entry
tail -n 1 /var/log/csms/app/app.log | jq '.'

# View all entries as pretty-printed JSON (slower)
cat /var/log/csms/app/app.log | jq -c '.' | head -n 50
```

### 3.3 Searching for Specific Events

```bash
# Find logs related to a specific user ID
grep '"userId":"12345"' /var/log/csms/app/app.log

# Find all ERROR level entries
grep '"level":30' /var/log/csms/app/app.log  # Pino error level

# Find all logs from a specific component
grep '"component":"worker"' /var/log/csms/app/app.log

# Extract all messages from error log
jq -r '.msg' /var/log/csms/app/error.log

# Find logs within a time range (requires jq date parsing)
jq 'select(.time > "2026-05-01T00:00:00Z")' /var/log/csms/app/app.log
```

### 3.4 Pino Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| trace | 10 | Very detailed debug |
| debug | 20 | Debug information |
| info | 30 | General info (default) |
| warn | 40 | Warnings |
| error | 50 | Errors |
| fatal | 60 | Critical failures |

Filter by level:
```bash
# Show only error and fatal
grep -E '"level":(50|60)' /var/log/csms/app/app.log
```

---

## 4. Analyzing Logs

### 4.1 Local Analysis with jq

```bash
# Count logs by level
jq -r '.level' /var/log/csms/app/app.log | sort | uniq -c

# Count logs by component
jq -r '.component // "root"' /var/log/csms/app/app.log | sort | uniq -c

# Find most common error messages
jq -r '.msg' /var/log/csms/app/error.log | sort | uniq -c | sort -rn | head -20

# Extract request IDs for a specific user
jq -r 'select(.userId == "12345") | .requestId' /var/log/csms/app/app.log

# Analyze response times
jq -r 'select(.responseTime) | .responseTime' /var/log/csms/app/app.log | \
  awk '{sum+=$1; count++} END {print "Avg:", sum/count, "ms"}'
```

### 4.2 PostgreSQL Audit Analysis

Connect to the database and query audit logs:

```bash
# Connect to database
psql -U postgres -d nody

# List available partitions
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'audit' 
ORDER BY table_name;

# Query a specific month's audit
SELECT * FROM audit.audit_log_2026_05 
ORDER BY created_at DESC 
LIMIT 100;

# Find all actions by a specific user
SELECT * FROM audit.audit_log_2026_05 
WHERE user_id = '12345' 
ORDER BY created_at DESC;

# Find all approval events
SELECT * FROM audit.audit_log_2026_05 
WHERE action = 'REQUEST_APPROVED' 
AND created_at > NOW() - INTERVAL '7 days';
```

### 4.3 Centralized Analysis (OpenSearch)

When Wazuh is configured, use the OpenSearch Dashboard:

1. Navigate to **OpenSearch Dashboard**
2. Filter by `service: "csms"`
3. Use query bar for specific filters:

```
# All errors in last 24 hours
level: "error" AND @timestamp:[now-24h TO now]

# Specific component
component: "worker"

# User activity
userId: "12345"

# Failed operations
status: "failed"
```

---

## 5. Log Rotation

### 5.1 Configuration

Log rotation is handled by `logrotate`. Configuration file: `/etc/logrotate.d/csms`

```
/var/log/csms/app/*.log
/var/log/csms/workers/*.log
{
    daily              # Rotate daily
    rotate 30          # Keep 30 days
    compress           # Compress old logs
    delaycompress      # Delay compression by one cycle
    missingok          # Ignore missing files
    notifempty         # Don't rotate empty logs
    copytruncate       # Copy and truncate (app keeps writing)
}
```

### 5.2 Manual Operations

```bash
# Test rotation (debug mode, no changes)
sudo logrotate --debug /etc/logrotate.d/csms

# Force immediate rotation
sudo logrotate --force /etc/logrotate.d/csms

# Verify rotation worked
ls -la /var/log/csms/app/
```

### 5.3 Understanding Rotation Behavior

- `copytruncate`: After rotation, the log file is copied to the archive and then truncated. This allows the application to continue writing to the same file path.
- `delaycompress`: The most recent compressed file is kept uncompressed for one rotation cycle, speeding up access to recent logs.

---

## 6. Archive Operations

### 6.1 Archive Script Overview

The archive script (`/opt/csms/scripts/archive-audit.sh` or `scripts/archive-audit.sh` in repo) performs:

1. Exports the previous month's PostgreSQL partition to JSON
2. Compresses the JSON file with gzip
3. Generates a SHA-256 checksum
4. Optionally drops the PostgreSQL partition

### 6.2 Running the Archive

**Dry-run (default — does NOT drop partition):**

```bash
sudo -u nextjs /opt/csms/scripts/archive-audit.sh
```

**With partition drop (only after verifying backup):**

```bash
sudo -u nextjs /opt/csms/scripts/archive-audit.sh --drop-partition
```

### 6.3 Archive Output

After running, you'll see output like:

```
[2026-06-01T00:00:00Z] Starting archive: audit_log_2026_05
[2026-06-01T00:00:05Z] Exported 15432 rows to /var/log/csms/archive/audit/2026/audit_log_2026_05.json
[2026-06-01T00:00:10Z] Archive complete: /var/log/csms/archive/audit/2026/audit_log_2026_05.gz
[2026-06-01T00:00:10Z] Checksum: a1b2c3d4e5f6...  audit_log_2026_05.gz
```

### 6.4 Verifying Archives

```bash
# List archives
ls -la /var/log/csms/archive/audit/

# Verify checksum
sha256sum /var/log/csms/archive/audit/2026/audit_log_2026_05.gz
cat /var/log/csms/archive/audit/2026/audit_log_2026_05.gz.sha256

# Decompress for viewing
gunzip -c /var/log/csms/archive/audit/2026/audit_log_2026_05.gz | head -n 100

# Count records in archive
gunzip -c /var/log/csms/archive/audit/2026/audit_log_2026_05.gz | jq -s 'length'
```

### 6.5 Archive Directory Structure

```
/var/log/csms/archive/audit/
└── 2025/
    ├── audit_log_2025_01.json.gz
    ├── audit_log_2025_01.json.gz.sha256
    ├── audit_log_2025_02.json.gz
    └── audit_log_2025_02.json.gz.sha256
└── 2026/
    ├── audit_log_2026_01.json.gz
    └── audit_log_2026_01.json.gz.sha256
```

---

## 7. Partition Management

### 7.1 Understanding Partitions

The PostgreSQL audit trail uses **partitioned tables**:
- Each month has its own table: `audit.audit_log_2026_05`
- Partitions improve query performance
- Old partitions can be dropped after archiving

### 7.2 Checking Partitions

```sql
-- List all partitions
SELECT table_name, pg_get_expr(rangefunc, 1) as range
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE relkind = 'r' AND n.nspname = 'audit'
ORDER BY relname;

-- Or using information_schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'audit' 
ORDER BY table_name;
```

### 7.3 Pre-creating Partitions

Partitions should be pre-created to prevent insert failures when a new month begins:

```bash
# Run manually
/opt/csms/scripts/ensure-partitions.sh

# Or with custom months ahead
CSMS_PARTITION_MONTHS=12 /opt/csms/scripts/ensure-partitions.sh
```

Output example:
```
[2026-05-23T12:00:00Z] Ensuring audit partitions exist for next 6 months
[2026-05-23T12:00:00Z] Created partition: audit.audit_log_2026_05
[2026-05-23T12:00:00Z] Partition already exists: audit.audit_log_2026_06
[2026-05-23T12:00:00Z] Partition already exists: audit.audit_log_2026_07
[2026-05-23T12:00:00Z] Partition check complete
```

---

## 8. Cron Job Configuration

### 8.1 Current Cron Jobs

Two automated cron jobs manage the logging system:

| Job | Schedule | Purpose |
|-----|----------|---------|
| archive-audit.sh | 0 2 1 * * (2 AM, 1st of month) | Export and archive previous month |
| ensure-partitions.sh | 0 3 1 * * (3 AM, 1st of month) | Create partitions for next 6 months |

### 8.2 Managing Cron Jobs

```bash
# View current cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove all CSMS cron jobs
crontab | grep -v "archive-audit.sh" | grep -v "ensure-partitions.sh" | crontab -
```

### 8.3 Cron Output Logs

The cron jobs write output to:

- Archive logs: `/var/log/csms/workers/archive.log`
- Partition logs: `/var/log/csms/workers/partitions.log`

Check for issues:
```bash
# Check last archive run
tail -n 20 /var/log/csms/workers/archive.log

# Check last partition run
tail -n 20 /var/log/csms/workers/partitions.log
```

---

## 9. Wazuh Integration

### 9.1 Agent Configuration

Add to `/var/ossec/etc/ossec.conf`:

```xml
<!-- App logs (JSON) -->
<localfile>
  <log_format>json</log_format>
  <location>/var/log/csms/app/*.log</location>
</localfile>

<!-- Audit exports (JSON) -->
<localfile>
  <log_format>json</log_format>
  <location>/var/log/csms/audit/*.log</location>
</localfile>

<!-- Worker logs (Syslog) -->
<localfile>
  <log_format>syslog</log_format>
  <location>/var/log/csms/workers/*.log</location>
</localfile>
```

### 9.2 Restarting the Agent

```bash
# Restart Wazuh agent
sudo systemctl restart wazuh-agent

# Check agent status
sudo systemctl status wazuh-agent

# View agent logs
sudo tail -f /var/ossec/logs/ossec.log
```

### 9.3 Verifying Integration

1. Open **OpenSearch Dashboard**
2. Run a test query for recent CSMS logs:
   ```
   service: "csms" AND @timestamp: [now-5m TO now]
   ```
3. Verify your test log appears

---

## 10. Troubleshooting

### 10.1 Logs Not Appearing

**Symptom**: Application runs but no logs in `/var/log/csms/`

**Diagnosis**:
```bash
# Check if directory exists
ls -la /var/log/csms/

# Check permissions
ls -la /var/log/csms/app/

# Check if app can write (as the app user)
sudo -u nextjs touch /var/log/csms/app/test.log
```

**Solution**: Ensure directories exist and ownership is correct:
```bash
sudo mkdir -p /var/log/csms/app
sudo chown -R nextjs:nextjs /var/log/csms
sudo chmod 750 /var/log/csms
```

### 10.2 Partition Insert Failures

**Symptom**: Errors like `no partition for (...)`

**Diagnosis**:
```bash
# Check if current month partition exists
psql -U postgres -d nody -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'audit' 
AND table_name = 'audit_log_$(date +%Y_%m)';
"
```

**Solution**: Run partition creation script:
```bash
/opt/csms/scripts/ensure-partitions.sh
```

### 10.3 Archive Script Failures

**Symptom**: Archive script exits with error

**Diagnosis**:
```bash
# Check partition exists
psql -U postgres -d nody -c "
SELECT * FROM information_schema.tables 
WHERE table_schema = 'audit' 
AND table_name = 'audit_log_2026_05';
"

# Check database connection
psql -U postgres -d nody -c "SELECT 1;"
```

**Solution**: Ensure database is accessible and partition exists before running archive.

### 10.4 Log Rotation Not Working

**Symptom**: Log files grow too large

**Diagnosis**:
```bash
# Check logrotate config exists
cat /etc/logrotate.d/csms

# Test logrotate
sudo logrotate --debug /etc/logrotate.d/csms
```

**Solution**: Re-deploy logrotate configuration:
```bash
sudo cp /path/to/config/logrotate/csms /etc/logrotate.d/csms
sudo logrotate --force /etc/logrotate.d/csms
```

---

## 11. Retention Policy

### 11.1 Tiered Storage

| Age | Storage | Access | Action |
|-----|---------|--------|--------|
| 0–12 months | PostgreSQL | Live, queryable | Use for daily operations |
| 12–36 months | Archive PostgreSQL | On request | Restore from backup |
| 36–60 months | `/var/log/csms/archive/` | Cold storage | Offsite backup |
| 60+ months | Offsite cold archive | Per policy | Delete or retain |

### 11.2 Archive Cleanup

To remove old archives (use with caution):

```bash
# List archives older than 36 months
find /var/log/csms/archive/audit/ -name "*.gz" -mtime +1095

# Remove specific archive (verify first!)
rm /var/log/csms/archive/audit/2023/audit_log_2023_01.gz
```

### 11.3 Offsite Backup

For compliance, archives should be backed up offsite:

```bash
# Example: Copy archives to backup location
rsync -avz /var/log/csms/archive/audit/ backup-server:/backups/csms/audit/
```

---

## Quick Reference

### Common Commands

```bash
# View live logs
tail -f /var/log/csms/app/app.log | npx pino-pretty

# Search for errors
grep '"level":50' /var/log/csms/app/app.log | jq '.'

# Check partitions
psql -U postgres -d nody -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'audit';"

# Run archive
sudo -u nextjs /opt/csms/scripts/archive-audit.sh

# Ensure partitions
/opt/csms/scripts/ensure-partitions.sh

# Force log rotation
sudo logrotate --force /etc/logrotate.d/csms

# Check cron output
tail -f /var/log/csms/workers/archive.log
```

### File Locations

| Item | Location |
|------|----------|
| App logs | `/var/log/csms/app/` |
| Worker logs | `/var/log/csms/workers/` |
| Archives | `/var/log/csms/archive/audit/` |
| Logrotate config | `/etc/logrotate.d/csms` |
| Archive script | `/opt/csms/scripts/archive-audit.sh` |
| Partition script | `/opt/csms/scripts/ensure-partitions.sh` |
| Logger code | `src/lib/logger.ts` |

---

## Related Documentation

- [csms-logging-plan.md](../superpowers/csms-logging-plan.md) — Architecture and implementation plan
- [logging-operations.md](./logging-operations.md) — Quick operations reference
- [2026-05-23-logging-architecture.md](./superpowers/plans/2026-05-23-logging-architecture.md) — Architecture decisions