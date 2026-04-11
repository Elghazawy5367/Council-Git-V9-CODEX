import { logger } from './logger';

/**
 * High-performance trace wrapper using native `performance.now()`.
 * Allows measuring critical flows without blocking the event loop or causing massive object alloc overhead.
 * 
 * @param name The name of the trace span (e.g. 'GitHubTrendingFetch')
 * @param fn The asynchronous function to trace
 */
export async function withTrace<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  try {
    const result = await fn();
    const t1 = performance.now();
    
    // Only log traces that exceed an unexpected threshold to prevent log spam,
    // or log everything in development.
    const duration = t1 - t0;
    if (process.env.NODE_ENV !== 'production' || duration > 1000) {
      logger.info(`Trace [${name}] completed`, { durationMs: Math.round(duration) });
    }
    
    return result;
  } catch (error: any) {
    const t1 = performance.now();
    logger.error(`Trace [${name}] failed`, error, { durationMs: Math.round(t1 - t0) });
    throw error;
  }
}
