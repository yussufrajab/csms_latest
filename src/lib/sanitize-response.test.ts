/**
 * Unit tests for src/lib/sanitize-response.ts
 *
 * Tests sanitizeUser, sanitizeUsers, maskSessionToken, and SENSITIVE_USER_FIELDS.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeUser,
  sanitizeUsers,
  maskSessionToken,
  SENSITIVE_USER_FIELDS,
} from './sanitize-response';

// ---------------------------------------------------------------------------
// SENSITIVE_USER_FIELDS
// ---------------------------------------------------------------------------

describe('SENSITIVE_USER_FIELDS', () => {
  it('includes all expected sensitive field names', () => {
    const expectedFields = [
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
    ];

    for (const field of expectedFields) {
      expect(SENSITIVE_USER_FIELDS).toContain(field);
    }
  });
});

// ---------------------------------------------------------------------------
// sanitizeUser
// ---------------------------------------------------------------------------

describe('sanitizeUser', () => {
  it('strips all sensitive fields from user object', () => {
    const user = {
      id: 'user-1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'Admin',
      active: true,
      password: 'secret',
      passwordHash: 'hashed',
      failedLoginAttempts: 3,
      loginLockedUntil: '2025-01-01',
      loginLockoutType: 'temp',
      loginLockoutReason: 'too many attempts',
      isManuallyLocked: true,
      lockedBy: 'system',
      lockedAt: '2025-01-01',
      lockoutNotes: 'locked',
      failedPasswordChangeAttempts: 2,
      passwordChangeLockoutUntil: '2025-01-01',
      isTemporaryPassword: true,
      mustChangePassword: true,
      passwordExpiresAt: '2025-01-01',
      gracePeriodStartedAt: '2025-01-01',
      lastExpirationWarningLevel: 'critical',
      passwordHistory: ['old1', 'old2'],
    };

    const sanitized = sanitizeUser(user);

    // All sensitive fields should be removed
    for (const field of SENSITIVE_USER_FIELDS) {
      expect(sanitized).not.toHaveProperty(field);
    }

    // Non-sensitive fields should remain
    expect(sanitized).toHaveProperty('id', 'user-1');
    expect(sanitized).toHaveProperty('username', 'admin');
    expect(sanitized).toHaveProperty('email', 'admin@example.com');
    expect(sanitized).toHaveProperty('role', 'Admin');
    expect(sanitized).toHaveProperty('active', true);
  });

  it('handles user object without sensitive fields (returns same object minus nothing)', () => {
    const user = {
      id: 'user-2',
      username: 'viewer',
      email: 'viewer@example.com',
      role: 'Viewer',
      active: true,
    };

    const sanitized = sanitizeUser(user);

    // Should have all original fields
    expect(sanitized).toEqual(user);
  });

  it('does not strip non-sensitive fields', () => {
    const user = {
      id: 'user-3',
      name: 'Test User',
      institutionId: 'inst-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-06-01',
      password: 'should-be-removed',
    };

    const sanitized = sanitizeUser(user);

    expect(sanitized).toHaveProperty('id');
    expect(sanitized).toHaveProperty('name');
    expect(sanitized).toHaveProperty('institutionId');
    expect(sanitized).toHaveProperty('createdAt');
    expect(sanitized).toHaveProperty('updatedAt');
    expect(sanitized).not.toHaveProperty('password');
  });
});

// ---------------------------------------------------------------------------
// sanitizeUsers
// ---------------------------------------------------------------------------

describe('sanitizeUsers', () => {
  it('sanitizes an array of users', () => {
    const users = [
      {
        id: 'user-1',
        username: 'admin',
        password: 'secret1',
        mustChangePassword: true,
      },
      {
        id: 'user-2',
        username: 'viewer',
        password: 'secret2',
        isTemporaryPassword: false,
      },
    ];

    const sanitized = sanitizeUsers(users);

    expect(sanitized).toHaveLength(2);

    for (const field of SENSITIVE_USER_FIELDS) {
      expect(sanitized[0]).not.toHaveProperty(field);
      expect(sanitized[1]).not.toHaveProperty(field);
    }

    expect(sanitized[0]).toHaveProperty('id', 'user-1');
    expect(sanitized[0]).toHaveProperty('username', 'admin');
    expect(sanitized[1]).toHaveProperty('id', 'user-2');
    expect(sanitized[1]).toHaveProperty('username', 'viewer');
  });
});

// ---------------------------------------------------------------------------
// maskSessionToken
// ---------------------------------------------------------------------------

describe('maskSessionToken', () => {
  it('masks long token to first 4 chars plus "..."', () => {
    expect(maskSessionToken('abc123def456ghi789')).toBe('abc1...');
  });

  it('masks another long token correctly', () => {
    expect(maskSessionToken('xyz789abc')).toBe('xyz7...');
  });

  it('returns "****" for short tokens (4 chars)', () => {
    expect(maskSessionToken('abcd')).toBe('****');
  });

  it('returns "****" for tokens shorter than 4 chars', () => {
    expect(maskSessionToken('ab')).toBe('****');
  });

  it('returns "****" for empty token', () => {
    expect(maskSessionToken('')).toBe('****');
  });

  it('returns "****" for exactly 5-char token (boundary)', () => {
    // 5 chars: length > 4, so it should show first 4 + '...'
    expect(maskSessionToken('abcde')).toBe('abcd...');
  });
});