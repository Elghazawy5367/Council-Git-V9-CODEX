import fs from 'fs/promises';
import path from 'path';

/**
 * Parses raw system logs for custom [PROFILE:XXX] markers
 * and identifies critical thresholds breached.
 */
async function analyzeBottlenecks(logFilePath: string) {
  try {
    const logData = await fs.readFile(logFilePath, 'utf8');
    const lines = logData.split('\n');

    const bottlenecks = {
      cpu: [] as any[],
      memory: [] as any[],
      latency: [] as any[]
    };

    const RE_PROFILE = /\[PROFILE:(PERF|MEMORY|LATENCY)(?::ERROR)?\].*?<([^>]+)>(.*)/;

    // Phase 1 & 2: Parse and Match Rules
    for (const [index, line] of lines.entries()) {
      const match = line.match(RE_PROFILE);
      if (!match) continue;

      const type = match[1];
      const target = match[2];
      try {
        const payloadStr = match[3].trim().replace(/^,\s*/, '');
        const payload = JSON.parse(payloadStr);

        // Detect Repeated Ops / Slow Functions / Spikes
        if (type === 'PERF' && payload.cpuThresholdExceeded) {
          bottlenecks.cpu.push({ target, durationMs: payload.durationMs, line: index + 1 });
        }
        if (type === 'MEMORY' && payload.leakWarning) {
          bottlenecks.memory.push({ target, allocationSpikeMB: payload.allocationSpikeMB, line: index + 1 });
        }
        if (type === 'LATENCY' && (payload.networkLatencyMs > 2500 || !payload.success)) {
          bottlenecks.latency.push({ target, durationMs: payload.networkLatencyMs, success: payload.success, line: index + 1 });
        }
      } catch (e) {
        // Fallback for non-JSON suffix logging
      }
    }

    // Rank Priorities (Desc by severity)
    bottlenecks.cpu.sort((a, b) => b.durationMs - a.durationMs);
    bottlenecks.memory.sort((a, b) => b.allocationSpikeMB - a.allocationSpikeMB);
    bottlenecks.latency.sort((a, b) => b.durationMs - a.durationMs);

    console.info('🔥 BOTTLENECK ANALYSIS COMPLETE 🔥');
    console.table(bottlenecks.cpu);
    console.table(bottlenecks.memory);
    console.table(bottlenecks.latency);

    return bottlenecks;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.warn(`[SKIP] No log file found at ${logFilePath}. Run system first with tracing enabled.`);
      return;
    }
    console.error('Failed to parse logs', err);
  }
}

// Execute if run natively
if (require.main === module) {
  const targetLog = process.argv[2] || path.join(process.cwd(), 'system.log');
  analyzeBottlenecks(targetLog);
}
