/**
 * I/O and Network Latency Profiler
 * Measures round-trip time, timeout margins, and external API delays.
 */

export interface LatencyMetrics {
  networkLatencyMs: number;
  target: string;
  timestamp: string;
  success: boolean;
}

const LATENCY_WARN_THRESHOLD_MS = 2500; // Warn if external API request bounds > 2.5s

export async function profileLatency<T>(
  externalTargetName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  let success = true;

  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const end = performance.now();
    const latency = end - start;

    const metrics: LatencyMetrics = {
      networkLatencyMs: Number(latency.toFixed(2)),
      target: externalTargetName,
      success,
      timestamp: new Date().toISOString()
    };

    if (latency > LATENCY_WARN_THRESHOLD_MS || !success || process.env.DEBUG_PROFILING) {
      console.info(`[PROFILE:LATENCY] API Transport <${externalTargetName}>`, metrics);
    }
  }
}
