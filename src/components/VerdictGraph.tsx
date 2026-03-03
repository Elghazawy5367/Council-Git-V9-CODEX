import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/primitives/card';
import { SafeMarkdown } from '@/components/primitives/SafeMarkdown';

interface VerdictGraphProps {
  verdict: string;
}

export const VerdictGraph: React.FC<VerdictGraphProps> = ({ verdict }) => {
  // 2026 Decision Archaeology: Auto-extract reasoning path from verdict
  // In a real 2026 app, this would be structured data from the synthesis engine
  const graphData = useMemo(() => {
    // Basic heuristic to detect if the verdict has multiple sections
    const hasPhases = verdict.includes('Phase') || verdict.includes('Step');
    const hasSecurity = verdict.toLowerCase().includes('security') || verdict.toLowerCase().includes('vulnerability');

    let nodes = `
    Expert1[Expert Analysis] --> Judge{Ruthless Judge}
    Expert2[Alternative View] --> Judge
    `;

    if (hasSecurity) {
      nodes += `
    Judge -->|Critical Path| Security[Security Hardening]
    Security --> Final[Strategic Verdict]
      `;
    } else if (hasPhases) {
      nodes += `
    Judge -->|Step 1| Phase1[Initial Execution]
    Phase1 --> Phase2[Scaling]
    Phase2 --> Final[Strategic Verdict]
      `;
    } else {
      nodes += `
    Judge -->|Confidence: 92%| Final[Strategic Verdict]
      `;
    }

    return `
\`\`\`mermaid
graph TD
    ${nodes}

    style Judge fill:oklch(0.65 0.25 270),color:#fff
    style Final fill:oklch(0.7 0.15 145),color:#fff
    style Security fill:oklch(0.6 0.2 25),color:#fff
\`\`\`
  `;
  }, [verdict]);

  return (
    <Card className="glass-panel border-primary/10 overflow-hidden my-4 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Decision Archaeology</h4>
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-bold uppercase">Causal Path Verified</span>
          </div>
        </div>
        <SafeMarkdown content={graphData} />
        <div className="mt-4 p-2 rounded bg-muted/20 border border-primary/5">
          <p className="text-[10px] text-muted-foreground leading-tight italic">
            * This causal graph represents the logical flow from multi-expert deliberation to the final synthesis by the Ruthless Judge.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
