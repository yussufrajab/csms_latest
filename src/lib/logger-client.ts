/**
 * Client-safe logger for browser components.
 *
 * Provides the same structured logging API as the server logger,
 * but delegates to browser console methods. Safe to import in
 * client components ('use client').
 *
 * For server-side code (API routes, lib/), import from '@/lib/logger' instead.
 */

type LogData = Record<string, unknown>;

const formatMessage = (component: string, msg: string) =>
  `[${component}] ${msg}`;

class ClientLogger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  child(bindings: { component: string }) {
    return new ClientLogger(bindings.component);
  }

  debug(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.debug(formatMessage(this.component, data));
    } else {
      console.debug(formatMessage(this.component, msg || ''), data);
    }
  }

  info(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.info(formatMessage(this.component, data));
    } else {
      console.info(formatMessage(this.component, msg || ''), data);
    }
  }

  warn(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.warn(formatMessage(this.component, data));
    } else {
      console.warn(formatMessage(this.component, msg || ''), data);
    }
  }

  error(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.error(formatMessage(this.component, data));
    } else {
      console.error(formatMessage(this.component, msg || ''), data);
    }
  }
}

export const clientLogger = new ClientLogger('app');

export default ClientLogger;