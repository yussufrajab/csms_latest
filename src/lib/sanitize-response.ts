/**
 * Response sanitization utilities to strip sensitive user fields
 * from API responses before sending them to clients.
 */

export const SENSITIVE_USER_FIELDS = [
  'password',
  'passwordHash',
  'failedLoginAttempts',
  'loginLockedUntil',
  'loginLockoutType',
  'loginLockoutReason',
  'isManuallyLocked',
  'lockedBy',
  'lockedAt',
  'lockoutNotes',
  'failedPasswordChangeAttempts',
  'passwordChangeLockoutUntil',
  'isTemporaryPassword',
  'mustChangePassword',
  'passwordExpiresAt',
  'gracePeriodStartedAt',
  'lastExpirationWarningLevel',
  'passwordHistory',
] as const;

/**
 * Strips sensitive fields from a single user object.
 * Returns a shallow copy with all SENSITIVE_USER_FIELDS removed.
 */
export function sanitizeUser<T extends Record<string, any>>(
  user: T
): Omit<T, (typeof SENSITIVE_USER_FIELDS)[number]> {
  const copy = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete (copy as Record<string, any>)[field];
  }
  return copy as Omit<T, (typeof SENSITIVE_USER_FIELDS)[number]>;
}

/**
 * Strips sensitive fields from an array of user objects.
 */
export function sanitizeUsers<T extends Record<string, any>>(
  users: T[]
): Omit<T, (typeof SENSITIVE_USER_FIELDS)[number]>[] {
  return users.map(sanitizeUser);
}

/**
 * Masks a session token for safe logging.
 * Returns '****' for empty or very short tokens,
 * otherwise shows first 4 characters followed by '...'.
 */
export function maskSessionToken(token: string): string {
  if (!token || token.length <= 4) {
    return '****';
  }
  return token.slice(0, 4) + '...';
}