import { create } from 'zustand';
import { db, DevToolsRun } from '../../../lib/db';

type ToolId = 'mirror' | 'learn' | 'twin' | 'heist' | 'scout';

interface DevToolsState {
  activeTool: ToolId;
  runningTools: Set<ToolId>;
  lastRuns: Record<ToolId, DevToolsRun | null>;
  setActiveTool: (id: ToolId) => void;
  startRun: (tool: ToolId) => Promise<number>;
  completeRun: (id: number, tool: ToolId, summary: string) => Promise<void>;
  failRun: (id: number, tool: ToolId, error: string) => Promise<void>;
  loadLastRuns: () => Promise<void>;
}

export const useDevToolsStore = create<DevToolsState>((set) => ({
  activeTool: 'mirror',
  runningTools: new Set(),
  lastRuns: { mirror: null, learn: null, twin: null, heist: null, scout: null },

  setActiveTool: (id) => set({ activeTool: id }),

  startRun: async (tool) => {
    set(s => ({ runningTools: new Set(s.runningTools).add(tool) }));
    const id = await db.devToolsRuns.add({ tool, status: 'running', startedAt: Date.now() });
    return id as number;
  },

  completeRun: async (id, tool, summary) => {
    const completedAt = Date.now();
    const existing = await db.devToolsRuns.get(id);
    await db.devToolsRuns.update(id, {
      status: 'success', completedAt, summary,
      durationMs: completedAt - (existing?.startedAt ?? completedAt)
    });
    const run = await db.devToolsRuns.get(id);
    set(s => {
      const r = new Set(s.runningTools); r.delete(tool);
      return { runningTools: r, lastRuns: { ...s.lastRuns, [tool]: run ?? null } };
    });
  },

  failRun: async (id, tool, error) => {
    await db.devToolsRuns.update(id, { status: 'error', completedAt: Date.now(), error });
    set(s => { const r = new Set(s.runningTools); r.delete(tool); return { runningTools: r }; });
  },

  loadLastRuns: async () => {
    const tools: ToolId[] = ['mirror', 'learn', 'twin', 'heist', 'scout'];
    const lastRuns: Record<ToolId, DevToolsRun | null> = {
      mirror: null, learn: null, twin: null, heist: null, scout: null
    };
    for (const tool of tools) {
      const runs = await db.devToolsRuns.where('tool').equals(tool)
        .reverse().sortBy('startedAt');
      lastRuns[tool] = runs[0] ?? null;
    }
    set({ lastRuns });
  },
}));
