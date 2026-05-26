# CSMS Logging & Audit Architecture — Implementation Plan

> **Status:** PostgreSQL audit partitions already in place ✅  
> **Goal:** Add structured file-based logging, Wazuh monitoring, and automated archival

---

## Architecture Overview

```
CSMS Next.js App
├── PostgreSQL               ← Business audit trail (DONE ✅)
│   └── audit.audit_log_YYYY_MM (partitioned)
│
├── /var/log/csms/           ← App/infra logs (TODO)
│   ├── app/
│   │   ├── app.log
│   │   ├── error.log
│   │   └── combined.log
│   ├── audit/               ← Monthly JSON exports from PostgreSQL
│   │   └── audit-YYYY-MM.log
│   ├── workers/
│   │   └── queue-worker.log
│   └── archive/
│       └── audit/
│           └── YYYY/
│               └── audit_log_YYYY_MM.json.gz
│
└── Wazuh Agent              ← Monitors /var/log/csms/**
        ↓
   Wazuh Manager
        ↓
  OpenSearch Dashboard
```

**Rule:** PostgreSQL holds the authoritative audit trail. File logs are for application observability, not business records.

---

## Phase 1 — Server Setup

### 1.1 Create Log Directories

```bash
sudo mkdir -p /var/log/csms/app
sudo mkdir -p /var/log/csms/audit
sudo mkdir -p /var/log/csms/workers
sudo mkdir -p /var/log/csms/archive/audit
```

### 1.2 Set Permissions

```bash
# Replace "nextjs" with your app's Linux user
sudo chown -R nextjs:nextjs /var/log/csms
sudo chmod -R 750 /var/log/csms
```

- [ ] Directories created on server
- [ ] Ownership set to app user (`nextjs` or equivalent)
- [ ] Permissions verified (`ls -la /var/log/csms`)

---

## Phase 2 — Pino Logger

### 2.1 Install Dependencies

```bash
npm install pino
npm install rotating-file-stream   # optional, for size-based rotation
```

- [ ] Packages installed
- [ ] `package.json` updated and committed

### 2.2 Create `src/lib/logger.ts`

```ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    // Always use structured JSON — never plain strings
    base: {
      service: 'csms',
      env: process.env.NODE_ENV,
    },
  },
  isDev
    ? pino.transport({ target: 'pino-pretty' })
    : pino.transport({
        targets: [
          {
            target: 'pino/file',
            options: { destination: '/var/log/csms/app/app.log', mkdir: true },
          },
          {
            target: 'pino/file',
            level: 'error',
            options: { destination: '/var/log/csms/app/error.log', mkdir: true },
          },
        ],
      })
);
```

> **Important:** Always log structured objects, not plain strings.

```ts
// ✅ Good — structured and queryable
logger.info({ action: 'REQUEST_APPROVED', userId: user.id, requestId: req.id });

// ❌ Bad — unqueryable, breaks Wazuh parsing
logger.info('Request approved');
```

- [ ] `src/lib/logger.ts` created
- [ ] Dev mode uses `pino-pretty` (human-readable)
- [ ] Production mode writes to `/var/log/csms/app/`
- [ ] All existing `console.log` / `console.error` calls replaced with `logger`

### 2.3 Add Prisma Error Logging (Optional)

Add to `src/lib/prisma.ts`:

```ts
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    // Only enable 'query' during debugging — too noisy for production
    // { emit: 'event', level: 'query' },
  ],
});

prisma.$on('error', (e) => {
  logger.error({ err: e }, 'Prisma error');
});
```

- [ ] Prisma error events wired to `logger.error`
- [ ] Query logging disabled in production

### 2.4 Add Worker Logging

For background jobs / queue workers, create a dedicated child logger:

```ts
export const workerLogger = logger.child({ component: 'worker' });

// Usage
workerLogger.info({ jobId, type: 'EMAIL_SEND' }, 'Job started');
```

Direct worker output to `/var/log/csms/workers/queue-worker.log` via the `pino/file` transport target.

- [ ] Worker logger created
- [ ] Worker log path configured separately from app log

---

## Phase 3 — Log Rotation (logrotate)

Create `/etc/logrotate.d/csms`:

```
/var/log/csms/app/*.log
/var/log/csms/workers/*.log
{
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

Test the config before relying on it:

```bash
sudo logrotate --debug /etc/logrotate.d/csms
```

- [ ] `/etc/logrotate.d/csms` created
- [ ] `logrotate --debug` passes with no errors
- [ ] Rotation tested manually with `logrotate --force`

---

## Phase 4 — Audit Archive Script

### 4.1 Create Archive Script

Create `/opt/csms/scripts/archive-audit.sh`:

```bash
#!/bin/bash
set -e

DB_NAME="csms"
DB_USER="postgres"
ARCHIVE_DIR="/var/log/csms/archive/audit"

YEAR=$(date -d "last month" +"%Y")
MONTH=$(date -d "last month" +"%m")
PARTITION="audit_log_${YEAR}_${MONTH}"
OUTPUT="${ARCHIVE_DIR}/${YEAR}/${PARTITION}.json"

mkdir -p "${ARCHIVE_DIR}/${YEAR}"

echo "[$(date -u +%FT%TZ)] Starting archive: ${PARTITION}"

# Export partition to JSON
psql -U "$DB_USER" -d "$DB_NAME" <<EOF
COPY (
    SELECT row_to_json(t)
    FROM (
        SELECT * FROM audit.${PARTITION} ORDER BY created_at
    ) t
) TO '${OUTPUT}';
EOF

# Compress and checksum
gzip -f "${OUTPUT}"
sha256sum "${OUTPUT}.gz" > "${OUTPUT}.gz.sha256"

echo "[$(date -u +%FT%TZ)] Archive complete: ${OUTPUT}.gz"
echo "[$(date -u +%FT%TZ)] Checksum: $(cat ${OUTPUT}.gz.sha256)"
```

### 4.2 Make Executable

```bash
sudo mkdir -p /opt/csms/scripts
sudo chmod +x /opt/csms/scripts/archive-audit.sh
```

### 4.3 Optional: Drop Partition After Archive

Add to the script **only after** verifying the archive is intact and backed up offsite:

```bash
# Verify archive exists and has content
if [ -s "${OUTPUT}.gz" ]; then
  psql -U "$DB_USER" -d "$DB_NAME" -c "DROP TABLE IF EXISTS audit.${PARTITION};"
  echo "[$(date -u +%FT%TZ)] Partition dropped: ${PARTITION}"
else
  echo "[$(date -u +%FT%TZ)] ERROR: Archive empty — partition NOT dropped"
  exit 1
fi
```

- [ ] Script created at `/opt/csms/scripts/archive-audit.sh`
- [ ] Script tested manually for the previous month
- [ ] Checksum file verified
- [ ] Drop-partition block added only after confirming offsite backup

---

## Phase 5 — Cron Jobs

Edit crontab with `crontab -e` (as the app user):

```cron
# Audit archive — runs 2 AM on the 1st of every month
0 2 1 * * /opt/csms/scripts/archive-audit.sh >> /var/log/csms/workers/archive.log 2>&1

# Ensure future partitions exist — runs monthly (add ensurePartitions to a script)
0 3 1 * * /opt/csms/scripts/ensure-partitions.sh >> /var/log/csms/workers/partitions.log 2>&1
```

### 5.1 Partition Pre-creation (Important)

Prevent future insert failures by ensuring partitions are created in advance. Add a utility or cron task that calls your existing `ensurePartitions` helper:

```ts
// In a maintenance script or API route (protected)
await ensurePartitions(6); // Create next 6 months
```

- [ ] Archive cron added and verified with `crontab -l`
- [ ] Partition pre-creation cron added
- [ ] First manual run tested successfully
- [ ] Cron output verified in `/var/log/csms/workers/archive.log`

---

## Phase 6 — Wazuh Integration

Add to Wazuh agent config (`/var/ossec/etc/ossec.conf`):

```xml
<!-- App logs -->
<localfile>
  <log_format>json</log_format>
  <location>/var/log/csms/app/*.log</location>
</localfile>

<!-- Audit exports -->
<localfile>
  <log_format>json</log_format>
  <location>/var/log/csms/audit/*.log</location>
</localfile>

<!-- Worker logs -->
<localfile>
  <log_format>syslog</log_format>
  <location>/var/log/csms/workers/*.log</location>
</localfile>
```

Restart the agent after config change:

```bash
sudo systemctl restart wazuh-agent
```

- [ ] Wazuh agent config updated
- [ ] Agent restarted without errors
- [ ] Test log event visible in OpenSearch Dashboard
- [ ] Alert rules configured for `level: 'error'` events

---

## Phase 7 — Audit Retention Policy

Use a tiered approach for long-term compliance:

| Age | Storage | Action |
|-----|---------|--------|
| 0 – 12 months | PostgreSQL (partitioned) | Live, queryable |
| 12 – 36 months | Archive PostgreSQL or read-only DB | Available on request |
| 36 – 60 months | Compressed JSON (`/var/log/csms/archive/`) | Cold storage |
| 60+ months | Delete or offsite cold archive | Per compliance policy |

> Define your retention periods based on your regulatory requirements (e.g. GDPR, PCI-DSS, local data laws).

- [ ] Retention policy documented and agreed with stakeholders
- [ ] Archive PostgreSQL instance provisioned (if using 12–36 month tier)
- [ ] Offsite backup configured (e.g. S3, Backblaze, or self-hosted object store)

---

## Never Store in PostgreSQL

| Log Type | Where It Goes |
|----------|--------------|
| Stack traces | `/var/log/csms/app/error.log` |
| HTTP access logs | nginx logs or `/var/log/csms/app/` |
| Debug output | `/var/log/csms/app/app.log` (filtered by log level) |
| Worker stdout | `/var/log/csms/workers/` |
| Prisma queries | `/var/log/csms/app/` (debug only, never production) |
| Business audit trail | **PostgreSQL only** ✅ |

---

## Summary Checklist

### Infrastructure
- [ ] Log directories created (`/var/log/csms/...`)
- [ ] Permissions set for app user
- [ ] `logrotate` config in place and tested

### Application Code
- [ ] `pino` installed
- [ ] `src/lib/logger.ts` created
- [ ] All `console.log/error` replaced with `logger`
- [ ] Workers use child logger
- [ ] Prisma errors wired to `logger.error`

### Automation
- [ ] Archive script created and tested
- [ ] Archive cron configured
- [ ] Partition pre-creation cron configured

### Monitoring
- [ ] Wazuh agent config updated
- [ ] Alerts tested end-to-end in OpenSearch

### Governance
- [ ] Retention tiers defined
- [ ] Offsite backup confirmed
- [ ] Partition drop only happens after backup verified
