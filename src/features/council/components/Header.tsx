import React from 'react';
import { useExecutionStore } from '@/features/council/store/execution-store';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { useMemoryStore } from '@/features/council/store/memory-store';
import { formatCount, formatCurrency } from '@/lib/format';
import { 
  Settings, 
  Lock, 
  Unlock, 
  DollarSign, 
  History, 
  LayoutGrid, 
  Shield,
  Zap,
  Brain,
  BarChart3,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { MemoryBadge } from './MemoryBadge';
import { ProjectFeaturesDropdown } from '@/components/primitives/dropdown-menu';
import { MobileMenu } from '@/components/MobileMenu';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const location = useLocation();
  const cost = useExecutionStore(state => state.cost);
  const vaultStatus = useSettingsStore(state => state.vaultStatus);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);
  const showHistory = useSettingsStore(state => state.showHistory);
  const setShowHistory = useSettingsStore(state => state.setShowHistory);
  const setShowMemory = useSettingsStore(state => state.setShowMemory);
  const memory = useMemoryStore(state => state.memory);

  const memoryCount = memory?.entries.length || 0;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: '/features', label: 'Automation', icon: Zap },
    { to: '/quality', label: 'Quality', icon: Shield },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dev-tools', label: 'Dev Tools', icon: Wrench },
  ];

  return (
    <header className="glass-panel border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary blur-md opacity-60" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gradient">The Council</h1>
                <p className="text-xs text-muted-foreground">
                  V18 • Multi-Perspective Engine
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/50" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      active 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu (visible on mobile only) */}
            <MobileMenu
              vaultStatus={vaultStatus}
              memoryCount={memoryCount}
              onOpenSettings={() => setShowSettings(true)}
              onOpenHistory={() => setShowHistory(!showHistory)}
              onOpenMemory={() => setShowMemory(true)}
              showHistory={showHistory}
            />

            {/* Features dropdown (hidden on mobile) */}
            <div className="hidden md:block">
              <ProjectFeaturesDropdown />
            </div>
            
            {/* Memory badge (hidden until desktop) */}
            <div className="hidden lg:block">
              <MemoryBadge count={memoryCount} onClick={() => setShowMemory(true)} />
            </div>

            {/* Cost tracker (hidden on mobile) */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30">
              <DollarSign className="h-4 w-4 text-council-success" />
              <span className="font-mono text-sm text-foreground">{formatCurrency(cost.total, 4)}</span>
            </div>

            <div className="flex items-center gap-1">
              {/* History button (hidden on mobile) */}
              <Button
                variant={showHistory ? 'default' : 'ghost'}
                size="icon"
                className="hidden md:flex h-10 w-10"
                onClick={() => setShowHistory(!showHistory)}
                aria-label="Toggle history"
              >
                <History className="h-5 w-5" />
              </Button>

              {/* Vault status (hidden on mobile) */}
              <div className="hidden md:block px-2">
                <Badge
                  variant={vaultStatus.isLocked ? 'destructive' : 'default'}
                  className={cn(
                    "flex items-center gap-1.5 transition-all duration-300",
                    vaultStatus.isLocked
                      ? "bg-destructive/20 text-destructive border-destructive/30"
                      : "bg-council-success/20 text-council-success border-council-success/30"
                  )}
                >
                  {vaultStatus.isLocked ? (
                    <>
                      <Lock className="h-3 w-3" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" />
                      Unlocked
                    </>
                  )}
                </Badge>
              </div>

              {/* Settings button (hidden on mobile) */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-10 w-10 hover:bg-primary/10"
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
