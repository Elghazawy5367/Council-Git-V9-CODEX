import React from 'react';
import { useExecutionStore } from '@/features/council/store/execution-store';
import { ScrollArea } from '@/components/primitives/scroll-area';
import { Button } from '@/components/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/primitives/dialog';
import { Maximize2, ClipboardCopy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const VerdictPanel: React.FC = () => {
  const { verdict, status } = useExecutionStore();

  const handleCopy = () => {
    if (verdict) {
      navigator.clipboard.writeText(verdict);
      toast.success('Verdict copied to clipboard');
    }
  };

  const isVerdictReady = status === 'VERDICT_READY';
  const isProcessing = status === 'EXECUTING' || status === 'SYNTHESIZING';

  return (
    <div
      className="glass-panel p-4 rounded-lg flex flex-col min-h-[200px] transition-all duration-200 h-full"
      role="region"
      aria-label="Council verdict"
      aria-live="polite"
    >
      <div className="flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3 text-gradient">Verdict</h2>
        <div
          className={`flex-1 transition-opacity duration-300 ${
            isVerdictReady ? 'opacity-100' : 'opacity-50'
          }`}
        >
          {isVerdictReady ? (
            <ScrollArea className="h-full max-h-64">
              <p className="text-sm text-foreground whitespace-pre-wrap font-light leading-relaxed">
                {verdict}
              </p>
            </ScrollArea>
          ) : isProcessing ? (
            <div className="space-y-3 py-2">
              <div className="h-3 rounded bg-muted/40 animate-pulse w-full" />
              <div className="h-3 rounded bg-muted/40 animate-pulse w-4/5" />
              <div className="h-3 rounded bg-muted/40 animate-pulse w-3/5" />
              <p className="text-xs text-muted-foreground italic mt-4 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                {status === 'EXECUTING' && 'The Council is deliberating...'}
                {status === 'SYNTHESIZING' && 'The Synthesis expert is drafting the final verdict...'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground italic">
                Awaiting instructions...
              </p>
            </div>
          )}
        </div>
        {isVerdictReady && (
          <div className="flex items-center gap-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  View Full Verdict
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Full Council Verdict</DialogTitle>
                  <DialogDescription>
                    This is the complete, unabridged verdict from the Council.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-full">
                  <pre className="text-sm text-foreground whitespace-pre-wrap p-4">
                    {verdict}
                  </pre>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleCopy} aria-label="Copy verdict to clipboard">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
