import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// Use pino.transport (worker threads) only in dev — it breaks in Next.js
// production builds because webpack bundles pino into chunks and the worker
// cannot resolve its own module path at runtime.
const destination = isDev
  ? pino.transport({ target: 'pino-pretty' })
  : pino.destination('/var/log/csms/app/app.log');

export const logger = pino(
  {
    level: isTest ? 'silent' : logLevel,
    base: {
      service: 'csms',
      env: process.env.NODE_ENV,
    },
  },
  destination
);

// Child loggers for specific components
export const workerLogger = logger.child({ component: 'worker' });
export const cronLogger = logger.child({ component: 'cron' });
export const authLogger = logger.child({ component: 'auth' });
export const dbLogger = logger.child({ component: 'db' });
export const emailLogger = logger.child({ component: 'email' });
export const fileLogger = logger.child({ component: 'file' });
export const hrimsLogger = logger.child({ component: 'hrims' });
export const sessionLogger = logger.child({ component: 'session' });
export const rateLimitLogger = logger.child({ component: 'rate-limit' });
export const csrfLogger = logger.child({ component: 'csrf' });