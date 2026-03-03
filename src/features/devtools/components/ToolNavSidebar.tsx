import { Wrench, BookOpen, Users, Swords, Telescope } from 'lucide-react';
import { useDevToolsStore } from '../store/devtools-store';
import { formatDistanceToNow } from 'date-fns';

export const TOOLS = [
  { id: 'mirror' as const, label: 'Mirror',  icon: Wrench,    emoji: '🪞' },
  { id: 'learn'  as const, label: 'Learn',   icon: BookOpen,  emoji: '📚' },
  { id: 'twin'   as const, label: 'Twin',    icon: Users,     emoji: '👯' },
  { id: 'heist'  as const, label: 'HEIST',   icon: Swords,    emoji: '🎭' },
  { id: 'scout'  as const, label: 'Scout',   icon: Telescope, emoji: '🔭' },
];

export function ToolNavSidebar() {
  const { activeTool, setActiveTool, runningTools, lastRuns } = useDevToolsStore();

  return (
    <nav className="w-52 flex-shrink-0 border-r border-border p-3 space-y-1">
      {TOOLS.map(t => {
        const isActive  = activeTool === t.id;
        const isRunning = runningTools.has(t.id);
        const last      = lastRuns[t.id];

        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`w-full flex flex-col items-start px-3 py-2.5 rounded-lg text-left
              transition-colors text-sm
              ${isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2 w-full">
              <span>{t.emoji}</span>
              <span className="font-medium">{t.label}</span>
              {isRunning && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            {last && !isRunning && (
              <span className="text-[10px] text-muted-foreground mt-0.5 pl-6">
                {last.status === 'error' ? '❌' : '●'}{' '}
                {last.summary ?? last.status} ·{' '}
                {formatDistanceToNow(last.startedAt, { addSuffix: true })}
              </span>
            )}
            {!last && !isRunning && (
              <span className="text-[10px] text-muted-foreground mt-0.5 pl-6">Not run yet</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
