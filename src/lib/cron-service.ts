import cron from 'node-cron';
import { cronLogger } from '@/lib/logger';
import { db } from '@/lib/db';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import {
  getPasswordExpirationStatus,
  shouldSendWarning,
  PASSWORD_GRACE_PERIOD_DAYS,
} from '@/lib/password-expiration-utils';
import {
  logAuditEvent,
  AuditEventCategory,
  AuditSeverity,
} from '@/lib/audit-logger';
import { ensurePartitions } from '@/lib/audit-db';

let cronJobRunning = false;

/**
 * Check all users for password expiration and send notifications
 */
export async function checkPasswordExpirations(): Promise<void> {
  if (cronJobRunning) {
    cronLogger.info('Password expiration check already running, skipping');
    return;
  }

  cronJobRunning = true;
  const startTime = Date.now();

  try {
    cronLogger.info('Starting password expiration check');

    // Get all active users
    const users = await db.user.findMany({
      where: {
        active: true,
        // Exclude users with temporary passwords (they have their own expiry logic)
        isTemporaryPassword: false,
      },
      select: {
        id: true,
        username: true,
        role: true,
        passwordExpiresAt: true,
        gracePeriodStartedAt: true,
        lastExpirationWarningLevel: true,
        lastPasswordChange: true,
      },
    });

    cronLogger.info({ userCount: users.length }, 'Checking active users for password expiration');

    let warningsSent = 0;
    let gracePeriodStarted = 0;
    let accountsLocked = 0;

    for (const user of users) {
      try {
        const status = getPasswordExpirationStatus(user);

        // Case 1: Password expired beyond grace period - lock account
        if (status.isExpired && !status.isInGracePeriod) {
          await db.user.update({
            where: { id: user.id },
            data: {
              active: false,
              mustChangePassword: true,
            },
          });

          await createNotification({
            userId: user.id,
            message: NotificationTemplates.passwordExpiredFinal().message,
            link:
              NotificationTemplates.passwordExpiredFinal().link || undefined,
          });

          await logAuditEvent({
            eventType: 'PASSWORD_EXPIRED_ACCOUNT_LOCKED',
            eventCategory: AuditEventCategory.SECURITY,
            severity: AuditSeverity.CRITICAL,
            userId: user.id,
            username: user.username,
            userRole: user.role,
            attemptedRoute: '/cron/password-expiration-check',
            requestMethod: 'CRON',
            isAuthenticated: false,
            wasBlocked: true,
            blockReason: 'Password expired beyond grace period',
            additionalData: {
              passwordExpiresAt: user.passwordExpiresAt,
              gracePeriodStartedAt: user.gracePeriodStartedAt,
            },
          });

          accountsLocked++;
          cronLogger.info({ username: user.username }, 'Locked account - password expired beyond grace period');
          continue;
        }

        // Case 2: Password expired but within grace period
        if (status.isInGracePeriod) {
          // Check if we need to start grace period
          if (!user.gracePeriodStartedAt && user.passwordExpiresAt) {
            const now = new Date();
            if (now > user.passwordExpiresAt) {
              await db.user.update({
                where: { id: user.id },
                data: {
                  gracePeriodStartedAt: now,
                  mustChangePassword: true,
                  lastExpirationWarningLevel: 5, // Expired level
                },
              });

              await createNotification({
                userId: user.id,
                message: NotificationTemplates.passwordExpired(
                  status.gracePeriodDaysRemaining
                ).message,
                link:
                  NotificationTemplates.passwordExpired(
                    status.gracePeriodDaysRemaining
                  ).link || undefined,
              });

              await logAuditEvent({
                eventType: 'PASSWORD_EXPIRED_GRACE_PERIOD_STARTED',
                eventCategory: AuditEventCategory.SECURITY,
                severity: AuditSeverity.WARNING,
                userId: user.id,
                username: user.username,
                userRole: user.role,
                attemptedRoute: '/cron/password-expiration-check',
                requestMethod: 'CRON',
                isAuthenticated: false,
                wasBlocked: false,
                blockReason: null,
                additionalData: {
                  gracePeriodDays: PASSWORD_GRACE_PERIOD_DAYS,
                  gracePeriodEndsAt: new Date(
                    now.getTime() +
                      PASSWORD_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
                  ),
                },
              });

              gracePeriodStarted++;
              cronLogger.info({ username: user.username }, 'Started grace period for user');
            }
          }
          continue;
        }

        // Case 3: Check if warning notification needed
        const currentWarningLevel = status.warningLevel;
        const lastWarningLevel = user.lastExpirationWarningLevel || 0;

        if (shouldSendWarning(currentWarningLevel, lastWarningLevel)) {
          let notificationTemplate;
          const expiresAt = user.passwordExpiresAt!;
          const daysRemaining = status.daysUntilExpiration!;

          switch (currentWarningLevel) {
            case 1: // 14 days
              notificationTemplate =
                NotificationTemplates.passwordExpiring14Days(
                  daysRemaining,
                  expiresAt
                );
              break;
            case 2: // 7 days
              notificationTemplate =
                NotificationTemplates.passwordExpiring7Days(
                  daysRemaining,
                  expiresAt
                );
              break;
            case 3: // 3 days
              notificationTemplate =
                NotificationTemplates.passwordExpiring3Days(
                  daysRemaining,
                  expiresAt
                );
              break;
            case 4: // 1 day
              notificationTemplate =
                NotificationTemplates.passwordExpiring1Day(expiresAt);
              break;
            default:
              continue;
          }

          await createNotification({
            userId: user.id,
            message: notificationTemplate.message,
            link: notificationTemplate.link || undefined,
          });

          await db.user.update({
            where: { id: user.id },
            data: {
              lastExpirationWarningLevel: currentWarningLevel,
            },
          });

          await logAuditEvent({
            eventType: 'PASSWORD_EXPIRATION_WARNING',
            eventCategory: AuditEventCategory.SECURITY,
            severity:
              currentWarningLevel >= 3
                ? AuditSeverity.WARNING
                : AuditSeverity.INFO,
            userId: user.id,
            username: user.username,
            userRole: user.role,
            attemptedRoute: '/cron/password-expiration-check',
            requestMethod: 'CRON',
            isAuthenticated: false,
            wasBlocked: false,
            blockReason: null,
            additionalData: {
              warningLevel: currentWarningLevel,
              daysUntilExpiration: daysRemaining,
              passwordExpiresAt: expiresAt,
            },
          });

          warningsSent++;
          cronLogger.info({ username: user.username, daysRemaining }, 'Sent password expiration warning');
        }
      } catch (error) {
        cronLogger.error({ err: error, username: user.username }, 'Error processing user');
        // Continue with next user
      }
    }

    const duration = Date.now() - startTime;
    cronLogger.info({ duration }, 'Password expiration check completed');
    cronLogger.info({ warningsSent, gracePeriodStarted, accountsLocked }, 'Password expiration check results');

    // Log successful cron execution
    await logAuditEvent({
      eventType: 'CRON_JOB_COMPLETED',
      eventCategory: AuditEventCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      attemptedRoute: '/cron/password-expiration-check',
      requestMethod: 'CRON',
      isAuthenticated: false,
      wasBlocked: false,
      blockReason: null,
      additionalData: {
        usersChecked: users.length,
        warningsSent,
        gracePeriodStarted,
        accountsLocked,
        durationMs: duration,
      },
    });
  } catch (error) {
    cronLogger.error({ err: error }, 'Fatal error in password expiration check');

    // Log failed cron execution
    await logAuditEvent({
      eventType: 'CRON_JOB_FAILED',
      eventCategory: AuditEventCategory.SYSTEM,
      severity: AuditSeverity.CRITICAL,
      attemptedRoute: '/cron/password-expiration-check',
      requestMethod: 'CRON',
      isAuthenticated: false,
      wasBlocked: false,
      blockReason: null,
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    cronJobRunning = false;
  }
}

/**
 * Start the password expiration cron job
 * Runs daily at 6:00 AM
 */
export function startPasswordExpirationCron(): void {
  // Schedule: Run every day at 6:00 AM
  // Cron format: second minute hour day month weekday
  // '0 6 * * *' = At 6:00 AM every day
  const schedule = '0 6 * * *';

  cron.schedule(schedule, async () => {
    cronLogger.info('Triggered password expiration check (scheduled)');
    await checkPasswordExpirations();
  });

  cronLogger.info('Password expiration check scheduled: Daily at 6:00 AM');

  // Schedule audit partition creation: 1st of every month at 00:01
  cron.schedule('1 0 1 * *', async () => {
    cronLogger.info('Creating future audit log partitions');
    try {
      await ensurePartitions(3);
    } catch (error) {
      cronLogger.error({ err: error }, 'Error creating audit partitions');
    }
  });
  cronLogger.info('Audit partition creation scheduled: Monthly on the 1st');

  // Run once on startup (optional - can be removed if not desired)
  // Useful for development/testing
  if (process.env.NODE_ENV === 'development') {
    cronLogger.info('Running initial password expiration check (development mode)');
    setTimeout(() => {
      checkPasswordExpirations();
    }, 5000); // Wait 5 seconds after startup
  }

  // Ensure audit partitions exist on startup
  ensurePartitions(3).then(() => {
    cronLogger.info('Audit partitions verified');
  }).catch((error) => {
    cronLogger.error({ err: error }, 'Error creating audit partitions on startup');
  });
}
