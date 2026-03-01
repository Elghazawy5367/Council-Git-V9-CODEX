import React, { Suspense, lazy } from "react";
import { Header } from "@/features/council/components/Header";
import { ControlPanel } from "@/features/council/components/ControlPanel";
import { ExpertCard } from "@/features/council/components/ExpertCard";
import { VerdictPanel } from "@/features/council/components/VerdictPanel";
import { SynthesisCard } from "@/features/council/components/SynthesisCard";
import { useControlPanelStore } from "@/features/council/store/control-panel-store";
import { useExpertStore } from "@/features/council/store/expert-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle } from "lucide-react";
import { NoExpertsEmptyState } from "@/components/EmptyState";
import { LayoutDebugger } from "@/components/LayoutDebugger";
import { AdaptiveGrid } from "@/components/AdaptiveGrid";
import { QualityOracle } from "@/components/QualityOracle";
const SettingsModal = lazy(() => import("@/features/settings/components/SettingsModal"));
const HistorySidebar = lazy(() => import("@/features/council/components/HistoryPanel"));
const MemoryPanel = lazy(() => import("@/features/council/components/MemoryPanel"));

// Component-level error fallback
const ComponentErrorFallback = ({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => <div className="flex flex-col items-center justify-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
    <p className="text-sm text-muted-foreground mb-2">Component Error</p>
    <p className="text-xs text-destructive mb-3">{error.message}</p>
    <button onClick={resetErrorBoundary} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
      Retry
    </button>
  </div>;
const Index: React.FC = () => {
  const activeExpertCount = useControlPanelStore(state => state.activeExpertCount);
  const experts = useExpertStore(state => state.experts);
  const showSettings = useSettingsStore(state => state.showSettings);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);
  const setShowHistory = useSettingsStore(state => state.setShowHistory);
  const showHistory = useSettingsStore(state => state.showHistory);
  const showMemory = useSettingsStore(state => state.showMemory);
  const setShowMemory = useSettingsStore(state => state.setShowMemory);
  return <div className="min-h-screen flex flex-col">
      {/* Header - Protected */}
      <ErrorBoundary FallbackComponent={ComponentErrorFallback} onReset={() => undefined}>
        <Header />
      </ErrorBoundary>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-screen-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 lg:min-w-[300px] space-y-4">
            {/* Control Panel - Protected */}
            <ErrorBoundary FallbackComponent={ComponentErrorFallback} onReset={() => undefined}>
              <ControlPanel />
            </ErrorBoundary>

            {/* Verdict Panel - Protected */}
            <ErrorBoundary FallbackComponent={ComponentErrorFallback} onReset={() => undefined}>
              <VerdictPanel />
            </ErrorBoundary>

            {/* Quality Oracle - Next-gen Dashboard Overlay */}
            <ErrorBoundary FallbackComponent={ComponentErrorFallback} onReset={() => undefined}>
              <QualityOracle />
            </ErrorBoundary>
          </div>

          <div className="lg:col-span-2">
            {/* Expert Grid - Protected */}
            <ErrorBoundary FallbackComponent={ComponentErrorFallback} onReset={() => undefined}>
              {experts.length === 0 ? (
                <NoExpertsEmptyState onAddExpert={() => setShowSettings(true)} />
              ) : (
                <AdaptiveGrid itemCount={activeExpertCount + 1} className="stagger-fade-in">
                  {experts.slice(0, activeExpertCount).map((expert, index) => (
                    <ExpertCard key={expert.id} index={index} />
                  ))}
                  
                  {/* Synthesis Card - Protected */}
                  <ErrorBoundary FallbackComponent={ComponentErrorFallback} onReset={() => undefined}>
                    <SynthesisCard />
                  </ErrorBoundary>
                </AdaptiveGrid>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      <Suspense fallback={<div className="h-12 w-12 animate-spin text-primary" />}>
        {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
        {showHistory && <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} />}
        {showMemory && <MemoryPanel isOpen={showMemory} onClose={() => setShowMemory(false)} />}
      </Suspense>
    </div>;
};
export default Index;