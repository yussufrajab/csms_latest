import { startPasswordExpirationCron } from './cron-service';
import { cronLogger } from '@/lib/logger';

// Auto-initialize cron jobs when this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side
  cronLogger.info('Initializing cron jobs');
  startPasswordExpirationCron();
}

export {};
