import React from 'react';
import { useExecutionStore } from '@/features/council/store/execution-store';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { formatCurrency } from '@/lib/format';
import {
  Settings,
  DollarSign,
  Brain,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Topbar: React.FC = () => {
  const location = useLocation();
  const cost = useExecutionStore(state => state.cost);
  const vaultStatus = useSettingsStore(state => state.vaultStatus);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);

  // Generate breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const to = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { to, label };
  });

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-bg-void border-b border-border-subtle sticky top-0 z-30 backdrop-blur-md bg-bg-void/80">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-text-primary transition-colors flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px]">
          <Brain className="h-4 w-4 text-primary" />
          The Council
        </Link>
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.to}>
            <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
            <Link
              to={breadcrumb.to}
              className={cn(
                "hover:text-text-primary transition-colors text-[10px] font-bold uppercase tracking-widest",
                index === breadcrumbs.length - 1 ? "text-text-primary" : "text-text-tertiary"
              )}
            >
              {breadcrumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Session Health */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-raised border border-border-subtle group">
           <div className={cn(
             "w-1.5 h-1.5 rounded-full animate-pulse",
             vaultStatus.isLocked ? "bg-accent-rose" : "bg-accent-emerald"
           )} />
           <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary group-hover:text-text-secondary transition-colors">
              Session Health
           </span>
        </div>

        {/* API Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-raised border border-border-subtle">
          {vaultStatus.isLocked ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-accent-rose" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-rose">Vault Locked</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-accent-emerald" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-emerald">Shield Active</span>
            </>
          )}
        </div>

        {/* Cost Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-raised border border-border-subtle"
          aria-live="polite"
          aria-atomic="true"
        >
          <DollarSign className="h-3.5 w-3.5 text-accent-emerald" />
          <span className="font-mono text-xs font-bold text-text-primary">
            {formatCurrency(cost.total, 4)}
          </span>
        </div>

        {/* Global Settings Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded-xl transition-all border border-transparent hover:border-border-subtle"
          onClick={() => setShowSettings(true)}
          aria-label="Global Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
