import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDevToolsStore } from '../../store/devtools-store';
import { db, HeistPrompt } from '../../../../lib/db';
import { fetchFabricPrompts, savePromptsToDb } from '../../lib/heist-browser';

export function HeistPanel() {
  const [prompts, setPrompts] = useState<HeistPrompt[]>([]);
  const [selected, setSelected] = useState<HeistPrompt | null>(null);
  const [isLoading, setLoading] = useState(false);
  const { startRun, completeRun, failRun } = useDevToolsStore();
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.heistPrompts.orderBy('qualityScore').reverse().toArray()
      .then(setPrompts)
      .catch((err) => console.warn('[HeistPanel] Failed to load prompts:', err));
  }, []);

  const virtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  async function refreshFromFabric() {
    setLoading(true);
    const runId = await startRun('heist');
    try {
      const fetched = await fetchFabricPrompts();
      const saved = await savePromptsToDb(fetched);
      await completeRun(runId, 'heist', `${saved} prompts saved`);
      const updated = await db.heistPrompts.orderBy('qualityScore').reverse().toArray();
      setPrompts(updated);
    } catch (err) {
      await failRun(runId, 'heist', String(err));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">🎭 HEIST Prompts</h2>
          <p className="text-xs text-muted-foreground">
            Curated prompts from fabric · {prompts.length} loaded
          </p>
        </div>
        <button onClick={refreshFromFabric} disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground
            disabled:opacity-50 flex items-center gap-2">
          {isLoading ? <><span className="animate-spin">⟳</span> Fetching…</> : '🔄 Refresh from fabric'}
        </button>
      </div>

      <div className="flex gap-4 h-[500px]">
        {/* Left: Prompt list */}
        <div ref={parentRef} className="w-1/2 overflow-y-auto rounded-lg border border-border">
          {prompts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No prompts yet — click &quot;Refresh from fabric&quot;
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map(item => {
                const p = prompts[item.index];
                const isSelected = selected?.slug === p.slug;
                return (
                  <div key={item.key}
                    style={{ position: 'absolute', top: item.start, width: '100%' }}
                    className={`px-3 py-2.5 border-b border-border cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent/30'}`}
                    onClick={() => setSelected(p)}>
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.category} · {p.wordCount} words · score: {p.qualityScore}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 rounded-lg border border-border overflow-y-auto p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{selected.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {selected.category}
                </span>
              </div>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-mono leading-relaxed">
                {selected.content}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a prompt to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
