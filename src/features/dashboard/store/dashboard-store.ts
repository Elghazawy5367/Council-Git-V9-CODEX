/**
 * @deprecated This store is deprecated. Please use the unified analytics store from @/stores/analytics.store
 * This file now provides backward compatibility by proxying to the new store.
 */

import type { ExecutionMode } from '@/features/council/lib/types';
import { useAnalyticsStore, type DecisionRecord, type DecisionMetrics } from '@/stores/analytics.store';

interface DashboardState {
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

// Log deprecation warning once
if (typeof window !== 'undefined' && !window.__dashboard_store_warned) {
  console.warn(
    '[DEPRECATED] useDashboardStore from @/features/dashboard/store/dashboard-store is deprecated.\n' +
    'Please migrate to @/stores/analytics.store (useAnalyticsStore).\n' +
    'This compatibility layer will be removed in a future version.'
  );
  window.__dashboard_store_warned = true;
}

declare global {
  interface Window {
    __dashboard_store_warned?: boolean;
  }
}

/**
 * Backward compatibility wrapper for useDashboardStore
 * Proxies to the unified analytics store
 */
export function useDashboardStore<T>(selector: (state: DashboardState) => T): T;
export function useDashboardStore(): DashboardState;
export function useDashboardStore(selector?: (state: DashboardState) => unknown) {
  return useAnalyticsStore(selector as (state: any) => any);
}

// Re-export types for backward compatibility
export type { DecisionRecord, DecisionMetrics };
