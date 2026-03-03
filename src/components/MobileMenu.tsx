import React, { useState } from 'react';
import { Menu, Brain, Settings, History, Lock, Unlock, BookOpen, Wrench } from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/primitives/sheet';
import { Badge } from '@/components/primitives/badge';
import { Separator } from '@/components/primitives/separator';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MobileMenuProps {
  vaultStatus: { isLocked: boolean };
  memoryCount: number;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenMemory: () => void;
  showHistory: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  vaultStatus,
  memoryCount,
  onOpenSettings,
  onOpenHistory,
  onOpenMemory,
  showHistory,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: History,
      label: 'History',
      onClick: () => {
        onOpenHistory();
        setOpen(false);
      },
      active: showHistory,
    },
    {
      icon: BookOpen,
      label: 'Memory',
      onClick: () => {
        onOpenMemory();
        setOpen(false);
      },
      badge: memoryCount,
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => {
        onOpenSettings();
        setOpen(false);
      },
    },
    {
      icon: Wrench,
      label: 'Dev Tools',
      onClick: () => {
        navigate('/dev-tools');
        setOpen(false);
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            The Council
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Vault Status */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vault Status</span>
              <Badge
                variant={vaultStatus.isLocked ? 'destructive' : 'default'}
                className="flex items-center gap-1"
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
          </div>

          <Separator />

          {/* Menu Items */}
          <nav className="space-y-1" role="navigation" aria-label="Mobile navigation">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  item.active && 'bg-secondary/20'
                )}
                onClick={item.onClick}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          <Separator />

          {/* Quick Stats */}
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="text-xs text-muted-foreground">Quick Stats</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-lg font-bold text-foreground">{memoryCount}</div>
                <div className="text-xs text-muted-foreground">Memories</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-lg font-bold text-council-success">V18</div>
                <div className="text-xs text-muted-foreground">Version</div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
