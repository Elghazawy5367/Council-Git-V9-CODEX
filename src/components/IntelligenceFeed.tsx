import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/primitives/card';
import { Badge } from '@/components/primitives/badge';
import { Button } from '@/components/primitives/button';
import { ScrollArea } from '@/components/primitives/scroll-area';
import {
  Lightbulb,
  ChevronRight,
  Trash2,
  Zap,
  Target,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useIntelligenceStore, IntelligenceSuggestion } from '@/stores/intelligence-store';
import { useFeaturesStore } from '@/features/automation/store/features-store';
import { executionEngine } from '@/features/automation/lib/execution-engine';
import { cn } from '@/lib/utils';

export const IntelligenceFeed: React.FC = () => {
  const { suggestions, updateSuggestionStatus, dismissSuggestion, clearSuggestions } = useIntelligenceStore();
  const activeSuggestions = suggestions.filter(s => s.status === 'pending' || s.status === 'executing');

  const handleExecute = async (suggestion: IntelligenceSuggestion) => {
    updateSuggestionStatus(suggestion.id, 'executing');
    try {
      await executionEngine.executeFeature(suggestion.featureId);
      updateSuggestionStatus(suggestion.id, 'completed');
    } catch (error) {
      console.error(`Failed to execute suggestion ${suggestion.id}:`, error);
      updateSuggestionStatus(suggestion.id, 'failed');
    }
  };

  const getPriorityColor = (priority: IntelligenceSuggestion['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'medium': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <Card className="glass-panel border-primary/20 bg-primary/5 shadow-glow overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Intelligence Feed</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest text-primary/60">Proactive Agentic Suggestions</CardDescription>
            </div>
          </div>
          {activeSuggestions.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSuggestions}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {activeSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <Clock className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Monitoring environment...</p>
              <p className="text-[10px] uppercase tracking-tighter">Waiting for significant signals</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {activeSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="group relative rounded-xl border border-primary/10 bg-card/30 p-4 transition-all hover:bg-card/50 hover:border-primary/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[9px] uppercase font-bold", getPriorityColor(suggestion.priority))}>
                        {suggestion.priority}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(suggestion.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{suggestion.description}</p>

                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="h-3 w-3 text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Strategic Objective</span>
                      </div>
                      <p className="text-[10px] text-emerald-100/70">{suggestion.rationale.strategic}</p>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Terminal className="h-3 w-3 text-blue-400" />
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Technical Rationale</span>
                      </div>
                      <p className="text-[10px] text-blue-100/70">{suggestion.rationale.technical}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                      onClick={() => handleExecute(suggestion)}
                      disabled={suggestion.status === 'executing'}
                    >
                      {suggestion.status === 'executing' ? (
                        <>
                          <Zap className="h-3 w-3 animate-pulse" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Authorize Execution
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => dismissSuggestion(suggestion.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
