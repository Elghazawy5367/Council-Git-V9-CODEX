export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogContext {
  [key: string]: any;
}

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Lightweight, zero-dependency Logger designed for minimal performance overhead.
 * Wraps console API logically and formats messages for eventual structured log ingestion.
 */
class SystemLogger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] ${message}`;
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    return formatted;
  }

  public info(message: string, context?: LogContext): void {
    if (!IS_PROD) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    const errContext = error ? { ...context, stack: error.stack } : context;
    console.error(this.formatMessage('ERROR', message, errContext));
  }

  public critical(message: string, error?: Error, context?: LogContext): void {
    // CRITICAL inherently alerts beyond normal error paths (could hook into Sentry/Datadog here natively)
    const errContext = error ? { ...context, stack: error.stack } : context;
    console.error(this.formatMessage('CRITICAL', `🔥 ${message}`, errContext));
  }
}

export const logger = new SystemLogger();
