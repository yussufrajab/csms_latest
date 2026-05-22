/**
 * Unit tests for src/lib/api-schemas.ts
 *
 * Tests Zod validation schemas and validateRequest helper.
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  employeeQuerySchema,
  employeeSearchSchema,
  notificationCreateSchema,
  dashboardMetricsSchema,
  validateRequest,
} from './api-schemas';

// ---------------------------------------------------------------------------
// employeeQuerySchema
// ---------------------------------------------------------------------------

describe('employeeQuerySchema', () => {
  it('provides defaults (page=1, limit=20)', () => {
    const result = employeeQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('coerces string query params to numbers', () => {
    const result = employeeQuerySchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('rejects invalid page number 0', () => {
    const result = employeeQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid page number -1', () => {
    const result = employeeQuerySchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects limit over 100', () => {
    const result = employeeQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts valid page and limit values', () => {
    const result = employeeQuerySchema.parse({ page: 2, limit: 50 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('accepts optional fields', () => {
    const result = employeeQuerySchema.parse({
      page: 1,
      limit: 20,
      search: 'john',
      role: 'Admin',
      institutionId: 'inst-1',
      status: 'active',
    });
    expect(result.search).toBe('john');
    expect(result.role).toBe('Admin');
    expect(result.institutionId).toBe('inst-1');
    expect(result.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// employeeSearchSchema
// ---------------------------------------------------------------------------

describe('employeeSearchSchema', () => {
  it('requires query parameter', () => {
    const result = employeeSearchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty query string', () => {
    const result = employeeSearchSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid search with default limit', () => {
    const result = employeeSearchSchema.parse({ query: 'john' });
    expect(result.query).toBe('john');
    expect(result.limit).toBe(10);
  });

  it('accepts custom limit', () => {
    const result = employeeSearchSchema.parse({ query: 'john', limit: 25 });
    expect(result.limit).toBe(25);
  });

  it('rejects limit over 50', () => {
    const result = employeeSearchSchema.safeParse({ query: 'john', limit: 51 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// notificationCreateSchema
// ---------------------------------------------------------------------------

describe('notificationCreateSchema', () => {
  it('requires userId, title, message', () => {
    const result = notificationCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('requires userId', () => {
    const result = notificationCreateSchema.safeParse({
      title: 'Test',
      message: 'Hello',
    });
    expect(result.success).toBe(false);
  });

  it('requires title', () => {
    const result = notificationCreateSchema.safeParse({
      userId: 'user-1',
      message: 'Hello',
    });
    expect(result.success).toBe(false);
  });

  it('requires message', () => {
    const result = notificationCreateSchema.safeParse({
      userId: 'user-1',
      title: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('defaults type to "info"', () => {
    const result = notificationCreateSchema.parse({
      userId: 'user-1',
      title: 'Test',
      message: 'Hello',
    });
    expect(result.type).toBe('info');
  });

  it('accepts valid type values', () => {
    for (const type of ['info', 'warning', 'success', 'error'] as const) {
      const result = notificationCreateSchema.parse({
        userId: 'user-1',
        title: 'Test',
        message: 'Hello',
        type,
      });
      expect(result.type).toBe(type);
    }
  });

  it('rejects invalid type', () => {
    const result = notificationCreateSchema.safeParse({
      userId: 'user-1',
      title: 'Test',
      message: 'Hello',
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dashboardMetricsSchema
// ---------------------------------------------------------------------------

describe('dashboardMetricsSchema', () => {
  it('accepts empty params', () => {
    const result = dashboardMetricsSchema.parse({});
    expect(result).toEqual({});
  });

  it('accepts valid params', () => {
    const result = dashboardMetricsSchema.parse({
      userRole: 'Admin',
      institutionId: 'inst-1',
    });
    expect(result.userRole).toBe('Admin');
    expect(result.institutionId).toBe('inst-1');
  });

  it('accepts partial params (only userRole)', () => {
    const result = dashboardMetricsSchema.parse({ userRole: 'User' });
    expect(result.userRole).toBe('User');
    expect(result.institutionId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateRequest
// ---------------------------------------------------------------------------

describe('validateRequest', () => {
  it('returns parsed data on valid body', async () => {
    const schema = notificationCreateSchema;
    const body = { userId: 'u1', title: 't', message: 'm' };
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await validateRequest(request, schema, 'body');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('u1');
      expect(result.data.title).toBe('t');
      expect(result.data.message).toBe('m');
      expect(result.data.type).toBe('info');
    }
  });

  it('returns error response on invalid body', async () => {
    const schema = notificationCreateSchema;
    const body = { title: 'missing userId and message' };
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await validateRequest(request, schema, 'body');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.success).toBe(false);
      expect(json.errorCode).toBe('VALIDATION_ERROR');
    }
  });

  it('returns parsed data on valid query params', async () => {
    const schema = employeeQuerySchema;
    const request = new NextRequest('http://localhost/api/test?page=2&limit=50&search=john');

    const result = await validateRequest(request, schema, 'query');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
      expect(result.data.search).toBe('john');
    }
  });

  it('returns error response on invalid query params', async () => {
    const schema = employeeSearchSchema;
    // Missing required 'query' param
    const request = new NextRequest('http://localhost/api/test');

    const result = await validateRequest(request, schema, 'query');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it('returns error response on malformed JSON body', async () => {
    const schema = notificationCreateSchema;
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await validateRequest(request, schema, 'body');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.errorCode).toBe('VALIDATION_ERROR');
    }
  });
});