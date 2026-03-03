import React from 'react';
import { useDevToolsStore, type ToolId } from '@/features/devtools/store/devtools-store';
import {
  Layout,
  BookOpen,
  Users,
  VenetianMask,
  Telescope,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToolNavSidebar: React.FC = () => {
  const { activeTool, setActiveTool, runningTools, runs } = useDevToolsStore();

  const tools = [
    { id: 'mirror' as ToolId, label: 'Mirror', icon: Layout, desc: 'Code Quality' },
    { id: 'learn' as ToolId, label: 'Learn', icon: BookOpen, desc: 'Pattern Mining' },
    { id: 'twin' as ToolId, label: 'Twin', icon: Users, desc: 'DNA Analysis' },
    { id: 'heist' as ToolId, label: 'HEIST', icon: VenetianMask, desc: 'Prompt Library' },
    { id: 'scout' as ToolId, label: 'Scout', icon: Telescope, desc: 'Opportunities' },
  ];

  const getToolStatus = (id: ToolId) => {
    if (runningTools.has(id)) return 'running';
    const lastRun = runs.find(r => r.tool === id);
    if (!lastRun) return { status: 'idle' };
    return { status: lastRun.status, lastRunAt: lastRun.startedAt, result: lastRun.result };
  };

  return (
    <nav className="space-y-2">
      {tools.map((tool) => {
        const info = getToolStatus(tool.id);
        const isActive = activeTool === tool.id;
        const Icon = tool.icon;

        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-left",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isActive ? "bg-primary-foreground/10" : "bg-muted group-hover:bg-background"
            )}>
              {info.status === 'running' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold truncate">{tool.label}</div>
                {info.status === 'success' && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full bg-council-success",
                    isActive ? "bg-primary-foreground" : "bg-council-success"
                  )} />
                )}
              </div>
              <div className={cn(
                "text-[10px] truncate opacity-70 flex items-center gap-1",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                {info.status === 'running' ? 'Running...' : (
                  <>
                    {tool.desc}
                    {info.lastRunAt && (
                      <span className="opacity-50">• {new Date(info.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
          </button>
        );
      })}
    </nav>
  );
};
