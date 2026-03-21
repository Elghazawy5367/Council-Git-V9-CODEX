import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { SynthesisConfig } from '@/lib/types';
import { DEFAULT_SYNTHESIS_CONFIG } from '@/lib/synthesis-engine';
import { getVaultStatus, createVault, unlockVault, lockVault, VaultStatus } from '@/features/council/lib/vault';

interface VaultCreationResult {
  success: boolean;
  error?: string;
}

interface VaultUnlockResult {
  success: boolean;
  error?: string;
  keys: {
    openRouterKey: string;
    serperKey?: string;
    githubApiKey?: string;
    redditApiKey?: string;
  };
}

interface SettingsState {
  apiKey: string;
  setApiKey: (key: string) => void;
  openRouterKey: string;
  setOpenRouterKey: (key: string) => void;
  githubApiKey: string;
  setGithubApiKey: (key: string) => void;
  redditApiKey: string;
  setRedditApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  synthesisConfig: SynthesisConfig;
  setSynthesisConfig: (config: SynthesisConfig) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showMemory: boolean;
  setShowMemory: (show: boolean) => void;
  vaultStatus: VaultStatus;
  handleCreateVault: (data: { password: string; openRouterKey: string; serperKey?: string; githubApiKey?: string; redditApiKey?: string }) => Promise<VaultCreationResult>;
  handleUnlockVault: (password: string) => Promise<VaultUnlockResult>;
  handleLockVault: () => void;
}

export const useSettingsStore = create<SettingsState>(
  // @ts-expect-error - Zustand v5 persist middleware type signature mismatch (non-breaking)
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key: string) => set({ apiKey: key }),
      openRouterKey: '',
      setOpenRouterKey: (key: string) => set({ openRouterKey: key }),
      githubApiKey: '',
      setGithubApiKey: (key: string) => set({ githubApiKey: key }),
      redditApiKey: '',
      setRedditApiKey: (key: string) => set({ redditApiKey: key }),
      model: 'gpt-4-turbo-preview',
      setModel: (model: string) => set({ model }),
      synthesisConfig: DEFAULT_SYNTHESIS_CONFIG,
      setSynthesisConfig: (config: SynthesisConfig) => set({ synthesisConfig: config }),
      showSettings: false,
      setShowSettings: (show: boolean) => set({ showSettings: show }),
      showHistory: false,
      setShowHistory: (show: boolean) => set({ showHistory: show }),
      showMemory: false,
      setShowMemory: (show: boolean) => set({ showMemory: show }),
      vaultStatus: getVaultStatus(),
      handleCreateVault: async (data: { password: string; openRouterKey: string; serperKey?: string; githubApiKey?: string; redditApiKey?: string }) => {
        const result = await createVault(data);
        if (result.success) {
          set({ vaultStatus: getVaultStatus() });
          toast.success('Vault Created');
        } else {
          toast.error('Vault Creation Failed', { description: result.error });
        }
        return result;
      },
      handleUnlockVault: async (password: string) => {
        const result = await unlockVault(password);
        if (result.success && 'keys' in result) {
          const unlockResult = result as VaultUnlockResult;
          set({ 
            vaultStatus: getVaultStatus(), 
            openRouterKey: unlockResult.keys.openRouterKey,
            githubApiKey: unlockResult.keys.githubApiKey || '',
            redditApiKey: unlockResult.keys.redditApiKey || ''
          });
          toast.success('Vault Unlocked');
          return unlockResult;
        } else {
          toast.error('Unlock Failed');
          return { success: false, error: 'Unlock Failed', keys: { openRouterKey: '', githubApiKey: '', redditApiKey: '' } } as VaultUnlockResult;
        }
      },
      handleLockVault: () => {
        lockVault();
        set({ 
          vaultStatus: getVaultStatus(), 
          openRouterKey: '', 
          githubApiKey: '', 
          redditApiKey: '' 
        });
        toast.success('Vault Locked');
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        model: state.model,
        synthesisConfig: state.synthesisConfig,
        // Note: API keys are managed by vault, not persisted here
        // UI state is managed by UIStore, not persisted here
      }),
    }
  )
);
