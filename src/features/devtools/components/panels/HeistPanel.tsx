import React, { useState, useEffect } from 'react';
import { useDevToolsStore } from '@/features/devtools/store/devtools-store';
import { db, type HeistPrompt } from '@/lib/db';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  VenetianMask,
  RefreshCw,
  Search,
  Copy,
  Zap,
  FileText,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Input } from '@/components/primitives/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useExpertStore } from '@/features/council/store/expert-store';
import { fetchFabricPrompts, categorizePrompt } from '../../lib/heist-browser';
import { getSessionKeys } from '@/features/council/lib/vault';

export const HeistPanel: React.FC = () => {
  const { startRun, completeRun, failRun, runningTools } = useDevToolsStore();
  const [prompts, setPrompts] = useState<HeistPrompt[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<HeistPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const parentRef = React.useRef<HTMLDivElement>(null);
  const { experts, updateExpert } = useExpertStore();

  const isRunning = runningTools.has('heist');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const data = await db.heistPrompts.toArray();
    setPrompts(data);
  };

  const filteredPrompts = prompts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filteredPrompts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const handleRefresh = async () => {
    const keys = getSessionKeys();
    if (!keys?.openRouterKey) {
      toast.error('Vault must be unlocked for LLM categorization');
      return;
    }

    const runId = startRun('heist');
    setLoading(true);
    try {
      toast.info('Downloading patterns from Fabric...');
      const rawPrompts = await fetchFabricPrompts(keys.githubApiKey);

      toast.info(`Categorizing ${rawPrompts.length} prompts via LLM...`);
      const categorized: HeistPrompt[] = [];

      for (const p of rawPrompts) {
        const full = await categorizePrompt(p, keys.openRouterKey);
        categorized.push(full);
        await db.heistPrompts.put(full);
      }

      await completeRun(runId, `${categorized.length} prompts refreshed and categorized`);
      setLoading(false);
      loadPrompts();
    } catch (error) {
      console.error(error);
      failRun(runId, String(error));
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Prompt copied to clipboard');
  };

  const handleInject = (expertId: string) => {
    if (!selectedPrompt) return;
    // Inject into expert's basePersona
    updateExpert(Number(expertId), { basePersona: selectedPrompt.content });
    toast.success(`Prompt '${selectedPrompt.name}' injected into expert`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <VenetianMask className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">The HEIST — Prompt Library</h3>
            <p className="text-sm text-muted-foreground">World-class prompts from elite AI repositories</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRunning || loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh from Fabric
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-full lg:w-80 border-r border-border/50 flex flex-col min-h-0">
          <div className="p-4 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div ref={parentRef} className="flex-1 overflow-auto">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const prompt = filteredPrompts[virtualRow.index];
                const isSelected = selectedPrompt?.id === prompt.id;
                return (
                  <button
                    key={virtualRow.key}
                    onClick={() => setSelectedPrompt(prompt)}
                    className={cn(
                      "absolute top-0 left-0 w-full p-3 flex flex-col text-left transition-colors border-b border-border/30",
                      isSelected ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                    )}
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <span className="text-sm font-semibold truncate">{prompt.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] uppercase h-4">
                        {prompt.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{prompt.wordCount} words</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 flex flex-col min-h-0 bg-muted/10">
          {selectedPrompt ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold">{selectedPrompt.name}</h4>
                  <Badge variant="secondary">{selectedPrompt.qualityScore}% Quality</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(selectedPrompt.content)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <div className="flex gap-1">
                    <Button size="sm" className="gap-2" onClick={() => handleInject(String(experts[0]?.id || 1))}>
                      <Zap className="h-4 w-4" />
                      Inject
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                    <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {selectedPrompt.content}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-bold">Use Cases</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedPrompt.useCases.map((useCase, i) => (
                        <Badge key={i} variant="outline" className="bg-background">
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <FileText className="h-12 w-12 mb-4" />
              <p>Select a prompt to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
