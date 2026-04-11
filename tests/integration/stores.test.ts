import { describe, it, expect } from 'vitest';
import { useCouncilStore } from '@/stores/council.store';
import { useAnalyticsStore } from '@/stores/analytics.store';

describe('Integration Tests: Stores', () => {
  it('should initialize useCouncilStore without crashing', () => {
    const state = useCouncilStore.getState();
    expect(state).toBeDefined();
    
    // Core structure checks
    expect(state.config).toBeDefined();
    expect(state.vault).toBeDefined();
    expect(state.workspace).toBeDefined();
    
    // Initial states
    expect(state.config.isDarkMode).toBeTypeOf('boolean');
    expect(Array.isArray(state.vault.systemPrompts)).toBe(true);
  });

  it('should initialize useAnalyticsStore properly', () => {
    const state = useAnalyticsStore.getState();
    expect(state).toBeDefined();
    expect(Array.isArray(state.recentActions)).toBe(true);
  });
  
  it('should allow generic mutations in isolated test stores', () => {
    const state = useAnalyticsStore.getState();
    state.addAction({
      type: 'test_action',
      details: 'test details',
      metadata: { target: 'test' }
    });
    
    const updatedState = useAnalyticsStore.getState();
    expect(updatedState.recentActions.length).toBeGreaterThan(0);
    expect(updatedState.recentActions[updatedState.recentActions.length - 1].type).toBe('test_action');
  });
});
