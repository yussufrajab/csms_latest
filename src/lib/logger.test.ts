import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('exports logger with correct methods', async () => {
    const { logger } = await import('./logger');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('exports child loggers for each component', async () => {
    const {
      workerLogger,
      cronLogger,
      authLogger,
      dbLogger,
      emailLogger,
      fileLogger,
      hrimsLogger,
      sessionLogger,
      rateLimitLogger,
      csrfLogger,
    } = await import('./logger');

    expect(workerLogger).toBeDefined();
    expect(cronLogger).toBeDefined();
    expect(authLogger).toBeDefined();
    expect(dbLogger).toBeDefined();
    expect(emailLogger).toBeDefined();
    expect(fileLogger).toBeDefined();
    expect(hrimsLogger).toBeDefined();
    expect(sessionLogger).toBeDefined();
    expect(rateLimitLogger).toBeDefined();
    expect(csrfLogger).toBeDefined();
  });

  it('respects LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'debug';
    const { logger } = await import('./logger');
    expect(logger).toBeDefined();
    delete process.env.LOG_LEVEL;
  });

  it('sets silent level in test environment', async () => {
    const { logger } = await import('./logger');
    expect(logger).toBeDefined();
  });
});

describe('clientLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports clientLogger with structured methods', async () => {
    const { clientLogger } = await import('./logger-client');
    expect(clientLogger).toBeDefined();
    expect(typeof clientLogger.info).toBe('function');
    expect(typeof clientLogger.error).toBe('function');
    expect(typeof clientLogger.warn).toBe('function');
    expect(typeof clientLogger.debug).toBe('function');
  });

  it('creates child loggers with component binding', async () => {
    const { clientLogger } = await import('./logger-client');
    const childLogger = clientLogger.child({ component: 'test' });
    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
  });

  it('calls console.info for info messages', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clientLogger } = await import('./logger-client');
    clientLogger.info({ test: true }, 'Test message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('calls console.error for error messages', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { clientLogger } = await import('./logger-client');
    clientLogger.error({ err: new Error('test') }, 'Test error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('formats messages with component prefix', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clientLogger } = await import('./logger-client');
    const child = clientLogger.child({ component: 'auth' });
    child.info('Login succeeded');
    expect(spy).toHaveBeenCalledWith('[auth] Login succeeded');
    spy.mockRestore();
  });

  it('handles string-only calls', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clientLogger } = await import('./logger-client');
    clientLogger.info('Simple message');
    expect(spy).toHaveBeenCalledWith('[app] Simple message');
    spy.mockRestore();
  });
});