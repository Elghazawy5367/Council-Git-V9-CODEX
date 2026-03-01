import React from 'react';
import { useLocation } from 'react-router-dom';
import { useExecutionStore } from '@/features/council/store/execution-store';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { useMemoryStore } from '@/features/council/store/memory-store';
import { formatCurrency } from '@/lib/format';
import { MemoryBadge } from '@/features/council/components/MemoryBadge';
import { MobileMenu } from '@/components/MobileMenu';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { History, DollarSign } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Council',
  '/council': 'Council Workflow',
  '/features': 'Automation',
  '/quality': 'Quality',
  '/analytics': 'Analytics',
  '/features/scout': 'Scout Config',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const cost = useExecutionStore(state => state.cost);
  const vaultStatus = useSettingsStore(state => state.vaultStatus);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);
  const showHistory = useSettingsStore(state => state.showHistory);
  const setShowHistory = useSettingsStore(state => state.setShowHistory);
  const setShowMemory = useSettingsStore(state => state.setShowMemory);
  const memory = useMemoryStore(state => state.memory);

  const memoryCount = memory?.entries.length || 0;
  const pageLabel = ROUTE_LABELS[location.pathname] || 'Page';

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/30 bg-[hsl(var(--bg-base)/0.6)] backdrop-blur-sm sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        {/* Mobile menu (visible on mobile only) */}
        <div className="lg:hidden">
          <MobileMenu
            vaultStatus={vaultStatus}
            memoryCount={memoryCount}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHistory={() => setShowHistory(!showHistory)}
            onOpenMemory={() => setShowMemory(true)}
            showHistory={showHistory}
          />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{pageLabel}</h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Cost badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 border border-border/30">
          <DollarSign className="h-3.5 w-3.5 text-success" />
          <span className="font-mono text-xs text-foreground">{formatCurrency(cost.total, 4)}</span>
        </div>

        {/* Memory badge */}
        <div className="hidden lg:block">
          <MemoryBadge count={memoryCount} onClick={() => setShowMemory(true)} />
        </div>

        {/* History toggle */}
        <Button
          variant={showHistory ? 'default' : 'ghost'}
          size="icon"
          className="hidden md:flex h-8 w-8"
          onClick={() => setShowHistory(!showHistory)}
          aria-label="Toggle history"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
