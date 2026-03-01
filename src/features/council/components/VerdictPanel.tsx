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
import { Maximize2, ClipboardCopy, History } from 'lucide-react';
import { toast } from 'sonner';
import { VerdictGraph } from '@/components/VerdictGraph';

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
    >
      <div className="flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3 text-gradient">Verdict</h2>
        <div
          className={`flex-1 transition-opacity duration-500 ${
            isVerdictReady ? 'opacity-100' : 'opacity-50'
          }`}
        >
          {isVerdictReady ? (
            <ScrollArea className="h-full max-h-[400px]">
              <VerdictGraph verdict={verdict || ''} />
              <p className="text-sm text-foreground whitespace-pre-wrap font-light leading-relaxed border-t border-primary/10 pt-4 mt-4">
                {verdict}
              </p>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground italic">
                {status === 'IDLE' && 'Awaiting instructions...'}
                {status === 'EXECUTING' && 'The Council is deliberating...'}
                {status === 'SYNTHESIZING' && 'The Synthesis expert is drafting the final verdict...'}
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
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
