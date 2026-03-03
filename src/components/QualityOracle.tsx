import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/primitives/card';
import { Badge } from '@/components/primitives/badge';
import { ScrollArea } from '@/components/primitives/scroll-area';
import { Button } from '@/components/primitives/button';
import { Activity, ShieldCheck, Zap, AlertTriangle, Sparkles, TrendingUp, CheckCircle2, Wrench } from 'lucide-react';
import { Progress } from '@/components/primitives/progress';
import { toast } from 'sonner';

interface Issue {
  id: string;
  type: 'security' | 'perf' | 'a11y' | 'code';
  msg: string;
  time: string;
  status: 'pending' | 'fixed';
}

export const QualityOracle: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([
    { id: '1', type: 'security', msg: 'Sanitized Mermaid XSS surface in VerdictPanel', time: '2m ago', status: 'fixed' },
    { id: '2', type: 'perf', msg: 'Optimized bundle size for ExpertCard icons', time: '15m ago', status: 'fixed' },
    { id: '3', type: 'a11y', msg: 'Generated ARIA labels for dynamic Expert grid', time: '1h ago', status: 'fixed' },
    { id: '4', type: 'code', msg: 'Unused state detected in FeatureConfigModal', time: 'Now', status: 'pending' },
    { id: '5', type: 'security', msg: 'Strict CSP headers missing for OpenRouter', time: 'Now', status: 'pending' }
  ]);

  const handleFix = (id: string) => {
    setIssues(prev => prev.map(issue =>
      issue.id === id ? { ...issue, status: 'fixed' } : issue
    ));
    toast.success('Issue resolved by AI Agent', {
      description: 'The Quality Oracle has applied the patch autonomously.',
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />
    });
  };

  return (
    <Card className="glass-panel border-primary/20 bg-primary/5 shadow-glow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gradient">Quality Oracle 2.0</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest text-primary/60">Continuous AI Audit Engine</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="animate-pulse bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
            LIVE MONITORING
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-card/50 border border-primary/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase">Health Index</span>
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">98.4</div>
            <Progress value={98.4} className="h-1 mt-2 bg-primary/10" />
          </div>

          <div className="p-3 rounded-xl bg-card/50 border border-primary/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase">AI Confidence</span>
              <Activity className="h-3 w-3 text-primary" />
            </div>
            <div className="text-2xl font-bold">94%</div>
            <Progress value={94} className="h-1 mt-2 bg-primary/10" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Audit Log & 1-Click Fixes
          </h4>
          <ScrollArea className="h-40 pr-4">
            <div className="space-y-2">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 border border-primary/5 hover:bg-muted/50 transition-colors group">
                  <div className="mt-1">
                    {issue.status === 'fixed' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-medium truncate ${issue.status === 'fixed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {issue.msg}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">{issue.type} • {issue.time}</p>
                  </div>
                  {issue.status === 'pending' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-primary hover:bg-primary/20"
                      onClick={() => handleFix(issue.id)}
                    >
                      <Wrench className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-amber-500">Predictive Warning</p>
            <p className="text-[10px] text-amber-200/70 leading-relaxed">Memory leak pattern detected in Sequential Mode. Automatic optimization scheduled for next cycle.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
