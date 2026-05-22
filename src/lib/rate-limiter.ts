import Redis from 'ioredis';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RateLimitTier = 'auth' | 'write' | 'read' | 'upload';

// ---------------------------------------------------------------------------
// Rate-limit configuration per tier
// ---------------------------------------------------------------------------

export const RATE_LIMITS: Record<RateLimitTier, { limit: number; windowSeconds: number }> = {
  auth: { limit: 5, windowSeconds: 60 },
  write: { limit: 30, windowSeconds: 60 },
  read: { limit: 100, windowSeconds: 60 },
  upload: { limit: 10, windowSeconds: 60 },
};

// ---------------------------------------------------------------------------
// Lazy Redis client singleton
// ---------------------------------------------------------------------------

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // no retries – fail fast
      lazyConnect: true,
      connectTimeout: 2000,
    });

    redisClient.on('error', (err) => {
      console.warn('[rate-limiter] Redis error:', err.message || err);
    });
  } catch (err) {
    console.warn('[rate-limiter] Failed to create Redis client:', err);
    redisClient = null;
  }

  return redisClient;
}

// ---------------------------------------------------------------------------
// Client IP extraction
// ---------------------------------------------------------------------------

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; use the first entry
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Core rate-limit check
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  limit?: number;
  remaining?: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  key: string,
  tier: RateLimitTier
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[tier];
  const client = getRedisClient();

  // Fail open if Redis is unavailable
  if (!client) {
    console.warn('[rate-limiter] Redis client unavailable – allowing request (fail-open)');
    return { allowed: true };
  }

  try {
    const count = await client.incr(key);

    if (count === 1) {
      // First request in this window – set expiry
      await client.expire(key, config.windowSeconds);
    }

    const ttl = await client.ttl(key);
    const remaining = Math.max(0, config.limit - count);

    if (count > config.limit) {
      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        retryAfter: ttl > 0 ? ttl : config.windowSeconds,
      };
    }

    return {
      allowed: true,
      limit: config.limit,
      remaining,
      retryAfter: ttl > 0 ? ttl : config.windowSeconds,
    };
  } catch (err) {
    // Fail open on Redis errors
    console.warn('[rate-limiter] Redis error during rate-limit check:', err);
    return { allowed: true };
  }
}

// ---------------------------------------------------------------------------
// Higher-order function for API route handlers
// ---------------------------------------------------------------------------

type Handler = (req: Request) => Promise<NextResponse>;

export function withRateLimit(handler: Handler, tier: RateLimitTier): Handler {
  return async (req: Request): Promise<NextResponse> => {
    const ip = getClientIp(req);
    const key = `ratelimit:${ip}:${tier}`;
    const result = await checkRateLimit(key, tier);
    const config = RATE_LIMITS[tier];

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(
              Math.floor(Date.now() / 1000) + (result.retryAfter ?? config.windowSeconds)
            ),
          },
        }
      );
    }

    // Allowed – call the wrapped handler
    const response = await handler(req);

    // Attach rate-limit headers to the successful response
    response.headers.set('X-RateLimit-Limit', String(config.limit));
    response.headers.set(
      'X-RateLimit-Remaining',
      String(result.remaining ?? config.limit)
    );
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.floor(Date.now() / 1000) + (result.retryAfter ?? config.windowSeconds))
    );

    return response;
  };
}

// ---------------------------------------------------------------------------
// Utility: get config for a tier
// ---------------------------------------------------------------------------

export function getRateLimitConfig(tier: RateLimitTier): { limit: number; windowSeconds: number } {
  return RATE_LIMITS[tier];
}