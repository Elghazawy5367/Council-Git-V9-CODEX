import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import type { FeatureDefinition } from '../types/feature.types';
import { useFeaturesStore } from '../store/features-store';
import { executionEngine } from '../lib/execution-engine';
import { useState } from 'react';
import { FeatureConfigModal } from './FeatureConfigModal';
import {
  Settings,
  BarChart2,
  Play,
  Pause,
  Target,
  Terminal,
  MoreVertical,
  ChevronDown,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu";
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  feature: FeatureDefinition;
}

const STATUS_COLORS = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  running: 'bg-blue-500 animate-pulse',
  error: 'bg-red-500',
  paused: 'bg-yellow-500',
};

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  running: 'Running',
  error: 'Error',
  paused: 'Paused',
};

export function FeatureCard({ feature }: FeatureCardProps): JSX.Element {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const toggleFeature = useFeaturesStore((state) => state.toggleFeature);
  const updateFeature = useFeaturesStore((state) => state.updateFeature);

  const handleToggle = (): void => {
    toggleFeature(feature.id);
  };

  const handleRunNow = async (): Promise<void> => {
    if (isExecuting) return;

    setIsExecuting(true);
    updateFeature(feature.id, { status: 'running' });

    try {
      await executionEngine.executeFeature(feature.id);
    } catch (error) {
      console.error(`Failed to execute feature ${feature.id}:`, error);
      updateFeature(feature.id, { status: 'error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const [showRationale, setShowRationale] = useState(false);

  // 2026: Dynamic Rationale Generation (Mock for UI)
  const rationale = {
    strategic: `Expansion of high-intent buying signals in ${feature.id === 'reddit-sniper' ? 'SaaS' : 'Developer Tools'} niches detected. Potential ROI increased by 14%.`,
    technical: `API rate limits refreshed. Node compute availability: 89%. Memory overhead stable.`
  };

  return (
    <Card className="hover:shadow-lg transition-all border-2 border-primary/5 hover:border-primary/20 glass-panel">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{feature.icon}</span>
            <div>
              <CardTitle className="text-lg font-bold">{feature.name}</CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground">
                {feature.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn("text-[9px] uppercase px-2", STATUS_COLORS[feature.status], "text-white border-none")}
            >
              {STATUS_LABELS[feature.status]}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel border-primary/20">
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Advanced Control</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRunNow} disabled={isExecuting} className="gap-2">
                  <Play className="h-3 w-3" /> Force Execution
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggle} className="gap-2">
                  {feature.enabled ? <><Pause className="h-3 w-3" /> Disable</> : <><Play className="h-3 w-3" /> Enable</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowConfig(true)} className="gap-2">
                  <Settings className="h-3 w-3" /> Configure
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-destructive">
                  <AlertCircle className="h-3 w-3" /> Reset Agent Memory
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proactive Suggestion Area */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Status: Predictive Recommendation</span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
              92% CONFIDENCE
            </Badge>
          </div>

          <h5 className="text-xs font-bold mb-2">Run Agent for Market Expansion</h5>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Strategic Objective</span>
                </div>
                <p className="text-[10px] text-emerald-100/70">{rationale.strategic}</p>
              </div>

              <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Terminal className="h-3 w-3 text-blue-400" />
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Technical Rationale</span>
                </div>
                <p className="text-[10px] text-blue-100/70">{rationale.technical}</p>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleRunNow}
              disabled={!feature.enabled || isExecuting}
              className="w-full gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
            >
              {isExecuting ? <><span className="animate-spin mr-1">🔄</span> Processing...</> : <><CheckCircle2 className="h-3 w-3" /> Authorize Execution</>}
            </Button>
          </div>
        </div>

        {/* Metrics Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-primary/5">
          <div className="flex gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
             <div className="flex flex-col">
              <span>Last Run</span>
              <span className="text-foreground">{formatDate(feature.metrics.lastRun)}</span>
            </div>
            <div className="flex flex-col">
              <span>Success</span>
              <span className="text-foreground">
                {feature.metrics.totalRuns > 0
                  ? `${Math.round(feature.metrics.successRate * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span>Reports</span>
              <span className="text-foreground">{feature.metrics.reportsGenerated}</span>
            </div>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <FeatureConfigModal
        feature={feature}
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </Card>
  );
}
