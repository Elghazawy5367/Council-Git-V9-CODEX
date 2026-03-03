import { useEffect, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { db, DevToolsRun } from '../../../lib/db';
import { formatDistanceToNow } from 'date-fns';

export function ActivityLog() {
  const [runs, setRuns] = useState<DevToolsRun[]>([]);
  const [open, setOpen]   = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.devToolsRuns.orderBy('startedAt').reverse().limit(50).toArray()
      .then(setRuns)
      .catch((err) => console.warn('[ActivityLog] Failed to load runs:', err));
  }, []);

  const virtualizer = useVirtualizer({
    count: runs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 3,
  });

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-6 py-2 text-xs text-muted-foreground hover:text-foreground">
        <span>ACTIVITY LOG ({runs.length} runs)</span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div ref={parentRef} className="h-44 overflow-y-auto border-t border-border">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(item => {
              const r = runs[item.index];
              return (
                <div key={item.key}
                  style={{ position: 'absolute', top: item.start, width: '100%' }}
                  className="flex items-center gap-3 px-6 py-2 text-xs border-b border-border/50">
                  <span className={r.status === 'error' ? 'text-red-500' : 'text-green-500'}>●</span>
                  <span className="font-medium capitalize">{r.tool}</span>
                  <span className="text-muted-foreground">{r.summary ?? r.status}</span>
                  {r.durationMs && <span className="text-muted-foreground">{(r.durationMs/1000).toFixed(1)}s</span>}
                  <span className="ml-auto text-muted-foreground">
                    {formatDistanceToNow(r.startedAt, { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
