import React, { useRef } from 'react';
import { useDevToolsStore } from '@/features/devtools/store/devtools-store';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  History
} from 'lucide-react';
import { Badge } from '@/components/primitives/badge';
import { cn } from '@/lib/utils';

export const ActivityLog: React.FC = () => {
  const { runs } = useDevToolsStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: runs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
        <History className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm font-medium">No activity yet</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[400px] overflow-auto rounded-xl border border-border/50 bg-muted/20"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const run = runs[virtualRow.index];
          if (!run) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={cn(
                "absolute top-0 left-0 w-full p-4 flex items-center gap-4 border-b border-border/30 last:border-0",
                run.status === 'running' && "bg-primary/5"
              )}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className={cn(
                "p-2 rounded-full",
                run.status === 'success' && "bg-council-success/10 text-council-success",
                run.status === 'error' && "bg-destructive/10 text-destructive",
                run.status === 'running' && "bg-primary/10 text-primary",
                run.status === 'idle' && "bg-muted text-muted-foreground"
              )}>
                {run.status === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {run.status === 'error' && <AlertCircle className="h-4 w-4" />}
                {run.status === 'running' && <Play className="h-4 w-4 animate-pulse" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider">{run.tool}</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4">
                    {run.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(run.startedAt).toLocaleTimeString()}
                  </span>
                  {run.durationMs && (
                    <span>• {(run.durationMs / 1000).toFixed(1)}s</span>
                  )}
                  {run.error && (
                    <span className="text-destructive truncate max-w-[200px]">
                      • {run.error}
                    </span>
                  )}
                </div>
              </div>

              {run.result && (
                <div className="text-xs font-medium text-muted-foreground">
                  {typeof run.result === 'object' ? 'Details available' : String(run.result)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
