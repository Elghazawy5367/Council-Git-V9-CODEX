import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Brain,
  Zap,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Circle,
  Activity,
  History,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/features/settings/store/settings-store';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const vaultStatus = useSettingsStore(state => state.vaultStatus);
  const setShowSettings = useSettingsStore(state => state.setShowSettings);

  const navItems = [
    { to: '/', label: 'Council', icon: Brain },
    { to: '/features', label: 'Automation', icon: Zap },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/quality', label: 'Quality', icon: Shield },
    { to: '/features/scout', label: 'Scout', icon: Activity, isSmall: true },
    { to: '/dev-tools', label: 'Dev Tools', icon: Wrench },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col bg-bg-void border-r border-border-subtle transition-all duration-300 ease-smooth sticky top-0 h-screen z-40",
        isCollapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow shadow-primary/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in">
                <span className="font-bold text-sm text-text-primary whitespace-nowrap tracking-tight">
                The Council
                </span>
                <span className="text-[9px] font-bold text-primary-glow uppercase tracking-[0.2em] leading-none">
                Git-V9.4
                </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 group relative",
              isActive
                ? "bg-primary/10 text-primary-glow"
                : "text-text-tertiary hover:text-text-primary hover:bg-bg-raised"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary rounded-r-full shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
                <item.icon className={cn("flex-shrink-0 h-5 w-5", isActive ? "text-primary-glow" : "text-text-disabled group-hover:text-text-secondary")} />
                {!isCollapsed && (
                  <span className="truncate animate-fade-in">{item.label}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-bg-overlay text-text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg border border-border-subtle">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-text-tertiary hover:text-text-primary hover:bg-bg-raised transition-all duration-200 group relative"
        >
          <Settings className="flex-shrink-0 h-5 w-5 text-text-disabled group-hover:text-text-secondary" />
          {!isCollapsed && <span>Settings</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-bg-overlay text-text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg border border-border-subtle">
              Settings
            </div>
          )}
        </button>

        <div className="px-3 py-2 flex items-center gap-3 bg-bg-base/50 rounded-xl border border-border-subtle/50">
          <div className={cn(
            "w-2 h-2 rounded-full",
            vaultStatus.isLocked ? "bg-accent-rose shadow-[0_0_8px_hsl(var(--accent-rose))]" : "bg-accent-emerald shadow-[0_0_8px_hsl(var(--accent-emerald))]"
          )} />
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              {vaultStatus.isLocked ? "Vault Locked" : "Shield Active"}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-2 text-text-disabled hover:text-text-primary transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
