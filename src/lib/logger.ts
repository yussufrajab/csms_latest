import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

const transport = isDev
  ? pino.transport({ target: 'pino-pretty' })
  : pino.transport({
      targets: [
        {
          target: 'pino/file',
          options: { destination: '/var/log/csms/app/app.log', mkdir: true },
        },
        {
          target: 'pino/file',
          level: 'error',
          options: { destination: '/var/log/csms/app/error.log', mkdir: true },
        },
      ],
    });

export const logger = pino(
  {
    level: isTest ? 'silent' : logLevel,
    base: {
      service: 'csms',
      env: process.env.NODE_ENV,
    },
  },
  transport
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