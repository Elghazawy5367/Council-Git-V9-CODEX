/**
 * Memory Allocation and Heap Profiler
 * Detects massive allocations inside data processing pipelines (e.g. AST generation, massive JSON parsing)
 */

export interface MemoryMetrics {
  heapUsedStartMB: number;
  heapUsedEndMB: number;
  allocationSpikeMB: number;
  leakWarning: boolean;
}

const MEMORY_SPIKE_WARN_MB = 150; // Warn if a single operation allocates > 150MB

export async function profileMemory<T>(
  pipelineName: string,
  targetFn: () => Promise<T> | T
): Promise<T> {
  // Only supported in Node.js
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return targetFn();
  }

  const startMem = process.memoryUsage().heapUsed;
  
  try {
    const result = await targetFn();
    
    // Explicitly yield to event loop to let GC run if possible to get accurate end memory
    await new Promise(resolve => setTimeout(resolve, 0));
    const endMem = process.memoryUsage().heapUsed;

    const allocatedHeap = endMem - startMem;
    const allocatedMB = allocatedHeap / 1024 / 1024;

    const metrics: MemoryMetrics = {
      heapUsedStartMB: Number((startMem / 1024 / 1024).toFixed(2)),
      heapUsedEndMB: Number((endMem / 1024 / 1024).toFixed(2)),
      allocationSpikeMB: Number(allocatedMB.toFixed(2)),
      leakWarning: allocatedMB > MEMORY_SPIKE_WARN_MB
    };

    if (metrics.leakWarning || process.env.DEBUG_PROFILING) {
      console.warn(`[PROFILE:MEMORY] Heavy Allocation <${pipelineName}>`, metrics);
    }

    return result;
  } catch (error) {
    throw error;
  }
}
