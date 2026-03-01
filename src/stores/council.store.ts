/**
 * Unified Council Store
 * Combines expert, execution, control-panel, and memory stores
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { Expert, ExecutionMode, SynthesisResult, SynthesisConfig, KnowledgeFile } from '@/features/council/lib/types';
import { DEFAULT_EXPERTS } from '@/lib/config';
import { loadPersonaIntoExpert, loadTeam as loadTeamFromLibrary } from '@/features/council/lib/persona-library';
import { UseMutationResult } from '@tanstack/react-query';
import * as councilService from '@/services/council.service';

interface FileData {
  name: string;
  content: string;
  size: string;
}

interface CouncilState {
  // Expert Management
  experts: Expert[];
  setExperts: (experts: Expert[]) => void;
  updateExpert: (index: number, expert: Partial<Expert>) => void;
  addKnowledge: (expertIndex: number, files: KnowledgeFile[]) => void;
  removeKnowledge: (expertIndex: number, fileId: string) => void;

  // Execution State - Two Phase Architecture
  executionPhase: 'idle' | 'phase1-experts' | 'phase1-complete' | 'phase2-synthesis' | 'complete';
  isLoading: boolean;
  isSynthesizing: boolean;
  statusMessage: string;
  cost: councilService.CostBreakdown;
  outputs: Record<string, string>;
  synthesisResult: SynthesisResult | null;
  verdict: string;
  status: string;
  
  // Two-phase execution methods
  executePhase1: () => Promise<void>; // Run all experts in parallel
  executePhase2: (synthesisMutation: UseMutationResult<SynthesisResult, Error, { expertOutputs: councilService.ExpertOutput[]; task: string; config: SynthesisConfig; apiKey: string; onProgress: (message: string) => void; }, unknown>) => Promise<void>; // Run synthesis with judge mode
  executeCouncil: (synthesisMutation: UseMutationResult<SynthesisResult, Error, { expertOutputs: councilService.ExpertOutput[]; task: string; config: SynthesisConfig; apiKey: string; onProgress: (message: string) => void; }, unknown>) => Promise<void>; // Legacy - full execution
  reset: () => void;

  // Control Panel State
  task: string;
  setTask: (task: string) => void;
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  judgeMode: 'ruthless-judge' | 'consensus-judge' | 'debate-judge' | 'pipeline-judge'; // Phase 2 judge mode selection
  setJudgeMode: (mode: 'ruthless-judge' | 'consensus-judge' | 'debate-judge' | 'pipeline-judge') => void;
  activeExpertCount: number;
  setActiveExpertCount: (count: number) => void;
  debateRounds: number;
  setDebateRounds: (rounds: number) => void;
  fileData: FileData[];
  setFileData: (fileData: FileData[]) => void;
  addFileData: (file: FileData) => void;
  removeFileData: (index: number) => void;
  loadPersona: (expertIndex: number, personaId: string) => void;
  loadTeam: (teamId: string) => void;
  clearPersona: (expertIndex: number) => void;
  resetToDefault: () => void;
}

export const useCouncilStore = create<CouncilState>((set, get) => ({
  // Expert Management
  experts: [],
  setExperts: (experts) => set({ experts }),
  updateExpert: (index, expertUpdates) =>
    set((state) => ({
      experts: state.experts.map((e, i) => {
        if (i !== index) return e;
        const updated = { ...e, ...expertUpdates };
        if (!updated.content) {
          updated.content = updated.output || 'No content available';
        }
        if (updated.pluginId === 'core-ai-expert' && updated.pluginConfig) {
          updated.config = { ...updated.config, ...updated.pluginConfig };
        }
        return updated;
      }),
    })),
  addKnowledge: (expertIndex, files) =>
    set((state) => ({
      experts: state.experts.map((e, i) =>
        i === expertIndex ? { ...e, knowledge: [...e.knowledge, ...files] } : e
      ),
    })),
  removeKnowledge: (expertIndex, fileId) =>
    set((state) => ({
      experts: state.experts.map((e, i) =>
        i === expertIndex ? { ...e, knowledge: e.knowledge.filter((f) => f.id !== fileId) } : e
      ),
    })),

  // Execution State - Two Phase Architecture
  executionPhase: 'idle',
  isLoading: false,
  isSynthesizing: false,
  statusMessage: '',
  cost: { experts: 0, synthesis: 0, total: 0 },
  outputs: {},
  synthesisResult: null,
  verdict: '',
  status: '',

  // Phase 1: Execute all experts in parallel
  executePhase1: async () => {
    const state = get();

    // Import settings store dynamically
    const { useSettingsStore } = await import('@/features/settings/store/settings-store');
    const { openRouterKey, synthesisConfig } = useSettingsStore.getState();

    if (!openRouterKey) {
      toast.error('Vault Locked', {
        action: { label: 'Unlock', onClick: () => useSettingsStore.getState().setShowSettings(true) },
      });
      return;
    }
    if (!state.task.trim()) {
      toast.error('Task is empty');
      return;
    }

    set({
      executionPhase: 'phase1-experts',
      isLoading: true,
      outputs: {},
      synthesisResult: null,
      verdict: '',
      cost: { experts: 0, synthesis: 0, total: 0 },
      statusMessage: 'Running Council - Phase 1: All experts analyzing in parallel...',
    });

    const activeExperts = state.experts.slice(0, state.activeExpertCount);

    try {
      // Execute all experts in parallel (Phase 1)
      const result = await councilService.executeCouncilExperts(
        {
          task: state.task,
          mode: 'parallel', // Phase 1 is always parallel
          activeExperts,
          apiKey: openRouterKey,
          synthesisConfig,
        },
        (index, update) => {
          const currentExpert = get().experts[index];
          if (currentExpert) {
            if (update.output !== undefined) {
              get().updateExpert(index, { 
                output: update.output === '' ? '' : (currentExpert.output || '') + update.output,
                isLoading: update.isLoading
              });
            } else if (update.isLoading !== undefined) {
              get().updateExpert(index, { isLoading: update.isLoading });
            }
          }
        },
        (message) => {
          set({ statusMessage: message });
        }
      );

      set((state) => ({
        outputs: Object.fromEntries(
          Object.entries(result.outputs).map(([id, data]) => [id, data.output])
        ),
        cost: { ...state.cost, experts: result.expertsCost, total: result.expertsCost },
        executionPhase: 'phase1-complete',
        isLoading: false,
        statusMessage: 'Phase 1 Complete! All experts have responded. Select a judge mode and click "Run Judge" to synthesize.',
      }));

      toast.success('Phase 1 Complete! Ready for synthesis.');
    } catch (error) {
      console.error('ExecutePhase1 error:', error);
      set({ 
        isLoading: false, 
        executionPhase: 'idle',
        statusMessage: '' 
      });
      toast.error('Failed to execute Phase 1');
    }
  },

  // Phase 2: Synthesize expert outputs with selected judge mode
  executePhase2: async (synthesisMutation) => {
    const state = get();
    
    if (state.executionPhase !== 'phase1-complete') {
      toast.error('Please run Phase 1 first (Run Council button)');
      return;
    }

    // Import settings store dynamically
    const { useSettingsStore } = await import('@/features/settings/store/settings-store');
    const { useDashboardStore } = await import('@/features/dashboard/store/dashboard-store');
    const { openRouterKey, synthesisConfig } = useSettingsStore.getState();
    
    const startTime = Date.now();

    set({ 
      executionPhase: 'phase2-synthesis',
      statusMessage: 'Phase 2: Judge is synthesizing expert insights...', 
      isSynthesizing: true 
    });

    const activeExperts = state.experts.slice(0, state.activeExpertCount);

    // Convert outputs to expert outputs format
    const expertOutputs = Object.entries(state.outputs).map(([id, output]) => {
      const expert = activeExperts.find(e => e.id === id);
      return {
        name: expert?.name || id,
        model: expert?.model || 'unknown',
        content: output,
      };
    });

    // Add judge mode to synthesis config
    const configWithJudge = {
      ...synthesisConfig,
      judgeMode: state.judgeMode,
      customInstructions: `${synthesisConfig.customInstructions || ''}\n\nJudge Mode: ${state.judgeMode}`,
    };

    synthesisMutation.mutate(
      {
        expertOutputs,
        task: state.task,
        config: configWithJudge,
        apiKey: openRouterKey,
        onProgress: (message: string) => {
          set({ statusMessage: `Phase 2: ${message}` });
        },
      },
      {
        onSuccess: (synthesisResult) => {
          const newSynthesisCost = synthesisResult.cost || 0;
          const totalCost = councilService.calculateTotalCost(state.cost.experts, newSynthesisCost);
          const duration = Math.round((Date.now() - startTime) / 1000);

          set({
            synthesisResult,
            verdict: synthesisResult.content,
            statusMessage: 'Phase 2 Complete! Synthesis ready.',
            cost: totalCost,
            isSynthesizing: false,
            executionPhase: 'complete',
          });

          // Save to history
          councilService.saveExecutionSession(
            state.task,
            state.mode,
            state.activeExpertCount,
            activeExperts,
            Object.fromEntries(Object.entries(state.outputs).map(([id, output]) => [
              id,
              { expertName: activeExperts.find(e => e.id === id)?.name || id, output, model: activeExperts.find(e => e.id === id)?.model || 'unknown' }
            ])),
            synthesisResult.content,
            configWithJudge,
            totalCost
          );

          // Track in analytics
          useDashboardStore.getState().addDecisionRecord({
            timestamp: new Date(),
            mode: state.mode,
            task: state.task.substring(0, 200),
            expertCount: state.activeExpertCount,
            duration,
            cost: totalCost.total,
            verdict: synthesisResult.content.substring(0, 500),
            synthesisContent: synthesisResult.content,
            synthesisModel: synthesisResult.model,
            synthesisTier: synthesisResult.tier,
            success: true,
          }).catch(err => console.error('Failed to save decision record:', err));

          toast.success('Council analysis complete!');
        },
        onError: (error) => {
          toast.error('Synthesis Failed', { description: error.message });
          const fallbackVerdict = 'Synthesis failed. Please review the expert outputs manually.';
          set({
            verdict: fallbackVerdict,
            synthesisResult: {
              content: fallbackVerdict,
              tier: configWithJudge.tier,
              model: 'fallback',
              tokens: { prompt: 0, completion: 0 },
              cost: 0,
            },
            isSynthesizing: false,
            executionPhase: 'idle',
          });
        },
      }
    );
  },

  executeCouncil: async (synthesisMutation) => {
    const state = get();
    const startTime = Date.now();

    // Import settings and dashboard stores dynamically
    const { useSettingsStore } = await import('@/features/settings/store/settings-store');
    const { useDashboardStore } = await import('@/features/dashboard/store/dashboard-store');
    
    const { openRouterKey, synthesisConfig } = useSettingsStore.getState();

    if (!openRouterKey) {
      toast.error('Vault Locked', {
        action: { label: 'Unlock', onClick: () => useSettingsStore.getState().setShowSettings(true) },
      });
      return;
    }
    if (!state.task.trim()) {
      toast.error('Task is empty');
      return;
    }

    set({
      isLoading: true,
      outputs: {},
      synthesisResult: null,
      verdict: '',
      cost: { experts: 0, synthesis: 0, total: 0 },
      statusMessage: 'Initializing Council...',
    });

    const activeExperts = state.experts.slice(0, state.activeExpertCount);

    try {
      const result = await councilService.executeCouncilExperts(
        {
          task: state.task,
          mode: state.mode,
          activeExperts,
          apiKey: openRouterKey,
          synthesisConfig,
        },
        (index, update) => {
          const currentExpert = get().experts[index];
          if (currentExpert) {
            if (update.output !== undefined) {
              get().updateExpert(index, { 
                output: update.output === '' ? '' : (currentExpert.output || '') + update.output,
                isLoading: update.isLoading
              });
            } else if (update.isLoading !== undefined) {
              get().updateExpert(index, { isLoading: update.isLoading });
            }
          }
        },
        (message) => {
          set({ statusMessage: message });
        }
      );

      set((state) => ({
        outputs: Object.fromEntries(
          Object.entries(result.outputs).map(([id, data]) => [id, data.output])
        ),
        cost: { ...state.cost, experts: result.expertsCost, total: result.expertsCost + state.cost.synthesis },
      }));

      // Synthesis phase
      set({ statusMessage: 'Synthesizing insights...', isSynthesizing: true });

      synthesisMutation.mutate(
        {
          expertOutputs: Object.values(result.outputs).map(data => ({
            name: data.expertName,
            model: data.model,
            content: data.output,
          })),
          task: state.task,
          config: synthesisConfig,
          apiKey: openRouterKey,
          onProgress: (message: string) => {
            set({ statusMessage: message });
          },
        },
        {
          onSuccess: (synthesisResult) => {
            const newSynthesisCost = synthesisResult.cost || 0;
            const totalCost = councilService.calculateTotalCost(result.expertsCost, newSynthesisCost);
            const duration = Math.round((Date.now() - startTime) / 1000);

            set({
              synthesisResult,
              verdict: synthesisResult.content,
              statusMessage: 'Analysis complete',
              cost: totalCost,
              isSynthesizing: false,
            });

            // Save to history
            councilService.saveExecutionSession(
              state.task,
              state.mode,
              state.activeExpertCount,
              activeExperts,
              result.outputs,
              synthesisResult.content,
              synthesisConfig,
              totalCost
            );

            // Track in analytics
            useDashboardStore.getState().addDecisionRecord({
              timestamp: new Date(),
              mode: state.mode,
              task: state.task.substring(0, 200),
              expertCount: state.activeExpertCount,
              duration,
              cost: totalCost.total,
              verdict: synthesisResult.content.substring(0, 500),
              synthesisContent: synthesisResult.content,
              synthesisModel: synthesisResult.model,
              synthesisTier: synthesisResult.tier,
              success: true,
            }).catch(err => console.error('Failed to save decision record:', err));

            toast.success('Council analysis complete!');
          },
          onError: (error) => {
            toast.error('Synthesis Failed', { description: error.message });
            const fallbackVerdict = 'Synthesis failed. Please review the expert outputs manually.';
            set({
              verdict: fallbackVerdict,
              synthesisResult: {
                content: fallbackVerdict,
                tier: synthesisConfig.tier,
                model: 'fallback',
                tokens: { prompt: 0, completion: 0 },
                cost: 0,
              },
              isSynthesizing: false,
            });
          },
        }
      );

      set({ isLoading: false, statusMessage: '' });
    } catch (error) {
      console.error('ExecuteCouncil error:', error);
      set({ isLoading: false, statusMessage: '' });
      toast.error('Failed to execute council');
    }
  },

  reset: () => {
    set({
      executionPhase: 'idle',
      isLoading: false,
      isSynthesizing: false,
      statusMessage: '',
      cost: { experts: 0, synthesis: 0, total: 0 },
      outputs: {},
      synthesisResult: null,
      verdict: '',
      status: '',
    });
  },

  // Control Panel State
  task: '',
  setTask: (task) => set({ task }),
  mode: 'parallel',
  setMode: (mode) => set({ mode }),
  judgeMode: 'ruthless-judge', // Default to Ruthless Judge
  setJudgeMode: (mode) => set({ judgeMode: mode }),
  activeExpertCount: 5,
  setActiveExpertCount: (count) => set({ activeExpertCount: count }),
  debateRounds: 3,
  setDebateRounds: (rounds) => set({ debateRounds: rounds }),
  fileData: [],
  setFileData: (fileData) => set({ fileData }),
  addFileData: (file) => set((state) => ({ fileData: [...state.fileData, file] })),
  removeFileData: (index) => set((state) => ({ fileData: state.fileData.filter((_, i) => i !== index) })),

  loadPersona: (expertIndex, personaId) => {
    const personaExpert = loadPersonaIntoExpert(personaId, expertIndex);
    if (personaExpert) {
      const newExperts = [...get().experts];
      newExperts[expertIndex - 1] = {
        id: personaExpert.id,
        name: personaExpert.name,
        model: personaExpert.model,
        role: personaExpert.role,
        basePersona: personaExpert.basePersona,
        knowledge: personaExpert.knowledge || [],
        config: personaExpert.config,
        modeBehavior: personaExpert.modeBehavior,
        content: personaExpert.content || 'No content available',
        color: personaExpert.color || '#000000',
        icon: personaExpert.icon || 'default-icon',
        isLoading: personaExpert.isLoading !== undefined ? personaExpert.isLoading : false,
      };
      set({ experts: newExperts });
      toast.success(`Loaded ${personaExpert.name} into Expert ${expertIndex}`);
    } else {
      toast.error('Failed to load persona');
    }
  },

  loadTeam: (teamId) => {
    const team = loadTeamFromLibrary(teamId);
    if (team) {
      set({ activeExpertCount: team.experts.length, mode: team.mode });
      const newExperts = [...DEFAULT_EXPERTS];
      team.experts.forEach((expert, index) => {
        newExperts[index] = {
          id: expert.id,
          name: expert.name,
          model: expert.model,
          role: expert.role,
          basePersona: expert.basePersona,
          knowledge: expert.knowledge || [],
          config: expert.config,
          modeBehavior: {
            ...expert.modeBehavior,
            modeName: expert.modeBehavior.modeName ?? "defaultMode",
            description: expert.modeBehavior.description ?? "No description provided",
            isEnabled: expert.modeBehavior.isEnabled ?? true,
          },
          content: expert.content || 'No content available',
          color: expert.color || '#000000',
          icon: expert.icon || 'default-icon',
          hasWebSearch: expert.hasWebSearch ?? false,
        };
      });
      set({ experts: newExperts });
      toast.success(`Loaded ${team.name} with ${team.experts.length} experts`);
    } else {
      toast.error('Failed to load team');
    }
  },

  clearPersona: (expertIndex) => {
    const defaultExpert = DEFAULT_EXPERTS[expertIndex - 1];
    if (defaultExpert) {
      const newExperts = [...get().experts];
      newExperts[expertIndex - 1] = { ...defaultExpert };
      set({ experts: newExperts });
      toast.success(`Reset Expert ${expertIndex} to default`);
    }
  },

  resetToDefault: () => {
    set({ experts: [...DEFAULT_EXPERTS], activeExpertCount: 5, mode: 'synthesis' });
    toast.success('Reset all experts to defaults');
  },
}));

/**
 * Backward compatibility: Export selectors that match old store patterns
 */
export const useCouncilExperts = () => useCouncilStore((state) => state.experts);
export const useCouncilExecution = () => useCouncilStore((state) => ({
  executionPhase: state.executionPhase,
  isLoading: state.isLoading,
  isSynthesizing: state.isSynthesizing,
  statusMessage: state.statusMessage,
  cost: state.cost,
  outputs: state.outputs,
  synthesisResult: state.synthesisResult,
  verdict: state.verdict,
  executePhase1: state.executePhase1,
  executePhase2: state.executePhase2,
  executeCouncil: state.executeCouncil,
  reset: state.reset,
}));
export const useCouncilControl = () => useCouncilStore((state) => ({
  task: state.task,
  setTask: state.setTask,
  mode: state.mode,
  setMode: state.setMode,
  judgeMode: state.judgeMode,
  setJudgeMode: state.setJudgeMode,
  activeExpertCount: state.activeExpertCount,
  setActiveExpertCount: state.setActiveExpertCount,
  debateRounds: state.debateRounds,
  setDebateRounds: state.setDebateRounds,
  fileData: state.fileData,
  setFileData: state.setFileData,
  addFileData: state.addFileData,
  removeFileData: state.removeFileData,
  loadPersona: state.loadPersona,
  loadTeam: state.loadTeam,
  clearPersona: state.clearPersona,
  resetToDefault: state.resetToDefault,
}));
