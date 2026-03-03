/**
 * CouncilWorkflow Component
 * 
 * REQUIREMENTS:
 * 1. Orchestrate two-phase workflow
 * 2. Layout: Input Panel + Response Grid + Judge Section
 * 3. Responsive grid for LLM cards
 * 4. Handle loading states
 * 5. Show progress during execution
 */

import { useCouncilContext } from '@/contexts/CouncilContext';
import { InputPanel } from './InputPanel';
import { LLMResponseCard } from './LLMResponseCard';
import { JudgeSection } from './JudgeSection';
import { Card, CardContent } from '@/components/primitives/card';
import { Loader2, Sparkles } from 'lucide-react';

export function CouncilWorkflow(): JSX.Element {
  const { execution, llmSelection } = useCouncilContext();

  // Handler for LLM retry - would need implementation in context
  const handleRetryLLM = (llmId: string): void => {
        // TODO: Implement retry logic in CouncilContext
  };

  // Handler for feedback
  const handleProvideFeedback = (llmId: string, type: 'up' | 'down'): void => {
        // TODO: Implement feedback tracking
  };

  // Check if we're in loading state
  const isLoading = execution.isRunning && execution.phase === 'parallel';
  const isJudging = execution.isRunning && execution.phase === 'judge';

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Sparkles className="h-10 w-10 text-primary" />
          Council Workflow
        </h1>
        <p className="text-muted-foreground text-lg">
          Multi-LLM Analysis with Intelligent Synthesis
        </p>
      </div>

      {/* Phase 1: Input Panel */}
      <section>
        <InputPanel />
      </section>

      {/* Phase 1: Loading State */}
      {isLoading && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Running Council...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {llmSelection.selectedLLMs.length} LLMs are analyzing your input in parallel
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 1: Response Grid */}
      {execution.llmResponses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              LLM Responses ({execution.llmResponses.length})
            </h2>
            {execution.phase === 'parallel' && execution.isRunning && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
          </div>

          {/* Responsive Grid for LLM Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {execution.llmResponses.map((response) => (
              <LLMResponseCard
                key={response.llmId}
                response={response}
                onFeedback={(type) => handleProvideFeedback(response.llmId, type)}
                onRetry={() => handleRetryLLM(response.llmId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Phase 1: Empty State */}
      {!isLoading && execution.llmResponses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                No Responses Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter your question above and click "Run Council" to get started
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Judge Loading State */}
      {isJudging && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Running Judge Synthesis...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzing and synthesizing all responses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Judge Section */}
      <section>
        <JudgeSection />
      </section>
    </div>
  );
}
