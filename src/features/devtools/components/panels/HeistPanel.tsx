import { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDevToolsStore } from '../../store/devtools-store';
import { db, HeistPrompt } from '../../../../lib/db';
import { fetchFabricPrompts, savePromptsToDb, categorizePrompts } from '../../lib/heist-browser';
import { useCouncilStore } from '../../../../stores/council.store';
import { toast } from 'sonner';

type Status = 'idle' | 'downloading' | 'categorizing';
type CategoryFilter = HeistPrompt['category'] | 'all';

const CATEGORIES: CategoryFilter[] = ['all', 'reasoning', 'writing', 'analysis', 'coding',
  'research', 'evaluation', 'creativity', 'extraction', 'other'];

export function HeistPanel() {
  const [prompts, setPrompts] = useState<HeistPrompt[]>([]);
  const [selected, setSelected] = useState<HeistPrompt | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const { startRun, completeRun, failRun } = useDevToolsStore();
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.heistPrompts.orderBy('qualityScore').reverse().toArray()
      .then(setPrompts)
      .catch((err) => console.warn('[HeistPanel] Failed to load prompts:', err));
  }, []);

  const filtered = useMemo(() => {
    let result = prompts;
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [prompts, categoryFilter, search]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  async function refreshFromFabric() {
    const runId = await startRun('heist');
    try {
      setStatus('downloading');
      const raw = await fetchFabricPrompts();
      await savePromptsToDb(raw);

      setStatus('categorizing');
      setProgress({ done: 0, total: raw.length });
      const categorized = await categorizePrompts(raw);
      setProgress({ done: categorized.length, total: raw.length });

      const updated = await db.heistPrompts.orderBy('qualityScore').reverse().toArray();
      setPrompts(updated);
      await completeRun(runId, 'heist', `${categorized.length} prompts categorized`);
    } catch (err) {
      await failRun(runId, 'heist', String(err));
    } finally {
      setStatus('idle');
    }
  }

  function injectIntoExpert(content: string) {
    const state = useCouncilStore.getState();
    const experts = state.experts;
    if (!experts[0]) {
      toast.error('No experts configured');
      return;
    }
    state.updateExpert(0, { basePersona: content });
    toast.success(`Prompt injected into ${experts[0].name}`);
  }

  const statusLabel = status === 'downloading' ? '⬇️ Downloading…'
    : status === 'categorizing' ? `🧠 Categorizing (${progress.done}/${progress.total})…`
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">🎭 HEIST Prompts</h2>
          <p className="text-xs text-muted-foreground">
            Curated prompts from fabric · {prompts.length} loaded
          </p>
        </div>
        <button onClick={refreshFromFabric} disabled={status !== 'idle'}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground
            disabled:opacity-50 flex items-center gap-2">
          {statusLabel ?? '🔄 Refresh from fabric'}
        </button>
      </div>

      {/* Search + Category filter */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prompts…"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm
            focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as CategoryFilter)}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs">
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 h-[500px]">
        {/* Left: Prompt list */}
        <div ref={parentRef} className="w-1/2 overflow-y-auto rounded-lg border border-border">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {prompts.length === 0 ? 'No prompts yet — click "Refresh from fabric"' : 'No matches'}
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map(item => {
                const p = filtered[item.index];
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
              <button onClick={() => injectIntoExpert(selected.content)}
                className="px-3 py-1 text-xs rounded-lg border border-primary/30 text-primary
                  hover:bg-primary/10 transition-colors">
                ⬆ Inject into Expert
              </button>
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
