import React, { useState } from 'react';
import { useDevToolsStore } from '@/features/devtools/store/devtools-store';
import {
  Users,
  Play,
  Target,
  Zap,
  ShieldCheck,
  Radar,
  Loader2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Input } from '@/components/primitives/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { analyzeTwinDNA, type TwinProfile } from '../../lib/twin-analyzer';
import { getSessionKeys } from '@/features/council/lib/vault';

export const TwinPanel: React.FC = () => {
  const { startRun, completeRun, failRun, runningTools, runs } = useDevToolsStore();
  const [targetRepo, setTargetRepo] = useState('');

  const isRunning = runningTools.has('twin');
  const lastTwinRun = runs.find(r => r.tool === 'twin' && r.status === 'success');
  const profile = lastTwinRun?.result as TwinProfile | null;

  const handleRunAnalysis = async () => {
    if (!targetRepo) {
      toast.error('Please enter a target repository URL');
      return;
    }

    const keys = getSessionKeys();
    if (!keys?.openRouterKey) {
      toast.error('Vault must be unlocked for LLM analysis');
      return;
    }

    const runId = startRun('twin');
    try {
      toast.info(`Fetching sample files for analysis...`);
      const mockSample = `// src/features/council/lib/vault.ts
import { AES, enc } from 'crypto-js';
export function encrypt(data: string, key: string) {
  return AES.encrypt(data, key).toString();
}`;

      toast.info(`Analyzing DNA relative to ${targetRepo} via LLM...`);
      const twinProfile = await analyzeTwinDNA(
        mockSample,
        targetRepo,
        keys.openRouterKey,
        keys.githubApiKey
      );

      await completeRun(runId, twinProfile);
    } catch (error) {
      failRun(runId, String(error));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Twin Mimicry</h3>
            <p className="text-sm text-muted-foreground">Compare your coding patterns against elite repos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Target GitHub Repo (e.g. microsoft/autogen)"
            className="w-48 sm:w-80"
            value={targetRepo}
            onChange={(e) => setTargetRepo(e.target.value)}
          />
          <Button
            onClick={handleRunAnalysis}
            disabled={isRunning || !targetRepo}
            className="gap-2"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Analysis
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {!profile ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-30 border-2 border-dashed border-border rounded-3xl">
            <Radar className="h-16 w-16 mb-4" />
            <p className="text-xl font-bold">No DNA Profile Generated</p>
            <p className="text-sm">Run analysis against a target repository</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-gradient uppercase tracking-tighter">Your Twin Profile</h4>
              <Badge className="text-lg px-4 py-1 bg-primary text-primary-foreground font-bold">
                {profile.alignmentScore}% ALIGNMENT
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* DNA Dimensions */}
              <div className="space-y-6">
                <h5 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">DNA Dimensions</h5>
                <div className="space-y-4">
                  {Object.entries(profile.dimensions).map(([dim, score]: [string, any]) => (
                    <div key={dim} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase">
                        <span>{dim.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-primary">{score}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adoption Plan */}
              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <h5 className="font-bold">Immediate Adoption Plan</h5>
                </div>
                <div className="space-y-3">
                  {[
                    { priority: 1, change: 'Implement exhaustive null guarding', effort: 'low' },
                    { priority: 2, change: 'Adopt feature-sliced architecture', effort: 'med' },
                    { priority: 3, change: 'Add Zod response validation', effort: 'med' },
                  ].map((task) => (
                    <div key={task.priority} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {task.priority}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{task.change}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 uppercase">{task.effort} effort</Badge>
                          <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                            <Plus className="h-2.5 w-2.5" />
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
