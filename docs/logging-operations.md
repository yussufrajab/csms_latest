# CSMS Logging Operations Guide

This document provides detailed instructions for examining, analyzing, operating, and archiving the logs for the Civil Service Management System (CSMS).

## 1. Logging Architecture Overview

The CSMS utilizes a tiered logging strategy to separate operational observability from business audit requirements.

### Log Categories & Locations

| Log Type | Storage Location | Format | Purpose |
| :--- | :--- | :--- | :--- |
| **Application Logs** | `/var/log/csms/app/app.log` | Structured JSON | General operational events and debugging |
| **Error Logs** | `/var/log/csms/app/error.log` | Structured JSON | High-priority errors and stack traces |
| **Worker Logs** | `/var/log/csms/workers/*.log` | Structured JSON/Syslog | Background job and queue processing |
| **Audit Trail** | PostgreSQL `audit` schema | Relational | Authoritative business record of all changes |
| **Audit Archives** | `/var/log/csms/archive/audit/` | Compressed JSON | Long-term cold storage of audit data |

### Monitoring Pipeline
`Application/Worker Logs` $\rightarrow$ `Wazuh Agent` $\rightarrow$ `Wazuh Manager` $\rightarrow$ `OpenSearch Dashboard`

---

## 2. Examining and Analyzing Logs

Since logs are written in structured JSON format, they should be analyzed using tools that support JSON parsing rather than plain text search.

### Local Examination (SSH)

#### Viewing Live Logs
To view logs in real-time with human-readable formatting:
```bash
# For general app logs
tail -f /var/log/csms/app/app.log | npx pino-pretty

# For error logs only
tail -f /var/log/csms/app/error.log | npx pino-pretty
```

#### Searching for Specific Events
Use `grep` or `jq` to filter structured logs.
```bash
# Find all logs related to a specific user ID
grep '"userId":"12345"' /var/log/csms/app/app.log | npx pino-pretty

# Extract all error messages from the last 1000 lines
tail -n 1000 /var/log/csms/app/error.log | jq -r '.msg'
```

### Centralized Analysis (OpenSearch)
For large-scale analysis or alerting, use the OpenSearch Dashboard:
1. Navigate to the **OpenSearch Dashboard**.
2. Filter by `service: "csms"`.
3. Use the query bar to filter by specific fields (e.g., `level: "error"` or `component: "worker"`).

---

## 3. Operational Maintenance

### Log Rotation
Logs are rotated daily to prevent disk exhaustion. This is managed by `logrotate`.
- **Configuration File**: `/etc/logrotate.d/csms`
- **Retention**: 30 days.
- **Behavior**: Logs are compressed and truncated using `copytruncate` to ensure the application can continue writing without restart.

**Manual Rotation Test:**
```bash
sudo logrotate --debug /etc/logrotate.d/csms
```

### Partition Management
The PostgreSQL audit trail uses monthly partitioning to maintain performance.
- **Pre-creation**: The `scripts/ensure-partitions.sh` script runs monthly to create partitions for the next 6 months.
- **Verification**: Check if the current month's partition exists:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'audit' AND table_name = 'audit_log_2026_05';
  ```

---

## 4. Archival Process

Audit logs are moved from PostgreSQL to cold storage monthly to ensure the database remains performant.

### The Archival Workflow
1. **Export**: The `scripts/archive-audit.sh` script exports the previous month's partition to a JSON file.
2. **Compression**: The JSON file is compressed using `gzip`.
3. **Verification**: A SHA-256 checksum is generated for the archive.
4. **Cleanup**: The PostgreSQL partition is dropped **only after** the archive is verified and backed up offsite.

### Operating the Archive Script
The archive script is automated via cron, but can be run manually.

**Run archive for the previous month (dry-run/no drop):**
```bash
sudo -u nextjs /opt/csms/scripts/archive-audit.sh
```

**Run archive and drop the database partition:**
```bash
sudo -u nextjs /opt/csms/scripts/archive-audit.sh --drop-partition
```

### Archive Directory Structure
Archives are stored by year:
`/var/log/csms/archive/audit/YYYY/audit_log_YYYY_MM.json.gz`

---

## 5. Setup and Deployment

### Initial Infrastructure Setup
To initialize the logging environment on a new server, run the setup script:
```bash
sudo bash scripts/setup-logging.sh
```
This script performs the following:
1. Creates necessary directories in `/var/log/csms/`.
2. Sets appropriate ownership and permissions.
3. Deploys the `logrotate` configuration.
4. Configures cron jobs for archival and partition pre-creation.

### Wazuh Integration
To enable centralized monitoring, add the following to `/var/ossec/etc/ossec.conf`:
```xml
<localfile>
  <log_format>json</log_format>
  <location>/var/log/csms/app/*.log</location>
</localfile>
<localfile>
  <log_format>json</log_format>
  <location>/var/log/csms/audit/*.log</location>
</localfile>
<localfile>
  <log_format>syslog</log_format>
  <location>/var/log/csms/workers/*.log</location>
</localfile>
```
Then restart the agent: `sudo systemctl restart wazuh-agent`.
