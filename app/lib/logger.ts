export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  message: string;
  level: LogLevel;
  context?: Record<string, unknown>;
  timestamp: string;
  error?: Error | unknown;
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown) {
    const entry: LogEntry = {
      message,
      level,
      context,
      timestamp: new Date().toISOString(),
      error,
    };

    // In development, log to console with rich formatting
    if (process.env.NODE_ENV === 'development') {
      const style = {
        info: 'color: #00bfff',
        warn: 'color: #ffa500',
        error: 'color: #ff4500',
      }[level];

      console.groupCollapsed(`%c[${level.toUpperCase()}] ${message}`, style);
      if (context) console.log('Context:', context);
      if (error) console.error('Error:', error);
      console.groupEnd();
    } else {
      // In production, this would send to Sentry/LogRocket
      // e.g. Sentry.captureException(error, { extra: context });
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();
