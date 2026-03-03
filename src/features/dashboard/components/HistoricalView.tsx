import React, { useState } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import type { DecisionRecord } from '../store/dashboard-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Input } from '@/components/primitives/input';
import { Badge } from '@/components/primitives/badge';
import { ScrollArea } from '@/components/primitives/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/primitives/dialog';
import { Download, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';

const MODE_COLORS = {
  parallel: 'bg-blue-500/20 text-blue-600',
  consensus: 'bg-purple-500/20 text-purple-600',
  adversarial: 'bg-red-500/20 text-red-600',
  sequential: 'bg-green-500/20 text-green-600',
};

export const HistoricalView: React.FC = () => {
  const { recentDecisions, exportData } = useDashboardStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<DecisionRecord | null>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const filteredDecisions = recentDecisions.filter((decision) =>
    decision.task.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filteredDecisions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-decisions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Decisions exported successfully');
  };

  const handleExportCSV = () => {
    const csvHeader = 'Date,Mode,Task,Experts,Duration (s),Cost ($),Success\n';
    const csvRows = recentDecisions.map((d) => 
      `"${new Date(d.timestamp).toISOString()}","${d.mode}","${d.task.replace(/"/g, '""')}",${d.expertCount},${d.duration},${d.cost.toFixed(4)},${d.success}`
    ).join('\n');
    const csv = csvHeader + csvRows;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-decisions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Decision History</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search decisions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={parentRef} className="h-[500px] overflow-auto">
          {filteredDecisions.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No decisions found
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
                const decision = filteredDecisions[virtualRow.index];
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
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={MODE_COLORS[decision.mode as keyof typeof MODE_COLORS]}
                            >
                              {decision.mode}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(decision.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium text-sm truncate">
                            {decision.task}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{decision.expertCount} experts</span>
                            <span>•</span>
                            <span>{Math.round(decision.duration)}s</span>
                            <span>•</span>
                            <span>${decision.cost.toFixed(4)}</span>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedDecision(decision)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Decision Details</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[500px]">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-1">Task</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {decision.task}
                                  </p>
                                </div>
                                {decision.verdict && (
                                  <div>
                                    <h4 className="font-semibold mb-1">Verdict</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {decision.verdict}
                                    </p>
                                  </div>
                                )}
                                {decision.synthesisContent && (
                                  <div>
                                    <h4 className="font-semibold mb-1">Synthesis</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {decision.synthesisContent}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
