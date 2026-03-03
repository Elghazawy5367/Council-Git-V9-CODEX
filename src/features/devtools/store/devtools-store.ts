import { create } from 'zustand';
import { db, type DevToolsRun } from '@/lib/db';

export type ToolId = 'mirror' | 'learn' | 'twin' | 'heist' | 'scout';

interface DevToolsState {
  activeTool: ToolId;
  runs: DevToolsRun[];
  runningTools: Set<ToolId>;
  setActiveTool: (id: ToolId) => void;
  startRun: (tool: ToolId) => string;
  completeRun: (id: string, result: unknown) => Promise<void>;
  failRun: (id: string, error: string) => Promise<void>;
  loadRuns: () => Promise<void>;
}

export const useDevToolsStore = create<DevToolsState>((set, get) => ({
  activeTool: 'mirror',
  runs: [],
  runningTools: new Set(),

  setActiveTool: (id) => set({ activeTool: id }),

  startRun: (tool) => {
    const id = Math.random().toString(36).substring(2, 9);
    const run: DevToolsRun = {
      id,
      tool,
      status: 'running',
      startedAt: Date.now(),
    };

    set((state) => ({
      runs: [run, ...state.runs].slice(0, 50),
      runningTools: new Set(state.runningTools).add(tool),
    }));

    db.devToolsRuns.add(run).catch(console.error);
    return id;
  },

  completeRun: async (id, result) => {
    const run = await db.devToolsRuns.get(id);
    if (!run) return;

    const completedRun: DevToolsRun = {
      ...run,
      status: 'success',
      completedAt: Date.now(),
      durationMs: Date.now() - run.startedAt,
      result,
    };

    set((state) => {
      const newRunningTools = new Set(state.runningTools);
      newRunningTools.delete(run.tool as ToolId);
      return {
        runs: state.runs.map((r) => (r.id === id ? completedRun : r)),
        runningTools: newRunningTools,
      };
    });

    await db.devToolsRuns.put(completedRun);
  },

  failRun: async (id, error) => {
    const run = await db.devToolsRuns.get(id);
    if (!run) return;

    const failedRun: DevToolsRun = {
      ...run,
      status: 'error',
      completedAt: Date.now(),
      durationMs: Date.now() - run.startedAt,
      error,
    };

    set((state) => {
      const newRunningTools = new Set(state.runningTools);
      newRunningTools.delete(run.tool as ToolId);
      return {
        runs: state.runs.map((r) => (r.id === id ? failedRun : r)),
        runningTools: newRunningTools,
      };
    });

    await db.devToolsRuns.put(failedRun);
  },

  loadRuns: async () => {
    const runs = await db.devToolsRuns.orderBy('startedAt').reverse().limit(50).toArray();
    set({ runs });
  },
}));
