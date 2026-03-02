import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDevToolsStore } from '../../store/devtools-store';

interface MirrorFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  message: string;
}

type Severity = 'all' | 'critical' | 'high' | 'medium' | 'low';
const SEVERITY_COLORS = {
  critical: 'text-red-500', high: 'text-orange-400',
  medium: 'text-yellow-400', low: 'text-muted-foreground'
};

export function MirrorPanel() {
  const [filter, setFilter]   = useState<Severity>('all');
  const [findings, setFindings] = useState<MirrorFinding[]>([]);
  const [isRunning, setRunning] = useState(false);
  const { startRun, completeRun, failRun } = useDevToolsStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = filter === 'all' ? findings : findings.filter(f => f.severity === filter);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  async function runMirror() {
    setRunning(true);
    const runId = await startRun('mirror');
    let worker: Worker | null = null;
    try {
      worker = new Worker(
        new URL('../../workers/analysis.worker.ts', import.meta.url), { type: 'module' }
      );
      worker.onmessage = async (e) => {
        if (e.data.type === 'success') {
          setFindings(e.data.results);
          await completeRun(runId, 'mirror', `${e.data.results.length} issues found`);
        } else {
          await failRun(runId, 'mirror', e.data.message);
        }
        setRunning(false);
        worker?.terminate();
      };
      worker.onerror = async (err) => {
        await failRun(runId, 'mirror', String(err.message));
        setRunning(false);
        worker?.terminate();
      };
      worker.postMessage({ files: [] });
    } catch (err) {
      await failRun(runId, 'mirror', String(err));
      setRunning(false);
      worker?.terminate();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">🪞 Code Mirror</h2>
          <p className="text-xs text-muted-foreground">Static + semantic analysis against elite standards</p>
        </div>
        <button onClick={runMirror} disabled={isRunning}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground
            disabled:opacity-50 flex items-center gap-2">
          {isRunning ? <><span className="animate-spin">⟳</span> Scanning…</> : '▶ Run Analysis'}
        </button>
      </div>

      {/* Severity filter */}
      <div className="flex gap-2">
        {(['all','critical','high','medium','low'] as Severity[]).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors
              ${filter === s ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {s === 'all' ? `All (${findings.length})` : s}
          </button>
        ))}
      </div>

      {/* Virtualized results */}
      <div ref={parentRef} className="h-[500px] overflow-y-auto rounded-lg border border-border">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {isRunning ? 'Analyzing…' : findings.length === 0 ? 'Run analysis to see results' : 'No issues at this severity'}
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(item => {
              const f = filtered[item.index];
              return (
                <div key={item.key}
                  style={{ position: 'absolute', top: item.start, width: '100%' }}
                  className="px-4 py-3 border-b border-border hover:bg-accent/30">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold uppercase mt-0.5 w-14 flex-shrink-0
                      ${SEVERITY_COLORS[f.severity as keyof typeof SEVERITY_COLORS]}`}>
                      {f.severity}
                    </span>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{f.file}</div>
                      <div className="text-sm mt-0.5">{f.message}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
