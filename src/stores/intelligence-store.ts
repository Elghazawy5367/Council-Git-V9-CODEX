import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IntelligenceSuggestion {
  id: string;
  title: string;
  description: string;
  rationale: {
    technical: string;
    strategic: string;
  };
  featureId: string;
  priority: SuggestionPriority;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'dismissed' | 'executing' | 'completed' | 'failed';
}

interface IntelligenceState {
  suggestions: IntelligenceSuggestion[];
  addSuggestion: (suggestion: Omit<IntelligenceSuggestion, 'id' | 'timestamp' | 'status'>) => void;
  updateSuggestionStatus: (id: string, status: IntelligenceSuggestion['status']) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;
}

export const useIntelligenceStore = create<IntelligenceState>()(
  persist(
    (set) => ({
      suggestions: [],

      addSuggestion: (suggestion) => {
        const newSuggestion: IntelligenceSuggestion = {
          ...suggestion,
          id: `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          status: 'pending',
        };

        set((state) => ({
          suggestions: [newSuggestion, ...state.suggestions].slice(0, 50), // Keep last 50
        }));
      },

      updateSuggestionStatus: (id, status) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        }));
      },

      dismissSuggestion: (id) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, status: 'dismissed' } : s
          ),
        }));
      },

      clearSuggestions: () => set({ suggestions: [] }),
    }),
    {
      name: 'intelligence-store',
    }
  )
);
