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
import { EmptyState } from '@/components/EmptyState';
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
  LayoutDashboard,
  ShieldCheck,
  History,
  Activity,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DATE_RANGES = {
  '7d': { label: '7 Days', days: 7 },
  '30d': { label: '30 Days', days: 30 },
  '90d': { label: '90 Days', days: 90 },
  'all': { label: 'All Time', days: null },
};

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { metrics, setDateRange, clearAllData, recentDecisions } = useDashboardStore();
  const [selectedRange, setSelectedRange] = useState<keyof typeof DATE_RANGES>('30d');

  const hasData = recentDecisions.length > 0 || metrics.totalDecisions > 0;

  const handleDateRangeChange = (value: string) => {
    setSelectedRange(value as keyof typeof DATE_RANGES);
    const range = DATE_RANGES[value as keyof typeof DATE_RANGES];
    
    if (range.days === null) {
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
           <div className="flex items-center gap-2 text-primary-glow font-bold uppercase tracking-[0.2em] text-[10px]">
              <Activity className="w-3.5 h-3.5" /> Platform Intelligence
           </div>
           <h1 className="text-3xl font-bold text-text-primary tracking-tight">Analytics Dashboard</h1>
           <p className="text-sm text-text-tertiary font-medium">
             Performance and cost analysis of your autonomous council network
           </p>
        </div>

        {hasData && (
          <div className="flex items-center gap-3">
            <Tabs value={selectedRange} onValueChange={handleDateRangeChange} className="bg-bg-base border border-border-subtle p-1 rounded-xl">
               <TabsList className="bg-transparent border-none">
                 {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                   <TabsTrigger
                     key={key}
                     value={key}
                     className="h-8 text-[10px] px-3 font-bold uppercase tracking-wider data-[state=active]:bg-bg-raised data-[state=active]:text-primary-glow"
                   >
                     {label}
                   </TabsTrigger>
                 ))}
               </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              className="h-10 px-4 text-text-tertiary border-border-subtle hover:bg-error/10 hover:text-error hover:border-error/20 rounded-xl font-bold text-[10px] uppercase tracking-wider"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Wipe
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8 text-primary" />}
          title="No Intelligence Gathered"
          description="Execute your first autonomous council session to generate performance metrics, cost analysis, and decision history."
          action={
            <Button 
              onClick={() => navigate('/')}
              className="h-11 px-6 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Start First Session
            </Button>
          }
          className="bg-bg-raised border-border-subtle shadow-inner py-24"
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Sessions"
              value={metrics.totalDecisions}
              subtitle="All time"
              icon={ShieldCheck}
              colorClass="from-primary to-primary-glow"
            />
            <MetricCard
              title="Avg Duration"
              value={`${Math.round(metrics.averageTime)}s`}
              subtitle="Real-time latency"
              icon={Clock}
              colorClass="from-accent-cyan to-blue-500"
            />
            <MetricCard
              title="Total Cost"
              value={`$${metrics.totalCost.toFixed(3)}`}
              subtitle="OpenRouter usage"
              icon={DollarSign}
              colorClass="from-accent-emerald to-emerald-600"
            />
            <MetricCard
              title="Success Rate"
              value={`${Math.round(metrics.successRate)}%`}
              subtitle="Reliability"
              icon={TrendingUp}
              colorClass="from-accent-amber to-orange-500"
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border-subtle pb-1">
              <TabsList className="bg-transparent border-none gap-8 p-0">
                <TabsTrigger value="overview" className="bg-transparent h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary-glow font-bold text-xs uppercase tracking-widest shadow-none">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="experts" className="bg-transparent h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary-glow font-bold text-xs uppercase tracking-widest shadow-none">
                  Expert Network
                </TabsTrigger>
                <TabsTrigger value="history" className="bg-transparent h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary-glow font-bold text-xs uppercase tracking-widest shadow-none">
                  Decision Vault
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 animate-fade-in outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-panel border-border-subtle bg-bg-raised shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Execution Modes</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ModeDistribution data={metrics.modeDistribution} />
                  </CardContent>
                </Card>
                <Card className="glass-panel border-border-subtle bg-bg-raised shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Cost Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <CostAnalytics />
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-panel border-border-subtle bg-bg-raised shadow-md">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <DecisionTimeline />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experts" className="animate-fade-in outline-none">
              <ExpertPerformance />
            </TabsContent>

            <TabsContent value="history" className="animate-fade-in outline-none">
              <HistoricalView />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
