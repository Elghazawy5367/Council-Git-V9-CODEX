import React, { Suspense, lazy } from "react";
import { ControlPanel } from "@/features/council/components/ControlPanel";
import { ExpertCard } from "@/features/council/components/ExpertCard";
import { VerdictPanel } from "@/features/council/components/VerdictPanel";
import { SynthesisCard } from "@/features/council/components/SynthesisCard";
import { useControlPanelStore } from "@/features/council/store/control-panel-store";
import { useExpertStore } from "@/features/council/store/expert-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, Plus, LayoutGrid, Brain } from "lucide-react";
import { NoExpertsEmptyState } from "@/components/EmptyState";
import { Button } from "@/components/primitives/button";

const SettingsModal = lazy(() => import("@/features/settings/components/SettingsModal"));
const HistorySidebar = lazy(() => import("@/features/council/components/HistoryPanel"));
const MemoryPanel = lazy(() => import("@/features/council/components/MemoryPanel"));

const ComponentErrorFallback = ({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div className="flex flex-col items-center justify-center p-8 border border-accent-rose/20 rounded-2xl bg-accent-rose/5 text-center">
    <AlertCircle className="h-8 w-8 text-accent-rose mb-3" />
    <p className="text-sm font-bold text-text-primary uppercase tracking-widest mb-1">Module Failure</p>
    <p className="text-[10px] text-text-tertiary font-medium max-w-xs mb-4">{error.message}</p>
    <Button onClick={resetErrorBoundary} size="sm" className="h-8 px-4 bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-text-primary text-[10px] font-bold uppercase tracking-widest">
      Restore Module
    </Button>
  </div>
);

const Index: React.FC = () => {
  const activeExpertCount = useControlPanelStore(state => state.activeExpertCount);
  const experts = useExpertStore(state => state.experts);
  const showSettings = useSettingsStore(state => state.showSettings);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);
  const showHistory = useSettingsStore(state => state.showHistory);
  const showMemory = useSettingsStore(state => state.showMemory);
  const setShowMemory = useSettingsStore(state => state.setShowMemory);

  return (
    <div className="flex-1 flex flex-col bg-bg-void animate-fade-in">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Controls Section */}
        <div className="w-full xl:w-[420px] shrink-0 space-y-6">
          <div className="flex items-center gap-2 text-primary-glow font-bold uppercase tracking-[0.2em] text-[10px] mb-2 px-1">
             <Brain className="w-3.5 h-3.5" /> Intelligence Strategy
          </div>

          <ErrorBoundary FallbackComponent={ComponentErrorFallback}>
            <ControlPanel />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ComponentErrorFallback}>
            <VerdictPanel />
          </ErrorBoundary>
        </div>

        {/* Expert Grid Section */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between gap-4 px-1">
             <div className="flex items-center gap-2 text-text-tertiary font-bold uppercase tracking-[0.2em] text-[10px]">
                <LayoutGrid className="w-3.5 h-3.5" /> Activated Fleet
             </div>
             {experts.length > 0 && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary hover:text-primary-glow"
                 onClick={() => setShowSettings(true)}
               >
                 <Plus className="w-3 h-3 mr-1.5" /> Expand Network
               </Button>
             )}
          </div>

          <ErrorBoundary FallbackComponent={ComponentErrorFallback}>
            {experts.length === 0 ? (
              <NoExpertsEmptyState onAddExpert={() => setShowSettings(true)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-fr">
                {experts.slice(0, activeExpertCount).map((expert, index) => (
                  <ExpertCard key={expert.id} index={index} />
                ))}

                {/* Synthesis Metadata/Preview Card */}
                <ErrorBoundary FallbackComponent={ComponentErrorFallback}>
                  <SynthesisCard />
                </ErrorBoundary>
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>

      <Suspense fallback={null}>
        {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
        {showHistory && <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} />}
        {showMemory && <MemoryPanel isOpen={showMemory} onClose={() => setShowMemory(false)} />}
      </Suspense>
    </div>
  );
};

export default Index;
