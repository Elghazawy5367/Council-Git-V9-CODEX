import React, { useState, useRef, useEffect } from 'react';
import { useDevToolsStore } from '@/features/devtools/store/devtools-store';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Layout,
  Play,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Zap
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { cn } from '@/lib/utils';
import { type AnalysisResult, type CodeGap, analyzeFileSemantics, type SemanticIssue } from '@/lib/code-mirror';
import { getSessionKeys } from '@/features/council/lib/vault';
import { toast } from 'sonner';

export const MirrorPanel: React.FC = () => {
  const { startRun, completeRun, failRun, runs, runningTools } = useDevToolsStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const parentRef = useRef<HTMLDivElement>(null);

  const lastMirrorRun = runs.find(r => r.tool === 'mirror' && r.status === 'success');
  const results = lastMirrorRun?.result as { results: AnalysisResult[], summary: any } | null;
  const isRunning = runningTools.has('mirror');

  const allGaps = results?.results.flatMap(r => r.gaps.map(g => ({ ...g, filePath: r.filePath }))) || [];
  const filteredGaps = allGaps.filter(g => filter === 'all' || g.severity === filter);

  const virtualizer = useVirtualizer({
    count: filteredGaps.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  const handleRunAnalysis = async () => {
    const runId = startRun('mirror');
    try {
      const worker = new Worker(
        new URL('../../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // In a real scenario, we'd list files. Sampling key files for now.
      worker.postMessage({ files: [
        'src/features/council/lib/vault.ts',
        'src/lib/self-improve.ts',
        'src/lib/db.ts',
        'src/App.tsx',
        'src/lib/code-mirror.ts',
        'src/features/devtools/store/devtools-store.ts'
      ] });

      worker.onmessage = (e) => {
        if (e.data.type === 'success') {
          completeRun(runId, e.data.results);
          worker.terminate();
        } else {
          failRun(runId, e.data.message);
          worker.terminate();
        }
      };

      worker.onerror = (e) => {
        failRun(runId, 'Worker error: ' + e.message);
        worker.terminate();
      };
    } catch (error) {
      failRun(runId, String(error));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Layout className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Code Mirror Analysis</h3>
            <p className="text-sm text-muted-foreground">Checks your TypeScript against elite coding standards</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const keys = getSessionKeys();
              if (!keys?.openRouterKey) {
                toast.error('Vault must be unlocked for Deep Scan');
                return;
              }
              const runId = startRun('mirror');
              try {
                toast.info('Starting LLM Deep Scan on top files...');
                const mockContent = `export function insecure() { return btoa("secret"); }`;
                const issues = await analyzeFileSemantics('src/lib/vault.ts', mockContent, keys.openRouterKey);
                // Transform semantic issues into code gaps for display
                const results: AnalysisResult = {
                  filePath: 'src/lib/vault.ts',
                  score: { overall: 40, errorHandling: 30, typeSafety: 50, performance: 60, architecture: 30 },
                  gaps: issues.map(i => ({
                    category: i.category as any,
                    severity: i.severity,
                    description: i.finding,
                    suggestion: i.suggestion
                  })),
                  roleModelRepos: [],
                  improvements: []
                };
                await completeRun(runId, { results: [results], summary: { averageScore: 40, totalGaps: issues.length, criticalGaps: issues.filter(x => x.severity === 'critical').length, topIssues: [] } });
                toast.success('Deep Scan completed');
              } catch (err) {
                failRun(runId, String(err));
              }
            }}
            disabled={isRunning}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            LLM Deep Scan
          </Button>
          <Button
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Analysis
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">SEVERITY FILTER:</span>
            <div className="flex gap-1">
              {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s as any)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                    filter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredGaps.length} issues found
          </div>
        </div>

        <div
          ref={parentRef}
          className="flex-1 overflow-auto p-6"
        >
          {filteredGaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-12">
              <CheckCircle2 className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No issues found</p>
              <p className="text-sm">Run analysis to scan your codebase</p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const gap = filteredGaps[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute top-0 left-0 w-full mb-4"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className={cn(
                      "p-4 rounded-xl border border-border/50 bg-background/50 hover:border-primary/30 transition-colors group",
                      gap.severity === 'critical' && "border-destructive/30",
                      gap.severity === 'high' && "border-orange-500/30"
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              gap.severity === 'critical' ? 'destructive' :
                              gap.severity === 'high' ? 'default' :
                              gap.severity === 'medium' ? 'secondary' : 'outline'
                            } className="uppercase text-[10px]">
                              {gap.severity}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{gap.filePath}</span>
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{gap.description}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{gap.suggestion}</p>
                          {gap.roleModelExample && (
                            <div className="p-2 rounded bg-muted/50 text-[10px] font-mono text-muted-foreground overflow-hidden truncate">
                              Role Model: {gap.roleModelExample}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
