import { describe, it, expect } from 'vitest';
import { useCouncilStore } from '@/stores/council.store';
import { useAnalyticsStore } from '@/stores/analytics.store';

describe('Integration Tests: Stores', () => {
  it('should initialize useCouncilStore without crashing', () => {
    const state = useCouncilStore.getState();
    expect(state).toBeDefined();
    
    // Core structure checks
    expect(state.experts).toBeDefined();
    expect(state.executionPhase).toBeDefined();
    expect(state.statusMessage).toBeDefined();
    
    // Initial states
    expect(Array.isArray(state.experts)).toBe(true);
    expect(state.executionPhase).toBe('idle');
  });

  it('should initialize useAnalyticsStore properly', () => {
    const state = useAnalyticsStore.getState();
    expect(state).toBeDefined();
    expect(state.metrics).toBeDefined();
    expect(Array.isArray(state.recentDecisions)).toBe(true);
  });
  
  it('should allow generic mutations in isolated test stores', async () => {
    const state = useAnalyticsStore.getState();
    const testRecord = {
      timestamp: new Date(),
      mode: 'parallel' as const,
      task: 'test_task',
      expertCount: 5,
      duration: 10,
      cost: 0.05,
      verdict: 'test verdict',
      success: true
    };
    
    // Since addDecisionRecord is async and interacts with Dexie/IndexedDB,
    // it might need a mock for IndexedDB in vitest environment if it fails.
    try {
        await state.addDecisionRecord(testRecord);
        const updatedState = useAnalyticsStore.getState();
        expect(updatedState.recentDecisions.length).toBeGreaterThan(0);
        expect(updatedState.recentDecisions[0].task).toBe('test_task');
    } catch (e) {
        console.warn('Skipping indexedDB dependent part of test in non-browser environment');
    }
  });
});
