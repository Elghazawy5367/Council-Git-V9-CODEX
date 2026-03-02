/**
 * Analytics Store
 * Manages dashboard analytics and metrics
 */

import { create } from 'zustand';
import type { ExecutionMode } from '@/features/council/lib/types';
import { db, type DecisionRecord as DBDecisionRecord } from '@/lib/db';

export interface DecisionMetrics {
  totalDecisions: number;
  averageTime: number; // in seconds
  averageCost: number; // in USD
  totalCost: number; // in USD
  successRate: number; // percentage
  expertConsensusRate: number; // percentage
  modeDistribution: Record<ExecutionMode, number>;
}

export interface DecisionRecord {
  id?: number;
  timestamp: Date;
  mode: ExecutionMode;
  task: string;
  expertCount: number;
  duration: number; // seconds
  cost: number; // USD
  verdict: string;
  synthesisContent?: string;
  synthesisModel?: string;
  synthesisTier?: string;
  success: boolean;
}

interface AnalyticsState {
  metrics: DecisionMetrics;
  recentDecisions: DecisionRecord[];
  dateRange: {
    start: Date;
    end: Date;
  };
  isLoading: boolean;
  setDateRange: (start: Date, end: Date) => void;
  addDecisionRecord: (record: DecisionRecord) => Promise<void>;
  loadDecisions: () => Promise<void>;
  updateMetrics: () => void;
  exportData: () => string;
  clearAllData: () => Promise<void>;
}

const calculateMetrics = (decisions: DecisionRecord[]): DecisionMetrics => {
  if (decisions.length === 0) {
    return {
      totalDecisions: 0,
      averageTime: 0,
      averageCost: 0,
      totalCost: 0,
      successRate: 0,
      expertConsensusRate: 0,
      modeDistribution: {
        parallel: 0,
        consensus: 0,
        adversarial: 0,
        sequential: 0,
      },
    };
  }

  const totalTime = decisions.reduce((sum, d) => sum + d.duration, 0);
  const totalCost = decisions.reduce((sum, d) => sum + d.cost, 0);
  const successCount = decisions.filter((d) => d.success).length;

  const modeDistribution = decisions.reduce((acc, d) => {
    acc[d.mode] = (acc[d.mode] || 0) + 1;
    return acc;
  }, {} as Record<ExecutionMode, number>);

  // Compute actual consensus rate from records where mode is 'consensus'
  const consensusDecisions = decisions.filter(d => d.mode === 'consensus');
  const expertConsensusRate = consensusDecisions.length > 0
    ? (consensusDecisions.filter(d => d.success).length / consensusDecisions.length) * 100
    : 0;

  return {
    totalDecisions: decisions.length,
    averageTime: totalTime / decisions.length,
    averageCost: totalCost / decisions.length,
    totalCost: totalCost,
    successRate: (successCount / decisions.length) * 100,
    expertConsensusRate: expertConsensusRate ?? 85, // Fallback to 85 if no consensus data but other data exists
    modeDistribution,
  };
};

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  return { start, end };
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  metrics: {
    totalDecisions: 0,
    averageTime: 0,
    averageCost: 0,
    totalCost: 0,
    successRate: 0,
    expertConsensusRate: 0,
    modeDistribution: {
      parallel: 0,
      consensus: 0,
      adversarial: 0,
      sequential: 0,
    },
  },
  recentDecisions: [],
  dateRange: defaultDateRange(),
  isLoading: false,

  setDateRange: (start, end) => {
    set({ dateRange: { start, end } });
    get().loadDecisions();
  },

  addDecisionRecord: async (record) => {
    try {
      const id = await db.decisionRecords.add({
        timestamp: record.timestamp.toISOString(),
        mode: record.mode,
        task: record.task,
        expertCount: record.expertCount,
        duration: record.duration,
        cost: record.cost,
        verdict: record.verdict,
        synthesisContent: record.synthesisContent,
        synthesisModel: record.synthesisModel,
        synthesisTier: record.synthesisTier,
        success: record.success,
      } as DBDecisionRecord);

      const newRecord = { ...record, id };
      set((state) => ({
        recentDecisions: [newRecord, ...state.recentDecisions].slice(0, 100),
      }));

      get().updateMetrics();
    } catch (error) {
      console.error('Failed to add decision record:', error);
      throw error;
    }
  },

  loadDecisions: async () => {
    set({ isLoading: true });
    try {
      const { start, end } = get().dateRange;
      const records = await db.decisionRecords
        .where('timestamp')
        .between(start.toISOString(), end.toISOString())
        .reverse()
        .limit(100)
        .toArray();

      const decisions: DecisionRecord[] = records.map((r) => ({
        id: r.id,
        timestamp: new Date(r.timestamp),
        mode: r.mode as ExecutionMode,
        task: r.task,
        expertCount: r.expertCount,
        duration: r.duration,
        cost: r.cost,
        verdict: r.verdict,
        synthesisContent: r.synthesisContent,
        synthesisModel: r.synthesisModel,
        synthesisTier: r.synthesisTier,
        success: r.success,
      }));

      set({ recentDecisions: decisions });
      get().updateMetrics();
    } catch (error) {
      console.error('Failed to load decisions:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateMetrics: () => {
    const { recentDecisions } = get();
    const metrics = calculateMetrics(recentDecisions);
    set({ metrics });
  },

  exportData: () => {
    const { recentDecisions, metrics } = get();
    return JSON.stringify({ decisions: recentDecisions, metrics }, null, 2);
  },

  clearAllData: async () => {
    try {
      await db.decisionRecords.clear();
      set({
        recentDecisions: [],
        metrics: {
          totalDecisions: 0,
          averageTime: 0,
          averageCost: 0,
          totalCost: 0,
          successRate: 0,
          expertConsensusRate: 0,
          modeDistribution: {
            parallel: 0,
            consensus: 0,
            adversarial: 0,
            sequential: 0,
          },
        },
      });
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
      throw error;
    }
  },
}));
