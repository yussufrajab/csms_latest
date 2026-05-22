/**
 * Unit tests for src/lib/rate-limiter.ts
 *
 * Tests getRateLimitConfig() for each rate-limit tier.
 */

import { describe, it, expect } from 'vitest';
import { getRateLimitConfig, RATE_LIMITS, RateLimitTier } from './rate-limiter';

// ---------------------------------------------------------------------------
// getRateLimitConfig
// ---------------------------------------------------------------------------

describe('getRateLimitConfig', () => {
  const tiers: RateLimitTier[] = ['auth', 'write', 'read', 'upload'];

  it.each(tiers)('returns correct config for tier "%s"', (tier) => {
    const config = getRateLimitConfig(tier);
    const expected = RATE_LIMITS[tier];

    expect(config.limit).toBe(expected.limit);
    expect(config.windowSeconds).toBe(expected.windowSeconds);
  });

  it('auth tier: limit 5, windowSeconds 60', () => {
    const config = getRateLimitConfig('auth');
    expect(config).toEqual({ limit: 5, windowSeconds: 60 });
  });

  it('write tier: limit 30, windowSeconds 60', () => {
    const config = getRateLimitConfig('write');
    expect(config).toEqual({ limit: 30, windowSeconds: 60 });
  });

  it('read tier: limit 100, windowSeconds 60', () => {
    const config = getRateLimitConfig('read');
    expect(config).toEqual({ limit: 100, windowSeconds: 60 });
  });

  it('upload tier: limit 10, windowSeconds 60', () => {
    const config = getRateLimitConfig('upload');
    expect(config).toEqual({ limit: 10, windowSeconds: 60 });
  });
});