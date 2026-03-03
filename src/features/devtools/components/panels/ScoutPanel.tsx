import React from 'react';
import { useDevToolsStore } from '@/features/devtools/store/devtools-store';
import {
  Telescope,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Link } from 'react-router-dom';

export const ScoutPanel: React.FC = () => {
  const { runningTools, lastRuns } = useDevToolsStore();
  const isRunning = runningTools.has('scout');

  // Scout runs are managed in its own store, but we can display the last run status from devToolsRuns
  const lastScoutRun = lastRuns['scout'];

  return (
    <div className="flex flex-col h-full p-8">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-primary/10 border border-primary/20 text-primary mb-2">
            <Telescope className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold">Scout Intelligence</h3>
          <p className="text-muted-foreground">
            Scout proactively monitors GitHub trending, ProductHunt, and HackerNews
            to identify market gaps and high-leverage opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Last Scan
              </h4>
              <Badge variant="outline">
                {lastScoutRun ? new Date(lastScoutRun.startedAt).toLocaleDateString() : 'Never'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {lastScoutRun
                ? `Last full intelligence pass completed successfully with ${lastScoutRun.summary || '0'} signals detected.`
                : 'No recent scans found. Proactive monitoring is idle.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-council-success" />
              Quick Action
            </h4>
            <div className="space-y-2">
              <Link to="/features/scout" className="w-full">
                <Button className="w-full justify-between group" variant="secondary">
                  Open Full Scout UI
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-bold">Automated Daily Brief</h4>
            <p className="text-xs text-muted-foreground">Configure Scout to run every morning at 9:00 AM</p>
          </div>
          <Button size="sm">Configure</Button>
        </div>
      </div>
    </div>
  );
};
