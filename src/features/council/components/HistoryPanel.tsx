import React from 'react';
import { CouncilSession } from '@/features/council/lib/types';
import { formatRelativeTime, formatSessionPreview } from '@/features/council/lib/session-history';
import { useSessionHistory } from '@/features/council/hooks/useSessionHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { ScrollArea } from '@/components/primitives/scroll-area';
import { Badge } from '@/components/primitives/badge';
import { useVirtualizer } from '@tanstack/react-virtual';

import { 
  History, 
  Trash2, 
  RotateCcw, 
  Clock, 
  Users, 
  DollarSign,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/primitives/alert-dialog';
import { toast } from 'sonner';

// Placeholder for Sheet components
interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Sheet = ({ children, open, onOpenChange, ...props }: SheetProps) => (
  <div {...props}>{children}</div>
);

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: string;
}

const SheetContent = ({ children, side, ...props }: SheetContentProps) => (
  <div {...props}>{children}</div>
);

const SheetHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;
const SheetTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>;

interface HistoryPanelProps {
  onLoadSession?: (session: CouncilSession) => void;
  onRefresh?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Standalone History Card Component (for inline display)
export const HistoryCard: React.FC<HistoryPanelProps> = ({ onLoadSession, onRefresh }) => {
  const { sessions, handleDelete, handleClearAll } = useSessionHistory(true);

  const handleLoad = (session: CouncilSession) => {
    onLoadSession?.(session);
    toast.success('Session loaded');
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'consensus': return 'bg-primary/20 text-primary';
      case 'adversarial': return 'bg-destructive/20 text-destructive';
      case 'sequential': return 'bg-secondary/20 text-secondary';
      case 'parallel': return 'bg-accent/20 text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <History className="h-4 w-4 text-primary" />
            Session History
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setSessions(getSessions() || []);
                onRefresh?.();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            {sessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-panel-elevated">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Clear All History?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {sessions.length} saved sessions. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={handleClearAll}
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <History className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No sessions yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Complete an analysis to save it here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border/50"
                  onClick={() => handleLoad(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatSessionPreview(session)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getModeColor(session.mode)}`}>
                          {session.mode}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {session.activeExpertCount}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          {session.cost.total.toFixed(4)}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(session.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDelete(session.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

// Sidebar History Panel Component
export const HistorySidebar: React.FC<HistoryPanelProps> = ({ onLoadSession, onRefresh, isOpen, onClose }) => {
  const { sessions, loadSessions, handleDelete, handleClearAll } = useSessionHistory(false);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  React.useEffect(() => {
    // Only load sessions when panel opens, not on every render
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  const handleLoad = (session: CouncilSession) => {
    onLoadSession?.(session);
    onClose?.();
    toast.success('Session loaded');
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'consensus': return 'bg-primary/20 text-primary';
      case 'adversarial': return 'bg-destructive/20 text-destructive';
      case 'sequential': return 'bg-secondary/20 text-secondary';
      case 'parallel': return 'bg-accent/20 text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose?.()}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] glass-panel-elevated border-l border-border/50 p-0">
        <SheetHeader className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-5 w-5 text-primary" />
              Session History
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSessions(getSessions() || []);
                  onRefresh?.();
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {sessions.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-panel-elevated">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Clear All History?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {sessions.length} saved sessions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleClearAll}
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Local history saved with IndexedDB • Each session is independent
          </p>
        </SheetHeader>

        <div ref={parentRef} className="h-[calc(100vh-100px)] overflow-auto">
          <div className="p-4">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <History className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No sessions yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Complete an analysis to save it here
                </p>
              </div>
            ) : (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const session = sessions[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      className="absolute top-0 left-0 w-full"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                        paddingBottom: '12px'
                      }}
                    >
                      <div
                        className="group p-4 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-primary/30"
                        onClick={() => handleLoad(session)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {formatSessionPreview(session)}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getModeColor(session.mode)}`}>
                                {session.mode}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.activeExpertCount} experts
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${session.cost.total.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/70">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(session.timestamp)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleDelete(session.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistorySidebar;
