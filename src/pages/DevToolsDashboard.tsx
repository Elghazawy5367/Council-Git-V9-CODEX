import { useEffect } from 'react';
import { useDevToolsStore } from '../features/devtools/store/devtools-store';
import { ToolNavSidebar, TOOLS } from '../features/devtools/components/ToolNavSidebar';
import { MirrorPanel }   from '../features/devtools/components/panels/MirrorPanel';
import { LearnPanel }    from '../features/devtools/components/panels/LearnPanel';
import { TwinPanel }     from '../features/devtools/components/panels/TwinPanel';
import { HeistPanel }    from '../features/devtools/components/panels/HeistPanel';
import { ScoutPanel }    from '../features/devtools/components/panels/ScoutPanel';
import { ActivityLog }   from '../features/devtools/components/ActivityLog';
import { FeatureErrorBoundary } from '../components/ErrorBoundary';

const PANELS = { mirror: MirrorPanel, learn: LearnPanel, twin: TwinPanel,
                 heist: HeistPanel, scout: ScoutPanel } as const;

export default function DevToolsDashboard() {
  const { activeTool, setActiveTool, loadLastRuns } = useDevToolsStore();
  useEffect(() => { loadLastRuns(); }, [loadLastRuns]);
  const ActivePanel = PANELS[activeTool];

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-bold tracking-tight">🛠 Dev Tools</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Meta-features — tools that improve the app itself
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar collapses to horizontal tab bar on mobile */}
        <div className="hidden md:block">
          <ToolNavSidebar />
        </div>
        {/* Mobile: horizontal scrolling tab bar */}
        <div className="md:hidden flex overflow-x-auto border-b border-border px-4 py-2 gap-2 flex-shrink-0">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActiveTool(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors
                ${activeTool === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <FeatureErrorBoundary featureName="Dev Tools">
            <ActivePanel />
          </FeatureErrorBoundary>
        </main>
      </div>

      {/* Activity Log */}
      <div className="border-t border-border">
        <ActivityLog />
      </div>
    </div>
  );
}
