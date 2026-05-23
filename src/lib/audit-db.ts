/**
 * Audit Database Layer — Raw SQL access to the partitioned audit.audit_log table.
 *
 * This module replaces Prisma for audit log reads/writes with direct PostgreSQL
 * queries using the `pg` package. It connects to the same DATABASE_URL but uses
 * the `audit` schema.
 */

import { Pool, types } from 'pg';
import { dbLogger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// INET type parser – OID 869 should return a string, not a JS object
// ---------------------------------------------------------------------------
types.setTypeParser(869, (val: string) => val);

// ---------------------------------------------------------------------------
// Pool singleton (globalThis pattern — survives Next.js hot-reload)
// ---------------------------------------------------------------------------

const globalForPg = globalThis as unknown as {
  __auditPgPool: Pool | undefined;
};

function createAuditPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=audit,public',
  });

  pool.on('error', (err: Error) => {
    dbLogger.error({ err }, 'Audit DB unexpected pool error');
  });

  return pool;
}

export function getAuditPool(): Pool {
  if (!globalForPg.__auditPgPool) {
    globalForPg.__auditPgPool = createAuditPool();
  }
  return globalForPg.__auditPgPool;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogWriteData {
  eventType: string;
  eventCategory: string;
  severity?: string;
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  attemptedRoute: string;
  requestMethod?: string | null;
  isAuthenticated?: boolean;
  wasBlocked?: boolean;
  blockReason?: string | null;
  additionalData?: Record<string, any> | null;
  entityType?: string;
  entityId?: string | null;
}

export interface AuditLogQueryFilters {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  eventCategory?: string;
  severity?: string;
  userId?: string;
  username?: string;
  attemptedRoute?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogRow {
  id: string;
  eventType: string;
  eventCategory: string;
  severity: string;
  userId: string | null;
  username: string | null;
  userRole: string | null;
  ipAddress: string | null;
  deviceInfo: Record<string, any> | null;
  attemptedRoute: string;
  requestMethod: string | null;
  isAuthenticated: boolean;
  wasBlocked: boolean;
  blockReason: string | null;
  timestamp: string;
  additionalData: Record<string, any> | null;
  entityType: string;
  entityId: string | null;
  User: { id: string; username: string; name: string; role: string } | null;
}

export interface AuditStatsResult {
  totalEvents: number;
  blockedAttempts: number;
  criticalEvents: number;
  eventsByType: Array<{ eventType: string; _count: number }>;
  eventsBySeverity: Array<{ severity: string; _count: number }>;
}

// ---------------------------------------------------------------------------
// writeAuditLog
// ---------------------------------------------------------------------------

export async function writeAuditLog(data: AuditLogWriteData): Promise<void> {
  const pool = getAuditPool();

  const action = data.eventType;
  const eventCategory = data.eventCategory;
  const severity = data.severity ?? 'INFO';
  const userId = data.userId ?? null;
  const username = data.username ?? null;
  const userRole = data.userRole ?? null;
  const deviceInfo = data.deviceInfo ? JSON.stringify(data.deviceInfo) : null;
  const requestMethod = data.requestMethod ?? null;
  const requestRoute = data.attemptedRoute;
  const isAuthenticated = data.isAuthenticated ?? false;
  const wasBlocked = data.wasBlocked ?? false;
  const blockReason = data.blockReason ?? null;
  const additionalData = data.additionalData
    ? JSON.stringify(data.additionalData)
    : null;
  const entityType = data.entityType ?? 'SYSTEM';
  const entityId = data.entityId ?? null;
  const ipAddressRaw = data.ipAddress?.trim() || null;

  const sql = `
    INSERT INTO audit.audit_log (
      user_id, username, user_role, action, event_category, severity,
      entity_type, entity_id, ip_address, device_info,
      request_method, request_route, is_authenticated,
      was_blocked, block_reason, additional_data
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::inet,$10,$11,$12,$13,$14,$15,$16)
  `;

  const params: any[] = [
    userId,
    username,
    userRole,
    action,
    eventCategory,
    severity,
    entityType,
    entityId,
    ipAddressRaw,
    deviceInfo,
    requestMethod,
    requestRoute,
    isAuthenticated,
    wasBlocked,
    blockReason,
    additionalData,
  ];

  try {
    await pool.query(sql, params);
  } catch (err: any) {
    // If the failure is due to an invalid INET cast, retry with ip_address = NULL
    if (ipAddressRaw && isInvalidInetError(err)) {
      dbLogger.warn(
        { ipAddress: ipAddressRaw },
        'INET cast failed, retrying with ip_address = NULL'
      );
      const retryParams = [...params];
      retryParams[8] = null; // replace ip_address with null
      try {
        await pool.query(
          sql.replace('$9::inet', '$9'),
          retryParams
        );
        return;
      } catch (retryErr: any) {
        dbLogger.error({ err: retryErr }, 'Failed to write audit log (retry)');
        dbLogger.error({ eventData: data }, 'Event data for failed audit log write');
        return; // never throw
      }
    }

    dbLogger.error({ err }, 'Failed to write audit log');
    dbLogger.error({ eventData: data }, 'Event data for failed audit log write');
    // Never throw — audit logging must not break the application
  }
}

/**
 * Heuristic to detect INET cast errors from PostgreSQL.
 * PG error codes: 22P02 = invalid_text_representation, 22P03 = invalid_binary_representation
 */
function isInvalidInetError(err: any): boolean {
  const code = err?.code;
  if (code === '22P02' || code === '22P03') return true;
  const msg = String(err?.message ?? '');
  if (msg.includes('invalid input syntax for type inet')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// queryAuditLogs
// ---------------------------------------------------------------------------

export async function queryAuditLogs(
  filters: AuditLogQueryFilters = {}
): Promise<{ logs: AuditLogRow[]; total: number; limit: number; offset: number }> {
  const pool = getAuditPool();

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  // Date filters
  if (filters.startDate) {
    conditions.push(`a.created_at >= $${paramIdx++}`);
    values.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`a.created_at <= $${paramIdx++}`);
    values.push(filters.endDate);
  }

  // eventType maps to the "action" column
  if (filters.eventType) {
    conditions.push(`a.action = $${paramIdx++}`);
    values.push(filters.eventType);
  }

  if (filters.eventCategory) {
    conditions.push(`a.event_category = $${paramIdx++}`);
    values.push(filters.eventCategory);
  }

  if (filters.severity) {
    conditions.push(`a.severity = $${paramIdx++}`);
    values.push(filters.severity);
  }

  if (filters.userId) {
    conditions.push(`a.user_id = $${paramIdx++}`);
    values.push(filters.userId);
  }

  if (filters.username) {
    conditions.push(`a.username ILIKE $${paramIdx++}`);
    values.push(`%${filters.username}%`);
  }

  if (filters.attemptedRoute) {
    conditions.push(`a.request_route ILIKE $${paramIdx++}`);
    values.push(`%${filters.attemptedRoute}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  const countSql = `SELECT COUNT(*)::int AS total FROM audit.audit_log a ${whereClause}`

  const dataSql = `
    SELECT
      a.id,
      a.event_id,
      a.action         AS "eventType",
      a.event_category AS "eventCategory",
      a.severity,
      a.user_id        AS "userId",
      a.username,
      a.user_role      AS "userRole",
      a.ip_address::text AS "ipAddress",
      a.device_info    AS "deviceInfo",
      a.request_route  AS "attemptedRoute",
      a.request_method AS "requestMethod",
      a.is_authenticated AS "isAuthenticated",
      a.was_blocked    AS "wasBlocked",
      a.block_reason   AS "blockReason",
      a.created_at     AS "timestamp",
      a.additional_data AS "additionalData",
      a.entity_type    AS "entityType",
      a.entity_id      AS "entityId",
      u.id   AS "u_id",
      u.username AS "u_username",
      u.name AS "u_name",
      u.role AS "u_role"
    FROM audit.audit_log a
    LEFT JOIN public."User" u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  values.push(limit, offset);

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(countSql, values.slice(0, -2)), // values without limit/offset for count
      pool.query(dataSql, values),
    ]);

    const total = countResult.rows[0]?.total ?? 0;

    const logs: AuditLogRow[] = dataResult.rows.map((row: any) => ({
      id: String(row.id),
      eventType: row.eventType,
      eventCategory: row.eventCategory,
      severity: row.severity,
      userId: row.userId,
      username: row.username,
      userRole: row.userRole,
      ipAddress: row.ipAddress,
      deviceInfo: row.deviceInfo,
      attemptedRoute: row.attemptedRoute,
      requestMethod: row.requestMethod,
      isAuthenticated: row.isAuthenticated,
      wasBlocked: row.wasBlocked,
      blockReason: row.blockReason,
      timestamp: row.timestamp,
      additionalData: row.additionalData,
      entityType: row.entityType,
      entityId: row.entityId,
      User: row.u_id
        ? {
            id: row.u_id,
            username: row.u_username,
            name: row.u_name,
            role: row.u_role,
          }
        : null,
    }));

    return { logs, total, limit, offset };
  } catch (err) {
    dbLogger.error({ err }, 'Failed to query audit logs');
    throw err; // callers expect to handle query errors
  }
}

// ---------------------------------------------------------------------------
// queryAuditStats
// ---------------------------------------------------------------------------

export async function queryAuditStats(
  filters: AuditLogQueryFilters = {}
): Promise<AuditStatsResult> {
  const pool = getAuditPool();

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIdx++}`);
    values.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`created_at <= $${paramIdx++}`);
    values.push(filters.endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalSql = `SELECT COUNT(*)::int AS total FROM audit.audit_log ${whereClause}`;
  const blockedSql = `SELECT COUNT(*)::int AS total FROM audit.audit_log ${whereClause}${conditions.length > 0 ? ' AND' : 'WHERE'} was_blocked = true`;
  const criticalSql = `SELECT COUNT(*)::int AS total FROM audit.audit_log ${whereClause}${conditions.length > 0 ? ' AND' : 'WHERE'} severity = 'CRITICAL'`;
  const byTypeSql = `SELECT action AS "eventType", COUNT(*)::int AS "_count" FROM audit.audit_log ${whereClause} GROUP BY action ORDER BY "_count" DESC LIMIT 10`;
  const bySeveritySql = `SELECT severity, COUNT(*)::int AS "_count" FROM audit.audit_log ${whereClause} GROUP BY severity`;

  try {
    const [totalRes, blockedRes, criticalRes, byTypeRes, bySeverityRes] =
      await Promise.all([
        pool.query(totalSql, values),
        pool.query(blockedSql, values),
        pool.query(criticalSql, values),
        pool.query(byTypeSql, values),
        pool.query(bySeveritySql, values),
      ]);

    return {
      totalEvents: totalRes.rows[0]?.total ?? 0,
      blockedAttempts: blockedRes.rows[0]?.total ?? 0,
      criticalEvents: criticalRes.rows[0]?.total ?? 0,
      eventsByType: byTypeRes.rows.map((r: any) => ({
        eventType: r.eventType,
        _count: r._count,
      })),
      eventsBySeverity: bySeverityRes.rows.map((r: any) => ({
        severity: r.severity,
        _count: r._count,
      })),
    };
  } catch (err) {
    dbLogger.error({ err }, 'Failed to query audit stats');
    throw err;
  }
}

// ---------------------------------------------------------------------------
// ensurePartitions
// ---------------------------------------------------------------------------

/**
 * Creates monthly partitions for the next `monthsAhead` months.
 *
 * Each partition is named `audit_log_YYYY_MM` and covers the calendar month
 * range `[YYYY-MM-01, YYYY-MM+01-01)` on the `created_at` column.
 *
 * Partitions that already exist are silently skipped.
 */
export async function ensurePartitions(monthsAhead: number = 12): Promise<void> {
  const pool = getAuditPool();
  const now = new Date();

  for (let i = 0; i < monthsAhead; i++) {
    const partitionDate = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth() + i,
      1
    );

    const year = partitionDate.getUTCFullYear();
    const month = String(partitionDate.getUTCMonth() + 1).padStart(2, '0');
    const partitionName = `audit_log_${year}_${month}`;

    // Start of this partition's range
    const rangeStart = `${year}-${month}-01`;

    // Start of the next partition's range
    const nextMonth = new Date(
      partitionDate.getUTCFullYear(),
      partitionDate.getUTCMonth() + 1,
      1
    );
    const nextYear = nextMonth.getUTCFullYear();
    const nextMonthNum = String(nextMonth.getUTCMonth() + 1).padStart(2, '0');
    const rangeEnd = `${nextYear}-${nextMonthNum}-01`;

    const createSql = `
      CREATE TABLE IF NOT EXISTS audit.${partitionName}
        PARTITION OF audit.audit_log
        FOR VALUES FROM ('${rangeStart}') TO ('${rangeEnd}')
    `;

    try {
      await pool.query(createSql);
    } catch (err: any) {
      // Partition already exists — safe to ignore
      if (err?.code === '42P07' || String(err?.message ?? '').includes('already exists')) {
        continue;
      }
      dbLogger.error({ err, partitionName }, 'Failed to create partition');
    }
  }
}