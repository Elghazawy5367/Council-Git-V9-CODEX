/**
 * CPU and High-Resolution Execution Timer
 * Tracks raw synchronous or asynchronous blocking execution time.
 */

export interface PerformanceMetrics {
  durationMs: number;
  cpuThresholdExceeded: boolean;
  timestamp: string;
}

const CPU_WARN_THRESHOLD_MS = 500; // Emit warning if synchronous or tight loop exceeds 500ms

export async function profilePerformance<T>(
  zoneName: string,
  targetFn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await targetFn();
    const end = performance.now();
    const duration = end - start;

    const metrics: PerformanceMetrics = {
      durationMs: Number(duration.toFixed(2)),
      cpuThresholdExceeded: duration > CPU_WARN_THRESHOLD_MS,
      timestamp: new Date().toISOString()
    };

    if (metrics.cpuThresholdExceeded || process.env.DEBUG_PROFILING) {
      console.warn(`[PROFILE:PERF] System Hot Path <${zoneName}>`, metrics);
    }

    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[PROFILE:PERF:ERROR] Zone <${zoneName}> failed after ${(end - start).toFixed(2)}ms`);
    throw error;
  }
}
