import React, { useState } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import { MetricCard } from './MetricCard';
import { DecisionTimeline } from './DecisionTimeline';
import { ModeDistribution } from './ModeDistribution';
import { CostAnalytics } from './CostAnalytics';
import { HistoricalView } from './HistoricalView';
import { ExpertPerformance } from './ExpertPerformance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import { Button } from '@/components/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import {
  Brain,
  Clock,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const DATE_RANGES = {
  '7d': { label: 'Last 7 days', days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  'all': { label: 'All time', days: null },
};

export const DashboardLayout: React.FC = () => {
  const { metrics, setDateRange, clearAllData, recentDecisions } = useDashboardStore();
  const [selectedRange, setSelectedRange] = useState<keyof typeof DATE_RANGES>('30d');

  // Check if we have any data to display
  const hasData = recentDecisions.length > 0 || metrics.totalDecisions > 0;

  const handleDateRangeChange = (value: string) => {
    setSelectedRange(value as keyof typeof DATE_RANGES);
    const range = DATE_RANGES[value as keyof typeof DATE_RANGES];
    
    if (range.days === null) {
      // All time
      setDateRange(new Date(0), new Date());
    } else {
      const end = new Date();
      const start = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000);
      setDateRange(start, end);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      try {
        await clearAllData();
        toast.success('Analytics data cleared successfully');
      } catch (error) {
        console.error('Failed to clear analytics data:', error);
        toast.error('Failed to clear analytics data');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Intelligence Metrics
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Predictive performance & economic trends • {hasData ? `${metrics.totalDecisions} tracked decisions` : 'No data yet'}
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[160px] glass-panel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              className="text-destructive hover:bg-destructive/10 glass-panel"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Decisions"
            value={metrics.totalDecisions}
            subtitle="All time"
            icon={Brain}
            colorClass="from-violet-500 to-purple-600"
          />
          <MetricCard
            title="Avg. Decision Time"
            value={`${Math.round(metrics.averageTime)}s`}
            subtitle="Per decision"
            icon={Clock}
            colorClass="from-blue-500 to-cyan-500"
          />
          <MetricCard
            title="Avg. Cost"
            value={`$${metrics.averageCost.toFixed(4)}`}
            subtitle="Per decision"
            icon={DollarSign}
            colorClass="from-green-500 to-emerald-600"
          />
          <MetricCard
            title="Success Rate"
            value={`${Math.round(metrics.successRate)}%`}
            subtitle="Completed successfully"
            icon={TrendingUp}
            colorClass="from-orange-500 to-red-500"
          />
        </div>
      ) : (
        <Card className="glass-panel border-2 border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <Brain className="h-20 w-20 text-violet-500/50" />
              <div className="absolute inset-0 animate-ping">
                <Brain className="h-20 w-20 text-violet-500/20" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              No Analytics Data Yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
              Execute your first Council analysis to start tracking metrics, costs, and performance insights. 
              Your analytics journey begins with a single question.
            </p>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold px-6 py-6 text-base"
            >
              <Brain className="mr-2 h-5 w-5" />
              Go to Council
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {hasData && (
        <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="modes">
            <Target className="h-4 w-4 mr-2" />
            Modes
          </TabsTrigger>
          <TabsTrigger value="history">
            <Brain className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Mode Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ModeDistribution data={metrics.modeDistribution} />
              </CardContent>
            </Card>
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Cost Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CostAnalytics />
              </CardContent>
            </Card>
          </div>
          <ExpertPerformance />
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Decision Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionTimeline />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modes">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Execution Mode Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ModeDistribution data={metrics.modeDistribution} detailed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <HistoricalView />
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};
