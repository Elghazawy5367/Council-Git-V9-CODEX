import React, { useEffect } from 'react';
import { useDevToolsStore, type ToolId } from '@/features/devtools/store/devtools-store';
import {
  Wrench,
  Layout,
  BookOpen,
  Users,
  VenetianMask,
  Telescope,
  Play,
  Activity,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Separator } from '@/components/primitives/separator';
import { cn } from '@/lib/utils';
import { ToolNavSidebar } from '@/features/devtools/components/ToolNavSidebar';
import { ActivityLog } from '@/features/devtools/components/ActivityLog';
import { MirrorPanel } from '@/features/devtools/components/panels/MirrorPanel';
import { LearnPanel } from '@/features/devtools/components/panels/LearnPanel';
import { TwinPanel } from '@/features/devtools/components/panels/TwinPanel';
import { HeistPanel } from '@/features/devtools/components/panels/HeistPanel';
import { ScoutPanel } from '@/features/devtools/components/panels/ScoutPanel';

const DevToolsDashboard: React.FC = () => {
  const { activeTool, runs, loadRuns, runningTools } = useDevToolsStore();

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const renderActivePanel = () => {
    switch (activeTool) {
      case 'mirror': return <MirrorPanel />;
      case 'learn': return <LearnPanel />;
      case 'twin': return <TwinPanel />;
      case 'heist': return <HeistPanel />;
      case 'scout': return <ScoutPanel />;
      default: return <MirrorPanel />;
    }
  };

  const lastRun = runs[0];
  const isRunning = runningTools.size > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Dev Tools</h1>
              <p className="text-xs text-muted-foreground">Unified Meta-Feature Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastRun && (
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Last Run: {new Date(lastRun.startedAt).toLocaleTimeString()}</span>
              </div>
            )}
            <Button size="sm" className="gap-2" disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run All
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <ToolNavSidebar />
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8 min-w-0">
          <section className="glass-panel border border-border/50 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
            {renderActivePanel()}
          </section>

          {/* Activity Log */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Activity Log</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">Clear</Button>
            </div>
            <ActivityLog />
          </section>
        </div>
      </main>
    </div>
  );
};

export default DevToolsDashboard;
