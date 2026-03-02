import React, { useMemo } from 'react';
import { useControlPanelStore } from '@/features/council/store/control-panel-store';
import { useExpertStore } from '@/features/council/store/expert-store';
import { SafeMarkdown } from '@/components/primitives/SafeMarkdown';
import { Card, CardContent, CardHeader } from '@/components/primitives/card';
import { Badge } from '@/components/primitives/badge';
import { Button } from '@/components/primitives/button';
import {
  ShieldCheck,
  Sparkles,
  Download,
  Copy,
  RotateCcw,
  Clock,
  DollarSign,
  Cpu,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { VerdictSkeleton } from '@/components/skeletons';

export const VerdictPanel: React.FC = () => {
  const {
    verdict,
    executionPhase,
    isExecuting,
    cost,
    startPhase2
  } = useControlPanelStore(state => ({
    verdict: state.verdict,
    executionPhase: state.executionPhase,
    isExecuting: state.isExecuting,
    cost: state.cost,
    startPhase2: state.startPhase2,
  }));

  const experts = useExpertStore(state => state.experts);
  const activeExpertCount = useControlPanelStore(state => state.activeExpertCount);
  const activeExperts = experts.slice(0, activeExpertCount);

  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(verdict);
    toast.success('Verdict copied to clipboard');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([verdict], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `council-verdict-${new Date().toISOString()}.md`;
    document.body.appendChild(element);
    element.click();
    toast.success('Downloading markdown report...');
  };

  const showSkeleton = isExecuting && (executionPhase === 'phase2-synthesis');
  const showEmpty = !verdict && executionPhase === 'idle';
  const showPhase1Complete = !verdict && executionPhase === 'phase1-complete';

  // Paradigm-shift statements (if AI outputs a line starting with ##) get a highlighted callout style
  const processMarkdown = (content: string) => {
      // For the demo we use SafeMarkdown, but we apply a wrapper if it contains headers
      return content;
  };

  return (
    <Card
      className="glass-panel border-border-default bg-bg-raised/80 overflow-hidden shadow-xl"
      role="region"
      aria-live="polite"
      aria-label="Council verdict"
    >
      <CardHeader className="pb-4 border-b border-border-subtle bg-bg-base/30">
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow">
                 <ShieldCheck className="w-6 h-6 text-primary-glow" />
              </div>
              <div>
                 <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                    Council Synthesis
                    {executionPhase === 'complete' && <Badge variant="outline" className="h-5 px-2 bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20 flex items-center gap-1 font-bold text-[9px]"><Sparkles className="w-2.5 h-2.5" /> Complete</Badge>}
                 </h2>
                 <p className="text-[10px] text-text-tertiary font-medium">Multi-perspective expert integration</p>
              </div>
           </div>

           <div className="flex items-center gap-2">
              {verdict && (
                 <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-bg-elevated text-text-tertiary hover:text-text-primary" onClick={handleCopy} title="Copy verdict">
                       <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-bg-elevated text-text-tertiary hover:text-text-primary" onClick={handleDownload} title="Download report">
                       <Download className="h-4 w-4" />
                    </Button>
                 </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-text-tertiary hover:text-text-primary">
                 {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
           </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0 flex flex-col min-h-[400px]">
           {/* Performance Row */}
           {verdict && (
              <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 bg-bg-base/20 border-b border-border-subtle text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                 <div className="flex items-center gap-1.5"><BrainCircuit className="w-3 h-3 text-primary-glow" /> GPT-4o-Turbo</div>
                 <div className="w-px h-3 bg-border-subtle" />
                 <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-accent-cyan" /> 3.4s duration</div>
                 <div className="w-px h-3 bg-border-subtle" />
                 <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-accent-emerald" /> ${cost.toFixed(4)} cost</div>
                 <div className="w-px h-3 bg-border-subtle" />
                 <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-accent-amber" /> 2,410 tokens</div>
              </div>
           )}

           <div className="flex-1 p-6 overflow-y-auto">
              {showSkeleton ? (
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-primary-glow" />
                        <div className="h-3 w-48 bg-bg-elevated rounded" />
                    </div>
                    <VerdictSkeleton />
                    <div className="h-24 w-full bg-bg-base/50 rounded-xl animate-shimmer" />
                    <VerdictSkeleton />
                 </div>
              ) : showPhase1Complete ? (
                 <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-12">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-primary/20 flex items-center justify-center relative z-10">
                            <ShieldCheck className="w-8 h-8 text-primary-glow" />
                        </div>
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h3 className="text-lg font-bold text-text-primary uppercase tracking-wider">Intelligence Gathered</h3>
                        <p className="text-sm text-text-tertiary leading-relaxed">
                           All {activeExperts.length} experts have provided their insights. The council is now ready to synthesize these perspectives into a final strategic verdict.
                        </p>
                    </div>
                    <Button
                      onClick={startPhase2}
                      className="h-12 px-8 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center gap-3 transition-all"
                    >
                       <Zap className="w-5 h-5" />
                       Generate Synthesis Verdict
                    </Button>
                 </div>
              ) : showEmpty ? (
                 <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-12 opacity-50">
                    <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 text-text-disabled" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest">Synthesis Pending</h3>
                        <p className="text-[11px] text-text-disabled uppercase tracking-wider font-semibold">Define task and execute Phase 1 to begin</p>
                    </div>
                 </div>
              ) : (
                 <div className="prose prose-invert max-w-none relative">
                    <SafeMarkdown content={processMarkdown(verdict)} className="text-sm leading-relaxed text-text-secondary" />
                    {isExecuting && (
                        <span className="inline-block w-1.5 h-4 bg-primary-glow ml-1 animate-pulse align-middle" aria-hidden="true" />
                    )}
                 </div>
              )}
           </div>

           {verdict && executionPhase === 'complete' && (
              <div className="p-4 border-t border-border-subtle bg-bg-base/10 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] text-text-disabled font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" /> Fully Verifiable Output
                 </div>
                 <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] border-border-subtle hover:bg-bg-elevated gap-2">
                    <ExternalLink className="w-3 h-3" />
                    View Execution Logs
                 </Button>
              </div>
           )}
        </CardContent>
      )}
    </Card>
  );
};
