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
import { Maximize2, ClipboardCopy } from 'lucide-react';
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

  return (
    <div
      className="glass-panel p-4 rounded-lg flex flex-col min-h-[200px] transition-all duration-300 h-full"
      role="region"
      aria-label="Council verdict"
      aria-live="polite"
    >
      <div className="flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3 text-gradient">Verdict</h2>
        <div
          className={`flex-1 transition-opacity duration-500 ${
            isVerdictReady ? 'opacity-100' : 'opacity-50'
          }`}
        >
          {isVerdictReady ? (
            <ScrollArea className="h-full max-h-64">
              <p className="text-sm text-foreground whitespace-pre-wrap font-light leading-relaxed">
                {verdict}
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse align-text-bottom" aria-hidden="true" />
              </p>
            </ScrollArea>
          ) : (status === 'EXECUTING' || status === 'SYNTHESIZING') ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
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
