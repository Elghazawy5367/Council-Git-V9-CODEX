import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDevToolsStore } from '../../store/devtools-store';
import { runSemanticAnalysis, SemanticIssue } from '../../../../lib/code-mirror';
import { GITHUB_OWNER, GITHUB_REPO } from '../../../../lib/config';
import { CacheBanner, CACHE_TTLS } from '../CacheBanner';

interface MirrorFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  message: string;
  source?: 'static' | 'llm';
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
  const [isLLMRunning, setLLMRunning] = useState(false);
  const [runCost, setRunCost]   = useState(0);
  const { startRun, completeRun, failRun, lastRuns } = useDevToolsStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const lastRun = lastRuns['mirror'];
  const cachedAt = lastRun?.status === 'success' ? lastRun.startedAt : null;

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
          const staticFindings = (e.data.results as MirrorFinding[]).map(f => ({ ...f, source: 'static' as const }));
          setFindings(staticFindings);
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

  async function runLLMDeepScan() {
    setLLMRunning(true);
    setRunCost(0);
    const runId = await startRun('mirror');
    try {
      // Fetch a few key source files from GitHub for semantic analysis
      const filePaths = [
        'src/features/council/api/ai-client.ts',
        'src/stores/council.store.ts',
        'src/lib/db.ts',
        'src/features/settings/store/settings-store.ts',
        'src/lib/synthesis-engine.ts',
      ];
      const files = await Promise.all(
        filePaths.map(async p => {
          const res = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${p}`
          );
          return { path: p, content: res.ok ? await res.text() : '', regexFindingCount: 1 };
        })
      );
      const issues: SemanticIssue[] = await runSemanticAnalysis(files.filter(f => f.content));
      const llmFindings: MirrorFinding[] = issues.map(i => ({
        severity: i.severity,
        file: i.file,
        message: `${i.finding} — ${i.suggestion}`,
        source: 'llm' as const,
      }));
      setFindings(prev => [...prev, ...llmFindings]);
      await completeRun(runId, 'mirror', `${issues.length} LLM issues found`);
    } catch (err) {
      await failRun(runId, 'mirror', String(err));
    } finally {
      setLLMRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">🪞 Code Mirror</h2>
          <p className="text-xs text-muted-foreground">Static + semantic analysis against elite standards</p>
        </div>
        <div className="flex gap-2 items-center">
          {(isRunning || isLLMRunning) && runCost > 0 && (
            <span className="text-xs text-muted-foreground font-mono">${runCost.toFixed(4)} spent</span>
          )}
          <button onClick={runMirror} disabled={isRunning}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground
              disabled:opacity-50 flex items-center gap-2">
            {isRunning ? <><span className="animate-spin">⟳</span> Scanning…</> : '▶ Run Analysis'}
          </button>
          <button onClick={runLLMDeepScan} disabled={isLLMRunning}
            className="px-4 py-2 text-sm rounded-lg border border-primary/30 text-primary
              disabled:opacity-50 flex items-center gap-2 hover:bg-primary/10 transition-colors">
            {isLLMRunning ? <><span className="animate-spin">⟳</span> Scanning…</> : '🧠 LLM Deep Scan'}
          </button>
        </div>
      </div>

      <CacheBanner cachedAt={cachedAt} ttlMs={CACHE_TTLS.mirror} onRunFresh={runMirror} />

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
            {isRunning || isLLMRunning ? 'Analyzing…' : findings.length === 0 ? 'Run analysis to see results' : 'No issues at this severity'}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{f.file}</span>
                        {f.source === 'llm' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">LLM</span>
                        )}
                      </div>
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
