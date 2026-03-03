import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Terminal,
  ShieldCheck,
  Activity,
  History,
  Sparkles,
  Command as CommandIcon,
  Mic,
  Plus,
  Zap,
  Target,
  Brain,
  Settings as SettingsIcon,
  Layout
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/primitives/dialog';
import { Badge } from '@/components/primitives/badge';
import { useCouncilStore } from '@/stores/council.store';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  const { setTask, setMode, setJudgeMode, executePhase1 } = useCouncilStore();
  const setShowSettings = useSettingsStore(state => state.setShowSettings);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
    setInputValue('');
  }, []);

  // 2026: AI Intent Parser (Simulated for UI)
  const aiSuggestions = useMemo(() => {
    if (!inputValue) return [];

    const input = inputValue.toLowerCase();
    const suggestions = [];

    if (input.includes('audit') || input.includes('security') || input.includes('quality')) {
      suggestions.push({
        id: 'ai-audit',
        title: 'Run continuous security audit',
        icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
        action: () => {
          navigate('/quality');
          toast.success('AI Agent: Initiating codebase audit...');
        },
        rationale: 'Strategic compliance check'
      });
    }

    if (input.includes('market') || input.includes('gap') || input.includes('research')) {
      suggestions.push({
        id: 'ai-market',
        title: 'Analyze market gaps for AI productivity',
        icon: <Target className="h-4 w-4 text-primary" />,
        action: () => {
          setTask('Analyze current market gaps for AI productivity tools in the 2026 landscape.');
          setMode('parallel');
          setJudgeMode('ruthless-judge');
          navigate('/');
          executePhase1();
          toast.success('AI Agent: Researching market gaps...');
        },
        rationale: 'Revenue opportunity detection'
      });
    }

    if (input.includes('adversarial') || input.includes('mode') || input.includes('switch')) {
      suggestions.push({
        id: 'ai-mode',
        title: 'Switch to Adversarial Synthesis Mode',
        icon: <Zap className="h-4 w-4 text-amber-400" />,
        action: () => {
          setMode('adversarial');
          setJudgeMode('debate-judge');
          toast.success('AI Agent: Switched to Adversarial Mode');
        },
        rationale: 'Conflict-driven reasoning'
      });
    }

    return suggestions;
  }, [inputValue, navigate, setTask, setMode, setJudgeMode, executePhase1]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground glass-panel border-primary/20 hover:border-primary/40 bg-primary/5 rounded-full shadow-glow-sm"
      >
        <CommandIcon className="h-3 w-3" />
        <span className="hidden sm:inline">Search actions...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary/20 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-2xl top-[20%] translate-y-0">
          <Command className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center border-b border-primary/10 px-4 py-4" cmdk-input-wrapper="">
              <Search className="mr-3 h-5 w-5 shrink-0 opacity-50 text-primary" />
              <Command.Input
                value={inputValue}
                onValueChange={setInputValue}
                placeholder="Describe your intent (e.g., 'Switch to adversarial mode')..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Badge variant="outline" className="ml-2 bg-primary/10 border-primary/20 text-primary flex items-center gap-1.5 px-3 py-1 animate-pulse">
                <Sparkles className="h-3 w-3" />
                <span className="text-[10px] font-bold tracking-widest">2026 CORE</span>
              </Badge>
              <button className="ml-3 p-2 rounded-full hover:bg-primary/10 transition-colors">
                <Mic className="h-5 w-5 opacity-50 hover:opacity-100 cursor-pointer" />
              </button>
            </div>

            <Command.List className="max-h-[400px] overflow-y-auto p-3 scroll-py-2">
              <Command.Empty className="py-12 text-center text-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10 animate-bounce">
                    <Brain className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-lg">AI Intent Analysis</p>
                    <p className="text-muted-foreground text-xs">Processing natural language for system execution...</p>
                  </div>
                </div>
              </Command.Empty>

              {aiSuggestions.length > 0 && (
                <Command.Group heading="AI Intent Match" className="px-2 py-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
                  {aiSuggestions.map((suggestion) => (
                    <Command.Item
                      key={suggestion.id}
                      onSelect={() => runCommand(suggestion.action)}
                      className="flex items-center justify-between gap-3 px-3 py-4 rounded-xl text-sm aria-selected:bg-primary/20 aria-selected:text-primary cursor-pointer transition-all border border-transparent aria-selected:border-primary/30 mb-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {suggestion.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{suggestion.title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{suggestion.rationale}</span>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 opacity-30" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Quick Navigation" className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 border-t border-primary/5 pt-4">
                <Command.Item
                   onSelect={() => runCommand(() => navigate('/'))}
                   className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm aria-selected:bg-muted/50 cursor-pointer mb-1"
                >
                  <Layout className="h-4 w-4 text-violet-400" />
                  <span>Intelligence Command Center</span>
                </Command.Item>
                <Command.Item
                   onSelect={() => runCommand(() => navigate('/automation'))}
                   className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm aria-selected:bg-muted/50 cursor-pointer mb-1"
                >
                  <Activity className="h-4 w-4 text-pink-400" />
                  <span>Automation Control Center</span>
                </Command.Item>
                <Command.Item
                   onSelect={() => runCommand(() => navigate('/quality'))}
                   className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm aria-selected:bg-muted/50 cursor-pointer mb-1"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Quality Oracle Dashboard</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => setShowSettings(true))}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm aria-selected:bg-muted/50 cursor-pointer mb-1"
                >
                  <SettingsIcon className="h-4 w-4 text-slate-400" />
                  <span>System Configuration</span>
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between border-t border-primary/10 bg-primary/5 px-4 py-3">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5">
                   <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[9px] font-mono">↑↓</kbd>
                   <span className="text-[10px] text-muted-foreground">Navigate</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[9px] font-mono">↵</kbd>
                   <span className="text-[10px] text-muted-foreground">Select</span>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-emerald-500 uppercase">AI Processor Online</span>
               </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
};
