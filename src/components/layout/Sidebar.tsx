import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { useExecutionStore } from '@/features/council/store/execution-store';
import { formatCurrency } from '@/lib/format';
import {
  Brain,
  Zap,
  BarChart3,
  Shield,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/primitives/button';

const navItems = [
  { to: '/', label: 'Council', icon: Brain, end: true },
  { to: '/features', label: 'Automation', icon: Zap },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/quality', label: 'Quality', icon: Shield },
  { to: '/features/scout', label: 'Scout', icon: Search },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const vaultStatus = useSettingsStore(state => state.vaultStatus);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);
  const cost = useExecutionStore(state => state.cost);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col border-r transition-all duration-200 z-40',
        'bg-[hsl(var(--bg-void))] border-[hsl(var(--border-subtle))]',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-3 py-4 border-b border-[hsl(var(--border-subtle))]', collapsed && 'justify-center')}>
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-accent-cyan blur-md opacity-40" />
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent-cyan flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">The Council</h1>
            <p className="text-[10px] text-muted-foreground">V18 • AI Engine</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 relative group',
                isActive
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                collapsed && 'justify-center px-2'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
              )}
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer section */}
      <div className="border-t border-[hsl(var(--border-subtle))] px-2 py-3 space-y-2">
        {/* Cost display */}
        {!collapsed && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/20 text-xs">
            <span className="text-muted-foreground">Session cost</span>
            <span className="font-mono text-foreground">{formatCurrency(cost.total, 4)}</span>
          </div>
        )}

        {/* API status */}
        <div className={cn('flex items-center gap-2 px-3 py-1.5', collapsed && 'justify-center px-0')}>
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              vaultStatus.isLocked ? 'bg-destructive' : 'bg-success'
            )}
            title={vaultStatus.isLocked ? 'API key locked' : 'API key unlocked'}
          />
          {!collapsed && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {vaultStatus.isLocked ? (
                <>
                  <Lock className="h-3 w-3" /> Locked
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" /> Ready
                </>
              )}
            </span>
          )}
        </div>

        {/* Settings + Collapse */}
        <div className={cn('flex items-center gap-1', collapsed ? 'flex-col' : 'justify-between')}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
